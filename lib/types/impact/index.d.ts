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
import { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { TaskMutationContext } from '../task/types.ts';
import type { ImpactSnapshot } from '../deliverable/types.ts';
import type { ImpactApplication } from './types.ts';
export type * from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        impactPropagation: ImpactPropagationService;
    }
}
/**
 * Impact-propagation service: composes the frozen task commands over one
 * snapshot; owns no durable state of its own.
 */
export declare class ImpactPropagationService extends TypertRemoteService {
    /** The service drives the task plane through the deliverable and task services. */
    static inject: string[];
    /**
     * @param ctx - Host context carrying deliverables, tasks, and the workbench journal.
     */
    constructor(ctx: Context);
    /**
     * Apply one impact snapshot to the task plane. Phase runs the snapshot
     * covers move into terminal `stale` (already-stale runs are skipped), then
     * the covered gate verdicts are annotated stale. The engine wakes on the
     * committed phase-run changes and re-opens covered phases as new runs.
     * @param snapshot - the impact snapshot `invalidateDownstream` returned.
     * @param mutation - actor, reason, idempotency key of the applying flow.
     * @returns the task-plane writes this call performed.
     */
    apply(snapshot: ImpactSnapshot, mutation: TaskMutationContext): Promise<ImpactApplication>;
}
export default ImpactPropagationService;
//# sourceMappingURL=index.d.ts.map