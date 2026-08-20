/**
 * Workbench drawer UI store: the shared interaction state that rides across
 * the two registrations — the sidebar.footer.action trigger button and the
 * shell.overlay drawer panel. The trigger and the panel are separate slot
 * entries in different containers, so open/tab/detail selection live here
 * (a declared store, per the client layering rules) instead of a single
 * component's local state.
 */
import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-runtime/client'

/** The drawer's tab ids; each dispatches one declared content seat. */
export type DrawerTab = 'tasks' | 'taskList' | 'recipeLibrary' | 'inbox' | 'clarifications' | 'detail' | 'create'

/** Baked write set over the drawer state (the defineStore actions table). */
export type WorkbenchActions = {
  openDrawer: (d: WorkbenchState) => void
  closeDrawer: (d: WorkbenchState) => void
  toggleDrawer: (d: WorkbenchState) => void
  selectTab: (d: WorkbenchState, tab: DrawerTab) => void
  openDetail: (d: WorkbenchState, taskId: string) => void
  setDetailTaskId: (d: WorkbenchState, taskId: string | undefined) => void
  openCreate: (d: WorkbenchState, recipeId?: string) => void
  setCreateRecipeId: (d: WorkbenchState, recipeId: string | undefined) => void
  back: (d: WorkbenchState) => void
}

/** Drawer UI state shared between the trigger button and the panel. */
export type WorkbenchState = {
  /** Whether the right-side drawer panel is open. */
  open: boolean
  /** The active tab, or undefined before any explicit selection. */
  tab: DrawerTab
  /** The selected detail task id, or undefined while none is selected. */
  detailTaskId: string | undefined
  /** The recipe the create tab should pre-select, or undefined for a free pick. */
  createRecipeId: string | undefined
  /** The browsing tab to return to after a drill-in (detail) or create closes. */
  returnTab: DrawerTab
}

/**
 * Create the shared drawer interaction store handle.
 * @returns the store handle (spec + type + identity + factory in one).
 */
export function createWorkbenchStore(): EngineStoreHandle<WorkbenchState, WorkbenchActions> {
  return defineStore({
    init: (): WorkbenchState => ({ open: false, tab: 'tasks', detailTaskId: undefined, createRecipeId: undefined, returnTab: 'tasks' }),
    actions: {
      openDrawer: (d) => { d.open = true },
      closeDrawer: (d) => { d.open = false },
      toggleDrawer: (d) => { d.open = !d.open },
      selectTab: (d, tab: DrawerTab) => { d.tab = tab; d.returnTab = tab },
      openDetail: (d, taskId: string) => { d.returnTab = d.tab; d.tab = 'detail'; d.detailTaskId = taskId },
      setDetailTaskId: (d, taskId: string | undefined) => { d.detailTaskId = taskId },
      openCreate: (d, recipeId?: string) => { d.returnTab = d.tab; d.tab = 'create'; d.createRecipeId = recipeId },
      setCreateRecipeId: (d, recipeId: string | undefined) => { d.createRecipeId = recipeId },
      back: (d) => { d.tab = d.returnTab },
    },
  })
}
