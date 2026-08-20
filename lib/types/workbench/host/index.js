/**
 * Workbench attention-channel host service: the client-safe projection over
 * the M4 persistent attention inbox (`ctx.attention`). Snapshot reads project
 * open `AttentionItem`s into wire views; confirm/resolve/invalidate delegate
 * to the attention service's compare-and-set commands, so a stale, withdrawn,
 * resolved, or version-conflicted item is never silently confirmed. The
 * `workbench/attention-updated` event still broadcasts after a committed
 * change, and the snapshot version is the journal checkpoint seq.
 * @module @deepseek-ai/dsh-workbench-host
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
import { AttentionItemId } from "../../attention/index.js";
import "../../attention/index.js";
import "../../workbench/journal/index.js";
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { WorkbenchItemId as WorkbenchItemIdValue } from "./runtime.js";
export { WorkbenchItemId } from "./runtime.js";
/** Validate one wire actor identity: non-empty after trim. */
function resolveActor(value) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new TypeError('workbench actor must be a non-empty string');
    }
    return value.trim();
}
/** Validate one wire compare-and-set revision. */
function resolveRevision(value, field) {
    if (!Number.isSafeInteger(value) || value < 1) {
        throw new TypeError(`workbench ${field} must be a positive safe integer`);
    }
    return value;
}
/** Validate one wire free-text field: non-empty after trim. */
function resolveText(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new TypeError(`workbench ${field} must be a non-empty string`);
    }
    return value.trim();
}
/** Project one open attention item into its immutable wire view. */
function viewOf(item) {
    return {
        itemId: WorkbenchItemIdValue(String(item.itemId)),
        kind: item.kind,
        status: item.state,
        entityRevision: item.entityRevision,
        title: item.checkId ?? item.decisionKind,
    };
}
/**
 * Workbench attention inbox (`ctx.workbenchHost`): the M4 client-safe
 * projection over the persistent attention service.
 */
