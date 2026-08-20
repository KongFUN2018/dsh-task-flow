import { AttentionInboxController } from "./inbox.js";
import { AttentionInboxAction } from "./AttentionInboxAction.js";
import { en, NS, zh } from "./locales.js";
/** Required services for the drawer seat, the inbox Remotes, and copy. */
export const inject = ['slots', 'remote', 'remote.workbenchHost', 'remote.workbenchHostStream', 'locale'];
/**
 * Client plugin body: the dictionaries, the controller, and the drawer seat.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-attention-inbox: dictionaries');
    const inbox = new AttentionInboxController(ctx);
    ctx.slots.inject('workbench.drawer.inbox', () => ctx.slots.register({
        name: 'workbench.drawer.inbox',
        locale: NS,
        inject: () => ({
            hooks: { inbox: inbox.store },
            refresh: () => { void inbox.refresh(); },
            confirm: (targets) => { void inbox.confirm(targets); },
            decide: (itemId, decision) => {
                const item = inbox.store.getSnapshot().items.find(row => String(row.itemId) === itemId);
                if (item !== undefined)
                    void inbox.decide(item, decision);
            },
        }),
    }, AttentionInboxAction));
}
//# sourceMappingURL=index.js.map