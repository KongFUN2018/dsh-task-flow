import { useState } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ToolCallViewProps } from '@deepseek-ai/dsh-client-ui-tool/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { NS } from './locales.ts'
import css from './TaskCreateProposalView.module.css'

/** Proposal shape the task_create tool projects as its resultView. */
export interface TaskCreateProposalViewData {
  readonly recipeId: string
  readonly goal: string
  readonly inheritSession: boolean
  readonly phaseCount: number
  readonly checks: number
  readonly idempotencyKey: string
}

/** Registrant-private injected share: the confirm callback issuing createTask. */
export interface TaskCreateConfirmInjected {
  confirm: (proposal: TaskCreateProposalViewData, inherit: boolean) => Promise<string>
}

export type TaskCreateProposalViewProps =
  ToolCallViewProps & PropsLocale<typeof NS> & {
    readonly confirm: (proposal: TaskCreateProposalViewData, inherit: boolean) => Promise<string>
  }

function proposalOf(view: ToolCallViewProps['block']): TaskCreateProposalViewData | undefined {
  const result = 'kind' in view ? view : undefined
  if (result === undefined || result.resultView === null) return undefined
  const data = result.resultView as Partial<TaskCreateProposalViewData>
  if (typeof data.recipeId !== 'string' || typeof data.idempotencyKey !== 'string') return undefined
  return {
    recipeId: data.recipeId,
    goal: typeof data.goal === 'string' ? data.goal : '',
    inheritSession: data.inheritSession === true,
    phaseCount: typeof data.phaseCount === 'number' ? data.phaseCount : 0,
    checks: typeof data.checks === 'number' ? data.checks : 0,
    idempotencyKey: data.idempotencyKey,
  }
}

/** The keyed tool.call.toolview card for task_create: proposal, inherit toggle, confirm/cancel. */
export function TaskCreateProposalView(props: TaskCreateProposalViewProps) {
  const { block, t, confirm } = props
  const proposal = proposalOf(block)
  const [inherit, setInherit] = useState(proposal?.inheritSession === true)
  const [busy, setBusy] = useState(false)
  const [createdTaskId, setCreatedTaskId] = useState<string | undefined>(undefined)

  if (proposal === undefined) return null
  if (createdTaskId !== undefined) {
    return <div className={css.card}>{t('confirmed', { taskId: createdTaskId })}</div>
  }
  return (
    <div className={css.card}>
      <p className={css.title}>{t('title')}</p>
      <div className={css.meta}>
        <span>{t('recipe')}: {proposal.recipeId}</span>
        <span>{t('phases', { count: String(proposal.phaseCount) })} · {t('checks', { count: String(proposal.checks) })}</span>
      </div>
      {proposal.goal !== '' && <p className={css.goal}>{t('goal')}: {proposal.goal}</p>}
      <label className={css.inherit}>
        <input type="checkbox" checked={inherit} onChange={(event) => { setInherit(event.target.checked) }} />
        <span>{t('inherit.label')}</span>
      </label>
      <p className={css.hint}>{t('inherit.hint')}</p>
      <div className={css.actions}>
        <Button size="sm" variant="ghost" onClick={() => { /* cancel: no state change */ }}>{t('cancel')}</Button>
        <Button
          size="sm"
          variant="primary"
          disabled={busy}
          onClick={() => {
            setBusy(true)
            void confirm(proposal, inherit).then((taskId) => {
              setBusy(false)
              setCreatedTaskId(taskId)
            }).catch(() => { setBusy(false) })
          }}
        >
          {t('confirm')}
        </Button>
      </div>
    </div>
  )
}
