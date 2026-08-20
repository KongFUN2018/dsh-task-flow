/**
 * Review-policy service (`ctx.reviewPolicy`): the M5 trust tiers, the
 * deferred-batch-confirm read the gate service consults, the completion
 * guards that keep unsigned B items and suspended rewind decisions from
 * completing a task, and the repair-fuse breaker that parks a task behind a
 * recovery decision after consecutive failed A repairs hit the recipe's
 * explicit cap.
 * @module @deepseek-ai/dsh-review-policy
 */

import { Context, Service } from '@deepseek-ai/cordis'
import type { KvTable } from '@deepseek-ai/dsh-storage-domain'
import { AttentionItemId } from '../attention/index.ts'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type {} from '../attention/index.ts'
import type {} from '../task/index.ts'
import type {} from '../workbench/journal/index.ts'
import type {} from '../recipe/index.ts'
import type { GateCheckResult, PhaseRunId, TaskId, TaskRecord } from '../task/types.ts'
import type { JournalPayload } from '../workbench/journal/types.ts'
import { ReviewPolicyError } from './types.ts'
import { ReviewPolicyRecordId } from './runtime.ts'
import { reviewPolicyDomainSpec } from './spec.ts'
import type { BreakerCounter, ReviewPolicyRecord, TrustTier } from './types.ts'

export type * from './types.ts'
export { ReviewPolicyRecordId } from './runtime.ts'
export { reviewPolicyDomainSpec, reviewPolicyRecordSchema, breakerCounterSchema } from './spec.ts'
export { ReviewPolicyError } from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    reviewPolicy: ReviewPolicyService
  }
}

/** The actor recorded on review-policy facts; decisions carry their own actor. */
const FACT_ACTOR = 'review-policy'

/** The decision options of one breaker-tripped item. */
const BREAKER_OPTIONS = ['continue-repair', 'patch', 'rewind', 'pause', 'cancel'] as const

/**
 * Review-policy service: trust tiers, completion guards, and repair fuses.
 */
export class ReviewPolicyService extends TypertRemoteService {
  /** The service owns its domain, appends facts, registers guards, and parks phase runs. */
  static inject = ['storageDomain', 'workbenchJournal', 'tasks', 'attention', 'recipes']

  private tiers?: KvTable<string, ReviewPolicyRecord>
  private breakers?: KvTable<string, BreakerCounter>
  /** Serializes read-validate-write mutations so concurrent writers never interleave. */
  private mutationTail: Promise<void> = Promise.resolve()
  /** Disposers for the two completion guards; released on dispose. */
  private readonly guardDisposers: Array<() => void> = []

  /**
   * @param ctx - Host context carrying storage, journal, task, attention, and recipe services.
   */
  constructor(ctx: Context) {
    super(ctx, 'reviewPolicy')
  }

  /** Open the domain, watch gate verdicts, and register the completion guards. */
  protected async [Service.init](): Promise<void> {
    const domain = await this.ctx.storageDomain.open(reviewPolicyDomainSpec)
    this.ctx.effect(() => async () => {
      await domain.close()
    }, 'reviewPolicy.domainClose')
    this.tiers = domain.table('tiers')
    this.breakers = domain.table('breakers')
    this.ctx.on('gate-check/recorded', (result) => {
      void this.observeVerdict(result)
    })
    this.guardDisposers.push(
      this.ctx.tasks.registerCompletionGuard(task => this.vetoOpenBatchConfirms(task)),
      this.ctx.tasks.registerCompletionGuard(task => this.vetoOpenRewindDecisions(task)),
    )
    this.ctx.effect(() => () => {
      for (const dispose of this.guardDisposers.splice(0)) dispose()
    }, 'reviewPolicy.guards')
  }

  /**
   * Set one task's trust tier; unprovisioned tasks read as strict.
   * @param taskId - the task whose tier changes.
   * @param tier - the new tier.
   * @param actor - setting actor.
   * @param idempotencyKey - caller-owned replay key.
   * @returns the stored tier record.
   */
  @Remote('setTier')
  async setTier(taskId: string, tier: TrustTier, actor: string, idempotencyKey: string): Promise<ReviewPolicyRecord> {
    const task = this.requireTaskId(taskId)
    if (!['strict', 'balanced', 'trusted'].includes(tier)) {
      throw new ReviewPolicyError('invalid-argument', 'tier must be strict, balanced, or trusted')
    }
    const owner = this.requireText(actor, 'actor')
    const key = this.requireText(idempotencyKey, 'idempotencyKey')
    const result = this.mutationTail.then(() => this.setTierNow(task, tier, owner, key))
    this.mutationTail = result.then(() => undefined, () => undefined)
    return result
  }

  /**
   * Read one task's tier.
   * @param taskId - the task to read.
   * @returns the stored tier, or strict when unprovisioned.
   */
  @Remote('getTier')
  getTier(taskId: string): TrustTier {
    return this.requireTiers().get(this.requireTaskId(taskId))?.tier ?? 'strict'
  }

