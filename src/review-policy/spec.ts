/**
 * The review-policy storage-domain declaration: per-task tier records and
 * per-(task, check) breaker counters. The domain name and version reject
 * earlier media — pre-release stance, no migration.
 * @module @deepseek-ai/dsh-review-policy/src/spec
 */

import { z } from 'zod'
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import type { BreakerCounter, ReviewPolicyRecord } from './types.ts'

/** One stored tier record. */
export const reviewPolicyRecordSchema = z.object({
  recordId: z.string().min(1),
  taskId: z.string().min(1),
  tier: z.enum(['strict', 'balanced', 'trusted']),
  revision: z.number().int().min(1),
}) as unknown as z.ZodType<ReviewPolicyRecord>

/** One stored breaker counter. */
export const breakerCounterSchema = z.object({
  taskId: z.string().min(1),
  checkId: z.string().min(1),
  consecutiveFailures: z.number().int().min(0),
  revision: z.number().int().min(1),
}) as unknown as z.ZodType<BreakerCounter>

/** The review-policy domain: identity, format version, and owned tables. */
export const reviewPolicyDomainSpec = defineDomain({
  name: 'reviewpolicy',
  version: 1,
  tables: {
    tiers: domainTable<string, ReviewPolicyRecord>(reviewPolicyRecordSchema),
    breakers: domainTable<string, BreakerCounter>(breakerCounterSchema),
  },
})
