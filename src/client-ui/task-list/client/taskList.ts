/**
 * Task list object layer: a React-free controller that owns the task list's
 * state, folds forwarded `task/updated` deliveries against the loaded
 * snapshot's revisions, and issues the pause/resume/cancel verbs through the
 * tasks Remote with compare-and-set revisions. The component layer reads only
 * the store snapshot and the command callbacks; the journal-backed host
 * projections stay the single authority (a failed or dropped delivery resyncs
 * through `refresh()`). A focused list view over the same task rows as the
 * board — no KPI counts or charts.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { createSnapshotStore, type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the generated tasks Remote namespace and the forwarded-event
// key face into this compilation program.
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type { GateCheckResult, PhaseRunRecord, TaskMutationContext, TaskRecord } from '../../../task/types.ts'

/** Lifecycle of the task list's load. */
export type TaskListStatus = 'loading' | 'ready' | 'failed'

/** Position of a task's current run inside its phase chain, 1-based. */
export interface PhaseProgress {
  /** 1-based index of the first unsettled phase; all-settled runs report the total. */
  readonly current: number
  /** Phase count of the run. */
  readonly total: number
}

/** The gate class a task currently waits on, or undefined when none is paused. */
export type GatePause = 'A' | 'B' | 'C' | undefined

/** Snapshot state the task list component renders. */
export interface TaskListState {
  /** Load status of the task list. */
  readonly status: TaskListStatus
  /** Known task projections, freshest first; folds keep it revision-coherent. */
  readonly tasks: readonly TaskRecord[]
  /** Per-task phase progress keyed by task id; refreshed with the list. */
  readonly phaseProgress: ReadonlyMap<string, PhaseProgress>
  /** Per-task gate pause class keyed by task id; absent while the task runs freely. */
  readonly taskGates: ReadonlyMap<string, GatePause>
  /** Per-task latest-activity epoch ms; the newest submission's submittedAt or the task's createdAt. */
  readonly recentActivity: ReadonlyMap<string, number>
  /** Failure code of the last failed load or command, shown until the next success. */
  readonly error?: string | undefined
  /** Epoch ms of the last successful load or fold. */
  readonly updatedAt: number
}

/** Phase states that settle a run row; everything before them counts as current. */
const PHASE_SETTLED = new Set(['passed', 'failed', 'stale', 'superseded', 'cancelled'])

/** Phase states that park a run on a Gate, signalling a waiting decision. */
const GATE_PAUSED = new Set(['gate-running', 'awaiting-decision', 'awaiting-input', 'submitting', 'submitted'])

/** Class order for choosing the highest-priority pending check. */
const GATE_ORDER: Record<'A' | 'B' | 'C', number> = { A: 0, B: 1, C: 2 }

/**
 * Derive one run's phase progress: the first unsettled phase is current.
 * @param phaseRuns - the run's phase runs, in recording order.
 * @returns the 1-based current index and the total.
 */
function phaseProgressOf(phaseRuns: readonly PhaseRunView[]): PhaseProgress {
  const total = phaseRuns.length
  const index = phaseRuns.findIndex(run => !PHASE_SETTLED.has(run.state))
  return { current: index === -1 ? total : index + 1, total }
}

/**
 * Derive a task's gate pause class from its latest unsettled phase run: the
 * gate class of the first failing check on that phase's active submission.
 * @param runs - the run's phase runs, in recording order.
 * @param gates - the gate results of a submission, or undefined on a dropped read.
 * @returns the paused gate class, or undefined when no gate is waiting.
 */
export function gatePauseOf(runs: readonly PhaseRunRecord[], gates: readonly GateCheckResult[] | undefined): GatePause {
  const paused = runs.find(run => GATE_PAUSED.has(run.state))
  if (paused === undefined || gates === undefined) return undefined
  const failing = gates
    .filter(gate => gate.passed === false || gate.stale === true)
    .map(gate => (gate.kind ?? 'A') as 'A' | 'B' | 'C')
    .sort((a, b) => GATE_ORDER[a] - GATE_ORDER[b])
  return failing[0]
}

/** Minimal phase-run read the progress fold needs. */
interface PhaseRunView {
  readonly state: string
}

/** Monotonic seed for idempotency keys; collisions within a page are impossible. */
let idempotencySeq = 0

/** Fresh idempotency key for one task list command. */
function nextIdempotencyKey(verb: string, taskId: string): string {
  idempotencySeq += 1
  return `task-list-${verb}-${taskId}-${Date.now().toString(36)}-${idempotencySeq}`
}

