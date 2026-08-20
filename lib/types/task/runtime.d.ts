/** Runtime constructors for the task-flow task domain. */
import type { DeliverableId as DeliverableIdType, DeliverableVersionId as DeliverableVersionIdType, PhaseRunId as PhaseRunIdType, SubmissionId as SubmissionIdType, TaskId as TaskIdType, TaskRunId as TaskRunIdType } from './types.ts';
/**
 * Brand a string as a task id.
 * @param id - raw task identifier.
 * @returns the same string with the compile-time brand.
 */
export declare function TaskId(id: string): TaskIdType;
/**
 * Brand a string as a task-run id.
 * @param id - raw run identifier.
 * @returns the same string with the compile-time brand.
 */
export declare function TaskRunId(id: string): TaskRunIdType;
/**
 * Brand a string as a phase-run id.
 * @param id - raw phase-run identifier.
 * @returns the same string with the compile-time brand.
 */
export declare function PhaseRunId(id: string): PhaseRunIdType;
/**
 * Brand a string as a submission id.
 * @param id - raw submission identifier.
 * @returns the same string with the compile-time brand.
 */
export declare function SubmissionId(id: string): SubmissionIdType;
/**
 * Brand a string as a deliverable id.
 * @param id - raw deliverable identifier.
 * @returns the same string with the compile-time brand.
 */
export declare function DeliverableId(id: string): DeliverableIdType;
/**
 * Brand a string as a deliverable-version id.
 * @param id - raw version identifier.
 * @returns the same string with the compile-time brand.
 */
export declare function DeliverableVersionId(id: string): DeliverableVersionIdType;
//# sourceMappingURL=runtime.d.ts.map