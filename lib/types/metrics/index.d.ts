/**
 * Metrics service (`ctx.metrics`): the M6 workbench KPI projection and
 * per-task measures, derived from the entity projections and the journal.
 * Pure read: it never writes the task plane, never opens attention items,
 * and never touches Gate or scheduling.
 * @module @deepseek-ai/dsh-metrics
 */
import { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import '../task/index.ts';
import '../workbench/host/index.ts';
import '../workbench/journal/index.ts';
import '../deliverable/index.ts';
import type { TaskMetrics, WorkbenchMetrics } from './types.ts';
export type { WorkbenchMetrics, TaskMetrics, GatePassRate, ThroughputDay, PhaseDuration } from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        metrics: MetricsService;
    }
}
/** Metrics read errors; no write-side ladder exists. */
export declare class MetricsError extends Error {
    readonly code: 'not-found' | 'invalid-argument';
    constructor(code: 'not-found' | 'invalid-argument', message: string);
}
/** The metrics service: read-only KPI and per-task measures. */
export declare class MetricsService extends TypertRemoteService {
    /** The service aggregates the task plane, the inbox, the versions, and the journal. */
    static inject: string[];
    /**
     * @param ctx - Host context carrying the aggregate services.
     */
    constructor(ctx: Context);
    /**
     * Fold the whole-workbench KPI projection.
     * @returns the KPI counts, throughput buckets, and gate pass rates.
     */
    metrics(): Promise<WorkbenchMetrics>;
    /**
     * Fold one task's measures.
     * @param taskId - the task to measure.
     * @returns the per-task measures.
     */
    taskMetrics(taskId: string): Promise<TaskMetrics>;
    /** Validate one non-empty wire field, returning the trimmed value. */
    private requireText;
}
export default MetricsService;
//# sourceMappingURL=index.d.ts.map