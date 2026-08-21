/**
 * Task-polish service (`ctx.taskPolish`): a lightweight, on-demand remote to
 * have the LLM clarify/sharpers a task goal before the task is created. It is
 * a stateless text transform — it never touches the task plane, never opens a
 * task phase or agent session. The caller (the create wizard's "AI 优化" button)
 * triggers it explicitly; nothing here runs automatically.
 *
 * Model routing follows the host's existing LLM topology: it picks the first
 * registered provider and its first disclosed model (looking up `llm`'s live
 * route catalog), so no provider/model is hard-coded and the call rides the
 * same adapters the rest of the harness uses. If no provider or model is
 * available, it throws a controlled `TaskPolishError` and the UI keeps the
 * user's draft untouched.
 * @module @deepseek-ai/dsh-task-polish
 */
import { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
/** Machine-routable polish failure codes. */
export type TaskPolishErrorCode = 'no-provider' | 'no-model' | 'generation-failed';
/** Controlled polish failure; keeps the caller's text on error. */
export declare class TaskPolishError extends Error {
    readonly code: TaskPolishErrorCode;
    constructor(code: TaskPolishErrorCode, message: string);
}
declare module '@deepseek-ai/cordis' {
    interface Context {
        taskPolish: TaskPolishService;
    }
}
export declare class TaskPolishService extends TypertRemoteService {
    static inject: string[];
    constructor(ctx: Context);
    /**
     * One-shot LLM rewrite of a task goal.
     * @param goal - the raw user-entered goal text (non-empty; trimmed here).
     * @returns the clarified goal text from the model.
     */
    polish(goal: string): Promise<string>;
}
export default TaskPolishService;
//# sourceMappingURL=index.d.ts.map