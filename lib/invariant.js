//#region lib/types/invariant.js
/**
* Package-owned invariant companion for `@kongfun2018/dsh-task-flow`.
* @module @kongfun2018/dsh-task-flow/invariant
*/
const PACKAGE_NAME = "@kongfun2018/dsh-task-flow";
/** Cordis companion plugin name. */
const name = "task-flow-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant at the single-package fold boundary yet: the recipe
* domain verifies its own content hash on every pinned read, and the
* cross-service event stream a companion could check belongs to the task
* domain, which folds in at a later milestone.
*/
const install = () => {};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
