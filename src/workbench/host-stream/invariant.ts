/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-workbench-host-stream`.
 * @module @deepseek-ai/dsh-workbench-host-stream/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-workbench-host-stream'
/** Cordis companion plugin name. */
export const name = 'workbench-host-stream-invariant'
/** Service required before package ownership can be reserved. */
export const inject = ['invariants']
/**
 * No runtime invariant: the stream service writes no durable data of its own;
 * it projects the workbench journal's attention facts, whose integrity the
 * workbench-journal and attention package invariants already check.
 */
const install: InvariantInstaller = () => {}
/**
 * Register the package invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the registration disposer.
 */
export const apply = (ctx: Context): Promise<() => void> => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
