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
// Task domain (folded from packages/task-flow/task). Its only intra-fold
// dependency is recipe, rewritten to relative ../recipe imports.
export * from "./task/index.js";
export { default as TaskHandle } from "./task/index.js";
// Workbench journal domain (folded from packages/task-flow/workbench-journal),
// base of the workbench group; depends only on the folded task domain.
export * from "./workbench/journal/index.js";
export { default as WorkbenchJournalService } from "./workbench/journal/index.js";
// Attention domain (folded from packages/task-flow/attention); depends on the
// folded task + workbench-journal domains.
export * from "./attention/index.js";
export { default as AttentionService } from "./attention/index.js";
// Deliverable domain (folded from packages/task-flow/deliverable-local);
// depends on task + workbench-journal. The branded DeliverableId /
// DeliverableVersionId constructors are already exported by the task domain
// (identical branded types), so they are intentionally not re-exported from
// deliverable — that avoids the aggregate name collision.
export { ImpactSnapshotId, deliverableLocalDomainSpec, deliverableVersionSchema, phaseInputsSchema, DeliverableError, DeliverableService, } from "./deliverable/index.js";
// Review-policy domain (folded from packages/task-flow/review-policy);
// depends on task + attention + workbench-journal.
export * from "./review-policy/index.js";
export { default as ReviewPolicyService } from "./review-policy/index.js";
// Gate domain (folded from packages/task-flow/gate); depends on task, recipe,
// attention, and review-policy domains.
export * from "./gate/index.js";
export { default as GateService } from "./gate/index.js";
// Recipe-engine-core domain (folded from packages/task-flow/recipe-engine-core);
// depends on task, recipe, and workbench-journal domains plus published
// @deepseek-ai agent/goal/llm/session/storage-domain peers.
export * from "./recipe-engine-core/index.js";
export { default as RecipeEngineCore } from "./recipe-engine-core/index.js";
// Recipe-multiphase domain (folded from packages/task-flow/recipe-multiphase);
// depends on the folded recipe-engine-core domain.
export * from "./recipe-multiphase/index.js";
export { default as RecipeMultiphaseService } from "./recipe-multiphase/index.js";
//# sourceMappingURL=index.js.map