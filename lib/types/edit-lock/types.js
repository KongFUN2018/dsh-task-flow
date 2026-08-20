/**
 * Edit-lock type surface: the durable lease record and its failure codes.
 * Types only — no runtime code.
 * @module @deepseek-ai/dsh-edit-lock/types
 */
/** Edit-lock failure with a code and, for lock conflicts, the holder. */
export class EditLockError extends Error {
    /**
     * @param code - Machine-routable failure code.
     * @param message - Human-readable failure description.
     * @param holder - Current holder for `lock-held`.
     * @param expiresAt - Current expiry for `lock-held`.
     */
    constructor(code, message, holder, expiresAt) {
        super(message);
        this.code = code;
        if (holder !== undefined)
            this.holder = holder;
        if (expiresAt !== undefined)
            this.expiresAt = expiresAt;
        this.name = 'EditLockError';
    }
}
//# sourceMappingURL=types.js.map