/**
 * Task budget service (`ctx.budget`): one explicit durable ledger per task
 * over the three budget dimensions (tokens, duration, reruns). Recording
 * usage evaluates thresholds per dimension — 80% raises a batch-confirmable
 * warning item once per budget revision, crossing the limit parks the task
 * in `awaiting-decision` behind a blocking decision item. Limits are never
 * defaulted: provisioning requires explicit values, and appending budget is
 * itself the over-limit decision's landing path.
 * @module @deepseek-ai/dsh-budget
 */

import { Context, Service } from '@deepseek-ai/cordis'
import type { KvTable } from '@deepseek-ai/dsh-storage-domain'
import { AttentionItemId } from '../attention/index.ts'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type {} from '../attention/index.ts'
import type {} from '../task/index.ts'
import type {} from '../workbench/journal/index.ts'
import type { TaskId } from '../task/types.ts'
import type { JournalPayload } from '../workbench/journal/types.ts'
import { BudgetError } from './types.ts'
import { BudgetRecordId } from './runtime.ts'
import { budgetDomainSpec } from './spec.ts'
import type { BudgetDimension, BudgetLimits, BudgetRecord, BudgetUsage } from './types.ts'

export type * from './types.ts'
export { BudgetRecordId } from './runtime.ts'
export { budgetDomainSpec, budgetRecordSchema } from './spec.ts'
export { BudgetError } from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    budget: BudgetService
  }
}

/** The actor recorded on budget facts; decisions carry their own actor. */
const FACT_ACTOR = 'budget'

/** The decision options of one budget-exceeded item. */
const EXCEEDED_OPTIONS = ['append-budget', 'pause', 'cancel'] as const

/** Ledger limit field per budget dimension. */
const LIMIT_KEYS = {
  tokens: 'maxTokens',
  durationMs: 'maxDurationMs',
  reruns: 'maxReruns',
} as const

/** The acknowledgment option of one budget-warning item. */
const WARNING_OPTIONS = ['acknowledged'] as const

/**
 * Budget service: the M5 explicit task ledger with threshold decisions.
 */
export class BudgetService extends TypertRemoteService {
  /** The service owns its domain, appends facts, and parks/resumes the task. */
  static inject = ['storageDomain', 'workbenchJournal', 'tasks', 'attention']

  private records?: KvTable<string, BudgetRecord>
  /** Serializes read-validate-write mutations so concurrent writers never interleave. */
  private mutationTail: Promise<void> = Promise.resolve()

  /**
   * @param ctx - Host context carrying storage, journal, task, and attention services.
   */
  constructor(ctx: Context) {
    super(ctx, 'budget')
  }

  /** Open and own the budget domain. */
  protected async [Service.init](): Promise<void> {
    const domain = await this.ctx.storageDomain.open(budgetDomainSpec)
    this.ctx.effect(() => async () => {
      await domain.close()
    }, 'budget.domainClose')
    this.records = domain.table('records')
  }

  /**
   * Provision one task's ledger. One record per task; explicit limits only —
   * an absent dimension is unlimited, not defaulted.
   * @param taskId - the task the ledger tracks.
   * @param limits - explicit limits; at least one dimension.
   * @param actor - provisioning actor.
   * @param idempotencyKey - caller-owned replay key.
   * @returns the stored ledger record.
   */
  @Remote('provisionBudget')
  async provisionBudget(taskId: string, limits: BudgetLimits, actor: string, idempotencyKey: string): Promise<BudgetRecord> {
    const task = this.requireTaskId(taskId)
    const owner = this.requireText(actor, 'actor')
    const key = this.requireText(idempotencyKey, 'idempotencyKey')
    const normalized = this.normalizeLimits(limits)
    const result = this.mutationTail.then(() => this.provisionNow(task, normalized, owner, key))
    this.mutationTail = result.then(() => undefined, () => undefined)
    return result
  }

