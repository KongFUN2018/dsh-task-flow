/**
 * The built-in M1 empty-template revision: one phase, an explicit
 * PhaseSubmission, and a minimal deliverable, per the task-flow overall
 * design. New tasks pin this revision until a filesystem provider registers
 * real recipes.
 */
import type { RecipePayload } from './types.ts';
/** Built-in recipe id the empty template registers under. */
export declare const EMPTY_TEMPLATE_RECIPE_ID = "empty-template";
/** The built-in empty-template payload; see the module contract. */
export declare const EMPTY_TEMPLATE: RecipePayload;
//# sourceMappingURL=empty-template.d.ts.map