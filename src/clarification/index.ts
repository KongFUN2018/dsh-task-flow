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

import { randomUUID } from 'node:crypto'
import { Context, Service } from '@deepseek-ai/cordis'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import type { Session, SessionId } from '@deepseek-ai/dsh-session'
import '@deepseek-ai/dsh-session'
import type { KvTable } from '@deepseek-ai/dsh-storage-domain'
import '../task/index.ts'
import type { PhaseRunId } from '../task/types.ts'
import { AttentionItemId } from '../attention/index.ts'
import '../attention/index.ts'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type { JournalPayload } from '../workbench/journal/types.ts'
import '../workbench/journal/index.ts'
import { ClarificationQuestionId as QuestionIdOf, ClarificationRequestId as RequestIdOf } from './runtime.ts'
import { clarificationDomainSpec } from './spec.ts'
import type { RequestKeyEntry } from './spec.ts'
import { ClarificationError } from './types.ts'
import type {
  Answer,
  ClarificationFactKind,
  ClarificationQuestionId,
  ClarificationQuestionInput,
  ClarificationRequest,
  ClarificationRequestId,
  Question,
} from './types.ts'

export type * from './types.ts'
export { ClarificationQuestionId, ClarificationRequestId } from './runtime.ts'
export { clarificationDomainSpec, clarificationRequestSchema, questionSchema, answerSchema } from './spec.ts'
export type { RequestKeyEntry } from './spec.ts'
export { ClarificationError } from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    clarifications: ClarificationService
  }
}

/** The actor recorded on clarification facts: answers carry their own actor. */
const FACT_ACTOR = 'clarifications'

/** The single option a clarification item resolves with once every required question is answered. */
const SATISFIED_OPTION = 'satisfied'

/** The injected fact's journal idempotency key, one per request. */
function injectedFactKey(requestId: ClarificationRequestId): string {
  return `clarification/injected:${String(requestId)}`
}

/** One wire question after field validation, before identity assignment. */
interface ValidatedQuestion {
  readonly phaseId: string
  readonly required: boolean
  readonly order: number
  readonly text: string
}

/** Build the stored question records for a request's validated question list. */
function storedQuestions(questions: ValidatedQuestion[], requestId: ClarificationRequestId): Question[] {
  return questions.map((input, index) => ({
    questionId: QuestionIdOf(`${String(requestId)}/q${index}`),
    requestId,
    phaseId: input.phaseId,
    required: input.required,
    order: input.order,
    text: input.text,
    revision: 1,
  }))
}

/**
 * Clarification service: the M3 persistent-clarification domain, with
 * idempotent request creation, idempotent per-question partial answers, and
 * recovered answer injection into the phase session.
 */
export class ClarificationService extends TypertRemoteService {
  /** The service opens its domain, appends facts, reads phase runs, and injects into phase sessions. */
  static inject = ['storageDomain', 'workbenchJournal', 'tasks', 'sessions', 'attention']

  private requests?: KvTable<string, ClarificationRequest>
  private requestKeys?: KvTable<string, RequestKeyEntry>
  private questions?: KvTable<string, Question>
  private answers?: KvTable<string, Answer>
  /** Serializes read-validate-write mutations so concurrent writers never interleave. */
  private mutationTail: Promise<void> = Promise.resolve()

  /**
   * @param ctx - Host context carrying storage, journal, task, and session services.
   */
  constructor(ctx: Context) {
    super(ctx, 'clarifications')
  }

