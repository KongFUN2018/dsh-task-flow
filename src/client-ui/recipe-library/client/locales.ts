/** `recipeLibrary` namespace dictionaries. */

/** Dictionary namespace owned by this plugin. */
export const NS = 'recipeLibrary' as const

/** Dictionary keys the recipe library registers. */
export type RecipeLibraryKey =
  | 'title'
  | 'loading'
  | 'empty'
  | 'error.load'
  | 'error.action'
  | 'meta'
  | 'description'
  | 'edit'
  | 'delete'
  | 'deleting'
  | 'create'
  | 'createTitle'
  | 'editTitle'
  | 'field.id'
  | 'field.idHint'
  | 'field.payload'
  | 'save'
  | 'saving'
  | 'cancel'
  | 'close'
  | 'refresh'

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh: Record<RecipeLibraryKey, string> = {
  'title': 'Recipe 库',
  'loading': '加载中…',
  'empty': '暂无可用模板',
  'error.load': '模板加载失败：{code}',
  'error.action': '操作失败：{code}',
  'meta': '{phases} 阶段 · {checks} 道闸 · {deliverables} 产物',
  'description': '该模板由 {phases} 个阶段组成：{goals}',
  'edit': '编辑',
  'delete': '删除',
  'deleting': '删除中…',
  'create': '新建模板',
  'createTitle': '新建 Recipe 模板',
  'editTitle': '编辑 Recipe 模板（新增修订版）',
  'field.id': '模板标识（recipeId）',
  'field.idHint': '如：需求研发 / prd',
  'field.payload': '模板内容（phase / gateCheck 的 JSON）',
  'save': '保存',
  'saving': '保存中…',
  'cancel': '取消',
  'close': '关闭',
  'refresh': '刷新',
}

/** English dictionary, key-identical to the Chinese source of truth. */
export const en: Record<RecipeLibraryKey, string> = {
  'title': 'Recipe library',
  'loading': 'Loading…',
  'empty': 'No recipes available',
  'error.load': 'Recipes failed to load: {code}',
  'error.action': 'Action failed: {code}',
  'meta': '{phases} phases · {checks} checks · {deliverables} deliverables',
  'description': 'Runs through {phases} phases: {goals}',
  'edit': 'Edit',
  'delete': 'Delete',
  'deleting': 'Deleting…',
  'create': 'New recipe',
  'createTitle': 'Create recipe template',
  'editTitle': 'Edit recipe template (new revision)',
  'field.id': 'Recipe id',
  'field.idHint': 'e.g. requirement / prd',
  'field.payload': 'Recipe payload (phases / gateChecks JSON)',
  'save': 'Save',
  'saving': 'Saving…',
  'cancel': 'Cancel',
  'close': 'Close',
  'refresh': 'Refresh',
}
