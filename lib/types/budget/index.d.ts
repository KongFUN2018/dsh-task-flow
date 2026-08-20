/**
 * Task budget service (`ctx.budget`): one explicit durable ledger per task
 * over the three budget dimensions (tokens, duration, reruns). Recording
 * usage evaluates thresholds per dimension — 80% raises a batch-confirmable
 * warning item once per budget revision, crossing the limit parks the task
 * in `awaiting-decision` behind a blocking decision item. Limits are never
 * defaulted: provisioning requires explicit values, and appending budget is
 * itself the over-limit decision's landing path.
 * @module @deepseek-ai/dsh-budget
 */
import { Context, Service } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { BudgetLimits, BudgetRecord, BudgetUsage } from './types.ts';
export type * from './types.ts';
export { BudgetRecordId } from './runtime.ts';
export { budgetDomainSpec, budgetRecordSchema } from './spec.ts';
export { BudgetError } from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        budget: BudgetService;
    }
}
/**
 * Budget service: the M5 explicit task ledger with threshold decisions.
 */
export declare class BudgetService extends TypertRemoteService {
    /** The service owns its domain, appends facts, and parks/resumes the task. */
    static inject: string[];
    private records?;
    /** Serializes read-validate-write mutations so concurrent writers never interleave. */
    private mutationTail;
    /**
     * @param ctx - Host context carrying storage, journal, task, and attention services.
     */
    constructor(ctx: Context);
    /** Open and own the budget domain. */
    protected [Service.init](): Promise<void>;
    /**
     * Provision one task's ledger. One record per task; explicit limits only —
     * an absent dimension is unlimited, not defaulted.
     * @param taskId - the task the ledger tracks.
     * @param limits - explicit limits; at least one dimension.
     * @param actor - provisioning actor.
     * @param idempotencyKey - caller-owned replay key.
     * @returns the stored ledger record.
     */
    provisionBudget(taskId: string, limits: BudgetLimits, actor: string, idempotencyKey: string): Promise<BudgetRecord>;
    /**
     * Append budget: raise explicit limits and re-arm the warning latch.
     * @param taskId - the task whose ledger grows.
     * @param deltas - the limit increases per dimension; at least one positive.
     * @param expectedRevision - the ledger revision the caller read.
     * @param actor - appending actor.
     * @param idempotencyKey - caller-owned replay key.
     * @returns the post-append ledger record.
     */
    appendBudget(taskId: string, deltas: BudgetLimits, expectedRevision: number, actor: string, idempotencyKey: string): Promise<BudgetRecord>;
    /**
     * Record one explicit usage intake and evaluate thresholds per dimension.
     * @param taskId - the task whose ledger accumulates.
     * @param usage - the spend delta; absent dimensions spend nothing.
     * @param actor - recording actor.
     * @param idempotencyKey - caller-owned replay key.
     * @returns the post-intake ledger record.
     */
    recordUsage(taskId: string, usage: BudgetUsage, actor: string, idempotencyKey: string): Promise<BudgetRecord>;
    /**
     * Read one task's ledger.
     * @param taskId - the task the ledger tracks.
     * @returns the ledger record, or undefined when never provisioned.
     */
    getBudget(taskId: string): BudgetRecord | undefined;
    /**
     * Land one resolved budget-exceeded decision on the task plane: the
     * append-budget outcome grows the ledger and resumes the task; pause and
     * cancel route to the task commands. The item must already be resolved —
     * no silent landing of an open decision.
     * @param itemId - the resolved budget-exceeded item.
     * @param deltas - the limit increases (append-budget only; at least one).
     * @param taskRevision - the task revision the caller read.
     * @param actor - landing actor.
     * @param idempotencyKey - caller-owned replay key.
     */
    applyBudgetDecision(itemId: string, deltas: BudgetLimits, taskRevision: number, actor: string, idempotencyKey: string): Promise<void>;
    private provisionNow;
    private appendNow;
    private recordNow;
    private requireBudgetOf;
    /** Append one budget fact; the journal's durable write is the commit point. */
    private appendFact;
    private normalizeLimits;
    private normalizeUsage;
    private requireTaskId;
    /** Validate one non-empty wire field, returning the trimmed value. */
    private requireText;
    /** Validate one compare-and-set revision. */
    private requireRevision;
    private requireRecords;
}
export default BudgetService;
//# sourceMappingURL=index.d.ts.map