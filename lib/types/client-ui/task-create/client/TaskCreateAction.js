import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Button } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './TaskCreateAction.module.css';
function recipeMeta(recipe) {
    const payload = recipe.payload;
    const deliverables = new Set(payload.phases.flatMap(phase => phase.outputs.map(output => output)));
    return {
        phases: payload.phases.length,
        checks: payload.gateChecks.length,
        deliverables: deliverables.size,
    };
}
/** The A/B/C gates bound to one phase, for its preview node. */
function gatesFor(recipe, phaseId) {
    return recipe.payload.gateChecks.filter(check => check.phaseId === phaseId);
}
/** Human label for a phase kind via the dictionary; unknown kinds keep their
 *  raw machine kind (the translate function echoes an unregistered key). */
function kindLabel(t, kind) {
    const key = `phase.kind.${kind}`;
    const label = t(key);
    return label === key ? kind : label;
}
/**
 * New-task wizard: pick a recipe, preview its phase flow, then set the goal.
 * The three concerns stack top-to-bottom as numbered steps (1 · 2 · 3), with
 * the phase preview rendered as a visual flow — each phase node shows its
 * sequence, kind badge, full goal, produced outputs, and the A/B/C gates bound
 * to that phase (with circuit-breaker marks). Branch-routing (DAG) is a
 * follow-up iteration; the current model is a serial phase pipeline.
 */
