/** Shared submission fixture for the task package's spec files. */

import type {
  PhaseRunRecord,
  PhaseSubmission,
  TaskRecord,
  TaskRunRecord,
} from '../src/task/types.ts'
import { SubmissionId } from '../src/task/runtime.ts'

/** A submission wired to the actual created records; `over` adjusts fields per scenario. */
export function submission(
  task: TaskRecord,
  run: TaskRunRecord,
  phaseRun: PhaseRunRecord,
  over: Partial<PhaseSubmission> = {},
): PhaseSubmission {
  return {
    submissionId: SubmissionId('s-1'),
    taskId: task.taskId,
    taskRunId: run.runId,
    phaseRunId: phaseRun.phaseRunId,
    phaseId: phaseRun.phaseId,
    attempt: 1,
    pinnedRecipe: task.pinnedRecipe,
    sourceSessionId: 'session-1',
    sourceSeqRange: { start: 1, end: 5 },
    inputVersions: [],
    outputVersions: [{ deliverableId: 'd-1' as never, versionId: 'v-1' as never }],
    unresolvedIssues: [],
    result: 'completed',
    idempotencyKey: 'sub-k-1',
    submittedAt: Date.now(),
    ...over,
  }
}
