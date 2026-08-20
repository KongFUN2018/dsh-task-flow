import { useEffect, useState } from 'react'
import type { RewindPreview } from '../../../rewind/types.ts'
import type { TaskRecord } from '../../../task/types.ts'
import { Button, StateDot, type StateDotState } from '@deepseek-ai/dsh-client-ui-primitives'
import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { TaskDetailState } from './detail.ts'
import { NS } from './locales.ts'
import css from './TaskDetailAction.module.css'

/**
 * Registrant-private injected share (assembled in apply): the detail state
 * as a hooks-compartment source (bound to `useDetail`), plus the load
 * callback over the controller. Plain data and callbacks only.
 */
export interface TaskDetailActionInjected {
  /** Detail state source; the renderer binds it to the useDetail selector hook. */
  hooks: { detail: HostObservable<TaskDetailState> }
  /** Load one task's projection, phase runs, and gate verdicts. */
  load: (taskId: string) => void
  /** Request a rewind impact preview as a blocking attention decision item. */
  requestRewind: (taskId: string, roots: string[], actor: string, idemKey: string) => Promise<RewindPreview & { itemId: string }>
  /** Re-submit the phase output as a superseding revision carrying a note. */
  requestPatch: (taskId: string, phaseRunId: string, note: string, actor: string, idemKey: string) => Promise<import('../../../task/types.ts').PhaseSubmission>
}

/** Full props for the drawer's task-detail tab body. */
export type TaskDetailActionProps =
  PropsRuntime<'workbench.drawer.detail'> & PropsLocale<typeof NS> & InjectFace<TaskDetailActionInjected>

/** Locale keys of the three gate classes, keyed by the GateCheckResult kind. */
const GATE_CLASS_KEYS = { A: 'gate.class.a', B: 'gate.class.b', C: 'gate.class.c' } as const

/** Closed-union exhaustiveness fence for the wire task-state set. */
/* v8 ignore next 3 -- closed-union backstop; only reached if a state is forged */
function assertNever(value: never): never {
  throw new Error(`unhandled task state: ${JSON.stringify(value)}`)
}

/** Status marker semantics for the task row. */
function dotState(state: TaskRecord['state']): StateDotState {
  switch (state) {
    case 'planning': return 'ongoing'
    case 'running': return 'ongoing'
    case 'completed': return 'done'
    case 'failed': return 'error'
    case 'awaiting-input': return 'warning'
    case 'awaiting-decision': return 'warning'
    case 'pausing': return 'warning'
    case 'paused': return 'warning'
    case 'cancelling': return 'warning'
    case 'cancelled': return 'warning'
    /* v8 ignore next -- closed wire state union */
    default: return assertNever(state)
  }
}

/**
 * Render the drawer's task-detail tab body: the owner-selected task's
 * projection, phase runs, and gate verdicts. A `taskId` change reloads
 * through the controller; no selection renders the empty state.
 * @param props - composed slot props (owner taskId, locale, inject face).
 * @returns the detail panel filling the drawer's tab body.
 */
