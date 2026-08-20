import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './RecipeLibraryAction.module.css';
/**
 * One recipe card: name, derived phase/check/deliverable counts, a one-line
 * description, and a `使用模板新建` action. The action switches the drawer to
 * the task-creation wizard tab; the owner's `openCreate` currently takes no
 * recipe, so the card routes only the tab switch (no pre-selection).
 * @param card - the flat card view to render.
 * @param onUse - callback invoked when `使用模板新建` is pressed.
 * @param busy - whether the card's action is momentarily in flight.
 * @param t - recipeLibrary namespace translate.
 */
function RecipeCard({ card, onUse, busy, t }) {
    return (_jsxs("li", { className: css.card, children: [_jsxs("div", { className: css.cardHead, children: [_jsx("span", { className: css.name, children: card.recipeId }), _jsx("span", { className: css.meta, children: t('meta', {
                            phases: String(card.phases),
                            checks: String(card.checks),
                            deliverables: String(card.deliverables),
                        }) })] }), _jsx("p", { className: css.summary, children: t('description', { phases: String(card.phases), goals: card.description }) }), _jsx("div", { className: css.cardFoot, children: _jsx(Button, { size: "sm", variant: "primary", disabled: busy, onClick: () => { onUse(card.recipeId); }, children: busy ? t('creating') : t('use') }) })] }));
}
/**
 * Render the drawer's Recipe-library tab body: a grid of processing-template
 * cards over the loaded catalogue, each `使用模板新建` pressing the owner's
 * `openCreate` to switch into the creation wizard.
 * @param props - composed slot props (owner openCreate, locale, inject face).
 * @returns the recipe card grid filling the drawer's tab body.
 */
export function RecipeLibraryAction(props) {
    const { openCreate, t, useLibrary, refresh } = props;
    const state = useLibrary(snapshot => snapshot);
    // The drawer's openCreate carries the chosen recipe into the wizard: the
    // create tab pre-selects it via the owner's initialRecipeId.
    const [busy, setBusy] = useState(false);
    const handleUse = (recipeId) => {
        setBusy(true);
        openCreate(recipeId);
        window.setTimeout(() => { setBusy(false); }, 300);
    };
    return (_jsxs("div", { className: css.panel, children: [_jsx("h2", { className: css.title, children: t('title') }), state.status === 'loading' && _jsx("p", { className: css.statusLine, children: t('loading') }), state.error !== undefined && (_jsx("p", { className: css.errorLine, role: "alert", children: t('error.load', { code: state.error }) })), state.status === 'ready' && state.cards.length === 0 && _jsx("p", { className: css.statusLine, children: t('empty') }), state.cards.length > 0 && (_jsx("ul", { className: css.grid, children: state.cards.map(card => (_jsx(RecipeCard, { card: card, onUse: handleUse, busy: busy, t: t }, card.recipeId))) })), state.status !== 'loading' && (_jsx("div", { className: css.footer, children: _jsx(Button, { size: "sm", variant: "ghost", onClick: () => { void refresh(); }, children: t('refresh') }) }))] }));
}
//# sourceMappingURL=RecipeLibraryAction.js.map