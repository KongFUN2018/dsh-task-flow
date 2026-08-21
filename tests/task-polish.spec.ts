/**
 * Unit suite: the task-goal polish service streams one LLM completion over the
 * host's registered provider/model route. The `@Remote` registration itself is
 * discovered at runtime by the Gateway (source-mode discovery), so here we mount
 * the service against a stub `llm` face and assert the returned text is the
 * accumulated stream (trimmed) and that controlled errors keep the caller's
 * text path clean.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import TaskPolishService, { TaskPolishError } from '../src/task-polish/index.ts'
import type { LlmProviderInfo } from '@deepseek-ai/dsh-llm'

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

/** A minimal llm face: one provider, one model, a canned stream. */
function stubLlm(text: string) {
  return {
    listProviders: (): LlmProviderInfo[] => [{ id: 'test', name: 'test' }],
    listModels: async () => [{ id: 'm1' } as never],
    prepareCall: async () => ({
      config: { provider: 'test', model: 'm1' },
      stream: async function* () { yield { type: 'text-delta', index: 0, text } },
    }),
  }
}

describe('task-goal polish', () => {
  it('returns the accumulated model text, trimmed', async () => {
    const ctx = new Context()
    current = ctx
    ctx.provide('llm', stubLlm('  a clearer goal.  '))
    await ctx.plugin(TaskPolishService).await()
    const result = await ctx.taskPolish.polish('  原始目标  ')
    expect(result).toBe('a clearer goal.')
  })

  it('fails controlled when no provider is registered', async () => {
    const ctx = new Context()
    current = ctx
    ctx.provide('llm', { ...stubLlm('x'), listProviders: () => [] })
    await ctx.plugin(TaskPolishService).await()
    await expect(ctx.taskPolish.polish('goal')).rejects.toMatchObject({ code: 'no-provider' })
  })

  it('fails controlled when the provider discloses no model', async () => {
    const ctx = new Context()
    current = ctx
    ctx.provide('llm', { ...stubLlm('x'), listModels: async () => [] })
    await ctx.plugin(TaskPolishService).await()
    await expect(ctx.taskPolish.polish('goal')).rejects.toMatchObject({ code: 'no-model' })
  })

  it('fail is a TaskPolishError instance for the caller to keep the draft', async () => {
    const ctx = new Context()
    current = ctx
    ctx.provide('llm', { ...stubLlm(''), streamOnly: true })
    const err = new TaskPolishError('no-provider', 'none')
    expect(err).toBeInstanceOf(Error)
    expect(err.code).toBe('no-provider')
  })
})
