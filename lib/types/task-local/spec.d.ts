/**
 * The task-local storage-domain declaration: one table per task-flow
 * entity, keyed by the entity's branded id, plus the per-submission gate
 * result list. Fact keys pair each projection write with its journal fact.
 * @module @deepseek-ai/dsh-task-local/src/spec
 */
import { z } from 'zod';
import type { GateCheckResult, PhaseRunRecord, PhaseSubmission, TaskRecord, TaskRunRecord } from '../task/types.ts';
import type { TaskLocalFactKind } from './types.ts';
/** Durable task projection schema. */
export declare const taskRecordSchema: z.ZodType<TaskRecord>;
/** Durable task-run projection schema. */
export declare const taskRunRecordSchema: z.ZodType<TaskRunRecord>;
/** Durable phase-run projection schema. */
export declare const phaseRunRecordSchema: z.ZodType<PhaseRunRecord>;
/** Immutable phase submission schema. */
export declare const phaseSubmissionSchema: z.ZodType<PhaseSubmission>;
/** Gate-check verdict list stored per submission, in recording order. */
export declare const gateResultsSchema: z.ZodType<GateCheckResult[]>;
/** The task-local domain: identity, format version, and the entity tables. */
export declare const taskLocalDomainSpec: {
    name: string;
    version: number;
    tables: {
        tasks: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, TaskRecord>;
        task_runs: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, TaskRunRecord>;
        phase_runs: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, PhaseRunRecord>;
        submissions: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, PhaseSubmission>;
        gate_results: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, GateCheckResult[]>;
    };
};
/**
 * Journal-fact idempotency key of one projection write: deterministic in
 * the post-commit entity revision, so a retried write replays the stored
 * fact instead of appending a second one.
 * @param kind - the fact kind this provider owns for the write.
 * @param entityId - the written entity's id.
 * @param entityRevision - the post-commit revision the write produced.
 * @returns the deterministic fact key.
 */
export declare function taskFactKey(kind: TaskLocalFactKind, entityId: string, entityRevision: number): string;
//# sourceMappingURL=spec.d.ts.map