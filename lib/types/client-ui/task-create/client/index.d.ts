/**
 * Task-creation wizard, browser half: one `workbench.drawer.create` seat
 * filling the drawer's create tab with the three-column new-task panel.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type UiTaskCreateKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        'uiTaskCreate': UiTaskCreateKey;
    }
}
export declare const inject: string[];
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map