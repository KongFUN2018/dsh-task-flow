/**
 * Task-local durable task provider (`ctx.tasks`): implements the TaskHandle
 * storage hooks over one storageDomain unit. Each write appends its journal
 * fact first - the append is the commit point of the write - then persists
 * the projection, so replay rebuilds projections and Cordis events stay
 * droppable wake-ups. Submission acceptance validates deliverable refs
 * inside the task write chain through the injected minimal deliverable
 * service.
 * @module @deepseek-ai/dsh-task-local
 */

import { Context, Service } from '@deepseek-ai/cordis'
import { z } from 'zod'
import { TaskError, TaskHandle, TASK_SEED_FACT_KIND } from '../task/index.ts'
import type { SessionId } from '@deepseek-ai/dsh-session'
import '@deepseek-ai/dsh-session'
import type { KvTable } from '@deepseek-ai/dsh-storage-domain'
import type { JournalPayload } from '../workbench/journal/types.ts'
import '../workbench/journal/index.ts'
import '../deliverable/index.ts'
import { taskFactKey, taskLocalDomainSpec } from './spec.ts'
import type { TaskLocalFactKind } from './types.ts'
import type {
  GateCheckResult,
  PhaseRunId,
  PhaseRunRecord,
  PhaseSubmission,
  SubmissionEnvironmentFacts,
  SubmissionId,
  TaskId,
  TaskRecord,
  TaskRunId,
  TaskRunRecord,
  TaskSeedContent,
  TaskSeedPoint,
  WriteProvenance,
} from '../task/types.ts'

export type * from './types.ts'
export {
  taskFactKey,
  taskLocalDomainSpec,
  gateResultsSchema,
  phaseRunRecordSchema,
  phaseSubmissionSchema,
  taskRecordSchema,
  taskRunRecordSchema,
} from './spec.ts'

/** One journal fact the task write chain appends at the commit point of a write. */
interface FactInput {
  readonly kind: TaskLocalFactKind
  readonly taskId: TaskId
  readonly entityId: string
  readonly entityRevision: number
  readonly provenance: WriteProvenance
  /** JSON value at the wire boundary; branded record ids widen to plain strings here. */
  readonly payload: unknown
}

/** Task-local provider configuration. */
interface Config {
  /** How many recent source user-messages become seed points at most. */
  readonly seedMaxPoints: number
  /** Per-point character ceiling applied before journaling the seed. */
  readonly seedMaxPointLength: number
}

/** Durable TaskHandle provider over one storageDomain unit. */
export class LocalTaskService extends TaskHandle {
  /** The provider opens its domain, the journal, the deliverable service, and the live session store. */
  static inject = ['storageDomain', 'workbenchJournal', 'deliverables', 'sessions']

  /** Session-inheritance tunables (entry B seed); deployment-variable via Config. */
  static Config: z.ZodType<Config> = z.object({
    /** How many recent source user-messages become seed points at most. */
    seedMaxPoints: z.number().int().min(0).max(200).default(20),
    /** Per-point character ceiling applied before journaling the seed. */
    seedMaxPointLength: z.number().int().min(1).max(100000).default(4000),
  }).default({ seedMaxPoints: 20, seedMaxPointLength: 4000 })

  private readonly seedMaxPoints: number
  private readonly seedMaxPointLength: number
  private tasks?: KvTable<string, TaskRecord>
  private runs?: KvTable<string, TaskRunRecord>
  private phaseRuns?: KvTable<string, PhaseRunRecord>
  private submissions?: KvTable<string, PhaseSubmission>
  private gateResults?: KvTable<string, GateCheckResult[]>

  /**
   * @param ctx - Host context carrying the storage-domain facility, the
   * workbench journal, the deliverable service, and the live session store.
   * @param config - Optional session-inheritance tunables.
   */
  constructor(ctx: Context, config: Config = { seedMaxPoints: 20, seedMaxPointLength: 4000 }) {
    super(ctx)
    this.seedMaxPoints = config.seedMaxPoints
    this.seedMaxPointLength = config.seedMaxPointLength
  }

  /** Open and own the task-local domain tables. */
  protected async [Service.init](): Promise<void> {
    const domain = await this.ctx.storageDomain.open(taskLocalDomainSpec)
    this.ctx.effect(() => async () => {
      await domain.close()
    }, 'task-local.domainClose')
    this.tasks = domain.table('tasks')
    this.runs = domain.table('task_runs')
    this.phaseRuns = domain.table('phase_runs')
    this.submissions = domain.table('submissions')
    this.gateResults = domain.table('gate_results')
  }

  protected loadTask(taskId: TaskId): Promise<TaskRecord | undefined> {
    return Promise.resolve(this.require(this.tasks).get(taskId))
  }

  protected loadTaskByIdempotencyKey(key: string): Promise<TaskRecord | undefined> {
    for (const [, task] of this.require(this.tasks).entries()) {
      if (task.idempotencyKey === key) return Promise.resolve(task)
    }
    return Promise.resolve(undefined)
  }

