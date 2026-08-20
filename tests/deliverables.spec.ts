/** Unit suite: idempotent saves, dependency edges, multi-root impact closures, snapshots, journal facts, and restart recovery. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import WorkbenchJournalService from '../src/workbench/journal/index.ts'
import type { JournalFact, JournalPayload } from '../src/workbench/journal/types.ts'
import { TaskId } from '../src/task/index.ts'
import DeliverableService, { DeliverableId, DeliverableVersionId } from '../src/deliverable/index.ts'
import { MemoryMediaPool, MemoryStorageBackend } from './fixtures/memory-backend.ts'

/** Boot journal plus deliverable service over a memory backend; a shared pool simulates restarts. */
async function harness(pool?: MemoryMediaPool) {
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('memory', new MemoryStorageBackend(pool))
  const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
  ctx.storage.mount('domain', facility)
  ctx.provide('storageDomain', facility)
  await ctx.plugin(WorkbenchJournalService)
  await ctx.plugin(DeliverableService).await()
  return { ctx, service: ctx.deliverables, journal: ctx.workbenchJournal }
}

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

const D1 = DeliverableId('design-doc')
const D2 = DeliverableId('site-report')

/** The deliverable-local domain handle for direct table manipulation. */
function domainOf(ctx: Context) {
  const domain = ctx.storage.form('domain').get('deliverable_local')
  if (domain === undefined) throw new Error('deliverable_local domain is not open')
  return domain
}

/** Append one synthetic task-plane fact the snapshot derivation reads. */
function appendFact(ctx: Context, fact: { kind: string; key: string; payload: JournalPayload }): void {
  void ctx.workbenchJournal.append({
    taskId: TaskId('t-1'),
    kind: fact.kind,
    actor: 'unit',
    idempotencyKey: fact.key,
    entityRevision: 1,
    payload: fact.payload,
  })
}

function factsOf(ctx: Context, kind: string): JournalFact[] {
  return ctx.workbenchJournal.replay(0).filter(fact => fact.kind === kind)
}

