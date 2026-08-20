/** Package-owned invariant companion for @deepseek-ai/dsh-budget. @module @deepseek-ai/dsh-budget/invariant */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantFailure, InvariantInstaller } from '@deepseek-ai/dsh-invariants'
import type { DomainChanged } from '@deepseek-ai/dsh-storage-domain'

const PACKAGE_NAME = '@deepseek-ai/dsh-budget'
const DOMAIN_NAME = 'budget'

/** Cordis companion plugin name. */
export const name = 'budget-invariant'
/** Services required before the companion can reserve and check package ownership. */
export const inject = ['invariants']

/**
 * Ledger-threshold consistency on the authoritative change stream: a stored
 * record may never spend beyond a finite limit without the matching exceeded
 * fact being journaled — the decision trail must exist whenever the ledger
 * says the task crossed.
 */
const install: InvariantInstaller = Object.assign((ctx: Context, fail: InvariantFailure) => {
  ctx.on('domain/changed', (change: DomainChanged) => {
    if (change.domain !== DOMAIN_NAME || change.operation !== 'put' || change.table !== 'records') return
    const record = change.value as {
      limits: { maxTokens?: number; maxDurationMs?: number; maxReruns?: number }
      spent: { tokens: number; durationMs: number; reruns: number }
    }
    for (const [limit, spent] of [
      [record.limits.maxTokens, record.spent.tokens],
      [record.limits.maxDurationMs, record.spent.durationMs],
      [record.limits.maxReruns, record.spent.reruns],
    ] as const) {
      if (limit !== undefined && spent > limit) {
        return fail(`budget record spends ${spent} beyond limit ${limit} in one write — the exceeded decision must be journaled first`)
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
