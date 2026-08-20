/**
 * Rewind service (`ctx.rewind`): the M5 branch-abandonment flow. A rewind
 * request computes the deliverable impact closure, persists the preview on
 * the decision item (the first `impactSnapshot` writer), and only a resolved
 * `confirm-rewind` outcome creates the new task run — superseding every phase
 * run of the retired branch. Declined outcomes keep the task plane untouched:
 * the upstream edit already staled the versions it staled.
 * @module @deepseek-ai/dsh-rewind
 */
import { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { RewindApplication, RewindPreview } from './types.ts';
export type * from './types.ts';
export { RewindError, REWIND_OPTIONS } from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        rewind: RewindService;
    }
}
/**
 * Rewind service: preview-through-decision branch replacement.
 */
export declare class RewindService extends TypertRemoteService {
    /** The service reads deliverable closures, writes task branches, and files decisions. */
    static inject: string[];
    /** Serializes read-validate-write mutations so concurrent writers never interleave. */
    private mutationTail;
    /**
     * @param ctx - Host context carrying deliverables, tasks, attention, and the journal.
     */
    constructor(ctx: Context);
    /**
     * Request one rewind: compute the impact closure, persist the preview, and
     * open the decision item. No task-plane write happens before the decision.
     * @param taskId - the task whose branch the rewind would replace.
     * @param rootVersionIds - the deliverable versions the upstream edit staled.
     * @param actor - requesting actor.
     * @param idempotencyKey - caller-owned replay key.
     * @returns the open rewind decision item.
     */
    requestRewind(taskId: string, rootVersionIds: string[], actor: string, idempotencyKey: string): Promise<RewindPreview & {
        itemId: string;
    }>;
    /**
     * Apply one resolved rewind decision: create the successor run, supersede
     * the retired branch's phase runs, and journal the branch fact.
     * @param itemId - the resolved rewind decision item.
     * @param taskRevision - the task revision the caller read.
     * @param actor - applying actor.
     * @param idempotencyKey - caller-owned replay key.
     * @returns the new run and the retired phase runs.
     */
    applyRewind(itemId: string, taskRevision: number, actor: string, idempotencyKey: string): Promise<RewindApplication>;
    private requestNow;
    private applyNow;
    /** Append one rewind fact; the journal's durable write is the commit point. */
    private appendFact;
    private requireTaskId;
    /** Validate one non-empty wire field, returning the trimmed value. */
    private requireText;
    /** Validate one compare-and-set revision. */
    private requireRevision;
}
export default RewindService;
//# sourceMappingURL=index.d.ts.map