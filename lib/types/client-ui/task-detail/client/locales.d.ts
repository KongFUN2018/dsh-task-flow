/** `taskDetail` namespace dictionaries. */
/** Dictionary namespace owned by this plugin. */
export declare const NS = "taskDetail";
/** Simplified Chinese dictionary (the key-set source of truth). */
export declare const zh: {
    readonly 'runs.current': "当前 Run #{runId}";
    readonly 'runs.archived': "已归档 Run #{runId}（rewind 退役）";
    readonly 'gate.class.a': "A · 机器强制";
    readonly 'gate.class.b': "B · 人工确认";
    readonly 'gate.class.c': "C · 人工仲裁";
    readonly 'gate.stale': "（已失效）";
    readonly 'phase.superseded': "已归档";
    readonly 'verb.patch': "patch · 原地修正";
    readonly 'verb.rewind': "rewind · 打回重走";
    readonly 'hint.patch': "进入上游会话修正后，Gate 将重验。";
    readonly 'patch.title': "提交产物修正";
    readonly 'patch.placeholder': "描述要修正的产物内容……";
    readonly 'patch.submit': "提交修正";
    readonly 'patch.pending': "提交中…";
    readonly 'patch.cancel': "取消";
    readonly 'patch.error': "修正失败：{code}";
    readonly 'rewind.title': "打回重走";
    readonly 'rewind.rootsHint': "选择打回起点（当前有效输入版本）：";
    readonly 'rewind.rootsEmpty': "当前运行无可打回的产物版本";
    readonly 'rewind.confirm': "发起打回";
    readonly 'rewind.previewTitle': "影响预览";
    readonly 'rewind.previewVersions': "{count} 个产物版本将失效";
    readonly 'rewind.previewPhases': "{count} 个阶段将在新 Run 重开";
    readonly 'rewind.previewClarifications': "{count} 条澄清可复用";
    readonly 'rewind.goInbox': "前往审批中心处理决策";
    readonly 'rewind.success': "打回决策已挂载，请到审批中心确认。";
    readonly 'rewind.error': "打回失败：{code}";
    readonly 'rewind.cancel': "取消";
    readonly loading: "加载中…";
    readonly empty: "从任务列表选择一个任务查看详情";
    readonly 'not-found': "任务不存在";
    readonly 'error.load': "加载失败：{code}";
    readonly revision: "版本 {revision}";
    readonly phases: "阶段运行";
    readonly gates: "门禁结论";
    readonly none: "无";
    readonly passed: "通过";
    readonly failed: "未通过";
};
/** English dictionary, key-identical to the Chinese source of truth. */
export declare const en: Record<TaskDetailKey, string>;
/** Dictionary key union derived from the Chinese source of truth. */
export type TaskDetailKey = keyof typeof zh;
//# sourceMappingURL=locales.d.ts.map