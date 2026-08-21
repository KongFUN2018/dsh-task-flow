/**
 * Task-creation wizard, browser half: one `workbench.drawer.create` seat
 * filling the drawer's create tab with the three-column new-task panel.
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { TaskCreateController } from './create.ts'
import { TaskCreateAction } from './TaskCreateAction.tsx'
import { en, NS, zh, type UiTaskCreateKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'uiTaskCreate': UiTaskCreateKey
  }
}

export const inject = ['slots', 'remote', 'remote.recipes', 'remote.tasks', 'remote.taskPolish', 'locale']

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-task-create: dictionaries')
  const controller = new TaskCreateController(ctx)
  ctx.slots.inject('workbench.drawer.create', () => ctx.slots.register({
    name: 'workbench.drawer.create',
    locale: NS,
    inject: () => ({
      hooks: {
        create: controller.store,
        // Real workspace candidates ride the harness standard `useWorkspaces`
        // feed (GlobalStandardProps); no custom workspace hook needed.
      },
      refresh: () => { void controller.refresh() },
      create: (recipeId: string, workspaceId: string, goal: string) => controller.create(recipeId, workspaceId, 'workbench-ui', goal),
      polish: (goal: string) => controller.polish(goal),
    }),
  }, TaskCreateAction))
}
