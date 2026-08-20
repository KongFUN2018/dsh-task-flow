import { createSnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
/** Phase states that settle a run row; everything before them counts as current. */
const PHASE_SETTLED = new Set(['passed', 'failed', 'stale', 'superseded', 'cancelled']);
/** Phase states that park a run on a Gate, signalling a waiting decision. */
const GATE_PAUSED = new Set(['gate-running', 'awaiting-decision', 'awaiting-input', 'submitting', 'submitted']);
/** Class order for choosing the highest-priority pending check. */
const GATE_ORDER = { A: 0, B: 1, C: 2 };
/**
 * Derive one run's phase progress: the first unsettled phase is current.
 * @param phaseRuns - the run's phase runs, in recording order.
 * @returns the 1-based current index and the total.
 */
function phaseProgressOf(phaseRuns) {
    const total = phaseRuns.length;
    const index = phaseRuns.findIndex(run => !PHASE_SETTLED.has(run.state));
    return { current: index === -1 ? total : index + 1, total };
}
/**
 * Derive a task's gate pause class from its latest unsettled phase run: the
 * gate class of the first failing check on that phase's active submission.
 * @param runs - the run's phase runs, in recording order.
 * @param gates - the gate results of a submission, or undefined on a dropped read.
 * @returns the paused gate class, or undefined when no gate is waiting.
 */
export function gatePauseOf(runs, gates) {
    const paused = runs.find(run => GATE_PAUSED.has(run.state));
    if (paused === undefined || gates === undefined)
        return undefined;
    const failing = gates
        .filter(gate => gate.passed === false || gate.stale === true)
        .map(gate => (gate.kind ?? 'A'))
        .sort((a, b) => GATE_ORDER[a] - GATE_ORDER[b]);
    return failing[0];
}
/** Monotonic seed for idempotency keys; collisions within a page are impossible. */
let idempotencySeq = 0;
/** Fresh idempotency key for one task list command. */
function nextIdempotencyKey(verb, taskId) {
    idempotencySeq += 1;
    return `task-list-${verb}-${taskId}-${Date.now().toString(36)}-${idempotencySeq}`;
}
/** Compare-and-set mutation context for one verb over the row's revision. */
function mutationOf(verb, task) {
    return {
        actor: 'task-list',
        reason: `task-list ${verb}`,
        expectedRevision: task.revision,
        idempotencyKey: nextIdempotencyKey(verb, task.taskId),
    };
}
/** Order the list rows: newest creation first, taskId as the stable tiebreak. */
function byCreation(left, right) {
    return right.createdAt - left.createdAt || (left.taskId < right.taskId ? -1 : 1);
}
/** Task states whose row offers Resume; Paused is the only resumable one. */
function resumable(state) {
    return state === 'paused';
}
/** Task states whose row offers Pause; only an actively running task pauses. */
function pausable(state) {
    return state === 'running';
}
/** Task states whose row offers Cancel; terminal rows act on nothing. */
function cancellable(state) {
    return state === 'planning' || state === 'running' || state === 'pausing' || state === 'paused';
}
/**
 * Verbs each task state offers the list row.
 * @param task - the task projection whose state gates the verb set.
 * @returns the verbs the row may dispatch, in display order.
 */
export function verbsFor(task) {
    const verbs = [];
    if (pausable(task.state))
        verbs.push('pause');
    if (resumable(task.state))
        verbs.push('resume');
    if (cancellable(task.state))
        verbs.push('cancel');
    return verbs;
}
/**
 * The task list's state owner. Created once per plugin fiber in `apply`; the
 * snapshot store it exposes is the inject `hooks` source, so components
 * subscribe through the renderer-bound hook and never see this object.
 */
export class TaskListController {
    /**
     * @param ctx - owning client root context; subscriptions and refreshes ride
     * this fiber's lifetime.
     */
    constructor(ctx) {
        this.ctx = ctx;
        this.store = createSnapshotStore({ status: 'loading', tasks: [], phaseProgress: new Map(), taskGates: new Map(), recentActivity: new Map(), updatedAt: 0 });
        ctx.effect(() => ctx.remote.$on('task/updated', (task) => { this.fold(task); }), 'task-list: task/updated fold');
        // A reconnect may have missed forwarded deliveries; the projection is
        // authoritative, so resync from the Remote instead of trusting the fold.
        ctx.on('connection/reset', () => { void this.refresh(); });
        void this.refresh();
    }
    /**
     * Fold one forwarded task projection: newer revisions replace the row,
     * unknown tasks join the list, and stale or repeated deliveries drop.
     * @param task - the post-commit task projection the host forwarded.
     */
    fold(task) {
        const { tasks } = this.store.getSnapshot();
        const index = tasks.findIndex(row => row.taskId === task.taskId);
        const existing = index >= 0 ? tasks[index] : undefined;
        if (existing !== undefined && existing.revision >= task.revision)
            return;
        const next = index >= 0 ? tasks.with(index, task) : [...tasks, task];
        next.sort(byCreation);
        this.store.set({ ...this.store.getSnapshot(), tasks: next, updatedAt: Date.now() });
        void this.refreshProgress(task);
    }
    /**
     * Re-read one task's phase progress after a fold; a dropped read keeps the
     * last known progress (the next full refresh recomputes it).
     * @param task - the folded task projection.
     */
    async refreshProgress(task) {
        if (task.currentRunId === undefined)
            return;
        const runs = await this.ctx.remote.tasks.listPhaseRuns(String(task.currentRunId));
        if (!runs.ok)
            return;
        const snapshot = this.store.getSnapshot();
        if (!snapshot.tasks.some(row => row.taskId === task.taskId))
            return;
        const phaseProgress = new Map(snapshot.phaseProgress);
        const taskGates = new Map(snapshot.taskGates);
        phaseProgress.set(task.taskId, phaseProgressOf(runs.value));
        const paused = runs.value.find(run => GATE_PAUSED.has(run.state));
        let gate = undefined;
        if (paused !== undefined && paused.activeSubmissionId !== undefined) {
            const gates = await this.ctx.remote.tasks.listGateResults(String(paused.activeSubmissionId));
            gate = gates.ok ? gatePauseOf(runs.value, gates.value) : undefined;
        }
        taskGates.set(task.taskId, gate);
        const recentActivity = new Map(snapshot.recentActivity);
        recentActivity.set(task.taskId, await this.recentActivityOf(task, runs.value));
        this.store.set({ ...snapshot, phaseProgress, taskGates, recentActivity });
    }
    /**
     * Latest recorded activity of a task: the newest active submission's
     * submittedAt across its current run's phase runs, falling back to the
     * task's createdAt when nothing was submitted yet. A dropped submission
     * read keeps the creation time — the row still shows a stable 最近活跃.
     * @param task - the task projection whose activity to derive.
     * @param runs - the current run's phase runs, in recording order.
     * @returns the activity epoch ms.
     */
    async recentActivityOf(task, runs) {
        let latest = task.createdAt;
        for (const run of runs) {
            if (run.activeSubmissionId === undefined)
                continue;
            const submission = await this.ctx.remote.tasks.getSubmission(String(run.activeSubmissionId));
            if (submission.ok && submission.value !== undefined && submission.value.submittedAt > latest) {
                latest = submission.value.submittedAt;
            }
        }
        return latest;
    }
    /**
     * Reload the full task list from the tasks Remote.
     * @returns when the load settles; failures land in the state's error.
     */
    async refresh() {
        const result = await this.ctx.remote.tasks.listTasks();
        if (!result.ok) {
            this.store.set({ ...this.store.getSnapshot(), status: 'failed', error: result.error.code });
            return;
        }
        const tasks = [...result.value].sort(byCreation);
        // Phase progress and gate pursuit ride the same refresh; a per-task read
        // failure keeps a zero slot rather than failing the whole list.
        const entries = await Promise.all(tasks.map(async (task) => {
            if (task.currentRunId === undefined)
                return [task.taskId, { current: 0, total: 0 }, undefined, task.createdAt];
            const runs = await this.ctx.remote.tasks.listPhaseRuns(String(task.currentRunId));
            if (!runs.ok)
                return [task.taskId, { current: 0, total: 0 }, undefined, task.createdAt];
            const progress = phaseProgressOf(runs.value);
            const paused = runs.value.find(run => GATE_PAUSED.has(run.state));
            let gate = undefined;
            if (paused !== undefined && paused.activeSubmissionId !== undefined) {
                const gates = await this.ctx.remote.tasks.listGateResults(String(paused.activeSubmissionId));
                gate = gates.ok ? gatePauseOf(runs.value, gates.value) : undefined;
            }
            const activity = await this.recentActivityOf(task, runs.value);
            return [task.taskId, progress, gate, activity];
        }));
        const phaseProgress = new Map(entries.map(([id, progress]) => [id, progress]));
        const taskGates = new Map(entries.map(([id, , gate]) => [id, gate]));
        const recentActivity = new Map(entries.map(([id, , , activity]) => [id, activity]));
        // A resync keeps any recorded command failure: the line reads as history
        // ("failed with X, since resynced"), and only a later successful command
        // or load-failure code replaces it.
        const { error } = this.store.getSnapshot();
        this.store.set({ status: 'ready', tasks, phaseProgress, taskGates, recentActivity, error, updatedAt: Date.now() });
    }
    /**
     * Issue one verb against a task row.
     * @param taskId - the row's task id.
     * @param verb - the verb to issue.
     * @returns when the command settles; the row folds on success, and a
     * failure records the code and resyncs through {@link refresh} (the
     * compare-and-set revision is the guard, never a client-side fence).
     */
    async command(taskId, verb) {
        const task = this.store.getSnapshot().tasks.find(row => row.taskId === taskId);
        if (task === undefined)
            return;
        const mutation = mutationOf(verb, task);
        const result = verb === 'pause'
            ? await this.ctx.remote.tasks.requestPause(taskId, mutation)
            : verb === 'resume'
                ? await this.ctx.remote.tasks.resume(taskId, mutation)
                : await this.ctx.remote.tasks.requestCancel(taskId, mutation);
        if (result.ok) {
            this.fold(result.value);
            this.store.set({ ...this.store.getSnapshot(), error: undefined });
            return;
        }
        this.store.set({ ...this.store.getSnapshot(), error: result.error.code });
        await this.refresh();
    }
}
//# sourceMappingURL=taskList.js.map