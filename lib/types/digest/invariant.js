/** Package-owned invariant companion for @deepseek-ai/dsh-digest. @module @deepseek-ai/dsh-digest/invariant */
const PACKAGE_NAME = '@deepseek-ai/dsh-digest';
/** Cordis companion plugin name. */
export const name = 'digest-invariant';
/** Services required before the companion can reserve and check package ownership. */
export const inject = ['invariants'];
/**
 * Digest is a pure read projection over the journal: no package-owned mutable
 * state exists, so the invariant checks the one durable relationship the
 * package contributes — the digest Remote never writes facts, which the
 * caller-side service contract already guarantees. The companion registers
 * its ownership marker only.
 */
const install = Object.assign((_ctx, _fail) => {
    // No runtime relationship to assert: digest owns no tables, events, or
    // projection state; its outputs are derived fresh from workbenchJournal.
    void _ctx;
    void _fail;
}, { inject: ['storage'] });
/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
/* jscpd:ignore-end */
//# sourceMappingURL=invariant.js.map