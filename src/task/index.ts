/**
 * Task-flow task service definition (`ctx.tasks`): pinned-recipe task
 * creation, the guarded state transitions this package owns, and the
 * PhaseSubmission acceptance chain. Providers persist through the abstract
 * storage hooks; every mutating command sequences one load, one pure
 * transition, one compare-and-set save, and one contained event fan-out.
 * @module @deepseek-ai/dsh-task
 */

import { randomUUID } from 'node:crypto'
import { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { RecipeError } from '../recipe/types.ts'
import type { RecipeRegistry } from '../recipe/index.ts'
import { PhaseRunId as PhaseRunIdValue, SubmissionId as SubmissionIdValue, TaskId as TaskIdValue, TaskRunId as TaskRunIdValue } from './runtime.ts'
import type { PhaseRunId, SubmissionId, TaskId, TaskRunId } from './types.ts'
import {
  acceptSubmission,
  type SubmissionAcceptanceFacts,
} from './submission.ts'
import {
  canCompleteTask,
  phaseTransition,
  taskTransition,
  type PhaseCommand,
  type TaskCommand,
} from './state.ts'
import { TaskError } from './types.ts'
import type {
  GateCheckResult,
  PhaseRunRecord,
  PhaseSubmission,
  SubmissionEnvironmentFacts,
  TaskCreateConfirmResult,
  TaskMutationContext,
  TaskRecord,
  TaskRunRecord,
  TaskSeedContent,
  TaskSeedPoint,
  WriteProvenance,
} from './types.ts'

export type * from './types.ts'
/** The journal fact kind carrying a task's confirmed-creation seed (see `TaskSeedContent`). */
export const TASK_SEED_FACT_KIND = 'task/seed-created'
export { TaskId, TaskRunId, PhaseRunId, SubmissionId, DeliverableId, DeliverableVersionId } from './runtime.ts'
export { TaskError } from './types.ts'
export {
  acceptSubmission,
  type SubmissionAcceptance,
  type SubmissionAcceptanceFacts,
} from './submission.ts'
export {
  canCompleteTask, phaseTransition, taskTransition,
  type PhaseCommand, type TaskCommand,
} from './state.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    tasks: TaskHandle
  }
}

/** Extract the durable-write provenance of one mutating command. */
function provenanceOf(mutation: TaskMutationContext): WriteProvenance {
  return { actor: mutation.actor, idempotencyKey: mutation.idempotencyKey }
}

/** Task service: durable task/run/phase projections and guarded commands. */
export abstract class TaskHandle extends TypertRemoteService {
  constructor(ctx: Context) {
    super(ctx, 'tasks')
  }

  // Storage hooks. Providers implement each hook inside their transaction
  // boundary: a multi-record command's hooks must commit together, and
  // `save*` returns false when the stored revision no longer matches the
  // previous revision (compare-and-set).

  protected abstract loadTask(taskId: TaskId): Promise<TaskRecord | undefined>
  protected abstract loadTaskByIdempotencyKey(key: string): Promise<TaskRecord | undefined>
  protected abstract saveTask(task: TaskRecord, provenance: WriteProvenance): Promise<boolean>
  protected abstract loadRun(runId: TaskRunId): Promise<TaskRunRecord | undefined>
  protected abstract saveRun(run: TaskRunRecord, provenance: WriteProvenance): Promise<boolean>
  protected abstract loadPhaseRun(phaseRunId: PhaseRunId): Promise<PhaseRunRecord | undefined>
  protected abstract loadPhaseRunsOfRun(runId: TaskRunId): Promise<PhaseRunRecord[]>
  protected abstract savePhaseRun(phaseRun: PhaseRunRecord, provenance: WriteProvenance): Promise<boolean>
  protected abstract loadSubmission(submissionId: SubmissionId): Promise<PhaseSubmission | undefined>
  protected abstract loadSubmissionByIdempotencyKey(key: string): Promise<PhaseSubmission | undefined>
  protected abstract saveSubmission(submission: PhaseSubmission, provenance: WriteProvenance): Promise<void>
  protected abstract loadGateResults(submissionId: SubmissionId): Promise<GateCheckResult[]>

  /**
   * Annotate stored gate-check verdicts stale inside the provider's write
   * chain: one journal fact per newly staled verdict, then the durable
   * replacement of the verdict list. Verdicts already staled and unknown
   * check ids produce no write.
   * @param submissionId - the submission whose verdicts the impact closure covers.
   * @param checkIds - the check ids to annotate.
   * @param provenance - durable-write provenance of the impact command.
   * @returns the verdicts this call staled, in storage order.
   */
  protected abstract staleGateChecks(
    submissionId: SubmissionId,
    checkIds: readonly string[],
    provenance: WriteProvenance,
  ): Promise<GateCheckResult[]>
  protected abstract saveGateResult(result: GateCheckResult, provenance: WriteProvenance): Promise<void>

  /**
   * Derive the acceptance facts a provider owns before the verdict. The
   * default trusts the caller; providers with an injected fact source
   * (task-local derives deliverable currency) override this.
   * @param submission - the submission under acceptance.
   * @param environment - caller-supplied facts.
   * @returns the facts the acceptance verdict reads.
   */
  protected resolveSubmissionEnvironment(
    _submission: PhaseSubmission,
    environment: SubmissionEnvironmentFacts,
  ): Promise<SubmissionEnvironmentFacts> {
    return Promise.resolve(environment)
  }

