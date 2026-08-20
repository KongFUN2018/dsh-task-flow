/** Invariant companion suite: reference-integrity checks fire on dangling item-key names. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import InvariantRegistry, { InvariantError } from '@deepseek-ai/dsh-invariants'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import * as AttentionInvariant from '../src/attention/invariant.ts'
import { attentionDomainSpec } from '../src/attention/spec.ts'
import type { AttentionItem } from '../src/attention/types.ts'
import { MemoryStorageBackend } from './fixtures/memory-backend.ts'

/** Boot the attention invariant companion over a memory backend. */
async function harness() {
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('memory', new MemoryStorageBackend())
  const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
  ctx.storage.mount('domain', facility)
  ctx.provide('storageDomain', facility)
  await ctx.plugin(InvariantRegistry)
  await ctx.plugin(AttentionInvariant)
  return ctx
}

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

describe('attention invariant', () => {
  it('allows an item key that names a stored item', async () => {
    const ctx = await harness()
    current = ctx
    const domain = await ctx.storageDomain.open(attentionDomainSpec)
    await domain.table('items').put('gate:c-1', {
      itemId: 'gate:c-1', taskId: 't-1', kind: 'c-decision', decisionKind: 'gate',
      options: ['yes'], state: 'open', entityRevision: 1, openedAt: 1,
    } as unknown as AttentionItem)
    expect(() => { ctx.emit('domain/changed', {
      domain: 'attention', table: 'item_keys', key: 'k', operation: 'put',
      value: { itemId: 'gate:c-1' },
    }) }).not.toThrow()
  })

  it('fails when an item key names a missing item', async () => {
    const ctx = await harness()
    current = ctx
    await ctx.storageDomain.open(attentionDomainSpec)
    expect(() => { ctx.emit('domain/changed', {
      domain: 'attention', table: 'item_keys', key: 'k', operation: 'put',
      value: { itemId: 'ghost' },
    }) }).toThrow(InvariantError)
  })

  it('stays quiet for non-put operations, the items table, and other domains', async () => {
    const ctx = await harness()
    current = ctx
    await ctx.storageDomain.open(attentionDomainSpec)
    expect(() => { ctx.emit('domain/changed', { domain: 'attention', table: 'item_keys', key: 'k', operation: 'deleted' }) })
      .not.toThrow()
    expect(() => { ctx.emit('domain/changed', { domain: 'attention', table: 'items', key: 'i', operation: 'put', value: {} }) })
      .not.toThrow()
    expect(() => { ctx.emit('domain/changed', { domain: 'other', table: 'item_keys', key: 'k', operation: 'put', value: {} }) })
      .not.toThrow()
  })

  it('fails when the attention domain is not open', async () => {
    const ctx = await harness()
    current = ctx
    expect(() => { ctx.emit('domain/changed', {
      domain: 'attention', table: 'item_keys', key: 'k', operation: 'put',
      value: { itemId: 'gate:c-1' },
    }) }).toThrow(InvariantError)
  })
})