describe('saveVersion', () => {
  it('creates a root version and then chains versions under the same deliverable', async () => {
    const h = await harness()
    current = h.ctx
    const root = await h.service.saveVersion(D1, null, null)
    expect(root.versionNumber).toBe(1)
    expect(root.state).toBe('current')
    expect(root.entityRevision).toBe(1)
    expect(root.baseVersionId).toBeUndefined()
    const second = await h.service.saveVersion(D1, root.versionId, null)
    expect(second.versionNumber).toBe(2)
    expect(second.baseVersionId).toBe(root.versionId)
    expect(second.versionId).not.toBe(root.versionId)
  })

  it('rejects a base that is not the latest version', async () => {
    const h = await harness()
    current = h.ctx
    const root = await h.service.saveVersion(D1, null, null)
    await h.service.saveVersion(D1, root.versionId, null)
    await expect(h.service.saveVersion(D1, root.versionId, null))
      .rejects.toMatchObject({ name: 'DeliverableError', code: 'stale-write' })
  })

  it('rejects a root save once the deliverable already has versions', async () => {
    const h = await harness()
    current = h.ctx
    await h.service.saveVersion(D1, null, null)
    await expect(h.service.saveVersion(D1, null, null))
      .rejects.toMatchObject({ code: 'stale-write' })
  })

  it('chains a successor on a staled head, re-validating the deliverable', async () => {
    const h = await harness()
    current = h.ctx
    const docV1 = await h.service.saveVersion(D1, null, null)
    const reportV1 = await h.service.saveVersion(D2, null, null)
    await h.service.registerVersionDependencies(reportV1.versionId, [
      { deliverableId: D1, versionId: docV1.versionId },
    ])
    await h.service.invalidateDownstream([docV1.versionId])
    expect(h.service.getVersion(reportV1.versionId)?.state).toBe('stale')
    const successor = await h.service.saveVersion(D2, reportV1.versionId, null)
    expect(successor.state).toBe('current')
    expect(successor.baseVersionId).toBe(reportV1.versionId)
    expect(successor.versionNumber).toBe(2)
    expect(h.service.getVersion(reportV1.versionId)?.state).toBe('stale')
  })

  it('rejects blank wire fields with invalid-argument', async () => {
    const h = await harness()
    current = h.ctx
    expect(() => h.service.saveVersion('  ', null, null)).toThrow(expect.objectContaining({ code: 'invalid-argument' }))
    expect(() => h.service.saveVersion(D1, ' ', null)).toThrow(expect.objectContaining({ code: 'invalid-argument' }))
    expect(() => h.service.saveVersion(D1, null, ' ')).toThrow(expect.objectContaining({ code: 'invalid-argument' }))
    expect(() => h.service.saveVersion(D1, null, null, ' ')).toThrow(expect.objectContaining({ code: 'invalid-argument' }))
    expect(() => h.service.invalidateDownstream([])).toThrow(expect.objectContaining({ code: 'invalid-argument' }))
    expect(() => h.service.invalidateDownstream([' '])).toThrow(expect.objectContaining({ code: 'invalid-argument' }))
    expect(() => h.service.listCurrentInputs(' ')).toThrow(expect.objectContaining({ code: 'invalid-argument' }))
    expect(() => h.service.getVersion(' ')).toThrow(expect.objectContaining({ code: 'invalid-argument' }))
    expect(() => h.service.getImpactSnapshot(' ')).toThrow(expect.objectContaining({ code: 'invalid-argument' }))
    await expect(h.service.recordPhaseInputs(' ', ['v'])).rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(h.service.recordPhaseInputs('run', [' '])).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('records the source submission on the version', async () => {
    const h = await harness()
    current = h.ctx
    const version = await h.service.saveVersion(D1, null, 'sub-1')
    expect(version.sourceSubmissionId).toBe('sub-1')
    expect(h.service.getVersion(version.versionId)?.sourceSubmissionId).toBe('sub-1')
  })
})

describe('save idempotency', () => {
  it('replays a taken key with identical fields and appends the fact once', async () => {
    const h = await harness()
    current = h.ctx
    const first = await h.service.saveVersion(D1, null, null, 'save-k')
    const replayed = await h.service.saveVersion(D1, null, null, 'save-k')
    expect(replayed.versionId).toBe(first.versionId)
    expect(factsOf(h.ctx, 'deliverable/version-saved')).toHaveLength(1)
    expect(factsOf(h.ctx, 'deliverable/version-saved')[0]?.idempotencyKey).toBe('deliverable/save:save-k')
  })

  it('fails loud when a taken key returns with different fields', async () => {
    const h = await harness()
    current = h.ctx
    const first = await h.service.saveVersion(D1, null, null, 'save-k')
    await expect(h.service.saveVersion(D1, first.versionId, null, 'save-k'))
      .rejects.toMatchObject({ code: 'idempotency-conflict' })
    await expect(h.service.saveVersion(D2, null, null, 'save-k'))
      .rejects.toMatchObject({ code: 'idempotency-conflict' })
    await expect(h.service.saveVersion(D1, null, 'sub-9', 'save-k'))
      .rejects.toMatchObject({ code: 'idempotency-conflict' })
  })

  it('fails not-found when the save index names a missing version', async () => {
    const h = await harness()
    current = h.ctx
    await domainOf(h.ctx).table('save_keys').put('dangling', { versionId: 'ghost' })
    await expect(h.service.saveVersion(D1, null, null, 'dangling'))
      .rejects.toMatchObject({ code: 'not-found' })
  })

  it('recovers a keyed save from the journal fact after a crash before the projections', async () => {
    const h = await harness()
    current = h.ctx
    const saved = await h.service.saveVersion(D1, null, null, 'crash-k')
    const domain = domainOf(h.ctx)
    await domain.table('save_keys').delete('crash-k')
    await domain.table('latest').delete(D1)
    await domain.table('versions').delete(saved.versionId)
    expect(h.service.getVersion(saved.versionId)).toBeUndefined()
    const recovered = await h.service.saveVersion(D1, null, null, 'crash-k')
    expect(recovered.versionId).toBe(saved.versionId)
    expect(h.service.getVersion(saved.versionId)?.versionId).toBe(saved.versionId)
    await expect(h.service.saveVersion(D1, saved.versionId, null, 'fresh-k')).resolves.toMatchObject({ versionNumber: 2 })
  })

  it('treats a key with no index entry and no journal fact as a fresh save', async () => {
    const h = await harness()
    current = h.ctx
    await expect(h.service.saveVersion(D1, null, null, 'never-taken')).resolves.toMatchObject({ versionNumber: 1 })
  })
})

describe('dependency edges', () => {
  it('registers the consumed inputs on the producing version and is idempotent', async () => {
    const h = await harness()
    current = h.ctx
    const docV1 = await h.service.saveVersion(D1, null, null)
    const reportV1 = await h.service.saveVersion(D2, null, null)
    await h.service.registerVersionDependencies(reportV1.versionId, [
      { deliverableId: D1, versionId: docV1.versionId },
    ])
    expect(h.service.getVersion(reportV1.versionId)?.dependsOn).toEqual([
      { deliverableId: D1, versionId: docV1.versionId },
    ])
    await h.service.registerVersionDependencies(reportV1.versionId, [
      { deliverableId: D1, versionId: docV1.versionId },
    ])
    expect(h.service.getVersion(reportV1.versionId)?.dependsOn).toHaveLength(1)
  })

  it('rejects unknown versions and conflicting re-registration', async () => {
    const h = await harness()
    current = h.ctx
    const docV1 = await h.service.saveVersion(D1, null, null)
    const reportV1 = await h.service.saveVersion(D2, null, null)
    await expect(h.service.registerVersionDependencies('ghost', []))
      .rejects.toMatchObject({ code: 'not-found' })
    await expect(h.service.registerVersionDependencies(reportV1.versionId, [
      { deliverableId: D1, versionId: DeliverableVersionId('ghost') },
    ])).rejects.toMatchObject({ code: 'not-found' })
    await h.service.registerVersionDependencies(reportV1.versionId, [
      { deliverableId: D1, versionId: docV1.versionId },
    ])
    const docV2 = await h.service.saveVersion(D1, docV1.versionId, null)
    await expect(h.service.registerVersionDependencies(reportV1.versionId, [
      { deliverableId: D1, versionId: docV2.versionId },
    ])).rejects.toMatchObject({ code: 'idempotency-conflict' })
    await expect(h.service.registerVersionDependencies(' ', [])).rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(h.service.registerVersionDependencies(reportV1.versionId, [
      { deliverableId: DeliverableId(' '), versionId: DeliverableVersionId('x') },
    ])).rejects.toMatchObject({ code: 'invalid-argument' })
  })
})

describe('invalidateDownstream', () => {
  it('walks the multi-root closure over dependency edges, staling the intersection once', async () => {
    const h = await harness()
    current = h.ctx
    const OTHER = DeliverableId('other-doc')
    const docV1 = await h.service.saveVersion(D1, null, null)
    const otherV1 = await h.service.saveVersion(OTHER, null, null)
    const docV2 = await h.service.saveVersion(D1, docV1.versionId, null)
    const reportV1 = await h.service.saveVersion(D2, null, null)
    await h.service.registerVersionDependencies(reportV1.versionId, [
      { deliverableId: D1, versionId: docV1.versionId },
      { deliverableId: OTHER, versionId: otherV1.versionId },
    ])
    const reportV2 = await h.service.saveVersion(D2, reportV1.versionId, null)
    await h.service.registerVersionDependencies(reportV2.versionId, [
      { deliverableId: D2, versionId: reportV1.versionId },
    ])
    const snapshot = await h.service.invalidateDownstream([docV1.versionId, otherV1.versionId])
    const staledIds = snapshot.staledVersions.flatMap(group => group.versionIds)
    expect(staledIds).toContain(reportV1.versionId)
    expect(staledIds).toContain(reportV2.versionId)
    expect(staledIds).not.toContain(docV2.versionId)
    expect(staledIds.filter(id => id === reportV1.versionId)).toHaveLength(1)
    expect(snapshot.staledVersions.find(group => group.deliverableId === D2)?.versionIds)
      .toEqual([reportV1.versionId, reportV2.versionId])
    expect(h.service.getVersion(reportV1.versionId)?.state).toBe('stale')
    expect(h.service.getImpactSnapshot(snapshot.snapshotId)?.snapshotId).toBe(snapshot.snapshotId)
    expect(factsOf(h.ctx, 'deliverable/version-staled')).toHaveLength(4)
    expect(factsOf(h.ctx, 'deliverable/impact-snapshotted')).toHaveLength(1)
  })

  it('rejects unknown roots before any write', async () => {
    const h = await harness()
    current = h.ctx
    const docV1 = await h.service.saveVersion(D1, null, null)
    await expect(h.service.invalidateDownstream([docV1.versionId, DeliverableVersionId('ghost')]))
      .rejects.toMatchObject({ code: 'not-found' })
    expect(h.service.getVersion(docV1.versionId)?.state).toBe('current')
    expect(factsOf(h.ctx, 'deliverable/version-staled')).toHaveLength(0)
  })

  it('skips the already-stale subgraph on re-invalidation', async () => {
    const h = await harness()
    current = h.ctx
    const docV1 = await h.service.saveVersion(D1, null, null)
    const docV2 = await h.service.saveVersion(D1, docV1.versionId, null)
    const first = await h.service.invalidateDownstream([docV1.versionId])
    expect(first.staledVersions.flatMap(group => group.versionIds)).toEqual([docV1.versionId])
    expect(h.service.getVersion(docV2.versionId)?.state).toBe('current')
    const again = await h.service.invalidateDownstream([docV1.versionId])
    expect(again.staledVersions).toEqual([])
    expect(again.affectedPhaseRuns).toEqual([])
    expect(again.staledGateChecks).toEqual([])
    expect(factsOf(h.ctx, 'deliverable/version-staled')).toHaveLength(1)
    const docV3 = await h.service.saveVersion(D1, docV2.versionId, null)
    expect(docV3.versionNumber).toBe(3)
  })

  it('covers phase runs whose registered inputs lost currency and their recorded gate verdicts', async () => {
    const h = await harness()
    current = h.ctx
    const docV1 = await h.service.saveVersion(D1, null, null)
    await h.service.recordPhaseInputs('run-1', [docV1.versionId])
    appendFact(h.ctx, {
      kind: 'submission/recorded',
      key: 'sub:s-1',
      payload: { submissionId: 's-1', phaseRunId: 'run-1', taskId: 't-1' },
    })
    appendFact(h.ctx, {
      kind: 'gate-check/recorded',
      key: 'gate:s-1:outputs-listed',
      payload: { submissionId: 's-1', checkId: 'outputs-listed', passed: true },
    })
    appendFact(h.ctx, {
      kind: 'gate-check/recorded',
      key: 'gate:s-1:style',
      payload: { submissionId: 's-1', checkId: 'style', passed: false },
    })
    const snapshot = await h.service.invalidateDownstream([docV1.versionId])
    expect(snapshot.affectedPhaseRuns).toEqual(['run-1'])
    expect(snapshot.staledGateChecks).toEqual([
      { submissionId: 's-1', checkIds: ['outputs-listed', 'style'] },
    ])
  })

  it('returns empty gate coverage when affected runs trace no submissions', async () => {
    const h = await harness()
    current = h.ctx
    const docV1 = await h.service.saveVersion(D1, null, null)
    await h.service.recordPhaseInputs('run-1', [docV1.versionId])
    appendFact(h.ctx, {
      kind: 'submission/recorded',
      key: 'sub:s-other',
      payload: { submissionId: 's-other', phaseRunId: 'run-2', taskId: 't-1' },
    })
    const snapshot = await h.service.invalidateDownstream([docV1.versionId])
    expect(snapshot.affectedPhaseRuns).toEqual(['run-1'])
    expect(snapshot.staledGateChecks).toEqual([])
  })

  it('attributes facts to the source submission task and the untasked sentinel otherwise', async () => {
    const h = await harness()
    current = h.ctx
    appendFact(h.ctx, {
      kind: 'submission/recorded',
      key: 'sub:s-1',
      payload: { submissionId: 's-1', phaseRunId: 'run-1', taskId: 't-1' },
    })
    const traced = await h.service.saveVersion(D1, null, 's-1')
    const untraced = await h.service.saveVersion(D2, null, null)
    await h.service.invalidateDownstream([traced.versionId])
    await h.service.invalidateDownstream([untraced.versionId])
    const staledFacts = factsOf(h.ctx, 'deliverable/version-staled')
    const tracedFact = staledFacts.find(fact => (fact.payload as { versionId?: string }).versionId === traced.versionId)
    const untracedFact = staledFacts.find(fact => (fact.payload as { versionId?: string }).versionId === untraced.versionId)
    expect(tracedFact?.taskId).toBe('t-1')
    expect(untracedFact?.taskId).toBe('deliverables')
    expect(untracedFact?.actor).toBe('deliverables')
  })
})

describe('listCurrentInputs', () => {
  it('lists registered inputs that are still current, in registration order', async () => {
    const h = await harness()
    current = h.ctx
    const docV1 = await h.service.saveVersion(D1, null, null)
    const otherV1 = await h.service.saveVersion(D2, null, null)
    await h.service.recordPhaseInputs('run-1', [docV1.versionId, otherV1.versionId])
    expect(h.service.listCurrentInputs('run-1').map(v => v.versionId))
      .toEqual([docV1.versionId, otherV1.versionId])
    await h.service.invalidateDownstream([docV1.versionId])
    expect(h.service.listCurrentInputs('run-1').map(v => v.versionId))
      .toEqual([otherV1.versionId])
    expect(h.service.listCurrentInputs('run-unknown')).toEqual([])
  })
})

describe('listConsumingPhaseRuns', () => {
  it('lists the phase runs that consume a version across registrations', async () => {
    const h = await harness()
    current = h.ctx
    const docV1 = await h.service.saveVersion(D1, null, null)
    const otherV1 = await h.service.saveVersion(D2, null, null)
    await h.service.recordPhaseInputs('run-a', [docV1.versionId, otherV1.versionId])
    await h.service.recordPhaseInputs('run-b', [docV1.versionId])
    await h.service.recordPhaseInputs('run-c', [otherV1.versionId])
    expect(h.service.listConsumingPhaseRuns(docV1.versionId).map(String).sort())
      .toEqual(['run-a', 'run-b'])
    expect(h.service.listConsumingPhaseRuns(otherV1.versionId).map(String))
      .toEqual(['run-a', 'run-c'])
    expect(h.service.listConsumingPhaseRuns('ghost')).toEqual([])
  })
})

describe('restart recovery', () => {
  it('recovers versions, edges, snapshots, and keyed saves across a restart', async () => {
    const pool = new MemoryMediaPool()
    const first = await harness(pool)
    const docV1 = await first.service.saveVersion(D1, null, null, 'stable-k')
    const reportV1 = await first.service.saveVersion(D2, null, null)
    await first.service.registerVersionDependencies(reportV1.versionId, [
      { deliverableId: D1, versionId: docV1.versionId },
    ])
    await first.service.recordPhaseInputs('run-1', [docV1.versionId])
    const snapshot = await first.service.invalidateDownstream([docV1.versionId])
    await first.ctx.fiber.dispose()
    const second = await harness(pool)
    current = second.ctx
    expect(second.service.getVersion(docV1.versionId)?.state).toBe('stale')
    expect(second.service.getVersion(reportV1.versionId)?.dependsOn).toEqual([
      { deliverableId: D1, versionId: docV1.versionId },
    ])
    expect(second.service.getImpactSnapshot(snapshot.snapshotId)?.roots).toEqual([docV1.versionId])
    const replayed = await second.service.saveVersion(D1, null, null, 'stable-k')
    expect(replayed.versionId).toBe(docV1.versionId)
    expect(second.service.listCurrentInputs('run-1')).toEqual([])
    const successor = await second.service.saveVersion(D1, docV1.versionId, null)
    expect(successor.versionNumber).toBe(2)
    expect(successor.state).toBe('current')
    expect(second.service.getVersion(docV1.versionId)?.state).toBe('stale')
  })
})

describe('unopened domain guards', () => {
  it('fails loud on reads and writes before the domain opens', async () => {
    const ctx = new Context()
    current = ctx
    await ctx.plugin(Storage)
    ctx.storage.backend.register('memory', new MemoryStorageBackend())
    const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
    ctx.storage.mount('domain', facility)
    ctx.provide('storageDomain', facility)
    await ctx.plugin(WorkbenchJournalService)
    const service = new DeliverableService(ctx)
    expect(() => service.listCurrentInputs('run-1')).toThrow(expect.objectContaining({ code: 'invalid-argument' }))
    expect(() => service.getVersion('v-1')).toThrow(expect.objectContaining({ code: 'invalid-argument' }))
    expect(() => service.getImpactSnapshot('snap-1')).toThrow(expect.objectContaining({ code: 'invalid-argument' }))
    await expect(service.saveVersion(D1, null, null)).rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(service.saveVersion(D1, null, null, 'k')).rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(service.invalidateDownstream(['v-1'])).rejects.toMatchObject({ code: 'invalid-argument' })
  })
})

describe('edge and defensive paths', () => {
  it('rejects a non-null base on a versionless deliverable', async () => {
    const h = await harness()
    current = h.ctx
    await expect(h.service.saveVersion(D1, 'ghost-base', null)).rejects.toMatchObject({ code: 'stale-write' })
  })

  it('stales a repeated root once', async () => {
    const h = await harness()
    current = h.ctx
    const v1 = await h.service.saveVersion(D1, null, null)
    const snapshot = await h.service.invalidateDownstream([v1.versionId, v1.versionId])
    expect(snapshot.staledVersions).toHaveLength(1)
  })

  it('lists only the phase runs whose inputs lost currency', async () => {
    const h = await harness()
    current = h.ctx
    const docV1 = await h.service.saveVersion(D1, null, null)
    const otherV1 = await h.service.saveVersion(D2, null, null)
    await h.service.recordPhaseInputs('run-a', [docV1.versionId])
    await h.service.recordPhaseInputs('run-b', [otherV1.versionId])
    const snapshot = await h.service.invalidateDownstream([docV1.versionId])
    expect(snapshot.affectedPhaseRuns).toEqual(['run-a'])
  })

  it('skips malformed journal facts during gate-check derivation', async () => {
    const h = await harness()
    current = h.ctx
    const docV1 = await h.service.saveVersion(D1, null, null)
    await h.service.recordPhaseInputs('run-1', [docV1.versionId])
    appendFact(h.ctx, { kind: 'submission/recorded', key: 'sub-good', payload: { phaseRunId: 'run-1', submissionId: 's-1' } })
    appendFact(h.ctx, { kind: 'submission/recorded', key: 'sub-bad', payload: { phaseRunId: 'run-1', submissionId: 42 as unknown as string } })
    appendFact(h.ctx, { kind: 'gate-check/recorded', key: 'gate-bad-sub', payload: { submissionId: 42 as unknown as string, checkId: 'c' } })
    appendFact(h.ctx, { kind: 'gate-check/recorded', key: 'gate-bad-check', payload: { submissionId: 's-1', checkId: 42 as unknown as string } })
    appendFact(h.ctx, { kind: 'gate-check/recorded', key: 'gate-unknown', payload: { submissionId: 's-unknown', checkId: 'c-x' } })
    appendFact(h.ctx, { kind: 'gate-check/recorded', key: 'gate-good', payload: { submissionId: 's-1', checkId: 'c-1' } })
    const snapshot = await h.service.invalidateDownstream([docV1.versionId])
    expect(snapshot.staledGateChecks).toEqual([{ submissionId: 's-1', checkIds: ['c-1'] }])
  })
})
