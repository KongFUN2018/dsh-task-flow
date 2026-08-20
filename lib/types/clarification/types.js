/**
 * Clarification type surface: persistent question/answer requests over one
 * phase run, with idempotent partial answers and injected-answer recovery.
 * Types only — no runtime code.
 * @module @deepseek-ai/dsh-clarification/types
 */
/** A validation, lookup, or idempotency-conflict failure. */
export class ClarificationError extends Error {
    /** The machine-routable failure code. */
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'ClarificationError';
    }
}
//# sourceMappingURL=types.js.map