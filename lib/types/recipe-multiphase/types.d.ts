/**
 * Type surface of the per-kind executor registry: machine-routable failure
 * codes and the registry error.
 * @module @deepseek-ai/dsh-recipe-multiphase/types
 */
/** Machine-routable registry failure codes. */
export type RecipeMultiphaseErrorCode = 'invalid-kind' | 'duplicate-kind' | 'no-executor';
/** Registry failure with a code and message. */
export declare class RecipeMultiphaseError extends Error {
    /** Machine-routable failure code. */
    readonly code: RecipeMultiphaseErrorCode;
    /**
     * @param code - Machine-routable failure code.
     * @param message - Human-readable failure description.
     */
    constructor(code: RecipeMultiphaseErrorCode, message: string);
}
//# sourceMappingURL=types.d.ts.map