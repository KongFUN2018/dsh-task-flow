import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, StateDot } from '@deepseek-ai/dsh-client-ui-primitives';
import { openClarification } from "./clarifications.js";
import css from './ClarificationsAction.module.css';
/** Closed-union exhaustiveness fence for the wire kind set. */
/* v8 ignore next 3 -- closed-union backstop; only reached if a kind is forged */
function assertNever(value) {
    throw new Error(`unhandled attention kind: ${JSON.stringify(value)}`);
}
/** Status marker semantics for one item row. */
function dotState(status) {
    switch (status) {
        case 'open': return 'warning';
        case 'resolved': return 'done';
        case 'invalidated': return 'error';
        case 'stale': return 'warning';
        /* v8 ignore next -- closed wire status union */
        default: return assertNever(status);
    }
}
/** Human status word for one item row. */
function statusLabel(status, t) {
    switch (status) {
        case 'open': return t('status.open');
        case 'resolved': return t('status.resolved');
        case 'invalidated': return t('status.invalidated');
        case 'stale': return t('status.stale');
        /* v8 ignore next -- closed wire status union */
        default: return assertNever(status);
    }
}
/** One open-clarification row: read-only, identity and state only. */
function ClarificationRow({ item, t }) {
    return (_jsxs("li", { className: css.row, children: [_jsx(StateDot, { state: dotState(item.status), className: css.rowDot }), _jsxs("div", { className: css.rowMain, children: [_jsx("span", { className: css.source, children: item.title }), _jsxs("span", { className: css.meta, children: [t('source.item', { id: String(item.itemId) }), " \u00B7 ", statusLabel(item.status, t), " \u00B7 ", t('revision', { revision: item.entityRevision })] })] })] }));
}
/**
 * Render the drawer's clarification-queue tab body: the read-only list of
 * open clarification items over the controller store through the inject face.
 * @param props - composed slot props (locale, inject face).
 * @returns the clarification panel filling the drawer's tab body.
 */
export function ClarificationsAction(props) {
    const { t, useClarifications, refresh } = props;
    const queue = useClarifications(state => state);
    const items = queue.items.filter(openClarification);
    return (_jsxs("div", { className: css.panel, children: [queue.status === 'loading' && _jsx("p", { className: css.statusLine, children: t('loading') }), queue.error !== undefined && (_jsx("p", { className: css.errorLine, role: "alert", children: t('error.load', { code: queue.error }) })), queue.status !== 'loading' && items.length === 0 && _jsx("p", { className: css.statusLine, children: t('empty') }), items.length > 0 && (_jsxs("section", { className: css.section, children: [_jsx("h3", { className: css.sectionTitle, children: t('section.clarifications') }), _jsx("ul", { className: css.list, children: items.map(item => (_jsx(ClarificationRow, { item: item, t: t }, String(item.itemId)))) })] })), _jsx("div", { className: css.footer, children: _jsx(Button, { size: "sm", variant: "outline", onClick: refresh, children: t('refresh') }) })] }));
}
//# sourceMappingURL=ClarificationsAction.js.map