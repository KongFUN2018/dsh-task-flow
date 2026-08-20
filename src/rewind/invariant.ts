/** Package-owned invariant companion for @deepseek-ai/dsh-rewind. @module @deepseek-ai/dsh-rewind/invariant */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-rewind'

/** Cordis companion plugin name. */
export const name = 'rewind-invariant'
/** Services required before the companion can reserve and check package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the service owns no durable state. The branch
 * lineage it writes (task-run parent links, superseded phase runs) lands in
 * the task projections and the rewind journal facts; the task package's
 * companion checks projection-fact consistency, and the e2e lane asserts
 * the journal rebuilds the lineage from the checkpoint.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
