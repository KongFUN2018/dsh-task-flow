/** `taskList` namespace dictionaries. */
/** Dictionary namespace owned by this plugin. */
export declare const NS = "taskList";
/** Simplified Chinese dictionary (the key-set source of truth). */
export declare const zh: {
    readonly 'phase.progress': "阶段 {current}/{total}";
    readonly recipe: "模板 {recipeId}";
    readonly 'gate.badge': "闸机 {kind} ⏳";
    readonly recent: "最近活跃 {time}";
    readonly 'time.justNow': "刚刚";
    readonly 'time.minutesAgo': "{count} 分钟前";
    readonly 'time.hoursAgo': "{count} 小时前";
    readonly 'time.daysAgo': "{count} 天前";
    readonly refresh: "刷新";
    readonly refreshing: "刷新中…";
    readonly synced: "已同步 · {time}";
    readonly loading: "加载中…";
    readonly empty: "暂无任务";
    readonly create: "新建任务";
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
export declare const en: Record<TaskListKey, string>;
/** Dictionary key union derived from the Chinese source of truth. */
export type TaskListKey = keyof typeof zh;
//# sourceMappingURL=locales.d.ts.map