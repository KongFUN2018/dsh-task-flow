/**
 * The built-in M1 empty-template revision: one phase, an explicit
 * PhaseSubmission, and a minimal deliverable, per the task-flow overall
 * design. New tasks pin this revision until a filesystem provider registers
 * real recipes.
 */

import type { RecipePayload } from './types.ts'

/** Built-in recipe id the empty template registers under. */
export const EMPTY_TEMPLATE_RECIPE_ID = 'empty-template'

/** The built-in empty-template payload; see the module contract. */
export const EMPTY_TEMPLATE: RecipePayload = {
  phases: [
    {
      phaseId: 'main',
      kind: 'default',
      goal: 'Execute the task and submit the phase output.',
      inputs: [],
      outputs: ['main deliverable'],
      submissionCriteria: ['one explicit PhaseSubmission listing the required deliverable output'],
    },
  ],
  gateChecks: [
    {
      checkId: 'main-submission-complete',
      phaseId: 'main',
      kind: 'A',
      machineScope: ['the accepted submission lists every declared phase output'],
      humanAction: [],
    },
  ],
  defaults: {
    batchConfirm: 'per-phase-single',
    clarify: { maxRounds: 2, splitMustDefault: true },
    draftPolicy: 'block-finalize-not-draft',
  },
  p4Mode: { mode: 'auto' },
}
