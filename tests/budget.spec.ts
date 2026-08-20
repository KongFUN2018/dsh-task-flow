/** Unit suite: provisioning, threshold evaluation, and the decision landing ladder. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import RecipeRegistry, { EMPTY_TEMPLATE_RECIPE_ID } from '../src/recipe/index.ts'
import WorkbenchJournalService from '../src/workbench/journal/index.ts'
import DeliverableService from '../src/deliverable/index.ts'
import SessionStore from '@deepseek-ai/dsh-session'
import LocalTaskService from '../src/task-local/index.ts'
import AttentionService, { AttentionItemId } from '../src/attention/index.ts'
import '../src/task/index.ts'
import BudgetService from '../src/budget/index.ts'
import {
  MemoryStorageBackend,
} from './fixtures/memory-backend.ts'

/** Boot the full budget dependency stack over one memory medium. */
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
  await ctx.plugin(BudgetService).await()
  const created = await ctx.tasks.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'unit', 'create-k')
  await ctx.tasks.startTask(created.taskId, { actor: 'unit', reason: 'spec', expectedRevision: 1, idempotencyKey: 'start-k' })
  return { ctx, budget: ctx.budget, attention: ctx.attention, tasks: ctx.tasks, task: created }
}

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})


describe('budget provisioning', () => {
  it('provisions explicit limits and rejects re-provisioning and empty limits', async () => {
    const h = await harness()
    current = h.ctx
    const record = await h.budget.provisionBudget(h.task.taskId, { maxTokens: 100 }, 'unit', 'p-1')
    expect(record.spent).toEqual({ tokens: 0, durationMs: 0, reruns: 0 })
    expect(record.revision).toBe(1)
    await expect(h.budget.provisionBudget(h.task.taskId, { maxTokens: 1 }, 'unit', 'p-2'))
      .rejects.toMatchObject({ code: 'already-provisioned' })
    await expect(h.budget.provisionBudget('t-other', {}, 'unit', 'p-3'))
      .rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(h.budget.provisionBudget(h.task.taskId, { maxTokens: 0 }, 'unit', 'p-4'))
      .rejects.toMatchObject({ code: 'invalid-argument' })
    expect(h.budget.getBudget(h.task.taskId)?.revision).toBe(1)
    expect(h.budget.getBudget('t-none')).toBeUndefined()
    await expect(h.budget.recordUsage('t-none', { tokens: 1 }, 'unit', 'u-x'))
      .rejects.toMatchObject({ code: 'not-found' })
  })

  it('rejects malformed usage and limits loudly', async () => {
    const h = await harness()
    current = h.ctx
    await h.budget.provisionBudget(h.task.taskId, { maxTokens: 100 }, 'unit', 'p-1')
    await expect(h.budget.recordUsage(h.task.taskId, { tokens: -1 }, 'unit', 'u-1'))
      .rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(h.budget.recordUsage(h.task.taskId, null as never, 'unit', 'u-2'))
      .rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(h.budget.provisionBudget(h.task.taskId, null as never, 'unit', 'p-5'))
      .rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(h.budget.appendBudget(h.task.taskId, { maxTokens: 1 }, 0, 'unit', 'a-0'))
      .rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(h.budget.recordUsage(h.task.taskId, { tokens: 1 }, '', 'u-3'))
      .rejects.toMatchObject({ code: 'invalid-argument' })
  })
})

describe('budget thresholds', () => {
  it('warns once at 80% per dimension and latches until an append', async () => {
    const h = await harness()
    current = h.ctx
    await h.budget.provisionBudget(h.task.taskId, { maxTokens: 100, maxReruns: 2 }, 'unit', 'p-1')
    await h.budget.recordUsage(h.task.taskId, { tokens: 79 }, 'unit', 'u-1')
    expect(h.attention.listOpen()).toHaveLength(0)
    await h.budget.recordUsage(h.task.taskId, { tokens: 1 }, 'unit', 'u-2')
    expect(h.attention.listOpen().map(item => String(item.itemId)))
      .toEqual([`budget-warning:${String(h.task.taskId)}:tokens:1`])
    await h.budget.recordUsage(h.task.taskId, { tokens: 1 }, 'unit', 'u-3')
    expect(h.attention.listOpen()).toHaveLength(1)
    const appended = await h.budget.appendBudget(h.task.taskId, { maxTokens: 100 }, 1, 'unit', 'a-1')
    expect(appended.limits.maxTokens).toBe(200)
    expect(appended.warned).toEqual([])
    await expect(h.budget.appendBudget(h.task.taskId, { maxTokens: 1 }, 1, 'unit', 'a-2'))
      .rejects.toMatchObject({ code: 'stale-revision' })
  })

  it('parks the task and opens a blocking item when spend crosses the limit', async () => {
    const h = await harness()
    current = h.ctx
    await h.budget.provisionBudget(h.task.taskId, { maxReruns: 1 }, 'unit', 'p-1')
    const record = await h.budget.recordUsage(h.task.taskId, { reruns: 2 }, 'unit', 'u-1')
    expect(record.spent.reruns).toBe(2)
    const task = await h.tasks.getTask(String(h.task.taskId))
    expect(task?.state).toBe('awaiting-decision')
    const open = h.attention.listOpen()
    expect(open.map(item => String(item.itemId)))
      .toEqual([`budget-exceeded:${String(h.task.taskId)}:reruns:1`])
    expect(open[0]?.options).toEqual(['append-budget', 'pause', 'cancel'])
  })

  it('keeps recording past the limit without re-parking a non-running task', async () => {
    const h = await harness()
    current = h.ctx
    await h.budget.provisionBudget(h.task.taskId, { maxTokens: 10 }, 'unit', 'p-1')
    await h.budget.recordUsage(h.task.taskId, { tokens: 11 }, 'unit', 'u-1')
    await h.budget.recordUsage(h.task.taskId, { tokens: 5 }, 'unit', 'u-2')
    expect(h.budget.getBudget(h.task.taskId)?.spent.tokens).toBe(16)
    expect(h.attention.listOpen().filter(item => item.decisionKind === 'budget-exceeded')).toHaveLength(1)
  })

  it('warns on the duration dimension independently', async () => {
    const h = await harness()
    current = h.ctx
    await h.budget.provisionBudget(h.task.taskId, { maxDurationMs: 1000 }, 'unit', 'p-1')
    await h.budget.recordUsage(h.task.taskId, { durationMs: 800 }, 'unit', 'u-1')
    expect(h.attention.listOpen().map(item => item.decisionKind)).toEqual(['budget-warning'])
  })
})

