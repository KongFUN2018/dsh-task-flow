/**
 * Deliverable-local service (`ctx.deliverables`): immutable version chains
 * with registered dependency edges over one storageDomain unit, replacing the
 * M1 minimal provider behind the same Remote surface. `saveVersion` is
 * idempotent per caller key, `listCurrentInputs` admits only current branch
 * products of one phase run, and `invalidateDownstream` computes the
 * multi-root transitive closure over `dependsOn` edges and chain lineage,
 * persists an `ImpactSnapshot`, and appends the deliverable journal facts.
 * Every durable write appends its journal fact first; the projection puts
 * that follow rebuild from replay.
 * @module @deepseek-ai/dsh-deliverable-local
 */
import { Context, Service } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { DeliverableVersionRef, PhaseRunId } from '../task/types.ts';
import '../workbench/journal/index.ts';
import type { DeliverableVersion, ImpactSnapshot } from './types.ts';
export type * from './types.ts';
export { DeliverableId, DeliverableVersionId, ImpactSnapshotId } from './runtime.ts';
export { deliverableLocalDomainSpec, deliverableVersionSchema, phaseInputsSchema } from './spec.ts';
export type { PhaseInputs } from './spec.ts';
export { DeliverableError } from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        deliverables: DeliverableService;
    }
}
/**
 * Deliverable-local service: the M2 deliverable domain behind the M1 service
 * key and Remote surface, with idempotent saves, write-chain-owned dependency
 * edges, and persisted multi-root impact closures.
 */
