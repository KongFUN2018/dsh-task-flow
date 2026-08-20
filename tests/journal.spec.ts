/** Unit suite: append idempotency, gapless monotonic sequence, replay, restart recovery, and append-only defense. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import type { TaskId } from '../src/task/types.ts'
import WorkbenchJournal, { type JournalFactInput } from '../src/workbench/journal/index.ts'
import { MemoryMediaPool, MemoryStorageBackend } from './fixtures/memory-backend.ts'

/** Boot the journal service over a memory backend; a shared pool simulates restarts. */
async function harness(pool?: MemoryMediaPool) {
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('memory', new MemoryStorageBackend(pool))
  const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
  ctx.storage.mount('domain', facility)
  ctx.provide('storageDomain', facility)
  await ctx.plugin(WorkbenchJournal).await()
  return { ctx, journal: ctx.workbenchJournal }
}

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

/** One valid fact input for one task. */
function fact(overrides: Partial<JournalFactInput> = {}): JournalFactInput {
  return {
    taskId: 'task-1' as TaskId,
    kind: 'task.created',
    actor: 'provider',
    idempotencyKey: `key-${Math.random().toString(36).slice(2)}`,
    entityRevision: 1,
    payload: { taskId: 'task-1' },
    ...overrides,
  }
}

describe('append', () => {
  it('assigns a gapless monotonic sequence and journal-assigned envelope fields', async () => {
    const h = await harness()
    current = h.ctx
    const first = await h.journal.append(fact())
    const second = await h.journal.append(fact())
    expect(first.journalSeq).toBe(1)
    expect(second.journalSeq).toBe(2)
    expect(first.eventId).not.toBe(second.eventId)
    expect(first.schemaVersion).toBe(1)
    expect(first.occurredAt).toBeGreaterThan(0)
  })

  it('returns the stored fact on idempotent replay of the same caller fields', async () => {
    const h = await harness()
    current = h.ctx
    const input = fact({ idempotencyKey: 'stable-key', payload: { nested: { list: [1, 'a', null] } } })
    const first = await h.journal.append(input)
    const replayed = await h.journal.append(input)
    expect(replayed).toEqual(first)
  })

  it('fails loud when an idempotency key returns with different caller fields', async () => {
    const h = await harness()
    current = h.ctx
    await h.journal.append(fact({ idempotencyKey: 'stable-key', kind: 'task.created' }))
    await expect(h.journal.append(fact({ idempotencyKey: 'stable-key', kind: 'task.started' })))
      .rejects.toMatchObject({ name: 'JournalError', code: 'idempotency-conflict' })
  })

  it('rejects invalid caller fields with field-naming failures', async () => {
    const h = await harness()
    current = h.ctx
    await expect(h.journal.append(fact({ taskId: '' as TaskId }))).rejects.toMatchObject({ code: 'invalid-fact' })
    await expect(h.journal.append(fact({ kind: ' ' }))).rejects.toMatchObject({ code: 'invalid-fact' })
    await expect(h.journal.append(fact({ entityRevision: 0 }))).rejects.toMatchObject({ code: 'invalid-fact' })
    await expect(h.journal.append(fact({ entityRevision: 1.5 }))).rejects.toMatchObject({ code: 'invalid-fact' })
  })

  it('keeps the sequence gapless when a durable write fails', async () => {
    const pool = new MemoryMediaPool()
    const h = await harness(pool)
    current = h.ctx
    await h.journal.append(fact())
    pool.failNextWrites = 1
    await expect(h.journal.append(fact())).rejects.toThrow(/injected write failure/)
    const recovered = await h.journal.append(fact())
    expect(recovered.journalSeq).toBe(2)
    expect((h.journal.replay(0)).length).toBe(2)
  })

  it('serializes concurrent appends into journal order', async () => {
    const h = await harness()
    current = h.ctx
    const appended = await Promise.all([
      h.journal.append(fact({ idempotencyKey: 'a' })),
      h.journal.append(fact({ idempotencyKey: 'b' })),
      h.journal.append(fact({ idempotencyKey: 'c' })),
    ])
    const seqs = appended.map(f => f.journalSeq).sort((x, y) => x - y)
    expect(seqs).toEqual([1, 2, 3])
  })
})

describe('checkpoint and replay', () => {
  it('reports zero on an empty journal and grows with each append', async () => {
    const h = await harness()
    current = h.ctx
    expect(h.journal.checkpoint()).toEqual({ journalSeq: 0 })
    await h.journal.append(fact())
    expect(h.journal.checkpoint()).toEqual({ journalSeq: 1 })
  })

  it('replays the whole journal from 0 and only the delta after a checkpoint', async () => {
    const h = await harness()
    current = h.ctx
    await h.journal.append(fact({ kind: 'one', idempotencyKey: 'k1' }))
    await h.journal.append(fact({ kind: 'two', idempotencyKey: 'k2' }))
    await h.journal.append(fact({ kind: 'three', idempotencyKey: 'k3' }))
    const whole = h.journal.replay(0)
    expect(whole.map(f => f.kind)).toEqual(['one', 'two', 'three'])
    const delta = h.journal.replay(1)
    expect(delta.map(f => f.kind)).toEqual(['two', 'three'])
    expect(h.journal.replay(3)).toEqual([])
  })

  it('rejects a non-safe-integer or negative position', async () => {
    const h = await harness()
    current = h.ctx
    expect(() => h.journal.replay(-1)).toThrow(expect.objectContaining({ code: 'invalid-argument' }))
    expect(() => h.journal.replay(1.5)).toThrow(expect.objectContaining({ code: 'invalid-argument' }))
    expect(() => h.journal.replay(Number.NaN)).toThrow(expect.objectContaining({ code: 'invalid-argument' }))
  })

  it('recovers head and facts across a restart on the same medium', async () => {
    const pool = new MemoryMediaPool()
    const first = await harness(pool)
    await first.journal.append(fact({ idempotencyKey: 'k1' }))
    await first.journal.append(fact({ idempotencyKey: 'k2' }))
    await first.ctx.fiber.dispose()
    const second = await harness(pool)
    current = second.ctx
    expect(second.journal.checkpoint()).toEqual({ journalSeq: 2 })
    expect((second.journal.replay(0)).map(f => f.idempotencyKey)).toEqual(['k1', 'k2'])
    const continued = await second.journal.append(fact({ idempotencyKey: 'k3' }))
    expect(continued.journalSeq).toBe(3)
    // Idempotency survives the restart: the stored fact answers the replay.
    const replayed = await second.journal.append(fact({ idempotencyKey: 'k1' }))
    expect(replayed.journalSeq).toBe(1)
  })
})
