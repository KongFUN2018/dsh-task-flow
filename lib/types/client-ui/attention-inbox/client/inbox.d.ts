/**
 * Attention inbox object layer: a React-free controller that owns the
 * open-item list, folds forwarded `workbench/attention-updated` deliveries
 * against the loaded snapshot's revisions, and issues the batch-confirm and
 * single-decision verbs through the workbench-host Remote with
 * compare-and-set revisions. The component layer reads only the store
 * snapshot and the command callbacks; the journal-backed host projections
 * stay the single authority, so a failed or dropped delivery resyncs through
 * `refresh()` and a reconnect replays the workbench-host-stream delta.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
import type { AttentionItemView, BatchConfirmItem, WorkbenchAttentionUpdate } from '../../../workbench/host/types.ts';
/** Lifecycle of the inbox's item-list load. */
export type InboxStatus = 'loading' | 'ready' | 'failed';
/** Snapshot state the inbox component renders. */
export interface InboxState {
    /** Load status of the item list. */
    readonly status: InboxStatus;
    /** Known open items, freshest first; folds keep them revision-coherent. */
    readonly items: readonly AttentionItemView[];
    /** Inbox-wide version of the last applied snapshot or fold. */
    readonly snapshotVersion: number;
    /** Delta-stream cursor the next reconnect replay reads from. */
    readonly cursor: number;
    /** Delta-stream epoch of the current host; a change forces a resync. */
    readonly streamId?: string | undefined;
    /** Failure code of the last failed load or command, shown until the next success. */
    readonly error?: string | undefined;
    /** Count of items the last command did NOT confirm (conflict or already handled). */
    readonly conflictCount: number;
    /** Epoch ms of the last successful load or fold. */
    readonly updatedAt: number;
}
/**
 * The inbox's state owner. Created once per plugin fiber in `apply`; the
 * snapshot store it exposes is the inject `hooks` source, so components
 * subscribe through the renderer-bound hook and never see this object.
 */
export declare class AttentionInboxController {
    /** The inbox's snapshot source; revision-coherent item list plus load state. */
    readonly store: SnapshotStore<InboxState>;
    private readonly ctx;
    /**
     * @param ctx - owning client root context; subscriptions and refreshes ride
     * this fiber's lifetime.
     */
    constructor(ctx: ClientContext);
    /**
     * Fold one forwarded attention update: newer revisions replace each changed
     * row's status, unknown item ids trigger a snapshot resync, and stale or
     * repeated deliveries drop.
     * @param update - snapshot version plus each changed item's new state.
     */
    fold(update: WorkbenchAttentionUpdate): void;
    /**
     * Reload the full item list from the workbench-host snapshot, and refresh
     * the delta-stream epoch and cursor from the workbench-host stream.
     * @returns when the load settles; failures land in the state's error.
     */
    refresh(): Promise<void>;
    /**
     * Replay the delta stream from the recorded cursor after a reconnect. An
     * epoch change or any pending attention events force a snapshot resync;
     * otherwise only the cursor advances.
     * @returns when the replay settles.
     */
    reconnect(): Promise<void>;
    /**
     * Confirm a batch of B-class items in one pass. Every target reports its own
     * outcome; items that did not resolve (conflict, stale, withdrawn, or
     * already-resolved) are never silently removed — their count lands in
     * `conflictCount` and the list resyncs from the authoritative snapshot.
     * @param targets - the compare-and-set targets for the open B items selected.
     * @returns when the command settles and the list has resynced.
     */
    confirm(targets: BatchConfirmItem[]): Promise<void>;
    /**
     * Resolve one C-class item with the recorded decision text. A non-resolved
     * outcome (conflict, stale, withdrawn, already-resolved, or an invalid
     * option) is never silently confirmed — it lands in `conflictCount` and the
     * list resyncs from the authoritative snapshot.
     * @param item - the open C item being decided, carrying its CAS revision.
     * @param decision - the non-empty decision text to record.
     * @returns when the command settles and the list has resynced.
     */
    decide(item: AttentionItemView, decision: string): Promise<void>;
}
/** Whether one item's kind is batch-confirmable (B never batches with C).
 * @param item - the attention item to classify.
 * @returns true when the item's kind is `b-confirm`.
 */
export declare function batchable(item: AttentionItemView): boolean;
/** Whether one item's kind takes a single decision (C never batches).
 * @param item - the attention item to classify.
 * @returns true when the item's kind is `c-decision`.
 */
export declare function decidable(item: AttentionItemView): boolean;
//# sourceMappingURL=inbox.d.ts.map