/**
 * Metrics derivation: pure functions from entity projections and journal
 * facts to the KPI and per-task measures. No I/O here — the service fetches
 * the inputs, this module folds them.
 * @module @deepseek-ai/dsh-metrics/runtime
 */
import type { JournalFact } from '../workbench/journal/index.ts';
import type { AttentionItemView } from '../workbench/host/types.ts';
import type { DeliverableVersion } from '../deliverable/types.ts';
import type { TaskRecord } from '../task/types.ts';
import type { PhaseDuration, WorkbenchMetrics } from './types.ts';
/** Window length for throughput and pass-rate aggregations, in days. */
export declare const METRICS_WINDOW_DAYS = 7;
/**
 * Fold the workbench KPI projection.
 * @param tasks - every task projection.
 * @param items - the attention inbox snapshot items.
 * @param versions - every deliverable version.
 * @param facts - the whole journal, in journal order.
 * @returns the KPI counts, throughput buckets, and gate pass rates.
 */
export declare function buildWorkbenchMetrics(tasks: readonly TaskRecord[], items: readonly AttentionItemView[], versions: readonly DeliverableVersion[], facts: readonly JournalFact[]): WorkbenchMetrics;
/** Per-task measures shape; kept here so the fold signature stays short. */
interface TaskMeasures {
    readonly taskId: string;
    readonly phaseDurations: readonly PhaseDuration[];
    readonly rerunCount: number;
    readonly decisionCount: number;
    readonly budgetUsed?: {
        readonly tokens: number;
        readonly durationMs: number;
        readonly reruns: number;
    };
}
/**
 * Fold per-task measures.
 * @param task - the task projection.
 * @param facts - journal facts of the task.
 * @param budget - the budget ledger record, when one exists.
 * @returns the per-task measures.
 */
export declare function buildTaskMetrics(task: TaskRecord, facts: readonly JournalFact[], budget?: {
    readonly tokens: number;
    readonly durationMs: number;
    readonly reruns: number;
}): TaskMeasures;
export {};
//# sourceMappingURL=runtime.d.ts.map