  /** Open and own the clarification domain. */
  protected async [Service.init](): Promise<void> {
    const domain = await this.ctx.storageDomain.open(clarificationDomainSpec)
    this.ctx.effect(() => async () => {
      await domain.close()
    }, 'clarification.domainClose')
    this.requests = domain.table('requests')
    this.requestKeys = domain.table('request_keys')
    this.questions = domain.table('questions')
    this.answers = domain.table('answers')
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
  @Remote('createRequest')
  createRequest(
    phaseRunId: string,
    questions: ClarificationQuestionInput[],
    actor: string,
    idempotencyKey: string,
  ): Promise<ClarificationRequest> {
    const runId = this.requireText(phaseRunId, 'phaseRunId') as PhaseRunId
    const actorValue = this.requireText(actor, 'actor')
    const key = this.requireText(idempotencyKey, 'idempotencyKey')
    const validated = this.validateQuestions(questions)
    const result = this.mutationTail.then(() => this.createRequestNow(runId, validated, actorValue, key))
    this.mutationTail = result.then(() => undefined, () => undefined)
    return result
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
  @Remote('answerPartial')
  answerPartial(
    questionId: string,
    expectedRevision: number,
    answer: string,
    actor: string,
    idempotencyKey: string,
  ): Promise<Answer> {
    const qid = QuestionIdOf(this.requireText(questionId, 'questionId'))
    if (typeof answer !== 'string') throw new ClarificationError('invalid-argument', 'answer must be a string')
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) {
      throw new ClarificationError('invalid-argument', 'expectedRevision must be a positive safe integer')
    }
    const actorValue = this.requireText(actor, 'actor')
    const key = this.requireText(idempotencyKey, 'idempotencyKey')
    const result = this.mutationTail.then(() => this.answerPartialNow(qid, expectedRevision, answer, actorValue, key))
    this.mutationTail = result.then(() => undefined, () => undefined)
    return result
  }

  /**
   * Read one clarification request.
   * @param requestId - the request identity.
   * @returns the request, or undefined when unknown.
   */
  @Remote('getRequest')
  getRequest(requestId: string): ClarificationRequest | undefined {
    const id = RequestIdOf(this.requireText(requestId, 'requestId'))
    return this.requireRequests().get(String(id))
  }

  /**
   * List the open requests of one phase run, in creation order.
   * @param phaseRunId - the phase run.
   * @returns the open requests.
   */
  @Remote('listOpen')
  listOpen(phaseRunId: string): ClarificationRequest[] {
    const id = this.requireText(phaseRunId, 'phaseRunId')
    const open: ClarificationRequest[] = []
    for (const [, request] of this.requireRequests().entries()) {
      if (String(request.phaseRunId) === id && request.state === 'open') open.push(request)
    }
    open.sort((a, b) => a.createdAt - b.createdAt)
    return open
  }

  private async createRequestNow(
    phaseRunId: PhaseRunId,
    questions: ValidatedQuestion[],
    actor: string,
    idempotencyKey: string,
  ): Promise<ClarificationRequest> {
    const existingKey = this.requireRequestKeys().get(idempotencyKey)
    if (existingKey !== undefined) {
      const stored = this.requireRequests().get(existingKey.requestId)
      if (stored === undefined) throw new ClarificationError('not-found', `request "${existingKey.requestId}" is missing`)
      if (!this.sameQuestions(stored, questions)) {
        throw new ClarificationError('conflict', 'clarification idempotency key reused with different questions')
      }
      return stored
    }
    const phaseRun = await this.ctx.tasks.getPhaseRun(String(phaseRunId))
    if (phaseRun === undefined) throw new ClarificationError('not-found', `phase run "${phaseRunId}" is unknown`)
    const requestId = RequestIdOf(randomUUID())
    const stored = storedQuestions(questions, requestId)
    const questionIds = stored.map(question => question.questionId)
    const request: ClarificationRequest = {
      requestId,
      phaseRunId,
      taskId: phaseRun.taskId,
      questionIds,
      state: 'open',
      revision: 1,
      createdAt: Date.now(),
    }
    await this.appendFact({
      kind: 'clarification/request-created',
      taskId: phaseRun.taskId,
      idempotencyKey: `clarification/request-created:${idempotencyKey}`,
      entityRevision: 1,
      payload: { requestId: String(requestId), phaseRunId: String(phaseRunId), actor },
    })
    await this.requireRequests().put(String(requestId), request)
    await this.requireRequestKeys().put(idempotencyKey, { requestId: String(requestId) })
    const questionTable = this.requireQuestions()
    for (const question of storedQuestions(questions, requestId)) {
      await questionTable.put(String(question.questionId), question)
    }
    await this.ctx.attention.createItem({
      itemId: AttentionItemId(`clarification:${String(requestId)}`),
      taskId: phaseRun.taskId,
      phaseRunId,
      kind: 'clarification',
      decisionKind: 'clarification',
      options: [SATISFIED_OPTION],
    }, FACT_ACTOR, `clarification/item:${idempotencyKey}`)
    return request
  }

  private async answerPartialNow(
    questionId: ClarificationQuestionId,
    expectedRevision: number,
    value: string,
    actor: string,
    idempotencyKey: string,
  ): Promise<Answer> {
    const question = this.requireQuestions().get(String(questionId))
    if (question === undefined) throw new ClarificationError('not-found', `question "${questionId}" is unknown`)
    if (expectedRevision !== question.revision) {
      throw new ClarificationError('conflict', `question "${questionId}" revision is ${question.revision}, expected ${expectedRevision}`)
    }
    const answers = this.requireAnswers()
    const existing = answers.get(String(questionId))
    if (existing !== undefined) {
      if (existing.value === value) return existing
      throw new ClarificationError('conflict', `question "${questionId}" already answered differently`)
    }
    const request = this.requireRequests().get(String(question.requestId))
    if (request === undefined) throw new ClarificationError('not-found', `request "${question.requestId}" is missing`)
    const answer: Answer = {
      questionId,
      actor,
      value,
      submittedAt: Date.now(),
      revision: question.revision,
    }
    await this.appendFact({
      kind: 'clarification/answer-recorded',
      taskId: request.taskId,
      idempotencyKey: `clarification/answer-recorded:${idempotencyKey}`,
      entityRevision: answer.revision,
      payload: { questionId: String(questionId), value },
    })
    await answers.put(String(questionId), answer)
    await this.injectIfComplete(question.requestId)
    return answer
  }

  /** Inject and resume when every required question of an open request is answered. */
  private async injectIfComplete(requestId: ClarificationRequestId): Promise<void> {
    const requests = this.requireRequests()
    const request = requests.get(String(requestId))
    if (request === undefined || request.state !== 'open') return
    if (!this.allRequiredAnswered(request)) return
    const factKey = injectedFactKey(requestId)
    const existingFact = this.ctx.workbenchJournal.replay(0).find(fact => fact.idempotencyKey === factKey)
    let injectedEventId: number
    if (existingFact !== undefined) {
      injectedEventId = (existingFact.payload as { injectedEventId: number }).injectedEventId
    } else {
      injectedEventId = await this.appendSessionMessage(request)
      await this.appendFact({
        kind: 'clarification/injected',
        taskId: request.taskId,
        idempotencyKey: factKey,
        entityRevision: request.revision + 1,
        payload: { requestId: String(requestId), injectedEventId },
      })
    }
    await requests.put(String(requestId), {
      ...request,
      state: 'injected',
      injectedEventId,
      revision: request.revision + 1,
    })
    await this.ctx.attention.resolveDecision(
      `clarification:${String(requestId)}`,
      1,
      SATISFIED_OPTION,
      FACT_ACTOR,
      `clarification/resolve-item:${String(requestId)}`,
    )
    await this.resumePhaseRun(request)
  }

  /** Whether every required question of the request has a recorded answer. */
  private allRequiredAnswered(request: ClarificationRequest): boolean {
    const questions = this.requireQuestions()
    const answers = this.requireAnswers()
    for (const questionId of request.questionIds) {
      const question = questions.get(String(questionId))
      if (question === undefined || !question.required) continue
      if (answers.get(String(questionId)) === undefined) return false
    }
    return true
  }

  /** Append the answer summary as a model-visible user message; return its persisted event seq. */
  private async appendSessionMessage(request: ClarificationRequest): Promise<number> {
    const phaseRun = await this.ctx.tasks.getPhaseRun(String(request.phaseRunId))
    if (phaseRun === undefined || phaseRun.sessionId === undefined) {
      throw new ClarificationError('not-found', `phase run "${request.phaseRunId}" has no recorded session id`)
    }
    const session: Session | undefined = this.ctx.sessions.get(phaseRun.sessionId as SessionId)
    if (session === undefined) throw new ClarificationError('not-found', `phase session "${phaseRun.sessionId}" is not live`)
    const questions = this.requireQuestions()
    const answers = this.requireAnswers()
    const lines: string[] = []
    for (const questionId of request.questionIds) {
      const question = questions.get(String(questionId))
      const answer = answers.get(String(questionId))
      if (question === undefined || answer === undefined) continue
      lines.push(`${question.text}: ${answer.value}`)
    }
    const text = `Clarification answers:\n${lines.join('\n')}`
    const event = session.append('user/message', createUserMessage({
      content: [{ type: 'text', text }],
      source: { kind: 'user' },
    }), { surfaceOp: 'append' })
    return event.seq
  }

  /** Resume the phase run out of awaiting-input; a no-op once already resumed. */
  private async resumePhaseRun(request: ClarificationRequest): Promise<void> {
    const phaseRun = await this.ctx.tasks.getPhaseRun(String(request.phaseRunId))
    if (phaseRun === undefined || phaseRun.state !== 'awaiting-input') return
    await this.ctx.tasks.resumePhaseFromAwaiting(String(request.phaseRunId), {
      actor: FACT_ACTOR,
      reason: 'clarification-answers-injected',
      expectedRevision: phaseRun.revision,
      idempotencyKey: `clarification/resume:${String(request.requestId)}`,
    })
  }

  /** Compare a stored request's questions against the validated wire questions. */
  private sameQuestions(request: ClarificationRequest, questions: ValidatedQuestion[]): boolean {
    if (request.questionIds.length !== questions.length) return false
    const stored = this.requireQuestions()
    let index = 0
    for (const input of questions) {
      const questionId = request.questionIds[index] as ClarificationQuestionId
      index += 1
      const question = stored.get(String(questionId))
      if (question === undefined
        || question.phaseId !== input.phaseId
        || question.required !== input.required
        || question.order !== input.order
        || question.text !== input.text) {
        return false
      }
    }
    return true
  }

  /** Validate the wire question list and normalize field defaults. */
  private validateQuestions(questions: ClarificationQuestionInput[]): ValidatedQuestion[] {
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new ClarificationError('invalid-argument', 'questions must be a non-empty array')
    }
    return questions.map((input, index) => ({
      phaseId: this.requireText(input.phaseId, 'phaseId'),
      required: typeof input.required === 'boolean' && input.required,
      order: Number.isSafeInteger(input.order) ? input.order : index,
      text: this.requireText(input.text, 'text'),
    }))
  }

