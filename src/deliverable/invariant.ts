/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-deliverable-local`.
 * @module @deepseek-ai/dsh-deliverable-local/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantFailure, InvariantInstaller } from '@deepseek-ai/dsh-invariants'
import type { DomainChanged } from '@deepseek-ai/dsh-storage-domain'

const PACKAGE_NAME = '@deepseek-ai/dsh-deliverable-local'
const DOMAIN_NAME = 'deliverable_local'

/** Cordis companion plugin name. */
export const name = 'deliverable-local-invariant'
/** Services required before the companion can reserve and check package ownership. */
export const inject = ['invariants']

/** Read the open deliverable-local domain handle, failing when it is absent. */
function openDomain(ctx: Context, fail: InvariantFailure) {
  const domain = ctx.storage.form('domain').get(DOMAIN_NAME)
  if (domain === undefined) return fail(`${DOMAIN_NAME} changed while the deliverable-local domain is not open`)
  return domain
}

/**
 * Reference integrity across the deliverable-local tables on the
 * authoritative change stream: phase-run registrations, dependency edges,
 * save-index entries, chain-head entries, and impact snapshots must all name
 * stored versions — a dangling name means a write recorded a reference
 * without the durable version behind it, breaking both the acceptance
 * chain's input checks and the closure's groupings.
 */
const install: InvariantInstaller = Object.assign((ctx: Context, fail: InvariantFailure) => {
  ctx.on('domain/changed', (change: DomainChanged) => {
    if (change.domain !== DOMAIN_NAME || change.operation !== 'put') return
    const domain = openDomain(ctx, fail)
    const versions = domain.table('versions')
    const versionExists = (versionId: string): boolean => versions.get(versionId) !== undefined
    if (change.table === 'phase_inputs') {
      for (const versionId of (change.value as { inputVersionIds: string[] }).inputVersionIds) {
        if (!versionExists(versionId)) {
          return fail(`phaseInputs references version '${versionId}' which is not stored`)
        }
      }
      return
    }
    if (change.table === 'versions') {
      const record = change.value as { versionId: string; dependsOn?: Array<{ versionId: string }> }
      for (const ref of record.dependsOn ?? []) {
        if (ref.versionId === record.versionId || !versionExists(ref.versionId)) {
          return fail(`version '${record.versionId}' depends on version '${ref.versionId}' which is not stored`)
        }
      }
      return
    }
    if (change.table === 'save_keys' || change.table === 'latest') {
      const entry = change.value as { versionId: string }
      if (!versionExists(entry.versionId)) {
        return fail(`${change.table} names version '${entry.versionId}' which is not stored`)
      }
      return
    }
    if (change.table === 'impact_snapshots') {
      const snapshot = change.value as { staledVersions: Array<{ versionIds: string[] }> }
      for (const group of snapshot.staledVersions) {
        for (const versionId of group.versionIds) {
          if (!versionExists(versionId)) {
            return fail(`impact snapshot names version '${versionId}' which is not stored`)
          }
        }
      }
    }
  }, { global: true })
}, { inject: ['storage'] })

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
