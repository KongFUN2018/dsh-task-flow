/** Unit suite: the M4 projection delegates to the persistent attention service and never silently confirms. */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import RecipeRegistry from '../src/recipe/index.ts'
import DeliverableService from '../src/deliverable/index.ts'
import WorkbenchJournalService from '../src/workbench/journal/index.ts'
import SessionStore from '@deepseek-ai/dsh-session'
import LocalTaskService from '../src/task-local/index.ts'
import { TaskId } from '../src/task/index.ts'
import AttentionService, { AttentionItemId } from '../src/attention/index.ts'
import type { AttentionItemKind } from '../src/attention/index.ts'
import WorkbenchHostService, { WorkbenchItemId } from '../src/workbench/host/index.ts'
import type { WorkbenchAttentionUpdate } from '../src/workbench/host/types.ts'
import {
  MemoryStorageBackend,
} from './fixtures/memory-backend.ts'

/** Boot task, journal, attention, and workbench-host services over one memory medium. */
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
  await ctx.plugin(WorkbenchHostService)
  return { ctx, workbenchHost: ctx.workbenchHost, attention: ctx.attention }
}

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

/** Create one open attention item through the persistent service. */
async function seedOpen(
  h: Awaited<ReturnType<typeof harness>>,
  kind: AttentionItemKind,
  itemId: string,
  checkId: string | undefined,
  options: string[],
) {
  await h.attention.createItem({
    itemId: AttentionItemId(itemId),
    taskId: TaskId('t-1'),
    kind,
    decisionKind: 'gate',
    ...(checkId === undefined ? {} : { checkId }),
    options,
  }, 'pm', `seed-${itemId}`)
}

