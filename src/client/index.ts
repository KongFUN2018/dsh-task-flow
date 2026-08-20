/**
 * Task-flow client plugin, browser half: aggregates the nine folded
 * client-ui feature domains (drawer shell + eight drawer contents +
 * the toolview create-confirm) into one `dsh.client` contribution mounted by
 * the DSH web shell through this package's `dsh.client` declaration.
 *
 * Beyond aggregation, this half owns its Remote ground-truth: the published
 * `@deepseek-ai/dsh-api-remotes` peer selects only the official Host
 * namespaces and does NOT mount the task-flow domains (`tasks`, `recipes`,
 * `workbenchHost`, `workbenchHostStream`, `deliverables`, `digest`, `metrics`,
 * `rewind` — they only exist in this package's fork lineage). So this plugin
 * `$mount`s the folded generated `remote/*` contributions itself, which
 * registers each namespace as an injectable `remote.<namespace>` client
 * service and makes `ctx.remote.<namespace>.<method>()` callable from the
 * features. It then registers each folded domain into its declared seat
 * (`sidebar.footer.action` trigger + `shell.overlay` drawer + the
 * `workbench.drawer.*` content seats + `tool.call.toolview`).
 *
 * @module @kongfun2018/dsh-task-flow/client
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: replays the task-flow Host Remote namespace maps and the forwarded
// `task/updated` / `workbench/attention-updated` event selection into this
// client compilation program (the peer api-remotes only carries the official
// namespaces). Mirrors how api-remotes/client pulls its own /remote faces.
import type {} from './remotes.ts'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-ui-tool/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import { taskFlowRemoteContributions } from './remotes-mount.ts'
import { apply as applyWorkbenchDrawer } from '../client-ui/workbench-drawer/client/index.ts'
import { apply as applyAttentionInbox } from '../client-ui/attention-inbox/client/index.ts'
import { apply as applyClarifications } from '../client-ui/clarifications/client/index.ts'
import { apply as applyRecipeLibrary } from '../client-ui/recipe-library/client/index.ts'
import { apply as applyTaskBoard } from '../client-ui/task-board/client/index.ts'
import { apply as applyTaskCreate } from '../client-ui/task-create/client/index.ts'
import { apply as applyTaskCreateConfirm } from '../client-ui/task-create-confirm/client/index.ts'
import { apply as applyTaskDetail } from '../client-ui/task-detail/client/index.ts'
import { apply as applyTaskList } from '../client-ui/task-list/client/index.ts'

/**
 * Required services across this assembly: the slot system, locale, and the
 * base `remote` carrier onto which this plugin mounts the task-flow
 * namespaces. The `remote.<namespace>` sub-services are created by `$mount`
 * inside `apply`, so they must not appear here — a plugin cannot await a
 * service its own `apply` provides.
 */
export const inject = ['slots', 'locale', 'remote']

/**
 * Mount the task-flow Host Remote contributions, then every client feature.
 * @param ctx - Client Cordis root carrying the typed API service.
 * @returns disposer reversing the mounts (feature registrations dispose with
 * the plugin fiber).
 */
export async function apply(ctx: ClientContext): Promise<() => Promise<void>> {
  const disposers: Array<() => Promise<void>> = []
  try {
    for (const contribution of taskFlowRemoteContributions) {
      disposers.push(await ctx.remote.$mount(contribution))
    }
  } catch (error) {
    for (const dispose of disposers.reverse()) await dispose()
    throw error
  }
  // Feature registration happens after the namespaces are live, so every
  // `ctx.remote.<namespace>` read inside a controller resolves.
  applyWorkbenchDrawer(ctx)
  applyAttentionInbox(ctx)
  applyClarifications(ctx)
  applyRecipeLibrary(ctx)
  applyTaskBoard(ctx)
  applyTaskCreate(ctx)
  applyTaskCreateConfirm(ctx)
  applyTaskDetail(ctx)
  applyTaskList(ctx)
  return async () => {
    for (const dispose of disposers.reverse()) await dispose()
  }
}
