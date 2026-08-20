import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import RecipeRegistry, { EMPTY_TEMPLATE_RECIPE_ID } from '../src/recipe/index.ts'
import { TaskError } from '../src/task/index.ts'
import type {
  PhaseRunRecord,
  PhaseSubmission,
  TaskMutationContext,
  TaskRecord,
  TaskRunRecord,
} from '../src/task/types.ts'
import { SubmissionId, TaskId } from '../src/task/runtime.ts'
import { FakeTaskProvider } from './fake-provider.ts'

const mutation = (over: Partial<TaskMutationContext> = {}): TaskMutationContext => ({
  actor: 'test',
  reason: 'unit',
  expectedRevision: 1,
  idempotencyKey: 'k-1',
  ...over,
})

/** Provider plus the registry-backed context the task service reads recipes from. */
async function harness(): Promise<FakeTaskProvider> {
  const ctx = new Context()
  await ctx.plugin(RecipeRegistry)
  return new FakeTaskProvider(ctx)
}

/** A submission wired to the actual created records; `over` adjusts fields per scenario. */
function submission(task: TaskRecord, run: TaskRunRecord, phaseRun: PhaseRunRecord, over: Partial<PhaseSubmission> = {}): PhaseSubmission {
  return {
    submissionId: SubmissionId('s-1'),
    taskId: task.taskId,
    taskRunId: run.runId,
    phaseRunId: phaseRun.phaseRunId,
    phaseId: phaseRun.phaseId,
    attempt: 1,
    pinnedRecipe: task.pinnedRecipe,
    sourceSessionId: 'session-1',
    sourceSeqRange: { start: 1, end: 5 },
    inputVersions: [],
    outputVersions: [{ deliverableId: 'd-1' as never, versionId: 'v-1' as never }],
    unresolvedIssues: [],
    result: 'completed',
    idempotencyKey: 'sub-k-1',
    submittedAt: Date.now(),
    ...over,
  }
}