  /**
   * Provider-side acceptance effects after the verdict admits a new
   * submission (phase-input registration); the default does nothing.
   * @param submission - the admitted submission, not an idempotent replay.
   */
  protected async onSubmissionAccepted(_submission: PhaseSubmission): Promise<void> {}

  /** Tail of the serial task write chain; mutating commands never interleave. */
  private writeTail: Promise<unknown> = Promise.resolve()

  /** Registered completion guards (M5); consulted inside the write chain. */
  private readonly completionGuards: Array<(task: TaskRecord) => Promise<void>> = []

  /**
   * Register one completion guard: `completeTask` runs every registered guard
   * on the serial write chain after the state check passes; a throwing guard
   * rejects the command before any durable write. Contributors own their
   * disposal ‚Ä?the returned handle removes the guard.
   * @param guard - async veto over one task about to complete.
   * @returns the disposer that unregisters the guard.
   */
  registerCompletionGuard(guard: (task: TaskRecord) => Promise<void>): () => void {
    this.completionGuards.push(guard)
    return () => {
      const at = this.completionGuards.indexOf(guard)
      if (at >= 0) this.completionGuards.splice(at, 1)
    }
  }

  /**
   * Run one whole mutating command on the serial task write chain, so load,
   * transition, save, and publish of concurrent commands never interleave.
   * @param command - the complete command body.
   * @returns the command's result.
   */
  protected serialized<T>(command: () => Promise<T>): Promise<T> {
    const result = this.writeTail.then(command, command)
    this.writeTail = result.then(() => undefined, () => undefined)
    return result
  }

  /**
   * Create a task pinned to the latest registered revision of one recipe.
   * @param recipeId - raw recipe identifier.
   * @param workspaceId - raw workspace identifier.
   * @param actor - creating actor, recorded with the creation.
   * @param idempotencyKey - deduplication key; a replay with the same key
   * returns the original task.
   * @returns the new task in `planning`.
   */
  @Remote('createTask')
  async createTask(recipeId: string, workspaceId: string, actor: string, idempotencyKey: string): Promise<TaskRecord> {
    const recipeKey = this.resolveText(recipeId, 'recipeId')
    this.resolveText(workspaceId, 'workspaceId')
    const provenance: WriteProvenance = {
      actor: this.resolveText(actor, 'actor'),
      idempotencyKey: this.resolveText(idempotencyKey, 'idempotencyKey'),
    }
    return this.serialized(() => this.createTaskNow(recipeKey, workspaceId.trim(), provenance))
  }

  /** Create one task pinned to the latest registered recipe revision; the serial write chain owns the commit. */
  private async createTaskNow(recipeKey: string, workspaceId: string, provenance: WriteProvenance): Promise<TaskRecord> {
    const existing = await this.loadTaskByIdempotencyKey(provenance.idempotencyKey)
    if (existing !== undefined) {
      if (existing.workspaceId === workspaceId && existing.pinnedRecipe.recipeId === recipeKey) return existing
      throw new TaskError('duplicate-idempotency', 'task idempotency key reused with a different payload')
    }
    const recipes = this.ctx.get('recipes') as RecipeRegistry
    let latest
    try {
      latest = recipes.latest(recipeKey)
    } catch (error) {
      if (error instanceof RecipeError && error.code === 'not-found') {
        throw new TaskError('not-found', `recipe "${recipeKey}" is not registered`)
      }
      throw error
    }
    if (latest === undefined) throw new TaskError('not-found', `recipe "${recipeKey}" is not registered`)
    const task: TaskRecord = {
      taskId: TaskIdValue(randomUUID()),
      workspaceId,
      pinnedRecipe: {
        recipeId: latest.recipeId,
        revision: latest.revision,
        schemaVersion: latest.schemaVersion,
        contentHash: latest.contentHash,
      },
      state: 'planning',
      revision: 1,
      idempotencyKey: provenance.idempotencyKey,
      createdAt: Date.now(),
    }
    if (!await this.saveTask(task, provenance)) throw new TaskError('stale-revision', 'task insert raced')
    this.emit('task/updated', task)
    return task
  }



  /**
   * Confirm a session-initiated task creation (entry B): create the task
   * idempotently, derive the inherited discussion seed, and persist it durably so the
   * engine can append it to the first-phase session when it opens.
   * @param recipeId - the inferred recipe id.
   * @param goal - the caller's goal summary; the leading seed message.
   * @param inheritSession - whether to carry recent source-session discussion points.
   * @param idempotencyKey - the caller-safe replay key, reused from the propose step.
   * @param sourceSessionId - the original conversation read for the seed.
   * @param workspaceId - the owning workspace (entry B defaults it to 'default').
   * @param actor - the confirming actor.
   * @returns the created task and its seed summary.
   */
  @Remote('confirmCreateTask')
  async confirmCreateTask(
    recipeId: string,
    goal: string,
    inheritSession: boolean,
    idempotencyKey: string,
    sourceSessionId: string,
    workspaceId: string,
    actor: string,
  ): Promise<TaskCreateConfirmResult> {
    const goalText = this.resolveText(goal, 'goal')
    const sourceId = this.resolveText(sourceSessionId, 'sourceSessionId')
    const key = this.resolveText(idempotencyKey, 'idempotencyKey')
    const actorName = this.resolveText(actor, 'actor')
    const workspace = this.resolveText(workspaceId, 'workspaceId')
    if (typeof inheritSession !== 'boolean') {
      throw new TaskError('invalid-argument', 'inheritSession must be a boolean')
    }
    return this.serialized(async () => {
      const prior = await this.loadTaskByIdempotencyKey(key)
      const provenance: WriteProvenance = { actor: actorName, idempotencyKey: key }
      const task = await this.createTaskNow(this.resolveText(recipeId, 'recipeId'), workspace, provenance)
      const content: TaskSeedContent = {
        goal: goalText,
        sourceSessionId: sourceId,
        points: await this.resolveSeedPoints(sourceId, inheritSession),
      }
      const points = await this.persistConfirmSeed(task, content, key, actorName)
      return { task, created: prior === undefined, seedPoints: points.length }
    })
  }

