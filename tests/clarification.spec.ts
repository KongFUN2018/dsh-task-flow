/** Unit suite: request creation, idempotent partial answers, required-answer injection, and restart recovery. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import RecipeRegistry, { EMPTY_TEMPLATE_RECIPE_ID } from '../src/recipe/index.ts'
import DeliverableService from '../src/deliverable/index.ts'
import WorkbenchJournalService from '../src/workbench/journal/index.ts'
import SessionStore from '@deepseek-ai/dsh-session'
import type { SessionId } from '@deepseek-ai/dsh-session'
import LocalTaskService from '../src/task-local/index.ts'
import AttentionService from '../src/attention/index.ts'
import type { PhaseSubmission, TaskMutationContext } from '../src/task/types.ts'
import { SubmissionId } from '../src/task/index.ts'
import ClarificationService from '../src/clarification/index.ts'
import { clarificationDomainSpec } from '../src/clarification/spec.ts'
import type { Question } from '../src/clarification/types.ts'
import type { KvTable } from '@deepseek-ai/dsh-storage-domain'
import {
  MemoryMediaPool,
  MemoryStorageBackend,
} from './fixtures/memory-backend.ts'

/** Boot task, session, and clarification services over one memory medium. */
async function harness(pool?: MemoryMediaPool) {
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('memory', new MemoryStorageBackend(pool))
  const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
  ctx.storage.mount('domain', facility)
  ctx.provide('storageDomain', facility)
  await ctx.plugin(RecipeRegistry)
  await ctx.plugin(WorkbenchJournalService)
  await ctx.plugin(DeliverableService)
  await ctx.plugin(SessionStore)
  await ctx.plugin(LocalTaskService)
  await ctx.plugin(AttentionService)
  await ctx.plugin(ClarificationService).await()
  return {
    ctx,
    clarifications: ctx.clarifications,
    tasks: ctx.tasks,
    sessions: ctx.sessions,
    journal: ctx.workbenchJournal,
    attention: ctx.attention,
  }
}

/** Boot the service's dependencies without initializing the clarification service itself. */
async function rawHarness() {
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('memory', new MemoryStorageBackend())
  const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
  ctx.storage.mount('domain', facility)
  ctx.provide('storageDomain', facility)
  await ctx.plugin(RecipeRegistry)
  await ctx.plugin(WorkbenchJournalService)
  await ctx.plugin(DeliverableService)
  await ctx.plugin(SessionStore)
  await ctx.plugin(LocalTaskService)
  const service = new ClarificationService(ctx)
  return { ctx, service }
}

/** The open clarification domain handle for direct table manipulation. */
function domainOf(ctx: Context) {
  const domain = ctx.storage.form('domain').get('clarification')
  if (domain === undefined) throw new Error('clarification domain is not open')
  return domain
}

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

const mutation = (expectedRevision: number, over: Partial<TaskMutationContext> = {}): TaskMutationContext => ({
  actor: 'unit',
  reason: 'clarification spec',
  expectedRevision,
  idempotencyKey: 'mut-k',
  ...over,
})

const QUESTIONS = [
  { phaseId: 'clarify', required: true, order: 0, text: 'What is the target?' },
  { phaseId: 'clarify', required: true, order: 1, text: 'What is the budget?' },
  { phaseId: 'clarify', required: false, order: 2, text: 'Any constraints?' },
]

/** Drive one task to a gate-running phase run. */
async function gateRunning(h: Awaited<ReturnType<typeof harness>>) {
  const created = await h.tasks.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'unit', 'create-k')
  await h.tasks.startTask(created.taskId, mutation(1))
  const run = await h.tasks.createTaskRun(created.taskId, mutation(2))
  const phaseRun = await h.tasks.createPhaseRun(run.runId, 'main', mutation(1))
  await h.tasks.startPhaseRun(phaseRun.phaseRunId, mutation(1))
  const submission: PhaseSubmission = {
    submissionId: SubmissionId('s-1'),
    taskId: created.taskId,
    taskRunId: run.runId,
    phaseRunId: phaseRun.phaseRunId,
    phaseId: 'main',
    attempt: 1,
    pinnedRecipe: created.pinnedRecipe,
    sourceSessionId: 'session-1',
    sourceSeqRange: { start: 1, end: 5 },
    inputVersions: [],
    outputVersions: [],
    unresolvedIssues: [],
    result: 'completed',
    idempotencyKey: 'sub-k-1',
    submittedAt: Date.now(),
  }
  await h.tasks.recordSubmission(submission, {
    submittedBy: 'unit',
    sourceSeqPersisted: true,
    inputsCurrent: true,
    outputsValid: true,
  })
  const gated = await h.tasks.startGate('s-1', mutation(3))
  return { phaseRunId: gated.phaseRunId, taskId: created.taskId }
}

