/**
 * The clarification storage-domain declaration: requests, questions, answers,
 * and the request_keys idempotency index. The domain name and version reject
 * earlier media — pre-release stance, no migration.
 * @module @deepseek-ai/dsh-clarification/src/spec
 */
import { z } from 'zod';
import type { Answer, ClarificationRequest, Question } from './types.ts';
/** One stored clarification request. */
export declare const clarificationRequestSchema: z.ZodType<ClarificationRequest>;
/** One stored question. */
export declare const questionSchema: z.ZodType<Question>;
/** One stored answer. */
export declare const answerSchema: z.ZodType<Answer>;
/** The request-idempotency index entry: one caller key to the request it created. */
export declare const requestKeySchema: z.ZodObject<{
    requestId: z.ZodString;
}, z.core.$strip>;
/** Durable request-idempotency index entry. */
export type RequestKeyEntry = z.infer<typeof requestKeySchema>;
/** The clarification domain: identity, format version, and owned tables. */
export declare const clarificationDomainSpec: {
    name: string;
    version: number;
    tables: {
        requests: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, ClarificationRequest>;
        request_keys: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, {
            requestId: string;
        }>;
        questions: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, Question>;
        answers: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, Answer>;
    };
};
//# sourceMappingURL=spec.d.ts.map