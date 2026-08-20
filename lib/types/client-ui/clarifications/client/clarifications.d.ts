/**
 * Clarification queue object layer: a React-free controller that owns the
 * open-clarification read-only list. On load it pulls the full attention
 * snapshot over the workbenchHost Remote and keeps only the rows whose kind
 * is `clarification` and whose status is `open`; forwarded
 * `workbench/attention-updated` deliveries fold against the snapshot
 * revision (a status flip to non-open evicts the row, and an unknown item id
 * resyncs), and a reconnect resyncs from the authoritative snapshot. The
 * component reads only the store snapshot through the inject hooks
 * compartment; this surface issues no confirm/decide verb because
 * clarification items are read-only.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import type { AttentionItemView, WorkbenchAttentionUpdate } from '../../../workbench/host/types.ts';
/** Lifecycle of the clarification-list load. */
export type ClarificationsStatus = 'loading' | 'ready' | 'failed';
/** Snapshot state the clarification component renders. */
export interface ClarificationsState {
    /** Load status of the list. */
    readonly status: ClarificationsStatus;
    /** Open clarification items, in snapshot order. */
    readonly items: readonly AttentionItemView[];
    /** Inbox-wide version of the last applied snapshot or fold. */
    readonly snapshotVersion: number;
    /** Failure code of the last failed load, shown until the next success. */
    readonly error?: string | undefined;
    /** Epoch ms of the last successful load or fold. */
    readonly updatedAt: number;
}
/** Whether one attention item is an open clarification (the queue's one row kind). */
export declare function openClarification(item: AttentionItemView): boolean;
/**
 * The clarification queue's state owner. Created once per plugin fiber in
 * `apply`; the snapshot store it exposes is the inject `hooks` source, so
 * components subscribe through the renderer-bound hook and never see this
 * object.
 */
export declare class ClarificationsController {
    /** The queue's snapshot source; the open-clarification list plus load state. */
    readonly store: SnapshotStore<ClarificationsState>;
    private readonly ctx;
    /**
     * @param ctx - owning client root context; subscriptions and refreshes ride
     * this fiber's lifetime.
     */
    constructor(ctx: ClientContext);
    /**
     * Fold one forwarded attention update: a changed open-clarification row is
     * kept with its newer revision (evicting it when the new status is no
     * longer open), and an unknown item id triggers a snapshot resync because
     * the queue cannot rule out a newly opened clarification. Stale or repeated
     * deliveries drop.
     * @param update - snapshot version plus each changed item's new state.
     */
    fold(update: WorkbenchAttentionUpdate): void;
    /**
     * Reload the full attention snapshot from the workbench-host Remote and
     * keep only its open-clarification rows.
     * @returns when the load settles; failures land in the state's error.
     */
    refresh(): Promise<void>;
}
//# sourceMappingURL=clarifications.d.ts.map