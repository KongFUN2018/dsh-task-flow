/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-workbench-journal`.
 * @module @deepseek-ai/dsh-workbench-journal/invariant
 */
const PACKAGE_NAME = '@deepseek-ai/dsh-workbench-journal';
const DOMAIN_NAME = 'workbench_journal';
/** Cordis companion plugin name. */
export const name = 'workbench-journal-invariant';
/** Services required before the companion can reserve and check package ownership. */
export const inject = ['invariants'];
/**
 * Append-only ownership: the journal domain is allowed exactly one table and
 * exactly `put` operations on it. A `delete` or a foreign table on the domain
 * means some writer mutated or erased recorded facts �?the one contract this
 * package must defend at runtime, observed on the authoritative change stream.
 */
const install = (ctx, fail) => {
    ctx.on('domain/changed', (change) => {
        if (change.domain !== DOMAIN_NAME)
            return;
        if (change.table !== 'entries' || change.operation !== 'put') {
            fail(`journal domain saw a ${change.operation} on '${change.table}': recorded facts are append-only`);
        }
    }, { global: true });
};
/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
/* jscpd:ignore-end */
//# sourceMappingURL=invariant.js.map