/**
 * The edit-lock storage-domain declaration: one `leases` table of durable
 * lease records. The domain name and version are pre-release; no migration
 * from earlier media is promised.
 * @module @deepseek-ai/dsh-edit-lock/src/spec
 */
import { z } from 'zod';
import type { EditLease } from './types.ts';
/** One durable lease record as persisted on the medium. */
export declare const leaseSchema: z.ZodType<EditLease>;
/** The edit-lock domain: identity, format version, and owned tables. */
export declare const editLockDomainSpec: {
    name: string;
    version: number;
    tables: {
        leases: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, EditLease>;
    };
};
//# sourceMappingURL=spec.d.ts.map