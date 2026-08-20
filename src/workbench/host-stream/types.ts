/**
 * Types of the attention incremental stream (`ctx.workbenchHostStream`):
 * the versioned page and its per-entity change events, projected from the
 * workbench journal's attention facts. Types only — no runtime code.
 * @module @deepseek-ai/dsh-workbench-host-stream
 */

import type { JournalPayload } from '../../workbench/journal/types.ts'

/** One committed attention mutation, as reported to a resuming client. */
export type AttentionStreamOperation = 'created' | 'resolved' | 'invalidated' | 'updated'

/** One attention change event: a journal fact narrowed to the stream envelope. */
export interface AttentionStreamEvent {
  /** Journal position of this fact; the stream cursor. */
  readonly cursor: number
  /** Journal position immediately before this fact. */
  readonly previousCursor: number
  /** Journal fact identity; clients dedupe on it. */
  readonly eventId: string
  /** Entity kind the event mutates; always `attention` in M4. */
  readonly entityKind: 'attention'
  /** The attention itemId this fact mutated. */
  readonly entityId: string
  /** Post-commit entity revision carried by the fact. */
  readonly entityRevision: number
  /** Mutation kind, narrowed from the fact kind. */
  readonly operation: AttentionStreamOperation
  /** Kind-owned fact payload, passed through verbatim. */
  readonly payload: JournalPayload
}

/** One incremental read result: the events after `cursor` and the new cursor. */
export interface IncrementalPage {
  /** Host epoch identity; a change means the client must resnapshot. */
  readonly streamId: string
  /** Highest journal sequence included; the next read's `cursor`. */
  readonly cursor: number
  /** Attention change events after the requested cursor, in journal order. */
  readonly events: readonly AttentionStreamEvent[]
}
