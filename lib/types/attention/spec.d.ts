/**
 * The attention storage-domain declaration: durable items plus the
 * item_keys idempotency index. The domain name and version reject earlier
 * media �?pre-release stance, no migration.
 * @module @deepseek-ai/dsh-attention/src/spec
 */
import { z } from 'zod';
import type { AttentionItem } from './types.ts';
/** One stored attention item. */
export declare const attentionItemSchema: z.ZodType<AttentionItem>;
/** The create-idempotency index entry: one caller key to the item it created. */
export declare const itemKeySchema: z.ZodObject<{
    itemId: z.ZodString;
}, z.core.$strip>;
/** Durable create-idempotency index entry. */
export type ItemKeyEntry = z.infer<typeof itemKeySchema>;
/** The attention domain: identity, format version, and owned tables. */
export declare const attentionDomainSpec: {
    name: string;
    version: number;
    tables: {
        items: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, AttentionItem>;
        item_keys: import("@deepseek-ai/dsh-storage-domain").DomainTableSpec<string, {
            itemId: string;
        }>;
    };
};
//# sourceMappingURL=spec.d.ts.map