/**
 * Workbench attention-channel host service: the client-safe projection over
 * the M4 persistent attention inbox (`ctx.attention`). Snapshot reads project
 * open `AttentionItem`s into wire views; confirm/resolve/invalidate delegate
 * to the attention service's compare-and-set commands, so a stale, withdrawn,
 * resolved, or version-conflicted item is never silently confirmed. The
 * `workbench/attention-updated` event still broadcasts after a committed
 * change, and the snapshot version is the journal checkpoint seq.
 * @module @deepseek-ai/dsh-workbench-host
 */

import { randomUUID } from 'node:crypto'
import { Context } from '@deepseek-ai/cordis'
import { AttentionItemId } from '../../attention/index.ts'
import type { AttentionItem, ConfirmTarget } from '../../attention/index.ts'
import '../../attention/index.ts'
import '../../workbench/journal/index.ts'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { WorkbenchItemId as WorkbenchItemIdValue } from './runtime.ts'
import type {
  AttentionItemView,
  BatchConfirmItemResult,
  BatchConfirmRequest,
  BatchConfirmResponse,
  InvalidateItemRequest,
  InvalidateItemResponse,
  ResolveDecisionRequest,
  ResolveDecisionResponse,
  WorkbenchAttentionUpdate,
  WorkbenchItemId,
  WorkbenchSnapshot,
} from './types.ts'

export { WorkbenchItemId } from './runtime.ts'
export type * from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    workbenchHost: WorkbenchHostService
  }
}

/** One committed change row carried by the push event. */
interface ChangedRow {
  readonly itemId: WorkbenchItemId
  readonly status: AttentionItemView['status']
  readonly entityRevision: number
}

/** Validate one wire actor identity: non-empty after trim. */
function resolveActor(value: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError('workbench actor must be a non-empty string')
  }
  return value.trim()
}

/** Validate one wire compare-and-set revision. */
function resolveRevision(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new TypeError(`workbench ${field} must be a positive safe integer`)
  }
  return value
}

/** Validate one wire free-text field: non-empty after trim. */
function resolveText(value: string, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`workbench ${field} must be a non-empty string`)
  }
  return value.trim()
}

/** Project one open attention item into its immutable wire view. */
function viewOf(item: AttentionItem): AttentionItemView {
  return {
    itemId: WorkbenchItemIdValue(String(item.itemId)),
    kind: item.kind,
    status: item.state,
    entityRevision: item.entityRevision,
    title: item.checkId ?? item.decisionKind,
  }
}

/**
 * Workbench attention inbox (`ctx.workbenchHost`): the M4 client-safe
 * projection over the persistent attention service.
 */
export class WorkbenchHostService extends TypertRemoteService {
  /** The service projects and delegates to the persistent attention service and reads the journal position. */
  static inject = ['attention', 'workbenchJournal']

  constructor(ctx: Context) {
    super(ctx, 'workbenchHost')
  }

  /**
   * Read the whole open inbox with per-item compare-and-set revisions.
   * @returns the current snapshot.
   */
  @Remote('listSnapshot')
  listSnapshot(): WorkbenchSnapshot {
    return {
      snapshotVersion: this.ctx.workbenchJournal.checkpoint().journalSeq,
      items: this.ctx.attention.listOpen().map(viewOf),
    }
  }

