/**
 * Task-creation confirmation card, browser half: the keyed `tool.call.toolview`
 * renderer for the `task_create` tool. It shows the proposal, the session
 * inheritance toggle, and confirm/cancel; confirm issues createTask through the
 * tasks Remote and flips the card to the created state.
 */
import { TaskCreateProposalView } from "./TaskCreateProposalView.js";
import { en, NS, zh } from "./locales.js";
export const inject = ['slots', 'remote', 'remote.tasks', 'locale'];
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-task-create-confirm: dictionaries');
    ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({
        name: 'tool.call.toolview',
        key: 'task_create',
        locale: NS,
        inject: () => ({
            confirm: (proposal, inherit) => confirmTask(ctx, proposal, inherit),
        }),
    }, TaskCreateProposalView));
}
/** Issue the create through the tasks Remote; the proposal carries the idempotency key. */
async function confirmTask(ctx, proposal, inherit) {
    void inherit;
    const result = await ctx.remote.tasks.createTask(proposal.recipeId, 'default', 'workbench-ui', proposal.idempotencyKey);
    if (!result.ok)
        throw new Error('create failed: ' + result.error.code);
    return String(result.value.taskId);
}
//# sourceMappingURL=index.js.map