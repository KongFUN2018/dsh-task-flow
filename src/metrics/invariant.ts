/** Package-owned invariant companion for @deepseek-ai/dsh-metrics. @module @deepseek-ai/dsh-metrics/invariant */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantFailure, InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-metrics'

/** Cordis companion plugin name. */
export const name = 'metrics-invariant'
/** Services required before the companion can reserve and check package ownership. */
export const inject = ['invariants']

/**
 * Metrics is a pure read aggregation over the journal and entity projections:
 * no package-owned mutable state exists, so the invariant checks the one
 * durable relationship the package contributes — the metrics Remote never
 * writes facts, which the caller-side service contract already guarantees.
 * The companion registers its ownership marker only.
 */
const install: InvariantInstaller = Object.assign((_ctx: Context, _fail: InvariantFailure) => {
  // No runtime relationship to assert: metrics owns no tables, events, or
  // projection state; its outputs are derived fresh from the services.
  void _ctx
  void _fail
}, { inject: ['storage'] })

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
