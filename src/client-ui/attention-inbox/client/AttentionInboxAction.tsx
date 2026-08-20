import { useState } from 'react'
import type { AttentionItemView, AttentionItemKind, AttentionItemStatus, BatchConfirmItem } from '../../../workbench/host/types.ts'
import { Button, Input, StateDot, type StateDotState } from '@deepseek-ai/dsh-client-ui-primitives'
import type { HostObservable, InjectFace, PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { batchable, decidable, type InboxState } from './inbox.ts'
import { NS } from './locales.ts'
import css from './AttentionInboxAction.module.css'

/**
 * Registrant-private injected share (assembled in apply): the inbox state as
 * a hooks-compartment source (bound to `useInbox`), plus the refresh and
 * command callbacks over the controller. Plain data and callbacks only.
 */
export interface AttentionInboxActionInjected {
  /** Inbox state source; the renderer binds it to the useInbox selector hook. */
  hooks: { inbox: HostObservable<InboxState> }
  /** Reload the item list from the workbench-host snapshot. */
  refresh: () => void
  /** Confirm the selected B-class items in one batch. */
  confirm: (targets: BatchConfirmItem[]) => void
  /** Resolve one C-class item with the entered decision text. */
  decide: (itemId: string, decision: string) => void
}

/** Full props for the drawer's attention-inbox tab body. */
export type AttentionInboxActionProps =
  PropsRuntime<'workbench.drawer.inbox'> & PropsLocale<typeof NS> & InjectFace<AttentionInboxActionInjected>

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

/** Human kind word for one item row. */
function kindLabel(kind: AttentionItemKind, t: TranslateNS<typeof NS>): string {
  switch (kind) {
    case 'b-confirm': return t('kind.b-confirm')
    case 'c-decision': return t('kind.c-decision')
    case 'clarification': return t('kind.clarification')
    case 'recovery': return t('kind.recovery')
    /* v8 ignore next -- closed wire kind union */
    default: return assertNever(kind)
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

/** One batch-confirmable (B) row: checkbox plus identity and state. */
function BatchRow({ item, checked, onToggle, t }: {
  item: AttentionItemView
  checked: boolean
  onToggle: (itemId: string) => void
  t: TranslateNS<typeof NS>
}) {
  return (
    <li className={css.row}>
      <input type="checkbox" checked={checked} aria-label={String(item.itemId)} onChange={() => { onToggle(String(item.itemId)) }} />
      <StateDot state={dotState(item.status)} className={css.rowDot} />
      <div className={css.rowMain}>
        <span className={css.itemId}>{item.title}</span>
        <span className={css.meta}>{kindLabel(item.kind, t)} · {statusLabel(item.status, t)} · {t('revision', { revision: item.entityRevision })}</span>
      </div>
    </li>
  )
}

/** One single-decision (C) row: decision input plus submit. */
function DecisionRow({ item, draft, onDraft, onSubmit, t }: {
  item: AttentionItemView
  draft: string
  onDraft: (itemId: string, value: string) => void
  onSubmit: (itemId: string, decision: string) => void
  t: TranslateNS<typeof NS>
}) {
  return (
    <li className={css.row}>
      <StateDot state={dotState(item.status)} className={css.rowDot} />
      <div className={css.rowMain}>
        <span className={css.itemId}>{item.title}</span>
        <span className={css.meta}>{kindLabel(item.kind, t)} · {statusLabel(item.status, t)} · {t('revision', { revision: item.entityRevision })}</span>
      </div>
      <div className={css.decision}>
        <Input value={draft} placeholder={t('decision.placeholder')} onChange={(event) => { onDraft(String(item.itemId), event.target.value) }} />
        <Button size="sm" variant="primary" disabled={draft.trim() === ''} onClick={() => { onSubmit(String(item.itemId), draft.trim()) }}>{t('decide')}</Button>
      </div>
    </li>
  )
}

/** One read-only (clarification/recovery) row: identity and state only. */
function ReadonlyRow({ item, t }: {
  item: AttentionItemView
  t: TranslateNS<typeof NS>
}) {
  return (
    <li className={css.row}>
      <StateDot state={dotState(item.status)} className={css.rowDot} />
      <div className={css.rowMain}>
        <span className={css.itemId}>{item.title}</span>
        <span className={css.meta}>{kindLabel(item.kind, t)} · {statusLabel(item.status, t)} · {t('revision', { revision: item.entityRevision })}</span>
      </div>
    </li>
  )
}

/**
 * Render the drawer's attention-inbox tab body: the B batch-confirm list,
 * the C single-decision rows, and the read-only items, over the controller
 * store through the inject face.
 * @param props - composed slot props (locale, inject face).
 * @returns the inbox panel filling the drawer's tab body.
 */
export function AttentionInboxAction(props: AttentionInboxActionProps) {
  const { t, useInbox, refresh, confirm, decide } = props
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const inbox = useInbox(state => state)
  const batchItems = inbox.items.filter(batchable)
  const decisionItems = inbox.items.filter(decidable)
  const readonlyItems = inbox.items.filter(item => !batchable(item) && !decidable(item))
  const toggle = (itemId: string): void => {
    const next = new Set(selected)
    if (next.has(itemId)) next.delete(itemId)
    else next.add(itemId)
    setSelected(next)
  }
  const submitBatch = (): void => {
    const targets = batchItems
      .filter(item => selected.has(String(item.itemId)))
      .map(item => ({ itemId: item.itemId, expectedEntityRevision: item.entityRevision }))
    confirm(targets)
    setSelected(new Set())
  }
  const submitDecision = (itemId: string, decision: string): void => {
    decide(itemId, decision)
    setDrafts(prev => ({ ...prev, [itemId]: '' }))
  }
  return (
    <div className={css.panel}>
      {inbox.status === 'loading' && <p className={css.statusLine}>{t('loading')}</p>}
      {inbox.error !== undefined && inbox.error.startsWith('conflict:') && inbox.conflictCount > 0 && (
        <p className={css.errorLine} role="alert">{t('error.conflict', { count: inbox.conflictCount })}</p>
      )}
      {inbox.error !== undefined && !inbox.error.startsWith('conflict:') && (
        <p className={css.errorLine} role="alert">{t(inbox.status === 'failed' ? 'error.load' : 'error.command', { code: inbox.error })}</p>
      )}
      {inbox.status !== 'loading' && inbox.items.length === 0 && <p className={css.statusLine}>{t('empty')}</p>}
      {batchItems.length > 0 && (
        <section className={css.section}>
          <h3 className={css.sectionTitle}>{t('section.batch')}</h3>
          <ul className={css.list}>
            {batchItems.map(item => (
              <BatchRow key={String(item.itemId)} item={item} checked={selected.has(String(item.itemId))} onToggle={toggle} t={t} />
            ))}
          </ul>
          <div className={css.batchbar}>
            <span className={css.batchCount}>{t('selected', { count: selected.size })}</span>
            <span className={css.batchSpacer} />
            <Button size="sm" variant="ghost" disabled={selected.size === 0} onClick={() => { setSelected(new Set()) }}>{t('clear')}</Button>
            <Button size="sm" variant="primary" disabled={selected.size === 0} onClick={submitBatch}>{t('confirm')}</Button>
          </div>
        </section>
      )}
      {decisionItems.length > 0 && (
        <section className={css.section}>
          <h3 className={css.sectionTitle}>{t('section.decision')}</h3>
          <ul className={css.list}>
            {decisionItems.map(item => (
              <DecisionRow key={String(item.itemId)} item={item} draft={drafts[String(item.itemId)] ?? ''} onDraft={(id, value) => { setDrafts(prev => ({ ...prev, [id]: value })) }} onSubmit={submitDecision} t={t} />
            ))}
          </ul>
        </section>
      )}
      {readonlyItems.length > 0 && (
        <section className={css.section}>
          <h3 className={css.sectionTitle}>{t('section.readonly')}</h3>
          <ul className={css.list}>
            {readonlyItems.map(item => (
              <ReadonlyRow key={String(item.itemId)} item={item} t={t} />
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
