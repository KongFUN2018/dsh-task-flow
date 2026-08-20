/** Unit suite: item creation, optimistic decision/batch-confirm, invalidation, and settled-run resume. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import RecipeRegistry, { EMPTY_TEMPLATE_RECIPE_ID } from '../src/recipe/index.ts'
import DeliverableService from '../src/deliverable/index.ts'
import WorkbenchJournalService from '../src/workbench/journal/index.ts'
import SessionStore from '@deepseek-ai/dsh-session'
import LocalTaskService from '../src/task-local/index.ts'
import { SubmissionId, TaskId, TaskRunId } from '../src/task/index.ts'
import type { PhaseRunId, PhaseSubmission, TaskMutationContext } from '../src/task/types.ts'
import AttentionService from '../src/attention/index.ts'
import { AttentionItemId } from '../src/attention/runtime.ts'
import type { ConfirmTarget } from '../src/attention/types.ts'
import {
  MemoryMediaPool,
  MemoryStorageBackend,
} from './fixtures/memory-backend.ts'

/** Boot task, journal, and attention services over one memory medium. */
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
  await ctx.plugin(AttentionService).await()
  return { ctx, attention: ctx.attention, tasks: ctx.tasks, journal: ctx.workbenchJournal }
}

/** Boot the service's dependencies without initializing the attention service itself. */
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
  const service = new AttentionService(ctx)
  return { ctx, service }
}



let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

const mutation = (expectedRevision: number, over: Partial<TaskMutationContext> = {}): TaskMutationContext => ({
  actor: 'unit',
  reason: 'attention spec',
  expectedRevision,
  idempotencyKey: 'mut-k',
  ...over,
})

const ITEM = {
  itemId: AttentionItemId('gate:pr-1:c-1'),
  taskId: TaskId('t-1'),
  kind: 'c-decision' as const,
  decisionKind: 'gate',
  options: ['yes', 'no'],
}

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
  await h.tasks.startGate('s-1', mutation(3))
  const gated = await h.tasks.getPhaseRun(phaseRun.phaseRunId)
  if (gated === undefined) throw new Error('phase run missing after startGate')
  return { phaseRunId: gated.phaseRunId, taskId: created.taskId, revision: gated.revision }
}

/** Drive one task to an awaiting-decision phase run for resume tests. */
async function awaitingDecision(h: Awaited<ReturnType<typeof harness>>) {
  const gated = await gateRunning(h)
  const awaiting = await h.tasks.markPhaseAwaitingDecision(gated.phaseRunId, mutation(gated.revision))
  return { phaseRunId: awaiting.phaseRunId, taskId: gated.taskId }
}




describe('createItem', () => {
  it('stores one open item and replays idempotently', async () => {
    const h = await harness()
    current = h.ctx
    const item = await h.attention.createItem(ITEM, 'pm', 'c-k')
    expect(item.state).toBe('open')
    expect(item.entityRevision).toBe(1)
    const replayed = await h.attention.createItem(ITEM, 'pm', 'c-k')
    expect(replayed.itemId).toBe(item.itemId)
    const open = h.attention.listOpen()
    expect(open.map(entry => String(entry.itemId))).toEqual(['gate:pr-1:c-1'])
  })

  it('rejects a reused idempotency key with a different itemId', async () => {
    const h = await harness()
    current = h.ctx
    await h.attention.createItem(ITEM, 'pm', 'c-k')
    await expect(h.attention.createItem({ ...ITEM, itemId: AttentionItemId('gate:other') }, 'pm', 'c-k'))
      .rejects.toMatchObject({ code: 'conflict' })
  })

  it('rejects an empty options list or a blank field', async () => {
    const h = await harness()
    current = h.ctx
    expect(() => h.attention.createItem({ ...ITEM, options: [] }, 'pm', 'k'))
      .toThrow(expect.objectContaining({ code: 'invalid-argument' }))
    expect(() => h.attention.createItem({ ...ITEM, decisionKind: ' ' }, 'pm', 'k'))
      .toThrow(expect.objectContaining({ code: 'invalid-argument' }))
  })
})

