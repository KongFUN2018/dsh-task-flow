/** Invariant companion suite: lease writes keep one active lease per deliverable and name existing versions. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import InvariantRegistry, { InvariantError } from '@deepseek-ai/dsh-invariants'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import WorkbenchJournalService from '../src/workbench/journal/index.ts'
import DeliverableService from '../src/deliverable/index.ts'
import SessionStore from '@deepseek-ai/dsh-session'
import LocalTaskService from '../src/task-local/index.ts'
import EditLockService from '../src/edit-lock/index.ts'
import { editLockDomainSpec } from '../src/edit-lock/spec.ts'
import * as EditLockInvariant from '../src/edit-lock/invariant.ts'
import { MemoryStorageBackend } from './fixtures/memory-backend.ts'

/** Boot the edit-lock service with its invariant companion mounted. */
async function harness() {
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('memory', new MemoryStorageBackend())
  const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
  ctx.storage.mount('domain', facility)
  ctx.provide('storageDomain', facility)
  await ctx.plugin(WorkbenchJournalService)
  await ctx.plugin(DeliverableService)
  await ctx.plugin(SessionStore)
  await ctx.plugin(LocalTaskService)
  await ctx.plugin(EditLockService, { sweepIntervalMs: 60_000 }).await()
  await ctx.plugin(InvariantRegistry)
  await ctx.plugin(EditLockInvariant)
  return { ctx, locks: ctx.editLock, deliverables: ctx.deliverables }
}

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

describe('edit-lock invariant', () => {
  it('registers under the package name and stays quiet for valid leases across two deliverables', async () => {
    const h = await harness()
    current = h.ctx
    const docV = await h.deliverables.saveVersion('design-doc', null, null)
    const reportV = await h.deliverables.saveVersion('site-report', null, null)
    await h.locks.acquire('design-doc', docV.versionId, 'alice', 60_000)
    await h.locks.acquire('site-report', reportV.versionId, 'bob', 60_000)
    expect(h.locks.listActive()).toHaveLength(2)
  })

  it('fails when two active leases name the same deliverable', async () => {
    const h = await harness()
    current = h.ctx
    const docV = await h.deliverables.saveVersion('design-doc', null, null)
    const lease = await h.locks.acquire('design-doc', docV.versionId, 'alice', 60_000)
    expect(() => { h.ctx.emit('domain/changed', {
      domain: 'edit_lock',
      table: 'leases',
      key: 'second-lease',
      operation: 'put',
      value: { ...lease, leaseId: 'second-lease', owner: 'bob', entityRevision: 1 },
    }) }).toThrow(InvariantError)
  })

  it('fails when a lease targets a version that is not stored', async () => {
    const h = await harness()
    current = h.ctx
    const docV = await h.deliverables.saveVersion('design-doc', null, null)
    const lease = await h.locks.acquire('design-doc', docV.versionId, 'alice', 60_000)
    expect(() => { h.ctx.emit('domain/changed', {
      domain: 'edit_lock',
      table: 'leases',
      key: 'ghost-lease',
      operation: 'put',
      value: { ...lease, leaseId: 'ghost-lease', deliverableId: 'other-doc', targetVersionId: 'ghost-version', entityRevision: 1 },
    }) }).toThrow(InvariantError)
  })

  it('fails when the edit-lock domain is not open', async () => {
    const ctx = new Context()
    current = ctx
    await ctx.plugin(Storage)
    ctx.storage.backend.register('memory', new MemoryStorageBackend())
    const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
    ctx.storage.mount('domain', facility)
    ctx.provide('storageDomain', facility)
    await ctx.plugin(InvariantRegistry)
    await ctx.plugin(EditLockInvariant)
    expect(() => { ctx.emit('domain/changed', {
      domain: 'edit_lock',
      table: 'leases',
      key: 'l',
      operation: 'put',
      value: {},
    }) }).toThrow(InvariantError)
  })

  it('fails when the deliverable-local domain is not open', async () => {
    const ctx = new Context()
    current = ctx
    await ctx.plugin(Storage)
    ctx.storage.backend.register('memory', new MemoryStorageBackend())
    const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
    ctx.storage.mount('domain', facility)
    ctx.provide('storageDomain', facility)
    await facility.open(editLockDomainSpec)
    await ctx.plugin(InvariantRegistry)
    await ctx.plugin(EditLockInvariant)
    expect(() => { ctx.emit('domain/changed', {
      domain: 'edit_lock',
      table: 'leases',
      key: 'l',
      operation: 'put',
      value: { leaseId: 'l', deliverableId: 'd', targetVersionId: 'v', state: 'active' },
    }) }).toThrow(InvariantError)
  })

  it('stays quiet for writes to other domains and non-put operations', async () => {
    const h = await harness()
    current = h.ctx
    const docV = await h.deliverables.saveVersion('design-doc', null, null)
    const domain = h.ctx.storage.form('domain').get('edit_lock')
    const leases = domain!.table('leases')
    await leases.delete('no-such-lease')
    expect(() => {
      h.ctx.emit('domain/changed', { domain: 'other', table: 'leases', key: 'x', operation: 'put', value: {} })
    }).not.toThrow()
    expect(docV.versionId).toBeDefined()
  })
})