export declare class DeliverableService extends TypertRemoteService {
    /** The service opens its domain and appends facts to the workbench journal. */
    static inject: string[];
    private versions?;
    private phaseInputs?;
    private saveKeys?;
    private latest?;
    private snapshots?;
    /** Serializes read-validate-write mutations so concurrent writers never interleave. */
    private mutationTail;
    /**
     * @param ctx - Host context carrying the storage-domain facility and the workbench journal.
     */
    constructor(ctx: Context);
    /** Open and own the deliverable-local domain. */
    protected [Service.init](): Promise<void>;
    /**
     * Create one immutable version of a deliverable. The caller names the base
     * version it built on; a base that is no longer the latest version rejects
     * with `stale-write`. A staled head remains chainable: the successor
     * re-validates the deliverable after an impact retires the head's
     * conclusions. A save replaying a caller idempotency key with identical
     * fields returns the stored version; with different fields it fails loud
     * with `idempotency-conflict`, the same rule the journal applies to facts.
     * @param deliverableId - raw deliverable identifier.
     * @param expectedBaseVersion - the latest version the caller built on; `null` on a root version.
     * @param sourceSubmissionId - raw submission identifier that produced the version, when known.
     * @param idempotencyKey - caller-owned replay key; omit for a fresh save.
     * @returns the stored immutable version.
     */
    saveVersion(deliverableId: string, expectedBaseVersion: string | null, sourceSubmissionId: string | null, idempotencyKey?: string | null): Promise<DeliverableVersion>;
    /**
     * List the current input versions of one phase run: every registered input
     * whose state is `current`, in registration order. Stale, invalid,
     * superseded, and cancelled branch products are excluded.
     * @param phaseRunId - raw phase-run identifier.
     * @returns the current input versions.
     */
    listCurrentInputs(phaseRunId: string): DeliverableVersion[];
    /**
     * List every deliverable version in registration order. The metrics
     * service filters current/valid products from this; no aggregation here.
     * @returns all stored versions.
     */
    listVersions(): DeliverableVersion[];
    /**
     * Invalidate everything downstream of the named roots: each root and its
     * transitive consumers over `dependsOn` edges transition to `stale`;
     * already-stale subgraphs are skipped, and chain lineage alone is not an
     * impact edge — an upstream edit's own successor survives. The closure is
     * persisted as an `ImpactSnapshot` covering the newly staled versions
     * grouped per deliverable, the phase runs whose registered inputs lost
     * currency, and the recorded gate verdicts those runs' submissions
     * produced.
     * @param rootVersionIds - raw version ids whose downstream loses currency.
     * @returns the persisted impact snapshot.
     */
    invalidateDownstream(rootVersionIds: string[]): Promise<ImpactSnapshot>;
    /**
     * Register (or replace) the input versions of one phase run. Host-side seam:
     * the task write chain records a submission's input refs here at acceptance.
     * @param phaseRunId - raw phase-run identifier.
     * @param versionIds - raw input version ids in stable order.
     */
    recordPhaseInputs(phaseRunId: string, versionIds: string[]): Promise<void>;
    /**
     * List the phase runs whose registered inputs include one version. Host-side
     * seam: the edit-lock service freezes exactly these runs while the version
     * is under a lease.
     * @param targetVersionId - raw version id the runs consume.
     * @returns the consuming phase-run ids.
     */
    listConsumingPhaseRuns(targetVersionId: string): PhaseRunId[];
    /**
     * Register the dependency edges of one version: the input versions its
     * producing submission consumed. Host-side seam owned by the task write
     * chain at acceptance — executors never declare edges. Registering the same
     * refs twice is a no-op; different refs for the same version fail loud.
     * @param versionId - raw version identifier the edges complete.
     * @param dependsOn - the input version refs the producing submission consumed.
     */
    registerVersionDependencies(versionId: string, dependsOn: readonly DeliverableVersionRef[]): Promise<void>;
    /**
     * Read one version by identity; `undefined` when absent. Host-side seam for
     * the task write chain's output-exists and source-matches checks.
     * @param versionId - raw version id.
     * @returns the stored version, or `undefined`.
     */
    getVersion(versionId: string): DeliverableVersion | undefined;
    /**
     * Read one persisted impact snapshot by identity; `undefined` when absent.
     * Host-side read for impact consumers and replay.
     * @param snapshotId - raw snapshot id.
     * @returns the stored snapshot, or `undefined`.
     */
    getImpactSnapshot(snapshotId: string): ImpactSnapshot | undefined;
    /** One serialized save step; the durable fact is the commit point of the version. */
    private saveVersionNow;
    /**
     * Replay a keyed save: the save-index hit returns the stored version after
     * a field comparison; a miss with the journal fact already appended (a
     * crash between the fact and the projections) repairs the projections from
     * the fact's payload. Either mismatch fails loud.
     */
    private replaySave;
    /** Compare a replayed save's caller fields with the stored version; any difference is a conflict. */
    private assertSaveFieldsMatch;
    /** One serialized dependency registration; the durable put completes the version record. */
    private registerVersionDependenciesNow;
    /**
     * One serialized invalidation step: validate every root, walk the
     * multi-root closure, transition the covered versions, derive the covered
     * task plane, and persist the snapshot.
     */
    private invalidateDownstreamNow;
    /** Group the closure's versions per deliverable, ascending by version number. */
    private groupStaledVersions;
    /** Phase runs whose registered inputs include a newly staled version. */
    private affectedRuns;
    /**
     * Recorded gate verdicts the closure covers, derived from the journal: the
     * submissions of every affected run (by `phaseRunId`) and their recorded
     * `gate-check/recorded` verdicts. Derivation reads the authoritative fact
     * stream, never task projections.
     */
    private coveredGateChecks;
    /** The latest version of one deliverable from the index, or `undefined` when it has none. */
    private latestVersionOf;
    /**
     * The task a version's facts belong to: the source submission's task when
     * the journal traces one, otherwise the untasked sentinel.
     */
    private factTaskOf;
    /** Every stored fact of one kind, in journal order. */
    private factsOfKind;
    /** The stored fact with one idempotency key, when present. */
    private factByKey;
    /** Append one deliverable fact; the journal's durable write is the commit point. */
    private appendFact;
    /** Validate one non-empty wire field, returning the trimmed value. */
    private requireText;
    /** Enqueue one mutation on the service's serialized tail. */
    private enqueue;
    private requireVersions;
    private requirePhaseInputs;
    private requireSaveKeys;
    private requireLatest;
    private requireSnapshots;
}
export default DeliverableService;
//# sourceMappingURL=index.d.ts.map