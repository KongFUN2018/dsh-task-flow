/**
 * Immutable recipe revision registry (`ctx.recipes`): validated payloads,
 * content-addressed revisions, pinned-identity reads with hash verification,
 * and the built-in empty-template revision for new tasks. Storage is
 * in-memory in M1 — the filesystem provider registers real recipes later,
 * and the registry surface does not change.
 * @module @deepseek-ai/dsh-recipe
 */
import { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { RecipeIdentity, RecipePayload, RecipeRevision } from './types.ts';
export type * from './types.ts';
export { RecipeError } from './types.ts';
export { RecipeId } from './runtime.ts';
export { EMPTY_TEMPLATE, EMPTY_TEMPLATE_RECIPE_ID } from './empty-template.ts';
export { BUGFIX_RECIPE_ID, BUGFIX_TEMPLATE, CODE_REVIEW_RECIPE_ID, CODE_REVIEW_TEMPLATE, REQUIREMENT_RECIPE_ID, REQUIREMENT_TEMPLATE, } from './seed-templates.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        recipes: RecipeRegistry;
    }
}
/**
 * Registry-level validation of one revision payload.
 * @param payload - the candidate revision payload.
 * @returns problem descriptions; empty when the payload is valid.
 */
export declare function validateRecipePayload(payload: RecipePayload): string[];
/**
 * Content hash of one revision payload, stable over JSON key order.
 * @param payload - the canonical revision payload.
 * @returns the lowercase hex sha256 digest.
 */
export declare function hashRecipePayload(payload: RecipePayload): string;
/**
 * Fail loud when a stored revision's hash no longer matches its payload.
 * Pure and exported so both `getPinned` and the unit suite exercise the
 * corruption path directly.
 * @param revision - the stored revision under verification.
 */
export declare function verifyRecipeHash(revision: RecipeRevision): void;
/** Immutable recipe revision registry. */
export declare class RecipeRegistry extends TypertRemoteService {
    private readonly revisions;
    constructor(ctx: Context);
    /**
     * Register one immutable revision; the same payload under the same identity
     * is idempotent, a different payload under a taken identity fails. The id is
     * trimmed to its canonical form before keying, so padded spellings of one id
     * address the same revision.
     * @param recipeId - recipe identifier; surrounding whitespace is trimmed.
     * @param revision - positive revision number.
     * @param payload - canonical revision payload.
     * @returns the stored revision.
     */
    register(recipeId: string, revision: number, payload: RecipePayload): RecipeRevision;
    /**
     * Read one pinned identity, verifying the stored hash against the payload.
     * @param identity - recipe id plus exact revision; the id is trimmed to the
     * canonical form before keying, matching `register`.
     * @returns the stored revision.
     */
    getPinned(identity: RecipeIdentity): RecipeRevision;
    /**
     * Highest registered revision of one recipe; new-task creation only.
     * @param recipeId - recipe identifier; surrounding whitespace is trimmed.
     * @returns the latest revision, or `undefined` when the recipe is unknown.
     */
    latest(recipeId: string): RecipeRevision | undefined;
    /**
     * Every registered identity, for registry inspection.
     * @returns identity list ordered by registration.
     */
    list(): RecipeIdentity[];
    /**
     * Every recipe's latest revision with its full payload, for the task-creation
     * wizard's linked phase preview. One read per recipe, newest revision wins.
     * @returns latest revisions ordered by registration.
     */
    listDetails(): RecipeRevision[];
}
export default RecipeRegistry;
//# sourceMappingURL=index.d.ts.map