describe('createRequest', () => {
  it('creates a request with assigned questions and replays idempotently', async () => {
    const h = await harness()
    current = h.ctx
    const { phaseRunId } = await gateRunning(h)
    const request = await h.clarifications.createRequest(phaseRunId, QUESTIONS, 'pm', 'req-k')
    expect(request.state).toBe('open')
    expect(request.questionIds).toHaveLength(3)
    expect(request.phaseRunId).toBe(phaseRunId)
    const replayed = await h.clarifications.createRequest(phaseRunId, QUESTIONS, 'pm', 'req-k')
    expect(replayed.requestId).toBe(request.requestId)
    const open = h.clarifications.listOpen(phaseRunId)
    expect(open.map(entry => entry.requestId)).toEqual([request.requestId])
    const items = h.attention.listOpen()
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      itemId: `clarification:${String(request.requestId)}`,
      taskId: request.taskId,
      phaseRunId,
      kind: 'clarification',
      decisionKind: 'clarification',
      options: ['satisfied'],
      state: 'open',
    })
  })

  it('rejects a reused idempotency key with different questions', async () => {
    const h = await harness()
    current = h.ctx
    const { phaseRunId } = await gateRunning(h)
    await h.clarifications.createRequest(phaseRunId, QUESTIONS, 'pm', 'req-k')
    await expect(h.clarifications.createRequest(phaseRunId, [QUESTIONS[0]!], 'pm', 'req-k'))
      .rejects.toMatchObject({ code: 'conflict' })
  })
})

describe('answerPartial', () => {
  it('records answers idempotently and rejects conflicting values', async () => {
    const h = await harness()
    current = h.ctx
    const { phaseRunId } = await gateRunning(h)
    const request = await h.clarifications.createRequest(phaseRunId, QUESTIONS, 'pm', 'req-k')
    const q0 = String(request.questionIds[0]!)
    const first = await h.clarifications.answerPartial(q0, 1, 'target-x', 'pm', 'a-1')
    expect(first.value).toBe('target-x')
    expect(first.revision).toBe(1)
    const replayed = await h.clarifications.answerPartial(q0, 1, 'target-x', 'pm', 'a-2')
    expect(replayed.value).toBe('target-x')
    await expect(h.clarifications.answerPartial(q0, 1, 'target-y', 'pm', 'a-3'))
      .rejects.toMatchObject({ code: 'conflict' })
    await expect(h.clarifications.answerPartial(q0, 2, 'target-x', 'pm', 'a-4'))
      .rejects.toMatchObject({ code: 'conflict' })
  })

  it('rejects an unknown question', async () => {
    const h = await harness()
    current = h.ctx
    await expect(h.clarifications.answerPartial('nope', 1, 'x', 'pm', 'a-1'))
      .rejects.toMatchObject({ code: 'not-found' })
  })
})

