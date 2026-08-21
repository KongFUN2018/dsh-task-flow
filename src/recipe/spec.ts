/**
 * The recipe-store storage-domain declaration: one table keyed by the
 * canonical `recipeId#revision` identity holding immutable `RecipeRevision`
 * records, plus a metadata table keyed by `recipeId` that carries the
 * soft-delete (disabled) marker so a recipe can leave the pickable catalogue
 * without breaking pinned reads of a revision an already-running task holds.
 * @module @deepseek-ai/dsh-recipe/spec
 */

import { z } from 'zod'
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import type { RecipeRevision } from './types.ts'

/** Wire string branded at the durable boundary. */
const idString = z.string().min(1)

/** Immutable phase spec stored inside a revision payload. */
const phaseSpec = z.object({
  phaseId: idString,
  kind: z.string().min(1),
  goal: z.string(),
  inputs: z.array(z.string()),
  outputs: z.array(z.string()),
  submissionCriteria: z.array(z.string()),
})

/** Immutable gate-check spec store inside a revision payload. */
const gateCheckSpec = z.object({
  checkId: idString,
  phaseId: idString,
  kind: z.enum(['A', 'B', 'C']),
  machineScope: z.array(z.string()),
  humanAction: z.array(z.string()),
  circuitBreaker: z.string().optional(),
})

/** Calibrated per-recipe defaults. */
const defaultsSpec = z.object({
  batchConfirm: z.enum(['per-phase-single', 'per-check']),
  clarify: z.object({
    maxRounds: z.number().int().min(1),
    splitMustDefault: z.boolean(),
  }),
  draftPolicy: z.literal('block-finalize-not-draft'),
})

/** P4 output-mode criteria. */
const p4ModeSpec = z.object({
  mode: z.enum(['auto', 'draft', 'skeleton', 'verify-normalize']),
})

/** Explicit per-key repair fuse. */
const breakerSpec = z.object({
  key: z.string().min(1),
  maxConsecutiveRepairs: z.number().int().min(1),
})

/** Immutable revision payload. */
const recipePayloadSchema = z.object({
  phases: z.array(phaseSpec),
  gateChecks: z.array(gateCheckSpec),
  defaults: defaultsSpec,
  p4Mode: p4ModeSpec,
  breakers: z.array(breakerSpec).optional(),
})

/** Durable immutable revision record. */
export const recipeRevisionSchema = z.object({
  recipeId: idString,
  revision: z.number().int().min(1),
  schemaVersion: z.number().int().min(1),
  contentHash: z.string().min(1),
  payload: recipePayloadSchema,
  registeredAt: z.number().int().min(1),
}) as unknown as z.ZodType<RecipeRevision>

/** Soft-delete marker: a present row means the recipe left the pickable set. */
export const recipeMetaSchema = z.object({
  recipeId: idString,
  /** Epoch ms of the delete. */
  disabledAt: z.number().int().min(1),
})

/** The recipe-store domain: immutable revisions plus soft-delete metadata. */
export const recipeStoreDomainSpec = defineDomain({
  name: 'recipe_store',
  version: 1,
  tables: {
    recipes: domainTable<string, RecipeRevision>(recipeRevisionSchema),
    recipe_meta: domainTable<string, { recipeId: string; disabledAt: number }>(recipeMetaSchema),
  },
})
