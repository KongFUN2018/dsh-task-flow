/** Package-owned invariant companion for `@deepseek-ai/dsh-gate`. @module @deepseek-ai/dsh-gate/invariant */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-gate'
/** Cordis companion plugin name. */
export const name = 'gate-invariant'
/** Service required before package ownership can be reserved. */
export const inject = ['invariants']
/**
 * No runtime invariant: the gate service writes no durable data of its own;
 * it only advances the task service's phase-run state machine, which the
 * task package's invariant already checks.
 */
const install: InvariantInstaller = () => {}
/**
 * Register the package invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the registration disposer.
 */
export const apply = (ctx: Context): Promise<() => void> => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
