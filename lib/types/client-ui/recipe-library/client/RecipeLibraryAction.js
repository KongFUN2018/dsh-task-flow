import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Button, Input, Modal } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './RecipeLibraryAction.module.css';
/** A minimal, spec-compliant empty payload a user can edit before saving. */
const BLANK_PAYLOAD = {
    phases: [
        {
            phaseId: 'main',
            kind: 'default',
            goal: '执行该阶段并提交产物。',
            inputs: [],
            outputs: ['主产物'],
            submissionCriteria: ['一次性提交说明该阶段产出的清单'],
        },
    ],
    gateChecks: [
        {
            checkId: 'main-submission-complete',
            phaseId: 'main',
            kind: 'A',
            machineScope: ['已提交清单包含本阶段全部声明产物'],
            humanAction: [],
        },
    ],
    defaults: { batchConfirm: 'per-phase-single', clarify: { maxRounds: 2, splitMustDefault: true }, draftPolicy: 'block-finalize-not-draft' },
    p4Mode: { mode: 'auto' },
};
/** Collapse the CRUD result into a plain serializable shape the UI can read. */
function plain(result) {
    return { ok: result.ok, error: result.ok ? undefined : String(result.error?.code ?? 'unknown') };
}
/** One recipe card with management actions (edit / delete). */
function RecipeCard({ card, onEdit, onDelete, busy, t }) {
    return (_jsxs("li", { className: css.card, children: [_jsxs("div", { className: css.cardHead, children: [_jsx("span", { className: css.name, children: card.recipeId }), _jsx("span", { className: css.meta, children: t('meta', {
                            phases: String(card.phases),
                            checks: String(card.checks),
                            deliverables: String(card.deliverables),
                        }) })] }), _jsx("p", { className: css.summary, children: t('description', { phases: String(card.phases), goals: card.description }) }), _jsxs("div", { className: css.cardFoot, children: [_jsx(Button, { size: "sm", variant: "outline", className: css.deleteAction, disabled: busy !== undefined, onClick: () => { onDelete(card); }, children: busy === card.recipeId ? t('deleting') : t('delete') }), _jsx(Button, { size: "sm", variant: "ghost", disabled: busy !== undefined, onClick: () => { onEdit(card); }, children: t('edit') })] })] }));
}
/** Editor form for creating or updating a recipe. */
function RecipeEditor({ open, title, initialId, draft, saving, error, onClose, onSave, t }) {
    const [recipeId, setRecipeId] = useState(initialId);
    const [json, setJson] = useState(() => JSON.stringify(draft, null, 2));
    const [parseError, setParseError] = useState(undefined);
    useEffect(() => {
        if (open) {
            setRecipeId(initialId);
            setJson(JSON.stringify(draft, null, 2));
            setParseError(undefined);
        }
    }, [open, initialId, draft]);
    const payload = (() => {
        try {
            const parsed = JSON.parse(json);
            if (typeof parsed !== 'object' || parsed === null || !Array.isArray(parsed.phases)) {
                setParseError('payload must be an object with a `phases` array');
                return undefined;
            }
            setParseError(undefined);
            return parsed;
        }
        catch {
            setParseError('invalid JSON');
            return undefined;
        }
    })();
    return (_jsx(Modal, { open: open, onClose: onClose, title: title, closeLabel: t('close'), footer: (_jsxs("div", { className: css.formFoot, children: [_jsx(Button, { size: "sm", variant: "ghost", onClick: onClose, children: t('cancel') }), _jsx(Button, { size: "sm", variant: "primary", disabled: saving || parseError !== undefined || payload === undefined || recipeId.trim() === '', onClick: () => { if (payload !== undefined)
                        onSave(recipeId.trim(), payload); }, children: saving ? t('saving') : t('save') })] })), children: _jsxs("div", { className: css.form, children: [_jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('field.id') }), _jsx(Input, { value: recipeId, onChange: event => { setRecipeId(event.target.value); }, placeholder: t('field.idHint') })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { className: css.fieldLabel, children: t('field.payload') }), _jsx("textarea", { className: css.payloadEditor, value: json, onChange: event => { setJson(event.target.value); }, spellCheck: false })] }), parseError !== undefined && _jsx("p", { className: css.errorLine, role: "alert", children: parseError }), error !== undefined && _jsx("p", { className: css.errorLine, role: "alert", children: error })] }) }));
}
/**
 * Standalone Recipe-library management modal: a card grid over the loaded
 * catalogue with 新建 / 编辑 / 删除 affordances plus a JSON payload editor for
 * authoring or updating an immutable revision. No task-flow coupling lives
 * here — create/update/delete hit the recipes Remote through the inject face.
 * @param props - runtime seat props, locale, inject face, open flag, close.
 * @returns the management modal portal, or nothing while closed.
 */
