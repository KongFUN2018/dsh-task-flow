import type { RewindPreview } from '../../../rewind/types.ts';
import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { TaskDetailState } from './detail.ts';
import { NS } from './locales.ts';
/**
 * Registrant-private injected share (assembled in apply): the detail state
 * as a hooks-compartment source (bound to `useDetail`), plus the load
 * callback over the controller. Plain data and callbacks only.
 */
export interface TaskDetailActionInjected {
    /** Detail state source; the renderer binds it to the useDetail selector hook. */
    hooks: {
        detail: HostObservable<TaskDetailState>;
    };
    /** Load one task's projection, phase runs, and gate verdicts. */
    load: (taskId: string) => void;
    /** Request a rewind impact preview as a blocking attention decision item. */
    requestRewind: (taskId: string, roots: string[], actor: string, idemKey: string) => Promise<RewindPreview & {
        itemId: string;
    }>;
    /** Re-submit the phase output as a superseding revision carrying a note. */
    requestPatch: (taskId: string, phaseRunId: string, note: string, actor: string, idemKey: string) => Promise<import('../../../task/types.ts').PhaseSubmission>;
}
/** Full props for the drawer's task-detail tab body. */
export type TaskDetailActionProps = PropsRuntime<'workbench.drawer.detail'> & PropsLocale<typeof NS> & InjectFace<TaskDetailActionInjected>;
/**
 * Render the drawer's task-detail tab body: the owner-selected task's
 * projection, phase runs, and gate verdicts. A `taskId` change reloads
 * through the controller; no selection renders the empty state.
 * @param props - composed slot props (owner taskId, locale, inject face).
 * @returns the detail panel filling the drawer's tab body.
 */
export declare function TaskDetailAction(props: TaskDetailActionProps): import("react").JSX.Element;
//# sourceMappingURL=TaskDetailAction.d.ts.map