/** Compare-and-set mutation context for one verb over the row's revision. */
function mutationOf(verb: string, task: TaskRecord): TaskMutationContext {
  return {
    actor: 'task-list',
    reason: `task-list ${verb}`,
    expectedRevision: task.revision,
    idempotencyKey: nextIdempotencyKey(verb, task.taskId),
  }
}

/** Order the list rows: newest creation first, taskId as the stable tiebreak. */
function byCreation(left: TaskRecord, right: TaskRecord): number {
  return right.createdAt - left.createdAt || (left.taskId < right.taskId ? -1 : 1)
}

/** Task states whose row offers Resume; Paused is the only resumable one. */
function resumable(state: TaskRecord['state']): boolean {
  return state === 'paused'
}

/** Task states whose row offers Pause; only an actively running task pauses. */
function pausable(state: TaskRecord['state']): boolean {
  return state === 'running'
}

/** Task states whose row offers Cancel; terminal rows act on nothing. */
function cancellable(state: TaskRecord['state']): boolean {
  return state === 'planning' || state === 'running' || state === 'pausing' || state === 'paused'
}

/** Task list verbs; each is gated on the row's current state by the caller. */
export type TaskListVerb = 'pause' | 'resume' | 'cancel'

/**
 * Verbs each task state offers the list row.
 * @param task - the task projection whose state gates the verb set.
 * @returns the verbs the row may dispatch, in display order.
 */
export function verbsFor(task: TaskRecord): readonly TaskListVerb[] {
  const verbs: TaskListVerb[] = []
  if (pausable(task.state)) verbs.push('pause')
  if (resumable(task.state)) verbs.push('resume')
  if (cancellable(task.state)) verbs.push('cancel')
  return verbs
}

/**
 * The task list's state owner. Created once per plugin fiber in `apply`; the
 * snapshot store it exposes is the inject `hooks` source, so components
 * subscribe through the renderer-bound hook and never see this object.
 */
export class TaskListController {
  /** The task list's snapshot source; revision-coherent task list plus load state. */
  readonly store: SnapshotStore<TaskListState>

  private readonly ctx: ClientContext

  /**
   * @param ctx - owning client root context; subscriptions and refreshes ride
   * this fiber's lifetime.
   */
  constructor(ctx: ClientContext) {
    this.ctx = ctx
    this.store = createSnapshotStore<TaskListState>({ status: 'loading', tasks: [], phaseProgress: new Map(), taskGates: new Map(), recentActivity: new Map(), updatedAt: 0 })
    ctx.effect(() => ctx.remote.$on('task/updated', (task) => { this.fold(task) }), 'task-list: task/updated fold')
    // A reconnect may have missed forwarded deliveries; the projection is
    // authoritative, so resync from the Remote instead of trusting the fold.
    ctx.on('connection/reset', () => { void this.refresh() })
    void this.refresh()
  }

  /**
   * Fold one forwarded task projection: newer revisions replace the row,
   * unknown tasks join the list, and stale or repeated deliveries drop.
   * @param task - the post-commit task projection the host forwarded.
   */
  fold(task: TaskRecord): void {
    const { tasks } = this.store.getSnapshot()
    const index = tasks.findIndex(row => row.taskId === task.taskId)
    const existing = index >= 0 ? tasks[index] : undefined
    if (existing !== undefined && existing.revision >= task.revision) return
    const next = index >= 0 ? tasks.with(index, task) : [...tasks, task]
    next.sort(byCreation)
    this.store.set({ ...this.store.getSnapshot(), tasks: next, updatedAt: Date.now() })
    void this.refreshProgress(task)
  }

  /**
   * Re-read one task's phase progress after a fold; a dropped read keeps the
   * last known progress (the next full refresh recomputes it).
   * @param task - the folded task projection.
   */
  private async refreshProgress(task: TaskRecord): Promise<void> {
    if (task.currentRunId === undefined) return
    const runs = await this.ctx.remote.tasks.listPhaseRuns(String(task.currentRunId))
    if (!runs.ok) return
    const snapshot = this.store.getSnapshot()
    if (!snapshot.tasks.some(row => row.taskId === task.taskId)) return
    const phaseProgress = new Map(snapshot.phaseProgress)
    const taskGates = new Map(snapshot.taskGates)
    phaseProgress.set(task.taskId, phaseProgressOf(runs.value))
    const paused = runs.value.find(run => GATE_PAUSED.has(run.state))
    let gate: GatePause = undefined
    if (paused !== undefined && paused.activeSubmissionId !== undefined) {
      const gates = await this.ctx.remote.tasks.listGateResults(String(paused.activeSubmissionId))
      gate = gates.ok ? gatePauseOf(runs.value, gates.value) : undefined
    }
    taskGates.set(task.taskId, gate)
    const recentActivity = new Map(snapshot.recentActivity)
    recentActivity.set(task.taskId, await this.recentActivityOf(task, runs.value))
    this.store.set({ ...snapshot, phaseProgress, taskGates, recentActivity })
  }