  /**
   * Append budget: raise explicit limits and re-arm the warning latch.
   * @param taskId - the task whose ledger grows.
   * @param deltas - the limit increases per dimension; at least one positive.
   * @param expectedRevision - the ledger revision the caller read.
   * @param actor - appending actor.
   * @param idempotencyKey - caller-owned replay key.
   * @returns the post-append ledger record.
   */
  @Remote('appendBudget')
  async appendBudget(
    taskId: string,
    deltas: BudgetLimits,
    expectedRevision: number,
    actor: string,
    idempotencyKey: string,
  ): Promise<BudgetRecord> {
    const task = this.requireTaskId(taskId)
    const revision = this.requireRevision(expectedRevision, 'expectedRevision')
    const owner = this.requireText(actor, 'actor')
    const key = this.requireText(idempotencyKey, 'idempotencyKey')
    const normalized = this.normalizeLimits(deltas)
    const result = this.mutationTail.then(() => this.appendNow(task, normalized, revision, owner, key))
    this.mutationTail = result.then(() => undefined, () => undefined)
    return result
  }

  /**
   * Record one explicit usage intake and evaluate thresholds per dimension.
   * @param taskId - the task whose ledger accumulates.
   * @param usage - the spend delta; absent dimensions spend nothing.
   * @param actor - recording actor.
   * @param idempotencyKey - caller-owned replay key.
   * @returns the post-intake ledger record.
   */
  @Remote('recordUsage')
  async recordUsage(taskId: string, usage: BudgetUsage, actor: string, idempotencyKey: string): Promise<BudgetRecord> {
    const task = this.requireTaskId(taskId)
    const owner = this.requireText(actor, 'actor')
    const key = this.requireText(idempotencyKey, 'idempotencyKey')
    const normalized = this.normalizeUsage(usage)
    const result = this.mutationTail.then(() => this.recordNow(task, normalized, owner, key))
    this.mutationTail = result.then(() => undefined, () => undefined)
    return result
  }

  /**
   * Read one task's ledger.
   * @param taskId - the task the ledger tracks.
   * @returns the ledger record, or undefined when never provisioned.
   */
  @Remote('getBudget')
  getBudget(taskId: string): BudgetRecord | undefined {
    return this.requireRecords().get(this.requireTaskId(taskId))
  }

  /**
   * Land one resolved budget-exceeded decision on the task plane: the
   * append-budget outcome grows the ledger and resumes the task; pause and
   * cancel route to the task commands. The item must already be resolved —
   * no silent landing of an open decision.
   * @param itemId - the resolved budget-exceeded item.
   * @param deltas - the limit increases (append-budget only; at least one).
   * @param taskRevision - the task revision the caller read.
   * @param actor - landing actor.
   * @param idempotencyKey - caller-owned replay key.
   */
  @Remote('applyBudgetDecision')
  async applyBudgetDecision(
    itemId: string,
    deltas: BudgetLimits,
    taskRevision: number,
    actor: string,
    idempotencyKey: string,
  ): Promise<void> {
    const id = AttentionItemId(this.requireText(itemId, 'itemId'))
    const owner = this.requireText(actor, 'actor')
    const key = this.requireText(idempotencyKey, 'idempotencyKey')
    const item = this.ctx.attention.getItem(String(id))
    if (item === undefined) throw new BudgetError('not-found', `budget item "${itemId}" is unknown`)
    if (item.decisionKind !== 'budget-exceeded') {
      throw new BudgetError('invalid-option', `item "${itemId}" is not a budget-exceeded decision`)
    }
    if (item.state !== 'resolved' || item.outcome === undefined) {
      throw new BudgetError('not-resolved', `budget decision "${itemId}" is not resolved`)
    }
    const task = await this.ctx.tasks.getTask(String(item.taskId))
    if (task === undefined) throw new BudgetError('not-found', `task "${String(item.taskId)}" is unknown`)
    const mutation = { actor: owner, reason: `budget decision ${item.outcome}`, expectedRevision: taskRevision, idempotencyKey: key }
    if (item.outcome === 'append-budget') {
      const appended = await this.appendBudget(String(item.taskId), deltas, this.requireBudgetOf(item.taskId).revision, owner, key)
      await this.ctx.tasks.resumeTaskFromDecision(String(item.taskId), mutation)
      await this.appendFact(appended.taskId, 'budget/decision-applied', key, appended.revision, {
        itemId: String(id), outcome: item.outcome, revision: appended.revision,
      })
      return
    }
    if (item.outcome === 'pause') {
      await this.ctx.tasks.requestPause(String(item.taskId), mutation)
    } else if (item.outcome === 'cancel') {
      await this.ctx.tasks.requestCancel(String(item.taskId), mutation)
    } else {
      throw new BudgetError('invalid-option', `outcome "${item.outcome}" is not a budget decision option`)
    }
    await this.appendFact(item.taskId, 'budget/decision-applied', key, item.entityRevision, {
      itemId: String(id), outcome: item.outcome,
    })
  }