let WorkbenchHostService = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _listSnapshot_decorators;
    let _confirmBatch_decorators;
    let _resolveDecision_decorators;
    let _invalidateItem_decorators;
    return class WorkbenchHostService extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _listSnapshot_decorators = [Remote('listSnapshot')];
            _confirmBatch_decorators = [Remote('confirmBatch')];
            _resolveDecision_decorators = [Remote('resolveDecision')];
            _invalidateItem_decorators = [Remote('invalidateItem')];
            __esDecorate(this, null, _listSnapshot_decorators, { kind: "method", name: "listSnapshot", static: false, private: false, access: { has: obj => "listSnapshot" in obj, get: obj => obj.listSnapshot }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _confirmBatch_decorators, { kind: "method", name: "confirmBatch", static: false, private: false, access: { has: obj => "confirmBatch" in obj, get: obj => obj.confirmBatch }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _resolveDecision_decorators, { kind: "method", name: "resolveDecision", static: false, private: false, access: { has: obj => "resolveDecision" in obj, get: obj => obj.resolveDecision }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _invalidateItem_decorators, { kind: "method", name: "invalidateItem", static: false, private: false, access: { has: obj => "invalidateItem" in obj, get: obj => obj.invalidateItem }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        /** The service projects and delegates to the persistent attention service and reads the journal position. */
        static { this.inject = ['attention', 'workbenchJournal']; }
        constructor(ctx) {
            super(ctx, 'workbenchHost');
            __runInitializers(this, _instanceExtraInitializers);
        }
        /**
         * Read the whole open inbox with per-item compare-and-set revisions.
         * @returns the current snapshot.
         */
        listSnapshot() {
            return {
                snapshotVersion: this.ctx.workbenchJournal.checkpoint().journalSeq,
                items: this.ctx.attention.listOpen().map(viewOf),
            };
        }
        /**
         * Confirm a batch of B-class items in one pass: every still-open
         * revision-matching item resolves, and each target reports its own outcome.
         * @param request - actor plus the compare-and-set targets.
         * @returns per-item results and the post-commit snapshot version.
         */
        async confirmBatch(request) {
            const actor = resolveActor(request.actor);
            const targets = request.items.map(target => ({
                itemId: AttentionItemId(String(target.itemId)),
                expectedEntityRevision: resolveRevision(target.expectedEntityRevision, 'expectedEntityRevision'),
            }));
            const settled = await this.ctx.attention.confirmBatch(targets, actor, randomUUID());
            const changed = [];
            const results = settled.map((row) => {
                if (row.outcome === 'resolved' && row.currentRevision !== undefined) {
                    changed.push({ itemId: WorkbenchItemIdValue(String(row.itemId)), status: 'resolved', entityRevision: row.currentRevision });
                }
                return {
                    itemId: WorkbenchItemIdValue(String(row.itemId)),
                    outcome: row.outcome,
                    ...(row.currentRevision === undefined ? {} : { currentRevision: row.currentRevision }),
                };
            });
            return { snapshotVersion: this.commit(changed), results };
        }
        /**
         * Resolve one C-class decision item; C items are never batched.
         * @param request - compare-and-set target plus the recorded decision text.
         * @returns the single-item outcome and the post-commit snapshot version.
         */
        async resolveDecision(request) {
            const actor = resolveActor(request.actor);
            const decision = resolveText(request.decision, 'decision');
            const revision = resolveRevision(request.expectedEntityRevision, 'expectedEntityRevision');
            const settled = await this.ctx.attention.resolveDecision(String(request.itemId), revision, decision, actor, randomUUID());
            const changed = [];
            if (settled.outcome === 'resolved' && settled.currentRevision !== undefined) {
                changed.push({ itemId: WorkbenchItemIdValue(String(request.itemId)), status: 'resolved', entityRevision: settled.currentRevision });
            }
            return {
                snapshotVersion: this.commit(changed),
                outcome: settled.outcome,
                ...(settled.currentRevision === undefined ? {} : { currentRevision: settled.currentRevision }),
            };
        }
        /**
         * Invalidate one open item upstream: the stale-propagation trigger that
         * makes later confirms report `stale` instead of silently resolving.
         * @param request - compare-and-set target plus the recorded reason.
         * @returns the single-item outcome and the post-commit snapshot version.
         */
        async invalidateItem(request) {
            const actor = resolveActor(request.actor);
            const reason = resolveText(request.reason, 'reason');
            const revision = resolveRevision(request.expectedEntityRevision, 'expectedEntityRevision');
            const settled = await this.ctx.attention.invalidateItem(String(request.itemId), revision, reason, actor, randomUUID());
            const changed = [];
            if (settled.outcome === 'invalidated' && settled.currentRevision !== undefined) {
                changed.push({ itemId: WorkbenchItemIdValue(String(request.itemId)), status: 'invalidated', entityRevision: settled.currentRevision });
            }
            return {
                snapshotVersion: this.commit(changed),
                outcome: settled.outcome,
                ...(settled.currentRevision === undefined ? {} : { currentRevision: settled.currentRevision }),
            };
        }
        /**
         * Resolve the snapshot version from the journal checkpoint and push the
         * change set when it is non-empty. Synchronous listener failures are
         * contained and logged so a committed change never looks failed.
         */
        commit(changed) {
            const snapshotVersion = this.ctx.workbenchJournal.checkpoint().journalSeq;
            if (changed.length === 0)
                return snapshotVersion;
            const update = { snapshotVersion, changed };
            for (const listener of this.ctx.events.dispatch('emit', ['workbench/attention-updated', update])) {
                try {
                    listener(update);
                }
                catch (error) {
                    this.ctx.logger.warn('workbench-host: an attention-updated listener failed: %s', error);
                }
            }
            return snapshotVersion;
        }
    };
})();
export { WorkbenchHostService };
export default WorkbenchHostService;
//# sourceMappingURL=index.js.map