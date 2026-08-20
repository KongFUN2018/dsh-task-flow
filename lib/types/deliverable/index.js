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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { randomUUID } from 'node:crypto';
import { Service } from '@deepseek-ai/cordis';
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import "../workbench/journal/index.js";
import { DeliverableId, DeliverableVersionId as DeliverableVersionIdValue, ImpactSnapshotId, UNTASKED_FACT_TASK_ID } from "./runtime.js";
import { deliverableLocalDomainSpec } from "./spec.js";
import { DeliverableError } from "./types.js";
export { DeliverableId, DeliverableVersionId, ImpactSnapshotId } from "./runtime.js";
export { deliverableLocalDomainSpec, deliverableVersionSchema, phaseInputsSchema } from "./spec.js";
export { DeliverableError } from "./types.js";
/** States a fresh version is created in. */
const INITIAL_STATE = 'current';
/** The actor recorded on deliverable facts: saves carry no mutation context. */
const FACT_ACTOR = 'deliverables';
/** The journal fact key of one save's commit point. */
function saveFactKey(idempotencyKey) {
    return `deliverable/save:${idempotencyKey}`;
}
/** Field-wise equality of one replayed dependency edge against its stored twin. */
function sameDependency(ref, declared) {
    return declared !== undefined
        && ref.deliverableId === declared.deliverableId
        && ref.versionId === declared.versionId;
}
/**
 * Deliverable-local service: the M2 deliverable domain behind the M1 service
 * key and Remote surface, with idempotent saves, write-chain-owned dependency
 * edges, and persisted multi-root impact closures.
 */
