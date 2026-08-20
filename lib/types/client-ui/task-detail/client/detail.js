import { createSnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
/**
 * The detail panel's state owner. Created once per plugin fiber in `apply`;
 * the snapshot store it exposes is the inject `hooks` source.
 */
export class TaskDetailController {
    /**
     * @param ctx - owning client root context; loads ride this fiber's lifetime.
     */
    constructor(ctx) {
        this.ctx = ctx;
        this.store = createSnapshotStore({ status: 'idle', phaseRuns: [], gateResults: [], digest: undefined, rootVersions: [] });
    }
    /**
     * Load one task, its phase runs, and the gate verdicts of each active
     * submission on demand. A missing task lands in the not-found error state.
     * @param taskId - the task to inspect.
     * @returns when the load settles; failures land in the state's error.
     */
    async load(taskId) {
        const id = taskId.trim();
        if (id === '')
            return;
        this.store.set({ status: 'loading', phaseRuns: [], gateResults: [], digest: undefined, rootVersions: [] });
        const task = await this.ctx.remote.tasks.getTask(id);
        if (!task.ok) {
            this.store.set({ status: 'failed', error: task.error.code, phaseRuns: [], gateResults: [], digest: undefined, rootVersions: [] });
            return;
        }
        if (task.value === undefined) {
            this.store.set({ status: 'failed', error: 'not-found', phaseRuns: [], gateResults: [], digest: undefined, rootVersions: [] });
            return;
        }
        const runId = task.value.currentRunId;
        const phases = runId === undefined
            ? { ok: true, value: [] }
            : await this.ctx.remote.tasks.listPhaseRuns(String(runId));
        if (!phases.ok) {
            this.store.set({ status: 'failed', error: phases.error.code, task: task.value, phaseRuns: [], gateResults: [], digest: undefined, rootVersions: [] });
            return;
        }
        const gateResults = [];
        for (const phase of phases.value) {
            if (phase.activeSubmissionId === undefined)
                continue;
            const gates = await this.ctx.remote.tasks.listGateResults(String(phase.activeSubmissionId));
            if (gates.ok)
                gateResults.push(...gates.value);
        }
        // The digest rides the same load as an enrichment: a failed digest read
        // keeps the projection usable without run branches and timeline.
        const digestResult = await this.ctx.remote.digest.digest(id);
        const digest = digestResult.ok ? digestResult.value : undefined;
        // Candidate rewind roots: every phase run's current input versions. A
        // buried listCurrentInputs failure keeps the projection usable and the
        // rewind action absent rather than blocking the detail view.
        const rootVersions = [];
        for (const phase of phases.value) {
            const inputs = await this.ctx.remote.deliverables.listCurrentInputs(String(phase.phaseRunId));
            if (!inputs.ok)
                continue;
            for (const version of inputs.value) {
                rootVersions.push({
                    phaseRunId: String(phase.phaseRunId),
                    phaseId: String(phase.phaseId),
                    deliverableId: String(version.deliverableId),
                    versionId: String(version.versionId),
                });
            }
        }
        this.store.set({ status: 'ready', task: task.value, phaseRuns: phases.value, gateResults, digest, rootVersions, error: undefined });
    }
}
//# sourceMappingURL=detail.js.map