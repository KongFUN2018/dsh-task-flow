/**
 * Edit lock (`ctx.editLock`): durable leases over deliverable versions.
 * Acquisition is first-write-wins — a held target fails loud with the
 * current holder and expiry — and freezes scheduling of the phase runs that
 * consume the target version; release or expiry clears the freeze. Timeout
 * only breaks the lease, never commits a local buffer, and a lease never
 * exempts the version-chain base check. Leases of a task that enters
 * cancelling/cancelled are released through the task-updated listener.
 * @module @deepseek-ai/dsh-edit-lock
 */

import { Context } from '@deepseek-ai/cordis'
import { Service } from '@deepseek-ai/cordis'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { setInterval, clearInterval } from 'node:timers'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import '../task/index.ts'
import '../deliverable/index.ts'
import '../workbench/journal/index.ts'
import type { KvTable } from '@deepseek-ai/dsh-storage-domain'
import type { TaskId, TaskRecord, TaskMutationContext } from '../task/types.ts'
import type { JournalPayload } from '../workbench/journal/types.ts'
import type { DeliverableId, DeliverableVersionId } from '../deliverable/types.ts'
import { EditLeaseId as EditLeaseIdValue, EDIT_LOCK_UNTASKED_TASK_ID } from './runtime.ts'
import { editLockDomainSpec } from './spec.ts'
import { EditLockError } from './types.ts'
import type { EditLease, EditLeaseId, EditLockFactKind } from './types.ts'

export type * from './types.ts'
export { EditLeaseId } from './runtime.ts'
export { editLockDomainSpec, leaseSchema } from './spec.ts'
export { EditLockError } from './types.ts'

/** Service configuration. */
interface Config {
  /** How often the expiry sweep scans for lapsed leases. */
  sweepIntervalMs: number
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    editLock: EditLockService
  }
}

/** The actor recorded on edit-lock facts. */
const FACT_ACTOR = 'edit-lock'

/**
 * Edit-lock service: durable lease records over deliverable versions.
 */
export class EditLockService extends TypertRemoteService {
  /** The service needs the lease domain, the journal, the task commands, and the deliverable domain. */
  static inject = ['storageDomain', 'workbenchJournal', 'tasks', 'deliverables']

  /** Deploy-variable sweep cadence; the lease TTL is an acquire argument. */
  static Config: z.ZodType<Config> = z.object({
    sweepIntervalMs: z.number().int().min(50).default(5000),
  }).default({ sweepIntervalMs: 5000 })

  private leases?: KvTable<string, EditLease>
  /** Serializes read-validate-write mutations so concurrent writers never interleave. */
  private mutationTail: Promise<void> = Promise.resolve()
  private readonly sweepIntervalMs: number

  /**
   * @param ctx - Host context carrying storage-domain, journal, tasks, and deliverables.
   * @param config - Optional service configuration.
   */
  constructor(ctx: Context, config: Config = { sweepIntervalMs: 5000 }) {
    super(ctx, 'editLock')
    this.sweepIntervalMs = config.sweepIntervalMs
  }

  /** Open and own the edit-lock domain, start the sweep, and release leases of cancelled tasks. */
  protected async [Service.init](): Promise<void> {
    const domain = await this.ctx.storageDomain.open(editLockDomainSpec)
    this.ctx.effect(() => async () => {
      await domain.close()
    }, 'edit-lock.domainClose')
    this.leases = domain.table('leases')
    const timer = setInterval(() => { void this.enqueue(() => this.expireDueNow()) }, this.sweepIntervalMs)
    this.ctx.effect(() => () => { clearInterval(timer) }, 'edit-lock.sweepTimer')
    this.ctx.on('task/updated', (task: TaskRecord) => {
      if (task.state === 'cancelling' || task.state === 'cancelled') void this.releaseTaskLeases(task.taskId)
    }, { global: true })
  }

  /**
   * Acquire a lease on one deliverable version. First write wins: a held
   * target fails loud with the current holder and expiry. Acquiring also
   * freezes scheduling of the phase runs that consume the target version.
   * @param deliverableId - raw deliverable identifier.
   * @param targetVersionId - raw version the holder edits; must belong to the deliverable.
   * @param owner - actor holding the lease.
   * @param ttlMs - lease time-to-live in milliseconds.
   * @param taskId - optional owning task; cancelled tasks release their leases.
   * @returns the stored lease.
   */
  @Remote('acquire')
  async acquire(deliverableId: string, targetVersionId: string, owner: string, ttlMs: number, taskId?: string | null): Promise<EditLease> {
    const deliverable = this.requireText(deliverableId, 'deliverableId') as DeliverableId
    const target = this.requireText(targetVersionId, 'targetVersionId') as DeliverableVersionId
    const ownerName = this.requireText(owner, 'owner')
    const ttl = this.requireTtl(ttlMs)
    const task = taskId === undefined || taskId === null ? undefined : this.requireText(taskId, 'taskId') as TaskId
    return this.enqueue(() => this.acquireNow(deliverable, target, ownerName, ttl, task))
  }

