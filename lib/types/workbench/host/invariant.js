/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-workbench-host`.
 * @module @deepseek-ai/dsh-workbench-host/invariant
 */
const PACKAGE_NAME = '@deepseek-ai/dsh-workbench-host';
/** Cordis companion plugin name. */
export const name = 'workbench-host-invariant';
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants'];
/**
 * No runtime invariant: this package projects and delegates to the attention
 * service's durable items and journal; it owns no package-local durable
 * stream or relationship to assert.
 */
const install = () => { };
/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
/* jscpd:ignore-end */
//# sourceMappingURL=invariant.js.map