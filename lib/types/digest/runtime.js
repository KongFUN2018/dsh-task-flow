/**
 * Digest derivation: a pure function from the task projection, its phase
 * runs, the journal facts, and the deliverable versions to the `TaskDigest`.
 * No I/O here — the service fetches the inputs, this module folds them.
 * @module @deepseek-ai/dsh-digest/runtime
 */
/** Rewind facts carry the branch handoff: new run retires the old one. */
const REWIND_APPLIED = 'rewind/applied';
const TASK_RUN_UPDATED = 'task-run/updated';
const PHASE_RUN_UPDATED = 'phase-run/updated';
const SUBMISSION_RECORDED = 'submission/recorded';
const ATTENTION_RESOLVED = 'attention/item-resolved';
/** Run branches: rewind handoffs plus the current run, newest-first. */
function buildRuns(task, facts) {
    const byRunId = new Map();
    const index = (runId, parentRunId, createdAt, supersededAt) => {
        const existing = byRunId.get(runId);
        if (existing !== undefined) {
            if (supersededAt !== undefined)
                byRunId.set(runId, { ...existing, supersededAt });
            return;
        }
        const branch = { runId, createdAt };
        if (parentRunId !== undefined)
            branch.parentRunId = parentRunId;
        if (supersededAt !== undefined)
            branch.supersededAt = supersededAt;
        byRunId.set(runId, branch);
    };
    for (const fact of facts) {
        if (fact.kind === TASK_RUN_UPDATED) {
            const payload = fact.payload;
            if (typeof payload.runId === 'string')
                index(payload.runId, payload.parentRunId, fact.occurredAt);
        }
        else if (fact.kind === REWIND_APPLIED) {
            const payload = fact.payload;
            if (typeof payload.newRunId === 'string')
                index(payload.newRunId, payload.retiredRunId, fact.occurredAt, fact.occurredAt);
            if (typeof payload.retiredRunId === 'string') {
                index(payload.retiredRunId, undefined, fact.occurredAt, fact.occurredAt);
            }
        }
    }
    if (task.currentRunId !== undefined && !byRunId.has(String(task.currentRunId))) {
        index(String(task.currentRunId), undefined, task.createdAt);
    }
    return [...byRunId.values()].sort((a, b) => b.createdAt - a.createdAt);
}
/** Timeline: every journal fact of the task in journal order. */
function buildTimeline(facts) {
    return facts.map(fact => ({
        seq: fact.journalSeq,
        kind: fact.kind,
        occurredAt: fact.occurredAt,
        actor: fact.actor,
        summary: fact.kind,
    }));
}
/** Phase summaries of the current run; attempt counts from submissions. */
function buildPhases(phaseRuns, facts) {
    const attempts = new Map();
    for (const fact of facts) {
        if (fact.kind !== SUBMISSION_RECORDED)
            continue;
        const payload = fact.payload;
        if (typeof payload.phaseRunId !== 'string')
            continue;
        attempts.set(payload.phaseRunId, (attempts.get(payload.phaseRunId) ?? 0) + 1);
    }
    const settledAt = new Map();
    for (const fact of facts) {
        if (fact.kind !== PHASE_RUN_UPDATED)
            continue;
        const payload = fact.payload;
        if (typeof payload.phaseRunId !== 'string')
            continue;
        if (payload.state === 'passed')
            settledAt.set(payload.phaseRunId, { passedAt: fact.occurredAt });
        if (payload.state === 'failed')
            settledAt.set(payload.phaseRunId, { failedAt: fact.occurredAt });
    }
    return phaseRuns.map((phase) => {
        const phaseRunId = phase.phaseRunId;
        const settled = settledAt.get(phaseRunId);
        const summary = {
            phaseId: phase.phaseId,
            state: phase.state,
            attemptCount: attempts.get(phaseRunId) ?? 0,
        };
        if (settled?.passedAt !== undefined)
            summary.passedAt = settled.passedAt;
        if (settled?.failedAt !== undefined)
            summary.failedAt = settled.failedAt;
        return summary;
    });
}
/** Decision history: resolved attention items, newest first. */
function buildDecisions(facts) {
    const decisions = [];
    for (const fact of facts) {
        if (fact.kind !== ATTENTION_RESOLVED)
            continue;
        const payload = fact.payload;
        decisions.push({
            decisionKind: payload.decisionKind ?? 'gate',
            ...(typeof payload.outcome === 'string' ? { outcome: payload.outcome } : {}),
            ...(fact.occurredAt > 0 ? { resolvedAt: fact.occurredAt } : {}),
        });
    }
    return decisions.reverse();
}
/** Deliverable families: current valid version plus total version count. */
function buildDeliverables(versions) {
    const byDeliverable = new Map();
    for (const version of versions) {
        const id = String(version.deliverableId);
        const prev = byDeliverable.get(id);
        const next = {
            deliverableId: id,
            state: prev?.state ?? 'none',
            versionCount: (prev?.versionCount ?? 0) + 1,
        };
        if (prev?.currentVersionId !== undefined)
            next.currentVersionId = prev.currentVersionId;
        if (version.state === 'current') {
            next.currentVersionId = String(version.versionId);
            next.state = version.state;
        }
        byDeliverable.set(id, next);
    }
    return [...byDeliverable.values()];
}
/**
 * Fold the digest inputs into the projection.
 * @param task - the task projection.
 * @param phaseRuns - phase runs of the task's current run.
 * @param facts - journal facts of the task, in journal order.
 * @param versions - every deliverable version.
 * @returns the full task digest.
 */
export function buildDigest(task, phaseRuns, facts, versions) {
    return {
        taskId: task.taskId,
        state: task.state,
        revision: task.revision,
        runs: buildRuns(task, facts),
        timeline: buildTimeline(facts),
        phaseSummaries: buildPhases(phaseRuns, facts),
        decisionHistory: buildDecisions(facts),
        deliverableStates: buildDeliverables(versions),
    };
}
//# sourceMappingURL=runtime.js.map