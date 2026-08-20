/**
 * Unit suite: the per-kind executor registry dispatches phase assignments
 * by `RecipePhaseSpec.kind`, fails loud on double registration or an
 * unregistered kind, proves disposal, and auto-registers its aggregating
 * executor into the recipe engine's single slot.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import type { PhaseAssignment, PhaseExecutor, PhaseOutcome } from '../src/recipe-engine-core/types.ts'
import RecipeMultiphaseService, { RecipeMultiphaseError } from '../src/recipe-multiphase/index.ts'

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

const assignment = (kind: string): PhaseAssignment => ({ phase: { kind } }) as unknown as PhaseAssignment

const completed: PhaseOutcome = {
  result: 'completed',
  inputVersions: [],
  outputVersions: [],
  unresolvedIssues: [],
  sourceSeqRange: { start: 1, end: 1 },
  sourceSeqPersisted: true,
}

/** A deterministic executor recording the kinds it performed. */
function stubExecutor(name: string, seen: string[]): PhaseExecutor {
  return {
    name,
    async execute(a: PhaseAssignment): Promise<PhaseOutcome> {
      seen.push(a.phase.kind)
      return completed
    },
  }
}

/** A minimal recipe-engine slot that records its one registered executor. */
function fakeEngine() {
  let registered: PhaseExecutor | undefined
  return {
    current: () => registered,
    registerExecutor(executor: PhaseExecutor): () => void {
      registered = executor
      return () => {
        if (registered === executor) registered = undefined
      }
    },
  }
}

describe('recipe-multiphase executor registry', () => {
  it('dispatches each assignment to the executor registered for its kind', async () => {
    const ctx = new Context()
    current = ctx
    const registry = new RecipeMultiphaseService(ctx)
    const survey: string[] = []
    const clarify: string[] = []
    registry.registerExecutor('material-survey', stubExecutor('survey', survey))
    registry.registerExecutor('clarify', stubExecutor('clarify', clarify))

    await registry.aggregatingExecutor().execute(assignment('material-survey'))
    await registry.aggregatingExecutor().execute(assignment('clarify'))
    await registry.aggregatingExecutor().execute(assignment('material-survey'))

    expect(survey).toEqual(['material-survey', 'material-survey'])
    expect(clarify).toEqual(['clarify'])
    expect(registry.listKinds()).toEqual(['material-survey', 'clarify'])
  })

  it('rejects a duplicate kind and a blank kind', () => {
    const registry = new RecipeMultiphaseService(new Context())
    registry.registerExecutor('main', stubExecutor('a', []))
    expect(() => registry.registerExecutor('main', stubExecutor('b', []))).toThrow(RecipeMultiphaseError)
    expect(() => registry.registerExecutor('  ', stubExecutor('blank', []))).toThrow(RecipeMultiphaseError)
  })

  it('fails loud when no executor is registered for the phase kind', async () => {
    const registry = new RecipeMultiphaseService(new Context())
    registry.registerExecutor('main', stubExecutor('a', []))
    await expect(registry.aggregatingExecutor().execute(assignment('ghost'))).rejects.toMatchObject({ code: 'no-executor' })
  })

  it('proves disposal: the disposer removes the registration', async () => {
    const registry = new RecipeMultiphaseService(new Context())
    const seen: string[] = []
    const dispose = registry.registerExecutor('main', stubExecutor('a', seen))
    dispose()
    dispose()
    expect(registry.listKinds()).toEqual([])
    await expect(registry.aggregatingExecutor().execute(assignment('main'))).rejects.toMatchObject({ code: 'no-executor' })
  })

  it('registers the aggregating executor into the engine and disposes it with the fiber', async () => {
    const ctx = new Context()
    current = ctx
    const engine = fakeEngine()
    ctx.provide('recipeEngine', engine)
    await ctx.plugin(RecipeMultiphaseService)
    expect(engine.current()?.name).toBe('recipe-multiphase')
    await ctx.fiber.dispose()
    expect(engine.current()).toBeUndefined()
  })
})
