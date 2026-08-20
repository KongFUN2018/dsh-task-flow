/**
 * Task-flow task service definition (`ctx.tasks`): pinned-recipe task
 * creation, the guarded state transitions this package owns, and the
 * PhaseSubmission acceptance chain. Providers persist through the abstract
 * storage hooks; every mutating command sequences one load, one pure
 * transition, one compare-and-set save, and one contained event fan-out.
 * @module @deepseek-ai/dsh-task
 */
import { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { PhaseRunId, SubmissionId, TaskId, TaskRunId } from './types.ts';
import type { GateCheckResult, PhaseRunRecord, PhaseSubmission, SubmissionEnvironmentFacts, TaskCreateConfirmResult, TaskMutationContext, TaskRecord, TaskRunRecord, TaskSeedContent, TaskSeedPoint, WriteProvenance } from './types.ts';
export type * from './types.ts';
/** The journal fact kind carrying a task's confirmed-creation seed (see `TaskSeedContent`). */
export declare const TASK_SEED_FACT_KIND = "task/seed-created";
export { TaskId, TaskRunId, PhaseRunId, SubmissionId, DeliverableId, DeliverableVersionId } from './runtime.ts';
export { TaskError } from './types.ts';
export { acceptSubmission, type SubmissionAcceptance, type SubmissionAcceptanceFacts, } from './submission.ts';
export { canCompleteTask, phaseTransition, taskTransition, type PhaseCommand, type TaskCommand, } from './state.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        tasks: TaskHandle;
    }
}
/** Task service: durable task/run/phase projections and guarded commands. */
export declare abstract class TaskHandle extends TypertRemoteService {
    constructor(ctx: Context);
    protected abstract loadTask(taskId: TaskId): Promise<TaskRecord | undefined>;
    protected abstract loadTaskByIdempotencyKey(key: string): Promise<TaskRecord | undefined>;
    protected abstract saveTask(task: TaskRecord, provenance: WriteProvenance): Promise<boolean>;
    protected abstract loadRun(runId: TaskRunId): Promise<TaskRunRecord | undefined>;
    protected abstract saveRun(run: TaskRunRecord, provenance: WriteProvenance): Promise<boolean>;
    protected abstract loadPhaseRun(phaseRunId: PhaseRunId): Promise<PhaseRunRecord | undefined>;
    protected abstract loadPhaseRunsOfRun(runId: TaskRunId): Promise<PhaseRunRecord[]>;
    protected abstract savePhaseRun(phaseRun: PhaseRunRecord, provenance: WriteProvenance): Promise<boolean>;
    protected abstract loadSubmission(submissionId: SubmissionId): Promise<PhaseSubmission | undefined>;
    protected abstract loadSubmissionByIdempotencyKey(key: string): Promise<PhaseSubmission | undefined>;
    protected abstract saveSubmission(submission: PhaseSubmission, provenance: WriteProvenance): Promise<void>;
    protected abstract loadGateResults(submissionId: SubmissionId): Promise<GateCheckResult[]>;
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
    protected abstract staleGateChecks(submissionId: SubmissionId, checkIds: readonly string[], provenance: WriteProvenance): Promise<GateCheckResult[]>;
    protected abstract saveGateResult(result: GateCheckResult, provenance: WriteProvenance): Promise<void>;
    /**
     * Derive the acceptance facts a provider owns before the verdict. The
     * default trusts the caller; providers with an injected fact source
     * (task-local derives deliverable currency) override this.
     * @param submission - the submission under acceptance.
     * @param environment - caller-supplied facts.
     * @returns the facts the acceptance verdict reads.
     */
    protected resolveSubmissionEnvironment(_submission: PhaseSubmission, environment: SubmissionEnvironmentFacts): Promise<SubmissionEnvironmentFacts>;
    /**
     * Provider-side acceptance effects after the verdict admits a new
     * submission (phase-input registration); the default does nothing.
     * @param submission - the admitted submission, not an idempotent replay.
     */
    protected onSubmissionAccepted(_submission: PhaseSubmission): Promise<void>;
    /** Tail of the serial task write chain; mutating commands never interleave. */
    private writeTail;
    /** Registered completion guards (M5); consulted inside the write chain. */
    private readonly completionGuards;
    /**
     * Register one completion guard: `completeTask` runs every registered guard
     * on the serial write chain after the state check passes; a throwing guard
     * rejects the command before any durable write. Contributors own their
     * disposal �?the returned handle removes the guard.
     * @param guard - async veto over one task about to complete.
     * @returns the disposer that unregisters the guard.
     */
    registerCompletionGuard(guard: (task: TaskRecord) => Promise<void>): () => void;
    /**
     * Run one whole mutating command on the serial task write chain, so load,
     * transition, save, and publish of concurrent commands never interleave.
     * @param command - the complete command body.
     * @returns the command's result.
     */
    protected serialized<T>(command: () => Promise<T>): Promise<T>;
    /**
     * Create a task pinned to the latest registered revision of one recipe.
     * @param recipeId - raw recipe identifier.
     * @param workspaceId - raw workspace identifier.
     * @param actor - creating actor, recorded with the creation.
     * @param idempotencyKey - deduplication key; a replay with the same key
     * returns the original task.
     * @returns the new task in `planning`.
     */
    createTask(recipeId: string, workspaceId: string, actor: string, idempotencyKey: string): Promise<TaskRecord>;
    /** Create one task pinned to the latest registered recipe revision; the serial write chain owns the commit. */
    private createTaskNow;
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
    confirmCreateTask(recipeId: string, goal: string, inheritSession: boolean, idempotencyKey: string, sourceSessionId: string, workspaceId: string, actor: string): Promise<TaskCreateConfirmResult>;
    /**
     * Provider-side derivation of the session-inherited discussion points; the default
     * carries none (no live source, or inheritance declined).
     * @param sourceSessionId - the source conversation to read.
     * @param inheritSession - whether the caller opted into session inheritance.
     * @returns the content-only seed points, newest-last.
     */
    protected resolveSeedPoints(_sourceSessionId: string, _inheritSession: boolean): Promise<TaskSeedPoint[]>;
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
    protected persistConfirmSeed(_task: TaskRecord, content: TaskSeedContent, _idempotencyKey: string, _actor: string): Promise<TaskSeedPoint[]>;
    /**
     * Move one task from `planning` into `running`.
     * @param taskId - the task to start.
     * @param mutation - actor, reason, expected revision, idempotency key.
     * @returns the post-commit task projection.
     */
    startTask(taskId: string, mutation: TaskMutationContext): Promise<TaskRecord>;
    /**
     * Request a pause; the task settles once in-flight phase work quiesces.
     * @param taskId - the task to pause.
     * @param mutation - actor, reason, expected revision, idempotency key.
     * @returns the task in `pausing`.
     */
    requestPause(taskId: string, mutation: TaskMutationContext): Promise<TaskRecord>;
    /**
     * Settle a completed pause into `paused`.
     * @param taskId - the task in `pausing`.
     * @param mutation - actor, reason, expected revision, idempotency key.
     * @returns the task in `paused`.
     */
    settlePause(taskId: string, mutation: TaskMutationContext): Promise<TaskRecord>;
    /**
     * Resume one paused task back into `running`.
     * @param taskId - the task in `paused`.
     * @param mutation - actor, reason, expected revision, idempotency key.
     * @returns the task in `running`.
     */
    resume(taskId: string, mutation: TaskMutationContext): Promise<TaskRecord>;
    /**
     * Request a cancel; the task settles once in-flight phase work quiesces.
     * @param taskId - the task to cancel.
     * @param mutation - actor, reason, expected revision, idempotency key.
     * @returns the task in `cancelling`.
     */
    requestCancel(taskId: string, mutation: TaskMutationContext): Promise<TaskRecord>;
    /**
     * Settle a completed cancel into `cancelled`.
     * @param taskId - the task in `cancelling`.
     * @param mutation - actor, reason, expected revision, idempotency key.
     * @returns the task in `cancelled`.
     */
    settleCancel(taskId: string, mutation: TaskMutationContext): Promise<TaskRecord>;
    /**
     * Fail one running task.
     * @param taskId - the task to fail.
     * @param mutation - actor, reason, expected revision, idempotency key.
     * @returns the task in `failed`.
     */
    failTask(taskId: string, mutation: TaskMutationContext): Promise<TaskRecord>;
    /**
     * Complete a task; the completion guard requires every phase run of the
     * current run to have passed (or retired into stale/superseded), then every
     * registered M5 completion guard must approve �?unsigned B items, suspended
     * rewind decisions, and open blocking decisions veto here.
     * @param taskId - the task to complete.
     * @param mutation - actor, reason, expected revision, idempotency key.
     * @returns the post-commit task projection.
     */
    completeTask(taskId: string, mutation: TaskMutationContext): Promise<TaskRecord>;
    /**
     * Park one running task in `awaiting-decision`: the over-budget decision
     * (M5 budget) holds scheduling without touching any phase run.
     * @param taskId - the task to park.
     * @param mutation - the task's expected revision plus actor metadata.
     * @returns the post-commit task projection.
     */
    markTaskAwaitingDecision(taskId: string, mutation: TaskMutationContext): Promise<TaskRecord>;
    /**
     * Return one parked task from `awaiting-decision` to `running`; the
     * resolved over-budget decision (append-budget outcome) resumes here.
     * @param taskId - the task to resume.
     * @param mutation - the task's expected revision plus actor metadata.
     * @returns the post-commit task projection.
     */
    resumeTaskFromDecision(taskId: string, mutation: TaskMutationContext): Promise<TaskRecord>;
    /**
     * Open a new run on one task and make it the current run.
     * @param taskId - the owning task.
     * @param mutation - the task's expected revision plus actor metadata.
     * @param parentRunId - the superseded branch this run replaces (rewind);
     * omitted on the initial run.
     * @returns the new run.
     */
    createTaskRun(taskId: string, mutation: TaskMutationContext, parentRunId?: string): Promise<TaskRunRecord>;
    /**
     * Create one phase run inside a run.
     * @param runId - the owning run.
     * @param phaseId - the recipe phase id this run executes.
     * @param mutation - the run's expected revision plus actor metadata.
     * @returns the new phase run in `created`.
     */
    createPhaseRun(runId: string, phaseId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord>;
    /**
     * Move one phase run into `running`.
     * @param phaseRunId - the phase run to start.
     * @param mutation - the phase run's expected revision plus actor metadata.
     * @returns the post-commit phase-run projection.
     */
    startPhaseRun(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord>;
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
    protected applySubmission(submission: PhaseSubmission, environment: SubmissionEnvironmentFacts): Promise<PhaseSubmission>;
    recordSubmission(submission: PhaseSubmission, environment: SubmissionEnvironmentFacts): Promise<PhaseSubmission>;
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
    requestPatch(taskId: string, phaseRunId: string, note: string, mutation: TaskMutationContext): Promise<PhaseSubmission>;
    /**
     * Start the gate for one accepted submission.
     * @param submissionId - the accepted submission.
     * @param mutation - the phase run's expected revision plus actor metadata.
     * @returns the post-commit phase-run projection.
     */
    startGate(submissionId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord>;
    /**
     * Record one gate-check verdict for a submission.
     * @param result - the check verdict.
     * @returns the stored verdict.
     */
    recordGateCheck(result: GateCheckResult): Promise<GateCheckResult>;
    /**
     * Mark one phase run passed.
     * @param phaseRunId - the phase run.
     * @param mutation - the phase run's expected revision plus actor metadata.
     * @returns the post-commit phase-run projection.
     */
    markPhasePassed(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord>;
    /**
     * Mark one gate-running phase run failed.
     * @param phaseRunId - the phase run.
     * @param mutation - the phase run's expected revision plus actor metadata.
     * @returns the post-commit phase-run projection.
     */
    markPhaseFailed(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord>;
    /**
     * Cancel one not-yet-passed phase run.
     * @param phaseRunId - the phase run to cancel.
     * @param mutation - the phase run's expected revision plus actor metadata.
     * @returns the post-commit phase-run projection.
     */
    cancelPhaseRun(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord>;
    /**
     * Mark one phase run stale: the M2 impact command. A stale run is
     * terminal; the engine re-opens the phase as a new run. Runs in `running`
     * or `submitting` reject �?an in-flight atomic action settles per the M1
     * quiescence contract.
     * @param phaseRunId - the phase run the impact closure covers.
     * @param mutation - the phase run's expected revision plus actor metadata.
     * @returns the post-commit phase-run projection.
     */
    markPhaseStale(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord>;
    /**
     * Retire one phase run into `superseded`: the M5 rewind command. A
     * superseded run is terminal and never blocks completion; unlike `stale`
     * (invalidated inputs), superseded means the whole branch lost to a newer
     * run, so in-flight states retire too �?the rewind decision already
     * committed to abandoning the branch.
     * @param phaseRunId - the phase run the rewind retires.
     * @param mutation - the phase run's expected revision plus actor metadata.
     * @returns the post-commit phase-run projection.
     */
    markPhaseSuperseded(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord>;
    /**
     * Park one gate-running phase run in `awaiting-input`: the M3 clarification
     * state. The clarification service resolves the inputs and resumes the run.
     * @param phaseRunId - the phase run awaiting clarification input.
     * @param mutation - the phase run's expected revision plus actor metadata.
     * @returns the post-commit phase-run projection.
     */
    markPhaseAwaitingInput(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord>;
    /**
     * Park one gate-running phase run in `awaiting-decision`: the M3 complex-gate
     * state for B/C checks. The attention service decides and resumes the run.
     * @param phaseRunId - the phase run awaiting a B/C decision.
     * @param mutation - the phase run's expected revision plus actor metadata.
     * @returns the post-commit phase-run projection.
     */
    markPhaseAwaitingDecision(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord>;
    /**
     * Return a parked phase run from `awaiting-input` or `awaiting-decision` to
     * `gate-running`, so the engine re-runs the gate. Clarification completion
     * and attention decisions resume through this command.
     * @param phaseRunId - the parked phase run.
     * @param mutation - the phase run's expected revision plus actor metadata.
     * @returns the post-commit phase-run projection.
     */
    resumePhaseFromAwaiting(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord>;
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
    recordPhaseSession(phaseRunId: string, sessionId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord>;
    /**
     * Freeze one phase run's scheduling: the engine dispatches no new work for
     * a frozen run while in-flight atomic actions still settle. The M2
     * edit-lock service sets this while a lease covers a version the run's
     * registered inputs consume.
     * @param phaseRunId - the phase run to freeze.
     * @param mutation - the phase run's expected revision plus actor metadata.
     * @returns the post-commit phase-run projection with the flag set.
     */
    freezePhaseScheduling(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord>;
    /**
     * Clear one phase run's scheduling freeze; the engine wakes on the
     * committed change and resumes dispatching.
     * @param phaseRunId - the frozen phase run.
     * @param mutation - the phase run's expected revision plus actor metadata.
     * @returns the post-commit phase-run projection with the flag cleared.
     */
    clearPhaseScheduling(phaseRunId: string, mutation: TaskMutationContext): Promise<PhaseRunRecord>;
    /**
     * Annotate recorded gate-check verdicts stale: the M2 impact command for
     * verdicts the closure covers. A staled verdict supports no pass decision.
     * Idempotent: verdicts already staled are returned unchanged without a write.
     * @param submissionId - the submission whose verdicts the closure covers.
     * @param checkIds - the check ids to annotate; unknown ids are ignored.
     * @param mutation - actor, reason, idempotency key of the impact command.
     * @returns the verdicts this call staled, in storage order.
     */
    markGateChecksStale(submissionId: string, checkIds: readonly string[], mutation: TaskMutationContext): Promise<GateCheckResult[]>;
    /**
     * Read one task projection.
     * @param taskId - the task to read.
     * @returns the current projection.
     */
    getTask(taskId: string): Promise<TaskRecord | undefined>;
    /**
     * Every task projection, for the task board.
     * @returns tasks in insertion order.
     */
    listTasks(): Promise<TaskRecord[]>;
    /**
     * Read one phase-run projection.
     * @param phaseRunId - the phase run to read.
     * @returns the current projection.
     */
    getPhaseRun(phaseRunId: string): Promise<PhaseRunRecord | undefined>;
    /**
     * Every phase-run projection of one run, for the engine and the task board.
     * @param runId - the run whose phase runs to list.
     * @returns phase runs in insertion order.
     */
    listPhaseRuns(runId: string): Promise<PhaseRunRecord[]>;
    /**
     * Read one submission.
     * @param submissionId - the submission to read.
     * @returns the stored submission.
     */
    getSubmission(submissionId: string): Promise<PhaseSubmission | undefined>;
    /**
     * Every gate-check verdict recorded for one submission.
     * @param submissionId - the submission.
     * @returns verdicts in recording order.
     */
    listGateResults(submissionId: string): Promise<GateCheckResult[]>;
    /** Every task projection; providers implement the scan. */
    protected abstract loadAllTasks(): Promise<TaskRecord[]>;
    /** Load, transition under the command table, save, and publish one task. */
    private mutateTask;
    private mutatePhaseRun;
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
    private mutateSessionId;
    private mutateSchedulingFlag;
    private loadTaskOrThrow;
    private loadRunOrThrow;
    private loadPhaseRunOrThrow;
    private loadSubmissionOrThrow;
    /** Assert the caller's expected revision matches the loaded record. */
    private assertRevision;
    private resolveText;
    /** Contained fan-out: a broken listener never hides a committed change. */
    private emit;
}
export default TaskHandle;
//# sourceMappingURL=index.d.ts.map