  /**
   * The gate service's read: whether B-class batch confirmation may run
   * ahead (trusted tier only). C-class checks always block.
   * @param taskId - the task being gated.
   * @returns true only when the task runs the trusted tier.
   */
  @Remote('defersBatchConfirm')
  defersBatchConfirm(taskId: string): boolean {
    return this.getTier(taskId) === 'trusted'
  }

  /**
   * Land one resolved breaker decision on the task plane: continue-repair
   * resets the counter and resumes the parked run; pause and cancel route to
   * the task commands; patch only journals the choice.
   * @param itemId - the resolved breaker-tripped item.
   * @param phaseRunRevision - the parked phase run's revision the caller read.
   * @param actor - landing actor.
   * @param idempotencyKey - caller-owned replay key.
   */
  @Remote('applyBreakerDecision')
  async applyBreakerDecision(itemId: string, phaseRunRevision: number, actor: string, idempotencyKey: string): Promise<void> {
    const owner = this.requireText(actor, 'actor')
    const key = this.requireText(idempotencyKey, 'idempotencyKey')
    const revision = this.requireRevision(phaseRunRevision, 'phaseRunRevision')
    const item = this.ctx.attention.getItem(this.requireText(itemId, 'itemId'))
    if (item === undefined) throw new ReviewPolicyError('not-found', `breaker item "${itemId}" is unknown`)
    if (item.decisionKind !== 'breaker-tripped') {
      throw new ReviewPolicyError('invalid-option', `item "${itemId}" is not a breaker decision`)
    }
    if (item.state !== 'resolved' || item.outcome === undefined) {
      throw new ReviewPolicyError('not-resolved', `breaker decision "${itemId}" is not resolved`)
    }
    if (item.phaseRunId === undefined) {
      throw new ReviewPolicyError('invalid-transition', `breaker item "${itemId}" has no parked phase run`)
    }
    if (item.outcome === 'continue-repair') {
      await this.resetCounter(item.taskId, item.checkId ?? '', key)
      await this.ctx.tasks.resumePhaseFromAwaiting(String(item.phaseRunId), {
        actor: owner, reason: `breaker decision ${item.outcome}`, expectedRevision: revision, idempotencyKey: key,
      })
    } else if (item.outcome === 'pause' || item.outcome === 'cancel') {
      const task = await this.ctx.tasks.getTask(String(item.taskId))
      if (task === undefined) throw new ReviewPolicyError('not-found', `task "${String(item.taskId)}" is unknown`)
      const mutation = { actor: owner, reason: `breaker decision ${item.outcome}`, expectedRevision: task.revision, idempotencyKey: key }
      if (item.outcome === 'pause') {
        await this.ctx.tasks.requestPause(String(item.taskId), mutation)
      } else {
        await this.ctx.tasks.requestCancel(String(item.taskId), mutation)
      }
    }
    await this.appendFact(item.taskId, 'review-policy/breaker-decision', key, item.entityRevision, {
      itemId: String(item.itemId), outcome: item.outcome, actor: owner,
    })
  }

  /** Fold one recorded verdict into its breaker counter and maybe trip the fuse. */
  /** Completion veto: unsigned B-class confirmations of this task block completion. */
  private vetoOpenBatchConfirms(task: TaskRecord): Promise<void> {
    const unsigned = this.ctx.attention.listOpen()
      .filter(item => item.taskId === task.taskId && item.kind === 'b-confirm')
    if (unsigned.length > 0) {
      throw new Error(`${unsigned.length} unsigned B item(s) block completion`)
    }
    return Promise.resolve()
  }

  /** Completion veto: an open rewind decision of this task suspends completion. */
  private vetoOpenRewindDecisions(task: TaskRecord): Promise<void> {
    const suspended = this.ctx.attention.listOpen()
      .filter(item => item.taskId === task.taskId && item.decisionKind === 'rewind')
    if (suspended.length > 0) {
      throw new Error(`${suspended.length} suspended rewind decision(s) block completion`)
    }
    return Promise.resolve()
  }

  private async observeVerdict(result: GateCheckResult): Promise<void> {
    if (result.stale === true) return
    const submission = await this.ctx.tasks.getSubmission(String(result.submissionId))
    if (submission === undefined) return
    const taskId = submission.taskId
    const counted = this.mutationTail.then(() => this.countVerdict(taskId, result.checkId, result.passed))
    this.mutationTail = counted.then(() => undefined, () => undefined)
    const tripped = await counted
    if (tripped === undefined) return
    await this.ctx.tasks.markPhaseAwaitingDecision(String(tripped.phaseRunId), {
      actor: FACT_ACTOR,
      reason: `breaker tripped on check "${result.checkId}"`,
      expectedRevision: tripped.epoch,
      idempotencyKey: `breaker-park:${result.checkId}:${tripped.epoch}`,
    })
    await this.ctx.attention.createItem({
      itemId: AttentionItemId(`breaker:${String(taskId)}:${result.checkId}:${tripped.epoch}`),
      taskId,
      phaseRunId: tripped.phaseRunId,
      submissionId: result.submissionId,
      checkId: result.checkId,
      kind: 'recovery',
      decisionKind: 'breaker-tripped',
      options: [...BREAKER_OPTIONS],
    }, FACT_ACTOR, `breaker:${String(taskId)}:${result.checkId}:${tripped.epoch}`)
  }

