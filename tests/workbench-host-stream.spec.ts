/** Unit suite: the attention incremental stream projects journal facts into a cursor-ordered change feed. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import RecipeRegistry from '../src/recipe/index.ts'
import DeliverableService from '../src/deliverable/index.ts'
import WorkbenchJournalService from '../src/workbench/journal/index.ts'
import SessionStore from '@deepseek-ai/dsh-session'
import LocalTaskService from '../src/task-local/index.ts'
import AttentionService, { AttentionItemId } from '../src/attention/index.ts'
import { TaskId } from '../src/task/index.ts'
import WorkbenchHostStreamService from '../src/workbench/host-stream/index.ts'
import { MemoryStorageBackend } from './fixtures/memory-backend.ts'

/** Boot the journal, attention, and stream services over one memory medium. */
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
  await ctx.plugin(AttentionService).await()
  await ctx.plugin(WorkbenchHostStreamService).await()
  return { ctx, attention: ctx.attention, stream: ctx.workbenchHostStream, journal: ctx.workbenchJournal }
}

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

const ITEM = {
  itemId: AttentionItemId('gate:pr-1:c-1'),
  taskId: TaskId('t-1'),
  kind: 'c-decision' as const,
  decisionKind: 'gate',
  options: ['yes', 'no'],
}

describe('attention incremental stream', () => {
  it('returns an empty page with cursor 0 over an empty journal', async () => {
    const h = await harness()
    current = h.ctx
    const page = h.stream.listIncremental()
    expect(page.cursor).toBe(0)
    expect(page.events).toEqual([])
    expect(page.streamId).toBeTruthy()
  })

  it('projects item creation as a created event', async () => {
    const h = await harness()
    current = h.ctx
    await h.attention.createItem(ITEM, 'unit', 'create-k')
    const page = h.stream.listIncremental(0)
    expect(page.events).toHaveLength(1)
    expect(page.events[0]).toMatchObject({
      cursor: 1,
      previousCursor: 0,
      entityKind: 'attention',
      entityId: 'gate:pr-1:c-1',
      entityRevision: 1,
      operation: 'created',
    })
    expect(page.events[0]?.eventId).toBeTruthy()
    expect(page.cursor).toBe(1)
  })

  it('advances by cursor and skips already-read events', async () => {
    const h = await harness()
    current = h.ctx
    await h.attention.createItem(ITEM, 'unit', 'create-k')
    const first = h.stream.listIncremental(0)
    expect(first.cursor).toBe(1)
    await h.attention.resolveDecision(ITEM.itemId, 1, 'yes', 'unit', 'resolve-k')
    const second = h.stream.listIncremental(first.cursor)
    expect(second.events).toHaveLength(1)
    expect(second.events[0]).toMatchObject({
      operation: 'resolved',
      entityRevision: 2,
    })
    expect(second.cursor).toBe(2)
  })

  it('maps invalidation to an invalidated event', async () => {
    const h = await harness()
    current = h.ctx
    await h.attention.createItem(ITEM, 'unit', 'create-k')
    await h.attention.invalidateItem(ITEM.itemId, 1, 'superseded', 'unit', 'invalidate-k')
    const page = h.stream.listIncremental(0)
    expect(page.events.map(event => event.operation)).toEqual(['created', 'invalidated'])
    expect(page.events[1]).toMatchObject({ entityRevision: 2 })
  })

  it('ignores non-attention journal facts', async () => {
    const h = await harness()
    current = h.ctx
    await h.attention.createItem(ITEM, 'unit', 'create-k')
    const page = h.stream.listIncremental(0)
    expect(page.events).toHaveLength(1)
    expect(page.events.every(event => event.entityKind === 'attention')).toBe(true)
  })

  it('keeps a stable stream id across reads', async () => {
    const h = await harness()
    current = h.ctx
    await h.attention.createItem(ITEM, 'unit', 'create-k')
    const first = h.stream.listIncremental(0)
    const second = h.stream.listIncremental(first.cursor)
    expect(second.streamId).toBe(first.streamId)
  })

  it('replays the whole stream for a non-positive cursor', async () => {
    const h = await harness()
    current = h.ctx
    await h.attention.createItem(ITEM, 'unit', 'create-k')
    await h.attention.resolveDecision(ITEM.itemId, 1, 'yes', 'unit', 'resolve-k')
    const page = h.stream.listIncremental(-1)
    expect(page.events).toHaveLength(2)
  })

  it('falls back to updated and an empty id for unknown kinds and malformed payloads', async () => {
    const h = await harness()
    current = h.ctx
    await h.journal.append({ taskId: TaskId('t-1'), kind: 'attention/item-stale', actor: 'unit', idempotencyKey: 'stale-1', entityRevision: 1, payload: { itemId: 42 } })
    await h.journal.append({ taskId: TaskId('t-1'), kind: 'attention/item-stale', actor: 'unit', idempotencyKey: 'stale-2', entityRevision: 1, payload: 'not-object' })
    const page = h.stream.listIncremental(0)
    expect(page.events).toHaveLength(2)
    expect(page.events[0]).toMatchObject({ operation: 'updated', entityId: '' })
    expect(page.events[1]).toMatchObject({ operation: 'updated', entityId: '' })
  })
})
