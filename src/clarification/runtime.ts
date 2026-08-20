/**
 * Runtime values of the clarification package: branded identity constructors.
 * @module @deepseek-ai/dsh-clarification/src/runtime
 */

import type { Branded } from '@deepseek-ai/dsh-brand'
import type { ClarificationQuestionId, ClarificationRequestId } from './types.ts'

/**
 * Brand one wire value as a clarification-request id.
 * @param value - Wire value from the boundary.
 * @returns the branded request id.
 */
export function ClarificationRequestId(value: string): ClarificationRequestId {
  return value as Branded<'ClarificationRequestId'>
}

/**
 * Brand one wire value as a clarification-question id.
 * @param value - Wire value from the boundary.
 * @returns the branded question id.
 */
export function ClarificationQuestionId(value: string): ClarificationQuestionId {
  return value as Branded<'ClarificationQuestionId'>
}
