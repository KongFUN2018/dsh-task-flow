/**
 * Task-local provider type surface: the journal fact kinds this provider
 * owns. One kind covers each durable write the task write chain performs.
 * Types only — no runtime code.
 * @module @deepseek-ai/dsh-task-local/types
 */
/** Journal fact kinds the task-local provider appends, one per durable write. */
export type TaskLocalFactKind = 'task/updated' | 'task-run/updated' | 'phase-run/updated' | 'submission/recorded' | 'gate-check/recorded' | 'gate-check/staled';
//# sourceMappingURL=types.d.ts.map