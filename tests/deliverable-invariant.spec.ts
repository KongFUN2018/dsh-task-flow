/** Invariant companion suite: reference-integrity checks fire on dangling names across the domain tables. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import InvariantRegistry, { InvariantError } from '@deepseek-ai/dsh-invariants'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import WorkbenchJournalService from '../src/workbench/journal/index.ts'
import DeliverableService, { DeliverableId } from '../src/deliverable/index.ts'
import * as DeliverableInvariant from '../src/deliverable/invariant.ts'
import { MemoryStorageBackend } from './fixtures/memory-backend.ts'

/** Boot the deliverable service with its invariant companion mounted. */
async function harness() {
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('memory', new MemoryStorageBackend())
  const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
  ctx.storage.mount('domain', facility)
  ctx.provide('storageDomain', facility)
  await ctx.plugin(InvariantRegistry)
  await ctx.plugin(DeliverableInvariant)
  await ctx.plugin(WorkbenchJournalService)
  await ctx.plugin(DeliverableService).await()
  return { ctx, service: ctx.deliverables }
}

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

describe('deliverable-local invariant', () => {
  it('registers under the package name and allows valid writes across every table', async () => {
    const h = await harness()
    current = h.ctx
    const docV1 = await h.service.saveVersion('design-doc', null, null, 'save-k')
    const reportV1 = await h.service.saveVersion('site-report', null, null)
    await h.service.registerVersionDependencies(reportV1.versionId, [
      { deliverableId: DeliverableId('design-doc'), versionId: docV1.versionId },
    ])
    await h.service.recordPhaseInputs('run-1', [docV1.versionId])
    await h.service.invalidateDownstream([docV1.versionId])
    expect(h.service.getVersion(docV1.versionId)?.state).toBe('stale')
  })

  it('fails when a phase_inputs put references a version that is not stored', async () => {
    const h = await harness()
    current = h.ctx
    expect(() => { h.ctx.emit('domain/changed', {
      domain: 'deliverable_local',
      table: 'phase_inputs',
      key: 'run-1',
      operation: 'put',
      value: { inputVersionIds: ['ghost-version'] },
    }) }).toThrow(InvariantError)
  })

  it('fails when a versions put declares a dangling or self dependency', async () => {
    const h = await harness()
    current = h.ctx
    const docV1 = await h.service.saveVersion('design-doc', null, null)
    expect(() => { h.ctx.emit('domain/changed', {
      domain: 'deliverable_local',
      table: 'versions',
      key: 'v-x',
      operation: 'put',
      value: { versionId: 'v-x', dependsOn: [{ deliverableId: 'design-doc', versionId: 'ghost' }] },
    }) }).toThrow(InvariantError)
    expect(() => { h.ctx.emit('domain/changed', {
      domain: 'deliverable_local',
      table: 'versions',
      key: docV1.versionId,
      operation: 'put',
      value: { versionId: docV1.versionId, dependsOn: [{ deliverableId: 'design-doc', versionId: docV1.versionId }] },
    }) }).toThrow(InvariantError)
  })

  it('fails when a save_keys or latest entry names a missing version', async () => {
    const h = await harness()
    current = h.ctx
    expect(() => { h.ctx.emit('domain/changed', {
      domain: 'deliverable_local',
      table: 'save_keys',
      key: 'k',
      operation: 'put',
      value: { versionId: 'ghost' },
    }) }).toThrow(InvariantError)
    expect(() => { h.ctx.emit('domain/changed', {
      domain: 'deliverable_local',
      table: 'latest',
      key: 'design-doc',
      operation: 'put',
      value: { versionId: 'ghost' },
    }) }).toThrow(InvariantError)
  })

  it('fails when an impact snapshot names a missing version', async () => {
    const h = await harness()
    current = h.ctx
    expect(() => { h.ctx.emit('domain/changed', {
      domain: 'deliverable_local',
      table: 'impact_snapshots',
      key: 'snap-1',
      operation: 'put',
      value: { snapshotId: 'snap-1', staledVersions: [{ deliverableId: 'design-doc', versionIds: ['ghost'] }] },
    }) }).toThrow(InvariantError)
  })

  it('stays quiet for valid version puts, non-put operations, and other domains', async () => {
    const h = await harness()
    current = h.ctx
    const docV1 = await h.service.saveVersion('design-doc', null, null)
    expect(() => { h.ctx.emit('domain/changed', { domain: 'deliverable_local', table: 'versions', key: 'v', operation: 'put', value: { versionId: 'v', dependsOn: [] } }) })
      .not.toThrow()
    expect(() => { h.ctx.emit('domain/changed', { domain: 'deliverable_local', table: 'versions', key: docV1.versionId, operation: 'put', value: { versionId: docV1.versionId, dependsOn: [{ deliverableId: 'design-doc', versionId: docV1.versionId }] } }) })
      .toThrow(InvariantError)
    expect(() => { h.ctx.emit('domain/changed', { domain: 'deliverable_local', table: 'phase_inputs', key: 'r', operation: 'deleted' }) })
      .not.toThrow()
    expect(() => { h.ctx.emit('domain/changed', { domain: 'deliverable_local', table: 'unchecked_table', key: 'u', operation: 'put', value: {} }) })
      .not.toThrow()
    expect(() => { h.ctx.emit('domain/changed', { domain: 'other', table: 'x', key: 'y', operation: 'put', value: null }) })
      .not.toThrow()
  })

  it('fails when the deliverable-local domain is not open', async () => {
    const ctx = new Context()
    current = ctx
    await ctx.plugin(Storage)
    ctx.storage.backend.register('memory', new MemoryStorageBackend())
    const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
    ctx.storage.mount('domain', facility)
    ctx.provide('storageDomain', facility)
    await ctx.plugin(InvariantRegistry)
    await ctx.plugin(DeliverableInvariant)
    expect(() => { ctx.emit('domain/changed', {
      domain: 'deliverable_local',
      table: 'phase_inputs',
      key: 'run-1',
      operation: 'put',
      value: { inputVersionIds: [] },
    }) }).toThrow(InvariantError)
  })
})
