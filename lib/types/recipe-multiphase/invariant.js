/** Package-owned invariant companion for `@deepseek-ai/dsh-recipe-multiphase`. @module @deepseek-ai/dsh-recipe-multiphase/invariant */
const PACKAGE_NAME = '@deepseek-ai/dsh-recipe-multiphase';
/** Cordis companion plugin name. */
export const name = 'recipe-multiphase-invariant';
/** Service required before package ownership can be reserved. */
export const inject = ['invariants'];
/**
 * No runtime invariant: the registry keeps only in-memory, per-kind executor
 * references; there is no durable event or data relation to check.
 */
const install = () => { };
/**
 * Register the package invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the registration disposer.
 */
export const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
/* jscpd:ignore-end */
//# sourceMappingURL=invariant.js.map