/**
 * Drawer badge object layer: a React-free controller that keeps the two
 * trigger-button aggregates — the count of open attention items (the badge
 * number) and the count of active tasks (the running indicator). Both are
 * re-read from the authoritative Remotes on every forwarded update and on
 * reconnect; the counts are projections, never folded locally, so a dropped
 * or repeated delivery costs at most one redundant snapshot read.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
/** Snapshot state the trigger button renders. */
export interface BadgeState {
    /** Count of open attention items across all workbench tasks. */
    readonly openCount: number;
    /** Count of tasks in an active (pre-terminal) working state. */
    readonly activeCount: number;
    /** Failure code of the last failed aggregate read, cleared by the next success. */
    readonly error?: string | undefined;
}
/**
 * The badge's state owner. Created once per plugin fiber in `apply`; the
 * snapshot store it exposes is the inject `hooks` source, so components
 * subscribe through the renderer-bound hook and never see this object.
 */
export declare class BadgeController {
    /** The badge's snapshot source: the two trigger aggregates plus load state. */
    readonly store: SnapshotStore<BadgeState>;
    private readonly ctx;
    /**
     * @param ctx - owning client root context; subscriptions and refreshes ride
     * this fiber's lifetime.
     */
    constructor(ctx: ClientContext);
    /** Refresh both aggregates from their Remotes; one merged write so a
     *  concurrent pair cannot overwrite each other's failure code. */
    refresh(): Promise<void>;
    /** Reread the open-attention count from the workbench-host snapshot. */
    refreshAttention(): Promise<void>;
    /** Reread the active-task count from the tasks Remote. */
    refreshTasks(): Promise<void>;
}
//# sourceMappingURL=badge.d.ts.map