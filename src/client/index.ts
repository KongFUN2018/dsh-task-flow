/**
 * Task-flow client plugin, browser half: aggregates the nine folded
 * client-ui feature domains (drawer shell + eight drawer contents +
 * the toolview create-confirm) into one `dsh.client` contribution mounted by
 * the DSH web shell through this package's `dsh.client` declaration.
 *
 * Aggregation only: this half registers each domain into its declared seat
 * (`sidebar.footer.action` trigger + `shell.overlay` drawer + the
 * `workbench.drawer.*` content seats + `tool.call.toolview`). It never
 * `$mount`s any Remote — the official `@deepseek-ai/dsh-api-remotes` peer
 * already mounts the task-flow Host namespaces (`tasks`, `recipes`, …), so
 * remounting the folded `remote/*.js` copies would trip the gateway's
 * duplicate-contribution guard.
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
import { apply as applyWorkbenchDrawer } from '../client-ui/workbench-drawer/client/index.ts'
import { apply as applyAttentionInbox } from '../client-ui/attention-inbox/client/index.ts'
import { apply as applyClarifications } from '../client-ui/clarifications/client/index.ts'
import { apply as applyRecipeLibrary } from '../client-ui/recipe-library/client/index.ts'
import { apply as applyTaskBoard } from '../client-ui/task-board/client/index.ts'
import { apply as applyTaskCreate } from '../client-ui/task-create/client/index.ts'
import { apply as applyTaskCreateConfirm } from '../client-ui/task-create-confirm/client/index.ts'
import { apply as applyTaskDetail } from '../client-ui/task-detail/client/index.ts'
import { apply as applyTaskList } from '../client-ui/task-list/client/index.ts'

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
]

/**
 * Mount every task-flow client feature: the drawer shell (footer trigger +
 * overlay), the eight drawer content seats, and the toolview confirmation.
 * Each domain registers itself into its declared seat; the shell's overlay
 * declares the content seats its children consume.
 * @param ctx - Client Cordis root.
 */
export function apply(ctx: ClientContext): void {
  applyWorkbenchDrawer(ctx)
  applyAttentionInbox(ctx)
  applyClarifications(ctx)
  applyRecipeLibrary(ctx)
  applyTaskBoard(ctx)
  applyTaskCreate(ctx)
  applyTaskCreateConfirm(ctx)
  applyTaskDetail(ctx)
  applyTaskList(ctx)
}
