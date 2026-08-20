/**
 * Pure PhaseSubmission acceptance per the phase-submission protocol. The
 * caller supplies every external fact (recipe hash, session watermark,
 * deliverable currency) so this module stays free of services.
 * @module @deepseek-ai/dsh-task/src/submission
 */
import type { PhaseSubmission, PhaseRunRecord, TaskRecord, TaskRunRecord } from './types.ts';
/** External facts one acceptance run reads. */
export interface SubmissionAcceptanceFacts {
    readonly submission: PhaseSubmission;
    readonly task: TaskRecord;
    readonly run: TaskRunRecord;
    readonly phaseRun: PhaseRunRecord;
    /** Content hash the recipe registry returned for the pinned identity. */
    readonly registeredHash: string;
    /** The source session log persisted through the submission's sequence range. */
    readonly sourceSeqPersisted: boolean;
    /** Every input deliverable version is still the current one. */
    readonly inputsCurrent: boolean;
    /** Every output deliverable version exists and traces to this submission. */
    readonly outputsValid: boolean;
    /** A submission already stored under the same idempotency key, if any. */
    readonly existingByIdempotency?: PhaseSubmission;
}
/** Acceptance verdict: ok with problems, or an idempotent replay return. */
export interface SubmissionAcceptance {
    readonly ok: boolean;
    readonly problems: readonly string[];
    readonly idempotentReturn?: PhaseSubmission;
}
/**
 * Judge one submission against the protocol's acceptance rules.
 * @param facts - the submission plus every external fact it needs.
 * @returns the verdict; `idempotentReturn` replaces storing anything new.
 */
export declare function acceptSubmission(facts: SubmissionAcceptanceFacts): SubmissionAcceptance;
//# sourceMappingURL=submission.d.ts.map