import { useState } from 'react'
import type { TaskRecord } from '../../../task/types.ts'
import { Button, StateDot, type StateDotState } from '@deepseek-ai/dsh-client-ui-primitives'
import type { HostObservable, InjectFace, PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { verbsFor, type GatePause, type PhaseProgress, type TaskListState, type TaskListVerb } from './taskList.ts'
import { NS } from './locales.ts'
import css from './TaskListAction.module.css'

/**
 * Compact relative activity descriptor, mirroring the session list's time
 * display: just now / minutes / hours / days / an absolute short date beyond
 * a week. The row translates it through the locale keys.
 * @param epoch - the activity timestamp in epoch ms.
 * @param now - the reference time (usually Date.now()).
 * @returns a locale key plus its count, or an absolute date string.
 */
function activityDescriptor(epoch: number, now: number): { key: string; count: number } | string {
  const delta = now - epoch
  if (delta < 60_000) return { key: 'time.justNow', count: 0 }
  if (delta < 3600_000) return { key: 'time.minutesAgo', count: Math.floor(delta / 60_000) }
  if (delta < 86400_000) return { key: 'time.hoursAgo', count: Math.floor(delta / 3600_000) }
  if (delta < 7 * 86400_000) return { key: 'time.daysAgo', count: Math.floor(delta / 86400_000) }
  return new Date(epoch).toLocaleDateString()
}

/** Translate one activity descriptor through its locale key. */
function renderActivity(epoch: number, now: number, t: TranslateNS<typeof NS>): string {
  const parsed = activityDescriptor(epoch, now)
  return typeof parsed === 'string'
    ? parsed
    : t(parsed.key as never, { count: String(parsed.count) })
}

/**
 * Registrant-private injected share (assembled in apply): the task list as
 * a hooks-compartment source (bound to `useList`), plus the refresh and
 * command callbacks over the controller. Plain data and callbacks only.
 */
export interface TaskListActionInjected {
  /** Task list state source; the renderer binds it to the useList selector hook. */
  hooks: { list: HostObservable<TaskListState> }
  /** Reload the task list from the tasks Remote; resolves when the load settles. */
  refresh: () => Promise<void>
  /** Issue one pause/resume/cancel verb against a task row. */
  command: (taskId: string, verb: TaskListVerb) => void
}

/** Full props for the drawer's task-list tab body. */
export type TaskListActionProps =
  PropsRuntime<'workbench.drawer.taskList'> & PropsLocale<typeof NS> & InjectFace<TaskListActionInjected>

/** Closed-union exhaustiveness fence for the wire state set. */
function assertNever(value: never): never {
  /* v8 ignore next -- unreachable while the wire state union stays closed */
  throw new Error(`unhandled task state: ${JSON.stringify(value)}`)
}

/** Status marker semantics for one task row. */
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

/** Human status word for one task row. */
function stateLabel(state: TaskRecord['state'], t: TranslateNS<typeof NS>): string {
  switch (state) {
    case 'planning': return t('state.planning')
    case 'running': return t('state.running')
    case 'awaiting-input': return t('state.awaiting-input')
    case 'awaiting-decision': return t('state.awaiting-decision')
    case 'pausing': return t('state.pausing')
    case 'paused': return t('state.paused')
    case 'cancelling': return t('state.cancelling')
    case 'cancelled': return t('state.cancelled')
    case 'completed': return t('state.completed')
    case 'failed': return t('state.failed')
    /* v8 ignore next -- closed wire state union */
    default: return assertNever(state)
  }
}

/** One task row: state dot, identity, recipe, phase progress, gate badge, recent activity, verbs. */
function TaskRow({ task, progress, gate, activity, t, onCommand, onOpen }: {
  task: TaskRecord
  progress: PhaseProgress | undefined
  gate: GatePause
  activity: number
  t: TranslateNS<typeof NS>
  onCommand: (taskId: string, verb: TaskListVerb) => void
  onOpen: (taskId: string) => void
}) {
  const verbs = verbsFor(task)
  return (
    <li
      className={css.row}
      tabIndex={0}
      role="button"
      aria-label={t('open', { taskId: task.taskId })}
      onClick={() => { onOpen(task.taskId) }}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onOpen(task.taskId) }}
    >
      <StateDot state={dotState(task.state)} className={css.rowDot} />
      <div className={css.rowMain}>
        <span className={css.taskId}>{task.taskId}</span>
        <span className={css.meta}>
          {stateLabel(task.state, t)} · {t('revision', { revision: task.revision })}
          {' '}· {t('recipe', { recipeId: String(task.pinnedRecipe.recipeId) })}
          {progress !== undefined && progress.total > 0 && [' · ', t('phase.progress', { current: String(progress.current), total: String(progress.total) })]}
          {gate !== undefined && <span className={css.gateBadge}>{t('gate.badge', { kind: gate })}</span>}
          {' · '}<span className={css.activity}>{t('recent', { time: renderActivity(activity, Date.now(), t) })}</span>
        </span>
      </div>
      {verbs.length > 0 && (
        <div className={css.verbs}>
          {verbs.map(verb => (
            <Button key={verb} size="sm" variant="ghost" onClick={(event) => {
              event.stopPropagation()
              onCommand(task.taskId, verb)
            }}>
              {t(`verb.${verb}` as const)}
            </Button>
          ))}
        </div>
      )}
    </li>
  )
}

