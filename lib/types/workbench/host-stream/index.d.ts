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
import { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import '../../workbench/journal/index.ts';
import type { IncrementalPage } from './types.ts';
export type * from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        workbenchHostStream: WorkbenchHostStreamService;
    }
}
/**
 * Attention incremental stream: the M4 cursor-based change feed over the
 * persistent attention inbox, derived from the append-only workbench journal.
 */
export declare class WorkbenchHostStreamService extends TypertRemoteService {
    /** The service reads the workbench journal; it owns no durable domain. */
    static inject: string[];
    /** Per-boot epoch; a client holding a cursor from another boot resnapshots. */
    private readonly streamId;
    constructor(ctx: Context);
    /**
     * Read the attention change events after a journal cursor and the new cursor.
     * @param cursor - exclusive journal lower bound; omitted or non-positive replays the whole stream.
     * @returns the events in journal order plus this boot's stream id and cursor.
     */
    listIncremental(cursor?: number): IncrementalPage;
}
export default WorkbenchHostStreamService;
//# sourceMappingURL=index.d.ts.map