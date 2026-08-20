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
import '@deepseek-ai/dsh-agent';
import '@deepseek-ai/dsh-goal';
import { RecipeError } from "../recipe/index.js";
import { createUserMessage } from '@deepseek-ai/dsh-llm';
import { SessionId } from '@deepseek-ai/dsh-session';
import { SubmissionId as SubmissionIdValue, TASK_SEED_FACT_KIND } from "../task/index.js";
import "../workbench/journal/index.js";
import { recipeEngineDomainSpec } from "./spec.js";
import { RecipeEngineError, } from "./types.js";
/** Task states that end a task; the engine stops scheduling them. */
const TERMINAL_TASK_STATES = ['completed', 'failed', 'cancelled'];
/** Phase-run states that end a phase; the engine never re-executes them. */
const TERMINAL_PHASE_STATES = ['passed', 'failed', 'cancelled', 'superseded', 'stale'];
/** The one deterministic A-check machine scope the M1 engine evaluates. */
const MACHINE_SCOPE_OUTPUTS = 'the accepted submission lists every declared phase output';
/**
 * Schedules one task through its pinned recipe: opens the run and phase
 * runs, executes each phase via the contributed executor, records the
 * submission, runs the deterministic gate, and advances or settles the
 * task. Pause and cancel are barriers observed between atomic actions;
 * restart recovery rebuilds from the durable bindings and journal.
 */
