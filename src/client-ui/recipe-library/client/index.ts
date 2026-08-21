/**
 * Recipe library plugin, browser half: one `workbench.drawer.recipeLibrary`
 * entry filling the drawer's Recipe-library tab. All catalogue data lives in
 * the React-free controller (recipeLibrary.ts): a full load over the recipes
 * Remote with derived flat card views. The component sees only the store
 * snapshot and callbacks through the inject face; a reconnect resyncs from
 * the Remote (the host registry stays authoritative).
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the generated recipes Remote namespace and the forwarded-event
// key face into this compilation program.
import type {} from '@deepseek-ai/dsh-api-remotes/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { RecipePayload } from '../../../recipe/types.ts'
import { RecipeLibraryController } from './recipeLibrary.ts'
import { RecipeLibraryAction } from './RecipeLibraryAction.tsx'
import { en, NS, zh, type RecipeLibraryKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The recipe library's copy. */
    'recipeLibrary': RecipeLibraryKey
  }
}

/** Required services for the drawer seat, the recipes Remote, and copy. */
export const inject = ['slots', 'remote', 'remote.recipes', 'locale']

/**
 * Client plugin body: the dictionaries, the controller, and the drawer seat.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-recipe-library: dictionaries')
  const controller = new RecipeLibraryController(ctx)
  ctx.slots.inject('workbench.drawer.recipeLibrary', () => ctx.slots.register({
    name: 'workbench.drawer.recipeLibrary',
    locale: NS,
    inject: () => ({
      hooks: { library: controller.store },
      refresh: () => controller.refresh(),
      createRecipe: (recipeId: string, payload: RecipePayload) => controller.createRecipe(recipeId, payload),
      updateRecipe: (recipeId: string, payload: RecipePayload) => controller.updateRecipe(recipeId, payload),
      deleteRecipe: (recipeId: string) => controller.deleteRecipe(recipeId),
    }),
  }, RecipeLibraryAction))
}