describe('resolveDecision', () => {
  it('resolves one item and replays idempotently without silent re-confirm', async () => {
    const h = await harness()
    current = h.ctx
    await h.attention.createItem(ITEM, 'pm', 'c-k')
    const resolved = await h.attention.resolveDecision('gate:pr-1:c-1', 1, 'yes', 'pm', 'r-k')
    expect(resolved).toEqual({ outcome: 'resolved', currentRevision: 2 })
    const replayed = await h.attention.resolveDecision('gate:pr-1:c-1', 2, 'yes', 'pm', 'r-k2')
    expect(replayed).toEqual({ outcome: 'resolved', currentRevision: 2 })
    const different = await h.attention.resolveDecision('gate:pr-1:c-1', 2, 'no', 'pm', 'r-k3')
    expect(different).toEqual({ outcome: 'already-resolved', currentRevision: 2 })
    expect(h.attention.getItem('gate:pr-1:c-1')?.state).toBe('resolved')
  })

  it('reports conflict, withdrawn, and stale instead of resolving silently', async () => {
    const h = await harness()
    current = h.ctx
    await h.attention.createItem(ITEM, 'pm', 'c-k')
    await expect(h.attention.resolveDecision('gate:pr-1:c-1', 5, 'yes', 'pm', 'r-k'))
      .resolves.toEqual({ outcome: 'conflict', currentRevision: 1 })
    await expect(h.attention.resolveDecision('ghost', 1, 'yes', 'pm', 'r-k'))
      .resolves.toEqual({ outcome: 'withdrawn' })
    await h.attention.invalidateItem('gate:pr-1:c-1', 1, 'upstream changed', 'pm', 'i-k')
    await expect(h.attention.resolveDecision('gate:pr-1:c-1', 2, 'yes', 'pm', 'r-k2'))
      .resolves.toEqual({ outcome: 'stale', currentRevision: 2 })
  })

  it('rejects an option outside the item options and an invalid revision', async () => {
    const h = await harness()
    current = h.ctx
    await h.attention.createItem(ITEM, 'pm', 'c-k')
    await expect(h.attention.resolveDecision('gate:pr-1:c-1', 1, 'maybe', 'pm', 'r-k'))
      .rejects.toMatchObject({ code: 'invalid-argument' })
    expect(() => h.attention.resolveDecision('gate:pr-1:c-1', 0, 'yes', 'pm', 'r-k'))
      .toThrow(expect.objectContaining({ code: 'invalid-argument' }))
  })
})
describe('confirmBatch', () => {
  it('resolves every still-open matching item and reports per-item outcomes', async () => {
    const h = await harness()
    current = h.ctx
    await h.attention.createItem({ ...ITEM, itemId: AttentionItemId('gate:pr-1:b-1'), kind: 'b-confirm' }, 'pm', 'b-1-k')
    await h.attention.createItem({ ...ITEM, itemId: AttentionItemId('gate:pr-1:b-2'), kind: 'b-confirm' }, 'pm', 'b-2-k')
    await h.attention.createItem({ ...ITEM, itemId: AttentionItemId('gate:pr-1:b-3'), kind: 'b-confirm' }, 'pm', 'b-3-k')
    const results = await h.attention.confirmBatch([
      { itemId: AttentionItemId('gate:pr-1:b-1'), expectedEntityRevision: 1 },
      { itemId: AttentionItemId('gate:pr-1:b-2'), expectedEntityRevision: 1 },
      { itemId: AttentionItemId('gate:pr-1:ghost'), expectedEntityRevision: 1 },
    ], 'pm', 'batch-k')
    expect(results.map(entry => entry.outcome)).toEqual(['resolved', 'resolved', 'withdrawn'])
    expect(h.attention.getItem('gate:pr-1:b-3')?.state).toBe('open')
  })

  it('reports conflict for a target whose revision already advanced', async () => {
    const h = await harness()
    current = h.ctx
    await h.attention.createItem({ ...ITEM, itemId: AttentionItemId('gate:pr-1:b-1'), kind: 'b-confirm' }, 'pm', 'b-1-k')
    await h.attention.resolveDecision('gate:pr-1:b-1', 1, 'yes', 'pm', 'r-k')
    const results = await h.attention.confirmBatch([
      { itemId: AttentionItemId('gate:pr-1:b-1'), expectedEntityRevision: 1 },
    ], 'pm', 'batch-k')
    expect(results[0]?.outcome).toBe('already-resolved')
  })
})

