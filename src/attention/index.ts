/**
 * Attention service (`ctx.attention`): the persistent business-decision inbox.
 * One durable `AttentionItem` records each gate check or independent task
 * decision. Decisions use optimistic concurrency �?every command carries an
 * `expectedEntityRevision` and returns a per-item outcome, so a stale,
 * withdrawn, resolved, or version-conflicted item is never silently
 * confirmed. A resolved/invalidated item writes its journal fact first,
 * then the projection, then resumes the phase run when every item of its
 * gate settled.
 * @module @deepseek-ai/dsh-attention
 */

import { Context, Service } from '@deepseek-ai/cordis'
import type { KvTable } from '@deepseek-ai/dsh-storage-domain'
import '../task/index.ts'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type { JournalPayload } from '../workbench/journal/types.ts'
import '../workbench/journal/index.ts'
import { AttentionError, AttentionItemId as ItemIdOf } from './runtime.ts'
import { attentionDomainSpec } from './spec.ts'
import type { ItemKeyEntry } from './spec.ts'
import type {
  AttentionFactKind,
  AttentionItem,
  AttentionItemId,
  ConfirmResult,
  ConfirmTarget,
  CreateItemInput,
  DecisionResult,
  InvalidateResult,
} from './types.ts'

export type * from './types.ts'
export { AttentionItemId } from './runtime.ts'
export { attentionDomainSpec, attentionItemSchema, itemKeySchema } from './spec.ts'
export type { ItemKeyEntry } from './spec.ts'
export { AttentionError } from './runtime.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    attention: AttentionService
  }
}

/** The actor recorded on attention facts; decisions carry their own actor. */
const FACT_ACTOR = 'attention'

/**
 * Attention service: the M4 persistent-decision domain, with idempotent
 * item creation, optimistic decision and batch-confirm commands, and
 * upstream invalidation.
 */
export class AttentionService extends TypertRemoteService {
  /** The service opens its domain, appends facts, and reads/writes phase runs. */
  static inject = ['storageDomain', 'workbenchJournal', 'tasks']

  private items?: KvTable<string, AttentionItem>
  private itemKeys?: KvTable<string, ItemKeyEntry>
  /** Serializes read-validate-write mutations so concurrent writers never interleave. */
  private mutationTail: Promise<void> = Promise.resolve()

  /**
   * @param ctx - Host context carrying storage, journal, and task services.
   */
  constructor(ctx: Context) {
    super(ctx, 'attention')
  }

  /** Open and own the attention domain. */
  protected async [Service.init](): Promise<void> {
    const domain = await this.ctx.storageDomain.open(attentionDomainSpec)
    this.ctx.effect(() => async () => {
      await domain.close()
    }, 'attention.domainClose')
    this.items = domain.table('items')
    this.itemKeys = domain.table('item_keys')
  }

  /**
   * Create one attention item. Idempotent: replaying a caller key returns
   * the stored item; a replay with a different itemId fails loud.
   * @param input - the item fields; `itemId` is caller-supplied and stable.
   * @param actor - the actor opening the item.
   * @param idempotencyKey - caller-owned replay key.
   * @returns the stored item.
   */
  @Remote('createItem')
  createItem(input: CreateItemInput, actor: string, idempotencyKey: string): Promise<AttentionItem> {
    const actorValue = this.requireText(actor, 'actor')
    const key = this.requireText(idempotencyKey, 'idempotencyKey')
    const normalized = this.normalizeInput(input)
    const result = this.mutationTail.then(() => this.createItemNow(normalized, actorValue, key))
    this.mutationTail = result.then(() => undefined, () => undefined)
    return result
  }

  /**
   * List every open item, in open order.
   * @returns the open items.
   */
  @Remote('listOpen')
  listOpen(): AttentionItem[] {
    const open: AttentionItem[] = []
    for (const [, item] of this.requireItems().entries()) {
      if (item.state === 'open') open.push(item)
    }
    open.sort((a, b) => a.openedAt - b.openedAt)
    return open
  }

  /**
   * Read one attention item.
   * @param itemId - the item identity.
   * @returns the item, or undefined when unknown.
   */
  @Remote('getItem')
  getItem(itemId: string): AttentionItem | undefined {
    const id = ItemIdOf(this.requireText(itemId, 'itemId'))
    return this.requireItems().get(String(id))
  }

