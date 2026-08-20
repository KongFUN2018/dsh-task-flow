/**
 * The deliverable-local storage-domain declaration: immutable `versions`
 * with dependency edges, per-phaseRun `phase_inputs` registration, the
 * `save_keys` idempotency index, and persisted `impact_snapshots`. A
 * per-deliverable `latest` index keys the version chain's head so saves and
 * base checks read one record instead of scanning the chain. The domain name
 * and version reject M1 `deliverable_minimal` media — pre-release stance, no
 * migration.
 * @module @deepseek-ai/dsh-deliverable-local/src/spec
 */
import { z } from 'zod';
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain';
/** One immutable deliverable version as persisted on the medium. */
// Zod infers transformed branded fields structurally, so it cannot name the
// frozen wire interface even though every branded output is created here.
export const deliverableVersionSchema = z.object({
    versionId: z.string().min(1),
    deliverableId: z.string().min(1),
    versionNumber: z.number().int().min(1),
    baseVersionId: z.string().min(1).optional(),
    sourceSubmissionId: z.string().min(1).optional(),
    dependsOn: z.array(z.object({
        deliverableId: z.string().min(1),
        versionId: z.string().min(1),
    })).optional(),
    state: z.enum(['current', 'stale', 'invalid', 'superseded', 'cancelled']),
    entityRevision: z.number().int().min(1),
    createdAt: z.number().int().min(1),
});
/** Per-phaseRun input registration as persisted on the medium. */
export const phaseInputsSchema = z.object({
    inputVersionIds: z.array(z.string().min(1)),
});
/** The save-idempotency index entry: one caller key to the version it created. */
export const saveKeySchema = z.object({
    versionId: z.string().min(1),
});
/** The per-deliverable latest-version index entry: the chain head's version id. */
export const latestVersionSchema = z.object({
    versionId: z.string().min(1),
});
/** One persisted impact snapshot as stored on the medium. */
export const impactSnapshotSchema = z.object({
    snapshotId: z.string().min(1),
    roots: z.array(z.string().min(1)),
    staledVersions: z.array(z.object({
        deliverableId: z.string().min(1),
        versionIds: z.array(z.string().min(1)),
    })),
    affectedPhaseRuns: z.array(z.string().min(1)),
    staledGateChecks: z.array(z.object({
        submissionId: z.string().min(1),
        checkIds: z.array(z.string().min(1)),
    })),
    createdAt: z.number().int().min(1),
});
/** The deliverable domain: identity, format version, and owned tables. */
export const deliverableLocalDomainSpec = defineDomain({
    name: 'deliverable_local',
    version: 1,
    tables: {
        versions: domainTable(deliverableVersionSchema),
        phase_inputs: domainTable(phaseInputsSchema),
        save_keys: domainTable(saveKeySchema),
        latest: domainTable(latestVersionSchema),
        impact_snapshots: domainTable(impactSnapshotSchema),
    },
});
//# sourceMappingURL=spec.js.map