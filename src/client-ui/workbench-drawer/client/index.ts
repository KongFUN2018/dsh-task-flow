/**
 * Workbench drawer plugin, browser half: one `sidebar.footer.action` trigger
 * button (prominent, accent-styled) and one `shell.overlay` drawer panel (right-side,
 * non-modal) that share one declared store for open/tab/detail state and one
 * badge controller. The overlay entry declares the four content seats
 * (`workbench.drawer.tasks` / `.inbox` / `.detail` / `.create`) the
 * task-flow content packages register into. The badge aggregates (open
 * attention count, active task count) live in the React-free controller
 * (`badge.ts`); both components read them through the inject `hooks`
 * compartment, so neither sees the sources.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { BadgeController } from './badge.ts'
import { WorkbenchDrawer } from './WorkbenchDrawer.tsx'
import { WorkbenchTrigger } from './WorkbenchTrigger.tsx'
import { en, NS, zh, type WorkbenchDrawerKey } from './locales.ts'
import { createWorkbenchStore } from './store.ts'
export type { DrawerTasksOwnerProps, DrawerDetailOwnerProps } from './slots.ts'
export type { DrawerTab } from './store.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'workbenchDrawer': WorkbenchDrawerKey
  }
}

/** Required services for both entries and the badge Remotes. */
export const inject = ['slots', 'remote', 'remote.workbenchHost', 'remote.tasks', 'locale']

/**
 * Client plugin body: the dictionaries, the shared store handle, the badge
 * controller, and the two register entries — the sidebar footer action and the
 * overlay drawer — sharing one store handle and one badge source.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-workbench-drawer: dictionaries')
  const badge = new BadgeController(ctx)
  const store = createWorkbenchStore()
  const badgeSource = () => ({ hooks: { badge: badge.store } })

  // Sidebar footer action: a same-level side-bar member, prominent and accent-styled.
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'workbench-drawer-trigger',
    order: 0,
    locale: NS,
    store,
    inject: badgeSource,
  }, WorkbenchTrigger))

  // The drawer panel rides the shell.overlay layer (right-side, non-modal).
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'workbench-drawer',
    order: 100,
    locale: NS,
    store,
    children: {
      'workbench.drawer.tasks': { kind: 'single', scope: 'root' },
      'workbench.drawer.taskList': { kind: 'single', scope: 'root' },
      'workbench.drawer.recipeLibrary': { kind: 'single', scope: 'root' },
      'workbench.drawer.inbox': { kind: 'single', scope: 'root' },
      'workbench.drawer.clarifications': { kind: 'single', scope: 'root' },
      'workbench.drawer.detail': { kind: 'single', scope: 'root' },
      'workbench.drawer.create': { kind: 'single', scope: 'root' },
    },
    inject: badgeSource,
  }, WorkbenchDrawer))
}