  private async provisionNow(taskId: TaskId, limits: BudgetLimits, actor: string, idempotencyKey: string): Promise<BudgetRecord> {
    const records = this.requireRecords()
    if (records.get(String(taskId)) !== undefined) {
      throw new BudgetError('already-provisioned', `task "${String(taskId)}" already has a budget ledger`)
    }
    const record: BudgetRecord = {
      recordId: BudgetRecordId(`budget:${String(taskId)}`),
      taskId,
      limits,
      spent: { tokens: 0, durationMs: 0, reruns: 0 },
      revision: 1,
      warned: [],
    }
    await this.appendFact(taskId, 'budget/provisioned', idempotencyKey, 1, { limits, actor })
    await records.put(String(taskId), record)
    return record
  }

  private async appendNow(
    taskId: TaskId,
    deltas: BudgetLimits,
    expectedRevision: number,
    actor: string,
    idempotencyKey: string,
  ): Promise<BudgetRecord> {
    const stored = this.requireBudgetOf(taskId)
    if (stored.revision !== expectedRevision) {
      throw new BudgetError('stale-revision', `expected ledger revision ${expectedRevision}, stored ${stored.revision}`)
    }
    let limits: BudgetLimits = { ...stored.limits }
    for (const dimension of ['tokens', 'durationMs', 'reruns'] as const) {
      const key = LIMIT_KEYS[dimension]
      const current = stored.limits[key]
      if (current !== undefined) limits = { ...limits, [key]: current + (deltas[key] ?? 0) }
    }
    const record: BudgetRecord = {
      ...stored,
      limits,
      revision: stored.revision + 1,
      warned: [],
    }
    await this.appendFact(taskId, 'budget/appended', idempotencyKey, record.revision, { deltas, actor })
    await this.requireRecords().put(String(taskId), record)
    return record
  }

  private async recordNow(taskId: TaskId, usage: BudgetUsage, actor: string, idempotencyKey: string): Promise<BudgetRecord> {
    const stored = this.requireBudgetOf(taskId)
    const spent = {
      tokens: stored.spent.tokens + (usage.tokens ?? 0),
      durationMs: stored.spent.durationMs + (usage.durationMs ?? 0),
      reruns: stored.spent.reruns + (usage.reruns ?? 0),
    }
    let record: BudgetRecord = { ...stored, spent }
    await this.appendFact(taskId, 'budget/used', idempotencyKey, stored.revision, { usage, actor, spent })
    const crossed: BudgetDimension[] = []
    for (const dimension of ['tokens', 'durationMs', 'reruns'] as const) {
      const limit = stored.limits[LIMIT_KEYS[dimension]]
      if (limit === undefined) continue
      const value = spent[dimension]
      if (value > limit) crossed.push(dimension)
      else if (value * 5 >= limit * 4 && !stored.warned.includes(dimension)) {
        record = { ...record, warned: [...record.warned, dimension] }
        await this.ctx.attention.createItem({
          itemId: AttentionItemId(`budget-warning:${String(taskId)}:${dimension}:${record.revision}`),
          taskId,
          kind: 'b-confirm',
          decisionKind: 'budget-warning',
          options: [...WARNING_OPTIONS],
        }, FACT_ACTOR, `budget-warning:${String(taskId)}:${dimension}:${record.revision}`)
        await this.appendFact(taskId, 'budget/warned', idempotencyKey, record.revision, { dimension, value, limit })
      }
    }
    if (crossed.length > 0) {
      const task = await this.ctx.tasks.getTask(String(taskId))
      if (task === undefined) throw new BudgetError('not-found', `task "${String(taskId)}" is unknown`)
      if (task.state === 'running') {
        await this.ctx.tasks.markTaskAwaitingDecision(String(taskId), {
          actor: FACT_ACTOR, reason: `budget exceeded: ${crossed.join(', ')}`,
          expectedRevision: task.revision, idempotencyKey: `budget-exceed:${idempotencyKey}`,
        })
      }
      for (const dimension of crossed) {
        await this.ctx.attention.createItem({
          itemId: AttentionItemId(`budget-exceeded:${String(taskId)}:${dimension}:${record.revision}`),
          taskId,
          kind: 'c-decision',
          decisionKind: 'budget-exceeded',
          options: [...EXCEEDED_OPTIONS],
        }, FACT_ACTOR, `budget-exceeded:${String(taskId)}:${dimension}:${record.revision}`)
        await this.appendFact(taskId, 'budget/exceeded', idempotencyKey, record.revision, { dimension, value: spent[dimension] })
      }
    }
    await this.requireRecords().put(String(taskId), record)
    return record
  }

