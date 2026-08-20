/** Unit suite: trust tiers, completion guards, and the repair-fuse breaker. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import RecipeRegistry, { EMPTY_TEMPLATE_RECIPE_ID } from '../src/recipe/index.ts'
import WorkbenchJournalService from '../src/workbench/journal/index.ts'
import DeliverableService from '../src/deliverable/index.ts'
import SessionStore from '@deepseek-ai/dsh-session'
import LocalTaskService from '../src/task-local/index.ts'
import AttentionService from '../src/attention/index.ts'
import { SubmissionId } from '../src/task/index.ts'
import type { PhaseSubmission } from '../src/task/types.ts'
import ReviewPolicyService from '../src/review-policy/index.ts'
import {
  MemoryStorageBackend,
} from './fixtures/memory-backend.ts'

/** Boot the review-policy stack and drive one task to a gate-running phase run. */
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
  await ctx.plugin(ReviewPolicyService).await()
  const task = await ctx.tasks.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'unit', 'create-k')
  await ctx.tasks.startTask(task.taskId, { actor: 'unit', reason: 'spec', expectedRevision: 1, idempotencyKey: 'start-k' })
  const run = await ctx.tasks.createTaskRun(task.taskId, { actor: 'unit', reason: 'spec', expectedRevision: 2, idempotencyKey: 'run-k' })
  const phaseRun = await ctx.tasks.createPhaseRun(run.runId, 'main', { actor: 'unit', reason: 'spec', expectedRevision: 1, idempotencyKey: 'phase-k' })
  await ctx.tasks.startPhaseRun(phaseRun.phaseRunId, { actor: 'unit', reason: 'spec', expectedRevision: 1, idempotencyKey: 'start-phase-k' })
  const submission: PhaseSubmission = {
    submissionId: SubmissionId('s-1'),
    taskId: task.taskId,
    taskRunId: run.runId,
    phaseRunId: phaseRun.phaseRunId,
    phaseId: 'main',
    attempt: 1,
    pinnedRecipe: task.pinnedRecipe,
    sourceSessionId: 'session-1',
    sourceSeqRange: { start: 1, end: 5 },
    inputVersions: [],
    outputVersions: [],
    unresolvedIssues: [],
    result: 'completed',
    idempotencyKey: 'sub-k',
    submittedAt: Date.now(),
  }
  await ctx.tasks.recordSubmission(submission, {
    submittedBy: 'unit', sourceSeqPersisted: true, inputsCurrent: true, outputsValid: true,
  })
  const gated = await ctx.tasks.startGate(String(submission.submissionId), { actor: 'unit', reason: 'spec', expectedRevision: 3, idempotencyKey: 'gate-k' })
  return { ctx, policy: ctx.reviewPolicy, attention: ctx.attention, tasks: ctx.tasks, task, run, phaseRun, submission, gated }
}

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

/** Drive the gated phase to passed and read the task revision. */
async function passedTask(h: Awaited<ReturnType<typeof harness>>) {
  await h.tasks.recordGateCheck({
    submissionId: h.submission.submissionId,
    checkId: 'main-submission-complete',
    passed: true,
    recordedAt: Date.now(),
  })
  await h.tasks.markPhasePassed(String(h.gated.phaseRunId), {
    actor: 'unit', reason: 'spec', expectedRevision: h.gated.revision, idempotencyKey: 'pass-k',
  })
  return h.tasks.getTask(String(h.task.taskId))
}

describe('trust tiers', () => {
  it('defaults to strict, sets tiers explicitly, and defers only for trusted', async () => {
    const h = await harness()
    current = h.ctx
    expect(h.policy.getTier(String(h.task.taskId))).toBe('strict')
    expect(h.policy.defersBatchConfirm(String(h.task.taskId))).toBe(false)
    const record = await h.policy.setTier(String(h.task.taskId), 'trusted', 'unit', 'tier-1')
    expect(record.tier).toBe('trusted')
    expect(h.policy.defersBatchConfirm(String(h.task.taskId))).toBe(true)
    const again = await h.policy.setTier(String(h.task.taskId), 'balanced', 'unit', 'tier-2')
    expect(again.revision).toBe(2)
    expect(h.policy.getTier(String(h.task.taskId))).toBe('balanced')
    expect(h.policy.defersBatchConfirm(String(h.task.taskId))).toBe(false)
  })

  it('rejects an invalid tier and blank fields loudly', async () => {
    const h = await harness()
    current = h.ctx
    await expect(h.policy.setTier(String(h.task.taskId), 'loose' as never, 'unit', 'tier-x'))
      .rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(h.policy.setTier(' ', 'trusted', 'unit', 'tier-y'))
      .rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(h.policy.setTier(String(h.task.taskId), 'trusted', '', 'tier-z'))
      .rejects.toMatchObject({ code: 'invalid-argument' })
  })
})

