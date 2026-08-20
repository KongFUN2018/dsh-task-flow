/**
 * Package-owned invariant companion for `@kongfun2018/dsh-task-flow`.
 * @module @kongfun2018/dsh-task-flow/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@kongfun2018/dsh-task-flow'

/** Cordis companion plugin name. */
export const name = 'task-flow-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant at the single-package fold boundary yet: the recipe
 * domain verifies its own content hash on every pinned read, and the
 * cross-service event stream a companion could check belongs to the task
 * domain, which folds in at a later milestone.
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
