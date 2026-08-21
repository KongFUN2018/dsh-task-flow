/**
 * Task-creation object layer: a React-free controller that loads the recipe
 * catalogue through the recipes Remote, then creates a task through the
 * tasks Remote with a fresh idempotency key. The component reads only the
 * store snapshot and the command callback.
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { createSnapshotStore, type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type { RecipeRevision } from '../../../recipe/types.ts'
import type { TaskMutationContext } from '../../../task/types.ts'

/** Lifecycle of the recipe-catalogue load. */
export type CreateStatus = 'loading' | 'ready' | 'failed'

/** Snapshot state the create panel renders. */
export interface CreateState {
  readonly status: CreateStatus
  readonly recipes: readonly RecipeRevision[]
  readonly error?: string | undefined
}

let idempotencySeq = 0

/** Fresh idempotency key for one create command. */
function nextIdempotencyKey(recipeId: string): string {
  idempotencySeq += 1
  return 'task-create-' + recipeId + '-' + Date.now().toString(36) + '-' + String(idempotencySeq)
}

/**
 * The create panel's state owner. Created once per plugin fiber in apply.
 */
export class TaskCreateController {
  /** The wizard's snapshot source; the recipe catalogue plus load state. */
  readonly store: SnapshotStore<CreateState>

  private readonly ctx: ClientContext

  constructor(ctx: ClientContext) {
    this.ctx = ctx
    this.store = createSnapshotStore<CreateState>({ status: 'loading', recipes: [] })
    void this.refresh()
  }

  /** Reload the recipe catalogue from the recipes Remote. */
  async refresh(): Promise<void> {
    const result = await this.ctx.remote.recipes.listDetails()
    if (!result.ok) {
      this.store.set({
        status: 'failed', recipes: [], error: result.error.code,
      })
      return
    }
    this.store.set({ status: 'ready', recipes: result.value, error: undefined })
  }

  /**
   * One-shot AI polish of the goal text through the host LLM.
   * @param goal - raw user-entered goal text.
   * @returns the clarified goal, or throws on failure (caller keeps the draft).
   */
  async polish(goal: string): Promise<string> {
    const result = await this.ctx.remote.taskPolish.polish(goal)
    if (!result.ok) throw new Error('polish failed: ' + result.error.code)
    return result.value
  }

  /**
   * Create one task from the chosen recipe.
   * @param recipeId - the chosen recipe id, already in the catalogue.
   * @param workspaceId - the owning workspace.
   * @param actor - the creating actor.
   * @param goal - goal text; carried by the caller, not persisted here.
   * @returns the created task id.
   */
  async create(recipeId: string, workspaceId: string, actor: string, goal: string): Promise<string> {
    void goal
    const recipe = this.store.getSnapshot().recipes.find(item => item.recipeId === recipeId)
    if (recipe === undefined) throw new Error('recipe "' + recipeId + '" is not in the catalogue')
    const result = await this.ctx.remote.tasks.createTask(recipeId, workspaceId, actor, nextIdempotencyKey(recipeId))
    if (!result.ok) throw new Error('create failed: ' + result.error.code)
    const task = result.value
    // A freshly created task sits in `planning`; the engine only schedules
    // `running` tasks, so start it immediately — otherwise it spins forever.
    const start: TaskMutationContext = {
      actor,
      reason: 'auto-start after create',
      expectedRevision: task.revision,
      idempotencyKey: nextIdempotencyKey(recipeId + '-start'),
    }
    const started = await this.ctx.remote.tasks.startTask(String(task.taskId), start)
    if (!started.ok) throw new Error('start failed: ' + started.error.code)
    return String(task.taskId)
  }
}
