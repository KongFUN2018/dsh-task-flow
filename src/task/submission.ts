/**
 * Pure PhaseSubmission acceptance per the phase-submission protocol. The
 * caller supplies every external fact (recipe hash, session watermark,
 * deliverable currency) so this module stays free of services.
 * @module @deepseek-ai/dsh-task/src/submission
 */

import type { PhaseSubmission, PhaseRunRecord, TaskRecord, TaskRunRecord } from './types.ts'

/** External facts one acceptance run reads. */
export interface SubmissionAcceptanceFacts {
  readonly submission: PhaseSubmission
  readonly task: TaskRecord
  readonly run: TaskRunRecord
  readonly phaseRun: PhaseRunRecord
  /** Content hash the recipe registry returned for the pinned identity. */
  readonly registeredHash: string
  /** The source session log persisted through the submission's sequence range. */
  readonly sourceSeqPersisted: boolean
  /** Every input deliverable version is still the current one. */
  readonly inputsCurrent: boolean
  /** Every output deliverable version exists and traces to this submission. */
  readonly outputsValid: boolean
  /** A submission already stored under the same idempotency key, if any. */
  readonly existingByIdempotency?: PhaseSubmission
}

/** Acceptance verdict: ok with problems, or an idempotent replay return. */
export interface SubmissionAcceptance {
  readonly ok: boolean
  readonly problems: readonly string[]
  readonly idempotentReturn?: PhaseSubmission
}

/**
 * Judge one submission against the protocol's acceptance rules.
 * @param facts - the submission plus every external fact it needs.
 * @returns the verdict; `idempotentReturn` replaces storing anything new.
 */
export function acceptSubmission(facts: SubmissionAcceptanceFacts): SubmissionAcceptance {
  const { submission, task, run, phaseRun, existingByIdempotency } = facts
  if (existingByIdempotency !== undefined) {
    if (JSON.stringify(existingByIdempotency) === JSON.stringify(submission)) {
      return { ok: true, problems: [], idempotentReturn: existingByIdempotency }
    }
    return { ok: false, problems: ['idempotency key reused with a different payload'] }
  }
  const problems: string[] = []
  if (submission.taskId !== task.taskId) problems.push('submission names a different task')
  if (task.currentRunId !== run.runId) problems.push('the run is not the task current run')
  if (submission.taskRunId !== run.runId) problems.push('submission names a different run')
  if (submission.phaseRunId !== phaseRun.phaseRunId) problems.push('submission names a different phase run')
  if (phaseRun.runId !== run.runId) problems.push('the phase run belongs to a different run')
  if (submission.phaseId !== phaseRun.phaseId) problems.push('submission phase id differs from the phase run')
  // A pausing task still accepts the submission of its in-flight phase: pause
  // quiescence completes the current atomic action before the barrier is
  // observed. Every other state - including cancelling - rejects it.
  if (task.state !== 'running' && task.state !== 'pausing') problems.push('the task is not running or pausing')
  if (phaseRun.state !== 'running') problems.push('the phase run is not running')
  const pinned = submission.pinnedRecipe
  const taskPinned = task.pinnedRecipe
  if (pinned.recipeId !== taskPinned.recipeId || pinned.revision !== taskPinned.revision
    || pinned.schemaVersion !== taskPinned.schemaVersion || pinned.contentHash !== taskPinned.contentHash) {
    problems.push('submission recipe identity differs from the pinned recipe')
  }
  if (pinned.contentHash !== facts.registeredHash) {
    problems.push('submission recipe hash differs from the registered revision')
  }
  if (!facts.sourceSeqPersisted) problems.push('the source session sequence range is not persisted')
  if (!facts.inputsCurrent) problems.push('an input deliverable version is no longer current')
  if (!facts.outputsValid) problems.push('an output deliverable version is missing or not from this submission')
  if (submission.result === 'failed' && (submission.failureReason ?? '').trim().length === 0) {
    problems.push('a failed submission requires a presentable failure reason')
  }
  return { ok: problems.length === 0, problems }
}
