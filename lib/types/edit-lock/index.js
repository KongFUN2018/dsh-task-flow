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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { Service } from '@deepseek-ai/cordis';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { setInterval, clearInterval } from 'node:timers';
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import "../task/index.js";
import "../deliverable/index.js";
import "../workbench/journal/index.js";
import { EditLeaseId as EditLeaseIdValue, EDIT_LOCK_UNTASKED_TASK_ID } from "./runtime.js";
import { editLockDomainSpec } from "./spec.js";
import { EditLockError } from "./types.js";
export { EditLeaseId } from "./runtime.js";
export { editLockDomainSpec, leaseSchema } from "./spec.js";
export { EditLockError } from "./types.js";
/** The actor recorded on edit-lock facts. */
const FACT_ACTOR = 'edit-lock';
/**
 * Edit-lock service: durable lease records over deliverable versions.
 */
let EditLockService = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _acquire_decorators;
    let _renew_decorators;
    let _release_decorators;
    let _listActive_decorators;
    return class EditLockService extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _acquire_decorators = [Remote('acquire')];
            _renew_decorators = [Remote('renew')];
            _release_decorators = [Remote('release')];
            _listActive_decorators = [Remote('listActive')];
            __esDecorate(this, null, _acquire_decorators, { kind: "method", name: "acquire", static: false, private: false, access: { has: obj => "acquire" in obj, get: obj => obj.acquire }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _renew_decorators, { kind: "method", name: "renew", static: false, private: false, access: { has: obj => "renew" in obj, get: obj => obj.renew }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _release_decorators, { kind: "method", name: "release", static: false, private: false, access: { has: obj => "release" in obj, get: obj => obj.release }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listActive_decorators, { kind: "method", name: "listActive", static: false, private: false, access: { has: obj => "listActive" in obj, get: obj => obj.listActive }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        /** The service needs the lease domain, the journal, the task commands, and the deliverable domain. */
        static { this.inject = ['storageDomain', 'workbenchJournal', 'tasks', 'deliverables']; }
        /** Deploy-variable sweep cadence; the lease TTL is an acquire argument. */
        static { this.Config = z.object({
            sweepIntervalMs: z.number().int().min(50).default(5000),
        }).default({ sweepIntervalMs: 5000 }); }
        /**
         * @param ctx - Host context carrying storage-domain, journal, tasks, and deliverables.
         * @param config - Optional service configuration.
         */
        constructor(ctx, config = { sweepIntervalMs: 5000 }) {
            super(ctx, 'editLock');
            this.leases = __runInitializers(this, _instanceExtraInitializers);
            /** Serializes read-validate-write mutations so concurrent writers never interleave. */
            this.mutationTail = Promise.resolve();
            this.sweepIntervalMs = config.sweepIntervalMs;
        }
        /** Open and own the edit-lock domain, start the sweep, and release leases of cancelled tasks. */
        async [Service.init]() {
            const domain = await this.ctx.storageDomain.open(editLockDomainSpec);
            this.ctx.effect(() => async () => {
                await domain.close();
            }, 'edit-lock.domainClose');
            this.leases = domain.table('leases');
            const timer = setInterval(() => { void this.enqueue(() => this.expireDueNow()); }, this.sweepIntervalMs);
            this.ctx.effect(() => () => { clearInterval(timer); }, 'edit-lock.sweepTimer');
            this.ctx.on('task/updated', (task) => {
                if (task.state === 'cancelling' || task.state === 'cancelled')
                    void this.releaseTaskLeases(task.taskId);
            }, { global: true });
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
        async acquire(deliverableId, targetVersionId, owner, ttlMs, taskId) {
            const deliverable = this.requireText(deliverableId, 'deliverableId');
            const target = this.requireText(targetVersionId, 'targetVersionId');
            const ownerName = this.requireText(owner, 'owner');
            const ttl = this.requireTtl(ttlMs);
            const task = taskId === undefined || taskId === null ? undefined : this.requireText(taskId, 'taskId');
            return this.enqueue(() => this.acquireNow(deliverable, target, ownerName, ttl, task));
        }
        /**
         * Renew a lease: advance renewedAt and expiresAt. A lapsed lease fails loud.
         * @param leaseId - raw lease identifier.
         * @param expectedRevision - the lease's current compare-and-set revision.
         * @param ttlMs - renewed time-to-live in milliseconds.
         * @returns the renewed lease.
         */
        async renew(leaseId, expectedRevision, ttlMs) {
            const id = this.requireText(leaseId, 'leaseId');
            const ttl = this.requireTtl(ttlMs);
            return this.enqueue(() => this.renewNow(id, expectedRevision, ttl));
        }
        /**
         * Release a lease explicitly and clear the consumer freezes it holds.
         * Releasing an already-released or expired lease returns it unchanged.
         * @param leaseId - raw lease identifier.
         * @param expectedRevision - the lease's current compare-and-set revision.
         * @param actor - actor releasing the lease.
         * @returns the released lease.
         */
        async release(leaseId, expectedRevision, actor) {
            const id = this.requireText(leaseId, 'leaseId');
            const actorName = this.requireText(actor, 'actor');
            return this.enqueue(() => this.releaseNow(id, expectedRevision, actorName));
        }
        /**
         * List active leases, optionally filtered to one task.
         * @param taskId - optional owning task filter.
         * @returns the active leases, newest expiry last in no particular order.
         */
        listActive(taskId) {
            const leases = this.requireLeases();
            const now = Date.now();
            const active = [];
            for (const [, lease] of leases.entries()) {
                if (lease.state !== 'active')
                    continue;
                if (lease.expiresAt <= now)
                    continue;
                if (taskId !== undefined && taskId !== null && String(lease.taskId ?? '') !== taskId)
                    continue;
                active.push(lease);
            }
            return active;
        }
        async acquireNow(deliverable, target, owner, ttl, task) {
            await this.expireDueNow();
            const version = this.ctx.deliverables.getVersion(String(target));
            if (version === undefined) {
                throw new EditLockError('not-found', `no deliverable version ${String(target)}`);
            }
            if (version.deliverableId !== deliverable) {
                throw new EditLockError('invalid-argument', 'target version belongs to another deliverable');
            }
            const existing = this.activeLeaseOf(deliverable);
            if (existing !== undefined) {
                if (existing.taskId === task && existing.owner === owner && existing.targetVersionId === target) {
                    return existing;
                }
                throw new EditLockError('lock-held', `deliverable ${String(deliverable)} is already leased by ${existing.owner} until ${existing.expiresAt}`, existing.owner, existing.expiresAt);
            }
            const now = Date.now();
            const lease = {
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
            };
            await this.appendFact('edit-lock/acquired', lease);
            await this.requireLeases().put(String(lease.leaseId), lease);
            await this.freezeConsumers(lease);
            return lease;
        }
        async renewNow(id, expectedRevision, ttl) {
            await this.expireDueNow();
            const lease = this.loadLeaseOrThrow(id);
            if (lease.state !== 'active') {
                throw new EditLockError('invalid-transition', `lease is ${lease.state}`);
            }
            if (lease.entityRevision !== expectedRevision) {
                throw new EditLockError('invalid-transition', 'lease revision mismatch');
            }
            const now = Date.now();
            const next = {
                ...lease,
                renewedAt: now,
                expiresAt: now + ttl,
                entityRevision: lease.entityRevision + 1,
            };
            await this.appendFact('edit-lock/renewed', next);
            await this.requireLeases().put(String(id), next);
            return next;
        }
        async releaseNow(id, expectedRevision, _actor) {
            await this.expireDueNow();
            const lease = this.loadLeaseOrThrow(id);
            if (lease.state !== 'active')
                return lease;
            if (lease.entityRevision !== expectedRevision) {
                throw new EditLockError('invalid-transition', 'lease revision mismatch');
            }
            const next = { ...lease, state: 'released', entityRevision: lease.entityRevision + 1 };
            await this.appendFact('edit-lock/released', next);
            await this.requireLeases().put(String(id), next);
            await this.unfreezeConsumers(lease);
            return next;
        }
        /** Lapse every active lease whose expiry passed; the sweep and every write path call this. */
        async expireDueNow() {
            const now = Date.now();
            for (const [, lease] of [...this.requireLeases().entries()]) {
                if (lease.state === 'active' && lease.expiresAt <= now)
                    await this.expireOne(lease);
            }
        }
        async expireOne(lease) {
            const next = { ...lease, state: 'expired', entityRevision: lease.entityRevision + 1 };
            await this.appendFact('edit-lock/expired', next);
            await this.requireLeases().put(String(lease.leaseId), next);
            await this.unfreezeConsumers(lease);
        }
        /** Release every active lease owned by one task; the task-updated listener calls this on cancel. */
        async releaseTaskLeases(taskId) {
            await this.enqueue(async () => {
                await this.expireDueNow();
                for (const [, lease] of [...this.requireLeases().entries()]) {
                    if (lease.state !== 'active' || lease.taskId !== taskId)
                        continue;
                    const next = { ...lease, state: 'released', entityRevision: lease.entityRevision + 1 };
                    await this.appendFact('edit-lock/released', next);
                    await this.requireLeases().put(String(lease.leaseId), next);
                    await this.unfreezeConsumers(lease);
                }
            });
        }
        /** Freeze the phase runs consuming the leased version from scheduling. */
        async freezeConsumers(lease) {
            for (const runId of this.ctx.deliverables.listConsumingPhaseRuns(String(lease.targetVersionId))) {
                const run = await this.ctx.tasks.getPhaseRun(String(runId));
                if (run === undefined || run.schedulingFrozen === true)
                    continue;
                await this.ctx.tasks.freezePhaseScheduling(String(runId), this.freezeMutation(lease, run.revision, true));
            }
        }
        /** Clear the consumer freezes a lease held. */
        async unfreezeConsumers(lease) {
            for (const runId of this.ctx.deliverables.listConsumingPhaseRuns(String(lease.targetVersionId))) {
                const run = await this.ctx.tasks.getPhaseRun(String(runId));
                if (run === undefined || run.schedulingFrozen !== true)
                    continue;
                await this.ctx.tasks.clearPhaseScheduling(String(runId), this.freezeMutation(lease, run.revision, false));
            }
        }
        freezeMutation(lease, runRevision, freeze) {
            return {
                actor: lease.owner,
                reason: `edit-lock ${freeze ? 'acquired' : 'released'} on ${String(lease.targetVersionId)}`,
                expectedRevision: runRevision,
                idempotencyKey: `edit-lock:${freeze ? 'freeze' : 'unfreeze'}:${String(lease.leaseId)}:${String(lease.targetVersionId)}`,
            };
        }
        activeLeaseOf(deliverable) {
            for (const [, lease] of this.requireLeases().entries()) {
                if (lease.state === 'active' && lease.expiresAt > Date.now() && lease.deliverableId === deliverable)
                    return lease;
            }
            return undefined;
        }
        loadLeaseOrThrow(id) {
            const lease = this.requireLeases().get(String(id));
            if (lease === undefined)
                throw new EditLockError('not-found', `no lease ${String(id)}`);
            return lease;
        }
        async appendFact(kind, lease) {
            const payload = {
                leaseId: String(lease.leaseId),
                deliverableId: String(lease.deliverableId),
                targetVersionId: String(lease.targetVersionId),
                ...(lease.taskId === undefined ? {} : { taskId: String(lease.taskId) }),
                owner: lease.owner,
                acquiredAt: lease.acquiredAt,
                renewedAt: lease.renewedAt,
                expiresAt: lease.expiresAt,
                state: lease.state,
            };
            const label = kind.split('/')[1];
            await this.ctx.workbenchJournal.append({
                taskId: lease.taskId ?? EDIT_LOCK_UNTASKED_TASK_ID,
                kind,
                actor: FACT_ACTOR,
                idempotencyKey: `edit-lock/${label}:${String(lease.leaseId)}:${lease.entityRevision}`,
                entityRevision: lease.entityRevision,
                payload,
            });
        }
        requireLeases() {
            if (this.leases === undefined)
                throw new EditLockError('not-found', 'edit_lock domain is not open');
            return this.leases;
        }
        requireText(value, field) {
            if (typeof value !== 'string' || value.trim() === '') {
                throw new EditLockError('invalid-argument', `${field} must be a non-blank string`);
            }
            return value;
        }
        requireTtl(ttlMs) {
            if (typeof ttlMs !== 'number' || !Number.isFinite(ttlMs) || ttlMs <= 0) {
                throw new EditLockError('invalid-argument', 'ttlMs must be a positive number');
            }
            return Math.floor(ttlMs);
        }
        /** Run one mutation after every earlier one settles. */
        enqueue(step) {
            const result = this.mutationTail.then(step);
            this.mutationTail = result.then(() => undefined, () => undefined);
            return result;
        }
    };
})();
export { EditLockService };
export default EditLockService;
//# sourceMappingURL=index.js.map