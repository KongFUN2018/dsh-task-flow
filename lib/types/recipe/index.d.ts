/**
 * Immutable recipe revision registry (`ctx.recipes`): validated payloads,
 * content-addressed revisions, pinned-identity reads with hash verification,
 * and the built-in empty-template revision for new tasks. Storage is
 * in-memory in M1 — the filesystem provider registers real recipes later,
 * and the registry surface does not change.
 * @module @deepseek-ai/dsh-recipe
 */
import { Context, Service } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { RecipeIdentity, RecipePayload, RecipeRevision } from './types.ts';
export type * from './types.ts';
export { RecipeError } from './types.ts';
export { RecipeId } from './runtime.ts';
export { recipeStoreDomainSpec } from './spec.ts';
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
/**
 * Immutable recipe revision registry (`ctx.recipes`): validated payloads,
 * content-addressed revisions, pinned-identity reads with hash verification,
 * and a durable recipe catalogue with create/update/delete management. The
 * in-process Map stays the synchronous read authority; when a `storageDomain`
 * backend is mounted the registry additionally persists every revision and the
 * soft-delete markers into a `recipe_store` domain, reloading them on init and
 * writing through on every mutation. Without a backend (pure unit contexts) it
 * degrades to the M1 in-memory registry, so isolated suites keep constructing
 * `new RecipeRegistry(ctx)` untouched.
 */
export declare class RecipeRegistry extends TypertRemoteService {
    private readonly revisions;
    /** recipeId -> disabled marker (present means soft-deleted). */
    private readonly disabled;
    /** Identity table opened from the recipe-store domain when present. */
    private revisionsTable;
    private metaTable;
    constructor(ctx: Context);
    /**
     * Open the durable store (when a backend is mounted) and reconcile the
     * in-memory registry with the persisted revisions and soft-delete markers.
     * The built-in templates are seeded in the constructor into memory (before
     * the store opens), so after a restart they are present immediately and are
     * canonical seeds — persisted CRUD revisions (create/update) add to them.
     *
     * No write-through of the built-ins happens here: they are single-source
     * shipped seeds re-registered on every boot, and re-writing revision 1 on
     * top of an existing persisted family would just duplicate the same row, so
     * only user-authored create/update revisions are durably written.
     */
    protected [Service.init](): Promise<void>;
    /** Reconcile in-memory registry with the durable store. */
    private loadFromStorage;
    /** Seed the built-in templates for recipe families absent after a restart. */
    private seedBuiltins;
    /** Persist one revision write through to the durable store (best-effort). */
    private persistRevision;
    /** Persist one revision write and settle on durability (CRUD surface). */
    private persistRevisionAwaited;
    /** Persist the soft-delete marker through to the durable store. */
    private persistDisabledAwaited;
    /** Clear the soft-delete marker and settle on durability (CRUD surface). */
    private persistEnabledAwaited;
    /** Recipe families shipped with the package; these cannot be deleted. */
    private isBuiltin;
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
     * Create a brand-new recipe family at revision 1. The id must currently be
     * pickable (absent from the visible catalogue); re-creating a soft-deleted
     * recipe is allowed and clears its delete marker.
     * @param recipeId - recipe identifier; surrounding whitespace is trimmed.
     * @param payload - canonical revision payload, validated like `register`.
     * @returns the stored revision (revision 1).
     */
    createRecipe(recipeId: string, payload: RecipePayload): Promise<RecipeRevision>;
    /**
     * Update one recipe family by registering a new immutable revision at
     * `latest + 1`; older revisions stay addressable so in-flight tasks never
     * repoint. Re-creating a revision-equivalent newest payload is allowed
     * (idempotent), a conflicting payload under that new identity fails.
     * Built-in templates may be overridden here (a new revision shadows the
     * shipped seed) even though they cannot be deleted — override, not removal.
     * @param recipeId - recipe identifier; surrounding whitespace is trimmed.
     * @param payload - the replacement revision payload.
     * @returns the newly stored revision.
     */
    updateRecipe(recipeId: string, payload: RecipePayload): Promise<RecipeRevision>;
    /**
     * Soft-delete one recipe family: it leaves the pickable catalogue but its
     * revisions remain physically present, so a task that already pinned one
     * still satisfies `getPinned`. Built-in templates cannot be removed.
     * @param recipeId - recipe identifier; surrounding whitespace is trimmed.
     * @returns `true` when the family existed and was removed from the
     * pickable set, `false` when no visible recipe family matches.
     */
    deleteRecipe(recipeId: string): Promise<boolean>;
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
     * Every pickable (non-disabled) identity, for registry inspection and the
     * task-creation picker.
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