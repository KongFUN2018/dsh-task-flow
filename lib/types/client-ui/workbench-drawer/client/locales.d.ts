/**
 * Drawer copy: the trigger, the tab labels, the close/resize affordances,
 * and the detail tab's empty state. Registered under one namespace by the
 * client plugin body; the framework synthesizes the typed `t` seat.
 */
/** Namespace key of the drawer's dictionary. */
export declare const NS: "workbenchDrawer";
/** Dictionary keys the drawer registers. */
export type WorkbenchDrawerKey = 'trigger' | 'tab.tasks' | 'tab.taskList' | 'tab.recipeLibrary' | 'tab.inbox' | 'tab.clarifications' | 'tab.create' | 'tab.detail' | 'close' | 'resize' | 'badge.open' | 'state.active' | 'state.idle' | 'detail.empty';
/** Chinese dictionary (product copy language). */
export declare const zh: {
    readonly trigger: "任务流程";
    readonly 'tab.tasks': "任务看板";
    readonly 'tab.taskList': "任务列表";
    readonly 'tab.recipeLibrary': "Recipe 库";
    readonly 'tab.inbox': "审批中心";
    readonly 'tab.clarifications': "澄清队列";
    readonly 'tab.create': "新建";
    readonly 'tab.detail': "详情";
    readonly close: "关闭";
    readonly resize: "拖动调整宽度";
    readonly 'badge.open': "{count} 项待处理";
    readonly 'state.active': "有任务运行中";
    readonly 'state.idle': "无运行中任务";
    readonly 'detail.empty': "从任务列表选择一个任务查看详情";
};
/** English dictionary. */
export declare const en: {
    readonly trigger: "Task Flow";
    readonly 'tab.tasks': "Board";
    readonly 'tab.taskList': "Task list";
    readonly 'tab.recipeLibrary': "Recipe library";
    readonly 'tab.inbox': "Approvals";
    readonly 'tab.clarifications': "Clarifications";
    readonly 'tab.create': "Create";
    readonly 'tab.detail': "Detail";
    readonly close: "Close";
    readonly resize: "Drag to resize";
    readonly 'badge.open': "{count} items pending";
    readonly 'state.active': "Tasks running";
    readonly 'state.idle': "No running tasks";
    readonly 'detail.empty': "Select a task from the list to see its detail";
};
//# sourceMappingURL=locales.d.ts.map