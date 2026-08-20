/**
 * Impact propagation (`ctx.impactPropagation`): applies one deliverable-side
 * `ImpactSnapshot` to the task plane. The upstream-edit flow calls
 * `deliverables.invalidateDownstream` first, then `apply` here: covered
 * phase runs move into terminal `stale` through the task command (the
 * engine re-opens the phase as a new run and revoked passes are re-earned),
 * and covered gate verdicts are annotated stale so they support no pass
 * decision. The task commands own every journal fact this flow produces.
 * @module @deepseek-ai/dsh-impact-propagation
 */

import { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { TaskError } from '../task/index.ts'
import type { TaskMutationContext } from '../task/types.ts'
import type { GateCheckResult, PhaseRunRecord } from '../task/types.ts'
import type { ImpactSnapshot } from '../deliverable/types.ts'
import type { ImpactApplication } from './types.ts'

export type * from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    impactPropagation: ImpactPropagationService
  }
}

/**
 * Impact-propagation service: composes the frozen task commands over one
 * snapshot; owns no durable state of its own.
 */
export class ImpactPropagationService extends TypertRemoteService {
  /** The service drives the task plane through the deliverable and task services. */
  static inject = ['deliverables', 'tasks', 'workbenchJournal']

  /**
   * @param ctx - Host context carrying deliverables, tasks, and the workbench journal.
   */
  constructor(ctx: Context) {
    super(ctx, 'impactPropagation')
  }

  /**
   * Apply one impact snapshot to the task plane. Phase runs the snapshot
   * covers move into terminal `stale` (already-stale runs are skipped), then
   * the covered gate verdicts are annotated stale. The engine wakes on the
   * committed phase-run changes and re-opens covered phases as new runs.
   * @param snapshot - the impact snapshot `invalidateDownstream` returned.
   * @param mutation - actor, reason, idempotency key of the applying flow.
   * @returns the task-plane writes this call performed.
   */
  @Remote('apply')
  async apply(snapshot: ImpactSnapshot, mutation: TaskMutationContext): Promise<ImpactApplication> {
    const staledPhaseRuns: PhaseRunRecord[] = []
    for (const phaseRunId of snapshot.affectedPhaseRuns) {
      const run = await this.ctx.tasks.getPhaseRun(String(phaseRunId))
      if (run === undefined) {
        throw new TaskError('not-found', `snapshot covers phase run "${String(phaseRunId)}" which is not stored`)
      }
      if (run.state === 'stale') continue
      staledPhaseRuns.push(await this.ctx.tasks.markPhaseStale(String(phaseRunId), {
        ...mutation,
        expectedRevision: run.revision,
      }))
    }
    const staledGateChecks: GateCheckResult[] = []
    for (const group of snapshot.staledGateChecks) {
      const staled = await this.ctx.tasks.markGateChecksStale(String(group.submissionId), [...group.checkIds], mutation)
      staledGateChecks.push(...staled)
    }
    return { staledPhaseRuns, staledGateChecks }
  }
}

export default ImpactPropagationService