  /**
   * Resolve one decision item against the given option. Idempotent: a replay
   * with the same option returns `resolved`; a different option reports
   * `already-resolved`. A stale, withdrawn, or revision-conflicted item never
   * resolves silently.
   * @param itemId - the item to decide.
   * @param expectedEntityRevision - the revision this decision satisfies.
   * @param optionId - one of the item's options.
   * @param actor - the deciding actor.
   * @param idempotencyKey - caller-owned replay key.
   * @returns the outcome and the revision to retry against when present.
   */
  @Remote('resolveDecision')
  resolveDecision(
    itemId: string,
    expectedEntityRevision: number,
    optionId: string,
    actor: string,
    idempotencyKey: string,
  ): Promise<DecisionResult> {
    const id = ItemIdOf(this.requireText(itemId, 'itemId'))
    const revision = this.requireRevision(expectedEntityRevision, 'expectedEntityRevision')
    const option = this.requireText(optionId, 'optionId')
    const actorValue = this.requireText(actor, 'actor')
    const key = this.requireText(idempotencyKey, 'idempotencyKey')
    const result = this.mutationTail.then(() => this.resolveNow(id, revision, option, actorValue, key))
    this.mutationTail = result.then(() => undefined, () => undefined)
    return result
  }

  /**
   * Confirm a batch of B-class items in one pass: every still-open
   * revision-matching item resolves, and each target reports its own outcome.
   * @param targets - the compare-and-set targets.
   * @param actor - the confirming actor.
   * @param idempotencyKey - caller-owned replay key.
   * @returns per-item results, in request order.
   */
  @Remote('confirmBatch')
  confirmBatch(
    targets: ConfirmTarget[],
    actor: string,
    idempotencyKey: string,
  ): Promise<ConfirmResult[]> {
    const actorValue = this.requireText(actor, 'actor')
    const key = this.requireText(idempotencyKey, 'idempotencyKey')
    if (!Array.isArray(targets)) throw new AttentionError('invalid-argument', 'targets must be an array')
    const normalized = targets.map((target, index) => ({
      itemId: ItemIdOf(this.requireText(target.itemId, `targets[${index}].itemId`)),
      expectedEntityRevision: this.requireRevision(target.expectedEntityRevision, `targets[${index}].expectedEntityRevision`),
    }))
    const result = this.mutationTail.then(() => this.confirmBatchNow(normalized, actorValue, key))
    this.mutationTail = result.then(() => undefined, () => undefined)
    return result
  }

  /**
   * Invalidate one open item upstream: the stale-propagation trigger that
   * makes later decisions report `stale` instead of silently resolving.
   * @param itemId - the item to invalidate.
   * @param expectedEntityRevision - the revision this invalidation satisfies.
   * @param reason - non-empty reason recorded with the invalidation.
   * @param actor - the invalidating actor.
   * @param idempotencyKey - caller-owned replay key.
   * @returns the outcome and the revision to retry against when present.
   */
  @Remote('invalidateItem')
  invalidateItem(
    itemId: string,
    expectedEntityRevision: number,
    reason: string,
    actor: string,
    idempotencyKey: string,
  ): Promise<InvalidateResult> {
    const id = ItemIdOf(this.requireText(itemId, 'itemId'))
    const revision = this.requireRevision(expectedEntityRevision, 'expectedEntityRevision')
    const reasonValue = this.requireText(reason, 'reason')
    const actorValue = this.requireText(actor, 'actor')
    const key = this.requireText(idempotencyKey, 'idempotencyKey')
    const result = this.mutationTail.then(() => this.invalidateNow(id, revision, reasonValue, actorValue, key))
    this.mutationTail = result.then(() => undefined, () => undefined)
    return result
  }

  private async createItemNow(input: CreateItemInput, actor: string, idempotencyKey: string): Promise<AttentionItem> {
    const existingKey = this.requireItemKeys().get(idempotencyKey)
    if (existingKey !== undefined) {
      const stored = this.requireItems().get(existingKey.itemId)
      if (stored === undefined) throw new AttentionError('not-found', `item "${existingKey.itemId}" is missing`)
      if (String(stored.itemId) !== String(input.itemId)) {
        throw new AttentionError('conflict', 'attention idempotency key reused with a different itemId')
      }
      return stored
    }
    let item: AttentionItem = {
      itemId: input.itemId,
      taskId: input.taskId,
      kind: input.kind,
      decisionKind: input.decisionKind,
      options: input.options,
      state: 'open',
      entityRevision: 1,
      openedAt: Date.now(),
    }
    if (input.runId !== undefined) item = { ...item, runId: input.runId }
    if (input.phaseRunId !== undefined) item = { ...item, phaseRunId: input.phaseRunId }
    if (input.submissionId !== undefined) item = { ...item, submissionId: input.submissionId }
    if (input.checkId !== undefined) item = { ...item, checkId: input.checkId }
    if (input.impactSnapshot !== undefined) item = { ...item, impactSnapshot: input.impactSnapshot }
    await this.appendFact({

      kind: 'attention/item-created',
      taskId: input.taskId,
      idempotencyKey: `attention/item-created:${idempotencyKey}`,
      entityRevision: 1,
      payload: { itemId: String(input.itemId), actor },
    })
    await this.requireItems().put(String(input.itemId), item)
    await this.requireItemKeys().put(idempotencyKey, { itemId: String(input.itemId) })
    return item
  }