  /**
   * Confirm a batch of B-class items in one pass: every still-open
   * revision-matching item resolves, and each target reports its own outcome.
   * @param request - actor plus the compare-and-set targets.
   * @returns per-item results and the post-commit snapshot version.
   */
  @Remote('confirmBatch')
  async confirmBatch(request: BatchConfirmRequest): Promise<BatchConfirmResponse> {
    const actor = resolveActor(request.actor)
    const targets: ConfirmTarget[] = request.items.map(target => ({
      itemId: AttentionItemId(String(target.itemId)),
      expectedEntityRevision: resolveRevision(target.expectedEntityRevision, 'expectedEntityRevision'),
    }))
    const settled = await this.ctx.attention.confirmBatch(targets, actor, randomUUID())
    const changed: ChangedRow[] = []
    const results: BatchConfirmItemResult[] = settled.map((row): BatchConfirmItemResult => {
      if (row.outcome === 'resolved' && row.currentRevision !== undefined) {
        changed.push({ itemId: WorkbenchItemIdValue(String(row.itemId)), status: 'resolved', entityRevision: row.currentRevision })
      }
      return {
        itemId: WorkbenchItemIdValue(String(row.itemId)),
        outcome: row.outcome,
        ...(row.currentRevision === undefined ? {} : { currentRevision: row.currentRevision }),
      }
    })
    return { snapshotVersion: this.commit(changed), results }
  }

  /**
   * Resolve one C-class decision item; C items are never batched.
   * @param request - compare-and-set target plus the recorded decision text.
   * @returns the single-item outcome and the post-commit snapshot version.
   */
  @Remote('resolveDecision')
  async resolveDecision(request: ResolveDecisionRequest): Promise<ResolveDecisionResponse> {
    const actor = resolveActor(request.actor)
    const decision = resolveText(request.decision, 'decision')
    const revision = resolveRevision(request.expectedEntityRevision, 'expectedEntityRevision')
    const settled = await this.ctx.attention.resolveDecision(
      String(request.itemId),
      revision,
      decision,
      actor,
      randomUUID(),
    )
    const changed: ChangedRow[] = []
    if (settled.outcome === 'resolved' && settled.currentRevision !== undefined) {
      changed.push({ itemId: WorkbenchItemIdValue(String(request.itemId)), status: 'resolved', entityRevision: settled.currentRevision })
    }
    return {
      snapshotVersion: this.commit(changed),
      outcome: settled.outcome,
      ...(settled.currentRevision === undefined ? {} : { currentRevision: settled.currentRevision }),
    }
  }

  /**
   * Invalidate one open item upstream: the stale-propagation trigger that
   * makes later confirms report `stale` instead of silently resolving.
   * @param request - compare-and-set target plus the recorded reason.
   * @returns the single-item outcome and the post-commit snapshot version.
   */
  @Remote('invalidateItem')
  async invalidateItem(request: InvalidateItemRequest): Promise<InvalidateItemResponse> {
    const actor = resolveActor(request.actor)
    const reason = resolveText(request.reason, 'reason')
    const revision = resolveRevision(request.expectedEntityRevision, 'expectedEntityRevision')
    const settled = await this.ctx.attention.invalidateItem(
      String(request.itemId),
      revision,
      reason,
      actor,
      randomUUID(),
    )
    const changed: ChangedRow[] = []
    if (settled.outcome === 'invalidated' && settled.currentRevision !== undefined) {
      changed.push({ itemId: WorkbenchItemIdValue(String(request.itemId)), status: 'invalidated', entityRevision: settled.currentRevision })
    }
    return {
      snapshotVersion: this.commit(changed),
      outcome: settled.outcome,
      ...(settled.currentRevision === undefined ? {} : { currentRevision: settled.currentRevision }),
    }
  }

  /**
   * Resolve the snapshot version from the journal checkpoint and push the
   * change set when it is non-empty. Synchronous listener failures are
   * contained and logged so a committed change never looks failed.
   */
  private commit(changed: readonly ChangedRow[]): number {
    const snapshotVersion = this.ctx.workbenchJournal.checkpoint().journalSeq
    if (changed.length === 0) return snapshotVersion
    const update: WorkbenchAttentionUpdate = { snapshotVersion, changed }
    for (const listener of this.ctx.events.dispatch('emit', ['workbench/attention-updated', update])) {
      try {
        listener(update)
      } catch (error) {
        this.ctx.logger.warn('workbench-host: an attention-updated listener failed: %s', error)
      }
    }
    return snapshotVersion
  }
}

export default WorkbenchHostService