export class RecipeEngineCore extends Service {
    static inject = ['tasks', 'recipes', 'agents', 'goals', 'storageDomain', 'workbenchJournal'];
    executor;
    bindingsTable;
    /** Per-task serialized scheduling chains; one scheduleNow runs at a time per task. */
    tails = new Map();
    /** In-flight executor promises keyed by phase run id, with their task key. */
    inFlight = new Map();
    /** Live phase-session handles keyed by phase run id, disposed when the phase settles. */
    sessions = new Map();
    /** Tasks whose recipe or journal state the engine refuses to schedule again this session. */
    poisoned = new Set();
    constructor(ctx) {
        super(ctx, 'recipeEngine');
        ctx.on('task/updated', (task) => { void this.trigger(task.taskId); }, { global: true });
        // Impact staling and scheduling-freeze toggles publish phase-run changes
        // without a task write: wake the owning task so stale phases re-open and
        // cleared freezes resume dispatch.
        ctx.on('phase-run/updated', (run) => { void this.trigger(run.taskId); }, { global: true });
    }
    /** Open the engine domain, then reconcile recovery for every known task. */
    async [Service.init]() {
        const domain = await this.ctx.storageDomain.open(recipeEngineDomainSpec);
        this.ctx.effect(() => async () => { await domain.close(); }, 'recipe-engine.domainClose');
        this.bindingsTable = domain.table('phase_sessions');
        await this.recover();
    }
    /**
     * Register the single phase executor. Disposal proves removal (HMR-safe).
     * @param executor - the executor that performs every scheduled phase.
     * @returns the disposer clearing this registration.
     */
    registerExecutor(executor) {
        if (this.executor !== undefined)
            throw new Error('a phase executor is already registered');
        this.executor = executor;
        // Tasks stalled for want of an executor resume scheduling now.
        void this.recover();
        return () => {
            if (this.executor === executor)
                this.executor = undefined;
        };
    }
    /**
     * Wake the scheduler for one task. Wakes queue per task, so concurrent
     * events never interleave scheduling steps for the same task.
     * @param taskId - the task to schedule.
     */
    async trigger(taskId) {
        if (this.bindingsTable === undefined)
            return;
        const key = String(taskId);
        const prior = this.tails.get(key) ?? Promise.resolve();
        const run = prior.then(() => this.scheduleNow(taskId)).catch((error) => {
            if (error instanceof RecipeEngineError) {
                this.ctx.logger('recipe-engine').warn(`scheduling "${key}" stopped: ${error.message}`);
                return;
            }
            throw error;
        });
        this.tails.set(key, run.then(() => undefined, () => undefined));
        await run;
    }
    /**
     * Reconcile recovery: validate each non-terminal task's journal head
     * against its projection revision, then wake every non-terminal task.
     * Scheduling itself resumes submitted-but-ungated phases and re-executes
     * phase runs whose executor died mid-flight.
     */
    async recover() {
        if (this.bindingsTable === undefined)
            return;
        const tasks = await this.ctx.tasks.listTasks();
        const live = tasks.filter(task => !TERMINAL_TASK_STATES.includes(task.state));
        for (const task of live)
            this.validateJournalHead(task);
        await Promise.all(live.map(task => this.trigger(task.taskId)));
    }
    /** Require the opened bindings table, failing loud when unopened. */
    requireBindings() {
        if (this.bindingsTable === undefined)
            throw new Error('recipe-engine bindings table is not open');
        return this.bindingsTable;
    }
    /**
     * Validate the task's journal head against its projection revision
     * (design §8). A disagreement poisons the task: the engine stops
     * scheduling it rather than acting on a projection the journal cannot
     * rebuild.
     */
    validateJournalHead(task) {
        const facts = this.ctx.workbenchJournal.replay(0).filter(fact => fact.taskId === task.taskId && fact.kind === 'task/updated');
        const head = facts.reduce((max, fact) => Math.max(max, fact.entityRevision), 0);
        if (head !== task.revision) {
            this.poison(task.taskId, `recovery-mismatch: projection revision ${task.revision} disagrees with journal head ${head}`);
        }
    }
    poison(taskId, message) {
        const key = String(taskId);
        if (this.poisoned.has(key))
            return;
        this.poisoned.add(key);
        this.ctx.logger('recipe-engine').error(`task "${key}": ${message}`);
    }
    /**
     * One scheduling pass: read state and advance one step per iteration until
     * no step remains. The task mutation commands are idempotent-by-state,
     * so the loop terminates on the acyclic state machine.
     */
    async scheduleNow(taskId) {
        const key = String(taskId);
        if (this.poisoned.has(key))
            return;
        this.requireBindings();
        for (;;) {
            const task = await this.ctx.tasks.getTask(key);
            if (task === undefined)
                return;
            if (TERMINAL_TASK_STATES.includes(task.state)) {
                this.disposeTaskSessions(task);
                return;
            }
            if (task.state === 'pausing') {
                if (this.hasInFlightForTask(key))
                    return;
                await this.ctx.tasks.settlePause(key, this.mutation(task.taskId, task.revision, 'settle-pause'));
                continue;
            }
            if (task.state === 'cancelling') {
                if (this.hasInFlightForTask(key))
                    return;
                await this.cancelActivePhases(task);
                await this.ctx.tasks.settleCancel(key, this.mutation(task.taskId, task.revision, 'settle-cancel'));
                continue;
            }
            if (task.state !== 'running')
                return;
            const pinned = this.resolvePinned(task);
            if (pinned === undefined)
                return;
            if (!await this.advanceTask(task, pinned))
                return;
        }
    }
    /** Resolve the task's pinned revision and verify its hash; poison on disagreement. */
    resolvePinned(task) {
        let pinned;
        try {
            pinned = this.ctx.recipes.getPinned({ recipeId: task.pinnedRecipe.recipeId, revision: task.pinnedRecipe.revision });
        }
        catch (error) {
            if (error instanceof RecipeError) {
                this.poison(task.taskId, `recipe-unsupported: ${error.message}`);
                return undefined;
            }
            throw error;
        }
        if (pinned.contentHash !== task.pinnedRecipe.contentHash) {
            this.poison(task.taskId, `recipe-unsupported: pinned hash disagrees with the registered revision ${task.pinnedRecipe.revision}`);
            return undefined;
        }
        return pinned;
    }
    /**
     * Advance one running task by one step. Returns true when the step made
     * progress (re-read and continue), false when the task needs no step now.
     */
    async advanceTask(task, pinned) {
        const key = String(task.taskId);
        const phaseOrder = pinned.payload.phases;
        if (task.currentRunId === undefined) {
            await this.ctx.tasks.createTaskRun(key, this.mutation(task.taskId, task.revision, 'create-run'));
            return true;
        }
        const runs = await this.ctx.tasks.listPhaseRuns(String(task.currentRunId));
        for (const run of runs) {
            if (TERMINAL_PHASE_STATES.includes(run.state))
                this.disposeSession(String(run.phaseRunId));
        }
        const active = runs.filter(run => !TERMINAL_PHASE_STATES.includes(run.state));
        if (active.length === 0)
            return this.advancePhases(task, runs, phaseOrder);
        if (active.length > 1) {
            // A crash between createPhaseRun and its binding put leaves one orphan
            // active run; keep the newest and cancel the rest.
            const keep = active[active.length - 1];
            for (const run of active) {
                if (keep === undefined || run.phaseRunId === keep.phaseRunId)
                    continue;
                await this.ctx.tasks.cancelPhaseRun(String(run.phaseRunId), this.mutation(task.taskId, run.revision, 'cancel-orphan-phase'));
            }
            return true;
        }
        const phaseRun = active[0];
        if (phaseRun === undefined)
            return false;
        // A scheduling freeze holds dispatch only: in-flight atomic actions still
        // settle and their submitted facts stay accepted per the M1 contract.
        if (phaseRun.schedulingFrozen === true)
            return false;
        const binding = this.bindingOf(String(phaseRun.phaseRunId));
        const phase = phaseOrder.find(spec => spec.phaseId === phaseRun.phaseId);
        if (phase === undefined) {
            this.poison(task.taskId, `recipe-unsupported: phase run names undeclared phase "${phaseRun.phaseId}"`);
            return false;
        }
        switch (phaseRun.state) {
            case 'created':
            case 'scheduled': {
                const started = await this.ctx.tasks.startPhaseRun(String(phaseRun.phaseRunId), this.mutation(task.taskId, phaseRun.revision, 'start-phase'));
                await this.executePhase(task, task.currentRunId, started, phase, pinned, binding);
                return true;
            }
            case 'running': {
                if (this.inFlight.has(String(phaseRun.phaseRunId)))
                    return false;
                await this.executePhase(task, task.currentRunId, phaseRun, phase, pinned, binding);
                return true;
            }
            case 'submitted':
            case 'gate-running':
                await this.runGate(task, phaseRun, phase, binding, pinned);
                return true;
            case 'submitting':
            case 'awaiting-input':
            case 'awaiting-decision':
            case 'patching':
            case 'stale':
                return false;
            case 'passed':
            case 'failed':
            case 'cancelled':
            case 'superseded':
                return false;
        }
    }
    /** With every phase run terminal, open the next phase or complete/fail the task. */
    async advancePhases(task, runs, phaseOrder) {
        // A scheduling freeze stops every new scheduling decision for the run,
        // including completion, until the covering lease clears the freeze.
        if (runs.some(run => run.schedulingFrozen === true))
            return false;
        const key = String(task.taskId);
        const passed = new Set(runs.filter(run => run.state === 'passed').map(run => run.phaseId));
        const next = phaseOrder.find(spec => !passed.has(spec.phaseId));
        if (next === undefined) {
            await this.ctx.tasks.completeTask(key, this.mutation(task.taskId, task.revision, 'complete'));
            return true;
        }
        const priorFailed = runs.find(run => run.phaseId === next.phaseId && (run.state === 'failed' || run.state === 'cancelled'));
        if (priorFailed !== undefined) {
            await this.ctx.tasks.failTask(key, this.mutation(task.taskId, task.revision, 'fail-after-failed-phase'));
            return true;
        }
        const runId = task.currentRunId;
        if (runId === undefined)
            return false;
        const phaseRun = await this.ctx.tasks.createPhaseRun(String(runId), next.phaseId, this.mutation(task.taskId, 1, 'create-phase'));
        await this.putBinding({
            phaseRunId: phaseRun.phaseRunId,
            taskId: task.taskId,
            taskRunId: runId,
            phaseId: next.phaseId,
            attempt: 0,
            updatedAt: Date.now(),
        });
        return true;
    }
    /**
     * Execute one phase: open its session, run the executor to a terminal
     * outcome, and record the submission (the atomic action's durable
     * commit). An executor failure cancels the phase and rethrows loudly.
     */
    async executePhase(task, runId, phaseRun, phase, pinned, binding) {
        const executor = this.requireExecutor();
        const attempt = (binding?.attempt ?? 0) + 1;
        const submissionId = this.submissionIdFor(phaseRun, attempt);
        const session = await this.openSession(phaseRun, phase, attempt, pinned.payload.phases[0]?.phaseId === phase.phaseId);
        await this.ctx.tasks.recordPhaseSession(String(phaseRun.phaseRunId), session.sessionId, this.mutation(task.taskId, phaseRun.revision, 'record-session'));
        const next = {
            phaseRunId: phaseRun.phaseRunId,
            taskId: task.taskId,
            taskRunId: runId,
            phaseId: phaseRun.phaseId,
            attempt,
            sessionId: session.sessionId,
            ...(binding?.submissionId === undefined ? {} : { submissionId: binding.submissionId }),
            updatedAt: Date.now(),
        };
        await this.putBinding(next);
        const assignment = {
            taskId: task.taskId,
            taskRunId: runId,
            phaseRunId: phaseRun.phaseRunId,
            pinned,
            phase,
            gateChecks: pinned.payload.gateChecks.filter(check => check.phaseId === phaseRun.phaseId),
            attempt,
            submissionId,
            ...(session.agent === undefined ? {} : { agent: session.agent }),
        };
        const runPromise = executor.execute(assignment);
        const phaseKey = String(phaseRun.phaseRunId);
        this.inFlight.set(phaseKey, { taskKey: String(task.taskId), promise: runPromise });
        let outcome;
        try {
            outcome = await runPromise;
        }
        catch (error) {
            this.inFlight.delete(phaseKey);
            await this.ctx.tasks.cancelPhaseRun(phaseKey, this.mutation(task.taskId, phaseRun.revision, 'cancel-after-executor-failure'));
            this.disposeSession(phaseKey);
            throw error;
        }
        this.inFlight.delete(phaseKey);
        // The executor's atomic action completed. A pause arriving mid-flight is
        // fine - the submission records while the task quiesces. A cancel or a
        // terminal state discards the outcome instead: the loop cancels the phase.
        const settled = await this.ctx.tasks.getTask(String(task.taskId));
        if (settled === undefined || settled.state === 'cancelling' || TERMINAL_TASK_STATES.includes(settled.state)) {
            return;
        }
        const submission = this.buildSubmission(task, runId, phaseRun, attempt, submissionId, next, outcome);
        await this.ctx.tasks.recordSubmission(submission, {
            submittedBy: 'recipe-engine',
            sourceSeqPersisted: outcome.sourceSeqPersisted,
            inputsCurrent: true,
            outputsValid: true,
        });
        await this.putBinding({ ...next, submissionId: submission.submissionId, updatedAt: Date.now() });
    }
    /** Deterministic submission id: same phase run and attempt, same id, so a retried record replays the stored submission. */
    submissionIdFor(phaseRun, attempt) {
        return SubmissionIdValue(`sub-${String(phaseRun.phaseRunId)}-a${attempt}`);
    }
    /** Build the immutable submission from the executor outcome and the binding. */
    buildSubmission(task, runId, phaseRun, attempt, submissionId, binding, outcome) {
        const raw = String(phaseRun.phaseRunId);
        return {
            submissionId,
            taskId: task.taskId,
            taskRunId: runId,
            phaseRunId: phaseRun.phaseRunId,
            phaseId: phaseRun.phaseId,
            attempt,
            pinnedRecipe: task.pinnedRecipe,
            sourceSessionId: binding.sessionId ?? `phase-${raw}`,
            sourceSeqRange: outcome.sourceSeqRange,
            inputVersions: outcome.result === 'completed' ? outcome.inputVersions : [],
            outputVersions: outcome.result === 'completed' ? outcome.outputVersions : [],
            unresolvedIssues: outcome.result === 'completed' ? outcome.unresolvedIssues : [],
            result: outcome.result,
            ...(outcome.result === 'failed' ? { failureReason: outcome.failureReason } : {}),
            idempotencyKey: `engine:submit:${raw}:${attempt}`,
            submittedAt: Date.now(),
            ...(binding.submissionId === undefined ? {} : { supersedesSubmissionId: binding.submissionId }),
        };
    }
    /**
     * Run the gate for one submitted phase: start it once, record only the
     * missing deterministic A checks, then pass or fail the phase. Retried
     * checks reuse the submission timestamp so replays deduplicate exactly.
     */
    async runGate(task, phaseRun, phase, binding, pinned) {
        const submissionId = phaseRun.activeSubmissionId ?? binding?.submissionId;
        if (submissionId === undefined) {
            this.poison(task.taskId, `recovery-mismatch: phase run "${phaseRun.phaseRunId}" has no active submission`);
            return;
        }
        const submission = await this.ctx.tasks.getSubmission(String(submissionId));
        if (submission === undefined) {
            this.poison(task.taskId, `recovery-mismatch: submission "${submissionId}" is missing`);
            return;
        }
        let current = phaseRun;
        if (phaseRun.state === 'submitted') {
            current = await this.ctx.tasks.startGate(String(submissionId), this.mutation(task.taskId, phaseRun.revision, 'start-gate'));
        }
        if (submission.result === 'failed') {
            await this.ctx.tasks.markPhaseFailed(String(phaseRun.phaseRunId), this.mutation(task.taskId, current.revision, 'fail-phase'));
            return;
        }
        const checks = pinned.payload.gateChecks.filter(check => check.phaseId === phaseRun.phaseId);
        const aChecks = checks.filter(check => check.kind === 'A');
        const hasComplexChecks = checks.length !== aChecks.length;
        const recorded = await this.ctx.tasks.listGateResults(String(submissionId));
        const recordedIds = new Set(recorded.map(result => result.checkId));
        for (const check of aChecks) {
            if (recordedIds.has(check.checkId))
                continue;
            const verdict = this.evaluateCheck(check, phase, submission);
            await this.ctx.tasks.recordGateCheck({
                submissionId,
                checkId: check.checkId,
                passed: verdict.passed,
                detail: verdict.detail,
                recordedAt: submission.submittedAt,
                uncoveredScope: [...check.humanAction],
                evidenceRefs: submission.outputVersions.map(ref => String(ref.versionId)),
            });
        }
        // B/C checks carry no machine verdict: the gate service advances the run
        // to awaiting-decision and the engine waits for the decision round.
        if (hasComplexChecks)
            return;
        const results = await this.ctx.tasks.listGateResults(String(submissionId));
        // A stale-annotated A verdict supports no pass; the phase run re-executes.
        const allPassed = results.length === aChecks.length && results.every(result => result.passed && result.stale !== true);
        if (allPassed) {
            await this.ctx.tasks.markPhasePassed(String(phaseRun.phaseRunId), this.mutation(task.taskId, current.revision, 'pass-phase'));
        }
        else {
            await this.ctx.tasks.markPhaseFailed(String(phaseRun.phaseRunId), this.mutation(task.taskId, current.revision, 'fail-phase'));
        }
    }
    /** Evaluate one deterministic A check; unsupported scopes fail loud. */
    evaluateCheck(check, phase, submission) {
        const scope = check.machineScope.join('; ');
        if (scope !== MACHINE_SCOPE_OUTPUTS) {
            throw new RecipeEngineError('recipe-unsupported', `check "${check.checkId}" machine scope "${scope}" is not an M1 deterministic check`);
        }
        const declared = new Set(phase.outputs);
        const produced = new Set(submission.outputVersions.map(ref => String(ref.deliverableId)));
        const missing = [...declared].filter(output => !produced.has(output));
        return missing.length === 0
            ? { passed: true, detail: `all ${declared.size} declared output(s) listed` }
            : { passed: false, detail: `missing declared output(s): ${missing.join(', ')}` };
    }
    /**
     * Open the phase session: create an agent and goal when an agent factory
     * is registered, otherwise record a synthetic session id so submissions
     * still name their source. The handle is disposed when the phase settles.
     */
    async openSession(phaseRun, phase, attempt, shouldSeed) {
        const raw = String(phaseRun.phaseRunId);
        try {
            const handle = await this.ctx.agents.create({ sessionId: SessionId(`phase-${raw}-a${attempt}`) });
            this.ctx.goals.create(handle.agent, { objective: phase.goal });
            this.sessions.set(raw, handle);
            if (shouldSeed)
                this.seedOpenedSessionIfVoid(handle.agent.session, phaseRun.taskId);
            return { handle, agent: handle.agent, sessionId: `phase-${raw}-a${attempt}` };
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('no agent factory registered')) {
                return { sessionId: `phase-${raw}` };
            }
            throw error;
        }
    }
    /**
     * Seed a freshly opened first-phase session with the task's confirmed
     * creation context: the journaled task/seed-created goal followed by its
     * inherited points, each as a user/message append. Runs at most once per
     * session: a non-empty event log (reopened session or already seeded)
     * skips, and a missing journal seed is a silent no-op.
     */
    seedOpenedSessionIfVoid(session, taskId) {
        if (session.events.length > 0)
            return;
        const seed = [...this.ctx.workbenchJournal.replay(0)]
            .filter(fact => fact.taskId === taskId && fact.kind === TASK_SEED_FACT_KIND)
            .at(-1);
        if (seed === undefined)
            return;
        const content = seed.payload;
        if (content.goal.length > 0) {
            session.append('user/message', createUserMessage({
                content: [{ type: 'text', text: content.goal }],
                source: { kind: 'user' },
            }), { surfaceOp: 'append' });
        }
        for (const point of content.points) {
            session.append('user/message', createUserMessage({
                content: [{ type: 'text', text: point.text }],
                source: { kind: 'user' },
            }), { surfaceOp: 'append' });
        }
    }
    /** Cancel every active phase run of a cancelling task, then its sessions. */
    async cancelActivePhases(task) {
        const runId = task.currentRunId;
        if (runId === undefined)
            return;
        const runs = await this.ctx.tasks.listPhaseRuns(String(runId));
        for (const run of runs) {
            if (TERMINAL_PHASE_STATES.includes(run.state))
                continue;
            await this.ctx.tasks.cancelPhaseRun(String(run.phaseRunId), this.mutation(task.taskId, run.revision, 'cancel-phase'));
            this.disposeSession(String(run.phaseRunId));
        }
    }
    hasInFlightForTask(taskKey) {
        for (const entry of this.inFlight.values()) {
            if (entry.taskKey === taskKey)
                return true;
        }
        return false;
    }
    bindingOf(phaseRunKey) {
        return this.requireBindings().get(phaseRunKey);
    }
    async putBinding(binding) {
        await this.requireBindings().put(binding.phaseRunId, binding);
    }
    disposeSession(phaseRunKey) {
        const handle = this.sessions.get(phaseRunKey);
        if (handle === undefined)
            return;
        this.sessions.delete(phaseRunKey);
        void handle.dispose();
    }
    disposeTaskSessions(task) {
        for (const [, binding] of this.requireBindings().entries()) {
            if (binding.taskId === task.taskId)
                this.disposeSession(String(binding.phaseRunId));
        }
    }
    requireExecutor() {
        if (this.executor === undefined) {
            throw new RecipeEngineError('no-executor', 'no phase executor registered (call ctx.recipeEngine.registerExecutor)');
        }
        return this.executor;
    }
    mutation(taskId, expectedRevision, action) {
        return {
            actor: 'recipe-engine',
            reason: action,
            expectedRevision,
            idempotencyKey: `engine:${String(taskId)}:${action}`,
        };
    }
}
export default RecipeEngineCore;
//# sourceMappingURL=index.js.map