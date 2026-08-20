import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button, Input, StateDot } from '@deepseek-ai/dsh-client-ui-primitives';
import { batchable, decidable } from "./inbox.js";
import css from './AttentionInboxAction.module.css';
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
/** Human kind word for one item row. */
function kindLabel(kind, t) {
    switch (kind) {
        case 'b-confirm': return t('kind.b-confirm');
        case 'c-decision': return t('kind.c-decision');
        case 'clarification': return t('kind.clarification');
        case 'recovery': return t('kind.recovery');
        /* v8 ignore next -- closed wire kind union */
        default: return assertNever(kind);
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
/** One batch-confirmable (B) row: checkbox plus identity and state. */
function BatchRow({ item, checked, onToggle, t }) {
    return (_jsxs("li", { className: css.row, children: [_jsx("input", { type: "checkbox", checked: checked, "aria-label": String(item.itemId), onChange: () => { onToggle(String(item.itemId)); } }), _jsx(StateDot, { state: dotState(item.status), className: css.rowDot }), _jsxs("div", { className: css.rowMain, children: [_jsx("span", { className: css.itemId, children: item.title }), _jsxs("span", { className: css.meta, children: [kindLabel(item.kind, t), " \u00B7 ", statusLabel(item.status, t), " \u00B7 ", t('revision', { revision: item.entityRevision })] })] })] }));
}
/** One single-decision (C) row: decision input plus submit. */
function DecisionRow({ item, draft, onDraft, onSubmit, t }) {
    return (_jsxs("li", { className: css.row, children: [_jsx(StateDot, { state: dotState(item.status), className: css.rowDot }), _jsxs("div", { className: css.rowMain, children: [_jsx("span", { className: css.itemId, children: item.title }), _jsxs("span", { className: css.meta, children: [kindLabel(item.kind, t), " \u00B7 ", statusLabel(item.status, t), " \u00B7 ", t('revision', { revision: item.entityRevision })] })] }), _jsxs("div", { className: css.decision, children: [_jsx(Input, { value: draft, placeholder: t('decision.placeholder'), onChange: (event) => { onDraft(String(item.itemId), event.target.value); } }), _jsx(Button, { size: "sm", variant: "primary", disabled: draft.trim() === '', onClick: () => { onSubmit(String(item.itemId), draft.trim()); }, children: t('decide') })] })] }));
}
/** One read-only (clarification/recovery) row: identity and state only. */
function ReadonlyRow({ item, t }) {
    return (_jsxs("li", { className: css.row, children: [_jsx(StateDot, { state: dotState(item.status), className: css.rowDot }), _jsxs("div", { className: css.rowMain, children: [_jsx("span", { className: css.itemId, children: item.title }), _jsxs("span", { className: css.meta, children: [kindLabel(item.kind, t), " \u00B7 ", statusLabel(item.status, t), " \u00B7 ", t('revision', { revision: item.entityRevision })] })] })] }));
}
/**
 * Render the drawer's attention-inbox tab body: the B batch-confirm list,
 * the C single-decision rows, and the read-only items, over the controller
 * store through the inject face.
 * @param props - composed slot props (locale, inject face).
 * @returns the inbox panel filling the drawer's tab body.
 */
export function AttentionInboxAction(props) {
    const { t, useInbox, refresh, confirm, decide } = props;
    const [selected, setSelected] = useState(new Set());
    const [drafts, setDrafts] = useState({});
    const inbox = useInbox(state => state);
    const batchItems = inbox.items.filter(batchable);
    const decisionItems = inbox.items.filter(decidable);
    const readonlyItems = inbox.items.filter(item => !batchable(item) && !decidable(item));
    const toggle = (itemId) => {
        const next = new Set(selected);
        if (next.has(itemId))
            next.delete(itemId);
        else
            next.add(itemId);
        setSelected(next);
    };
    const submitBatch = () => {
        const targets = batchItems
            .filter(item => selected.has(String(item.itemId)))
            .map(item => ({ itemId: item.itemId, expectedEntityRevision: item.entityRevision }));
        confirm(targets);
        setSelected(new Set());
    };
    const submitDecision = (itemId, decision) => {
        decide(itemId, decision);
        setDrafts(prev => ({ ...prev, [itemId]: '' }));
    };
    return (_jsxs("div", { className: css.panel, children: [inbox.status === 'loading' && _jsx("p", { className: css.statusLine, children: t('loading') }), inbox.error !== undefined && inbox.error.startsWith('conflict:') && inbox.conflictCount > 0 && (_jsx("p", { className: css.errorLine, role: "alert", children: t('error.conflict', { count: inbox.conflictCount }) })), inbox.error !== undefined && !inbox.error.startsWith('conflict:') && (_jsx("p", { className: css.errorLine, role: "alert", children: t(inbox.status === 'failed' ? 'error.load' : 'error.command', { code: inbox.error }) })), inbox.status !== 'loading' && inbox.items.length === 0 && _jsx("p", { className: css.statusLine, children: t('empty') }), batchItems.length > 0 && (_jsxs("section", { className: css.section, children: [_jsx("h3", { className: css.sectionTitle, children: t('section.batch') }), _jsx("ul", { className: css.list, children: batchItems.map(item => (_jsx(BatchRow, { item: item, checked: selected.has(String(item.itemId)), onToggle: toggle, t: t }, String(item.itemId)))) }), _jsxs("div", { className: css.batchbar, children: [_jsx("span", { className: css.batchCount, children: t('selected', { count: selected.size }) }), _jsx("span", { className: css.batchSpacer }), _jsx(Button, { size: "sm", variant: "ghost", disabled: selected.size === 0, onClick: () => { setSelected(new Set()); }, children: t('clear') }), _jsx(Button, { size: "sm", variant: "primary", disabled: selected.size === 0, onClick: submitBatch, children: t('confirm') })] })] })), decisionItems.length > 0 && (_jsxs("section", { className: css.section, children: [_jsx("h3", { className: css.sectionTitle, children: t('section.decision') }), _jsx("ul", { className: css.list, children: decisionItems.map(item => (_jsx(DecisionRow, { item: item, draft: drafts[String(item.itemId)] ?? '', onDraft: (id, value) => { setDrafts(prev => ({ ...prev, [id]: value })); }, onSubmit: submitDecision, t: t }, String(item.itemId)))) })] })), readonlyItems.length > 0 && (_jsxs("section", { className: css.section, children: [_jsx("h3", { className: css.sectionTitle, children: t('section.readonly') }), _jsx("ul", { className: css.list, children: readonlyItems.map(item => (_jsx(ReadonlyRow, { item: item, t: t }, String(item.itemId)))) })] })), _jsx("div", { className: css.footer, children: _jsx(Button, { size: "sm", variant: "outline", onClick: refresh, children: t('refresh') }) })] }));
}
//# sourceMappingURL=AttentionInboxAction.js.map