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
import { Context, Service } from '@deepseek-ai/cordis';
import '../task/index.ts';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import '../workbench/journal/index.ts';
import type { AttentionItem, ConfirmResult, ConfirmTarget, CreateItemInput, DecisionResult, InvalidateResult } from './types.ts';
export type * from './types.ts';
export { AttentionItemId } from './runtime.ts';
export { attentionDomainSpec, attentionItemSchema, itemKeySchema } from './spec.ts';
export type { ItemKeyEntry } from './spec.ts';
export { AttentionError } from './runtime.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        attention: AttentionService;
    }
}
/**
 * Attention service: the M4 persistent-decision domain, with idempotent
 * item creation, optimistic decision and batch-confirm commands, and
 * upstream invalidation.
 */
export declare class AttentionService extends TypertRemoteService {
    /** The service opens its domain, appends facts, and reads/writes phase runs. */
    static inject: string[];
    private items?;
    private itemKeys?;
    /** Serializes read-validate-write mutations so concurrent writers never interleave. */
    private mutationTail;
    /**
     * @param ctx - Host context carrying storage, journal, and task services.
     */
    constructor(ctx: Context);
    /** Open and own the attention domain. */
    protected [Service.init](): Promise<void>;
    /**
     * Create one attention item. Idempotent: replaying a caller key returns
     * the stored item; a replay with a different itemId fails loud.
     * @param input - the item fields; `itemId` is caller-supplied and stable.
     * @param actor - the actor opening the item.
     * @param idempotencyKey - caller-owned replay key.
     * @returns the stored item.
     */
    createItem(input: CreateItemInput, actor: string, idempotencyKey: string): Promise<AttentionItem>;
    /**
     * List every open item, in open order.
     * @returns the open items.
     */
    listOpen(): AttentionItem[];
    /**
     * Read one attention item.
     * @param itemId - the item identity.
     * @returns the item, or undefined when unknown.
     */
    getItem(itemId: string): AttentionItem | undefined;
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
    resolveDecision(itemId: string, expectedEntityRevision: number, optionId: string, actor: string, idempotencyKey: string): Promise<DecisionResult>;
    /**
     * Confirm a batch of B-class items in one pass: every still-open
     * revision-matching item resolves, and each target reports its own outcome.
     * @param targets - the compare-and-set targets.
     * @param actor - the confirming actor.
     * @param idempotencyKey - caller-owned replay key.
     * @returns per-item results, in request order.
     */
    confirmBatch(targets: ConfirmTarget[], actor: string, idempotencyKey: string): Promise<ConfirmResult[]>;
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
    invalidateItem(itemId: string, expectedEntityRevision: number, reason: string, actor: string, idempotencyKey: string): Promise<InvalidateResult>;
    private createItemNow;
    private resolveNow;
    private confirmBatchNow;
    private invalidateNow;
    /**
     * Resume one phase run out of awaiting-decision when every item naming it
     * settled (resolved or invalidated). A run still awaiting a decision stays
     * parked; a concurrent transition owns the run and this becomes a no-op.
     * @param phaseRunId - the phase run the settled items name, when any.
     */
    private resumeIfAllSettled;
    /** Validate and normalize one create-item input. */
    private normalizeInput;
    /** Append one attention fact; the journal's durable write is the commit point. */
    private appendFact;
    /** Validate one non-empty wire field, returning the trimmed value. */
    private requireText;
    /** Validate one compare-and-set revision. */
    private requireRevision;
    private requireItems;
    private requireItemKeys;
}
export default AttentionService;
//# sourceMappingURL=index.d.ts.map