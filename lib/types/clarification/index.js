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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { randomUUID } from 'node:crypto';
import { Service } from '@deepseek-ai/cordis';
import { createUserMessage } from '@deepseek-ai/dsh-llm';
import '@deepseek-ai/dsh-session';
import "../task/index.js";
import { AttentionItemId } from "../attention/index.js";
import "../attention/index.js";
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import "../workbench/journal/index.js";
import { ClarificationQuestionId as QuestionIdOf, ClarificationRequestId as RequestIdOf } from "./runtime.js";
import { clarificationDomainSpec } from "./spec.js";
import { ClarificationError } from "./types.js";
export { ClarificationQuestionId, ClarificationRequestId } from "./runtime.js";
export { clarificationDomainSpec, clarificationRequestSchema, questionSchema, answerSchema } from "./spec.js";
export { ClarificationError } from "./types.js";
/** The actor recorded on clarification facts: answers carry their own actor. */
const FACT_ACTOR = 'clarifications';
/** The single option a clarification item resolves with once every required question is answered. */
const SATISFIED_OPTION = 'satisfied';
/** The injected fact's journal idempotency key, one per request. */
function injectedFactKey(requestId) {
    return `clarification/injected:${String(requestId)}`;
}
/** Build the stored question records for a request's validated question list. */
function storedQuestions(questions, requestId) {
    return questions.map((input, index) => ({
        questionId: QuestionIdOf(`${String(requestId)}/q${index}`),
        requestId,
        phaseId: input.phaseId,
        required: input.required,
        order: input.order,
        text: input.text,
        revision: 1,
    }));
}
/**
 * Clarification service: the M3 persistent-clarification domain, with
 * idempotent request creation, idempotent per-question partial answers, and
 * recovered answer injection into the phase session.
 */
