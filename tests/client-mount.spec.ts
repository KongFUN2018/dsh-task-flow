/**
 * Client-half assembly guard: the aggregated browser plugin must own its
 * Remote ground-truth by `$mount`ing exactly the eight task-flow namespaces.
 *
 * The published `@deepseek-ai/dsh-api-remotes` peer only mounts the official
 * Host namespaces, so the task-flow domains are absent from the browser
 * unless `src/client/remotes-mount.ts` supplies them. If this list goes
 * missing or back to the monorepo assumption, `dsh web` reports
 * "waiting for services: remote.tasks, …" and the client never activates.
 * (The `src/client/index.ts` aggregate `inject` is pinned separately: it must
 * list only `slots`/`locale`/`remote`, never a `remote.<namespace>` the same
 * `apply` provides — a plugin cannot await a service it mounts itself.)
 */
import { describe, expect, it } from 'vitest'
import { taskFlowRemoteContributions } from '../src/client/remotes-mount.ts'

describe('dsh-task-flow client remote mount', () => {
  it('supplies exactly the eight task-flow namespaces for $mount', () => {
    const namespaces = taskFlowRemoteContributions
      .flatMap((contribution) => contribution.descriptors)
      .map((descriptor) => descriptor.namespace)
    expect(new Set(namespaces)).toEqual(new Set([
      'tasks',
      'recipes',
      'workbenchHost',
      'workbenchHostStream',
      'deliverables',
      'digest',
      'metrics',
      'rewind',
    ]))
  })

  it('covers the methods the client features call (createTask / list / …)', () => {
    const byNamespace = new Map<string, string[]>()
    for (const descriptor of taskFlowRemoteContributions.flatMap((c) => c.descriptors)) {
      byNamespace.set(descriptor.namespace, [...(byNamespace.get(descriptor.namespace) ?? []), descriptor.method])
    }
    expect(byNamespace.get('tasks')).toContain('createTask')
    expect(byNamespace.get('recipes')).toContain('list')
    expect(byNamespace.get('workbenchHost')).toContain('confirmBatch')
    expect(byNamespace.get('workbenchHostStream')).toContain('listIncremental')
    expect(byNamespace.get('deliverables')).toContain('listCurrentInputs')
    expect(byNamespace.get('digest')).toContain('digest')
    expect(byNamespace.get('metrics')).toContain('metrics')
    expect(byNamespace.get('rewind')).toContain('requestRewind')
  })
})

describe('dsh-task-flow client aggregate inject', () => {
  it('lists only slots/locale/remote and never a self-mounted remote.* service', async () => {
    // Parse the aggregated index.ts source so the assertion holds without
    // importing React-heavy client code in a node test.
    const source = (await import('node:fs/promises')).readFile(new URL('../src/client/index.ts', import.meta.url), 'utf8')
    const text = await source
    const match = text.match(/export const inject = \[([^\]]*)\]/s)
    expect(match).not.toBeNull()
    const keys = (match?.[1] ?? '').split(',').map((k) => k.trim().replace(/^'|'$/g, '')).filter(Boolean)
    expect([...keys].sort()).toEqual(['locale', 'remote', 'slots'])
    for (const key of keys) expect(key.startsWith('remote.')).toBe(false)
  })
})
