/**
 * Types of the review-policy service (`ctx.reviewPolicy`): trust tiers, the
 * breaker counter, and the command error ladder. Types only — no runtime
 * code.
 * @module @deepseek-ai/dsh-review-policy/types
 */
import type { Branded } from '@deepseek-ai/dsh-brand';
import type { TaskId } from '../task/types.ts';
/** One review-policy record identity. */
export type ReviewPolicyRecordId = Branded<'ReviewPolicyRecordId'>;
/** The three trust tiers; `balanced` currently behaves as `strict` (uncalibrated). */
export type TrustTier = 'strict' | 'balanced' | 'trusted';
/** One durable per-task tier record. */
export interface ReviewPolicyRecord {
    readonly recordId: ReviewPolicyRecordId;
    readonly taskId: TaskId;
    readonly tier: TrustTier;
    readonly revision: number;
}
/** One breaker counter, keyed by task and check. */
export interface BreakerCounter {
    readonly taskId: TaskId;
    readonly checkId: string;
    /** Consecutive failed A repairs at this counter. */
    readonly consecutiveFailures: number;
    /** Increments every time the fuse trips or resets. */
    readonly revision: number;
}
/** Machine-routable review-policy failure codes. */
export type ReviewPolicyErrorCode = 'not-found' | 'invalid-argument' | 'stale-revision' | 'invalid-transition' | 'not-resolved' | 'invalid-option';
/** Review-policy failure with code and message. */
export declare class ReviewPolicyError extends Error {
    /** Machine-routable failure code. */
    readonly code: ReviewPolicyErrorCode;
    constructor(code: ReviewPolicyErrorCode, message: string);
}
//# sourceMappingURL=types.d.ts.map