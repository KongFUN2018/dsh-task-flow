/**
 * Task detail object layer: a React-free controller that loads one task
 * projection on demand through the tasks Remote, then its phase runs and the
 * gate verdicts of each phase's active submission. The component layer reads
 * only the store snapshot and the load callback; the journal-backed host
 * projections stay the single authority (a failed load records the code).
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import type { GateCheckResult, PhaseRunRecord, TaskRecord } from '../../../task/types.ts';
import type { TaskDigest } from '../../../digest/types.ts';
/** Lifecycle of the detail panel's load. */
export type TaskDetailStatus = 'idle' | 'loading' | 'ready' | 'failed';
/** Snapshot state the detail component renders. */
export interface TaskDetailState {
    /** Load status of the detail projection. */
    readonly status: TaskDetailStatus;
    /** The loaded task projection, present once ready. */
    readonly task?: TaskRecord | undefined;
    /** Phase runs of the task's current run, in recording order. */
    readonly phaseRuns: readonly PhaseRunRecord[];
    /** Gate verdicts across the loaded phase runs, in recording order. */
    readonly gateResults: readonly GateCheckResult[];
    /** Journal-derived digest of the task: run branches and timeline; absent when the digest read fails. */
    readonly digest: TaskDigest | undefined;
    /** Candidate rewind roots: the current input versions of each phase run. */
    readonly rootVersions: readonly RewindRootVersion[];
    /** Failure code of the last failed load. */
    readonly error?: string | undefined;
}
/** One candidate rewind root: a current input version tied to its phase run. */
export interface RewindRootVersion {
    /** The phase run carrying the version as input. */
    readonly phaseRunId: string;
    /** The phase the phase run belongs to. */
    readonly phaseId: string;
    /** The deliverable's identifier. */
    readonly deliverableId: string;
    /** The immutable version id, usable as a rewind root. */
    readonly versionId: string;
}
/**
 * The detail panel's state owner. Created once per plugin fiber in `apply`;
 * the snapshot store it exposes is the inject `hooks` source.
 */
export declare class TaskDetailController {
    /** The detail's snapshot source; per-task projection plus load state. */
    readonly store: SnapshotStore<TaskDetailState>;
    private readonly ctx;
    /**
     * @param ctx - owning client root context; loads ride this fiber's lifetime.
     */
    constructor(ctx: ClientContext);
    /**
     * Load one task, its phase runs, and the gate verdicts of each active
     * submission on demand. A missing task lands in the not-found error state.
     * @param taskId - the task to inspect.
     * @returns when the load settles; failures land in the state's error.
     */
    load(taskId: string): Promise<void>;
}
//# sourceMappingURL=detail.d.ts.map