describe('required-answer injection', () => {
  it('injects the summary into the phase session and resumes the parked run', async () => {
    const h = await harness()
    current = h.ctx
    const { phaseRunId } = await gateRunning(h)
    const awaiting = await h.tasks.markPhaseAwaitingInput(phaseRunId, mutation(4))
    expect(awaiting.state).toBe('awaiting-input')
    await h.tasks.recordPhaseSession(phaseRunId, 'phase-session', mutation(5))
    h.sessions.create('phase-session' as SessionId)
    const request = await h.clarifications.createRequest(phaseRunId, QUESTIONS, 'pm', 'req-k')
    await h.clarifications.answerPartial(String(request.questionIds[0]!), 1, 'target-x', 'pm', 'a-1')
    await h.clarifications.answerPartial(String(request.questionIds[1]!), 1, 'budget-y', 'pm', 'a-2')
    const injected = h.clarifications.getRequest(String(request.requestId))
    expect(injected?.state).toBe('injected')
    expect(injected?.injectedEventId).toBeTypeOf('number')
    const session = h.sessions.get('phase-session' as SessionId)
    const userEvents = session?.events.filter(event => event.type === 'user/message') ?? []
    expect(userEvents).toHaveLength(1)
    const resumed = await h.tasks.getPhaseRun(phaseRunId)
    expect(resumed?.state).toBe('gate-running')
    const item = h.attention.getItem(`clarification:${String(request.requestId)}`)
    expect(item?.state).toBe('resolved')
    expect(item?.outcome).toBe('satisfied')
    const facts = h.journal.replay(0).filter(fact => fact.kind === 'clarification/injected')
    expect(facts).toHaveLength(1)
  })

  it('does not inject until every required question is answered', async () => {
    const h = await harness()
    current = h.ctx
    const { phaseRunId } = await gateRunning(h)
    await h.tasks.markPhaseAwaitingInput(phaseRunId, mutation(4))
    await h.tasks.recordPhaseSession(phaseRunId, 'phase-session', mutation(5))
    h.sessions.create('phase-session' as SessionId)
    const request = await h.clarifications.createRequest(phaseRunId, QUESTIONS, 'pm', 'req-k')
    await h.clarifications.answerPartial(String(request.questionIds[0]!), 1, 'target-x', 'pm', 'a-1')
    expect(h.clarifications.getRequest(String(request.requestId))?.state).toBe('open')
    await h.clarifications.answerPartial(String(request.questionIds[1]!), 1, 'budget-y', 'pm', 'a-2')
    expect(h.clarifications.getRequest(String(request.requestId))?.state).toBe('injected')
  })
})

describe('wire validation', () => {
  it('rejects an empty question list', async () => {
    const h = await harness()
    current = h.ctx
    const { phaseRunId } = await gateRunning(h)
    expect(() => h.clarifications.createRequest(phaseRunId, [], 'pm', 'k'))
      .toThrow(expect.objectContaining({ code: 'invalid-argument' }))
  })

  it('rejects a blank question field', async () => {
    const h = await harness()
    current = h.ctx
    const { phaseRunId } = await gateRunning(h)
    expect(() => h.clarifications.createRequest(phaseRunId, [{ phaseId: ' ', required: true, order: 0, text: 'x' }], 'pm', 'k'))
      .toThrow(expect.objectContaining({ code: 'invalid-argument' }))
  })

  it('rejects an unknown phase run', async () => {
    const h = await harness()
    current = h.ctx
    await expect(h.clarifications.createRequest('ghost-phase', QUESTIONS, 'pm', 'k'))
      .rejects.toMatchObject({ code: 'not-found' })
  })

  it('normalizes a non-integer order to the question index', async () => {
    const h = await harness()
    current = h.ctx
    const { phaseRunId } = await gateRunning(h)
    const request = await h.clarifications.createRequest(phaseRunId, [
      { phaseId: 'p', required: true, order: Number.NaN, text: 'q' },
    ], 'pm', 'k')
    const question = domainOf(h.ctx).table('questions').get(String(request.questionIds[0]!)) as Question | undefined
    expect(question?.order).toBe(0)
  })

  it('rejects a non-string answer or invalid expected revision', async () => {
    const h = await harness()
    current = h.ctx
    const { phaseRunId } = await gateRunning(h)
    const request = await h.clarifications.createRequest(phaseRunId, QUESTIONS, 'pm', 'req-k')
    const q0 = String(request.questionIds[0]!)
    expect(() => h.clarifications.answerPartial(q0, 1, 42 as unknown as string, 'pm', 'a'))
      .toThrow(expect.objectContaining({ code: 'invalid-argument' }))
    expect(() => h.clarifications.answerPartial(q0, 0, 'x', 'pm', 'a'))
      .toThrow(expect.objectContaining({ code: 'invalid-argument' }))
  })
})

