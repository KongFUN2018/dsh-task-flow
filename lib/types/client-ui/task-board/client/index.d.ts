/**
 * Task board plugin, browser half: one `workbench.drawer.tasks` entry
 * filling the drawer's task-list tab. All task data lives in the
 * React-free controller (`board.ts`): a full-list load over the tasks
 * Remote, revision-gated folds of forwarded `task/updated` deliveries, and
 * the pause/resume/cancel verbs carrying each row's compare-and-set
 * revision. The component sees only the store snapshot and callbacks
 * through the inject face; a reconnect or failed verb resyncs from the
 * Remote (the host projection stays authoritative).
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type TaskBoardKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The task board's copy. */
        'taskBoard': TaskBoardKey;
    }
}
/** Required services for the drawer seat, the tasks Remote, and copy. */
export declare const inject: string[];
/**
 * Client plugin body: the dictionaries, the controller, and the drawer seat.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map