/**
 * Client-side type face for the generated task-flow Host Remote namespaces.
 *
 * The independent package's client bundle compiles only `src`, so the
 * generated `remote`-root `d.ts` enhancement files are outside this program
 * and their @deepseek-ai/dsh-typert-protocol module augmentations never reach
 * the client features. @deepseek-ai/dsh-api-remotes (the published peer)
 * selects only the official Host namespaces, so `ctx.remote` has no type for
 * `tasks`, `metrics`, `recipes`, `workbenchHost`, `workbenchHostStream`,
 * `deliverables`, `digest`, or `rewind` on its own. This ambient module
 * augmentation replays those eight Remote namespace maps under `src`, where
 * the `client-ui` client code can see them.
 *
 * It mirrors the generated `remote`-root declarations, keeping only the
 * `TypertRemoteScopeApi` member maps that `TypertClientRemote extends
 * TypertRemoteNamespaceMap` consumes, re-points the domain-type imports to the
 * same-`src` paths, and replays the forwarded-event selection the Host
 * assembly publishes through `TypertRemoteEventSelection` (so `$on('task/
 * updated')` and `$on('workbench/attention-updated')` type-check with the
 * `Events` payload already declared by the host domains).
 */
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import type { DeliverableVersion, ImpactSnapshot } from '../deliverable/types.ts'
import type { TaskDigest } from '../digest/types.ts'
import type { TaskMetrics, WorkbenchMetrics } from '../metrics/types.ts'
import type { RecipeIdentity, RecipePayload, RecipeRevision } from '../recipe/types.ts'
import type { RewindApplication, RewindPreview } from '../rewind/types.ts'
import type { GateCheckResult, PhaseRunRecord, PhaseSubmission, SubmissionEnvironmentFacts, TaskCreateConfirmResult, TaskMutationContext, TaskRecord, TaskRunRecord } from '../task/types.ts'
import type { BatchConfirmRequest, BatchConfirmResponse, InvalidateItemRequest, InvalidateItemResponse, ResolveDecisionRequest, ResolveDecisionResponse, WorkbenchSnapshot } from '../workbench/host/types.ts'
import type { IncrementalPage } from '../workbench/host-stream/types.ts'

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespaceMap {
    'tasks': {
      cancelPhaseRun: (phaseRunId: string, mutation: TaskMutationContext) => Promise<RemoteResult<PhaseRunRecord>>
      clearPhaseScheduling: (phaseRunId: string, mutation: TaskMutationContext) => Promise<RemoteResult<PhaseRunRecord>>
      completeTask: (taskId: string, mutation: TaskMutationContext) => Promise<RemoteResult<TaskRecord>>
      confirmCreateTask: (recipeId: string, goal: string, inheritSession: boolean, idempotencyKey: string, sourceSessionId: string, workspaceId: string, actor: string) => Promise<RemoteResult<TaskCreateConfirmResult>>
      createPhaseRun: (runId: string, phaseId: string, mutation: TaskMutationContext) => Promise<RemoteResult<PhaseRunRecord>>
      createTask: (recipeId: string, workspaceId: string, actor: string, idempotencyKey: string) => Promise<RemoteResult<TaskRecord>>
      createTaskRun: (taskId: string, mutation: TaskMutationContext, parentRunId?: string) => Promise<RemoteResult<TaskRunRecord>>
      failTask: (taskId: string, mutation: TaskMutationContext) => Promise<RemoteResult<TaskRecord>>
      freezePhaseScheduling: (phaseRunId: string, mutation: TaskMutationContext) => Promise<RemoteResult<PhaseRunRecord>>
      getPhaseRun: (phaseRunId: string) => Promise<RemoteResult<PhaseRunRecord | undefined>>
      getSubmission: (submissionId: string) => Promise<RemoteResult<PhaseSubmission | undefined>>
      getTask: (taskId: string) => Promise<RemoteResult<TaskRecord | undefined>>
      listGateResults: (submissionId: string) => Promise<RemoteResult<GateCheckResult[]>>
      listPhaseRuns: (runId: string) => Promise<RemoteResult<PhaseRunRecord[]>>
      listTasks: () => Promise<RemoteResult<TaskRecord[]>>
      markGateChecksStale: (submissionId: string, checkIds: readonly string[], mutation: TaskMutationContext) => Promise<RemoteResult<GateCheckResult[]>>
      markPhaseAwaitingDecision: (phaseRunId: string, mutation: TaskMutationContext) => Promise<RemoteResult<PhaseRunRecord>>
      markPhaseAwaitingInput: (phaseRunId: string, mutation: TaskMutationContext) => Promise<RemoteResult<PhaseRunRecord>>
      markPhaseFailed: (phaseRunId: string, mutation: TaskMutationContext) => Promise<RemoteResult<PhaseRunRecord>>
      markPhasePassed: (phaseRunId: string, mutation: TaskMutationContext) => Promise<RemoteResult<PhaseRunRecord>>
      markPhaseStale: (phaseRunId: string, mutation: TaskMutationContext) => Promise<RemoteResult<PhaseRunRecord>>
      markPhaseSuperseded: (phaseRunId: string, mutation: TaskMutationContext) => Promise<RemoteResult<PhaseRunRecord>>
      markTaskAwaitingDecision: (taskId: string, mutation: TaskMutationContext) => Promise<RemoteResult<TaskRecord>>
      recordGateCheck: (result: GateCheckResult) => Promise<RemoteResult<GateCheckResult>>
      recordPhaseSession: (phaseRunId: string, sessionId: string, mutation: TaskMutationContext) => Promise<RemoteResult<PhaseRunRecord>>
      recordSubmission: (submission: PhaseSubmission, environment: SubmissionEnvironmentFacts) => Promise<RemoteResult<PhaseSubmission>>
      requestCancel: (taskId: string, mutation: TaskMutationContext) => Promise<RemoteResult<TaskRecord>>
      requestPatch: (taskId: string, phaseRunId: string, note: string, mutation: TaskMutationContext) => Promise<RemoteResult<PhaseSubmission>>
      requestPause: (taskId: string, mutation: TaskMutationContext) => Promise<RemoteResult<TaskRecord>>
      resume: (taskId: string, mutation: TaskMutationContext) => Promise<RemoteResult<TaskRecord>>
      resumePhaseFromAwaiting: (phaseRunId: string, mutation: TaskMutationContext) => Promise<RemoteResult<PhaseRunRecord>>
      resumeTaskFromDecision: (taskId: string, mutation: TaskMutationContext) => Promise<RemoteResult<TaskRecord>>
      settleCancel: (taskId: string, mutation: TaskMutationContext) => Promise<RemoteResult<TaskRecord>>
      settlePause: (taskId: string, mutation: TaskMutationContext) => Promise<RemoteResult<TaskRecord>>
      startGate: (submissionId: string, mutation: TaskMutationContext) => Promise<RemoteResult<PhaseRunRecord>>
      startPhaseRun: (phaseRunId: string, mutation: TaskMutationContext) => Promise<RemoteResult<PhaseRunRecord>>
      startTask: (taskId: string, mutation: TaskMutationContext) => Promise<RemoteResult<TaskRecord>>
    }
    'recipes': {
      createRecipe: (recipeId: string, payload: RecipePayload) => Promise<RemoteResult<RecipeRevision>>
      deleteRecipe: (recipeId: string) => Promise<RemoteResult<boolean>>
      getPinned: (identity: RecipeIdentity) => Promise<RemoteResult<RecipeRevision>>
      latest: (recipeId: string) => Promise<RemoteResult<RecipeRevision | undefined>>
      list: () => Promise<RemoteResult<RecipeIdentity[]>>
      listDetails: () => Promise<RemoteResult<RecipeRevision[]>>
      register: (recipeId: string, revision: number, payload: RecipePayload) => Promise<RemoteResult<RecipeRevision>>
      updateRecipe: (recipeId: string, payload: RecipePayload) => Promise<RemoteResult<RecipeRevision>>
    }
    'metrics': {
      metrics: () => Promise<RemoteResult<WorkbenchMetrics>>
      taskMetrics: (taskId: string) => Promise<RemoteResult<TaskMetrics>>
    }
    'workbenchHost': {
      confirmBatch: (request: BatchConfirmRequest) => Promise<RemoteResult<BatchConfirmResponse>>
      invalidateItem: (request: InvalidateItemRequest) => Promise<RemoteResult<InvalidateItemResponse>>
      listSnapshot: () => Promise<RemoteResult<WorkbenchSnapshot>>
      resolveDecision: (request: ResolveDecisionRequest) => Promise<RemoteResult<ResolveDecisionResponse>>
    }
    'workbenchHostStream': {
      listIncremental: (cursor?: number) => Promise<RemoteResult<IncrementalPage>>
    }
    'deliverables': {
      invalidateDownstream: (rootVersionIds: string[]) => Promise<RemoteResult<ImpactSnapshot>>
      listCurrentInputs: (phaseRunId: string) => Promise<RemoteResult<DeliverableVersion[]>>
      listVersions: () => Promise<RemoteResult<DeliverableVersion[]>>
      saveVersion: (deliverableId: string, expectedBaseVersion: string | null, sourceSubmissionId: string | null, idempotencyKey?: string | null) => Promise<RemoteResult<DeliverableVersion>>
    }
    'digest': {
      digest: (taskId: string) => Promise<RemoteResult<TaskDigest>>
    }
    'rewind': {
      applyRewind: (itemId: string, taskRevision: number, actor: string, idempotencyKey: string) => Promise<RemoteResult<RewindApplication>>
      requestRewind: (taskId: string, rootVersionIds: string[], actor: string, idempotencyKey: string) => Promise<RemoteResult<RewindPreview & { itemId: string }>>
    }
    'taskPolish': {
      polish: (goal: string) => Promise<RemoteResult<string>>
    }
  }
  interface TypertRemoteEventSelection {
    'task/updated': '_task-updated'
    'workbench/attention-updated': '_workbench-attention-updated'
  }
}

export {}
