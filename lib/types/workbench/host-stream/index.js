/**
 * Attention incremental-stream host service (`ctx.workbenchHostStream`):
 * projects the workbench journal's attention facts into a cursor-ordered
 * change stream. A client reads a snapshot, then advances by `cursor`
 * (a journal sequence) with `listIncremental`; events carry the journal
 * event id for dedupe and the post-commit entity revision for optimistic
 * concurrency. The stream id is a per-boot epoch: when it changes the client
 * discards its cursor and resnapshots.
 * @module @deepseek-ai/dsh-workbench-host-stream
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
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import "../../workbench/journal/index.js";
/** Fact-kind prefix of every attention fact this stream narrows. */
const ATTENTION_KIND_PREFIX = 'attention/';
/** Narrow one journal fact kind to its stream operation. */
function operationOf(kind) {
    switch (kind) {
        case 'attention/item-created': return 'created';
        case 'attention/item-resolved': return 'resolved';
        case 'attention/item-invalidated': return 'invalidated';
        default: return 'updated';
    }
}
/** Extract the itemId a fact mutated; attention facts always carry a string itemId. */
function entityIdOf(fact) {
    const payload = fact.payload;
    if (typeof payload === 'object' && payload !== null && !Array.isArray(payload)) {
        const itemId = payload['itemId'];
        if (typeof itemId === 'string')
            return itemId;
    }
    return '';
}
/** Project one attention journal fact into the stream envelope. */
function eventOf(fact) {
    return {
        cursor: fact.journalSeq,
        previousCursor: fact.journalSeq - 1,
        eventId: String(fact.eventId),
        entityKind: 'attention',
        entityId: entityIdOf(fact),
        entityRevision: fact.entityRevision,
        operation: operationOf(fact.kind),
        payload: fact.payload,
    };
}
/**
 * Attention incremental stream: the M4 cursor-based change feed over the
 * persistent attention inbox, derived from the append-only workbench journal.
 */
let WorkbenchHostStreamService = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _listIncremental_decorators;
    return class WorkbenchHostStreamService extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _listIncremental_decorators = [Remote('listIncremental')];
            __esDecorate(this, null, _listIncremental_decorators, { kind: "method", name: "listIncremental", static: false, private: false, access: { has: obj => "listIncremental" in obj, get: obj => obj.listIncremental }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        /** The service reads the workbench journal; it owns no durable domain. */
        static { this.inject = ['workbenchJournal']; }
        constructor(ctx) {
            super(ctx, 'workbenchHostStream');
            /** Per-boot epoch; a client holding a cursor from another boot resnapshots. */
            this.streamId = (__runInitializers(this, _instanceExtraInitializers), randomUUID());
        }
        /**
         * Read the attention change events after a journal cursor and the new cursor.
         * @param cursor - exclusive journal lower bound; omitted or non-positive replays the whole stream.
         * @returns the events in journal order plus this boot's stream id and cursor.
         */
        listIncremental(cursor) {
            const after = cursor === undefined || !Number.isFinite(cursor) || cursor <= 0 ? 0 : Math.floor(cursor);
            const facts = this.ctx.workbenchJournal.replay(after);
            const events = facts
                .filter(fact => fact.kind.startsWith(ATTENTION_KIND_PREFIX))
                .map(eventOf);
            return {
                streamId: this.streamId,
                cursor: this.ctx.workbenchJournal.checkpoint().journalSeq,
                events,
            };
        }
    };
})();
export { WorkbenchHostStreamService };
export default WorkbenchHostStreamService;
//# sourceMappingURL=index.js.map