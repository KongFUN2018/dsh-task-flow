/**
 * Per-kind phase executor registry (`ctx.recipeMultiphase`): routes the
 * multi-phase recipe's stages to executors by `RecipePhaseSpec.kind`, and
 * exposes one aggregating `PhaseExecutor` that the assembly registers into
 * recipe-engine-core's single executor slot. The engine closure stays
 * untouched: routing lives here, not in the engine.
 * @module @deepseek-ai/dsh-recipe-multiphase
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import '../recipe-engine-core/index.ts';
import type { PhaseExecutor } from '../recipe-engine-core/types.ts';
export type * from './types.ts';
export { RecipeMultiphaseError } from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        recipeMultiphase: RecipeMultiphaseService;
    }
}
/**
 * Registers executors by phase kind and dispatches each phase assignment to
 * the executor registered for its kind. On construction it registers one
 * aggregating executor into the recipe engine, so the engine's single slot
 * fans out by `RecipePhaseSpec.kind` without any engine change.
 */
export declare class RecipeMultiphaseService extends Service {
    /** The recipe engine, whose single slot the aggregating executor fills. */
    static inject: string[];
    private readonly executors;
    /**
     * @param ctx - Host context carrying the recipe engine.
     */
    constructor(ctx: Context);
    /**
     * Register one executor for a phase kind. Disposal removes it (HMR-safe).
     * @param phaseKind - the `RecipePhaseSpec.kind` value this executor serves.
     * @param executor - the executor performing every phase of that kind.
     * @returns the disposer removing the registration.
     */
    registerExecutor(phaseKind: string, executor: PhaseExecutor): () => void;
    /**
     * The aggregating executor to register into the engine's single slot. It
     * dispatches each assignment to the executor registered for the assignment
     * phase's kind.
     * @returns a `PhaseExecutor` routing by `assignment.phase.kind`.
     */
    aggregatingExecutor(): PhaseExecutor;
    /**
     * The phase kinds with a registered executor, in registration order.
     * @returns the registered kinds.
     */
    listKinds(): string[];
    /** Register the aggregating executor into the engine on init. */
    protected [Service.init](): void;
}
export default RecipeMultiphaseService;
//# sourceMappingURL=index.d.ts.map