/**
 * Types of the rewind service (`ctx.rewind`): the impact preview, the
 * command error ladder, and the applied outcome. Types only — no runtime
 * code.
 * @module @deepseek-ai/dsh-rewind/types
 */

import type { TaskRunRecord } from '../task/types.ts'

/** The decision options of one rewind item. */
export const REWIND_OPTIONS = ['confirm-rewind', 'keep-current', 'cancel'] as const

/** One option of a rewind decision item. */
export type RewindOption = (typeof REWIND_OPTIONS)[number]

/** The impact preview a rewind decision reads; costs stay explicitly uncalibrated. */
export interface RewindPreview {
  /** The persisted impact snapshot the closure computed. */
  readonly snapshotId: string
  /** Deliverable versions the closure invalidated. */
  readonly invalidatedVersionIds: readonly string[]
  /** Phase ids whose runs the rewind re-opens on the new branch. */
  readonly rerunPhaseIds: readonly string[]
  /** Clarification facts the new branch may reuse; empty when the service is absent. */
  readonly reusableClarificationIds: readonly string[]
  /** Static cost estimate marker; calibrated numbers land with M0 calibration. */
  readonly costHint: 'uncalibrated'
}

/** Machine-routable rewind failure codes. */
export type RewindErrorCode =
  | 'not-found'
  | 'invalid-argument'
  | 'stale-revision'
  | 'invalid-transition'
  | 'not-resolved'
  | 'invalid-option'

/** Rewind failure with code and message. */
export class RewindError extends Error {
  /** Machine-routable failure code. */
  readonly code: RewindErrorCode
  constructor(code: RewindErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

/** The applied rewind: the new branch plus the retired phase runs. */
export interface RewindApplication {
  /** The new run the rewind created; its parent links the retired branch. */
  readonly run: TaskRunRecord
  /** The phase runs the rewind superseded, in storage order. */
  readonly supersededPhaseRunIds: readonly string[]
}
