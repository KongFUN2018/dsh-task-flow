import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import InvariantRegistry from '@deepseek-ai/dsh-invariants'
import * as WorkbenchInvariant from '../src/workbench/host/invariant.ts'

describe('workbench host invariant companion', () => {
  it('reserves the package name once against the shared registry', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry)
    await ctx.plugin(WorkbenchInvariant)

    expect(() => {
      ctx.invariants.register('@deepseek-ai/dsh-workbench-host', () => {})
    }).toThrow(/already registered/)
  })
})
