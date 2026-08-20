/**
 * Clarification service (ctx.clarifications): persistent question/answer
 * requests over one phase run, with idempotent partial answers. When every
 * required question is answered, the service injects the answer summary as a
 * model-visible user message into the phase session, records the persisted
 * session event id, marks the request injected, appends the journal fact, and
 * resumes the phase run out of awaiting-input. Recovery replays the journal
 * fact rather than trusting a process-local promise, so a restart neither
 * duplicates the session message nor re-injects a settled request.
 * @module @deepseek-ai/dsh-clarification
 */
import { Context, Service } from '@deepseek-ai/cordis';
import '@deepseek-ai/dsh-session';
import '../task/index.ts';
import '../attention/index.ts';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import '../workbench/journal/index.ts';
import type { Answer, ClarificationQuestionInput, ClarificationRequest } from './types.ts';
export type * from './types.ts';
export { ClarificationQuestionId, ClarificationRequestId } from './runtime.ts';
export { clarificationDomainSpec, clarificationRequestSchema, questionSchema, answerSchema } from './spec.ts';
export type { RequestKeyEntry } from './spec.ts';
export { ClarificationError } from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        clarifications: ClarificationService;
    }
}
/**
 * Clarification service: the M3 persistent-clarification domain, with
 * idempotent request creation, idempotent per-question partial answers, and
 * recovered answer injection into the phase session.
 */
export declare class ClarificationService extends TypertRemoteService {
    /** The service opens its domain, appends facts, reads phase runs, and injects into phase sessions. */
    static inject: string[];
    private requests?;
    private requestKeys?;
    private questions?;
    private answers?;
    /** Serializes read-validate-write mutations so concurrent writers never interleave. */
    private mutationTail;
    /**
     * @param ctx - Host context carrying storage, journal, task, and session services.
     */
    constructor(ctx: Context);
    /** Open and own the clarification domain. */
    protected [Service.init](): Promise<void>;
    /**
     * Create one clarification request over a phase run. Idempotent: replaying a
     * caller key with the same questions returns the stored request; a replay
     * with different questions fails loud with conflict.
     * @param phaseRunId - the phase run the request clarifies.
     * @param questions - the question definitions, in request order.
     * @param actor - the actor opening the request.
     * @param idempotencyKey - caller-owned replay key.
     * @returns the stored request with its assigned questions.
     */
    createRequest(phaseRunId: string, questions: ClarificationQuestionInput[], actor: string, idempotencyKey: string): Promise<ClarificationRequest>;
    /**
     * Record one answer for a question, at the question's current revision.
     * Idempotent: replaying the same question revision with the same value
     * returns the stored answer; a different value fails loud with conflict.
     * When the answer completes every required question, the service injects
     * the answer summary and resumes the phase run.
     * @param questionId - the question to answer.
     * @param expectedRevision - the question revision the answer satisfies.
     * @param answer - the answer text; may be empty.
     * @param actor - the actor supplying the answer.
     * @param idempotencyKey - caller-owned replay key for the journal fact.
     * @returns the stored answer.
     */
    answerPartial(questionId: string, expectedRevision: number, answer: string, actor: string, idempotencyKey: string): Promise<Answer>;
    /**
     * Read one clarification request.
     * @param requestId - the request identity.
     * @returns the request, or undefined when unknown.
     */
    getRequest(requestId: string): ClarificationRequest | undefined;
    /**
     * List the open requests of one phase run, in creation order.
     * @param phaseRunId - the phase run.
     * @returns the open requests.
     */
    listOpen(phaseRunId: string): ClarificationRequest[];
    private createRequestNow;
    private answerPartialNow;
    /** Inject and resume when every required question of an open request is answered. */
    private injectIfComplete;
    /** Whether every required question of the request has a recorded answer. */
    private allRequiredAnswered;
    /** Append the answer summary as a model-visible user message; return its persisted event seq. */
    private appendSessionMessage;
    /** Resume the phase run out of awaiting-input; a no-op once already resumed. */
    private resumePhaseRun;
    /** Compare a stored request's questions against the validated wire questions. */
    private sameQuestions;
    /** Validate the wire question list and normalize field defaults. */
    private validateQuestions;
    /** Append one clarification fact; the journal's durable write is the commit point. */
    private appendFact;
    /** Validate one non-empty wire field, returning the trimmed value. */
    private requireText;
    private requireRequests;
    private requireRequestKeys;
    private requireQuestions;
    private requireAnswers;
}
export default ClarificationService;
//# sourceMappingURL=index.d.ts.map