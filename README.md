# `@kongfun2018/dsh-task-flow`

English | [中文](README.zh.md)

Task Flow Recipe Engine — an objective-driven, multi-phase task orchestration layer for the DeepSeek Harness (DSH), shipped as a single standalone plugin package. It upgrades a plain single-session DSH conversation into a recipe-scheduled pipeline: a task is driven through a defined sequence of phases, each dispatched to a dedicated agent session, throttled by gates with A/B/C quality levels, with rewind / budget / review-policy controls and a browser workbench to inspect and operate it.

This is a standalone repository (not part of the DeepSeek Harness monorepo). It builds, tests, and ships on its own against the published `@deepseek-ai/*` runtime packages, so both the host half and the browser half are folded into this one npm package — the direct task-flow analogue of `@deepseek-ai/dsh-llm-fallback`.

## What it does

Under the hood the package folds the whole task-flow domain model into one host subsystem plus one browser half:

- **Recipe-driven execution** — a `Task` references an immutable `RecipeRevision`; each `Recipe` declares an ordered series of `Phase`s and `Gate`s. The engine (`recipe-engine-core` + `recipe-multiphase`) schedules each phase to a dedicated agent session, drives the submit → gate → next-phase chain, and survives a restart by re-validating its journal head (a passed gate is never re-run).
- **Quality gates with A/B/C levels** — each gate runs a list of `GateCheck`s. Machine-forced checks (A) are graded by the engine; human-confirmed (B) and human-arbitrated (C) checks surface as durable attention items in the workbench inbox instead of being auto-graded. Work only advances when every check passes.
- **Persistent clarification, not ad-hoc Q&A** — durable clarification requests are created for missing must-answer conditions, and can be satisfied by injecting a user message back into the phase session.
- **rewind / budget / review-policy** — rewind previews and branches a superseded run, budget keeps a provision/append/usage ledger with 80% warning and hard-limit decision points, review-policy provides strict/balanced/trusted tiers with completion guards and breaker recovery.
- **Deliverables with versioning and impact** — immutable versioned outputs, dependency closure across consuming phases, stale propagation, and edit-lock leases.
- **Two creation entries** — a workbench "Create" wizard (entry A) and a conversation one-liner that produces a confirm card (entry B), both ending in a real `Task` seeded into an empty first-phase session.
- **Metrics and digest** — journal-derived read-only projections for the workbench dashboards.

## Setup

Requirements: Node ≥ 24 and pnpm (the `@deepseek-ai` peer tree is pnpm-friendly; `npm`'s arborist historically chokes on the mixed `rc.*` peer ranges).

```bash
pnpm install --frozen-lockfile
pnpm run build   # tsc emits lib/types/*.js + .d.ts, then tsdown bundles lib/index.js + lib/client.js
pnpm test        # vitest over the folded host + client test suites
```

Runtime peer dependencies are the published DeepSeek Harness packages (all pinned `^0.1.0-rc.6`, plus `@deepseek-ai/cordis`), which you must install alongside this package in your deployment tree.

### Host half — activate in `cordis.yml` / `cordis.patch.yml`

Add one loader entry. The root export is a single Cordis plugin (`name = 'dsh-task-flow-host'`) that registers every folded domain in the correct topological order:

```yaml
# in your DSH profile's cordis.patch.yml (or any composed cordis.yml)
- insert:
    - id: task-flow
      name: '@kongfun2018/dsh-task-flow'
```

This mounts the full host subsystem and exposes the eight browser-routable namespaces behind `ctx.remote.*`: `tasks`, `recipes`, `workbenchHost`, `workbenchHostStream`, `deliverables`, `digest`, `metrics`, `rewind`. The host needs the standard base-bundle services already present in a normal DSH web profile (`storageDomain`, `sessions`, `agents`, `goals`, `tools`).

### Browser half — automatic

The package declares a `dsh.client` browser contribution (platform `web`). Whenever the node half is loaded, the DSH web shell loads `lib/client.js` automatically and injects it into the boot manifest — no extra wiring. It mounts the eight task-flow Remote namespaces itself and activates the nine folded client feature domains.

## Web workbench (browser half)

The browser half renders the whole task-flow operating console inside the official DSH web shell, using only official seats + TS module augmentation that travels with the package:

- A right-side, non-modal **drawer** panel on the official `shell.overlay` seat — tabs for board / task list / recipe library / approvals inbox / clarifications / create / detail.
- **"Task Flow" trigger button** — registered into the official `sidebar.footer.action` seat, so it works on a stock DSH web release with no official shell changes.
- The **attention inbox** projects durable attention items (B/C gate decisions, clarifications, recovery) from `workbenchHost` + `workbenchHostStream` with conflict detection and no silent confirmation.
- **Task detail / task list / board / create wizard** against `tasks`, `recipes`, `metrics`, `digest`, `deliverables`, `rewind`.

## Remote / browser namespaces

The client half reaches the host through eight subpath-exported Remote descriptors, typed by the browser-safe `/remote/*` boundary types (no runtime import needed to read durable status):

- `./remote/task` — `ctx.remote.tasks` (task lifecycle, submissions, phase runs, gate results)
- `./remote/recipe` — `ctx.remote.recipes`
- `./remote/workbench` — `ctx.remote.workbenchHost` (snapshot, batch confirm, resolve decision)
- `./remote/workbenchHostStream` — `ctx.remote.workbenchHostStream` (journal-derived incremental projection)
- `./remote/deliverables` — `ctx.remote.deliverables`
- `./remote/digest` — `ctx.remote.digest`
- `./remote/metrics` — `ctx.remote.metrics`
- `./remote/rewind` — `ctx.remote.rewind`

## License

MIT, see [LICENSE](LICENSE). Copyright (c) 2026 KongFUN2018.

## Known Limitations and Deferred Work

- **Budget calibration is pending** — the 80% warning and hard-limit thresholds use placeholder values; official calibration needs real task samples once the M2/M3 flows have accumulated ledgers (`recordUsage` is an explicit seam, no automatic collection).
- **npm publishing is deferred** — the package is currently delivered by installing this repo directly (or via a local tarball) into the DSH profile; the `registry` publishing path and a fully "official-built-in" consumption route are follow-up goals.
