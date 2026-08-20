import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ClarificationsState } from './clarifications.ts';
import { NS } from './locales.ts';
/**
 * Registrant-private injected share (assembled in apply): the open-clarification
 * list as a hooks-compartment source (bound to `useClarifications`) plus the
 * refresh callback over the controller. Plain data and callbacks only.
 */
export interface ClarificationsActionInjected {
    /** Queue state source; the renderer binds it to the useClarifications selector hook. */
    hooks: {
        clarifications: HostObservable<ClarificationsState>;
    };
    /** Reload the open-clarification list from the workbench-host snapshot. */
    refresh: () => void;
}
/** Full props for the drawer's clarification-queue tab body. */
export type ClarificationsActionProps = PropsRuntime<'workbench.drawer.clarifications'> & PropsLocale<typeof NS> & InjectFace<ClarificationsActionInjected>;
/**
 * Render the drawer's clarification-queue tab body: the read-only list of
 * open clarification items over the controller store through the inject face.
 * @param props - composed slot props (locale, inject face).
 * @returns the clarification panel filling the drawer's tab body.
 */
export declare function ClarificationsAction(props: ClarificationsActionProps): import("react").JSX.Element;
//# sourceMappingURL=ClarificationsAction.d.ts.map