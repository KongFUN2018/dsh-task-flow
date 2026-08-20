/**
 * Complex-gate service (`ctx.gate`): recognizes B/C gate checks and advances
 * the covered phase run to `awaiting-decision`, so the M4 attention service
 * can collect a decision. The engine still runs A checks and records their
 * verdicts (now with `uncoveredScope` + `evidenceRefs`); B/C checks carry no
 * machine verdict, so this service never writes a passed/failed result.
 * @module @deepseek-ai/dsh-gate
 */
import { Service } from '@deepseek-ai/cordis';
import { AttentionItemId } from "../attention/index.js";
import "../attention/index.js";
import "../recipe/index.js";
import "../task/index.js";
/** Actor recorded on the awaiting-decision transition the gate service writes. */
const FACT_ACTOR = 'gate';
/**
 * Watches gate-running phase runs and parks any run whose recipe declares a
 * B/C check for the phase, awaiting an external decision. A-check-only runs
 * pass through untouched so the engine can settle them.
 */
export class GateService extends Service {
    /** Task, recipe, and attention services: read the pinned checks, create the decision items, and write the transition. */
    static inject = ['tasks', 'recipes', 'attention'];
    /**
     * @param ctx - Host context carrying the task and recipe services.
     */
    constructor(ctx) {
        super(ctx, 'gate');
    }
    /** Listen for gate-running phase runs and park the complex-gate ones. */
    [Service.init]() {
        this.ctx.on('phase-run/updated', (phaseRun) => {
            if (phaseRun.state !== 'gate-running')
                return;
            void this.maybeAwaitDecision(phaseRun);
        });
    }
    /**
     * Create one decision item per B/C check on a gate-running phase run, then
     * advance the run to awaiting-decision. A-check-only runs are left for the
     * engine.
     * @param phaseRun - the gate-running run the event reported.
     */
    async maybeAwaitDecision(phaseRun) {
        try {
            const task = await this.ctx.tasks.getTask(String(phaseRun.taskId));
            if (task === undefined)
                return;
            const pinned = this.ctx.recipes.getPinned({
                recipeId: task.pinnedRecipe.recipeId,
                revision: task.pinnedRecipe.revision,
            });
            const complexChecks = pinned.payload.gateChecks.filter(check => (check.phaseId === phaseRun.phaseId && check.kind !== 'A'));
            if (complexChecks.length === 0)
                return;
            const phaseRunId = String(phaseRun.phaseRunId);
            // Issue every command synchronously instead of awaiting item creation first:
            // enqueueing the awaiting-decision transition now keeps it ahead of the
            // engine's re-verification write in the task command queue, so the run
            // leaves gate-running before the engine can spin on it (a pure-microtask
            // spin starves the JSON backend's filesystem callbacks and hangs the
            // process). Item creation still starts first, matching the design order.
            const itemPromises = complexChecks.map(check => this.ctx.attention.createItem({
                itemId: AttentionItemId(`gate:${phaseRunId}:${check.checkId}`),
                taskId: phaseRun.taskId,
                runId: phaseRun.runId,
                phaseRunId: phaseRun.phaseRunId,
                ...(phaseRun.activeSubmissionId === undefined ? {} : { submissionId: phaseRun.activeSubmissionId }),
                kind: check.kind === 'B' ? 'b-confirm' : 'c-decision',
                decisionKind: 'gate',
                checkId: check.checkId,
                options: check.humanAction,
            }, FACT_ACTOR, `gate/create-item:${phaseRunId}:${check.checkId}`));
            // The trusted tier defers a B-only phase: items still open as
            // countersignature vouchers, but the run settles by its A checks.
            const reviewPolicy = this.ctx.get('reviewPolicy');
            const defers = complexChecks.every(check => check.kind === 'B')
                && reviewPolicy?.defersBatchConfirm(String(phaseRun.taskId)) === true;
            const markPromise = defers ? undefined : this.ctx.tasks.markPhaseAwaitingDecision(phaseRunId, {
                actor: FACT_ACTOR,
                reason: 'complex gate check awaits a decision',
                expectedRevision: phaseRun.revision,
                idempotencyKey: `gate/await-decision:${phaseRunId}`,
            });
            await Promise.all(markPromise === undefined ? itemPromises : [...itemPromises, markPromise]);
        }
        catch {
            // A concurrent transition or an unregistered recipe means another path
            // already owns this decision; the resume round re-enters this listener.
        }
    }
}
export default GateService;
//# sourceMappingURL=index.js.map