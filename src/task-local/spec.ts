/**
 * The task-local storage-domain declaration: one table per task-flow
 * entity, keyed by the entity's branded id, plus the per-submission gate
 * result list. Fact keys pair each projection write with its journal fact.
 * @module @deepseek-ai/dsh-task-local/src/spec
 */

import { z } from 'zod'
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import type {
  GateCheckResult,
  PhaseRunRecord,
  PhaseSubmission,
  TaskRecord,
  TaskRunRecord,
} from '../task/types.ts'
import type { TaskLocalFactKind } from './types.ts'

/** Wire string branded at the durable boundary. */
const idString = z.string().min(1)

/** Frozen recipe identity pinned on task and run records. */
const pinnedRecipe = z.object({
  recipeId: idString,
  revision: z.number().int().min(1),
  schemaVersion: z.number().int().min(1),
  contentHash: z.string().min(1),
})

/** Durable task projection schema. */
// Zod infers transformed branded fields structurally, so it cannot name the
// frozen wire interface even though every branded output is created here.
export const taskRecordSchema = z.object({
  taskId: idString,
  workspaceId: idString,
  pinnedRecipe,
  state: z.enum([
    'planning', 'running', 'awaiting-input', 'awaiting-decision', 'pausing',
    'paused', 'cancelling', 'cancelled', 'completed', 'failed',
  ]),
  revision: z.number().int().min(1),
  currentRunId: idString.optional(),
  idempotencyKey: z.string().min(1).optional(),
  createdAt: z.number().int().min(1),
}) as unknown as z.ZodType<TaskRecord>

/** Durable task-run projection schema. */
export const taskRunRecordSchema = z.object({
  runId: idString,
  taskId: idString,
  pinnedRecipe,
  revision: z.number().int().min(1),
  parentRunId: idString.optional(),
  createdAt: z.number().int().min(1),
}) as unknown as z.ZodType<TaskRunRecord>

/** Durable phase-run projection schema. */
export const phaseRunRecordSchema = z.object({
  phaseRunId: idString,
  runId: idString,
  taskId: idString,
  phaseId: idString,
  state: z.enum([
    'created', 'scheduled', 'running', 'submitting', 'submitted',
    'gate-running', 'awaiting-input', 'awaiting-decision', 'patching',
    'stale', 'passed', 'failed', 'superseded', 'cancelled',
  ]),
  revision: z.number().int().min(1),
  activeSubmissionId: idString.optional(),
  sessionId: z.string().optional(),
  schedulingFrozen: z.boolean().optional(),
}) as unknown as z.ZodType<PhaseRunRecord>

/** Deliverable version reference inside a submission. */
const versionRef = z.object({
  deliverableId: idString,
  versionId: idString,
})

/** Immutable phase submission schema. */
export const phaseSubmissionSchema = z.object({
  submissionId: idString,
  taskId: idString,
  taskRunId: idString,
  phaseRunId: idString,
  phaseId: idString,
  attempt: z.number().int().min(1),
  pinnedRecipe,
  sourceSessionId: idString,
  sourceSeqRange: z.object({ start: z.number().int().min(0), end: z.number().int().min(0) }),
  inputVersions: z.array(versionRef),
  outputVersions: z.array(versionRef),
  unresolvedIssues: z.array(z.string()),
  result: z.enum(['completed', 'needs-clarification', 'failed']),
  failureReason: z.string().optional(),
  idempotencyKey: z.string().min(1),
  submittedAt: z.number().int().min(1),
  supersedesSubmissionId: idString.optional(),
}) as unknown as z.ZodType<PhaseSubmission>

/** Gate-check verdict list stored per submission, in recording order. */
export const gateResultsSchema = z.array(z.object({
  submissionId: idString,
  checkId: idString,
  passed: z.boolean(),
  detail: z.string().optional(),
  recordedAt: z.number().int().min(1),
  uncoveredScope: z.array(z.string()).optional(),
  evidenceRefs: z.array(z.string()).optional(),
})) as unknown as z.ZodType<GateCheckResult[]>

/** The task-local domain: identity, format version, and the entity tables. */
export const taskLocalDomainSpec = defineDomain({
  name: 'task_local',
  version: 1,
  tables: {
    tasks: domainTable<string, TaskRecord>(taskRecordSchema),
    task_runs: domainTable<string, TaskRunRecord>(taskRunRecordSchema),
    phase_runs: domainTable<string, PhaseRunRecord>(phaseRunRecordSchema),
    submissions: domainTable<string, PhaseSubmission>(phaseSubmissionSchema),
    gate_results: domainTable<string, GateCheckResult[]>(gateResultsSchema),
  },
})

/**
 * Journal-fact idempotency key of one projection write: deterministic in
 * the post-commit entity revision, so a retried write replays the stored
 * fact instead of appending a second one.
 * @param kind - the fact kind this provider owns for the write.
 * @param entityId - the written entity's id.
 * @param entityRevision - the post-commit revision the write produced.
 * @returns the deterministic fact key.
 */
export function taskFactKey(kind: TaskLocalFactKind, entityId: string, entityRevision: number): string {
  return `${kind}:${entityId}:${entityRevision}`
}
