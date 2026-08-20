import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './TaskCreateProposalView.module.css';
function proposalOf(view) {
    const result = 'kind' in view ? view : undefined;
    if (result === undefined || result.resultView === null)
        return undefined;
    const data = result.resultView;
    if (typeof data.recipeId !== 'string' || typeof data.idempotencyKey !== 'string')
        return undefined;
    return {
        recipeId: data.recipeId,
        goal: typeof data.goal === 'string' ? data.goal : '',
        inheritSession: data.inheritSession === true,
        phaseCount: typeof data.phaseCount === 'number' ? data.phaseCount : 0,
        checks: typeof data.checks === 'number' ? data.checks : 0,
        idempotencyKey: data.idempotencyKey,
    };
}
/** The keyed tool.call.toolview card for task_create: proposal, inherit toggle, confirm/cancel. */
export function TaskCreateProposalView(props) {
    const { block, t, confirm } = props;
    const proposal = proposalOf(block);
    const [inherit, setInherit] = useState(proposal?.inheritSession === true);
    const [busy, setBusy] = useState(false);
    const [createdTaskId, setCreatedTaskId] = useState(undefined);
    if (proposal === undefined)
        return null;
    if (createdTaskId !== undefined) {
        return _jsx("div", { className: css.card, children: t('confirmed', { taskId: createdTaskId }) });
    }
    return (_jsxs("div", { className: css.card, children: [_jsx("p", { className: css.title, children: t('title') }), _jsxs("div", { className: css.meta, children: [_jsxs("span", { children: [t('recipe'), ": ", proposal.recipeId] }), _jsxs("span", { children: [t('phases', { count: String(proposal.phaseCount) }), " \u00B7 ", t('checks', { count: String(proposal.checks) })] })] }), proposal.goal !== '' && _jsxs("p", { className: css.goal, children: [t('goal'), ": ", proposal.goal] }), _jsxs("label", { className: css.inherit, children: [_jsx("input", { type: "checkbox", checked: inherit, onChange: (event) => { setInherit(event.target.checked); } }), _jsx("span", { children: t('inherit.label') })] }), _jsx("p", { className: css.hint, children: t('inherit.hint') }), _jsxs("div", { className: css.actions, children: [_jsx(Button, { size: "sm", variant: "ghost", onClick: () => { }, children: t('cancel') }), _jsx(Button, { size: "sm", variant: "primary", disabled: busy, onClick: () => {
                            setBusy(true);
                            void confirm(proposal, inherit).then((taskId) => {
                                setBusy(false);
                                setCreatedTaskId(taskId);
                            }).catch(() => { setBusy(false); });
                        }, children: t('confirm') })] })] }));
}
//# sourceMappingURL=TaskCreateProposalView.js.map