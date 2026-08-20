import { describe, expect, it } from 'vitest'
import RecipeRegistry from '../src/recipe/index.ts'
import { RecipeError } from '../src/recipe/types.ts'

describe('probe', () => {
  it('constructs registry', () => {
    const r = new RecipeRegistry(new (require('@deepseek-ai/cordis').Context)())
    expect(r).toBeDefined()
  })
})
