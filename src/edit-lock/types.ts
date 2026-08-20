/**
 * Edit-lock type surface: the durable lease record and its failure codes.
 * Types only — no runtime code.
 * @module @deepseek-ai/dsh-edit-lock/types
 */

import type { Branded } from '@deepseek-ai/dsh-brand'
import type { DeliverableId, DeliverableVersionId } from '../deliverable/types.ts'
import type { TaskId } from '../task/types.ts'

/** Branded lease identity. */
export type EditLeaseId = Branded<'EditLeaseId'>

/** Lease lifecycle: active until released, expired, or superseded by expiry. */
export type EditLeaseState = 'active' | 'released' | 'expired'

/**
 * One edit lock on a deliverable version. The holder may edit the version
 * without racing other writers; consumers of the target version are frozen
 * from scheduling for the lease's duration. A lease never exempts the
 * version-chain base check.
 */
export interface EditLease {
  /** Lease identity. */
  readonly leaseId: EditLeaseId
  /** The task that owns the edit, when the edit runs inside one. */
  readonly taskId?: TaskId
  /** The deliverable the lease protects. */
  readonly deliverableId: DeliverableId
  /** The version the holder edits; must belong to the deliverable. */
  readonly targetVersionId: DeliverableVersionId
  /** Actor holding the lease. */
  readonly owner: string
  /** Epoch milliseconds the lease was acquired. */
  readonly acquiredAt: number
  /** Epoch milliseconds of the latest renewal. */
  readonly renewedAt: number
  /** Epoch milliseconds the lease lapses unless renewed. */
  readonly expiresAt: number
  /** Compare-and-set revision for renew and release. */
  readonly entityRevision: number
  /** Lifecycle state. */
  readonly state: EditLeaseState
}

/** Machine-routable edit-lock failure codes. */
export type EditLockErrorCode =
  | 'not-found'
  | 'invalid-argument'
  | 'lock-held'
  | 'invalid-transition'

/** Edit-lock failure with a code and, for lock conflicts, the holder. */
export class EditLockError extends Error {
  /** Machine-routable failure code. */
  readonly code: EditLockErrorCode
  /** Current holder when the code is `lock-held`. */
  readonly holder?: string
  /** Current expiry when the code is `lock-held`. */
  readonly expiresAt?: number

  /**
   * @param code - Machine-routable failure code.
   * @param message - Human-readable failure description.
   * @param holder - Current holder for `lock-held`.
   * @param expiresAt - Current expiry for `lock-held`.
   */
  constructor(code: EditLockErrorCode, message: string, holder?: string, expiresAt?: number) {
    super(message)
    this.code = code
    if (holder !== undefined) this.holder = holder
    if (expiresAt !== undefined) this.expiresAt = expiresAt
    this.name = 'EditLockError'
  }
}

/** Journal fact kinds the edit-lock service appends. */
export type EditLockFactKind =
  | 'edit-lock/acquired'
  | 'edit-lock/renewed'
  | 'edit-lock/released'
  | 'edit-lock/expired'
