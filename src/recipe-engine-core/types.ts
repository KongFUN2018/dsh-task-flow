/**
 * Type surface of the recipe engine core: the contributed phase-executor
 * seam, the durable phase-session binding, and engine failure codes.
 * @module @deepseek-ai/dsh-recipe-engine-core/types
 */

import type { Agent, AgentHandle } from '@deepseek-ai/dsh-agent'
import type { RecipeGateCheckSpec, RecipePhaseSpec, RecipeRevision } from '../recipe/types.ts'
import type {
  DeliverableVersionRef,
  PhaseRunId,
  SubmissionId,
  TaskId,
  TaskRunId,
} from '../task/types.ts'

/** What one phase execution produced, per the phase-submission protocol. */
export type PhaseOutcome = {
  /** The executor finished the phase and listed its deliverable refs. */
  readonly result: 'completed'
  /** Deliverable versions the phase consumed as inputs. */
  readonly inputVersions: readonly DeliverableVersionRef[]
  /** Deliverable versions the phase produced as outputs. */
  readonly outputVersions: readonly DeliverableVersionRef[]
  /** Issues the executor could not resolve; recorded on the submission. */
  readonly unresolvedIssues: readonly string[]
  /** Source session log sequence range the outcome spans. */
  readonly sourceSeqRange: { readonly start: number; readonly end: number }
  /** Whether the source session log persisted through that range. */
  readonly sourceSeqPersisted: boolean
} | {
  /** The executor gave up; the submission records the failure reason. */
  readonly result: 'failed'
  /** Why the phase failed; recorded as the submission's failure reason. */
  readonly failureReason: string
  /** Source session log sequence range the attempt spanned. */
  readonly sourceSeqRange: { readonly start: number; readonly end: number }
  /** Whether the source session log persisted through that range. */
  readonly sourceSeqPersisted: boolean
}

/** One phase handed to the registered executor. */
export interface PhaseAssignment {
  /** The owning task. */
  readonly taskId: TaskId
  /** The run the phase belongs to. */
  readonly taskRunId: TaskRunId
  /** The phase run to execute. */
  readonly phaseRunId: PhaseRunId
  /** The pinned recipe revision the whole task runs on; hash already verified. */
  readonly pinned: RecipeRevision
  /** The phase specification to execute. */
  readonly phase: RecipePhaseSpec
  /** Gate checks the phase declares; M1 runs deterministic A checks only. */
  readonly gateChecks: readonly RecipeGateCheckSpec[]
  /** Attempt ordinal of this execution; retries increment it. */
  readonly attempt: number
  /** Deterministic submission id the engine will record this outcome under. */
  readonly submissionId: SubmissionId
  /** The phase-session agent when the assembly provides an agent factory. */
  readonly agent?: Agent
}

/**
 * Performs one phase. The engine owns scheduling, the submission-gate-pass
 * chain, and recovery; the executor only performs the work and reports the
 * outcome. Executors never write task projections: only the engine submits.
 */
export interface PhaseExecutor {
  /** Executor name for diagnostics. */
  readonly name: string
  /**
   * Execute one phase assignment to a terminal outcome. Resolving is the
   * engine's atomic action boundary: a pause observed meanwhile settles
   * after the outcome is recorded, never mid-execution.
   * @param assignment - the phase to execute.
   * @returns the outcome recorded on the phase submission.
   */
  execute(assignment: PhaseAssignment): Promise<PhaseOutcome>
}

/** Durable engine-owned binding of one phase run to its execution context. */
export interface PhaseSessionBinding {
  /** Keyed by phase run id. */
  readonly phaseRunId: PhaseRunId
  /** The owning task. */
  readonly taskId: TaskId
  /** The run the phase belongs to. */
  readonly taskRunId: TaskRunId
  /** The recipe phase id being executed. */
  readonly phaseId: string
  /** Attempt ordinal; the next retry is attempt + 1. */
  readonly attempt: number
  /** Phase-session id: the agent session, or the synthetic id when no agent factory is registered; absent until the attempt starts. */
  readonly sessionId?: string
  /** The accepted submission of the latest attempt, once recorded. */
  readonly submissionId?: SubmissionId
  /** Millisecond timestamp of the last binding write. */
  readonly updatedAt: number
}

/** Live phase-session handle the engine disposes when the phase settles. */
export interface PhaseSession {
  /** The agent handle owning the session; absent when no agent factory is registered. */
  readonly handle?: AgentHandle
  /** The live agent; present exactly when a handle is. */
  readonly agent?: Agent
  /** The session id recorded on the binding. */
  readonly sessionId: string
}

/** Machine-routable engine failure codes. */
export type RecipeEngineErrorCode =
  | 'no-executor'
  | 'recipe-unsupported'
  | 'recovery-mismatch'

/** Engine failure with code and message. */
export class RecipeEngineError extends Error {
  /** Machine-routable failure code. */
  readonly code: RecipeEngineErrorCode

  constructor(code: RecipeEngineErrorCode, message: string) {
    super(message)
    this.code = code
    this.name = 'RecipeEngineError'
  }
}
