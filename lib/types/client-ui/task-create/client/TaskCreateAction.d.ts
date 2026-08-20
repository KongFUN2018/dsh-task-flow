import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { CreateState } from './create.ts';
import { NS } from './locales.ts';
export interface TaskCreateActionInjected {
    hooks: {
        create: HostObservable<CreateState>;
    };
    refresh: () => void;
    create: (recipeId: string, workspaceId: string, goal: string) => Promise<string>;
}
export type TaskCreateActionProps = PropsRuntime<'workbench.drawer.create'> & PropsLocale<typeof NS> & InjectFace<TaskCreateActionInjected>;
export declare function TaskCreateAction(props: TaskCreateActionProps): import("react").JSX.Element;
//# sourceMappingURL=TaskCreateAction.d.ts.map