  private async countVerdict(
    taskId: TaskId,
    checkId: string,
    passed: boolean,
  ): Promise<{ phaseRunId: PhaseRunId; epoch: number } | undefined> {
    const stored = this.requireBreakers().get(this.breakerKey(taskId, checkId))
    const consecutiveFailures = passed ? 0 : (stored?.consecutiveFailures ?? 0) + 1
    const revision = (stored?.revision ?? 0) + 1
    const counter: BreakerCounter = { taskId, checkId, consecutiveFailures, revision }
    await this.requireBreakers().put(this.breakerKey(taskId, checkId), counter)
    if (passed) return undefined
    const task = await this.ctx.tasks.getTask(String(taskId))
    if (task === undefined || task.currentRunId === undefined) return undefined
    const pinned = this.ctx.recipes.getPinned({ recipeId: task.pinnedRecipe.recipeId, revision: task.pinnedRecipe.revision })
    const check = pinned.payload.gateChecks.find(candidate => candidate.checkId === checkId)
    if (check?.circuitBreaker === undefined) return undefined
    const breaker = pinned.payload.breakers?.find(candidate => candidate.key === check.circuitBreaker)
    if (breaker === undefined || consecutiveFailures < breaker.maxConsecutiveRepairs) return undefined
    await this.appendFact(taskId, 'review-policy/breaker-tripped', `breaker:${checkId}:${revision}`, revision, {
      checkId, consecutiveFailures, cap: breaker.maxConsecutiveRepairs,
    })
    const phaseRuns = await this.ctx.tasks.listPhaseRuns(String(task.currentRunId))
    const parked = phaseRuns.find(phase => phase.state === 'gate-running' && phase.phaseId === check.phaseId)
    if (parked === undefined) return undefined
    return { phaseRunId: parked.phaseRunId, epoch: parked.revision }
  }

  /** Reset one breaker counter after a continue-repair decision. */
  private async resetCounter(taskId: TaskId, checkId: string, idempotencyKey: string): Promise<void> {
    const stored = this.requireBreakers().get(this.breakerKey(taskId, checkId))
    const counter: BreakerCounter = {
      taskId,
      checkId,
      consecutiveFailures: 0,
      revision: (stored?.revision ?? 0) + 1,
    }
    await this.appendFact(taskId, 'review-policy/breaker-reset', idempotencyKey, counter.revision, { checkId })
    await this.requireBreakers().put(this.breakerKey(taskId, checkId), counter)
  }

  private async setTierNow(taskId: TaskId, tier: TrustTier, actor: string, idempotencyKey: string): Promise<ReviewPolicyRecord> {
    const stored = this.requireTiers().get(String(taskId))
    const record: ReviewPolicyRecord = {
      recordId: stored?.recordId ?? ReviewPolicyRecordId(`review-policy:${String(taskId)}`),
      taskId,
      tier,
      revision: (stored?.revision ?? 0) + 1,
    }
    await this.appendFact(taskId, 'review-policy/tier-set', idempotencyKey, record.revision, { tier, actor })
    await this.requireTiers().put(String(taskId), record)
    return record
  }

  private breakerKey(taskId: TaskId, checkId: string): string {
    return `${String(taskId)}:${checkId}`
  }

  /** Append one review-policy fact; the journal's durable write is the commit point. */
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

  private requireTaskId(taskId: string): TaskId {
    return this.requireText(taskId, 'taskId') as TaskId
  }

  /** Validate one non-empty wire field, returning the trimmed value. */
  private requireText(value: string, field: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new ReviewPolicyError('invalid-argument', `${field} must be a non-empty string`)
    }
    return value.trim()
  }

  /** Validate one compare-and-set revision. */
  private requireRevision(value: number, field: string): number {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new ReviewPolicyError('invalid-argument', `${field} must be a positive safe integer`)
    }
    return value
  }

  private requireTiers(): KvTable<string, ReviewPolicyRecord> {
    if (this.tiers === undefined) throw new ReviewPolicyError('not-found', 'review-policy domain is not initialized')
    return this.tiers
  }

  private requireBreakers(): KvTable<string, BreakerCounter> {
    if (this.breakers === undefined) throw new ReviewPolicyError('not-found', 'review-policy domain is not initialized')
    return this.breakers
  }
}

export default ReviewPolicyService
