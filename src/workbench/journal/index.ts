/**
 * Workbench journal (`ctx.workbenchJournal`): the task-flow append-only fact
 * source over one storageDomain unit. `append` assigns a gapless monotonic
 * journalSeq and is the commit point of every task-flow entity mutation â€? * entity projections are rebuildable from `replay`, so Cordis events stay
 * droppable wake-ups. No journal-specific events exist by design.
 * @module @deepseek-ai/dsh-workbench-journal
 */

import { randomUUID } from 'node:crypto'
import { Context, Service } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type { KvTable } from '@deepseek-ai/dsh-storage-domain'
import { JournalEventId } from './runtime.ts'
import { journalSeqKey, workbenchJournalDomainSpec } from './spec.ts'
import { JournalError } from './types.ts'
import type { JournalCheckpoint, JournalFact, JournalFactInput } from './types.ts'

export type * from './types.ts'
export { JournalEventId } from './runtime.ts'
export {
  JOURNAL_SEQ_KEY_WIDTH,
  journalFactSchema,
  journalSeqKey,
  workbenchJournalDomainSpec,
} from './spec.ts'
export { JournalError } from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    workbenchJournal: WorkbenchJournalService
  }
}

/** Envelope schema version this service appends. */
const FACT_SCHEMA_VERSION = 1

/** Append-only journal service; the durable truth task-flow projections rebuild from. */
export class WorkbenchJournalService extends TypertRemoteService {
  /** The journal opens its domain on the mounted storage-domain facility. */
  static inject = ['storageDomain']

  private entries?: KvTable<string, JournalFact>
  /** Highest assigned journalSeq; derived from stored keys at open. */
  private head = 0
  /** Serializes seq allocation with the durable write; keeps appends gapless. */
  private appendTail: Promise<void> = Promise.resolve()

  /**
   * @param ctx - Host context carrying the storage-domain facility.
   */
  constructor(ctx: Context) {
    super(ctx, 'workbenchJournal')
  }

  /** Open and own the journal domain; derive head from the stored facts. */
  protected async [Service.init](): Promise<void> {
    const domain = await this.ctx.storageDomain.open(workbenchJournalDomainSpec)
    this.ctx.effect(() => async () => {
      await domain.close()
    }, 'workbench-journal.domainClose')
    const entries = domain.table('entries')
    for (const key of entries.keys()) {
      const seq = Number(key)
      if (Number.isSafeInteger(seq) && seq > this.head) this.head = seq
    }
    this.entries = entries
  }

  /**
   * Append one fact; the durable write is the commit point of the mutation
   * it records. A replay of the same idempotency key with identical caller
   * fields returns the stored fact; with different fields it fails loud.
   * @param fact - caller-supplied fields; the journal assigns the envelope.
   * @returns the stored fact with its assigned journalSeq and eventId.
   */
  @Remote('append')
  async append(fact: JournalFactInput): Promise<JournalFact> {
    const input = this.validateInput(fact)
    const existing = this.findByIdempotencyKey(input.idempotencyKey)
    if (existing !== undefined) {
      if (this.callerFieldsMatch(existing, input)) return existing
      throw new JournalError(
        'idempotency-conflict',
        `idempotency key "${input.idempotencyKey}" was already appended with different caller fields`,
      )
    }
    const appended = this.appendTail.then(() => this.appendNow(input))
    this.appendTail = appended.then(() => undefined, () => undefined)
    return appended
  }

  /**
   * Recovery and client-resync position: the highest assigned journalSeq.
   * @returns the checkpoint; `journalSeq` is 0 when the journal is empty.
   */
  @Remote('checkpoint')
  checkpoint(): JournalCheckpoint {
    return { journalSeq: this.head }
  }