let ClarificationService = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _createRequest_decorators;
    let _answerPartial_decorators;
    let _getRequest_decorators;
    let _listOpen_decorators;
    return class ClarificationService extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _createRequest_decorators = [Remote('createRequest')];
            _answerPartial_decorators = [Remote('answerPartial')];
            _getRequest_decorators = [Remote('getRequest')];
            _listOpen_decorators = [Remote('listOpen')];
            __esDecorate(this, null, _createRequest_decorators, { kind: "method", name: "createRequest", static: false, private: false, access: { has: obj => "createRequest" in obj, get: obj => obj.createRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _answerPartial_decorators, { kind: "method", name: "answerPartial", static: false, private: false, access: { has: obj => "answerPartial" in obj, get: obj => obj.answerPartial }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getRequest_decorators, { kind: "method", name: "getRequest", static: false, private: false, access: { has: obj => "getRequest" in obj, get: obj => obj.getRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listOpen_decorators, { kind: "method", name: "listOpen", static: false, private: false, access: { has: obj => "listOpen" in obj, get: obj => obj.listOpen }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        /** The service opens its domain, appends facts, reads phase runs, and injects into phase sessions. */
        static inject = ['storageDomain', 'workbenchJournal', 'tasks', 'sessions', 'attention'];
        requests = __runInitializers(this, _instanceExtraInitializers);
        requestKeys;
        questions;
        answers;
        /** Serializes read-validate-write mutations so concurrent writers never interleave. */
        mutationTail = Promise.resolve();
        /**
         * @param ctx - Host context carrying storage, journal, task, and session services.
         */
        constructor(ctx) {
            super(ctx, 'clarifications');
        }
        /** Open and own the clarification domain. */
        async [Service.init]() {
            const domain = await this.ctx.storageDomain.open(clarificationDomainSpec);
            this.ctx.effect(() => async () => {
                await domain.close();
            }, 'clarification.domainClose');
            this.requests = domain.table('requests');
            this.requestKeys = domain.table('request_keys');
            this.questions = domain.table('questions');
            this.answers = domain.table('answers');
        }
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
        createRequest(phaseRunId, questions, actor, idempotencyKey) {
            const runId = this.requireText(phaseRunId, 'phaseRunId');
            const actorValue = this.requireText(actor, 'actor');
            const key = this.requireText(idempotencyKey, 'idempotencyKey');
            const validated = this.validateQuestions(questions);
            const result = this.mutationTail.then(() => this.createRequestNow(runId, validated, actorValue, key));
            this.mutationTail = result.then(() => undefined, () => undefined);
            return result;
        }
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
        answerPartial(questionId, expectedRevision, answer, actor, idempotencyKey) {
            const qid = QuestionIdOf(this.requireText(questionId, 'questionId'));
            if (typeof answer !== 'string')
                throw new ClarificationError('invalid-argument', 'answer must be a string');
            if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) {
                throw new ClarificationError('invalid-argument', 'expectedRevision must be a positive safe integer');
            }
            const actorValue = this.requireText(actor, 'actor');
            const key = this.requireText(idempotencyKey, 'idempotencyKey');
            const result = this.mutationTail.then(() => this.answerPartialNow(qid, expectedRevision, answer, actorValue, key));
            this.mutationTail = result.then(() => undefined, () => undefined);
            return result;
        }
        /**
         * Read one clarification request.
         * @param requestId - the request identity.
         * @returns the request, or undefined when unknown.
         */
        getRequest(requestId) {
            const id = RequestIdOf(this.requireText(requestId, 'requestId'));
            return this.requireRequests().get(String(id));
        }
        /**
         * List the open requests of one phase run, in creation order.
         * @param phaseRunId - the phase run.
         * @returns the open requests.
         */
        listOpen(phaseRunId) {
            const id = this.requireText(phaseRunId, 'phaseRunId');
            const open = [];
            for (const [, request] of this.requireRequests().entries()) {
                if (String(request.phaseRunId) === id && request.state === 'open')
                    open.push(request);
            }
            open.sort((a, b) => a.createdAt - b.createdAt);
            return open;
        }
        async createRequestNow(phaseRunId, questions, actor, idempotencyKey) {
            const existingKey = this.requireRequestKeys().get(idempotencyKey);
            if (existingKey !== undefined) {
                const stored = this.requireRequests().get(existingKey.requestId);
                if (stored === undefined)
                    throw new ClarificationError('not-found', `request "${existingKey.requestId}" is missing`);
                if (!this.sameQuestions(stored, questions)) {
                    throw new ClarificationError('conflict', 'clarification idempotency key reused with different questions');
                }
                return stored;
            }
            const phaseRun = await this.ctx.tasks.getPhaseRun(String(phaseRunId));
            if (phaseRun === undefined)
                throw new ClarificationError('not-found', `phase run "${phaseRunId}" is unknown`);
            const requestId = RequestIdOf(randomUUID());
            const stored = storedQuestions(questions, requestId);
            const questionIds = stored.map(question => question.questionId);
            const request = {
                requestId,
                phaseRunId,
                taskId: phaseRun.taskId,
                questionIds,
                state: 'open',
                revision: 1,
                createdAt: Date.now(),
            };
            await this.appendFact({
                kind: 'clarification/request-created',
                taskId: phaseRun.taskId,
                idempotencyKey: `clarification/request-created:${idempotencyKey}`,
                entityRevision: 1,
                payload: { requestId: String(requestId), phaseRunId: String(phaseRunId), actor },
            });
            await this.requireRequests().put(String(requestId), request);
            await this.requireRequestKeys().put(idempotencyKey, { requestId: String(requestId) });
            const questionTable = this.requireQuestions();
            for (const question of storedQuestions(questions, requestId)) {
                await questionTable.put(String(question.questionId), question);
            }
            await this.ctx.attention.createItem({
                itemId: AttentionItemId(`clarification:${String(requestId)}`),
                taskId: phaseRun.taskId,
                phaseRunId,
                kind: 'clarification',
                decisionKind: 'clarification',
                options: [SATISFIED_OPTION],
            }, FACT_ACTOR, `clarification/item:${idempotencyKey}`);
            return request;
        }
        async answerPartialNow(questionId, expectedRevision, value, actor, idempotencyKey) {
            const question = this.requireQuestions().get(String(questionId));
            if (question === undefined)
                throw new ClarificationError('not-found', `question "${questionId}" is unknown`);
            if (expectedRevision !== question.revision) {
                throw new ClarificationError('conflict', `question "${questionId}" revision is ${question.revision}, expected ${expectedRevision}`);
            }
            const answers = this.requireAnswers();
            const existing = answers.get(String(questionId));
            if (existing !== undefined) {
                if (existing.value === value)
                    return existing;
                throw new ClarificationError('conflict', `question "${questionId}" already answered differently`);
            }
            const request = this.requireRequests().get(String(question.requestId));
            if (request === undefined)
                throw new ClarificationError('not-found', `request "${question.requestId}" is missing`);
            const answer = {
                questionId,
                actor,
                value,
                submittedAt: Date.now(),
                revision: question.revision,
            };
            await this.appendFact({
                kind: 'clarification/answer-recorded',
                taskId: request.taskId,
                idempotencyKey: `clarification/answer-recorded:${idempotencyKey}`,
                entityRevision: answer.revision,
                payload: { questionId: String(questionId), value },
            });
            await answers.put(String(questionId), answer);
            await this.injectIfComplete(question.requestId);
            return answer;
        }
        /** Inject and resume when every required question of an open request is answered. */
        async injectIfComplete(requestId) {
            const requests = this.requireRequests();
            const request = requests.get(String(requestId));
            if (request === undefined || request.state !== 'open')
                return;
            if (!this.allRequiredAnswered(request))
                return;
            const factKey = injectedFactKey(requestId);
            const existingFact = this.ctx.workbenchJournal.replay(0).find(fact => fact.idempotencyKey === factKey);
            let injectedEventId;
            if (existingFact !== undefined) {
                injectedEventId = existingFact.payload.injectedEventId;
            }
            else {
                injectedEventId = await this.appendSessionMessage(request);
                await this.appendFact({
                    kind: 'clarification/injected',
                    taskId: request.taskId,
                    idempotencyKey: factKey,
                    entityRevision: request.revision + 1,
                    payload: { requestId: String(requestId), injectedEventId },
                });
            }
            await requests.put(String(requestId), {
                ...request,
                state: 'injected',
                injectedEventId,
                revision: request.revision + 1,
            });
            await this.ctx.attention.resolveDecision(`clarification:${String(requestId)}`, 1, SATISFIED_OPTION, FACT_ACTOR, `clarification/resolve-item:${String(requestId)}`);
            await this.resumePhaseRun(request);
        }
        /** Whether every required question of the request has a recorded answer. */
        allRequiredAnswered(request) {
            const questions = this.requireQuestions();
            const answers = this.requireAnswers();
            for (const questionId of request.questionIds) {
                const question = questions.get(String(questionId));
                if (question === undefined || !question.required)
                    continue;
                if (answers.get(String(questionId)) === undefined)
                    return false;
            }
            return true;
        }
        /** Append the answer summary as a model-visible user message; return its persisted event seq. */
        async appendSessionMessage(request) {
            const phaseRun = await this.ctx.tasks.getPhaseRun(String(request.phaseRunId));
            if (phaseRun === undefined || phaseRun.sessionId === undefined) {
                throw new ClarificationError('not-found', `phase run "${request.phaseRunId}" has no recorded session id`);
            }
            const session = this.ctx.sessions.get(phaseRun.sessionId);
            if (session === undefined)
                throw new ClarificationError('not-found', `phase session "${phaseRun.sessionId}" is not live`);
            const questions = this.requireQuestions();
            const answers = this.requireAnswers();
            const lines = [];
            for (const questionId of request.questionIds) {
                const question = questions.get(String(questionId));
                const answer = answers.get(String(questionId));
                if (question === undefined || answer === undefined)
                    continue;
                lines.push(`${question.text}: ${answer.value}`);
            }
            const text = `Clarification answers:\n${lines.join('\n')}`;
            const event = session.append('user/message', createUserMessage({
                content: [{ type: 'text', text }],
                source: { kind: 'user' },
            }), { surfaceOp: 'append' });
            return event.seq;
        }
        /** Resume the phase run out of awaiting-input; a no-op once already resumed. */
        async resumePhaseRun(request) {
            const phaseRun = await this.ctx.tasks.getPhaseRun(String(request.phaseRunId));
            if (phaseRun === undefined || phaseRun.state !== 'awaiting-input')
                return;
            await this.ctx.tasks.resumePhaseFromAwaiting(String(request.phaseRunId), {
                actor: FACT_ACTOR,
                reason: 'clarification-answers-injected',
                expectedRevision: phaseRun.revision,
                idempotencyKey: `clarification/resume:${String(request.requestId)}`,
            });
        }
        /** Compare a stored request's questions against the validated wire questions. */
        sameQuestions(request, questions) {
            if (request.questionIds.length !== questions.length)
                return false;
            const stored = this.requireQuestions();
            let index = 0;
            for (const input of questions) {
                const questionId = request.questionIds[index];
                index += 1;
                const question = stored.get(String(questionId));
                if (question === undefined
                    || question.phaseId !== input.phaseId
                    || question.required !== input.required
                    || question.order !== input.order
                    || question.text !== input.text) {
                    return false;
                }
            }
            return true;
        }
        /** Validate the wire question list and normalize field defaults. */
        validateQuestions(questions) {
            if (!Array.isArray(questions) || questions.length === 0) {
                throw new ClarificationError('invalid-argument', 'questions must be a non-empty array');
            }
            return questions.map((input, index) => ({
                phaseId: this.requireText(input.phaseId, 'phaseId'),
                required: typeof input.required === 'boolean' && input.required,
                order: Number.isSafeInteger(input.order) ? input.order : index,
                text: this.requireText(input.text, 'text'),
            }));
        }
        /** Append one clarification fact; the journal's durable write is the commit point. */
        async appendFact(input) {
            await this.ctx.workbenchJournal.append({
                taskId: input.taskId,
                kind: input.kind,
                actor: FACT_ACTOR,
                idempotencyKey: input.idempotencyKey,
                entityRevision: input.entityRevision,
                payload: input.payload,
            });
        }
        /** Validate one non-empty wire field, returning the trimmed value. */
        requireText(value, field) {
            if (typeof value !== 'string' || value.trim().length === 0) {
                throw new ClarificationError('invalid-argument', `${field} must be a non-empty string`);
            }
            return value.trim();
        }
        requireRequests() {
            if (this.requests === undefined)
                throw new ClarificationError('not-found', 'clarification domain is not initialized');
            return this.requests;
        }
        requireRequestKeys() {
            if (this.requestKeys === undefined)
                throw new ClarificationError('not-found', 'clarification domain is not initialized');
            return this.requestKeys;
        }
        requireQuestions() {
            if (this.questions === undefined)
                throw new ClarificationError('not-found', 'clarification domain is not initialized');
            return this.questions;
        }
        requireAnswers() {
            if (this.answers === undefined)
                throw new ClarificationError('not-found', 'clarification domain is not initialized');
            return this.answers;
        }
    };
})();
export { ClarificationService };
export default ClarificationService;
//# sourceMappingURL=index.js.map