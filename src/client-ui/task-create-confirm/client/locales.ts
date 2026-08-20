/** `uiTaskCreateConfirm` namespace dictionaries. */

export const NS = 'uiTaskCreateConfirm' as const

/** Dictionary keys the confirm card registers. */
export type UiTaskCreateConfirmKey =
  | 'title'
  | 'recipe'
  | 'phases'
  | 'checks'
  | 'goal'
  | 'inherit.label'
  | 'inherit.hint'
  | 'confirm'
  | 'cancel'
  | 'confirmed'

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh: Record<UiTaskCreateConfirmKey, string> = {
  'title': '转为任务 · 请确认',
  'recipe': '推断 Recipe',
  'phases': '{count} 阶段',
  'checks': '{count} 道闸',
  'goal': '任务目标',
  'inherit.label': '从当前会话派生第一阶段',
  'inherit.hint': 'fork · seed 继承讨论要点与澄清记录',
  'confirm': '确认创建任务',
  'cancel': '取消',
  'confirmed': '已创建任务 {taskId}',
}

/** English dictionary, key-identical to the Chinese source of truth. */
export const en: Record<UiTaskCreateConfirmKey, string> = {
  'title': 'Turn into a task · confirm',
  'recipe': 'Inferred recipe',
  'phases': '{count} phases',
  'checks': '{count} checks',
  'goal': 'Goal',
  'inherit.label': 'Derive the first phase from this session',
  'inherit.hint': 'fork · seed inherits the discussion and clarification records',
  'confirm': 'Confirm and create',
  'cancel': 'Cancel',
  'confirmed': 'Created task {taskId}',
}
