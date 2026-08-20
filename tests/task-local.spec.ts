/** Unit suite: durable task lifecycle with journal commit points, deliverable-ref validation in the write chain, and restart recovery. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import RecipeRegistry, { EMPTY_TEMPLATE_RECIPE_ID } from '../src/recipe/index.ts'
import DeliverableService, { DeliverableId } from '../src/deliverable/index.ts'
import WorkbenchJournalService from '../src/workbench/journal/index.ts'
import SessionStore from '@deepseek-ai/dsh-session'
import type {
  GateCheckResult,
  PhaseSubmission,
  TaskMutationContext,
} from '../src/task/types.ts'
import { SubmissionId as SubmissionIdValue } from '../src/task/index.ts'
import LocalTaskService from '../src/task-local/index.ts'
import { taskFactKey } from '../src/task-local/spec.ts'
import {
  MemoryMediaPool,
  MemoryStorageBackend,
} from './fixtures/memory-backend.ts'

/** Boot journal, deliverables, and the durable task provider over one memory medium. */
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
  await ctx.plugin(LocalTaskService).await()
  return { ctx, tasks: ctx.tasks, journal: ctx.workbenchJournal, deliverables: ctx.deliverables }
}

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

const mutation = (expectedRevision: number, over: Partial<TaskMutationContext> = {}): TaskMutationContext => ({
  actor: 'unit',
  reason: 'task-local spec',
  expectedRevision,
  idempotencyKey: 'mut-k',
  ...over,
})

/** Drive one task to a running phase run with an accepted submission. */
async function runningSubmission(h: Awaited<ReturnType<typeof harness>>, over: Partial<PhaseSubmission> = {}) {
  const created = await h.tasks.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'unit', 'create-k')
  await h.tasks.startTask(created.taskId, mutation(1))
  const run = await h.tasks.createTaskRun(created.taskId, mutation(2))
  const phaseRun = await h.tasks.createPhaseRun(run.runId, 'main', mutation(1))
  await h.tasks.startPhaseRun(phaseRun.phaseRunId, mutation(1))
  const submission: PhaseSubmission = {
    submissionId: SubmissionIdValue('s-1'),
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
    ...over,
  }
  return { created, run, phaseRun, submission }
}

describe('durable lifecycle with journal commit points', () => {
  it('appends one journal fact per durable write and replays them', async () => {
    const h = await harness()
    current = h.ctx
    const { created, run, phaseRun, submission } = await runningSubmission(h)
    const stored = await h.tasks.recordSubmission(submission, {
      submittedBy: 'unit',
      sourceSeqPersisted: true,
      inputsCurrent: true,
      outputsValid: true,
    })
    expect(stored.submissionId).toBe('s-1')
    const facts = h.journal.replay(0)
    const keys = new Set(facts.map(fact => fact.idempotencyKey))
    expect(keys.has(taskFactKey('task/updated', created.taskId, 1))).toBe(true)
    expect(keys.has(taskFactKey('task/updated', created.taskId, 2))).toBe(true)
    expect(keys.has(taskFactKey('task-run/updated', run.runId, 1))).toBe(true)
    expect(keys.has(taskFactKey('phase-run/updated', phaseRun.phaseRunId, 1))).toBe(true)
    expect(keys.has(taskFactKey('submission/recorded', submission.submissionId, 1))).toBe(true)
    const actor = facts.find(fact => fact.kind === 'submission/recorded')?.actor
    expect(actor).toBe('unit')
  })

  it('rejects a concurrent write against a moved revision', async () => {
    const h = await harness()
    current = h.ctx
    const { created } = await runningSubmission(h)
    await h.tasks.requestPause(created.taskId, mutation(3))
    await expect(h.tasks.settlePause(created.taskId, mutation(3))).rejects.toMatchObject({
      name: 'TaskError',
      code: 'stale-revision',
    })
  })

  it('serializes concurrent commands so exactly one pause wins', async () => {
    const h = await harness()
    current = h.ctx
    const { created } = await runningSubmission(h)
    const first = h.tasks.requestPause(created.taskId, mutation(3))
    const second = h.tasks.requestPause(created.taskId, mutation(3))
    const settled = await Promise.allSettled([first, second])
    const fulfilled = settled.filter(result => result.status === 'fulfilled')
    const rejected = settled.filter(result => result.status === 'rejected')
    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)
  })

  it('recovers projections and journal head from the same medium after a restart', async () => {
    const pool = new MemoryMediaPool()
    const first = await harness(pool)
    const { created, submission } = await runningSubmission(first)
    await first.tasks.recordSubmission(submission, {
      submittedBy: 'unit',
      sourceSeqPersisted: true,
      inputsCurrent: true,
      outputsValid: true,
    })
    const before = first.journal.checkpoint().journalSeq
    await first.ctx.fiber.dispose()
    const second = await harness(pool)
    current = second.ctx
    const recovered = await second.tasks.getTask(created.taskId)
    expect(recovered?.state).toBe('running')
    expect(recovered?.revision).toBe(3)
    expect(second.journal.checkpoint().journalSeq).toBe(before)
    const listed = await second.tasks.listTasks()
    expect(listed).toHaveLength(1)
  })
})

