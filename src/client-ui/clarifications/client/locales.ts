/** `clarifications` namespace dictionaries. */

/** Dictionary namespace owned by this plugin. */
export const NS = 'clarifications'

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'refresh': '刷新',
  'loading': '加载中…',
  'empty': '暂无待澄清项',
  'error.load': '加载失败：{code}',
  'revision': '版本 {revision}',
  'source.item': '条目 {id}',
  'status.open': '待澄清',
  'status.resolved': '已处理',
  'status.invalidated': '已失效',
  'status.stale': '已过时',
  'kind.b-confirm': '确认',
  'kind.c-decision': '决策',
  'kind.clarification': '澄清',
  'kind.recovery': '恢复',
  'section.clarifications': '待澄清',
} as const

/** English dictionary, key-identical to the Chinese source of truth. */
export const en: Record<ClarificationsKey, string> = {
  'refresh': 'Refresh',
  'loading': 'Loading…',
  'empty': 'No open clarifications',
  'error.load': 'Load failed: {code}',
  'revision': 'rev {revision}',
  'source.item': 'item {id}',
  'status.open': 'open',
  'status.resolved': 'resolved',
  'status.invalidated': 'invalidated',
  'status.stale': 'stale',
  'kind.b-confirm': 'confirm',
  'kind.c-decision': 'decision',
  'kind.clarification': 'clarification',
  'kind.recovery': 'recovery',
  'section.clarifications': 'Clarifications',
}

/** Dictionary key union derived from the Chinese source of truth. */
export type ClarificationsKey = keyof typeof zh
