/**
 * Task-flow task type surface: branded identities, pinned-recipe projections,
 * the PhaseSubmission record, mutation context, gate results, failures, and
 * the forwarded update events. Types only �?no runtime code.
 * @module @deepseek-ai/dsh-task/types
 */
/** Task failure with code, message, and optional rejection problems. */
export class TaskError extends Error {
    constructor(code, message, problems) {
        super(message);
        this.code = code;
        if (problems !== undefined)
            this.problems = problems;
        this.name = 'TaskError';
    }
}
//# sourceMappingURL=types.js.map