  private requireBudgetOf(taskId: TaskId): BudgetRecord {
    const stored = this.requireRecords().get(String(taskId))
    if (stored === undefined) {
      throw new BudgetError('not-found', `task "${String(taskId)}" has no budget ledger`)
    }
    return stored
  }

  /** Append one budget fact; the journal's durable write is the commit point. */
  private async appendFact(taskId: TaskId, kind: string, idempotencyKey: string, entityRevision: number, payload: unknown): Promise<void> {
    await this.ctx.workbenchJournal.append({
      taskId,
      kind,
      actor: FACT_ACTOR,
      idempotencyKey: `${kind}:${String(taskId)}:${idempotencyKey}`,
      entityRevision,
      payload: payload as JournalPayload,
    })
  }

  private normalizeLimits(limits: BudgetLimits | null): BudgetLimits {
    if (limits === null || typeof limits !== 'object') {
      throw new BudgetError('invalid-argument', 'limits must be an object')
    }
    const out: Record<string, number> = {}
    let any = false
    for (const key of ['maxTokens', 'maxDurationMs', 'maxReruns'] as const) {
      const value = (limits as Record<string, unknown>)[key]
      if (value === undefined) continue
      if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
        throw new BudgetError('invalid-argument', `${key} must be a positive safe integer`)
      }
      out[key] = value
      any = true
    }
    if (!any) throw new BudgetError('invalid-argument', 'limits require at least one dimension')
    return out
  }

  private normalizeUsage(usage: BudgetUsage | null): BudgetUsage {
    if (usage === null || typeof usage !== 'object') {
      throw new BudgetError('invalid-argument', 'usage must be an object')
    }
    const out: Record<string, number> = {}
    for (const key of ['tokens', 'durationMs', 'reruns'] as const) {
      const value = (usage as Record<string, unknown>)[key]
      if (value === undefined) continue
      if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
        throw new BudgetError('invalid-argument', `${key} must be a positive safe integer`)
      }
      out[key] = value
    }
    return out
  }

  private requireTaskId(taskId: string): TaskId {
    return this.requireText(taskId, 'taskId') as TaskId
  }

  /** Validate one non-empty wire field, returning the trimmed value. */
  private requireText(value: string, field: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BudgetError('invalid-argument', `${field} must be a non-empty string`)
    }
    return value.trim()
  }

  /** Validate one compare-and-set revision. */
  private requireRevision(value: number, field: string): number {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new BudgetError('invalid-argument', `${field} must be a positive safe integer`)
    }
    return value
  }

  private requireRecords(): KvTable<string, BudgetRecord> {
    if (this.records === undefined) throw new BudgetError('not-found', 'budget domain is not initialized')
    return this.records
  }
}

export default BudgetService