  /**
   * Latest recorded activity of a task: the newest active submission's
   * submittedAt across its current run's phase runs, falling back to the
   * task's createdAt when nothing was submitted yet. A dropped submission
   * read keeps the creation time — the row still shows a stable 最近活跃.
   * @param task - the task projection whose activity to derive.
   * @param runs - the current run's phase runs, in recording order.
   * @returns the activity epoch ms.
   */
  private async recentActivityOf(task: TaskRecord, runs: readonly PhaseRunRecord[]): Promise<number> {
    let latest = task.createdAt
    for (const run of runs) {
      if (run.activeSubmissionId === undefined) continue
      const submission = await this.ctx.remote.tasks.getSubmission(String(run.activeSubmissionId))
      if (submission.ok && submission.value !== undefined && submission.value.submittedAt > latest) {
        latest = submission.value.submittedAt
      }
    }
    return latest
  }

  /**
   * Reload the full task list from the tasks Remote.
   * @returns when the load settles; failures land in the state's error.
   */
  async refresh(): Promise<void> {
    const result = await this.ctx.remote.tasks.listTasks()
    if (!result.ok) {
      this.store.set({ ...this.store.getSnapshot(), status: 'failed', error: result.error.code })
      return
    }
    const tasks = [...result.value].sort(byCreation)
    // Phase progress and gate pursuit ride the same refresh; a per-task read
    // failure keeps a zero slot rather than failing the whole list.
    const entries = await Promise.all(tasks.map(async (task) => {
      if (task.currentRunId === undefined) return [task.taskId, { current: 0, total: 0 }, undefined, task.createdAt] as const
      const runs = await this.ctx.remote.tasks.listPhaseRuns(String(task.currentRunId))
      if (!runs.ok) return [task.taskId, { current: 0, total: 0 }, undefined, task.createdAt] as const
      const progress = phaseProgressOf(runs.value)
      const paused = runs.value.find(run => GATE_PAUSED.has(run.state))
      let gate: GatePause = undefined
      if (paused !== undefined && paused.activeSubmissionId !== undefined) {
        const gates = await this.ctx.remote.tasks.listGateResults(String(paused.activeSubmissionId))
        gate = gates.ok ? gatePauseOf(runs.value, gates.value) : undefined
      }
      const activity = await this.recentActivityOf(task, runs.value)
      return [task.taskId, progress, gate, activity] as const
    }))
    const phaseProgress = new Map(entries.map(([id, progress]) => [id, progress] as const))
    const taskGates = new Map(entries.map(([id, , gate]) => [id, gate] as const))
    const recentActivity = new Map(entries.map(([id, , , activity]) => [id, activity] as const))
    // A resync keeps any recorded command failure: the line reads as history
    // ("failed with X, since resynced"), and only a later successful command
    // or load-failure code replaces it.
    const { error } = this.store.getSnapshot()
    this.store.set({ status: 'ready', tasks, phaseProgress, taskGates, recentActivity, error, updatedAt: Date.now() })
  }

  /**
   * Issue one verb against a task row.
   * @param taskId - the row's task id.
   * @param verb - the verb to issue.
   * @returns when the command settles; the row folds on success, and a
   * failure records the code and resyncs through {@link refresh} (the
   * compare-and-set revision is the guard, never a client-side fence).
   */
  async command(taskId: string, verb: TaskListVerb): Promise<void> {
    const task = this.store.getSnapshot().tasks.find(row => row.taskId === taskId)
    if (task === undefined) return
    const mutation = mutationOf(verb, task)
    const result = verb === 'pause'
      ? await this.ctx.remote.tasks.requestPause(taskId, mutation)
      : verb === 'resume'
        ? await this.ctx.remote.tasks.resume(taskId, mutation)
        : await this.ctx.remote.tasks.requestCancel(taskId, mutation)
    if (result.ok) {
      this.fold(result.value)
      this.store.set({ ...this.store.getSnapshot(), error: undefined })
      return
    }
    this.store.set({ ...this.store.getSnapshot(), error: result.error.code })
    await this.refresh()
  }
}
