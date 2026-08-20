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
import { Context, Service } from '@deepseek-ai/cordis';
import { z } from 'zod';
import { TaskHandle } from '../task/index.ts';
import '@deepseek-ai/dsh-session';
import '../workbench/journal/index.ts';
import '../deliverable/index.ts';
import type { GateCheckResult, PhaseRunId, PhaseRunRecord, PhaseSubmission, SubmissionEnvironmentFacts, SubmissionId, TaskId, TaskRecord, TaskRunId, TaskRunRecord, TaskSeedContent, TaskSeedPoint, WriteProvenance } from '../task/types.ts';
export type * from './types.ts';
export { taskFactKey, taskLocalDomainSpec, gateResultsSchema, phaseRunRecordSchema, phaseSubmissionSchema, taskRecordSchema, taskRunRecordSchema, } from './spec.ts';
/** Task-local provider configuration. */
interface Config {
    /** How many recent source user-messages become seed points at most. */
    readonly seedMaxPoints: number;
    /** Per-point character ceiling applied before journaling the seed. */
    readonly seedMaxPointLength: number;
}
/** Durable TaskHandle provider over one storageDomain unit. */
export declare class LocalTaskService extends TaskHandle {
    /** The provider opens its domain, the journal, the deliverable service, and the live session store. */
    static inject: string[];
    /** Session-inheritance tunables (entry B seed); deployment-variable via Config. */
    static Config: z.ZodType<Config>;
    private readonly seedMaxPoints;
    private readonly seedMaxPointLength;
    private tasks?;
    private runs?;
    private phaseRuns?;
    private submissions?;
    private gateResults?;
    /**
     * @param ctx - Host context carrying the storage-domain facility, the
     * workbench journal, the deliverable service, and the live session store.
     * @param config - Optional session-inheritance tunables.
     */
    constructor(ctx: Context, config?: Config);
    /** Open and own the task-local domain tables. */
    protected [Service.init](): Promise<void>;
    protected loadTask(taskId: TaskId): Promise<TaskRecord | undefined>;
    protected loadTaskByIdempotencyKey(key: string): Promise<TaskRecord | undefined>;
    protected loadAllTasks(): Promise<TaskRecord[]>;
    protected saveTask(task: TaskRecord, provenance: WriteProvenance): Promise<boolean>;
    protected loadRun(runId: TaskRunId): Promise<TaskRunRecord | undefined>;
    protected saveRun(run: TaskRunRecord, provenance: WriteProvenance): Promise<boolean>;
    protected loadPhaseRun(phaseRunId: PhaseRunId): Promise<PhaseRunRecord | undefined>;
    protected loadPhaseRunsOfRun(runId: TaskRunId): Promise<PhaseRunRecord[]>;
    protected savePhaseRun(phaseRun: PhaseRunRecord, provenance: WriteProvenance): Promise<boolean>;
    protected loadSubmission(submissionId: SubmissionId): Promise<PhaseSubmission | undefined>;
    protected loadSubmissionByIdempotencyKey(key: string): Promise<PhaseSubmission | undefined>;
    protected saveSubmission(submission: PhaseSubmission, provenance: WriteProvenance): Promise<void>;
    protected loadGateResults(submissionId: SubmissionId): Promise<GateCheckResult[]>;
    protected staleGateChecks(submissionId: SubmissionId, checkIds: readonly string[], provenance: WriteProvenance): Promise<GateCheckResult[]>;
    protected saveGateResult(result: GateCheckResult, provenance: WriteProvenance): Promise<void>;
    protected resolveSubmissionEnvironment(submission: PhaseSubmission, environment: SubmissionEnvironmentFacts): Promise<SubmissionEnvironmentFacts>;
    /** At acceptance the write chain owns both durable registrations: the run's input versions and the output versions' dependency edges. */
    protected onSubmissionAccepted(submission: PhaseSubmission): Promise<void>;
    /**
     * Derive the session-inherited seed points from a live source conversation:
     * the content of the most recent user messages (newest-last), each truncated
     * at the point ceiling. Declined inheritance or an unknown source yields none.
     */
    protected resolveSeedPoints(sourceSessionId: string, inheritSession: boolean): Promise<TaskSeedPoint[]>;
    /**
     * Persist the confirmed-creation seed as one idempotent journal fact; a
     * re-confirmed replay returns the originally stored points without a write.
     */
    protected persistConfirmSeed(task: TaskRecord, content: TaskSeedContent, idempotencyKey: string, actor: string): Promise<TaskSeedPoint[]>;
    /**
     * Append one journal fact; the durable append is the commit point of
     * the write, so the projection put that follows can rebuild from replay.
     * @param input - the fact fields; the journal assigns the envelope.
     */
    private appendFact;
    /** The opened table; absent before service start or after disposal. */
    private require;
}
export default LocalTaskService;
//# sourceMappingURL=index.d.ts.map