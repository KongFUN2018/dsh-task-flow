/**
 * Task-flow task type surface: branded identities, pinned-recipe projections,
 * the PhaseSubmission record, mutation context, gate results, failures, and
 * the forwarded update events. Types only â€?no runtime code.
 * @module @deepseek-ai/dsh-task/types
 */

import type { Branded } from '@deepseek-ai/dsh-brand'
import type { RecipeId } from '../recipe/types.ts'

/** Identifies one task across its revisions. */
export type TaskId = Branded<'TaskId'>
/** Identifies one task run. */
export type TaskRunId = Branded<'TaskRunId'>
/** Identifies one phase run. */
export type PhaseRunId = Branded<'PhaseRunId'>
/** Identifies one phase submission (immutable). */
export type SubmissionId = Branded<'SubmissionId'>
/** Identifies one deliverable family. */
export type DeliverableId = Branded<'DeliverableId'>
/** Identifies one immutable deliverable version. */
export type DeliverableVersionId = Branded<'DeliverableVersionId'>

/** Durable task lifecycle states. */
export type TaskState =
  | 'planning'
  | 'running'
  | 'awaiting-input'
  | 'awaiting-decision'
  | 'pausing'
  | 'paused'
  | 'cancelling'
  | 'cancelled'
  | 'completed'
  | 'failed'

/** Durable phase-run lifecycle states. */
export type PhaseRunState =
  | 'created'
  | 'scheduled'
  | 'running'
  | 'submitting'
  | 'submitted'
  | 'gate-running'
  | 'awaiting-input'
  | 'awaiting-decision'
  | 'patching'
  | 'stale'
  | 'passed'
  | 'failed'
  | 'superseded'
  | 'cancelled'

/** Recipe identity pinned on one task, hash included for recovery checks. */
export interface PinnedRecipe {
  readonly recipeId: RecipeId
  readonly revision: number
  readonly schemaVersion: number
  readonly contentHash: string
}

/** Durable task projection. */
export interface TaskRecord {
  readonly taskId: TaskId
  readonly workspaceId: string
  readonly pinnedRecipe: PinnedRecipe
  readonly state: TaskState
  /** Compare-and-set revision; every durable mutation increments it. */
  readonly revision: number
  readonly currentRunId?: TaskRunId
  readonly idempotencyKey?: string
  readonly createdAt: number
}

/** Durable task-run projection. */
export interface TaskRunRecord {
  readonly runId: TaskRunId
  readonly taskId: TaskId
  readonly pinnedRecipe: PinnedRecipe
  readonly revision: number
  readonly parentRunId?: TaskRunId
  readonly createdAt: number
}

/** Durable phase-run projection. */
export interface PhaseRunRecord {
  readonly phaseRunId: PhaseRunId
  readonly runId: TaskRunId
  readonly taskId: TaskId
  readonly phaseId: string
  readonly state: PhaseRunState
  readonly revision: number
  readonly activeSubmissionId?: SubmissionId
  /** The phase-session id the engine opened for this run; clarification recovery uses it. */
  readonly sessionId?: string
  /** Declared for the M2 edit-lock immediate scheduling freeze; no M1 command writes it. */
  readonly schedulingFrozen?: boolean
}

/** Reference to one deliverable version from a submission. */
export interface DeliverableVersionRef {
  readonly deliverableId: DeliverableId
  readonly versionId: DeliverableVersionId
}

/** Submission verdict: complete, in need of clarification, or failed. */
export type SubmissionResult = 'completed' | 'needs-clarification' | 'failed'

/** One immutable phase submission, per the phase-submission protocol. */
export interface PhaseSubmission {
  readonly submissionId: SubmissionId
  readonly taskId: TaskId
  readonly taskRunId: TaskRunId
  readonly phaseRunId: PhaseRunId
  readonly phaseId: string
  readonly attempt: number
  readonly pinnedRecipe: PinnedRecipe
  readonly sourceSessionId: string
  readonly sourceSeqRange: { readonly start: number; readonly end: number }
  readonly inputVersions: readonly DeliverableVersionRef[]
  readonly outputVersions: readonly DeliverableVersionRef[]
  readonly unresolvedIssues: readonly string[]
  readonly result: SubmissionResult
  readonly failureReason?: string
  readonly idempotencyKey: string
  readonly submittedAt: number
  readonly supersedesSubmissionId?: SubmissionId
}