  /**
   * Provider-side derivation of the session-inherited discussion points; the default
   * carries none (no live source, or inheritance declined).
   * @param sourceSessionId - the source conversation to read.
   * @param inheritSession - whether the caller opted into session inheritance.
   * @returns the content-only seed points, newest-last.
   */
  protected resolveSeedPoints(_sourceSessionId: string, _inheritSession: boolean): Promise<TaskSeedPoint[]> {
    return Promise.resolve([])
  }

  /**
   * Persist the confirmed-creation seed durably and return the durable points (the
   * originally stored ones when an idempotent replay re-confirms). The default carries
   * the seed in flight only, so a journal-less provider loses it.
   * @param task - the created task.
   * @param content - the seed payload to persist.
   * @param idempotencyKey - the confirm replay key.
   * @param actor - the confirming actor.
   * @returns the durable seed points.
   */
  protected persistConfirmSeed(
    _task: TaskRecord,
    content: TaskSeedContent,
    _idempotencyKey: string,
    _actor: string,
  ): Promise<TaskSeedPoint[]> {
    return Promise.resolve([...content.points])
  }

  /**
   * Move one task from `planning` into `running`.
   * @param taskId - the task to start.
   * @param mutation - actor, reason, expected revision, idempotency key.
   * @returns the post-commit task projection.
   */
  @Remote('startTask')
  async startTask(taskId: string, mutation: TaskMutationContext): Promise<TaskRecord> {
    return this.mutateTask(TaskIdValue(taskId), mutation, 'start')
  }

  /**
   * Request a pause; the task settles once in-flight phase work quiesces.
   * @param taskId - the task to pause.
   * @param mutation - actor, reason, expected revision, idempotency key.
   * @returns the task in `pausing`.
   */
  @Remote('requestPause')
  async requestPause(taskId: string, mutation: TaskMutationContext): Promise<TaskRecord> {
    return this.mutateTask(TaskIdValue(taskId), mutation, 'pause')
  }

  /**
   * Settle a completed pause into `paused`.
   * @param taskId - the task in `pausing`.
   * @param mutation - actor, reason, expected revision, idempotency key.
   * @returns the task in `paused`.
   */
  @Remote('settlePause')
  async settlePause(taskId: string, mutation: TaskMutationContext): Promise<TaskRecord> {
    return this.mutateTask(TaskIdValue(taskId), mutation, 'settlePause')
  }

  /**
   * Resume one paused task back into `running`.
   * @param taskId - the task in `paused`.
   * @param mutation - actor, reason, expected revision, idempotency key.
   * @returns the task in `running`.
   */
  @Remote('resume')
  async resume(taskId: string, mutation: TaskMutationContext): Promise<TaskRecord> {
    return this.mutateTask(TaskIdValue(taskId), mutation, 'resume')
  }

  /**
   * Request a cancel; the task settles once in-flight phase work quiesces.
   * @param taskId - the task to cancel.
   * @param mutation - actor, reason, expected revision, idempotency key.
   * @returns the task in `cancelling`.
   */
  @Remote('requestCancel')
  async requestCancel(taskId: string, mutation: TaskMutationContext): Promise<TaskRecord> {
    return this.mutateTask(TaskIdValue(taskId), mutation, 'cancel')
  }

  /**
   * Settle a completed cancel into `cancelled`.
   * @param taskId - the task in `cancelling`.
   * @param mutation - actor, reason, expected revision, idempotency key.
   * @returns the task in `cancelled`.
   */
  @Remote('settleCancel')
  async settleCancel(taskId: string, mutation: TaskMutationContext): Promise<TaskRecord> {
    return this.mutateTask(TaskIdValue(taskId), mutation, 'settleCancel')
  }

  /**
   * Fail one running task.
   * @param taskId - the task to fail.
   * @param mutation - actor, reason, expected revision, idempotency key.
   * @returns the task in `failed`.
   */
  @Remote('failTask')
  async failTask(taskId: string, mutation: TaskMutationContext): Promise<TaskRecord> {
    return this.mutateTask(TaskIdValue(taskId), mutation, 'fail')
  }

  /**
   * Complete a task; the completion guard requires every phase run of the
   * current run to have passed (or retired into stale/superseded), then every
   * registered M5 completion guard must approve ‚Ä?unsigned B items, suspended
   * rewind decisions, and open blocking decisions veto here.
   * @param taskId - the task to complete.
   * @param mutation - actor, reason, expected revision, idempotency key.
   * @returns the post-commit task projection.
   */
  @Remote('completeTask')
  async completeTask(taskId: string, mutation: TaskMutationContext): Promise<TaskRecord> {
    return this.mutateTask(TaskIdValue(taskId), mutation, 'complete', async (task) => {
      const phases = task.currentRunId === undefined ? [] : await this.loadPhaseRunsOfRun(task.currentRunId)
      if (!canCompleteTask(task.state, phases.map(phase => phase.state))) {
        throw new TaskError('invalid-transition', 'completion guard failed: every phase run of the current run must have passed')
      }
      for (const guard of [...this.completionGuards]) await guard(task)
      return {}
    })
  }

