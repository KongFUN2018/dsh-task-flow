/**
 * Runtime values of the clarification package: branded identity constructors.
 * @module @deepseek-ai/dsh-clarification/src/runtime
 */
import type { ClarificationQuestionId, ClarificationRequestId } from './types.ts';
/**
 * Brand one wire value as a clarification-request id.
 * @param value - Wire value from the boundary.
 * @returns the branded request id.
 */
export declare function ClarificationRequestId(value: string): ClarificationRequestId;
/**
 * Brand one wire value as a clarification-question id.
 * @param value - Wire value from the boundary.
 * @returns the branded question id.
 */
export declare function ClarificationQuestionId(value: string): ClarificationQuestionId;
//# sourceMappingURL=runtime.d.ts.map