describe('invalidateItem', () => {
  it('invalidates an open item and makes later decisions stale', async () => {
    const h = await harness()
    current = h.ctx
    await h.attention.createItem(ITEM, 'pm', 'c-k')
    const invalidated = await h.attention.invalidateItem('gate:pr-1:c-1', 1, 'upstream changed', 'pm', 'i-k')
    expect(invalidated).toEqual({ outcome: 'invalidated', currentRevision: 2 })
    expect(h.attention.getItem('gate:pr-1:c-1')?.state).toBe('invalidated')
    await expect(h.attention.invalidateItem('gate:pr-1:c-1', 2, 'again', 'pm', 'i-k2'))
      .resolves.toEqual({ outcome: 'stale', currentRevision: 2 })
  })

  it('reports already-resolved for a settled item and conflict for a wrong revision', async () => {
    const h = await harness()
    current = h.ctx
    await h.attention.createItem(ITEM, 'pm', 'c-k')
    await h.attention.resolveDecision('gate:pr-1:c-1', 1, 'yes', 'pm', 'r-k')
    await expect(h.attention.invalidateItem('gate:pr-1:c-1', 2, 'late', 'pm', 'i-k'))
      .resolves.toEqual({ outcome: 'already-resolved', currentRevision: 2 })
    await h.attention.createItem({ ...ITEM, itemId: AttentionItemId('gate:pr-1:c-2') }, 'pm', 'c-2-k')
    await expect(h.attention.invalidateItem('gate:pr-1:c-2', 9, 'early', 'pm', 'i-k2'))
      .resolves.toEqual({ outcome: 'conflict', currentRevision: 1 })
  })
})
describe('settled-run resume', () => {
  it('resumes an awaiting-decision phase run once every item settled', async () => {
    const h = await harness()
    current = h.ctx
    const { phaseRunId, taskId } = await awaitingDecision(h)
    await h.attention.createItem({ itemId: AttentionItemId('gate:pr-1:c-1'), taskId, phaseRunId, kind: 'c-decision', decisionKind: 'gate', options: ['yes', 'no'] }, 'pm', 'c-k')
    const before = await h.tasks.getPhaseRun(phaseRunId)
    expect(before?.state).toBe('awaiting-decision')
    await h.attention.resolveDecision('gate:pr-1:c-1', 1, 'yes', 'pm', 'r-k')
    const after = await h.tasks.getPhaseRun(phaseRunId)
    expect(after?.state).toBe('gate-running')
    const facts = h.journal.replay(0).filter(fact => fact.kind === 'attention/item-resolved')
    expect(facts).toHaveLength(1)
  })

  it('stays parked while any item of the run is still open', async () => {
    const h = await harness()
    current = h.ctx
    const { phaseRunId, taskId } = await awaitingDecision(h)
    await h.attention.createItem({ itemId: AttentionItemId('gate:pr-1:c-1'), taskId, phaseRunId, kind: 'c-decision', decisionKind: 'gate', options: ['yes', 'no'] }, 'pm', 'c-1-k')
    await h.attention.createItem({ itemId: AttentionItemId('gate:pr-1:c-2'), taskId, phaseRunId, kind: 'c-decision', decisionKind: 'gate', options: ['yes', 'no'] }, 'pm', 'c-2-k')
    await h.attention.resolveDecision('gate:pr-1:c-1', 1, 'yes', 'pm', 'r-k')
    const after = await h.tasks.getPhaseRun(phaseRunId)
    expect(after?.state).toBe('awaiting-decision')
  })
})

describe('listOpen ordering', () => {
  it('lists only open items in open order, skipping settled ones', async () => {
    const h = await harness()
    current = h.ctx
    await h.attention.createItem({ ...ITEM, itemId: AttentionItemId('gate:a') }, 'pm', 'a-k')
    await h.attention.createItem({ ...ITEM, itemId: AttentionItemId('gate:b') }, 'pm', 'b-k')
    await h.attention.createItem({ ...ITEM, itemId: AttentionItemId('gate:c') }, 'pm', 'c-k')
    await h.attention.resolveDecision('gate:a', 1, 'yes', 'pm', 'r-k')
    const open = h.attention.listOpen()
    expect(open.map(entry => String(entry.itemId))).toEqual(['gate:b', 'gate:c'])
  })
})

