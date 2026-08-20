/** Runtime constructors for the recipe domain. */

import type { RecipeId as RecipeIdType } from './types.ts'

/**
 * Brand a string as a recipe id.
 * @param id - raw recipe identifier.
 * @returns the same string with the compile-time brand.
 */
export function RecipeId(id: string): RecipeIdType {
  return id as RecipeIdType
}
