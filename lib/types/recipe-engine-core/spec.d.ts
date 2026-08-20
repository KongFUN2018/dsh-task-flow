/**
 * The recipe-engine storage-domain declaration: one table of durable
 * phase-session bindings keyed by phase run id. Bindings survive restarts
 * and drive recovery: which phase run ran which attempt in which session,
 * and which submission the latest attempt recorded.
 * @module @deepseek-ai/dsh-recipe-engine-core/src/spec
 */
import { z } from 'zod';
import type { PhaseSessionBinding } from './types.ts';
/** Durable phase-session binding schema. */
export declare const phaseSessionBindingSchema: z.ZodType<PhaseSessionBinding>;
/** The recipe-engine domain: identity, format version, and the binding table. */
export declare const recipeEngineDomainSpec: {
    name: string;
    version: number;
    tables: {
        phase_sessions: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, PhaseSessionBinding>;
    };
};
//# sourceMappingURL=spec.d.ts.map