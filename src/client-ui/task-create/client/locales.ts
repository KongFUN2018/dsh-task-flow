/** `uiTaskCreate` namespace dictionaries. */

export const NS = 'uiTaskCreate' as const

/** Dictionary keys the create wizard registers. */
export type UiTaskCreateKey =
  | 'title'
  | 'column.recipe'
  | 'column.preview'
  | 'column.config'
  | 'empty'
  | 'error.load'
  | 'goal.label'
  | 'goal.placeholder'
  | 'workspace.label'
  | 'review.label'
  | 'review.detail'
  | 'recipe.meta'
  | 'preview.empty'
  | 'create'
  | 'cancel'

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh: Record<UiTaskCreateKey, string> = {
  'title': '新建任务 · 选择处理模板',
  'column.recipe': '1 · 任务类型（Recipe）',
  'column.preview': '2 · 流程预览',
  'column.config': '3 · 目标与配置',
  'empty': '无可用模板',
  'error.load': '模板加载失败：{code}',
  'goal.label': '任务目标',
  'goal.placeholder': '描述要达成的结果…',
  'workspace.label': '关联 Workspace',
  'review.label': '审查策略',
  'review.detail': 'A 机器强制 · B 人工确认 · C 人工仲裁（默认折叠）',
  'recipe.meta': '{phases} 阶段 · {checks} 道闸 · {deliverables} 产物',
  'preview.empty': '选中左侧模板查看流程预览',
  'create': '创建并开始第一阶段',
  'cancel': '取消',
}

/** English dictionary, key-identical to the Chinese source of truth. */
export const en: Record<UiTaskCreateKey, string> = {
  'title': 'New task · choose a recipe',
  'column.recipe': '1 · Recipe',
  'column.preview': '2 · Phase preview',
  'column.config': '3 · Goal & config',
  'empty': 'No recipes available',
  'error.load': 'Recipes failed to load: {code}',
  'goal.label': 'Goal',
  'goal.placeholder': 'Describe the outcome…',
  'workspace.label': 'Workspace',
  'review.label': 'Review policy',
  'review.detail': 'A machine-mandatory · B human confirm · C human arbitration (folded by default)',
  'recipe.meta': '{phases} phases · {checks} checks · {deliverables} deliverables',
  'preview.empty': 'Pick a recipe on the left to preview its phases',
  'create': 'Create and start phase one',
  'cancel': 'Cancel',
}
