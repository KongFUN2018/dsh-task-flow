/**
 * Model-facing task creation (entry B). Each call turns an explicit create
 * request into a confirmation proposal: it validates the inferred recipe,
 * records the goal and the session-inheritance choice, and returns the
 * metadata the confirmation card renders. Creation itself is deferred to
 * the human — the tool never creates (v1 responds to explicit intent only;
 * the confirm step owns createTask and the session seed).
 * @module @deepseek-ai/dsh-tool-task-create
 */
import type { Context } from '@deepseek-ai/cordis';
export type { TaskCreateInput, TaskCreateProposal } from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        recipes: import('../recipe/index.ts').default;
    }
}
export declare const name = "tool-task-create";
export declare const inject: string[];
/**
 * Register the task_create tool on ctx.tools.
 * @param ctx - registrant context carrying the tool registry and the recipe registry.
 */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map