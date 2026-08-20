/**
 * dsh-task-flow — single-package folding of the Task Flow Recipe Engine's
 * host subsystem.
 * @module @kongfun2018/dsh-task-flow
 */
// Folding proceeds bottom-up. The recipe domain (folded from
// packages/task-flow/recipe) is the P1 seed: it depends only on published
// @deepseek-ai peer packages, so it validates the standalone build pipeline
// before the internal-dep host domains fold in.
export * from "./recipe/index.js";
export { default } from "./recipe/index.js";
//# sourceMappingURL=index.js.map