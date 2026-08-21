import { useEffect, useRef, useState } from 'react'
import type {
  HostObservable, InjectFace, PropsLocale, PropsRenderSlots, PropsRuntime, PropsStore,
} from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls ui-layout's SlotMap merge (the 'shell.overlay' entry and
// this package's drawer seat declarations).
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type { BadgeState } from './badge.ts'
import { NS } from './locales.ts'
import type { DrawerTasksOwnerProps } from './slots.ts'
import type { createWorkbenchStore, DrawerTab } from './store.ts'
import css from './WorkbenchDrawer.module.css'

/** Default drawer width as a share of the viewport width (~2/3). */
const DRAWER_WIDTH_RATIO = 2 / 3

/** Lower and upper width bounds for the user-resized drawer (px). */
const WIDTH_MIN = 360
const WIDTH_MAX = 1320

/** Viewport share the width may never exceed, matching the CSS clamp. */
const VIEWPORT_SHARE = 0.94

/**
 * Default drawer width for the current viewport: ~2/3 of the window width,
 * capped to the draggable maximum. A wide shell still stays under the 94vw
 * clamp. All tabs share one default; a user drag overrides it within
 * WIDTH_MIN..WIDTH_MAX.
 * @param viewport - current window.innerWidth.
 * @returns the default drawer width in px, capped to both bounds.
 */
export function defaultWidthFor(viewport: number): number {
  return Math.round(Math.min(viewport * DRAWER_WIDTH_RATIO, WIDTH_MAX))
}

/**
 * Registrant-private injected share (assembled in apply): the badge
 * aggregates as a hooks-compartment source (bound to `useBadge`). Plain
 * data only.
 */
export interface WorkbenchDrawerInjected {
  /** Badge state source; the renderer binds it to the useBadge selector hook. */
  hooks: { badge: HostObservable<BadgeState> }
}

/** The panel's props: overlay runtime share + declared seats + store + locale. */
export type WorkbenchDrawerProps =
  PropsRuntime<'shell.overlay'>
  & PropsRenderSlots<'workbench.drawer.tasks' | 'workbench.drawer.taskList' | 'workbench.drawer.recipeLibrary' | 'workbench.drawer.inbox' | 'workbench.drawer.clarifications' | 'workbench.drawer.detail' | 'workbench.drawer.create'>
  & PropsStore<ReturnType<typeof createWorkbenchStore>>
  & PropsLocale<typeof NS>
  & InjectFace<WorkbenchDrawerInjected>

/**
 * Render the right-side workbench drawer: four tabs dispatching the declared
 * content seats. The component stays mounted while the entry lives; the open
 * flag, active tab, and detail selection ride the shared store, so the sidebar
 * trigger and internal navigation keep the same drawer state.
 * @param props - composed slot props (runtime, seats, store, locale, inject).
 * @returns the open drawer panel, or nothing while closed.
 */
export function WorkbenchDrawer(props: WorkbenchDrawerProps) {
  const {  t, renderSlot, useStore, actions } = props
  const [userWidth, setUserWidth] = useState<number | undefined>(undefined)
  // Track the live viewport so the conversation-relative default tracks window
  // resizes; a user drag still overrides it until the next tab switch.
  const [viewport, setViewport] = useState<number>(() => (typeof window === 'undefined' ? 0 : window.innerWidth))
  const drawerRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<{ x: number; w: number } | null>(null)

  const open = useStore(s => s.open)
  const tab = useStore(s => s.tab)
  const detailTaskId = useStore(s => s.detailTaskId)
  const createRecipeId = useStore(s => s.createRecipeId)
  const recipesOpen = useStore(s => s.recipesOpen)

  const selectTab = (next: DrawerTab) => {
    actions.selectTab(next)
    setUserWidth(undefined)
  }

  // A user drag pins a fixed width; otherwise each tab shares the
  // conversation-relative default for the current viewport.
  const defaultWidth = defaultWidthFor(viewport)
  const width = userWidth ?? defaultWidth
  const currentWidth = drawerRef.current?.offsetWidth ?? defaultWidth

  // Re-derive the conversation-relative default whenever the window resizes.
  useEffect(() => {
    const onResize = () => { setViewport(window.innerWidth) }
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize) }
  }, [])

  const onResizeDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    dragStart.current = { x: event.clientX, w: currentWidth }
    const el = resizeRef.current
    if (el !== null && typeof el.setPointerCapture === 'function') {
      el.setPointerCapture(event.pointerId)
    }
  }
  const onResizeMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStart.current
    if (drag === null) return
    const maxWidth = Math.min(WIDTH_MAX, window.innerWidth * VIEWPORT_SHARE)
    setUserWidth(Math.max(WIDTH_MIN, Math.min(maxWidth, drag.w + (drag.x - event.clientX))))
  }
  const onResizeUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStart.current = null
    const el = resizeRef.current
    if (el !== null && typeof el.hasPointerCapture === 'function' && el.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId)
    }
  }

  /** Owner share for the tasks/create seats, derived from store actions. */
  const owner: DrawerTasksOwnerProps = {
    openDetail: (taskId) => { actions.openDetail(taskId) },
    openInbox: () => { actions.selectTab('inbox') },
    openCreate: (recipeId) => { actions.openCreate(recipeId) },
    initialRecipeId: createRecipeId,
  }

  if (!open) return null

  return (
    <div
      ref={drawerRef}
      className={css.drawer}
      style={{ width: `${width}px` }}
      role="dialog"
      aria-label={t('trigger')}
    >
      <div
        ref={resizeRef}
        className={css.resize}
        role="separator"
        aria-orientation="vertical"
        aria-label={t('resize')}
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
      />
      <div className={css.head}>
        <span className={css.headTitle}>{t('trigger')}</span>
        <button
          type="button"
          className={css.recipesButton}
          onClick={() => { actions.openRecipes() }}
          title={t('tab.recipeLibrary')}
        >
          {t('tab.recipeLibrary')}
        </button>
        <button type="button" className={css.close} onClick={() => { actions.closeDrawer() }}>
          {t('close')}
        </button>
      </div>
      <div className={css.tabs} role="tablist">
        {(['tasks', 'taskList', 'inbox', 'clarifications'] as const).map(key => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? css.tabOn : css.tabOff}
            onClick={() => { selectTab(key) }}
          >
            {t(`tab.${key}` as const)}
          </button>
        ))}
      </div>
      {tab === 'detail' || tab === 'create' ? (
        <div className={css.drillBar}>
          <button type="button" className={css.back} onClick={() => { actions.back() }}>
            {t('back')}
          </button>
          <span className={css.drillTitle}>{t(`tab.${tab}` as const)}</span>
        </div>
      ) : null}
      <div className={css.body}>
        {tab === 'tasks' && renderSlot('workbench.drawer.tasks', owner)}
        {tab === 'taskList' && renderSlot('workbench.drawer.taskList', owner)}
        {tab === 'inbox' && renderSlot('workbench.drawer.inbox', {})}
        {tab === 'clarifications' && renderSlot('workbench.drawer.clarifications', {})}
        {tab === 'detail' && renderSlot('workbench.drawer.detail', { taskId: detailTaskId, openInbox: owner.openInbox })}
        {tab === 'create' && renderSlot('workbench.drawer.create', owner)}
      </div>
      {renderSlot('workbench.drawer.recipeLibrary', { open: recipesOpen, onClose: () => { actions.closeRecipes() } }) }
    </div>
  )
}
