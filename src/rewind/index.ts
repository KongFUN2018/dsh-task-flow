/**
 * Rewind service (`ctx.rewind`): the M5 branch-abandonment flow. A rewind
 * request computes the deliverable impact closure, persists the preview on
 * the decision item (the first `impactSnapshot` writer), and only a resolved
 * `confirm-rewind` outcome creates the new task run — superseding every phase
 * run of the retired branch. Declined outcomes keep the task plane untouched:
 * the upstream edit already staled the versions it staled.
 * @module @deepseek-ai/dsh-rewind
 */

import { Context } from '@deepseek-ai/cordis'
import { AttentionItemId } from '../attention/index.ts'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type {} from '../attention/index.ts'
import type {} from '../task/index.ts'
import type {} from '../deliverable/index.ts'
import type {} from '../workbench/journal/index.ts'
import type { TaskId, TaskMutationContext, TaskRunRecord } from '../task/types.ts'
import type { ImpactSnapshot } from '../deliverable/types.ts'
import type { JournalPayload } from '../workbench/journal/types.ts'
import { RewindError } from './types.ts'
import { REWIND_OPTIONS } from './types.ts'
import type { RewindApplication, RewindPreview } from './types.ts'

export type * from './types.ts'
export { RewindError, REWIND_OPTIONS } from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    rewind: RewindService
  }
}

/** The actor recorded on rewind facts; decisions carry their own actor. */
const FACT_ACTOR = 'rewind'

/**
 * Rewind service: preview-through-decision branch replacement.
 */
export class RewindService extends TypertRemoteService {
  /** The service reads deliverable closures, writes task branches, and files decisions. */
  static inject = ['deliverables', 'tasks', 'attention', 'workbenchJournal']

  /** Serializes read-validate-write mutations so concurrent writers never interleave. */
  private mutationTail: Promise<void> = Promise.resolve()

  /**
   * @param ctx - Host context carrying deliverables, tasks, attention, and the journal.
   */
  constructor(ctx: Context) {
    super(ctx, 'rewind')
  }

  /**
   * Request one rewind: compute the impact closure, persist the preview, and
   * open the decision item. No task-plane write happens before the decision.
   * @param taskId - the task whose branch the rewind would replace.
   * @param rootVersionIds - the deliverable versions the upstream edit staled.
   * @param actor - requesting actor.
   * @param idempotencyKey - caller-owned replay key.
   * @returns the open rewind decision item.
   */
  @Remote('requestRewind')
  async requestRewind(
    taskId: string,
    rootVersionIds: string[],
    actor: string,
    idempotencyKey: string,
  ): Promise<RewindPreview & { itemId: string }> {
    const task = this.requireTaskId(taskId)
    const owner = this.requireText(actor, 'actor')
    const key = this.requireText(idempotencyKey, 'idempotencyKey')
    if (!Array.isArray(rootVersionIds) || rootVersionIds.length === 0) {
      throw new RewindError('invalid-argument', 'rootVersionIds must be a non-empty array')
    }
    for (const id of rootVersionIds) this.requireText(id, 'rootVersionId')
    const result = this.mutationTail.then(() => this.requestNow(task, [...rootVersionIds], owner, key))
    this.mutationTail = result.then(() => undefined, () => undefined)
    return result
  }

  /**
   * Apply one resolved rewind decision: create the successor run, supersede
   * the retired branch's phase runs, and journal the branch fact.
   * @param itemId - the resolved rewind decision item.
   * @param taskRevision - the task revision the caller read.
   * @param actor - applying actor.
   * @param idempotencyKey - caller-owned replay key.
   * @returns the new run and the retired phase runs.
   */
  @Remote('applyRewind')
  async applyRewind(itemId: string, taskRevision: number, actor: string, idempotencyKey: string): Promise<RewindApplication> {
    const owner = this.requireText(actor, 'actor')
    const key = this.requireText(idempotencyKey, 'idempotencyKey')
    const revision = this.requireRevision(taskRevision, 'taskRevision')
    const result = this.mutationTail.then(() => this.applyNow(AttentionItemId(this.requireText(itemId, 'itemId')), revision, owner, key))
    this.mutationTail = result.then(() => undefined, () => undefined)
    return result
  }

