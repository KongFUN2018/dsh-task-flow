/** Runtime constructors for the workbench attention domain. */

import type { WorkbenchItemId as WorkbenchItemIdType } from './types.ts'

/**
 * Brand a string as a workbench item id.
 * @param id - raw item identifier.
 * @returns the same string with the compile-time brand.
 */
export function WorkbenchItemId(id: string): WorkbenchItemIdType {
  return id as WorkbenchItemIdType
}
