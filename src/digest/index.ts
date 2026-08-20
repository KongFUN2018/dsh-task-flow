/**
 * Digest service (`ctx.digest`): the M6 journal-derived read projection of
 * one task — run branches, timeline, phase summaries, decision history, and
 * deliverable states. Pure read: it never writes the task plane, never opens
 * attention items, and never touches Gate or scheduling.
 * @module @deepseek-ai/dsh-digest
 */

import { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import '../task/index.ts'
import '../workbench/journal/index.ts'
import '../deliverable/index.ts'
import type { TaskId } from '../task/types.ts'
import { buildDigest } from './runtime.ts'
import type { TaskDigest } from './types.ts'

export type { TaskDigest, DigestRunBranch, DigestTimelineEntry, DigestPhaseSummary, DigestDecision, DigestDeliverableState } from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    digest: DigestService
  }
}

/** Digest read errors; no write-side ladder exists. */
export class DigestError extends Error {
  constructor(
    readonly code: 'not-found' | 'invalid-argument',
    message: string,
  ) {
    super(message)
    this.name = 'DigestError'
  }
}

/** The digest service: one read-only Remote per task. */
export class DigestService extends TypertRemoteService {
  /** The service reads the journal, the task projection, and the versions. */
  static inject = ['tasks', 'workbenchJournal', 'deliverables']

  /**
   * @param ctx - Host context carrying the task, journal, and deliverable services.
   */
  constructor(ctx: Context) {
    super(ctx, 'digest')
  }

  /**
   * Derive one task's digest from the journal and the entity projections.
   * @param taskId - the task to digest.
   * @returns the full digest projection.
   */
  @Remote('digest')
  async digest(taskId: string): Promise<TaskDigest> {
    const id = this.requireText(taskId, 'taskId') as TaskId
    const task = await this.ctx.tasks.getTask(id)
    if (task === undefined) throw new DigestError('not-found', 'task "' + taskId + '" is unknown')
    const phaseRuns = task.currentRunId === undefined
      ? []
      : await this.ctx.tasks.listPhaseRuns(String(task.currentRunId))
    const facts = this.ctx.workbenchJournal.replay(0).filter(fact => String(fact.taskId) === String(id))
    const versions = this.ctx.deliverables.listVersions()
    return buildDigest(task, phaseRuns, facts, versions)
  }

  /** Validate one non-empty wire field, returning the trimmed value. */
  private requireText(value: string, field: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new DigestError('invalid-argument', field + ' must be a non-empty string')
    }
    return value.trim()
  }
}

export default DigestService