describe('task transitions', () => {
  it('runs a full happy path: create, start, run, phase, submit, gate, pass, complete', async () => {
    const provider = await harness()
    const created = await provider.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'actor', 'create-k')
    expect(created.state).toBe('planning')
    const started = await provider.startTask(created.taskId, mutation({ expectedRevision: 1 }))
    expect(started.state).toBe('running')
    const run = await provider.createTaskRun(created.taskId, mutation({ expectedRevision: 2 }))
    const phaseRun = await provider.createPhaseRun(run.runId, 'main', mutation())
    const running = await provider.startPhaseRun(phaseRun.phaseRunId, mutation())
    expect(running.state).toBe('running')
    const stored = await provider.recordSubmission(submission(created, run, phaseRun), {
      submittedBy: 'driver',
      sourceSeqPersisted: true,
      inputsCurrent: true,
      outputsValid: true,
    })
    expect(stored.submissionId).toBe('s-1')
    const gated = await provider.startGate(stored.submissionId, mutation({ expectedRevision: 3 }))
    expect(gated.state).toBe('gate-running')
    await provider.recordGateCheck({ submissionId: SubmissionId('s-1'), checkId: 'main-submission-complete', passed: true, recordedAt: Date.now() })
    const passed = await provider.markPhasePassed(gated.phaseRunId, mutation({ expectedRevision: 4 }))
    expect(passed.state).toBe('passed')
    const completed = await provider.completeTask(created.taskId, mutation({ expectedRevision: 3 }))
    expect(completed.state).toBe('completed')
  })

  it('rejects invalid transitions and stale revisions loudly', async () => {
    const provider = await harness()
    const created = await provider.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'actor', 'create-k')
    await expect(provider.startTask(created.taskId, mutation({ expectedRevision: 9 })))
      .rejects.toMatchObject({ code: 'stale-revision' })
    await expect(provider.completeTask(created.taskId, mutation()))
      .rejects.toMatchObject({ code: 'invalid-transition' })
    await provider.startTask(created.taskId, mutation())
    await expect(provider.startTask(created.taskId, mutation({ expectedRevision: 2 }))).rejects.toThrow(/cannot start/)
  })

  it('parks a gate-running phase in the awaiting states and resumes it', async () => {
    const provider = await harness()
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
    expect(gated.state).toBe('gate-running')

    const awaitingInput = await provider.markPhaseAwaitingInput(gated.phaseRunId, mutation({ expectedRevision: 4 }))
    expect(awaitingInput.state).toBe('awaiting-input')
    await expect(provider.markPhaseAwaitingDecision(gated.phaseRunId, mutation({ expectedRevision: 5 })))
      .rejects.toThrow(/cannot awaitDecision/)
    const resumedInput = await provider.resumePhaseFromAwaiting(gated.phaseRunId, mutation({ expectedRevision: 5 }))
    expect(resumedInput.state).toBe('gate-running')

    const awaitingDecision = await provider.markPhaseAwaitingDecision(gated.phaseRunId, mutation({ expectedRevision: 6 }))
    expect(awaitingDecision.state).toBe('awaiting-decision')
    const resumedDecision = await provider.resumePhaseFromAwaiting(gated.phaseRunId, mutation({ expectedRevision: 7 }))
    expect(resumedDecision.state).toBe('gate-running')
    await expect(provider.resumePhaseFromAwaiting(gated.phaseRunId, mutation({ expectedRevision: 8 })))
      .rejects.toThrow(/cannot resumeFromAwaiting/)
  })

  it('records and updates the phase session id idempotently', async () => {
    const provider = await harness()
    const created = await provider.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'actor', 'create-k')
    await provider.startTask(created.taskId, mutation({ expectedRevision: 1 }))
    const run = await provider.createTaskRun(created.taskId, mutation({ expectedRevision: 2 }))
    const phaseRun = await provider.createPhaseRun(run.runId, 'main', mutation())
    const recorded = await provider.recordPhaseSession(phaseRun.phaseRunId, 'phase-1', mutation({ expectedRevision: 1 }))
    expect(recorded.sessionId).toBe('phase-1')
    const again = await provider.recordPhaseSession(phaseRun.phaseRunId, 'phase-1', mutation({ expectedRevision: 2 }))
    expect(again.revision).toBe(2)
    const changed = await provider.recordPhaseSession(phaseRun.phaseRunId, 'phase-2', mutation({ expectedRevision: 2 }))
    expect(changed.sessionId).toBe('phase-2')
    expect(changed.revision).toBe(3)
  })

  it('completion guard requires every phase passed', async () => {
    const provider = await harness()
    const created = await provider.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'actor', 'create-k')
    await provider.startTask(created.taskId, mutation())
    await provider.createTaskRun(created.taskId, mutation({ expectedRevision: 2 }))
    await expect(provider.completeTask(created.taskId, mutation({ expectedRevision: 3 }))).rejects.toThrow(/completion guard failed/)
  })

  it('pause and cancel follow their two-step settle chains', async () => {
    const provider = await harness()
    const created = await provider.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'actor', 'create-k')
    await provider.startTask(created.taskId, mutation())
    const pausing = await provider.requestPause(created.taskId, mutation({ expectedRevision: 2 }))
    expect(pausing.state).toBe('pausing')
    const paused = await provider.settlePause(created.taskId, mutation({ expectedRevision: 3 }))
    expect(paused.state).toBe('paused')
    const resumed = await provider.resume(created.taskId, mutation({ expectedRevision: 4 }))
    expect(resumed.state).toBe('running')
    const cancelling = await provider.requestCancel(created.taskId, mutation({ expectedRevision: 5 }))
    expect(cancelling.state).toBe('cancelling')
    const cancelled = await provider.settleCancel(created.taskId, mutation({ expectedRevision: 6 }))
    expect(cancelled.state).toBe('cancelled')
    await expect(provider.resume(created.taskId, mutation({ expectedRevision: 7 }))).rejects.toThrow(/cannot resume/)
  })

  it('rejects cancellation from terminal tasks and cancels open phase runs', async () => {
    const provider = await harness()
    const created = await provider.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'actor', 'create-k')
    await provider.startTask(created.taskId, mutation())
    await provider.failTask(created.taskId, mutation({ expectedRevision: 2 }))
    await expect(provider.requestCancel(created.taskId, mutation({ expectedRevision: 3 }))).rejects.toThrow(/cannot cancel/)
    const run = await provider.createTaskRun(created.taskId, mutation({ expectedRevision: 3 }))
    const phaseRun = await provider.createPhaseRun(run.runId, 'main', mutation())
    const cancelled = await provider.cancelPhaseRun(phaseRun.phaseRunId, mutation())
    expect(cancelled.state).toBe('cancelled')
    await expect(provider.markPhasePassed(phaseRun.phaseRunId, mutation({ expectedRevision: 2 }))).rejects.toThrow(/cannot pass/)
  })
})

describe('task idempotency', () => {
  it('replays createTask with the same key and rejects a different payload', async () => {
    const provider = await harness()
    const first = await provider.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'actor', 'create-k')
    const replay = await provider.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'actor', 'create-k')
    expect(replay).toEqual(first)
    await expect(provider.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-2', 'actor', 'create-k'))
      .rejects.toThrow(TaskError)
  })
})

