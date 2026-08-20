import type {
  HostObservable, InjectFace, PropsLocale, PropsRuntime, PropsStore,
} from '@deepseek-ai/dsh-client-ui-slots'
import { IconBranchOutline16, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
// Type-only: pulls ui-sidebar's SlotMap merge (the 'sidebar.footer.action' entry and
// its owner share) into this compilation program.
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { BadgeState } from './badge.ts'
import { NS } from './locales.ts'
import { createWorkbenchStore } from './store.ts'
import css from './WorkbenchTrigger.module.css'

/**
 * Registrant-private injected share: the badge aggregate shared with the
 * drawer panel (the same handle flows to both registrations).
 */
export interface WorkbenchTriggerInjected {
  hooks: { badge: HostObservable<BadgeState> }
}

/** The trigger's props: sidebar.footer.action runtime owner share + shared store + locale. */
export type WorkbenchTriggerProps =
  PropsRuntime<'sidebar.footer.action'>
  & PropsStore<ReturnType<typeof createWorkbenchStore>>
  & PropsLocale<typeof NS>
  & InjectFace<WorkbenchTriggerInjected>

/**
 * Render the sidebar "任务流程" primary entry: a prominent, accent-styled
 * button (branch icon + label) that toggles the right-side drawer. Rendered
 * wide as a full row; collapsed into the 56px rail as an icon-only entry.
 * @param props - composed slot props for the 'sidebar.footer.action' hole.
 * @returns the trigger button.
 */
export function WorkbenchTrigger(props: WorkbenchTriggerProps) {
  const { t, wide, useStore, actions, useBadge } = props
  const badge = useBadge(state => state)
  const open = useStore(s => s.open)

  return (
    <Tooltip label={t('trigger')} delayMs={500} disabled={wide}>
      <button
        type="button"
        className={wide ? css.trigger : css.rail}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t('trigger')}
        onClick={() => { actions.toggleDrawer() }}
      >
        <IconBranchOutline16 size={wide ? 16 : 18} className={css.icon} />
        {wide && <span className={css.label}>{t('trigger')}</span>}
        {!wide && badge.activeCount > 0 && <span className={css.railDot} aria-hidden="true" />}
      </button>
    </Tooltip>
  )
}
