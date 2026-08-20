import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Button, Input } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './TaskCreateAction.module.css';
/** One recipe's phase summary for the preview column. */
function phaseNames(recipe) {
    return recipe.payload.phases.map(phase => phase.goal);
}
function recipeMeta(recipe) {
    const payload = recipe.payload;
    return {
        phases: payload.phases.length,
        checks: payload.gateChecks.length,
    };
}
export function TaskCreateAction(props) {
    const { t, openDetail, initialRecipeId, useCreate, create } = props;
    const state = useCreate(state => state);
    const [selectedId, setSelectedId] = useState(undefined);
    const [goal, setGoal] = useState('');
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        // Pre-select the recipe the Recipe-library chose; ignore an empty initial
        // id so a direct entry into the wizard starts free.
        if (initialRecipeId !== undefined)
            setSelectedId(String(initialRecipeId));
    }, [initialRecipeId]);
    const selected = state.recipes.find(recipe => recipe.recipeId === selectedId);
    return (_jsxs("div", { className: css.panel, children: [_jsx("h2", { className: css.title, children: t('title') }), state.status === 'loading' && _jsx("p", { className: css.statusLine, children: t('column.recipe') }), state.error !== undefined && _jsx("p", { className: css.errorLine, role: "alert", children: t('error.load', { code: state.error }) }), state.status === 'ready' && state.recipes.length === 0 && _jsx("p", { className: css.statusLine, children: t('empty') }), state.status === 'ready' && state.recipes.length > 0 && (_jsxs("div", { className: css.columns, children: [_jsxs("section", { className: css.column, children: [_jsx("p", { className: css.section, children: t('column.recipe') }), _jsx("ul", { className: css.recipeList, children: state.recipes.map(recipe => (_jsx("li", { children: _jsxs("button", { type: "button", className: selectedId === recipe.recipeId ? (css.recipeCard ?? '') + ' ' + (css.recipeCardSelected ?? '') : css.recipeCard, onClick: () => { setSelectedId(recipe.recipeId); }, children: [_jsx("span", { className: css.recipeName, children: recipe.recipeId }), _jsx("span", { className: css.recipeMeta, children: t('recipe.meta', {
                                                    phases: String(recipeMeta(recipe).phases),
                                                    checks: String(recipeMeta(recipe).checks),
                                                    deliverables: '0',
                                                }) })] }) }, recipe.recipeId))) })] }), _jsxs("section", { className: css.column, children: [_jsx("p", { className: css.section, children: t('column.preview') }), selected === undefined && _jsx("p", { className: css.statusLine, children: t('preview.empty') }), selected !== undefined && (_jsx("ol", { className: css.preview, children: phaseNames(selected).map((phase, index) => (_jsx("li", { className: css.previewStep, children: _jsx("span", { className: css.previewName, children: phase }) }, index))) }))] }), _jsxs("section", { className: css.column, children: [_jsx("p", { className: css.section, children: t('column.config') }), _jsxs("label", { className: css.field, children: [_jsx("span", { children: t('goal.label') }), _jsx(Input, { value: goal, onChange: (event) => { setGoal(event.target.value); }, placeholder: t('goal.placeholder') })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { children: t('workspace.label') }), _jsx(Input, { value: "default", readOnly: true })] }), _jsxs("details", { className: css.review, children: [_jsx("summary", { children: t('review.label') }), _jsx("p", { children: t('review.detail') })] })] })] })), state.status !== 'loading' && (_jsxs("div", { className: css.footer, children: [_jsx(Button, { size: "sm", variant: "ghost", onClick: () => { setSelectedId(undefined); setGoal(''); }, children: t('cancel') }), _jsx(Button, { size: "sm", variant: "primary", disabled: selected === undefined || busy, onClick: () => {
                            if (selected === undefined)
                                return;
                            setBusy(true);
                            void create(selected.recipeId, 'default', goal).then((taskId) => {
                                setBusy(false);
                                setSelectedId(undefined);
                                setGoal('');
                                openDetail(taskId);
                            }).catch(() => { setBusy(false); });
                        }, children: t('create') })] }))] }));
}
//# sourceMappingURL=TaskCreateAction.js.map