import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Button, StateDot } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './TaskDetailAction.module.css';
/** Locale keys of the three gate classes, keyed by the GateCheckResult kind. */
const GATE_CLASS_KEYS = { A: 'gate.class.a', B: 'gate.class.b', C: 'gate.class.c' };
/** Closed-union exhaustiveness fence for the wire task-state set. */
/* v8 ignore next 3 -- closed-union backstop; only reached if a state is forged */
function assertNever(value) {
    throw new Error(`unhandled task state: ${JSON.stringify(value)}`);
}
/** Status marker semantics for the task row. */
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
/**
 * Render the drawer's task-detail tab body: the owner-selected task's
 * projection, phase runs, and gate verdicts. A `taskId` change reloads
 * through the controller; no selection renders the empty state.
 * @param props - composed slot props (owner taskId, locale, inject face).
 * @returns the detail panel filling the drawer's tab body.
 */
export function TaskDetailAction(props) {
    const { taskId, t, useDetail, load, requestRewind, requestPatch, openInbox } = props;
    const detail = useDetail(state => state);
    const [showRoots, setShowRoots] = useState(false);
    const [selected, setSelected] = useState([]);
    const [pending, setPending] = useState(false);
    const [preview, setPreview] = useState(undefined);
    const [rewindError, setRewindError] = useState(undefined);
    const [showPatch, setShowPatch] = useState(false);
    const [patchNote, setPatchNote] = useState('');
    const [patchPending, setPatchPending] = useState(false);
    const [patchError, setPatchError] = useState(undefined);
    useEffect(() => {
        if (taskId !== undefined)
            load(taskId);
    }, [taskId, load]);
    useEffect(() => {
        // Reset the pickers when the selection moves to another task.
        setShowRoots(false);
        setPreview(undefined);
        setRewindError(undefined);
        setShowPatch(false);
        setPatchNote('');
        setPatchError(undefined);
    }, [taskId]);
    const requestRewindFlow = async () => {
        if (taskId === undefined || selected.length === 0)
            return;
        setPending(true);
        setRewindError(undefined);
        try {
            const result = await requestRewind(taskId, [...selected], 'workbench-ui', crypto.randomUUID());
            setPreview(result);
        }
        catch (error) {
            const code = error.code ?? 'unknown';
            setRewindError(code);
        }
        finally {
            setPending(false);
        }
    };
    const requestPatchFlow = async () => {
        if (taskId === undefined)
            return;
        const target = detail.phaseRuns.find(run => run.activeSubmissionId !== undefined);
        if (target === undefined || patchNote.trim().length === 0)
            return;
        setPatchPending(true);
        setPatchError(undefined);
        try {
            await requestPatch(taskId, String(target.phaseRunId), patchNote.trim(), 'workbench-ui', crypto.randomUUID());
            setPatchNote('');
            setShowPatch(false);
            load(taskId);
        }
        catch (error) {
            const code = error.code ?? 'unknown';
            setPatchError(code);
        }
        finally {
            setPatchPending(false);
        }
    };
    return (_jsxs("div", { className: css.panel, children: [taskId === undefined && _jsx("p", { className: css.statusLine, children: t('empty') }), taskId !== undefined && detail.status === 'loading' && _jsx("p", { className: css.statusLine, children: t('loading') }), taskId !== undefined && detail.status === 'failed' && (_jsx("p", { className: css.errorLine, role: "alert", children: detail.error === 'not-found' ? t('not-found') : t('error.load', { code: detail.error ?? '' }) })), taskId !== undefined && detail.status === 'ready' && detail.task !== undefined && (_jsxs("div", { className: css.body, children: [_jsxs("div", { className: css.taskRow, children: [_jsx(StateDot, { state: dotState(detail.task.state), className: css.rowDot }), _jsx("span", { className: css.itemId, children: detail.task.taskId }), _jsxs("span", { className: css.meta, children: [detail.task.state, " \u00B7 ", t('revision', { revision: detail.task.revision })] })] }), detail.digest !== undefined && detail.digest.runs.length > 1 && (_jsxs("p", { className: css.runLine, children: [t('runs.current', { runId: (detail.digest.runs[0]?.runId ?? '') }), detail.digest.runs.slice(1).map(run => ' · ' + t('runs.archived', { runId: run.runId }))] })), _jsx("p", { className: css.section, children: t('phases') }), detail.phaseRuns.length === 0 && _jsx("p", { className: css.statusLine, children: t('none') }), _jsx("ol", { className: css.timeline, children: detail.phaseRuns.map((phase) => {
                            const archived = phase.state === 'superseded' || phase.state === 'stale' || phase.state === 'cancelled';
                            return (_jsxs("li", { className: archived ? css.archivedPhase : undefined, children: [_jsx("span", { className: css.itemId, children: phase.phaseId }), _jsxs("span", { className: css.meta, children: [phase.state === 'superseded' ? t('phase.superseded') : phase.state, ' ', "\u00B7 ", t('revision', { revision: phase.revision })] })] }, phase.phaseRunId));
                        }) }), _jsx("p", { className: css.section, children: t('gates') }), detail.gateResults.length === 0 && _jsx("p", { className: css.statusLine, children: t('none') }), ['A', 'B', 'C'].map((kind) => {
                        const checks = detail.gateResults.filter(gate => (gate.kind ?? 'A') === kind);
                        if (checks.length === 0)
                            return null;
                        return (_jsxs("div", { className: css.gateGroup, children: [_jsx("p", { className: css.gateClass, children: t(GATE_CLASS_KEYS[kind]) }), _jsx("ul", { className: css.list, children: checks.map(gate => (_jsxs("li", { className: css.row, children: [_jsx("span", { className: css.itemId, children: gate.checkId }), _jsxs("span", { className: css.meta, children: [gate.passed ? t('passed') : t('failed'), gate.stale === true ? t('gate.stale') : ''] })] }, `${String(gate.submissionId)}:${gate.checkId}`))) })] }, kind));
                    }), _jsxs("div", { className: css.verbRow, children: [_jsx(Button, { size: "sm", variant: "outline", onClick: () => { setShowPatch(show => !show); }, children: t('verb.patch') }), _jsx(Button, { size: "sm", variant: "primary", disabled: pending, onClick: () => { setShowRoots(show => !show); setPreview(undefined); setRewindError(undefined); }, children: t('verb.rewind') })] }), showPatch && (_jsxs("div", { className: css.patchPanel, children: [_jsx("p", { className: css.section, children: t('patch.title') }), _jsx("textarea", { className: css.patchNote, value: patchNote, onChange: (event) => { setPatchNote(event.target.value); }, placeholder: t('patch.placeholder'), rows: 3 }), _jsxs("div", { className: css.patchActions, children: [_jsx(Button, { size: "sm", variant: "primary", disabled: patchPending || patchNote.trim().length === 0, onClick: () => { void requestPatchFlow(); }, children: patchPending ? t('patch.pending') : t('patch.submit') }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => { setShowPatch(false); }, children: t('patch.cancel') })] }), patchError !== undefined && _jsx("p", { className: css.errorLine, role: "alert", children: t('patch.error', { code: patchError }) })] })), showRoots && preview === undefined && (_jsxs("div", { className: css.rewindPanel, children: [_jsx("p", { className: css.section, children: t('rewind.title') }), detail.rootVersions.length === 0 && _jsx("p", { className: css.statusLine, children: t('rewind.rootsEmpty') }), detail.rootVersions.length > 0 && (_jsxs("div", { className: css.rootList, children: [_jsx("p", { className: css.rootsHint, children: t('rewind.rootsHint') }), detail.rootVersions.map((root) => {
                                        const rootKey = String(root.versionId);
                                        const checked = selected.includes(rootKey);
                                        const toggle = () => {
                                            setSelected(prev => checked ? prev.filter(id => id !== rootKey) : [...prev, rootKey]);
                                        };
                                        return (_jsxs("label", { className: css.rootRow, children: [_jsx("input", { type: "checkbox", checked: checked, onChange: toggle }), _jsx("span", { className: css.itemId, children: root.deliverableId }), _jsxs("span", { className: css.meta, children: [root.phaseId, " \u00B7 ", root.versionId] })] }, rootKey));
                                    })] })), rewindError !== undefined && (_jsx("p", { className: css.errorLine, role: "alert", children: t('rewind.error', { code: rewindError }) })), _jsx(Button, { size: "sm", variant: "primary", disabled: selected.length === 0 || pending, onClick: () => { void requestRewindFlow(); }, children: pending ? t('loading') : t('rewind.confirm') }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => { setShowRoots(false); }, children: t('rewind.cancel') })] })), preview !== undefined && (_jsxs("div", { className: css.rewindPanel, children: [_jsx("p", { className: css.section, children: t('rewind.previewTitle') }), _jsxs("ul", { className: css.list, children: [_jsx("li", { className: css.row, children: _jsx("span", { className: css.itemId, children: t('rewind.previewVersions', { count: preview.invalidatedVersionIds.length }) }) }), _jsx("li", { className: css.row, children: _jsx("span", { className: css.itemId, children: t('rewind.previewPhases', { count: preview.rerunPhaseIds.length }) }) }), _jsx("li", { className: css.row, children: _jsx("span", { className: css.itemId, children: t('rewind.previewClarifications', { count: preview.reusableClarificationIds.length }) }) })] }), _jsx("p", { className: css.successLine, role: "status", children: t('rewind.success') }), _jsx(Button, { size: "sm", variant: "primary", onClick: openInbox, children: t('rewind.goInbox') })] }))] }))] }));
}
//# sourceMappingURL=TaskDetailAction.js.map