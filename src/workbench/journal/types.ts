/**
 * Workbench journal type surface: the frozen top-level fact fields, the
 * append input, checkpoint and replay wire values, and failures. Per-kind
 * payload schemas are owned by the entity packages that append each kind;
 * this envelope validates only structure and JSON serializability. Types
 * only â€?no runtime code.
 * @module @deepseek-ai/dsh-workbench-journal/types
 */

import type { Branded } from '@deepseek-ai/dsh-brand'
import type { TaskId } from '../../task/types.ts'

/** Identifies one journal fact; assigned by the journal at append. */
export type JournalEventId = Branded<'JournalEventId'>

/** Any JSON value a fact payload may carry; per-kind owners narrow it. */
export type JournalPayload = null | boolean | number | string | JournalPayload[] | { [key: string]: JournalPayload }

/** Caller-supplied fields of one fact; the journal assigns the rest. */
export interface JournalFactInput {
  /** The task the fact belongs to. */
  readonly taskId: TaskId
  /** Fact kind; each owning package defines its kinds and payloads. */
  readonly kind: string
  /** Actor that caused the fact. */
  readonly actor: string
  /** Deduplication key; a replay with the same caller fields returns the stored fact. */
  readonly idempotencyKey: string
  /** Post-commit revision of the entity the fact mutated. */
  readonly entityRevision: number
  /** Kind-owned payload; the journal stores it verbatim. */
  readonly payload: JournalPayload
  /** Event id of the fact this one was caused by, when any. */
  readonly causationId?: JournalEventId
  /** Correlation id grouping related facts, when any. */
  readonly correlationId?: string
}

/** One stored journal fact: the frozen envelope over the caller fields. */
export interface JournalFact {
  /** Monotonic position in the journal; gapless from 1. */
  readonly journalSeq: number
  /** Identity of this fact, assigned at append. */
  readonly eventId: JournalEventId
  /** The task the fact belongs to. */
  readonly taskId: TaskId
  /** Fact kind; each owning package defines its kinds and payloads. */
  readonly kind: string
  /** Epoch milliseconds at append. */
  readonly occurredAt: number
  /** Actor that caused the fact. */
  readonly actor: string
  /** Event id of the fact this one was caused by, when any. */
  readonly causationId?: JournalEventId
  /** Correlation id grouping related facts, when any. */
  readonly correlationId?: string
  /** Deduplication key the fact was appended under. */
  readonly idempotencyKey: string
  /** Post-commit revision of the entity the fact mutated. */
  readonly entityRevision: number
  /** Kind-owned payload, stored verbatim. */
  readonly payload: JournalPayload
  /** Envelope schema version; 1 in M1. */
  readonly schemaVersion: number
}

/** Recovery and client-resync position in the journal. */
export interface JournalCheckpoint {
  /** Highest assigned journalSeq; 0 when the journal is empty. */
  readonly journalSeq: number
}

/** Machine-routable journal failure codes. */
export type JournalErrorCode =
  | 'invalid-fact'
  | 'idempotency-conflict'
  | 'invalid-argument'

/** Journal failure with code and message. */
export class JournalError extends Error {
  /** Machine-routable failure code. */
  readonly code: JournalErrorCode

  /**
   * @param code - Machine-routable failure code.
   * @param message - Human-readable failure description.
   */
  constructor(code: JournalErrorCode, message: string) {
    super(message)
    this.code = code
    this.name = 'JournalError'
  }
}
