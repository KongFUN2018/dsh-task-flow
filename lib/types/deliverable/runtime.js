/**
 * Runtime values of the deliverable-local package: branded identity
 * constructors and the journal-fact sentinel for saves no submission traces.
 * @module @deepseek-ai/dsh-deliverable-local/src/runtime
 */
/**
 * Brand one wire value as a deliverable id.
 * @param value - Wire value from the boundary.
 * @returns the branded deliverable id.
 */
export function DeliverableId(value) {
    return value;
}
/**
 * Brand one wire value as a deliverable version id.
 * @param value - Wire value from the boundary.
 * @returns the branded version id.
 */
export function DeliverableVersionId(value) {
    return value;
}
/**
 * Brand one wire value as an impact-snapshot id.
 * @param value - Wire value from the boundary.
 * @returns the branded snapshot id.
 */
export function ImpactSnapshotId(value) {
    return value;
}
/**
 * The journal fact's owning task when a durable deliverable write traces no
 * source submission: deliverable-domain facts carry this sentinel instead of
 * inventing a task projection. The journal stores it verbatim; no task
 * projection reads it back.
 */
export const UNTASKED_FACT_TASK_ID = 'deliverables';
//# sourceMappingURL=runtime.js.map