/**
 * Render the drawer's task-list tab body: a focused list over the same task
 * rows without KPI/chart chrome; opening a row switches the drawer to that
 * task's detail.
 * @param props - composed slot props (owner openDetail, locale, inject face).
 * @returns the task list panel filling the drawer's tab body.
 */
export function TaskListAction(props: TaskListActionProps) {
  const { openDetail, openCreate, t, useList, refresh, command } = props
  const list = useList(state => state)
  // Refresh is an explicit user gesture: the button shows a brief ongoing
  // state, then a "synced" confirmation, so a click that re-reads unchanged
  // data still gives visible feedback.
  const [refreshing, setRefreshing] = useState(false)
  const [syncedAt, setSyncedAt] = useState<number | undefined>(undefined)
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refresh()
      setSyncedAt(Date.now())
    } finally {
      setRefreshing(false)
    }
  }
  return (
    <div className={css.panel}>
      <div className={css.head}>
        <Button size="sm" variant="primary" onClick={() => { openCreate() }}>
          {t('create')}
        </Button>
      </div>
      {list.status === 'loading' && <p className={css.statusLine}>{t('loading')}</p>}
      {list.error !== undefined && (
        <p className={css.errorLine} role="alert">
          {t(list.status === 'failed' ? 'error.load' : 'error.command', { code: list.error })}
        </p>
      )}
      {list.status !== 'loading' && list.tasks.length === 0 && <p className={css.statusLine}>{t('empty')}</p>}
      {list.tasks.length > 0 && (
        <ul className={css.list}>
          {list.tasks.map(task => (
            <TaskRow
              key={task.taskId}
              task={task}
              progress={list.phaseProgress.get(String(task.taskId))}
              gate={list.taskGates.get(String(task.taskId))}
              activity={list.recentActivity.get(String(task.taskId)) ?? task.createdAt}
              t={t}
              onCommand={command}
              onOpen={openDetail}
            />
          ))}
        </ul>
      )}
      <div className={css.footer}>
        <Button size="sm" variant="outline" disabled={refreshing} onClick={() => { void handleRefresh() }}>
          {refreshing ? t('refreshing') : t('refresh')}
        </Button>
        {syncedAt !== undefined && !refreshing && (
          <span className={css.syncedLine} role="status">
            {t('synced', { time: new Date(syncedAt).toLocaleTimeString() })}
          </span>
        )}
      </div>
    </div>
  )
}
