import { useEffect, useState } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { RecipeGateCheckSpec, RecipePhaseSpec, RecipeRevision } from '../../../recipe/types.ts'
import type { CreateState } from './create.ts'
import { NS } from './locales.ts'
import css from './TaskCreateAction.module.css'

export interface TaskCreateActionInjected {
  hooks: {
    create: HostObservable<CreateState>
    createWorkspaces: HostObservable<CreateState>
  }
  refresh: () => void
  create: (recipeId: string, workspaceId: string, goal: string) => Promise<string>
  /** On-demand AI polish of task-goal text; user-initiated, never auto-run. */
  polish: (goal: string) => Promise<string>
}

export type TaskCreateActionProps =
  PropsRuntime<'workbench.drawer.create'> & PropsLocale<typeof NS> & InjectFace<TaskCreateActionInjected>

function recipeMeta(recipe: RecipeRevision): { phases: number; checks: number; deliverables: number } {
  const payload = recipe.payload
  const deliverables = new Set(payload.phases.flatMap(phase => phase.outputs.map(output => output)))
  return {
    phases: payload.phases.length,
    checks: payload.gateChecks.length,
    deliverables: deliverables.size,
  }
}

/** The A/B/C gates bound to one phase, for its preview node. */
function gatesFor(recipe: RecipeRevision, phaseId: string): RecipeGateCheckSpec[] {
  return recipe.payload.gateChecks.filter(check => check.phaseId === phaseId)
}

/** Human label for a phase kind via the dictionary; unknown kinds keep their
 *  raw machine kind (the translate function echoes an unregistered key). */
function kindLabel(t: (key: string, params?: Record<string, string>) => string, kind: string): string {
  const key = `phase.kind.${kind}`
  const label = t(key)
  return label === key ? kind : label
}

/**
 * New-task wizard: pick a recipe, preview its phase flow, then set the goal.
 * The three concerns stack top-to-bottom as numbered steps (1 · 2 · 3), with
 * the phase preview rendered as a visual flow — each phase node shows its
 * sequence, kind badge, full goal, produced outputs, and the A/B/C gates bound
 * to that phase (with circuit-breaker marks). Branch-routing (DAG) is a
 * follow-up iteration; the current model is a serial phase pipeline.
 */
