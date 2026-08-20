/**
 * Review-policy service (`ctx.reviewPolicy`): the M5 trust tiers, the
 * deferred-batch-confirm read the gate service consults, the completion
 * guards that keep unsigned B items and suspended rewind decisions from
 * completing a task, and the repair-fuse breaker that parks a task behind a
 * recovery decision after consecutive failed A repairs hit the recipe's
 * explicit cap.
 * @module @deepseek-ai/dsh-review-policy
 */
import { Context, Service } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { ReviewPolicyRecord, TrustTier } from './types.ts';
export type * from './types.ts';
export { ReviewPolicyRecordId } from './runtime.ts';
export { reviewPolicyDomainSpec, reviewPolicyRecordSchema, breakerCounterSchema } from './spec.ts';
export { ReviewPolicyError } from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        reviewPolicy: ReviewPolicyService;
    }
}
/**
 * Review-policy service: trust tiers, completion guards, and repair fuses.
 */
export declare class ReviewPolicyService extends TypertRemoteService {
    /** The service owns its domain, appends facts, registers guards, and parks phase runs. */
    static inject: string[];
    private tiers?;
    private breakers?;
    /** Serializes read-validate-write mutations so concurrent writers never interleave. */
    private mutationTail;
    /** Disposers for the two completion guards; released on dispose. */
    private readonly guardDisposers;
    /**
     * @param ctx - Host context carrying storage, journal, task, attention, and recipe services.
     */
    constructor(ctx: Context);
    /** Open the domain, watch gate verdicts, and register the completion guards. */
    protected [Service.init](): Promise<void>;
    /**
     * Set one task's trust tier; unprovisioned tasks read as strict.
     * @param taskId - the task whose tier changes.
     * @param tier - the new tier.
     * @param actor - setting actor.
     * @param idempotencyKey - caller-owned replay key.
     * @returns the stored tier record.
     */
    setTier(taskId: string, tier: TrustTier, actor: string, idempotencyKey: string): Promise<ReviewPolicyRecord>;
    /**
     * Read one task's tier.
     * @param taskId - the task to read.
     * @returns the stored tier, or strict when unprovisioned.
     */
    getTier(taskId: string): TrustTier;
    /**
     * The gate service's read: whether B-class batch confirmation may run
     * ahead (trusted tier only). C-class checks always block.
     * @param taskId - the task being gated.
     * @returns true only when the task runs the trusted tier.
     */
    defersBatchConfirm(taskId: string): boolean;
    /**
     * Land one resolved breaker decision on the task plane: continue-repair
     * resets the counter and resumes the parked run; pause and cancel route to
     * the task commands; patch only journals the choice.
     * @param itemId - the resolved breaker-tripped item.
     * @param phaseRunRevision - the parked phase run's revision the caller read.
     * @param actor - landing actor.
     * @param idempotencyKey - caller-owned replay key.
     */
    applyBreakerDecision(itemId: string, phaseRunRevision: number, actor: string, idempotencyKey: string): Promise<void>;
    /** Fold one recorded verdict into its breaker counter and maybe trip the fuse. */
    /** Completion veto: unsigned B-class confirmations of this task block completion. */
    private vetoOpenBatchConfirms;
    /** Completion veto: an open rewind decision of this task suspends completion. */
    private vetoOpenRewindDecisions;
    private observeVerdict;
    private countVerdict;
    /** Reset one breaker counter after a continue-repair decision. */
    private resetCounter;
    private setTierNow;
    private breakerKey;
    /** Append one review-policy fact; the journal's durable write is the commit point. */
    private appendFact;
    private requireTaskId;
    /** Validate one non-empty wire field, returning the trimmed value. */
    private requireText;
    /** Validate one compare-and-set revision. */
    private requireRevision;
    private requireTiers;
    private requireBreakers;
}
export default ReviewPolicyService;
//# sourceMappingURL=index.d.ts.map