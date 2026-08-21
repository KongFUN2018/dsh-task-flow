/**
 * Task-creation wizard, browser half: one `workbench.drawer.create` seat
 * filling the drawer's create tab with the three-column new-task panel.
 */
import { TaskCreateController } from "./create.js";
import { TaskCreateAction } from "./TaskCreateAction.js";
import { en, NS, zh } from "./locales.js";
export const inject = ['slots', 'remote', 'remote.recipes', 'remote.tasks', 'remote.taskPolish', 'locale'];
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-task-create: dictionaries');
    const controller = new TaskCreateController(ctx);
    ctx.slots.inject('workbench.drawer.create', () => ctx.slots.register({
        name: 'workbench.drawer.create',
        locale: NS,
        inject: () => ({
            hooks: {
                create: controller.store,
                // Real workspace candidates ride the harness standard `useWorkspaces`
                // feed (GlobalStandardProps); no custom workspace hook needed.
            },
            refresh: () => { void controller.refresh(); },
            create: (recipeId, workspaceId, goal) => controller.create(recipeId, workspaceId, 'workbench-ui', goal),
            polish: (goal) => controller.polish(goal),
        }),
    }, TaskCreateAction));
}
//# sourceMappingURL=index.js.map