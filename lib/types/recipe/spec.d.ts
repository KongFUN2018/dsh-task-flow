/**
 * The recipe-store storage-domain declaration: one table keyed by the
 * canonical `recipeId#revision` identity holding immutable `RecipeRevision`
 * records, plus a metadata table keyed by `recipeId` that carries the
 * soft-delete (disabled) marker so a recipe can leave the pickable catalogue
 * without breaking pinned reads of a revision an already-running task holds.
 * @module @deepseek-ai/dsh-recipe/spec
 */
import { z } from 'zod';
import type { RecipeRevision } from './types.ts';
/** Durable immutable revision record. */
export declare const recipeRevisionSchema: z.ZodType<RecipeRevision>;
/** Soft-delete marker: a present row means the recipe left the pickable set. */
export declare const recipeMetaSchema: z.ZodObject<{
    recipeId: z.ZodString;
    disabledAt: z.ZodNumber;
}, z.core.$strip>;
/** The recipe-store domain: immutable revisions plus soft-delete metadata. */
export declare const recipeStoreDomainSpec: {
    name: string;
    version: number;
    tables: {
        recipes: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, RecipeRevision>;
        recipe_meta: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, {
            recipeId: string;
            disabledAt: number;
        }>;
    };
};
//# sourceMappingURL=spec.d.ts.map