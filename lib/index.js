import { createHash, randomUUID } from "node:crypto";
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { Service } from "@deepseek-ai/cordis";
import { z } from "zod";
import { defineDomain, domainTable } from "@deepseek-ai/dsh-storage-domain";
//#region lib/types/recipe/runtime.js
/** Runtime constructors for the recipe domain. */
/**
* Brand a string as a recipe id.
* @param id - raw recipe identifier.
* @returns the same string with the compile-time brand.
*/
function RecipeId(id) {
	return id;
}
//#endregion
//#region lib/types/recipe/empty-template.js
/**
* The built-in M1 empty-template revision: one phase, an explicit
* PhaseSubmission, and a minimal deliverable, per the task-flow overall
* design. New tasks pin this revision until a filesystem provider registers
* real recipes.
*/
/** Built-in recipe id the empty template registers under. */
const EMPTY_TEMPLATE_RECIPE_ID = "empty-template";
/** The built-in empty-template payload; see the module contract. */
const EMPTY_TEMPLATE = {
	phases: [{
		phaseId: "main",
		kind: "default",
		goal: "Execute the task and submit the phase output.",
		inputs: [],
		outputs: ["main deliverable"],
		submissionCriteria: ["one explicit PhaseSubmission listing the required deliverable output"]
	}],
	gateChecks: [{
		checkId: "main-submission-complete",
		phaseId: "main",
		kind: "A",
		machineScope: ["the accepted submission lists every declared phase output"],
		humanAction: []
	}],
	defaults: {
		batchConfirm: "per-phase-single",
		clarify: {
			maxRounds: 2,
			splitMustDefault: true
		},
		draftPolicy: "block-finalize-not-draft"
	},
	p4Mode: { mode: "auto" }
};
//#endregion
//#region lib/types/recipe/seed-templates.js
/**
* Built-in validation-scenario templates: a small seed set of processing
* templates registered alongside the empty template so the workbench starts
* with real, pickable scenarios (需求研发 / 代码审查 / Bug 修复). Each pairs
* multi-phase steps with representative A/B/C gate checks.
*/
/** 需求研发: collect -> analyze -> PRD, A/B/C gates. */
const REQUIREMENT_RECIPE_ID = "requirement";
const REQUIREMENT_TEMPLATE = {
	phases: [
		{
			phaseId: "collect",
			kind: "default",
			goal: "收集并整理原始需求与上下文材料。",
			inputs: [],
			outputs: ["需求材料清单"],
			submissionCriteria: ["材料清单列明来源与缺失项"]
		},
		{
			phaseId: "analyze",
			kind: "default",
			goal: "分析影响面、约束与验收口径。",
			inputs: ["需求材料清单"],
			outputs: ["分析结论"],
			submissionCriteria: ["影响面与约束成文"]
		},
		{
			phaseId: "write-prd",
			kind: "default",
			goal: "产出 PRD 草稿。",
			inputs: ["分析结论"],
			outputs: ["PRD"],
			submissionCriteria: ["PRD 覆盖功能/验收/非功能"]
		}
	],
	gateChecks: [
		{
			checkId: "material-complete",
			phaseId: "collect",
			kind: "A",
			machineScope: ["材料清单包含必须字段"],
			humanAction: []
		},
		{
			checkId: "scope-ok",
			phaseId: "analyze",
			kind: "B",
			machineScope: ["影响面枚举完整"],
			humanAction: ["人工确认影响面可信"]
		},
		{
			checkId: "prd-review",
			phaseId: "write-prd",
			kind: "C",
			machineScope: ["PRD 章节齐全"],
			humanAction: ["人工仲裁 PRD 是否达标"]
		}
	],
	defaults: {
		batchConfirm: "per-check",
		clarify: {
			maxRounds: 3,
			splitMustDefault: true
		},
		draftPolicy: "block-finalize-not-draft"
	},
	p4Mode: { mode: "auto" }
};
/** 代码审查: triage -> review -> report, A/B/C gates. */
const CODE_REVIEW_RECIPE_ID = "code-review";
const CODE_REVIEW_TEMPLATE = {
	phases: [
		{
			phaseId: "triage",
			kind: "default",
			goal: "按严重度与影响面分类待审变更。",
			inputs: [],
			outputs: ["审查分级表"],
			submissionCriteria: ["变更按严重度归类"]
		},
		{
			phaseId: "review",
			kind: "default",
			goal: "逐项审查并与基线比对。",
			inputs: ["审查分级表"],
			outputs: ["审查意见"],
			submissionCriteria: ["意见关联到具体证据"]
		},
		{
			phaseId: "report",
			kind: "default",
			goal: "汇总为审查报告与结论。",
			inputs: ["审查意见"],
			outputs: ["审查报告"],
			submissionCriteria: ["报告含通过/驳回结论"]
		}
	],
	gateChecks: [
		{
			checkId: "triage-complete",
			phaseId: "triage",
			kind: "A",
			machineScope: ["分级表完整且无重名"],
			humanAction: []
		},
		{
			checkId: "review-evidenced",
			phaseId: "review",
			kind: "B",
			machineScope: ["每条意见有证据引用"],
			humanAction: ["人工确认证据充分"]
		},
		{
			checkId: "report-accepted",
			phaseId: "report",
			kind: "C",
			machineScope: ["报告含结论"],
			humanAction: ["人工仲裁审查结论"]
		}
	],
	defaults: {
		batchConfirm: "per-check",
		clarify: {
			maxRounds: 2,
			splitMustDefault: true
		},
		draftPolicy: "block-finalize-not-draft"
	},
	p4Mode: { mode: "auto" }
};
/** Bug 修复: reproduce -> locate -> fix+verify, A/B/C gates. */
const BUGFIX_RECIPE_ID = "bugfix";
const BUGFIX_TEMPLATE = {
	phases: [
		{
			phaseId: "reproduce",
			kind: "default",
			goal: "稳定复现缺陷并记录现场。",
			inputs: [],
			outputs: ["复现步骤"],
			submissionCriteria: ["步骤可稳定复现"]
		},
		{
			phaseId: "locate",
			kind: "default",
			goal: "定位根因与触发条件。",
			inputs: ["复现步骤"],
			outputs: ["根因定位"],
			submissionCriteria: ["根因与触发条件成文"]
		},
		{
			phaseId: "fix",
			kind: "default",
			goal: "修复并验证回归。",
			inputs: ["根因定位"],
			outputs: ["补丁与回归结论"],
			submissionCriteria: ["补丁通过回归"]
		}
	],
	gateChecks: [
		{
			checkId: "repro-stable",
			phaseId: "reproduce",
			kind: "A",
			machineScope: ["复现步骤可执行"],
			humanAction: []
		},
		{
			checkId: "root-cause",
			phaseId: "locate",
			kind: "B",
			machineScope: ["根因描述完整"],
			humanAction: ["人工确认根因成立"]
		},
		{
			checkId: "fix-verified",
			phaseId: "fix",
			kind: "C",
			machineScope: ["回归结果无回归"],
			humanAction: ["人工仲裁修复达标"]
		}
	],
	defaults: {
		batchConfirm: "per-check",
		clarify: {
			maxRounds: 3,
			splitMustDefault: true
		},
		draftPolicy: "block-finalize-not-draft"
	},
	p4Mode: { mode: "auto" }
};
//#endregion
//#region lib/types/recipe/types.js
/**
* Type surface of the recipe registry: identity, the revision payload
* vocabulary pinned by the task-flow M1 freeze, and the stored revision
* record.
* @module @deepseek-ai/dsh-recipe/types
*/
/** Registry failure with code, message, and optional payload problems. */
var RecipeError = class extends Error {
	/** Machine-routable failure code. */
	code;
	/** Validation problem list; present for `invalid-payload` failures. */
	problems;
	constructor(code, message, problems) {
		super(message);
		this.code = code;
		if (problems !== void 0) this.problems = problems;
		this.name = "RecipeError";
	}
};
//#endregion
//#region lib/types/recipe/index.js
/**
* Immutable recipe revision registry (`ctx.recipes`): validated payloads,
* content-addressed revisions, pinned-identity reads with hash verification,
* and the built-in empty-template revision for new tasks. Storage is
* in-memory in M1 — the filesystem provider registers real recipes later,
* and the registry surface does not change.
* @module @deepseek-ai/dsh-recipe
*/
var __runInitializers$2 = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate$2 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
	function accept(f) {
		if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
		return f;
	}
	var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
	var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
	var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
	var _, done = false;
	for (var i = decorators.length - 1; i >= 0; i--) {
		var context = {};
		for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
		for (var p in contextIn.access) context.access[p] = contextIn.access[p];
		context.addInitializer = function(f) {
			if (done) throw new TypeError("Cannot add initializers after decoration has completed");
			extraInitializers.push(accept(f || null));
		};
		var result = (0, decorators[i])(kind === "accessor" ? {
			get: descriptor.get,
			set: descriptor.set
		} : descriptor[key], context);
		if (kind === "accessor") {
			if (result === void 0) continue;
			if (result === null || typeof result !== "object") throw new TypeError("Object expected");
			if (_ = accept(result.get)) descriptor.get = _;
			if (_ = accept(result.set)) descriptor.set = _;
			if (_ = accept(result.init)) initializers.unshift(_);
		} else if (_ = accept(result)) {
			if (kind === "field") initializers.unshift(_);
			else descriptor[key] = _;
		}
	}
	if (target) Object.defineProperty(target, contextIn.name, descriptor);
	done = true;
};
/**
* Registry-level validation of one revision payload.
* @param payload - the candidate revision payload.
* @returns problem descriptions; empty when the payload is valid.
*/
function validateRecipePayload(payload) {
	const problems = [];
	if (payload.phases.length === 0) problems.push("payload requires at least one phase");
	const phaseIds = /* @__PURE__ */ new Set();
	for (const phase of payload.phases) {
		if (phaseIds.has(phase.phaseId)) problems.push(`duplicate phaseId "${phase.phaseId}"`);
		phaseIds.add(phase.phaseId);
		if (typeof phase.kind !== "string" || phase.kind.trim() === "") problems.push(`phase "${phase.phaseId}" requires a non-blank kind`);
	}
	const checkIds = /* @__PURE__ */ new Set();
	for (const check of payload.gateChecks) {
		if (checkIds.has(check.checkId)) problems.push(`duplicate checkId "${check.checkId}"`);
		checkIds.add(check.checkId);
		if (!phaseIds.has(check.phaseId)) problems.push(`check "${check.checkId}" names unknown phaseId "${check.phaseId}"`);
	}
	problems.push(...validateBreakers(payload));
	problems.push(...validateDefaults(payload.defaults));
	return problems;
}
/** Breaker-shape validation: every declared fuse key is explicit, unique, and referenced. */
function validateBreakers(payload) {
	const problems = [];
	const breakerKeys = /* @__PURE__ */ new Set();
	const checkBreakerRefs = /* @__PURE__ */ new Set();
	for (const breaker of payload.breakers ?? []) {
		if (typeof breaker.key !== "string" || breaker.key.trim() === "") {
			problems.push("breaker key must be a non-blank string");
			continue;
		}
		if (breakerKeys.has(breaker.key)) problems.push(`duplicate breaker key "${breaker.key}"`);
		breakerKeys.add(breaker.key);
		if (!Number.isSafeInteger(breaker.maxConsecutiveRepairs) || breaker.maxConsecutiveRepairs < 1) problems.push(`breaker "${breaker.key}" maxConsecutiveRepairs must be a positive safe integer`);
	}
	for (const check of payload.gateChecks) if (check.circuitBreaker !== void 0) checkBreakerRefs.add(check.circuitBreaker);
	for (const key of breakerKeys) if (!checkBreakerRefs.has(key)) problems.push(`breaker key "${key}" names no check circuitBreaker`);
	return problems;
}
/** Wire-valid batch-confirm strategies. */
const BATCH_CONFIRM_VALUES = ["per-phase-single", "per-check"];
/** Wire-valid draft policies; the frozen recipe pins one. */
const DRAFT_POLICY_VALUES = ["block-finalize-not-draft"];
/** Defaults-shape validation. */
function validateDefaults(defaults) {
	const problems = [];
	if (defaults === void 0) {
		problems.push("payload requires defaults");
		return problems;
	}
	if (!BATCH_CONFIRM_VALUES.includes(defaults.batchConfirm)) problems.push("defaults.batchConfirm must be per-phase-single or per-check");
	if (!Number.isSafeInteger(defaults.clarify.maxRounds) || defaults.clarify.maxRounds < 1) problems.push("defaults.clarify.maxRounds must be a positive safe integer");
	if (typeof defaults.clarify.splitMustDefault !== "boolean") problems.push("defaults.clarify.splitMustDefault must be boolean");
	if (!DRAFT_POLICY_VALUES.includes(defaults.draftPolicy)) problems.push("defaults.draftPolicy must be block-finalize-not-draft");
	return problems;
}
/**
* Content hash of one revision payload, stable over JSON key order.
* @param payload - the canonical revision payload.
* @returns the lowercase hex sha256 digest.
*/
function hashRecipePayload(payload) {
	return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}
