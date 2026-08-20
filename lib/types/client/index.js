import { apply as applyWorkbenchDrawer } from "../client-ui/workbench-drawer/client/index.js";
import { apply as applyAttentionInbox } from "../client-ui/attention-inbox/client/index.js";
import { apply as applyClarifications } from "../client-ui/clarifications/client/index.js";
import { apply as applyRecipeLibrary } from "../client-ui/recipe-library/client/index.js";
import { apply as applyTaskBoard } from "../client-ui/task-board/client/index.js";
import { apply as applyTaskCreate } from "../client-ui/task-create/client/index.js";
import { apply as applyTaskCreateConfirm } from "../client-ui/task-create-confirm/client/index.js";
import { apply as applyTaskDetail } from "../client-ui/task-detail/client/index.js";
import { apply as applyTaskList } from "../client-ui/task-list/client/index.js";
/** Required services across every folded domain's `apply`. */
export const inject = [
    'slots',
    'locale',
    'remote',
    'remote.tasks',
    'remote.metrics',
    'remote.workbenchHost',
    'remote.workbenchHostStream',
    'remote.recipes',
    'remote.digest',
    'remote.rewind',
    'remote.deliverables',
];
/**
 * Mount every task-flow client feature: the drawer shell (footer trigger +
 * overlay), the eight drawer content seats, and the toolview confirmation.
 * Each domain registers itself into its declared seat; the shell's overlay
 * declares the content seats its children consume.
 * @param ctx - Client Cordis root.
 */
export function apply(ctx) {
    applyWorkbenchDrawer(ctx);
    applyAttentionInbox(ctx);
    applyClarifications(ctx);
    applyRecipeLibrary(ctx);
    applyTaskBoard(ctx);
    applyTaskCreate(ctx);
    applyTaskCreateConfirm(ctx);
    applyTaskDetail(ctx);
    applyTaskList(ctx);
}
//# sourceMappingURL=index.js.map