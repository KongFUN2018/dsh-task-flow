/**
 * Shared stubs for recipe-engine tests: a registering agent factory and a
 * deterministic phase outcome producer. The factory mirrors the
 * `dsh-agent` spec stub but registers each agent so goal creation and
 * `assertLive` hold. The outcome producer saves every declared phase
 * output as a deliverable version tracing to the submission, so the task
 * write chain's `outputsValid` check accepts it.
 */

import { Context } from '@deepseek-ai/cordis'
import { Inbox } from '@deepseek-ai/dsh-agent'
import type { Agent, AgentFactory } from '@deepseek-ai/dsh-agent'
import { DeliverableId } from '../../src/deliverable/index.ts'
import type { DeliverableService } from '../../src/deliverable/index.ts'
import { Session, SessionId } from '@deepseek-ai/dsh-session'
import type { PhaseAssignment, PhaseOutcome } from '../../src/recipe-engine-core/types.ts'

/** One minimal live agent over an in-memory session. */
export function stubAgent(rawId: string, overrides: Partial<Agent> = {}): Agent {
  const id = SessionId(rawId)
  const session = Session.create(id)
  const agent: Agent = {
    id,
    options: {},
    session,
    inbox: new Inbox(session, { inserted: () => {}, discarded: () => {}, claimed: () => {} }),
    status: 'idle',
    ctx: new Context(),
    send: () => {},
    followup: () => {},
    steer: () => ({ outcome: Promise.resolve({ status: 'rejected' as const }) }),
    inject: () => {},
    cancel() {},
    runMaintenance: task => task(new AbortController().signal),
    whenIdle: () => Promise.resolve(),
  }
  return Object.assign(agent, overrides)
}

/** A factory that registers every created agent, so goal mutations resolve live identity. */
export function stubAgentFactory(): AgentFactory {
  return {
    async createAgent(ownerCtx, options) {
      const agent = stubAgent(String(options.sessionId))
      const unregister = ownerCtx.agents.register(agent)
      return { agent, dispose: async () => { unregister() } }
    },
    async resume(ownerCtx, options) {
      const agent = stubAgent(String(options.resumeSessionId))
      const unregister = ownerCtx.agents.register(agent)
      return { agent, dispose: async () => { unregister() } }
    },
  }
}

/**
 * Produce a completed outcome: save every declared phase output as a
 * deliverable version tracing to the assignment's submission id.
 * @param assignment - the phase being executed.
 * @param deliverables - the deliverable service the executor closed over.
 * @returns the completed outcome the engine records on the submission.
 */
export async function completedOutcome(
  assignment: PhaseAssignment,
  deliverables: DeliverableService,
): Promise<PhaseOutcome> {
  const outputVersions = []
  for (const output of assignment.phase.outputs) {
    const version = await deliverables.saveVersion(DeliverableId(output), null, assignment.submissionId)
    outputVersions.push({ deliverableId: DeliverableId(output), versionId: version.versionId })
  }
  return {
    result: 'completed',
    inputVersions: [],
    outputVersions,
    unresolvedIssues: [],
    sourceSeqRange: { start: 1, end: 1 },
    sourceSeqPersisted: true,
  }
}
