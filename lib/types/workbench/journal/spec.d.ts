/**
 * The journal's storage-domain declaration: one append-only `entries` table
 * keyed by zero-padded journalSeq. The head sequence is derived from the
 * stored keys at open, so no separate durable counter can drift from the
 * facts it counts.
 * @module @deepseek-ai/dsh-workbench-journal/src/spec
 */
import { z } from 'zod';
import type { JournalFact } from './types.ts';
/** Envelope schema for one stored journal fact. */
export declare const journalFactSchema: z.ZodType<JournalFact>;
/** Width of the zero-padded journalSeq table key; orders keys lexicographically. */
export declare const JOURNAL_SEQ_KEY_WIDTH = 16;
/**
 * Table key of one journalSeq: fixed-width zero padding keeps lexical order
 * equal to numeric order across the whole sequence space.
 * @param journalSeq - the fact's sequence number.
 * @returns the zero-padded table key.
 */
export declare function journalSeqKey(journalSeq: number): string;
/** The journal domain: identity, format version, and the entries table. */
export declare const workbenchJournalDomainSpec: {
    name: string;
    version: number;
    tables: {
        entries: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, JournalFact>;
    };
};
//# sourceMappingURL=spec.d.ts.map