  /** Append one clarification fact; the journal's durable write is the commit point. */
  private async appendFact(input: {
    readonly kind: ClarificationFactKind
    readonly taskId: ClarificationRequest['taskId']
    readonly idempotencyKey: string
    readonly entityRevision: number
    readonly payload: unknown
  }): Promise<void> {
    await this.ctx.workbenchJournal.append({
      taskId: input.taskId,
      kind: input.kind,
      actor: FACT_ACTOR,
      idempotencyKey: input.idempotencyKey,
      entityRevision: input.entityRevision,
      payload: input.payload as JournalPayload,
    })
  }

  /** Validate one non-empty wire field, returning the trimmed value. */
  private requireText(value: string, field: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new ClarificationError('invalid-argument', `${field} must be a non-empty string`)
    }
    return value.trim()
  }

  private requireRequests(): KvTable<string, ClarificationRequest> {
    if (this.requests === undefined) throw new ClarificationError('not-found', 'clarification domain is not initialized')
    return this.requests
  }

  private requireRequestKeys(): KvTable<string, RequestKeyEntry> {
    if (this.requestKeys === undefined) throw new ClarificationError('not-found', 'clarification domain is not initialized')
    return this.requestKeys
  }

  private requireQuestions(): KvTable<string, Question> {
    if (this.questions === undefined) throw new ClarificationError('not-found', 'clarification domain is not initialized')
    return this.questions
  }

  private requireAnswers(): KvTable<string, Answer> {
    if (this.answers === undefined) throw new ClarificationError('not-found', 'clarification domain is not initialized')
    return this.answers
  }
}

export default ClarificationService
