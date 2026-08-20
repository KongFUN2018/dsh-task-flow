/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-task-local`.
 * @module @deepseek-ai/dsh-task-local/invariant
 */
import type { Context } from '@deepseek-ai/cordis';
import '../workbench/journal/index.ts';
/** Cordis companion plugin name. */
export declare const name = "task-local-invariant";
/** Services required before the companion can reserve and check package ownership. */
export declare const inject: string[];
/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export declare const apply: (ctx: Context) => Promise<() => void>;
//# sourceMappingURL=invariant.d.ts.map