/**
 * Recipe library object layer: a React-free controller that loads the recipe
 * catalogue through the recipes Remote and derives the flat card view (name,
 * phase/check/deliverable counts, description) the component renders. The
 * recipes Remote stays authoritative; a failed load lands in the snapshot's
 * error state and the library re-reads on connection reset.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol';
import type { RecipePayload, RecipeRevision } from '../../../recipe/types.ts';
/** Lifecycle of the recipe-catalogue load. */
export type RecipeLibraryStatus = 'loading' | 'ready' | 'failed';
/** Flat, renderable card view derived from one immutable recipe revision. */
export interface RecipeCard {
    /** Recipe identity; the recipe family name (there is no separate title). */
    readonly recipeId: string;
    /** Number of declared phases. */
    readonly phases: number;
    /** Number of declared gate checks. */
    readonly checks: number;
    /** Number of distinct deliverable outputs across the phases. */
    readonly deliverables: number;
    /** One-line human description derived from the phase goals. */
    readonly description: string;
}
/** Snapshot state the recipe library renders. */
export interface RecipeLibraryState {
    /** Load status of the recipe catalogue. */
    readonly status: RecipeLibraryStatus;
    /** Flat card views over the loaded revisions, in registration order. */
    readonly cards: readonly RecipeCard[];
    /** Failure code of the last failed load, shown until the next success. */
    readonly error?: string | undefined;
    /** Epoch ms of the last successful load. */
    readonly updatedAt: number;
}
/**
 * The library's state owner. Created once per plugin fiber in `apply`; the
 * snapshot store it exposes is the inject `hooks` source, so components
 * subscribe through the renderer-bound hook and never see this object.
 */
export declare class RecipeLibraryController {
    /** The library's snapshot source; flat recipe cards plus load state. */
    readonly store: SnapshotStore<RecipeLibraryState>;
    private readonly ctx;
    /**
     * @param ctx - owning client root context; subscriptions and refreshes ride
     * this fiber's lifetime.
     */
    constructor(ctx: ClientContext);
    /**
     * Reload the recipe catalogue from the recipes Remote and derive the cards.
     * @returns when the load settles; failures land in the state's error.
     */
    refresh(): Promise<void>;
    /**
     * Create a new recipe family and refresh the catalogue.
     * @param recipeId - the family id.
     * @param payload - the revision-1 payload.
     * @returns whether the create settled successfully.
     */
    createRecipe(recipeId: string, payload: RecipePayload): Promise<RemoteResult<RecipeRevision>>;
    /**
     * Update one recipe family (new immutable revision) and refresh.
     * @param recipeId - the family id.
     * @param payload - the replacement payload.
     * @returns whether the update settled successfully.
     */
    updateRecipe(recipeId: string, payload: RecipePayload): Promise<RemoteResult<RecipeRevision>>;
    /**
     * Soft-delete one recipe family and refresh.
     * @param recipeId - the family id.
     * @returns whether the delete settled successfully.
     */
    deleteRecipe(recipeId: string): Promise<RemoteResult<boolean>>;
}
//# sourceMappingURL=recipeLibrary.d.ts.map