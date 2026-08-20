/**
 * The recipe-engine storage-domain declaration: one table of durable
 * phase-session bindings keyed by phase run id. Bindings survive restarts
 * and drive recovery: which phase run ran which attempt in which session,
 * and which submission the latest attempt recorded.
 * @module @deepseek-ai/dsh-recipe-engine-core/src/spec
 */
import { z } from 'zod';
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain';
/** Wire string branded at the durable boundary. */
const idString = z.string().min(1);
/** Durable phase-session binding schema. */
// Zod infers transformed branded fields structurally, so it cannot name the
// frozen wire interface even though every branded output is created here.
export const phaseSessionBindingSchema = z.object({
    phaseRunId: idString,
    taskId: idString,
    taskRunId: idString,
    phaseId: idString,
    attempt: z.number().int().min(0),
    sessionId: idString.optional(),
    submissionId: idString.optional(),
    updatedAt: z.number(),
});
/** The recipe-engine domain: identity, format version, and the binding table. */
export const recipeEngineDomainSpec = defineDomain({
    name: 'recipe_engine',
    version: 1,
    tables: {
        phase_sessions: domainTable(phaseSessionBindingSchema),
    },
});
//# sourceMappingURL=spec.js.map