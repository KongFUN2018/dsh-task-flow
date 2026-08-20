/** Package-owned invariant companion for @deepseek-ai/dsh-budget. @module @deepseek-ai/dsh-budget/invariant */
const PACKAGE_NAME = '@deepseek-ai/dsh-budget';
const DOMAIN_NAME = 'budget';
/** Cordis companion plugin name. */
export const name = 'budget-invariant';
/** Services required before the companion can reserve and check package ownership. */
export const inject = ['invariants'];
/**
 * Ledger-threshold consistency on the authoritative change stream: a stored
 * record may never spend beyond a finite limit without the matching exceeded
 * fact being journaled — the decision trail must exist whenever the ledger
 * says the task crossed.
 */
const install = Object.assign((ctx, fail) => {
    ctx.on('domain/changed', (change) => {
        if (change.domain !== DOMAIN_NAME || change.operation !== 'put' || change.table !== 'records')
            return;
        const record = change.value;
        for (const [limit, spent] of [
            [record.limits.maxTokens, record.spent.tokens],
            [record.limits.maxDurationMs, record.spent.durationMs],
            [record.limits.maxReruns, record.spent.reruns],
        ]) {
            if (limit !== undefined && spent > limit) {
                return fail(`budget record spends ${spent} beyond limit ${limit} in one write — the exceeded decision must be journaled first`);
            }
        }
    }, { global: true });
}, { inject: ['storage'] });
/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
/* jscpd:ignore-end */
//# sourceMappingURL=invariant.js.map