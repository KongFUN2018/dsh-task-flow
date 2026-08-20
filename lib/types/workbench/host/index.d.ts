/**
 * Workbench attention-channel host service: the client-safe projection over
 * the M4 persistent attention inbox (`ctx.attention`). Snapshot reads project
 * open `AttentionItem`s into wire views; confirm/resolve/invalidate delegate
 * to the attention service's compare-and-set commands, so a stale, withdrawn,
 * resolved, or version-conflicted item is never silently confirmed. The
 * `workbench/attention-updated` event still broadcasts after a committed
 * change, and the snapshot version is the journal checkpoint seq.
 * @module @deepseek-ai/dsh-workbench-host
 */
import { Context } from '@deepseek-ai/cordis';
import '../../attention/index.ts';
import '../../workbench/journal/index.ts';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { BatchConfirmRequest, BatchConfirmResponse, InvalidateItemRequest, InvalidateItemResponse, ResolveDecisionRequest, ResolveDecisionResponse, WorkbenchSnapshot } from './types.ts';
export { WorkbenchItemId } from './runtime.ts';
export type * from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        workbenchHost: WorkbenchHostService;
    }
}
/**
 * Workbench attention inbox (`ctx.workbenchHost`): the M4 client-safe
 * projection over the persistent attention service.
 */
export declare class WorkbenchHostService extends TypertRemoteService {
    /** The service projects and delegates to the persistent attention service and reads the journal position. */
    static inject: string[];
    constructor(ctx: Context);
    /**
     * Read the whole open inbox with per-item compare-and-set revisions.
     * @returns the current snapshot.
     */
    listSnapshot(): WorkbenchSnapshot;
    /**
     * Confirm a batch of B-class items in one pass: every still-open
     * revision-matching item resolves, and each target reports its own outcome.
     * @param request - actor plus the compare-and-set targets.
     * @returns per-item results and the post-commit snapshot version.
     */
    confirmBatch(request: BatchConfirmRequest): Promise<BatchConfirmResponse>;
    /**
     * Resolve one C-class decision item; C items are never batched.
     * @param request - compare-and-set target plus the recorded decision text.
     * @returns the single-item outcome and the post-commit snapshot version.
     */
    resolveDecision(request: ResolveDecisionRequest): Promise<ResolveDecisionResponse>;
    /**
     * Invalidate one open item upstream: the stale-propagation trigger that
     * makes later confirms report `stale` instead of silently resolving.
     * @param request - compare-and-set target plus the recorded reason.
     * @returns the single-item outcome and the post-commit snapshot version.
     */
    invalidateItem(request: InvalidateItemRequest): Promise<InvalidateItemResponse>;
    /**
     * Resolve the snapshot version from the journal checkpoint and push the
     * change set when it is non-empty. Synchronous listener failures are
     * contained and logged so a committed change never looks failed.
     */
    private commit;
}
export default WorkbenchHostService;
//# sourceMappingURL=index.d.ts.map