describe('workbench host projection', () => {
  it('projects open items into views with a journal-derived snapshot version', async () => {
    const h = await harness()
    current = h.ctx
    await seedOpen(h, 'b-confirm', 'b-1', 'confirm-scope', ['yes'])
    await seedOpen(h, 'c-decision', 'c-1', 'pick-convention', ['alpha', 'beta'])
    const snapshot = h.workbenchHost.listSnapshot()
    expect(snapshot.items.map(item => item.itemId)).toEqual(['b-1', 'c-1'])
    expect(snapshot.items.map(item => item.title)).toEqual(['confirm-scope', 'pick-convention'])
    expect(snapshot.items.every(item => item.status === 'open')).toBe(true)
    expect(snapshot.snapshotVersion).toBeGreaterThan(0)
  })

  it('reports an empty inbox at the current journal position', async () => {
    const h = await harness()
    current = h.ctx
    const snapshot = h.workbenchHost.listSnapshot()
    expect(snapshot.items).toEqual([])
  })

  it('delegates batch confirm and reports per-item outcomes without silent confirmation', async () => {
    const h = await harness()
    current = h.ctx
    await seedOpen(h, 'b-confirm', 'b-1', 'confirm-scope', ['yes'])
    await seedOpen(h, 'b-confirm', 'b-2', 'confirm-coverage', ['yes'])
    const response = await h.workbenchHost.confirmBatch({
      actor: 'user',
      items: [
        { itemId: WorkbenchItemId('b-1'), expectedEntityRevision: 1 },
        { itemId: WorkbenchItemId('b-2'), expectedEntityRevision: 1 },
        { itemId: WorkbenchItemId('gone'), expectedEntityRevision: 1 },
      ],
    })
    expect(response.results.map(row => [row.itemId, row.outcome])).toEqual([
      ['b-1', 'resolved'],
      ['b-2', 'resolved'],
      ['gone', 'withdrawn'],
    ])
    expect(response.results[0]?.currentRevision).toBe(2)
  })

  it('maps the decision text to optionId and records the resolved outcome', async () => {
    const h = await harness()
    current = h.ctx
    await seedOpen(h, 'c-decision', 'c-1', 'pick-convention', ['alpha', 'beta'])
    const response = await h.workbenchHost.resolveDecision({
      itemId: WorkbenchItemId('c-1'),
      expectedEntityRevision: 1,
      decision: 'alpha',
      actor: 'user',
    })
    expect(response.outcome).toBe('resolved')
    expect(response.currentRevision).toBe(2)
    const item = h.attention.getItem(AttentionItemId('c-1'))
    expect(item?.outcome).toBe('alpha')
  })

  it('delegates upstream invalidation', async () => {
    const h = await harness()
    current = h.ctx
    await seedOpen(h, 'b-confirm', 'b-1', 'confirm-scope', ['yes'])
    const response = await h.workbenchHost.invalidateItem({
      itemId: WorkbenchItemId('b-1'),
      expectedEntityRevision: 1,
      reason: 'upstream change',
      actor: 'engine',
    })
    expect(response.outcome).toBe('invalidated')
  })

  it('reports conflict, already-resolved, and stale ladders from the persistent service', async () => {
    const h = await harness()
    current = h.ctx
    await seedOpen(h, 'b-confirm', 'b-1', 'confirm-scope', ['yes'])
    await seedOpen(h, 'b-confirm', 'b-2', 'confirm-coverage', ['yes'])
    await h.workbenchHost.confirmBatch({ actor: 'user', items: [{ itemId: WorkbenchItemId('b-1'), expectedEntityRevision: 1 }] })
    await h.workbenchHost.invalidateItem({ itemId: WorkbenchItemId('b-2'), expectedEntityRevision: 1, reason: 'stale', actor: 'engine' })
    const response = await h.workbenchHost.confirmBatch({
      actor: 'user',
      items: [
        { itemId: WorkbenchItemId('b-1'), expectedEntityRevision: 1 },
        { itemId: WorkbenchItemId('b-2'), expectedEntityRevision: 1 },
        { itemId: WorkbenchItemId('b-3'), expectedEntityRevision: 9 },
      ],
    })
    expect(response.results.map(row => row.outcome)).toEqual(['already-resolved', 'stale', 'withdrawn'])
  })
  it('broadcasts workbench/attention-updated only for committed changes', async () => {
    const h = await harness()
    current = h.ctx
    await seedOpen(h, 'b-confirm', 'b-1', 'confirm-scope', ['yes'])
    const updates: WorkbenchAttentionUpdate[] = []
    h.ctx.on('workbench/attention-updated', (update: WorkbenchAttentionUpdate) => updates.push(update))
    await h.workbenchHost.confirmBatch({ actor: 'user', items: [{ itemId: WorkbenchItemId('b-1'), expectedEntityRevision: 1 }] })
    expect(updates).toHaveLength(1)
    expect(updates[0]).toMatchObject({ changed: [{ itemId: 'b-1', status: 'resolved', entityRevision: 2 }] })
    expect(updates[0]?.snapshotVersion).toBeGreaterThan(0)
  })

  it('rejects blank actor, decision, and reason at the wire boundary', async () => {
    const h = await harness()
    current = h.ctx
    await seedOpen(h, 'b-confirm', 'b-1', 'confirm-scope', ['yes'])
    await expect(h.workbenchHost.confirmBatch({ actor: ' ', items: [{ itemId: WorkbenchItemId('b-1'), expectedEntityRevision: 1 }] })).rejects.toThrow(/actor/)
    await expect(h.workbenchHost.resolveDecision({ itemId: WorkbenchItemId('b-1'), expectedEntityRevision: 1, decision: '', actor: 'user' })).rejects.toThrow(/decision/)
    await expect(h.workbenchHost.invalidateItem({ itemId: WorkbenchItemId('b-1'), expectedEntityRevision: 1, reason: ' ', actor: 'engine' })).rejects.toThrow(/reason/)
  })

  it('rejects a non-positive compare-and-set revision', async () => {
    const h = await harness()
    current = h.ctx
    await seedOpen(h, 'b-confirm', 'b-1', 'confirm-scope', ['yes'])
    await expect(h.workbenchHost.confirmBatch({ actor: 'user', items: [{ itemId: WorkbenchItemId('b-1'), expectedEntityRevision: 0 }] })).rejects.toThrow(/expectedEntityRevision/)
  })

  it('derives the title from decisionKind when no checkId is present', async () => {
    const h = await harness()
    current = h.ctx
    await h.attention.createItem({
      itemId: AttentionItemId('clarify:q-1'),
      taskId: TaskId('t-1'),
      kind: 'clarification',
      decisionKind: 'clarification',
      options: ['yes'],
    }, 'pm', 'seed-clarify-q-1')
    const snapshot = h.workbenchHost.listSnapshot()
    expect(snapshot.items[0]?.title).toBe('clarification')
  })

  it('reports withdrawn for a missing decision target without a retry revision', async () => {
    const h = await harness()
    current = h.ctx
    const response = await h.workbenchHost.resolveDecision({
      itemId: WorkbenchItemId('gone'),
      expectedEntityRevision: 1,
      decision: 'yes',
      actor: 'user',
    })
    expect(response.outcome).toBe('withdrawn')
    expect(response.currentRevision).toBeUndefined()
  })

  it('reports withdrawn for a missing invalidation target without a retry revision', async () => {
    const h = await harness()
    current = h.ctx
    const response = await h.workbenchHost.invalidateItem({
      itemId: WorkbenchItemId('gone'),
      expectedEntityRevision: 1,
      reason: 'upstream',
      actor: 'engine',
    })
    expect(response.outcome).toBe('withdrawn')
    expect(response.currentRevision).toBeUndefined()
  })

  it('contains a throwing attention-updated listener and keeps the commit', async () => {
    const h = await harness()
    current = h.ctx
    await seedOpen(h, 'b-confirm', 'b-1', 'confirm-scope', ['yes'])
    const warn = vi.spyOn(h.ctx.logger, 'warn').mockImplementation(() => {})
    h.ctx.on('workbench/attention-updated', () => { throw new Error('listener boom') })
    const response = await h.workbenchHost.confirmBatch({ actor: 'user', items: [{ itemId: WorkbenchItemId('b-1'), expectedEntityRevision: 1 }] })
    expect(response.results[0]?.outcome).toBe('resolved')
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })

})
