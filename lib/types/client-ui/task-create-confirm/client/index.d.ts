/**
 * Task-creation confirmation card, browser half: the keyed `tool.call.toolview`
 * renderer for the `task_create` tool. It shows the proposal, the session
 * inheritance toggle, and confirm/cancel; confirm issues createTask through the
 * tasks Remote and flips the card to the created state.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type UiTaskCreateConfirmKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        'uiTaskCreateConfirm': UiTaskCreateConfirmKey;
    }
}
export declare const inject: string[];
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map