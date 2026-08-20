/** Unit suite: applying a deliverable impact snapshot to the task plane and replaying idempotently. */

import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import RecipeRegistry, { EMPTY_TEMPLATE_RECIPE_ID } from '../src/recipe/index.ts'
import WorkbenchJournalService from '../src/workbench/journal/index.ts'
import DeliverableService, { DeliverableId } from '../src/deliverable/index.ts'
import { SubmissionId } from '../src/task/index.ts'
import type { PhaseSubmission, TaskMutationContext } from '../src/task/types.ts'
import SessionStore from '@deepseek-ai/dsh-session'
import LocalTaskService from '../src/task-local/index.ts'
import ImpactPropagationService from '../src/impact/index.ts'
import type { ImpactSnapshot } from '../src/deliverable/types.ts'
import { MemoryStorageBackend } from './fixtures/memory-backend.ts'

/** Boot the full task stack plus impact propagation over a memory medium. */
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
  await ctx.plugin(ImpactPropagationService).await()
  return { ctx, tasks: ctx.tasks, deliverables: ctx.deliverables, impact: ctx.impactPropagation, journal: ctx.workbenchJournal }
}

let current: Context | undefined
afterEach(async () => {
  await current?.fiber.dispose()
  current = undefined
})

const mutation = (expectedRevision: number, key = 'mut-k'): TaskMutationContext => ({
  actor: 'unit',
  reason: 'impact spec',
  expectedRevision,
  idempotencyKey: key,
})

const DOC = DeliverableId('design-doc')
const REPORT = DeliverableId('site-report')

/** Drive one phase run to `passed` over a submission consuming docV1 and producing reportV1. */
async function passedPhaseRun(h: Awaited<ReturnType<typeof harness>>) {
  const docV1 = await h.deliverables.saveVersion(DOC, null, 's-1')
  const reportV1 = await h.deliverables.saveVersion(REPORT, null, 's-1')
  const created = await h.tasks.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-1', 'unit', 'create-k')
  await h.tasks.startTask(created.taskId, mutation(1, 'start-k'))
  const run = await h.tasks.createTaskRun(created.taskId, mutation(2, 'run-k'))
  const phaseRun = await h.tasks.createPhaseRun(run.runId, 'main', mutation(1, 'phase-k'))
  const started = await h.tasks.startPhaseRun(phaseRun.phaseRunId, mutation(1, 'start-phase-k'))
  const submission: PhaseSubmission = {
    submissionId: SubmissionId('s-1'),
    taskId: created.taskId,
    taskRunId: run.runId,
    phaseRunId: phaseRun.phaseRunId,
    phaseId: 'main',
    attempt: 1,
    pinnedRecipe: created.pinnedRecipe,
    sourceSessionId: 'session-1',
    sourceSeqRange: { start: 1, end: 5 },
    inputVersions: [{ deliverableId: DOC, versionId: docV1.versionId }],
    outputVersions: [{ deliverableId: REPORT, versionId: reportV1.versionId }],
    unresolvedIssues: [],
    result: 'completed',
    idempotencyKey: 'sub-k-1',
    submittedAt: Date.now(),
  }
  await h.tasks.recordSubmission(submission, {
    submittedBy: 'unit',
    sourceSeqPersisted: true,
    inputsCurrent: true,
    outputsValid: true,
  })
  await h.tasks.startGate('s-1', mutation(started.revision + 1, 'gate-k'))
  await h.tasks.recordGateCheck({
    submissionId: SubmissionId('s-1'),
    checkId: 'outputs-listed',
    passed: true,
    detail: 'all declared outputs listed',
    recordedAt: Date.now(),
  })
  const passed = await h.tasks.markPhasePassed(phaseRun.phaseRunId, mutation(started.revision + 2, 'pass-k'))
  return { docV1, reportV1, phaseRun: passed, submission }
}

/** A snapshot-shaped value for malformed-input tests. */
function snapshotWith(over: Partial<ImpactSnapshot>): ImpactSnapshot {
  return {
    snapshotId: 'snap-1' as ImpactSnapshot['snapshotId'],
    roots: [],
    staledVersions: [],
    affectedPhaseRuns: [],
    staledGateChecks: [],
    createdAt: 1,
    ...over,
  }
}

