/**
 * Runtime values of the edit-lock package: the lease-id brand constructor
 * and the journal-fact sentinel for leases no task owns.
 * @module @deepseek-ai/dsh-edit-lock/src/runtime
 */

import type { Branded } from '@deepseek-ai/dsh-brand'
import type { TaskId } from '../task/types.ts'
import type { EditLeaseId } from './types.ts'

/**
 * Brand one wire value as a lease id.
 * @param value - Wire value from the boundary.
 * @returns the branded lease id.
 */
export function EditLeaseId(value: string): EditLeaseId {
  return value as Branded<'EditLeaseId'>
}

/**
 * The journal fact's owning task when a lease traces no task: leases acquired
 * outside a task context (a direct user edit) carry this sentinel. The
 * journal stores it verbatim; no task projection reads it back.
 */
export const EDIT_LOCK_UNTASKED_TASK_ID: TaskId = 'edit-lock' as TaskId
