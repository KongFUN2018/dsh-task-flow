/** Unit suite: B/C checks park the phase run in awaiting-decision; A-only runs pass through. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import RecipeRegistry from '../src/recipe/index.ts'
import DeliverableService from '../src/deliverable/index.ts'
import WorkbenchJournalService from '../src/workbench/journal/index.ts'
import SessionStore from '@deepseek-ai/dsh-session'
import LocalTaskService from '../src/task-local/index.ts'
import AttentionService from '../src/attention/index.ts'
import { PhaseRunId, SubmissionId, TaskId, TaskRunId } from '../src/task/index.ts'
import type { PhaseSubmission, TaskMutationContext } from '../src/task/types.ts'
import type { RecipePayload } from '../src/recipe/types.ts'
import GateService from '../src/gate/index.ts'
import { MemoryStorageBackend } from './fixtures/memory-backend.ts'

/** Boot the task stack plus the gate service over a memory backend. */
async function harness() {
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
  await ctx.plugin(AttentionService)
  await ctx.plugin(GateService).await()
  return { ctx, gate: ctx.gate, tasks: ctx.tasks, recipes: ctx.recipes, attention: ctx.attention }
}

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

const mutation = (expectedRevision: number, over: Partial<TaskMutationContext> = {}): TaskMutationContext => ({
  actor: 'unit',
  reason: 'gate spec',
  expectedRevision,
  idempotencyKey: 'mut-k',
  ...over,
})

function recipePayload(checks: { checkId: string; kind: 'A' | 'B' | 'C'; humanAction?: string[] }[]): RecipePayload {
  return {
    phases: [{
      phaseId: 'main',
      kind: 'build',
      goal: 'Build the output.',
      inputs: [],
      outputs: [],
      submissionCriteria: ['one explicit submission'],
    }],
    gateChecks: checks.map(check => ({
      checkId: check.checkId,
      phaseId: 'main',
      kind: check.kind,
      machineScope: ['the accepted submission lists every declared phase output'],
      humanAction: check.humanAction ?? [],
    })),
    defaults: { batchConfirm: 'per-phase-single', clarify: { maxRounds: 2, splitMustDefault: true }, draftPolicy: 'block-finalize-not-draft' },
    p4Mode: { mode: 'auto' },
  }
}

/** Drive one task to a gate-running phase run over the given recipe. */
async function gateRunning(h: Awaited<ReturnType<typeof harness>>, recipeId: string) {
  const created = await h.tasks.createTask(recipeId, 'w-1', 'unit', 'create-k')
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
  await h.tasks.startGate('s-1', mutation(3))
  return phaseRun.phaseRunId
}

async function pollState(h: Awaited<ReturnType<typeof harness>>, phaseRunId: string): Promise<string> {
  const start = Date.now()
  for (;;) {
    const run = await h.tasks.getPhaseRun(phaseRunId)
    if (run?.state === 'awaiting-decision') return run.state
    if (Date.now() - start > 2000) return run?.state ?? 'missing'
    await new Promise(resolve => setTimeout(resolve, 5))
  }
}

describe('complex gate', () => {
  it('parks a run with a B check in awaiting-decision and creates its decision item', async () => {
    const h = await harness()
    current = h.ctx
    h.recipes.register('bc-recipe', 1, recipePayload([
      { checkId: 'outputs-complete', kind: 'A' },
      { checkId: 'human-review', kind: 'B', humanAction: ['approve', 'reject'] },
    ]))
    const phaseRunId = await gateRunning(h, 'bc-recipe')
    expect(await pollState(h, phaseRunId)).toBe('awaiting-decision')
    const items = h.attention.listOpen()
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      itemId: `gate:${phaseRunId}:human-review`,
      kind: 'b-confirm',
      decisionKind: 'gate',
      checkId: 'human-review',
      options: ['approve', 'reject'],
    })
  })

  it('parks a run with a C check in awaiting-decision and creates its decision item', async () => {
    const h = await harness()
    current = h.ctx
    h.recipes.register('c-recipe', 1, recipePayload([{ checkId: 'single-decision', kind: 'C', humanAction: ['alpha', 'beta'] }]))
    const phaseRunId = await gateRunning(h, 'c-recipe')
    expect(await pollState(h, phaseRunId)).toBe('awaiting-decision')
    const items = h.attention.listOpen()
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      itemId: `gate:${phaseRunId}:single-decision`,
      kind: 'c-decision',
      options: ['alpha', 'beta'],
    })
  })

  it('leaves an A-only run in gate-running for the engine', async () => {
    const h = await harness()
    current = h.ctx
    h.recipes.register('a-recipe', 1, recipePayload([{ checkId: 'outputs-complete', kind: 'A' }]))
    const phaseRunId = await gateRunning(h, 'a-recipe')
    const run = await h.tasks.getPhaseRun(phaseRunId)
    expect(run?.state).toBe('gate-running')
  })

  it('ignores a gate-running event whose task is missing', async () => {
    const h = await harness()
    current = h.ctx
    h.ctx.emit('phase-run/updated', {
      phaseRunId: PhaseRunId('ghost-run'),
      runId: TaskRunId('ghost-taskrun'),
      taskId: TaskId('ghost-task'),
      phaseId: 'main',
      state: 'gate-running',
      revision: 1,
    })
    await new Promise(resolve => setTimeout(resolve, 20))
    const runs = await h.tasks.listPhaseRuns('ghost-taskrun')
    expect(runs).toEqual([])
  })

  it('creates a decision item without a submission id when the run reports none', async () => {
    const h = await harness()
    current = h.ctx
    h.recipes.register('b-recipe', 1, recipePayload([{ checkId: 'human-review', kind: 'B', humanAction: ['approve', 'reject'] }]))
    const created = await h.tasks.createTask('b-recipe', 'w-1', 'unit', 'create-k')
    h.ctx.emit('phase-run/updated', {
      phaseRunId: PhaseRunId('ghost-pr'),
      runId: TaskRunId('ghost-tr'),
      taskId: created.taskId,
      phaseId: 'main',
      state: 'gate-running',
      revision: 1,
    })
    await new Promise(resolve => setTimeout(resolve, 20))
    const items = h.attention.listOpen()
    expect(items).toHaveLength(1)
    expect(items[0]?.submissionId).toBeUndefined()
  })
})