describe('createItem optional fields and recovery', () => {
  it('persists run, submission, and check linkage when supplied', async () => {
    const h = await harness()
    current = h.ctx
    await h.attention.createItem({ ...ITEM, runId: TaskRunId('run-1'), submissionId: SubmissionId('sub-1'), checkId: 'check-1' }, 'pm', 'c-k')
    const stored = h.attention.getItem('gate:pr-1:c-1')
    expect(String(stored?.runId ?? '')).toBe('run-1')
    expect(String(stored?.submissionId ?? '')).toBe('sub-1')
    expect(stored?.checkId).toBe('check-1')
  })

  it('rejects a reused key whose stored item is missing', async () => {
    const h = await harness()
    current = h.ctx
    const domain = h.ctx.storage.form('domain').get('attention')
    if (domain === undefined) throw new Error('attention domain is not open')
    await domain.table('item_keys').put('c-k', { itemId: 'ghost' })
    await expect(h.attention.createItem(ITEM, 'pm', 'c-k'))
      .rejects.toMatchObject({ code: 'not-found' })
  })
})

describe('confirmBatch ladder', () => {
  it('reports stale for an invalidated target and conflict for a wrong revision', async () => {
    const h = await harness()
    current = h.ctx
    await h.attention.createItem({ ...ITEM, itemId: AttentionItemId('gate:pr-1:b-1'), kind: 'b-confirm' }, 'pm', 'b-1-k')
    await h.attention.createItem({ ...ITEM, itemId: AttentionItemId('gate:pr-1:b-2'), kind: 'b-confirm' }, 'pm', 'b-2-k')
    await h.attention.invalidateItem('gate:pr-1:b-1', 1, 'upstream', 'pm', 'i-k')
    const results = await h.attention.confirmBatch([
      { itemId: AttentionItemId('gate:pr-1:b-1'), expectedEntityRevision: 2 },
      { itemId: AttentionItemId('gate:pr-1:b-2'), expectedEntityRevision: 9 },
    ], 'pm', 'batch-k')
    expect(results.map(entry => entry.outcome)).toEqual(['stale', 'conflict'])
  })

  it('resumes an awaiting-decision run when a batch settles every item', async () => {
    const h = await harness()
    current = h.ctx
    const { phaseRunId, taskId } = await awaitingDecision(h)
    await h.attention.createItem({ itemId: AttentionItemId('gate:pr-1:b-1'), taskId, phaseRunId, kind: 'b-confirm', decisionKind: 'gate', options: ['yes', 'no'] }, 'pm', 'b-1-k')
    await h.attention.createItem({ itemId: AttentionItemId('gate:pr-1:b-2'), taskId, phaseRunId, kind: 'b-confirm', decisionKind: 'gate', options: ['yes', 'no'] }, 'pm', 'b-2-k')
    const results = await h.attention.confirmBatch([
      { itemId: AttentionItemId('gate:pr-1:b-1'), expectedEntityRevision: 1 },
      { itemId: AttentionItemId('gate:pr-1:b-2'), expectedEntityRevision: 1 },
    ], 'pm', 'batch-k')
    expect(results.map(entry => entry.outcome)).toEqual(['resolved', 'resolved'])
    const after = await h.tasks.getPhaseRun(phaseRunId)
    expect(after?.state).toBe('gate-running')
  })
})

