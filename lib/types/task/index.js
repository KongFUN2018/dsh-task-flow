/**
 * Task-flow task service definition (`ctx.tasks`): pinned-recipe task
 * creation, the guarded state transitions this package owns, and the
 * PhaseSubmission acceptance chain. Providers persist through the abstract
 * storage hooks; every mutating command sequences one load, one pure
 * transition, one compare-and-set save, and one contained event fan-out.
 * @module @deepseek-ai/dsh-task
 */
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { randomUUID } from 'node:crypto';
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { RecipeError } from "../recipe/types.js";
import { PhaseRunId as PhaseRunIdValue, SubmissionId as SubmissionIdValue, TaskId as TaskIdValue, TaskRunId as TaskRunIdValue } from "./runtime.js";
import { acceptSubmission, } from "./submission.js";
import { canCompleteTask, phaseTransition, taskTransition, } from "./state.js";
import { TaskError } from "./types.js";
/** The journal fact kind carrying a task's confirmed-creation seed (see `TaskSeedContent`). */
export const TASK_SEED_FACT_KIND = 'task/seed-created';
export { TaskId, TaskRunId, PhaseRunId, SubmissionId, DeliverableId, DeliverableVersionId } from "./runtime.js";
export { TaskError } from "./types.js";
export { acceptSubmission, } from "./submission.js";
export { canCompleteTask, phaseTransition, taskTransition, } from "./state.js";
/** Extract the durable-write provenance of one mutating command. */
function provenanceOf(mutation) {
    return { actor: mutation.actor, idempotencyKey: mutation.idempotencyKey };
}
/** Task service: durable task/run/phase projections and guarded commands. */
let TaskHandle = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _createTask_decorators;
    let _confirmCreateTask_decorators;
    let _startTask_decorators;
    let _requestPause_decorators;
    let _settlePause_decorators;
    let _resume_decorators;
    let _requestCancel_decorators;
    let _settleCancel_decorators;
    let _failTask_decorators;
    let _completeTask_decorators;
    let _markTaskAwaitingDecision_decorators;
    let _resumeTaskFromDecision_decorators;
    let _createTaskRun_decorators;
    let _createPhaseRun_decorators;
    let _startPhaseRun_decorators;
    let _recordSubmission_decorators;
    let _requestPatch_decorators;
    let _startGate_decorators;
    let _recordGateCheck_decorators;
    let _markPhasePassed_decorators;
    let _markPhaseFailed_decorators;
    let _cancelPhaseRun_decorators;
    let _markPhaseStale_decorators;
    let _markPhaseSuperseded_decorators;
    let _markPhaseAwaitingInput_decorators;
    let _markPhaseAwaitingDecision_decorators;
    let _resumePhaseFromAwaiting_decorators;
    let _recordPhaseSession_decorators;
    let _freezePhaseScheduling_decorators;
    let _clearPhaseScheduling_decorators;
    let _markGateChecksStale_decorators;
    let _getTask_decorators;
    let _listTasks_decorators;
    let _getPhaseRun_decorators;
    let _listPhaseRuns_decorators;
    let _getSubmission_decorators;
    let _listGateResults_decorators;
    return class TaskHandle extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _createTask_decorators = [Remote('createTask')];
            _confirmCreateTask_decorators = [Remote('confirmCreateTask')];
            _startTask_decorators = [Remote('startTask')];
            _requestPause_decorators = [Remote('requestPause')];
            _settlePause_decorators = [Remote('settlePause')];
            _resume_decorators = [Remote('resume')];
            _requestCancel_decorators = [Remote('requestCancel')];
            _settleCancel_decorators = [Remote('settleCancel')];
            _failTask_decorators = [Remote('failTask')];
            _completeTask_decorators = [Remote('completeTask')];
            _markTaskAwaitingDecision_decorators = [Remote('markTaskAwaitingDecision')];
            _resumeTaskFromDecision_decorators = [Remote('resumeTaskFromDecision')];
            _createTaskRun_decorators = [Remote('createTaskRun')];
            _createPhaseRun_decorators = [Remote('createPhaseRun')];
            _startPhaseRun_decorators = [Remote('startPhaseRun')];
            _recordSubmission_decorators = [Remote('recordSubmission')];
            _requestPatch_decorators = [Remote('requestPatch')];
            _startGate_decorators = [Remote('startGate')];
            _recordGateCheck_decorators = [Remote('recordGateCheck')];
            _markPhasePassed_decorators = [Remote('markPhasePassed')];
            _markPhaseFailed_decorators = [Remote('markPhaseFailed')];
            _cancelPhaseRun_decorators = [Remote('cancelPhaseRun')];
            _markPhaseStale_decorators = [Remote('markPhaseStale')];
            _markPhaseSuperseded_decorators = [Remote('markPhaseSuperseded')];
            _markPhaseAwaitingInput_decorators = [Remote('markPhaseAwaitingInput')];
            _markPhaseAwaitingDecision_decorators = [Remote('markPhaseAwaitingDecision')];
            _resumePhaseFromAwaiting_decorators = [Remote('resumePhaseFromAwaiting')];
            _recordPhaseSession_decorators = [Remote('recordPhaseSession')];
            _freezePhaseScheduling_decorators = [Remote('freezePhaseScheduling')];
            _clearPhaseScheduling_decorators = [Remote('clearPhaseScheduling')];
            _markGateChecksStale_decorators = [Remote('markGateChecksStale')];
            _getTask_decorators = [Remote('getTask')];
            _listTasks_decorators = [Remote('listTasks')];
            _getPhaseRun_decorators = [Remote('getPhaseRun')];
            _listPhaseRuns_decorators = [Remote('listPhaseRuns')];
            _getSubmission_decorators = [Remote('getSubmission')];
            _listGateResults_decorators = [Remote('listGateResults')];
            __esDecorate(this, null, _createTask_decorators, { kind: "method", name: "createTask", static: false, private: false, access: { has: obj => "createTask" in obj, get: obj => obj.createTask }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _confirmCreateTask_decorators, { kind: "method", name: "confirmCreateTask", static: false, private: false, access: { has: obj => "confirmCreateTask" in obj, get: obj => obj.confirmCreateTask }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _startTask_decorators, { kind: "method", name: "startTask", static: false, private: false, access: { has: obj => "startTask" in obj, get: obj => obj.startTask }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _requestPause_decorators, { kind: "method", name: "requestPause", static: false, private: false, access: { has: obj => "requestPause" in obj, get: obj => obj.requestPause }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _settlePause_decorators, { kind: "method", name: "settlePause", static: false, private: false, access: { has: obj => "settlePause" in obj, get: obj => obj.settlePause }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _resume_decorators, { kind: "method", name: "resume", static: false, private: false, access: { has: obj => "resume" in obj, get: obj => obj.resume }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _requestCancel_decorators, { kind: "method", name: "requestCancel", static: false, private: false, access: { has: obj => "requestCancel" in obj, get: obj => obj.requestCancel }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _settleCancel_decorators, { kind: "method", name: "settleCancel", static: false, private: false, access: { has: obj => "settleCancel" in obj, get: obj => obj.settleCancel }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _failTask_decorators, { kind: "method", name: "failTask", static: false, private: false, access: { has: obj => "failTask" in obj, get: obj => obj.failTask }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _completeTask_decorators, { kind: "method", name: "completeTask", static: false, private: false, access: { has: obj => "completeTask" in obj, get: obj => obj.completeTask }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _markTaskAwaitingDecision_decorators, { kind: "method", name: "markTaskAwaitingDecision", static: false, private: false, access: { has: obj => "markTaskAwaitingDecision" in obj, get: obj => obj.markTaskAwaitingDecision }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _resumeTaskFromDecision_decorators, { kind: "method", name: "resumeTaskFromDecision", static: false, private: false, access: { has: obj => "resumeTaskFromDecision" in obj, get: obj => obj.resumeTaskFromDecision }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _createTaskRun_decorators, { kind: "method", name: "createTaskRun", static: false, private: false, access: { has: obj => "createTaskRun" in obj, get: obj => obj.createTaskRun }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _createPhaseRun_decorators, { kind: "method", name: "createPhaseRun", static: false, private: false, access: { has: obj => "createPhaseRun" in obj, get: obj => obj.createPhaseRun }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _startPhaseRun_decorators, { kind: "method", name: "startPhaseRun", static: false, private: false, access: { has: obj => "startPhaseRun" in obj, get: obj => obj.startPhaseRun }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _recordSubmission_decorators, { kind: "method", name: "recordSubmission", static: false, private: false, access: { has: obj => "recordSubmission" in obj, get: obj => obj.recordSubmission }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _requestPatch_decorators, { kind: "method", name: "requestPatch", static: false, private: false, access: { has: obj => "requestPatch" in obj, get: obj => obj.requestPatch }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _startGate_decorators, { kind: "method", name: "startGate", static: false, private: false, access: { has: obj => "startGate" in obj, get: obj => obj.startGate }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _recordGateCheck_decorators, { kind: "method", name: "recordGateCheck", static: false, private: false, access: { has: obj => "recordGateCheck" in obj, get: obj => obj.recordGateCheck }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _markPhasePassed_decorators, { kind: "method", name: "markPhasePassed", static: false, private: false, access: { has: obj => "markPhasePassed" in obj, get: obj => obj.markPhasePassed }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _markPhaseFailed_decorators, { kind: "method", name: "markPhaseFailed", static: false, private: false, access: { has: obj => "markPhaseFailed" in obj, get: obj => obj.markPhaseFailed }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _cancelPhaseRun_decorators, { kind: "method", name: "cancelPhaseRun", static: false, private: false, access: { has: obj => "cancelPhaseRun" in obj, get: obj => obj.cancelPhaseRun }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _markPhaseStale_decorators, { kind: "method", name: "markPhaseStale", static: false, private: false, access: { has: obj => "markPhaseStale" in obj, get: obj => obj.markPhaseStale }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _markPhaseSuperseded_decorators, { kind: "method", name: "markPhaseSuperseded", static: false, private: false, access: { has: obj => "markPhaseSuperseded" in obj, get: obj => obj.markPhaseSuperseded }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _markPhaseAwaitingInput_decorators, { kind: "method", name: "markPhaseAwaitingInput", static: false, private: false, access: { has: obj => "markPhaseAwaitingInput" in obj, get: obj => obj.markPhaseAwaitingInput }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _markPhaseAwaitingDecision_decorators, { kind: "method", name: "markPhaseAwaitingDecision", static: false, private: false, access: { has: obj => "markPhaseAwaitingDecision" in obj, get: obj => obj.markPhaseAwaitingDecision }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _resumePhaseFromAwaiting_decorators, { kind: "method", name: "resumePhaseFromAwaiting", static: false, private: false, access: { has: obj => "resumePhaseFromAwaiting" in obj, get: obj => obj.resumePhaseFromAwaiting }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _recordPhaseSession_decorators, { kind: "method", name: "recordPhaseSession", static: false, private: false, access: { has: obj => "recordPhaseSession" in obj, get: obj => obj.recordPhaseSession }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _freezePhaseScheduling_decorators, { kind: "method", name: "freezePhaseScheduling", static: false, private: false, access: { has: obj => "freezePhaseScheduling" in obj, get: obj => obj.freezePhaseScheduling }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _clearPhaseScheduling_decorators, { kind: "method", name: "clearPhaseScheduling", static: false, private: false, access: { has: obj => "clearPhaseScheduling" in obj, get: obj => obj.clearPhaseScheduling }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _markGateChecksStale_decorators, { kind: "method", name: "markGateChecksStale", static: false, private: false, access: { has: obj => "markGateChecksStale" in obj, get: obj => obj.markGateChecksStale }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getTask_decorators, { kind: "method", name: "getTask", static: false, private: false, access: { has: obj => "getTask" in obj, get: obj => obj.getTask }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listTasks_decorators, { kind: "method", name: "listTasks", static: false, private: false, access: { has: obj => "listTasks" in obj, get: obj => obj.listTasks }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getPhaseRun_decorators, { kind: "method", name: "getPhaseRun", static: false, private: false, access: { has: obj => "getPhaseRun" in obj, get: obj => obj.getPhaseRun }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listPhaseRuns_decorators, { kind: "method", name: "listPhaseRuns", static: false, private: false, access: { has: obj => "listPhaseRuns" in obj, get: obj => obj.listPhaseRuns }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getSubmission_decorators, { kind: "method", name: "getSubmission", static: false, private: false, access: { has: obj => "getSubmission" in obj, get: obj => obj.getSubmission }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listGateResults_decorators, { kind: "method", name: "listGateResults", static: false, private: false, access: { has: obj => "listGateResults" in obj, get: obj => obj.listGateResults }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        constructor(ctx) {
            super(ctx, 'tasks');
            /** Tail of the serial task write chain; mutating commands never interleave. */
            this.writeTail = (__runInitializers(this, _instanceExtraInitializers), Promise.resolve());
            /** Registered completion guards (M5); consulted inside the write chain. */
            this.completionGuards = [];
        }
        /**
         * Derive the acceptance facts a provider owns before the verdict. The
         * default trusts the caller; providers with an injected fact source
         * (task-local derives deliverable currency) override this.
         * @param submission - the submission under acceptance.
         * @param environment - caller-supplied facts.
         * @returns the facts the acceptance verdict reads.
         */
        resolveSubmissionEnvironment(_submission, environment) {
            return Promise.resolve(environment);
        }
        /**
         * Provider-side acceptance effects after the verdict admits a new
         * submission (phase-input registration); the default does nothing.
         * @param submission - the admitted submission, not an idempotent replay.
         */
        async onSubmissionAccepted(_submission) { }
        /**
         * Register one completion guard: `completeTask` runs every registered guard
         * on the serial write chain after the state check passes; a throwing guard
         * rejects the command before any durable write. Contributors own their
         * disposal �?the returned handle removes the guard.
         * @param guard - async veto over one task about to complete.
         * @returns the disposer that unregisters the guard.
         */
        registerCompletionGuard(guard) {
            this.completionGuards.push(guard);
            return () => {
                const at = this.completionGuards.indexOf(guard);
                if (at >= 0)
                    this.completionGuards.splice(at, 1);
            };
        }
        /**
         * Run one whole mutating command on the serial task write chain, so load,
         * transition, save, and publish of concurrent commands never interleave.
         * @param command - the complete command body.
         * @returns the command's result.
         */
        serialized(command) {
            const result = this.writeTail.then(command, command);
            this.writeTail = result.then(() => undefined, () => undefined);
            return result;
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
        async createTask(recipeId, workspaceId, actor, idempotencyKey) {
            const recipeKey = this.resolveText(recipeId, 'recipeId');
            this.resolveText(workspaceId, 'workspaceId');
            const provenance = {
                actor: this.resolveText(actor, 'actor'),
                idempotencyKey: this.resolveText(idempotencyKey, 'idempotencyKey'),
            };
            return this.serialized(() => this.createTaskNow(recipeKey, workspaceId.trim(), provenance));
        }
        /** Create one task pinned to the latest registered recipe revision; the serial write chain owns the commit. */
        async createTaskNow(recipeKey, workspaceId, provenance) {
            const existing = await this.loadTaskByIdempotencyKey(provenance.idempotencyKey);
            if (existing !== undefined) {
                if (existing.workspaceId === workspaceId && existing.pinnedRecipe.recipeId === recipeKey)
                    return existing;
                throw new TaskError('duplicate-idempotency', 'task idempotency key reused with a different payload');
            }
            const recipes = this.ctx.get('recipes');
            let latest;
            try {
                latest = recipes.latest(recipeKey);
            }
            catch (error) {
                if (error instanceof RecipeError && error.code === 'not-found') {
                    throw new TaskError('not-found', `recipe "${recipeKey}" is not registered`);
                }
                throw error;
            }
            if (latest === undefined)
                throw new TaskError('not-found', `recipe "${recipeKey}" is not registered`);
            const task = {
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
            };
            if (!await this.saveTask(task, provenance))
                throw new TaskError('stale-revision', 'task insert raced');
            this.emit('task/updated', task);
            return task;
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
        async confirmCreateTask(recipeId, goal, inheritSession, idempotencyKey, sourceSessionId, workspaceId, actor) {
            const goalText = this.resolveText(goal, 'goal');
            const sourceId = this.resolveText(sourceSessionId, 'sourceSessionId');
            const key = this.resolveText(idempotencyKey, 'idempotencyKey');
            const actorName = this.resolveText(actor, 'actor');
            const workspace = this.resolveText(workspaceId, 'workspaceId');
            if (typeof inheritSession !== 'boolean') {
                throw new TaskError('invalid-argument', 'inheritSession must be a boolean');
            }
            return this.serialized(async () => {
                const prior = await this.loadTaskByIdempotencyKey(key);
                const provenance = { actor: actorName, idempotencyKey: key };
                const task = await this.createTaskNow(this.resolveText(recipeId, 'recipeId'), workspace, provenance);
                const content = {
                    goal: goalText,
                    sourceSessionId: sourceId,
                    points: await this.resolveSeedPoints(sourceId, inheritSession),
                };
                const points = await this.persistConfirmSeed(task, content, key, actorName);
                return { task, created: prior === undefined, seedPoints: points.length };
            });
        }
        /**
         * Provider-side derivation of the session-inherited discussion points; the default
         * carries none (no live source, or inheritance declined).
         * @param sourceSessionId - the source conversation to read.
         * @param inheritSession - whether the caller opted into session inheritance.
         * @returns the content-only seed points, newest-last.
         */
        resolveSeedPoints(_sourceSessionId, _inheritSession) {
            return Promise.resolve([]);
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
        persistConfirmSeed(_task, content, _idempotencyKey, _actor) {
            return Promise.resolve([...content.points]);
        }
        /**
         * Move one task from `planning` into `running`.
         * @param taskId - the task to start.
         * @param mutation - actor, reason, expected revision, idempotency key.
         * @returns the post-commit task projection.
         */
        async startTask(taskId, mutation) {
            return this.mutateTask(TaskIdValue(taskId), mutation, 'start');
        }
        /**
         * Request a pause; the task settles once in-flight phase work quiesces.
         * @param taskId - the task to pause.
         * @param mutation - actor, reason, expected revision, idempotency key.
         * @returns the task in `pausing`.
         */
        async requestPause(taskId, mutation) {
            return this.mutateTask(TaskIdValue(taskId), mutation, 'pause');
        }
        /**
         * Settle a completed pause into `paused`.
         * @param taskId - the task in `pausing`.
         * @param mutation - actor, reason, expected revision, idempotency key.
         * @returns the task in `paused`.
         */
        async settlePause(taskId, mutation) {
            return this.mutateTask(TaskIdValue(taskId), mutation, 'settlePause');
        }
        /**
         * Resume one paused task back into `running`.
         * @param taskId - the task in `paused`.
         * @param mutation - actor, reason, expected revision, idempotency key.
         * @returns the task in `running`.
         */
        async resume(taskId, mutation) {
            return this.mutateTask(TaskIdValue(taskId), mutation, 'resume');
        }
        /**
         * Request a cancel; the task settles once in-flight phase work quiesces.
         * @param taskId - the task to cancel.
         * @param mutation - actor, reason, expected revision, idempotency key.
         * @returns the task in `cancelling`.
         */
        async requestCancel(taskId, mutation) {
            return this.mutateTask(TaskIdValue(taskId), mutation, 'cancel');
        }
        /**
         * Settle a completed cancel into `cancelled`.
         * @param taskId - the task in `cancelling`.
         * @param mutation - actor, reason, expected revision, idempotency key.
         * @returns the task in `cancelled`.
         */
        async settleCancel(taskId, mutation) {
            return this.mutateTask(TaskIdValue(taskId), mutation, 'settleCancel');
        }
        /**
         * Fail one running task.
         * @param taskId - the task to fail.
         * @param mutation - actor, reason, expected revision, idempotency key.
         * @returns the task in `failed`.
         */
        async failTask(taskId, mutation) {
            return this.mutateTask(TaskIdValue(taskId), mutation, 'fail');
        }
        /**
         * Complete a task; the completion guard requires every phase run of the
         * current run to have passed (or retired into stale/superseded), then every
         * registered M5 completion guard must approve �?unsigned B items, suspended
         * rewind decisions, and open blocking decisions veto here.
         * @param taskId - the task to complete.
         * @param mutation - actor, reason, expected revision, idempotency key.
         * @returns the post-commit task projection.
         */
        async completeTask(taskId, mutation) {
            return this.mutateTask(TaskIdValue(taskId), mutation, 'complete', async (task) => {
                const phases = task.currentRunId === undefined ? [] : await this.loadPhaseRunsOfRun(task.currentRunId);
                if (!canCompleteTask(task.state, phases.map(phase => phase.state))) {
                    throw new TaskError('invalid-transition', 'completion guard failed: every phase run of the current run must have passed');
                }
                for (const guard of [...this.completionGuards])
                    await guard(task);
                return {};
            });
        }
        /**
         * Park one running task in `awaiting-decision`: the over-budget decision
         * (M5 budget) holds scheduling without touching any phase run.
         * @param taskId - the task to park.
         * @param mutation - the task's expected revision plus actor metadata.
         * @returns the post-commit task projection.
         */
        async markTaskAwaitingDecision(taskId, mutation) {
            return this.mutateTask(TaskIdValue(taskId), mutation, 'awaitDecision');
        }
        /**
         * Return one parked task from `awaiting-decision` to `running`; the
         * resolved over-budget decision (append-budget outcome) resumes here.
         * @param taskId - the task to resume.
         * @param mutation - the task's expected revision plus actor metadata.
         * @returns the post-commit task projection.
         */
        async resumeTaskFromDecision(taskId, mutation) {
            return this.mutateTask(TaskIdValue(taskId), mutation, 'resumeFromDecision');
        }
        /**
         * Open a new run on one task and make it the current run.
         * @param taskId - the owning task.
         * @param mutation - the task's expected revision plus actor metadata.
         * @param parentRunId - the superseded branch this run replaces (rewind);
         * omitted on the initial run.
         * @returns the new run.
         */
        async createTaskRun(taskId, mutation, parentRunId) {
            const provenance = provenanceOf(mutation);
            return this.serialized(async () => {
                const task = await this.loadTaskOrThrow(TaskIdValue(taskId));
                this.assertRevision(task, mutation);
                const run = {
                    runId: TaskRunIdValue(randomUUID()),
                    taskId: task.taskId,
                    pinnedRecipe: task.pinnedRecipe,
                    revision: 1,
                    createdAt: Date.now(),
                    ...(parentRunId === undefined
                        ? {}
                        : { parentRunId: TaskRunIdValue(this.resolveText(parentRunId, 'parentRunId')) }),
                };
                const updatedTask = {
                    ...task,
                    currentRunId: run.runId,
                    revision: task.revision + 1,
                };
                if (!await this.saveRun(run, provenance))
                    throw new TaskError('stale-revision', 'run insert raced');
                if (!await this.saveTask(updatedTask, provenance))
                    throw new TaskError('stale-revision', 'task revision moved concurrently');
                this.emit('task-run/updated', run);
                this.emit('task/updated', updatedTask);
                return run;
            });
        }
        /**
         * Create one phase run inside a run.
         * @param runId - the owning run.
         * @param phaseId - the recipe phase id this run executes.
         * @param mutation - the run's expected revision plus actor metadata.
         * @returns the new phase run in `created`.
         */
        async createPhaseRun(runId, phaseId, mutation) {
            const phase = this.resolveText(phaseId, 'phaseId');
            const provenance = provenanceOf(mutation);
            return this.serialized(async () => {
                const run = await this.loadRunOrThrow(TaskRunIdValue(runId));
                this.assertRevision(run, mutation);
                const phaseRun = {
                    phaseRunId: PhaseRunIdValue(randomUUID()),
                    runId: run.runId,
                    taskId: run.taskId,
                    phaseId: phase,
                    state: 'created',
                    revision: 1,
                };
                if (!await this.savePhaseRun(phaseRun, provenance))
                    throw new TaskError('stale-revision', 'phase-run insert raced');
                this.emit('phase-run/updated', phaseRun);
                return phaseRun;
            });
        }
        /**
         * Move one phase run into `running`.
         * @param phaseRunId - the phase run to start.
         * @param mutation - the phase run's expected revision plus actor metadata.
         * @returns the post-commit phase-run projection.
         */
        async startPhaseRun(phaseRunId, mutation) {
            return this.mutatePhaseRun(PhaseRunIdValue(phaseRunId), mutation, 'start');
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
        async applySubmission(submission, environment) {
            const task = await this.loadTaskOrThrow(submission.taskId);
            const run = await this.loadRunOrThrow(submission.taskRunId);
            const phaseRun = await this.loadPhaseRunOrThrow(submission.phaseRunId);
            const recipes = this.ctx.get('recipes');
            let registeredHash;
            try {
                registeredHash = recipes.getPinned({
                    recipeId: submission.pinnedRecipe.recipeId,
                    revision: submission.pinnedRecipe.revision,
                }).contentHash;
            }
            catch (error) {
                if (error instanceof RecipeError && error.code === 'not-found') {
                    throw new TaskError('submission-rejected', 'the pinned recipe revision is not registered');
                }
                throw error;
            }
            const facts = await this.resolveSubmissionEnvironment(submission, environment);
            const existing = await this.loadSubmissionByIdempotencyKey(submission.idempotencyKey);
            const verdict = acceptSubmission({
                submission, task, run, phaseRun, registeredHash,
                sourceSeqPersisted: facts.sourceSeqPersisted,
                inputsCurrent: facts.inputsCurrent,
                outputsValid: facts.outputsValid,
                ...existing === undefined ? {} : { existingByIdempotency: existing },
            });
            if (!verdict.ok) {
                throw new TaskError('submission-rejected', `submission has ${verdict.problems.length} rejection problem(s)`, verdict.problems);
            }
            if (verdict.idempotentReturn !== undefined)
                return verdict.idempotentReturn;
            const next = phaseTransition(phaseRun.state, 'acceptSubmission');
            if (next === null)
                throw new TaskError('invalid-transition', 'the phase run cannot accept a submission in its current state');
            await this.onSubmissionAccepted(submission);
            const updatedPhaseRun = {
                ...phaseRun,
                state: next,
                revision: phaseRun.revision + 1,
                activeSubmissionId: submission.submissionId,
            };
            const provenance = { actor: facts.submittedBy, idempotencyKey: submission.idempotencyKey };
            await this.saveSubmission(submission, provenance);
            if (!await this.savePhaseRun(updatedPhaseRun, provenance))
                throw new TaskError('stale-revision', 'phase-run revision moved concurrently');
            this.emit('phase-run/updated', updatedPhaseRun);
            return submission;
        }
        async recordSubmission(submission, environment) {
            return this.serialized(() => this.applySubmission(submission, environment));
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
        async requestPatch(taskId, phaseRunId, note, mutation) {
            return this.serialized(async () => {
                const phaseRun = await this.loadPhaseRunOrThrow(PhaseRunIdValue(phaseRunId));
                if (TaskIdValue(taskId) !== phaseRun.taskId) {
                    throw new TaskError('submission-rejected', 'phase run does not belong to the given task');
                }
                if (phaseRun.activeSubmissionId === undefined) {
                    throw new TaskError('submission-rejected', 'no active submission on this phase run to patch');
                }
                const trimmed = note.trim();
                if (trimmed.length === 0)
                    throw new TaskError('submission-rejected', 'patch note must not be empty');
                const base = await this.loadSubmission(SubmissionIdValue(phaseRun.activeSubmissionId));
                if (base === undefined)
                    throw new TaskError('submission-rejected', 'active submission is not readable');
                if (phaseRun.state !== 'running' && phaseRun.state !== 'awaiting-input' && phaseRun.state !== 'awaiting-decision' && phaseRun.state !== 'gate-running') {
                    throw new TaskError('invalid-transition', 'phase run is not open for a patch');
                }
                const patch = {
                    ...base,
                    submissionId: SubmissionIdValue(randomUUID()),
                    attempt: base.attempt + 1,
                    supersedesSubmissionId: base.submissionId,
                    unresolvedIssues: [...base.unresolvedIssues, trimmed],
                    idempotencyKey: 'patch-' + randomUUID(),
                    submittedAt: Date.now(),
                };
                // The patch records the corrected revision in place and re-enters the
                // gate (原地修正，Gate 将重�? for states that were awaiting a decision.
                const nextState = (phaseRun.state === 'awaiting-input' || phaseRun.state === 'awaiting-decision') ? 'gate-running' : phaseRun.state;
                const nextPhase = {
                    ...phaseRun,
                    state: nextState,
                    revision: phaseRun.revision + 1,
                    activeSubmissionId: patch.submissionId,
                };
                const provenance = { actor: mutation.actor, idempotencyKey: patch.idempotencyKey };
                await this.saveSubmission(patch, provenance);
                const needsPhaseWrite = nextState !== phaseRun.state || nextPhase.activeSubmissionId !== phaseRun.activeSubmissionId;
                if (needsPhaseWrite) {
                    if (!await this.savePhaseRun(nextPhase, provenance))
                        throw new TaskError('stale-revision', 'phase-run revision moved concurrently');
                    this.emit('phase-run/updated', nextPhase);
                }
                return patch;
            });
        }
        /**
         * Start the gate for one accepted submission.
         * @param submissionId - the accepted submission.
         * @param mutation - the phase run's expected revision plus actor metadata.
         * @returns the post-commit phase-run projection.
         */
        async startGate(submissionId, mutation) {
            const submission = await this.loadSubmissionOrThrow(SubmissionIdValue(submissionId));
            return this.mutatePhaseRun(submission.phaseRunId, mutation, 'startGate');
        }
        /**
         * Record one gate-check verdict for a submission.
         * @param result - the check verdict.
         * @returns the stored verdict.
         */
        async recordGateCheck(result) {
            return this.serialized(async () => {
                await this.loadSubmissionOrThrow(result.submissionId);
                // No caller-actor slot exists on this command; 'gate' marks the check-runner path.
                const provenance = {
                    actor: 'gate',
                    idempotencyKey: `gate-check:${result.submissionId}:${result.checkId}:${result.recordedAt}`,
                };
                await this.saveGateResult(result, provenance);
                this.emit('gate-check/recorded', result);
                return result;
            });
        }
        /**
         * Mark one phase run passed.
         * @param phaseRunId - the phase run.
         * @param mutation - the phase run's expected revision plus actor metadata.
         * @returns the post-commit phase-run projection.
         */
        async markPhasePassed(phaseRunId, mutation) {
            return this.mutatePhaseRun(PhaseRunIdValue(phaseRunId), mutation, 'pass');
        }
        /**
         * Mark one gate-running phase run failed.
         * @param phaseRunId - the phase run.
         * @param mutation - the phase run's expected revision plus actor metadata.
         * @returns the post-commit phase-run projection.
         */
        async markPhaseFailed(phaseRunId, mutation) {
            return this.mutatePhaseRun(PhaseRunIdValue(phaseRunId), mutation, 'fail');
        }
        /**
         * Cancel one not-yet-passed phase run.
         * @param phaseRunId - the phase run to cancel.
         * @param mutation - the phase run's expected revision plus actor metadata.
         * @returns the post-commit phase-run projection.
         */
        async cancelPhaseRun(phaseRunId, mutation) {
            return this.mutatePhaseRun(PhaseRunIdValue(phaseRunId), mutation, 'cancel');
        }
        /**
         * Mark one phase run stale: the M2 impact command. A stale run is
         * terminal; the engine re-opens the phase as a new run. Runs in `running`
         * or `submitting` reject �?an in-flight atomic action settles per the M1
         * quiescence contract.
         * @param phaseRunId - the phase run the impact closure covers.
         * @param mutation - the phase run's expected revision plus actor metadata.
         * @returns the post-commit phase-run projection.
         */
        async markPhaseStale(phaseRunId, mutation) {
            return this.mutatePhaseRun(PhaseRunIdValue(phaseRunId), mutation, 'stale');
        }
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
        async markPhaseSuperseded(phaseRunId, mutation) {
            return this.mutatePhaseRun(PhaseRunIdValue(phaseRunId), mutation, 'supersede');
        }
        /**
         * Park one gate-running phase run in `awaiting-input`: the M3 clarification
         * state. The clarification service resolves the inputs and resumes the run.
         * @param phaseRunId - the phase run awaiting clarification input.
         * @param mutation - the phase run's expected revision plus actor metadata.
         * @returns the post-commit phase-run projection.
         */
        async markPhaseAwaitingInput(phaseRunId, mutation) {
            return this.mutatePhaseRun(PhaseRunIdValue(phaseRunId), mutation, 'awaitInput');
        }
        /**
         * Park one gate-running phase run in `awaiting-decision`: the M3 complex-gate
         * state for B/C checks. The attention service decides and resumes the run.
         * @param phaseRunId - the phase run awaiting a B/C decision.
         * @param mutation - the phase run's expected revision plus actor metadata.
         * @returns the post-commit phase-run projection.
         */
        async markPhaseAwaitingDecision(phaseRunId, mutation) {
            return this.mutatePhaseRun(PhaseRunIdValue(phaseRunId), mutation, 'awaitDecision');
        }
        /**
         * Return a parked phase run from `awaiting-input` or `awaiting-decision` to
         * `gate-running`, so the engine re-runs the gate. Clarification completion
         * and attention decisions resume through this command.
         * @param phaseRunId - the parked phase run.
         * @param mutation - the phase run's expected revision plus actor metadata.
         * @returns the post-commit phase-run projection.
         */
        async resumePhaseFromAwaiting(phaseRunId, mutation) {
            return this.mutatePhaseRun(PhaseRunIdValue(phaseRunId), mutation, 'resumeFromAwaiting');
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
        async recordPhaseSession(phaseRunId, sessionId, mutation) {
            return this.mutateSessionId(PhaseRunIdValue(phaseRunId), this.resolveText(sessionId, 'sessionId'), mutation);
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
        async freezePhaseScheduling(phaseRunId, mutation) {
            return this.mutateSchedulingFlag(PhaseRunIdValue(phaseRunId), mutation, true);
        }
        /**
         * Clear one phase run's scheduling freeze; the engine wakes on the
         * committed change and resumes dispatching.
         * @param phaseRunId - the frozen phase run.
         * @param mutation - the phase run's expected revision plus actor metadata.
         * @returns the post-commit phase-run projection with the flag cleared.
         */
        async clearPhaseScheduling(phaseRunId, mutation) {
            return this.mutateSchedulingFlag(PhaseRunIdValue(phaseRunId), mutation, false);
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
        async markGateChecksStale(submissionId, checkIds, mutation) {
            const id = SubmissionIdValue(this.resolveText(submissionId, 'submissionId'));
            const wanted = checkIds.map(check => this.resolveText(check, 'checkId'));
            return this.serialized(async () => {
                await this.loadSubmissionOrThrow(id);
                return this.staleGateChecks(id, wanted, provenanceOf(mutation));
            });
        }
        /**
         * Read one task projection.
         * @param taskId - the task to read.
         * @returns the current projection.
         */
        async getTask(taskId) {
            return this.loadTask(TaskIdValue(taskId));
        }
        /**
         * Every task projection, for the task board.
         * @returns tasks in insertion order.
         */
        async listTasks() {
            return this.loadAllTasks();
        }
        /**
         * Read one phase-run projection.
         * @param phaseRunId - the phase run to read.
         * @returns the current projection.
         */
        async getPhaseRun(phaseRunId) {
            return this.loadPhaseRun(PhaseRunIdValue(phaseRunId));
        }
        /**
         * Every phase-run projection of one run, for the engine and the task board.
         * @param runId - the run whose phase runs to list.
         * @returns phase runs in insertion order.
         */
        async listPhaseRuns(runId) {
            return this.loadPhaseRunsOfRun(TaskRunIdValue(runId));
        }
        /**
         * Read one submission.
         * @param submissionId - the submission to read.
         * @returns the stored submission.
         */
        async getSubmission(submissionId) {
            return this.loadSubmission(SubmissionIdValue(submissionId));
        }
        /**
         * Every gate-check verdict recorded for one submission.
         * @param submissionId - the submission.
         * @returns verdicts in recording order.
         */
        async listGateResults(submissionId) {
            return this.loadGateResults(SubmissionIdValue(submissionId));
        }
        /** Load, transition under the command table, save, and publish one task. */
        mutateTask(taskId, mutation, command, extra) {
            const provenance = provenanceOf(mutation);
            return this.serialized(async () => {
                const task = await this.loadTaskOrThrow(taskId);
                this.assertRevision(task, mutation);
                const next = taskTransition(task.state, command);
                if (next === null) {
                    throw new TaskError('invalid-transition', `task in state "${task.state}" cannot ${command}`);
                }
                const updated = {
                    ...task,
                    state: next,
                    revision: task.revision + 1,
                    ...await (extra?.(task) ?? Promise.resolve({})),
                };
                if (!await this.saveTask(updated, provenance))
                    throw new TaskError('stale-revision', 'task revision moved concurrently');
                this.emit('task/updated', updated);
                return updated;
            });
        }
        mutatePhaseRun(phaseRunId, mutation, command) {
            const provenance = provenanceOf(mutation);
            return this.serialized(async () => {
                const phaseRun = await this.loadPhaseRunOrThrow(phaseRunId);
                this.assertRevision(phaseRun, mutation);
                const next = phaseTransition(phaseRun.state, command);
                if (next === null) {
                    throw new TaskError('invalid-transition', `phase run in state "${phaseRun.state}" cannot ${command}`);
                }
                const updated = {
                    ...phaseRun,
                    state: next,
                    revision: phaseRun.revision + 1,
                };
                if (!await this.savePhaseRun(updated, provenance))
                    throw new TaskError('stale-revision', 'phase-run revision moved concurrently');
                this.emit('phase-run/updated', updated);
                return updated;
            });
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
        mutateSessionId(phaseRunId, sessionId, mutation) {
            const provenance = provenanceOf(mutation);
            return this.serialized(async () => {
                const phaseRun = await this.loadPhaseRunOrThrow(phaseRunId);
                this.assertRevision(phaseRun, mutation);
                if (phaseRun.sessionId === sessionId)
                    return phaseRun;
                const updated = {
                    ...phaseRun,
                    sessionId,
                    revision: phaseRun.revision + 1,
                };
                if (!await this.savePhaseRun(updated, provenance))
                    throw new TaskError('stale-revision', 'phase-run revision moved concurrently');
                this.emit('phase-run/updated', updated);
                return updated;
            });
        }
        mutateSchedulingFlag(phaseRunId, mutation, frozen) {
            const provenance = provenanceOf(mutation);
            return this.serialized(async () => {
                const phaseRun = await this.loadPhaseRunOrThrow(phaseRunId);
                this.assertRevision(phaseRun, mutation);
                if (phaseRun.schedulingFrozen === frozen)
                    return phaseRun;
                const updated = {
                    ...phaseRun,
                    schedulingFrozen: frozen,
                    revision: phaseRun.revision + 1,
                };
                if (!await this.savePhaseRun(updated, provenance))
                    throw new TaskError('stale-revision', 'phase-run revision moved concurrently');
                this.emit('phase-run/updated', updated);
                return updated;
            });
        }
        async loadTaskOrThrow(taskId) {
            const task = await this.loadTask(taskId);
            if (task === undefined)
                throw new TaskError('not-found', `task "${taskId}" is unknown`);
            return task;
        }
        async loadRunOrThrow(runId) {
            const run = await this.loadRun(runId);
            if (run === undefined)
                throw new TaskError('not-found', `task run "${runId}" is unknown`);
            return run;
        }
        async loadPhaseRunOrThrow(phaseRunId) {
            const phaseRun = await this.loadPhaseRun(phaseRunId);
            if (phaseRun === undefined)
                throw new TaskError('not-found', `phase run "${phaseRunId}" is unknown`);
            return phaseRun;
        }
        async loadSubmissionOrThrow(submissionId) {
            const submission = await this.loadSubmission(submissionId);
            if (submission === undefined)
                throw new TaskError('not-found', `submission "${submissionId}" is unknown`);
            return submission;
        }
        /** Assert the caller's expected revision matches the loaded record. */
        assertRevision(record, mutation) {
            if (!Number.isSafeInteger(mutation.expectedRevision) || mutation.expectedRevision < 1) {
                throw new TaskError('invalid-argument', 'expectedRevision must be a positive safe integer');
            }
            if (record.revision !== mutation.expectedRevision) {
                throw new TaskError('stale-revision', `expected revision ${mutation.expectedRevision}, stored ${record.revision}`);
            }
        }
        resolveText(value, field) {
            if (typeof value !== 'string' || value.trim().length === 0) {
                throw new TaskError('invalid-argument', `${field} must be a non-empty string`);
            }
            return value.trim();
        }
        /** Contained fan-out: a broken listener never hides a committed change. */
        emit(name, payload) {
            for (const listener of this.ctx.events.dispatch('emit', [name, payload])) {
                try {
                    listener(payload);
                }
                catch (error) {
                    this.ctx.logger.warn('task: a %s listener failed: %s', name, error);
                }
            }
        }
    };
})();
export { TaskHandle };
export default TaskHandle;
//# sourceMappingURL=index.js.map