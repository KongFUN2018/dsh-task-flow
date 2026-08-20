/**
 * Built-in validation-scenario templates: a small seed set of processing
 * templates registered alongside the empty template so the workbench starts
 * with real, pickable scenarios (需求研发 / 代码审查 / Bug 修复). Each pairs
 * multi-phase steps with representative A/B/C gate checks.
 */
import type { RecipePayload } from './types.ts';
/** 需求研发: collect -> analyze -> PRD, A/B/C gates. */
export declare const REQUIREMENT_RECIPE_ID = "requirement";
export declare const REQUIREMENT_TEMPLATE: RecipePayload;
/** 代码审查: triage -> review -> report, A/B/C gates. */
export declare const CODE_REVIEW_RECIPE_ID = "code-review";
export declare const CODE_REVIEW_TEMPLATE: RecipePayload;
/** Bug 修复: reproduce -> locate -> fix+verify, A/B/C gates. */
export declare const BUGFIX_RECIPE_ID = "bugfix";
export declare const BUGFIX_TEMPLATE: RecipePayload;
//# sourceMappingURL=seed-templates.d.ts.map