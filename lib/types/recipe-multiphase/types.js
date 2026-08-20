/**
 * Type surface of the per-kind executor registry: machine-routable failure
 * codes and the registry error.
 * @module @deepseek-ai/dsh-recipe-multiphase/types
 */
/** Registry failure with a code and message. */
export class RecipeMultiphaseError extends Error {
    /**
     * @param code - Machine-routable failure code.
     * @param message - Human-readable failure description.
     */
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'RecipeMultiphaseError';
    }
}
//# sourceMappingURL=types.js.map