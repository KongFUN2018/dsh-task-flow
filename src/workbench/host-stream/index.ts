/**
 * Attention incremental-stream host service (`ctx.workbenchHostStream`):
 * projects the workbench journal's attention facts into a cursor-ordered
 * change stream. A client reads a snapshot, then advances by `cursor`
 * (a journal sequence) with `listIncremental`; events carry the journal
 * event id for dedupe and the post-commit entity revision for optimistic
 * concurrency. The stream id is a per-boot epoch: when it changes the client
 * discards its cursor and resnapshots.
 * @module @deepseek-ai/dsh-workbench-host-stream
 */

import { randomUUID } from 'node:crypto'
import { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type { JournalFact } from '../../workbench/journal/types.ts'
import '../../workbench/journal/index.ts'
import type {
  AttentionStreamEvent,
  AttentionStreamOperation,
  IncrementalPage,
} from './types.ts'

export type * from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    workbenchHostStream: WorkbenchHostStreamService
  }
}

/** Fact-kind prefix of every attention fact this stream narrows. */
const ATTENTION_KIND_PREFIX = 'attention/'

/** Narrow one journal fact kind to its stream operation. */
function operationOf(kind: string): AttentionStreamOperation {
  switch (kind) {
    case 'attention/item-created': return 'created'
    case 'attention/item-resolved': return 'resolved'
    case 'attention/item-invalidated': return 'invalidated'
    default: return 'updated'
  }
}

/** Extract the itemId a fact mutated; attention facts always carry a string itemId. */
function entityIdOf(fact: JournalFact): string {
  const payload = fact.payload
  if (typeof payload === 'object' && payload !== null && !Array.isArray(payload)) {
    const itemId = payload['itemId']
    if (typeof itemId === 'string') return itemId
  }
  return ''
}

/** Project one attention journal fact into the stream envelope. */
function eventOf(fact: JournalFact): AttentionStreamEvent {
  return {
    cursor: fact.journalSeq,
    previousCursor: fact.journalSeq - 1,
    eventId: String(fact.eventId),
    entityKind: 'attention',
    entityId: entityIdOf(fact),
    entityRevision: fact.entityRevision,
    operation: operationOf(fact.kind),
    payload: fact.payload,
  }
}

/**
 * Attention incremental stream: the M4 cursor-based change feed over the
 * persistent attention inbox, derived from the append-only workbench journal.
 */
export class WorkbenchHostStreamService extends TypertRemoteService {
  /** The service reads the workbench journal; it owns no durable domain. */
  static inject = ['workbenchJournal']

  /** Per-boot epoch; a client holding a cursor from another boot resnapshots. */
  private readonly streamId = randomUUID()

  constructor(ctx: Context) {
    super(ctx, 'workbenchHostStream')
  }

  /**
   * Read the attention change events after a journal cursor and the new cursor.
   * @param cursor - exclusive journal lower bound; omitted or non-positive replays the whole stream.
   * @returns the events in journal order plus this boot's stream id and cursor.
   */
  @Remote('listIncremental')
  listIncremental(cursor?: number): IncrementalPage {
    const after = cursor === undefined || !Number.isFinite(cursor) || cursor <= 0 ? 0 : Math.floor(cursor)
    const facts = this.ctx.workbenchJournal.replay(after)
    const events = facts
      .filter(fact => fact.kind.startsWith(ATTENTION_KIND_PREFIX))
      .map(eventOf)
    return {
      streamId: this.streamId,
      cursor: this.ctx.workbenchJournal.checkpoint().journalSeq,
      events,
    }
  }
}

export default WorkbenchHostStreamService
