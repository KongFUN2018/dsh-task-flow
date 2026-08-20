import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './TaskBoardAction.module.css';
/**
 * Token-only charts under the KPI row: a last-7-day throughput sparkline and
 * per-class Gate pass-rate bars, both derived from the loaded metrics.
 * @param metrics - the loaded workbench metrics projection.
 * @param t - board namespace translate.
 */
function MetricsCharts({ metrics, t }) {
    const w = 160;
    const h = 44;
    const days = metrics.throughput;
    const max = days.reduce((peak, day) => Math.max(peak, day.completedPhases), 0);
    const pts = days.map((day, i) => {
        const x = days.length === 1 ? w / 2 : w * (i / (days.length - 1));
        const y = max === 0 ? h : h - (h * day.completedPhases) / max;
        return '' + x + ',' + y;
    }).join(' ');
    const rate = [['a', 'A'], ['b', 'B'], ['c', 'C']];
    return (_jsxs("div", { className: css.chartRow, children: [_jsxs("div", { className: css.chartCard, children: [_jsx("span", { className: css.chartTitle, children: t('chart.throughput') }), pts !== '' ? (_jsx("svg", { className: css.sparkline, viewBox: '0 0 ' + w + ' ' + h, role: "img", "aria-label": t('chart.throughput'), children: _jsx("polyline", { points: pts, fill: "none", className: css.sparkLine }) })) : (_jsx("span", { className: css.chartEmpty, children: t('kpi.empty') })), _jsx("span", { className: css.chartHint, children: t('chart.throughputHint') })] }), _jsxs("div", { className: css.chartCard, children: [_jsx("span", { className: css.chartTitle, children: t('chart.gateRate') }), _jsx("div", { className: css.bars, role: "img", "aria-label": t('chart.gateRate'), children: rate.map(([key, label]) => {
                            const pct = Math.round((metrics.gatePassRate[key] ?? 0) * 100);
                            return (_jsxs("div", { className: css.barCol, children: [_jsx("div", { className: css.barTrack, children: _jsx("div", { className: css.barFill, style: { height: pct + '%' } }) }), _jsxs("span", { className: css.barLabel, children: [label, " ", pct, "%"] })] }, key));
                        }) })] })] }));
}
/**
 * Render the drawer's task-list tab body: the cross-session task list with
 * per-row verbs; opening a row switches the drawer to that task's detail.
 * @param props - composed slot props (owner openDetail, locale, inject face).
 * @returns the task list panel filling the drawer's tab body.
 */
export function TaskBoardAction(props) {
    const { openInbox, t, useBoard, refresh } = props;
    const board = useBoard(state => state);
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
    return (_jsxs("div", { className: css.panel, children: [board.status === 'loading' && _jsx("p", { className: css.statusLine, children: t('loading') }), board.metrics !== undefined && (_jsxs(_Fragment, { children: [_jsxs("div", { className: css.kpiRow, children: [_jsxs("div", { className: css.kpiCard, children: [_jsx("span", { className: css.kpiValue, children: board.metrics.live }), _jsx("span", { className: css.kpiLabel, children: t('kpi.live') })] }), _jsxs("button", { type: "button", className: css.kpiCard, onClick: openInbox, children: [_jsx("span", { className: css.kpiValue, children: board.metrics.gate }), _jsx("span", { className: css.kpiLabel, children: t('kpi.gate') })] }), _jsxs("button", { type: "button", className: css.kpiCard, onClick: openInbox, children: [_jsx("span", { className: css.kpiValue, children: board.metrics.ask }), _jsx("span", { className: css.kpiLabel, children: t('kpi.ask') })] }), _jsxs("div", { className: css.kpiCard, children: [_jsx("span", { className: css.kpiValue, children: board.metrics.asset }), _jsx("span", { className: css.kpiLabel, children: t('kpi.asset') })] })] }), _jsx(MetricsCharts, { metrics: board.metrics, t: t })] })), board.error !== undefined && (_jsx("p", { className: css.errorLine, role: "alert", children: t(board.status === 'failed' ? 'error.load' : 'error.command', { code: board.error }) })), board.status !== 'loading' && board.metrics === undefined && _jsx("p", { className: css.statusLine, children: t('empty') }), _jsxs("div", { className: css.footer, children: [_jsx(Button, { size: "sm", variant: "outline", disabled: refreshing, onClick: () => { void handleRefresh(); }, children: refreshing ? t('refreshing') : t('refresh') }), syncedAt !== undefined && !refreshing && (_jsx("span", { className: css.syncedLine, role: "status", children: t('synced', { time: new Date(syncedAt).toLocaleTimeString() }) }))] })] }));
}
//# sourceMappingURL=TaskBoardAction.js.map