/**
 * Package-owned invariant companion for
 * `@deepseek-ai/dsh-recipe-engine-core`.
 * @module @deepseek-ai/dsh-recipe-engine-core/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantFailure, InvariantInstaller } from '@deepseek-ai/dsh-invariants'
import type { DomainChanged } from '@deepseek-ai/dsh-storage-domain'

const PACKAGE_NAME = '@deepseek-ai/dsh-recipe-engine-core'
const DOMAIN_NAME = 'recipe_engine'

/** Cordis companion plugin name. */
export const name = 'recipe-engine-invariant'
/** Services required before the companion can reserve and check package ownership. */
export const inject = ['invariants']

/**
 * Binding integrity: the engine stores each phase-session binding under
 * its own phase run id, and a binding's lifecycle is monotonic - an
 * unexecuted attempt (0) records no session or submission, and a recorded
 * submission requires the attempt that produced it. A put violating these
 * is an engine-owned write bug: recovery keys bindings by phase run id and
 * re-runs gates from the recorded submission, so a mismatched key or an
 * unexecuted binding claiming a submission would misroute recovery.
 */
const install: InvariantInstaller = (ctx: Context, fail: InvariantFailure) => {
  ctx.on('domain/changed', (change: DomainChanged) => {
    if (change.domain !== DOMAIN_NAME || change.operation !== 'put' || change.table !== 'phase_sessions') return
    const record = change.value as Record<string, unknown>
    const phaseRunId = String(record.phaseRunId)
    if (change.key !== phaseRunId) {
      return fail(`binding key '${change.key}' disagrees with its phaseRunId '${phaseRunId}'`)
    }
    const attempt = Number(record.attempt)
    const hasSession = record.sessionId !== undefined
    const hasSubmission = record.submissionId !== undefined
    if (attempt === 0 && (hasSession || hasSubmission)) {
      return fail(`binding '${change.key}' claims a session or submission before its first attempt`)
    }
    if (hasSubmission && (!hasSession || attempt < 1)) {
      return fail(`binding '${change.key}' records a submission without a completed attempt session`)
    }
  }, { global: true })
}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