describe('submission acceptance', () => {
  it('rejects when the source sequence is not persisted or inputs are stale', async () => {
    const provider = await harness()
    const created = await provider.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'actor', 'create-k')
    await provider.startTask(created.taskId, mutation())
    const run = await provider.createTaskRun(created.taskId, mutation({ expectedRevision: 2 }))
    const phaseRun = await provider.createPhaseRun(run.runId, 'main', mutation())
    await provider.startPhaseRun(phaseRun.phaseRunId, mutation())
    const base = submission(created, run, phaseRun)
    const rejected = (sub: PhaseSubmission, env: Record<string, boolean>): Promise<unknown> =>
      provider.recordSubmission(sub, { submittedBy: 'driver', sourceSeqPersisted: true, inputsCurrent: true, outputsValid: true, ...env })
    await expect(rejected(base, { sourceSeqPersisted: false })).rejects.toMatchObject({
      code: 'submission-rejected',
      problems: [expect.stringContaining('not persisted')],
    })
    await expect(rejected(base, { inputsCurrent: false })).rejects.toMatchObject({
      code: 'submission-rejected',
      problems: [expect.stringContaining('no longer current')],
    })
    await expect(rejected(base, { outputsValid: false })).rejects.toMatchObject({
      code: 'submission-rejected',
      problems: [expect.stringContaining('missing or not from this submission')],
    })
    const wrongRecipe = submission(created, run, phaseRun, {
      pinnedRecipe: { ...created.pinnedRecipe, contentHash: 'tampered' },
    })
    await expect(rejected(wrongRecipe, {})).rejects.toMatchObject({
      code: 'submission-rejected',
      problems: [
        expect.stringContaining('recipe identity differs'),
        expect.stringContaining('recipe hash differs'),
      ],
    })
  })

  it('replays an idempotent submission and rejects a reused key with a different payload', async () => {
    const provider = await harness()
    const created = await provider.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'actor', 'create-k')
    await provider.startTask(created.taskId, mutation())
    const run = await provider.createTaskRun(created.taskId, mutation({ expectedRevision: 2 }))
    const phaseRun = await provider.createPhaseRun(run.runId, 'main', mutation())
    await provider.startPhaseRun(phaseRun.phaseRunId, mutation())
    const sub = submission(created, run, phaseRun)
    const env = { submittedBy: 'driver', sourceSeqPersisted: true, inputsCurrent: true, outputsValid: true }
    const first = await provider.recordSubmission(sub, env)
    const replay = await provider.recordSubmission({ ...sub }, env)
    expect(replay).toEqual(first)
    await expect(provider.recordSubmission(submission(created, run, phaseRun, { attempt: 2 }), env))
      .rejects.toMatchObject({
        code: 'submission-rejected',
        problems: [expect.stringContaining('reused with a different payload')],
      })
  })

  it('patches an accepted submission as a superseding revision with the note', async () => {
    const provider = await harness()
    const created = await provider.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'actor', 'create-k')
    await provider.startTask(created.taskId, mutation({ expectedRevision: 1 }))
    const run = await provider.createTaskRun(created.taskId, mutation({ expectedRevision: 2 }))
    const phaseRun = await provider.createPhaseRun(run.runId, 'main', mutation())
    await provider.startPhaseRun(phaseRun.phaseRunId, mutation())
    const env = { submittedBy: 'driver', sourceSeqPersisted: true, inputsCurrent: true, outputsValid: true }
    const stored = await provider.recordSubmission(submission(created, run, phaseRun), env)
    // Re-open the phase at a gate: the accepted submission moves to gate, then
    // parks at a decision so a patch can return it to running and re-submit.
    await provider.startGate(stored.submissionId, mutation({ expectedRevision: 3 }))
    await provider.markPhaseAwaitingDecision(phaseRun.phaseRunId, mutation({ expectedRevision: 4 }))
    const patched = await provider.requestPatch(created.taskId, phaseRun.phaseRunId, '补正交付物字段', mutation({ expectedRevision: 5 }))
    expect(patched.submissionId).not.toBe(stored.submissionId)
    expect(patched.supersedesSubmissionId).toBe(stored.submissionId)
    expect(patched.attempt).toBe(2)
    expect(patched.unresolvedIssues).toContain('补正交付物字段')
    const phase = await provider.getPhaseRun(phaseRun.phaseRunId)
    expect(phase?.activeSubmissionId).toBe(patched.submissionId)
  })

  it('rejects a patch with no active submission or a blank note', async () => {
    const provider = await harness()
    const created = await provider.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'actor', 'create-k')
    await expect(provider.requestPatch(created.taskId, 'ghost-run', 'x', mutation())).rejects.toMatchObject({ code: 'not-found' })
    await provider.startTask(created.taskId, mutation({ expectedRevision: 1 }))
    const run = await provider.createTaskRun(created.taskId, mutation({ expectedRevision: 2 }))
    const phaseRun = await provider.createPhaseRun(run.runId, 'main', mutation())
    await provider.startPhaseRun(phaseRun.phaseRunId, mutation())
    await provider.recordSubmission(submission(created, run, phaseRun), { submittedBy: 'driver', sourceSeqPersisted: true, inputsCurrent: true, outputsValid: true })
    await expect(provider.requestPatch(created.taskId, phaseRun.phaseRunId, '   ', mutation())).rejects.toMatchObject({ code: 'submission-rejected' })
  })
})

describe('task queries', () => {
  it('lists tasks and reads projections', async () => {
    const provider = await harness()
    const created = await provider.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'actor', 'create-k')
    expect(await provider.listTasks()).toHaveLength(1)
    expect(await provider.getTask(created.taskId)).toEqual(created)
    expect(await provider.getTask(TaskId('ghost'))).toBeUndefined()
  })
})
