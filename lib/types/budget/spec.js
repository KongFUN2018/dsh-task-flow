/**
 * The budget storage-domain declaration: one durable ledger record per task.
 * The domain name and version reject earlier media — pre-release stance, no
 * migration.
 * @module @deepseek-ai/dsh-budget/src/spec
 */
import { z } from 'zod';
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain';
/** One stored budget ledger record. */
export const budgetRecordSchema = z.object({
    recordId: z.string().min(1),
    taskId: z.string().min(1),
    limits: z.object({
        maxTokens: z.number().int().min(1).optional(),
        maxDurationMs: z.number().int().min(1).optional(),
        maxReruns: z.number().int().min(1).optional(),
    }),
    spent: z.object({
        tokens: z.number().int().min(0),
        durationMs: z.number().int().min(0),
        reruns: z.number().int().min(0),
    }),
    revision: z.number().int().min(1),
    warned: z.array(z.enum(['tokens', 'durationMs', 'reruns'])),
});
/** The budget domain: identity, format version, and owned tables. */
export const budgetDomainSpec = defineDomain({
    name: 'budget',
    version: 1,
    tables: {
        records: domainTable(budgetRecordSchema),
    },
});
//# sourceMappingURL=spec.js.map