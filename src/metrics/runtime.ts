/**
 * Metrics derivation: pure functions from entity projections and journal
 * facts to the KPI and per-task measures. No I/O here — the service fetches
 * the inputs, this module folds them.
 * @module @deepseek-ai/dsh-metrics/runtime
 */

import type { JournalFact } from '../workbench/journal/index.ts'
import type { AttentionItemView } from '../workbench/host/types.ts'
import type { DeliverableVersion } from '../deliverable/types.ts'
import type { TaskRecord } from '../task/types.ts'
import type { GatePassRate, PhaseDuration, ThroughputDay, WorkbenchMetrics } from './types.ts'

const REWIND_APPLIED = 'rewind/applied'
const SUBMISSION_RECORDED = 'submission/recorded'
const PHASE_RUN_UPDATED = 'phase-run/updated'
const GATE_CHECK_RECORDED = 'gate-check/recorded'
const ATTENTION_RESOLVED = 'attention/item-resolved'

/** Terminal task states; everything else counts as live work. */
const TERMINAL = new Set(['completed', 'cancelled', 'failed'])

/** Window length for throughput and pass-rate aggregations, in days. */
export const METRICS_WINDOW_DAYS = 7

/** One day bucket key in the local timezone. */
function dayKey(occurredAt: number): string {
  const d = new Date(occurredAt)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return String(d.getFullYear()) + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

/**
 * Fold the workbench KPI projection.
 * @param tasks - every task projection.
 * @param items - the attention inbox snapshot items.
 * @param versions - every deliverable version.
 * @param facts - the whole journal, in journal order.
 * @returns the KPI counts, throughput buckets, and gate pass rates.
 */
export function buildWorkbenchMetrics(
  tasks: readonly TaskRecord[],
  items: readonly AttentionItemView[],
  versions: readonly DeliverableVersion[],
  facts: readonly JournalFact[],
): WorkbenchMetrics {
  const live = tasks.filter(task => !TERMINAL.has(task.state)).length
  const openItems = items.filter(item => item.status === 'open')
  const gate = openItems.filter(item => item.kind === 'b-confirm' || item.kind === 'c-decision').length
  const ask = openItems.filter(item => item.kind === 'clarification').length
  const asset = versions.filter(version => version.state === 'current').length

  const windowStart = Date.now() - METRICS_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const throughputByDay = new Map<string, number>()
  for (const fact of facts) {
    if (fact.kind !== PHASE_RUN_UPDATED || fact.occurredAt < windowStart) continue
    const payload = fact.payload as { state?: string }
    if (payload.state !== 'passed') continue
    const day = dayKey(fact.occurredAt)
    throughputByDay.set(day, (throughputByDay.get(day) ?? 0) + 1)
  }
  const throughput: ThroughputDay[] = [...throughputByDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([day, completedPhases]) => ({ day, completedPhases }))

  const counts = new Map<string, { passed: number; total: number }>()
  for (const fact of facts) {
    if (fact.kind !== GATE_CHECK_RECORDED) continue
    const payload = fact.payload as { passed?: boolean; kind?: string }
    const kind = payload.kind ?? 'A'
    const entry = counts.get(kind) ?? { passed: 0, total: 0 }
    entry.total += 1
    if (payload.passed === true) entry.passed += 1
    counts.set(kind, entry)
  }
  const rate = (kind: string): number => {
    const entry = counts.get(kind)
    return entry === undefined || entry.total === 0 ? 0 : entry.passed / entry.total
  }
  const gatePassRate: GatePassRate = { a: rate('A'), b: rate('B'), c: rate('C') }

  return { live, gate, ask, asset, throughput, gatePassRate }
}

/** Per-task measures shape; kept here so the fold signature stays short. */
interface TaskMeasures {
  readonly taskId: string
  readonly phaseDurations: readonly PhaseDuration[]
  readonly rerunCount: number
  readonly decisionCount: number
  readonly budgetUsed?: { readonly tokens: number; readonly durationMs: number; readonly reruns: number }
}

/**
 * Fold per-task measures.
 * @param task - the task projection.
 * @param facts - journal facts of the task.
 * @param budget - the budget ledger record, when one exists.
 * @returns the per-task measures.
 */
export function buildTaskMetrics(
  task: TaskRecord,
  facts: readonly JournalFact[],
  budget?: { readonly tokens: number; readonly durationMs: number; readonly reruns: number },
): TaskMeasures {
  // Phase durations: first running/scheduled observation to passed.
  const starts = new Map<string, number>()
  const passes = new Map<string, number>()
  for (const fact of facts) {
    if (fact.kind !== PHASE_RUN_UPDATED) continue
    const payload = fact.payload as { phaseRunId?: string; state?: string }
    if (typeof payload.phaseRunId !== 'string') continue
    if ((payload.state === 'running' || payload.state === 'scheduled') && !starts.has(payload.phaseRunId)) {
      starts.set(payload.phaseRunId, fact.occurredAt)
    }
    if (payload.state === 'passed' && !passes.has(payload.phaseRunId)) {
      passes.set(payload.phaseRunId, fact.occurredAt)
    }
  }
  const phaseDurations: PhaseDuration[] = []
  for (const [phaseRunId, startedAt] of starts) {
    const passedAt = passes.get(phaseRunId)
    phaseDurations.push({
      phaseId: phaseRunId,
      startedAt,
      ...(passedAt === undefined ? {} : { passedAt }),
      ...(passedAt === undefined ? {} : { durationMs: passedAt - startedAt }),
    })
  }
  phaseDurations.sort((a, b) => (a.startedAt ?? 0) - (b.startedAt ?? 0))

  const rewindCount = facts.filter(fact => fact.kind === REWIND_APPLIED).length
  const submissionsByPhase = new Map<string, number>()
  for (const fact of facts) {
    if (fact.kind !== SUBMISSION_RECORDED) continue
    const payload = fact.payload as { phaseRunId?: string }
    if (typeof payload.phaseRunId !== 'string') continue
    submissionsByPhase.set(payload.phaseRunId, (submissionsByPhase.get(payload.phaseRunId) ?? 0) + 1)
  }
  const retriedSubmissions = [...submissionsByPhase.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0)
  const decisionCount = facts.filter(fact => fact.kind === ATTENTION_RESOLVED).length

  return {
    taskId: String(task.taskId),
    phaseDurations,
    rerunCount: rewindCount + retriedSubmissions,
    decisionCount,
    ...(budget === undefined ? {} : { budgetUsed: budget }),
  }
}
