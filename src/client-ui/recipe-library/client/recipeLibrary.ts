/**
 * Recipe library object layer: a React-free controller that loads the recipe
 * catalogue through the recipes Remote and derives the flat card view (name,
 * phase/check/deliverable counts, description) the component renders. The
 * recipes Remote stays authoritative; a failed load lands in the snapshot's
 * error state and the library re-reads on connection reset.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { createSnapshotStore, type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the generated recipes Remote namespace into this compilation program.
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type { RecipeRevision } from '../../../recipe/types.ts'

/** Lifecycle of the recipe-catalogue load. */
export type RecipeLibraryStatus = 'loading' | 'ready' | 'failed'

/** Flat, renderable card view derived from one immutable recipe revision. */
export interface RecipeCard {
  /** Recipe identity; the recipe family name (there is no separate title). */
  readonly recipeId: string
  /** Number of declared phases. */
  readonly phases: number
  /** Number of declared gate checks. */
  readonly checks: number
  /** Number of distinct deliverable outputs across the phases. */
  readonly deliverables: number
  /** One-line human description derived from the phase goals. */
  readonly description: string
}

/** Snapshot state the recipe library renders. */
export interface RecipeLibraryState {
  /** Load status of the recipe catalogue. */
  readonly status: RecipeLibraryStatus
  /** Flat card views over the loaded revisions, in registration order. */
  readonly cards: readonly RecipeCard[]
  /** Failure code of the last failed load, shown until the next success. */
  readonly error?: string | undefined
  /** Epoch ms of the last successful load. */
  readonly updatedAt: number
}

/**
 * Number of distinct deliverable outputs across every phase of a recipe.
 * @param recipe - the revision whose outputs to count.
 * @returns count of unique output names across all phases.
 */
function deliverableCount(recipe: RecipeRevision): number {
  const outputs = new Set<string>()
  for (const phase of recipe.payload.phases) {
    for (const output of phase.outputs) outputs.add(output)
  }
  return outputs.size
}

/**
 * One-line description: the leading phase goals, joined. The catalogue has no
 * dedicated description field; the phase goals are the recipe's plain-text
 * intent, so the card summarizes the first few.
 * @param recipe - the revision whose goals drive the description.
 * @returns a compact summary of the leading phase goals.
 */
function describe(recipe: RecipeRevision): string {
  const goals = recipe.payload.phases.map(phase => phase.goal)
  const trimmed = goals.length > 3 ? [...goals.slice(0, 3), '…'] : goals
  return trimmed.join(' · ')
}

/**
 * Derive the flat card view of one recipe revision.
 * @param recipe - the loaded immutable revision.
 * @returns the renderable card for the library grid.
 */
function cardOf(recipe: RecipeRevision): RecipeCard {
  return {
    recipeId: String(recipe.recipeId),
    phases: recipe.payload.phases.length,
    checks: recipe.payload.gateChecks.length,
    deliverables: deliverableCount(recipe),
    description: describe(recipe),
  }
}

/**
 * The library's state owner. Created once per plugin fiber in `apply`; the
 * snapshot store it exposes is the inject `hooks` source, so components
 * subscribe through the renderer-bound hook and never see this object.
 */
export class RecipeLibraryController {
  /** The library's snapshot source; flat recipe cards plus load state. */
  readonly store: SnapshotStore<RecipeLibraryState>

  private readonly ctx: ClientContext

  /**
   * @param ctx - owning client root context; subscriptions and refreshes ride
   * this fiber's lifetime.
   */
  constructor(ctx: ClientContext) {
    this.ctx = ctx
    this.store = createSnapshotStore<RecipeLibraryState>({ status: 'loading', cards: [], updatedAt: 0 })
    // A reconnect may have missed the catalogue's state; the recipes Remote is
    // authoritative, so resync from it instead of trusting cached cards.
    ctx.on('connection/reset', () => { void this.refresh() })
    void this.refresh()
  }

  /**
   * Reload the recipe catalogue from the recipes Remote and derive the cards.
   * @returns when the load settles; failures land in the state's error.
   */
  async refresh(): Promise<void> {
    const result = await this.ctx.remote.recipes.listDetails()
    if (!result.ok) {
      this.store.set({ ...this.store.getSnapshot(), status: 'failed', cards: [], error: result.error.code, updatedAt: Date.now() })
      return
    }
    this.store.set({ status: 'ready', cards: result.value.map(cardOf), error: undefined, updatedAt: Date.now() })
  }
}
