/** Package-owned invariant companion for @deepseek-ai/dsh-review-policy. @module @deepseek-ai/dsh-review-policy/invariant */
const PACKAGE_NAME = '@deepseek-ai/dsh-review-policy';
const DOMAIN_NAME = 'reviewpolicy';
/** Cordis companion plugin name. */
export const name = 'review-policy-invariant';
/** Services required before the companion can reserve and check package ownership. */
export const inject = ['invariants'];
/**
 * Counter-floor consistency on the authoritative change stream: a tripped
 * fuse must never regress below its cap — a continue-repair reset that left
 * the counter above the cap would re-trip on the next failure while the
 * recovery item for the first trip is still open.
 */
const install = Object.assign((ctx, fail) => {
    ctx.on('domain/changed', (change) => {
        if (change.domain !== DOMAIN_NAME || change.operation !== 'put' || change.table !== 'breakers')
            return;
        const counter = change.value;
        if (counter.consecutiveFailures < 0) {
            return fail('breaker counter holds a negative consecutive-failure count');
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