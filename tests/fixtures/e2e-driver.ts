#!/usr/bin/env node
/** Loader-driver for the recipe registry: boot the real `cordis.yml`, read
 * the built-in template, register one custom revision, pin-read it, and
 * stream the resulting projection as one JSON line. */

import type { Context } from '@deepseek-ai/cordis'
import { boot, installFailLoud, loadEnv, resolveConfigPath } from '@deepseek-ai/dsh-app-boot'
import { EMPTY_TEMPLATE, EMPTY_TEMPLATE_RECIPE_ID, RecipeError } from '@deepseek-ai/dsh-recipe'

const NAME = 'recipe-test-driver'
const [configPath] = process.argv.slice(2)
if (configPath === undefined || configPath.trim() === '') {
  throw new Error(`${NAME}: expected <config-path>`)
}

const uninstallFailLoud = installFailLoud(NAME)
let ctx: Context | undefined
try {
  loadEnv(NAME)
  ctx = await boot(NAME, resolveConfigPath(configPath, undefined))
  const builtin = ctx.recipes.getPinned({ recipeId: EMPTY_TEMPLATE_RECIPE_ID as never, revision: 1 })
  const custom = ctx.recipes.register('e2e-recipe', 1, EMPTY_TEMPLATE)
  const pinned = ctx.recipes.getPinned({ recipeId: 'e2e-recipe' as never, revision: 1 })
  let duplicateCode = ''
  try {
    ctx.recipes.register('e2e-recipe', 1, {
      ...EMPTY_TEMPLATE,
      phases: [{ phaseId: 'main', kind: 'default', goal: 'changed', inputs: [], outputs: ['main deliverable'], submissionCriteria: [] }],
    })
  } catch (error) {
    duplicateCode = (error as RecipeError).code
  }
  process.stdout.write(`${JSON.stringify({
    builtin: { revision: builtin.revision, phaseCount: builtin.payload.phases.length },
    custom: { revision: custom.revision, hash: custom.contentHash },
    pinned: { hash: pinned.contentHash, phases: pinned.payload.phases[0]?.phaseId },
    duplicateCode,
  })}\n`)
} catch (error: unknown) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
} finally {
  await ctx?.fiber.dispose()
  uninstallFailLoud()
}