export function RecipeLibraryAction(props) {
    const { open, onClose, t, useLibrary, refresh, createRecipe, updateRecipe, deleteRecipe } = props;
    const state = useLibrary(snapshot => snapshot);
    const [editing, setEditing] = useState(undefined);
    const [creating, setCreating] = useState({ recipeId: '', draft: BLANK_PAYLOAD });
    const [formOpen, setFormOpen] = useState(false);
    const [formSaving, setFormSaving] = useState(false);
    const [formError, setFormError] = useState(undefined);
    const [actionError, setActionError] = useState(undefined);
    const [deleting, setDeleting] = useState(undefined);
    // Reset transient error when the modal lifecycle resets (re-open after edits).
    useEffect(() => {
        if (!open)
            return;
        setActionError(undefined);
        setFormOpen(false);
    }, [open]);
    const openCreate = () => {
        setCreating({ recipeId: '', draft: BLANK_PAYLOAD });
        setFormError(undefined);
        setFormOpen(true);
    };
    const openEdit = (card) => {
        setEditing({ recipeId: card.recipeId, draft: BLANK_PAYLOAD });
        setFormError(undefined);
        setFormOpen(true);
    };
    const handleSave = (recipeId, payload) => {
        void (async () => {
            setFormSaving(true);
            setFormError(undefined);
            const isUpdate = editing !== undefined;
            const target = isUpdate ? editing.recipeId : recipeId;
            const result = isUpdate
                ? await updateRecipe(target, payload)
                : await createRecipe(target, payload);
            const p = plain(result);
            setFormSaving(false);
            if (!p.ok) {
                setFormError(p.error);
                return;
            }
            setActionError(undefined);
            setFormOpen(false);
            setEditing(undefined);
        })();
    };
    const handleDelete = (card) => {
        void (async () => {
            setDeleting(card.recipeId);
            setActionError(undefined);
            const p = plain(await deleteRecipe(card.recipeId));
            setDeleting(undefined);
            if (!p.ok)
                setActionError(p.error);
        })();
    };
    return (_jsxs(Modal, { open: open, onClose: onClose, title: t('title'), closeLabel: t('close'), footer: (_jsxs("div", { className: css.modalFoot, children: [_jsx(Button, { size: "sm", variant: "primary", onClick: openCreate, children: t('create') }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => { void refresh(); }, disabled: state.status === 'loading', children: t('refresh') })] })), children: [_jsxs("div", { className: css.gridRegion, children: [state.status === 'loading' && _jsx("p", { className: css.statusLine, children: t('loading') }), state.error !== undefined && _jsx("p", { className: css.errorLine, role: "alert", children: t('error.load', { code: state.error }) }), actionError !== undefined && _jsx("p", { className: css.errorLine, role: "alert", children: t('error.action', { code: actionError }) }), state.status !== 'loading' && state.cards.length === 0 && (_jsx("p", { className: css.statusLine, children: t('empty') })), state.status !== 'loading' && state.cards.length > 0 && (_jsx("ul", { className: css.grid, children: state.cards.map(card => (_jsx(RecipeCard, { card: card, onEdit: openEdit, onDelete: handleDelete, busy: deleting, t: t }, card.recipeId))) }))] }), _jsx(RecipeEditor, { open: formOpen, title: editing !== undefined ? t('editTitle') : t('createTitle'), initialId: editing !== undefined ? editing.recipeId : creating.recipeId, draft: editing !== undefined ? editing.draft : creating.draft, saving: formSaving, error: formError, onClose: () => { setFormOpen(false); setEditing(undefined); }, onSave: handleSave, t: t })] }));
}
//# sourceMappingURL=RecipeLibraryAction.js.map