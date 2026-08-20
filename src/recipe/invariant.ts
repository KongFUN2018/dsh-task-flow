/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-recipe`.
 * @module @deepseek-ai/dsh-recipe/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-recipe'

/** Cordis companion plugin name. */
export const name = 'recipe-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the registry verifies its own content hash on every
 * `getPinned` read, and there is no cross-service event stream a companion
 * could check until the task domain records pinned-recipe facts in its
 * journal.
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
