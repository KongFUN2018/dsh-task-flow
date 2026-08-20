/**
 * Attention inbox plugin, browser half: one `workbench.drawer.inbox` entry
 * filling the drawer's attention tab. All item data lives in the
 * React-free controller (`inbox.ts`): a snapshot load over the workbench-host
 * Remote, revision-gated folds of forwarded `workbench/attention-updated`
 * deliveries, a delta-stream replay on reconnect, and the batch-confirm /
 * single-decision verbs carrying each row's compare-and-set revision. The
 * component sees only the store snapshot and callbacks through the inject
 * face; a conflict, failure, or reconnect resyncs from the Remote (the host
 * projection stays authoritative and no non-resolved item is silently
 * removed).
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type AttentionInboxKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The attention inbox's copy. */
        'attentionInbox': AttentionInboxKey;
    }
}
/** Required services for the drawer seat, the inbox Remotes, and copy. */
export declare const inject: string[];
/**
 * Client plugin body: the dictionaries, the controller, and the drawer seat.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map