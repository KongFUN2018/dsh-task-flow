/**
 * Attention service (`ctx.attention`): the persistent business-decision inbox.
 * One durable `AttentionItem` records each gate check or independent task
 * decision. Decisions use optimistic concurrency �?every command carries an
 * `expectedEntityRevision` and returns a per-item outcome, so a stale,
 * withdrawn, resolved, or version-conflicted item is never silently
 * confirmed. A resolved/invalidated item writes its journal fact first,
 * then the projection, then resumes the phase run when every item of its
 * gate settled.
 * @module @deepseek-ai/dsh-attention
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
import "../task/index.js";
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import "../workbench/journal/index.js";
import { AttentionError, AttentionItemId as ItemIdOf } from "./runtime.js";
import { attentionDomainSpec } from "./spec.js";
export { AttentionItemId } from "./runtime.js";
export { attentionDomainSpec, attentionItemSchema, itemKeySchema } from "./spec.js";
export { AttentionError } from "./runtime.js";
/** The actor recorded on attention facts; decisions carry their own actor. */
const FACT_ACTOR = 'attention';
/**
 * Attention service: the M4 persistent-decision domain, with idempotent
 * item creation, optimistic decision and batch-confirm commands, and
 * upstream invalidation.
 */
let AttentionService = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _createItem_decorators;
    let _listOpen_decorators;
    let _getItem_decorators;
    let _resolveDecision_decorators;
    let _confirmBatch_decorators;
    let _invalidateItem_decorators;
    return class AttentionService extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _createItem_decorators = [Remote('createItem')];
            _listOpen_decorators = [Remote('listOpen')];
            _getItem_decorators = [Remote('getItem')];
            _resolveDecision_decorators = [Remote('resolveDecision')];
            _confirmBatch_decorators = [Remote('confirmBatch')];
            _invalidateItem_decorators = [Remote('invalidateItem')];
            __esDecorate(this, null, _createItem_decorators, { kind: "method", name: "createItem", static: false, private: false, access: { has: obj => "createItem" in obj, get: obj => obj.createItem }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listOpen_decorators, { kind: "method", name: "listOpen", static: false, private: false, access: { has: obj => "listOpen" in obj, get: obj => obj.listOpen }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getItem_decorators, { kind: "method", name: "getItem", static: false, private: false, access: { has: obj => "getItem" in obj, get: obj => obj.getItem }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _resolveDecision_decorators, { kind: "method", name: "resolveDecision", static: false, private: false, access: { has: obj => "resolveDecision" in obj, get: obj => obj.resolveDecision }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _confirmBatch_decorators, { kind: "method", name: "confirmBatch", static: false, private: false, access: { has: obj => "confirmBatch" in obj, get: obj => obj.confirmBatch }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _invalidateItem_decorators, { kind: "method", name: "invalidateItem", static: false, private: false, access: { has: obj => "invalidateItem" in obj, get: obj => obj.invalidateItem }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        /** The service opens its domain, appends facts, and reads/writes phase runs. */
        static { this.inject = ['storageDomain', 'workbenchJournal', 'tasks']; }
        /**
         * @param ctx - Host context carrying storage, journal, and task services.
         */
        constructor(ctx) {
            super(ctx, 'attention');
            this.items = __runInitializers(this, _instanceExtraInitializers);
            /** Serializes read-validate-write mutations so concurrent writers never interleave. */
            this.mutationTail = Promise.resolve();
        }
        /** Open and own the attention domain. */
        async [Service.init]() {
            const domain = await this.ctx.storageDomain.open(attentionDomainSpec);
            this.ctx.effect(() => async () => {
                await domain.close();
            }, 'attention.domainClose');
            this.items = domain.table('items');
            this.itemKeys = domain.table('item_keys');
        }
        /**
         * Create one attention item. Idempotent: replaying a caller key returns
         * the stored item; a replay with a different itemId fails loud.
         * @param input - the item fields; `itemId` is caller-supplied and stable.
         * @param actor - the actor opening the item.
         * @param idempotencyKey - caller-owned replay key.
         * @returns the stored item.
         */
        createItem(input, actor, idempotencyKey) {
            const actorValue = this.requireText(actor, 'actor');
            const key = this.requireText(idempotencyKey, 'idempotencyKey');
            const normalized = this.normalizeInput(input);
            const result = this.mutationTail.then(() => this.createItemNow(normalized, actorValue, key));
            this.mutationTail = result.then(() => undefined, () => undefined);
            return result;
        }
        /**
         * List every open item, in open order.
         * @returns the open items.
         */
        listOpen() {
            const open = [];
            for (const [, item] of this.requireItems().entries()) {
                if (item.state === 'open')
                    open.push(item);
            }
            open.sort((a, b) => a.openedAt - b.openedAt);
            return open;
        }
        /**
         * Read one attention item.
         * @param itemId - the item identity.
         * @returns the item, or undefined when unknown.
         */
        getItem(itemId) {
            const id = ItemIdOf(this.requireText(itemId, 'itemId'));
            return this.requireItems().get(String(id));
        }
        /**
         * Resolve one decision item against the given option. Idempotent: a replay
         * with the same option returns `resolved`; a different option reports
         * `already-resolved`. A stale, withdrawn, or revision-conflicted item never
         * resolves silently.
         * @param itemId - the item to decide.
         * @param expectedEntityRevision - the revision this decision satisfies.
         * @param optionId - one of the item's options.
         * @param actor - the deciding actor.
         * @param idempotencyKey - caller-owned replay key.
         * @returns the outcome and the revision to retry against when present.
         */
        resolveDecision(itemId, expectedEntityRevision, optionId, actor, idempotencyKey) {
            const id = ItemIdOf(this.requireText(itemId, 'itemId'));
            const revision = this.requireRevision(expectedEntityRevision, 'expectedEntityRevision');
            const option = this.requireText(optionId, 'optionId');
            const actorValue = this.requireText(actor, 'actor');
            const key = this.requireText(idempotencyKey, 'idempotencyKey');
            const result = this.mutationTail.then(() => this.resolveNow(id, revision, option, actorValue, key));
            this.mutationTail = result.then(() => undefined, () => undefined);
            return result;
        }
        /**
         * Confirm a batch of B-class items in one pass: every still-open
         * revision-matching item resolves, and each target reports its own outcome.
         * @param targets - the compare-and-set targets.
         * @param actor - the confirming actor.
         * @param idempotencyKey - caller-owned replay key.
         * @returns per-item results, in request order.
         */
        confirmBatch(targets, actor, idempotencyKey) {
            const actorValue = this.requireText(actor, 'actor');
            const key = this.requireText(idempotencyKey, 'idempotencyKey');
            if (!Array.isArray(targets))
                throw new AttentionError('invalid-argument', 'targets must be an array');
            const normalized = targets.map((target, index) => ({
                itemId: ItemIdOf(this.requireText(target.itemId, `targets[${index}].itemId`)),
                expectedEntityRevision: this.requireRevision(target.expectedEntityRevision, `targets[${index}].expectedEntityRevision`),
            }));
            const result = this.mutationTail.then(() => this.confirmBatchNow(normalized, actorValue, key));
            this.mutationTail = result.then(() => undefined, () => undefined);
            return result;
        }
        /**
         * Invalidate one open item upstream: the stale-propagation trigger that
         * makes later decisions report `stale` instead of silently resolving.
         * @param itemId - the item to invalidate.
         * @param expectedEntityRevision - the revision this invalidation satisfies.
         * @param reason - non-empty reason recorded with the invalidation.
         * @param actor - the invalidating actor.
         * @param idempotencyKey - caller-owned replay key.
         * @returns the outcome and the revision to retry against when present.
         */
        invalidateItem(itemId, expectedEntityRevision, reason, actor, idempotencyKey) {
            const id = ItemIdOf(this.requireText(itemId, 'itemId'));
            const revision = this.requireRevision(expectedEntityRevision, 'expectedEntityRevision');
            const reasonValue = this.requireText(reason, 'reason');
            const actorValue = this.requireText(actor, 'actor');
            const key = this.requireText(idempotencyKey, 'idempotencyKey');
            const result = this.mutationTail.then(() => this.invalidateNow(id, revision, reasonValue, actorValue, key));
            this.mutationTail = result.then(() => undefined, () => undefined);
            return result;
        }
        async createItemNow(input, actor, idempotencyKey) {
            const existingKey = this.requireItemKeys().get(idempotencyKey);
            if (existingKey !== undefined) {
                const stored = this.requireItems().get(existingKey.itemId);
                if (stored === undefined)
                    throw new AttentionError('not-found', `item "${existingKey.itemId}" is missing`);
                if (String(stored.itemId) !== String(input.itemId)) {
                    throw new AttentionError('conflict', 'attention idempotency key reused with a different itemId');
                }
                return stored;
            }
            let item = {
                itemId: input.itemId,
                taskId: input.taskId,
                kind: input.kind,
                decisionKind: input.decisionKind,
                options: input.options,
                state: 'open',
                entityRevision: 1,
                openedAt: Date.now(),
            };
            if (input.runId !== undefined)
                item = { ...item, runId: input.runId };
            if (input.phaseRunId !== undefined)
                item = { ...item, phaseRunId: input.phaseRunId };
            if (input.submissionId !== undefined)
                item = { ...item, submissionId: input.submissionId };
            if (input.checkId !== undefined)
                item = { ...item, checkId: input.checkId };
            if (input.impactSnapshot !== undefined)
                item = { ...item, impactSnapshot: input.impactSnapshot };
            await this.appendFact({
                kind: 'attention/item-created',
                taskId: input.taskId,
                idempotencyKey: `attention/item-created:${idempotencyKey}`,
                entityRevision: 1,
                payload: { itemId: String(input.itemId), actor },
            });
            await this.requireItems().put(String(input.itemId), item);
            await this.requireItemKeys().put(idempotencyKey, { itemId: String(input.itemId) });
            return item;
        }
        async resolveNow(itemId, expectedEntityRevision, optionId, actor, idempotencyKey) {
            const stored = this.requireItems().get(String(itemId));
            if (stored === undefined)
                return { outcome: 'withdrawn' };
            if (stored.state === 'resolved') {
                return { outcome: stored.outcome === optionId ? 'resolved' : 'already-resolved', currentRevision: stored.entityRevision };
            }
            if (stored.state !== 'open')
                return { outcome: 'stale', currentRevision: stored.entityRevision };
            if (stored.entityRevision !== expectedEntityRevision)
                return { outcome: 'conflict', currentRevision: stored.entityRevision };
            if (!stored.options.includes(optionId)) {
                throw new AttentionError('invalid-argument', `option "${optionId}" is not one of the item's options`);
            }
            const nextRevision = stored.entityRevision + 1;
            await this.appendFact({
                kind: 'attention/item-resolved',
                taskId: stored.taskId,
                idempotencyKey: `attention/item-resolved:${idempotencyKey}`,
                entityRevision: nextRevision,
                payload: { itemId: String(itemId), optionId, actor },
            });
            await this.requireItems().put(String(itemId), {
                ...stored,
                state: 'resolved',
                entityRevision: nextRevision,
                resolvedAt: Date.now(),
                resolvedBy: actor,
                outcome: optionId,
            });
            await this.resumeIfAllSettled(stored.phaseRunId);
            return { outcome: 'resolved', currentRevision: nextRevision };
        }
        async confirmBatchNow(targets, actor, idempotencyKey) {
            const results = [];
            const settledPhaseRuns = new Set();
            for (const target of targets) {
                const stored = this.requireItems().get(String(target.itemId));
                if (stored === undefined) {
                    results.push({ itemId: target.itemId, outcome: 'withdrawn' });
                    continue;
                }
                if (stored.state === 'resolved') {
                    results.push({ itemId: target.itemId, outcome: 'already-resolved', currentRevision: stored.entityRevision });
                    continue;
                }
                if (stored.state !== 'open') {
                    results.push({ itemId: target.itemId, outcome: 'stale', currentRevision: stored.entityRevision });
                    continue;
                }
                if (stored.entityRevision !== target.expectedEntityRevision) {
                    results.push({ itemId: target.itemId, outcome: 'conflict', currentRevision: stored.entityRevision });
                    continue;
                }
                const nextRevision = stored.entityRevision + 1;
                await this.appendFact({
                    kind: 'attention/item-resolved',
                    taskId: stored.taskId,
                    idempotencyKey: `attention/item-resolved:${idempotencyKey}:${String(target.itemId)}`,
                    entityRevision: nextRevision,
                    payload: { itemId: String(target.itemId), actor },
                });
                await this.requireItems().put(String(target.itemId), {
                    ...stored,
                    state: 'resolved',
                    entityRevision: nextRevision,
                    resolvedAt: Date.now(),
                    resolvedBy: actor,
                });
                results.push({ itemId: target.itemId, outcome: 'resolved', currentRevision: nextRevision });
                if (stored.phaseRunId !== undefined)
                    settledPhaseRuns.add(String(stored.phaseRunId));
            }
            for (const phaseRunId of settledPhaseRuns)
                await this.resumeIfAllSettled(phaseRunId);
            return results;
        }
        async invalidateNow(itemId, expectedEntityRevision, reason, actor, idempotencyKey) {
            const stored = this.requireItems().get(String(itemId));
            if (stored === undefined)
                return { outcome: 'withdrawn' };
            if (stored.state === 'resolved')
                return { outcome: 'already-resolved', currentRevision: stored.entityRevision };
            if (stored.state !== 'open')
                return { outcome: 'stale', currentRevision: stored.entityRevision };
            if (stored.entityRevision !== expectedEntityRevision)
                return { outcome: 'conflict', currentRevision: stored.entityRevision };
            const nextRevision = stored.entityRevision + 1;
            await this.appendFact({
                kind: 'attention/item-invalidated',
                taskId: stored.taskId,
                idempotencyKey: `attention/item-invalidated:${idempotencyKey}`,
                entityRevision: nextRevision,
                payload: { itemId: String(itemId), reason, actor },
            });
            await this.requireItems().put(String(itemId), {
                ...stored,
                state: 'invalidated',
                entityRevision: nextRevision,
            });
            await this.resumeIfAllSettled(stored.phaseRunId);
            return { outcome: 'invalidated', currentRevision: nextRevision };
        }
        /**
         * Resume one phase run out of awaiting-decision when every item naming it
         * settled (resolved or invalidated). A run still awaiting a decision stays
         * parked; a concurrent transition owns the run and this becomes a no-op.
         * @param phaseRunId - the phase run the settled items name, when any.
         */
        async resumeIfAllSettled(phaseRunId) {
            if (phaseRunId === undefined)
                return;
            const naming = [...this.requireItems().entries()]
                .map(([, item]) => item)
                .filter(item => String(item.phaseRunId) === phaseRunId);
            if (naming.some(item => item.state === 'open'))
                return;
            try {
                const phaseRun = await this.ctx.tasks.getPhaseRun(phaseRunId);
                if (phaseRun === undefined || phaseRun.state !== 'awaiting-decision')
                    return;
                await this.ctx.tasks.resumePhaseFromAwaiting(phaseRunId, {
                    actor: FACT_ACTOR,
                    reason: 'attention decisions settled',
                    expectedRevision: phaseRun.revision,
                    idempotencyKey: `attention/resume:${phaseRunId}`,
                });
            }
            catch {
                // A concurrent transition already owns the run; the resume round re-enters.
            }
        }
        /** Validate and normalize one create-item input. */
        normalizeInput(input) {
            const options = input.options;
            if (!Array.isArray(options) || options.length === 0) {
                throw new AttentionError('invalid-argument', 'options must be a non-empty array');
            }
            let normalized = {
                itemId: ItemIdOf(this.requireText(input.itemId, 'itemId')),
                taskId: this.requireText(input.taskId, 'taskId'),
                kind: input.kind,
                decisionKind: this.requireText(input.decisionKind, 'decisionKind'),
                options: options.map((option, index) => this.requireText(option, `options[${index}]`)),
            };
            if (input.runId !== undefined)
                normalized = { ...normalized, runId: this.requireText(input.runId, 'runId') };
            if (input.phaseRunId !== undefined)
                normalized = { ...normalized, phaseRunId: this.requireText(input.phaseRunId, 'phaseRunId') };
            if (input.submissionId !== undefined)
                normalized = { ...normalized, submissionId: this.requireText(input.submissionId, 'submissionId') };
            if (input.checkId !== undefined)
                normalized = { ...normalized, checkId: this.requireText(input.checkId, 'checkId') };
            if (input.impactSnapshot !== undefined)
                normalized = { ...normalized, impactSnapshot: this.requireText(input.impactSnapshot, 'impactSnapshot') };
            return normalized;
        }
        /** Append one attention fact; the journal's durable write is the commit point. */
        async appendFact(input) {
            await this.ctx.workbenchJournal.append({
                taskId: input.taskId,
                kind: input.kind,
                actor: FACT_ACTOR,
                idempotencyKey: input.idempotencyKey,
                entityRevision: input.entityRevision,
                payload: input.payload,
            });
        }
        /** Validate one non-empty wire field, returning the trimmed value. */
        requireText(value, field) {
            if (typeof value !== 'string' || value.trim().length === 0) {
                throw new AttentionError('invalid-argument', `${field} must be a non-empty string`);
            }
            return value.trim();
        }
        /** Validate one compare-and-set revision. */
        requireRevision(value, field) {
            if (!Number.isSafeInteger(value) || value < 1) {
                throw new AttentionError('invalid-argument', `${field} must be a positive safe integer`);
            }
            return value;
        }
        requireItems() {
            if (this.items === undefined)
                throw new AttentionError('not-found', 'attention domain is not initialized');
            return this.items;
        }
        requireItemKeys() {
            if (this.itemKeys === undefined)
                throw new AttentionError('not-found', 'attention domain is not initialized');
            return this.itemKeys;
        }
    };
})();
export { AttentionService };
export default AttentionService;
//# sourceMappingURL=index.js.map