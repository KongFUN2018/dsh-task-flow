/**
 * Task-creation confirmation card, browser half: the keyed `tool.call.toolview`
 * renderer for the `task_create` tool. It shows the proposal, the session
 * inheritance toggle, and confirm/cancel; confirm issues createTask through the
 * tasks Remote and flips the card to the created state.
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-ui-tool/client'
import type { TaskMutationContext } from '../../../task/types.ts'
import { TaskCreateProposalView, type TaskCreateProposalViewData } from './TaskCreateProposalView.tsx'
import { en, NS, zh, type UiTaskCreateConfirmKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'uiTaskCreateConfirm': UiTaskCreateConfirmKey
  }
}

export const inject = ['slots', 'remote', 'remote.tasks', 'locale']

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-task-create-confirm: dictionaries')
  ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({
    name: 'tool.call.toolview',
    key: 'task_create',
    locale: NS,
    inject: () => ({
      confirm: (proposal: TaskCreateProposalViewData, inherit: boolean) =>
        confirmTask(ctx, proposal, inherit),
    }),
  }, TaskCreateProposalView))
}

/** Issue the create through the tasks Remote, then start it so the engine schedules it. */
async function confirmTask(ctx: ClientContext, proposal: TaskCreateProposalViewData, inherit: boolean): Promise<string> {
  void inherit
  const result = await ctx.remote.tasks.createTask(proposal.recipeId, 'default', 'workbench-ui', proposal.idempotencyKey)
  if (!result.ok) throw new Error('create failed: ' + result.error.code)
  const task = result.value
  // A freshly created task sits in `planning`; the engine only schedules
  // `running` tasks, so start it immediately — otherwise it spins forever.
  const start: TaskMutationContext = {
    actor: 'workbench-ui',
    reason: 'auto-start after create',
    expectedRevision: task.revision,
    idempotencyKey: proposal.idempotencyKey + '-start',
  }
  const started = await ctx.remote.tasks.startTask(String(task.taskId), start)
  if (!started.ok) throw new Error('start failed: ' + started.error.code)
  return String(task.taskId)
}