  /**
   * Park one running task in `awaiting-decision`: the over-budget decision
   * (M5 budget) holds scheduling without touching any phase run.
   * @param taskId - the task to park.
   * @param mutation - the task's expected revision plus actor metadata.
   * @returns the post-commit task projection.
   */
  @Remote('markTaskAwaitingDecision')
  async markTaskAwaitingDecision(taskId: string, mutation: TaskMutationContext): Promise<TaskRecord> {
    return this.mutateTask(TaskIdValue(taskId), mutation, 'awaitDecision')
  }

  /**
   * Return one parked task from `awaiting-decision` to `running`; the
   * resolved over-budget decision (append-budget outcome) resumes here.
   * @param taskId - the task to resume.
   * @param mutation - the task's expected revision plus actor metadata.
   * @returns the post-commit task projection.
   */
  @Remote('resumeTaskFromDecision')
  async resumeTaskFromDecision(taskId: string, mutation: TaskMutationContext): Promise<TaskRecord> {
    return this.mutateTask(TaskIdValue(taskId), mutation, 'resumeFromDecision')
  }

  /**
   * Open a new run on one task and make it the current run.
   * @param taskId - the owning task.
   * @param mutation - the task's expected revision plus actor metadata.
   * @param parentRunId - the superseded branch this run replaces (rewind);
   * omitted on the initial run.
   * @returns the new run.
   */
  @Remote('createTaskRun')
  async createTaskRun(taskId: string, mutation: TaskMutationContext, parentRunId?: string): Promise<TaskRunRecord> {
    const provenance = provenanceOf(mutation)
    return this.serialized(async () => {
      const task = await this.loadTaskOrThrow(TaskIdValue(taskId))
      this.assertRevision(task, mutation)
      const run: TaskRunRecord = {
        runId: TaskRunIdValue(randomUUID()),
        taskId: task.taskId,
        pinnedRecipe: task.pinnedRecipe,
        revision: 1,
        createdAt: Date.now(),
        ...(parentRunId === undefined
          ? {}
          : { parentRunId: TaskRunIdValue(this.resolveText(parentRunId, 'parentRunId')) }),
      }
      const updatedTask: TaskRecord = {
        ...task,
        currentRunId: run.runId,
        revision: task.revision + 1,
      }
      if (!await this.saveRun(run, provenance)) throw new TaskError('stale-revision', 'run insert raced')
      if (!await this.saveTask(updatedTask, provenance)) throw new TaskError('stale-revision', 'task revision moved concurrently')
      this.emit('task-run/updated', run)
      this.emit('task/updated', updatedTask)
      return run
    })
  }

