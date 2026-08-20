/**
 * Recipe library plugin, browser half: one `workbench.drawer.recipeLibrary`
 * entry filling the drawer's Recipe-library tab. All catalogue data lives in
 * the React-free controller (recipeLibrary.ts): a full load over the recipes
 * Remote with derived flat card views. The component sees only the store
 * snapshot and callbacks through the inject face; a reconnect resyncs from
 * the Remote (the host registry stays authoritative).
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type RecipeLibraryKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The recipe library's copy. */
        'recipeLibrary': RecipeLibraryKey;
    }
}
/** Required services for the drawer seat, the recipes Remote, and copy. */
export declare const inject: string[];
/**
 * Client plugin body: the dictionaries, the controller, and the drawer seat.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map