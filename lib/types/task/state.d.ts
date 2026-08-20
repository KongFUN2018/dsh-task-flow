/**
 * Pure task and phase-run transition tables. The task package owns these
 * transitions; providers persist, they never widen them. States no shipped
 * command enters stay declared in the vocabulary.
 * @module @deepseek-ai/dsh-task/src/state
 */
import type { PhaseRunState, TaskState } from './types.ts';
/** Task-level commands the task service accepts. */
export type TaskCommand = 'start' | 'pause' | 'settlePause' | 'resume' | 'cancel' | 'settleCancel' | 'complete' | 'fail' | 'awaitDecision' | 'resumeFromDecision';
/**
 * Resolve one task command against the current state.
 * @param state - the task's current state.
 * @param command - the requested command.
 * @returns the destination state, or `null` when the transition is invalid.
 */
export declare function taskTransition(state: TaskState, command: TaskCommand): TaskState | null;
/**
 * M1 completion guard: the task runs and every phase run of the current run
 * passed. Retired runs do not block completion: an impact-staled run is a
 * terminal old run the engine already replaced with a fresh passed run, and
 * a superseded run is the branch a rewind retired (M5). Open decisions,
 * unsigned B items, and stale deliverables enter through the registered
 * completion guards (M5), which `completeTask` consults after this check.
 * @param state - the task's current state.
 * @param phaseStates - every phase-run state of the current run.
 * @returns whether the task may complete.
 */
export declare function canCompleteTask(state: TaskState, phaseStates: readonly PhaseRunState[]): boolean;
/**
 * Phase-run commands the task service accepts. `stale` is the M2 impact
 * command: running and submitting are excluded because an in-flight atomic
 * action settles per the M1 quiescence contract, and its submission is
 * rejected on stale inputs at acceptance instead. `passed` is a source: a
 * passed run over invalidated inputs is exactly the pseudo-valid downstream
 * the closure exists to retire.
 */
export type PhaseCommand = 'start' | 'acceptSubmission' | 'startGate' | 'pass' | 'fail' | 'cancel' | 'stale' | 'supersede' | 'awaitInput' | 'awaitDecision' | 'resumeFromAwaiting';
/**
 * Resolve one phase command against the current phase-run state.
 * @param state - the phase run's current state.
 * @param command - the requested command.
 * @returns the destination state, or `null` when the transition is invalid.
 */
export declare function phaseTransition(state: PhaseRunState, command: PhaseCommand): PhaseRunState | null;
//# sourceMappingURL=state.d.ts.map