/** Package-owned invariant companion for @deepseek-ai/dsh-tool-task-create. @module @deepseek-ai/dsh-tool-task-create/invariant */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantFailure, InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-tool-task-create'

export const name = 'tool-task-create-invariant'
export const inject = ['invariants']

/** Read-only model tool; owns no durable state, so no runtime relation to assert. */
const install: InvariantInstaller = Object.assign((_ctx: Context, _fail: InvariantFailure) => {
  void _ctx
  void _fail
}, { inject: ['storage'] })

export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