describe('apply', () => {
  it('moves covered phase runs into stale and annotates their gate verdicts', async () => {
    const h = await harness()
    current = h.ctx
    const { docV1, phaseRun, submission } = await passedPhaseRun(h)
    expect(phaseRun.state).toBe('passed')
    const snapshot = await h.deliverables.invalidateDownstream([docV1.versionId])
    expect(snapshot.affectedPhaseRuns).toEqual([phaseRun.phaseRunId])
    expect(snapshot.staledGateChecks).toEqual([{ submissionId: submission.submissionId, checkIds: ['outputs-listed'] }])
    const applied = await h.impact.apply(snapshot, mutation(0, 'apply-k'))
    expect(applied.staledPhaseRuns.map(run => run.phaseRunId)).toEqual([phaseRun.phaseRunId])
    expect(applied.staledPhaseRuns[0]?.state).toBe('stale')
    expect(applied.staledGateChecks.map(verdict => verdict.checkId)).toEqual(['outputs-listed'])
    expect(applied.staledGateChecks[0]?.stale).toBe(true)
    const runAfter = await h.tasks.getPhaseRun(phaseRun.phaseRunId)
    expect(runAfter?.state).toBe('stale')
    const verdicts = await h.tasks.listGateResults(submission.submissionId)
    expect(verdicts[0]?.stale).toBe(true)
  })

  it('is idempotent: an already-applied snapshot writes nothing', async () => {
    const h = await harness()
    current = h.ctx
    const { docV1 } = await passedPhaseRun(h)
    const snapshot = await h.deliverables.invalidateDownstream([docV1.versionId])
    await h.impact.apply(snapshot, mutation(0, 'apply-1'))
    const staledFactsBefore = h.journal.replay(0).filter(fact => fact.kind === 'gate-check/staled').length
    const again = await h.impact.apply(snapshot, mutation(0, 'apply-2'))
    expect(again.staledPhaseRuns).toEqual([])
    expect(again.staledGateChecks).toEqual([])
    const staledFactsAfter = h.journal.replay(0).filter(fact => fact.kind === 'gate-check/staled').length
    expect(staledFactsAfter).toBe(staledFactsBefore)
  })

  it('fails loud on a covered phase run that is not stored', async () => {
    const h = await harness()
    current = h.ctx
    const snapshot = snapshotWith({ affectedPhaseRuns: ['ghost-run' as ImpactSnapshot['affectedPhaseRuns'][number]] })
    await expect(h.impact.apply(snapshot, mutation(0))).rejects.toMatchObject({ code: 'not-found' })
  })

  it('does not stale a running phase run: the in-flight atomic action settles and its submission is rejected on stale inputs', async () => {
    const h = await harness()
    current = h.ctx
    const { docV1 } = await passedPhaseRun(h)
    const snapshot = await h.deliverables.invalidateDownstream([docV1.versionId])
    // Rebuild the snapshot by hand with the run id from a run started but not settled.
    const created = await h.tasks.createTask(EMPTY_TEMPLATE_RECIPE_ID, 'w-2', 'unit', 'create-2')
    await h.tasks.startTask(created.taskId, mutation(1, 'start-2'))
    const run = await h.tasks.createTaskRun(created.taskId, mutation(2, 'run-2'))
    const phaseRun = await h.tasks.createPhaseRun(run.runId, 'main', mutation(1, 'phase-2'))
    await h.tasks.startPhaseRun(phaseRun.phaseRunId, mutation(1, 'start-phase-2'))
    await h.deliverables.recordPhaseInputs(phaseRun.phaseRunId, [docV1.versionId])
    const running = await h.tasks.getPhaseRun(phaseRun.phaseRunId)
    expect(running?.state).toBe('running')
    const custom = snapshotWith({
      snapshotId: snapshot.snapshotId,
      roots: snapshot.roots,
      staledVersions: snapshot.staledVersions,
      affectedPhaseRuns: [phaseRun.phaseRunId],
      staledGateChecks: snapshot.staledGateChecks,
    })
    await expect(h.impact.apply(custom, mutation(0))).rejects.toMatchObject({ code: 'invalid-transition' })
    expect((await h.tasks.getPhaseRun(phaseRun.phaseRunId))?.state).toBe('running')
  })
})
