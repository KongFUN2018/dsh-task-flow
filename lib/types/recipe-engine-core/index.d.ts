/**
 * Recipe engine core (`ctx.recipeEngine`): schedules pinned-recipe phase
 * runs on the durable task service, drives the submission-gate-pass chain
 * through a contributed phase executor, and reconciles pause, cancel, and
 * restart recovery against the workbench journal. The injection closure
 * is frozen by the M1 freeze: attention, clarifications, and deliverable
 * services never enter this engine; deliverable-ref validation already
 * runs inside the task write chain.
 * @module @deepseek-ai/dsh-recipe-engine-core
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import '@deepseek-ai/dsh-agent';
import '@deepseek-ai/dsh-goal';
import type { TaskId } from '../task/types.ts';
import '../workbench/journal/index.ts';
import { type PhaseExecutor } from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        recipeEngine: RecipeEngineCore;
    }
}
/**
 * Schedules one task through its pinned recipe: opens the run and phase
 * runs, executes each phase via the contributed executor, records the
 * submission, runs the deterministic gate, and advances or settles the
 * task. Pause and cancel are barriers observed between atomic actions;
 * restart recovery rebuilds from the durable bindings and journal.
 */
export declare class RecipeEngineCore extends Service {
    static inject: string[];
    private executor;
    private bindingsTable;
    /** Per-task serialized scheduling chains; one scheduleNow runs at a time per task. */
    private readonly tails;
    /** In-flight executor promises keyed by phase run id, with their task key. */
    private readonly inFlight;
    /** Live phase-session handles keyed by phase run id, disposed when the phase settles. */
    private readonly sessions;
    /** Tasks whose recipe or journal state the engine refuses to schedule again this session. */
    private readonly poisoned;
    constructor(ctx: Context);
    /** Open the engine domain, then reconcile recovery for every known task. */
    protected [Service.init](): Promise<void>;
    /**
     * Register the single phase executor. Disposal proves removal (HMR-safe).
     * @param executor - the executor that performs every scheduled phase.
     * @returns the disposer clearing this registration.
     */
    registerExecutor(executor: PhaseExecutor): () => void;
    /**
     * Wake the scheduler for one task. Wakes queue per task, so concurrent
     * events never interleave scheduling steps for the same task.
     * @param taskId - the task to schedule.
     */
    trigger(taskId: TaskId): Promise<void>;
    /**
     * Reconcile recovery: validate each non-terminal task's journal head
     * against its projection revision, then wake every non-terminal task.
     * Scheduling itself resumes submitted-but-ungated phases and re-executes
     * phase runs whose executor died mid-flight.
     */
    recover(): Promise<void>;
    /** Require the opened bindings table, failing loud when unopened. */
    private requireBindings;
    /**
     * Validate the task's journal head against its projection revision
     * (design §8). A disagreement poisons the task: the engine stops
     * scheduling it rather than acting on a projection the journal cannot
     * rebuild.
     */
    private validateJournalHead;
    private poison;
    /**
     * One scheduling pass: read state and advance one step per iteration until
     * no step remains. The task mutation commands are idempotent-by-state,
     * so the loop terminates on the acyclic state machine.
     */
    private scheduleNow;
    /** Resolve the task's pinned revision and verify its hash; poison on disagreement. */
    private resolvePinned;
    /**
     * Advance one running task by one step. Returns true when the step made
     * progress (re-read and continue), false when the task needs no step now.
     */
    private advanceTask;
    /** With every phase run terminal, open the next phase or complete/fail the task. */
    private advancePhases;
    /**
     * Execute one phase: open its session, run the executor to a terminal
     * outcome, and record the submission (the atomic action's durable
     * commit). An executor failure cancels the phase and rethrows loudly.
     */
    private executePhase;
    /** Deterministic submission id: same phase run and attempt, same id, so a retried record replays the stored submission. */
    private submissionIdFor;
    /** Build the immutable submission from the executor outcome and the binding. */
    private buildSubmission;
    /**
     * Run the gate for one submitted phase: start it once, record only the
     * missing deterministic A checks, then pass or fail the phase. Retried
     * checks reuse the submission timestamp so replays deduplicate exactly.
     */
    private runGate;
    /** Evaluate one deterministic A check; unsupported scopes fail loud. */
    private evaluateCheck;
    /**
     * Open the phase session: create an agent and goal when an agent factory
     * is registered, otherwise record a synthetic session id so submissions
     * still name their source. The handle is disposed when the phase settles.
     */
    private openSession;
    /**
     * Seed a freshly opened first-phase session with the task's confirmed
     * creation context: the journaled task/seed-created goal followed by its
     * inherited points, each as a user/message append. Runs at most once per
     * session: a non-empty event log (reopened session or already seeded)
     * skips, and a missing journal seed is a silent no-op.
     */
    private seedOpenedSessionIfVoid;
    /** Cancel every active phase run of a cancelling task, then its sessions. */
    private cancelActivePhases;
    private hasInFlightForTask;
    private bindingOf;
    private putBinding;
    private disposeSession;
    private disposeTaskSessions;
    private requireExecutor;
    private mutation;
}
export default RecipeEngineCore;
//# sourceMappingURL=index.d.ts.map