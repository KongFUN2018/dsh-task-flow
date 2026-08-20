/** M5 seam coverage: task-level decision states, completion guards, phase supersede, run parentage, and the gate-check event. */

import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import RecipeRegistry, { EMPTY_TEMPLATE_RECIPE_ID } from '../src/recipe/index.ts'
import type { GateCheckResult, TaskMutationContext } from '../src/task/types.ts'
import { SubmissionId } from '../src/task/runtime.ts'
import { FakeTaskProvider } from './fake-provider.ts'
import { submission } from './submission-fixture.ts'

const mutation = (over: Partial<TaskMutationContext> = {}): TaskMutationContext => ({
  actor: 'test',
  reason: 'unit',
  expectedRevision: 1,
  idempotencyKey: 'k-1',
  ...over,
})

async function harness(): Promise<{ provider: FakeTaskProvider; ctx: Context }> {
  const ctx = new Context()
  await ctx.plugin(RecipeRegistry)
  return { provider: new FakeTaskProvider(ctx), ctx }
}

interface GatedPhase {
  gatedPhaseRevision: number
  phaseRunId: string
  submissionId: string
  taskId: string
  taskRevision: number
}

/** A started task with one gate-running phase run and its stored submission. */
async function gatedPhase(provider: FakeTaskProvider): Promise<GatedPhase> {
  const created = await provider.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'actor', 'create-k')
  await provider.startTask(created.taskId, mutation({ expectedRevision: 1 }))
  const run = await provider.createTaskRun(created.taskId, mutation({ expectedRevision: 2 }))
  const phaseRun = await provider.createPhaseRun(run.runId, 'main', mutation())
  await provider.startPhaseRun(phaseRun.phaseRunId, mutation())
  const stored = await provider.recordSubmission(submission(created, run, phaseRun), {
    submittedBy: 'driver',
    sourceSeqPersisted: true,
    inputsCurrent: true,
    outputsValid: true,
  })
  const gated = await provider.startGate(stored.submissionId, mutation({ expectedRevision: 3 }))
  return {
    gatedPhaseRevision: gated.revision,
    phaseRunId: String(gated.phaseRunId),
    submissionId: String(stored.submissionId),
    taskId: String(created.taskId),
    taskRevision: 3,
  }
}

/** Drive one phase run to passed through the standard gate path. */
async function passPhase(provider: FakeTaskProvider, phaseRunId: string, submissionId: string, phaseRevision: number): Promise<number> {
  await provider.recordGateCheck({ submissionId: SubmissionId(submissionId), checkId: 'main-submission-complete', passed: true, recordedAt: Date.now() })
  const passed = await provider.markPhasePassed(phaseRunId, mutation({ expectedRevision: phaseRevision }))
  expect(passed.state).toBe('passed')
  return passed.revision
}

describe('M5 task-level decision states', () => {
  it('parks a running task in awaiting-decision and resumes it', async () => {
    const { provider } = await harness()
    const { taskId } = await gatedPhase(provider)
    const parked = await provider.markTaskAwaitingDecision(taskId, mutation({ expectedRevision: 3 }))
    expect(parked.state).toBe('awaiting-decision')
    await expect(provider.markTaskAwaitingDecision(taskId, mutation({ expectedRevision: 4 })))
      .rejects.toThrow(/cannot awaitDecision/)
    const resumed = await provider.resumeTaskFromDecision(taskId, mutation({ expectedRevision: 4 }))
    expect(resumed.state).toBe('running')
  })

  it('rejects the decision commands from wrong source states', async () => {
    const { provider } = await harness()
    const created = await provider.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'actor', 'create-k')
    await expect(provider.markTaskAwaitingDecision(String(created.taskId), mutation()))
      .rejects.toThrow(/cannot awaitDecision/)
    await provider.startTask(created.taskId, mutation())
    await expect(provider.resumeTaskFromDecision(String(created.taskId), mutation({ expectedRevision: 2 })))
      .rejects.toThrow(/cannot resumeFromDecision/)
  })
})

describe('M5 completion guards', () => {
  it('vetoes completion when a registered guard throws, then passes after disposal', async () => {
    const { provider } = await harness()
    const { taskId, phaseRunId, submissionId } = await gatedPhase(provider)
    await passPhase(provider, phaseRunId, submissionId, 4)
    const dispose = provider.registerCompletionGuard(async () => {
      throw new Error('unsigned B items remain')
    })
    await expect(provider.completeTask(taskId, mutation({ expectedRevision: 3 }))).rejects.toThrow(/unsigned B items remain/)
    expect((await provider.getTask(taskId))?.state).toBe('running')
    dispose()
    const completed = await provider.completeTask(taskId, mutation({ expectedRevision: 3 }))
    expect(completed.state).toBe('completed')
  })

  it('runs approving guards before committing', async () => {
    const { provider } = await harness()
    const { taskId, phaseRunId, submissionId } = await gatedPhase(provider)
    await passPhase(provider, phaseRunId, submissionId, 4)
    let seen = 0
    provider.registerCompletionGuard(async () => { seen += 1 })
    const completed = await provider.completeTask(taskId, mutation({ expectedRevision: 3 }))
    expect(completed.state).toBe('completed')
    expect(seen).toBe(1)
  })
})

describe('M5 phase supersede', () => {
  it('retires a passed phase run as superseded and a stale-gated one too', async () => {
    const { provider } = await harness()
    const { taskId, phaseRunId, submissionId } = await gatedPhase(provider)
    const passedRevision = await passPhase(provider, phaseRunId, submissionId, 4)
    const superseded = await provider.markPhaseSuperseded(phaseRunId, mutation({ expectedRevision: passedRevision }))
    expect(superseded.state).toBe('superseded')
    await expect(provider.markPhaseSuperseded(phaseRunId, mutation({ expectedRevision: superseded.revision })))
      .rejects.toThrow(/cannot supersede/)
    const completed = await provider.completeTask(taskId, mutation({ expectedRevision: 3 }))
    expect(completed.state).toBe('completed')
  })
})

describe('M5 run parentage', () => {
  it('links a rewind run to its parent and omits the link on the initial run', async () => {
    const { provider } = await harness()
    const created = await provider.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'actor', 'create-k')
    await provider.startTask(created.taskId, mutation({ expectedRevision: 1 }))
    const first = await provider.createTaskRun(created.taskId, mutation({ expectedRevision: 2 }))
    expect(first.parentRunId).toBeUndefined()
    const second = await provider.createTaskRun(created.taskId, mutation({ expectedRevision: 3 }), String(first.runId))
    expect(String(second.parentRunId)).toBe(String(first.runId))
    await expect(provider.createTaskRun(created.taskId, mutation({ expectedRevision: 4 }), '  '))
      .rejects.toMatchObject({ code: 'invalid-argument' })
  })
})

describe('M5 gate-check event', () => {
  it('emits gate-check/recorded with the stored verdict', async () => {
    const { provider, ctx } = await harness()
    const { submissionId } = await gatedPhase(provider)
    const seen: GateCheckResult[] = []
    ctx.on('gate-check/recorded', (result) => { seen.push(result) })
    await provider.recordGateCheck({ submissionId: SubmissionId(submissionId), checkId: 'main-submission-complete', passed: false, recordedAt: 123 })
    expect(seen).toEqual([{ submissionId: SubmissionId(submissionId), checkId: 'main-submission-complete', passed: false, recordedAt: 123 }])
  })
})
