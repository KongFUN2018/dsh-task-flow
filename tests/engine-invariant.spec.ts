/** Invariant companion suite: binding writes must key by their own phase run id and follow the attempt/session/submission lifecycle. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import InvariantRegistry, { InvariantError } from '@deepseek-ai/dsh-invariants'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import type { DomainChanged } from '@deepseek-ai/dsh-storage-domain'
import * as EngineInvariant from '../src/recipe-engine-core/invariant.ts'
import { MemoryStorageBackend } from './fixtures/memory-backend.ts'

async function harness() {
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('memory', new MemoryStorageBackend())
  const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
  ctx.storage.mount('domain', facility)
  ctx.provide('storageDomain', facility)
  await ctx.plugin(InvariantRegistry)
  await ctx.plugin(EngineInvariant)
  return { ctx }
}

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

const put = (over: Record<string, unknown>): DomainChanged => ({
  domain: 'recipe_engine',
  table: 'phase_sessions',
  operation: 'put',
  key: 'ph-1',
  value: { phaseRunId: 'ph-1', taskId: 't-1', taskRunId: 'r-1', phaseId: 'main', attempt: 1, sessionId: 's-1', updatedAt: 1 },
  ...over,
})

describe('recipe-engine invariant', () => {
  it('registers under the package name and stays quiet on a legitimate binding write', async () => {
    const h = await harness()
    current = h.ctx
    expect(() => { h.ctx.emit('domain/changed', put({})) }).not.toThrow()
  })

  it('fails when a binding is stored under a key other than its phase run id', async () => {
    const h = await harness()
    current = h.ctx
    expect(() => { h.ctx.emit('domain/changed', put({ key: 'other' })) }).toThrow(InvariantError)
  })

  it('fails when an unexecuted binding claims a session or submission', async () => {
    const h = await harness()
    current = h.ctx
    expect(() => { h.ctx.emit('domain/changed', put({ value: { phaseRunId: 'ph-1', taskId: 't-1', taskRunId: 'r-1', phaseId: 'main', attempt: 0, sessionId: 's-1', updatedAt: 1 } })) }).toThrow(InvariantError)
  })

  it('fails when a binding records a submission without a completed attempt', async () => {
    const h = await harness()
    current = h.ctx
    expect(() => { h.ctx.emit('domain/changed', put({ value: { phaseRunId: 'ph-1', taskId: 't-1', taskRunId: 'r-1', phaseId: 'main', attempt: 0, submissionId: 'sub-1', updatedAt: 1 } })) }).toThrow(InvariantError)
  })

  it('stays quiet for deletions, unknown tables, and other domains', async () => {
    const h = await harness()
    current = h.ctx
    expect(() => { h.ctx.emit('domain/changed', { domain: 'recipe_engine', table: 'phase_sessions', key: 'k', operation: 'deleted' }) }).not.toThrow()
    expect(() => { h.ctx.emit('domain/changed', { domain: 'recipe_engine', table: 'other', key: 'k', operation: 'put', value: {} }) }).not.toThrow()
    expect(() => { h.ctx.emit('domain/changed', { domain: 'other', table: 'phase_sessions', key: 'k', operation: 'put', value: {} }) }).not.toThrow()
  })
})
