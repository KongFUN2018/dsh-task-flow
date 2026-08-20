/**
 * Runtime constructors for the budget ledger's branded ids.
 * @module @deepseek-ai/dsh-budget/src/runtime
 */

import type { Branded } from '@deepseek-ai/dsh-brand'

/**
 * Brand one wire value as a budget record id.
 * @param value - Wire value from the boundary.
 * @returns the branded budget record id.
 */
export function BudgetRecordId(value: string): Branded<'BudgetRecordId'> {
  return value as Branded<'BudgetRecordId'>
}
