/**
 * Package-owned invariant companion for @deepseek-ai/dsh-clarification.
 * @module @deepseek-ai/dsh-clarification/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantFailure, InvariantInstaller } from '@deepseek-ai/dsh-invariants'
import type { DomainChanged } from '@deepseek-ai/dsh-storage-domain'

const PACKAGE_NAME = '@deepseek-ai/dsh-clarification'
const DOMAIN_NAME = 'clarification'

/** Cordis companion plugin name. */
export const name = 'clarification-invariant'
/** Services required before the companion can reserve and check package ownership. */
export const inject = ['invariants']

/** Read the open clarification domain handle, failing when it is absent. */
function openDomain(ctx: Context, fail: InvariantFailure) {
  const domain = ctx.storage.form('domain').get(DOMAIN_NAME)
  if (domain === undefined) return fail(`${DOMAIN_NAME} changed while the clarification domain is not open`)
  return domain
}

/**
 * Reference integrity across the clarification tables on the authoritative
 * change stream: a question must name a stored request, an answer must name a
 * stored question, and a request-key entry must name a stored request — a
 * dangling name means a write recorded a reference without the durable entity
 * behind it, breaking answer completion and recovery.
 */
const install: InvariantInstaller = Object.assign((ctx: Context, fail: InvariantFailure) => {
  ctx.on('domain/changed', (change: DomainChanged) => {
    if (change.domain !== DOMAIN_NAME || change.operation !== 'put') return
    const domain = openDomain(ctx, fail)
    const requests = domain.table('requests')
    const questions = domain.table('questions')
    const requestExists = (requestId: string): boolean => requests.get(requestId) !== undefined
    const questionExists = (questionId: string): boolean => questions.get(questionId) !== undefined
    if (change.table === 'questions') {
      const question = change.value as { requestId: string }
      if (!requestExists(question.requestId)) {
        return fail(`question names request '${question.requestId}' which is not stored`)
      }
      return
    }
    if (change.table === 'answers') {
      const answer = change.value as { questionId: string }
      if (!questionExists(answer.questionId)) {
        return fail(`answer names question '${answer.questionId}' which is not stored`)
      }
      return
    }
    if (change.table === 'request_keys') {
      const entry = change.value as { requestId: string }
      if (!requestExists(entry.requestId)) {
        return fail(`request_key names request '${entry.requestId}' which is not stored`)
      }
    }
  }, { global: true })
}, { inject: ['storage'] })

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