export function TaskDetailAction(props: TaskDetailActionProps) {
  const { taskId, t, useDetail, load, requestRewind, requestPatch, openInbox } = props
  const detail = useDetail(state => state)
  const [showRoots, setShowRoots] = useState(false)
  const [selected, setSelected] = useState<readonly string[]>([])
  const [pending, setPending] = useState(false)
  const [preview, setPreview] = useState<(RewindPreview & { itemId: string }) | undefined>(undefined)
  const [rewindError, setRewindError] = useState<string | undefined>(undefined)
  const [showPatch, setShowPatch] = useState(false)
  const [patchNote, setPatchNote] = useState('')
  const [patchPending, setPatchPending] = useState(false)
  const [patchError, setPatchError] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (taskId !== undefined) load(taskId)
  }, [taskId, load])
  useEffect(() => {
    // Reset the pickers when the selection moves to another task.
    setShowRoots(false)
    setPreview(undefined)
    setRewindError(undefined)
    setShowPatch(false)
    setPatchNote('')
    setPatchError(undefined)
  }, [taskId])
  const requestRewindFlow = async () => {
    if (taskId === undefined || selected.length === 0) return
    setPending(true)
    setRewindError(undefined)
    try {
      const result = await requestRewind(taskId, [...selected], 'workbench-ui', crypto.randomUUID())
      setPreview(result)
    } catch (error) {
      const code = (error as { code?: string }).code ?? 'unknown'
      setRewindError(code)
    } finally {
      setPending(false)
    }
  }
  const requestPatchFlow = async () => {
    if (taskId === undefined) return
    const target = detail.phaseRuns.find(run => run.activeSubmissionId !== undefined)
    if (target === undefined || patchNote.trim().length === 0) return
    setPatchPending(true)
    setPatchError(undefined)
    try {
      await requestPatch(taskId, String(target.phaseRunId), patchNote.trim(), 'workbench-ui', crypto.randomUUID())
      setPatchNote('')
      setShowPatch(false)
      load(taskId)
    } catch (error) {
      const code = (error as { code?: string }).code ?? 'unknown'
      setPatchError(code)
    } finally {
      setPatchPending(false)
    }
  }
  return (
    <div className={css.panel}>
      {taskId === undefined && <p className={css.statusLine}>{t('empty')}</p>}
      {taskId !== undefined && detail.status === 'loading' && <p className={css.statusLine}>{t('loading')}</p>}
      {taskId !== undefined && detail.status === 'failed' && (
        <p className={css.errorLine} role="alert">
          {detail.error === 'not-found' ? t('not-found') : t('error.load', { code: detail.error ?? '' })}
        </p>
      )}
      {taskId !== undefined && detail.status === 'ready' && detail.task !== undefined && (
        <div className={css.body}>
          <div className={css.taskRow}>
            <StateDot state={dotState(detail.task.state)} className={css.rowDot} />
            <span className={css.itemId}>{detail.task.taskId}</span>
            <span className={css.meta}>{detail.task.state} · {t('revision', { revision: detail.task.revision })}</span>
          </div>
          {detail.digest !== undefined && detail.digest.runs.length > 1 && (
            <p className={css.runLine}>
              {t('runs.current', { runId: (detail.digest.runs[0]?.runId ?? '') })}
              {detail.digest.runs.slice(1).map(run => ' · ' + t('runs.archived', { runId: run.runId }))}
            </p>
          )}
          <p className={css.section}>{t('phases')}</p>
          {detail.phaseRuns.length === 0 && <p className={css.statusLine}>{t('none')}</p>}
          <ol className={css.timeline}>
            {detail.phaseRuns.map((phase) => {
              const archived = phase.state === 'superseded' || phase.state === 'stale' || phase.state === 'cancelled'
              return (
                <li key={phase.phaseRunId} className={archived ? css.archivedPhase : undefined}>
                  <span className={css.itemId}>{phase.phaseId}</span>
                  <span className={css.meta}>
                    {phase.state === 'superseded' ? t('phase.superseded') : phase.state}
                    {' '}· {t('revision', { revision: phase.revision })}
                  </span>
                </li>
              )
            })}
          </ol>
          <p className={css.section}>{t('gates')}</p>
          {detail.gateResults.length === 0 && <p className={css.statusLine}>{t('none')}</p>}
          {(['A', 'B', 'C'] as const).map((kind) => {
            const checks = detail.gateResults.filter(gate => (gate.kind ?? 'A') === kind)
            if (checks.length === 0) return null
            return (
              <div key={kind} className={css.gateGroup}>
                <p className={css.gateClass}>{t(GATE_CLASS_KEYS[kind])}</p>
                <ul className={css.list}>
                  {checks.map(gate => (
                    <li key={`${String(gate.submissionId)}:${gate.checkId}`} className={css.row}>
                      <span className={css.itemId}>{gate.checkId}</span>
                      <span className={css.meta}>
                        {gate.passed ? t('passed') : t('failed')}
                        {gate.stale === true ? t('gate.stale') : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
          <div className={css.verbRow}>
            <Button size="sm" variant="outline" onClick={() => { setShowPatch(show => !show) }}>{t('verb.patch')}</Button>
            <Button
              size="sm"
              variant="primary"
              disabled={pending}
              onClick={() => { setShowRoots(show => !show); setPreview(undefined); setRewindError(undefined) }}
            >
              {t('verb.rewind')}
            </Button>
          </div>
          {showPatch && (
            <div className={css.patchPanel}>
              <p className={css.section}>{t('patch.title')}</p>
              <textarea
                className={css.patchNote}
                value={patchNote}
                onChange={(event) => { setPatchNote(event.target.value) }}
                placeholder={t('patch.placeholder')}
                rows={3}
              />
              <div className={css.patchActions}>
                <Button size="sm" variant="primary" disabled={patchPending || patchNote.trim().length === 0} onClick={() => { void requestPatchFlow() }}>
                  {patchPending ? t('patch.pending') : t('patch.submit')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setShowPatch(false) }}>{t('patch.cancel')}</Button>
              </div>
              {patchError !== undefined && <p className={css.errorLine} role="alert">{t('patch.error', { code: patchError })}</p>}
            </div>
          )}
          {showRoots && preview === undefined && (
            <div className={css.rewindPanel}>
              <p className={css.section}>{t('rewind.title')}</p>
              {detail.rootVersions.length === 0 && <p className={css.statusLine}>{t('rewind.rootsEmpty')}</p>}
              {detail.rootVersions.length > 0 && (
                <div className={css.rootList}>
                  <p className={css.rootsHint}>{t('rewind.rootsHint')}</p>
                  {detail.rootVersions.map((root) => {
                    const rootKey = String(root.versionId)
                    const checked = selected.includes(rootKey)
                    const toggle = () => {
                      setSelected(prev => checked ? prev.filter(id => id !== rootKey) : [...prev, rootKey])
                    }
                    return (
                      <label key={rootKey} className={css.rootRow}>
                        <input type="checkbox" checked={checked} onChange={toggle} />
                        <span className={css.itemId}>{root.deliverableId}</span>
                        <span className={css.meta}>{root.phaseId} · {root.versionId}</span>
                      </label>
                    )
                  })}
                </div>
              )}
              {rewindError !== undefined && (
                <p className={css.errorLine} role="alert">{t('rewind.error', { code: rewindError })}</p>
              )}
              <Button size="sm" variant="primary" disabled={selected.length === 0 || pending} onClick={() => { void requestRewindFlow() }}>
                {pending ? t('loading') : t('rewind.confirm')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowRoots(false) }}>{t('rewind.cancel')}</Button>
            </div>
          )}
          {preview !== undefined && (
            <div className={css.rewindPanel}>
              <p className={css.section}>{t('rewind.previewTitle')}</p>
              <ul className={css.list}>
                <li className={css.row}><span className={css.itemId}>{t('rewind.previewVersions', { count: preview.invalidatedVersionIds.length })}</span></li>
                <li className={css.row}><span className={css.itemId}>{t('rewind.previewPhases', { count: preview.rerunPhaseIds.length })}</span></li>
                <li className={css.row}><span className={css.itemId}>{t('rewind.previewClarifications', { count: preview.reusableClarificationIds.length })}</span></li>
              </ul>
              <p className={css.successLine} role="status">{t('rewind.success')}</p>
              <Button size="sm" variant="primary" onClick={openInbox}>{t('rewind.goInbox')}</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
