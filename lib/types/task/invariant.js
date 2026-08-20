/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-task`.
 * @module @deepseek-ai/dsh-task/invariant
 */
const PACKAGE_NAME = '@deepseek-ai/dsh-task';
/** Cordis companion plugin name. */
export const name = 'task-invariant';
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants'];
/**
 * No runtime invariant: this package declares contracts and pure transitions;
 * the provider emits `task/updated` events after durable commits and will
 * register the journal-consistency checks here when task-local lands.
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