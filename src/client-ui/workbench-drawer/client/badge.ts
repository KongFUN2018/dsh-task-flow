/**
 * Drawer badge object layer: a React-free controller that keeps the two
 * trigger-button aggregates — the count of open attention items (the badge
 * number) and the count of active tasks (the running indicator). Both are
 * re-read from the authoritative Remotes on every forwarded update and on
 * reconnect; the counts are projections, never folded locally, so a dropped
 * or repeated delivery costs at most one redundant snapshot read.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { createSnapshotStore, type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the generated workbenchHost/tasks Remote namespaces and
// the forwarded-event key face into this compilation program.
import type {} from '@deepseek-ai/dsh-api-remotes/client'

/** Snapshot state the trigger button renders. */
export interface BadgeState {
  /** Count of open attention items across all workbench tasks. */
  readonly openCount: number
  /** Count of tasks in an active (pre-terminal) working state. */
  readonly activeCount: number
  /** Failure code of the last failed aggregate read, cleared by the next success. */
  readonly error?: string | undefined
}

/** Whether one task state counts as actively working for the indicator. */
function activeState(state: string): boolean {
  return state === 'planning' || state === 'running' || state === 'pausing'
}

/**
 * The badge's state owner. Created once per plugin fiber in `apply`; the
 * snapshot store it exposes is the inject `hooks` source, so components
 * subscribe through the renderer-bound hook and never see this object.
 */
export class BadgeController {
  /** The badge's snapshot source: the two trigger aggregates plus load state. */
  readonly store: SnapshotStore<BadgeState>

  private readonly ctx: ClientContext

  /**
   * @param ctx - owning client root context; subscriptions and refreshes ride
   * this fiber's lifetime.
   */
  constructor(ctx: ClientContext) {
    this.ctx = ctx
    this.store = createSnapshotStore<BadgeState>({ openCount: 0, activeCount: 0 })
    ctx.effect(() => ctx.remote.$on('workbench/attention-updated', () => { void this.refreshAttention() }), 'workbench-drawer: attention-updated badge refresh')
    ctx.effect(() => ctx.remote.$on('task/updated', () => { void this.refreshTasks() }), 'workbench-drawer: task/updated badge refresh')
    // A reconnect may have missed forwarded deliveries; both aggregates are
    // Remote projections, so reread them rather than trusting local counts.
    ctx.on('connection/reset', () => { void this.refresh() })
    void this.refresh()
  }

  /** Refresh both aggregates from their Remotes; one merged write so a
   *  concurrent pair cannot overwrite each other's failure code. */
  async refresh(): Promise<void> {
    const [attention, tasks] = await Promise.all([
      this.ctx.remote.workbenchHost.listSnapshot(),
      this.ctx.remote.tasks.listTasks(),
    ])
    const state = this.store.getSnapshot()
    const next = { ...state }
    let error: string | undefined
    if (attention.ok) next.openCount = attention.value.items.length
    else error = attention.error.code
    if (tasks.ok) next.activeCount = tasks.value.filter(task => activeState(task.state)).length
    else error = tasks.error.code
    next.error = error
    this.store.set(next)
  }

  /** Reread the open-attention count from the workbench-host snapshot. */
  async refreshAttention(): Promise<void> {
    const snap = await this.ctx.remote.workbenchHost.listSnapshot()
    const state = this.store.getSnapshot()
    if (!snap.ok) {
      this.store.set({ ...state, error: snap.error.code })
      return
    }
    this.store.set({ ...state, openCount: snap.value.items.length, error: undefined })
  }

  /** Reread the active-task count from the tasks Remote. */
  async refreshTasks(): Promise<void> {
    const list = await this.ctx.remote.tasks.listTasks()
    const state = this.store.getSnapshot()
    if (!list.ok) {
      this.store.set({ ...state, error: list.error.code })
      return
    }
    this.store.set({ ...state, activeCount: list.value.filter(task => activeState(task.state)).length, error: undefined })
  }
}
