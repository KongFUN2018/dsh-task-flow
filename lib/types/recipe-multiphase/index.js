/**
 * Per-kind phase executor registry (`ctx.recipeMultiphase`): routes the
 * multi-phase recipe's stages to executors by `RecipePhaseSpec.kind`, and
 * exposes one aggregating `PhaseExecutor` that the assembly registers into
 * recipe-engine-core's single executor slot. The engine closure stays
 * untouched: routing lives here, not in the engine.
 * @module @deepseek-ai/dsh-recipe-multiphase
 */
import { Service } from '@deepseek-ai/cordis';
import "../recipe-engine-core/index.js";
import { RecipeMultiphaseError } from "./types.js";
export { RecipeMultiphaseError } from "./types.js";
/**
 * Registers executors by phase kind and dispatches each phase assignment to
 * the executor registered for its kind. On construction it registers one
 * aggregating executor into the recipe engine, so the engine's single slot
 * fans out by `RecipePhaseSpec.kind` without any engine change.
 */
export class RecipeMultiphaseService extends Service {
    /** The recipe engine, whose single slot the aggregating executor fills. */
    static { this.inject = ['recipeEngine']; }
    /**
     * @param ctx - Host context carrying the recipe engine.
     */
    constructor(ctx) {
        super(ctx, 'recipeMultiphase');
        this.executors = new Map();
    }
    /**
     * Register one executor for a phase kind. Disposal removes it (HMR-safe).
     * @param phaseKind - the `RecipePhaseSpec.kind` value this executor serves.
     * @param executor - the executor performing every phase of that kind.
     * @returns the disposer removing the registration.
     */
    registerExecutor(phaseKind, executor) {
        const kind = phaseKind.trim();
        if (kind === '')
            throw new RecipeMultiphaseError('invalid-kind', 'phase kind must be a non-blank string');
        if (this.executors.has(kind))
            throw new RecipeMultiphaseError('duplicate-kind', `an executor is already registered for phase kind "${kind}"`);
        this.executors.set(kind, executor);
        // The engine recovers eagerly at startup, before executors are wired; a
        // live phase whose kind had no executor defers scheduling instead of
        // aborting. Waking recovery now lets that task resume dispatch. Defensive
        // about a missing/mocked engine (isolated unit tests register executors
        // without a real recipe-engine service).
        const engine = this.ctx.recipeEngine;
        void engine?.retryLive?.();
        return () => {
            if (this.executors.get(kind) === executor)
                this.executors.delete(kind);
        };
    }
    /**
     * The aggregating executor to register into the engine's single slot. It
     * dispatches each assignment to the executor registered for the assignment
     * phase's kind.
     * @returns a `PhaseExecutor` routing by `assignment.phase.kind`.
     */
    aggregatingExecutor() {
        const executors = this.executors;
        return {
            name: 'recipe-multiphase',
            async execute(assignment) {
                const kind = assignment.phase.kind;
                const executor = executors.get(kind);
                if (executor === undefined) {
                    throw new RecipeMultiphaseError('no-executor', `no executor registered for phase kind "${kind}"`);
                }
                return executor.execute(assignment);
            },
        };
    }
    /**
     * The phase kinds with a registered executor, in registration order.
     * @returns the registered kinds.
     */
    listKinds() {
        return [...this.executors.keys()];
    }
    /** Register the aggregating executor into the engine on init. */
    [Service.init]() {
        this.ctx.effect(() => this.ctx.recipeEngine.registerExecutor(this.aggregatingExecutor()), 'recipe-multiphase.executor-registration');
    }
}
export default RecipeMultiphaseService;
//# sourceMappingURL=index.js.map