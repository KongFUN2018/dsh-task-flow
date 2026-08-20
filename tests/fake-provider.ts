/** In-memory TaskHandle provider with compare-and-set hooks, test-only. */

import { TaskHandle } from '../src/task/index.ts'
import type {
  GateCheckResult,
  PhaseRunRecord,
  PhaseSubmission,
  TaskRecord,
  TaskRunRecord,
} from '../src/task/types.ts'
import type { PhaseRunId, SubmissionId, TaskId, TaskRunId, WriteProvenance } from '../src/task/types.ts'

export class FakeTaskProvider extends TaskHandle {
  readonly tasks = new Map<string, TaskRecord>()
  readonly runs = new Map<string, TaskRunRecord>()
  readonly phaseRuns = new Map<string, PhaseRunRecord>()
  readonly submissions = new Map<string, PhaseSubmission>()
  readonly gateResults: GateCheckResult[] = []

  protected async loadTask(taskId: TaskId): Promise<TaskRecord | undefined> {
    return this.tasks.get(taskId)
  }

  protected async loadTaskByIdempotencyKey(key: string): Promise<TaskRecord | undefined> {
    return [...this.tasks.values()].find(task => task.idempotencyKey === key)
  }

  protected async loadAllTasks(): Promise<TaskRecord[]> {
    return [...this.tasks.values()]
  }

  protected async saveTask(task: TaskRecord, _provenance: WriteProvenance): Promise<boolean> {
    return this.cas(this.tasks, task.taskId, task)
  }

  protected async loadRun(runId: TaskRunId): Promise<TaskRunRecord | undefined> {
    return this.runs.get(runId)
  }

  protected async saveRun(run: TaskRunRecord, _provenance: WriteProvenance): Promise<boolean> {
    return this.cas(this.runs, run.runId, run)
  }

  protected async loadPhaseRun(phaseRunId: PhaseRunId): Promise<PhaseRunRecord | undefined> {
    return this.phaseRuns.get(phaseRunId)
  }

  protected async loadPhaseRunsOfRun(runId: TaskRunId): Promise<PhaseRunRecord[]> {
    return [...this.phaseRuns.values()].filter(phase => phase.runId === runId)
  }

  protected async savePhaseRun(phaseRun: PhaseRunRecord, _provenance: WriteProvenance): Promise<boolean> {
    return this.cas(this.phaseRuns, phaseRun.phaseRunId, phaseRun)
  }

  protected async loadSubmission(submissionId: SubmissionId): Promise<PhaseSubmission | undefined> {
    return this.submissions.get(submissionId)
  }

  protected async loadSubmissionByIdempotencyKey(key: string): Promise<PhaseSubmission | undefined> {
    return [...this.submissions.values()].find(submission => submission.idempotencyKey === key)
  }

  protected async saveSubmission(submission: PhaseSubmission, _provenance: WriteProvenance): Promise<void> {
    this.submissions.set(submission.submissionId, submission)
  }

  protected async loadGateResults(submissionId: SubmissionId): Promise<GateCheckResult[]> {
    return this.gateResults.filter(result => result.submissionId === submissionId)
  }

  protected async staleGateChecks(
    submissionId: SubmissionId,
    checkIds: readonly string[],
    _provenance: WriteProvenance,
  ): Promise<GateCheckResult[]> {
    const wanted = new Set(checkIds)
    const staled: GateCheckResult[] = []
    for (const result of this.gateResults) {
      if (result.submissionId !== submissionId || !wanted.has(result.checkId) || result.stale === true) continue
      const next: GateCheckResult = { ...result, stale: true }
      this.gateResults[this.gateResults.indexOf(result)] = next
      staled.push(next)
    }
    return staled
  }

  protected async saveGateResult(result: GateCheckResult, _provenance: WriteProvenance): Promise<void> {
    this.gateResults.push(result)
  }

  private cas<V extends { readonly revision: number }>(map: Map<string, V>, key: string, next: V): boolean {
    const stored = map.get(key)
    if (stored === undefined) {
      map.set(key, next)
      return true
    }
    if (stored.revision !== next.revision - 1) return false
    map.set(key, next)
    return true
  }
}
