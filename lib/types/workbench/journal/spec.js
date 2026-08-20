/**
 * The journal's storage-domain declaration: one append-only `entries` table
 * keyed by zero-padded journalSeq. The head sequence is derived from the
 * stored keys at open, so no separate durable counter can drift from the
 * facts it counts.
 * @module @deepseek-ai/dsh-workbench-journal/src/spec
 */
import { z } from 'zod';
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain';
/** JSON value accepted as a fact payload at the durable boundary. */
const jsonValue = z.lazy(() => z.union([z.null(), z.boolean(), z.number(), z.string(), z.array(jsonValue), z.record(z.string(), jsonValue)]));
/** Wire string branded as a task id at the durable boundary. */
const taskId = z.string().min(1).transform(value => value);
/** Wire string branded as a journal event id at the durable boundary. */
const journalEventId = z.string().min(1).transform(value => value);
/** Envelope schema for one stored journal fact. */
// Zod infers transformed branded fields structurally, so it cannot name the
// frozen wire interface even though every branded output is created here.
export const journalFactSchema = z.object({
    journalSeq: z.number().int().min(1),
    eventId: journalEventId,
    taskId,
    kind: z.string().min(1),
    occurredAt: z.number().int().min(1),
    actor: z.string().min(1),
    causationId: journalEventId.optional(),
    correlationId: z.string().min(1).optional(),
    idempotencyKey: z.string().min(1),
    entityRevision: z.number().int().min(1),
    payload: jsonValue,
    schemaVersion: z.number().int().min(1),
});
/** Width of the zero-padded journalSeq table key; orders keys lexicographically. */
export const JOURNAL_SEQ_KEY_WIDTH = 16;
/**
 * Table key of one journalSeq: fixed-width zero padding keeps lexical order
 * equal to numeric order across the whole sequence space.
 * @param journalSeq - the fact's sequence number.
 * @returns the zero-padded table key.
 */
export function journalSeqKey(journalSeq) {
    return journalSeq.toString().padStart(JOURNAL_SEQ_KEY_WIDTH, '0');
}
/** The journal domain: identity, format version, and the entries table. */
export const workbenchJournalDomainSpec = defineDomain({
    name: 'workbench_journal',
    version: 1,
    tables: {
        entries: domainTable(journalFactSchema),
    },
});
//# sourceMappingURL=spec.js.map