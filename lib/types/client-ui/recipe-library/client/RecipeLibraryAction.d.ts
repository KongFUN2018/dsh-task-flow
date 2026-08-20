import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { RecipeLibraryState } from './recipeLibrary.ts';
import { NS } from './locales.ts';
/** Registrant-private injected share (assembled in apply): the card state as
 * a hooks-compartment source (bound to `useLibrary`) plus the reload
 * callback over the controller. Plain data and callbacks only. */
export interface RecipeLibraryActionInjected {
    /** Card-state source; the renderer binds it to the useLibrary selector hook. */
    hooks: {
        library: HostObservable<RecipeLibraryState>;
    };
    /** Reload the recipe catalogue from the recipes Remote. */
    refresh: () => Promise<void>;
}
/** Full props for the drawer's Recipe-library tab body. */
export type RecipeLibraryActionProps = PropsRuntime<'workbench.drawer.recipeLibrary'> & PropsLocale<typeof NS> & InjectFace<RecipeLibraryActionInjected>;
/**
 * Render the drawer's Recipe-library tab body: a grid of processing-template
 * cards over the loaded catalogue, each `使用模板新建` pressing the owner's
 * `openCreate` to switch into the creation wizard.
 * @param props - composed slot props (owner openCreate, locale, inject face).
 * @returns the recipe card grid filling the drawer's tab body.
 */
export declare function RecipeLibraryAction(props: RecipeLibraryActionProps): import("react").JSX.Element;
//# sourceMappingURL=RecipeLibraryAction.d.ts.map