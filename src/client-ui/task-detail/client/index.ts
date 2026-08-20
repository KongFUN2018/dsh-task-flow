/**
 * Task detail plugin, browser half: one `workbench.drawer.detail` entry
 * filling the drawer's detail tab. All task data lives in the React-free
 * controller (`detail.ts`): an on-demand load of one task projection, its
 * phase runs, and the gate verdicts of each active submission through the
 * tasks Remote. The component sees only the store snapshot and the load
 * callback through the inject face; the owner's `taskId` share drives what
 * loads.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the generated tasks Remote namespace into this compilation program.
import type {} from '@deepseek-ai/dsh-api-remotes/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { TaskDetailController } from './detail.ts'
import { TaskDetailAction } from './TaskDetailAction.tsx'
import { en, NS, zh, type TaskDetailKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The task detail's copy. */
    'taskDetail': TaskDetailKey
  }
}

/** Required services for the drawer seat, the task/digest/rewind/deliverables Remotes, and copy. */
export const inject = ['slots', 'remote', 'remote.tasks', 'remote.digest', 'remote.rewind', 'remote.deliverables', 'locale']

/**
 * Client plugin body: the dictionaries, the controller, and the drawer seat.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-task-detail: dictionaries')
  const detail = new TaskDetailController(ctx)
  ctx.slots.inject('workbench.drawer.detail', () => ctx.slots.register({
    name: 'workbench.drawer.detail',
    locale: NS,
    inject: () => ({
      hooks: { detail: detail.store },
      load: (taskId: string) => { void detail.load(taskId) },
      // Wire the detail's rewind action to the host service: request the
      // impact-closure preview as a blocking attention decision item, then
      // unwrap the RemoteResult into the plain preview the component renders.
      requestRewind: async (taskId: string, roots: string[], actor: string, idemKey: string) => {
        const result = await ctx.remote.rewind.requestRewind(taskId, roots, actor, idemKey)
        if (!result.ok) throw Object.assign(new Error(result.error.message), { code: result.error.code })
        return result.value
      },
      // The patch flow: re-submit a superseding revision carrying the human
      // correction note; the host derives all provenance from the active
      // submission. Unwrap the RemoteResult into the stored submission.
      requestPatch: async (taskId: string, phaseRunId: string, note: string, actor: string, idemKey: string) => {
        const result = await ctx.remote.tasks.requestPatch(taskId, phaseRunId, note, { actor, reason: 'workbench-detail patch', expectedRevision: -1, idempotencyKey: idemKey })
        if (!result.ok) throw Object.assign(new Error(result.error.message), { code: result.error.code })
        return result.value
      },
    }),
  }, TaskDetailAction))
}
