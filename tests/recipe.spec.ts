import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import RecipeRegistry, {
  BUGFIX_RECIPE_ID,
  CODE_REVIEW_RECIPE_ID,
  EMPTY_TEMPLATE,
  EMPTY_TEMPLATE_RECIPE_ID,
  REQUIREMENT_RECIPE_ID,
  RecipeId,
  hashRecipePayload,
  validateRecipePayload,
  verifyRecipeHash,
} from '../src/recipe/index.ts'
import { RecipeError } from '../src/recipe/types.ts'
import type { RecipePayload, RecipePhaseSpec, RecipeRevision } from '../src/recipe/types.ts'
import { FROZEN_RECIPE } from './fixtures/frozen-recipe.ts'

const valid = (over: Partial<RecipePayload> = {}): RecipePayload => ({
  ...EMPTY_TEMPLATE,
  ...over,
})

/** Malformed-input helper: overrides may violate the payload type on purpose. */
const malformed = (over: object): RecipePayload => ({ ...EMPTY_TEMPLATE, ...over })

describe('recipe payload validation', () => {
  it('accepts the built-in empty template and the frozen §6 recipe', () => {
    expect(validateRecipePayload(EMPTY_TEMPLATE)).toEqual([])
    expect(validateRecipePayload(FROZEN_RECIPE)).toEqual([])
  })

  it('reports duplicate phase ids, unknown check phases, and duplicate check ids', () => {
    const problems = validateRecipePayload(valid({
      phases: [
        EMPTY_TEMPLATE.phases[0] as never,
        EMPTY_TEMPLATE.phases[0] as never,
      ],
      gateChecks: [
        { checkId: 'a', phaseId: 'main', kind: 'A', machineScope: [], humanAction: [] },
        { checkId: 'a', phaseId: 'main', kind: 'A', machineScope: [], humanAction: [] },
        { checkId: 'b', phaseId: 'ghost', kind: 'A', machineScope: [], humanAction: [] },
      ],
    }))
    expect(problems).toContain('duplicate phaseId "main"')
    expect(problems).toContain('duplicate checkId "a"')
    expect(problems).toContain('check "b" names unknown phaseId "ghost"')
  })

  it('reports empty phases, missing defaults, and malformed defaults fields', () => {
    expect(validateRecipePayload(valid({ phases: [] }))).toContain('payload requires at least one phase')
    expect(validateRecipePayload(malformed({ defaults: undefined }))).toContain('payload requires defaults')
    expect(validateRecipePayload(valid({
      defaults: { batchConfirm: 'per-check', clarify: { maxRounds: 0, splitMustDefault: true }, draftPolicy: 'block-finalize-not-draft' },
    }))).toContain('defaults.clarify.maxRounds must be a positive safe integer')
    expect(validateRecipePayload(valid({
      defaults: { batchConfirm: 'per-check', clarify: { maxRounds: 2, splitMustDefault: 'yes' as never }, draftPolicy: 'block-finalize-not-draft' },
    }))).toContain('defaults.clarify.splitMustDefault must be boolean')
    expect(validateRecipePayload(valid({
      defaults: { batchConfirm: 'per-epoch' as never, clarify: { maxRounds: 2, splitMustDefault: true }, draftPolicy: 'block-finalize-not-draft' },
    }))).toContain('defaults.batchConfirm must be per-phase-single or per-check')
    expect(validateRecipePayload(valid({
      defaults: { batchConfirm: 'per-check', clarify: { maxRounds: 2, splitMustDefault: true }, draftPolicy: 'finalize-anyway' as never },
    }))).toContain('defaults.draftPolicy must be block-finalize-not-draft')
  })
})

describe('recipe hash verification', () => {
  it('hashes deterministically and detects a drifted payload', () => {
    const hash = hashRecipePayload(EMPTY_TEMPLATE)
    expect(hash).toBe(hashRecipePayload(EMPTY_TEMPLATE))
    const stored: RecipeRevision = {
      recipeId: RecipeId('x'),
      revision: 1,
      schemaVersion: 1,
      contentHash: hash,
      payload: EMPTY_TEMPLATE,
      registeredAt: 0,
    }
    expect(() => { verifyRecipeHash(stored) }).not.toThrow()
    const drifted: RecipeRevision = {
      ...stored,
      payload: { ...EMPTY_TEMPLATE, phases: [] },
    }
    expect(() => { verifyRecipeHash(drifted) }).toThrow(/failed its content-hash check/)
  })
})

