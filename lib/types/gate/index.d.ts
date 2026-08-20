/**
 * Complex-gate service (`ctx.gate`): recognizes B/C gate checks and advances
 * the covered phase run to `awaiting-decision`, so the M4 attention service
 * can collect a decision. The engine still runs A checks and records their
 * verdicts (now with `uncoveredScope` + `evidenceRefs`); B/C checks carry no
 * machine verdict, so this service never writes a passed/failed result.
 * @module @deepseek-ai/dsh-gate
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import '../attention/index.ts';
import '../recipe/index.ts';
import '../task/index.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        gate: GateService;
    }
}
/**
 * Watches gate-running phase runs and parks any run whose recipe declares a
 * B/C check for the phase, awaiting an external decision. A-check-only runs
 * pass through untouched so the engine can settle them.
 */
export declare class GateService extends Service {
    /** Task, recipe, and attention services: read the pinned checks, create the decision items, and write the transition. */
    static inject: string[];
    /**
     * @param ctx - Host context carrying the task and recipe services.
     */
    constructor(ctx: Context);
    /** Listen for gate-running phase runs and park the complex-gate ones. */
    protected [Service.init](): void;
    /**
     * Create one decision item per B/C check on a gate-running phase run, then
     * advance the run to awaiting-decision. A-check-only runs are left for the
     * engine.
     * @param phaseRun - the gate-running run the event reported.
     */
    private maybeAwaitDecision;
}
export default GateService;
//# sourceMappingURL=index.d.ts.map