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
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/**
 * Required services across this assembly: the slot system, locale, and the
 * base `remote` carrier onto which this plugin mounts the task-flow
 * namespaces. The `remote.<namespace>` sub-services are created by `$mount`
 * inside `apply`, so they must not appear here — a plugin cannot await a
 * service its own `apply` provides.
 */
export declare const inject: string[];
/**
 * Mount the task-flow Host Remote contributions, then every client feature.
 * @param ctx - Client Cordis root carrying the typed API service.
 * @returns disposer reversing the mounts (feature registrations dispose with
 * the plugin fiber).
 */
export declare function apply(ctx: ClientContext): Promise<() => Promise<void>>;
//# sourceMappingURL=index.d.ts.map