describe('recipe registry', () => {
  it('registers the built-in empty template and validation scenarios at boot', () => {
    const registry = new RecipeRegistry(new Context())
    expect(registry.list()).toEqual([
      { recipeId: EMPTY_TEMPLATE_RECIPE_ID, revision: 1 },
      { recipeId: REQUIREMENT_RECIPE_ID, revision: 1 },
      { recipeId: CODE_REVIEW_RECIPE_ID, revision: 1 },
      { recipeId: BUGFIX_RECIPE_ID, revision: 1 },
    ])
    const pinned = registry.getPinned({ recipeId: RecipeId(EMPTY_TEMPLATE_RECIPE_ID), revision: 1 })
    expect(pinned.payload).toEqual(EMPTY_TEMPLATE)
    expect(pinned.schemaVersion).toBe(1)
    expect(registry.latest(EMPTY_TEMPLATE_RECIPE_ID)?.revision).toBe(1)
  })

  it('registers, lists, and resolves the highest revision', () => {
    const registry = new RecipeRegistry(new Context())
    registry.register('demo', 2, FROZEN_RECIPE)
    registry.register('demo', 1, EMPTY_TEMPLATE)
    expect(registry.latest('demo')?.revision).toBe(2)
    expect(registry.latest('ghost')).toBeUndefined()
    expect(registry.getPinned({ recipeId: RecipeId('demo'), revision: 1 }).payload).toEqual(EMPTY_TEMPLATE)
  })

  it('is idempotent for the same payload and rejects a different payload on a taken identity', () => {
    const registry = new RecipeRegistry(new Context())
    const first = registry.register('demo', 1, FROZEN_RECIPE)
    const again = registry.register('demo', 1, FROZEN_RECIPE)
    expect(again).toBe(first)
    expect(() => registry.register('demo', 1, EMPTY_TEMPLATE)).toThrow(RecipeError)
    try {
      registry.register('demo', 1, EMPTY_TEMPLATE)
    } catch (error) {
      expect((error as RecipeError).code).toBe('duplicate-revision')
    }
  })

  it('normalizes padded recipe ids to one canonical identity', () => {
    const registry = new RecipeRegistry(new Context())
    const padded = registry.register('  demo  ', 1, FROZEN_RECIPE)
    expect(registry.getPinned({ recipeId: RecipeId('demo'), revision: 1 })).toBe(padded)
    expect(registry.getPinned({ recipeId: RecipeId('  demo  '), revision: 1 })).toBe(padded)
    expect(registry.latest(' demo ')?.revision).toBe(1)
    expect(registry.list()).toEqual([
      { recipeId: EMPTY_TEMPLATE_RECIPE_ID, revision: 1 },
      { recipeId: REQUIREMENT_RECIPE_ID, revision: 1 },
      { recipeId: CODE_REVIEW_RECIPE_ID, revision: 1 },
      { recipeId: BUGFIX_RECIPE_ID, revision: 1 },
      { recipeId: RecipeId('demo'), revision: 1 },
    ])
    // The trimmed spelling addresses the same stored revision: same payload is
    // idempotent, a different payload is rejected as a taken identity.
    expect(registry.register('demo', 1, FROZEN_RECIPE)).toBe(padded)
    expect(() => registry.register('demo', 1, EMPTY_TEMPLATE)).toThrow(/taken by a different payload/)
  })

  it('rejects malformed wire inputs loudly', () => {
    const registry = new RecipeRegistry(new Context())
    expect(() => registry.register(' ', 1, EMPTY_TEMPLATE)).toThrow(/recipeId/)
    expect(() => registry.register('demo', 0, EMPTY_TEMPLATE)).toThrow(/revision/)
    expect(() => registry.register('demo', 1, valid({ phases: [] }))).toThrow(/problem/)
    expect(() => registry.getPinned({ recipeId: RecipeId('ghost'), revision: 1 })).toThrow(/not registered/)
  })

  it('keeps stored revisions immune to post-register caller mutation', () => {
    const registry = new RecipeRegistry(new Context())
    const payload = valid({})
    registry.register('demo', 1, payload)
    ;(payload.phases as RecipePhaseSpec[]).push(EMPTY_TEMPLATE.phases[0] as RecipePhaseSpec)
    const pinned = registry.getPinned({ recipeId: RecipeId('demo'), revision: 1 })
    expect(pinned.payload.phases).toHaveLength(1)
  })
})
