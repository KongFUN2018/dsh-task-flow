/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-impact-propagation`.
 * @module @deepseek-ai/dsh-impact-propagation/invariant
 */
const PACKAGE_NAME = '@deepseek-ai/dsh-impact-propagation';
/** Cordis companion plugin name. */
export const name = 'impact-propagation-invariant';
/** Services required before the companion can reserve and check package ownership. */
export const inject = ['invariants'];
/**
 * No runtime invariant: the service owns no durable state. Every relationship
 * it enforces — stale phase runs, staled gate verdicts — lives in the task
 * projections and journal facts the composed commands write, and those
 * packages' companions check projection-fact consistency.
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