/** External acceptance facts the submission caller computes. */
export interface SubmissionEnvironmentFacts {
  /** Actor submitting; recorded as the journal fact's actor on acceptance. */
  readonly submittedBy: string
  /** The source session log persisted through the submission's sequence range. */
  readonly sourceSeqPersisted: boolean
  /** Every input deliverable version is still the current one. */
  readonly inputsCurrent: boolean
  /** Every output deliverable version exists and traces to this submission. */
  readonly outputsValid: boolean
}

/** One recorded gate-check verdict. */
export interface GateCheckResult {
  readonly submissionId: SubmissionId
  readonly checkId: string
  readonly passed: boolean
  /** Gate class (M6): 'A' machine-mandatory, 'B' machine+human confirm, 'C' human arbitration.
   *  Absent on pre-M6 records; readers default to 'A'. */
  readonly kind?: 'A' | 'B' | 'C'
  readonly detail?: string
  readonly recordedAt: number
  /** Set by impact propagation when the closure covers this verdict; a staled verdict supports no pass decision. */
  readonly stale?: boolean
  /** Machine-uncovered scope recorded with the verdict (M3). */
  readonly uncoveredScope?: readonly string[]
  /** Evidence references backing the verdict (M3). */
  readonly evidenceRefs?: readonly string[]
}

/** One content-only discussion point carried as seed into a phase-1 session. */
export interface TaskSeedPoint {
  /** The seed text (truncated at the provider's point-length ceiling). */
  readonly text: string
}

/** Durable seed payload journaled at confirm time; the engine appends it to the first-phase session. */
export interface TaskSeedContent {
  /** The caller's goal summary; appended as the leading seed message. */
  readonly goal: string
  /** The source session whose recent discussion was read; a normal conversation, never broken by creation. */
  readonly sourceSessionId: string
  /** Content-only discussion points (newest-last); empty when the caller declined session inheritance. */
  readonly points: readonly TaskSeedPoint[]
}

/** Wire result of one confirmed task creation (entry B). */
export interface TaskCreateConfirmResult {
  /** The created (or idempotently returned) task, still in `planning`. */
  readonly task: TaskRecord
  /** False when the same confirm idempotency key replayed an existing task. */
  readonly created: boolean
  /** Number of seed points journaled onto the task (0 when inheritance was declined). */
  readonly seedPoints: number
}

/** Provenance threaded into every durable provider write. */
export interface WriteProvenance {
  /** Actor that caused the write; providers record it with the journal fact. */
  readonly actor: string
  /** Idempotency key of the command the write belongs to. */
  readonly idempotencyKey: string
}

/** Uniform context every task-mutating command accepts. */
export interface TaskMutationContext {
  readonly actor: string
  readonly reason: string
  readonly expectedRevision: number
  readonly idempotencyKey: string
}

/** Machine-routable task failure codes. */
export type TaskErrorCode =
  | 'not-found'
  | 'stale-revision'
  | 'invalid-transition'
  | 'submission-rejected'
  | 'duplicate-idempotency'
  | 'invalid-argument'

/** Task failure with code, message, and optional rejection problems. */
export class TaskError extends Error {
  /** Machine-routable failure code. */
  readonly code: TaskErrorCode
  /** Rejection problem list; present for `submission-rejected` failures. */
  readonly problems?: readonly string[]

  constructor(code: TaskErrorCode, message: string, problems?: readonly string[]) {
    super(message)
    this.code = code
    if (problems !== undefined) this.problems = problems
    this.name = 'TaskError'
  }
}

declare module '@deepseek-ai/cordis' {
  interface Events {
    /**
     * Committed task projection change; forwarded to the workbench UI and
     * droppable â€?the journal is the authoritative resync path.
     * @param task - the task's post-commit projection.
     * @mode emit
     */
    'task/updated'(task: TaskRecord): void
    /**
     * Committed task-run projection change.
     * @param run - the run's post-commit projection.
     * @mode emit
     */
    'task-run/updated'(run: TaskRunRecord): void
    /**
     * Committed phase-run projection change.
     * @param phaseRun - the phase run's post-commit projection.
     * @mode emit
     */
    'phase-run/updated'(phaseRun: PhaseRunRecord): void
    /**
     * One stored gate-check verdict; the breaker counter (M5 review-policy)
     * observes this instead of polling. Droppable â€?the journal is the
     * authoritative record.
     * @param result - the stored verdict.
     * @mode emit
     */
    'gate-check/recorded'(result: GateCheckResult): void
  }
}
