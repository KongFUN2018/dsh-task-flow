/**
 * Type surface of the recipe registry: identity, the revision payload
 * vocabulary pinned by the task-flow M1 freeze, and the stored revision
 * record.
 * @module @deepseek-ai/dsh-recipe/types
 */

import type { Branded } from '@deepseek-ai/dsh-brand'

/** Identifies one recipe family across its revisions. */
export type RecipeId = Branded<'RecipeId'>

/** Pinned identity of one immutable recipe revision. */
export interface RecipeIdentity {
  readonly recipeId: RecipeId
  readonly revision: number
}

/** Gate class of one check: machine-blocking, batch confirmation, or single decision. */
export type RecipeCheckKind = 'A' | 'B' | 'C'

/** One declared phase: kind, goal, inputs, outputs, and human-readable submission criteria. */
export interface RecipePhaseSpec {
  readonly phaseId: string
  /** Cross-recipe phase kind; the executor registry routes phases by it (M3). */
  readonly kind: string
  readonly goal: string
  readonly inputs: readonly string[]
  readonly outputs: readonly string[]
  readonly submissionCriteria: readonly string[]
}

/** One declared gate check; machine scope, human action, and optional fuse. */
export interface RecipeGateCheckSpec {
  readonly checkId: string
  readonly phaseId: string
  readonly kind: RecipeCheckKind
  readonly machineScope: readonly string[]
  readonly humanAction: readonly string[]
  readonly circuitBreaker?: string
}

/** Calibrated per-recipe defaults; uncalibrated budget fields stay absent. */
export interface RecipeDefaults {
  readonly batchConfirm: 'per-phase-single' | 'per-check'
  readonly clarify: {
    readonly maxRounds: number
    readonly splitMustDefault: boolean
  }
  readonly draftPolicy: 'block-finalize-not-draft'
}

/** P4 output-mode discrimination: exported from matrix markers, or explicit. */
export type P4Mode = 'auto' | 'draft' | 'skeleton' | 'verify-normalize'

/** How the P4 output form is chosen for one recipe. */
export interface P4ModeCriteria {
  readonly mode: P4Mode
}

/** Explicit per-key repair fuse; uncalibrated keys stay absent (M5). */
export interface RecipeBreakerSpec {
  /** Matches `RecipeGateCheckSpec.circuitBreaker`; one key names one fuse. */
  readonly key: string
  /** Consecutive failed A repairs that trip the fuse; explicit, never defaulted. */
  readonly maxConsecutiveRepairs: number
}

/** Canonical revision payload; the registry computes contentHash over its JSON. */
export interface RecipePayload {
  readonly phases: readonly RecipePhaseSpec[]
  readonly gateChecks: readonly RecipeGateCheckSpec[]
  readonly defaults: RecipeDefaults
  readonly p4Mode: P4ModeCriteria
  /** Repair fuses keyed by `circuitBreaker`; checks naming a key require one. */
  readonly breakers?: readonly RecipeBreakerSpec[]
}

/** Stored immutable revision: identity, validated payload, and its hash. */
export interface RecipeRevision {
  readonly recipeId: RecipeId
  readonly revision: number
  readonly schemaVersion: number
  readonly contentHash: string
  readonly payload: RecipePayload
  readonly registeredAt: number
}

/** Machine-routable registry failure codes. */
export type RecipeErrorCode =
  | 'invalid-payload'
  | 'duplicate-revision'
  | 'not-found'
  | 'hash-mismatch'

/** Registry failure with code, message, and optional payload problems. */
export class RecipeError extends Error {
  /** Machine-routable failure code. */
  readonly code: RecipeErrorCode
  /** Validation problem list; present for `invalid-payload` failures. */
  readonly problems?: readonly string[]

  constructor(code: RecipeErrorCode, message: string, problems?: readonly string[]) {
    super(message)
    this.code = code
    if (problems !== undefined) this.problems = problems
    this.name = 'RecipeError'
  }
}
