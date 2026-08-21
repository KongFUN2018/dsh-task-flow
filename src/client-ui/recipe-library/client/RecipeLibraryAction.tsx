import { useEffect, useMemo, useState } from 'react'
import { Button, Input, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import type { HostObservable, InjectFace, PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { RecipeCard, RecipeLibraryState } from './recipeLibrary.ts'
import type { RecipePayload } from '../../../recipe/types.ts'
import { NS } from './locales.ts'
import css from './RecipeLibraryAction.module.css'

/** Registrant-private injected share (assembled in apply): the card state as
 * a hooks-compartment source (bound to `useLibrary`) plus the CRUD callbacks. */
export interface RecipeLibraryActionInjected {
  /** Card-state source; the renderer binds it to the useLibrary selector hook. */
  hooks: { library: HostObservable<RecipeLibraryState> }
  /** Reload the recipe catalogue from the recipes Remote. */
  refresh: () => Promise<void>
  /** Create a fresh recipe family (revision 1). */
  createRecipe: (recipeId: string, payload: RecipePayload) => Promise<{ ok: boolean; error?: { code: string } }>
  /** Register a new immutable revision of an existing family. */
  updateRecipe: (recipeId: string, payload: RecipePayload) => Promise<{ ok: boolean; error?: { code: string } }>
  /** Soft-delete one recipe family from the pickable catalogue. */
  deleteRecipe: (recipeId: string) => Promise<{ ok: boolean; error?: { code: string } }>
}

/** Full props for the standalone Recipe-library management modal. */
export type RecipeLibraryModalProps =
  PropsRuntime<'workbench.drawer.recipeLibrary'>
  & PropsLocale<typeof NS>
  & InjectFace<RecipeLibraryActionInjected>
  & { open: boolean; onClose: () => void }

/** Localized copy for the modal. */
type T = TranslateNS<typeof NS>

/** A minimal, spec-compliant empty payload a user can edit before saving. */
const BLANK_PAYLOAD: RecipePayload = {
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
}

/** Collapse the CRUD result into a plain serializable shape the UI can read. */
function plain(result: { ok: boolean; error?: { code?: string } }): { ok: boolean; error: string | undefined } {
  return { ok: result.ok, error: result.ok ? undefined : String(result.error?.code ?? 'unknown') }
}

/** One recipe card with management actions (edit / delete). */
function RecipeCard({ card, onEdit, onDelete, busy, t }: {
  card: RecipeCard
  onEdit: (card: RecipeCard) => void
  onDelete: (card: RecipeCard) => void
  busy: string | undefined
  t: T
}) {
  return (
    <li className={css.card}>
      <div className={css.cardHead}>
        <span className={css.name}>{card.recipeId}</span>
        <span className={css.meta}>{t('meta', {
          phases: String(card.phases),
          checks: String(card.checks),
          deliverables: String(card.deliverables),
        })}</span>
      </div>
      <p className={css.summary}>{t('description', { phases: String(card.phases), goals: card.description })}</p>
      <div className={css.cardFoot}>
        <Button size="sm" variant="outline" className={css.deleteAction} disabled={busy !== undefined} onClick={() => { onDelete(card) }}>
          {busy === card.recipeId ? t('deleting') : t('delete')}
        </Button>
        <Button size="sm" variant="ghost" disabled={busy !== undefined} onClick={() => { onEdit(card) }}>
          {t('edit')}
        </Button>
      </div>
    </li>
  )
}

/** Editor form for creating or updating a recipe. */
function RecipeEditor({ open, title, initialId, draft, saving, error, onClose, onSave, t }: {
  open: boolean
  title: string
  initialId: string
  draft: RecipePayload
  saving: boolean
  error: string | undefined
  onClose: () => void
  onSave: (recipeId: string, payload: RecipePayload) => void
  t: T
}) {
  const [recipeId, setRecipeId] = useState(initialId)
  const [json, setJson] = useState(() => JSON.stringify(draft, null, 2))

  useEffect(() => {
    if (open) {
      setRecipeId(initialId)
      setJson(JSON.stringify(draft, null, 2))
    }
  }, [open, initialId, draft])

  // Derive the parsed payload and its validity instead of writing state during
  // render. The previous implementation called setParseError inside a render
  // IIFE, which triggered an endless re-render loop and aborted the whole slot
  // (opening the editor crashed with a minified error). The error line is now
  // a pure function of `json`.
  const parsed = useMemo(() => {
    try {
      const value = JSON.parse(json)
      if (typeof value !== 'object' || value === null || !Array.isArray((value as { phases?: unknown }).phases)) {
        return { payload: undefined, invalid: 'payload must be an object with a `phases` array' }
      }
      return { payload: value as RecipePayload, invalid: undefined }
    } catch {
      return { payload: undefined, invalid: 'invalid JSON' }
    }
  }, [json])
  const payload = parsed.payload
  const parseError = parsed.invalid

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      closeLabel={t('close')}
      footer={(
        <div className={css.formFoot}>
          <Button size="sm" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
          <Button size="sm" variant="primary" disabled={saving || parseError !== undefined || payload === undefined || recipeId.trim() === ''} onClick={() => { if (payload !== undefined) onSave(recipeId.trim(), payload) }}>
            {saving ? t('saving') : t('save')}
          </Button>
        </div>
      )}
    >
      <div className={css.form}>
        <label className={css.field}>
          <span className={css.fieldLabel}>{t('field.id')}</span>
          <Input value={recipeId} onChange={event => { setRecipeId(event.target.value) }} placeholder={t('field.idHint')} />
        </label>
        <label className={css.field}>
          <span className={css.fieldLabel}>{t('field.payload')}</span>
          <textarea className={css.payloadEditor} value={json} onChange={event => { setJson(event.target.value) }} spellCheck={false} />
        </label>
        {parseError !== undefined && <p className={css.errorLine} role="alert">{parseError}</p>}
        {error !== undefined && <p className={css.errorLine} role="alert">{error}</p>}
      </div>
    </Modal>
  )
}

/**
 * Standalone Recipe-library management modal: a card grid over the loaded
 * catalogue with 新建 / 编辑 / 删除 affordances plus a JSON payload editor for
 * authoring or updating an immutable revision. No task-flow coupling lives
 * here — create/update/delete hit the recipes Remote through the inject face.
 * @param props - runtime seat props, locale, inject face, open flag, close.
 * @returns the management modal portal, or nothing while closed.
 */
export function RecipeLibraryAction(props: RecipeLibraryModalProps) {
  const { open, onClose, t, useLibrary, refresh, createRecipe, updateRecipe, deleteRecipe } = props
  const state = useLibrary(snapshot => snapshot)

  const [editing, setEditing] = useState<{ recipeId: string; draft: RecipePayload } | undefined>(undefined)
  const [creating, setCreating] = useState<{ recipeId: string; draft: RecipePayload }>({ recipeId: '', draft: BLANK_PAYLOAD })
  const [formOpen, setFormOpen] = useState(false)
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState<string | undefined>(undefined)
  const [actionError, setActionError] = useState<string | undefined>(undefined)
  const [deleting, setDeleting] = useState<string | undefined>(undefined)

  // Reset transient error when the modal lifecycle resets (re-open after edits).
  useEffect(() => {
    if (!open) return
    setActionError(undefined)
    setFormOpen(false)
  }, [open])

  const openCreate = () => {
    setCreating({ recipeId: '', draft: BLANK_PAYLOAD })
    setFormError(undefined)
    setFormOpen(true)
  }
  const openEdit = (card: RecipeCard) => {
    setEditing({ recipeId: card.recipeId, draft: BLANK_PAYLOAD })
    setFormError(undefined)
    setFormOpen(true)
  }
  const handleSave = (recipeId: string, payload: RecipePayload) => {
    void (async () => {
      setFormSaving(true)
      setFormError(undefined)
      const isUpdate = editing !== undefined
      const target = isUpdate ? editing.recipeId : recipeId
      const result = isUpdate
        ? await updateRecipe(target, payload)
        : await createRecipe(target, payload)
      const p = plain(result)
      setFormSaving(false)
      if (!p.ok) {
        setFormError(p.error)
        return
      }
      setActionError(undefined)
      setFormOpen(false)
      setEditing(undefined)
    })()
  }
  const handleDelete = (card: RecipeCard) => {
    void (async () => {
      setDeleting(card.recipeId)
      setActionError(undefined)
      const p = plain(await deleteRecipe(card.recipeId))
      setDeleting(undefined)
      if (!p.ok) setActionError(p.error)
    })()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('title')}
      closeLabel={t('close')}
      footer={(
        <div className={css.modalFoot}>
          <Button size="sm" variant="primary" onClick={openCreate}>{t('create')}</Button>
          <Button size="sm" variant="ghost" onClick={() => { void refresh() }} disabled={state.status === 'loading'}>{t('refresh')}</Button>
        </div>
      )}
    >
      <div className={css.gridRegion}>
        {state.status === 'loading' && <p className={css.statusLine}>{t('loading')}</p>}
        {state.error !== undefined && <p className={css.errorLine} role="alert">{t('error.load', { code: state.error })}</p>}
        {actionError !== undefined && <p className={css.errorLine} role="alert">{t('error.action', { code: actionError })}</p>}
        {state.status !== 'loading' && state.cards.length === 0 && (
          <p className={css.statusLine}>{t('empty')}</p>
        )}
        {state.status !== 'loading' && state.cards.length > 0 && (
          <ul className={css.grid}>
            {state.cards.map(card => (
              <RecipeCard
                key={card.recipeId}
                card={card}
                onEdit={openEdit}
                onDelete={handleDelete}
                busy={deleting}
                t={t}
              />
            ))}
          </ul>
        )}
      </div>
      <RecipeEditor
        open={formOpen}
        title={editing !== undefined ? t('editTitle') : t('createTitle')}
        initialId={editing !== undefined ? editing.recipeId : creating.recipeId}
        draft={editing !== undefined ? editing.draft : creating.draft}
        saving={formSaving}
        error={formError}
        onClose={() => { setFormOpen(false); setEditing(undefined) }}
        onSave={handleSave}
        t={t}
      />
    </Modal>
  )
}
