import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button, StateDot } from '@deepseek-ai/dsh-client-ui-primitives';
import { verbsFor } from "./taskList.js";
import css from './TaskListAction.module.css';
/**
 * Compact relative activity descriptor, mirroring the session list's time
 * display: just now / minutes / hours / days / an absolute short date beyond
 * a week. The row translates it through the locale keys.
 * @param epoch - the activity timestamp in epoch ms.
 * @param now - the reference time (usually Date.now()).
 * @returns a locale key plus its count, or an absolute date string.
 */
function activityDescriptor(epoch, now) {
    const delta = now - epoch;
    if (delta < 60_000)
        return { key: 'time.justNow', count: 0 };
    if (delta < 3600_000)
        return { key: 'time.minutesAgo', count: Math.floor(delta / 60_000) };
    if (delta < 86400_000)
        return { key: 'time.hoursAgo', count: Math.floor(delta / 3600_000) };
    if (delta < 7 * 86400_000)
        return { key: 'time.daysAgo', count: Math.floor(delta / 86400_000) };
    return new Date(epoch).toLocaleDateString();
}
/** Translate one activity descriptor through its locale key. */
function renderActivity(epoch, now, t) {
    const parsed = activityDescriptor(epoch, now);
    return typeof parsed === 'string'
        ? parsed
        : t(parsed.key, { count: String(parsed.count) });
}
/** Closed-union exhaustiveness fence for the wire state set. */
function assertNever(value) {
    /* v8 ignore next -- unreachable while the wire state union stays closed */
    throw new Error(`unhandled task state: ${JSON.stringify(value)}`);
}
/** Status marker semantics for one task row. */
function dotState(state) {
    switch (state) {
        case 'planning': return 'ongoing';
        case 'running': return 'ongoing';
        case 'completed': return 'done';
        case 'failed': return 'error';
        case 'awaiting-input': return 'warning';
        case 'awaiting-decision': return 'warning';
        case 'pausing': return 'warning';
        case 'paused': return 'warning';
        case 'cancelling': return 'warning';
        case 'cancelled': return 'warning';
        /* v8 ignore next -- closed wire state union */
        default: return assertNever(state);
    }
}
/** Human status word for one task row. */
function stateLabel(state, t) {
    switch (state) {
        case 'planning': return t('state.planning');
        case 'running': return t('state.running');
        case 'awaiting-input': return t('state.awaiting-input');
        case 'awaiting-decision': return t('state.awaiting-decision');
        case 'pausing': return t('state.pausing');
        case 'paused': return t('state.paused');
        case 'cancelling': return t('state.cancelling');
        case 'cancelled': return t('state.cancelled');
        case 'completed': return t('state.completed');
        case 'failed': return t('state.failed');
        /* v8 ignore next -- closed wire state union */
        default: return assertNever(state);
    }
}
/** One task row: state dot, identity, recipe, phase progress, gate badge, recent activity, verbs. */
function TaskRow({ task, progress, gate, activity, t, onCommand, onOpen }) {
    const verbs = verbsFor(task);
    return (_jsxs("li", { className: css.row, tabIndex: 0, role: "button", "aria-label": t('open', { taskId: task.taskId }), onClick: () => { onOpen(task.taskId); }, onKeyDown: (event) => { if (event.key === 'Enter' || event.key === ' ')
            onOpen(task.taskId); }, children: [_jsx(StateDot, { state: dotState(task.state), className: css.rowDot }), _jsxs("div", { className: css.rowMain, children: [_jsx("span", { className: css.taskId, children: task.taskId }), _jsxs("span", { className: css.meta, children: [stateLabel(task.state, t), " \u00B7 ", t('revision', { revision: task.revision }), ' ', "\u00B7 ", t('recipe', { recipeId: String(task.pinnedRecipe.recipeId) }), progress !== undefined && progress.total > 0 && [' · ', t('phase.progress', { current: String(progress.current), total: String(progress.total) })], gate !== undefined && _jsx("span", { className: css.gateBadge, children: t('gate.badge', { kind: gate }) }), ' · ', _jsx("span", { className: css.activity, children: t('recent', { time: renderActivity(activity, Date.now(), t) }) })] })] }), verbs.length > 0 && (_jsx("div", { className: css.verbs, children: verbs.map(verb => (_jsx(Button, { size: "sm", variant: "ghost", onClick: (event) => {
                        event.stopPropagation();
                        onCommand(task.taskId, verb);
                    }, children: t(`verb.${verb}`) }, verb))) }))] }));
}
/**
 * Render the drawer's task-list tab body: a focused list over the same task
 * rows without KPI/chart chrome; opening a row switches the drawer to that
 * task's detail.
 * @param props - composed slot props (owner openDetail, locale, inject face).
 * @returns the task list panel filling the drawer's tab body.
 */
export function TaskListAction(props) {
    const { openDetail, t, useList, refresh, command } = props;
    const list = useList(state => state);
    // Refresh is an explicit user gesture: the button shows a brief ongoing
    // state, then a "synced" confirmation, so a click that re-reads unchanged
    // data still gives visible feedback.
    const [refreshing, setRefreshing] = useState(false);
    const [syncedAt, setSyncedAt] = useState(undefined);
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await refresh();
            setSyncedAt(Date.now());
        }
        finally {
            setRefreshing(false);
        }
    };
    return (_jsxs("div", { className: css.panel, children: [list.status === 'loading' && _jsx("p", { className: css.statusLine, children: t('loading') }), list.error !== undefined && (_jsx("p", { className: css.errorLine, role: "alert", children: t(list.status === 'failed' ? 'error.load' : 'error.command', { code: list.error }) })), list.status !== 'loading' && list.tasks.length === 0 && _jsx("p", { className: css.statusLine, children: t('empty') }), list.tasks.length > 0 && (_jsx("ul", { className: css.list, children: list.tasks.map(task => (_jsx(TaskRow, { task: task, progress: list.phaseProgress.get(String(task.taskId)), gate: list.taskGates.get(String(task.taskId)), activity: list.recentActivity.get(String(task.taskId)) ?? task.createdAt, t: t, onCommand: command, onOpen: openDetail }, task.taskId))) })), _jsxs("div", { className: css.footer, children: [_jsx(Button, { size: "sm", variant: "outline", disabled: refreshing, onClick: () => { void handleRefresh(); }, children: refreshing ? t('refreshing') : t('refresh') }), syncedAt !== undefined && !refreshing && (_jsx("span", { className: css.syncedLine, role: "status", children: t('synced', { time: new Date(syncedAt).toLocaleTimeString() }) }))] })] }));
}
//# sourceMappingURL=TaskListAction.js.map