  /**
   * Read every fact after one sequence position, in journal order. The
   * authoritative resynchronization path: projections and clients rebuild
   * from replay, never from events.
   * @param afterSeq - exclusive lower bound; 0 replays the whole journal.
   * @returns facts with `journalSeq > afterSeq`, ascending.
   */
  @Remote('replay')
  replay(afterSeq: number): JournalFact[] {
    if (!Number.isSafeInteger(afterSeq) || afterSeq < 0) {
      throw new JournalError('invalid-argument', `afterSeq must be a non-negative safe integer, got ${String(afterSeq)}`)
    }
    const entries = this.requireEntries()
    const facts: JournalFact[] = []
    for (let seq = afterSeq + 1; seq <= this.head; seq += 1) {
      const fact = entries.get(journalSeqKey(seq))
      if (fact === undefined) {
        throw new JournalError('invalid-fact', `journal has no fact ${String(seq)}: the sequence must be gapless`)
      }
      facts.push(fact)
    }
    return facts
  }

  /** Validate every caller-supplied field; envelope fields stay journal-assigned. */
  private validateInput(fact: JournalFactInput): JournalFactInput {
    const requireText = (value: unknown, field: string): string => {
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new JournalError('invalid-fact', `${field} must be a non-empty string`)
      }
      return value.trim()
    }
    if (!Number.isSafeInteger(fact.entityRevision) || fact.entityRevision < 1) {
      throw new JournalError('invalid-fact', `entityRevision must be a positive safe integer, got ${String(fact.entityRevision)}`)
    }
    return {
      taskId: requireText(fact.taskId, 'taskId') as JournalFactInput['taskId'],
      kind: requireText(fact.kind, 'kind'),
      actor: requireText(fact.actor, 'actor'),
      idempotencyKey: requireText(fact.idempotencyKey, 'idempotencyKey'),
      entityRevision: fact.entityRevision,
      payload: fact.payload,
      ...(fact.causationId === undefined ? {} : { causationId: requireText(fact.causationId, 'causationId') as NonNullable<JournalFactInput['causationId']> }),
      ...(fact.correlationId === undefined ? {} : { correlationId: requireText(fact.correlationId, 'correlationId') }),
    }
  }

  /** One serialized allocation-and-write step; the durable put is the commit point. */
  private async appendNow(input: JournalFactInput): Promise<JournalFact> {
    const entries = this.requireEntries()
    const fact: JournalFact = {
      journalSeq: this.head + 1,
      eventId: JournalEventId(randomUUID()),
      taskId: input.taskId,
      kind: input.kind,
      occurredAt: Date.now(),
      actor: input.actor,
      ...(input.causationId === undefined ? {} : { causationId: input.causationId }),
      ...(input.correlationId === undefined ? {} : { correlationId: input.correlationId }),
      idempotencyKey: input.idempotencyKey,
      entityRevision: input.entityRevision,
      payload: input.payload,
      schemaVersion: FACT_SCHEMA_VERSION,
    }
    await entries.put(journalSeqKey(fact.journalSeq), fact)
    this.head = fact.journalSeq
    return fact
  }

  /** Scan for a stored fact under one idempotency key; M1 scale is a linear scan. */
  private findByIdempotencyKey(key: string): JournalFact | undefined {
    for (const fact of this.requireEntries().entries()) {
      if (fact[1].idempotencyKey === key) return fact[1]
    }
    return undefined
  }

  /** Whether a stored fact carries exactly the caller's fields. */
  private callerFieldsMatch(stored: JournalFact, input: JournalFactInput): boolean {
    return stored.taskId === input.taskId
      && stored.kind === input.kind
      && stored.actor === input.actor
      && stored.idempotencyKey === input.idempotencyKey
      && stored.entityRevision === input.entityRevision
      && JSON.stringify(stored.payload) === JSON.stringify(input.payload)
      && stored.causationId === input.causationId
      && stored.correlationId === input.correlationId
  }

  /** The opened entries table; absent before service start or after disposal. */
  private requireEntries(): KvTable<string, JournalFact> {
    if (this.entries === undefined) {
      throw new JournalError('invalid-argument', 'journal domain is not open')
    }
    return this.entries
  }
}

export default WorkbenchJournalService
