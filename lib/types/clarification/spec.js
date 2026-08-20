/**
 * The clarification storage-domain declaration: requests, questions, answers,
 * and the request_keys idempotency index. The domain name and version reject
 * earlier media — pre-release stance, no migration.
 * @module @deepseek-ai/dsh-clarification/src/spec
 */
import { z } from 'zod';
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain';
/** One stored clarification request. */
export const clarificationRequestSchema = z.object({
    requestId: z.string().min(1),
    phaseRunId: z.string().min(1),
    taskId: z.string().min(1),
    questionIds: z.array(z.string().min(1)),
    injectedEventId: z.number().int().min(0).optional(),
    state: z.enum(['open', 'injected', 'closed']),
    revision: z.number().int().min(1),
    createdAt: z.number().int().min(1),
});
/** One stored question. */
export const questionSchema = z.object({
    questionId: z.string().min(1),
    requestId: z.string().min(1),
    phaseId: z.string().min(1),
    required: z.boolean(),
    order: z.number().int().min(0),
    text: z.string().min(1),
    revision: z.number().int().min(1),
});
/** One stored answer. */
export const answerSchema = z.object({
    questionId: z.string().min(1),
    actor: z.string().min(1),
    value: z.string(),
    submittedAt: z.number().int().min(1),
    revision: z.number().int().min(1),
});
/** The request-idempotency index entry: one caller key to the request it created. */
export const requestKeySchema = z.object({
    requestId: z.string().min(1),
});
/** The clarification domain: identity, format version, and owned tables. */
export const clarificationDomainSpec = defineDomain({
    name: 'clarification',
    version: 1,
    tables: {
        requests: domainTable(clarificationRequestSchema),
        request_keys: domainTable(requestKeySchema),
        questions: domainTable(questionSchema),
        answers: domainTable(answerSchema),
    },
});
//# sourceMappingURL=spec.js.map