  /**
   * Create one phase run inside a run.
   * @param runId - the owning run.
   * @param phaseId - the recipe phase id this run executes.
   * @param mutation - the run's expected revision plus actor metadata.
   * @returns the new phase run in `created`.
   */
  @Remote('createPhaseRun')
  async createPhaseRun(runId: string, phaseId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord> {
    const phase = this.resolveText(phaseId, 'phaseId')
    const provenance = provenanceOf(mutation)
    return this.serialized(async () => {
      const run = await this.loadRunOrThrow(TaskRunIdValue(runId))
      this.assertRevision(run, mutation)
      const phaseRun: PhaseRunRecord = {
        phaseRunId: PhaseRunIdValue(randomUUID()),
        runId: run.runId,
        taskId: run.taskId,
        phaseId: phase,
        state: 'created',
        revision: 1,
      }
      if (!await this.savePhaseRun(phaseRun, provenance)) throw new TaskError('stale-revision', 'phase-run insert raced')
      this.emit('phase-run/updated', phaseRun)
      return phaseRun
    })
  }

  /**
   * Move one phase run into `running`.
   * @param phaseRunId - the phase run to start.
   * @param mutation - the phase run's expected revision plus actor metadata.
   * @returns the post-commit phase-run projection.
   */
  @Remote('startPhaseRun')
  async startPhaseRun(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord> {
    return this.mutatePhaseRun(PhaseRunIdValue(phaseRunId), mutation, 'start')
  }

  /**
   * Accept and store one phase submission after protocol validation; the
   * accepted submission moves its phase run to `submitted`.
   * @param submission - the immutable submission record.
   * @param environment - session-watermark and deliverable-currency facts the
   * caller (the engine) computed.
   * @returns the stored submission; an idempotent replay returns the original.
   */
  /**
   * Apply one submission's acceptance on the caller's serialized grant: the
   * journal write tail is held by the caller, so this body runs inside one
   * single serialized grant (either recordSubmission or, for a host-derived
   * revision, requestPatch).
   * @param submission - the stored submission to accept.
   * @param environment - acceptance facts resolved by the caller.
   * @returns the stored submission.
   */
  protected async applySubmission(submission: PhaseSubmission, environment: SubmissionEnvironmentFacts): Promise<PhaseSubmission> {
    const task = await this.loadTaskOrThrow(submission.taskId)
    const run = await this.loadRunOrThrow(submission.taskRunId)
    const phaseRun = await this.loadPhaseRunOrThrow(submission.phaseRunId)
    const recipes = this.ctx.get('recipes') as RecipeRegistry
    let registeredHash: string
    try {
      registeredHash = recipes.getPinned({
        recipeId: submission.pinnedRecipe.recipeId,
        revision: submission.pinnedRecipe.revision,
      }).contentHash
    } catch (error) {
      if (error instanceof RecipeError && error.code === 'not-found') {
        throw new TaskError('submission-rejected', 'the pinned recipe revision is not registered')
      }
      throw error
    }
    const facts = await this.resolveSubmissionEnvironment(submission, environment)
    const existing = await this.loadSubmissionByIdempotencyKey(submission.idempotencyKey)
    const verdict = acceptSubmission({
      submission, task, run, phaseRun, registeredHash,
      sourceSeqPersisted: facts.sourceSeqPersisted,
      inputsCurrent: facts.inputsCurrent,
      outputsValid: facts.outputsValid,
      ...existing === undefined ? {} : { existingByIdempotency: existing },
    } satisfies SubmissionAcceptanceFacts)
    if (!verdict.ok) {
      throw new TaskError('submission-rejected', `submission has ${verdict.problems.length} rejection problem(s)`, verdict.problems)
    }
    if (verdict.idempotentReturn !== undefined) return verdict.idempotentReturn
    const next = phaseTransition(phaseRun.state, 'acceptSubmission')
    if (next === null) throw new TaskError('invalid-transition', 'the phase run cannot accept a submission in its current state')
    await this.onSubmissionAccepted(submission)
    const updatedPhaseRun: PhaseRunRecord = {
      ...phaseRun,
      state: next,
      revision: phaseRun.revision + 1,
      activeSubmissionId: submission.submissionId,
    }
    const provenance: WriteProvenance = { actor: facts.submittedBy, idempotencyKey: submission.idempotencyKey }
    await this.saveSubmission(submission, provenance)
    if (!await this.savePhaseRun(updatedPhaseRun, provenance)) throw new TaskError('stale-revision', 'phase-run revision moved concurrently')
    this.emit('phase-run/updated', updatedPhaseRun)
    return submission
  }

  @Remote('recordSubmission')
  async recordSubmission(submission: PhaseSubmission, environment: SubmissionEnvironmentFacts): Promise<PhaseSubmission> {
    return this.serialized(() => this.applySubmission(submission, environment))
  }

  /**
   * Patch one phase's accepted submission: re-submit a superseding revision
   * that carries a human correction note. The host derives every journal field
   * from the active submission (source session/sequence, pinned recipe, input
   * and output versions) so an observer UI only supplies the correction note.
   * @param taskId - the task owning the phase run.
   * @param phaseRunId - the phase run whose active submission is patched.
   * @param note - the human-readable correction note; must not be blank.
   * @param mutation - the phase run's expected revision plus actor metadata.
   * @returns the stored patch submission (the superseding revision).
   */
  @Remote('requestPatch')
  async requestPatch(taskId: string, phaseRunId: string, note: string, mutation: TaskMutationContext): Promise<PhaseSubmission> {
    return this.serialized(async () => {
      const phaseRun = await this.loadPhaseRunOrThrow(PhaseRunIdValue(phaseRunId))
      if (TaskIdValue(taskId) !== phaseRun.taskId) {
        throw new TaskError('submission-rejected', 'phase run does not belong to the given task')
      }
      if (phaseRun.activeSubmissionId === undefined) {
        throw new TaskError('submission-rejected', 'no active submission on this phase run to patch')
      }
      const trimmed = note.trim()
      if (trimmed.length === 0) throw new TaskError('submission-rejected', 'patch note must not be empty')
      const base = await this.loadSubmission(SubmissionIdValue(phaseRun.activeSubmissionId))
      if (base === undefined) throw new TaskError('submission-rejected', 'active submission is not readable')
      if (phaseRun.state !== 'running' && phaseRun.state !== 'awaiting-input' && phaseRun.state !== 'awaiting-decision' && phaseRun.state !== 'gate-running') {
        throw new TaskError('invalid-transition', 'phase run is not open for a patch')
      }
      const patch: PhaseSubmission = {
        ...base,
        submissionId: SubmissionIdValue(randomUUID()),
        attempt: base.attempt + 1,
        supersedesSubmissionId: base.submissionId,
        unresolvedIssues: [...base.unresolvedIssues, trimmed],
        idempotencyKey: 'patch-' + randomUUID(),
        submittedAt: Date.now(),
      }
      // The patch records the corrected revision in place and re-enters the
      // gate (ÂéüÂú∞‰øÆÊ≠£ÔºåGate Â∞ÜÈáçÈ™? for states that were awaiting a decision.
      const nextState = (phaseRun.state === 'awaiting-input' || phaseRun.state === 'awaiting-decision') ? 'gate-running' : phaseRun.state
      const nextPhase: PhaseRunRecord = {
        ...phaseRun,
        state: nextState,
        revision: phaseRun.revision + 1,
        activeSubmissionId: patch.submissionId,
      }
      const provenance: WriteProvenance = { actor: mutation.actor, idempotencyKey: patch.idempotencyKey }
      await this.saveSubmission(patch, provenance)
      const needsPhaseWrite = nextState !== phaseRun.state || nextPhase.activeSubmissionId !== phaseRun.activeSubmissionId
      if (needsPhaseWrite) {
        if (!await this.savePhaseRun(nextPhase, provenance)) throw new TaskError('stale-revision', 'phase-run revision moved concurrently')
        this.emit('phase-run/updated', nextPhase)
      }
      return patch
    })
  }
  /**
   * Start the gate for one accepted submission.
   * @param submissionId - the accepted submission.
   * @param mutation - the phase run's expected revision plus actor metadata.
   * @returns the post-commit phase-run projection.
   */
  @Remote('startGate')
  async startGate(submissionId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord> {
    const submission = await this.loadSubmissionOrThrow(SubmissionIdValue(submissionId))
    return this.mutatePhaseRun(submission.phaseRunId, mutation, 'startGate')
  }

  /**
   * Record one gate-check verdict for a submission.
   * @param result - the check verdict.
   * @returns the stored verdict.
   */
  @Remote('recordGateCheck')
  async recordGateCheck(result: GateCheckResult): Promise<GateCheckResult> {
    return this.serialized(async () => {
      await this.loadSubmissionOrThrow(result.submissionId)
      // No caller-actor slot exists on this command; 'gate' marks the check-runner path.
      const provenance: WriteProvenance = {
        actor: 'gate',
        idempotencyKey: `gate-check:${result.submissionId}:${result.checkId}:${result.recordedAt}`,
      }
      await this.saveGateResult(result, provenance)
      this.emit('gate-check/recorded', result)
      return result
    })
  }

  /**
   * Mark one phase run passed.
   * @param phaseRunId - the phase run.
   * @param mutation - the phase run's expected revision plus actor metadata.
   * @returns the post-commit phase-run projection.
   */
  @Remote('markPhasePassed')
  async markPhasePassed(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord> {
    return this.mutatePhaseRun(PhaseRunIdValue(phaseRunId), mutation, 'pass')
  }

  /**
   * Mark one gate-running phase run failed.
   * @param phaseRunId - the phase run.
   * @param mutation - the phase run's expected revision plus actor metadata.
   * @returns the post-commit phase-run projection.
   */
  @Remote('markPhaseFailed')
  async markPhaseFailed(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord> {
    return this.mutatePhaseRun(PhaseRunIdValue(phaseRunId), mutation, 'fail')
  }

  /**
   * Cancel one not-yet-passed phase run.
   * @param phaseRunId - the phase run to cancel.
   * @param mutation - the phase run's expected revision plus actor metadata.
   * @returns the post-commit phase-run projection.
   */
  @Remote('cancelPhaseRun')
  async cancelPhaseRun(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord> {
    return this.mutatePhaseRun(PhaseRunIdValue(phaseRunId), mutation, 'cancel')
  }

  /**
   * Mark one phase run stale: the M2 impact command. A stale run is
   * terminal; the engine re-opens the phase as a new run. Runs in `running`
   * or `submitting` reject ‚Ä?an in-flight atomic action settles per the M1
   * quiescence contract.
   * @param phaseRunId - the phase run the impact closure covers.
   * @param mutation - the phase run's expected revision plus actor metadata.
   * @returns the post-commit phase-run projection.
   */
  @Remote('markPhaseStale')
  async markPhaseStale(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord> {
    return this.mutatePhaseRun(PhaseRunIdValue(phaseRunId), mutation, 'stale')
  }

  /**
   * Retire one phase run into `superseded`: the M5 rewind command. A
   * superseded run is terminal and never blocks completion; unlike `stale`
   * (invalidated inputs), superseded means the whole branch lost to a newer
   * run, so in-flight states retire too ‚Ä?the rewind decision already
   * committed to abandoning the branch.
   * @param phaseRunId - the phase run the rewind retires.
   * @param mutation - the phase run's expected revision plus actor metadata.
   * @returns the post-commit phase-run projection.
   */
  @Remote('markPhaseSuperseded')
  async markPhaseSuperseded(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord> {
    return this.mutatePhaseRun(PhaseRunIdValue(phaseRunId), mutation, 'supersede')
  }

  /**
   * Park one gate-running phase run in `awaiting-input`: the M3 clarification
   * state. The clarification service resolves the inputs and resumes the run.
   * @param phaseRunId - the phase run awaiting clarification input.
   * @param mutation - the phase run's expected revision plus actor metadata.
   * @returns the post-commit phase-run projection.
   */
  @Remote('markPhaseAwaitingInput')
  async markPhaseAwaitingInput(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord> {
    return this.mutatePhaseRun(PhaseRunIdValue(phaseRunId), mutation, 'awaitInput')
  }

  /**
   * Park one gate-running phase run in `awaiting-decision`: the M3 complex-gate
   * state for B/C checks. The attention service decides and resumes the run.
   * @param phaseRunId - the phase run awaiting a B/C decision.
   * @param mutation - the phase run's expected revision plus actor metadata.
   * @returns the post-commit phase-run projection.
   */
  @Remote('markPhaseAwaitingDecision')
  async markPhaseAwaitingDecision(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord> {
    return this.mutatePhaseRun(PhaseRunIdValue(phaseRunId), mutation, 'awaitDecision')
  }

  /**
   * Return a parked phase run from `awaiting-input` or `awaiting-decision` to
   * `gate-running`, so the engine re-runs the gate. Clarification completion
   * and attention decisions resume through this command.
   * @param phaseRunId - the parked phase run.
   * @param mutation - the phase run's expected revision plus actor metadata.
   * @returns the post-commit phase-run projection.
   */
  @Remote('resumePhaseFromAwaiting')
  async resumePhaseFromAwaiting(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord> {
    return this.mutatePhaseRun(PhaseRunIdValue(phaseRunId), mutation, 'resumeFromAwaiting')
  }

  /**
   * Record the phase-session id the engine opened for this run. Idempotent:
   * the same id returns the stored record without a write; a changed id (a
   * retry opening a new session) updates the binding. The M3 clarification
   * service reads this id to inject answered clarification payloads.
   * @param phaseRunId - the phase run whose session id to record.
   * @param sessionId - the phase-session id.
   * @param mutation - the phase run's expected revision plus actor metadata.
   * @returns the post-commit phase-run projection.
   */
  @Remote('recordPhaseSession')
  async recordPhaseSession(phaseRunId: string, sessionId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord> {
    return this.mutateSessionId(PhaseRunIdValue(phaseRunId), this.resolveText(sessionId, 'sessionId'), mutation)
  }

  /**
   * Freeze one phase run's scheduling: the engine dispatches no new work for
   * a frozen run while in-flight atomic actions still settle. The M2
   * edit-lock service sets this while a lease covers a version the run's
   * registered inputs consume.
   * @param phaseRunId - the phase run to freeze.
   * @param mutation - the phase run's expected revision plus actor metadata.
   * @returns the post-commit phase-run projection with the flag set.
   */
  @Remote('freezePhaseScheduling')
  async freezePhaseScheduling(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord> {
    return this.mutateSchedulingFlag(PhaseRunIdValue(phaseRunId), mutation, true)
  }

  /**
   * Clear one phase run's scheduling freeze; the engine wakes on the
   * committed change and resumes dispatching.
   * @param phaseRunId - the frozen phase run.
   * @param mutation - the phase run's expected revision plus actor metadata.
   * @returns the post-commit phase-run projection with the flag cleared.
   */
  @Remote('clearPhaseScheduling')
  async clearPhaseScheduling(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord> {
    return this.mutateSchedulingFlag(PhaseRunIdValue(phaseRunId), mutation, false)
  }

  /**
   * Annotate recorded gate-check verdicts stale: the M2 impact command for
   * verdicts the closure covers. A staled verdict supports no pass decision.
   * Idempotent: verdicts already staled are returned unchanged without a write.
   * @param submissionId - the submission whose verdicts the closure covers.
   * @param checkIds - the check ids to annotate; unknown ids are ignored.
   * @param mutation - actor, reason, idempotency key of the impact command.
   * @returns the verdicts this call staled, in storage order.
   */
  @Remote('markGateChecksStale')
  async markGateChecksStale(submissionId: string, checkIds: readonly string[], mutation: TaskMutationContext): Promise<GateCheckResult[]> {
    const id = SubmissionIdValue(this.resolveText(submissionId, 'submissionId'))
    const wanted = checkIds.map(check => this.resolveText(check, 'checkId'))
    return this.serialized(async () => {
      await this.loadSubmissionOrThrow(id)
      return this.staleGateChecks(id, wanted, provenanceOf(mutation))
    })
  }

  /**
   * Read one task projection.
   * @param taskId - the task to read.
   * @returns the current projection.
   */
  @Remote('getTask')
  async getTask(taskId: string): Promise<TaskRecord | undefined> {
    return this.loadTask(TaskIdValue(taskId))
  }

  /**
   * Every task projection, for the task board.
   * @returns tasks in insertion order.
   */
  @Remote('listTasks')
  async listTasks(): Promise<TaskRecord[]> {
    return this.loadAllTasks()
  }

  /**
   * Read one phase-run projection.
   * @param phaseRunId - the phase run to read.
   * @returns the current projection.
   */
  @Remote('getPhaseRun')
  async getPhaseRun(phaseRunId: string): Promise<PhaseRunRecord | undefined> {
    return this.loadPhaseRun(PhaseRunIdValue(phaseRunId))
  }

  /**
   * Every phase-run projection of one run, for the engine and the task board.
   * @param runId - the run whose phase runs to list.
   * @returns phase runs in insertion order.
   */
  @Remote('listPhaseRuns')
  async listPhaseRuns(runId: string): Promise<PhaseRunRecord[]> {
    return this.loadPhaseRunsOfRun(TaskRunIdValue(runId))
  }


  /**
   * Read one submission.
   * @param submissionId - the submission to read.
   * @returns the stored submission.
   */
  @Remote('getSubmission')
  async getSubmission(submissionId: string): Promise<PhaseSubmission | undefined> {
    return this.loadSubmission(SubmissionIdValue(submissionId))
  }

  /**
   * Every gate-check verdict recorded for one submission.
   * @param submissionId - the submission.
   * @returns verdicts in recording order.
   */
  @Remote('listGateResults')
  async listGateResults(submissionId: string): Promise<GateCheckResult[]> {
    return this.loadGateResults(SubmissionIdValue(submissionId))
  }

  /** Every task projection; providers implement the scan. */
  protected abstract loadAllTasks(): Promise<TaskRecord[]>

  /** Load, transition under the command table, save, and publish one task. */
  private mutateTask(
    taskId: TaskId,
    mutation: TaskMutationContext,
    command: TaskCommand,
    extra?: (task: TaskRecord) => Promise<Partial<TaskRecord>>,
  ): Promise<TaskRecord> {
    const provenance = provenanceOf(mutation)
    return this.serialized(async () => {
      const task = await this.loadTaskOrThrow(taskId)
      this.assertRevision(task, mutation)
      const next = taskTransition(task.state, command)
      if (next === null) {
        throw new TaskError('invalid-transition', `task in state "${task.state}" cannot ${command}`)
      }
      const updated: TaskRecord = {
        ...task,
        state: next,
        revision: task.revision + 1,
        ...await (extra?.(task) ?? Promise.resolve({})),
      }
      if (!await this.saveTask(updated, provenance)) throw new TaskError('stale-revision', 'task revision moved concurrently')
      this.emit('task/updated', updated)
      return updated
    })
  }

  private mutatePhaseRun(
    phaseRunId: PhaseRunId,
    mutation: TaskMutationContext,
    command: PhaseCommand,
  ): Promise<PhaseRunRecord> {
    const provenance = provenanceOf(mutation)
    return this.serialized(async () => {
      const phaseRun = await this.loadPhaseRunOrThrow(phaseRunId)
      this.assertRevision(phaseRun, mutation)
      const next = phaseTransition(phaseRun.state, command)
      if (next === null) {
        throw new TaskError('invalid-transition', `phase run in state "${phaseRun.state}" cannot ${command}`)
      }
      const updated: PhaseRunRecord = {
        ...phaseRun,
        state: next,
        revision: phaseRun.revision + 1,
      }
      if (!await this.savePhaseRun(updated, provenance)) throw new TaskError('stale-revision', 'phase-run revision moved concurrently')
      this.emit('phase-run/updated', updated)
      return updated
    })
  }

  /**
   * Load, assert revision, toggle the scheduling flag, save, and publish one
   * phase run; a no-op returning the stored record when the flag already
   * holds the requested value.
   */
  /**
   * Load, assert revision, set the session id, save, and publish one phase
   * run; a no-op returning the stored record when the id already holds the
   * requested value.
   */
  private mutateSessionId(phaseRunId: PhaseRunId, sessionId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord> {
    const provenance = provenanceOf(mutation)
    return this.serialized(async () => {
      const phaseRun = await this.loadPhaseRunOrThrow(phaseRunId)
      this.assertRevision(phaseRun, mutation)
      if (phaseRun.sessionId === sessionId) return phaseRun
      const updated: PhaseRunRecord = {
        ...phaseRun,
        sessionId,
        revision: phaseRun.revision + 1,
      }
      if (!await this.savePhaseRun(updated, provenance)) throw new TaskError('stale-revision', 'phase-run revision moved concurrently')
      this.emit('phase-run/updated', updated)
      return updated
    })
  }

  private mutateSchedulingFlag(phaseRunId: PhaseRunId, mutation: TaskMutationContext, frozen: boolean): Promise<PhaseRunRecord> {
    const provenance = provenanceOf(mutation)
    return this.serialized(async () => {
      const phaseRun = await this.loadPhaseRunOrThrow(phaseRunId)
      this.assertRevision(phaseRun, mutation)
      if (phaseRun.schedulingFrozen === frozen) return phaseRun
      const updated: PhaseRunRecord = {
        ...phaseRun,
        schedulingFrozen: frozen,
        revision: phaseRun.revision + 1,
      }
      if (!await this.savePhaseRun(updated, provenance)) throw new TaskError('stale-revision', 'phase-run revision moved concurrently')
      this.emit('phase-run/updated', updated)
      return updated
    })
  }

  private async loadTaskOrThrow(taskId: TaskId): Promise<TaskRecord> {
    const task = await this.loadTask(taskId)
    if (task === undefined) throw new TaskError('not-found', `task "${taskId}" is unknown`)
    return task
  }

  private async loadRunOrThrow(runId: TaskRunId): Promise<TaskRunRecord> {
    const run = await this.loadRun(runId)
    if (run === undefined) throw new TaskError('not-found', `task run "${runId}" is unknown`)
    return run
  }

  private async loadPhaseRunOrThrow(phaseRunId: PhaseRunId): Promise<PhaseRunRecord> {
    const phaseRun = await this.loadPhaseRun(phaseRunId)
    if (phaseRun === undefined) throw new TaskError('not-found', `phase run "${phaseRunId}" is unknown`)
    return phaseRun
  }

  private async loadSubmissionOrThrow(submissionId: SubmissionId): Promise<PhaseSubmission> {
    const submission = await this.loadSubmission(submissionId)
    if (submission === undefined) throw new TaskError('not-found', `submission "${submissionId}" is unknown`)
    return submission
  }

  /** Assert the caller's expected revision matches the loaded record. */
  private assertRevision(record: { readonly revision: number }, mutation: TaskMutationContext): void {
    if (!Number.isSafeInteger(mutation.expectedRevision) || mutation.expectedRevision < 1) {
      throw new TaskError('invalid-argument', 'expectedRevision must be a positive safe integer')
    }
    if (record.revision !== mutation.expectedRevision) {
      throw new TaskError('stale-revision', `expected revision ${mutation.expectedRevision}, stored ${record.revision}`)
    }
  }

  private resolveText(value: string, field: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new TaskError('invalid-argument', `${field} must be a non-empty string`)
    }
    return value.trim()
  }

  /** Contained fan-out: a broken listener never hides a committed change. */
  private emit(name: 'task/updated' | 'task-run/updated' | 'phase-run/updated' | 'gate-check/recorded', payload: TaskRecord | TaskRunRecord | PhaseRunRecord | GateCheckResult): void {
    for (const listener of this.ctx.events.dispatch('emit', [name, payload])) {
      try {
        listener(payload)
      } catch (error) {
        this.ctx.logger.warn('task: a %s listener failed: %s', name, error)
      }
    }
  }
}

export default TaskHandle
