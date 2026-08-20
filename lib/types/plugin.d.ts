/**
 * Unified host-half assembly plugin (`dsh-task-flow-host`): the single Cordis
 * plugin `dsh web` mounts to activate the whole folded task-flow host
 * subsystem. It registers every folded domain in the official base-bundle
 * load order (`cordis.patch.yml` works sequence) via `ctx.plugin`, so the
 * eight browser-routable namespaces that the client half reaches through
 * `ctx.remote.*` — tasks, recipes, workbenchHost, workbenchHostStream,
 * deliverables, digest, metrics, rewind — are backed by live host services
 * under this plugin's context.
 *
 * Loader form is a dead line: `dsh web` unwraps a package's main with
 * `exports.default ?? exports`, so any default export collapses the module
 * and drops the `name`/`inject`/`apply` this plugin must expose. This module
 * therefore has NO default export; it is a named `name`/`inject`/`apply`
 * function-plugin shape exactly like `tool-task-create`.
 * @module @kongfun2018/dsh-task-flow/host
 */
import { Context } from '@deepseek-ai/cordis';
/** Plugin display name: the `dsh web` fiber identity on the mounted host. */
export declare const name = "dsh-task-flow-host";
/**
 * External platform services the folded domains require; the host provides
 * them (never this package). Declaring them on the outer plugin keeps it
 * PENDING until the host exposes all of them, so every `ctx.plugin(...)`
 * below resolves without a dangling service probe.
 */
export declare const inject: string[];
/**
 * Activate the whole folded task-flow host subsystem.
 *
 * Every domain is registered with `ctx.plugin` in the official base-bundle
 * sequence, then each fiber is awaited in {@link LOAD_ORDER} so its injected
 * providers are ACTIVE first. Awaiting surfaces any startup (config or inject)
 * error; a fiber whose dependencies are not yet satisfied stays PENDING, so
 * the explicit topological await order prevents a service from appearing
 * before the domains it consumes.
 * @param ctx - host context carrying the declared external services.
 */
export declare function apply(ctx: Context): Promise<void>;
//# sourceMappingURL=plugin.d.ts.map