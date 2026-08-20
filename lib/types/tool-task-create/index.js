/**
 * Model-facing task creation (entry B). Each call turns an explicit create
 * request into a confirmation proposal: it validates the inferred recipe,
 * records the goal and the session-inheritance choice, and returns the
 * metadata the confirmation card renders. Creation itself is deferred to
 * the human — the tool never creates (v1 responds to explicit intent only;
 * the confirm step owns createTask and the session seed).
 * @module @deepseek-ai/dsh-tool-task-create
 */
import { defineTool } from '@deepseek-ai/dsh-tools';
export const name = 'tool-task-create';
export const inject = ['tools', 'recipes'];
let idempotencySeq = 0;
/** One pre-create lookup: confirm the recipe exists and read its shape for the card. */
function proposalOf(ctx, input) {
    const recipeId = input.recipeId.trim();
    if (recipeId.length === 0)
        throw new Error('task-create: recipeId must be a non-empty string');
    const latest = ctx.recipes.latest(recipeId);
    if (latest === undefined) {
        throw new Error('task-create: unknown recipe "' + recipeId + '"');
    }
    const payload = latest.payload;
    idempotencySeq += 1;
    return {
        recipeId: latest.recipeId,
        goal: input.goal.trim(),
        inheritSession: input.inheritSession,
        phaseCount: payload.phases.length,
        checks: payload.gateChecks.length,
        idempotencyKey: 'task-create:' + recipeId + ':' + Date.now().toString(36) + ':' + String(idempotencySeq),
    };
}
const DESCRIPTION = 'Create a flow task from an explicit request. Given a recipe the '
    + 'human names (e.g. a research pipeline), the goal, and whether to seed '
    + 'the first phase from the current session, return a confirmation proposal — the '
    + 'task is NOT created until the human confirms the rendered card. Respond to '
    + 'explicit create intent only; never suggest a task unprompted.';
/**
 * Register the task_create tool on ctx.tools.
 * @param ctx - registrant context carrying the tool registry and the recipe registry.
 */
export function apply(ctx) {
    ctx.tools.register(defineTool({
        name: 'task_create',
        description: DESCRIPTION,
        parameters: {
            recipeId: { type: 'string', required: true, description: 'The inferred recipe id (the task template the goal fits).' },
            goal: { type: 'string', required: true, description: 'A short summary of the desired outcome; seeds the first phase on confirm.' },
            inheritSession: { type: 'boolean', required: true, description: 'Whether to derive the first phase from the current session discussion.' },
        },
        output: {
            schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    recipeId: { type: 'string', required: true },
                    goal: { type: 'string', required: true },
                    inheritSession: { type: 'boolean', required: true },
                    phaseCount: { type: 'integer', required: true },
                    checks: { type: 'integer', required: true },
                    idempotencyKey: { type: 'string', required: true },
                },
            },
            render: (_args, value) => [{
                    type: 'text',
                    text: 'Proposed a "' + value.recipeId + '" task (' + String(value.phaseCount) + ' phases, '
                        + String(value.checks) + ' checks, inherit=' + String(value.inheritSession)
                        + '). Creation awaits human confirmation.',
                }],
            // The confirmation card reads this structured projection (resultView);
            // the proposal is already canonical JSON, so the meta is the value itself.
            presentationMeta: (_args, value) => value,
        },
        execute(args, _exec) {
            const input = args;
            return Promise.resolve(proposalOf(ctx, input));
        },
        presentCall: args => ({ card: 'generic', title: 'Create flow task', kind: 'other', rawInput: args }),
    }));
}
//# sourceMappingURL=index.js.map