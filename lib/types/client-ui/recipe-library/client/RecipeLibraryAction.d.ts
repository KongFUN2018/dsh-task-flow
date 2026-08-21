import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { RecipeLibraryState } from './recipeLibrary.ts';
import type { RecipePayload } from '../../../recipe/types.ts';
import { NS } from './locales.ts';
/** Registrant-private injected share (assembled in apply): the card state as
 * a hooks-compartment source (bound to `useLibrary`) plus the CRUD callbacks. */
export interface RecipeLibraryActionInjected {
    /** Card-state source; the renderer binds it to the useLibrary selector hook. */
    hooks: {
        library: HostObservable<RecipeLibraryState>;
    };
    /** Reload the recipe catalogue from the recipes Remote. */
    refresh: () => Promise<void>;
    /** Create a fresh recipe family (revision 1). */
    createRecipe: (recipeId: string, payload: RecipePayload) => Promise<{
        ok: boolean;
        error?: {
            code: string;
        };
    }>;
    /** Register a new immutable revision of an existing family. */
    updateRecipe: (recipeId: string, payload: RecipePayload) => Promise<{
        ok: boolean;
        error?: {
            code: string;
        };
    }>;
    /** Soft-delete one recipe family from the pickable catalogue. */
    deleteRecipe: (recipeId: string) => Promise<{
        ok: boolean;
        error?: {
            code: string;
        };
    }>;
}
/** Full props for the standalone Recipe-library management modal. */
export type RecipeLibraryModalProps = PropsRuntime<'workbench.drawer.recipeLibrary'> & PropsLocale<typeof NS> & InjectFace<RecipeLibraryActionInjected> & {
    open: boolean;
    onClose: () => void;
};
/**
 * Standalone Recipe-library management modal: a card grid over the loaded
 * catalogue with 新建 / 编辑 / 删除 affordances plus a JSON payload editor for
 * authoring or updating an immutable revision. No task-flow coupling lives
 * here — create/update/delete hit the recipes Remote through the inject face.
 * @param props - runtime seat props, locale, inject face, open flag, close.
 * @returns the management modal portal, or nothing while closed.
 */
export declare function RecipeLibraryAction(props: RecipeLibraryModalProps): import("react").JSX.Element;
//# sourceMappingURL=RecipeLibraryAction.d.ts.map