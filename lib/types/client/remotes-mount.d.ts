import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol';
/**
 * The exact task-flow namespace contributions, in a stable order. Iterating
 * this list with `ctx.remote.$mount` makes each namespace a live client
 * service before any feature reads `ctx.remote.<namespace>`.
 */
export declare const taskFlowRemoteContributions: readonly TypertRemoteContribution[];
//# sourceMappingURL=remotes-mount.d.ts.map