let DeliverableService = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _saveVersion_decorators;
    let _listCurrentInputs_decorators;
    let _listVersions_decorators;
    let _invalidateDownstream_decorators;
    return class DeliverableService extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _saveVersion_decorators = [Remote('saveVersion')];
            _listCurrentInputs_decorators = [Remote('listCurrentInputs')];
            _listVersions_decorators = [Remote('listVersions')];
            _invalidateDownstream_decorators = [Remote('invalidateDownstream')];
            __esDecorate(this, null, _saveVersion_decorators, { kind: "method", name: "saveVersion", static: false, private: false, access: { has: obj => "saveVersion" in obj, get: obj => obj.saveVersion }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listCurrentInputs_decorators, { kind: "method", name: "listCurrentInputs", static: false, private: false, access: { has: obj => "listCurrentInputs" in obj, get: obj => obj.listCurrentInputs }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listVersions_decorators, { kind: "method", name: "listVersions", static: false, private: false, access: { has: obj => "listVersions" in obj, get: obj => obj.listVersions }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _invalidateDownstream_decorators, { kind: "method", name: "invalidateDownstream", static: false, private: false, access: { has: obj => "invalidateDownstream" in obj, get: obj => obj.invalidateDownstream }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        /** The service opens its domain and appends facts to the workbench journal. */
        static { this.inject = ['storageDomain', 'workbenchJournal']; }
        /**
         * @param ctx - Host context carrying the storage-domain facility and the workbench journal.
         */
        constructor(ctx) {
            super(ctx, 'deliverables');
            this.versions = __runInitializers(this, _instanceExtraInitializers);
            /** Serializes read-validate-write mutations so concurrent writers never interleave. */
            this.mutationTail = Promise.resolve();
        }
        /** Open and own the deliverable-local domain. */
        async [Service.init]() {
            const domain = await this.ctx.storageDomain.open(deliverableLocalDomainSpec);
            this.ctx.effect(() => async () => {
                await domain.close();
            }, 'deliverable-local.domainClose');
            this.versions = domain.table('versions');
            this.phaseInputs = domain.table('phase_inputs');
            this.saveKeys = domain.table('save_keys');
            this.latest = domain.table('latest');
            this.snapshots = domain.table('impact_snapshots');
        }
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
        saveVersion(deliverableId, expectedBaseVersion, sourceSubmissionId, idempotencyKey) {
            const deliverable = this.requireText(deliverableId, 'deliverableId');
            if (expectedBaseVersion !== null)
                this.requireText(expectedBaseVersion, 'expectedBaseVersion');
            if (sourceSubmissionId !== null)
                this.requireText(sourceSubmissionId, 'sourceSubmissionId');
            if (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey.trim().length === 0) {
                throw new DeliverableError('invalid-argument', 'idempotencyKey must be a non-empty string when present');
            }
            const input = {
                deliverableId: DeliverableId(deliverable),
                expectedBaseVersion: expectedBaseVersion === null ? null : DeliverableVersionIdValue(expectedBaseVersion),
                sourceSubmissionId: sourceSubmissionId === null ? undefined : sourceSubmissionId,
                idempotencyKey: idempotencyKey?.trim() || undefined,
            };
            const result = this.mutationTail.then(() => this.saveVersionNow(input));
            this.mutationTail = result.then(() => undefined, () => undefined);
            return result;
        }
        /**
         * List the current input versions of one phase run: every registered input
         * whose state is `current`, in registration order. Stale, invalid,
         * superseded, and cancelled branch products are excluded.
         * @param phaseRunId - raw phase-run identifier.
         * @returns the current input versions.
         */
        listCurrentInputs(phaseRunId) {
            const runId = this.requireText(phaseRunId, 'phaseRunId');
            const inputs = this.requirePhaseInputs().get(runId);
            if (inputs === undefined)
                return [];
            const versions = this.requireVersions();
            const current = [];
            for (const versionId of inputs.inputVersionIds) {
                const version = versions.get(versionId);
                if (version !== undefined && version.state === 'current')
                    current.push(version);
            }
            return current;
        }
        /**
         * List every deliverable version in registration order. The metrics
         * service filters current/valid products from this; no aggregation here.
         * @returns all stored versions.
         */
        listVersions() {
            return [...this.requireVersions().entries()].map(([, version]) => version);
        }
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
        invalidateDownstream(rootVersionIds) {
            if (!Array.isArray(rootVersionIds) || rootVersionIds.length === 0) {
                throw new DeliverableError('invalid-argument', 'rootVersionIds must be a non-empty array');
            }
            const roots = rootVersionIds.map((id) => {
                this.requireText(id, 'rootVersionId');
                return DeliverableVersionIdValue(id);
            });
            const result = this.mutationTail.then(() => this.invalidateDownstreamNow(roots));
            this.mutationTail = result.then(() => undefined, () => undefined);
            return result;
        }
        /**
         * Register (or replace) the input versions of one phase run. Host-side seam:
         * the task write chain records a submission's input refs here at acceptance.
         * @param phaseRunId - raw phase-run identifier.
         * @param versionIds - raw input version ids in stable order.
         */
        async recordPhaseInputs(phaseRunId, versionIds) {
            const runId = this.requireText(phaseRunId, 'phaseRunId');
            const inputVersionIds = versionIds.map((id) => {
                this.requireText(id, 'versionId');
                return id;
            });
            await this.enqueue(() => this.requirePhaseInputs().put(runId, { inputVersionIds }));
        }
        /**
         * List the phase runs whose registered inputs include one version. Host-side
         * seam: the edit-lock service freezes exactly these runs while the version
         * is under a lease.
         * @param targetVersionId - raw version id the runs consume.
         * @returns the consuming phase-run ids.
         */
        listConsumingPhaseRuns(targetVersionId) {
            const target = this.requireText(targetVersionId, 'targetVersionId');
            const consuming = [];
            for (const [runId, inputs] of this.requirePhaseInputs().entries()) {
                if (inputs.inputVersionIds.includes(target))
                    consuming.push(runId);
            }
            return consuming;
        }
        /**
         * Register the dependency edges of one version: the input versions its
         * producing submission consumed. Host-side seam owned by the task write
         * chain at acceptance — executors never declare edges. Registering the same
         * refs twice is a no-op; different refs for the same version fail loud.
         * @param versionId - raw version identifier the edges complete.
         * @param dependsOn - the input version refs the producing submission consumed.
         */
        async registerVersionDependencies(versionId, dependsOn) {
            const id = DeliverableVersionIdValue(this.requireText(versionId, 'versionId'));
            const refs = dependsOn.map((ref) => {
                this.requireText(ref.deliverableId, 'deliverableId');
                this.requireText(ref.versionId, 'versionId');
                return ref;
            });
            await this.enqueue(() => this.registerVersionDependenciesNow(id, refs));
        }
        /**
         * Read one version by identity; `undefined` when absent. Host-side seam for
         * the task write chain's output-exists and source-matches checks.
         * @param versionId - raw version id.
         * @returns the stored version, or `undefined`.
         */
        getVersion(versionId) {
            return this.requireVersions().get(DeliverableVersionIdValue(this.requireText(versionId, 'versionId')));
        }
        /**
         * Read one persisted impact snapshot by identity; `undefined` when absent.
         * Host-side read for impact consumers and replay.
         * @param snapshotId - raw snapshot id.
         * @returns the stored snapshot, or `undefined`.
         */
        getImpactSnapshot(snapshotId) {
            return this.requireSnapshots().get(this.requireText(snapshotId, 'snapshotId'));
        }
        /** One serialized save step; the durable fact is the commit point of the version. */
        async saveVersionNow(input) {
            if (input.idempotencyKey !== undefined) {
                const replayed = await this.replaySave(input);
                if (replayed !== undefined)
                    return replayed;
            }
            const latest = this.latestVersionOf(input.deliverableId);
            const versions = this.requireVersions();
            if (latest === undefined) {
                if (input.expectedBaseVersion !== null) {
                    throw new DeliverableError('stale-write', 'deliverable has no version yet; expectedBaseVersion must be null');
                }
            }
            else {
                if (latest.versionId !== input.expectedBaseVersion) {
                    throw new DeliverableError('stale-write', 'expectedBaseVersion is not the latest version of the deliverable');
                }
            }
            const version = {
                versionId: DeliverableVersionIdValue(randomUUID()),
                deliverableId: input.deliverableId,
                versionNumber: latest === undefined ? 1 : latest.versionNumber + 1,
                ...(latest === undefined ? {} : { baseVersionId: latest.versionId }),
                ...(input.sourceSubmissionId === undefined ? {} : { sourceSubmissionId: input.sourceSubmissionId }),
                state: INITIAL_STATE,
                entityRevision: 1,
                createdAt: Date.now(),
            };
            await this.appendFact({
                kind: 'deliverable/version-saved',
                taskId: this.factTaskOf(version),
                entityId: version.versionId,
                entityRevision: 1,
                idempotencyKey: input.idempotencyKey === undefined ? `deliverable/version-saved:${version.versionId}` : saveFactKey(input.idempotencyKey),
                payload: version,
            });
            await versions.put(version.versionId, version);
            await this.requireLatest().put(input.deliverableId, { versionId: version.versionId });
            if (input.idempotencyKey !== undefined) {
                await this.requireSaveKeys().put(input.idempotencyKey, { versionId: version.versionId });
            }
            return version;
        }
        /**
         * Replay a keyed save: the save-index hit returns the stored version after
         * a field comparison; a miss with the journal fact already appended (a
         * crash between the fact and the projections) repairs the projections from
         * the fact's payload. Either mismatch fails loud.
         */
        async replaySave(input) {
            const indexed = this.requireSaveKeys().get(input.idempotencyKey);
            if (indexed !== undefined) {
                const stored = this.requireVersions().get(indexed.versionId);
                if (stored === undefined) {
                    throw new DeliverableError('not-found', `save index entry "${input.idempotencyKey}" names a missing version`);
                }
                this.assertSaveFieldsMatch(input, stored);
                return stored;
            }
            const fact = this.factByKey(saveFactKey(input.idempotencyKey));
            if (fact === undefined)
                return undefined;
            const recovered = fact.payload;
            this.assertSaveFieldsMatch(input, recovered);
            await this.requireVersions().put(recovered.versionId, recovered);
            await this.requireLatest().put(recovered.deliverableId, { versionId: recovered.versionId });
            await this.requireSaveKeys().put(input.idempotencyKey, { versionId: recovered.versionId });
            return recovered;
        }
        /** Compare a replayed save's caller fields with the stored version; any difference is a conflict. */
        assertSaveFieldsMatch(input, stored) {
            const same = stored.deliverableId === input.deliverableId
                && (stored.baseVersionId ?? null) === input.expectedBaseVersion
                && stored.sourceSubmissionId === input.sourceSubmissionId;
            if (!same) {
                throw new DeliverableError('idempotency-conflict', `idempotency key "${input.idempotencyKey}" was already used with different fields`);
            }
        }
        /** One serialized dependency registration; the durable put completes the version record. */
        async registerVersionDependenciesNow(versionId, dependsOn) {
            const versions = this.requireVersions();
            const version = versions.get(versionId);
            if (version === undefined) {
                throw new DeliverableError('not-found', `no version with id ${JSON.stringify(versionId)}`);
            }
            for (const ref of dependsOn) {
                if (versions.get(ref.versionId) === undefined) {
                    throw new DeliverableError('not-found', `no version with id ${JSON.stringify(ref.versionId)}`);
                }
            }
            if (version.dependsOn !== undefined) {
                const same = version.dependsOn.length === dependsOn.length
                    && version.dependsOn.every((ref, index) => sameDependency(ref, dependsOn[index]));
                if (same)
                    return;
                throw new DeliverableError('idempotency-conflict', `version ${JSON.stringify(versionId)} already declares different dependencies`);
            }
            const completed = { ...version, dependsOn };
            await versions.put(versionId, completed);
        }
        /**
         * One serialized invalidation step: validate every root, walk the
         * multi-root closure, transition the covered versions, derive the covered
         * task plane, and persist the snapshot.
         */
        async invalidateDownstreamNow(roots) {
            const versions = this.requireVersions();
            const rootVersions = roots.map((rootId) => {
                const root = versions.get(rootId);
                if (root === undefined) {
                    throw new DeliverableError('not-found', `no version with id ${JSON.stringify(rootId)}`);
                }
                return root;
            });
            const consumers = new Map();
            for (const [, version] of versions.entries()) {
                for (const ref of version.dependsOn ?? []) {
                    const consumerList = consumers.get(ref.versionId) ?? [];
                    consumerList.push(version);
                    consumers.set(ref.versionId, consumerList);
                }
            }
            // Breadth-first over dependency edges only: chain lineage is not an
            // impact edge, so an upstream edit's own successor survives. Already-stale
            // subgraphs are skipped entirely.
            const staled = new Map();
            const queue = [...rootVersions];
            const seen = new Set(roots.map(String));
            while (queue.length > 0) {
                const version = queue.shift();
                if (version.state === 'stale')
                    continue;
                if (!staled.has(String(version.versionId)))
                    staled.set(String(version.versionId), version);
                for (const next of consumers.get(String(version.versionId)) ?? []) {
                    if (seen.has(String(next.versionId)))
                        continue;
                    seen.add(String(next.versionId));
                    queue.push(next);
                }
            }
            for (const version of staled.values()) {
                const next = { ...version, state: 'stale', entityRevision: version.entityRevision + 1 };
                await this.appendFact({
                    kind: 'deliverable/version-staled',
                    taskId: this.factTaskOf(version),
                    entityId: version.versionId,
                    entityRevision: next.entityRevision,
                    idempotencyKey: `deliverable/version-staled:${version.versionId}:${next.entityRevision}`,
                    payload: next,
                });
                await versions.put(version.versionId, next);
            }
            const grouped = this.groupStaledVersions(staled);
            const affectedPhaseRuns = this.affectedRuns(staled);
            const staledGateChecks = this.coveredGateChecks(affectedPhaseRuns);
            const snapshot = {
                snapshotId: ImpactSnapshotId(randomUUID()),
                roots,
                staledVersions: grouped,
                affectedPhaseRuns,
                staledGateChecks,
                createdAt: Date.now(),
            };
            await this.appendFact({
                kind: 'deliverable/impact-snapshotted',
                taskId: UNTASKED_FACT_TASK_ID,
                entityId: snapshot.snapshotId,
                entityRevision: 1,
                idempotencyKey: `deliverable/impact-snapshotted:${snapshot.snapshotId}`,
                payload: snapshot,
            });
            await this.requireSnapshots().put(String(snapshot.snapshotId), snapshot);
            return snapshot;
        }
        /** Group the closure's versions per deliverable, ascending by version number. */
        groupStaledVersions(staled) {
            const byDeliverable = new Map();
            for (const version of staled.values()) {
                const chain = byDeliverable.get(version.deliverableId) ?? [];
                chain.push(version);
                byDeliverable.set(version.deliverableId, chain);
            }
            return [...byDeliverable.entries()].map(([deliverableId, chain]) => ({
                deliverableId: DeliverableId(deliverableId),
                versionIds: chain.sort((a, b) => a.versionNumber - b.versionNumber).map(version => version.versionId),
            }));
        }
        /** Phase runs whose registered inputs include a newly staled version. */
        affectedRuns(staled) {
            const affected = [];
            for (const [runId, inputs] of this.requirePhaseInputs().entries()) {
                if (inputs.inputVersionIds.some((id) => staled.has(id)))
                    affected.push(runId);
            }
            return affected;
        }
        /**
         * Recorded gate verdicts the closure covers, derived from the journal: the
         * submissions of every affected run (by `phaseRunId`) and their recorded
         * `gate-check/recorded` verdicts. Derivation reads the authoritative fact
         * stream, never task projections.
         */
        coveredGateChecks(affectedPhaseRuns) {
            if (affectedPhaseRuns.length === 0)
                return [];
            const runs = new Set(affectedPhaseRuns.map(String));
            const submissions = new Set();
            for (const fact of this.ctx.workbenchJournal.replay(0)) {
                if (fact.kind !== 'submission/recorded')
                    continue;
                const payload = fact.payload;
                if (typeof payload.phaseRunId !== 'string' || !runs.has(payload.phaseRunId))
                    continue;
                if (typeof payload.submissionId !== 'string')
                    continue;
                submissions.add(payload.submissionId);
            }
            if (submissions.size === 0)
                return [];
            const grouped = new Map();
            for (const fact of this.ctx.workbenchJournal.replay(0)) {
                if (fact.kind !== 'gate-check/recorded')
                    continue;
                const payload = fact.payload;
                if (typeof payload.submissionId !== 'string' || typeof payload.checkId !== 'string')
                    continue;
                if (!submissions.has(payload.submissionId))
                    continue;
                const checkIds = grouped.get(payload.submissionId) ?? [];
                checkIds.push(payload.checkId);
                grouped.set(payload.submissionId, checkIds);
            }
            return [...grouped.entries()].map(([submissionId, checkIds]) => ({
                submissionId: submissionId,
                checkIds,
            }));
        }
        /** The latest version of one deliverable from the index, or `undefined` when it has none. */
        latestVersionOf(deliverableId) {
            const indexed = this.requireLatest().get(deliverableId);
            if (indexed === undefined)
                return undefined;
            return this.requireVersions().get(indexed.versionId);
        }
        /**
         * The task a version's facts belong to: the source submission's task when
         * the journal traces one, otherwise the untasked sentinel.
         */
        factTaskOf(version) {
            if (version.sourceSubmissionId === undefined)
                return UNTASKED_FACT_TASK_ID;
            const fact = this.factsOfKind('submission/recorded')
                .find(candidate => candidate.payload.submissionId === String(version.sourceSubmissionId));
            if (fact === undefined)
                return UNTASKED_FACT_TASK_ID;
            return fact.taskId;
        }
        /** Every stored fact of one kind, in journal order. */
        factsOfKind(kind) {
            return this.ctx.workbenchJournal.replay(0).filter(fact => fact.kind === kind);
        }
        /** The stored fact with one idempotency key, when present. */
        factByKey(key) {
            return this.ctx.workbenchJournal.replay(0).find(fact => fact.idempotencyKey === key);
        }
        /** Append one deliverable fact; the journal's durable write is the commit point. */
        async appendFact(input) {
            await this.ctx.workbenchJournal.append({
                taskId: input.taskId,
                kind: input.kind,
                actor: FACT_ACTOR,
                idempotencyKey: input.idempotencyKey,
                entityRevision: input.entityRevision,
                payload: input.payload,
            });
        }
        /** Validate one non-empty wire field, returning the trimmed value. */
        requireText(value, field) {
            if (typeof value !== 'string' || value.trim().length === 0) {
                throw new DeliverableError('invalid-argument', `${field} must be a non-empty string`);
            }
            return value.trim();
        }
        /** Enqueue one mutation on the service's serialized tail. */
        enqueue(job) {
            const result = this.mutationTail.then(job);
            this.mutationTail = result.then(() => undefined, () => undefined);
            return result;
        }
        requireVersions() {
            if (this.versions === undefined)
                throw new DeliverableError('invalid-argument', 'deliverable domain is not open');
            return this.versions;
        }
        requirePhaseInputs() {
            if (this.phaseInputs === undefined)
                throw new DeliverableError('invalid-argument', 'deliverable domain is not open');
            return this.phaseInputs;
        }
        requireSaveKeys() {
            if (this.saveKeys === undefined)
                throw new DeliverableError('invalid-argument', 'deliverable domain is not open');
            return this.saveKeys;
        }
        requireLatest() {
            if (this.latest === undefined)
                throw new DeliverableError('invalid-argument', 'deliverable domain is not open');
            return this.latest;
        }
        requireSnapshots() {
            if (this.snapshots === undefined)
                throw new DeliverableError('invalid-argument', 'deliverable domain is not open');
            return this.snapshots;
        }
    };
})();
export { DeliverableService };
export default DeliverableService;
//# sourceMappingURL=index.js.map