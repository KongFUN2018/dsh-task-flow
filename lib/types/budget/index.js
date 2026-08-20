/**
 * Task budget service (`ctx.budget`): one explicit durable ledger per task
 * over the three budget dimensions (tokens, duration, reruns). Recording
 * usage evaluates thresholds per dimension — 80% raises a batch-confirmable
 * warning item once per budget revision, crossing the limit parks the task
 * in `awaiting-decision` behind a blocking decision item. Limits are never
 * defaulted: provisioning requires explicit values, and appending budget is
 * itself the over-limit decision's landing path.
 * @module @deepseek-ai/dsh-budget
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
import { AttentionItemId } from "../attention/index.js";
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { BudgetError } from "./types.js";
import { BudgetRecordId } from "./runtime.js";
import { budgetDomainSpec } from "./spec.js";
export { BudgetRecordId } from "./runtime.js";
export { budgetDomainSpec, budgetRecordSchema } from "./spec.js";
export { BudgetError } from "./types.js";
/** The actor recorded on budget facts; decisions carry their own actor. */
const FACT_ACTOR = 'budget';
/** The decision options of one budget-exceeded item. */
const EXCEEDED_OPTIONS = ['append-budget', 'pause', 'cancel'];
/** Ledger limit field per budget dimension. */
const LIMIT_KEYS = {
    tokens: 'maxTokens',
    durationMs: 'maxDurationMs',
    reruns: 'maxReruns',
};
/** The acknowledgment option of one budget-warning item. */
const WARNING_OPTIONS = ['acknowledged'];
/**
 * Budget service: the M5 explicit task ledger with threshold decisions.
 */
