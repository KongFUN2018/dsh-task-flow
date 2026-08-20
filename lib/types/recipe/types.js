/**
 * Type surface of the recipe registry: identity, the revision payload
 * vocabulary pinned by the task-flow M1 freeze, and the stored revision
 * record.
 * @module @deepseek-ai/dsh-recipe/types
 */
/** Registry failure with code, message, and optional payload problems. */
export class RecipeError extends Error {
    /** Machine-routable failure code. */
    code;
    /** Validation problem list; present for `invalid-payload` failures. */
    problems;
    constructor(code, message, problems) {
        super(message);
        this.code = code;
        if (problems !== undefined)
            this.problems = problems;
        this.name = 'RecipeError';
    }
}
//# sourceMappingURL=types.js.map