/**
 * Deliverable-local type surface: immutable version chains with registered
 * dependency edges, idempotent saves, and persisted impact snapshots — the
 * M2 evolution of the M1 wire contract (same service key, same three Remote
 * methods, evolved parameters and returns). Types only — no runtime code.
 * @module @deepseek-ai/dsh-deliverable-local/types
 */
/** Deliverable failure with code and message. */
export class DeliverableError extends Error {
    /**
     * @param code - Machine-routable failure code.
     * @param message - Human-readable failure description.
     */
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'DeliverableError';
    }
}
//# sourceMappingURL=types.js.map