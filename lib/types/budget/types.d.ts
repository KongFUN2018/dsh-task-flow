/**
 * Types of the task budget ledger (`ctx.budget`): the durable record, the
 * explicit limits, the usage intake, and the command error ladder. Types
 * only — no runtime code.
 * @module @deepseek-ai/dsh-budget/types
 */
import type { Branded } from '@deepseek-ai/dsh-brand';
import type { TaskId } from '../task/types.ts';
/** Identifies one budget ledger record. */
export type BudgetRecordId = Branded<'BudgetRecordId'>;
/** The three budget dimensions; each is independently limited and tracked. */
export type BudgetDimension = 'tokens' | 'durationMs' | 'reruns';
/** Explicit per-task limits; at least one dimension, never defaulted. */
export interface BudgetLimits {
    readonly maxTokens?: number;
    readonly maxDurationMs?: number;
    readonly maxReruns?: number;
}
/** One explicit usage intake; absent dimensions spend nothing. */
export interface BudgetUsage {
    readonly tokens?: number;
    readonly durationMs?: number;
    readonly reruns?: number;
}
/** Accumulated spend; every dimension is always present. */
export interface BudgetSpent {
    readonly tokens: number;
    readonly durationMs: number;
    readonly reruns: number;
}
/** One durable per-task budget ledger record. */
export interface BudgetRecord {
    readonly recordId: BudgetRecordId;
    readonly taskId: TaskId;
    /** Explicit limits; at least one dimension is finite. */
    readonly limits: BudgetLimits;
    readonly spent: BudgetSpent;
    /** Increments on every append; a new revision re-arms the warning latch. */
    readonly revision: number;
    /** Dimensions already warned at the current revision. */
    readonly warned: readonly BudgetDimension[];
}
/** Machine-routable budget failure codes. */
export type BudgetErrorCode = 'not-found' | 'already-provisioned' | 'invalid-argument' | 'stale-revision' | 'invalid-transition' | 'not-resolved' | 'invalid-option';
/** Budget failure with code and message. */
export declare class BudgetError extends Error {
    /** Machine-routable failure code. */
    readonly code: BudgetErrorCode;
    constructor(code: BudgetErrorCode, message: string);
}
//# sourceMappingURL=types.d.ts.map