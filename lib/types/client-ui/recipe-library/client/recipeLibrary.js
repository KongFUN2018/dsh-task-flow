import { createSnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
/**
 * Number of distinct deliverable outputs across every phase of a recipe.
 * @param recipe - the revision whose outputs to count.
 * @returns count of unique output names across all phases.
 */
function deliverableCount(recipe) {
    const outputs = new Set();
    for (const phase of recipe.payload.phases) {
        for (const output of phase.outputs)
            outputs.add(output);
    }
    return outputs.size;
}
/**
 * One-line description: the leading phase goals, joined. The catalogue has no
 * dedicated description field; the phase goals are the recipe's plain-text
 * intent, so the card summarizes the first few.
 * @param recipe - the revision whose goals drive the description.
 * @returns a compact summary of the leading phase goals.
 */
function describe(recipe) {
    const goals = recipe.payload.phases.map(phase => phase.goal);
    const trimmed = goals.length > 3 ? [...goals.slice(0, 3), '…'] : goals;
    return trimmed.join(' · ');
}
/**
 * Derive the flat card view of one recipe revision.
 * @param recipe - the loaded immutable revision.
 * @returns the renderable card for the library grid.
 */
function cardOf(recipe) {
    return {
        recipeId: String(recipe.recipeId),
        phases: recipe.payload.phases.length,
        checks: recipe.payload.gateChecks.length,
        deliverables: deliverableCount(recipe),
        description: describe(recipe),
    };
}
/**
 * The library's state owner. Created once per plugin fiber in `apply`; the
 * snapshot store it exposes is the inject `hooks` source, so components
 * subscribe through the renderer-bound hook and never see this object.
 */
export class RecipeLibraryController {
    /**
     * @param ctx - owning client root context; subscriptions and refreshes ride
     * this fiber's lifetime.
     */
    constructor(ctx) {
        this.ctx = ctx;
        this.store = createSnapshotStore({ status: 'loading', cards: [], updatedAt: 0 });
        // A reconnect may have missed the catalogue's state; the recipes Remote is
        // authoritative, so resync from it instead of trusting cached cards.
        ctx.on('connection/reset', () => { void this.refresh(); });
        void this.refresh();
    }
    /**
     * Reload the recipe catalogue from the recipes Remote and derive the cards.
     * @returns when the load settles; failures land in the state's error.
     */
    async refresh() {
        const result = await this.ctx.remote.recipes.listDetails();
        if (!result.ok) {
            this.store.set({ ...this.store.getSnapshot(), status: 'failed', cards: [], error: result.error.code, updatedAt: Date.now() });
            return;
        }
        this.store.set({ status: 'ready', cards: result.value.map(cardOf), error: undefined, updatedAt: Date.now() });
    }
    /**
     * Create a new recipe family and refresh the catalogue.
     * @param recipeId - the family id.
     * @param payload - the revision-1 payload.
     * @returns whether the create settled successfully.
     */
    async createRecipe(recipeId, payload) {
        const result = await this.ctx.remote.recipes.createRecipe(recipeId.trim(), payload);
        if (result.ok)
            await this.refresh();
        return result;
    }
    /**
     * Update one recipe family (new immutable revision) and refresh.
     * @param recipeId - the family id.
     * @param payload - the replacement payload.
     * @returns whether the update settled successfully.
     */
    async updateRecipe(recipeId, payload) {
        const result = await this.ctx.remote.recipes.updateRecipe(recipeId.trim(), payload);
        if (result.ok)
            await this.refresh();
        return result;
    }
    /**
     * Soft-delete one recipe family and refresh.
     * @param recipeId - the family id.
     * @returns whether the delete settled successfully.
     */
    async deleteRecipe(recipeId) {
        const result = await this.ctx.remote.recipes.deleteRecipe(recipeId.trim());
        if (result.ok)
            await this.refresh();
        return result;
    }
}
//# sourceMappingURL=recipeLibrary.js.map