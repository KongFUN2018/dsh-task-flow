import type { ToolCallViewProps } from '@deepseek-ai/dsh-client-ui-tool/client';
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import { NS } from './locales.ts';
/** Proposal shape the task_create tool projects as its resultView. */
export interface TaskCreateProposalViewData {
    readonly recipeId: string;
    readonly goal: string;
    readonly inheritSession: boolean;
    readonly phaseCount: number;
    readonly checks: number;
    readonly idempotencyKey: string;
}
/** Registrant-private injected share: the confirm callback issuing createTask. */
export interface TaskCreateConfirmInjected {
    confirm: (proposal: TaskCreateProposalViewData, inherit: boolean) => Promise<string>;
}
export type TaskCreateProposalViewProps = ToolCallViewProps & PropsLocale<typeof NS> & {
    readonly confirm: (proposal: TaskCreateProposalViewData, inherit: boolean) => Promise<string>;
};
/** The keyed tool.call.toolview card for task_create: proposal, inherit toggle, confirm/cancel. */
export declare function TaskCreateProposalView(props: TaskCreateProposalViewProps): import("react").JSX.Element | null;
//# sourceMappingURL=TaskCreateProposalView.d.ts.map