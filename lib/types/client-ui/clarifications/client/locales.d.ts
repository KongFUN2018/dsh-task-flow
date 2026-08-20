/** `clarifications` namespace dictionaries. */
/** Dictionary namespace owned by this plugin. */
export declare const NS = "clarifications";
/** Simplified Chinese dictionary (the key-set source of truth). */
export declare const zh: {
    readonly refresh: "刷新";
    readonly loading: "加载中…";
    readonly empty: "暂无待澄清项";
    readonly 'error.load': "加载失败：{code}";
    readonly revision: "版本 {revision}";
    readonly 'source.item': "条目 {id}";
    readonly 'status.open': "待澄清";
    readonly 'status.resolved': "已处理";
    readonly 'status.invalidated': "已失效";
    readonly 'status.stale': "已过时";
    readonly 'kind.b-confirm': "确认";
    readonly 'kind.c-decision': "决策";
    readonly 'kind.clarification': "澄清";
    readonly 'kind.recovery': "恢复";
    readonly 'section.clarifications': "待澄清";
};
/** English dictionary, key-identical to the Chinese source of truth. */
export declare const en: Record<ClarificationsKey, string>;
/** Dictionary key union derived from the Chinese source of truth. */
export type ClarificationsKey = keyof typeof zh;
//# sourceMappingURL=locales.d.ts.map