import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import RecipeRegistry, {
  BUGFIX_RECIPE_ID,
  CODE_REVIEW_RECIPE_ID,
  EMPTY_TEMPLATE_RECIPE_ID,
  REQUIREMENT_RECIPE_ID,
  RecipeId,
} from '../src/recipe/index.ts'
import { RecipeError } from '../src/recipe/types.ts'
import { FROZEN_RECIPE } from './fixtures/frozen-recipe.ts'
import { EMPTY_TEMPLATE } from '../src/recipe/empty-template.ts'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import { MemoryMediaPool, MemoryStorageBackend } from './fixtures/memory-backend.ts'

/** Lift a fresh registry without any durable backend (pure M1 in-memory). */
function bare() {
  return new RecipeRegistry(new Context())
}

/** A durable registry over a memory backend; pass a shared pool to simulate a restart (reopen of the same medium). */
async function durable(pool: MemoryMediaPool | undefined = undefined) {
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('memory', new MemoryStorageBackend(pool))
  const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
  ctx.storage.mount('domain', facility)
  ctx.provide('storageDomain', facility)
  await ctx.plugin(RecipeRegistry).await()
  return { ctx, registry: ctx.recipes as RecipeRegistry }
}

describe('recipe catalogue management (create/update/delete)', () => {
  it('createRecipe registers a new family at revision 1 and rejects a taken id', async () => {
    const registry = bare()
    const created = await registry.createRecipe('demo', FROZEN_RECIPE)
    expect(created.revision).toBe(1)
    expect(registry.latest('demo')?.revision).toBe(1)
    await expect(registry.createRecipe('demo', EMPTY_TEMPLATE)).rejects.toThrow(/already exists/)
  })

  it('updateRecipe registers a new immutable revision (latest + 1)', async () => {
    const registry = bare()
    await registry.createRecipe('demo', FROZEN_RECIPE)
    const v2 = await registry.updateRecipe('demo', EMPTY_TEMPLATE)
    expect(v2.revision).toBe(2)
    expect(registry.latest('demo')?.revision).toBe(2)
    // Both revisions stay addressable.
    expect(registry.getPinned({ recipeId: RecipeId('demo'), revision: 1 }).payload).toEqual(FROZEN_RECIPE)
    expect(registry.getPinned({ recipeId: RecipeId('demo'), revision: 2 }).payload).toEqual(EMPTY_TEMPLATE)
  })

  it('deleteRecipe soft-removes the family from the pickable set but keeps pinned reads', async () => {
    const registry = bare()
    await registry.createRecipe('demo', FROZEN_RECIPE)
    expect(await registry.deleteRecipe('demo')).toBe(true)
    // Gone from the pickable catalogue …
    expect(registry.listDetails().find(r => r.recipeId === 'demo')).toBeUndefined()
    expect(registry.list().find(i => i.recipeId === 'demo')).toBeUndefined()
    // … but a task that pinned it still resolves.
    expect(registry.getPinned({ recipeId: RecipeId('demo'), revision: 1 })).toBeDefined()
    // Repeat delete is a no-op that reports false.
    expect(await registry.deleteRecipe('demo')).toBe(false)
    // Re-create resurrects the family (now pickable again).
    expect((await registry.createRecipe('demo', FROZEN_RECIPE)).revision).toBe(2)
    expect(registry.listDetails().find(r => r.recipeId === 'demo')).toBeDefined()
  })

  it('rejects deleting and mutating an unknown or blank id', async () => {
    const registry = bare()
    expect(await registry.deleteRecipe('ghost')).toBe(false)
    await expect(registry.deleteRecipe(' ')).rejects.toThrow(/recipeId/)
    await expect(registry.updateRecipe(' ', EMPTY_TEMPLATE)).rejects.toThrow(/recipeId/)
  })

  it('refuses to delete built-in templates', async () => {
    const registry = bare()
    for (const id of [EMPTY_TEMPLATE_RECIPE_ID, REQUIREMENT_RECIPE_ID, CODE_REVIEW_RECIPE_ID, BUGFIX_RECIPE_ID]) {
      await expect(registry.deleteRecipe(id)).rejects.toThrow(RecipeError)
      expect(registry.latest(id)).toBeDefined()
    }
  })

  it('persists user recipes across restart when a durable backend is mounted', async () => {
    const pool = new MemoryMediaPool()
    const { ctx, registry } = await durable(pool)
    await registry.createRecipe('persist-me', FROZEN_RECIPE)
    await ctx.fiber.dispose()

    // A second context over the shared pool reloads the revision.
    const { ctx: ctx2, registry: registry2 } = await durable(pool)
    try {
      expect(registry2.latest('persist-me')?.revision).toBe(1)
      expect(registry2.getPinned({ recipeId: RecipeId('persist-me'), revision: 1 }).payload).toEqual(FROZEN_RECIPE)
    } finally {
      await ctx2.fiber.dispose()
    }
  })

  it('persists soft-delete markers across restart', async () => {
    const pool = new MemoryMediaPool()
    const { ctx, registry } = await durable(pool)
    await registry.createRecipe('to-hide', FROZEN_RECIPE)
    expect(await registry.deleteRecipe('to-hide')).toBe(true)
    await ctx.fiber.dispose()

    const { ctx: ctx2, registry: registry2 } = await durable(pool)
    try {
      expect(registry2.listDetails().find(r => r.recipeId === 'to-hide')).toBeUndefined()
      // Revision still resolvable for pinned reads.
      expect(registry2.getPinned({ recipeId: RecipeId('to-hide'), revision: 1 })).toBeDefined()
    } finally {
      await ctx2.fiber.dispose()
    }
  })
})
