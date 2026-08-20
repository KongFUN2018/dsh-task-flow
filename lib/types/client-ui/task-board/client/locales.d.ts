/** `taskBoard` namespace dictionaries. */
/** Dictionary namespace owned by this plugin. */
export declare const NS = "taskBoard";
/** Simplified Chinese dictionary (the key-set source of truth). */
export declare const zh: {
    readonly 'kpi.live': "运行中任务";
    readonly 'kpi.gate': "待审查项";
    readonly 'kpi.ask': "未决疑问";
    readonly 'kpi.asset': "已登记产物";
    readonly 'kpi.empty': "—";
    readonly 'phase.progress': "阶段 {current}/{total}";
    readonly 'gate.badge': "Gate {kind} ⏳";
    readonly recipe: "模板 {recipeId}";
    readonly refresh: "刷新";
    readonly refreshing: "刷新中…";
    readonly synced: "已同步 · {time}";
    readonly 'chart.throughput': "近 7 日任务吞吐";
    readonly 'chart.throughputHint': "每日新增完成阶段数";
    readonly 'chart.gateRate': "Gate 通过率";
    readonly loading: "加载中…";
    readonly empty: "暂无任务";
    readonly 'error.load': "加载失败：{code}";
    readonly 'error.command': "操作失败：{code}，已重新同步";
    readonly revision: "版本 {revision}";
    readonly open: "打开任务 {taskId}";
    readonly 'state.planning': "规划中";
    readonly 'state.running': "运行中";
    readonly 'state.awaiting-input': "等待输入";
    readonly 'state.awaiting-decision': "等待决策";
    readonly 'state.pausing': "暂停中";
    readonly 'state.paused': "已暂停";
    readonly 'state.cancelling': "取消中";
    readonly 'state.cancelled': "已取消";
    readonly 'state.completed': "已完成";
    readonly 'state.failed': "已失败";
    readonly 'verb.pause': "暂停";
    readonly 'verb.resume': "继续";
    readonly 'verb.cancel': "取消";
};
/** English dictionary, key-identical to the Chinese source of truth. */
export declare const en: Record<TaskBoardKey, string>;
/** Dictionary key union derived from the Chinese source of truth. */
export type TaskBoardKey = keyof typeof zh;
//# sourceMappingURL=locales.d.ts.map