/** Tool suite: registers task_create, validates the recipe, returns a proposal without creating. */

import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import AgentRegistry from '@deepseek-ai/dsh-agent'
import { CallId } from '@deepseek-ai/dsh-llm'
import RecipeRegistry, { EMPTY_TEMPLATE_RECIPE_ID } from '../src/recipe/index.ts'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import type { ToolExecutionResult } from '@deepseek-ai/dsh-tools'
import { apply, name, inject } from '../src/tool-task-create/index.ts'

const testToolSignal = new AbortController().signal

/** Boot the tool over the recipe registry and the tool runtime. */
async function bench() {
  const ctx = new Context()
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(AgentRegistry)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(RecipeRegistry)
  await ctx.plugin({ inject: ['tools', 'recipes'], apply }).await()
  return { ctx }
}

function runTool(ctx: Context, name: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
  return ctx.tools.execute({ signal: testToolSignal, callId: CallId('call-' + name), name, arguments: args })
}

describe('task-create tool', () => {
  it('declares the services it binds', () => {
    expect(name).toBe('tool-task-create')
    expect(inject).toEqual(['tools', 'recipes'])
  })

  it('proposes for a known recipe with its phase and gate counts', async () => {
    const h = await bench()
    const result = await runTool(h.ctx, 'task_create', {
      recipeId: EMPTY_TEMPLATE_RECIPE_ID,
      goal: '把落地页整理成可开发 PRD',
      inheritSession: true,
    })
    expect(result.isError).toBe(false)
    const value = result.value as {
      recipeId: string
      goal: string
      inheritSession: boolean
      phaseCount: number
      checks: number
      idempotencyKey: string
    }
    expect(value.recipeId).toBe(EMPTY_TEMPLATE_RECIPE_ID)
    expect(value.goal).toBe('把落地页整理成可开发 PRD')
    expect(value.inheritSession).toBe(true)
    expect(value.phaseCount).toBeGreaterThanOrEqual(0)
    expect(value.checks).toBeGreaterThanOrEqual(0)
    expect(typeof value.idempotencyKey).toBe('string')
  }, 10_000)

  it('rejects an unknown recipe', async () => {
    const h = await bench()
    const result = await runTool(h.ctx, 'task_create', {
      recipeId: 'no-such-recipe',
      goal: 'x',
      inheritSession: false,
    })
    expect(result.isError).toBe(true)
  })

  it('proposes only and does not create', async () => {
    const h = await bench()
    const before = h.ctx.recipes.list().length
    await runTool(h.ctx, 'task_create', {
      recipeId: EMPTY_TEMPLATE_RECIPE_ID,
      goal: 'g',
      inheritSession: false,
    })
    expect(h.ctx.recipes.list().length).toBe(before)
  })
})