  private async requestNow(
    taskId: TaskId,
    rootVersionIds: string[],
    actor: string,
    idempotencyKey: string,
  ): Promise<RewindPreview & { itemId: string }> {
    const task = await this.ctx.tasks.getTask(String(taskId))
    if (task === undefined) throw new RewindError('not-found', `task "${String(taskId)}" is unknown`)
    if (task.currentRunId === undefined) {
      throw new RewindError('invalid-transition', `task "${String(taskId)}" has no run to rewind`)
    }
    const snapshot: ImpactSnapshot = await this.ctx.deliverables.invalidateDownstream(rootVersionIds)
    const rerunPhaseIds = new Set<string>()
    for (const phaseRunId of snapshot.affectedPhaseRuns) {
      const phaseRun = await this.ctx.tasks.getPhaseRun(String(phaseRunId))
      if (phaseRun !== undefined) rerunPhaseIds.add(phaseRun.phaseId)
    }
    const invalidatedVersionIds = snapshot.staledVersions.flatMap(group => group.versionIds.map(String))
    const reusableClarificationIds = this.ctx.workbenchJournal.replay(0)
      .filter(fact => fact.kind === 'clarification/injected' && String(fact.taskId) === String(taskId))
      .map(fact => (fact.payload as { requestId: string }).requestId)
    const preview: RewindPreview = {
      snapshotId: String(snapshot.snapshotId),
      invalidatedVersionIds,
      rerunPhaseIds: [...rerunPhaseIds],
      reusableClarificationIds,
      costHint: 'uncalibrated',
    }
    const itemId = `rewind:${String(taskId)}:${preview.snapshotId}`
    await this.appendFact(taskId, 'rewind/preview-requested', idempotencyKey, task.revision, {
      itemId, actor, roots: rootVersionIds, preview,
    })
    await this.ctx.attention.createItem({
      itemId: AttentionItemId(itemId),
      taskId,
      runId: task.currentRunId,
      kind: 'c-decision',
      decisionKind: 'rewind',
      options: [...REWIND_OPTIONS],
      impactSnapshot: JSON.stringify(preview),
    }, FACT_ACTOR, `rewind-preview:${idempotencyKey}`)
    return { ...preview, itemId }
  }

  private async applyNow(
    itemId: ReturnType<typeof AttentionItemId>,
    taskRevision: number,
    actor: string,
    idempotencyKey: string,
  ): Promise<RewindApplication> {
    const item = this.ctx.attention.getItem(String(itemId))
    if (item === undefined) throw new RewindError('not-found', `rewind item "${String(itemId)}" is unknown`)
    if (item.decisionKind !== 'rewind') {
      throw new RewindError('invalid-option', `item "${String(itemId)}" is not a rewind decision`)
    }
    if (item.state !== 'resolved' || item.outcome === undefined) {
      throw new RewindError('not-resolved', `rewind decision "${String(itemId)}" is not resolved`)
    }
    if (item.outcome !== 'confirm-rewind') {
      await this.appendFact(item.taskId, 'rewind/declined', idempotencyKey, item.entityRevision, {
        itemId: String(itemId), outcome: item.outcome, actor,
      })
      throw new RewindError('invalid-option', `rewind decision "${String(itemId)}" resolved to "${item.outcome}", not "confirm-rewind"`)
    }
    const task = await this.ctx.tasks.getTask(String(item.taskId))
    if (task === undefined) throw new RewindError('not-found', `task "${String(item.taskId)}" is unknown`)
    if (task.currentRunId === undefined) {
      throw new RewindError('invalid-transition', `task "${String(item.taskId)}" has no run to retire`)
    }
    const retiredRunId = String(task.currentRunId)
    const mutation: TaskMutationContext = {
      actor, reason: `rewind ${String(itemId)}`, expectedRevision: taskRevision, idempotencyKey,
    }
    const run: TaskRunRecord = await this.ctx.tasks.createTaskRun(String(item.taskId), mutation, retiredRunId)
    const phaseRuns = await this.ctx.tasks.listPhaseRuns(retiredRunId)
    const supersededPhaseRunIds: string[] = []
    for (const phaseRun of phaseRuns) {
      const superseded = await this.ctx.tasks.markPhaseSuperseded(String(phaseRun.phaseRunId), {
        ...mutation,
        expectedRevision: phaseRun.revision,
      })
      supersededPhaseRunIds.push(String(superseded.phaseRunId))
    }
    await this.appendFact(item.taskId, 'rewind/applied', idempotencyKey, run.revision, {
      itemId: String(itemId), newRunId: String(run.runId), retiredRunId, supersededPhaseRunIds, actor,
    })
    return { run, supersededPhaseRunIds }
  }

  /** Append one rewind fact; the journal's durable write is the commit point. */
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
      throw new RewindError('invalid-argument', `${field} must be a non-empty string`)
    }
    return value.trim()
  }

  /** Validate one compare-and-set revision. */
  private requireRevision(value: number, field: string): number {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new RewindError('invalid-argument', `${field} must be a positive safe integer`)
    }
    return value
  }
}

export default RewindService
