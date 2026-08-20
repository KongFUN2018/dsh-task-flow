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

// Gate domain (folded from packages/task-flow/gate); depends on task, recipe,
// attention, and review-policy domains.
export * from './gate/index.ts'
export { default as GateService } from './gate/index.ts'

// Recipe-engine-core domain (folded from packages/task-flow/recipe-engine-core);
// depends on task, recipe, and workbench-journal domains plus published
// @deepseek-ai agent/goal/llm/session/storage-domain peers.
export * from './recipe-engine-core/index.ts'
export { default as RecipeEngineCore } from './recipe-engine-core/index.ts'

// Recipe-multiphase domain (folded from packages/task-flow/recipe-multiphase);
// depends on the folded recipe-engine-core domain.
export * from './recipe-multiphase/index.ts'
export { default as RecipeMultiphaseService } from './recipe-multiphase/index.ts'

// Clarification domain (folded from packages/task-flow/clarification);
// depends on task, attention, and workbench-journal domains plus published
// @deepseek-ai llm/session/storage-domain/typert-protocol/brand peers.
export * from './clarification/index.ts'
export { default as ClarificationService } from './clarification/index.ts'

// Rewind domain (folded from packages/task-flow/rewind); depends on task,
// attention, deliverable, and workbench-journal domains plus published
// @deepseek-ai typert-protocol peers.
export * from './rewind/index.ts'
export { default as RewindService } from './rewind/index.ts'

// Budget domain (folded from packages/task-flow/budget); depends on task,
// attention, and workbench-journal domains plus published
// @deepseek-ai storage-domain/typert-protocol/brand peers.
export * from './budget/index.ts'
export { default as BudgetService } from './budget/index.ts'

// Digest domain (folded from packages/task-flow/digest); depends on task,
// deliverable, and workbench-journal domains plus published
// @deepseek-ai typert-protocol peers.
export * from './digest/index.ts'
export { default as DigestService } from './digest/index.ts'

// Workbench host domain (folded from packages/task-flow/workbench-host);
// depends on attention and workbench-journal domains plus published
// @deepseek-ai typert-protocol/brand peers. The types AttentionItemKind,
// DecisionOutcome, and InvalidateOutcome already exist on the attention domain
// (folded earlier and the canonical owner), so they are intentionally not
// re-exported from workbench-host to avoid the aggregate name collision.
export {
  WorkbenchItemId,
  WorkbenchHostService,
  AttentionItemStatus,
  AttentionItemView,
  WorkbenchSnapshot,
  BatchConfirmItem,
  BatchConfirmOutcome,
  BatchConfirmItemResult,
  BatchConfirmRequest,
  BatchConfirmResponse,
  ResolveDecisionRequest,
  ResolveDecisionResponse,
  InvalidateItemRequest,
  InvalidateItemResponse,
  WorkbenchAttentionUpdate,
} from './workbench/host/index.ts'
