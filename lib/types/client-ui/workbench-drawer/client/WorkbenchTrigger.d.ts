import type { HostObservable, InjectFace, PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots';
import type { BadgeState } from './badge.ts';
import { NS } from './locales.ts';
import { createWorkbenchStore } from './store.ts';
/**
 * Registrant-private injected share: the badge aggregate shared with the
 * drawer panel (the same handle flows to both registrations).
 */
export interface WorkbenchTriggerInjected {
    hooks: {
        badge: HostObservable<BadgeState>;
    };
}
/** The trigger's props: sidebar.footer.action runtime owner share + shared store + locale. */
export type WorkbenchTriggerProps = PropsRuntime<'sidebar.footer.action'> & PropsStore<ReturnType<typeof createWorkbenchStore>> & PropsLocale<typeof NS> & InjectFace<WorkbenchTriggerInjected>;
/**
 * Render the sidebar "任务流程" primary entry: a prominent, accent-styled
 * button (branch icon + label) that toggles the right-side drawer. Rendered
 * wide as a full row; collapsed into the 56px rail as an icon-only entry.
 * @param props - composed slot props for the 'sidebar.footer.action' hole.
 * @returns the trigger button.
 */
export declare function WorkbenchTrigger(props: WorkbenchTriggerProps): import("react").JSX.Element;
//# sourceMappingURL=WorkbenchTrigger.d.ts.map