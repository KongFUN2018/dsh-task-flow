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
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { createSnapshotStore, type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the generated workbenchHost/workbenchHostStream Remote
// namespaces and the forwarded-event key face into this compilation program.
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {
  AttentionItemView,
  BatchConfirmItem,
  WorkbenchAttentionUpdate,
} from '../../../workbench/host/types.ts'

/** Lifecycle of the inbox's item-list load. */
export type InboxStatus = 'loading' | 'ready' | 'failed'

/** Snapshot state the inbox component renders. */
export interface InboxState {
  /** Load status of the item list. */
  readonly status: InboxStatus
  /** Known open items, freshest first; folds keep them revision-coherent. */
  readonly items: readonly AttentionItemView[]
  /** Inbox-wide version of the last applied snapshot or fold. */
  readonly snapshotVersion: number
  /** Delta-stream cursor the next reconnect replay reads from. */
  readonly cursor: number
  /** Delta-stream epoch of the current host; a change forces a resync. */
  readonly streamId?: string | undefined
  /** Failure code of the last failed load or command, shown until the next success. */
  readonly error?: string | undefined
  /** Count of items the last command did NOT confirm (conflict or already handled). */
  readonly conflictCount: number
  /** Epoch ms of the last successful load or fold. */
  readonly updatedAt: number
}

/** Recorded actor for every command this surface issues. */
const ACTOR = 'workbench-inbox'

/** Error-code prefix the component maps to the conflict copy. */
const CONFLICT_PREFIX = 'conflict:'

/**
 * The inbox's state owner. Created once per plugin fiber in `apply`; the
 * snapshot store it exposes is the inject `hooks` source, so components
 * subscribe through the renderer-bound hook and never see this object.
 */
export class AttentionInboxController {
  /** The inbox's snapshot source; revision-coherent item list plus load state. */
  readonly store: SnapshotStore<InboxState>

  private readonly ctx: ClientContext

  /**
   * @param ctx - owning client root context; subscriptions and refreshes ride
   * this fiber's lifetime.
   */
  constructor(ctx: ClientContext) {
    this.ctx = ctx
    this.store = createSnapshotStore<InboxState>({
      status: 'loading', items: [], snapshotVersion: 0, cursor: 0, conflictCount: 0, updatedAt: 0,
    })
    ctx.effect(() => ctx.remote.$on('workbench/attention-updated', (update) => { this.fold(update) }), 'attention-inbox: attention-updated fold')
    // A reconnect may have missed forwarded deliveries; replay the delta from
    // the recorded cursor, and resync from the snapshot when the epoch moved.
    ctx.on('connection/reset', () => { void this.reconnect() })
    void this.refresh()
  }

  /**
   * Fold one forwarded attention update: newer revisions replace each changed
   * row's status, unknown item ids trigger a snapshot resync, and stale or
   * repeated deliveries drop.
   * @param update - snapshot version plus each changed item's new state.
   */
  fold(update: WorkbenchAttentionUpdate): void {
    const state = this.store.getSnapshot()
    if (state.status !== 'ready') return
    if (update.snapshotVersion <= state.snapshotVersion) return
    const byId = new Map(update.changed.map(row => [String(row.itemId), row]))
    const known = new Set(state.items.map(item => String(item.itemId)))
    const hasUnknown = update.changed.some(row => !known.has(String(row.itemId)))
    const items = state.items.map((item) => {
      const row = byId.get(String(item.itemId))
      if (row === undefined || row.entityRevision <= item.entityRevision) return item
      return { ...item, status: row.status, entityRevision: row.entityRevision }
    })
    this.store.set({ ...state, items, snapshotVersion: update.snapshotVersion, updatedAt: Date.now() })
    if (hasUnknown) void this.refresh()
  }

  /**
   * Reload the full item list from the workbench-host snapshot, and refresh
   * the delta-stream epoch and cursor from the workbench-host stream.
   * @returns when the load settles; failures land in the state's error.
   */
  async refresh(): Promise<void> {
    const snap = await this.ctx.remote.workbenchHost.listSnapshot()
    if (!snap.ok) {
      this.store.set({ ...this.store.getSnapshot(), status: 'failed', error: snap.error.code })
      return
    }
    const page = await this.ctx.remote.workbenchHostStream.listIncremental(0)
    // A resync keeps any recorded command failure or conflict: the line reads
    // as history ("failed with X, since resynced"), and only a later fully
    // successful command clears it.
    const { error, conflictCount, cursor, streamId } = this.store.getSnapshot()
    this.store.set({
      status: 'ready',
      items: snap.value.items,
      snapshotVersion: snap.value.snapshotVersion,
      cursor: page.ok ? page.value.cursor : cursor,
      streamId: page.ok ? page.value.streamId : streamId,
      error,
      conflictCount,
      updatedAt: Date.now(),
    })
  }

  /**
   * Replay the delta stream from the recorded cursor after a reconnect. An
   * epoch change or any pending attention events force a snapshot resync;
   * otherwise only the cursor advances.
   * @returns when the replay settles.
   */
  async reconnect(): Promise<void> {
    const state = this.store.getSnapshot()
    if (state.status !== 'ready' || state.streamId === undefined) {
      await this.refresh()
      return
    }
    const page = await this.ctx.remote.workbenchHostStream.listIncremental(state.cursor)
    if (!page.ok || page.value.streamId !== state.streamId || page.value.events.length > 0) {
      await this.refresh()
      return
    }
    this.store.set({ ...this.store.getSnapshot(), cursor: page.value.cursor, streamId: page.value.streamId })
  }

  /**
   * Confirm a batch of B-class items in one pass. Every target reports its own
   * outcome; items that did not resolve (conflict, stale, withdrawn, or
   * already-resolved) are never silently removed — their count lands in
   * `conflictCount` and the list resyncs from the authoritative snapshot.
   * @param targets - the compare-and-set targets for the open B items selected.
   * @returns when the command settles and the list has resynced.
   */
  async confirm(targets: BatchConfirmItem[]): Promise<void> {
    if (targets.length === 0) return
    const result = await this.ctx.remote.workbenchHost.confirmBatch({ actor: ACTOR, items: targets })
    if (!result.ok) {
      this.store.set({ ...this.store.getSnapshot(), error: result.error.code, conflictCount: 0 })
      await this.refresh()
      return
    }
    const settled = result.value
    const conflicts = settled.results.filter(row => row.outcome !== 'resolved').length
    this.store.set({
      ...this.store.getSnapshot(),
      snapshotVersion: settled.snapshotVersion,
      error: conflicts > 0 ? CONFLICT_PREFIX + String(conflicts) : undefined,
      conflictCount: conflicts,
    })
    await this.refresh()
  }

  /**
   * Resolve one C-class item with the recorded decision text. A non-resolved
   * outcome (conflict, stale, withdrawn, already-resolved, or an invalid
   * option) is never silently confirmed — it lands in `conflictCount` and the
   * list resyncs from the authoritative snapshot.
   * @param item - the open C item being decided, carrying its CAS revision.
   * @param decision - the non-empty decision text to record.
   * @returns when the command settles and the list has resynced.
   */
  async decide(item: AttentionItemView, decision: string): Promise<void> {
    const result = await this.ctx.remote.workbenchHost.resolveDecision({
      itemId: item.itemId,
      expectedEntityRevision: item.entityRevision,
      decision,
      actor: ACTOR,
    })
    if (!result.ok) {
      this.store.set({ ...this.store.getSnapshot(), error: result.error.code, conflictCount: 0 })
      await this.refresh()
      return
    }
    const settled = result.value
    const conflict = settled.outcome !== 'resolved'
    this.store.set({
      ...this.store.getSnapshot(),
      snapshotVersion: settled.snapshotVersion,
      error: conflict ? CONFLICT_PREFIX + '1' : undefined,
      conflictCount: conflict ? 1 : 0,
    })
    await this.refresh()
  }
}

/** Whether one item's kind is batch-confirmable (B never batches with C).
 * @param item - the attention item to classify.
 * @returns true when the item's kind is `b-confirm`.
 */
export function batchable(item: AttentionItemView): boolean {
  return item.kind === 'b-confirm'
}

/** Whether one item's kind takes a single decision (C never batches).
 * @param item - the attention item to classify.
 * @returns true when the item's kind is `c-decision`.
 */
export function decidable(item: AttentionItemView): boolean {
  return item.kind === 'c-decision'
}
