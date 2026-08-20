/** Unit suite: preview-through-decision branch replacement. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import RecipeRegistry, { EMPTY_TEMPLATE_RECIPE_ID } from '../src/recipe/index.ts'
import WorkbenchJournalService from '../src/workbench/journal/index.ts'
import DeliverableService, { DeliverableId } from '../src/deliverable/index.ts'
import SessionStore from '@deepseek-ai/dsh-session'
import LocalTaskService from '../src/task-local/index.ts'
import AttentionService from '../src/attention/index.ts'
import RewindService from '../src/rewind/index.ts'
import {
  MemoryStorageBackend,
} from './fixtures/memory-backend.ts'

const D1 = DeliverableId('d-1')

/** Boot the rewind dependency stack, create a started task, and save one root version. */
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
  await ctx.plugin(RewindService).await()
  const task = await ctx.tasks.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'unit', 'create-k')
  await ctx.tasks.startTask(task.taskId, { actor: 'unit', reason: 'spec', expectedRevision: 1, idempotencyKey: 'start-k' })
  const run = await ctx.tasks.createTaskRun(task.taskId, { actor: 'unit', reason: 'spec', expectedRevision: 2, idempotencyKey: 'run-k' })
  const phaseRun = await ctx.tasks.createPhaseRun(run.runId, 'main', { actor: 'unit', reason: 'spec', expectedRevision: 1, idempotencyKey: 'phase-k' })
  await ctx.tasks.startPhaseRun(phaseRun.phaseRunId, { actor: 'unit', reason: 'spec', expectedRevision: 1, idempotencyKey: 'start-phase-k' })
  const version = await ctx.deliverables.saveVersion(D1, null, null)
  return { ctx, rewind: ctx.rewind, attention: ctx.attention, tasks: ctx.tasks, task, run, phaseRun, version }
}

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

describe('rewind preview', () => {
  it('computes the closure, persists the preview on the item, and journals the request', async () => {
    const h = await harness()
    current = h.ctx
    const preview = await h.rewind.requestRewind(String(h.task.taskId), [h.version.versionId], 'unit', 'rq-1')
    expect(preview.costHint).toBe('uncalibrated')
    expect(preview.reusableClarificationIds).toEqual([])
    const item = h.attention.getItem(preview.itemId)
    expect(item?.kind).toBe('c-decision')
    expect(item?.decisionKind).toBe('rewind')
    expect(item?.options).toEqual(['confirm-rewind', 'keep-current', 'cancel'])
    expect(JSON.parse(item?.impactSnapshot ?? '')).toMatchObject({ snapshotId: preview.snapshotId })
    const facts = h.ctx.workbenchJournal.replay(0).filter(fact => fact.kind === 'rewind/preview-requested')
    expect(facts).toHaveLength(1)
  })

  it('rejects empty roots, blank fields, and unknown tasks loudly', async () => {
    const h = await harness()
    current = h.ctx
    await expect(h.rewind.requestRewind(String(h.task.taskId), [], 'unit', 'rq-1'))
      .rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(h.rewind.requestRewind(String(h.task.taskId), [' '], 'unit', 'rq-2'))
      .rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(h.rewind.requestRewind('t-none', [h.version.versionId], 'unit', 'rq-3'))
      .rejects.toMatchObject({ code: 'not-found' })
    await expect(h.rewind.requestRewind(String(h.task.taskId), [h.version.versionId], '', 'rq-4'))
      .rejects.toMatchObject({ code: 'invalid-argument' })
  })
})

describe('rewind apply', () => {
  it('creates the successor run, supersedes the retired branch, and journals the branch fact', async () => {
    const h = await harness()
    current = h.ctx
    const preview = await h.rewind.requestRewind(String(h.task.taskId), [h.version.versionId], 'unit', 'rq-1')
    await h.attention.resolveDecision(preview.itemId, 1, 'confirm-rewind', 'user', 'r-1')
    const task = await h.tasks.getTask(String(h.task.taskId))
    const applied = await h.rewind.applyRewind(preview.itemId, task!.revision, 'unit', 'ap-1')
    expect(String(applied.run.parentRunId)).toBe(String(h.run.runId))
    const retired = await h.tasks.getPhaseRun(String(h.phaseRun.phaseRunId))
    expect(retired?.state).toBe('superseded')
    expect(applied.supersededPhaseRunIds).toEqual([String(h.phaseRun.phaseRunId)])
    const facts = h.ctx.workbenchJournal.replay(0).filter(fact => fact.kind === 'rewind/applied')
    expect(facts).toHaveLength(1)
    const after = await h.tasks.getTask(String(h.task.taskId))
    expect(String(after?.currentRunId)).toBe(String(applied.run.runId))
  })

  it('rejects an unresolved decision and a foreign item loudly', async () => {
    const h = await harness()
    current = h.ctx
    const preview = await h.rewind.requestRewind(String(h.task.taskId), [h.version.versionId], 'unit', 'rq-1')
    await expect(h.rewind.applyRewind(preview.itemId, 1, 'unit', 'ap-0'))
      .rejects.toMatchObject({ code: 'not-resolved' })
    const foreign = await h.attention.createItem({
      itemId: 'foreign:1' as never,
      taskId: h.task.taskId,
      kind: 'c-decision',
      decisionKind: 'other',
      options: ['x'],
    }, 'unit', 'f-1')
    await expect(h.rewind.applyRewind(String(foreign.itemId), 1, 'unit', 'ap-x'))
      .rejects.toMatchObject({ code: 'invalid-option' })
    await expect(h.rewind.applyRewind('missing', 1, 'unit', 'ap-y'))
      .rejects.toMatchObject({ code: 'not-found' })
    await expect(h.rewind.applyRewind(' ', 1, 'unit', 'ap-z'))
      .rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(h.rewind.applyRewind(preview.itemId, 0, 'unit', 'ap-w'))
      .rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('journals a declined outcome and refuses to apply it', async () => {
    const h = await harness()
    current = h.ctx
    const preview = await h.rewind.requestRewind(String(h.task.taskId), [h.version.versionId], 'unit', 'rq-1')
    await h.attention.resolveDecision(preview.itemId, 1, 'keep-current', 'user', 'r-1')
    const task = await h.tasks.getTask(String(h.task.taskId))
    await expect(h.rewind.applyRewind(preview.itemId, task!.revision, 'unit', 'ap-1'))
      .rejects.toMatchObject({ code: 'invalid-option' })
    const facts = h.ctx.workbenchJournal.replay(0).filter(fact => fact.kind === 'rewind/declined')
    expect(facts).toHaveLength(1)
    const phaseRun = await h.tasks.getPhaseRun(String(h.phaseRun.phaseRunId))
    expect(phaseRun?.state).toBe('running')
  })
})
