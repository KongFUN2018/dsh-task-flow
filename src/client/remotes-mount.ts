/**
 * Task-flow Host Remote contributions the client half must mount itself.
 *
 * The published `@deepseek-ai/dsh-api-remotes` peer selects only the official
 * Host namespaces and never mounts the task-flow domains, so this assembly
 * owns their Remote ground-truth: importing the folded generated
 * `remote/*` contributions and `$mount`ing each registers the `tasks`,
 * `recipes`, `workbenchHost`, `workbenchHostStream`, `deliverables`, `digest`,
 * `metrics`, and `rewind` client namespaces (`ctx.remote.<ns>.<method>`).
 *
 * Kept apart from the aggregating `index.ts` (which pulls in the React
 * feature domains) so a lightweight node test can assert the mount list
 * without a browser runtime.
 *
 * @module
 */
import deliverablesRemote from '@kongfun2018/dsh-task-flow/remote/deliverables'
import digestRemote from '@kongfun2018/dsh-task-flow/remote/digest'
import metricsRemote from '@kongfun2018/dsh-task-flow/remote/metrics'
import recipeRemote from '@kongfun2018/dsh-task-flow/remote/recipe'
import rewindRemote from '@kongfun2018/dsh-task-flow/remote/rewind'
import tasksRemote from '@kongfun2018/dsh-task-flow/remote/task'
import workbenchRemote from '@kongfun2018/dsh-task-flow/remote/workbench'
import workbenchHostStreamRemote from '@kongfun2018/dsh-task-flow/remote/workbenchHostStream'
import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'

/**
 * The exact task-flow namespace contributions, in a stable order. Iterating
 * this list with `ctx.remote.$mount` makes each namespace a live client
 * service before any feature reads `ctx.remote.<namespace>`.
 */
export const taskFlowRemoteContributions: readonly TypertRemoteContribution[] = [
  recipeRemote,
  tasksRemote,
  deliverablesRemote,
  digestRemote,
  metricsRemote,
  rewindRemote,
  workbenchRemote,
  workbenchHostStreamRemote,
]
