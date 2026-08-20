/**
 * Task list plugin, browser half: one `workbench.drawer.taskList` entry
 * filling the drawer's focused task-list tab. All task data lives in the
 * React-free controller (`taskList.ts`): a full-list load over the tasks
 * Remote, revision-gated folds of forwarded `task/updated` deliveries, and
 * the pause/resume/cancel verbs carrying each row's compare-and-set revision.
 * The component sees only the store snapshot and callbacks through the inject
 * face; a reconnect or failed verb resyncs from the Remote (the host
 * projection stays authoritative). Same task data as the board, without the
 * KPI counts and charts.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type TaskListKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The task list's copy. */
        'taskList': TaskListKey;
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