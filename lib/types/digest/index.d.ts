/**
 * Digest service (`ctx.digest`): the M6 journal-derived read projection of
 * one task — run branches, timeline, phase summaries, decision history, and
 * deliverable states. Pure read: it never writes the task plane, never opens
 * attention items, and never touches Gate or scheduling.
 * @module @deepseek-ai/dsh-digest
 */
import { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import '../task/index.ts';
import '../workbench/journal/index.ts';
import '../deliverable/index.ts';
import type { TaskDigest } from './types.ts';
export type { TaskDigest, DigestRunBranch, DigestTimelineEntry, DigestPhaseSummary, DigestDecision, DigestDeliverableState } from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        digest: DigestService;
    }
}
/** Digest read errors; no write-side ladder exists. */
export declare class DigestError extends Error {
    readonly code: 'not-found' | 'invalid-argument';
    constructor(code: 'not-found' | 'invalid-argument', message: string);
}
/** The digest service: one read-only Remote per task. */
export declare class DigestService extends TypertRemoteService {
    /** The service reads the journal, the task projection, and the versions. */
    static inject: string[];
    /**
     * @param ctx - Host context carrying the task, journal, and deliverable services.
     */
    constructor(ctx: Context);
    /**
     * Derive one task's digest from the journal and the entity projections.
     * @param taskId - the task to digest.
     * @returns the full digest projection.
     */
    digest(taskId: string): Promise<TaskDigest>;
    /** Validate one non-empty wire field, returning the trimmed value. */
    private requireText;
}
export default DigestService;
//# sourceMappingURL=index.d.ts.map