describe('wire validation', () => {
  it('rejects blank command fields synchronously', async () => {
    const h = await harness()
    current = h.ctx
    expect(() => h.attention.getItem(' ')).toThrow(expect.objectContaining({ code: 'invalid-argument' }))
    expect(() => h.attention.createItem(ITEM, ' ', 'k')).toThrow(expect.objectContaining({ code: 'invalid-argument' }))
    expect(() => h.attention.resolveDecision('x', 1, ' ', 'pm', 'k')).toThrow(expect.objectContaining({ code: 'invalid-argument' }))
    expect(() => h.attention.confirmBatch([], ' ', 'k')).toThrow(expect.objectContaining({ code: 'invalid-argument' }))
    expect(() => h.attention.confirmBatch('nope' as unknown as ConfirmTarget[], 'pm', 'k')).toThrow(expect.objectContaining({ code: 'invalid-argument' }))
    expect(() => h.attention.invalidateItem('x', 1, ' ', 'pm', 'k')).toThrow(expect.objectContaining({ code: 'invalid-argument' }))
  })
})
describe('resume no-op paths', () => {
  it('reports withdrawn for an unknown invalidation target', async () => {
    const h = await harness()
    current = h.ctx
    await expect(h.attention.invalidateItem('ghost', 1, 'reason', 'pm', 'i-k'))
      .resolves.toEqual({ outcome: 'withdrawn' })
  })

  it('does not resume a run whose phase run is unknown', async () => {
    const h = await harness()
    current = h.ctx
    await h.attention.createItem({ ...ITEM, phaseRunId: 'ghost-phase' as PhaseRunId }, 'pm', 'c-k')
    const decided = await h.attention.resolveDecision('gate:pr-1:c-1', 1, 'yes', 'pm', 'r-k')
    expect(decided.outcome).toBe('resolved')
  })

  it('does not resume a run that is still gate-running', async () => {
    const h = await harness()
    current = h.ctx
    const { phaseRunId, taskId } = await gateRunning(h)
    await h.attention.createItem({ itemId: AttentionItemId('gate:pr-1:c-1'), taskId, phaseRunId, kind: 'c-decision', decisionKind: 'gate', options: ['yes', 'no'] }, 'pm', 'c-k')
    await h.attention.resolveDecision('gate:pr-1:c-1', 1, 'yes', 'pm', 'r-k')
    const after = await h.tasks.getPhaseRun(phaseRunId)
    expect(after?.state).toBe('gate-running')
  })
})

describe('uninitialized service', () => {
  it('rejects reads and writes before the domain opens', async () => {
    const { ctx, service } = await rawHarness()
    current = ctx
    expect(() => service.getItem('x')).toThrow(expect.objectContaining({ code: 'not-found' }))
    expect(() => service.listOpen()).toThrow(expect.objectContaining({ code: 'not-found' }))
    await expect(service.createItem(ITEM, 'pm', 'k')).rejects.toMatchObject({ code: 'not-found' })
    await expect(service.resolveDecision('x', 1, 'yes', 'pm', 'k')).rejects.toMatchObject({ code: 'not-found' })
  })
})

describe('journal conflict recovery', () => {
  it('surfaces a batch-confirm journal conflict and leaves the item open', async () => {
    const h = await harness()
    current = h.ctx
    await h.attention.createItem({ ...ITEM, itemId: AttentionItemId('gate:pr-1:b-1'), kind: 'b-confirm' }, 'pm', 'b-1-k')
    await h.journal.append({
      taskId: TaskId('t-1'),
      kind: 'attention/item-resolved',
      actor: 'intruder',
      idempotencyKey: 'attention/item-resolved:batch-k:gate:pr-1:b-1',
      entityRevision: 77,
      payload: { itemId: 'gate:pr-1:b-1' },
    })
    await expect(h.attention.confirmBatch([
      { itemId: AttentionItemId('gate:pr-1:b-1'), expectedEntityRevision: 1 },
    ], 'pm', 'batch-k')).rejects.toMatchObject({ code: 'idempotency-conflict' })
    expect(h.attention.getItem('gate:pr-1:b-1')?.state).toBe('open')
  })

  it('surfaces an invalidation journal conflict', async () => {
    const h = await harness()
    current = h.ctx
    await h.attention.createItem(ITEM, 'pm', 'c-k')
    await h.journal.append({
      taskId: TaskId('t-1'),
      kind: 'attention/item-invalidated',
      actor: 'intruder',
      idempotencyKey: 'attention/item-invalidated:i-k',
      entityRevision: 77,
      payload: { itemId: 'gate:pr-1:c-1' },
    })
    await expect(h.attention.invalidateItem('gate:pr-1:c-1', 1, 'reason', 'pm', 'i-k'))
      .rejects.toMatchObject({ code: 'idempotency-conflict' })
  })
})
