import { taskFlowRemoteContributions } from "./remotes-mount.js";
import { apply as applyWorkbenchDrawer } from "../client-ui/workbench-drawer/client/index.js";
import { apply as applyAttentionInbox } from "../client-ui/attention-inbox/client/index.js";
import { apply as applyClarifications } from "../client-ui/clarifications/client/index.js";
import { apply as applyRecipeLibrary } from "../client-ui/recipe-library/client/index.js";
import { apply as applyTaskBoard } from "../client-ui/task-board/client/index.js";
import { apply as applyTaskCreate } from "../client-ui/task-create/client/index.js";
import { apply as applyTaskCreateConfirm } from "../client-ui/task-create-confirm/client/index.js";
import { apply as applyTaskDetail } from "../client-ui/task-detail/client/index.js";
import { apply as applyTaskList } from "../client-ui/task-list/client/index.js";
/**
 * Required services across this assembly: the slot system, locale, and the
 * base `remote` carrier onto which this plugin mounts the task-flow
 * namespaces. The `remote.<namespace>` sub-services are created by `$mount`
 * inside `apply`, so they must not appear here — a plugin cannot await a
 * service its own `apply` provides.
 */
export const inject = ['slots', 'locale', 'remote'];
/**
 * Mount the task-flow Host Remote contributions, then every client feature.
 * @param ctx - Client Cordis root carrying the typed API service.
 * @returns disposer reversing the mounts (feature registrations dispose with
 * the plugin fiber).
 */
export async function apply(ctx) {
    const disposers = [];
    try {
        for (const contribution of taskFlowRemoteContributions) {
            disposers.push(await ctx.remote.$mount(contribution));
        }
    }
    catch (error) {
        for (const dispose of disposers.reverse())
            await dispose();
        throw error;
    }
    // Feature registration happens after the namespaces are live, so every
    // `ctx.remote.<namespace>` read inside a controller resolves.
    applyWorkbenchDrawer(ctx);
    applyAttentionInbox(ctx);
    applyClarifications(ctx);
    applyRecipeLibrary(ctx);
    applyTaskBoard(ctx);
    applyTaskCreate(ctx);
    applyTaskCreateConfirm(ctx);
    applyTaskDetail(ctx);
    applyTaskList(ctx);
    return async () => {
        for (const dispose of disposers.reverse())
            await dispose();
    };
}
//# sourceMappingURL=index.js.map