export function TaskCreateAction(props) {
    const { t, openDetail, initialRecipeId, useCreate, useWorkspaces, create, polish } = props;
    const tr = t;
    const state = useCreate(state => state);
    // Real harness workspaces (standard feed; independent baseline lifecycle).
    const workspacesHost = useWorkspaces(snapshot => snapshot);
    const workspaceItems = workspacesHost.items;
    const [selectedId, setSelectedId] = useState(undefined);
    const [workspace, setWorkspace] = useState('default');
    const [goal, setGoal] = useState('');
    const [busy, setBusy] = useState(false);
    const [polishing, setPolishing] = useState(false);
    useEffect(() => {
        // Pre-select the recipe the Recipe-library chose; ignore an empty initial
        // id so a direct entry into the wizard starts free.
        if (initialRecipeId !== undefined)
            setSelectedId(String(initialRecipeId));
    }, [initialRecipeId]);
    const selected = state.recipes.find(recipe => recipe.recipeId === selectedId);
    // Map a displayed candidate (or free-typed value) back to the durable
    // harness workspace id (a UUID). Matching by title is the readable path; an
    // unmatched free-typed value falls back to the conventional `default`.
    const workspaceIdFor = (candidate) => {
        const trimmed = candidate.trim();
        const owned = workspaceItems.find(item => item.title === trimmed);
        return owned !== undefined ? String(owned.workspaceId) : (trimmed === '' ? 'default' : trimmed);
    };
    // On-demand AI polish of the goal text; user-initiated only.
    const polishGoal = async () => {
        const draft = goal.trim();
        if (draft === '' || polishing)
            return;
        setPolishing(true);
        try {
            const refined = await polish(draft);
            setGoal(refined);
        }
        catch {
            // keep the user's draft untouched on failure; the button re-enables.
        }
        finally {
            setPolishing(false);
        }
    };
    return (_jsxs("div", { className: css.panel, children: [_jsx("h2", { className: css.title, children: t('title') }), _jsxs("section", { className: css.step, children: [_jsx("h3", { className: css.section, children: t('column.recipe') }), state.status === 'loading' && _jsx("p", { className: css.statusLine, children: t('column.recipe') }), state.error !== undefined && _jsx("p", { className: css.errorLine, role: "alert", children: t('error.load', { code: state.error }) }), state.status === 'ready' && state.recipes.length === 0 && _jsx("p", { className: css.statusLine, children: t('empty') }), state.status === 'ready' && state.recipes.length > 0 && (_jsx("ul", { className: css.recipeList, children: state.recipes.map(recipe => {
                            const meta = recipeMeta(recipe);
                            return (_jsx("li", { children: _jsxs("button", { type: "button", className: selectedId === recipe.recipeId ? `${css.recipeCard} ${css.recipeCardSelected}` : css.recipeCard, onClick: () => { setSelectedId(recipe.recipeId); }, children: [_jsx("span", { className: css.recipeName, children: recipe.recipeId }), _jsx("span", { className: css.recipeMeta, children: t('recipe.meta', {
                                                phases: String(meta.phases),
                                                checks: String(meta.checks),
                                                deliverables: String(meta.deliverables),
                                            }) })] }) }, recipe.recipeId));
                        }) }))] }), _jsxs("section", { className: css.step, children: [_jsx("h3", { className: css.section, children: t('column.preview') }), selected === undefined && _jsx("p", { className: css.statusLine, children: t('preview.empty') }), selected !== undefined && (_jsx("ol", { className: css.flow, children: selected.payload.phases.map((phase, index) => (_jsxs("li", { className: css.flowItem, children: [_jsxs("div", { className: css.phaseRail, children: [_jsx("span", { className: css.phaseDot, children: index + 1 }), index < selected.payload.phases.length - 1 && _jsx("span", { className: css.phaseConnect, "aria-hidden": "true" })] }), _jsxs("div", { className: css.phaseBody, children: [_jsxs("div", { className: css.phaseHead, children: [_jsx("span", { className: css.kindBadge, children: kindLabel(tr, phase.kind) }), _jsx("span", { className: css.submitCriteria, children: phase.submissionCriteria[0] ?? tr('phase.noCriteria') })] }), _jsx("p", { className: css.phaseGoal, children: phase.goal }), phase.outputs.length > 0 && (_jsxs("p", { className: css.outputs, children: [_jsx("span", { className: css.outputsLabel, children: tr('phase.outputs') }), phase.outputs.map(output => _jsx("span", { className: css.outputPill, children: output }, output))] })), (() => {
                                            const gates = gatesFor(selected, phase.phaseId);
                                            if (gates.length === 0)
                                                return null;
                                            return (_jsx("p", { className: css.gates, children: gates.map(check => (_jsxs("span", { className: check.kind === 'A' ? css.gateA : (check.kind === 'B' ? css.gateB : css.gateC), title: check.machineScope.join(' · '), children: [tr(`gate.${check.kind}`), check.circuitBreaker !== undefined && _jsx("span", { className: css.breakerMark, title: tr('gate.breaker'), children: "\u27F2" })] }, check.checkId))) }));
                                        })()] })] }, phase.phaseId))) }))] }), _jsxs("section", { className: css.step, children: [_jsx("h3", { className: css.section, children: t('column.config') }), _jsxs("label", { className: css.field, children: [_jsx("span", { children: t('goal.label') }), _jsxs("div", { className: css.goalCombo, children: [_jsx("textarea", { className: css.goalInput, value: goal, onChange: (event) => { setGoal(event.target.value); }, placeholder: t('goal.placeholder'), spellCheck: false }), _jsx(Button, { size: "sm", variant: "outline", className: css.polishButton, disabled: polishing || goal.trim() === '', onClick: () => { void polishGoal(); }, title: t('polish.title'), children: polishing ? t('polish.busy') : t('polish.label') })] })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { children: t('workspace.label') }), _jsx("input", { className: css.workspaceInput, list: "task-create-workspaces", value: workspace, onChange: (event) => { setWorkspace(event.target.value); }, placeholder: t('workspace.placeholder'), spellCheck: false }), _jsx("datalist", { id: "task-create-workspaces", children: workspaceItems.map(item => _jsx("option", { value: item.title }, String(item.workspaceId))) })] }), _jsxs("details", { className: css.review, children: [_jsx("summary", { children: t('review.label') }), _jsx("p", { children: t('review.detail') })] })] }), state.status !== 'loading' && (_jsxs("div", { className: css.footer, children: [_jsx(Button, { size: "sm", variant: "ghost", onClick: () => { setSelectedId(undefined); setGoal(''); setWorkspace('default'); }, children: t('cancel') }), _jsx(Button, { size: "sm", variant: "primary", disabled: selected === undefined || busy, onClick: () => {
                            if (selected === undefined)
                                return;
                            setBusy(true);
                            void create(selected.recipeId, workspaceIdFor(workspace), goal).then((taskId) => {
                                setBusy(false);
                                setSelectedId(undefined);
                                setGoal('');
                                setWorkspace('default');
                                openDetail(taskId);
                            }).catch(() => { setBusy(false); });
                        }, children: t('create') })] }))] }));
}
//# sourceMappingURL=TaskCreateAction.js.map