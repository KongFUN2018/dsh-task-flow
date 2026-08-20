/** Digest suite: the pure derivation over fixed inputs, plus the service read path. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import RecipeRegistry, { EMPTY_TEMPLATE_RECIPE_ID } from '../src/recipe/index.ts'
import WorkbenchJournalService from '../src/workbench/journal/index.ts'
import DeliverableService from '../src/deliverable/index.ts'
import SessionStore from '@deepseek-ai/dsh-session'
import LocalTaskService from '../src/task-local/index.ts'
import '../src/task/index.ts'
import DigestService from '../src/digest/index.ts'
import { buildDigest } from '../src/digest/runtime.ts'
import { MemoryStorageBackend } from './fixtures/memory-backend.ts'
import type { JournalFact, JournalPayload } from '../src/workbench/journal/index.ts'
import type { DeliverableVersion } from '../src/deliverable/types.ts'
import type { PhaseRunRecord, TaskRecord, TaskRunId } from '../src/task/types.ts'

/** One synthetic journal fact. */
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

/** One synthetic task projection. */
function task(overrides: Partial<TaskRecord> = {}): TaskRecord {
  return {
    taskId: 't-1' as TaskRecord['taskId'],
    workspaceId: 'w-1',
    pinnedRecipe: { recipeId: 'r-1' as never, revision: 1, schemaVersion: 1, contentHash: 'h' },
    state: 'running',
    revision: 4,
    createdAt: 100,
    currentRunId: 'run-2' as TaskRunId,
    ...overrides,
  }
}

/** One synthetic phase run. */
function phase(overrides: Partial<PhaseRunRecord> = {}): PhaseRunRecord {
  return {
    phaseRunId: 'pr-1' as PhaseRunRecord['phaseRunId'],
    runId: 'run-2' as PhaseRunRecord['runId'],
    taskId: 't-1' as PhaseRunRecord['taskId'],
    phaseId: 'collect',
    state: 'passed',
    revision: 3,
    ...overrides,
  }
}

/** One synthetic deliverable version. */
function version(overrides: Partial<DeliverableVersion> = {}): DeliverableVersion {
  return {
    versionId: 'v-1' as DeliverableVersion['versionId'],
    deliverableId: 'd-1' as DeliverableVersion['deliverableId'],
    versionNumber: 1,
    state: 'current',
    entityRevision: 1,
    createdAt: 100,
    ...overrides,
  }
}

describe('buildDigest derivation', () => {
  it('folds run branches from rewind handoffs, newest first', () => {
    const facts: JournalFact[] = [
      fact('task-run/updated', 't-1', 1, 100, 'engine', { runId: 'run-1' }),
      fact('rewind/applied', 't-1', 2, 200, 'rewind', { newRunId: 'run-2', retiredRunId: 'run-1', supersededPhaseRunIds: ['pr-0'] }),
    ]
    const digest = buildDigest(task(), [phase()], facts, [])
    expect(digest.runs).toHaveLength(2)
    expect(digest.runs[0]).toMatchObject({ runId: 'run-2', parentRunId: 'run-1', supersededAt: 200 })
    expect(digest.runs[1]).toMatchObject({ runId: 'run-1', supersededAt: 200 })
  })

  it('keeps a single current-run branch when no rewind happened', () => {
    const digest = buildDigest(task({ currentRunId: 'run-1' as TaskRunId }), [phase()], [], [])
    expect(digest.runs).toHaveLength(1)
    expect(digest.runs[0]).toMatchObject({ runId: 'run-1' })
  })

  it('projects the timeline in journal order with summaries', () => {
    const facts: JournalFact[] = [
      fact('phase-run/updated', 't-1', 1, 100, 'engine', { phaseRunId: 'pr-1', state: 'running' }),
      fact('attention/item-resolved', 't-1', 2, 150, 'human', { decisionKind: 'gate', outcome: 'accept' }),
    ]
    const digest = buildDigest(task(), [phase()], facts, [])
    expect(digest.timeline.map(entry => entry.kind)).toEqual(['phase-run/updated', 'attention/item-resolved'])
    expect(digest.timeline[0]?.seq).toBe(1)
  })

  it('counts phase attempts from submissions and records pass times', () => {
    const facts: JournalFact[] = [
      fact('submission/recorded', 't-1', 1, 100, 'engine', { phaseRunId: 'pr-1' }),
      fact('submission/recorded', 't-1', 2, 110, 'engine', { phaseRunId: 'pr-1' }),
      fact('phase-run/updated', 't-1', 3, 120, 'engine', { phaseRunId: 'pr-1', state: 'passed' }),
    ]
    const digest = buildDigest(task(), [phase()], facts, [])
    expect(digest.phaseSummaries[0]).toMatchObject({ phaseId: 'collect', state: 'passed', attemptCount: 2, passedAt: 120 })
  })

  it('lists decision history newest first from resolved attention facts', () => {
    const facts: JournalFact[] = [
      fact('attention/item-resolved', 't-1', 1, 100, 'human', { decisionKind: 'rewind', outcome: 'confirm-rewind' }),
      fact('attention/item-resolved', 't-1', 2, 200, 'human', { decisionKind: 'gate', outcome: 'accept' }),
    ]
    const digest = buildDigest(task(), [phase()], facts, [])
    expect(digest.decisionHistory.map(entry => entry.decisionKind)).toEqual(['gate', 'rewind'])
  })

  it('groups deliverable states with the current version and counts', () => {
    const versions: DeliverableVersion[] = [
      version({ versionId: 'v-1' as DeliverableVersion['versionId'], versionNumber: 1, state: 'stale' }),
      version({ versionId: 'v-2' as DeliverableVersion['versionId'], versionNumber: 2, state: 'current' }),
    ]
    const digest = buildDigest(task(), [phase()], [], versions)
    expect(digest.deliverableStates).toEqual([{
      deliverableId: 'd-1', currentVersionId: 'v-2', state: 'current', versionCount: 2,
    }])
  })
})

/** Boot the digest dependency stack over one memory medium. */
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
  await ctx.plugin(DigestService).await()
  return { ctx, digest: ctx.digest, tasks: ctx.tasks }
}

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

describe('DigestService', () => {
  it('digests an unknown task as not-found', async () => {
    const h = await harness()
    current = h.ctx
    await expect(h.digest.digest('t-unknown')).rejects.toMatchObject({ code: 'not-found' })
  })

  it('digests a fresh task with its current run and empty projections', async () => {
    const h = await harness()
    current = h.ctx
    const created = await h.tasks.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'unit', 'create-k')
    const digest = await h.digest.digest(String(created.taskId))
    expect(digest.taskId).toBe(created.taskId)
    expect(digest.state).toBe('planning')
    expect(digest.phaseSummaries).toEqual([])
    expect(digest.timeline.length).toBeGreaterThan(0)
  })
})