  /**
   * Renew a lease: advance renewedAt and expiresAt. A lapsed lease fails loud.
   * @param leaseId - raw lease identifier.
   * @param expectedRevision - the lease's current compare-and-set revision.
   * @param ttlMs - renewed time-to-live in milliseconds.
   * @returns the renewed lease.
   */
  @Remote('renew')
  async renew(leaseId: string, expectedRevision: number, ttlMs: number): Promise<EditLease> {
    const id = this.requireText(leaseId, 'leaseId') as EditLeaseId
    const ttl = this.requireTtl(ttlMs)
    return this.enqueue(() => this.renewNow(id, expectedRevision, ttl))
  }

  /**
   * Release a lease explicitly and clear the consumer freezes it holds.
   * Releasing an already-released or expired lease returns it unchanged.
   * @param leaseId - raw lease identifier.
   * @param expectedRevision - the lease's current compare-and-set revision.
   * @param actor - actor releasing the lease.
   * @returns the released lease.
   */
  @Remote('release')
  async release(leaseId: string, expectedRevision: number, actor: string): Promise<EditLease> {
    const id = this.requireText(leaseId, 'leaseId') as EditLeaseId
    const actorName = this.requireText(actor, 'actor')
    return this.enqueue(() => this.releaseNow(id, expectedRevision, actorName))
  }

  /**
   * List active leases, optionally filtered to one task.
   * @param taskId - optional owning task filter.
   * @returns the active leases, newest expiry last in no particular order.
   */
  @Remote('listActive')
  listActive(taskId?: string | null): EditLease[] {
    const leases = this.requireLeases()
    const now = Date.now()
    const active: EditLease[] = []
    for (const [, lease] of leases.entries()) {
      if (lease.state !== 'active') continue
      if (lease.expiresAt <= now) continue
      if (taskId !== undefined && taskId !== null && String(lease.taskId ?? '') !== taskId) continue
      active.push(lease)
    }
    return active
  }

  private async acquireNow(
    deliverable: DeliverableId,
    target: DeliverableVersionId,
    owner: string,
    ttl: number,
    task: TaskId | undefined,
  ): Promise<EditLease> {
    await this.expireDueNow()
    const version = this.ctx.deliverables.getVersion(String(target))
    if (version === undefined) {
      throw new EditLockError('not-found', `no deliverable version ${String(target)}`)
    }
    if (version.deliverableId !== deliverable) {
      throw new EditLockError('invalid-argument', 'target version belongs to another deliverable')
    }
    const existing = this.activeLeaseOf(deliverable)
    if (existing !== undefined) {
      if (existing.taskId === task && existing.owner === owner && existing.targetVersionId === target) {
        return existing
      }
      throw new EditLockError(
        'lock-held',
        `deliverable ${String(deliverable)} is already leased by ${existing.owner} until ${existing.expiresAt}`,
        existing.owner,
        existing.expiresAt,
      )
    }
    const now = Date.now()
    const lease: EditLease = {
      leaseId: EditLeaseIdValue(randomUUID()),
      ...(task === undefined ? {} : { taskId: task }),
      deliverableId: deliverable,
      targetVersionId: target,
      owner,
      acquiredAt: now,
      renewedAt: now,
      expiresAt: now + ttl,
      entityRevision: 1,
      state: 'active',
    }
    await this.appendFact('edit-lock/acquired', lease)
    await this.requireLeases().put(String(lease.leaseId), lease)
    await this.freezeConsumers(lease)
    return lease
  }

  private async renewNow(id: EditLeaseId, expectedRevision: number, ttl: number): Promise<EditLease> {
    await this.expireDueNow()
    const lease = this.loadLeaseOrThrow(id)
    if (lease.state !== 'active') {
      throw new EditLockError('invalid-transition', `lease is ${lease.state}`)
    }
    if (lease.entityRevision !== expectedRevision) {
      throw new EditLockError('invalid-transition', 'lease revision mismatch')
    }
    const now = Date.now()
    const next: EditLease = {
      ...lease,
      renewedAt: now,
      expiresAt: now + ttl,
      entityRevision: lease.entityRevision + 1,
    }
    await this.appendFact('edit-lock/renewed', next)
    await this.requireLeases().put(String(id), next)
    return next
  }

  private async releaseNow(id: EditLeaseId, expectedRevision: number, _actor: string): Promise<EditLease> {
    await this.expireDueNow()
    const lease = this.loadLeaseOrThrow(id)
    if (lease.state !== 'active') return lease
    if (lease.entityRevision !== expectedRevision) {
      throw new EditLockError('invalid-transition', 'lease revision mismatch')
    }
    const next: EditLease = { ...lease, state: 'released', entityRevision: lease.entityRevision + 1 }
    await this.appendFact('edit-lock/released', next)
    await this.requireLeases().put(String(id), next)
    await this.unfreezeConsumers(lease)
    return next
  }

  /** Lapse every active lease whose expiry passed; the sweep and every write path call this. */
  private async expireDueNow(): Promise<void> {
    const now = Date.now()
    for (const [, lease] of [...this.requireLeases().entries()]) {
      if (lease.state === 'active' && lease.expiresAt <= now) await this.expireOne(lease)
    }
  }

