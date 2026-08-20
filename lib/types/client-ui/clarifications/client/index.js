import { ClarificationsController } from "./clarifications.js";
import { ClarificationsAction } from "./ClarificationsAction.js";
import { en, NS, zh } from "./locales.js";
/** Required services for the drawer seat, the workbenchHost Remote, and copy. */
export const inject = ['slots', 'remote', 'remote.workbenchHost', 'locale'];
/**
 * Client plugin body: the dictionaries, the controller, and the drawer seat.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-clarifications: dictionaries');
    const queue = new ClarificationsController(ctx);
    ctx.slots.inject('workbench.drawer.clarifications', () => ctx.slots.register({
        name: 'workbench.drawer.clarifications',
        locale: NS,
        inject: () => ({
            hooks: { clarifications: queue.store },
            refresh: () => { void queue.refresh(); },
        }),
    }, ClarificationsAction));
}
//# sourceMappingURL=index.js.map