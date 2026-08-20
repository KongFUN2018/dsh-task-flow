/**
 * Task-flow client plugin, browser half: aggregates the nine folded
 * client-ui feature domains (drawer shell + eight drawer contents +
 * the toolview create-confirm) into one `dsh.client` contribution mounted by
 * the DSH web shell through this package's `dsh.client` declaration.
 *
 * Remote ground-truth: the published `@deepseek-ai/dsh-api-remotes` peer only
 * mounts the official Host namespaces and never the task-flow domains
 * (`tasks`, `recipes`, `workbenchHost`, `workbenchHostStream`, `deliverables`,
 * `digest`, `metrics`, `rewind` — they exist only in this fork lineage). So
 * this plugin `$mount`s the folded generated `remote/*` contributions itself.
 *
 * Cordis constraint this satisfies: a plugin cannot inject a service its own
 * `apply` provides, and the feature domains read `ctx.remote.<namespace>` which
 * Cordis's property guard requires to be declared in `inject`. Because the
 * namespaces are provided here, each feature domain is therefore spawned as a
 * child plugin carrying its own `inject` (including the `remote.<namespace>` it
 * reads), and the mount runs first so those injects resolve before any feature
 * activates.
 *
 * @module @kongfun2018/dsh-task-flow/client
 */
import type { Context } from '@deepseek-ai/cordis'
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
 * Required services this aggregate needs directly: the slot system, locale, and
 * the base `remote` carrier onto which the namespaces are mounted. The
 * `remote.<namespace>` sub-services are provided by the mount child plugin, so
 * they are intentionally NOT here (a plugin cannot inject a service it
 * provides) — the feature child plugins declare them.
 */
export const inject = ['slots', 'locale', 'remote']

/** One folded feature domain wrapped as a child plugin with its real inject. */
interface FeaturePlugin {
  readonly id: string
  readonly inject: readonly string[]
  readonly apply: (ctx: ClientContext) => void
}

/** The nine feature domains, each with the `remote.*` declarations it reads. */
const FEATURES: readonly FeaturePlugin[] = [
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
]

/** The mount child plugin: mounts every task-flow namespace before features run. */
const REMOTE_MOUNT_PLUGIN = {
  name: 'dsh-task-flow-remotes',
  inject: ['remote'],
  async apply(ctx: ClientContext): Promise<() => Promise<void>> {
    const disposers: Array<() => Promise<void>> = []
    try {
      for (const contribution of taskFlowRemoteContributions) {
        disposers.push(await ctx.remote.$mount(contribution))
      }
    } catch (error) {
      for (const dispose of disposers.reverse()) await dispose()
      throw error
    }
    return async () => {
      for (const dispose of disposers.reverse()) await dispose()
    }
  },
}

/**
 * Mount the task-flow Host Remote contributions, then activate every feature
 * domain as a child plugin (each injects the `remote.<ns>` it reads).
 * @param ctx - Client Cordis root carrying the typed API carrier.
 * @returns disposer for the mount child plugin; feature child plugins dispose
 * with this plugin's fiber.
 */
export async function apply(ctx: Context): Promise<() => Promise<void>> {
  // The mount registers `remote.*` services on the shared ctx; awaiting it
  // guarantees the namespace services exist before feature injects resolve.
  const mount = await ctx.plugin(REMOTE_MOUNT_PLUGIN)
  await mount.await()
  for (const feature of FEATURES) {
    await ctx.plugin({
      name: feature.id,
      inject: [...feature.inject],
      apply: feature.apply,
    }).await()
  }
  return async () => { /* feature fibers dispose with this plugin; nothing more */ }
}
