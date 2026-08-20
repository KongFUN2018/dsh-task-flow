import type { HostObservable, InjectFace, PropsLocale, PropsRenderSlots, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots';
import type { BadgeState } from './badge.ts';
import { NS } from './locales.ts';
import type { createWorkbenchStore } from './store.ts';
/**
 * Conversation-relative drawer width for the current viewport: the shell's
 * center column (viewport minus the default sidebar/details offset) scaled
 * by CONVERSATION_WIDTH_RATIO, capped to the draggable maximum. All tabs
 * share one default; a user drag overrides it within WIDTH_MIN..WIDTH_MAX.
 * @param viewport - current window.innerWidth.
 * @returns the default drawer width in px, capped to both bounds.
 */
export declare function defaultWidthFor(viewport: number): number;
/**
 * Registrant-private injected share (assembled in apply): the badge
 * aggregates as a hooks-compartment source (bound to `useBadge`). Plain
 * data only.
 */
export interface WorkbenchDrawerInjected {
    /** Badge state source; the renderer binds it to the useBadge selector hook. */
    hooks: {
        badge: HostObservable<BadgeState>;
    };
}
/** The panel's props: overlay runtime share + declared seats + store + locale. */
export type WorkbenchDrawerProps = PropsRuntime<'shell.overlay'> & PropsRenderSlots<'workbench.drawer.tasks' | 'workbench.drawer.taskList' | 'workbench.drawer.recipeLibrary' | 'workbench.drawer.inbox' | 'workbench.drawer.clarifications' | 'workbench.drawer.detail' | 'workbench.drawer.create'> & PropsStore<ReturnType<typeof createWorkbenchStore>> & PropsLocale<typeof NS> & InjectFace<WorkbenchDrawerInjected>;
/**
 * Render the right-side workbench drawer: four tabs dispatching the declared
 * content seats. The component stays mounted while the entry lives; the open
 * flag, active tab, and detail selection ride the shared store, so the sidebar
 * trigger and internal navigation keep the same drawer state.
 * @param props - composed slot props (runtime, seats, store, locale, inject).
 * @returns the open drawer panel, or nothing while closed.
 */
export declare function WorkbenchDrawer(props: WorkbenchDrawerProps): import("react").JSX.Element | null;
//# sourceMappingURL=WorkbenchDrawer.d.ts.map