/**
 * Types of the task-creation tool (`task-create`): the model-facing input, the
 * confirmation proposal it returns, and the rejection ladder. Types only — no
 * runtime code.
 * @module @deepseek-ai/dsh-tool-task-create/types
 */

/** Model-facing create-request input; explicit intent only, no implicit suggestion. */
export interface TaskCreateInput {
  readonly recipeId: string
  readonly goal: string
  readonly inheritSession: boolean
}

/** The confirmation proposal the tool returns; create happens only after the human confirms. */
export interface TaskCreateProposal {
  readonly recipeId: string
  readonly goal: string
  readonly inheritSession: boolean
  readonly phaseCount: number
  readonly checks: number
  /** Caller-safe replay key; the confirm step uses it for idempotent create. */
  readonly idempotencyKey: string
}
