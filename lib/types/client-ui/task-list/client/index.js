import { TaskListController } from "./taskList.js";
import { TaskListAction } from "./TaskListAction.js";
import { en, NS, zh } from "./locales.js";
/** Required services for the drawer seat, the tasks Remote, and copy. */
export const inject = ['slots', 'remote', 'remote.tasks', 'locale'];
/**
 * Client plugin body: the dictionaries, the controller, and the drawer seat.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-task-list: dictionaries');
    const ctl = new TaskListController(ctx);
    ctx.slots.inject('workbench.drawer.taskList', () => ctx.slots.register({
        name: 'workbench.drawer.taskList',
        locale: NS,
        inject: () => ({
            hooks: { list: ctl.store },
            refresh: () => ctl.refresh(),
            command: (taskId, verb) => { void ctl.command(taskId, verb); },
        }),
    }, TaskListAction));
}
//# sourceMappingURL=index.js.map