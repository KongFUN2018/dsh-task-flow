/**
 * Workbench journal type surface: the frozen top-level fact fields, the
 * append input, checkpoint and replay wire values, and failures. Per-kind
 * payload schemas are owned by the entity packages that append each kind;
 * this envelope validates only structure and JSON serializability. Types
 * only �?no runtime code.
 * @module @deepseek-ai/dsh-workbench-journal/types
 */
/** Journal failure with code and message. */
export class JournalError extends Error {
    /** Machine-routable failure code. */
    code;
    /**
     * @param code - Machine-routable failure code.
     * @param message - Human-readable failure description.
     */
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'JournalError';
    }
}
//# sourceMappingURL=types.js.map