  private async resolveNow(
    itemId: AttentionItemId,
    expectedEntityRevision: number,
    optionId: string,
    actor: string,
    idempotencyKey: string,
  ): Promise<DecisionResult> {
    const stored = this.requireItems().get(String(itemId))
    if (stored === undefined) return { outcome: 'withdrawn' }
    if (stored.state === 'resolved') {
      return { outcome: stored.outcome === optionId ? 'resolved' : 'already-resolved', currentRevision: stored.entityRevision }
    }
    if (stored.state !== 'open') return { outcome: 'stale', currentRevision: stored.entityRevision }
    if (stored.entityRevision !== expectedEntityRevision) return { outcome: 'conflict', currentRevision: stored.entityRevision }
    if (!stored.options.includes(optionId)) {
      throw new AttentionError('invalid-argument', `option "${optionId}" is not one of the item's options`)
    }
    const nextRevision = stored.entityRevision + 1
    await this.appendFact({
      kind: 'attention/item-resolved',
      taskId: stored.taskId,
      idempotencyKey: `attention/item-resolved:${idempotencyKey}`,
      entityRevision: nextRevision,
      payload: { itemId: String(itemId), optionId, actor },
    })
    await this.requireItems().put(String(itemId), {
      ...stored,
      state: 'resolved',
      entityRevision: nextRevision,
      resolvedAt: Date.now(),
      resolvedBy: actor,
      outcome: optionId,
    })
    await this.resumeIfAllSettled(stored.phaseRunId)
    return { outcome: 'resolved', currentRevision: nextRevision }
  }

  private async confirmBatchNow(
    targets: ConfirmTarget[],
    actor: string,
    idempotencyKey: string,
  ): Promise<ConfirmResult[]> {
    const results: ConfirmResult[] = []
    const settledPhaseRuns = new Set<string>()
    for (const target of targets) {
      const stored = this.requireItems().get(String(target.itemId))
      if (stored === undefined) {
        results.push({ itemId: target.itemId, outcome: 'withdrawn' })
        continue
      }
      if (stored.state === 'resolved') {
        results.push({ itemId: target.itemId, outcome: 'already-resolved', currentRevision: stored.entityRevision })
        continue
      }
      if (stored.state !== 'open') {
        results.push({ itemId: target.itemId, outcome: 'stale', currentRevision: stored.entityRevision })
        continue
      }
      if (stored.entityRevision !== target.expectedEntityRevision) {
        results.push({ itemId: target.itemId, outcome: 'conflict', currentRevision: stored.entityRevision })
        continue
      }
      const nextRevision = stored.entityRevision + 1
      await this.appendFact({
        kind: 'attention/item-resolved',
        taskId: stored.taskId,
        idempotencyKey: `attention/item-resolved:${idempotencyKey}:${String(target.itemId)}`,
        entityRevision: nextRevision,
        payload: { itemId: String(target.itemId), actor },
      })
      await this.requireItems().put(String(target.itemId), {
        ...stored,
        state: 'resolved',
        entityRevision: nextRevision,
        resolvedAt: Date.now(),
        resolvedBy: actor,
      })
      results.push({ itemId: target.itemId, outcome: 'resolved', currentRevision: nextRevision })
      if (stored.phaseRunId !== undefined) settledPhaseRuns.add(String(stored.phaseRunId))
    }
    for (const phaseRunId of settledPhaseRuns) await this.resumeIfAllSettled(phaseRunId)
    return results
  }

  private async invalidateNow(
    itemId: AttentionItemId,
    expectedEntityRevision: number,
    reason: string,
    actor: string,
    idempotencyKey: string,
  ): Promise<InvalidateResult> {
    const stored = this.requireItems().get(String(itemId))
    if (stored === undefined) return { outcome: 'withdrawn' }
    if (stored.state === 'resolved') return { outcome: 'already-resolved', currentRevision: stored.entityRevision }
    if (stored.state !== 'open') return { outcome: 'stale', currentRevision: stored.entityRevision }
    if (stored.entityRevision !== expectedEntityRevision) return { outcome: 'conflict', currentRevision: stored.entityRevision }
    const nextRevision = stored.entityRevision + 1
    await this.appendFact({
      kind: 'attention/item-invalidated',
      taskId: stored.taskId,
      idempotencyKey: `attention/item-invalidated:${idempotencyKey}`,
      entityRevision: nextRevision,
      payload: { itemId: String(itemId), reason, actor },
    })
    await this.requireItems().put(String(itemId), {
      ...stored,
      state: 'invalidated',
      entityRevision: nextRevision,
    })
    await this.resumeIfAllSettled(stored.phaseRunId)
    return { outcome: 'invalidated', currentRevision: nextRevision }
  }

