/**
 * The edit-lock storage-domain declaration: one `leases` table of durable
 * lease records. The domain name and version are pre-release; no migration
 * from earlier media is promised.
 * @module @deepseek-ai/dsh-edit-lock/src/spec
 */
import { z } from 'zod';
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain';
/** One durable lease record as persisted on the medium. */
// Zod infers transformed branded fields structurally, so it cannot name the
// frozen wire interface even though every branded output is created here.
export const leaseSchema = z.object({
    leaseId: z.string().min(1),
    taskId: z.string().min(1).optional(),
    deliverableId: z.string().min(1),
    targetVersionId: z.string().min(1),
    owner: z.string().min(1),
    acquiredAt: z.number().int().min(1),
    renewedAt: z.number().int().min(1),
    expiresAt: z.number().int().min(1),
    entityRevision: z.number().int().min(1),
    state: z.enum(['active', 'released', 'expired']),
});
/** The edit-lock domain: identity, format version, and owned tables. */
export const editLockDomainSpec = defineDomain({
    name: 'edit_lock',
    version: 1,
    tables: {
        leases: domainTable(leaseSchema),
    },
});
//# sourceMappingURL=spec.js.map