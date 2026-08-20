/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-edit-lock`: lease
 * writes must not create two active leases on one deliverable, and each
 * leased target version must exist in the deliverable-local versions table.
 * @module @deepseek-ai/dsh-edit-lock/invariant
 */
import type { Context } from '@deepseek-ai/cordis';
/** Cordis companion plugin name. */
export declare const name = "edit-lock-invariant";
/** Services required before the companion can reserve and check package ownership. */
export declare const inject: string[];
/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export declare const apply: (ctx: Context) => Promise<() => void>;
//# sourceMappingURL=invariant.d.ts.map