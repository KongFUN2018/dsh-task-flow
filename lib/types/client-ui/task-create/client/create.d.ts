/**
 * Task-creation object layer: a React-free controller that loads the recipe
 * catalogue through the recipes Remote, then creates a task through the
 * tasks Remote with a fresh idempotency key. The component reads only the
 * store snapshot and the command callback.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import type { RecipeRevision } from '../../../recipe/types.ts';
/** Lifecycle of the recipe-catalogue load. */
export type CreateStatus = 'loading' | 'ready' | 'failed';
/** Snapshot state the create panel renders. */
export interface CreateState {
    readonly status: CreateStatus;
    readonly recipes: readonly RecipeRevision[];
    /** Distinct workspace ids observed on existing tasks; the "known" options. */
    readonly workspaces: readonly string[];
    readonly error?: string | undefined;
}
/**
 * The create panel's state owner. Created once per plugin fiber in apply.
 */
export declare class TaskCreateController {
    /** The wizard's snapshot source; the recipe catalogue plus load state. */
    readonly store: SnapshotStore<CreateState>;
    private readonly ctx;
    constructor(ctx: ClientContext);
    /** Reload the recipe catalogue from the recipes Remote. */
    refresh(): Promise<void>;
    /**
     * Refresh the known-workspace candidates from the tasks catalogue. A
     * workspace is currently a free-text id on each task record (no dedicated
     * workspace domain), so "known" means every distinct workspaceId seen across
     * existing tasks, plus the conventional `default`.
     * @returns the distinct workspace id list, `default` first.
     */
    loadWorkspaces(): Promise<string[]>;
    /**
     * One-shot AI polish of the goal text through the host LLM.
     * @param goal - raw user-entered goal text.
     * @returns the clarified goal, or throws on failure (caller keeps the draft).
     */
    polish(goal: string): Promise<string>;
    /**
     * Create one task from the chosen recipe.
     * @param recipeId - the chosen recipe id, already in the catalogue.
     * @param workspaceId - the owning workspace.
     * @param actor - the creating actor.
     * @param goal - goal text; carried by the caller, not persisted here.
     * @returns the created task id.
     */
    create(recipeId: string, workspaceId: string, actor: string, goal: string): Promise<string>;
}
//# sourceMappingURL=create.d.ts.map