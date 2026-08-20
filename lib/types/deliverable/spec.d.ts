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
import type { DeliverableVersion, ImpactSnapshot } from './types.ts';
/** One immutable deliverable version as persisted on the medium. */
export declare const deliverableVersionSchema: z.ZodType<DeliverableVersion>;
/** Per-phaseRun input registration as persisted on the medium. */
export declare const phaseInputsSchema: z.ZodObject<{
    inputVersionIds: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
/** Durable per-phaseRun input registration. */
export type PhaseInputs = z.infer<typeof phaseInputsSchema>;
/** The save-idempotency index entry: one caller key to the version it created. */
export declare const saveKeySchema: z.ZodObject<{
    versionId: z.ZodString;
}, z.core.$strip>;
/** Durable save-idempotency index entry. */
export type SaveKeyEntry = z.infer<typeof saveKeySchema>;
/** The per-deliverable latest-version index entry: the chain head's version id. */
export declare const latestVersionSchema: z.ZodObject<{
    versionId: z.ZodString;
}, z.core.$strip>;
/** Durable per-deliverable chain-head entry. */
export type LatestVersionEntry = z.infer<typeof latestVersionSchema>;
/** One persisted impact snapshot as stored on the medium. */
export declare const impactSnapshotSchema: z.ZodType<ImpactSnapshot>;
/** The deliverable domain: identity, format version, and owned tables. */
export declare const deliverableLocalDomainSpec: {
    name: string;
    version: number;
    tables: {
        versions: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, DeliverableVersion>;
        phase_inputs: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, {
            inputVersionIds: string[];
        }>;
        save_keys: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, {
            versionId: string;
        }>;
        latest: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, {
            versionId: string;
        }>;
        impact_snapshots: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, ImpactSnapshot>;
    };
};
//# sourceMappingURL=spec.d.ts.map