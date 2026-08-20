/**
 * Type surface of the recipe engine core: the contributed phase-executor
 * seam, the durable phase-session binding, and engine failure codes.
 * @module @deepseek-ai/dsh-recipe-engine-core/types
 */
/** Engine failure with code and message. */
export class RecipeEngineError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'RecipeEngineError';
    }
}
//# sourceMappingURL=types.js.map