describe('listOpen', () => {
  it('lists only open requests in creation order', async () => {
    const h = await harness()
    current = h.ctx
    const { phaseRunId } = await gateRunning(h)
    await h.tasks.markPhaseAwaitingInput(phaseRunId, mutation(4))
    await h.tasks.recordPhaseSession(phaseRunId, 's', mutation(5))
    h.sessions.create('s' as SessionId)
    const r1 = await h.clarifications.createRequest(phaseRunId, QUESTIONS, 'pm', 'r1-k')
    await h.clarifications.answerPartial(String(r1.questionIds[0]!), 1, 'a', 'pm', 'a1')
    await h.clarifications.answerPartial(String(r1.questionIds[1]!), 1, 'b', 'pm', 'a2')
    const r2 = await h.clarifications.createRequest(phaseRunId, QUESTIONS, 'pm', 'r2-k')
    const r3 = await h.clarifications.createRequest(phaseRunId, QUESTIONS, 'pm', 'r3-k')
    expect(h.clarifications.listOpen(phaseRunId).map(r => r.requestId)).toEqual([r2.requestId, r3.requestId])
  })
})

describe('recovery paths', () => {
  it('rejects a reused key whose stored request is missing', async () => {
    const h = await harness()
    current = h.ctx
    const { phaseRunId } = await gateRunning(h)
    await domainOf(h.ctx).table('request_keys').put('req-k', { requestId: 'ghost' })
    await expect(h.clarifications.createRequest(phaseRunId, QUESTIONS, 'pm', 'req-k'))
      .rejects.toMatchObject({ code: 'not-found' })
  })

  it('rejects an idempotent replay whose stored questions are missing', async () => {
    const h = await harness()
    current = h.ctx
    const { phaseRunId } = await gateRunning(h)
    const domain = domainOf(h.ctx)
    await domain.table('requests').put('r-1', {
      requestId: 'r-1', phaseRunId, taskId: 't-1', questionIds: ['ghost-q'],
      state: 'open', revision: 1, createdAt: 1,
    })
    await domain.table('request_keys').put('req-k', { requestId: 'r-1' })
    await expect(h.clarifications.createRequest(phaseRunId, [
      { phaseId: 'p', required: true, order: 0, text: 'x' },
    ], 'pm', 'req-k')).rejects.toMatchObject({ code: 'conflict' })
  })

  it('rejects an answer whose request is missing', async () => {
    const h = await harness()
    current = h.ctx
    await gateRunning(h)
    await domainOf(h.ctx).table('questions').put('q-1', {
      questionId: 'q-1', requestId: 'ghost', phaseId: 'p', required: true, order: 0, text: 'x', revision: 1,
    })
    await expect(h.clarifications.answerPartial('q-1', 1, 'x', 'pm', 'k'))
      .rejects.toMatchObject({ code: 'not-found' })
  })

  it('reuses the injected event id when the injected fact already exists', async () => {
    const h = await harness()
    current = h.ctx
    const { phaseRunId } = await gateRunning(h)
    await h.tasks.markPhaseAwaitingInput(phaseRunId, mutation(4))
    await h.tasks.recordPhaseSession(phaseRunId, 's', mutation(5))
    h.sessions.create('s' as SessionId)
    const request = await h.clarifications.createRequest(phaseRunId, QUESTIONS, 'pm', 'req-k')
    await h.clarifications.answerPartial(String(request.questionIds[0]!), 1, 'target-x', 'pm', 'a-1')
    await h.journal.append({
      taskId: request.taskId,
      kind: 'clarification/injected',
      actor: 'unit',
      idempotencyKey: `clarification/injected:${String(request.requestId)}`,
      entityRevision: 2,
      payload: { requestId: String(request.requestId), injectedEventId: 77 },
    })
    await h.clarifications.answerPartial(String(request.questionIds[1]!), 1, 'budget-y', 'pm', 'a-2')
    const injected = h.clarifications.getRequest(String(request.requestId))
    expect(injected?.state).toBe('injected')
    expect(injected?.injectedEventId).toBe(77)
    const session = h.sessions.get('s' as SessionId)
    expect(session?.events.filter(event => event.type === 'user/message')).toHaveLength(0)
  })

  it('does not re-inject when the request is already injected', async () => {
    const h = await harness()
    current = h.ctx
    const { phaseRunId } = await gateRunning(h)
    await h.tasks.markPhaseAwaitingInput(phaseRunId, mutation(4))
    await h.tasks.recordPhaseSession(phaseRunId, 's', mutation(5))
    h.sessions.create('s' as SessionId)
    const request = await h.clarifications.createRequest(phaseRunId, QUESTIONS, 'pm', 'req-k')
    await h.clarifications.answerPartial(String(request.questionIds[0]!), 1, 'target-x', 'pm', 'a-1')
    await h.clarifications.answerPartial(String(request.questionIds[1]!), 1, 'budget-y', 'pm', 'a-2')
    expect(h.clarifications.getRequest(String(request.requestId))?.state).toBe('injected')
    await h.clarifications.answerPartial(String(request.questionIds[2]!), 1, 'constraint-z', 'pm', 'a-3')
    const session = h.sessions.get('s' as SessionId)
    expect(session?.events.filter(event => event.type === 'user/message')).toHaveLength(1)
  })
})