describe('deliverable-ref validation in the write chain', () => {
  it('derives input currency from the deliverable service, not the caller claim', async () => {
    const h = await harness()
    current = h.ctx
    const input = await h.deliverables.saveVersion(DeliverableId('brief'), null, null)
    await h.deliverables.invalidateDownstream([input.versionId])
    const { submission } = await runningSubmission(h, {
      inputVersions: [{ deliverableId: DeliverableId('brief'), versionId: input.versionId }],
    })
    await expect(h.tasks.recordSubmission(submission, {
      submittedBy: 'unit',
      sourceSeqPersisted: true,
      inputsCurrent: true,
      outputsValid: true,
    })).rejects.toMatchObject({
      name: 'TaskError',
      code: 'submission-rejected',
      problems: [expect.stringContaining('no longer current')],
    })
  })

  it('derives output provenance from the deliverable service', async () => {
    const h = await harness()
    current = h.ctx
    const orphan = await h.deliverables.saveVersion(DeliverableId('doc'), null, 'other-sub')
    const { submission } = await runningSubmission(h, {
      outputVersions: [{ deliverableId: DeliverableId('doc'), versionId: orphan.versionId }],
    })
    await expect(h.tasks.recordSubmission(submission, {
      submittedBy: 'unit',
      sourceSeqPersisted: true,
      inputsCurrent: true,
      outputsValid: true,
    })).rejects.toMatchObject({
      name: 'TaskError',
      code: 'submission-rejected',
      problems: [expect.stringContaining('missing or not from this submission')],
    })
  })

  it('accepts real inputs and outputs, registers phase inputs, and lists them current', async () => {
    const h = await harness()
    current = h.ctx
    const input = await h.deliverables.saveVersion(DeliverableId('brief'), null, null)
    const submissionId = SubmissionIdValue('s-9')
    const output = await h.deliverables.saveVersion(DeliverableId('doc'), null, submissionId)
    const { phaseRun, submission } = await runningSubmission(h, {
      submissionId,
      idempotencyKey: 'sub-k-9',
      inputVersions: [{ deliverableId: DeliverableId('brief'), versionId: input.versionId }],
      outputVersions: [{ deliverableId: DeliverableId('doc'), versionId: output.versionId }],
    })
    await h.tasks.recordSubmission(submission, {
      submittedBy: 'unit',
      sourceSeqPersisted: true,
      inputsCurrent: false,
      outputsValid: false,
    })
    const currentInputs = h.deliverables.listCurrentInputs(phaseRun.phaseRunId)
    expect(currentInputs.map(version => version.versionId)).toEqual([input.versionId])
  })
})

describe('gate result storage', () => {
  it('stores verdicts in recording order and dedupes identical retries', async () => {
    const h = await harness()
    current = h.ctx
    const { submission } = await runningSubmission(h)
    await h.tasks.recordSubmission(submission, {
      submittedBy: 'unit',
      sourceSeqPersisted: true,
      inputsCurrent: true,
      outputsValid: true,
    })
    const result: GateCheckResult = {
      submissionId: SubmissionIdValue('s-1'),
      checkId: 'main-submission-complete',
      passed: true,
      recordedAt: 12345,
    }
    await h.tasks.recordGateCheck(result)
    await h.tasks.recordGateCheck(result)
    const stored = await h.tasks.listGateResults('s-1')
    expect(stored).toHaveLength(1)
  })
})
