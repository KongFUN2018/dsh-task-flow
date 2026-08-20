/** Invariant companion suite: reference-integrity checks fire on dangling names across the clarification tables. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import InvariantRegistry, { InvariantError } from '@deepseek-ai/dsh-invariants'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import * as ClarificationInvariant from '../src/clarification/invariant.ts'
import { clarificationDomainSpec } from '../src/clarification/spec.ts'
import type { ClarificationRequest } from '../src/clarification/types.ts'
import { MemoryStorageBackend } from './fixtures/memory-backend.ts'

/** Boot the clarification invariant companion over a memory backend. */
async function harness() {
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('memory', new MemoryStorageBackend())
  const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
  ctx.storage.mount('domain', facility)
  ctx.provide('storageDomain', facility)
  await ctx.plugin(InvariantRegistry)
  await ctx.plugin(ClarificationInvariant)
  return ctx
}

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

/** Open the clarification domain directly so the invariant has a domain to check. */
async function openDomain(ctx: Context) {
  return ctx.storageDomain.open(clarificationDomainSpec)
}

describe('clarification invariant', () => {
  it('allows a question that names a stored request', async () => {
    const ctx = await harness()
    current = ctx
    const domain = await openDomain(ctx)
    await domain.table('requests').put('r-1', {
      requestId: 'r-1', phaseRunId: 'p-1', taskId: 't-1', questionIds: [], state: 'open', revision: 1, createdAt: 1,
    } as unknown as ClarificationRequest)
    expect(() => { ctx.emit('domain/changed', {
      domain: 'clarification', table: 'questions', key: 'q-1', operation: 'put',
      value: { questionId: 'q-1', requestId: 'r-1', phaseId: 'p', required: true, order: 0, text: 'x', revision: 1 },
    }) }).not.toThrow()
  })

  it('fails when a question names a missing request', async () => {
    const ctx = await harness()
    current = ctx
    await openDomain(ctx)
    expect(() => { ctx.emit('domain/changed', {
      domain: 'clarification', table: 'questions', key: 'q-1', operation: 'put',
      value: { questionId: 'q-1', requestId: 'ghost', phaseId: 'p', required: true, order: 0, text: 'x', revision: 1 },
    }) }).toThrow(InvariantError)
  })

  it('fails when an answer names a missing question', async () => {
    const ctx = await harness()
    current = ctx
    await openDomain(ctx)
    expect(() => { ctx.emit('domain/changed', {
      domain: 'clarification', table: 'answers', key: 'q-1', operation: 'put',
      value: { questionId: 'q-1', actor: 'pm', value: 'x', submittedAt: 1, revision: 1 },
    }) }).toThrow(InvariantError)
  })

  it('fails when a request_key names a missing request', async () => {
    const ctx = await harness()
    current = ctx
    await openDomain(ctx)
    expect(() => { ctx.emit('domain/changed', {
      domain: 'clarification', table: 'request_keys', key: 'k', operation: 'put',
      value: { requestId: 'ghost' },
    }) }).toThrow(InvariantError)
  })

  it('stays quiet for non-put operations, unchecked tables, and other domains', async () => {
    const ctx = await harness()
    current = ctx
    await openDomain(ctx)
    expect(() => { ctx.emit('domain/changed', { domain: 'clarification', table: 'questions', key: 'q', operation: 'deleted' }) })
      .not.toThrow()
    expect(() => { ctx.emit('domain/changed', { domain: 'clarification', table: 'requests', key: 'r', operation: 'put', value: {} }) })
      .not.toThrow()
    expect(() => { ctx.emit('domain/changed', { domain: 'other', table: 'questions', key: 'q', operation: 'put', value: {} }) })
      .not.toThrow()
  })

  it('fails when the clarification domain is not open', async () => {
    const ctx = await harness()
    current = ctx
    expect(() => { ctx.emit('domain/changed', {
      domain: 'clarification', table: 'questions', key: 'q', operation: 'put',
      value: { questionId: 'q', requestId: 'r', phaseId: 'p', required: true, order: 0, text: 'x', revision: 1 },
    }) }).toThrow(InvariantError)
  })
})
