/**
 * Workbench journal (`ctx.workbenchJournal`): the task-flow append-only fact
 * source over one storageDomain unit. `append` assigns a gapless monotonic
 * journalSeq and is the commit point of every task-flow entity mutation �? * entity projections are rebuildable from `replay`, so Cordis events stay
 * droppable wake-ups. No journal-specific events exist by design.
 * @module @deepseek-ai/dsh-workbench-journal
 */
import { Context, Service } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { JournalCheckpoint, JournalFact, JournalFactInput } from './types.ts';
export type * from './types.ts';
export { JournalEventId } from './runtime.ts';
export { JOURNAL_SEQ_KEY_WIDTH, journalFactSchema, journalSeqKey, workbenchJournalDomainSpec, } from './spec.ts';
export { JournalError } from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        workbenchJournal: WorkbenchJournalService;
    }
}
/** Append-only journal service; the durable truth task-flow projections rebuild from. */
export declare class WorkbenchJournalService extends TypertRemoteService {
    /** The journal opens its domain on the mounted storage-domain facility. */
    static inject: string[];
    private entries?;
    /** Highest assigned journalSeq; derived from stored keys at open. */
    private head;
    /** Serializes seq allocation with the durable write; keeps appends gapless. */
    private appendTail;
    /**
     * @param ctx - Host context carrying the storage-domain facility.
     */
    constructor(ctx: Context);
    /** Open and own the journal domain; derive head from the stored facts. */
    protected [Service.init](): Promise<void>;
    /**
     * Append one fact; the durable write is the commit point of the mutation
     * it records. A replay of the same idempotency key with identical caller
     * fields returns the stored fact; with different fields it fails loud.
     * @param fact - caller-supplied fields; the journal assigns the envelope.
     * @returns the stored fact with its assigned journalSeq and eventId.
     */
    append(fact: JournalFactInput): Promise<JournalFact>;
    /**
     * Recovery and client-resync position: the highest assigned journalSeq.
     * @returns the checkpoint; `journalSeq` is 0 when the journal is empty.
     */
    checkpoint(): JournalCheckpoint;
    /**
     * Read every fact after one sequence position, in journal order. The
     * authoritative resynchronization path: projections and clients rebuild
     * from replay, never from events.
     * @param afterSeq - exclusive lower bound; 0 replays the whole journal.
     * @returns facts with `journalSeq > afterSeq`, ascending.
     */
    replay(afterSeq: number): JournalFact[];
    /** Validate every caller-supplied field; envelope fields stay journal-assigned. */
    private validateInput;
    /** One serialized allocation-and-write step; the durable put is the commit point. */
    private appendNow;
    /** Scan for a stored fact under one idempotency key; M1 scale is a linear scan. */
    private findByIdempotencyKey;
    /** Whether a stored fact carries exactly the caller's fields. */
    private callerFieldsMatch;
    /** The opened entries table; absent before service start or after disposal. */
    private requireEntries;
}
export default WorkbenchJournalService;
//# sourceMappingURL=index.d.ts.map