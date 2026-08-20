/** `attentionInbox` namespace dictionaries. */
/** Dictionary namespace owned by this plugin. */
export declare const NS = "attentionInbox";
/** Simplified Chinese dictionary (the key-set source of truth). */
export declare const zh: {
    readonly refresh: "刷新";
    readonly loading: "加载中…";
    readonly empty: "暂无待决策项";
    readonly 'error.load': "加载失败：{code}";
    readonly 'error.command': "操作失败：{code}，已重新同步";
    readonly 'error.conflict': "有 {count} 项未确认（冲突或已被处理），已重新同步";
    readonly revision: "版本 {revision}";
    readonly 'status.open': "待决策";
    readonly 'status.resolved': "已决策";
    readonly 'status.invalidated': "已失效";
    readonly 'status.stale': "已过时";
    readonly 'kind.b-confirm': "确认";
    readonly 'kind.c-decision': "决策";
    readonly 'kind.clarification': "澄清";
    readonly 'kind.recovery': "恢复";
    readonly 'section.batch': "机器判定 + 人工确认";
    readonly 'section.decision': "需要拍板";
    readonly 'section.readonly': "跟踪项";
    readonly selected: "已选 {count} 项";
    readonly clear: "清除";
    readonly confirm: "确认选中";
    readonly confirmOne: "确认";
    readonly decide: "提交决策";
    readonly 'decision.placeholder': "输入决策选项";
};
/** English dictionary, key-identical to the Chinese source of truth. */
export declare const en: Record<AttentionInboxKey, string>;
/** Dictionary key union derived from the Chinese source of truth. */
export type AttentionInboxKey = keyof typeof zh;
//# sourceMappingURL=locales.d.ts.map