/**
 * Unified host-half assembly guard: the package main must satisfy the `dsh
 * web` Loader contract and, once the external platform services are mounted,
 * activate every one of the eight browser-routable namespaces the client half
 * reaches through `ctx.remote.*`.
 *
 * Loader form is the dead line: `dsh web` unwraps the main with
 * `exports.default ?? exports`, so a stray default export would collapse the
 * module to RecipeRegistry and drop `name`/`inject`/`apply`. This suite
 * mirrors that unwrap by hand (the real `@deepseek-ai/cordis-plugin-loader` is
 * not a peer here) and asserts the unfolded namespace is still the function
 * plugin, not the collapsed recipe class.
 * @module
 */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import AgentRegistry from '@deepseek-ai/dsh-agent'
import GoalService from '@deepseek-ai/dsh-goal'
import { SessionStore } from '@deepseek-ai/dsh-session'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import * as root from '../src/index.ts'
import { RecipeRegistry } from '../src/index.ts'
import { MemoryMediaPool, MemoryStorageBackend } from './fixtures/memory-backend.ts'

/** The official `dsh web` unwrap: `exports.default ?? exports` (loader is not a peer here). */
function unwrapExports<T>(exports: T): T {
  // Mirror Loader.prototype.unwrapExports. For ESM namespace imports there is
  // no `.default`, so the namespace itself is returned and the assertions
  // below prove the plugin metadata survived.
  const unfolded = (exports as Record<string, unknown>).default ?? exports
  return unfolded as T
}

/** Boot the external platform services and mount the host plugin over them. */
async function bootHost(registerHost: boolean): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('memory', new MemoryStorageBackend(new MemoryMediaPool()))
  const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
  ctx.storage.mount('domain', facility)
  ctx.provide('storageDomain', facility)
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(AgentRegistry)
  await ctx.plugin(GoalService)
  await ctx.plugin(SessionStore)
  await ctx.plugin(ToolRuntime)
  if (registerHost) {
    const unwrapped = unwrapExports(root)
    await ctx.plugin(unwrapped).await()
  }
  return ctx
}

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

describe('dsh-task-flow host assembly', () => {
  it('has no default export and keeps name/inject/apply through unwrapExports', () => {
    expect('default' in root).toBe(false)

    const unwrapped = unwrapExports(root) as Record<string, unknown>
    expect(unwrapped).toBe(root)
    expect(unwrapped.name).toBe('dsh-task-flow-host')
    expect(unwrapped.inject).toEqual(['storageDomain', 'sessions', 'agents', 'goals', 'tools'])
    expect(typeof unwrapped.apply).toBe('function')
    // The load-path guard: unwrapExports must NOT collapse onto RecipeRegistry.
    expect(unwrapped).not.toBe(RecipeRegistry)
  })

  it('activates the 8 browser-routable namespaces as live host services', async () => {
    const ctx = await bootHost(true)
    current = ctx
    const services = {
      tasks: ctx.tasks,
      recipes: ctx.recipes,
      workbenchHost: ctx.workbenchHost,
      workbenchHostStream: ctx.workbenchHostStream,
      deliverables: ctx.deliverables,
      digest: ctx.digest,
      metrics: ctx.metrics,
      rewind: ctx.rewind,
    }
    for (const [key, service] of Object.entries(services)) {
      expect(service, `${key} must be a live host service`).toBeDefined()
      expect((service as { typertRemote?: unknown }).typertRemote, `${key} must be Gateway-bound`).toBeDefined()
    }
  })

  it('routes a concrete RPC round-trip per routable namespace', async () => {
    const ctx = await bootHost(true)
    current = ctx
    // recipes: the workbench wizard reads the pinned revision list.
    expect(ctx.recipes.list()).toContainEqual({ recipeId: 'empty-template', revision: 1 })
    // tasks: fresh durable store yields no runs.
    await expect(ctx.tasks.listTasks()).resolves.toEqual([])
    // workbenchHost: parked at the empty journal checkpoint (seq 0).
    expect(ctx.workbenchHost.listSnapshot().snapshotVersion).toBe(0)
    // deliverables: no versions saved yet.
    expect(ctx.deliverables.listVersions()).toEqual([])
    // metrics: round-trips the aggregate projection.
    await expect(ctx.metrics.metrics()).resolves.toMatchObject({})
    // rewind: unknown task reports not-found via the service error path.
    await expect(ctx.rewind.requestRewind(
      'no-such-task',
      [],
      'unit',
      'plugin.spec:key',
    )).rejects.toThrow()
  })

  it('exposes host services with the exact RPC method names the client descriptors use', async () => {
    const ctx = await bootHost(true)
    current = ctx
    // digest/workbenchHostStream namespaces route methods mirrored in remote/*.d.ts.
    expect(typeof ctx.digest.digest).toBe('function')
    expect(typeof ctx.metrics.taskMetrics).toBe('function')
    expect(typeof ctx.rewind.applyRewind).toBe('function')
    expect(typeof ctx.workbenchHostStream.listIncremental).toBe('function')
  })
})
