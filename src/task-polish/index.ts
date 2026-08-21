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

import { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { createUserMessage } from '@deepseek-ai/dsh-llm'

/** Machine-routable polish failure codes. */
export type TaskPolishErrorCode = 'no-provider' | 'no-model' | 'generation-failed'

/** Controlled polish failure; keeps the caller's text on error. */
export class TaskPolishError extends Error {
  readonly code: TaskPolishErrorCode
  constructor(code: TaskPolishErrorCode, message: string) {
    super(message)
    this.code = code
    this.name = 'TaskPolishError'
  }
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    taskPolish: TaskPolishService
  }
}

/** The system instruction for clarifying a task goal. */
const POLISH_SYSTEM = [
  'You are assisting a user who is about to create a task from a workflow recipe.',
  'Clarify and sharpen the user\'s task goal: make it specific, measurable, outcome-focused,',
  'and actionable. Keep the user\'s intent and scope. Return ONLY the rewritten goal text,',
  'without commentary, quotes, or a preamble.',
].join(' ')

/** The preferred provider id when several are registered (checked first). */
const PREFERRED_PROVIDERS: readonly string[] = ['deepseek', 'pi-ai']

export class TaskPolishService extends TypertRemoteService {
  static inject = ['llm']

  constructor(ctx: Context) {
    super(ctx, 'taskPolish')
  }

  /**
   * One-shot LLM rewrite of a task goal.
   * @param goal - the raw user-entered goal text (non-empty; trimmed here).
   * @returns the clarified goal text from the model.
   */
  @Remote('polish')
  async polish(goal: string): Promise<string> {
    const text = goal.trim()
    if (text === '') throw new TaskPolishError('generation-failed', 'goal is empty')

    const providers = this.ctx.llm.listProviders()
    if (providers.length === 0) throw new TaskPolishError('no-provider', 'no LLM provider is registered')

    const provider = PREFERRED_PROVIDERS.find(id => providers.some(p => p.id === id)) ?? providers[0]!.id
    const models = await this.ctx.llm.listModels(provider)
    const model = models[0]?.id
    if (model === undefined) throw new TaskPolishError('no-model', `provider "${provider}" discloses no model`)

    const prepared = await this.ctx.llm.prepareCall({ provider, model, temperature: 0.4 })
    const system = POLISH_SYSTEM
    let out = ''
    for await (const chunk of prepared.stream({
      provider,
      model,
      system,
      messages: [createUserMessage({ source: { kind: 'user' }, content: [{ type: 'text', text }] })],
    })) {
      if (chunk.type === 'text-delta') out += chunk.text
    }
    const polished = out.trim()
    if (polished === '') throw new TaskPolishError('generation-failed', 'model produced no text')
    return polished
  }
}

export default TaskPolishService
