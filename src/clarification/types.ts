/**
 * Clarification type surface: persistent question/answer requests over one
 * phase run, with idempotent partial answers and injected-answer recovery.
 * Types only — no runtime code.
 * @module @deepseek-ai/dsh-clarification/types
 */

import type { Branded } from '@deepseek-ai/dsh-brand'
import type { PhaseRunId, TaskId } from '../task/types.ts'

/** One clarification-request identity, assigned by the service. */
export type ClarificationRequestId = Branded<'ClarificationRequestId'>

/** One clarification-question identity, assigned by the service. */
export type ClarificationQuestionId = Branded<'ClarificationQuestionId'>

/** Request lifecycle: open, answers injected, or explicitly closed. */
export type ClarificationRequestState = 'open' | 'injected' | 'closed'

/** Caller-supplied question definition; the service assigns the identity. */
export interface ClarificationQuestionInput {
  /** The recipe phase the question belongs to. */
  readonly phaseId: string
  /** Whether an answer is required before the request may inject. */
  readonly required: boolean
  /** Sort order within the request. */
  readonly order: number
  /** The question text, verbatim. */
  readonly text: string
}

/** One stored question with its assigned identity and revision. */
export interface Question extends ClarificationQuestionInput {
  /** Service-assigned question identity. */
  readonly questionId: ClarificationQuestionId
  /** Owning request. */
  readonly requestId: ClarificationRequestId
  /** Entity revision, incremented on the answer's commit. */
  readonly revision: number
}

/** One persistent clarification request over a phase run. */
export interface ClarificationRequest {
  /** Service-assigned request identity. */
  readonly requestId: ClarificationRequestId
  /** The phase run the request clarifies. */
  readonly phaseRunId: PhaseRunId
  /** The owning task. */
  readonly taskId: TaskId
  /** Question identities in request order. */
  readonly questionIds: readonly ClarificationQuestionId[]
  /** Session-log seq of the injected answer message, once injected. */
  readonly injectedEventId?: number
  /** Lifecycle state. */
  readonly state: ClarificationRequestState
  /** Entity revision. */
  readonly revision: number
  /** Epoch milliseconds at creation. */
  readonly createdAt: number
}

/** One recorded answer to a question, at the question's revision. */
export interface Answer {
  /** The question this answers. */
  readonly questionId: ClarificationQuestionId
  /** Actor that supplied the answer. */
  readonly actor: string
  /** The answer text, verbatim. */
  readonly value: string
  /** Epoch milliseconds at recording. */
  readonly submittedAt: number
  /** The question revision this answer satisfies. */
  readonly revision: number
}

/** Journal fact kinds the clarification service appends, one per durable write. */
export type ClarificationFactKind =
  | 'clarification/request-created'
  | 'clarification/answer-recorded'
  | 'clarification/injected'

/** Machine-routable failure codes. */
export type ClarificationErrorCode = 'invalid-argument' | 'not-found' | 'conflict'

/** A validation, lookup, or idempotency-conflict failure. */
export class ClarificationError extends Error {
  /** The machine-routable failure code. */
  readonly code: ClarificationErrorCode
  constructor(code: ClarificationErrorCode, message: string) {
    super(message)
    this.code = code
    this.name = 'ClarificationError'
  }
}
