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
import type { Context } from '@deepseek-ai/cordis';
/**
 * Required services this aggregate needs directly: the slot system, locale, and
 * the base `remote` carrier onto which the namespaces are mounted. The
 * `remote.<namespace>` sub-services are provided by the mount child plugin, so
 * they are intentionally NOT here (a plugin cannot inject a service it
 * provides) — the feature child plugins declare them.
 */
export declare const inject: string[];
/**
 * Mount the task-flow Host Remote contributions, then activate every feature
 * domain as a child plugin (each injects the `remote.<ns>` it reads).
 * @param ctx - Client Cordis root carrying the typed API carrier.
 * @returns disposer for the mount child plugin; feature child plugins dispose
 * with this plugin's fiber.
 */
export declare function apply(ctx: Context): Promise<() => Promise<void>>;
//# sourceMappingURL=index.d.ts.map