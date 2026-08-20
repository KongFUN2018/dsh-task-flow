import { TaskDetailController } from "./detail.js";
import { TaskDetailAction } from "./TaskDetailAction.js";
import { en, NS, zh } from "./locales.js";
/** Required services for the drawer seat, the task/digest/rewind/deliverables Remotes, and copy. */
export const inject = ['slots', 'remote', 'remote.tasks', 'remote.digest', 'remote.rewind', 'remote.deliverables', 'locale'];
/**
 * Client plugin body: the dictionaries, the controller, and the drawer seat.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-task-detail: dictionaries');
    const detail = new TaskDetailController(ctx);
    ctx.slots.inject('workbench.drawer.detail', () => ctx.slots.register({
        name: 'workbench.drawer.detail',
        locale: NS,
        inject: () => ({
            hooks: { detail: detail.store },
            load: (taskId) => { void detail.load(taskId); },
            // Wire the detail's rewind action to the host service: request the
            // impact-closure preview as a blocking attention decision item, then
            // unwrap the RemoteResult into the plain preview the component renders.
            requestRewind: async (taskId, roots, actor, idemKey) => {
                const result = await ctx.remote.rewind.requestRewind(taskId, roots, actor, idemKey);
                if (!result.ok)
                    throw Object.assign(new Error(result.error.message), { code: result.error.code });
                return result.value;
            },
            // The patch flow: re-submit a superseding revision carrying the human
            // correction note; the host derives all provenance from the active
            // submission. Unwrap the RemoteResult into the stored submission.
            requestPatch: async (taskId, phaseRunId, note, actor, idemKey) => {
                const result = await ctx.remote.tasks.requestPatch(taskId, phaseRunId, note, { actor, reason: 'workbench-detail patch', expectedRevision: -1, idempotencyKey: idemKey });
                if (!result.ok)
                    throw Object.assign(new Error(result.error.message), { code: result.error.code });
                return result.value;
            },
        }),
    }, TaskDetailAction));
}
//# sourceMappingURL=index.js.map