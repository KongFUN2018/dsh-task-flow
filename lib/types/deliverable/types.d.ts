/**
 * Deliverable-local type surface: immutable version chains with registered
 * dependency edges, idempotent saves, and persisted impact snapshots — the
 * M2 evolution of the M1 wire contract (same service key, same three Remote
 * methods, evolved parameters and returns). Types only — no runtime code.
 * @module @deepseek-ai/dsh-deliverable-local/types
 */
import type { Branded } from '@deepseek-ai/dsh-brand';
import type { DeliverableVersionRef, PhaseRunId, SubmissionId } from '../task/types.ts';
/** One deliverable identity; versions chain under it. */
export type DeliverableId = Branded<'DeliverableId'>;
/** One immutable deliverable version identity, assigned by the service. */
export type DeliverableVersionId = Branded<'DeliverableVersionId'>;
/** One persisted impact-snapshot identity, assigned at invalidation. */
export type ImpactSnapshotId = Branded<'ImpactSnapshotId'>;
/**
 * Branch-product state; `listCurrentInputs` admits only `current`. The M2
 * invalidation closure is the only writer of `stale`.
 */
export type DeliverableVersionState = 'current' | 'stale' | 'invalid' | 'superseded' | 'cancelled';
/** One immutable deliverable version; the chain under a deliverableId. */
export interface DeliverableVersion {
    /** Immutable version identity, assigned by the service. */
    readonly versionId: DeliverableVersionId;
    /** Deliverable this version belongs to. */
    readonly deliverableId: DeliverableId;
    /** Monotonic position in the deliverable's chain, from 1. */
    readonly versionNumber: number;
    /** Previous version in the same chain; absent on the root version. */
    readonly baseVersionId?: DeliverableVersionId;
    /** Submission that produced this version, when known. */
    readonly sourceSubmissionId?: SubmissionId;
    /** Input versions the producing submission consumed; the task write chain registers them at acceptance. */
    readonly dependsOn?: readonly DeliverableVersionRef[];
    /** Branch-product state; saves write `current`, invalidation transitions to `stale`. */
    readonly state: DeliverableVersionState;
    /** Bumps on each state transition; content and identity never change. */
    readonly entityRevision: number;
    /** Epoch milliseconds at save. */
    readonly createdAt: number;
}
/** Versions one invalidation newly transitioned to stale, grouped per deliverable. */
export interface ImpactStaledVersions {
    /** Deliverable whose chain lost versions. */
    readonly deliverableId: DeliverableId;
    /** Newly staled version ids, ascending by version number. */
    readonly versionIds: readonly DeliverableVersionId[];
}
/** Recorded gate-check verdicts one impact snapshot covers, per submission. */
export interface ImpactStaledGateChecks {
    /** Submission whose recorded verdicts the closure covers. */
    readonly submissionId: SubmissionId;
    /** Verdict identities (`checkId`) the closure covers. */
    readonly checkIds: readonly string[];
}
/**
 * The persisted result of one multi-root downstream invalidation: the
 * transitive closure over `dependsOn` edges, the phase runs whose registered
 * inputs lost currency, and the recorded gate verdicts those runs' submissions
 * produced. Consumers apply it to the task plane; the snapshot itself is the
 * durable record.
 */
export interface ImpactSnapshot {
    /** Immutable snapshot identity, assigned by the service. */
    readonly snapshotId: ImpactSnapshotId;
    /** Version ids the caller named as invalidation roots. */
    readonly roots: readonly DeliverableVersionId[];
    /** Newly staled versions, grouped per deliverable. */
    readonly staledVersions: readonly ImpactStaledVersions[];
    /** Phase runs whose registered inputs include a newly staled version. */
    readonly affectedPhaseRuns: readonly PhaseRunId[];
    /** Recorded gate verdicts covered by the closure, per submission. */
    readonly staledGateChecks: readonly ImpactStaledGateChecks[];
    /** Epoch milliseconds at invalidation. */
    readonly createdAt: number;
}
/** Machine-routable deliverable failure codes. */
export type DeliverableErrorCode = 'stale-write' | 'not-found' | 'invalid-argument' | 'idempotency-conflict';
/** Deliverable failure with code and message. */
export declare class DeliverableError extends Error {
    /** Machine-routable failure code. */
    readonly code: DeliverableErrorCode;
    /**
     * @param code - Machine-routable failure code.
     * @param message - Human-readable failure description.
     */
    constructor(code: DeliverableErrorCode, message: string);
}
/** Journal fact kinds the deliverable service appends, one per durable write. */
export type DeliverableFactKind = 'deliverable/version-saved' | 'deliverable/version-staled' | 'deliverable/impact-snapshotted';
//# sourceMappingURL=types.d.ts.map