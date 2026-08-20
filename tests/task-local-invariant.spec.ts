/** Invariant companion suite: a projection put without its journal fact fails; deletions and other domains stay quiet. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import InvariantRegistry, { InvariantError } from '@deepseek-ai/dsh-invariants'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import RecipeRegistry from '../src/recipe/index.ts'
import DeliverableService from '../src/deliverable/index.ts'
import WorkbenchJournalService from '../src/workbench/journal/index.ts'
import SessionStore from '@deepseek-ai/dsh-session'
import LocalTaskService from '../src/task-local/index.ts'
import * as TaskLocalInvariant from '../src/task-local/invariant.ts'
import {
  MemoryMediaPool,
  MemoryStorageBackend,
} from './fixtures/memory-backend.ts'

/** Boot the task-local stack with its invariant companion mounted. */
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
  await ctx.plugin(InvariantRegistry)
  await ctx.plugin(TaskLocalInvariant)
  await ctx.plugin(LocalTaskService).await()
  return { ctx, tasks: ctx.tasks }
}

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

describe('task-local invariant', () => {
  it('registers under the package name and stays quiet on legitimate writes', async () => {
    const h = await harness()
    current = h.ctx
    await expect(h.tasks.createTask('empty-template', 'w-1', 'unit', 'create-k')).resolves.toMatchObject({
      state: 'planning',
    })
  })

  it('fails when a task projection put has no journal fact behind it', async () => {
    const h = await harness()
    current = h.ctx
    expect(() => { h.ctx.emit('domain/changed', {
      domain: 'task_local',
      table: 'tasks',
      key: 'ghost-task',
      operation: 'put',
      value: { taskId: 'ghost-task', revision: 5 },
    }) }).toThrow(InvariantError)
  })

  it('fails when a gate-result list is longer than its recorded facts', async () => {
    const h = await harness()
    current = h.ctx
    expect(() => { h.ctx.emit('domain/changed', {
      domain: 'task_local',
      table: 'gate_results',
      key: 'sub-1',
      operation: 'put',
      value: [{ submissionId: 'sub-1', checkId: 'c', passed: true, recordedAt: 1 }],
    }) }).toThrow(InvariantError)
  })

  it('stays quiet for deletions, unknown tables, and other domains', async () => {
    const h = await harness()
    current = h.ctx
    expect(() => { h.ctx.emit('domain/changed', { domain: 'task_local', table: 'tasks', key: 't', operation: 'deleted' }) })
      .not.toThrow()
    expect(() => { h.ctx.emit('domain/changed', { domain: 'task_local', table: 'other', key: 'k', operation: 'put', value: {} }) })
      .not.toThrow()
    expect(() => { h.ctx.emit('domain/changed', { domain: 'other', table: 'tasks', key: 'k', operation: 'put', value: { taskId: 'k', revision: 1 } }) })
      .not.toThrow()
  })
})
