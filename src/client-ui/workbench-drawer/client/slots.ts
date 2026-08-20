/**
 * Workbench drawer slot contract: the three content seats the drawer shell
 * declares inside its `shell.overlay` entry. The shell owns the floating
 * trigger, the drawer geometry (open state, tab selection, width), and the
 * seat dispatch; content packages register their panels into these seats and
 * receive only the owner shares declared here.
 */
declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /**
     * The task-list tab body of the workbench drawer. Declared by the drawer
     * shell's `shell.overlay` entry; the task board package registers the
     * cross-session task list here.
     */
    'workbench.drawer.tasks': { kind: 'single'; scope: 'root'; owner: DrawerTasksOwnerProps }
    /**
     * The attention-inbox tab body of the workbench drawer. Declared by the
     * drawer shell's `shell.overlay` entry; the attention-inbox package
     * registers the B batch-confirm list and C decision cards here.
     */
    'workbench.drawer.inbox': { kind: 'single'; scope: 'root' }
    /**
     * The task-detail tab body of the workbench drawer. Declared by the
     * drawer shell's `shell.overlay` entry; the task-detail package registers
     * the per-task projection view here.
     */
    'workbench.drawer.detail': { kind: 'single'; scope: 'root'; owner: DrawerDetailOwnerProps }
    /**
     * The pure task-list tab body of the workbench drawer. Declared by the
     * drawer shell's `shell.overlay` entry; a focused list view over the same
     * task rows without the KPI/chart chrome (线稿「任务列表」).
     */
    'workbench.drawer.taskList': { kind: 'single'; scope: 'root'; owner: DrawerTasksOwnerProps }
    /**
     * The Recipe-library tab body of the workbench drawer. Declared by the
     * drawer shell's `shell.overlay` entry; renders processing-template cards
     * and routes selection into the wizard (线稿「Recipe 库」).
     */
    'workbench.drawer.recipeLibrary': { kind: 'single'; scope: 'root'; owner: DrawerTasksOwnerProps }
    /**
     * The clarification-queue tab body of the workbench drawer. Declared by the
     * drawer shell's `shell.overlay` entry; a focused view of open clarification
     * items (线稿「澄清队列」).
     */
    'workbench.drawer.clarifications': { kind: 'single'; scope: 'root' }
    /**
     * The task-creation tab body of the workbench drawer. Declared by the
     * drawer shell's `shell.overlay` entry; the create package registers the
     * three-column new-task wizard here.
     */
    'workbench.drawer.create': { kind: 'single'; scope: 'root'; owner: DrawerTasksOwnerProps }
  }
}

/** Owner share of the task-list seat: navigation into the drawer's other tabs. */
export interface DrawerTasksOwnerProps {
  /** Open one task's detail view: switches the drawer to the detail tab. */
  openDetail: (taskId: string) => void
  /** Switch the drawer to the attention-inbox tab (KPI GATE/ASK drill-down). */
  openInbox: () => void
  /** Switch to the creation wizard, optionally pre-selecting a recipe. */
  openCreate: (recipeId?: string) => void
  /** The recipe the create wizard should pre-select, or undefined for a free pick. */
  initialRecipeId: string | undefined
}

/** Owner share of the detail seat: the task whose projection to show. */
export interface DrawerDetailOwnerProps {
  /** The selected task id, or undefined while no task is selected (empty state). */
  taskId: string | undefined
  /** Switch the drawer to the attention-inbox tab (rewind/preview decision). */
  openInbox: () => void
}
