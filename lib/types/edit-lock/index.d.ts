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
import { Context } from '@deepseek-ai/cordis';
import { Service } from '@deepseek-ai/cordis';
import { z } from 'zod';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import '../task/index.ts';
import '../deliverable/index.ts';
import '../workbench/journal/index.ts';
import type { EditLease } from './types.ts';
export type * from './types.ts';
export { EditLeaseId } from './runtime.ts';
export { editLockDomainSpec, leaseSchema } from './spec.ts';
export { EditLockError } from './types.ts';
/** Service configuration. */
interface Config {
    /** How often the expiry sweep scans for lapsed leases. */
    sweepIntervalMs: number;
}
declare module '@deepseek-ai/cordis' {
    interface Context {
        editLock: EditLockService;
    }
}
/**
 * Edit-lock service: durable lease records over deliverable versions.
 */
export declare class EditLockService extends TypertRemoteService {
    /** The service needs the lease domain, the journal, the task commands, and the deliverable domain. */
    static inject: string[];
    /** Deploy-variable sweep cadence; the lease TTL is an acquire argument. */
    static Config: z.ZodType<Config>;
    private leases?;
    /** Serializes read-validate-write mutations so concurrent writers never interleave. */
    private mutationTail;
    private readonly sweepIntervalMs;
    /**
     * @param ctx - Host context carrying storage-domain, journal, tasks, and deliverables.
     * @param config - Optional service configuration.
     */
    constructor(ctx: Context, config?: Config);
    /** Open and own the edit-lock domain, start the sweep, and release leases of cancelled tasks. */
    protected [Service.init](): Promise<void>;
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
    acquire(deliverableId: string, targetVersionId: string, owner: string, ttlMs: number, taskId?: string | null): Promise<EditLease>;
    /**
     * Renew a lease: advance renewedAt and expiresAt. A lapsed lease fails loud.
     * @param leaseId - raw lease identifier.
     * @param expectedRevision - the lease's current compare-and-set revision.
     * @param ttlMs - renewed time-to-live in milliseconds.
     * @returns the renewed lease.
     */
    renew(leaseId: string, expectedRevision: number, ttlMs: number): Promise<EditLease>;
    /**
     * Release a lease explicitly and clear the consumer freezes it holds.
     * Releasing an already-released or expired lease returns it unchanged.
     * @param leaseId - raw lease identifier.
     * @param expectedRevision - the lease's current compare-and-set revision.
     * @param actor - actor releasing the lease.
     * @returns the released lease.
     */
    release(leaseId: string, expectedRevision: number, actor: string): Promise<EditLease>;
    /**
     * List active leases, optionally filtered to one task.
     * @param taskId - optional owning task filter.
     * @returns the active leases, newest expiry last in no particular order.
     */
    listActive(taskId?: string | null): EditLease[];
    private acquireNow;
    private renewNow;
    private releaseNow;
    /** Lapse every active lease whose expiry passed; the sweep and every write path call this. */
    private expireDueNow;
    private expireOne;
    /** Release every active lease owned by one task; the task-updated listener calls this on cancel. */
    private releaseTaskLeases;
    /** Freeze the phase runs consuming the leased version from scheduling. */
    private freezeConsumers;
    /** Clear the consumer freezes a lease held. */
    private unfreezeConsumers;
    private freezeMutation;
    private activeLeaseOf;
    private loadLeaseOrThrow;
    private appendFact;
    private requireLeases;
    private requireText;
    private requireTtl;
    /** Run one mutation after every earlier one settles. */
    private enqueue;
}
export default EditLockService;
//# sourceMappingURL=index.d.ts.map