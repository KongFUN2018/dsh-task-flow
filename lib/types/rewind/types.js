/**
 * Types of the rewind service (`ctx.rewind`): the impact preview, the
 * command error ladder, and the applied outcome. Types only — no runtime
 * code.
 * @module @deepseek-ai/dsh-rewind/types
 */
/** The decision options of one rewind item. */
export const REWIND_OPTIONS = ['confirm-rewind', 'keep-current', 'cancel'];
/** Rewind failure with code and message. */
export class RewindError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
//# sourceMappingURL=types.js.map