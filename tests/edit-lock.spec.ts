/** Unit suite: lease acquisition, renewal, release, expiry sweep, consumer-freeze, and cancellation-triggered release. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import RecipeRegistry, { EMPTY_TEMPLATE_RECIPE_ID } from '../src/recipe/index.ts'
import WorkbenchJournalService from '../src/workbench/journal/index.ts'
import DeliverableService, { DeliverableId } from '../src/deliverable/index.ts'
import type { TaskMutationContext } from '../src/task/types.ts'
import SessionStore from '@deepseek-ai/dsh-session'
import LocalTaskService from '../src/task-local/index.ts'
import EditLockService from '../src/edit-lock/index.ts'
import { MemoryStorageBackend } from './fixtures/memory-backend.ts'

/** Boot the full task stack plus the edit-lock service over a memory medium. */
async function harness(sweepIntervalMs = 1000) {
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
  await ctx.plugin(EditLockService, { sweepIntervalMs }).await()
  return { ctx, deliverables: ctx.deliverables, locks: ctx.editLock, tasks: ctx.tasks, journal: ctx.workbenchJournal }
}

type H = Awaited<ReturnType<typeof harness>>

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

const DOC = DeliverableId('design-doc')
const REPORT = DeliverableId('site-report')

function factsOf(h: H, kind: string) {
  return h.journal.replay(0).filter(fact => fact.kind === kind)
}

/** Register one phase run consuming a version, mirroring the write chain. */
async function consumingRun(h: H, versionId: string): Promise<string> {
  const created = await h.tasks.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'unit', `create-${versionId}`)
  await h.tasks.startTask(created.taskId, { actor: 'unit', reason: 'spec', expectedRevision: 1, idempotencyKey: `start-${versionId}` })
  const run = await h.tasks.createTaskRun(created.taskId, { actor: 'unit', reason: 'spec', expectedRevision: 2, idempotencyKey: `run-${versionId}` })
  const phaseRun = await h.tasks.createPhaseRun(run.runId, 'main', { actor: 'unit', reason: 'spec', expectedRevision: 1, idempotencyKey: `phase-${versionId}` })
  await h.deliverables.recordPhaseInputs(phaseRun.phaseRunId, [versionId])
  return String(phaseRun.phaseRunId)
}

const mut = (expectedRevision: number, key: string): TaskMutationContext => ({
  actor: 'unit', reason: 'edit-lock spec', expectedRevision, idempotencyKey: key,
})

