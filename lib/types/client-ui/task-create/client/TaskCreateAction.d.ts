import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { CreateState } from './create.ts';
import { NS } from './locales.ts';
export interface TaskCreateActionInjected {
    hooks: {
        create: HostObservable<CreateState>;
    };
    refresh: () => void;
    create: (recipeId: string, workspaceId: string, goal: string) => Promise<string>;
    /** On-demand AI polish of task-goal text; user-initiated, never auto-run. */
    polish: (goal: string) => Promise<string>;
}
export type TaskCreateActionProps = PropsRuntime<'workbench.drawer.create'> & PropsLocale<typeof NS> & InjectFace<TaskCreateActionInjected>;
/**
 * New-task wizard: pick a recipe, preview its phase flow, then set the goal.
 * The three concerns stack top-to-bottom as numbered steps (1 · 2 · 3), with
 * the phase preview rendered as a visual flow — each phase node shows its
 * sequence, kind badge, full goal, produced outputs, and the A/B/C gates bound
 * to that phase (with circuit-breaker marks). Branch-routing (DAG) is a
 * follow-up iteration; the current model is a serial phase pipeline.
 */
export declare function TaskCreateAction(props: TaskCreateActionProps): import("react").JSX.Element;
//# sourceMappingURL=TaskCreateAction.d.ts.map