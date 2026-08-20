/**
 * Workbench drawer plugin, browser half: one `sidebar.footer.action` trigger
 * button (prominent, accent-styled) and one `shell.overlay` drawer panel (right-side,
 * non-modal) that share one declared store for open/tab/detail state and one
 * badge controller. The overlay entry declares the four content seats
 * (`workbench.drawer.tasks` / `.inbox` / `.detail` / `.create`) the
 * task-flow content packages register into. The badge aggregates (open
 * attention count, active task count) live in the React-free controller
 * (`badge.ts`); both components read them through the inject `hooks`
 * compartment, so neither sees the sources.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type WorkbenchDrawerKey } from './locales.ts';
export type { DrawerTasksOwnerProps, DrawerDetailOwnerProps } from './slots.ts';
export type { DrawerTab } from './store.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        'workbenchDrawer': WorkbenchDrawerKey;
    }
}
/** Required services for both entries and the badge Remotes. */
export declare const inject: string[];
/**
 * Client plugin body: the dictionaries, the shared store handle, the badge
 * controller, and the two register entries — the sidebar footer action and the
 * overlay drawer — sharing one store handle and one badge source.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map