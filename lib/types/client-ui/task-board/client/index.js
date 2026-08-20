import { TaskBoardController } from "./board.js";
import { TaskBoardAction } from "./TaskBoardAction.js";
import { en, NS, zh } from "./locales.js";
/** Required services for the drawer seat, the tasks Remote, and copy. */
export const inject = ['slots', 'remote', 'remote.tasks', 'remote.metrics', 'locale'];
/**
 * Client plugin body: the dictionaries, the controller, and the drawer seat.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-task-board: dictionaries');
    const board = new TaskBoardController(ctx);
    ctx.slots.inject('workbench.drawer.tasks', () => ctx.slots.register({
        name: 'workbench.drawer.tasks',
        locale: NS,
        inject: () => ({
            hooks: { board: board.store },
            refresh: () => board.refresh(),
        }),
    }, TaskBoardAction));
}
//# sourceMappingURL=index.js.map