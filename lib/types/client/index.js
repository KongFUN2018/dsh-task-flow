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
 * Required services this aggregate needs directly: the slot system, locale, and
 * the base `remote` carrier onto which the namespaces are mounted. The
 * `remote.<namespace>` sub-services are provided by the mount child plugin, so
 * they are intentionally NOT here (a plugin cannot inject a service it
 * provides) — the feature child plugins declare them.
 */
export const inject = ['slots', 'locale', 'remote'];
/** The nine feature domains, each with the `remote.*` declarations it reads. */
const FEATURES = [
    {
        id: 'ui-workbench-drawer',
        inject: ['slots', 'remote', 'remote.workbenchHost', 'remote.tasks', 'locale'],
        apply: applyWorkbenchDrawer,
    },
    {
        id: 'ui-attention-inbox',
        inject: ['slots', 'remote', 'remote.workbenchHost', 'remote.workbenchHostStream', 'locale'],
        apply: applyAttentionInbox,
    },
    {
        id: 'ui-clarifications',
        inject: ['slots', 'remote', 'remote.workbenchHost', 'locale'],
        apply: applyClarifications,
    },
    {
        id: 'ui-recipe-library',
        inject: ['slots', 'remote', 'remote.recipes', 'locale'],
        apply: applyRecipeLibrary,
    },
    {
        id: 'ui-task-board',
        inject: ['slots', 'remote', 'remote.tasks', 'remote.metrics', 'locale'],
        apply: applyTaskBoard,
    },
    {
        id: 'ui-task-create',
        inject: ['slots', 'remote', 'remote.recipes', 'remote.tasks', 'locale'],
        apply: applyTaskCreate,
    },
    {
        id: 'ui-task-create-confirm',
        inject: ['slots', 'remote', 'remote.tasks', 'locale'],
        apply: applyTaskCreateConfirm,
    },
    {
        id: 'ui-task-detail',
        inject: ['slots', 'remote', 'remote.tasks', 'remote.digest', 'remote.rewind', 'remote.deliverables', 'locale'],
        apply: applyTaskDetail,
    },
    {
        id: 'ui-task-list',
        inject: ['slots', 'remote', 'remote.tasks', 'locale'],
        apply: applyTaskList,
    },
];
/** The mount child plugin: mounts every task-flow namespace before features run. */
const REMOTE_MOUNT_PLUGIN = {
    name: 'dsh-task-flow-remotes',
    inject: ['remote'],
    async apply(ctx) {
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
        return async () => {
            for (const dispose of disposers.reverse())
                await dispose();
        };
    },
};
/**
 * Mount the task-flow Host Remote contributions, then activate every feature
 * domain as a child plugin (each injects the `remote.<ns>` it reads).
 * @param ctx - Client Cordis root carrying the typed API carrier.
 * @returns disposer for the mount child plugin; feature child plugins dispose
 * with this plugin's fiber.
 */
export async function apply(ctx) {
    // The mount registers `remote.*` services on the shared ctx; awaiting it
    // guarantees the namespace services exist before feature injects resolve.
    const mount = await ctx.plugin(REMOTE_MOUNT_PLUGIN);
    await mount.await();
    for (const feature of FEATURES) {
        await ctx.plugin({
            name: feature.id,
            inject: [...feature.inject],
            apply: feature.apply,
        }).await();
    }
    return async () => { };
}
//# sourceMappingURL=index.js.map