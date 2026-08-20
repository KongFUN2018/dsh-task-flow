/**
 * Impact-propagation type surface: the task-plane application of one
 * deliverable-side impact snapshot. Types only — no runtime code.
 * @module @deepseek-ai/dsh-impact-propagation/types
 */
import type { GateCheckResult, PhaseRunRecord } from '../task/types.ts';
/** The task-plane writes one `apply` performed. */
export interface ImpactApplication {
    /** Phase runs this call transitioned into `stale`; already-stale runs are skipped. */
    readonly staledPhaseRuns: readonly PhaseRunRecord[];
    /** Gate-check verdicts this call annotated stale, across all covered submissions. */
    readonly staledGateChecks: readonly GateCheckResult[];
}
//# sourceMappingURL=types.d.ts.map