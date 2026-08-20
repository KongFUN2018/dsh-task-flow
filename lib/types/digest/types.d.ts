/**
 * Task digest types (`ctx.digest`): the journal-derived read projection of
 * one task — run branches, timeline, phase summaries, decision history, and
 * deliverable states. Types only — no runtime code.
 * @module @deepseek-ai/dsh-digest/types
 */
import type { TaskId } from '../task/types.ts';
/** One task-run branch; `parentRunId` chains rewind successors. */
export interface DigestRunBranch {
    readonly runId: string;
    readonly parentRunId?: string;
    readonly createdAt: number;
    /** Set when a rewind superseded this branch; archived, read-only. */
    readonly supersededAt?: number;
}
/** One journal fact projected for the task timeline, in journal order. */
export interface DigestTimelineEntry {
    readonly seq: number;
    readonly kind: string;
    readonly occurredAt: number;
    readonly actor: string;
    readonly summary: string;
}
/** One phase of the task's current run: state, attempts, and pass/fail times. */
export interface DigestPhaseSummary {
    readonly phaseId: string;
    readonly state: string;
    readonly attemptCount: number;
    readonly passedAt?: number;
    readonly failedAt?: number;
}
/** One recorded business decision (attention item resolved), from journal facts. */
export interface DigestDecision {
    readonly decisionKind: string;
    readonly outcome?: string;
    readonly resolvedAt?: number;
}
/** One deliverable family: current valid version and total version count. */
export interface DigestDeliverableState {
    readonly deliverableId: string;
    readonly currentVersionId?: string;
    readonly state: string;
    readonly versionCount: number;
}
/** The full per-task digest projection. */
export interface TaskDigest {
    readonly taskId: TaskId;
    readonly state: string;
    readonly revision: number;
    /** Run branches newest-first; the first entry is the current run. */
    readonly runs: readonly DigestRunBranch[];
    readonly timeline: readonly DigestTimelineEntry[];
    readonly phaseSummaries: readonly DigestPhaseSummary[];
    readonly decisionHistory: readonly DigestDecision[];
    readonly deliverableStates: readonly DigestDeliverableState[];
}
//# sourceMappingURL=types.d.ts.map