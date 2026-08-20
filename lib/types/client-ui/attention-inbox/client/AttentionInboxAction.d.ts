import type { BatchConfirmItem } from '../../../workbench/host/types.ts';
import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { type InboxState } from './inbox.ts';
import { NS } from './locales.ts';
/**
 * Registrant-private injected share (assembled in apply): the inbox state as
 * a hooks-compartment source (bound to `useInbox`), plus the refresh and
 * command callbacks over the controller. Plain data and callbacks only.
 */
export interface AttentionInboxActionInjected {
    /** Inbox state source; the renderer binds it to the useInbox selector hook. */
    hooks: {
        inbox: HostObservable<InboxState>;
    };
    /** Reload the item list from the workbench-host snapshot. */
    refresh: () => void;
    /** Confirm the selected B-class items in one batch. */
    confirm: (targets: BatchConfirmItem[]) => void;
    /** Resolve one C-class item with the entered decision text. */
    decide: (itemId: string, decision: string) => void;
}
/** Full props for the drawer's attention-inbox tab body. */
export type AttentionInboxActionProps = PropsRuntime<'workbench.drawer.inbox'> & PropsLocale<typeof NS> & InjectFace<AttentionInboxActionInjected>;
/**
 * Render the drawer's attention-inbox tab body: the B batch-confirm list,
 * the C single-decision rows, and the read-only items, over the controller
 * store through the inject face.
 * @param props - composed slot props (locale, inject face).
 * @returns the inbox panel filling the drawer's tab body.
 */
export declare function AttentionInboxAction(props: AttentionInboxActionProps): import("react").JSX.Element;
//# sourceMappingURL=AttentionInboxAction.d.ts.map