/** Invariant companion suite: the append-only check fires on a foreign mutation and stays quiet on normal appends. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import InvariantRegistry, { InvariantError } from '@deepseek-ai/dsh-invariants'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import type { TaskId } from '../src/task/types.ts'
import WorkbenchJournal from '../src/workbench/journal/index.ts'
import * as JournalInvariant from '../src/workbench/journal/invariant.ts'
import { MemoryStorageBackend } from './fixtures/memory-backend.ts'

/** Boot the journal with its invariant companion mounted. */
async function harness() {
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('memory', new MemoryStorageBackend())
  const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
  ctx.storage.mount('domain', facility)
  ctx.provide('storageDomain', facility)
  await ctx.plugin(InvariantRegistry)
  await ctx.plugin(JournalInvariant)
  await ctx.plugin(WorkbenchJournal).await()
  return { ctx, journal: ctx.workbenchJournal }
}

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

describe('workbench-journal invariant', () => {
  it('registers under the package name and allows normal appends', async () => {
    const h = await harness()
    current = h.ctx
    const appended = await h.journal.append({
      taskId: 'task-1' as TaskId,
      kind: 'task.created',
      actor: 'provider',
      idempotencyKey: 'inv-1',
      entityRevision: 1,
      payload: null,
    })
    expect(appended.journalSeq).toBe(1)
  })

  it('fails when the journal domain records a delete', async () => {
    const h = await harness()
    current = h.ctx
    expect(() => { h.ctx.emit('domain/changed', {
      domain: 'workbench_journal',
      table: 'entries',
      key: '0000000000000001',
      operation: 'deleted',
    }) }).toThrow(InvariantError)
  })

  it('fails when a foreign table appears on the journal domain', async () => {
    const h = await harness()
    current = h.ctx
    expect(() => { h.ctx.emit('domain/changed', {
      domain: 'workbench_journal',
      table: 'scratch',
      key: 'k',
      operation: 'put',
      value: null,
    }) }).toThrow(InvariantError)
  })

  it('stays quiet for other domains and for entry puts', async () => {
    const h = await harness()
    current = h.ctx
    expect(() => { h.ctx.emit('domain/changed', { domain: 'other', table: 'x', key: 'y', operation: 'deleted' }) })
      .not.toThrow()

    expect(() => { h.ctx.emit('domain/changed', { domain: 'workbench_journal', table: 'entries', key: '0000000000000001', operation: 'put', value: {} }) })
      .not.toThrow()
  })
})