  protected loadAllTasks(): Promise<TaskRecord[]> {
    return Promise.resolve([...this.require(this.tasks).entries()].map(([, task]) => task))
  }

  protected async saveTask(task: TaskRecord, provenance: WriteProvenance): Promise<boolean> {
    const stored = this.require(this.tasks).get(task.taskId)
    if (stored !== undefined && stored.revision !== task.revision - 1) return false
    await this.appendFact({
      kind: 'task/updated',
      taskId: task.taskId,
      entityId: task.taskId,
      entityRevision: task.revision,
      provenance,
      payload: task,
    })
    await this.require(this.tasks).put(task.taskId, task)
    return true
  }

  protected loadRun(runId: TaskRunId): Promise<TaskRunRecord | undefined> {
    return Promise.resolve(this.require(this.runs).get(runId))
  }

  protected async saveRun(run: TaskRunRecord, provenance: WriteProvenance): Promise<boolean> {
    const stored = this.require(this.runs).get(run.runId)
    if (stored !== undefined && stored.revision !== run.revision - 1) return false
    await this.appendFact({
      kind: 'task-run/updated',
      taskId: run.taskId,
      entityId: run.runId,
      entityRevision: run.revision,
      provenance,
      payload: run,
    })
    await this.require(this.runs).put(run.runId, run)
    return true
  }

  protected loadPhaseRun(phaseRunId: PhaseRunId): Promise<PhaseRunRecord | undefined> {
    return Promise.resolve(this.require(this.phaseRuns).get(phaseRunId))
  }

  protected loadPhaseRunsOfRun(runId: TaskRunId): Promise<PhaseRunRecord[]> {
    return Promise.resolve([...this.require(this.phaseRuns).entries()]
      .map(([, phase]) => phase)
      .filter(phase => phase.runId === runId))
  }

  protected async savePhaseRun(phaseRun: PhaseRunRecord, provenance: WriteProvenance): Promise<boolean> {
    const stored = this.require(this.phaseRuns).get(phaseRun.phaseRunId)
    if (stored !== undefined && stored.revision !== phaseRun.revision - 1) return false
    await this.appendFact({
      kind: 'phase-run/updated',
      taskId: phaseRun.taskId,
      entityId: phaseRun.phaseRunId,
      entityRevision: phaseRun.revision,
      provenance,
      payload: phaseRun,
    })
    await this.require(this.phaseRuns).put(phaseRun.phaseRunId, phaseRun)
    return true
  }

  protected loadSubmission(submissionId: SubmissionId): Promise<PhaseSubmission | undefined> {
    return Promise.resolve(this.require(this.submissions).get(submissionId))
  }

  protected loadSubmissionByIdempotencyKey(key: string): Promise<PhaseSubmission | undefined> {
    for (const [, submission] of this.require(this.submissions).entries()) {
      if (submission.idempotencyKey === key) return Promise.resolve(submission)
    }
    return Promise.resolve(undefined)
  }

  protected async saveSubmission(submission: PhaseSubmission, provenance: WriteProvenance): Promise<void> {
    await this.appendFact({
      kind: 'submission/recorded',
      taskId: submission.taskId,
      entityId: submission.submissionId,
      entityRevision: 1,
      provenance,
      payload: submission,
    })
    await this.require(this.submissions).put(submission.submissionId, submission)
  }

  protected loadGateResults(submissionId: SubmissionId): Promise<GateCheckResult[]> {
    return Promise.resolve([...this.require(this.gateResults).get(submissionId) ?? []])
  }

  protected async staleGateChecks(
    submissionId: SubmissionId,
    checkIds: readonly string[],
    provenance: WriteProvenance,
  ): Promise<GateCheckResult[]> {
    const submission = this.require(this.submissions).get(submissionId)
    if (submission === undefined) {
      throw new TaskError('not-found', 'submission of a gate check is not stored')
    }
    const wanted = new Set(checkIds)
    const existing = [...this.require(this.gateResults).get(submissionId) ?? []]
    const staled: Array<{ result: GateCheckResult; position: number }> = []
    const next = existing.map((result, index) => {
      if (!wanted.has(result.checkId) || result.stale === true) return result
      const annotated: GateCheckResult = { ...result, stale: true }
      staled.push({ result: annotated, position: index + 1 })
      return annotated
    })
    for (const entry of staled) {
      await this.appendFact({
        kind: 'gate-check/staled',
        taskId: submission.taskId,
        entityId: submissionId,
        entityRevision: entry.position,
        provenance,
        payload: entry.result,
      })
    }
    if (staled.length > 0) await this.require(this.gateResults).put(submissionId, next)
    return staled.map(entry => entry.result)
  }

