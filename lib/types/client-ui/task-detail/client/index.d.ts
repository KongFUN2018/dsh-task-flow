/**
 * Task detail plugin, browser half: one `workbench.drawer.detail` entry
 * filling the drawer's detail tab. All task data lives in the React-free
 * controller (`detail.ts`): an on-demand load of one task projection, its
 * phase runs, and the gate verdicts of each active submission through the
 * tasks Remote. The component sees only the store snapshot and the load
 * callback through the inject face; the owner's `taskId` share drives what
 * loads.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type TaskDetailKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The task detail's copy. */
        'taskDetail': TaskDetailKey;
    }
}
/** Required services for the drawer seat, the task/digest/rewind/deliverables Remotes, and copy. */
export declare const inject: string[];
/**
 * Client plugin body: the dictionaries, the controller, and the drawer seat.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map