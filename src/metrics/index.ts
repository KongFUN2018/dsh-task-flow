/**
 * Metrics service (`ctx.metrics`): the M6 workbench KPI projection and
 * per-task measures, derived from the entity projections and the journal.
 * Pure read: it never writes the task plane, never opens attention items,
 * and never touches Gate or scheduling.
 * @module @deepseek-ai/dsh-metrics
 */

import { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import '../task/index.ts'
import '../workbench/host/index.ts'
import '../workbench/journal/index.ts'
import '../deliverable/index.ts'
import type { TaskId } from '../task/types.ts'
import { buildTaskMetrics, buildWorkbenchMetrics } from './runtime.ts'
import type { TaskMetrics, WorkbenchMetrics } from './types.ts'

export type { WorkbenchMetrics, TaskMetrics, GatePassRate, ThroughputDay, PhaseDuration } from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    metrics: MetricsService
  }
}

/** Metrics read errors; no write-side ladder exists. */
export class MetricsError extends Error {
  constructor(
    readonly code: 'not-found' | 'invalid-argument',
    message: string,
  ) {
    super(message)
    this.name = 'MetricsError'
  }
}

/** The metrics service: read-only KPI and per-task measures. */
export class MetricsService extends TypertRemoteService {
  /** The service aggregates the task plane, the inbox, the versions, and the journal. */
  static inject = ['tasks', 'workbenchHost', 'deliverables', 'workbenchJournal']

  /**
   * @param ctx - Host context carrying the aggregate services.
   */
  constructor(ctx: Context) {
    super(ctx, 'metrics')
  }

  /**
   * Fold the whole-workbench KPI projection.
   * @returns the KPI counts, throughput buckets, and gate pass rates.
   */
  @Remote('metrics')
  async metrics(): Promise<WorkbenchMetrics> {
    const [tasks, snapshot, versions, facts] = await Promise.all([
      this.ctx.tasks.listTasks(),
      Promise.resolve(this.ctx.workbenchHost.listSnapshot()),
      Promise.resolve(this.ctx.deliverables.listVersions()),
      Promise.resolve(this.ctx.workbenchJournal.replay(0)),
    ])
    return buildWorkbenchMetrics(tasks, snapshot.items, versions, facts)
  }

  /**
   * Fold one task's measures.
   * @param taskId - the task to measure.
   * @returns the per-task measures.
   */
  @Remote('taskMetrics')
  async taskMetrics(taskId: string): Promise<TaskMetrics> {
    const id = this.requireText(taskId, 'taskId') as TaskId
    const task = await this.ctx.tasks.getTask(id)
    if (task === undefined) throw new MetricsError('not-found', 'task "' + taskId + '" is unknown')
    const facts = this.ctx.workbenchJournal.replay(0).filter(fact => String(fact.taskId) === String(id))
    const budgetService = this.ctx.get('budget') as
      | { getBudget(taskId: TaskId): { tokens: number; durationMs: number; reruns: number } | undefined }
      | undefined
    const budget = budgetService?.getBudget(id)
    return buildTaskMetrics(task, facts, budget)
  }

  /** Validate one non-empty wire field, returning the trimmed value. */
  private requireText(value: string, field: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new MetricsError('invalid-argument', field + ' must be a non-empty string')
    }
    return value.trim()
  }
}

export default MetricsService
