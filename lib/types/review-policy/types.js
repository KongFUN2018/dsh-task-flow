/**
 * Types of the review-policy service (`ctx.reviewPolicy`): trust tiers, the
 * breaker counter, and the command error ladder. Types only — no runtime
 * code.
 * @module @deepseek-ai/dsh-review-policy/types
 */
/** Review-policy failure with code and message. */
export class ReviewPolicyError extends Error {
    /** Machine-routable failure code. */
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
//# sourceMappingURL=types.js.map