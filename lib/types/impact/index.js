/**
 * Impact propagation (`ctx.impactPropagation`): applies one deliverable-side
 * `ImpactSnapshot` to the task plane. The upstream-edit flow calls
 * `deliverables.invalidateDownstream` first, then `apply` here: covered
 * phase runs move into terminal `stale` through the task command (the
 * engine re-opens the phase as a new run and revoked passes are re-earned),
 * and covered gate verdicts are annotated stale so they support no pass
 * decision. The task commands own every journal fact this flow produces.
 * @module @deepseek-ai/dsh-impact-propagation
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
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { TaskError } from "../task/index.js";
/**
 * Impact-propagation service: composes the frozen task commands over one
 * snapshot; owns no durable state of its own.
 */
let ImpactPropagationService = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _apply_decorators;
    return class ImpactPropagationService extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _apply_decorators = [Remote('apply')];
            __esDecorate(this, null, _apply_decorators, { kind: "method", name: "apply", static: false, private: false, access: { has: obj => "apply" in obj, get: obj => obj.apply }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        /** The service drives the task plane through the deliverable and task services. */
        static { this.inject = ['deliverables', 'tasks', 'workbenchJournal']; }
        /**
         * @param ctx - Host context carrying deliverables, tasks, and the workbench journal.
         */
        constructor(ctx) {
            super(ctx, 'impactPropagation');
            __runInitializers(this, _instanceExtraInitializers);
        }
        /**
         * Apply one impact snapshot to the task plane. Phase runs the snapshot
         * covers move into terminal `stale` (already-stale runs are skipped), then
         * the covered gate verdicts are annotated stale. The engine wakes on the
         * committed phase-run changes and re-opens covered phases as new runs.
         * @param snapshot - the impact snapshot `invalidateDownstream` returned.
         * @param mutation - actor, reason, idempotency key of the applying flow.
         * @returns the task-plane writes this call performed.
         */
        async apply(snapshot, mutation) {
            const staledPhaseRuns = [];
            for (const phaseRunId of snapshot.affectedPhaseRuns) {
                const run = await this.ctx.tasks.getPhaseRun(String(phaseRunId));
                if (run === undefined) {
                    throw new TaskError('not-found', `snapshot covers phase run "${String(phaseRunId)}" which is not stored`);
                }
                if (run.state === 'stale')
                    continue;
                staledPhaseRuns.push(await this.ctx.tasks.markPhaseStale(String(phaseRunId), {
                    ...mutation,
                    expectedRevision: run.revision,
                }));
            }
            const staledGateChecks = [];
            for (const group of snapshot.staledGateChecks) {
                const staled = await this.ctx.tasks.markGateChecksStale(String(group.submissionId), [...group.checkIds], mutation);
                staledGateChecks.push(...staled);
            }
            return { staledPhaseRuns, staledGateChecks };
        }
    };
})();
export { ImpactPropagationService };
export default ImpactPropagationService;
//# sourceMappingURL=index.js.map