/**
 * Task board plugin, browser half: one `workbench.drawer.tasks` entry
 * filling the drawer's task-list tab. All task data lives in the
 * React-free controller (`board.ts`): a full-list load over the tasks
 * Remote, revision-gated folds of forwarded `task/updated` deliveries, and
 * the pause/resume/cancel verbs carrying each row's compare-and-set
 * revision. The component sees only the store snapshot and callbacks
 * through the inject face; a reconnect or failed verb resyncs from the
 * Remote (the host projection stays authoritative).
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the generated tasks Remote namespace and the forwarded-event
// key face into this compilation program.
import type {} from '@deepseek-ai/dsh-api-remotes/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { TaskBoardController } from './board.ts'
import { TaskBoardAction } from './TaskBoardAction.tsx'
import { en, NS, zh, type TaskBoardKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The task board's copy. */
    'taskBoard': TaskBoardKey
  }
}

/** Required services for the drawer seat, the tasks Remote, and copy. */
export const inject = ['slots', 'remote', 'remote.tasks', 'remote.metrics', 'locale']

/**
 * Client plugin body: the dictionaries, the controller, and the drawer seat.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-task-board: dictionaries')
  const board = new TaskBoardController(ctx)
  ctx.slots.inject('workbench.drawer.tasks', () => ctx.slots.register({
    name: 'workbench.drawer.tasks',
    locale: NS,
    inject: () => ({
      hooks: { board: board.store },
      refresh: () => board.refresh(),
    }),
  }, TaskBoardAction))
}
