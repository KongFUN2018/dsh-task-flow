/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-task-local`.
 * @module @deepseek-ai/dsh-task-local/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import '../workbench/journal/index.ts'
import type { InvariantFailure, InvariantInstaller } from '@deepseek-ai/dsh-invariants'
import type { DomainChanged } from '@deepseek-ai/dsh-storage-domain'
import { taskFactKey } from './spec.ts'

const PACKAGE_NAME = '@deepseek-ai/dsh-task-local'
const DOMAIN_NAME = 'task_local'

/** Cordis companion plugin name. */
export const name = 'task-local-invariant'
/** Services required before the companion can reserve and check package ownership. */
export const inject = ['invariants']

/** The fact key one stored projection write must have behind it. */
function factKeyOf(table: string, value: Record<string, unknown>): string | undefined {
  if (table === 'tasks') return taskFactKey('task/updated', String(value.taskId), Number(value.revision))
  if (table === 'task_runs') return taskFactKey('task-run/updated', String(value.runId), Number(value.revision))
  if (table === 'phase_runs') return taskFactKey('phase-run/updated', String(value.phaseRunId), Number(value.revision))
  if (table === 'submissions') return taskFactKey('submission/recorded', String(value.submissionId), 1)
  return undefined
}

/**
 * Projection-journal consistency: every durable projection write on the
 * authoritative change stream must have its journal fact stored at the
 * revision the write produced - a projection put without its fact means a
 * write skipped the journal commit point and replay cannot rebuild the
 * projection.
 */
const install: InvariantInstaller = Object.assign((ctx: Context, fail: InvariantFailure) => {
  ctx.on('domain/changed', (change: DomainChanged) => {
    if (change.domain !== DOMAIN_NAME || change.operation !== 'put') return
    const facts = ctx.workbenchJournal.replay(0)
    const stored = new Set(facts.map(fact => fact.idempotencyKey))
    const record = change.value as Record<string, unknown>
    if (change.table === 'gate_results') {
      const results = record as unknown as unknown[]
      for (let index = 1; index <= results.length; index += 1) {
        const factKey = taskFactKey('gate-check/recorded', change.key, index)
        if (!stored.has(factKey)) {
          return fail(`gate result ${index} of '${change.key}' has no journal fact behind it`)
        }
      }
      return
    }
    const factKey = factKeyOf(change.table, record)
    if (factKey !== undefined && !stored.has(factKey)) {
      return fail(`projection write on '${change.table}' key '${change.key}' has no journal fact behind it`)
    }
  }, { global: true })
}, { inject: ['workbenchJournal'] })

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
