/**
 * Workbench journal (`ctx.workbenchJournal`): the task-flow append-only fact
 * source over one storageDomain unit. `append` assigns a gapless monotonic
 * journalSeq and is the commit point of every task-flow entity mutation �? * entity projections are rebuildable from `replay`, so Cordis events stay
 * droppable wake-ups. No journal-specific events exist by design.
 * @module @deepseek-ai/dsh-workbench-journal
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
import { randomUUID } from 'node:crypto';
import { Service } from '@deepseek-ai/cordis';
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { JournalEventId } from "./runtime.js";
import { journalSeqKey, workbenchJournalDomainSpec } from "./spec.js";
import { JournalError } from "./types.js";
export { JournalEventId } from "./runtime.js";
export { JOURNAL_SEQ_KEY_WIDTH, journalFactSchema, journalSeqKey, workbenchJournalDomainSpec, } from "./spec.js";
export { JournalError } from "./types.js";
/** Envelope schema version this service appends. */
const FACT_SCHEMA_VERSION = 1;
/** Append-only journal service; the durable truth task-flow projections rebuild from. */
let WorkbenchJournalService = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _append_decorators;
    let _checkpoint_decorators;
    let _replay_decorators;
    return class WorkbenchJournalService extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _append_decorators = [Remote('append')];
            _checkpoint_decorators = [Remote('checkpoint')];
            _replay_decorators = [Remote('replay')];
            __esDecorate(this, null, _append_decorators, { kind: "method", name: "append", static: false, private: false, access: { has: obj => "append" in obj, get: obj => obj.append }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _checkpoint_decorators, { kind: "method", name: "checkpoint", static: false, private: false, access: { has: obj => "checkpoint" in obj, get: obj => obj.checkpoint }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _replay_decorators, { kind: "method", name: "replay", static: false, private: false, access: { has: obj => "replay" in obj, get: obj => obj.replay }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        /** The journal opens its domain on the mounted storage-domain facility. */
        static { this.inject = ['storageDomain']; }
        /**
         * @param ctx - Host context carrying the storage-domain facility.
         */
        constructor(ctx) {
            super(ctx, 'workbenchJournal');
            this.entries = __runInitializers(this, _instanceExtraInitializers);
            /** Highest assigned journalSeq; derived from stored keys at open. */
            this.head = 0;
            /** Serializes seq allocation with the durable write; keeps appends gapless. */
            this.appendTail = Promise.resolve();
        }
        /** Open and own the journal domain; derive head from the stored facts. */
        async [Service.init]() {
            const domain = await this.ctx.storageDomain.open(workbenchJournalDomainSpec);
            this.ctx.effect(() => async () => {
                await domain.close();
            }, 'workbench-journal.domainClose');
            const entries = domain.table('entries');
            for (const key of entries.keys()) {
                const seq = Number(key);
                if (Number.isSafeInteger(seq) && seq > this.head)
                    this.head = seq;
            }
            this.entries = entries;
        }
        /**
         * Append one fact; the durable write is the commit point of the mutation
         * it records. A replay of the same idempotency key with identical caller
         * fields returns the stored fact; with different fields it fails loud.
         * @param fact - caller-supplied fields; the journal assigns the envelope.
         * @returns the stored fact with its assigned journalSeq and eventId.
         */
        async append(fact) {
            const input = this.validateInput(fact);
            const existing = this.findByIdempotencyKey(input.idempotencyKey);
            if (existing !== undefined) {
                if (this.callerFieldsMatch(existing, input))
                    return existing;
                throw new JournalError('idempotency-conflict', `idempotency key "${input.idempotencyKey}" was already appended with different caller fields`);
            }
            const appended = this.appendTail.then(() => this.appendNow(input));
            this.appendTail = appended.then(() => undefined, () => undefined);
            return appended;
        }
        /**
         * Recovery and client-resync position: the highest assigned journalSeq.
         * @returns the checkpoint; `journalSeq` is 0 when the journal is empty.
         */
        checkpoint() {
            return { journalSeq: this.head };
        }
        /**
         * Read every fact after one sequence position, in journal order. The
         * authoritative resynchronization path: projections and clients rebuild
         * from replay, never from events.
         * @param afterSeq - exclusive lower bound; 0 replays the whole journal.
         * @returns facts with `journalSeq > afterSeq`, ascending.
         */
        replay(afterSeq) {
            if (!Number.isSafeInteger(afterSeq) || afterSeq < 0) {
                throw new JournalError('invalid-argument', `afterSeq must be a non-negative safe integer, got ${String(afterSeq)}`);
            }
            const entries = this.requireEntries();
            const facts = [];
            for (let seq = afterSeq + 1; seq <= this.head; seq += 1) {
                const fact = entries.get(journalSeqKey(seq));
                if (fact === undefined) {
                    throw new JournalError('invalid-fact', `journal has no fact ${String(seq)}: the sequence must be gapless`);
                }
                facts.push(fact);
            }
            return facts;
        }
        /** Validate every caller-supplied field; envelope fields stay journal-assigned. */
        validateInput(fact) {
            const requireText = (value, field) => {
                if (typeof value !== 'string' || value.trim().length === 0) {
                    throw new JournalError('invalid-fact', `${field} must be a non-empty string`);
                }
                return value.trim();
            };
            if (!Number.isSafeInteger(fact.entityRevision) || fact.entityRevision < 1) {
                throw new JournalError('invalid-fact', `entityRevision must be a positive safe integer, got ${String(fact.entityRevision)}`);
            }
            return {
                taskId: requireText(fact.taskId, 'taskId'),
                kind: requireText(fact.kind, 'kind'),
                actor: requireText(fact.actor, 'actor'),
                idempotencyKey: requireText(fact.idempotencyKey, 'idempotencyKey'),
                entityRevision: fact.entityRevision,
                payload: fact.payload,
                ...(fact.causationId === undefined ? {} : { causationId: requireText(fact.causationId, 'causationId') }),
                ...(fact.correlationId === undefined ? {} : { correlationId: requireText(fact.correlationId, 'correlationId') }),
            };
        }
        /** One serialized allocation-and-write step; the durable put is the commit point. */
        async appendNow(input) {
            const entries = this.requireEntries();
            const fact = {
                journalSeq: this.head + 1,
                eventId: JournalEventId(randomUUID()),
                taskId: input.taskId,
                kind: input.kind,
                occurredAt: Date.now(),
                actor: input.actor,
                ...(input.causationId === undefined ? {} : { causationId: input.causationId }),
                ...(input.correlationId === undefined ? {} : { correlationId: input.correlationId }),
                idempotencyKey: input.idempotencyKey,
                entityRevision: input.entityRevision,
                payload: input.payload,
                schemaVersion: FACT_SCHEMA_VERSION,
            };
            await entries.put(journalSeqKey(fact.journalSeq), fact);
            this.head = fact.journalSeq;
            return fact;
        }
        /** Scan for a stored fact under one idempotency key; M1 scale is a linear scan. */
        findByIdempotencyKey(key) {
            for (const fact of this.requireEntries().entries()) {
                if (fact[1].idempotencyKey === key)
                    return fact[1];
            }
            return undefined;
        }
        /** Whether a stored fact carries exactly the caller's fields. */
        callerFieldsMatch(stored, input) {
            return stored.taskId === input.taskId
                && stored.kind === input.kind
                && stored.actor === input.actor
                && stored.idempotencyKey === input.idempotencyKey
                && stored.entityRevision === input.entityRevision
                && JSON.stringify(stored.payload) === JSON.stringify(input.payload)
                && stored.causationId === input.causationId
                && stored.correlationId === input.correlationId;
        }
        /** The opened entries table; absent before service start or after disposal. */
        requireEntries() {
            if (this.entries === undefined) {
                throw new JournalError('invalid-argument', 'journal domain is not open');
            }
            return this.entries;
        }
    };
})();
export { WorkbenchJournalService };
export default WorkbenchJournalService;
//# sourceMappingURL=index.js.map