export function TaskCreateAction(props: TaskCreateActionProps) {
  const { t, openDetail, initialRecipeId, useCreate, useCreateWorkspaces, create, polish } = props
  const tr = t as (key: string, params?: Record<string, string>) => string
  const state = useCreate(state => state)
  // Real harness workspace candidates (mirrored from the client `workspaces`
  // service by the create controller into `state.workspaces`).
  const workspaceItems = useCreateWorkspaces(state => state.workspaces)
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [workspace, setWorkspace] = useState('default')
  const [goal, setGoal] = useState('')
  const [busy, setBusy] = useState(false)
  const [polishing, setPolishing] = useState(false)
  useEffect(() => {
    // Pre-select the recipe the Recipe-library chose; ignore an empty initial
    // id so a direct entry into the wizard starts free.
    if (initialRecipeId !== undefined) setSelectedId(String(initialRecipeId))
  }, [initialRecipeId])
  const selected = state.recipes.find(recipe => recipe.recipeId === selectedId)

  // Map a displayed candidate (or free-typed value) back to the durable
  // harness workspace id (a UUID). Matching by title is the readable path; an
  // unmatched free-typed value falls back to the conventional `default`.
  const workspaceIdFor = (candidate: string): string => {
    const trimmed = candidate.trim()
    const owned = workspaceItems.find(item => item.title === trimmed)
    return owned !== undefined ? String(owned.workspaceId) : (trimmed === '' ? 'default' : trimmed)
  }

  // On-demand AI polish of the goal text; user-initiated only.
  const polishGoal = async () => {
    const draft = goal.trim()
    if (draft === '' || polishing) return
    setPolishing(true)
    try {
      const refined = await polish(draft)
      setGoal(refined)
    } catch {
      // keep the user's draft untouched on failure; the button re-enables.
    } finally {
      setPolishing(false)
    }
  }

  return (
    <div className={css.panel}>
      <h2 className={css.title}>{t('title')}</h2>

      {/* Step 1 — choose the recipe (task type). */}
      <section className={css.step}>
        <h3 className={css.section}>{t('column.recipe')}</h3>
        {state.status === 'loading' && <p className={css.statusLine}>{t('column.recipe')}</p>}
        {state.error !== undefined && <p className={css.errorLine} role="alert">{t('error.load', { code: state.error })}</p>}
        {state.status === 'ready' && state.recipes.length === 0 && <p className={css.statusLine}>{t('empty')}</p>}
        {state.status === 'ready' && state.recipes.length > 0 && (
          <ul className={css.recipeList}>
            {state.recipes.map(recipe => {
              const meta = recipeMeta(recipe)
              return (
                <li key={recipe.recipeId}>
                  <button
                    type="button"
                    className={selectedId === recipe.recipeId ? `${css.recipeCard} ${css.recipeCardSelected}` : css.recipeCard}
                    onClick={() => { setSelectedId(recipe.recipeId) }}
                  >
                    <span className={css.recipeName}>{recipe.recipeId}</span>
                    <span className={css.recipeMeta}>{t('recipe.meta', {
                      phases: String(meta.phases),
                      checks: String(meta.checks),
                      deliverables: String(meta.deliverables),
                    })}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Step 2 — phase-flow preview. */}
      <section className={css.step}>
        <h3 className={css.section}>{t('column.preview')}</h3>
        {selected === undefined && <p className={css.statusLine}>{t('preview.empty')}</p>}
        {selected !== undefined && (
          <ol className={css.flow}>
            {selected.payload.phases.map((phase: RecipePhaseSpec, index: number) => (
              <li key={phase.phaseId} className={css.flowItem}>
                <div className={css.phaseRail}>
                  <span className={css.phaseDot}>{index + 1}</span>
                  {index < selected.payload.phases.length - 1 && <span className={css.phaseConnect} aria-hidden="true" />}
                </div>
                <div className={css.phaseBody}>
                  <div className={css.phaseHead}>
                    <span className={css.kindBadge}>{kindLabel(tr, phase.kind)}</span>
                    <span className={css.submitCriteria}>{phase.submissionCriteria[0] ?? tr('phase.noCriteria')}</span>
                  </div>
                  <p className={css.phaseGoal}>{phase.goal}</p>
                  {phase.outputs.length > 0 && (
                    <p className={css.outputs}>
                      <span className={css.outputsLabel}>{tr('phase.outputs')}</span>
                      {phase.outputs.map(output => <span key={output} className={css.outputPill}>{output}</span>)}
                    </p>
                  )}
                  {(() => {
                    const gates = gatesFor(selected, phase.phaseId)
                    if (gates.length === 0) return null
                    return (
                      <p className={css.gates}>
                        {gates.map(check => (
                          <span
                            key={check.checkId}
                            className={check.kind === 'A' ? css.gateA : (check.kind === 'B' ? css.gateB : css.gateC)}
                            title={check.machineScope.join(' · ')}
                          >
                            {tr(`gate.${check.kind}`)}
                            {check.circuitBreaker !== undefined && <span className={css.breakerMark} title={tr('gate.breaker')}>⟲</span>}
                          </span>
                        ))}
                      </p>
                    )
                  })()}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Step 3 — goal & configuration. */}
      <section className={css.step}>
        <h3 className={css.section}>{t('column.config')}</h3>
        <label className={css.field}>
          <span>{t('goal.label')}</span>
          <div className={css.goalCombo}>
            <textarea
              className={css.goalInput}
              value={goal}
              onChange={(event) => { setGoal(event.target.value) }}
              placeholder={t('goal.placeholder')}
              spellCheck={false}
            />
            <Button
              size="sm"
              variant="outline"
              className={css.polishButton}
              disabled={polishing || goal.trim() === ''}
              onClick={() => { void polishGoal() }}
              title={t('polish.title')}
            >
              {polishing ? t('polish.busy') : t('polish.label')}
            </Button>
          </div>
        </label>
        <label className={css.field}>
          <span>{t('workspace.label')}</span>
          {/* Combobox over the real harness workspaces: pick one (its title
              shows; create() maps it back to the durable workspace id) or
              type a free value as a fallback identifier. */}
          <input
            className={css.workspaceInput}
            list="task-create-workspaces"
            value={workspace}
            onChange={(event) => { setWorkspace(event.target.value) }}
            placeholder={t('workspace.placeholder')}
            spellCheck={false}
          />
          <datalist id="task-create-workspaces">
            {workspaceItems.map(item => <option key={String(item.workspaceId)} value={item.title} />)}
          </datalist>
        </label>
        <details className={css.review}>
          <summary>{t('review.label')}</summary>
          <p>{t('review.detail')}</p>
        </details>
      </section>

      {state.status !== 'loading' && (
        <div className={css.footer}>
          <Button size="sm" variant="ghost" onClick={() => { setSelectedId(undefined); setGoal(''); setWorkspace('default') }}>{t('cancel')}</Button>
          <Button
            size="sm"
            variant="primary"
            disabled={selected === undefined || busy}
            onClick={() => {
              if (selected === undefined) return
              setBusy(true)
              void create(selected.recipeId, workspaceIdFor(workspace), goal).then((taskId) => {
                setBusy(false)
                setSelectedId(undefined)
                setGoal('')
                setWorkspace('default')
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
