import { BadgeController } from "./badge.js";
import { WorkbenchDrawer } from "./WorkbenchDrawer.js";
import { WorkbenchTrigger } from "./WorkbenchTrigger.js";
import { en, NS, zh } from "./locales.js";
import { createWorkbenchStore } from "./store.js";
/** Required services for both entries and the badge Remotes. */
export const inject = ['slots', 'remote', 'remote.workbenchHost', 'remote.tasks', 'locale'];
/**
 * Client plugin body: the dictionaries, the shared store handle, the badge
 * controller, and the two register entries — the sidebar footer action and the
 * overlay drawer — sharing one store handle and one badge source.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-workbench-drawer: dictionaries');
    const badge = new BadgeController(ctx);
    const store = createWorkbenchStore();
    const badgeSource = () => ({ hooks: { badge: badge.store } });
    // Sidebar footer action: a same-level side-bar member, prominent and accent-styled.
    ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
        name: 'sidebar.footer.action',
        id: 'workbench-drawer-trigger',
        order: 0,
        locale: NS,
        store,
        inject: badgeSource,
    }, WorkbenchTrigger));
    // The drawer panel rides the shell.overlay layer (right-side, non-modal).
    ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'workbench-drawer',
        order: 100,
        locale: NS,
        store,
        children: {
            'workbench.drawer.tasks': { kind: 'single', scope: 'root' },
            'workbench.drawer.taskList': { kind: 'single', scope: 'root' },
            'workbench.drawer.recipeLibrary': { kind: 'single', scope: 'root' },
            'workbench.drawer.inbox': { kind: 'single', scope: 'root' },
            'workbench.drawer.clarifications': { kind: 'single', scope: 'root' },
            'workbench.drawer.detail': { kind: 'single', scope: 'root' },
            'workbench.drawer.create': { kind: 'single', scope: 'root' },
        },
        inject: badgeSource,
    }, WorkbenchDrawer));
}
//# sourceMappingURL=index.js.map