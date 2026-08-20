import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { type TaskListState, type TaskListVerb } from './taskList.ts';
import { NS } from './locales.ts';
/**
 * Registrant-private injected share (assembled in apply): the task list as
 * a hooks-compartment source (bound to `useList`), plus the refresh and
 * command callbacks over the controller. Plain data and callbacks only.
 */
export interface TaskListActionInjected {
    /** Task list state source; the renderer binds it to the useList selector hook. */
    hooks: {
        list: HostObservable<TaskListState>;
    };
    /** Reload the task list from the tasks Remote; resolves when the load settles. */
    refresh: () => Promise<void>;
    /** Issue one pause/resume/cancel verb against a task row. */
    command: (taskId: string, verb: TaskListVerb) => void;
}
/** Full props for the drawer's task-list tab body. */
export type TaskListActionProps = PropsRuntime<'workbench.drawer.taskList'> & PropsLocale<typeof NS> & InjectFace<TaskListActionInjected>;
/**
 * Render the drawer's task-list tab body: a focused list over the same task
 * rows without KPI/chart chrome; opening a row switches the drawer to that
 * task's detail.
 * @param props - composed slot props (owner openDetail, locale, inject face).
 * @returns the task list panel filling the drawer's tab body.
 */
export declare function TaskListAction(props: TaskListActionProps): import("react").JSX.Element;
//# sourceMappingURL=TaskListAction.d.ts.map