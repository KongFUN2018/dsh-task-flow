/**
 * Clarification queue plugin, browser half: one `workbench.drawer.clarifications`
 * entry filling the drawer's clarification-queue tab. Item data lives in the
 * React-free controller (`clarifications.ts`): a snapshot load over the
 * workbench-host Remote filtered to `kind === 'clarification' && status ===
 * 'open'`, revision-gated folds of forwarded `workbench/attention-updated`
 * deliveries (a row that flips non-open is evicted, an unknown id resyncs), and
 * a reconnect resync. The component sees only the store snapshot through the
 * inject face; the queue is read-only and issues no confirm/decide verb.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type ClarificationsKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The clarification queue's copy. */
        'clarifications': ClarificationsKey;
    }
}
/** Required services for the drawer seat, the workbenchHost Remote, and copy. */
export declare const inject: string[];
/**
 * Client plugin body: the dictionaries, the controller, and the drawer seat.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map