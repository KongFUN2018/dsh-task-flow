import type { AttentionItemView, AttentionItemStatus } from '../../../workbench/host/types.ts'
import { Button, StateDot, type StateDotState } from '@deepseek-ai/dsh-client-ui-primitives'
import type { HostObservable, InjectFace, PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClarificationsState } from './clarifications.ts'
import { openClarification } from './clarifications.ts'
import { NS } from './locales.ts'
import css from './ClarificationsAction.module.css'

/**
 * Registrant-private injected share (assembled in apply): the open-clarification
 * list as a hooks-compartment source (bound to `useClarifications`) plus the
 * refresh callback over the controller. Plain data and callbacks only.
 */
export interface ClarificationsActionInjected {
  /** Queue state source; the renderer binds it to the useClarifications selector hook. */
  hooks: { clarifications: HostObservable<ClarificationsState> }
  /** Reload the open-clarification list from the workbench-host snapshot. */
  refresh: () => void
}

/** Full props for the drawer's clarification-queue tab body. */
export type ClarificationsActionProps =
  PropsRuntime<'workbench.drawer.clarifications'> & PropsLocale<typeof NS> & InjectFace<ClarificationsActionInjected>

/** Closed-union exhaustiveness fence for the wire kind set. */
/* v8 ignore next 3 -- closed-union backstop; only reached if a kind is forged */
function assertNever(value: never): never {
  throw new Error(`unhandled attention kind: ${JSON.stringify(value)}`)
}

/** Status marker semantics for one item row. */
function dotState(status: AttentionItemStatus): StateDotState {
  switch (status) {
    case 'open': return 'warning'
    case 'resolved': return 'done'
    case 'invalidated': return 'error'
    case 'stale': return 'warning'
    /* v8 ignore next -- closed wire status union */
    default: return assertNever(status)
  }
}

/** Human status word for one item row. */
function statusLabel(status: AttentionItemStatus, t: TranslateNS<typeof NS>): string {
  switch (status) {
    case 'open': return t('status.open')
    case 'resolved': return t('status.resolved')
    case 'invalidated': return t('status.invalidated')
    case 'stale': return t('status.stale')
    /* v8 ignore next -- closed wire status union */
    default: return assertNever(status)
  }
}

/** One open-clarification row: read-only, identity and state only. */
function ClarificationRow({ item, t }: {
  item: AttentionItemView
  t: TranslateNS<typeof NS>
}) {
  return (
    <li className={css.row}>
      <StateDot state={dotState(item.status)} className={css.rowDot} />
      <div className={css.rowMain}>
        <span className={css.source}>{item.title}</span>
        <span className={css.meta}>{t('source.item', { id: String(item.itemId) })} · {statusLabel(item.status, t)} · {t('revision', { revision: item.entityRevision })}</span>
      </div>
    </li>
  )
}

/**
 * Render the drawer's clarification-queue tab body: the read-only list of
 * open clarification items over the controller store through the inject face.
 * @param props - composed slot props (locale, inject face).
 * @returns the clarification panel filling the drawer's tab body.
 */
export function ClarificationsAction(props: ClarificationsActionProps) {
  const { t, useClarifications, refresh } = props
  const queue = useClarifications(state => state)
  const items = queue.items.filter(openClarification)
  return (
    <div className={css.panel}>
      {queue.status === 'loading' && <p className={css.statusLine}>{t('loading')}</p>}
      {queue.error !== undefined && (
        <p className={css.errorLine} role="alert">{t('error.load', { code: queue.error })}</p>
      )}
      {queue.status !== 'loading' && items.length === 0 && <p className={css.statusLine}>{t('empty')}</p>}
      {items.length > 0 && (
        <section className={css.section}>
          <h3 className={css.sectionTitle}>{t('section.clarifications')}</h3>
          <ul className={css.list}>
            {items.map(item => (
              <ClarificationRow key={String(item.itemId)} item={item} t={t} />
            ))}
          </ul>
        </section>
      )}
      <div className={css.footer}>
        <Button size="sm" variant="outline" onClick={refresh}>{t('refresh')}</Button>
      </div>
    </div>
  )
}