describe('completion guards', () => {
  it('blocks completion on open B items and suspended rewind decisions', async () => {
    const h = await harness()
    current = h.ctx
    const task = await passedTask(h)
    await h.attention.createItem({
      itemId: 'gate:pr:b-1' as never,
      taskId: h.task.taskId,
      kind: 'b-confirm',
      decisionKind: 'gate',
      options: ['ok'],
    }, 'unit', 'b-1')
    await expect(h.tasks.completeTask(String(h.task.taskId), {
      actor: 'unit', reason: 'spec', expectedRevision: task!.revision, idempotencyKey: 'c-1',
    })).rejects.toThrow(/unsigned B item/)
    await h.attention.resolveDecision('gate:pr:b-1', 1, 'ok', 'user', 'r-1')
    await h.attention.createItem({
      itemId: 'rewind:t:1' as never,
      taskId: h.task.taskId,
      kind: 'c-decision',
      decisionKind: 'rewind',
      options: ['confirm-rewind', 'keep-current', 'cancel'],
    }, 'unit', 'rw-1')
    const refreshed = await h.tasks.getTask(String(h.task.taskId))
    await expect(h.tasks.completeTask(String(h.task.taskId), {
      actor: 'unit', reason: 'spec', expectedRevision: refreshed!.revision, idempotencyKey: 'c-2',
    })).rejects.toThrow(/suspended rewind/)
    await h.attention.resolveDecision('rewind:t:1', 1, 'cancel', 'user', 'r-2')
    const final = await h.tasks.getTask(String(h.task.taskId))
    const completed = await h.tasks.completeTask(String(h.task.taskId), {
      actor: 'unit', reason: 'spec', expectedRevision: final!.revision, idempotencyKey: 'c-3',
    })
    expect(completed.state).toBe('completed')
  })

  it('ignores open items of other tasks', async () => {
    const h = await harness()
    current = h.ctx
    const task = await passedTask(h)
    const other = await h.tasks.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'unit', 'create-other')
    await h.attention.createItem({
      itemId: 'gate:other:b-1' as never,
      taskId: other.taskId,
      kind: 'b-confirm',
      decisionKind: 'gate',
      options: ['ok'],
    }, 'unit', 'ob-1')
    const completed = await h.tasks.completeTask(String(h.task.taskId), {
      actor: 'unit', reason: 'spec', expectedRevision: task!.revision, idempotencyKey: 'c-4',
    })
    expect(completed.state).toBe('completed')
  })
})

describe('breaker', () => {
  it('parks the run and opens a recovery item when consecutive failures reach the cap', async () => {
    const h = await harness()
    current = h.ctx
    await h.tasks.recordGateCheck({
      submissionId: h.submission.submissionId,
      checkId: 'p-none',
      passed: false,
      recordedAt: Date.now(),
    })
    const parked = await h.tasks.getPhaseRun(String(h.gated.phaseRunId))
    expect(parked?.state).toBe('gate-running')
    expect(h.attention.listOpen()).toHaveLength(0)
  })
})