let BudgetService = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _provisionBudget_decorators;
    let _appendBudget_decorators;
    let _recordUsage_decorators;
    let _getBudget_decorators;
    let _applyBudgetDecision_decorators;
    return class BudgetService extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _provisionBudget_decorators = [Remote('provisionBudget')];
            _appendBudget_decorators = [Remote('appendBudget')];
            _recordUsage_decorators = [Remote('recordUsage')];
            _getBudget_decorators = [Remote('getBudget')];
            _applyBudgetDecision_decorators = [Remote('applyBudgetDecision')];
            __esDecorate(this, null, _provisionBudget_decorators, { kind: "method", name: "provisionBudget", static: false, private: false, access: { has: obj => "provisionBudget" in obj, get: obj => obj.provisionBudget }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _appendBudget_decorators, { kind: "method", name: "appendBudget", static: false, private: false, access: { has: obj => "appendBudget" in obj, get: obj => obj.appendBudget }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _recordUsage_decorators, { kind: "method", name: "recordUsage", static: false, private: false, access: { has: obj => "recordUsage" in obj, get: obj => obj.recordUsage }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getBudget_decorators, { kind: "method", name: "getBudget", static: false, private: false, access: { has: obj => "getBudget" in obj, get: obj => obj.getBudget }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _applyBudgetDecision_decorators, { kind: "method", name: "applyBudgetDecision", static: false, private: false, access: { has: obj => "applyBudgetDecision" in obj, get: obj => obj.applyBudgetDecision }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        /** The service owns its domain, appends facts, and parks/resumes the task. */
        static { this.inject = ['storageDomain', 'workbenchJournal', 'tasks', 'attention']; }
        /**
         * @param ctx - Host context carrying storage, journal, task, and attention services.
         */
        constructor(ctx) {
            super(ctx, 'budget');
            this.records = __runInitializers(this, _instanceExtraInitializers);
            /** Serializes read-validate-write mutations so concurrent writers never interleave. */
            this.mutationTail = Promise.resolve();
        }
        /** Open and own the budget domain. */
        async [Service.init]() {
            const domain = await this.ctx.storageDomain.open(budgetDomainSpec);
            this.ctx.effect(() => async () => {
                await domain.close();
            }, 'budget.domainClose');
            this.records = domain.table('records');
        }
        /**
         * Provision one task's ledger. One record per task; explicit limits only —
         * an absent dimension is unlimited, not defaulted.
         * @param taskId - the task the ledger tracks.
         * @param limits - explicit limits; at least one dimension.
         * @param actor - provisioning actor.
         * @param idempotencyKey - caller-owned replay key.
         * @returns the stored ledger record.
         */
        async provisionBudget(taskId, limits, actor, idempotencyKey) {
            const task = this.requireTaskId(taskId);
            const owner = this.requireText(actor, 'actor');
            const key = this.requireText(idempotencyKey, 'idempotencyKey');
            const normalized = this.normalizeLimits(limits);
            const result = this.mutationTail.then(() => this.provisionNow(task, normalized, owner, key));
            this.mutationTail = result.then(() => undefined, () => undefined);
            return result;
        }
        /**
         * Append budget: raise explicit limits and re-arm the warning latch.
         * @param taskId - the task whose ledger grows.
         * @param deltas - the limit increases per dimension; at least one positive.
         * @param expectedRevision - the ledger revision the caller read.
         * @param actor - appending actor.
         * @param idempotencyKey - caller-owned replay key.
         * @returns the post-append ledger record.
         */
        async appendBudget(taskId, deltas, expectedRevision, actor, idempotencyKey) {
            const task = this.requireTaskId(taskId);
            const revision = this.requireRevision(expectedRevision, 'expectedRevision');
            const owner = this.requireText(actor, 'actor');
            const key = this.requireText(idempotencyKey, 'idempotencyKey');
            const normalized = this.normalizeLimits(deltas);
            const result = this.mutationTail.then(() => this.appendNow(task, normalized, revision, owner, key));
            this.mutationTail = result.then(() => undefined, () => undefined);
            return result;
        }
        /**
         * Record one explicit usage intake and evaluate thresholds per dimension.
         * @param taskId - the task whose ledger accumulates.
         * @param usage - the spend delta; absent dimensions spend nothing.
         * @param actor - recording actor.
         * @param idempotencyKey - caller-owned replay key.
         * @returns the post-intake ledger record.
         */
        async recordUsage(taskId, usage, actor, idempotencyKey) {
            const task = this.requireTaskId(taskId);
            const owner = this.requireText(actor, 'actor');
            const key = this.requireText(idempotencyKey, 'idempotencyKey');
            const normalized = this.normalizeUsage(usage);
            const result = this.mutationTail.then(() => this.recordNow(task, normalized, owner, key));
            this.mutationTail = result.then(() => undefined, () => undefined);
            return result;
        }
        /**
         * Read one task's ledger.
         * @param taskId - the task the ledger tracks.
         * @returns the ledger record, or undefined when never provisioned.
         */
        getBudget(taskId) {
            return this.requireRecords().get(this.requireTaskId(taskId));
        }
        /**
         * Land one resolved budget-exceeded decision on the task plane: the
         * append-budget outcome grows the ledger and resumes the task; pause and
         * cancel route to the task commands. The item must already be resolved —
         * no silent landing of an open decision.
         * @param itemId - the resolved budget-exceeded item.
         * @param deltas - the limit increases (append-budget only; at least one).
         * @param taskRevision - the task revision the caller read.
         * @param actor - landing actor.
         * @param idempotencyKey - caller-owned replay key.
         */
        async applyBudgetDecision(itemId, deltas, taskRevision, actor, idempotencyKey) {
            const id = AttentionItemId(this.requireText(itemId, 'itemId'));
            const owner = this.requireText(actor, 'actor');
            const key = this.requireText(idempotencyKey, 'idempotencyKey');
            const item = this.ctx.attention.getItem(String(id));
            if (item === undefined)
                throw new BudgetError('not-found', `budget item "${itemId}" is unknown`);
            if (item.decisionKind !== 'budget-exceeded') {
                throw new BudgetError('invalid-option', `item "${itemId}" is not a budget-exceeded decision`);
            }
            if (item.state !== 'resolved' || item.outcome === undefined) {
                throw new BudgetError('not-resolved', `budget decision "${itemId}" is not resolved`);
            }
            const task = await this.ctx.tasks.getTask(String(item.taskId));
            if (task === undefined)
                throw new BudgetError('not-found', `task "${String(item.taskId)}" is unknown`);
            const mutation = { actor: owner, reason: `budget decision ${item.outcome}`, expectedRevision: taskRevision, idempotencyKey: key };
            if (item.outcome === 'append-budget') {
                const appended = await this.appendBudget(String(item.taskId), deltas, this.requireBudgetOf(item.taskId).revision, owner, key);
                await this.ctx.tasks.resumeTaskFromDecision(String(item.taskId), mutation);
                await this.appendFact(appended.taskId, 'budget/decision-applied', key, appended.revision, {
                    itemId: String(id), outcome: item.outcome, revision: appended.revision,
                });
                return;
            }
            if (item.outcome === 'pause') {
                await this.ctx.tasks.requestPause(String(item.taskId), mutation);
            }
            else if (item.outcome === 'cancel') {
                await this.ctx.tasks.requestCancel(String(item.taskId), mutation);
            }
            else {
                throw new BudgetError('invalid-option', `outcome "${item.outcome}" is not a budget decision option`);
            }
            await this.appendFact(item.taskId, 'budget/decision-applied', key, item.entityRevision, {
                itemId: String(id), outcome: item.outcome,
            });
        }
        async provisionNow(taskId, limits, actor, idempotencyKey) {
            const records = this.requireRecords();
            if (records.get(String(taskId)) !== undefined) {
                throw new BudgetError('already-provisioned', `task "${String(taskId)}" already has a budget ledger`);
            }
            const record = {
                recordId: BudgetRecordId(`budget:${String(taskId)}`),
                taskId,
                limits,
                spent: { tokens: 0, durationMs: 0, reruns: 0 },
                revision: 1,
                warned: [],
            };
            await this.appendFact(taskId, 'budget/provisioned', idempotencyKey, 1, { limits, actor });
            await records.put(String(taskId), record);
            return record;
        }
        async appendNow(taskId, deltas, expectedRevision, actor, idempotencyKey) {
            const stored = this.requireBudgetOf(taskId);
            if (stored.revision !== expectedRevision) {
                throw new BudgetError('stale-revision', `expected ledger revision ${expectedRevision}, stored ${stored.revision}`);
            }
            let limits = { ...stored.limits };
            for (const dimension of ['tokens', 'durationMs', 'reruns']) {
                const key = LIMIT_KEYS[dimension];
                const current = stored.limits[key];
                if (current !== undefined)
                    limits = { ...limits, [key]: current + (deltas[key] ?? 0) };
            }
            const record = {
                ...stored,
                limits,
                revision: stored.revision + 1,
                warned: [],
            };
            await this.appendFact(taskId, 'budget/appended', idempotencyKey, record.revision, { deltas, actor });
            await this.requireRecords().put(String(taskId), record);
            return record;
        }
        async recordNow(taskId, usage, actor, idempotencyKey) {
            const stored = this.requireBudgetOf(taskId);
            const spent = {
                tokens: stored.spent.tokens + (usage.tokens ?? 0),
                durationMs: stored.spent.durationMs + (usage.durationMs ?? 0),
                reruns: stored.spent.reruns + (usage.reruns ?? 0),
            };
            let record = { ...stored, spent };
            await this.appendFact(taskId, 'budget/used', idempotencyKey, stored.revision, { usage, actor, spent });
            const crossed = [];
            for (const dimension of ['tokens', 'durationMs', 'reruns']) {
                const limit = stored.limits[LIMIT_KEYS[dimension]];
                if (limit === undefined)
                    continue;
                const value = spent[dimension];
                if (value > limit)
                    crossed.push(dimension);
                else if (value * 5 >= limit * 4 && !stored.warned.includes(dimension)) {
                    record = { ...record, warned: [...record.warned, dimension] };
                    await this.ctx.attention.createItem({
                        itemId: AttentionItemId(`budget-warning:${String(taskId)}:${dimension}:${record.revision}`),
                        taskId,
                        kind: 'b-confirm',
                        decisionKind: 'budget-warning',
                        options: [...WARNING_OPTIONS],
                    }, FACT_ACTOR, `budget-warning:${String(taskId)}:${dimension}:${record.revision}`);
                    await this.appendFact(taskId, 'budget/warned', idempotencyKey, record.revision, { dimension, value, limit });
                }
            }
            if (crossed.length > 0) {
                const task = await this.ctx.tasks.getTask(String(taskId));
                if (task === undefined)
                    throw new BudgetError('not-found', `task "${String(taskId)}" is unknown`);
                if (task.state === 'running') {
                    await this.ctx.tasks.markTaskAwaitingDecision(String(taskId), {
                        actor: FACT_ACTOR, reason: `budget exceeded: ${crossed.join(', ')}`,
                        expectedRevision: task.revision, idempotencyKey: `budget-exceed:${idempotencyKey}`,
                    });
                }
                for (const dimension of crossed) {
                    await this.ctx.attention.createItem({
                        itemId: AttentionItemId(`budget-exceeded:${String(taskId)}:${dimension}:${record.revision}`),
                        taskId,
                        kind: 'c-decision',
                        decisionKind: 'budget-exceeded',
                        options: [...EXCEEDED_OPTIONS],
                    }, FACT_ACTOR, `budget-exceeded:${String(taskId)}:${dimension}:${record.revision}`);
                    await this.appendFact(taskId, 'budget/exceeded', idempotencyKey, record.revision, { dimension, value: spent[dimension] });
                }
            }
            await this.requireRecords().put(String(taskId), record);
            return record;
        }
        requireBudgetOf(taskId) {
            const stored = this.requireRecords().get(String(taskId));
            if (stored === undefined) {
                throw new BudgetError('not-found', `task "${String(taskId)}" has no budget ledger`);
            }
            return stored;
        }
        /** Append one budget fact; the journal's durable write is the commit point. */
        async appendFact(taskId, kind, idempotencyKey, entityRevision, payload) {
            await this.ctx.workbenchJournal.append({
                taskId,
                kind,
                actor: FACT_ACTOR,
                idempotencyKey: `${kind}:${String(taskId)}:${idempotencyKey}`,
                entityRevision,
                payload: payload,
            });
        }
        normalizeLimits(limits) {
            if (limits === null || typeof limits !== 'object') {
                throw new BudgetError('invalid-argument', 'limits must be an object');
            }
            const out = {};
            let any = false;
            for (const key of ['maxTokens', 'maxDurationMs', 'maxReruns']) {
                const value = limits[key];
                if (value === undefined)
                    continue;
                if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
                    throw new BudgetError('invalid-argument', `${key} must be a positive safe integer`);
                }
                out[key] = value;
                any = true;
            }
            if (!any)
                throw new BudgetError('invalid-argument', 'limits require at least one dimension');
            return out;
        }
        normalizeUsage(usage) {
            if (usage === null || typeof usage !== 'object') {
                throw new BudgetError('invalid-argument', 'usage must be an object');
            }
            const out = {};
            for (const key of ['tokens', 'durationMs', 'reruns']) {
                const value = usage[key];
                if (value === undefined)
                    continue;
                if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
                    throw new BudgetError('invalid-argument', `${key} must be a positive safe integer`);
                }
                out[key] = value;
            }
            return out;
        }
        requireTaskId(taskId) {
            return this.requireText(taskId, 'taskId');
        }
        /** Validate one non-empty wire field, returning the trimmed value. */
        requireText(value, field) {
            if (typeof value !== 'string' || value.trim().length === 0) {
                throw new BudgetError('invalid-argument', `${field} must be a non-empty string`);
            }
            return value.trim();
        }
        /** Validate one compare-and-set revision. */
        requireRevision(value, field) {
            if (!Number.isSafeInteger(value) || value < 1) {
                throw new BudgetError('invalid-argument', `${field} must be a positive safe integer`);
            }
            return value;
        }
        requireRecords() {
            if (this.records === undefined)
                throw new BudgetError('not-found', 'budget domain is not initialized');
            return this.records;
        }
    };
})();
export { BudgetService };
export default BudgetService;
//# sourceMappingURL=index.js.map