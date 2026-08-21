/**
 * Render regression: RecipeLibraryAction (and its RecipeEditor sub-form) mount
 * without crashing. The editor used to write parseError to React state during
 * the render phase (an IIFE calling setParseError inside the component body),
 * which violates React's rules and aborts the whole slot with a minified
 * error on open — reports surfaced as `slot entry crashed in
 * 'workbench.drawer.recipeLibrary'`. The payload/validity is now a pure
 * derivation (useMemo), so mounting and opening the create form must not
 * throw.
 */
// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, act } from '@testing-library/react'
import { RecipeLibraryAction, type RecipeLibraryModalProps } from '../src/client-ui/recipe-library/client/RecipeLibraryAction.tsx'

afterEach(cleanup)

const libraryState = {
  status: 'ready' as const,
  cards: [{ recipeId: 'tpl', description: 'a template', phases: 1, checks: 1, deliverables: 1 }],
  error: undefined,
}

const stubProps: RecipeLibraryModalProps = {
  open: true,
  onClose: () => {},
  t: ((key: string) => key) as unknown as RecipeLibraryModalProps['t'],
  useLibrary: (selector: (snapshot: unknown) => unknown) => selector(libraryState),
  refresh: async () => {},
  createRecipe: async () => ({ ok: true }),
  updateRecipe: async () => ({ ok: true }),
  deleteRecipe: async () => ({ ok: true }),
} as unknown as RecipeLibraryModalProps

describe('recipe-library render', () => {
  it('mounts the modal and opens the create editor without a render-phase crash', async () => {
    let errored = false
    const onError = () => { errored = true }
    window.addEventListener('error', onError)

    const { getAllByText, getByText, getByRole } = render(<RecipeLibraryAction {...stubProps} />)

    // The modal body (card grid) renders.
    expect(getByText('tpl')).toBeTruthy()

    // Open the create form — this mounts RecipeEditor, which used to call
    // setState during render and abort the slot.
    act(() => {
      fireEvent.click(getRoleButton(getAllByText, 'create'))
    })

    // The RecipeEditor payload textarea (payload editor) is present and typing
    // in it keeps the form healthy.
    const editor = document.querySelector('textarea') as HTMLTextAreaElement
    expect(editor).toBeTruthy()
    act(() => {
      fireEvent.change(editor, { target: { value: 'not json' } })
    })
    expect(getByRole('alert')?.textContent).toContain('invalid JSON')

    window.removeEventListener('error', onError)
    expect(errored).toBe(false)
  })
})

/** Resolve the single button whose text content equals `label`. */
function getRoleButton(getAllByText: (text: string | RegExp) => HTMLElement[], label: string): HTMLElement {
  const match = getAllByText(label).find(el => {
    const closest = el.closest('button')
    return closest !== null && (closest.textContent ?? '').trim() === label
  })
  if (!match) throw new Error(`no button with text "${label}"`)
  return match.closest('button')!
}
