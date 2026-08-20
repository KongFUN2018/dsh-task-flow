/**
 * The attention storage-domain declaration: durable items plus the
 * item_keys idempotency index. The domain name and version reject earlier
 * media �?pre-release stance, no migration.
 * @module @deepseek-ai/dsh-attention/src/spec
 */
import { z } from 'zod';
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain';
/** One stored attention item. */
export const attentionItemSchema = z.object({
    itemId: z.string().min(1),
    taskId: z.string().min(1),
    runId: z.string().min(1).optional(),
    phaseRunId: z.string().min(1).optional(),
    submissionId: z.string().min(1).optional(),
    checkId: z.string().min(1).optional(),
    kind: z.enum(['b-confirm', 'c-decision', 'clarification', 'recovery']),
    decisionKind: z.string().min(1),
    impactSnapshot: z.string().optional(),
    options: z.array(z.string().min(1)),
    state: z.enum(['open', 'resolved', 'invalidated', 'stale']),
    entityRevision: z.number().int().min(1),
    openedAt: z.number().int().min(1),
    resolvedAt: z.number().int().min(1).optional(),
    resolvedBy: z.string().min(1).optional(),
    outcome: z.string().min(1).optional(),
    reversibleUntil: z.number().int().min(1).optional(),
});
/** The create-idempotency index entry: one caller key to the item it created. */
export const itemKeySchema = z.object({
    itemId: z.string().min(1),
});
/** The attention domain: identity, format version, and owned tables. */
export const attentionDomainSpec = defineDomain({
    name: 'attention',
    version: 1,
    tables: {
        items: domainTable(attentionItemSchema),
        item_keys: domainTable(itemKeySchema),
    },
});
//# sourceMappingURL=spec.js.map