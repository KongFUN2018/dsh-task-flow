/**
 * The budget storage-domain declaration: one durable ledger record per task.
 * The domain name and version reject earlier media — pre-release stance, no
 * migration.
 * @module @deepseek-ai/dsh-budget/src/spec
 */
import { z } from 'zod';
import type { BudgetRecord } from './types.ts';
/** One stored budget ledger record. */
export declare const budgetRecordSchema: z.ZodType<BudgetRecord>;
/** The budget domain: identity, format version, and owned tables. */
export declare const budgetDomainSpec: {
    name: string;
    version: number;
    tables: {
        records: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, BudgetRecord>;
    };
};
//# sourceMappingURL=spec.d.ts.map