  /**
   * Resume one phase run out of awaiting-decision when every item naming it
   * settled (resolved or invalidated). A run still awaiting a decision stays
   * parked; a concurrent transition owns the run and this becomes a no-op.
   * @param phaseRunId - the phase run the settled items name, when any.
   */
  private async resumeIfAllSettled(phaseRunId: string | undefined): Promise<void> {
    if (phaseRunId === undefined) return
    const naming = [...this.requireItems().entries()]
      .map(([, item]) => item)
      .filter(item => String(item.phaseRunId) === phaseRunId)
    if (naming.some(item => item.state === 'open')) return
    try {
      const phaseRun = await this.ctx.tasks.getPhaseRun(phaseRunId)
      if (phaseRun === undefined || phaseRun.state !== 'awaiting-decision') return
      await this.ctx.tasks.resumePhaseFromAwaiting(phaseRunId, {
        actor: FACT_ACTOR,
        reason: 'attention decisions settled',
        expectedRevision: phaseRun.revision,
        idempotencyKey: `attention/resume:${phaseRunId}`,
      })
    } catch {
      // A concurrent transition already owns the run; the resume round re-enters.
    }
  }

  /** Validate and normalize one create-item input. */
  private normalizeInput(input: CreateItemInput): CreateItemInput {
    const options = input.options
    if (!Array.isArray(options) || options.length === 0) {
      throw new AttentionError('invalid-argument', 'options must be a non-empty array')
    }
    let normalized: CreateItemInput = {
      itemId: ItemIdOf(this.requireText(input.itemId, 'itemId')),
      taskId: this.requireText(input.taskId, 'taskId') as CreateItemInput['taskId'],
      kind: input.kind,
      decisionKind: this.requireText(input.decisionKind, 'decisionKind'),
      options: options.map((option: string, index) => this.requireText(option, `options[${index}]`)),
    }
    if (input.runId !== undefined) normalized = { ...normalized, runId: this.requireText(input.runId, 'runId') as NonNullable<CreateItemInput['runId']> }
    if (input.phaseRunId !== undefined) normalized = { ...normalized, phaseRunId: this.requireText(input.phaseRunId, 'phaseRunId') as NonNullable<CreateItemInput['phaseRunId']> }
    if (input.submissionId !== undefined) normalized = { ...normalized, submissionId: this.requireText(input.submissionId, 'submissionId') as NonNullable<CreateItemInput['submissionId']> }
    if (input.checkId !== undefined) normalized = { ...normalized, checkId: this.requireText(input.checkId, 'checkId') }
    if (input.impactSnapshot !== undefined) normalized = { ...normalized, impactSnapshot: this.requireText(input.impactSnapshot, 'impactSnapshot') }
    return normalized
  }


  /** Append one attention fact; the journal's durable write is the commit point. */
  private async appendFact(input: {
    readonly kind: AttentionFactKind
    readonly taskId: AttentionItem['taskId']
    readonly idempotencyKey: string
    readonly entityRevision: number
    readonly payload: unknown
  }): Promise<void> {
    await this.ctx.workbenchJournal.append({
      taskId: input.taskId,
      kind: input.kind,
      actor: FACT_ACTOR,
      idempotencyKey: input.idempotencyKey,
      entityRevision: input.entityRevision,
      payload: input.payload as JournalPayload,
    })
  }

  /** Validate one non-empty wire field, returning the trimmed value. */
  private requireText(value: string, field: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new AttentionError('invalid-argument', `${field} must be a non-empty string`)
    }
    return value.trim()
  }

  /** Validate one compare-and-set revision. */
  private requireRevision(value: number, field: string): number {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new AttentionError('invalid-argument', `${field} must be a positive safe integer`)
    }
    return value
  }

  private requireItems(): KvTable<string, AttentionItem> {
    if (this.items === undefined) throw new AttentionError('not-found', 'attention domain is not initialized')
    return this.items
  }

  private requireItemKeys(): KvTable<string, ItemKeyEntry> {
    if (this.itemKeys === undefined) throw new AttentionError('not-found', 'attention domain is not initialized')
    return this.itemKeys
  }
}

export default AttentionService
