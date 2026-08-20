/**
 * Review-policy service (`ctx.reviewPolicy`): the M5 trust tiers, the
 * deferred-batch-confirm read the gate service consults, the completion
 * guards that keep unsigned B items and suspended rewind decisions from
 * completing a task, and the repair-fuse breaker that parks a task behind a
 * recovery decision after consecutive failed A repairs hit the recipe's
 * explicit cap.
 * @module @deepseek-ai/dsh-review-policy
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
import { ReviewPolicyError } from "./types.js";
import { ReviewPolicyRecordId } from "./runtime.js";
import { reviewPolicyDomainSpec } from "./spec.js";
export { ReviewPolicyRecordId } from "./runtime.js";
export { reviewPolicyDomainSpec, reviewPolicyRecordSchema, breakerCounterSchema } from "./spec.js";
export { ReviewPolicyError } from "./types.js";
/** The actor recorded on review-policy facts; decisions carry their own actor. */
const FACT_ACTOR = 'review-policy';
/** The decision options of one breaker-tripped item. */
const BREAKER_OPTIONS = ['continue-repair', 'patch', 'rewind', 'pause', 'cancel'];
/**
 * Review-policy service: trust tiers, completion guards, and repair fuses.
 */
let ReviewPolicyService = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _setTier_decorators;
    let _getTier_decorators;
    let _defersBatchConfirm_decorators;
    let _applyBreakerDecision_decorators;
    return class ReviewPolicyService extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _setTier_decorators = [Remote('setTier')];
            _getTier_decorators = [Remote('getTier')];
            _defersBatchConfirm_decorators = [Remote('defersBatchConfirm')];
            _applyBreakerDecision_decorators = [Remote('applyBreakerDecision')];
            __esDecorate(this, null, _setTier_decorators, { kind: "method", name: "setTier", static: false, private: false, access: { has: obj => "setTier" in obj, get: obj => obj.setTier }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getTier_decorators, { kind: "method", name: "getTier", static: false, private: false, access: { has: obj => "getTier" in obj, get: obj => obj.getTier }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _defersBatchConfirm_decorators, { kind: "method", name: "defersBatchConfirm", static: false, private: false, access: { has: obj => "defersBatchConfirm" in obj, get: obj => obj.defersBatchConfirm }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _applyBreakerDecision_decorators, { kind: "method", name: "applyBreakerDecision", static: false, private: false, access: { has: obj => "applyBreakerDecision" in obj, get: obj => obj.applyBreakerDecision }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        /** The service owns its domain, appends facts, registers guards, and parks phase runs. */
        static { this.inject = ['storageDomain', 'workbenchJournal', 'tasks', 'attention', 'recipes']; }
        /**
         * @param ctx - Host context carrying storage, journal, task, attention, and recipe services.
         */
        constructor(ctx) {
            super(ctx, 'reviewPolicy');
            this.tiers = __runInitializers(this, _instanceExtraInitializers);
            /** Serializes read-validate-write mutations so concurrent writers never interleave. */
            this.mutationTail = Promise.resolve();
            /** Disposers for the two completion guards; released on dispose. */
            this.guardDisposers = [];
        }
        /** Open the domain, watch gate verdicts, and register the completion guards. */
        async [Service.init]() {
            const domain = await this.ctx.storageDomain.open(reviewPolicyDomainSpec);
            this.ctx.effect(() => async () => {
                await domain.close();
            }, 'reviewPolicy.domainClose');
            this.tiers = domain.table('tiers');
            this.breakers = domain.table('breakers');
            this.ctx.on('gate-check/recorded', (result) => {
                void this.observeVerdict(result);
            });
            this.guardDisposers.push(this.ctx.tasks.registerCompletionGuard(task => this.vetoOpenBatchConfirms(task)), this.ctx.tasks.registerCompletionGuard(task => this.vetoOpenRewindDecisions(task)));
            this.ctx.effect(() => () => {
                for (const dispose of this.guardDisposers.splice(0))
                    dispose();
            }, 'reviewPolicy.guards');
        }
        /**
         * Set one task's trust tier; unprovisioned tasks read as strict.
         * @param taskId - the task whose tier changes.
         * @param tier - the new tier.
         * @param actor - setting actor.
         * @param idempotencyKey - caller-owned replay key.
         * @returns the stored tier record.
         */
        async setTier(taskId, tier, actor, idempotencyKey) {
            const task = this.requireTaskId(taskId);
            if (!['strict', 'balanced', 'trusted'].includes(tier)) {
                throw new ReviewPolicyError('invalid-argument', 'tier must be strict, balanced, or trusted');
            }
            const owner = this.requireText(actor, 'actor');
            const key = this.requireText(idempotencyKey, 'idempotencyKey');
            const result = this.mutationTail.then(() => this.setTierNow(task, tier, owner, key));
            this.mutationTail = result.then(() => undefined, () => undefined);
            return result;
        }
        /**
         * Read one task's tier.
         * @param taskId - the task to read.
         * @returns the stored tier, or strict when unprovisioned.
         */
        getTier(taskId) {
            return this.requireTiers().get(this.requireTaskId(taskId))?.tier ?? 'strict';
        }
        /**
         * The gate service's read: whether B-class batch confirmation may run
         * ahead (trusted tier only). C-class checks always block.
         * @param taskId - the task being gated.
         * @returns true only when the task runs the trusted tier.
         */
        defersBatchConfirm(taskId) {
            return this.getTier(taskId) === 'trusted';
        }
        /**
         * Land one resolved breaker decision on the task plane: continue-repair
         * resets the counter and resumes the parked run; pause and cancel route to
         * the task commands; patch only journals the choice.
         * @param itemId - the resolved breaker-tripped item.
         * @param phaseRunRevision - the parked phase run's revision the caller read.
         * @param actor - landing actor.
         * @param idempotencyKey - caller-owned replay key.
         */
        async applyBreakerDecision(itemId, phaseRunRevision, actor, idempotencyKey) {
            const owner = this.requireText(actor, 'actor');
            const key = this.requireText(idempotencyKey, 'idempotencyKey');
            const revision = this.requireRevision(phaseRunRevision, 'phaseRunRevision');
            const item = this.ctx.attention.getItem(this.requireText(itemId, 'itemId'));
            if (item === undefined)
                throw new ReviewPolicyError('not-found', `breaker item "${itemId}" is unknown`);
            if (item.decisionKind !== 'breaker-tripped') {
                throw new ReviewPolicyError('invalid-option', `item "${itemId}" is not a breaker decision`);
            }
            if (item.state !== 'resolved' || item.outcome === undefined) {
                throw new ReviewPolicyError('not-resolved', `breaker decision "${itemId}" is not resolved`);
            }
            if (item.phaseRunId === undefined) {
                throw new ReviewPolicyError('invalid-transition', `breaker item "${itemId}" has no parked phase run`);
            }
            if (item.outcome === 'continue-repair') {
                await this.resetCounter(item.taskId, item.checkId ?? '', key);
                await this.ctx.tasks.resumePhaseFromAwaiting(String(item.phaseRunId), {
                    actor: owner, reason: `breaker decision ${item.outcome}`, expectedRevision: revision, idempotencyKey: key,
                });
            }
            else if (item.outcome === 'pause' || item.outcome === 'cancel') {
                const task = await this.ctx.tasks.getTask(String(item.taskId));
                if (task === undefined)
                    throw new ReviewPolicyError('not-found', `task "${String(item.taskId)}" is unknown`);
                const mutation = { actor: owner, reason: `breaker decision ${item.outcome}`, expectedRevision: task.revision, idempotencyKey: key };
                if (item.outcome === 'pause') {
                    await this.ctx.tasks.requestPause(String(item.taskId), mutation);
                }
                else {
                    await this.ctx.tasks.requestCancel(String(item.taskId), mutation);
                }
            }
            await this.appendFact(item.taskId, 'review-policy/breaker-decision', key, item.entityRevision, {
                itemId: String(item.itemId), outcome: item.outcome, actor: owner,
            });
        }
        /** Fold one recorded verdict into its breaker counter and maybe trip the fuse. */
        /** Completion veto: unsigned B-class confirmations of this task block completion. */
        vetoOpenBatchConfirms(task) {
            const unsigned = this.ctx.attention.listOpen()
                .filter(item => item.taskId === task.taskId && item.kind === 'b-confirm');
            if (unsigned.length > 0) {
                throw new Error(`${unsigned.length} unsigned B item(s) block completion`);
            }
            return Promise.resolve();
        }
        /** Completion veto: an open rewind decision of this task suspends completion. */
        vetoOpenRewindDecisions(task) {
            const suspended = this.ctx.attention.listOpen()
                .filter(item => item.taskId === task.taskId && item.decisionKind === 'rewind');
            if (suspended.length > 0) {
                throw new Error(`${suspended.length} suspended rewind decision(s) block completion`);
            }
            return Promise.resolve();
        }
        async observeVerdict(result) {
            if (result.stale === true)
                return;
            const submission = await this.ctx.tasks.getSubmission(String(result.submissionId));
            if (submission === undefined)
                return;
            const taskId = submission.taskId;
            const counted = this.mutationTail.then(() => this.countVerdict(taskId, result.checkId, result.passed));
            this.mutationTail = counted.then(() => undefined, () => undefined);
            const tripped = await counted;
            if (tripped === undefined)
                return;
            await this.ctx.tasks.markPhaseAwaitingDecision(String(tripped.phaseRunId), {
                actor: FACT_ACTOR,
                reason: `breaker tripped on check "${result.checkId}"`,
                expectedRevision: tripped.epoch,
                idempotencyKey: `breaker-park:${result.checkId}:${tripped.epoch}`,
            });
            await this.ctx.attention.createItem({
                itemId: AttentionItemId(`breaker:${String(taskId)}:${result.checkId}:${tripped.epoch}`),
                taskId,
                phaseRunId: tripped.phaseRunId,
                submissionId: result.submissionId,
                checkId: result.checkId,
                kind: 'recovery',
                decisionKind: 'breaker-tripped',
                options: [...BREAKER_OPTIONS],
            }, FACT_ACTOR, `breaker:${String(taskId)}:${result.checkId}:${tripped.epoch}`);
        }
        async countVerdict(taskId, checkId, passed) {
            const stored = this.requireBreakers().get(this.breakerKey(taskId, checkId));
            const consecutiveFailures = passed ? 0 : (stored?.consecutiveFailures ?? 0) + 1;
            const revision = (stored?.revision ?? 0) + 1;
            const counter = { taskId, checkId, consecutiveFailures, revision };
            await this.requireBreakers().put(this.breakerKey(taskId, checkId), counter);
            if (passed)
                return undefined;
            const task = await this.ctx.tasks.getTask(String(taskId));
            if (task === undefined || task.currentRunId === undefined)
                return undefined;
            const pinned = this.ctx.recipes.getPinned({ recipeId: task.pinnedRecipe.recipeId, revision: task.pinnedRecipe.revision });
            const check = pinned.payload.gateChecks.find(candidate => candidate.checkId === checkId);
            if (check?.circuitBreaker === undefined)
                return undefined;
            const breaker = pinned.payload.breakers?.find(candidate => candidate.key === check.circuitBreaker);
            if (breaker === undefined || consecutiveFailures < breaker.maxConsecutiveRepairs)
                return undefined;
            await this.appendFact(taskId, 'review-policy/breaker-tripped', `breaker:${checkId}:${revision}`, revision, {
                checkId, consecutiveFailures, cap: breaker.maxConsecutiveRepairs,
            });
            const phaseRuns = await this.ctx.tasks.listPhaseRuns(String(task.currentRunId));
            const parked = phaseRuns.find(phase => phase.state === 'gate-running' && phase.phaseId === check.phaseId);
            if (parked === undefined)
                return undefined;
            return { phaseRunId: parked.phaseRunId, epoch: parked.revision };
        }
        /** Reset one breaker counter after a continue-repair decision. */
        async resetCounter(taskId, checkId, idempotencyKey) {
            const stored = this.requireBreakers().get(this.breakerKey(taskId, checkId));
            const counter = {
                taskId,
                checkId,
                consecutiveFailures: 0,
                revision: (stored?.revision ?? 0) + 1,
            };
            await this.appendFact(taskId, 'review-policy/breaker-reset', idempotencyKey, counter.revision, { checkId });
            await this.requireBreakers().put(this.breakerKey(taskId, checkId), counter);
        }
        async setTierNow(taskId, tier, actor, idempotencyKey) {
            const stored = this.requireTiers().get(String(taskId));
            const record = {
                recordId: stored?.recordId ?? ReviewPolicyRecordId(`review-policy:${String(taskId)}`),
                taskId,
                tier,
                revision: (stored?.revision ?? 0) + 1,
            };
            await this.appendFact(taskId, 'review-policy/tier-set', idempotencyKey, record.revision, { tier, actor });
            await this.requireTiers().put(String(taskId), record);
            return record;
        }
        breakerKey(taskId, checkId) {
            return `${String(taskId)}:${checkId}`;
        }
        /** Append one review-policy fact; the journal's durable write is the commit point. */
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
        requireTaskId(taskId) {
            return this.requireText(taskId, 'taskId');
        }
        /** Validate one non-empty wire field, returning the trimmed value. */
        requireText(value, field) {
            if (typeof value !== 'string' || value.trim().length === 0) {
                throw new ReviewPolicyError('invalid-argument', `${field} must be a non-empty string`);
            }
            return value.trim();
        }
        /** Validate one compare-and-set revision. */
        requireRevision(value, field) {
            if (!Number.isSafeInteger(value) || value < 1) {
                throw new ReviewPolicyError('invalid-argument', `${field} must be a positive safe integer`);
            }
            return value;
        }
        requireTiers() {
            if (this.tiers === undefined)
                throw new ReviewPolicyError('not-found', 'review-policy domain is not initialized');
            return this.tiers;
        }
        requireBreakers() {
            if (this.breakers === undefined)
                throw new ReviewPolicyError('not-found', 'review-policy domain is not initialized');
            return this.breakers;
        }
    };
})();
export { ReviewPolicyService };
export default ReviewPolicyService;
//# sourceMappingURL=index.js.map