describe('session-less injection', () => {
  it('fails injection when the phase run has no session id', async () => {
    const h = await harness()
    current = h.ctx
    const { phaseRunId } = await gateRunning(h)
    await h.tasks.markPhaseAwaitingInput(phaseRunId, mutation(4))
    const request = await h.clarifications.createRequest(phaseRunId, QUESTIONS, 'pm', 'req-k')
    await h.clarifications.answerPartial(String(request.questionIds[0]!), 1, 'target-x', 'pm', 'a-1')
    await expect(h.clarifications.answerPartial(String(request.questionIds[1]!), 1, 'budget-y', 'pm', 'a-2'))
      .rejects.toMatchObject({ code: 'not-found' })
    expect(h.clarifications.getRequest(String(request.requestId))?.state).toBe('open')
  })

  it('fails injection when the phase session is not live', async () => {
    const h = await harness()
    current = h.ctx
    const { phaseRunId } = await gateRunning(h)
    await h.tasks.markPhaseAwaitingInput(phaseRunId, mutation(4))
    await h.tasks.recordPhaseSession(phaseRunId, 's', mutation(5))
    const request = await h.clarifications.createRequest(phaseRunId, QUESTIONS, 'pm', 'req-k')
    await h.clarifications.answerPartial(String(request.questionIds[0]!), 1, 'target-x', 'pm', 'a-1')
    await expect(h.clarifications.answerPartial(String(request.questionIds[1]!), 1, 'budget-y', 'pm', 'a-2'))
      .rejects.toMatchObject({ code: 'not-found' })
  })
})

describe('resume no-op', () => {
  it('injects without resuming a run that is not awaiting input', async () => {
    const h = await harness()
    current = h.ctx
    const { phaseRunId } = await gateRunning(h)
    await h.tasks.recordPhaseSession(phaseRunId, 's', mutation(4))
    h.sessions.create('s' as SessionId)
    const request = await h.clarifications.createRequest(phaseRunId, QUESTIONS, 'pm', 'req-k')
    await h.clarifications.answerPartial(String(request.questionIds[0]!), 1, 'target-x', 'pm', 'a-1')
    await h.clarifications.answerPartial(String(request.questionIds[1]!), 1, 'budget-y', 'pm', 'a-2')
    expect(h.clarifications.getRequest(String(request.requestId))?.state).toBe('injected')
    const phaseRun = await h.tasks.getPhaseRun(phaseRunId)
    expect(phaseRun?.state).toBe('gate-running')
  })
})

describe('uninitialized service', () => {
  it('rejects reads and writes before the domain opens', async () => {
    const { ctx, service } = await rawHarness()
    current = ctx
    expect(() => service.getRequest('x')).toThrow(expect.objectContaining({ code: 'not-found' }))
    expect(() => service.listOpen('x')).toThrow(expect.objectContaining({ code: 'not-found' }))
    await expect(service.createRequest('p', QUESTIONS, 'pm', 'k')).rejects.toMatchObject({ code: 'not-found' })
    await expect(service.answerPartial('q', 1, 'a', 'pm', 'k')).rejects.toMatchObject({ code: 'not-found' })
  })

  it('rejects an answer when only the questions table is initialized', async () => {
    const { ctx, service } = await rawHarness()
    current = ctx
    const domain = await ctx.storageDomain.open(clarificationDomainSpec)
    const partial = service as unknown as { questions?: KvTable<string, Question> }
    partial.questions = domain.table('questions')
    await partial.questions.put('q-1', {
      questionId: 'q-1', requestId: 'r-1', phaseId: 'p', required: true, order: 0, text: 'x', revision: 1,
    } as unknown as Question)
    await expect(service.answerPartial('q-1', 1, 'a', 'pm', 'k')).rejects.toMatchObject({ code: 'not-found' })
  })
})
