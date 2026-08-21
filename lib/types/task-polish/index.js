/**
 * Task-polish service (`ctx.taskPolish`): a lightweight, on-demand remote to
 * have the LLM clarify/sharpers a task goal before the task is created. It is
 * a stateless text transform — it never touches the task plane, never opens a
 * task phase or agent session. The caller (the create wizard's "AI 优化" button)
 * triggers it explicitly; nothing here runs automatically.
 *
 * Model routing follows the host's existing LLM topology: it picks the first
 * registered provider and its first disclosed model (looking up `llm`'s live
 * route catalog), so no provider/model is hard-coded and the call rides the
 * same adapters the rest of the harness uses. If no provider or model is
 * available, it throws a controlled `TaskPolishError` and the UI keeps the
 * user's draft untouched.
 * @module @deepseek-ai/dsh-task-polish
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
import { createUserMessage } from '@deepseek-ai/dsh-llm';
/** Controlled polish failure; keeps the caller's text on error. */
export class TaskPolishError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'TaskPolishError';
    }
}
/** The system instruction for clarifying a task goal. */
const POLISH_SYSTEM = [
    'You are assisting a user who is about to create a task from a workflow recipe.',
    'Clarify and sharpen the user\'s task goal: make it specific, measurable, outcome-focused,',
    'and actionable. Keep the user\'s intent and scope. Return ONLY the rewritten goal text,',
    'without commentary, quotes, or a preamble.',
].join(' ');
/** The preferred provider id when several are registered (checked first). */
const PREFERRED_PROVIDERS = ['deepseek', 'pi-ai'];
let TaskPolishService = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _polish_decorators;
    return class TaskPolishService extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _polish_decorators = [Remote('polish')];
            __esDecorate(this, null, _polish_decorators, { kind: "method", name: "polish", static: false, private: false, access: { has: obj => "polish" in obj, get: obj => obj.polish }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static { this.inject = ['llm']; }
        constructor(ctx) {
            super(ctx, 'taskPolish');
            __runInitializers(this, _instanceExtraInitializers);
        }
        /**
         * One-shot LLM rewrite of a task goal.
         * @param goal - the raw user-entered goal text (non-empty; trimmed here).
         * @returns the clarified goal text from the model.
         */
        async polish(goal) {
            const text = goal.trim();
            if (text === '')
                throw new TaskPolishError('generation-failed', 'goal is empty');
            const providers = this.ctx.llm.listProviders();
            if (providers.length === 0)
                throw new TaskPolishError('no-provider', 'no LLM provider is registered');
            const provider = PREFERRED_PROVIDERS.find(id => providers.some(p => p.id === id)) ?? providers[0].id;
            const models = await this.ctx.llm.listModels(provider);
            const model = models[0]?.id;
            if (model === undefined)
                throw new TaskPolishError('no-model', `provider "${provider}" discloses no model`);
            const prepared = await this.ctx.llm.prepareCall({ provider, model, temperature: 0.4 });
            const system = POLISH_SYSTEM;
            let out = '';
            for await (const chunk of prepared.stream({
                provider,
                model,
                system,
                messages: [createUserMessage({ source: { kind: 'user' }, content: [{ type: 'text', text }] })],
            })) {
                if (chunk.type === 'text-delta')
                    out += chunk.text;
            }
            const polished = out.trim();
            if (polished === '')
                throw new TaskPolishError('generation-failed', 'model produced no text');
            return polished;
        }
    };
})();
export { TaskPolishService };
export default TaskPolishService;
//# sourceMappingURL=index.js.map