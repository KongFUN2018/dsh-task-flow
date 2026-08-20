/** Package-owned invariant companion for @deepseek-ai/dsh-attention. @module @deepseek-ai/dsh-attention/invariant */
const PACKAGE_NAME = '@deepseek-ai/dsh-attention';
const DOMAIN_NAME = 'attention';
/** Cordis companion plugin name. */
export const name = 'attention-invariant';
/** Services required before the companion can reserve and check package ownership. */
export const inject = ['invariants'];
/**
 * Reference integrity on the authoritative change stream: an item-key entry
 * must name a stored item �?a dangling key means the idempotency index
 * recorded a create that never landed the entity behind it, breaking replay.
 */
const install = Object.assign((ctx, fail) => {
    ctx.on('domain/changed', (change) => {
        if (change.domain !== DOMAIN_NAME || change.operation !== 'put')
            return;
        if (change.table !== 'item_keys')
            return;
        const domain = ctx.storage.form('domain').get(DOMAIN_NAME);
        if (domain === undefined)
            return fail(`${DOMAIN_NAME} changed while the attention domain is not open`);
        const entry = change.value;
        if (domain.table('items').get(entry.itemId) === undefined) {
            return fail(`item_key names item '${entry.itemId}' which is not stored`);
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