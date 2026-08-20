/**
 * Rewind service (`ctx.rewind`): the M5 branch-abandonment flow. A rewind
 * request computes the deliverable impact closure, persists the preview on
 * the decision item (the first `impactSnapshot` writer), and only a resolved
 * `confirm-rewind` outcome creates the new task run — superseding every phase
 * run of the retired branch. Declined outcomes keep the task plane untouched:
 * the upstream edit already staled the versions it staled.
 * @module @deepseek-ai/dsh-rewind
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
import { AttentionItemId } from "../attention/index.js";
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { RewindError } from "./types.js";
import { REWIND_OPTIONS } from "./types.js";
export { RewindError, REWIND_OPTIONS } from "./types.js";
/** The actor recorded on rewind facts; decisions carry their own actor. */
const FACT_ACTOR = 'rewind';
/**
 * Rewind service: preview-through-decision branch replacement.
 */
let RewindService = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _requestRewind_decorators;
    let _applyRewind_decorators;
    return class RewindService extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _requestRewind_decorators = [Remote('requestRewind')];
            _applyRewind_decorators = [Remote('applyRewind')];
            __esDecorate(this, null, _requestRewind_decorators, { kind: "method", name: "requestRewind", static: false, private: false, access: { has: obj => "requestRewind" in obj, get: obj => obj.requestRewind }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _applyRewind_decorators, { kind: "method", name: "applyRewind", static: false, private: false, access: { has: obj => "applyRewind" in obj, get: obj => obj.applyRewind }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        /** The service reads deliverable closures, writes task branches, and files decisions. */
        static { this.inject = ['deliverables', 'tasks', 'attention', 'workbenchJournal']; }
        /**
         * @param ctx - Host context carrying deliverables, tasks, attention, and the journal.
         */
        constructor(ctx) {
            super(ctx, 'rewind');
            /** Serializes read-validate-write mutations so concurrent writers never interleave. */
            this.mutationTail = (__runInitializers(this, _instanceExtraInitializers), Promise.resolve());
        }
        /**
         * Request one rewind: compute the impact closure, persist the preview, and
         * open the decision item. No task-plane write happens before the decision.
         * @param taskId - the task whose branch the rewind would replace.
         * @param rootVersionIds - the deliverable versions the upstream edit staled.
         * @param actor - requesting actor.
         * @param idempotencyKey - caller-owned replay key.
         * @returns the open rewind decision item.
         */
        async requestRewind(taskId, rootVersionIds, actor, idempotencyKey) {
            const task = this.requireTaskId(taskId);
            const owner = this.requireText(actor, 'actor');
            const key = this.requireText(idempotencyKey, 'idempotencyKey');
            if (!Array.isArray(rootVersionIds) || rootVersionIds.length === 0) {
                throw new RewindError('invalid-argument', 'rootVersionIds must be a non-empty array');
            }
            for (const id of rootVersionIds)
                this.requireText(id, 'rootVersionId');
            const result = this.mutationTail.then(() => this.requestNow(task, [...rootVersionIds], owner, key));
            this.mutationTail = result.then(() => undefined, () => undefined);
            return result;
        }
        /**
         * Apply one resolved rewind decision: create the successor run, supersede
         * the retired branch's phase runs, and journal the branch fact.
         * @param itemId - the resolved rewind decision item.
         * @param taskRevision - the task revision the caller read.
         * @param actor - applying actor.
         * @param idempotencyKey - caller-owned replay key.
         * @returns the new run and the retired phase runs.
         */
        async applyRewind(itemId, taskRevision, actor, idempotencyKey) {
            const owner = this.requireText(actor, 'actor');
            const key = this.requireText(idempotencyKey, 'idempotencyKey');
            const revision = this.requireRevision(taskRevision, 'taskRevision');
            const result = this.mutationTail.then(() => this.applyNow(AttentionItemId(this.requireText(itemId, 'itemId')), revision, owner, key));
            this.mutationTail = result.then(() => undefined, () => undefined);
            return result;
        }
        async requestNow(taskId, rootVersionIds, actor, idempotencyKey) {
            const task = await this.ctx.tasks.getTask(String(taskId));
            if (task === undefined)
                throw new RewindError('not-found', `task "${String(taskId)}" is unknown`);
            if (task.currentRunId === undefined) {
                throw new RewindError('invalid-transition', `task "${String(taskId)}" has no run to rewind`);
            }
            const snapshot = await this.ctx.deliverables.invalidateDownstream(rootVersionIds);
            const rerunPhaseIds = new Set();
            for (const phaseRunId of snapshot.affectedPhaseRuns) {
                const phaseRun = await this.ctx.tasks.getPhaseRun(String(phaseRunId));
                if (phaseRun !== undefined)
                    rerunPhaseIds.add(phaseRun.phaseId);
            }
            const invalidatedVersionIds = snapshot.staledVersions.flatMap(group => group.versionIds.map(String));
            const reusableClarificationIds = this.ctx.workbenchJournal.replay(0)
                .filter(fact => fact.kind === 'clarification/injected' && String(fact.taskId) === String(taskId))
                .map(fact => fact.payload.requestId);
            const preview = {
                snapshotId: String(snapshot.snapshotId),
                invalidatedVersionIds,
                rerunPhaseIds: [...rerunPhaseIds],
                reusableClarificationIds,
                costHint: 'uncalibrated',
            };
            const itemId = `rewind:${String(taskId)}:${preview.snapshotId}`;
            await this.appendFact(taskId, 'rewind/preview-requested', idempotencyKey, task.revision, {
                itemId, actor, roots: rootVersionIds, preview,
            });
            await this.ctx.attention.createItem({
                itemId: AttentionItemId(itemId),
                taskId,
                runId: task.currentRunId,
                kind: 'c-decision',
                decisionKind: 'rewind',
                options: [...REWIND_OPTIONS],
                impactSnapshot: JSON.stringify(preview),
            }, FACT_ACTOR, `rewind-preview:${idempotencyKey}`);
            return { ...preview, itemId };
        }
        async applyNow(itemId, taskRevision, actor, idempotencyKey) {
            const item = this.ctx.attention.getItem(String(itemId));
            if (item === undefined)
                throw new RewindError('not-found', `rewind item "${String(itemId)}" is unknown`);
            if (item.decisionKind !== 'rewind') {
                throw new RewindError('invalid-option', `item "${String(itemId)}" is not a rewind decision`);
            }
            if (item.state !== 'resolved' || item.outcome === undefined) {
                throw new RewindError('not-resolved', `rewind decision "${String(itemId)}" is not resolved`);
            }
            if (item.outcome !== 'confirm-rewind') {
                await this.appendFact(item.taskId, 'rewind/declined', idempotencyKey, item.entityRevision, {
                    itemId: String(itemId), outcome: item.outcome, actor,
                });
                throw new RewindError('invalid-option', `rewind decision "${String(itemId)}" resolved to "${item.outcome}", not "confirm-rewind"`);
            }
            const task = await this.ctx.tasks.getTask(String(item.taskId));
            if (task === undefined)
                throw new RewindError('not-found', `task "${String(item.taskId)}" is unknown`);
            if (task.currentRunId === undefined) {
                throw new RewindError('invalid-transition', `task "${String(item.taskId)}" has no run to retire`);
            }
            const retiredRunId = String(task.currentRunId);
            const mutation = {
                actor, reason: `rewind ${String(itemId)}`, expectedRevision: taskRevision, idempotencyKey,
            };
            const run = await this.ctx.tasks.createTaskRun(String(item.taskId), mutation, retiredRunId);
            const phaseRuns = await this.ctx.tasks.listPhaseRuns(retiredRunId);
            const supersededPhaseRunIds = [];
            for (const phaseRun of phaseRuns) {
                const superseded = await this.ctx.tasks.markPhaseSuperseded(String(phaseRun.phaseRunId), {
                    ...mutation,
                    expectedRevision: phaseRun.revision,
                });
                supersededPhaseRunIds.push(String(superseded.phaseRunId));
            }
            await this.appendFact(item.taskId, 'rewind/applied', idempotencyKey, run.revision, {
                itemId: String(itemId), newRunId: String(run.runId), retiredRunId, supersededPhaseRunIds, actor,
            });
            return { run, supersededPhaseRunIds };
        }
        /** Append one rewind fact; the journal's durable write is the commit point. */
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
                throw new RewindError('invalid-argument', `${field} must be a non-empty string`);
            }
            return value.trim();
        }
        /** Validate one compare-and-set revision. */
        requireRevision(value, field) {
            if (!Number.isSafeInteger(value) || value < 1) {
                throw new RewindError('invalid-argument', `${field} must be a positive safe integer`);
            }
            return value;
        }
    };
})();
export { RewindService };
export default RewindService;
//# sourceMappingURL=index.js.map