/**
* Fail loud when a stored revision's hash no longer matches its payload.
* Pure and exported so both `getPinned` and the unit suite exercise the
* corruption path directly.
* @param revision - the stored revision under verification.
*/
function verifyRecipeHash(revision) {
	if (revision.contentHash !== hashRecipePayload(revision.payload)) throw new RecipeError("hash-mismatch", `recipe "${revision.recipeId}" revision ${revision.revision} failed its content-hash check`);
}
/** Immutable recipe revision registry. */
let RecipeRegistry = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _register_decorators;
	let _getPinned_decorators;
	let _latest_decorators;
	let _list_decorators;
	let _listDetails_decorators;
	return class RecipeRegistry extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_register_decorators = [Remote("register")];
			_getPinned_decorators = [Remote("getPinned")];
			_latest_decorators = [Remote("latest")];
			_list_decorators = [Remote("list")];
			_listDetails_decorators = [Remote("listDetails")];
			__esDecorate$2(this, null, _register_decorators, {
				kind: "method",
				name: "register",
				static: false,
				private: false,
				access: {
					has: (obj) => "register" in obj,
					get: (obj) => obj.register
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$2(this, null, _getPinned_decorators, {
				kind: "method",
				name: "getPinned",
				static: false,
				private: false,
				access: {
					has: (obj) => "getPinned" in obj,
					get: (obj) => obj.getPinned
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$2(this, null, _latest_decorators, {
				kind: "method",
				name: "latest",
				static: false,
				private: false,
				access: {
					has: (obj) => "latest" in obj,
					get: (obj) => obj.latest
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$2(this, null, _list_decorators, {
				kind: "method",
				name: "list",
				static: false,
				private: false,
				access: {
					has: (obj) => "list" in obj,
					get: (obj) => obj.list
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$2(this, null, _listDetails_decorators, {
				kind: "method",
				name: "listDetails",
				static: false,
				private: false,
				access: {
					has: (obj) => "listDetails" in obj,
					get: (obj) => obj.listDetails
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			if (_metadata) Object.defineProperty(this, Symbol.metadata, {
				enumerable: true,
				configurable: true,
				writable: true,
				value: _metadata
			});
		}
		revisions = (__runInitializers$2(this, _instanceExtraInitializers), /* @__PURE__ */ new Map());
		constructor(ctx) {
			super(ctx, "recipes");
			this.register(EMPTY_TEMPLATE_RECIPE_ID, 1, EMPTY_TEMPLATE);
			this.register(REQUIREMENT_RECIPE_ID, 1, REQUIREMENT_TEMPLATE);
			this.register(CODE_REVIEW_RECIPE_ID, 1, CODE_REVIEW_TEMPLATE);
			this.register(BUGFIX_RECIPE_ID, 1, BUGFIX_TEMPLATE);
		}
		/**
		* Register one immutable revision; the same payload under the same identity
		* is idempotent, a different payload under a taken identity fails. The id is
		* trimmed to its canonical form before keying, so padded spellings of one id
		* address the same revision.
		* @param recipeId - recipe identifier; surrounding whitespace is trimmed.
		* @param revision - positive revision number.
		* @param payload - canonical revision payload.
		* @returns the stored revision.
		*/
		register(recipeId, revision, payload) {
			const canonical = recipeId.trim();
			if (canonical.length === 0) throw new RecipeError("invalid-payload", "recipeId must be a non-empty string");
			if (!Number.isSafeInteger(revision) || revision < 1) throw new RecipeError("invalid-payload", "revision must be a positive safe integer");
			const problems = validateRecipePayload(payload);
			if (problems.length > 0) throw new RecipeError("invalid-payload", `recipe "${canonical}" payload has ${problems.length} problem(s)`, problems);
			const contentHash = hashRecipePayload(payload);
			const key = `${canonical}#${revision}`;
			const existing = this.revisions.get(key);
			if (existing !== void 0) {
				if (existing.contentHash === contentHash) return existing;
				throw new RecipeError("duplicate-revision", `recipe "${recipeId}" revision ${revision} is taken by a different payload`);
			}
			const stored = {
				recipeId: RecipeId(canonical),
				revision,
				schemaVersion: 1,
				contentHash,
				payload: structuredClone(payload),
				registeredAt: Date.now()
			};
			this.revisions.set(key, stored);
			return stored;
		}
		/**
		* Read one pinned identity, verifying the stored hash against the payload.
		* @param identity - recipe id plus exact revision; the id is trimmed to the
		* canonical form before keying, matching `register`.
		* @returns the stored revision.
		*/
		getPinned(identity) {
			const stored = this.revisions.get(`${identity.recipeId.trim()}#${identity.revision}`);
			if (stored === void 0) throw new RecipeError("not-found", `recipe "${identity.recipeId}" revision ${identity.revision} is not registered`);
			verifyRecipeHash(stored);
			return stored;
		}
		/**
		* Highest registered revision of one recipe; new-task creation only.
		* @param recipeId - recipe identifier; surrounding whitespace is trimmed.
		* @returns the latest revision, or `undefined` when the recipe is unknown.
		*/
		latest(recipeId) {
			const canonical = recipeId.trim();
			let latest;
			for (const stored of this.revisions.values()) {
				if (stored.recipeId !== canonical) continue;
				if (latest === void 0 || stored.revision > latest.revision) latest = stored;
			}
			return latest;
		}
		/**
		* Every registered identity, for registry inspection.
		* @returns identity list ordered by registration.
		*/
		list() {
			return [...this.revisions.values()].map(({ recipeId, revision }) => ({
				recipeId,
				revision
			}));
		}
		/**
		* Every recipe's latest revision with its full payload, for the task-creation
		* wizard's linked phase preview. One read per recipe, newest revision wins.
		* @returns latest revisions ordered by registration.
		*/
		listDetails() {
			const latest = /* @__PURE__ */ new Map();
			for (const stored of this.revisions.values()) {
				const known = latest.get(stored.recipeId);
				if (known === void 0 || stored.revision > known.revision) latest.set(stored.recipeId, stored);
			}
			return [...latest.values()];
		}
	};
})();
//#endregion
//#region lib/types/task/runtime.js
/** Runtime constructors for the task-flow task domain. */
/**
* Brand a string as a task id.
* @param id - raw task identifier.
* @returns the same string with the compile-time brand.
*/
function TaskId(id) {
	return id;
}
/**
* Brand a string as a task-run id.
* @param id - raw run identifier.
* @returns the same string with the compile-time brand.
*/
function TaskRunId(id) {
	return id;
}
/**
* Brand a string as a phase-run id.
* @param id - raw phase-run identifier.
* @returns the same string with the compile-time brand.
*/
function PhaseRunId(id) {
	return id;
}
/**
* Brand a string as a submission id.
* @param id - raw submission identifier.
* @returns the same string with the compile-time brand.
*/
function SubmissionId(id) {
	return id;
}
/**
* Brand a string as a deliverable id.
* @param id - raw deliverable identifier.
* @returns the same string with the compile-time brand.
*/
function DeliverableId(id) {
	return id;
}
/**
* Brand a string as a deliverable-version id.
* @param id - raw version identifier.
* @returns the same string with the compile-time brand.
*/
function DeliverableVersionId(id) {
	return id;
}
//#endregion
//#region lib/types/task/submission.js
/**
* Pure PhaseSubmission acceptance per the phase-submission protocol. The
* caller supplies every external fact (recipe hash, session watermark,
* deliverable currency) so this module stays free of services.
* @module @deepseek-ai/dsh-task/src/submission
*/
/**
* Judge one submission against the protocol's acceptance rules.
* @param facts - the submission plus every external fact it needs.
* @returns the verdict; `idempotentReturn` replaces storing anything new.
*/
function acceptSubmission(facts) {
	const { submission, task, run, phaseRun, existingByIdempotency } = facts;
	if (existingByIdempotency !== void 0) {
		if (JSON.stringify(existingByIdempotency) === JSON.stringify(submission)) return {
			ok: true,
			problems: [],
			idempotentReturn: existingByIdempotency
		};
		return {
			ok: false,
			problems: ["idempotency key reused with a different payload"]
		};
	}
	const problems = [];
	if (submission.taskId !== task.taskId) problems.push("submission names a different task");
	if (task.currentRunId !== run.runId) problems.push("the run is not the task current run");
	if (submission.taskRunId !== run.runId) problems.push("submission names a different run");
	if (submission.phaseRunId !== phaseRun.phaseRunId) problems.push("submission names a different phase run");
	if (phaseRun.runId !== run.runId) problems.push("the phase run belongs to a different run");
	if (submission.phaseId !== phaseRun.phaseId) problems.push("submission phase id differs from the phase run");
	if (task.state !== "running" && task.state !== "pausing") problems.push("the task is not running or pausing");
	if (phaseRun.state !== "running") problems.push("the phase run is not running");
	const pinned = submission.pinnedRecipe;
	const taskPinned = task.pinnedRecipe;
	if (pinned.recipeId !== taskPinned.recipeId || pinned.revision !== taskPinned.revision || pinned.schemaVersion !== taskPinned.schemaVersion || pinned.contentHash !== taskPinned.contentHash) problems.push("submission recipe identity differs from the pinned recipe");
	if (pinned.contentHash !== facts.registeredHash) problems.push("submission recipe hash differs from the registered revision");
	if (!facts.sourceSeqPersisted) problems.push("the source session sequence range is not persisted");
	if (!facts.inputsCurrent) problems.push("an input deliverable version is no longer current");
	if (!facts.outputsValid) problems.push("an output deliverable version is missing or not from this submission");
	if (submission.result === "failed" && (submission.failureReason ?? "").trim().length === 0) problems.push("a failed submission requires a presentable failure reason");
	return {
		ok: problems.length === 0,
		problems
	};
}
//#endregion
//#region lib/types/task/state.js
/**
* Pure task and phase-run transition tables. The task package owns these
* transitions; providers persist, they never widen them. States no shipped
* command enters stay declared in the vocabulary.
* @module @deepseek-ai/dsh-task/src/state
*/
/** Allowed source states per task command. */
const TASK_SOURCES = {
	start: ["planning"],
	pause: [
		"running",
		"awaiting-input",
		"awaiting-decision"
	],
	settlePause: ["pausing"],
	resume: ["paused"],
	cancel: [
		"planning",
		"running",
		"awaiting-input",
		"awaiting-decision",
		"pausing",
		"paused"
	],
	settleCancel: ["cancelling"],
	complete: ["running"],
	fail: ["running"],
	awaitDecision: ["running"],
	resumeFromDecision: ["awaiting-decision"]
};
/** Destination state per task command. */
const TASK_NEXT = {
	start: "running",
	pause: "pausing",
	settlePause: "paused",
	resume: "running",
	cancel: "cancelling",
	settleCancel: "cancelled",
	complete: "completed",
	fail: "failed",
	awaitDecision: "awaiting-decision",
	resumeFromDecision: "running"
};
/**
* Resolve one task command against the current state.
* @param state - the task's current state.
* @param command - the requested command.
* @returns the destination state, or `null` when the transition is invalid.
*/
function taskTransition(state, command) {
	if (TASK_SOURCES[command].includes(state)) return TASK_NEXT[command];
	return null;
}
/**
* M1 completion guard: the task runs and every phase run of the current run
* passed. Retired runs do not block completion: an impact-staled run is a
* terminal old run the engine already replaced with a fresh passed run, and
* a superseded run is the branch a rewind retired (M5). Open decisions,
* unsigned B items, and stale deliverables enter through the registered
* completion guards (M5), which `completeTask` consults after this check.
* @param state - the task's current state.
* @param phaseStates - every phase-run state of the current run.
* @returns whether the task may complete.
*/
function canCompleteTask(state, phaseStates) {
	return state === "running" && phaseStates.length > 0 && phaseStates.every((phase) => phase === "passed" || phase === "stale" || phase === "superseded");
}
/** Allowed source states per phase command. */
const PHASE_SOURCES = {
	start: ["created", "scheduled"],
	acceptSubmission: ["running"],
	startGate: ["submitted"],
	pass: ["gate-running"],
	fail: ["gate-running"],
	cancel: [
		"created",
		"scheduled",
		"running",
		"submitting",
		"submitted",
		"gate-running"
	],
	stale: [
		"created",
		"scheduled",
		"submitted",
		"gate-running",
		"awaiting-input",
		"awaiting-decision",
		"patching",
		"passed"
	],
	supersede: [
		"created",
		"scheduled",
		"running",
		"submitting",
		"submitted",
		"gate-running",
		"awaiting-input",
		"awaiting-decision",
		"patching",
		"passed",
		"stale"
	],
	awaitInput: ["gate-running"],
	awaitDecision: ["gate-running"],
	resumeFromAwaiting: ["awaiting-input", "awaiting-decision"]
};
/** Destination state per phase command. */
const PHASE_NEXT = {
	start: "running",
	acceptSubmission: "submitted",
	startGate: "gate-running",
	pass: "passed",
	fail: "failed",
	cancel: "cancelled",
	stale: "stale",
	supersede: "superseded",
	awaitInput: "awaiting-input",
	awaitDecision: "awaiting-decision",
	resumeFromAwaiting: "gate-running"
};
/**
* Resolve one phase command against the current phase-run state.
* @param state - the phase run's current state.
* @param command - the requested command.
* @returns the destination state, or `null` when the transition is invalid.
*/
function phaseTransition(state, command) {
	if (PHASE_SOURCES[command].includes(state)) return PHASE_NEXT[command];
	return null;
}
//#endregion
//#region lib/types/task/types.js
/**
* Task-flow task type surface: branded identities, pinned-recipe projections,
* the PhaseSubmission record, mutation context, gate results, failures, and
* the forwarded update events. Types only �?no runtime code.
* @module @deepseek-ai/dsh-task/types
*/
/** Task failure with code, message, and optional rejection problems. */
var TaskError = class extends Error {
	/** Machine-routable failure code. */
	code;
	/** Rejection problem list; present for `submission-rejected` failures. */
	problems;
	constructor(code, message, problems) {
		super(message);
		this.code = code;
		if (problems !== void 0) this.problems = problems;
		this.name = "TaskError";
	}
};
//#endregion
//#region lib/types/task/index.js
/**
* Task-flow task service definition (`ctx.tasks`): pinned-recipe task
* creation, the guarded state transitions this package owns, and the
* PhaseSubmission acceptance chain. Providers persist through the abstract
* storage hooks; every mutating command sequences one load, one pure
* transition, one compare-and-set save, and one contained event fan-out.
* @module @deepseek-ai/dsh-task
*/
var __runInitializers$1 = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate$1 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
	function accept(f) {
		if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
		return f;
	}
	var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
	var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
	var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
	var _, done = false;
	for (var i = decorators.length - 1; i >= 0; i--) {
		var context = {};
		for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
		for (var p in contextIn.access) context.access[p] = contextIn.access[p];
		context.addInitializer = function(f) {
			if (done) throw new TypeError("Cannot add initializers after decoration has completed");
			extraInitializers.push(accept(f || null));
		};
		var result = (0, decorators[i])(kind === "accessor" ? {
			get: descriptor.get,
			set: descriptor.set
		} : descriptor[key], context);
		if (kind === "accessor") {
			if (result === void 0) continue;
			if (result === null || typeof result !== "object") throw new TypeError("Object expected");
			if (_ = accept(result.get)) descriptor.get = _;
			if (_ = accept(result.set)) descriptor.set = _;
			if (_ = accept(result.init)) initializers.unshift(_);
		} else if (_ = accept(result)) {
			if (kind === "field") initializers.unshift(_);
			else descriptor[key] = _;
		}
	}
	if (target) Object.defineProperty(target, contextIn.name, descriptor);
	done = true;
};
/** The journal fact kind carrying a task's confirmed-creation seed (see `TaskSeedContent`). */
const TASK_SEED_FACT_KIND = "task/seed-created";
/** Extract the durable-write provenance of one mutating command. */
function provenanceOf(mutation) {
	return {
		actor: mutation.actor,
		idempotencyKey: mutation.idempotencyKey
	};
}
/** Task service: durable task/run/phase projections and guarded commands. */
let TaskHandle = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _createTask_decorators;
	let _confirmCreateTask_decorators;
	let _startTask_decorators;
	let _requestPause_decorators;
	let _settlePause_decorators;
	let _resume_decorators;
	let _requestCancel_decorators;
	let _settleCancel_decorators;
	let _failTask_decorators;
	let _completeTask_decorators;
	let _markTaskAwaitingDecision_decorators;
	let _resumeTaskFromDecision_decorators;
	let _createTaskRun_decorators;
	let _createPhaseRun_decorators;
	let _startPhaseRun_decorators;
	let _recordSubmission_decorators;
	let _requestPatch_decorators;
	let _startGate_decorators;
	let _recordGateCheck_decorators;
	let _markPhasePassed_decorators;
	let _markPhaseFailed_decorators;
	let _cancelPhaseRun_decorators;
	let _markPhaseStale_decorators;
	let _markPhaseSuperseded_decorators;
	let _markPhaseAwaitingInput_decorators;
	let _markPhaseAwaitingDecision_decorators;
	let _resumePhaseFromAwaiting_decorators;
	let _recordPhaseSession_decorators;
	let _freezePhaseScheduling_decorators;
	let _clearPhaseScheduling_decorators;
	let _markGateChecksStale_decorators;
	let _getTask_decorators;
	let _listTasks_decorators;
	let _getPhaseRun_decorators;
	let _listPhaseRuns_decorators;
	let _getSubmission_decorators;
	let _listGateResults_decorators;
	return class TaskHandle extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_createTask_decorators = [Remote("createTask")];
			_confirmCreateTask_decorators = [Remote("confirmCreateTask")];
			_startTask_decorators = [Remote("startTask")];
			_requestPause_decorators = [Remote("requestPause")];
			_settlePause_decorators = [Remote("settlePause")];
			_resume_decorators = [Remote("resume")];
			_requestCancel_decorators = [Remote("requestCancel")];
			_settleCancel_decorators = [Remote("settleCancel")];
			_failTask_decorators = [Remote("failTask")];
			_completeTask_decorators = [Remote("completeTask")];
			_markTaskAwaitingDecision_decorators = [Remote("markTaskAwaitingDecision")];
			_resumeTaskFromDecision_decorators = [Remote("resumeTaskFromDecision")];
			_createTaskRun_decorators = [Remote("createTaskRun")];
			_createPhaseRun_decorators = [Remote("createPhaseRun")];
			_startPhaseRun_decorators = [Remote("startPhaseRun")];
			_recordSubmission_decorators = [Remote("recordSubmission")];
			_requestPatch_decorators = [Remote("requestPatch")];
			_startGate_decorators = [Remote("startGate")];
			_recordGateCheck_decorators = [Remote("recordGateCheck")];
			_markPhasePassed_decorators = [Remote("markPhasePassed")];
			_markPhaseFailed_decorators = [Remote("markPhaseFailed")];
			_cancelPhaseRun_decorators = [Remote("cancelPhaseRun")];
			_markPhaseStale_decorators = [Remote("markPhaseStale")];
			_markPhaseSuperseded_decorators = [Remote("markPhaseSuperseded")];
			_markPhaseAwaitingInput_decorators = [Remote("markPhaseAwaitingInput")];
			_markPhaseAwaitingDecision_decorators = [Remote("markPhaseAwaitingDecision")];
			_resumePhaseFromAwaiting_decorators = [Remote("resumePhaseFromAwaiting")];
			_recordPhaseSession_decorators = [Remote("recordPhaseSession")];
			_freezePhaseScheduling_decorators = [Remote("freezePhaseScheduling")];
			_clearPhaseScheduling_decorators = [Remote("clearPhaseScheduling")];
			_markGateChecksStale_decorators = [Remote("markGateChecksStale")];
			_getTask_decorators = [Remote("getTask")];
			_listTasks_decorators = [Remote("listTasks")];
			_getPhaseRun_decorators = [Remote("getPhaseRun")];
			_listPhaseRuns_decorators = [Remote("listPhaseRuns")];
			_getSubmission_decorators = [Remote("getSubmission")];
			_listGateResults_decorators = [Remote("listGateResults")];
			__esDecorate$1(this, null, _createTask_decorators, {
				kind: "method",
				name: "createTask",
				static: false,
				private: false,
				access: {
					has: (obj) => "createTask" in obj,
					get: (obj) => obj.createTask
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _confirmCreateTask_decorators, {
				kind: "method",
				name: "confirmCreateTask",
				static: false,
				private: false,
				access: {
					has: (obj) => "confirmCreateTask" in obj,
					get: (obj) => obj.confirmCreateTask
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _startTask_decorators, {
				kind: "method",
				name: "startTask",
				static: false,
				private: false,
				access: {
					has: (obj) => "startTask" in obj,
					get: (obj) => obj.startTask
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _requestPause_decorators, {
				kind: "method",
				name: "requestPause",
				static: false,
				private: false,
				access: {
					has: (obj) => "requestPause" in obj,
					get: (obj) => obj.requestPause
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _settlePause_decorators, {
				kind: "method",
				name: "settlePause",
				static: false,
				private: false,
				access: {
					has: (obj) => "settlePause" in obj,
					get: (obj) => obj.settlePause
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _resume_decorators, {
				kind: "method",
				name: "resume",
				static: false,
				private: false,
				access: {
					has: (obj) => "resume" in obj,
					get: (obj) => obj.resume
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _requestCancel_decorators, {
				kind: "method",
				name: "requestCancel",
				static: false,
				private: false,
				access: {
					has: (obj) => "requestCancel" in obj,
					get: (obj) => obj.requestCancel
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _settleCancel_decorators, {
				kind: "method",
				name: "settleCancel",
				static: false,
				private: false,
				access: {
					has: (obj) => "settleCancel" in obj,
					get: (obj) => obj.settleCancel
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _failTask_decorators, {
				kind: "method",
				name: "failTask",
				static: false,
				private: false,
				access: {
					has: (obj) => "failTask" in obj,
					get: (obj) => obj.failTask
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _completeTask_decorators, {
				kind: "method",
				name: "completeTask",
				static: false,
				private: false,
				access: {
					has: (obj) => "completeTask" in obj,
					get: (obj) => obj.completeTask
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _markTaskAwaitingDecision_decorators, {
				kind: "method",
				name: "markTaskAwaitingDecision",
				static: false,
				private: false,
				access: {
					has: (obj) => "markTaskAwaitingDecision" in obj,
					get: (obj) => obj.markTaskAwaitingDecision
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _resumeTaskFromDecision_decorators, {
				kind: "method",
				name: "resumeTaskFromDecision",
				static: false,
				private: false,
				access: {
					has: (obj) => "resumeTaskFromDecision" in obj,
					get: (obj) => obj.resumeTaskFromDecision
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _createTaskRun_decorators, {
				kind: "method",
				name: "createTaskRun",
				static: false,
				private: false,
				access: {
					has: (obj) => "createTaskRun" in obj,
					get: (obj) => obj.createTaskRun
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _createPhaseRun_decorators, {
				kind: "method",
				name: "createPhaseRun",
				static: false,
				private: false,
				access: {
					has: (obj) => "createPhaseRun" in obj,
					get: (obj) => obj.createPhaseRun
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _startPhaseRun_decorators, {
				kind: "method",
				name: "startPhaseRun",
				static: false,
				private: false,
				access: {
					has: (obj) => "startPhaseRun" in obj,
					get: (obj) => obj.startPhaseRun
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _recordSubmission_decorators, {
				kind: "method",
				name: "recordSubmission",
				static: false,
				private: false,
				access: {
					has: (obj) => "recordSubmission" in obj,
					get: (obj) => obj.recordSubmission
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _requestPatch_decorators, {
				kind: "method",
				name: "requestPatch",
				static: false,
				private: false,
				access: {
					has: (obj) => "requestPatch" in obj,
					get: (obj) => obj.requestPatch
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _startGate_decorators, {
				kind: "method",
				name: "startGate",
				static: false,
				private: false,
				access: {
					has: (obj) => "startGate" in obj,
					get: (obj) => obj.startGate
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _recordGateCheck_decorators, {
				kind: "method",
				name: "recordGateCheck",
				static: false,
				private: false,
				access: {
					has: (obj) => "recordGateCheck" in obj,
					get: (obj) => obj.recordGateCheck
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _markPhasePassed_decorators, {
				kind: "method",
				name: "markPhasePassed",
				static: false,
				private: false,
				access: {
					has: (obj) => "markPhasePassed" in obj,
					get: (obj) => obj.markPhasePassed
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _markPhaseFailed_decorators, {
				kind: "method",
				name: "markPhaseFailed",
				static: false,
				private: false,
				access: {
					has: (obj) => "markPhaseFailed" in obj,
					get: (obj) => obj.markPhaseFailed
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _cancelPhaseRun_decorators, {
				kind: "method",
				name: "cancelPhaseRun",
				static: false,
				private: false,
				access: {
					has: (obj) => "cancelPhaseRun" in obj,
					get: (obj) => obj.cancelPhaseRun
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _markPhaseStale_decorators, {
				kind: "method",
				name: "markPhaseStale",
				static: false,
				private: false,
				access: {
					has: (obj) => "markPhaseStale" in obj,
					get: (obj) => obj.markPhaseStale
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _markPhaseSuperseded_decorators, {
				kind: "method",
				name: "markPhaseSuperseded",
				static: false,
				private: false,
				access: {
					has: (obj) => "markPhaseSuperseded" in obj,
					get: (obj) => obj.markPhaseSuperseded
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _markPhaseAwaitingInput_decorators, {
				kind: "method",
				name: "markPhaseAwaitingInput",
				static: false,
				private: false,
				access: {
					has: (obj) => "markPhaseAwaitingInput" in obj,
					get: (obj) => obj.markPhaseAwaitingInput
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _markPhaseAwaitingDecision_decorators, {
				kind: "method",
				name: "markPhaseAwaitingDecision",
				static: false,
				private: false,
				access: {
					has: (obj) => "markPhaseAwaitingDecision" in obj,
					get: (obj) => obj.markPhaseAwaitingDecision
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _resumePhaseFromAwaiting_decorators, {
				kind: "method",
				name: "resumePhaseFromAwaiting",
				static: false,
				private: false,
				access: {
					has: (obj) => "resumePhaseFromAwaiting" in obj,
					get: (obj) => obj.resumePhaseFromAwaiting
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _recordPhaseSession_decorators, {
				kind: "method",
				name: "recordPhaseSession",
				static: false,
				private: false,
				access: {
					has: (obj) => "recordPhaseSession" in obj,
					get: (obj) => obj.recordPhaseSession
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _freezePhaseScheduling_decorators, {
				kind: "method",
				name: "freezePhaseScheduling",
				static: false,
				private: false,
				access: {
					has: (obj) => "freezePhaseScheduling" in obj,
					get: (obj) => obj.freezePhaseScheduling
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _clearPhaseScheduling_decorators, {
				kind: "method",
				name: "clearPhaseScheduling",
				static: false,
				private: false,
				access: {
					has: (obj) => "clearPhaseScheduling" in obj,
					get: (obj) => obj.clearPhaseScheduling
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _markGateChecksStale_decorators, {
				kind: "method",
				name: "markGateChecksStale",
				static: false,
				private: false,
				access: {
					has: (obj) => "markGateChecksStale" in obj,
					get: (obj) => obj.markGateChecksStale
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _getTask_decorators, {
				kind: "method",
				name: "getTask",
				static: false,
				private: false,
				access: {
					has: (obj) => "getTask" in obj,
					get: (obj) => obj.getTask
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _listTasks_decorators, {
				kind: "method",
				name: "listTasks",
				static: false,
				private: false,
				access: {
					has: (obj) => "listTasks" in obj,
					get: (obj) => obj.listTasks
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _getPhaseRun_decorators, {
				kind: "method",
				name: "getPhaseRun",
				static: false,
				private: false,
				access: {
					has: (obj) => "getPhaseRun" in obj,
					get: (obj) => obj.getPhaseRun
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _listPhaseRuns_decorators, {
				kind: "method",
				name: "listPhaseRuns",
				static: false,
				private: false,
				access: {
					has: (obj) => "listPhaseRuns" in obj,
					get: (obj) => obj.listPhaseRuns
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _getSubmission_decorators, {
				kind: "method",
				name: "getSubmission",
				static: false,
				private: false,
				access: {
					has: (obj) => "getSubmission" in obj,
					get: (obj) => obj.getSubmission
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _listGateResults_decorators, {
				kind: "method",
				name: "listGateResults",
				static: false,
				private: false,
				access: {
					has: (obj) => "listGateResults" in obj,
					get: (obj) => obj.listGateResults
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			if (_metadata) Object.defineProperty(this, Symbol.metadata, {
				enumerable: true,
				configurable: true,
				writable: true,
				value: _metadata
			});
		}
		constructor(ctx) {
			super(ctx, "tasks");
		}
		/**
		* Derive the acceptance facts a provider owns before the verdict. The
		* default trusts the caller; providers with an injected fact source
		* (task-local derives deliverable currency) override this.
		* @param submission - the submission under acceptance.
		* @param environment - caller-supplied facts.
		* @returns the facts the acceptance verdict reads.
		*/
		resolveSubmissionEnvironment(_submission, environment) {
			return Promise.resolve(environment);
		}
		/**
		* Provider-side acceptance effects after the verdict admits a new
		* submission (phase-input registration); the default does nothing.
		* @param submission - the admitted submission, not an idempotent replay.
		*/
		async onSubmissionAccepted(_submission) {}
		/** Tail of the serial task write chain; mutating commands never interleave. */
		writeTail = (__runInitializers$1(this, _instanceExtraInitializers), Promise.resolve());
		/** Registered completion guards (M5); consulted inside the write chain. */
		completionGuards = [];
		/**
		* Register one completion guard: `completeTask` runs every registered guard
		* on the serial write chain after the state check passes; a throwing guard
		* rejects the command before any durable write. Contributors own their
		* disposal �?the returned handle removes the guard.
		* @param guard - async veto over one task about to complete.
		* @returns the disposer that unregisters the guard.
		*/
		registerCompletionGuard(guard) {
			this.completionGuards.push(guard);
			return () => {
				const at = this.completionGuards.indexOf(guard);
				if (at >= 0) this.completionGuards.splice(at, 1);
			};
		}
		/**
		* Run one whole mutating command on the serial task write chain, so load,
		* transition, save, and publish of concurrent commands never interleave.
		* @param command - the complete command body.
		* @returns the command's result.
		*/
		serialized(command) {
			const result = this.writeTail.then(command, command);
			this.writeTail = result.then(() => void 0, () => void 0);
			return result;
		}
		/**
		* Create a task pinned to the latest registered revision of one recipe.
		* @param recipeId - raw recipe identifier.
		* @param workspaceId - raw workspace identifier.
		* @param actor - creating actor, recorded with the creation.
		* @param idempotencyKey - deduplication key; a replay with the same key
		* returns the original task.
		* @returns the new task in `planning`.
		*/
		async createTask(recipeId, workspaceId, actor, idempotencyKey) {
			const recipeKey = this.resolveText(recipeId, "recipeId");
			this.resolveText(workspaceId, "workspaceId");
			const provenance = {
				actor: this.resolveText(actor, "actor"),
				idempotencyKey: this.resolveText(idempotencyKey, "idempotencyKey")
			};
			return this.serialized(() => this.createTaskNow(recipeKey, workspaceId.trim(), provenance));
		}
		/** Create one task pinned to the latest registered recipe revision; the serial write chain owns the commit. */
		async createTaskNow(recipeKey, workspaceId, provenance) {
			const existing = await this.loadTaskByIdempotencyKey(provenance.idempotencyKey);
			if (existing !== void 0) {
				if (existing.workspaceId === workspaceId && existing.pinnedRecipe.recipeId === recipeKey) return existing;
				throw new TaskError("duplicate-idempotency", "task idempotency key reused with a different payload");
			}
			const recipes = this.ctx.get("recipes");
			let latest;
			try {
				latest = recipes.latest(recipeKey);
			} catch (error) {
				if (error instanceof RecipeError && error.code === "not-found") throw new TaskError("not-found", `recipe "${recipeKey}" is not registered`);
				throw error;
			}
			if (latest === void 0) throw new TaskError("not-found", `recipe "${recipeKey}" is not registered`);
			const task = {
				taskId: TaskId(randomUUID()),
				workspaceId,
				pinnedRecipe: {
					recipeId: latest.recipeId,
					revision: latest.revision,
					schemaVersion: latest.schemaVersion,
					contentHash: latest.contentHash
				},
				state: "planning",
				revision: 1,
				idempotencyKey: provenance.idempotencyKey,
				createdAt: Date.now()
			};
			if (!await this.saveTask(task, provenance)) throw new TaskError("stale-revision", "task insert raced");
			this.emit("task/updated", task);
			return task;
		}
		/**
		* Confirm a session-initiated task creation (entry B): create the task
		* idempotently, derive the inherited discussion seed, and persist it durably so the
		* engine can append it to the first-phase session when it opens.
		* @param recipeId - the inferred recipe id.
		* @param goal - the caller's goal summary; the leading seed message.
		* @param inheritSession - whether to carry recent source-session discussion points.
		* @param idempotencyKey - the caller-safe replay key, reused from the propose step.
		* @param sourceSessionId - the original conversation read for the seed.
		* @param workspaceId - the owning workspace (entry B defaults it to 'default').
		* @param actor - the confirming actor.
		* @returns the created task and its seed summary.
		*/
		async confirmCreateTask(recipeId, goal, inheritSession, idempotencyKey, sourceSessionId, workspaceId, actor) {
			const goalText = this.resolveText(goal, "goal");
			const sourceId = this.resolveText(sourceSessionId, "sourceSessionId");
			const key = this.resolveText(idempotencyKey, "idempotencyKey");
			const actorName = this.resolveText(actor, "actor");
			const workspace = this.resolveText(workspaceId, "workspaceId");
			if (typeof inheritSession !== "boolean") throw new TaskError("invalid-argument", "inheritSession must be a boolean");
			return this.serialized(async () => {
				const prior = await this.loadTaskByIdempotencyKey(key);
				const provenance = {
					actor: actorName,
					idempotencyKey: key
				};
				const task = await this.createTaskNow(this.resolveText(recipeId, "recipeId"), workspace, provenance);
				const content = {
					goal: goalText,
					sourceSessionId: sourceId,
					points: await this.resolveSeedPoints(sourceId, inheritSession)
				};
				const points = await this.persistConfirmSeed(task, content, key, actorName);
				return {
					task,
					created: prior === void 0,
					seedPoints: points.length
				};
			});
		}
		/**
		* Provider-side derivation of the session-inherited discussion points; the default
		* carries none (no live source, or inheritance declined).
		* @param sourceSessionId - the source conversation to read.
		* @param inheritSession - whether the caller opted into session inheritance.
		* @returns the content-only seed points, newest-last.
		*/
		resolveSeedPoints(_sourceSessionId, _inheritSession) {
			return Promise.resolve([]);
		}
		/**
		* Persist the confirmed-creation seed durably and return the durable points (the
		* originally stored ones when an idempotent replay re-confirms). The default carries
		* the seed in flight only, so a journal-less provider loses it.
		* @param task - the created task.
		* @param content - the seed payload to persist.
		* @param idempotencyKey - the confirm replay key.
		* @param actor - the confirming actor.
		* @returns the durable seed points.
		*/
		persistConfirmSeed(_task, content, _idempotencyKey, _actor) {
			return Promise.resolve([...content.points]);
		}
		/**
		* Move one task from `planning` into `running`.
		* @param taskId - the task to start.
		* @param mutation - actor, reason, expected revision, idempotency key.
		* @returns the post-commit task projection.
		*/
		async startTask(taskId, mutation) {
			return this.mutateTask(TaskId(taskId), mutation, "start");
		}
		/**
		* Request a pause; the task settles once in-flight phase work quiesces.
		* @param taskId - the task to pause.
		* @param mutation - actor, reason, expected revision, idempotency key.
		* @returns the task in `pausing`.
		*/
		async requestPause(taskId, mutation) {
			return this.mutateTask(TaskId(taskId), mutation, "pause");
		}
		/**
		* Settle a completed pause into `paused`.
		* @param taskId - the task in `pausing`.
		* @param mutation - actor, reason, expected revision, idempotency key.
		* @returns the task in `paused`.
		*/
		async settlePause(taskId, mutation) {
			return this.mutateTask(TaskId(taskId), mutation, "settlePause");
		}
		/**
		* Resume one paused task back into `running`.
		* @param taskId - the task in `paused`.
		* @param mutation - actor, reason, expected revision, idempotency key.
		* @returns the task in `running`.
		*/
		async resume(taskId, mutation) {
			return this.mutateTask(TaskId(taskId), mutation, "resume");
		}
		/**
		* Request a cancel; the task settles once in-flight phase work quiesces.
		* @param taskId - the task to cancel.
		* @param mutation - actor, reason, expected revision, idempotency key.
		* @returns the task in `cancelling`.
		*/
		async requestCancel(taskId, mutation) {
			return this.mutateTask(TaskId(taskId), mutation, "cancel");
		}
		/**
		* Settle a completed cancel into `cancelled`.
		* @param taskId - the task in `cancelling`.
		* @param mutation - actor, reason, expected revision, idempotency key.
		* @returns the task in `cancelled`.
		*/
		async settleCancel(taskId, mutation) {
			return this.mutateTask(TaskId(taskId), mutation, "settleCancel");
		}
		/**
		* Fail one running task.
		* @param taskId - the task to fail.
		* @param mutation - actor, reason, expected revision, idempotency key.
		* @returns the task in `failed`.
		*/
		async failTask(taskId, mutation) {
			return this.mutateTask(TaskId(taskId), mutation, "fail");
		}
		/**
		* Complete a task; the completion guard requires every phase run of the
		* current run to have passed (or retired into stale/superseded), then every
		* registered M5 completion guard must approve �?unsigned B items, suspended
		* rewind decisions, and open blocking decisions veto here.
		* @param taskId - the task to complete.
		* @param mutation - actor, reason, expected revision, idempotency key.
		* @returns the post-commit task projection.
		*/
		async completeTask(taskId, mutation) {
			return this.mutateTask(TaskId(taskId), mutation, "complete", async (task) => {
				const phases = task.currentRunId === void 0 ? [] : await this.loadPhaseRunsOfRun(task.currentRunId);
				if (!canCompleteTask(task.state, phases.map((phase) => phase.state))) throw new TaskError("invalid-transition", "completion guard failed: every phase run of the current run must have passed");
				for (const guard of [...this.completionGuards]) await guard(task);
				return {};
			});
		}
		/**
		* Park one running task in `awaiting-decision`: the over-budget decision
		* (M5 budget) holds scheduling without touching any phase run.
		* @param taskId - the task to park.
		* @param mutation - the task's expected revision plus actor metadata.
		* @returns the post-commit task projection.
		*/
		async markTaskAwaitingDecision(taskId, mutation) {
			return this.mutateTask(TaskId(taskId), mutation, "awaitDecision");
		}
		/**
		* Return one parked task from `awaiting-decision` to `running`; the
		* resolved over-budget decision (append-budget outcome) resumes here.
		* @param taskId - the task to resume.
		* @param mutation - the task's expected revision plus actor metadata.
		* @returns the post-commit task projection.
		*/
		async resumeTaskFromDecision(taskId, mutation) {
			return this.mutateTask(TaskId(taskId), mutation, "resumeFromDecision");
		}
		/**
		* Open a new run on one task and make it the current run.
		* @param taskId - the owning task.
		* @param mutation - the task's expected revision plus actor metadata.
		* @param parentRunId - the superseded branch this run replaces (rewind);
		* omitted on the initial run.
		* @returns the new run.
		*/
		async createTaskRun(taskId, mutation, parentRunId) {
			const provenance = provenanceOf(mutation);
			return this.serialized(async () => {
				const task = await this.loadTaskOrThrow(TaskId(taskId));
				this.assertRevision(task, mutation);
				const run = {
					runId: TaskRunId(randomUUID()),
					taskId: task.taskId,
					pinnedRecipe: task.pinnedRecipe,
					revision: 1,
					createdAt: Date.now(),
					...parentRunId === void 0 ? {} : { parentRunId: TaskRunId(this.resolveText(parentRunId, "parentRunId")) }
				};
				const updatedTask = {
					...task,
					currentRunId: run.runId,
					revision: task.revision + 1
				};
				if (!await this.saveRun(run, provenance)) throw new TaskError("stale-revision", "run insert raced");
				if (!await this.saveTask(updatedTask, provenance)) throw new TaskError("stale-revision", "task revision moved concurrently");
				this.emit("task-run/updated", run);
				this.emit("task/updated", updatedTask);
				return run;
			});
		}
		/**
		* Create one phase run inside a run.
		* @param runId - the owning run.
		* @param phaseId - the recipe phase id this run executes.
		* @param mutation - the run's expected revision plus actor metadata.
		* @returns the new phase run in `created`.
		*/
		async createPhaseRun(runId, phaseId, mutation) {
			const phase = this.resolveText(phaseId, "phaseId");
			const provenance = provenanceOf(mutation);
			return this.serialized(async () => {
				const run = await this.loadRunOrThrow(TaskRunId(runId));
				this.assertRevision(run, mutation);
				const phaseRun = {
					phaseRunId: PhaseRunId(randomUUID()),
					runId: run.runId,
					taskId: run.taskId,
					phaseId: phase,
					state: "created",
					revision: 1
				};
				if (!await this.savePhaseRun(phaseRun, provenance)) throw new TaskError("stale-revision", "phase-run insert raced");
				this.emit("phase-run/updated", phaseRun);
				return phaseRun;
			});
		}
		/**
		* Move one phase run into `running`.
		* @param phaseRunId - the phase run to start.
		* @param mutation - the phase run's expected revision plus actor metadata.
		* @returns the post-commit phase-run projection.
		*/
		async startPhaseRun(phaseRunId, mutation) {
			return this.mutatePhaseRun(PhaseRunId(phaseRunId), mutation, "start");
		}
		/**
		* Accept and store one phase submission after protocol validation; the
		* accepted submission moves its phase run to `submitted`.
		* @param submission - the immutable submission record.
		* @param environment - session-watermark and deliverable-currency facts the
		* caller (the engine) computed.
		* @returns the stored submission; an idempotent replay returns the original.
		*/
		/**
		* Apply one submission's acceptance on the caller's serialized grant: the
		* journal write tail is held by the caller, so this body runs inside one
		* single serialized grant (either recordSubmission or, for a host-derived
		* revision, requestPatch).
		* @param submission - the stored submission to accept.
		* @param environment - acceptance facts resolved by the caller.
		* @returns the stored submission.
		*/
		async applySubmission(submission, environment) {
			const task = await this.loadTaskOrThrow(submission.taskId);
			const run = await this.loadRunOrThrow(submission.taskRunId);
			const phaseRun = await this.loadPhaseRunOrThrow(submission.phaseRunId);
			const recipes = this.ctx.get("recipes");
			let registeredHash;
			try {
				registeredHash = recipes.getPinned({
					recipeId: submission.pinnedRecipe.recipeId,
					revision: submission.pinnedRecipe.revision
				}).contentHash;
			} catch (error) {
				if (error instanceof RecipeError && error.code === "not-found") throw new TaskError("submission-rejected", "the pinned recipe revision is not registered");
				throw error;
			}
			const facts = await this.resolveSubmissionEnvironment(submission, environment);
			const existing = await this.loadSubmissionByIdempotencyKey(submission.idempotencyKey);
			const verdict = acceptSubmission({
				submission,
				task,
				run,
				phaseRun,
				registeredHash,
				sourceSeqPersisted: facts.sourceSeqPersisted,
				inputsCurrent: facts.inputsCurrent,
				outputsValid: facts.outputsValid,
				...existing === void 0 ? {} : { existingByIdempotency: existing }
			});
			if (!verdict.ok) throw new TaskError("submission-rejected", `submission has ${verdict.problems.length} rejection problem(s)`, verdict.problems);
			if (verdict.idempotentReturn !== void 0) return verdict.idempotentReturn;
			const next = phaseTransition(phaseRun.state, "acceptSubmission");
			if (next === null) throw new TaskError("invalid-transition", "the phase run cannot accept a submission in its current state");
			await this.onSubmissionAccepted(submission);
			const updatedPhaseRun = {
				...phaseRun,
				state: next,
				revision: phaseRun.revision + 1,
				activeSubmissionId: submission.submissionId
			};
			const provenance = {
				actor: facts.submittedBy,
				idempotencyKey: submission.idempotencyKey
			};
			await this.saveSubmission(submission, provenance);
			if (!await this.savePhaseRun(updatedPhaseRun, provenance)) throw new TaskError("stale-revision", "phase-run revision moved concurrently");
			this.emit("phase-run/updated", updatedPhaseRun);
			return submission;
		}
		async recordSubmission(submission, environment) {
			return this.serialized(() => this.applySubmission(submission, environment));
		}
		/**
		* Patch one phase's accepted submission: re-submit a superseding revision
		* that carries a human correction note. The host derives every journal field
		* from the active submission (source session/sequence, pinned recipe, input
		* and output versions) so an observer UI only supplies the correction note.
		* @param taskId - the task owning the phase run.
		* @param phaseRunId - the phase run whose active submission is patched.
		* @param note - the human-readable correction note; must not be blank.
		* @param mutation - the phase run's expected revision plus actor metadata.
		* @returns the stored patch submission (the superseding revision).
		*/
		async requestPatch(taskId, phaseRunId, note, mutation) {
			return this.serialized(async () => {
				const phaseRun = await this.loadPhaseRunOrThrow(PhaseRunId(phaseRunId));
				if (TaskId(taskId) !== phaseRun.taskId) throw new TaskError("submission-rejected", "phase run does not belong to the given task");
				if (phaseRun.activeSubmissionId === void 0) throw new TaskError("submission-rejected", "no active submission on this phase run to patch");
				const trimmed = note.trim();
				if (trimmed.length === 0) throw new TaskError("submission-rejected", "patch note must not be empty");
				const base = await this.loadSubmission(SubmissionId(phaseRun.activeSubmissionId));
				if (base === void 0) throw new TaskError("submission-rejected", "active submission is not readable");
				if (phaseRun.state !== "running" && phaseRun.state !== "awaiting-input" && phaseRun.state !== "awaiting-decision" && phaseRun.state !== "gate-running") throw new TaskError("invalid-transition", "phase run is not open for a patch");
				const patch = {
					...base,
					submissionId: SubmissionId(randomUUID()),
					attempt: base.attempt + 1,
					supersedesSubmissionId: base.submissionId,
					unresolvedIssues: [...base.unresolvedIssues, trimmed],
					idempotencyKey: "patch-" + randomUUID(),
					submittedAt: Date.now()
				};
				const nextState = phaseRun.state === "awaiting-input" || phaseRun.state === "awaiting-decision" ? "gate-running" : phaseRun.state;
				const nextPhase = {
					...phaseRun,
					state: nextState,
					revision: phaseRun.revision + 1,
					activeSubmissionId: patch.submissionId
				};
				const provenance = {
					actor: mutation.actor,
					idempotencyKey: patch.idempotencyKey
				};
				await this.saveSubmission(patch, provenance);
				if (nextState !== phaseRun.state || nextPhase.activeSubmissionId !== phaseRun.activeSubmissionId) {
					if (!await this.savePhaseRun(nextPhase, provenance)) throw new TaskError("stale-revision", "phase-run revision moved concurrently");
					this.emit("phase-run/updated", nextPhase);
				}
				return patch;
			});
		}
		/**
		* Start the gate for one accepted submission.
		* @param submissionId - the accepted submission.
		* @param mutation - the phase run's expected revision plus actor metadata.
		* @returns the post-commit phase-run projection.
		*/
		async startGate(submissionId, mutation) {
			const submission = await this.loadSubmissionOrThrow(SubmissionId(submissionId));
			return this.mutatePhaseRun(submission.phaseRunId, mutation, "startGate");
		}
		/**
		* Record one gate-check verdict for a submission.
		* @param result - the check verdict.
		* @returns the stored verdict.
		*/
		async recordGateCheck(result) {
			return this.serialized(async () => {
				await this.loadSubmissionOrThrow(result.submissionId);
				const provenance = {
					actor: "gate",
					idempotencyKey: `gate-check:${result.submissionId}:${result.checkId}:${result.recordedAt}`
				};
				await this.saveGateResult(result, provenance);
				this.emit("gate-check/recorded", result);
				return result;
			});
		}
		/**
		* Mark one phase run passed.
		* @param phaseRunId - the phase run.
		* @param mutation - the phase run's expected revision plus actor metadata.
		* @returns the post-commit phase-run projection.
		*/
		async markPhasePassed(phaseRunId, mutation) {
			return this.mutatePhaseRun(PhaseRunId(phaseRunId), mutation, "pass");
		}
		/**
		* Mark one gate-running phase run failed.
		* @param phaseRunId - the phase run.
		* @param mutation - the phase run's expected revision plus actor metadata.
		* @returns the post-commit phase-run projection.
		*/
		async markPhaseFailed(phaseRunId, mutation) {
			return this.mutatePhaseRun(PhaseRunId(phaseRunId), mutation, "fail");
		}
		/**
		* Cancel one not-yet-passed phase run.
		* @param phaseRunId - the phase run to cancel.
		* @param mutation - the phase run's expected revision plus actor metadata.
		* @returns the post-commit phase-run projection.
		*/
		async cancelPhaseRun(phaseRunId, mutation) {
			return this.mutatePhaseRun(PhaseRunId(phaseRunId), mutation, "cancel");
		}
		/**
		* Mark one phase run stale: the M2 impact command. A stale run is
		* terminal; the engine re-opens the phase as a new run. Runs in `running`
		* or `submitting` reject �?an in-flight atomic action settles per the M1
		* quiescence contract.
		* @param phaseRunId - the phase run the impact closure covers.
		* @param mutation - the phase run's expected revision plus actor metadata.
		* @returns the post-commit phase-run projection.
		*/
		async markPhaseStale(phaseRunId, mutation) {
			return this.mutatePhaseRun(PhaseRunId(phaseRunId), mutation, "stale");
		}
		/**
		* Retire one phase run into `superseded`: the M5 rewind command. A
		* superseded run is terminal and never blocks completion; unlike `stale`
		* (invalidated inputs), superseded means the whole branch lost to a newer
		* run, so in-flight states retire too �?the rewind decision already
		* committed to abandoning the branch.
		* @param phaseRunId - the phase run the rewind retires.
		* @param mutation - the phase run's expected revision plus actor metadata.
		* @returns the post-commit phase-run projection.
		*/
		async markPhaseSuperseded(phaseRunId, mutation) {
			return this.mutatePhaseRun(PhaseRunId(phaseRunId), mutation, "supersede");
		}
		/**
		* Park one gate-running phase run in `awaiting-input`: the M3 clarification
		* state. The clarification service resolves the inputs and resumes the run.
		* @param phaseRunId - the phase run awaiting clarification input.
		* @param mutation - the phase run's expected revision plus actor metadata.
		* @returns the post-commit phase-run projection.
		*/
		async markPhaseAwaitingInput(phaseRunId, mutation) {
			return this.mutatePhaseRun(PhaseRunId(phaseRunId), mutation, "awaitInput");
		}
		/**
		* Park one gate-running phase run in `awaiting-decision`: the M3 complex-gate
		* state for B/C checks. The attention service decides and resumes the run.
		* @param phaseRunId - the phase run awaiting a B/C decision.
		* @param mutation - the phase run's expected revision plus actor metadata.
		* @returns the post-commit phase-run projection.
		*/
		async markPhaseAwaitingDecision(phaseRunId, mutation) {
			return this.mutatePhaseRun(PhaseRunId(phaseRunId), mutation, "awaitDecision");
		}
		/**
		* Return a parked phase run from `awaiting-input` or `awaiting-decision` to
		* `gate-running`, so the engine re-runs the gate. Clarification completion
		* and attention decisions resume through this command.
		* @param phaseRunId - the parked phase run.
		* @param mutation - the phase run's expected revision plus actor metadata.
		* @returns the post-commit phase-run projection.
		*/
		async resumePhaseFromAwaiting(phaseRunId, mutation) {
			return this.mutatePhaseRun(PhaseRunId(phaseRunId), mutation, "resumeFromAwaiting");
		}
		/**
		* Record the phase-session id the engine opened for this run. Idempotent:
		* the same id returns the stored record without a write; a changed id (a
		* retry opening a new session) updates the binding. The M3 clarification
		* service reads this id to inject answered clarification payloads.
		* @param phaseRunId - the phase run whose session id to record.
		* @param sessionId - the phase-session id.
		* @param mutation - the phase run's expected revision plus actor metadata.
		* @returns the post-commit phase-run projection.
		*/
		async recordPhaseSession(phaseRunId, sessionId, mutation) {
			return this.mutateSessionId(PhaseRunId(phaseRunId), this.resolveText(sessionId, "sessionId"), mutation);
		}
		/**
		* Freeze one phase run's scheduling: the engine dispatches no new work for
		* a frozen run while in-flight atomic actions still settle. The M2
		* edit-lock service sets this while a lease covers a version the run's
		* registered inputs consume.
		* @param phaseRunId - the phase run to freeze.
		* @param mutation - the phase run's expected revision plus actor metadata.
		* @returns the post-commit phase-run projection with the flag set.
		*/
		async freezePhaseScheduling(phaseRunId, mutation) {
			return this.mutateSchedulingFlag(PhaseRunId(phaseRunId), mutation, true);
		}
		/**
		* Clear one phase run's scheduling freeze; the engine wakes on the
		* committed change and resumes dispatching.
		* @param phaseRunId - the frozen phase run.
		* @param mutation - the phase run's expected revision plus actor metadata.
		* @returns the post-commit phase-run projection with the flag cleared.
		*/
		async clearPhaseScheduling(phaseRunId, mutation) {
			return this.mutateSchedulingFlag(PhaseRunId(phaseRunId), mutation, false);
		}
		/**
		* Annotate recorded gate-check verdicts stale: the M2 impact command for
		* verdicts the closure covers. A staled verdict supports no pass decision.
		* Idempotent: verdicts already staled are returned unchanged without a write.
		* @param submissionId - the submission whose verdicts the closure covers.
		* @param checkIds - the check ids to annotate; unknown ids are ignored.
		* @param mutation - actor, reason, idempotency key of the impact command.
		* @returns the verdicts this call staled, in storage order.
		*/
		async markGateChecksStale(submissionId, checkIds, mutation) {
			const id = SubmissionId(this.resolveText(submissionId, "submissionId"));
			const wanted = checkIds.map((check) => this.resolveText(check, "checkId"));
			return this.serialized(async () => {
				await this.loadSubmissionOrThrow(id);
				return this.staleGateChecks(id, wanted, provenanceOf(mutation));
			});
		}
		/**
		* Read one task projection.
		* @param taskId - the task to read.
		* @returns the current projection.
		*/
		async getTask(taskId) {
			return this.loadTask(TaskId(taskId));
		}
		/**
		* Every task projection, for the task board.
		* @returns tasks in insertion order.
		*/
		async listTasks() {
			return this.loadAllTasks();
		}
		/**
		* Read one phase-run projection.
		* @param phaseRunId - the phase run to read.
		* @returns the current projection.
		*/
		async getPhaseRun(phaseRunId) {
			return this.loadPhaseRun(PhaseRunId(phaseRunId));
		}
		/**
		* Every phase-run projection of one run, for the engine and the task board.
		* @param runId - the run whose phase runs to list.
		* @returns phase runs in insertion order.
		*/
		async listPhaseRuns(runId) {
			return this.loadPhaseRunsOfRun(TaskRunId(runId));
		}
		/**
		* Read one submission.
		* @param submissionId - the submission to read.
		* @returns the stored submission.
		*/
		async getSubmission(submissionId) {
			return this.loadSubmission(SubmissionId(submissionId));
		}
		/**
		* Every gate-check verdict recorded for one submission.
		* @param submissionId - the submission.
		* @returns verdicts in recording order.
		*/
		async listGateResults(submissionId) {
			return this.loadGateResults(SubmissionId(submissionId));
		}
		/** Load, transition under the command table, save, and publish one task. */
		mutateTask(taskId, mutation, command, extra) {
			const provenance = provenanceOf(mutation);
			return this.serialized(async () => {
				const task = await this.loadTaskOrThrow(taskId);
				this.assertRevision(task, mutation);
				const next = taskTransition(task.state, command);
				if (next === null) throw new TaskError("invalid-transition", `task in state "${task.state}" cannot ${command}`);
				const updated = {
					...task,
					state: next,
					revision: task.revision + 1,
					...await (extra?.(task) ?? Promise.resolve({}))
				};
				if (!await this.saveTask(updated, provenance)) throw new TaskError("stale-revision", "task revision moved concurrently");
				this.emit("task/updated", updated);
				return updated;
			});
		}
		mutatePhaseRun(phaseRunId, mutation, command) {
			const provenance = provenanceOf(mutation);
			return this.serialized(async () => {
				const phaseRun = await this.loadPhaseRunOrThrow(phaseRunId);
				this.assertRevision(phaseRun, mutation);
				const next = phaseTransition(phaseRun.state, command);
				if (next === null) throw new TaskError("invalid-transition", `phase run in state "${phaseRun.state}" cannot ${command}`);
				const updated = {
					...phaseRun,
					state: next,
					revision: phaseRun.revision + 1
				};
				if (!await this.savePhaseRun(updated, provenance)) throw new TaskError("stale-revision", "phase-run revision moved concurrently");
				this.emit("phase-run/updated", updated);
				return updated;
			});
		}
		/**
		* Load, assert revision, toggle the scheduling flag, save, and publish one
		* phase run; a no-op returning the stored record when the flag already
		* holds the requested value.
		*/
		/**
		* Load, assert revision, set the session id, save, and publish one phase
		* run; a no-op returning the stored record when the id already holds the
		* requested value.
		*/
		mutateSessionId(phaseRunId, sessionId, mutation) {
			const provenance = provenanceOf(mutation);
			return this.serialized(async () => {
				const phaseRun = await this.loadPhaseRunOrThrow(phaseRunId);
				this.assertRevision(phaseRun, mutation);
				if (phaseRun.sessionId === sessionId) return phaseRun;
				const updated = {
					...phaseRun,
					sessionId,
					revision: phaseRun.revision + 1
				};
				if (!await this.savePhaseRun(updated, provenance)) throw new TaskError("stale-revision", "phase-run revision moved concurrently");
				this.emit("phase-run/updated", updated);
				return updated;
			});
		}
		mutateSchedulingFlag(phaseRunId, mutation, frozen) {
			const provenance = provenanceOf(mutation);
			return this.serialized(async () => {
				const phaseRun = await this.loadPhaseRunOrThrow(phaseRunId);
				this.assertRevision(phaseRun, mutation);
				if (phaseRun.schedulingFrozen === frozen) return phaseRun;
				const updated = {
					...phaseRun,
					schedulingFrozen: frozen,
					revision: phaseRun.revision + 1
				};
				if (!await this.savePhaseRun(updated, provenance)) throw new TaskError("stale-revision", "phase-run revision moved concurrently");
				this.emit("phase-run/updated", updated);
				return updated;
			});
		}
		async loadTaskOrThrow(taskId) {
			const task = await this.loadTask(taskId);
			if (task === void 0) throw new TaskError("not-found", `task "${taskId}" is unknown`);
			return task;
		}
		async loadRunOrThrow(runId) {
			const run = await this.loadRun(runId);
			if (run === void 0) throw new TaskError("not-found", `task run "${runId}" is unknown`);
			return run;
		}
		async loadPhaseRunOrThrow(phaseRunId) {
			const phaseRun = await this.loadPhaseRun(phaseRunId);
			if (phaseRun === void 0) throw new TaskError("not-found", `phase run "${phaseRunId}" is unknown`);
			return phaseRun;
		}
		async loadSubmissionOrThrow(submissionId) {
			const submission = await this.loadSubmission(submissionId);
			if (submission === void 0) throw new TaskError("not-found", `submission "${submissionId}" is unknown`);
			return submission;
		}
		/** Assert the caller's expected revision matches the loaded record. */
		assertRevision(record, mutation) {
			if (!Number.isSafeInteger(mutation.expectedRevision) || mutation.expectedRevision < 1) throw new TaskError("invalid-argument", "expectedRevision must be a positive safe integer");
			if (record.revision !== mutation.expectedRevision) throw new TaskError("stale-revision", `expected revision ${mutation.expectedRevision}, stored ${record.revision}`);
		}
		resolveText(value, field) {
			if (typeof value !== "string" || value.trim().length === 0) throw new TaskError("invalid-argument", `${field} must be a non-empty string`);
			return value.trim();
		}
		/** Contained fan-out: a broken listener never hides a committed change. */
		emit(name, payload) {
			for (const listener of this.ctx.events.dispatch("emit", [name, payload])) try {
				listener(payload);
			} catch (error) {
				this.ctx.logger.warn("task: a %s listener failed: %s", name, error);
			}
		}
	};
})();
//#endregion
//#region lib/types/workbench/journal/runtime.js
/**
* Runtime values of the journal's branded identities.
* @module @deepseek-ai/dsh-workbench-journal/src/runtime
*/
/**
* Brand one wire value as a journal event id.
* @param value - Wire value from the journal boundary.
* @returns the branded event id.
*/
function JournalEventId(value) {
	return value;
}
//#endregion
//#region lib/types/workbench/journal/spec.js
/**
* The journal's storage-domain declaration: one append-only `entries` table
* keyed by zero-padded journalSeq. The head sequence is derived from the
* stored keys at open, so no separate durable counter can drift from the
* facts it counts.
* @module @deepseek-ai/dsh-workbench-journal/src/spec
*/
/** JSON value accepted as a fact payload at the durable boundary. */
const jsonValue = z.lazy(() => z.union([
	z.null(),
	z.boolean(),
	z.number(),
	z.string(),
	z.array(jsonValue),
	z.record(z.string(), jsonValue)
]));
/** Wire string branded as a task id at the durable boundary. */
const taskId = z.string().min(1).transform((value) => value);
/** Wire string branded as a journal event id at the durable boundary. */
const journalEventId = z.string().min(1).transform((value) => value);
/** Envelope schema for one stored journal fact. */
const journalFactSchema = z.object({
	journalSeq: z.number().int().min(1),
	eventId: journalEventId,
	taskId,
	kind: z.string().min(1),
	occurredAt: z.number().int().min(1),
	actor: z.string().min(1),
	causationId: journalEventId.optional(),
	correlationId: z.string().min(1).optional(),
	idempotencyKey: z.string().min(1),
	entityRevision: z.number().int().min(1),
	payload: jsonValue,
	schemaVersion: z.number().int().min(1)
});
/** Width of the zero-padded journalSeq table key; orders keys lexicographically. */
const JOURNAL_SEQ_KEY_WIDTH = 16;
/**
* Table key of one journalSeq: fixed-width zero padding keeps lexical order
* equal to numeric order across the whole sequence space.
* @param journalSeq - the fact's sequence number.
* @returns the zero-padded table key.
*/
function journalSeqKey(journalSeq) {
	return journalSeq.toString().padStart(16, "0");
}
/** The journal domain: identity, format version, and the entries table. */
const workbenchJournalDomainSpec = defineDomain({
	name: "workbench_journal",
	version: 1,
	tables: { entries: domainTable(journalFactSchema) }
});
//#endregion
//#region lib/types/workbench/journal/types.js
/**
* Workbench journal type surface: the frozen top-level fact fields, the
* append input, checkpoint and replay wire values, and failures. Per-kind
* payload schemas are owned by the entity packages that append each kind;
* this envelope validates only structure and JSON serializability. Types
* only �?no runtime code.
* @module @deepseek-ai/dsh-workbench-journal/types
*/
/** Journal failure with code and message. */
var JournalError = class extends Error {
	/** Machine-routable failure code. */
	code;
	/**
	* @param code - Machine-routable failure code.
	* @param message - Human-readable failure description.
	*/
	constructor(code, message) {
		super(message);
		this.code = code;
		this.name = "JournalError";
	}
};
//#endregion
//#region lib/types/workbench/journal/index.js
/**
* Workbench journal (`ctx.workbenchJournal`): the task-flow append-only fact
* source over one storageDomain unit. `append` assigns a gapless monotonic
* journalSeq and is the commit point of every task-flow entity mutation �? * entity projections are rebuildable from `replay`, so Cordis events stay
* droppable wake-ups. No journal-specific events exist by design.
* @module @deepseek-ai/dsh-workbench-journal
*/
var __runInitializers = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
	function accept(f) {
		if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
		return f;
	}
	var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
	var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
	var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
	var _, done = false;
	for (var i = decorators.length - 1; i >= 0; i--) {
		var context = {};
		for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
		for (var p in contextIn.access) context.access[p] = contextIn.access[p];
		context.addInitializer = function(f) {
			if (done) throw new TypeError("Cannot add initializers after decoration has completed");
			extraInitializers.push(accept(f || null));
		};
		var result = (0, decorators[i])(kind === "accessor" ? {
			get: descriptor.get,
			set: descriptor.set
		} : descriptor[key], context);
		if (kind === "accessor") {
			if (result === void 0) continue;
			if (result === null || typeof result !== "object") throw new TypeError("Object expected");
			if (_ = accept(result.get)) descriptor.get = _;
			if (_ = accept(result.set)) descriptor.set = _;
			if (_ = accept(result.init)) initializers.unshift(_);
		} else if (_ = accept(result)) {
			if (kind === "field") initializers.unshift(_);
			else descriptor[key] = _;
		}
	}
	if (target) Object.defineProperty(target, contextIn.name, descriptor);
	done = true;
};
/** Envelope schema version this service appends. */
const FACT_SCHEMA_VERSION = 1;
/** Append-only journal service; the durable truth task-flow projections rebuild from. */
let WorkbenchJournalService = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _append_decorators;
	let _checkpoint_decorators;
	let _replay_decorators;
	return class WorkbenchJournalService extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_append_decorators = [Remote("append")];
			_checkpoint_decorators = [Remote("checkpoint")];
			_replay_decorators = [Remote("replay")];
			__esDecorate(this, null, _append_decorators, {
				kind: "method",
				name: "append",
				static: false,
				private: false,
				access: {
					has: (obj) => "append" in obj,
					get: (obj) => obj.append
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _checkpoint_decorators, {
				kind: "method",
				name: "checkpoint",
				static: false,
				private: false,
				access: {
					has: (obj) => "checkpoint" in obj,
					get: (obj) => obj.checkpoint
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _replay_decorators, {
				kind: "method",
				name: "replay",
				static: false,
				private: false,
				access: {
					has: (obj) => "replay" in obj,
					get: (obj) => obj.replay
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			if (_metadata) Object.defineProperty(this, Symbol.metadata, {
				enumerable: true,
				configurable: true,
				writable: true,
				value: _metadata
			});
		}
		/** The journal opens its domain on the mounted storage-domain facility. */
		static inject = ["storageDomain"];
		entries = __runInitializers(this, _instanceExtraInitializers);
		/** Highest assigned journalSeq; derived from stored keys at open. */
		head = 0;
		/** Serializes seq allocation with the durable write; keeps appends gapless. */
		appendTail = Promise.resolve();
		/**
		* @param ctx - Host context carrying the storage-domain facility.
		*/
		constructor(ctx) {
			super(ctx, "workbenchJournal");
		}
		/** Open and own the journal domain; derive head from the stored facts. */
		async [Service.init]() {
			const domain = await this.ctx.storageDomain.open(workbenchJournalDomainSpec);
			this.ctx.effect(() => async () => {
				await domain.close();
			}, "workbench-journal.domainClose");
			const entries = domain.table("entries");
			for (const key of entries.keys()) {
				const seq = Number(key);
				if (Number.isSafeInteger(seq) && seq > this.head) this.head = seq;
			}
			this.entries = entries;
		}
		/**
		* Append one fact; the durable write is the commit point of the mutation
		* it records. A replay of the same idempotency key with identical caller
		* fields returns the stored fact; with different fields it fails loud.
		* @param fact - caller-supplied fields; the journal assigns the envelope.
		* @returns the stored fact with its assigned journalSeq and eventId.
		*/
		async append(fact) {
			const input = this.validateInput(fact);
			const existing = this.findByIdempotencyKey(input.idempotencyKey);
			if (existing !== void 0) {
				if (this.callerFieldsMatch(existing, input)) return existing;
				throw new JournalError("idempotency-conflict", `idempotency key "${input.idempotencyKey}" was already appended with different caller fields`);
			}
			const appended = this.appendTail.then(() => this.appendNow(input));
			this.appendTail = appended.then(() => void 0, () => void 0);
			return appended;
		}
		/**
		* Recovery and client-resync position: the highest assigned journalSeq.
		* @returns the checkpoint; `journalSeq` is 0 when the journal is empty.
		*/
		checkpoint() {
			return { journalSeq: this.head };
		}
		/**
		* Read every fact after one sequence position, in journal order. The
		* authoritative resynchronization path: projections and clients rebuild
		* from replay, never from events.
		* @param afterSeq - exclusive lower bound; 0 replays the whole journal.
		* @returns facts with `journalSeq > afterSeq`, ascending.
		*/
		replay(afterSeq) {
			if (!Number.isSafeInteger(afterSeq) || afterSeq < 0) throw new JournalError("invalid-argument", `afterSeq must be a non-negative safe integer, got ${String(afterSeq)}`);
			const entries = this.requireEntries();
			const facts = [];
			for (let seq = afterSeq + 1; seq <= this.head; seq += 1) {
				const fact = entries.get(journalSeqKey(seq));
				if (fact === void 0) throw new JournalError("invalid-fact", `journal has no fact ${String(seq)}: the sequence must be gapless`);
				facts.push(fact);
			}
			return facts;
		}
		/** Validate every caller-supplied field; envelope fields stay journal-assigned. */
		validateInput(fact) {
			const requireText = (value, field) => {
				if (typeof value !== "string" || value.trim().length === 0) throw new JournalError("invalid-fact", `${field} must be a non-empty string`);
				return value.trim();
			};
			if (!Number.isSafeInteger(fact.entityRevision) || fact.entityRevision < 1) throw new JournalError("invalid-fact", `entityRevision must be a positive safe integer, got ${String(fact.entityRevision)}`);
			return {
				taskId: requireText(fact.taskId, "taskId"),
				kind: requireText(fact.kind, "kind"),
				actor: requireText(fact.actor, "actor"),
				idempotencyKey: requireText(fact.idempotencyKey, "idempotencyKey"),
				entityRevision: fact.entityRevision,
				payload: fact.payload,
				...fact.causationId === void 0 ? {} : { causationId: requireText(fact.causationId, "causationId") },
				...fact.correlationId === void 0 ? {} : { correlationId: requireText(fact.correlationId, "correlationId") }
			};
		}
		/** One serialized allocation-and-write step; the durable put is the commit point. */
		async appendNow(input) {
			const entries = this.requireEntries();
			const fact = {
				journalSeq: this.head + 1,
				eventId: JournalEventId(randomUUID()),
				taskId: input.taskId,
				kind: input.kind,
				occurredAt: Date.now(),
				actor: input.actor,
				...input.causationId === void 0 ? {} : { causationId: input.causationId },
				...input.correlationId === void 0 ? {} : { correlationId: input.correlationId },
				idempotencyKey: input.idempotencyKey,
				entityRevision: input.entityRevision,
				payload: input.payload,
				schemaVersion: FACT_SCHEMA_VERSION
			};
			await entries.put(journalSeqKey(fact.journalSeq), fact);
			this.head = fact.journalSeq;
			return fact;
		}
		/** Scan for a stored fact under one idempotency key; M1 scale is a linear scan. */
		findByIdempotencyKey(key) {
			for (const fact of this.requireEntries().entries()) if (fact[1].idempotencyKey === key) return fact[1];
		}
		/** Whether a stored fact carries exactly the caller's fields. */
		callerFieldsMatch(stored, input) {
			return stored.taskId === input.taskId && stored.kind === input.kind && stored.actor === input.actor && stored.idempotencyKey === input.idempotencyKey && stored.entityRevision === input.entityRevision && JSON.stringify(stored.payload) === JSON.stringify(input.payload) && stored.causationId === input.causationId && stored.correlationId === input.correlationId;
		}
		/** The opened entries table; absent before service start or after disposal. */
		requireEntries() {
			if (this.entries === void 0) throw new JournalError("invalid-argument", "journal domain is not open");
			return this.entries;
		}
	};
})();
//#endregion
export { BUGFIX_RECIPE_ID, BUGFIX_TEMPLATE, CODE_REVIEW_RECIPE_ID, CODE_REVIEW_TEMPLATE, DeliverableId, DeliverableVersionId, EMPTY_TEMPLATE, EMPTY_TEMPLATE_RECIPE_ID, JOURNAL_SEQ_KEY_WIDTH, JournalError, JournalEventId, PhaseRunId, REQUIREMENT_RECIPE_ID, REQUIREMENT_TEMPLATE, RecipeError, RecipeId, RecipeRegistry, RecipeRegistry as default, SubmissionId, TASK_SEED_FACT_KIND, TaskError, TaskHandle, TaskId, TaskRunId, WorkbenchJournalService, acceptSubmission, canCompleteTask, hashRecipePayload, journalFactSchema, journalSeqKey, phaseTransition, taskTransition, validateRecipePayload, verifyRecipeHash, workbenchJournalDomainSpec };