describe('budget decision landing', () => {
  it('lands append-budget by growing the ledger and resuming the task', async () => {
    const h = await harness()
    current = h.ctx
    await h.budget.provisionBudget(h.task.taskId, { maxTokens: 10 }, 'unit', 'p-1')
    await h.budget.recordUsage(h.task.taskId, { tokens: 11 }, 'unit', 'u-1')
    const item = h.attention.listOpen()[0]!
    await h.attention.resolveDecision(String(item.itemId), 1, 'append-budget', 'user', 'r-1')
    const parked = await h.tasks.getTask(String(h.task.taskId))
    await h.budget.applyBudgetDecision(String(item.itemId), { maxTokens: 100 }, parked!.revision, 'user', 'd-1')
    const task = await h.tasks.getTask(String(h.task.taskId))
    expect(task?.state).toBe('running')
    expect(h.budget.getBudget(h.task.taskId)?.limits.maxTokens).toBe(110)
  })

  it('lands pause and cancel outcomes on the task commands', async () => {
    const h = await harness()
    current = h.ctx
    await h.budget.provisionBudget(h.task.taskId, { maxTokens: 10 }, 'unit', 'p-1')
    await h.budget.recordUsage(h.task.taskId, { tokens: 11 }, 'unit', 'u-1')
    const item = h.attention.listOpen()[0]!
    await h.attention.resolveDecision(String(item.itemId), 1, 'pause', 'user', 'r-1')
    const parked = await h.tasks.getTask(String(h.task.taskId))
    await h.budget.applyBudgetDecision(String(item.itemId), {}, parked!.revision, 'user', 'd-1')
    expect((await h.tasks.getTask(String(h.task.taskId)))?.state).toBe('pausing')

    const h2 = await harness()
    current = h2.ctx
    await h2.budget.provisionBudget(h2.task.taskId, { maxTokens: 10 }, 'unit', 'p-1')
    await h2.budget.recordUsage(h2.task.taskId, { tokens: 11 }, 'unit', 'u-1')
    const item2 = h2.attention.listOpen()[0]!
    await h2.attention.resolveDecision(String(item2.itemId), 1, 'cancel', 'user', 'r-1')
    const parked2 = await h2.tasks.getTask(String(h2.task.taskId))
    await h2.budget.applyBudgetDecision(String(item2.itemId), {}, parked2!.revision, 'user', 'd-1')
    expect((await h2.tasks.getTask(String(h2.task.taskId)))?.state).toBe('cancelling')
  })

  it('rejects landing an unresolved decision or a foreign item loudly', async () => {
    const h = await harness()
    current = h.ctx
    await h.budget.provisionBudget(h.task.taskId, { maxTokens: 10 }, 'unit', 'p-1')
    await h.budget.recordUsage(h.task.taskId, { tokens: 11 }, 'unit', 'u-1')
    const item = h.attention.listOpen()[0]!
    await expect(h.budget.applyBudgetDecision(String(item.itemId), {}, 1, 'user', 'd-0'))
      .rejects.toMatchObject({ code: 'not-resolved' })
    const foreign = await h.attention.createItem({
      itemId: AttentionItemId('foreign:1'),
      taskId: h.task.taskId,
      kind: 'c-decision',
      decisionKind: 'other',
      options: ['x'],
    }, 'unit', 'f-1')
    await expect(h.budget.applyBudgetDecision(String(foreign.itemId), {}, 1, 'user', 'd-x'))
      .rejects.toMatchObject({ code: 'invalid-option' })
    await expect(h.budget.applyBudgetDecision('missing', {}, 1, 'user', 'd-y'))
      .rejects.toMatchObject({ code: 'not-found' })
  })

  it('rejects an unknown outcome option and an unknown task loudly', async () => {
    const h = await harness()
    current = h.ctx
    const foreign = await h.attention.createItem({
      itemId: AttentionItemId('foreign:2'),
      taskId: h.task.taskId,
      kind: 'c-decision',
      decisionKind: 'budget-exceeded',
      options: ['append-budget'],
    }, 'unit', 'f-2')
    await h.attention.resolveDecision(String(foreign.itemId), 1, 'append-budget', 'user', 'r-2')
    await expect(h.budget.applyBudgetDecision(String(foreign.itemId), { maxTokens: 5 }, 1, 'user', 'd-3'))
      .rejects.toMatchObject({ code: 'not-found' })
    await expect(h.budget.applyBudgetDecision('', {}, 1, 'user', 'd-4'))
      .rejects.toMatchObject({ code: 'invalid-argument' })
  })
})
