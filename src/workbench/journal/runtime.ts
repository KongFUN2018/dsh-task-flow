/**
 * Runtime values of the journal's branded identities.
 * @module @deepseek-ai/dsh-workbench-journal/src/runtime
 */

import type { Branded } from '@deepseek-ai/dsh-brand'
import type { JournalEventId } from './types.ts'

/**
 * Brand one wire value as a journal event id.
 * @param value - Wire value from the journal boundary.
 * @returns the branded event id.
 */
export function JournalEventId(value: string): JournalEventId {
  return value as Branded<'JournalEventId'>
}
