/** Package-owned invariant companion for @deepseek-ai/dsh-tool-task-create. @module @deepseek-ai/dsh-tool-task-create/invariant */
const PACKAGE_NAME = '@deepseek-ai/dsh-tool-task-create';
export const name = 'tool-task-create-invariant';
export const inject = ['invariants'];
/** Read-only model tool; owns no durable state, so no runtime relation to assert. */
const install = Object.assign((_ctx, _fail) => {
    void _ctx;
    void _fail;
}, { inject: ['storage'] });
export const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
/* jscpd:ignore-end */
//# sourceMappingURL=invariant.js.map