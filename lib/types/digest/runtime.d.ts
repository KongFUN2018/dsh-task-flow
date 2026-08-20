/**
 * Digest derivation: a pure function from the task projection, its phase
 * runs, the journal facts, and the deliverable versions to the `TaskDigest`.
 * No I/O here — the service fetches the inputs, this module folds them.
 * @module @deepseek-ai/dsh-digest/runtime
 */
import type { JournalFact } from '../workbench/journal/index.ts';
import type { DeliverableVersion } from '../deliverable/types.ts';
import type { PhaseRunRecord, TaskRecord } from '../task/types.ts';
import type { TaskDigest } from './types.ts';
/**
 * Fold the digest inputs into the projection.
 * @param task - the task projection.
 * @param phaseRuns - phase runs of the task's current run.
 * @param facts - journal facts of the task, in journal order.
 * @param versions - every deliverable version.
 * @returns the full task digest.
 */
export declare function buildDigest(task: TaskRecord, phaseRuns: readonly PhaseRunRecord[], facts: readonly JournalFact[], versions: readonly DeliverableVersion[]): TaskDigest;
//# sourceMappingURL=runtime.d.ts.map