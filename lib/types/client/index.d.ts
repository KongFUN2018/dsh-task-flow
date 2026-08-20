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
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/** Required services across every folded domain's `apply`. */
export declare const inject: string[];
/**
 * Mount every task-flow client feature: the drawer shell (footer trigger +
 * overlay), the eight drawer content seats, and the toolview confirmation.
 * Each domain registers itself into its declared seat; the shell's overlay
 * declares the content seats its children consume.
 * @param ctx - Client Cordis root.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map