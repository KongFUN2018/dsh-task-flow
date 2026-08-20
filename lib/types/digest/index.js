/**
 * Digest service (`ctx.digest`): the M6 journal-derived read projection of
 * one task — run branches, timeline, phase summaries, decision history, and
 * deliverable states. Pure read: it never writes the task plane, never opens
 * attention items, and never touches Gate or scheduling.
 * @module @deepseek-ai/dsh-digest
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
import "../workbench/journal/index.js";
import "../deliverable/index.js";
import { buildDigest } from "./runtime.js";
/** Digest read errors; no write-side ladder exists. */
export class DigestError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'DigestError';
    }
}
/** The digest service: one read-only Remote per task. */
let DigestService = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _digest_decorators;
    return class DigestService extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _digest_decorators = [Remote('digest')];
            __esDecorate(this, null, _digest_decorators, { kind: "method", name: "digest", static: false, private: false, access: { has: obj => "digest" in obj, get: obj => obj.digest }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        /** The service reads the journal, the task projection, and the versions. */
        static inject = ['tasks', 'workbenchJournal', 'deliverables'];
        /**
         * @param ctx - Host context carrying the task, journal, and deliverable services.
         */
        constructor(ctx) {
            super(ctx, 'digest');
            __runInitializers(this, _instanceExtraInitializers);
        }
        /**
         * Derive one task's digest from the journal and the entity projections.
         * @param taskId - the task to digest.
         * @returns the full digest projection.
         */
        async digest(taskId) {
            const id = this.requireText(taskId, 'taskId');
            const task = await this.ctx.tasks.getTask(id);
            if (task === undefined)
                throw new DigestError('not-found', 'task "' + taskId + '" is unknown');
            const phaseRuns = task.currentRunId === undefined
                ? []
                : await this.ctx.tasks.listPhaseRuns(String(task.currentRunId));
            const facts = this.ctx.workbenchJournal.replay(0).filter(fact => String(fact.taskId) === String(id));
            const versions = this.ctx.deliverables.listVersions();
            return buildDigest(task, phaseRuns, facts, versions);
        }
        /** Validate one non-empty wire field, returning the trimmed value. */
        requireText(value, field) {
            if (typeof value !== 'string' || value.trim().length === 0) {
                throw new DigestError('invalid-argument', field + ' must be a non-empty string');
            }
            return value.trim();
        }
    };
})();
export { DigestService };
export default DigestService;
//# sourceMappingURL=index.js.map