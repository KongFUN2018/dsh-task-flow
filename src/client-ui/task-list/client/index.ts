/**
 * Task list plugin, browser half: one `workbench.drawer.taskList` entry
 * filling the drawer's focused task-list tab. All task data lives in the
 * React-free controller (`taskList.ts`): a full-list load over the tasks
 * Remote, revision-gated folds of forwarded `task/updated` deliveries, and
 * the pause/resume/cancel verbs carrying each row's compare-and-set revision.
 * The component sees only the store snapshot and callbacks through the inject
 * face; a reconnect or failed verb resyncs from the Remote (the host
 * projection stays authoritative). Same task data as the board, without the
 * KPI counts and charts.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the generated tasks Remote namespace and the forwarded-event
// key face into this compilation program.
import type {} from '@deepseek-ai/dsh-api-remotes/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { TaskListController, type TaskListVerb } from './taskList.ts'
import { TaskListAction } from './TaskListAction.tsx'
import { en, NS, zh, type TaskListKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The task list's copy. */
    'taskList': TaskListKey
  }
}

/** Required services for the drawer seat, the tasks Remote, and copy. */
export const inject = ['slots', 'remote', 'remote.tasks', 'locale']

/**
 * Client plugin body: the dictionaries, the controller, and the drawer seat.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-task-list: dictionaries')
  const ctl = new TaskListController(ctx)
  ctx.slots.inject('workbench.drawer.taskList', () => ctx.slots.register({
    name: 'workbench.drawer.taskList',
    locale: NS,
    inject: () => ({
      hooks: { list: ctl.store },
      refresh: () => ctl.refresh(),
      command: (taskId: string, verb: TaskListVerb) => { void ctl.command(taskId, verb) },
    }),
  }, TaskListAction))
}
