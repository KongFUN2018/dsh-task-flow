/**
 * dsh-task-flow — single-package folding of the Task Flow Recipe Engine's
 * host subsystem.
 * @module @kongfun2018/dsh-task-flow
 */

// Folding proceeds bottom-up. The recipe domain (folded from
// packages/task-flow/recipe) is the P1 seed: it depends only on published
// @deepseek-ai peer packages, so it validates the standalone build pipeline
// before the internal-dep host domains fold in.
export * from './recipe/index.ts'
export { default } from './recipe/index.ts'

// Task domain (folded from packages/task-flow/task). Its only intra-fold
// dependency is recipe, rewritten to relative ../recipe imports.
export * from './task/index.ts'
export { default as TaskHandle } from './task/index.ts'

// Workbench journal domain (folded from packages/task-flow/workbench-journal),
// base of the workbench group; depends only on the folded task domain.
export * from './workbench/journal/index.ts'
export { default as WorkbenchJournalService } from './workbench/journal/index.ts'

// Attention domain (folded from packages/task-flow/attention); depends on the
// folded task + workbench-journal domains.
export * from './attention/index.ts'
export { default as AttentionService } from './attention/index.ts'

// Deliverable domain (folded from packages/task-flow/deliverable-local);
// depends on task + workbench-journal. The branded DeliverableId /
// DeliverableVersionId constructors are already exported by the task domain
// (identical branded types), so they are intentionally not re-exported from
// deliverable — that avoids the aggregate name collision.
export {
  ImpactSnapshotId,
  deliverableLocalDomainSpec,
  deliverableVersionSchema,
  phaseInputsSchema,
  DeliverableError,
  DeliverableService,
} from './deliverable/index.ts'

// Review-policy domain (folded from packages/task-flow/review-policy);
// depends on task + attention + workbench-journal.
export * from './review-policy/index.ts'
export { default as ReviewPolicyService } from './review-policy/index.ts'
