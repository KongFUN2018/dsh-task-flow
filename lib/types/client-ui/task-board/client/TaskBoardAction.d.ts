import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { TaskBoardState } from './board.ts';
import { NS } from './locales.ts';
/**
 * Registrant-private injected share (assembled in apply): the board state as
 * a hooks-compartment source (bound to `useBoard`), plus the refresh and
 * command callbacks over the controller. Plain data and callbacks only.
 */
export interface TaskBoardActionInjected {
    /** Board state source; the renderer binds it to the useBoard selector hook. */
    hooks: {
        board: HostObservable<TaskBoardState>;
    };
    /** Reload the workbench metrics from their Remote; resolves when the load settles. */
    refresh: () => Promise<void>;
}
/** Full props for the drawer's task-list tab body. */
export type TaskBoardActionProps = PropsRuntime<'workbench.drawer.tasks'> & PropsLocale<typeof NS> & InjectFace<TaskBoardActionInjected>;
/**
 * Render the drawer's task-list tab body: the cross-session task list with
 * per-row verbs; opening a row switches the drawer to that task's detail.
 * @param props - composed slot props (owner openDetail, locale, inject face).
 * @returns the task list panel filling the drawer's tab body.
 */
export declare function TaskBoardAction(props: TaskBoardActionProps): import("react").JSX.Element;
//# sourceMappingURL=TaskBoardAction.d.ts.map