/**
 * Unified host-half assembly plugin (`dsh-task-flow-host`): the single Cordis
 * plugin `dsh web` mounts to activate the whole folded task-flow host
 * subsystem. It registers every folded domain in the official base-bundle
 * load order (`cordis.patch.yml` works sequence) via `ctx.plugin`, so the
 * eight browser-routable namespaces that the client half reaches through
 * `ctx.remote.*` — tasks, recipes, workbenchHost, workbenchHostStream,
 * deliverables, digest, metrics, rewind — are backed by live host services
 * under this plugin's context.
 *
 * Loader form is a dead line: `dsh web` unwraps a package's main with
 * `exports.default ?? exports`, so any default export collapses the module
 * and drops the `name`/`inject`/`apply` this plugin must expose. This module
 * therefore has NO default export; it is a named `name`/`inject`/`apply`
 * function-plugin shape exactly like `tool-task-create`.
 * @module @kongfun2018/dsh-task-flow/host
 */
// Folded host domains, one default import each: the Service class (or the
// tool-task-create plugin object) each domain file exports. Importing the
// class default keeps the package-root barrel free of a default export, so
// the Loader's `exports.default ?? exports` unwrap returns this module's
// namespace and the plugin metadata survives.
import AttentionService from "./attention/index.js";
import ClarificationService from "./clarification/index.js";
import RecipeMultiphaseService from "./recipe-multiphase/index.js";
import WorkbenchHostService from "./workbench/host/index.js";
import WorkbenchHostStreamService from "./workbench/host-stream/index.js";
import RecipeRegistry from "./recipe/index.js";
import WorkbenchJournalService from "./workbench/journal/index.js";
import DeliverableService from "./deliverable/index.js";
import ImpactPropagationService from "./impact/index.js";
import EditLockService from "./edit-lock/index.js";
import RewindService from "./rewind/index.js";
import BudgetService from "./budget/index.js";
import ReviewPolicyService from "./review-policy/index.js";
import DigestService from "./digest/index.js";
import MetricsService from "./metrics/index.js";
import GateService from "./gate/index.js";
import LocalTaskService from "./task-local/index.js";
import RecipeEngineCore from "./recipe-engine-core/index.js";
import TaskPolishService from "./task-polish/index.js";
import * as taskCreate from "./tool-task-create/index.js";
/** Plugin display name: the `dsh web` fiber identity on the mounted host. */
export const name = 'dsh-task-flow-host';
/**
 * External platform services the folded domains require; the host provides
 * them (never this package). Declaring them on the outer plugin keeps it
 * PENDING until the host exposes all of them, so every `ctx.plugin(...)`
 * below resolves without a dangling service probe.
 */
export const inject = ['storageDomain', 'sessions', 'agents', 'goals', 'tools', 'llm'];
/** The 19 folded domains in official base-bundle assembly order (registration). */
const HOST_DOMAINS = [
    AttentionService,
    GateService,
    ClarificationService,
    RecipeMultiphaseService,
    WorkbenchHostService,
    WorkbenchHostStreamService,
    RecipeRegistry,
    WorkbenchJournalService,
    DeliverableService,
    ImpactPropagationService,
    EditLockService,
    RewindService,
    BudgetService,
    ReviewPolicyService,
    DigestService,
    MetricsService,
    taskCreate,
    LocalTaskService,
    RecipeEngineCore,
    TaskPolishService,
];
/**
 * Await order, indexed into {@link HOST_DOMAINS}: a topological order matching
 * each domain's `static inject` graph, so every provider is fully ACTIVE
 * before its consumer's fiber is awaited. This keeps the official base-bundle
 * sequence intact as the *registration* order while serializing startup on the
 * real dependency order — `recipe-multiphase` needs `recipeEngine`
 * (official slots 4 → 19), `metrics` needs `workbenchHost` (15 → 5), and so on.
 */
const LOAD_ORDER = [
    7, // workbench-journal (storageDomain)
    6, // recipe
    8, // deliverable (storageDomain, workbenchJournal)
    17, // task-local → tasks (storageDomain, workbenchJournal, deliverables, sessions)
    18, // recipe-engine-core → recipeEngine (tasks, recipes, agents, goals, storageDomain, workbenchJournal)
    3, // recipe-multiphase (recipeEngine)
    0, // attention (storageDomain, workbenchJournal, tasks)
    1, // gate (tasks, recipes, attention)
    2, // clarification (storageDomain, workbenchJournal, tasks, sessions, attention)
    12, // budget (storageDomain, workbenchJournal, tasks, attention)
    13, // review-policy (storageDomain, workbenchJournal, tasks, attention, recipes)
    14, // digest (tasks, workbenchJournal, deliverables)
    9, // impact (deliverables, tasks, workbenchJournal)
    10, // edit-lock (storageDomain, workbenchJournal, tasks, deliverables)
    11, // rewind (deliverables, tasks, attention, workbenchJournal)
    4, // workbench-host (attention, workbenchJournal)
    15, // metrics (tasks, workbenchHost, deliverables, workbenchJournal)
    5, // workbench-host-stream (workbenchJournal)
    16, // task-create-tool (tools, recipes)
];
/**
 * Activate the whole folded task-flow host subsystem.
 *
 * Every domain is registered with `ctx.plugin` in the official base-bundle
 * sequence, then each fiber is awaited in {@link LOAD_ORDER} so its injected
 * providers are ACTIVE first. Awaiting surfaces any startup (config or inject)
 * error; a fiber whose dependencies are not yet satisfied stays PENDING, so
 * the explicit topological await order prevents a service from appearing
 * before the domains it consumes.
 * @param ctx - host context carrying the declared external services.
 */
export async function apply(ctx) {
    const fibers = HOST_DOMAINS.map(domain => ctx.plugin(domain));
    for (const position of LOAD_ORDER) {
        const fiber = fibers[position];
        if (fiber === undefined)
            continue;
        await fiber.await();
    }
}
//# sourceMappingURL=plugin.js.map