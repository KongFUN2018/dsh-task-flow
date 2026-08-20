/** Runtime value constructors and the error class for `@deepseek-ai/dsh-attention`. @module @deepseek-ai/dsh-attention */

import type { AttentionErrorCode, AttentionItemId } from './types.ts'

/**
 * Brand a plain string as an attention item id.
 * @param id - the plain string to brand.
 * @returns the branded attention item id.
 */
export function AttentionItemId(id: string): AttentionItemId {
  return id as AttentionItemId
}

/** Domain error carrying a machine-routable code. */
export class AttentionError extends Error {
  /** The machine-routable failure code. */
  readonly code: AttentionErrorCode

  constructor(code: AttentionErrorCode, message: string) {
    super(message)
    this.name = 'AttentionError'
    this.code = code
  }
}