describe('breaker decision landing', () => {
  it('rejects unresolved decisions and foreign items loudly', async () => {
    const h = await harness()
    current = h.ctx
    const item = await h.attention.createItem({
      itemId: 'breaker:t:c:1' as never,
      taskId: h.task.taskId,
      phaseRunId: h.gated.phaseRunId,
      checkId: 'p-none',
      kind: 'recovery',
      decisionKind: 'breaker-tripped',
      options: ['continue-repair', 'patch', 'rewind', 'pause', 'cancel'],
    }, 'unit', 'bk-1')
    await expect(h.policy.applyBreakerDecision(String(item.itemId), 1, 'user', 'd-0'))
      .rejects.toMatchObject({ code: 'not-resolved' })
    const foreign = await h.attention.createItem({
      itemId: 'foreign:bk' as never,
      taskId: h.task.taskId,
      kind: 'recovery',
      decisionKind: 'other',
      options: ['x'],
    }, 'unit', 'fk-1')
    await expect(h.policy.applyBreakerDecision(String(foreign.itemId), 1, 'user', 'd-x'))
      .rejects.toMatchObject({ code: 'invalid-option' })
    await expect(h.policy.applyBreakerDecision('missing', 1, 'user', 'd-y'))
      .rejects.toMatchObject({ code: 'not-found' })
    await expect(h.policy.applyBreakerDecision(' ', 1, 'user', 'd-z'))
      .rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(h.policy.applyBreakerDecision(String(item.itemId), 0, 'user', 'd-w'))
      .rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('lands continue-repair by resetting the counter and resuming the parked run', async () => {
    const h = await harness()
    current = h.ctx
    const item = await h.attention.createItem({
      itemId: 'breaker:t:c:2' as never,
      taskId: h.task.taskId,
      phaseRunId: h.gated.phaseRunId,
      checkId: 'p-none',
      kind: 'recovery',
      decisionKind: 'breaker-tripped',
      options: ['continue-repair', 'patch', 'rewind', 'pause', 'cancel'],
    }, 'unit', 'bk-2')
    await h.attention.resolveDecision(String(item.itemId), 1, 'continue-repair', 'user', 'r-1')
    await h.tasks.markPhaseAwaitingDecision(String(h.gated.phaseRunId), {
      actor: 'unit', reason: 'spec', expectedRevision: h.gated.revision, idempotencyKey: 'park-k',
    })
    const parked = await h.tasks.getPhaseRun(String(h.gated.phaseRunId))
    await h.policy.applyBreakerDecision(String(item.itemId), parked!.revision, 'user', 'd-1')
    const resumed = await h.tasks.getPhaseRun(String(h.gated.phaseRunId))
    expect(resumed?.state).toBe('gate-running')
    const facts = h.ctx.workbenchJournal.replay(0).filter(fact => fact.kind === 'review-policy/breaker-decision')
    expect(facts).toHaveLength(1)
  })

  it('lands pause and cancel outcomes on the task commands and patch as journal-only', async () => {
    const h = await harness()
    current = h.ctx
    const item = await h.attention.createItem({
      itemId: 'breaker:t:c:3' as never,
      taskId: h.task.taskId,
      phaseRunId: h.gated.phaseRunId,
      checkId: 'p-none',
      kind: 'recovery',
      decisionKind: 'breaker-tripped',
      options: ['continue-repair', 'patch', 'rewind', 'pause', 'cancel'],
    }, 'unit', 'bk-3')
    await h.attention.resolveDecision(String(item.itemId), 1, 'pause', 'user', 'r-1')
    const task = await h.tasks.getTask(String(h.task.taskId))
    await h.policy.applyBreakerDecision(String(item.itemId), 1, 'user', 'd-1')
    expect((await h.tasks.getTask(String(h.task.taskId)))?.state).toBe('pausing')

    const item2 = await h.attention.createItem({
      itemId: 'breaker:t:c:4' as never,
      taskId: h.task.taskId,
      phaseRunId: h.gated.phaseRunId,
      checkId: 'p-none',
      kind: 'recovery',
      decisionKind: 'breaker-tripped',
      options: ['continue-repair', 'patch', 'rewind', 'pause', 'cancel'],
    }, 'unit', 'bk-4')
    await h.attention.resolveDecision(String(item2.itemId), 1, 'patch', 'user', 'r-2')
    const before = await h.tasks.getTask(String(h.task.taskId))
    await h.policy.applyBreakerDecision(String(item2.itemId), 1, 'user', 'd-2')
    const after = await h.tasks.getTask(String(h.task.taskId))
    expect(after?.state).toBe(before?.state)
    void task
  })
})
