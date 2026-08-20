/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-edit-lock`: lease
 * writes must not create two active leases on one deliverable, and each
 * leased target version must exist in the deliverable-local versions table.
 * @module @deepseek-ai/dsh-edit-lock/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantFailure, InvariantInstaller } from '@deepseek-ai/dsh-invariants'
import type { DomainChanged } from '@deepseek-ai/dsh-storage-domain'
import type { EditLease } from './types.ts'

const PACKAGE_NAME = '@deepseek-ai/dsh-edit-lock'
const DOMAIN_NAME = 'edit_lock'

/** Cordis companion plugin name. */
export const name = 'edit-lock-invariant'
/** Services required before the companion can reserve and check package ownership. */
export const inject = ['invariants']

/** Read the open edit-lock domain handle, failing when it is absent. */
function openDomain(ctx: Context, fail: InvariantFailure) {
  const domain = ctx.storage.form('domain').get(DOMAIN_NAME)
  if (domain === undefined) return fail(`${DOMAIN_NAME} changed while the edit-lock domain is not open`)
  return domain
}

/** The deliverable-local versions table, or undefined when that domain is not open. */
function deliverableVersions(ctx: Context) {
  return ctx.storage.form('domain').get('deliverable_local')?.table('versions')
}

/**
 * Lease writes must not create two active leases on one deliverable, and
 * each leased target version must exist in the deliverable-local versions
 * table — a dangling target would freeze nobody and protect nothing.
 */
const install: InvariantInstaller = Object.assign((ctx: Context, fail: InvariantFailure) => {
  ctx.on('domain/changed', (change: DomainChanged) => {
    if (change.domain !== DOMAIN_NAME || change.table !== 'leases' || change.operation !== 'put') return
    const domain = openDomain(ctx, fail)
    const lease = change.value as EditLease
    for (const [, raw] of domain.table('leases').entries()) {
      const other = raw as EditLease
      if (other.leaseId === lease.leaseId) continue
      if (other.state === 'active' && lease.state === 'active' && other.deliverableId === lease.deliverableId) {
        return fail(`deliverable ${String(other.deliverableId)} has two active leases (${String(other.leaseId)} and ${String(lease.leaseId)})`)
      }
    }
    const versions = deliverableVersions(ctx)
    if (versions === undefined) {
      return fail('deliverable_local domain is not open; lease target version cannot be verified')
    }
    if (versions.get(String(lease.targetVersionId)) === undefined) {
      return fail(`lease ${String(lease.leaseId)} targets missing version ${String(lease.targetVersionId)}`)
    }
  })
}, { inject: ['storage'] })

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
