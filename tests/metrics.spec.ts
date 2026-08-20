/** Metrics suite: the pure aggregations over fixed inputs, plus the service read path. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import RecipeRegistry, { EMPTY_TEMPLATE_RECIPE_ID } from '../src/recipe/index.ts'
import WorkbenchJournalService from '../src/workbench/journal/index.ts'
import DeliverableService from '../src/deliverable/index.ts'
import SessionStore from '@deepseek-ai/dsh-session'
import LocalTaskService from '../src/task-local/index.ts'
import AttentionService from '../src/attention/index.ts'
import WorkbenchHostService from '../src/workbench/host/index.ts'
import '../src/task/index.ts'
import MetricsService from '../src/metrics/index.ts'
import { buildTaskMetrics, buildWorkbenchMetrics } from '../src/metrics/runtime.ts'
import { MemoryStorageBackend } from './fixtures/memory-backend.ts'
import type { JournalFact, JournalPayload } from '../src/workbench/journal/index.ts'
import type { AttentionItemView } from '../src/workbench/host/types.ts'
import type { DeliverableVersion } from '../src/deliverable/types.ts'
import type { TaskRecord } from '../src/task/types.ts'

function fact(kind: string, taskId: string, seq: number, occurredAt: number, actor: string, payload: JournalPayload): JournalFact {
  return {
    journalSeq: seq,
    eventId: 'ev-' + String(seq) as JournalFact['eventId'],
    taskId: taskId as JournalFact['taskId'],
    kind,
    occurredAt,
    actor,
    idempotencyKey: 'k-' + String(seq),
    entityRevision: 1,
    payload,
    schemaVersion: 1,
  }
}

function task(state: TaskRecord['state'], id = 't-1'): TaskRecord {
  return {
    taskId: id as TaskRecord['taskId'],
    workspaceId: 'w-1',
    pinnedRecipe: { recipeId: 'r-1' as never, revision: 1, schemaVersion: 1, contentHash: 'h' },
    state,
    revision: 1,
    createdAt: 100,
  }
}

function item(kind: AttentionItemView['kind'], status: AttentionItemView['status'], id = 'i-1'): AttentionItemView {
  return { itemId: id as AttentionItemView['itemId'], kind, status, entityRevision: 1, title: id }
}

function version(state: DeliverableVersion['state']): DeliverableVersion {
  return {
    versionId: 'v-' + state as DeliverableVersion['versionId'],
    deliverableId: 'd-1' as DeliverableVersion['deliverableId'],
    versionNumber: 1,
    state,
    entityRevision: 1,
    createdAt: 100,
  }
}

describe('buildWorkbenchMetrics', () => {
  it('counts live tasks, open gate/ask items, and current versions', () => {
    const metrics = buildWorkbenchMetrics(
      [task('running'), task('paused'), task('completed')],
      [
        item('b-confirm', 'open'),
        item('c-decision', 'open'),
        item('clarification', 'open'),
        item('clarification', 'resolved'),
      ],
      [version('current'), version('stale'), version('current')],
      [],
    )
    expect(metrics.live).toBe(2)
    expect(metrics.gate).toBe(2)
    expect(metrics.ask).toBe(1)
    expect(metrics.asset).toBe(2)
  })

  it('aggregates gate pass rates by kind with A as the default', () => {
    const now = Date.now()
    const facts: JournalFact[] = [
      fact('gate-check/recorded', 't-1', 1, now, 'gate', { passed: true, kind: 'A' }),
      fact('gate-check/recorded', 't-1', 2, now, 'gate', { passed: false, kind: 'A' }),
      fact('gate-check/recorded', 't-1', 3, now, 'gate', { passed: true, kind: 'B' }),
      fact('gate-check/recorded', 't-1', 4, now, 'gate', { passed: true }),
    ]
    const metrics = buildWorkbenchMetrics([], [], [], facts)
    expect(metrics.gatePassRate.a).toBe(2 / 3)
    expect(metrics.gatePassRate.b).toBe(1)
    expect(metrics.gatePassRate.c).toBe(0)
  })

  it('buckets completed phases per day over the window', () => {
    const now = Date.now()
    const facts: JournalFact[] = [
      fact('phase-run/updated', 't-1', 1, now, 'engine', { state: 'passed' }),
      fact('phase-run/updated', 't-2', 2, now - 60_000, 'engine', { state: 'passed' }),
      fact('phase-run/updated', 't-3', 3, now - 10 * 24 * 60 * 60 * 1000, 'engine', { state: 'passed' }),
    ]
    const metrics = buildWorkbenchMetrics([], [], [], facts)
    expect(metrics.throughput.reduce((sum, day) => sum + day.completedPhases, 0)).toBe(2)
    expect(metrics.throughput.length).toBeGreaterThanOrEqual(1)
  })
})

describe('buildTaskMetrics', () => {
  it('measures phase durations and counts reruns and decisions', () => {
    const now = Date.now()
    const facts: JournalFact[] = [
      fact('phase-run/updated', 't-1', 1, now - 1000, 'engine', { phaseRunId: 'pr-1', state: 'running' }),
      fact('phase-run/updated', 't-1', 2, now, 'engine', { phaseRunId: 'pr-1', state: 'passed' }),
      fact('submission/recorded', 't-1', 3, now, 'engine', { phaseRunId: 'pr-1' }),
      fact('submission/recorded', 't-1', 4, now, 'engine', { phaseRunId: 'pr-1' }),
      fact('rewind/applied', 't-1', 5, now, 'rewind', { newRunId: 'run-2', retiredRunId: 'run-1' }),
      fact('attention/item-resolved', 't-1', 6, now, 'human', { decisionKind: 'gate', outcome: 'accept' }),
      fact('attention/item-resolved', 't-1', 7, now, 'human', { decisionKind: 'rewind', outcome: 'confirm-rewind' }),
    ]
    const measures = buildTaskMetrics(task('running'), facts, { tokens: 10, durationMs: 5, reruns: 1 })
    expect(measures.phaseDurations[0]).toMatchObject({ phaseId: 'pr-1', durationMs: 1000 })
    expect(measures.rerunCount).toBe(2) // one rewind + one retried submission
    expect(measures.decisionCount).toBe(2)
    expect(measures.budgetUsed).toEqual({ tokens: 10, durationMs: 5, reruns: 1 })
  })
})

/** Boot the metrics dependency stack over one memory medium. */
async function harness() {
  const ctx = new Context()
  await ctx.plugin(Storage)
  ctx.storage.backend.register('memory', new MemoryStorageBackend())
  const facility = new DomainFacility(ctx, { backend: 'memory', routes: {} })
  ctx.storage.mount('domain', facility)
  ctx.provide('storageDomain', facility)
  await ctx.plugin(RecipeRegistry)
  await ctx.plugin(WorkbenchJournalService)
  await ctx.plugin(DeliverableService)
  await ctx.plugin(SessionStore)
  await ctx.plugin(LocalTaskService)
  await ctx.plugin(AttentionService)
  await ctx.plugin(WorkbenchHostService)
  await ctx.plugin(MetricsService).await()
  return { ctx, metrics: ctx.metrics, tasks: ctx.tasks }
}

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

describe('MetricsService', () => {
  it('measures an unknown task as not-found', async () => {
    const h = await harness()
    current = h.ctx
    await expect(h.metrics.taskMetrics('t-unknown')).rejects.toMatchObject({ code: 'not-found' })
  })

  it('folds KPI counts over the live stack', async () => {
    const h = await harness()
    current = h.ctx
    const created = await h.tasks.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'unit', 'create-k')
    await h.tasks.startTask(created.taskId, { actor: 'unit', reason: 'spec', expectedRevision: 1, idempotencyKey: 'start-k' })
    const metrics = await h.metrics.metrics()
    expect(metrics.live).toBe(1)
    expect(metrics.asset).toBe(0)
    const taskMetrics = await h.metrics.taskMetrics(String(created.taskId))
    expect(taskMetrics.taskId).toBe(String(created.taskId))
  })
})
