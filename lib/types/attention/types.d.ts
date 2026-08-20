/**
 * Types of the persistent attention inbox (`ctx.attention`): the branded
 * item id, the `AttentionItem` entity, the create input, and the command
 * outcome ladder. Types only �?no runtime code.
 * @module @deepseek-ai/dsh-attention
 */
import type { Branded } from '@deepseek-ai/dsh-brand';
import type { PhaseRunId, SubmissionId, TaskId, TaskRunId } from '../task/types.ts';
/** Identifies one attention item across its revisions. */
export type AttentionItemId = Branded<'AttentionItemId'>;
/** Presentation class of one item: B batches, C never does, plus linked kinds. */
export type AttentionItemKind = 'b-confirm' | 'c-decision' | 'clarification' | 'recovery';
/** Lifecycle of one attention item. */
export type AttentionItemState = 'open' | 'resolved' | 'invalidated' | 'stale';
/** One durable business-decision item; one per gate check or per task decision. */
export interface AttentionItem {
    /** Stable item identity; the creating service derives it deterministically. */
    readonly itemId: AttentionItemId;
    readonly taskId: TaskId;
    readonly runId?: TaskRunId;
    readonly phaseRunId?: PhaseRunId;
    readonly submissionId?: SubmissionId;
    /** Gate check this item records; present when a gate check created it. */
    readonly checkId?: string;
    /** Presentation class (b-confirm / c-decision / clarification / recovery). */
    readonly kind: AttentionItemKind;
    /** Business decision kind: gate / clarification / recovery (M5: rewind/budget/trust/breaker). */
    readonly decisionKind: string;
    /** M5 rewind impact preview; no M4 writer. */
    readonly impactSnapshot?: string;
    /** Decision options; `resolveDecision` requires an optionId from this list. */
    readonly options: readonly string[];
    readonly state: AttentionItemState;
    /** Compare-and-set revision; every committed mutation increments it. */
    readonly entityRevision: number;
    readonly openedAt: number;
    readonly resolvedAt?: number;
    readonly resolvedBy?: string;
    /** Resolved optionId, set when state becomes resolved. */
    readonly outcome?: string;
    /** M5 rewind reversal deadline; no M4 writer. */
    readonly reversibleUntil?: number;
}
/** Payload for creating one attention item. */
export interface CreateItemInput {
    /** Caller-supplied stable id; replays with the same key return the stored item. */
    readonly itemId: AttentionItemId;
    readonly taskId: TaskId;
    readonly runId?: TaskRunId;
    readonly phaseRunId?: PhaseRunId;
    readonly submissionId?: SubmissionId;
    readonly checkId?: string;
    readonly kind: AttentionItemKind;
    readonly decisionKind: string;
    /** Serialized impact preview the decision reads (rewind); M4 reserved, M5 writes. */
    readonly impactSnapshot?: string;
    readonly options: readonly string[];
}
/** One compare-and-set target in a batch confirm. */
export interface ConfirmTarget {
    readonly itemId: AttentionItemId;
    readonly expectedEntityRevision: number;
}
/** Outcome ladder shared by decision and batch-confirm commands. */
export type DecisionOutcome = 'resolved' | 'conflict' | 'stale' | 'withdrawn' | 'already-resolved';
/** Outcome ladder of the upstream-invalidation command. */
export type InvalidateOutcome = 'invalidated' | 'conflict' | 'stale' | 'withdrawn' | 'already-resolved';
/** Result of one decision command; `currentRevision` present when the item exists. */
export interface DecisionResult {
    readonly outcome: DecisionOutcome;
    readonly currentRevision?: number;
}
/** Per-item result of a batch confirm, in request order. */
export interface ConfirmResult {
    readonly itemId: AttentionItemId;
    readonly outcome: DecisionOutcome;
    readonly currentRevision?: number;
}
/** Result of one invalidation command. */
export interface InvalidateResult {
    readonly outcome: InvalidateOutcome;
    readonly currentRevision?: number;
}
/** Machine-routable failure codes. */
export type AttentionErrorCode = 'invalid-argument' | 'not-found' | 'conflict';
/** Journal fact kinds this package appends. */
export type AttentionFactKind = 'attention/item-created' | 'attention/item-resolved' | 'attention/item-invalidated';
//# sourceMappingURL=types.d.ts.map