/**
 * Metrics service (`ctx.metrics`): the M6 workbench KPI projection and
 * per-task measures, derived from the entity projections and the journal.
 * Pure read: it never writes the task plane, never opens attention items,
 * and never touches Gate or scheduling.
 * @module @deepseek-ai/dsh-metrics
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
import "../task/index.js";
import "../workbench/host/index.js";
import "../workbench/journal/index.js";
import "../deliverable/index.js";
import { buildTaskMetrics, buildWorkbenchMetrics } from "./runtime.js";
/** Metrics read errors; no write-side ladder exists. */
export class MetricsError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'MetricsError';
    }
}
/** The metrics service: read-only KPI and per-task measures. */
let MetricsService = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _metrics_decorators;
    let _taskMetrics_decorators;
    return class MetricsService extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _metrics_decorators = [Remote('metrics')];
            _taskMetrics_decorators = [Remote('taskMetrics')];
            __esDecorate(this, null, _metrics_decorators, { kind: "method", name: "metrics", static: false, private: false, access: { has: obj => "metrics" in obj, get: obj => obj.metrics }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _taskMetrics_decorators, { kind: "method", name: "taskMetrics", static: false, private: false, access: { has: obj => "taskMetrics" in obj, get: obj => obj.taskMetrics }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        /** The service aggregates the task plane, the inbox, the versions, and the journal. */
        static inject = ['tasks', 'workbenchHost', 'deliverables', 'workbenchJournal'];
        /**
         * @param ctx - Host context carrying the aggregate services.
         */
        constructor(ctx) {
            super(ctx, 'metrics');
            __runInitializers(this, _instanceExtraInitializers);
        }
        /**
         * Fold the whole-workbench KPI projection.
         * @returns the KPI counts, throughput buckets, and gate pass rates.
         */
        async metrics() {
            const [tasks, snapshot, versions, facts] = await Promise.all([
                this.ctx.tasks.listTasks(),
                Promise.resolve(this.ctx.workbenchHost.listSnapshot()),
                Promise.resolve(this.ctx.deliverables.listVersions()),
                Promise.resolve(this.ctx.workbenchJournal.replay(0)),
            ]);
            return buildWorkbenchMetrics(tasks, snapshot.items, versions, facts);
        }
        /**
         * Fold one task's measures.
         * @param taskId - the task to measure.
         * @returns the per-task measures.
         */
        async taskMetrics(taskId) {
            const id = this.requireText(taskId, 'taskId');
            const task = await this.ctx.tasks.getTask(id);
            if (task === undefined)
                throw new MetricsError('not-found', 'task "' + taskId + '" is unknown');
            const facts = this.ctx.workbenchJournal.replay(0).filter(fact => String(fact.taskId) === String(id));
            const budgetService = this.ctx.get('budget');
            const budget = budgetService?.getBudget(id);
            return buildTaskMetrics(task, facts, budget);
        }
        /** Validate one non-empty wire field, returning the trimmed value. */
        requireText(value, field) {
            if (typeof value !== 'string' || value.trim().length === 0) {
                throw new MetricsError('invalid-argument', field + ' must be a non-empty string');
            }
            return value.trim();
        }
    };
})();
export { MetricsService };
export default MetricsService;
//# sourceMappingURL=index.js.map