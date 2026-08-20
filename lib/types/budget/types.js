/**
 * Types of the task budget ledger (`ctx.budget`): the durable record, the
 * explicit limits, the usage intake, and the command error ladder. Types
 * only — no runtime code.
 * @module @deepseek-ai/dsh-budget/types
 */
/** Budget failure with code and message. */
export class BudgetError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
//# sourceMappingURL=types.js.map