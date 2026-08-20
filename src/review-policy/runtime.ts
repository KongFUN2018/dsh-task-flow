/**
 * Runtime constructor for review-policy ids.
 * @module @deepseek-ai/dsh-review-policy/src/runtime
 */

import type { Branded } from '@deepseek-ai/dsh-brand'

/**
 * Brand one wire value as a review-policy record id.
 * @param value - Wire value from the boundary.
 * @returns the branded review-policy record id.
 */
export function ReviewPolicyRecordId(value: string): Branded<'ReviewPolicyRecordId'> {
  return value as Branded<'ReviewPolicyRecordId'>
}
