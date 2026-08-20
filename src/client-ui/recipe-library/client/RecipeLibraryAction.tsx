import { useState } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { HostObservable, InjectFace, PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { RecipeCard, RecipeLibraryState } from './recipeLibrary.ts'
import { NS } from './locales.ts'
import css from './RecipeLibraryAction.module.css'

/** Registrant-private injected share (assembled in apply): the card state as
 * a hooks-compartment source (bound to `useLibrary`) plus the reload
 * callback over the controller. Plain data and callbacks only. */
export interface RecipeLibraryActionInjected {
  /** Card-state source; the renderer binds it to the useLibrary selector hook. */
  hooks: { library: HostObservable<RecipeLibraryState> }
  /** Reload the recipe catalogue from the recipes Remote. */
  refresh: () => Promise<void>
}

/** Full props for the drawer's Recipe-library tab body. */
export type RecipeLibraryActionProps =
  PropsRuntime<'workbench.drawer.recipeLibrary'> & PropsLocale<typeof NS> & InjectFace<RecipeLibraryActionInjected>

/** Localized copy for the library's tab body. */
type T = TranslateNS<typeof NS>

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
function RecipeCard({ card, onUse, busy, t }: { card: RecipeCard; onUse: (recipeId: string) => void; busy: boolean; t: T }) {
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
        <Button size="sm" variant="primary" disabled={busy} onClick={() => { onUse(card.recipeId) }}>
          {busy ? t('creating') : t('use')}
        </Button>
      </div>
    </li>
  )
}

/**
 * Render the drawer's Recipe-library tab body: a grid of processing-template
 * cards over the loaded catalogue, each `使用模板新建` pressing the owner's
 * `openCreate` to switch into the creation wizard.
 * @param props - composed slot props (owner openCreate, locale, inject face).
 * @returns the recipe card grid filling the drawer's tab body.
 */
export function RecipeLibraryAction(props: RecipeLibraryActionProps) {
  const { openCreate, t, useLibrary, refresh } = props
  const state = useLibrary(snapshot => snapshot)
  // The drawer's openCreate carries the chosen recipe into the wizard: the
  // create tab pre-selects it via the owner's initialRecipeId.
  const [busy, setBusy] = useState(false)
  const handleUse = (recipeId: string) => {
    setBusy(true)
    openCreate(recipeId)
    window.setTimeout(() => { setBusy(false) }, 300)
  }
  return (
    <div className={css.panel}>
      <h2 className={css.title}>{t('title')}</h2>
      {state.status === 'loading' && <p className={css.statusLine}>{t('loading')}</p>}
      {state.error !== undefined && (
        <p className={css.errorLine} role="alert">{t('error.load', { code: state.error })}</p>
      )}
      {state.status === 'ready' && state.cards.length === 0 && <p className={css.statusLine}>{t('empty')}</p>}
      {state.cards.length > 0 && (
        <ul className={css.grid}>
          {state.cards.map(card => (
            <RecipeCard key={card.recipeId} card={card} onUse={handleUse} busy={busy} t={t} />
          ))}
        </ul>
      )}
      {state.status !== 'loading' && (
        <div className={css.footer}>
          <Button size="sm" variant="ghost" onClick={() => { void refresh() }}>{t('refresh')}</Button>
        </div>
      )}
    </div>
  )
}