describe('acquire', () => {
  it('creates an active lease with the requested ttl and appends the acquired fact', async () => {
    const h = await harness()
    current = h.ctx
    const version = await h.deliverables.saveVersion(DOC, null, null)
    const before = Date.now()
    const lease = await h.locks.acquire(String(DOC), version.versionId, 'alice', 60_000)
    expect(lease.state).toBe('active')
    expect(lease.owner).toBe('alice')
    expect(lease.targetVersionId).toBe(version.versionId)
    expect(lease.acquiredAt).toBeGreaterThanOrEqual(before)
    expect(lease.expiresAt - lease.acquiredAt).toBe(60_000)
    expect(factsOf(h, 'edit-lock/acquired')).toHaveLength(1)
  })

  it('fails loud with holder and expiry when the deliverable is already held', async () => {
    const h = await harness()
    current = h.ctx
    const version = await h.deliverables.saveVersion(DOC, null, null)
    await h.locks.acquire(String(DOC), version.versionId, 'alice', 60_000)
    const successor = await h.deliverables.saveVersion(DOC, version.versionId, null)
    await expect(h.locks.acquire(String(DOC), successor.versionId, 'bob', 60_000))
      .rejects.toMatchObject({ code: 'lock-held', holder: 'alice' })
  })

  it('returns the existing lease when the same task and owner re-acquire the same target', async () => {
    const h = await harness()
    current = h.ctx
    const version = await h.deliverables.saveVersion(DOC, null, null)
    const first = await h.locks.acquire(String(DOC), version.versionId, 'alice', 60_000, 't-1')
    const again = await h.locks.acquire(String(DOC), version.versionId, 'alice', 60_000, 't-1')
    expect(again.leaseId).toBe(first.leaseId)
    expect(factsOf(h, 'edit-lock/acquired')).toHaveLength(1)
  })

  it('fails loud on an unknown target version and on a cross-deliverable target', async () => {
    const h = await harness()
    current = h.ctx
    await expect(h.locks.acquire(String(DOC), 'ghost-version', 'alice', 60_000))
      .rejects.toMatchObject({ code: 'not-found' })
    const reportV = await h.deliverables.saveVersion(REPORT, null, null)
    await expect(h.locks.acquire(String(DOC), reportV.versionId, 'alice', 60_000))
      .rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('freezes the phase runs consuming the target version until release clears them', async () => {
    const h = await harness()
    current = h.ctx
    const version = await h.deliverables.saveVersion(DOC, null, null)
    const runId = await consumingRun(h, version.versionId)
    const lease = await h.locks.acquire(String(DOC), version.versionId, 'alice', 60_000)
    expect((await h.tasks.getPhaseRun(runId))?.schedulingFrozen).toBe(true)
    await h.locks.release(String(lease.leaseId), lease.entityRevision, 'alice')
    expect((await h.tasks.getPhaseRun(runId))?.schedulingFrozen).toBe(false)
  })
})

describe('renew and release', () => {
  it('advances renewedAt and expiresAt and bumps the revision', async () => {
    const h = await harness()
    current = h.ctx
    const version = await h.deliverables.saveVersion(DOC, null, null)
    const lease = await h.locks.acquire(String(DOC), version.versionId, 'alice', 60_000)
    await new Promise(resolve => setTimeout(resolve, 5))
    const renewed = await h.locks.renew(String(lease.leaseId), lease.entityRevision, 120_000)
    expect(renewed.entityRevision).toBe(lease.entityRevision + 1)
    expect(renewed.expiresAt - renewed.renewedAt).toBe(120_000)
    expect(factsOf(h, 'edit-lock/renewed')).toHaveLength(1)
  })

  it('rejects a stale revision and an unknown lease', async () => {
    const h = await harness()
    current = h.ctx
    const version = await h.deliverables.saveVersion(DOC, null, null)
    const lease = await h.locks.acquire(String(DOC), version.versionId, 'alice', 60_000)
    await expect(h.locks.renew(String(lease.leaseId), 99, 60_000))
      .rejects.toMatchObject({ code: 'invalid-transition' })
    await expect(h.locks.renew('ghost', 1, 60_000))
      .rejects.toMatchObject({ code: 'not-found' })
  })

  it('releases explicitly and is idempotent on a terminal lease', async () => {
    const h = await harness()
    current = h.ctx
    const version = await h.deliverables.saveVersion(DOC, null, null)
    const lease = await h.locks.acquire(String(DOC), version.versionId, 'alice', 60_000)
    const released = await h.locks.release(String(lease.leaseId), lease.entityRevision, 'alice')
    expect(released.state).toBe('released')
    expect(factsOf(h, 'edit-lock/released')).toHaveLength(1)
    const again = await h.locks.release(String(lease.leaseId), released.entityRevision, 'alice')
    expect(again.state).toBe('released')
  })
})

describe('expiry', () => {
  it('lapses a lease on the sweep and clears consumer freezes', async () => {
    const h = await harness(50)
    current = h.ctx
    const version = await h.deliverables.saveVersion(DOC, null, null)
    const runId = await consumingRun(h, version.versionId)
    await h.locks.acquire(String(DOC), version.versionId, 'alice', 40)
    expect((await h.tasks.getPhaseRun(runId))?.schedulingFrozen).toBe(true)
    await new Promise(resolve => setTimeout(resolve, 160))
    const list = h.locks.listActive()
    expect(list).toEqual([])
    const stored = h.journal.replay(0).filter(fact => fact.kind === 'edit-lock/expired')
    expect(stored.length).toBeGreaterThanOrEqual(1)
    expect((await h.tasks.getPhaseRun(runId))?.schedulingFrozen).toBe(false)
  })

  it('lazy-expires a lapsed lease on the next acquire and lets a fresh holder in', async () => {
    const h = await harness(10_000)
    current = h.ctx
    const version = await h.deliverables.saveVersion(DOC, null, null)
    await h.locks.acquire(String(DOC), version.versionId, 'alice', 20)
    await new Promise(resolve => setTimeout(resolve, 40))
    const next = await h.locks.acquire(String(DOC), version.versionId, 'bob', 60_000)
    expect(next.owner).toBe('bob')
    expect(factsOf(h, 'edit-lock/expired').length).toBe(1)
    expect(factsOf(h, 'edit-lock/released').length).toBe(0)
  })
})

describe('listActive', () => {
  it('filters by task and excludes lapsed leases', async () => {
    const h = await harness()
    current = h.ctx
    const docV = await h.deliverables.saveVersion(DOC, null, null)
    const reportV = await h.deliverables.saveVersion(REPORT, null, null)
    await h.locks.acquire(String(DOC), docV.versionId, 'alice', 60_000, 't-1')
    await h.locks.acquire(String(REPORT), reportV.versionId, 'bob', 60_000, 't-2')
    expect(h.locks.listActive('t-1')).toHaveLength(1)
    expect(h.locks.listActive()).toHaveLength(2)
    expect(h.locks.listActive('t-none')).toEqual([])
  })
})

describe('task cancellation', () => {
  it('releases the task-owned lease when the task enters cancelling', async () => {
    const h = await harness()
    current = h.ctx
    const version = await h.deliverables.saveVersion(DOC, null, null)
    const created = await h.tasks.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'unit', 'cancel-k')
    await h.tasks.startTask(created.taskId, mut(1, 'start-k'))
    const lease = await h.locks.acquire(String(DOC), version.versionId, 'alice', 60_000, String(created.taskId))
    await h.tasks.requestCancel(created.taskId, mut(2, 'cancel-k'))
    await new Promise(resolve => setTimeout(resolve, 30))
    expect(h.locks.listActive(String(created.taskId))).toEqual([])
    const released = factsOf(h, 'edit-lock/released')
    expect(released.length).toBeGreaterThanOrEqual(1)
    const fact = released[released.length - 1]!
    expect((fact.payload as { taskId?: string }).taskId).toBe(String(created.taskId))
    expect(lease.leaseId).toBeDefined()
  })
})

describe('defensive paths', () => {
  it('excludes a lapsed active lease and a lease without a taskId from a filtered list', async () => {
    const h = await harness(10_000)
    current = h.ctx
    const v1 = await h.deliverables.saveVersion(DOC, null, null)
    await h.locks.acquire(String(DOC), v1.versionId, 'alice', 20, 't-1')
    await new Promise(resolve => setTimeout(resolve, 40))
    expect(h.locks.listActive('t-1')).toEqual([])
    const v2 = await h.deliverables.saveVersion(DOC, v1.versionId, null)
    await h.locks.acquire(String(DOC), v2.versionId, 'bob', 60_000)
    expect(h.locks.listActive('t-x')).toEqual([])
  })

  it('rejects renewing a released lease', async () => {
    const h = await harness()
    current = h.ctx
    const v1 = await h.deliverables.saveVersion(DOC, null, null)
    const lease = await h.locks.acquire(String(DOC), v1.versionId, 'alice', 60_000)
    const released = await h.locks.release(String(lease.leaseId), lease.entityRevision, 'alice')
    await expect(h.locks.renew(String(lease.leaseId), released.entityRevision, 60_000))
      .rejects.toMatchObject({ code: 'invalid-transition' })
  })

  it('rejects releasing with a stale revision', async () => {
    const h = await harness()
    current = h.ctx
    const v1 = await h.deliverables.saveVersion(DOC, null, null)
    const lease = await h.locks.acquire(String(DOC), v1.versionId, 'alice', 60_000)
    await expect(h.locks.release(String(lease.leaseId), 99, 'alice'))
      .rejects.toMatchObject({ code: 'invalid-transition' })
  })

  it('leaves other leases alone when a task cancels', async () => {
    const h = await harness()
    current = h.ctx
    const v1 = await h.deliverables.saveVersion(DOC, null, null)
    const created = await h.tasks.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'unit', 'cancel-k2')
    await h.tasks.startTask(created.taskId, mut(1, 'start-k2'))
    await h.locks.acquire(String(DOC), v1.versionId, 'alice', 60_000, String(created.taskId))
    const rv = await h.deliverables.saveVersion(REPORT, null, null)
    await h.locks.acquire(String(REPORT), rv.versionId, 'bob', 60_000)
    await h.tasks.requestCancel(created.taskId, mut(2, 'cancel-k2'))
    await new Promise(resolve => setTimeout(resolve, 30))
    expect(h.locks.listActive(String(created.taskId))).toEqual([])
    expect(h.locks.listActive()).toHaveLength(1)
  })

  it('skips consumer freezes for missing phase runs and non-frozen consumers', async () => {
    const h = await harness()
    current = h.ctx
    const v1 = await h.deliverables.saveVersion(DOC, null, null)
    await h.deliverables.recordPhaseInputs('ghost-run', [v1.versionId])
    const lease = await h.locks.acquire(String(DOC), v1.versionId, 'alice', 60_000)
    await h.locks.release(String(lease.leaseId), lease.entityRevision, 'alice')
    const runId = await consumingRun(h, v1.versionId)
    await h.locks.release(String(lease.leaseId), lease.entityRevision, 'alice')
    expect((await h.tasks.getPhaseRun(runId))?.schedulingFrozen).toBeUndefined()
  })

  it('does not re-freeze an already-frozen consumer', async () => {
    const h = await harness()
    current = h.ctx
    const v1 = await h.deliverables.saveVersion(DOC, null, null)
    const runId = await consumingRun(h, v1.versionId)
    await h.tasks.freezePhaseScheduling(runId, mut(1, 'pre-freeze'))
    await h.locks.acquire(String(DOC), v1.versionId, 'alice', 60_000)
    expect((await h.tasks.getPhaseRun(runId))?.schedulingFrozen).toBe(true)
  })

  it('rejects blank and non-string identifiers', async () => {
    const h = await harness()
    current = h.ctx
    await expect(h.locks.acquire(42 as unknown as string, 'v', 'alice', 60_000)).rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(h.locks.acquire(String(DOC), ' ', 'alice', 60_000)).rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(h.locks.acquire(String(DOC), 'v', '  ', 60_000)).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('rejects a non-positive, non-finite, or non-numeric ttl', async () => {
    const h = await harness()
    current = h.ctx
    const v1 = await h.deliverables.saveVersion(DOC, null, null)
    await expect(h.locks.acquire(String(DOC), v1.versionId, 'alice', 0)).rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(h.locks.acquire(String(DOC), v1.versionId, 'alice', -5)).rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(h.locks.acquire(String(DOC), v1.versionId, 'alice', Number.NaN)).rejects.toMatchObject({ code: 'invalid-argument' })
    await expect(h.locks.acquire(String(DOC), v1.versionId, 'alice', 'x' as unknown as number)).rejects.toMatchObject({ code: 'invalid-argument' })
  })

  it('fails loud before the domain opens', async () => {
    const ctx = new Context()
    current = ctx
    const service = new EditLockService(ctx)
    expect(() => service.listActive()).toThrow(expect.objectContaining({ code: 'not-found' }))
  })
})

describe('lease never exempts the version-chain base check', () => {
  it('still rejects a save whose base is not the latest version while held', async () => {
    const h = await harness()
    current = h.ctx
    const v1 = await h.deliverables.saveVersion(DOC, null, null)
    await h.locks.acquire(String(DOC), v1.versionId, 'alice', 60_000)
    const v2 = await h.deliverables.saveVersion(DOC, v1.versionId, null)
    await expect(h.deliverables.saveVersion(DOC, v1.versionId, null))
      .rejects.toMatchObject({ code: 'stale-write' })
    expect(v2.versionId).toBeDefined()
  })
})
