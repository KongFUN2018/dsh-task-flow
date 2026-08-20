/**
 * Browser-half unit tests for the folded task-flow client-ui packages.
 *
 * Pure-logic coverage only: the drawer shell + content seats are registration
 * wiring (exercised by the installed web shell), and the React views are
 * presentation. What is checkable in isolation is that every locale namespace
 * keeps its `en`/`zh` dictionaries in exact key parity — the invariant that
 * guarantees no client feature drops a translation after a fold/repoint.
 */
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { en as attentionEn, zh as attentionZh } from '../src/client-ui/attention-inbox/client/locales.ts'
import { en as clarEn, zh as clarZh } from '../src/client-ui/clarifications/client/locales.ts'
import { en as recipeEn, zh as recipeZh } from '../src/client-ui/recipe-library/client/locales.ts'
import { en as boardEn, zh as boardZh } from '../src/client-ui/task-board/client/locales.ts'
import { en as createEn, zh as createZh } from '../src/client-ui/task-create/client/locales.ts'
import { en as confirmEn, zh as confirmZh } from '../src/client-ui/task-create-confirm/client/locales.ts'
import { en as detailEn, zh as detailZh } from '../src/client-ui/task-detail/client/locales.ts'
import { en as listEn, zh as listZh } from '../src/client-ui/task-list/client/locales.ts'
import { en as drawerEn, zh as drawerZh } from '../src/client-ui/workbench-drawer/client/locales.ts'

/** Every folded client-ui locale namespace, in its declared order. */
const NAMESPACES = [
  ['attention-inbox', attentionEn, attentionZh],
  ['clarifications', clarEn, clarZh],
  ['recipe-library', recipeEn, recipeZh],
  ['task-board', boardEn, boardZh],
  ['task-create', createEn, createZh],
  ['task-create-confirm', confirmEn, confirmZh],
  ['task-detail', detailEn, detailZh],
  ['task-list', listEn, listZh],
  ['workbench-drawer', drawerEn, drawerZh],
] as const

describe('client-ui locale namespaces', () => {
  for (const [ns, en, zh] of NAMESPACES) {
    it(`${ns} keeps en and zh in exact key parity`, () => {
      expect(Object.keys(zh).sort(), `${ns} zh keys`).toEqual(Object.keys(en).sort())
    })
    it(`${ns} carries a non-empty en dictionary`, () => {
      expect(Object.keys(en).length).toBeGreaterThan(0)
    })
  }
})