  private async expireOne(lease: EditLease): Promise<void> {
    const next: EditLease = { ...lease, state: 'expired', entityRevision: lease.entityRevision + 1 }
    await this.appendFact('edit-lock/expired', next)
    await this.requireLeases().put(String(lease.leaseId), next)
    await this.unfreezeConsumers(lease)
  }

  /** Release every active lease owned by one task; the task-updated listener calls this on cancel. */
  private async releaseTaskLeases(taskId: TaskId): Promise<void> {
    await this.enqueue(async () => {
      await this.expireDueNow()
      for (const [, lease] of [...this.requireLeases().entries()]) {
        if (lease.state !== 'active' || lease.taskId !== taskId) continue
        const next: EditLease = { ...lease, state: 'released', entityRevision: lease.entityRevision + 1 }
        await this.appendFact('edit-lock/released', next)
        await this.requireLeases().put(String(lease.leaseId), next)
        await this.unfreezeConsumers(lease)
      }
    })
  }

  /** Freeze the phase runs consuming the leased version from scheduling. */
  private async freezeConsumers(lease: EditLease): Promise<void> {
    for (const runId of this.ctx.deliverables.listConsumingPhaseRuns(String(lease.targetVersionId))) {
      const run = await this.ctx.tasks.getPhaseRun(String(runId))
      if (run === undefined || run.schedulingFrozen === true) continue
      await this.ctx.tasks.freezePhaseScheduling(String(runId), this.freezeMutation(lease, run.revision, true))
    }
  }

  /** Clear the consumer freezes a lease held. */
  private async unfreezeConsumers(lease: EditLease): Promise<void> {
    for (const runId of this.ctx.deliverables.listConsumingPhaseRuns(String(lease.targetVersionId))) {
      const run = await this.ctx.tasks.getPhaseRun(String(runId))
      if (run === undefined || run.schedulingFrozen !== true) continue
      await this.ctx.tasks.clearPhaseScheduling(String(runId), this.freezeMutation(lease, run.revision, false))
    }
  }

  private freezeMutation(lease: EditLease, runRevision: number, freeze: boolean): TaskMutationContext {
    return {
      actor: lease.owner,
      reason: `edit-lock ${freeze ? 'acquired' : 'released'} on ${String(lease.targetVersionId)}`,
      expectedRevision: runRevision,
      idempotencyKey: `edit-lock:${freeze ? 'freeze' : 'unfreeze'}:${String(lease.leaseId)}:${String(lease.targetVersionId)}`,
    }
  }

  private activeLeaseOf(deliverable: DeliverableId): EditLease | undefined {
    for (const [, lease] of this.requireLeases().entries()) {
      if (lease.state === 'active' && lease.expiresAt > Date.now() && lease.deliverableId === deliverable) return lease
    }
    return undefined
  }

  private loadLeaseOrThrow(id: EditLeaseId): EditLease {
    const lease = this.requireLeases().get(String(id))
    if (lease === undefined) throw new EditLockError('not-found', `no lease ${String(id)}`)
    return lease
  }

  private async appendFact(kind: EditLockFactKind, lease: EditLease): Promise<void> {
    const payload: JournalPayload = {
      leaseId: String(lease.leaseId),
      deliverableId: String(lease.deliverableId),
      targetVersionId: String(lease.targetVersionId),
      ...(lease.taskId === undefined ? {} : { taskId: String(lease.taskId) }),
      owner: lease.owner,
      acquiredAt: lease.acquiredAt,
      renewedAt: lease.renewedAt,
      expiresAt: lease.expiresAt,
      state: lease.state,
    }
    const label = kind.split('/')[1]
    await this.ctx.workbenchJournal.append({
      taskId: lease.taskId ?? EDIT_LOCK_UNTASKED_TASK_ID,
      kind,
      actor: FACT_ACTOR,
      idempotencyKey: `edit-lock/${label}:${String(lease.leaseId)}:${lease.entityRevision}`,
      entityRevision: lease.entityRevision,
      payload,
    })
  }

  private requireLeases(): KvTable<string, EditLease> {
    if (this.leases === undefined) throw new EditLockError('not-found', 'edit_lock domain is not open')
    return this.leases
  }

  private requireText(value: string, field: string): string {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new EditLockError('invalid-argument', `${field} must be a non-blank string`)
    }
    return value
  }

  private requireTtl(ttlMs: number): number {
    if (typeof ttlMs !== 'number' || !Number.isFinite(ttlMs) || ttlMs <= 0) {
      throw new EditLockError('invalid-argument', 'ttlMs must be a positive number')
    }
    return Math.floor(ttlMs)
  }

  /** Run one mutation after every earlier one settles. */
  private enqueue<T>(step: () => Promise<T>): Promise<T> {
    const result = this.mutationTail.then(step)
    this.mutationTail = result.then(() => undefined, () => undefined)
    return result
  }
}

export default EditLockService
