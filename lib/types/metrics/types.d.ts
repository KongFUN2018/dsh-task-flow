/**
 * Workbench metrics types (`ctx.metrics`): journal/entity-derived KPI
 * counts and per-task measures. Types only — no runtime code.
 * @module @deepseek-ai/dsh-metrics/types
 */
/** Gate pass rates per class, as fractions of passed over total verdicts. */
export interface GatePassRate {
    /** Machine-mandatory checks; absent pre-M6 verdicts default to A. */
    readonly a: number;
    readonly b: number;
    readonly c: number;
}
/** One throughput bucket: completed phases per day. */
export interface ThroughputDay {
    readonly day: string;
    readonly completedPhases: number;
}
/** Whole-workbench KPI projection. */
export interface WorkbenchMetrics {
    /** Tasks in a pre-terminal working state. */
    readonly live: number;
    /** Open B-confirm + C-decision attention items. */
    readonly gate: number;
    /** Open clarification attention items. */
    readonly ask: number;
    /** Current deliverable version count. */
    readonly asset: number;
    /** Completed phases per day over the window (default 7 days). */
    readonly throughput: readonly ThroughputDay[];
    readonly gatePassRate: GatePassRate;
}
/** One phase duration measure; absent when the phase has not settled. */
export interface PhaseDuration {
    readonly phaseId: string;
    readonly startedAt?: number;
    readonly passedAt?: number;
    /** Settled duration in ms; absent while the phase is still running. */
    readonly durationMs?: number;
}
/** Per-task measures. */
export interface TaskMetrics {
    readonly taskId: string;
    readonly phaseDurations: readonly PhaseDuration[];
    /** Rewind applications plus retried submissions. */
    readonly rerunCount: number;
    /** Resolved attention decisions. */
    readonly decisionCount: number;
    /** Budget ledger spend when a budget record exists. */
    readonly budgetUsed?: {
        readonly tokens: number;
        readonly durationMs: number;
        readonly reruns: number;
    };
}
//# sourceMappingURL=types.d.ts.map