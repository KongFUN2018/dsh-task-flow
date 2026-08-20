import { useEffect, useState } from 'react'
import { Button, Input } from '@deepseek-ai/dsh-client-ui-primitives'
import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { RecipeRevision } from '../../../recipe/types.ts'
import type { CreateState } from './create.ts'
import { NS } from './locales.ts'
import css from './TaskCreateAction.module.css'

export interface TaskCreateActionInjected {
  hooks: { create: HostObservable<CreateState> }
  refresh: () => void
  create: (recipeId: string, workspaceId: string, goal: string) => Promise<string>
}

export type TaskCreateActionProps =
  PropsRuntime<'workbench.drawer.create'> & PropsLocale<typeof NS> & InjectFace<TaskCreateActionInjected>

/** One recipe's phase summary for the preview column. */
function phaseNames(recipe: RecipeRevision): string[] {
  return recipe.payload.phases.map(phase => phase.goal)
}

function recipeMeta(recipe: RecipeRevision): { phases: number; checks: number } {
  const payload = recipe.payload
  return {
    phases: payload.phases.length,
    checks: payload.gateChecks.length,
  }
}

export function TaskCreateAction(props: TaskCreateActionProps) {
  const { t, openDetail, initialRecipeId, useCreate, create } = props
  const state = useCreate(state => state)
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [goal, setGoal] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    // Pre-select the recipe the Recipe-library chose; ignore an empty initial
    // id so a direct entry into the wizard starts free.
    if (initialRecipeId !== undefined) setSelectedId(String(initialRecipeId))
  }, [initialRecipeId])
  const selected = state.recipes.find(recipe => recipe.recipeId === selectedId)

  return (
    <div className={css.panel}>
      <h2 className={css.title}>{t('title')}</h2>
      {state.status === 'loading' && <p className={css.statusLine}>{t('column.recipe')}</p>}
      {state.error !== undefined && <p className={css.errorLine} role="alert">{t('error.load', { code: state.error })}</p>}
      {state.status === 'ready' && state.recipes.length === 0 && <p className={css.statusLine}>{t('empty')}</p>}
      {state.status === 'ready' && state.recipes.length > 0 && (
        <div className={css.columns}>
          <section className={css.column}>
            <p className={css.section}>{t('column.recipe')}</p>
            <ul className={css.recipeList}>
              {state.recipes.map(recipe => (
                <li key={recipe.recipeId}>
                  <button
                    type="button"
                    className={selectedId === recipe.recipeId ? (css.recipeCard ?? '') + ' ' + (css.recipeCardSelected ?? '') : css.recipeCard}
                    onClick={() => { setSelectedId(recipe.recipeId) }}
                  >
                    <span className={css.recipeName}>{recipe.recipeId}</span>
                    <span className={css.recipeMeta}>{t('recipe.meta', {
                      phases: String(recipeMeta(recipe).phases),
                      checks: String(recipeMeta(recipe).checks),
                      deliverables: '0',
                    })}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className={css.column}>
            <p className={css.section}>{t('column.preview')}</p>
            {selected === undefined && <p className={css.statusLine}>{t('preview.empty')}</p>}
            {selected !== undefined && (
              <ol className={css.preview}>
                {phaseNames(selected).map((phase, index) => (
                  <li key={index} className={css.previewStep}>
                    <span className={css.previewName}>{phase}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <section className={css.column}>
            <p className={css.section}>{t('column.config')}</p>
            <label className={css.field}>
              <span>{t('goal.label')}</span>
              <Input value={goal} onChange={(event) => { setGoal(event.target.value) }} placeholder={t('goal.placeholder')} />
            </label>
            <label className={css.field}>
              <span>{t('workspace.label')}</span>
              <Input value="default" readOnly />
            </label>
            <details className={css.review}>
              <summary>{t('review.label')}</summary>
              <p>{t('review.detail')}</p>
            </details>
          </section>
        </div>
      )}
      {state.status !== 'loading' && (
        <div className={css.footer}>
          <Button size="sm" variant="ghost" onClick={() => { setSelectedId(undefined); setGoal('') }}>{t('cancel')}</Button>
          <Button
            size="sm"
            variant="primary"
            disabled={selected === undefined || busy}
            onClick={() => {
              if (selected === undefined) return
              setBusy(true)
              void create(selected.recipeId, 'default', goal).then((taskId) => {
                setBusy(false)
                setSelectedId(undefined)
                setGoal('')
                openDetail(taskId)
              }).catch(() => { setBusy(false) })
            }}
          >
            {t('create')}
          </Button>
        </div>
      )}
    </div>
  )
}
