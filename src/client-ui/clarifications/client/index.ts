/**
 * Clarification queue plugin, browser half: one `workbench.drawer.clarifications`
 * entry filling the drawer's clarification-queue tab. Item data lives in the
 * React-free controller (`clarifications.ts`): a snapshot load over the
 * workbench-host Remote filtered to `kind === 'clarification' && status ===
 * 'open'`, revision-gated folds of forwarded `workbench/attention-updated`
 * deliveries (a row that flips non-open is evicted, an unknown id resyncs), and
 * a reconnect resync. The component sees only the store snapshot through the
 * inject face; the queue is read-only and issues no confirm/decide verb.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the generated workbenchHost Remote namespace and the
// forwarded-event key face into this compilation program.
import type {} from '@deepseek-ai/dsh-api-remotes/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { ClarificationsController } from './clarifications.ts'
import { ClarificationsAction } from './ClarificationsAction.tsx'
import { en, NS, zh, type ClarificationsKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The clarification queue's copy. */
    'clarifications': ClarificationsKey
  }
}

/** Required services for the drawer seat, the workbenchHost Remote, and copy. */
export const inject = ['slots', 'remote', 'remote.workbenchHost', 'locale']

/**
 * Client plugin body: the dictionaries, the controller, and the drawer seat.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-clarifications: dictionaries')
  const queue = new ClarificationsController(ctx)
  ctx.slots.inject('workbench.drawer.clarifications', () => ctx.slots.register({
    name: 'workbench.drawer.clarifications',
    locale: NS,
    inject: () => ({
      hooks: { clarifications: queue.store },
      refresh: () => { void queue.refresh() },
    }),
  }, ClarificationsAction))
}