  protected async saveGateResult(result: GateCheckResult, provenance: WriteProvenance): Promise<void> {
    const submission = this.require(this.submissions).get(result.submissionId)
    if (submission === undefined) {
      throw new TaskError('not-found', 'submission of a gate check is not stored')
    }
    const existing = this.require(this.gateResults).get(result.submissionId) ?? []
    if (existing.some(stored => sameGateCheck(stored, result))) return
    const next = [...existing, result]
    await this.appendFact({
      kind: 'gate-check/recorded',
      taskId: submission.taskId,
      entityId: result.submissionId,
      entityRevision: next.length,
      provenance,
      payload: result,
    })
    await this.require(this.gateResults).put(result.submissionId, next)
  }

  protected override resolveSubmissionEnvironment(
    submission: PhaseSubmission,
    environment: SubmissionEnvironmentFacts,
  ): Promise<SubmissionEnvironmentFacts> {
    const deliverables = this.ctx.deliverables
    const inputsCurrent = submission.inputVersions.every((ref) => {
      const version = deliverables.getVersion(ref.versionId)
      return version !== undefined && version.deliverableId === ref.deliverableId && version.state === 'current'
    })
    const outputsValid = submission.outputVersions.every((ref) => {
      const version = deliverables.getVersion(ref.versionId)
      return version !== undefined && version.deliverableId === ref.deliverableId
        && version.sourceSubmissionId === submission.submissionId
    })
    return Promise.resolve({ ...environment, inputsCurrent, outputsValid })
  }

  /** At acceptance the write chain owns both durable registrations: the run's input versions and the output versions' dependency edges. */
  protected override async onSubmissionAccepted(submission: PhaseSubmission): Promise<void> {
    if (submission.inputVersions.length === 0) return
    await this.ctx.deliverables.recordPhaseInputs(
      submission.phaseRunId,
      submission.inputVersions.map(ref => ref.versionId),
    )
    for (const output of submission.outputVersions) {
      await this.ctx.deliverables.registerVersionDependencies(output.versionId, submission.inputVersions)
    }
  }

  /**
   * Derive the session-inherited seed points from a live source conversation:
   * the content of the most recent user messages (newest-last), each truncated
   * at the point ceiling. Declined inheritance or an unknown source yields none.
   */
  protected override resolveSeedPoints(sourceSessionId: string, inheritSession: boolean): Promise<TaskSeedPoint[]> {
    if (!inheritSession) return Promise.resolve([])
    const session = this.ctx.sessions.get(sourceSessionId as SessionId)
    if (session === undefined) return Promise.resolve([])
    const recent = session.events.filter(event => event.type === 'user/message').slice(-this.seedMaxPoints)
    const points: TaskSeedPoint[] = []
    for (const event of recent) {
      const text = event.data.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('')
        .trim()
      if (text.length === 0) continue
      points.push({ text: text.slice(0, this.seedMaxPointLength) })
    }
    return Promise.resolve(points)
  }

  /**
   * Persist the confirmed-creation seed as one idempotent journal fact; a
   * re-confirmed replay returns the originally stored points without a write.
   */
  protected override async persistConfirmSeed(
    task: TaskRecord,
    content: TaskSeedContent,
    idempotencyKey: string,
    actor: string,
  ): Promise<TaskSeedPoint[]> {
    const factKey = 'task/seed-created:' + idempotencyKey
    const existing = this.ctx.workbenchJournal.replay(0).find(fact => fact.idempotencyKey === factKey)
    if (existing !== undefined) {
      return [...(existing.payload as unknown as TaskSeedContent).points]
    }
    const payload: JournalPayload = {
      goal: content.goal,
      sourceSessionId: content.sourceSessionId,
      points: content.points.map(point => ({ text: point.text })),
    }
    await this.ctx.workbenchJournal.append({
      taskId: task.taskId,
      kind: TASK_SEED_FACT_KIND,
      actor,
      idempotencyKey: factKey,
      entityRevision: task.revision,
      payload,
    })
    return [...content.points]
  }

  /**
   * Append one journal fact; the durable append is the commit point of
   * the write, so the projection put that follows can rebuild from replay.
   * @param input - the fact fields; the journal assigns the envelope.
   */
  private async appendFact(input: FactInput): Promise<void> {
    await this.ctx.workbenchJournal.append({
      taskId: input.taskId,
      kind: input.kind,
      actor: input.provenance.actor,
      idempotencyKey: taskFactKey(input.kind, input.entityId, input.entityRevision),
      entityRevision: input.entityRevision,
      payload: input.payload as JournalPayload,
    })
  }

  /** The opened table; absent before service start or after disposal. */
  private require<V>(table: KvTable<string, V> | undefined): KvTable<string, V> {
    if (table === undefined) {
      throw new TaskError('invalid-argument', 'task-local storage is not open')
    }
    return table
  }
}

/** Whether two stored gate-check verdicts are the same recording. */
function sameGateCheck(stored: GateCheckResult, result: GateCheckResult): boolean {
  return stored.submissionId === result.submissionId
    && stored.checkId === result.checkId
    && stored.recordedAt === result.recordedAt
}

export default LocalTaskService
