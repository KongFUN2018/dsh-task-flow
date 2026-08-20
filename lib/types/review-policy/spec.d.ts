/**
 * The review-policy storage-domain declaration: per-task tier records and
 * per-(task, check) breaker counters. The domain name and version reject
 * earlier media — pre-release stance, no migration.
 * @module @deepseek-ai/dsh-review-policy/src/spec
 */
import { z } from 'zod';
import type { BreakerCounter, ReviewPolicyRecord } from './types.ts';
/** One stored tier record. */
export declare const reviewPolicyRecordSchema: z.ZodType<ReviewPolicyRecord>;
/** One stored breaker counter. */
export declare const breakerCounterSchema: z.ZodType<BreakerCounter>;
/** The review-policy domain: identity, format version, and owned tables. */
export declare const reviewPolicyDomainSpec: {
    name: string;
    version: number;
    tables: {
        tiers: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, ReviewPolicyRecord>;
        breakers: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, BreakerCounter>;
    };
};
//# sourceMappingURL=spec.d.ts.map