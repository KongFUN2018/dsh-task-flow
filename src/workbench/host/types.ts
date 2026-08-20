/**
 * Client-safe type surface of the workbench attention channel: the branded
 * item id, the snapshot and command payload vocabulary, and the forwarded
 * Cordis event declaration. Types only — no runtime code and no Host-only
 * symbol, so a Client compilation face reads exactly the signature the Host
 * emits.
 *
 * @module @deepseek-ai/dsh-workbench-host/types
 */

import type { Branded } from '@deepseek-ai/dsh-brand'

/** Identifies one attention item across its revisions. */
export type WorkbenchItemId = Branded<'WorkbenchItemId'>

/** Gate class of an attention item; B items batch, C items never do, and clarification/recovery items are single-decision. */
export type AttentionItemKind = 'b-confirm' | 'c-decision' | 'clarification' | 'recovery'

/** Lifecycle of one attention item inside the inbox; `stale` marks a resolved item whose upstream inputs changed. */
export type AttentionItemStatus = 'open' | 'invalidated' | 'resolved' | 'stale'

/** Projection of one attention item inside a snapshot. */
export interface AttentionItemView {
  /** Stable item identity. */
  readonly itemId: WorkbenchItemId
  /** Gate class this item belongs to. */
  readonly kind: AttentionItemKind
  /** Current lifecycle state. */
  readonly status: AttentionItemStatus
  /** Compare-and-set revision; every committed mutation increments it. */
  readonly entityRevision: number
  /** Human-readable summary shown in the inbox. */
  readonly title: string
  /** Recorded decision text; present once a C item is resolved. */
  readonly decision?: string
}

/** Whole-inbox read model. */
export interface WorkbenchSnapshot {
  /** Inbox-wide version; every committed command increments it. */
  readonly snapshotVersion: number
  readonly items: readonly AttentionItemView[]
}

/** One compare-and-set target inside a batch confirm. */
export interface BatchConfirmItem {
  readonly itemId: WorkbenchItemId
  readonly expectedEntityRevision: number
}

/** Per-item outcome of a batch confirm. */
export type BatchConfirmOutcome =
  | 'resolved'
  | 'conflict'
  | 'stale'
  | 'withdrawn'
  | 'already-resolved'

/** Per-item result row; `currentRevision` is present when the item exists. */
export interface BatchConfirmItemResult {
  readonly itemId: WorkbenchItemId
  readonly outcome: BatchConfirmOutcome
  /** Revision to retry against when the item still exists. */
  readonly currentRevision?: number
}

/** B-class batch confirm request; commits every still-open matching item. */
export interface BatchConfirmRequest {
  /** Identity of the confirming actor, for the M1 journal record. */
  readonly actor: string
  readonly items: readonly BatchConfirmItem[]
}

/** B-class batch confirm response: per-item outcomes plus the new version. */
export interface BatchConfirmResponse {
  /** Post-commit inbox version. */
  readonly snapshotVersion: number
  /** One row per requested target, in request order. */
  readonly results: readonly BatchConfirmItemResult[]
}

/** C-class single decision write; C items are never batched. */
export interface ResolveDecisionRequest {
  readonly itemId: WorkbenchItemId
  readonly expectedEntityRevision: number
  /** Non-empty decision text recorded on the item. */
  readonly decision: string
  readonly actor: string
}

/** Single-item outcome; the same ladder as the batch confirm. */
export type DecisionOutcome = BatchConfirmOutcome

/** C-class single decision response: one outcome plus the new version. */
export interface ResolveDecisionResponse {
  /** Post-commit inbox version; unchanged when nothing committed. */
  readonly snapshotVersion: number
  /** Ladder outcome for the targeted item. */
  readonly outcome: DecisionOutcome
  /** Revision to retry against when the item still exists. */
  readonly currentRevision?: number
}

/** Upstream invalidation of one open item: the stale-propagation trigger. */
export interface InvalidateItemRequest {
  readonly itemId: WorkbenchItemId
  readonly expectedEntityRevision: number
  /** Non-empty reason recorded with the invalidation. */
  readonly reason: string
  readonly actor: string
}

/** Invalidation outcome; `stale` reports an item already invalidated. */
export type InvalidateOutcome = 'invalidated' | 'conflict' | 'stale' | 'withdrawn' | 'already-resolved'

/** Upstream invalidation response: one outcome plus the new version. */
export interface InvalidateItemResponse {
  /** Post-commit inbox version; unchanged when nothing committed. */
  readonly snapshotVersion: number
  /** Ladder outcome for the targeted item. */
  readonly outcome: InvalidateOutcome
  readonly currentRevision?: number
}

/** Payload of the forwarded `workbench/attention-updated` event. */
export interface WorkbenchAttentionUpdate {
  readonly snapshotVersion: number
  readonly changed: ReadonlyArray<{
    readonly itemId: WorkbenchItemId
    readonly status: AttentionItemStatus
    readonly entityRevision: number
  }>
}

declare module '@deepseek-ai/cordis' {
  interface Events {
    /**
     * Committed change to the workbench attention inbox: one or more items
     * resolved, invalidated, or otherwise revised by a Remote command.
     * Emitted after the in-memory store commits, with synchronous listener
     * failures contained and logged by the emitting service.
     * @param update - snapshot version plus each changed item's new state.
     * @mode emit
     */
    'workbench/attention-updated'(update: WorkbenchAttentionUpdate): void
  }
}
