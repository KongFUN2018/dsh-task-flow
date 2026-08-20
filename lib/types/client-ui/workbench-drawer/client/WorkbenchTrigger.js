import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IconBranchOutline16, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './WorkbenchTrigger.module.css';
/**
 * Render the sidebar "任务流程" primary entry: a prominent, accent-styled
 * button (branch icon + label) that toggles the right-side drawer. Rendered
 * wide as a full row; collapsed into the 56px rail as an icon-only entry.
 * @param props - composed slot props for the 'sidebar.footer.action' hole.
 * @returns the trigger button.
 */
export function WorkbenchTrigger(props) {
    const { t, wide, useStore, actions, useBadge } = props;
    const badge = useBadge(state => state);
    const open = useStore(s => s.open);
    return (_jsx(Tooltip, { label: t('trigger'), delayMs: 500, disabled: wide, children: _jsxs("button", { type: "button", className: wide ? css.trigger : css.rail, "aria-haspopup": "dialog", "aria-expanded": open, "aria-label": t('trigger'), onClick: () => { actions.toggleDrawer(); }, children: [_jsx(IconBranchOutline16, { size: wide ? 16 : 18, className: css.icon }), wide && _jsx("span", { className: css.label, children: t('trigger') }), !wide && badge.activeCount > 0 && _jsx("span", { className: css.railDot, "aria-hidden": "true" })] }) }));
}
//# sourceMappingURL=WorkbenchTrigger.js.map