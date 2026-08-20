/**
 * Task board object layer: a React-free controller that owns the board's
 * task list state, folds forwarded `task/updated` deliveries against the
 * loaded snapshot's revisions, and issues the pause/resume/cancel verbs
 * through the tasks Remote with compare-and-set revisions. The component
 * layer reads only the store snapshot and the command callbacks; the
 * journal-backed host projections stay the single authority (a failed or
 * dropped delivery resyncs through `refresh()`).
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import type { GateCheckResult, PhaseRunRecord, TaskRecord } from '../../../task/types.ts';
import type { WorkbenchMetrics } from '../../../metrics/types.ts';
/** Lifecycle of the board's task-list load. */
export type TaskBoardStatus = 'loading' | 'ready' | 'failed';
/** Position of a task's current run inside its phase chain, 1-based. */
export interface PhaseProgress {
    /** 1-based index of the first unsettled phase; all-settled runs report the total. */
    readonly current: number;
    /** Phase count of the run. */
    readonly total: number;
}
/** The gate class a task currently waits on, or undefined when none is paused. */
export type GatePause = 'A' | 'B' | 'C' | undefined;
/** Snapshot state the board component renders. */
export interface TaskBoardState {
    /** Load status of the task list. */
    readonly status: TaskBoardStatus;
    /** Known task projections, freshest first; folds keep it revision-coherent. */
    readonly tasks: readonly TaskRecord[];
    /** Whole-workbench KPI counts for the KPI row; absent until the first load. */
    readonly metrics: WorkbenchMetrics | undefined;
    /** Per-task phase progress keyed by task id; refreshed with the list. */
    readonly phaseProgress: ReadonlyMap<string, PhaseProgress>;
    /** Per-task gate pause class keyed by task id; absent while the task runs freely. */
    readonly taskGates: ReadonlyMap<string, GatePause>;
    /** Failure code of the last failed load or command, shown until the next success. */
    readonly error?: string | undefined;
    /** Epoch ms of the last successful load or fold. */
    readonly updatedAt: number;
}
/**
 * Derive a task's gate pause class from its latest unsettled phase run: the
 * gate class of the first failing check on that phase's active submission.
 * @param runs - the run's phase runs, in recording order.
 * @param gates - the gate results of a submission, or undefined on a dropped read.
 * @returns the paused gate class, or undefined when no gate is waiting.
 */
export declare function gatePauseOf(runs: readonly PhaseRunRecord[], gates: readonly GateCheckResult[] | undefined): GatePause;
/** Board verbs; each is gated on the row's current state by the caller. */
export type TaskBoardVerb = 'pause' | 'resume' | 'cancel';
/**
 * Verbs each task state offers the board row.
 * @param task - the task projection whose state gates the verb set.
 * @returns the verbs the row may dispatch, in display order.
 */
export declare function verbsFor(task: TaskRecord): readonly TaskBoardVerb[];
/**
 * The board's state owner. Created once per plugin fiber in `apply`; the
 * snapshot store it exposes is the inject `hooks` source, so components
 * subscribe through the renderer-bound hook and never see this object.
 */
export declare class TaskBoardController {
    /** The board's snapshot source; revision-coherent task list plus load state. */
    readonly store: SnapshotStore<TaskBoardState>;
    private readonly ctx;
    /**
     * @param ctx - owning client root context; subscriptions and refreshes ride
     * this fiber's lifetime.
     */
    constructor(ctx: ClientContext);
    /**
     * Fold one forwarded task projection: newer revisions replace the row,
     * unknown tasks join the list, and stale or repeated deliveries drop.
     * @param task - the post-commit task projection the host forwarded.
     */
    fold(task: TaskRecord): void;
    /**
     * Re-read one task's phase progress after a fold; a dropped read keeps the
     * last known progress (the next full refresh recomputes it).
     * @param task - the folded task projection.
     */
    private refreshProgress;
    /**
     * Reload the full task list from the tasks Remote.
     * @returns when the load settles; failures land in the state's error.
     */
    refresh(): Promise<void>;
    /**
     * Issue one board verb against a task row.
     * @param taskId - the row's task id.
     * @param verb - the verb to issue.
     * @returns when the command settles; the row folds on success, and a
     * failure records the code and resyncs through {@link refresh} (the
     * compare-and-set revision is the guard, never a client-side fence).
     */
    command(taskId: string, verb: TaskBoardVerb): Promise<void>;
}
//# sourceMappingURL=board.d.ts.map