import { createHash, randomUUID } from "node:crypto";
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { Service } from "@deepseek-ai/cordis";
import { z } from "zod";
import { defineDomain, domainTable } from "@deepseek-ai/dsh-storage-domain";
import "@deepseek-ai/dsh-agent";
import "@deepseek-ai/dsh-goal";
import { createUserMessage } from "@deepseek-ai/dsh-llm";
import { SessionId } from "@deepseek-ai/dsh-session";
import { clearInterval, setInterval } from "node:timers";
import { defineTool } from "@deepseek-ai/dsh-tools";
//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
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
var __runInitializers$14 = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate$14 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
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
			__esDecorate$14(this, null, _register_decorators, {
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
			__esDecorate$14(this, null, _getPinned_decorators, {
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
			__esDecorate$14(this, null, _latest_decorators, {
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
			__esDecorate$14(this, null, _list_decorators, {
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
			__esDecorate$14(this, null, _listDetails_decorators, {
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
		constructor(ctx) {
			super(ctx, "recipes");
			this.revisions = (__runInitializers$14(this, _instanceExtraInitializers), /* @__PURE__ */ new Map());
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
var __runInitializers$13 = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate$13 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
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
			__esDecorate$13(this, null, _createTask_decorators, {
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
			__esDecorate$13(this, null, _confirmCreateTask_decorators, {
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
			__esDecorate$13(this, null, _startTask_decorators, {
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
			__esDecorate$13(this, null, _requestPause_decorators, {
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
			__esDecorate$13(this, null, _settlePause_decorators, {
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
			__esDecorate$13(this, null, _resume_decorators, {
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
			__esDecorate$13(this, null, _requestCancel_decorators, {
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
			__esDecorate$13(this, null, _settleCancel_decorators, {
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
			__esDecorate$13(this, null, _failTask_decorators, {
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
			__esDecorate$13(this, null, _completeTask_decorators, {
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
			__esDecorate$13(this, null, _markTaskAwaitingDecision_decorators, {
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
			__esDecorate$13(this, null, _resumeTaskFromDecision_decorators, {
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
			__esDecorate$13(this, null, _createTaskRun_decorators, {
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
			__esDecorate$13(this, null, _createPhaseRun_decorators, {
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
			__esDecorate$13(this, null, _startPhaseRun_decorators, {
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
			__esDecorate$13(this, null, _recordSubmission_decorators, {
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
			__esDecorate$13(this, null, _requestPatch_decorators, {
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
			__esDecorate$13(this, null, _startGate_decorators, {
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
			__esDecorate$13(this, null, _recordGateCheck_decorators, {
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
			__esDecorate$13(this, null, _markPhasePassed_decorators, {
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
			__esDecorate$13(this, null, _markPhaseFailed_decorators, {
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
			__esDecorate$13(this, null, _cancelPhaseRun_decorators, {
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
			__esDecorate$13(this, null, _markPhaseStale_decorators, {
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
			__esDecorate$13(this, null, _markPhaseSuperseded_decorators, {
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
			__esDecorate$13(this, null, _markPhaseAwaitingInput_decorators, {
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
			__esDecorate$13(this, null, _markPhaseAwaitingDecision_decorators, {
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
			__esDecorate$13(this, null, _resumePhaseFromAwaiting_decorators, {
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
			__esDecorate$13(this, null, _recordPhaseSession_decorators, {
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
			__esDecorate$13(this, null, _freezePhaseScheduling_decorators, {
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
			__esDecorate$13(this, null, _clearPhaseScheduling_decorators, {
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
			__esDecorate$13(this, null, _markGateChecksStale_decorators, {
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
			__esDecorate$13(this, null, _getTask_decorators, {
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
			__esDecorate$13(this, null, _listTasks_decorators, {
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
			__esDecorate$13(this, null, _getPhaseRun_decorators, {
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
			__esDecorate$13(this, null, _listPhaseRuns_decorators, {
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
			__esDecorate$13(this, null, _getSubmission_decorators, {
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
			__esDecorate$13(this, null, _listGateResults_decorators, {
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
			/** Tail of the serial task write chain; mutating commands never interleave. */
			this.writeTail = (__runInitializers$13(this, _instanceExtraInitializers), Promise.resolve());
			/** Registered completion guards (M5); consulted inside the write chain. */
			this.completionGuards = [];
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
var __runInitializers$12 = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate$12 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
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
			__esDecorate$12(this, null, _append_decorators, {
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
			__esDecorate$12(this, null, _checkpoint_decorators, {
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
			__esDecorate$12(this, null, _replay_decorators, {
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
		static {
			this.inject = ["storageDomain"];
		}
		/**
		* @param ctx - Host context carrying the storage-domain facility.
		*/
		constructor(ctx) {
			super(ctx, "workbenchJournal");
			this.entries = __runInitializers$12(this, _instanceExtraInitializers);
			/** Highest assigned journalSeq; derived from stored keys at open. */
			this.head = 0;
			/** Serializes seq allocation with the durable write; keeps appends gapless. */
			this.appendTail = Promise.resolve();
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
//#region lib/types/attention/runtime.js
/** Runtime value constructors and the error class for `@deepseek-ai/dsh-attention`. @module @deepseek-ai/dsh-attention */
/**
* Brand a plain string as an attention item id.
* @param id - the plain string to brand.
* @returns the branded attention item id.
*/
function AttentionItemId(id) {
	return id;
}
/** Domain error carrying a machine-routable code. */
var AttentionError = class extends Error {
	constructor(code, message) {
		super(message);
		this.name = "AttentionError";
		this.code = code;
	}
};
//#endregion
//#region lib/types/attention/spec.js
/**
* The attention storage-domain declaration: durable items plus the
* item_keys idempotency index. The domain name and version reject earlier
* media �?pre-release stance, no migration.
* @module @deepseek-ai/dsh-attention/src/spec
*/
/** One stored attention item. */
const attentionItemSchema = z.object({
	itemId: z.string().min(1),
	taskId: z.string().min(1),
	runId: z.string().min(1).optional(),
	phaseRunId: z.string().min(1).optional(),
	submissionId: z.string().min(1).optional(),
	checkId: z.string().min(1).optional(),
	kind: z.enum([
		"b-confirm",
		"c-decision",
		"clarification",
		"recovery"
	]),
	decisionKind: z.string().min(1),
	impactSnapshot: z.string().optional(),
	options: z.array(z.string().min(1)),
	state: z.enum([
		"open",
		"resolved",
		"invalidated",
		"stale"
	]),
	entityRevision: z.number().int().min(1),
	openedAt: z.number().int().min(1),
	resolvedAt: z.number().int().min(1).optional(),
	resolvedBy: z.string().min(1).optional(),
	outcome: z.string().min(1).optional(),
	reversibleUntil: z.number().int().min(1).optional()
});
/** The create-idempotency index entry: one caller key to the item it created. */
const itemKeySchema = z.object({ itemId: z.string().min(1) });
/** The attention domain: identity, format version, and owned tables. */
const attentionDomainSpec = defineDomain({
	name: "attention",
	version: 1,
	tables: {
		items: domainTable(attentionItemSchema),
		item_keys: domainTable(itemKeySchema)
	}
});
//#endregion
//#region lib/types/attention/index.js
/**
* Attention service (`ctx.attention`): the persistent business-decision inbox.
* One durable `AttentionItem` records each gate check or independent task
* decision. Decisions use optimistic concurrency �?every command carries an
* `expectedEntityRevision` and returns a per-item outcome, so a stale,
* withdrawn, resolved, or version-conflicted item is never silently
* confirmed. A resolved/invalidated item writes its journal fact first,
* then the projection, then resumes the phase run when every item of its
* gate settled.
* @module @deepseek-ai/dsh-attention
*/
var __runInitializers$11 = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate$11 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
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
/** The actor recorded on attention facts; decisions carry their own actor. */
const FACT_ACTOR$7 = "attention";
/**
* Attention service: the M4 persistent-decision domain, with idempotent
* item creation, optimistic decision and batch-confirm commands, and
* upstream invalidation.
*/
let AttentionService = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _createItem_decorators;
	let _listOpen_decorators;
	let _getItem_decorators;
	let _resolveDecision_decorators;
	let _confirmBatch_decorators;
	let _invalidateItem_decorators;
	return class AttentionService extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_createItem_decorators = [Remote("createItem")];
			_listOpen_decorators = [Remote("listOpen")];
			_getItem_decorators = [Remote("getItem")];
			_resolveDecision_decorators = [Remote("resolveDecision")];
			_confirmBatch_decorators = [Remote("confirmBatch")];
			_invalidateItem_decorators = [Remote("invalidateItem")];
			__esDecorate$11(this, null, _createItem_decorators, {
				kind: "method",
				name: "createItem",
				static: false,
				private: false,
				access: {
					has: (obj) => "createItem" in obj,
					get: (obj) => obj.createItem
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$11(this, null, _listOpen_decorators, {
				kind: "method",
				name: "listOpen",
				static: false,
				private: false,
				access: {
					has: (obj) => "listOpen" in obj,
					get: (obj) => obj.listOpen
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$11(this, null, _getItem_decorators, {
				kind: "method",
				name: "getItem",
				static: false,
				private: false,
				access: {
					has: (obj) => "getItem" in obj,
					get: (obj) => obj.getItem
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$11(this, null, _resolveDecision_decorators, {
				kind: "method",
				name: "resolveDecision",
				static: false,
				private: false,
				access: {
					has: (obj) => "resolveDecision" in obj,
					get: (obj) => obj.resolveDecision
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$11(this, null, _confirmBatch_decorators, {
				kind: "method",
				name: "confirmBatch",
				static: false,
				private: false,
				access: {
					has: (obj) => "confirmBatch" in obj,
					get: (obj) => obj.confirmBatch
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$11(this, null, _invalidateItem_decorators, {
				kind: "method",
				name: "invalidateItem",
				static: false,
				private: false,
				access: {
					has: (obj) => "invalidateItem" in obj,
					get: (obj) => obj.invalidateItem
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
		/** The service opens its domain, appends facts, and reads/writes phase runs. */
		static {
			this.inject = [
				"storageDomain",
				"workbenchJournal",
				"tasks"
			];
		}
		/**
		* @param ctx - Host context carrying storage, journal, and task services.
		*/
		constructor(ctx) {
			super(ctx, "attention");
			this.items = __runInitializers$11(this, _instanceExtraInitializers);
			/** Serializes read-validate-write mutations so concurrent writers never interleave. */
			this.mutationTail = Promise.resolve();
		}
		/** Open and own the attention domain. */
		async [Service.init]() {
			const domain = await this.ctx.storageDomain.open(attentionDomainSpec);
			this.ctx.effect(() => async () => {
				await domain.close();
			}, "attention.domainClose");
			this.items = domain.table("items");
			this.itemKeys = domain.table("item_keys");
		}
		/**
		* Create one attention item. Idempotent: replaying a caller key returns
		* the stored item; a replay with a different itemId fails loud.
		* @param input - the item fields; `itemId` is caller-supplied and stable.
		* @param actor - the actor opening the item.
		* @param idempotencyKey - caller-owned replay key.
		* @returns the stored item.
		*/
		createItem(input, actor, idempotencyKey) {
			const actorValue = this.requireText(actor, "actor");
			const key = this.requireText(idempotencyKey, "idempotencyKey");
			const normalized = this.normalizeInput(input);
			const result = this.mutationTail.then(() => this.createItemNow(normalized, actorValue, key));
			this.mutationTail = result.then(() => void 0, () => void 0);
			return result;
		}
		/**
		* List every open item, in open order.
		* @returns the open items.
		*/
		listOpen() {
			const open = [];
			for (const [, item] of this.requireItems().entries()) if (item.state === "open") open.push(item);
			open.sort((a, b) => a.openedAt - b.openedAt);
			return open;
		}
		/**
		* Read one attention item.
		* @param itemId - the item identity.
		* @returns the item, or undefined when unknown.
		*/
		getItem(itemId) {
			const id = AttentionItemId(this.requireText(itemId, "itemId"));
			return this.requireItems().get(String(id));
		}
		/**
		* Resolve one decision item against the given option. Idempotent: a replay
		* with the same option returns `resolved`; a different option reports
		* `already-resolved`. A stale, withdrawn, or revision-conflicted item never
		* resolves silently.
		* @param itemId - the item to decide.
		* @param expectedEntityRevision - the revision this decision satisfies.
		* @param optionId - one of the item's options.
		* @param actor - the deciding actor.
		* @param idempotencyKey - caller-owned replay key.
		* @returns the outcome and the revision to retry against when present.
		*/
		resolveDecision(itemId, expectedEntityRevision, optionId, actor, idempotencyKey) {
			const id = AttentionItemId(this.requireText(itemId, "itemId"));
			const revision = this.requireRevision(expectedEntityRevision, "expectedEntityRevision");
			const option = this.requireText(optionId, "optionId");
			const actorValue = this.requireText(actor, "actor");
			const key = this.requireText(idempotencyKey, "idempotencyKey");
			const result = this.mutationTail.then(() => this.resolveNow(id, revision, option, actorValue, key));
			this.mutationTail = result.then(() => void 0, () => void 0);
			return result;
		}
		/**
		* Confirm a batch of B-class items in one pass: every still-open
		* revision-matching item resolves, and each target reports its own outcome.
		* @param targets - the compare-and-set targets.
		* @param actor - the confirming actor.
		* @param idempotencyKey - caller-owned replay key.
		* @returns per-item results, in request order.
		*/
		confirmBatch(targets, actor, idempotencyKey) {
			const actorValue = this.requireText(actor, "actor");
			const key = this.requireText(idempotencyKey, "idempotencyKey");
			if (!Array.isArray(targets)) throw new AttentionError("invalid-argument", "targets must be an array");
			const normalized = targets.map((target, index) => ({
				itemId: AttentionItemId(this.requireText(target.itemId, `targets[${index}].itemId`)),
				expectedEntityRevision: this.requireRevision(target.expectedEntityRevision, `targets[${index}].expectedEntityRevision`)
			}));
			const result = this.mutationTail.then(() => this.confirmBatchNow(normalized, actorValue, key));
			this.mutationTail = result.then(() => void 0, () => void 0);
			return result;
		}
		/**
		* Invalidate one open item upstream: the stale-propagation trigger that
		* makes later decisions report `stale` instead of silently resolving.
		* @param itemId - the item to invalidate.
		* @param expectedEntityRevision - the revision this invalidation satisfies.
		* @param reason - non-empty reason recorded with the invalidation.
		* @param actor - the invalidating actor.
		* @param idempotencyKey - caller-owned replay key.
		* @returns the outcome and the revision to retry against when present.
		*/
		invalidateItem(itemId, expectedEntityRevision, reason, actor, idempotencyKey) {
			const id = AttentionItemId(this.requireText(itemId, "itemId"));
			const revision = this.requireRevision(expectedEntityRevision, "expectedEntityRevision");
			const reasonValue = this.requireText(reason, "reason");
			const actorValue = this.requireText(actor, "actor");
			const key = this.requireText(idempotencyKey, "idempotencyKey");
			const result = this.mutationTail.then(() => this.invalidateNow(id, revision, reasonValue, actorValue, key));
			this.mutationTail = result.then(() => void 0, () => void 0);
			return result;
		}
		async createItemNow(input, actor, idempotencyKey) {
			const existingKey = this.requireItemKeys().get(idempotencyKey);
			if (existingKey !== void 0) {
				const stored = this.requireItems().get(existingKey.itemId);
				if (stored === void 0) throw new AttentionError("not-found", `item "${existingKey.itemId}" is missing`);
				if (String(stored.itemId) !== String(input.itemId)) throw new AttentionError("conflict", "attention idempotency key reused with a different itemId");
				return stored;
			}
			let item = {
				itemId: input.itemId,
				taskId: input.taskId,
				kind: input.kind,
				decisionKind: input.decisionKind,
				options: input.options,
				state: "open",
				entityRevision: 1,
				openedAt: Date.now()
			};
			if (input.runId !== void 0) item = {
				...item,
				runId: input.runId
			};
			if (input.phaseRunId !== void 0) item = {
				...item,
				phaseRunId: input.phaseRunId
			};
			if (input.submissionId !== void 0) item = {
				...item,
				submissionId: input.submissionId
			};
			if (input.checkId !== void 0) item = {
				...item,
				checkId: input.checkId
			};
			if (input.impactSnapshot !== void 0) item = {
				...item,
				impactSnapshot: input.impactSnapshot
			};
			await this.appendFact({
				kind: "attention/item-created",
				taskId: input.taskId,
				idempotencyKey: `attention/item-created:${idempotencyKey}`,
				entityRevision: 1,
				payload: {
					itemId: String(input.itemId),
					actor
				}
			});
			await this.requireItems().put(String(input.itemId), item);
			await this.requireItemKeys().put(idempotencyKey, { itemId: String(input.itemId) });
			return item;
		}
		async resolveNow(itemId, expectedEntityRevision, optionId, actor, idempotencyKey) {
			const stored = this.requireItems().get(String(itemId));
			if (stored === void 0) return { outcome: "withdrawn" };
			if (stored.state === "resolved") return {
				outcome: stored.outcome === optionId ? "resolved" : "already-resolved",
				currentRevision: stored.entityRevision
			};
			if (stored.state !== "open") return {
				outcome: "stale",
				currentRevision: stored.entityRevision
			};
			if (stored.entityRevision !== expectedEntityRevision) return {
				outcome: "conflict",
				currentRevision: stored.entityRevision
			};
			if (!stored.options.includes(optionId)) throw new AttentionError("invalid-argument", `option "${optionId}" is not one of the item's options`);
			const nextRevision = stored.entityRevision + 1;
			await this.appendFact({
				kind: "attention/item-resolved",
				taskId: stored.taskId,
				idempotencyKey: `attention/item-resolved:${idempotencyKey}`,
				entityRevision: nextRevision,
				payload: {
					itemId: String(itemId),
					optionId,
					actor
				}
			});
			await this.requireItems().put(String(itemId), {
				...stored,
				state: "resolved",
				entityRevision: nextRevision,
				resolvedAt: Date.now(),
				resolvedBy: actor,
				outcome: optionId
			});
			await this.resumeIfAllSettled(stored.phaseRunId);
			return {
				outcome: "resolved",
				currentRevision: nextRevision
			};
		}
		async confirmBatchNow(targets, actor, idempotencyKey) {
			const results = [];
			const settledPhaseRuns = /* @__PURE__ */ new Set();
			for (const target of targets) {
				const stored = this.requireItems().get(String(target.itemId));
				if (stored === void 0) {
					results.push({
						itemId: target.itemId,
						outcome: "withdrawn"
					});
					continue;
				}
				if (stored.state === "resolved") {
					results.push({
						itemId: target.itemId,
						outcome: "already-resolved",
						currentRevision: stored.entityRevision
					});
					continue;
				}
				if (stored.state !== "open") {
					results.push({
						itemId: target.itemId,
						outcome: "stale",
						currentRevision: stored.entityRevision
					});
					continue;
				}
				if (stored.entityRevision !== target.expectedEntityRevision) {
					results.push({
						itemId: target.itemId,
						outcome: "conflict",
						currentRevision: stored.entityRevision
					});
					continue;
				}
				const nextRevision = stored.entityRevision + 1;
				await this.appendFact({
					kind: "attention/item-resolved",
					taskId: stored.taskId,
					idempotencyKey: `attention/item-resolved:${idempotencyKey}:${String(target.itemId)}`,
					entityRevision: nextRevision,
					payload: {
						itemId: String(target.itemId),
						actor
					}
				});
				await this.requireItems().put(String(target.itemId), {
					...stored,
					state: "resolved",
					entityRevision: nextRevision,
					resolvedAt: Date.now(),
					resolvedBy: actor
				});
				results.push({
					itemId: target.itemId,
					outcome: "resolved",
					currentRevision: nextRevision
				});
				if (stored.phaseRunId !== void 0) settledPhaseRuns.add(String(stored.phaseRunId));
			}
			for (const phaseRunId of settledPhaseRuns) await this.resumeIfAllSettled(phaseRunId);
			return results;
		}
		async invalidateNow(itemId, expectedEntityRevision, reason, actor, idempotencyKey) {
			const stored = this.requireItems().get(String(itemId));
			if (stored === void 0) return { outcome: "withdrawn" };
			if (stored.state === "resolved") return {
				outcome: "already-resolved",
				currentRevision: stored.entityRevision
			};
			if (stored.state !== "open") return {
				outcome: "stale",
				currentRevision: stored.entityRevision
			};
			if (stored.entityRevision !== expectedEntityRevision) return {
				outcome: "conflict",
				currentRevision: stored.entityRevision
			};
			const nextRevision = stored.entityRevision + 1;
			await this.appendFact({
				kind: "attention/item-invalidated",
				taskId: stored.taskId,
				idempotencyKey: `attention/item-invalidated:${idempotencyKey}`,
				entityRevision: nextRevision,
				payload: {
					itemId: String(itemId),
					reason,
					actor
				}
			});
			await this.requireItems().put(String(itemId), {
				...stored,
				state: "invalidated",
				entityRevision: nextRevision
			});
			await this.resumeIfAllSettled(stored.phaseRunId);
			return {
				outcome: "invalidated",
				currentRevision: nextRevision
			};
		}
		/**
		* Resume one phase run out of awaiting-decision when every item naming it
		* settled (resolved or invalidated). A run still awaiting a decision stays
		* parked; a concurrent transition owns the run and this becomes a no-op.
		* @param phaseRunId - the phase run the settled items name, when any.
		*/
		async resumeIfAllSettled(phaseRunId) {
			if (phaseRunId === void 0) return;
			if ([...this.requireItems().entries()].map(([, item]) => item).filter((item) => String(item.phaseRunId) === phaseRunId).some((item) => item.state === "open")) return;
			try {
				const phaseRun = await this.ctx.tasks.getPhaseRun(phaseRunId);
				if (phaseRun === void 0 || phaseRun.state !== "awaiting-decision") return;
				await this.ctx.tasks.resumePhaseFromAwaiting(phaseRunId, {
					actor: FACT_ACTOR$7,
					reason: "attention decisions settled",
					expectedRevision: phaseRun.revision,
					idempotencyKey: `attention/resume:${phaseRunId}`
				});
			} catch {}
		}
		/** Validate and normalize one create-item input. */
		normalizeInput(input) {
			const options = input.options;
			if (!Array.isArray(options) || options.length === 0) throw new AttentionError("invalid-argument", "options must be a non-empty array");
			let normalized = {
				itemId: AttentionItemId(this.requireText(input.itemId, "itemId")),
				taskId: this.requireText(input.taskId, "taskId"),
				kind: input.kind,
				decisionKind: this.requireText(input.decisionKind, "decisionKind"),
				options: options.map((option, index) => this.requireText(option, `options[${index}]`))
			};
			if (input.runId !== void 0) normalized = {
				...normalized,
				runId: this.requireText(input.runId, "runId")
			};
			if (input.phaseRunId !== void 0) normalized = {
				...normalized,
				phaseRunId: this.requireText(input.phaseRunId, "phaseRunId")
			};
			if (input.submissionId !== void 0) normalized = {
				...normalized,
				submissionId: this.requireText(input.submissionId, "submissionId")
			};
			if (input.checkId !== void 0) normalized = {
				...normalized,
				checkId: this.requireText(input.checkId, "checkId")
			};
			if (input.impactSnapshot !== void 0) normalized = {
				...normalized,
				impactSnapshot: this.requireText(input.impactSnapshot, "impactSnapshot")
			};
			return normalized;
		}
		/** Append one attention fact; the journal's durable write is the commit point. */
		async appendFact(input) {
			await this.ctx.workbenchJournal.append({
				taskId: input.taskId,
				kind: input.kind,
				actor: FACT_ACTOR$7,
				idempotencyKey: input.idempotencyKey,
				entityRevision: input.entityRevision,
				payload: input.payload
			});
		}
		/** Validate one non-empty wire field, returning the trimmed value. */
		requireText(value, field) {
			if (typeof value !== "string" || value.trim().length === 0) throw new AttentionError("invalid-argument", `${field} must be a non-empty string`);
			return value.trim();
		}
		/** Validate one compare-and-set revision. */
		requireRevision(value, field) {
			if (!Number.isSafeInteger(value) || value < 1) throw new AttentionError("invalid-argument", `${field} must be a positive safe integer`);
			return value;
		}
		requireItems() {
			if (this.items === void 0) throw new AttentionError("not-found", "attention domain is not initialized");
			return this.items;
		}
		requireItemKeys() {
			if (this.itemKeys === void 0) throw new AttentionError("not-found", "attention domain is not initialized");
			return this.itemKeys;
		}
	};
})();
//#endregion
//#region lib/types/deliverable/runtime.js
/**
* Runtime values of the deliverable-local package: branded identity
* constructors and the journal-fact sentinel for saves no submission traces.
* @module @deepseek-ai/dsh-deliverable-local/src/runtime
*/
/**
* Brand one wire value as a deliverable id.
* @param value - Wire value from the boundary.
* @returns the branded deliverable id.
*/
function DeliverableId$1(value) {
	return value;
}
/**
* Brand one wire value as a deliverable version id.
* @param value - Wire value from the boundary.
* @returns the branded version id.
*/
function DeliverableVersionId$1(value) {
	return value;
}
/**
* Brand one wire value as an impact-snapshot id.
* @param value - Wire value from the boundary.
* @returns the branded snapshot id.
*/
function ImpactSnapshotId(value) {
	return value;
}
/**
* The journal fact's owning task when a durable deliverable write traces no
* source submission: deliverable-domain facts carry this sentinel instead of
* inventing a task projection. The journal stores it verbatim; no task
* projection reads it back.
*/
const UNTASKED_FACT_TASK_ID = "deliverables";
//#endregion
//#region lib/types/deliverable/spec.js
/**
* The deliverable-local storage-domain declaration: immutable `versions`
* with dependency edges, per-phaseRun `phase_inputs` registration, the
* `save_keys` idempotency index, and persisted `impact_snapshots`. A
* per-deliverable `latest` index keys the version chain's head so saves and
* base checks read one record instead of scanning the chain. The domain name
* and version reject M1 `deliverable_minimal` media — pre-release stance, no
* migration.
* @module @deepseek-ai/dsh-deliverable-local/src/spec
*/
/** One immutable deliverable version as persisted on the medium. */
const deliverableVersionSchema = z.object({
	versionId: z.string().min(1),
	deliverableId: z.string().min(1),
	versionNumber: z.number().int().min(1),
	baseVersionId: z.string().min(1).optional(),
	sourceSubmissionId: z.string().min(1).optional(),
	dependsOn: z.array(z.object({
		deliverableId: z.string().min(1),
		versionId: z.string().min(1)
	})).optional(),
	state: z.enum([
		"current",
		"stale",
		"invalid",
		"superseded",
		"cancelled"
	]),
	entityRevision: z.number().int().min(1),
	createdAt: z.number().int().min(1)
});
/** Per-phaseRun input registration as persisted on the medium. */
const phaseInputsSchema = z.object({ inputVersionIds: z.array(z.string().min(1)) });
/** The save-idempotency index entry: one caller key to the version it created. */
const saveKeySchema = z.object({ versionId: z.string().min(1) });
/** The per-deliverable latest-version index entry: the chain head's version id. */
const latestVersionSchema = z.object({ versionId: z.string().min(1) });
/** One persisted impact snapshot as stored on the medium. */
const impactSnapshotSchema = z.object({
	snapshotId: z.string().min(1),
	roots: z.array(z.string().min(1)),
	staledVersions: z.array(z.object({
		deliverableId: z.string().min(1),
		versionIds: z.array(z.string().min(1))
	})),
	affectedPhaseRuns: z.array(z.string().min(1)),
	staledGateChecks: z.array(z.object({
		submissionId: z.string().min(1),
		checkIds: z.array(z.string().min(1))
	})),
	createdAt: z.number().int().min(1)
});
/** The deliverable domain: identity, format version, and owned tables. */
const deliverableLocalDomainSpec = defineDomain({
	name: "deliverable_local",
	version: 1,
	tables: {
		versions: domainTable(deliverableVersionSchema),
		phase_inputs: domainTable(phaseInputsSchema),
		save_keys: domainTable(saveKeySchema),
		latest: domainTable(latestVersionSchema),
		impact_snapshots: domainTable(impactSnapshotSchema)
	}
});
//#endregion
//#region lib/types/deliverable/types.js
/**
* Deliverable-local type surface: immutable version chains with registered
* dependency edges, idempotent saves, and persisted impact snapshots — the
* M2 evolution of the M1 wire contract (same service key, same three Remote
* methods, evolved parameters and returns). Types only — no runtime code.
* @module @deepseek-ai/dsh-deliverable-local/types
*/
/** Deliverable failure with code and message. */
var DeliverableError = class extends Error {
	/**
	* @param code - Machine-routable failure code.
	* @param message - Human-readable failure description.
	*/
	constructor(code, message) {
		super(message);
		this.code = code;
		this.name = "DeliverableError";
	}
};
//#endregion
//#region lib/types/deliverable/index.js
/**
* Deliverable-local service (`ctx.deliverables`): immutable version chains
* with registered dependency edges over one storageDomain unit, replacing the
* M1 minimal provider behind the same Remote surface. `saveVersion` is
* idempotent per caller key, `listCurrentInputs` admits only current branch
* products of one phase run, and `invalidateDownstream` computes the
* multi-root transitive closure over `dependsOn` edges and chain lineage,
* persists an `ImpactSnapshot`, and appends the deliverable journal facts.
* Every durable write appends its journal fact first; the projection puts
* that follow rebuild from replay.
* @module @deepseek-ai/dsh-deliverable-local
*/
var __runInitializers$10 = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate$10 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
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
/** States a fresh version is created in. */
const INITIAL_STATE = "current";
/** The actor recorded on deliverable facts: saves carry no mutation context. */
const FACT_ACTOR$6 = "deliverables";
/** The journal fact key of one save's commit point. */
function saveFactKey(idempotencyKey) {
	return `deliverable/save:${idempotencyKey}`;
}
/** Field-wise equality of one replayed dependency edge against its stored twin. */
function sameDependency(ref, declared) {
	return declared !== void 0 && ref.deliverableId === declared.deliverableId && ref.versionId === declared.versionId;
}
/**
* Deliverable-local service: the M2 deliverable domain behind the M1 service
* key and Remote surface, with idempotent saves, write-chain-owned dependency
* edges, and persisted multi-root impact closures.
*/
let DeliverableService = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _saveVersion_decorators;
	let _listCurrentInputs_decorators;
	let _listVersions_decorators;
	let _invalidateDownstream_decorators;
	return class DeliverableService extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_saveVersion_decorators = [Remote("saveVersion")];
			_listCurrentInputs_decorators = [Remote("listCurrentInputs")];
			_listVersions_decorators = [Remote("listVersions")];
			_invalidateDownstream_decorators = [Remote("invalidateDownstream")];
			__esDecorate$10(this, null, _saveVersion_decorators, {
				kind: "method",
				name: "saveVersion",
				static: false,
				private: false,
				access: {
					has: (obj) => "saveVersion" in obj,
					get: (obj) => obj.saveVersion
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$10(this, null, _listCurrentInputs_decorators, {
				kind: "method",
				name: "listCurrentInputs",
				static: false,
				private: false,
				access: {
					has: (obj) => "listCurrentInputs" in obj,
					get: (obj) => obj.listCurrentInputs
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$10(this, null, _listVersions_decorators, {
				kind: "method",
				name: "listVersions",
				static: false,
				private: false,
				access: {
					has: (obj) => "listVersions" in obj,
					get: (obj) => obj.listVersions
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$10(this, null, _invalidateDownstream_decorators, {
				kind: "method",
				name: "invalidateDownstream",
				static: false,
				private: false,
				access: {
					has: (obj) => "invalidateDownstream" in obj,
					get: (obj) => obj.invalidateDownstream
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
		/** The service opens its domain and appends facts to the workbench journal. */
		static {
			this.inject = ["storageDomain", "workbenchJournal"];
		}
		/**
		* @param ctx - Host context carrying the storage-domain facility and the workbench journal.
		*/
		constructor(ctx) {
			super(ctx, "deliverables");
			this.versions = __runInitializers$10(this, _instanceExtraInitializers);
			/** Serializes read-validate-write mutations so concurrent writers never interleave. */
			this.mutationTail = Promise.resolve();
		}
		/** Open and own the deliverable-local domain. */
		async [Service.init]() {
			const domain = await this.ctx.storageDomain.open(deliverableLocalDomainSpec);
			this.ctx.effect(() => async () => {
				await domain.close();
			}, "deliverable-local.domainClose");
			this.versions = domain.table("versions");
			this.phaseInputs = domain.table("phase_inputs");
			this.saveKeys = domain.table("save_keys");
			this.latest = domain.table("latest");
			this.snapshots = domain.table("impact_snapshots");
		}
		/**
		* Create one immutable version of a deliverable. The caller names the base
		* version it built on; a base that is no longer the latest version rejects
		* with `stale-write`. A staled head remains chainable: the successor
		* re-validates the deliverable after an impact retires the head's
		* conclusions. A save replaying a caller idempotency key with identical
		* fields returns the stored version; with different fields it fails loud
		* with `idempotency-conflict`, the same rule the journal applies to facts.
		* @param deliverableId - raw deliverable identifier.
		* @param expectedBaseVersion - the latest version the caller built on; `null` on a root version.
		* @param sourceSubmissionId - raw submission identifier that produced the version, when known.
		* @param idempotencyKey - caller-owned replay key; omit for a fresh save.
		* @returns the stored immutable version.
		*/
		saveVersion(deliverableId, expectedBaseVersion, sourceSubmissionId, idempotencyKey) {
			const deliverable = this.requireText(deliverableId, "deliverableId");
			if (expectedBaseVersion !== null) this.requireText(expectedBaseVersion, "expectedBaseVersion");
			if (sourceSubmissionId !== null) this.requireText(sourceSubmissionId, "sourceSubmissionId");
			if (idempotencyKey !== void 0 && idempotencyKey !== null && idempotencyKey.trim().length === 0) throw new DeliverableError("invalid-argument", "idempotencyKey must be a non-empty string when present");
			const input = {
				deliverableId: DeliverableId$1(deliverable),
				expectedBaseVersion: expectedBaseVersion === null ? null : DeliverableVersionId$1(expectedBaseVersion),
				sourceSubmissionId: sourceSubmissionId === null ? void 0 : sourceSubmissionId,
				idempotencyKey: idempotencyKey?.trim() || void 0
			};
			const result = this.mutationTail.then(() => this.saveVersionNow(input));
			this.mutationTail = result.then(() => void 0, () => void 0);
			return result;
		}
		/**
		* List the current input versions of one phase run: every registered input
		* whose state is `current`, in registration order. Stale, invalid,
		* superseded, and cancelled branch products are excluded.
		* @param phaseRunId - raw phase-run identifier.
		* @returns the current input versions.
		*/
		listCurrentInputs(phaseRunId) {
			const runId = this.requireText(phaseRunId, "phaseRunId");
			const inputs = this.requirePhaseInputs().get(runId);
			if (inputs === void 0) return [];
			const versions = this.requireVersions();
			const current = [];
			for (const versionId of inputs.inputVersionIds) {
				const version = versions.get(versionId);
				if (version !== void 0 && version.state === "current") current.push(version);
			}
			return current;
		}
		/**
		* List every deliverable version in registration order. The metrics
		* service filters current/valid products from this; no aggregation here.
		* @returns all stored versions.
		*/
		listVersions() {
			return [...this.requireVersions().entries()].map(([, version]) => version);
		}
		/**
		* Invalidate everything downstream of the named roots: each root and its
		* transitive consumers over `dependsOn` edges transition to `stale`;
		* already-stale subgraphs are skipped, and chain lineage alone is not an
		* impact edge — an upstream edit's own successor survives. The closure is
		* persisted as an `ImpactSnapshot` covering the newly staled versions
		* grouped per deliverable, the phase runs whose registered inputs lost
		* currency, and the recorded gate verdicts those runs' submissions
		* produced.
		* @param rootVersionIds - raw version ids whose downstream loses currency.
		* @returns the persisted impact snapshot.
		*/
		invalidateDownstream(rootVersionIds) {
			if (!Array.isArray(rootVersionIds) || rootVersionIds.length === 0) throw new DeliverableError("invalid-argument", "rootVersionIds must be a non-empty array");
			const roots = rootVersionIds.map((id) => {
				this.requireText(id, "rootVersionId");
				return DeliverableVersionId$1(id);
			});
			const result = this.mutationTail.then(() => this.invalidateDownstreamNow(roots));
			this.mutationTail = result.then(() => void 0, () => void 0);
			return result;
		}
		/**
		* Register (or replace) the input versions of one phase run. Host-side seam:
		* the task write chain records a submission's input refs here at acceptance.
		* @param phaseRunId - raw phase-run identifier.
		* @param versionIds - raw input version ids in stable order.
		*/
		async recordPhaseInputs(phaseRunId, versionIds) {
			const runId = this.requireText(phaseRunId, "phaseRunId");
			const inputVersionIds = versionIds.map((id) => {
				this.requireText(id, "versionId");
				return id;
			});
			await this.enqueue(() => this.requirePhaseInputs().put(runId, { inputVersionIds }));
		}
		/**
		* List the phase runs whose registered inputs include one version. Host-side
		* seam: the edit-lock service freezes exactly these runs while the version
		* is under a lease.
		* @param targetVersionId - raw version id the runs consume.
		* @returns the consuming phase-run ids.
		*/
		listConsumingPhaseRuns(targetVersionId) {
			const target = this.requireText(targetVersionId, "targetVersionId");
			const consuming = [];
			for (const [runId, inputs] of this.requirePhaseInputs().entries()) if (inputs.inputVersionIds.includes(target)) consuming.push(runId);
			return consuming;
		}
		/**
		* Register the dependency edges of one version: the input versions its
		* producing submission consumed. Host-side seam owned by the task write
		* chain at acceptance — executors never declare edges. Registering the same
		* refs twice is a no-op; different refs for the same version fail loud.
		* @param versionId - raw version identifier the edges complete.
		* @param dependsOn - the input version refs the producing submission consumed.
		*/
		async registerVersionDependencies(versionId, dependsOn) {
			const id = DeliverableVersionId$1(this.requireText(versionId, "versionId"));
			const refs = dependsOn.map((ref) => {
				this.requireText(ref.deliverableId, "deliverableId");
				this.requireText(ref.versionId, "versionId");
				return ref;
			});
			await this.enqueue(() => this.registerVersionDependenciesNow(id, refs));
		}
		/**
		* Read one version by identity; `undefined` when absent. Host-side seam for
		* the task write chain's output-exists and source-matches checks.
		* @param versionId - raw version id.
		* @returns the stored version, or `undefined`.
		*/
		getVersion(versionId) {
			return this.requireVersions().get(DeliverableVersionId$1(this.requireText(versionId, "versionId")));
		}
		/**
		* Read one persisted impact snapshot by identity; `undefined` when absent.
		* Host-side read for impact consumers and replay.
		* @param snapshotId - raw snapshot id.
		* @returns the stored snapshot, or `undefined`.
		*/
		getImpactSnapshot(snapshotId) {
			return this.requireSnapshots().get(this.requireText(snapshotId, "snapshotId"));
		}
		/** One serialized save step; the durable fact is the commit point of the version. */
		async saveVersionNow(input) {
			if (input.idempotencyKey !== void 0) {
				const replayed = await this.replaySave(input);
				if (replayed !== void 0) return replayed;
			}
			const latest = this.latestVersionOf(input.deliverableId);
			const versions = this.requireVersions();
			if (latest === void 0) {
				if (input.expectedBaseVersion !== null) throw new DeliverableError("stale-write", "deliverable has no version yet; expectedBaseVersion must be null");
			} else if (latest.versionId !== input.expectedBaseVersion) throw new DeliverableError("stale-write", "expectedBaseVersion is not the latest version of the deliverable");
			const version = {
				versionId: DeliverableVersionId$1(randomUUID()),
				deliverableId: input.deliverableId,
				versionNumber: latest === void 0 ? 1 : latest.versionNumber + 1,
				...latest === void 0 ? {} : { baseVersionId: latest.versionId },
				...input.sourceSubmissionId === void 0 ? {} : { sourceSubmissionId: input.sourceSubmissionId },
				state: INITIAL_STATE,
				entityRevision: 1,
				createdAt: Date.now()
			};
			await this.appendFact({
				kind: "deliverable/version-saved",
				taskId: this.factTaskOf(version),
				entityId: version.versionId,
				entityRevision: 1,
				idempotencyKey: input.idempotencyKey === void 0 ? `deliverable/version-saved:${version.versionId}` : saveFactKey(input.idempotencyKey),
				payload: version
			});
			await versions.put(version.versionId, version);
			await this.requireLatest().put(input.deliverableId, { versionId: version.versionId });
			if (input.idempotencyKey !== void 0) await this.requireSaveKeys().put(input.idempotencyKey, { versionId: version.versionId });
			return version;
		}
		/**
		* Replay a keyed save: the save-index hit returns the stored version after
		* a field comparison; a miss with the journal fact already appended (a
		* crash between the fact and the projections) repairs the projections from
		* the fact's payload. Either mismatch fails loud.
		*/
		async replaySave(input) {
			const indexed = this.requireSaveKeys().get(input.idempotencyKey);
			if (indexed !== void 0) {
				const stored = this.requireVersions().get(indexed.versionId);
				if (stored === void 0) throw new DeliverableError("not-found", `save index entry "${input.idempotencyKey}" names a missing version`);
				this.assertSaveFieldsMatch(input, stored);
				return stored;
			}
			const fact = this.factByKey(saveFactKey(input.idempotencyKey));
			if (fact === void 0) return void 0;
			const recovered = fact.payload;
			this.assertSaveFieldsMatch(input, recovered);
			await this.requireVersions().put(recovered.versionId, recovered);
			await this.requireLatest().put(recovered.deliverableId, { versionId: recovered.versionId });
			await this.requireSaveKeys().put(input.idempotencyKey, { versionId: recovered.versionId });
			return recovered;
		}
		/** Compare a replayed save's caller fields with the stored version; any difference is a conflict. */
		assertSaveFieldsMatch(input, stored) {
			if (!(stored.deliverableId === input.deliverableId && (stored.baseVersionId ?? null) === input.expectedBaseVersion && stored.sourceSubmissionId === input.sourceSubmissionId)) throw new DeliverableError("idempotency-conflict", `idempotency key "${input.idempotencyKey}" was already used with different fields`);
		}
		/** One serialized dependency registration; the durable put completes the version record. */
		async registerVersionDependenciesNow(versionId, dependsOn) {
			const versions = this.requireVersions();
			const version = versions.get(versionId);
			if (version === void 0) throw new DeliverableError("not-found", `no version with id ${JSON.stringify(versionId)}`);
			for (const ref of dependsOn) if (versions.get(ref.versionId) === void 0) throw new DeliverableError("not-found", `no version with id ${JSON.stringify(ref.versionId)}`);
			if (version.dependsOn !== void 0) {
				if (version.dependsOn.length === dependsOn.length && version.dependsOn.every((ref, index) => sameDependency(ref, dependsOn[index]))) return;
				throw new DeliverableError("idempotency-conflict", `version ${JSON.stringify(versionId)} already declares different dependencies`);
			}
			const completed = {
				...version,
				dependsOn
			};
			await versions.put(versionId, completed);
		}
		/**
		* One serialized invalidation step: validate every root, walk the
		* multi-root closure, transition the covered versions, derive the covered
		* task plane, and persist the snapshot.
		*/
		async invalidateDownstreamNow(roots) {
			const versions = this.requireVersions();
			const rootVersions = roots.map((rootId) => {
				const root = versions.get(rootId);
				if (root === void 0) throw new DeliverableError("not-found", `no version with id ${JSON.stringify(rootId)}`);
				return root;
			});
			const consumers = /* @__PURE__ */ new Map();
			for (const [, version] of versions.entries()) for (const ref of version.dependsOn ?? []) {
				const consumerList = consumers.get(ref.versionId) ?? [];
				consumerList.push(version);
				consumers.set(ref.versionId, consumerList);
			}
			const staled = /* @__PURE__ */ new Map();
			const queue = [...rootVersions];
			const seen = new Set(roots.map(String));
			while (queue.length > 0) {
				const version = queue.shift();
				if (version.state === "stale") continue;
				if (!staled.has(String(version.versionId))) staled.set(String(version.versionId), version);
				for (const next of consumers.get(String(version.versionId)) ?? []) {
					if (seen.has(String(next.versionId))) continue;
					seen.add(String(next.versionId));
					queue.push(next);
				}
			}
			for (const version of staled.values()) {
				const next = {
					...version,
					state: "stale",
					entityRevision: version.entityRevision + 1
				};
				await this.appendFact({
					kind: "deliverable/version-staled",
					taskId: this.factTaskOf(version),
					entityId: version.versionId,
					entityRevision: next.entityRevision,
					idempotencyKey: `deliverable/version-staled:${version.versionId}:${next.entityRevision}`,
					payload: next
				});
				await versions.put(version.versionId, next);
			}
			const grouped = this.groupStaledVersions(staled);
			const affectedPhaseRuns = this.affectedRuns(staled);
			const staledGateChecks = this.coveredGateChecks(affectedPhaseRuns);
			const snapshot = {
				snapshotId: ImpactSnapshotId(randomUUID()),
				roots,
				staledVersions: grouped,
				affectedPhaseRuns,
				staledGateChecks,
				createdAt: Date.now()
			};
			await this.appendFact({
				kind: "deliverable/impact-snapshotted",
				taskId: UNTASKED_FACT_TASK_ID,
				entityId: snapshot.snapshotId,
				entityRevision: 1,
				idempotencyKey: `deliverable/impact-snapshotted:${snapshot.snapshotId}`,
				payload: snapshot
			});
			await this.requireSnapshots().put(String(snapshot.snapshotId), snapshot);
			return snapshot;
		}
		/** Group the closure's versions per deliverable, ascending by version number. */
		groupStaledVersions(staled) {
			const byDeliverable = /* @__PURE__ */ new Map();
			for (const version of staled.values()) {
				const chain = byDeliverable.get(version.deliverableId) ?? [];
				chain.push(version);
				byDeliverable.set(version.deliverableId, chain);
			}
			return [...byDeliverable.entries()].map(([deliverableId, chain]) => ({
				deliverableId: DeliverableId$1(deliverableId),
				versionIds: chain.sort((a, b) => a.versionNumber - b.versionNumber).map((version) => version.versionId)
			}));
		}
		/** Phase runs whose registered inputs include a newly staled version. */
		affectedRuns(staled) {
			const affected = [];
			for (const [runId, inputs] of this.requirePhaseInputs().entries()) if (inputs.inputVersionIds.some((id) => staled.has(id))) affected.push(runId);
			return affected;
		}
		/**
		* Recorded gate verdicts the closure covers, derived from the journal: the
		* submissions of every affected run (by `phaseRunId`) and their recorded
		* `gate-check/recorded` verdicts. Derivation reads the authoritative fact
		* stream, never task projections.
		*/
		coveredGateChecks(affectedPhaseRuns) {
			if (affectedPhaseRuns.length === 0) return [];
			const runs = new Set(affectedPhaseRuns.map(String));
			const submissions = /* @__PURE__ */ new Set();
			for (const fact of this.ctx.workbenchJournal.replay(0)) {
				if (fact.kind !== "submission/recorded") continue;
				const payload = fact.payload;
				if (typeof payload.phaseRunId !== "string" || !runs.has(payload.phaseRunId)) continue;
				if (typeof payload.submissionId !== "string") continue;
				submissions.add(payload.submissionId);
			}
			if (submissions.size === 0) return [];
			const grouped = /* @__PURE__ */ new Map();
			for (const fact of this.ctx.workbenchJournal.replay(0)) {
				if (fact.kind !== "gate-check/recorded") continue;
				const payload = fact.payload;
				if (typeof payload.submissionId !== "string" || typeof payload.checkId !== "string") continue;
				if (!submissions.has(payload.submissionId)) continue;
				const checkIds = grouped.get(payload.submissionId) ?? [];
				checkIds.push(payload.checkId);
				grouped.set(payload.submissionId, checkIds);
			}
			return [...grouped.entries()].map(([submissionId, checkIds]) => ({
				submissionId,
				checkIds
			}));
		}
		/** The latest version of one deliverable from the index, or `undefined` when it has none. */
		latestVersionOf(deliverableId) {
			const indexed = this.requireLatest().get(deliverableId);
			if (indexed === void 0) return void 0;
			return this.requireVersions().get(indexed.versionId);
		}
		/**
		* The task a version's facts belong to: the source submission's task when
		* the journal traces one, otherwise the untasked sentinel.
		*/
		factTaskOf(version) {
			if (version.sourceSubmissionId === void 0) return UNTASKED_FACT_TASK_ID;
			const fact = this.factsOfKind("submission/recorded").find((candidate) => candidate.payload.submissionId === String(version.sourceSubmissionId));
			if (fact === void 0) return UNTASKED_FACT_TASK_ID;
			return fact.taskId;
		}
		/** Every stored fact of one kind, in journal order. */
		factsOfKind(kind) {
			return this.ctx.workbenchJournal.replay(0).filter((fact) => fact.kind === kind);
		}
		/** The stored fact with one idempotency key, when present. */
		factByKey(key) {
			return this.ctx.workbenchJournal.replay(0).find((fact) => fact.idempotencyKey === key);
		}
		/** Append one deliverable fact; the journal's durable write is the commit point. */
		async appendFact(input) {
			await this.ctx.workbenchJournal.append({
				taskId: input.taskId,
				kind: input.kind,
				actor: FACT_ACTOR$6,
				idempotencyKey: input.idempotencyKey,
				entityRevision: input.entityRevision,
				payload: input.payload
			});
		}
		/** Validate one non-empty wire field, returning the trimmed value. */
		requireText(value, field) {
			if (typeof value !== "string" || value.trim().length === 0) throw new DeliverableError("invalid-argument", `${field} must be a non-empty string`);
			return value.trim();
		}
		/** Enqueue one mutation on the service's serialized tail. */
		enqueue(job) {
			const result = this.mutationTail.then(job);
			this.mutationTail = result.then(() => void 0, () => void 0);
			return result;
		}
		requireVersions() {
			if (this.versions === void 0) throw new DeliverableError("invalid-argument", "deliverable domain is not open");
			return this.versions;
		}
		requirePhaseInputs() {
			if (this.phaseInputs === void 0) throw new DeliverableError("invalid-argument", "deliverable domain is not open");
			return this.phaseInputs;
		}
		requireSaveKeys() {
			if (this.saveKeys === void 0) throw new DeliverableError("invalid-argument", "deliverable domain is not open");
			return this.saveKeys;
		}
		requireLatest() {
			if (this.latest === void 0) throw new DeliverableError("invalid-argument", "deliverable domain is not open");
			return this.latest;
		}
		requireSnapshots() {
			if (this.snapshots === void 0) throw new DeliverableError("invalid-argument", "deliverable domain is not open");
			return this.snapshots;
		}
	};
})();
//#endregion
//#region lib/types/review-policy/types.js
/**
* Types of the review-policy service (`ctx.reviewPolicy`): trust tiers, the
* breaker counter, and the command error ladder. Types only — no runtime
* code.
* @module @deepseek-ai/dsh-review-policy/types
*/
/** Review-policy failure with code and message. */
var ReviewPolicyError = class extends Error {
	constructor(code, message) {
		super(message);
		this.code = code;
	}
};
//#endregion
//#region lib/types/review-policy/runtime.js
/**
* Runtime constructor for review-policy ids.
* @module @deepseek-ai/dsh-review-policy/src/runtime
*/
/**
* Brand one wire value as a review-policy record id.
* @param value - Wire value from the boundary.
* @returns the branded review-policy record id.
*/
function ReviewPolicyRecordId(value) {
	return value;
}
//#endregion
//#region lib/types/review-policy/spec.js
/**
* The review-policy storage-domain declaration: per-task tier records and
* per-(task, check) breaker counters. The domain name and version reject
* earlier media — pre-release stance, no migration.
* @module @deepseek-ai/dsh-review-policy/src/spec
*/
/** One stored tier record. */
const reviewPolicyRecordSchema = z.object({
	recordId: z.string().min(1),
	taskId: z.string().min(1),
	tier: z.enum([
		"strict",
		"balanced",
		"trusted"
	]),
	revision: z.number().int().min(1)
});
/** One stored breaker counter. */
const breakerCounterSchema = z.object({
	taskId: z.string().min(1),
	checkId: z.string().min(1),
	consecutiveFailures: z.number().int().min(0),
	revision: z.number().int().min(1)
});
/** The review-policy domain: identity, format version, and owned tables. */
const reviewPolicyDomainSpec = defineDomain({
	name: "reviewpolicy",
	version: 1,
	tables: {
		tiers: domainTable(reviewPolicyRecordSchema),
		breakers: domainTable(breakerCounterSchema)
	}
});
//#endregion
//#region lib/types/review-policy/index.js
/**
* Review-policy service (`ctx.reviewPolicy`): the M5 trust tiers, the
* deferred-batch-confirm read the gate service consults, the completion
* guards that keep unsigned B items and suspended rewind decisions from
* completing a task, and the repair-fuse breaker that parks a task behind a
* recovery decision after consecutive failed A repairs hit the recipe's
* explicit cap.
* @module @deepseek-ai/dsh-review-policy
*/
var __runInitializers$9 = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate$9 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
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
/** The actor recorded on review-policy facts; decisions carry their own actor. */
const FACT_ACTOR$5 = "review-policy";
/** The decision options of one breaker-tripped item. */
const BREAKER_OPTIONS = [
	"continue-repair",
	"patch",
	"rewind",
	"pause",
	"cancel"
];
/**
* Review-policy service: trust tiers, completion guards, and repair fuses.
*/
let ReviewPolicyService = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _setTier_decorators;
	let _getTier_decorators;
	let _defersBatchConfirm_decorators;
	let _applyBreakerDecision_decorators;
	return class ReviewPolicyService extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_setTier_decorators = [Remote("setTier")];
			_getTier_decorators = [Remote("getTier")];
			_defersBatchConfirm_decorators = [Remote("defersBatchConfirm")];
			_applyBreakerDecision_decorators = [Remote("applyBreakerDecision")];
			__esDecorate$9(this, null, _setTier_decorators, {
				kind: "method",
				name: "setTier",
				static: false,
				private: false,
				access: {
					has: (obj) => "setTier" in obj,
					get: (obj) => obj.setTier
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$9(this, null, _getTier_decorators, {
				kind: "method",
				name: "getTier",
				static: false,
				private: false,
				access: {
					has: (obj) => "getTier" in obj,
					get: (obj) => obj.getTier
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$9(this, null, _defersBatchConfirm_decorators, {
				kind: "method",
				name: "defersBatchConfirm",
				static: false,
				private: false,
				access: {
					has: (obj) => "defersBatchConfirm" in obj,
					get: (obj) => obj.defersBatchConfirm
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$9(this, null, _applyBreakerDecision_decorators, {
				kind: "method",
				name: "applyBreakerDecision",
				static: false,
				private: false,
				access: {
					has: (obj) => "applyBreakerDecision" in obj,
					get: (obj) => obj.applyBreakerDecision
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
		/** The service owns its domain, appends facts, registers guards, and parks phase runs. */
		static {
			this.inject = [
				"storageDomain",
				"workbenchJournal",
				"tasks",
				"attention",
				"recipes"
			];
		}
		/**
		* @param ctx - Host context carrying storage, journal, task, attention, and recipe services.
		*/
		constructor(ctx) {
			super(ctx, "reviewPolicy");
			this.tiers = __runInitializers$9(this, _instanceExtraInitializers);
			/** Serializes read-validate-write mutations so concurrent writers never interleave. */
			this.mutationTail = Promise.resolve();
			/** Disposers for the two completion guards; released on dispose. */
			this.guardDisposers = [];
		}
		/** Open the domain, watch gate verdicts, and register the completion guards. */
		async [Service.init]() {
			const domain = await this.ctx.storageDomain.open(reviewPolicyDomainSpec);
			this.ctx.effect(() => async () => {
				await domain.close();
			}, "reviewPolicy.domainClose");
			this.tiers = domain.table("tiers");
			this.breakers = domain.table("breakers");
			this.ctx.on("gate-check/recorded", (result) => {
				this.observeVerdict(result);
			});
			this.guardDisposers.push(this.ctx.tasks.registerCompletionGuard((task) => this.vetoOpenBatchConfirms(task)), this.ctx.tasks.registerCompletionGuard((task) => this.vetoOpenRewindDecisions(task)));
			this.ctx.effect(() => () => {
				for (const dispose of this.guardDisposers.splice(0)) dispose();
			}, "reviewPolicy.guards");
		}
		/**
		* Set one task's trust tier; unprovisioned tasks read as strict.
		* @param taskId - the task whose tier changes.
		* @param tier - the new tier.
		* @param actor - setting actor.
		* @param idempotencyKey - caller-owned replay key.
		* @returns the stored tier record.
		*/
		async setTier(taskId, tier, actor, idempotencyKey) {
			const task = this.requireTaskId(taskId);
			if (![
				"strict",
				"balanced",
				"trusted"
			].includes(tier)) throw new ReviewPolicyError("invalid-argument", "tier must be strict, balanced, or trusted");
			const owner = this.requireText(actor, "actor");
			const key = this.requireText(idempotencyKey, "idempotencyKey");
			const result = this.mutationTail.then(() => this.setTierNow(task, tier, owner, key));
			this.mutationTail = result.then(() => void 0, () => void 0);
			return result;
		}
		/**
		* Read one task's tier.
		* @param taskId - the task to read.
		* @returns the stored tier, or strict when unprovisioned.
		*/
		getTier(taskId) {
			return this.requireTiers().get(this.requireTaskId(taskId))?.tier ?? "strict";
		}
		/**
		* The gate service's read: whether B-class batch confirmation may run
		* ahead (trusted tier only). C-class checks always block.
		* @param taskId - the task being gated.
		* @returns true only when the task runs the trusted tier.
		*/
		defersBatchConfirm(taskId) {
			return this.getTier(taskId) === "trusted";
		}
		/**
		* Land one resolved breaker decision on the task plane: continue-repair
		* resets the counter and resumes the parked run; pause and cancel route to
		* the task commands; patch only journals the choice.
		* @param itemId - the resolved breaker-tripped item.
		* @param phaseRunRevision - the parked phase run's revision the caller read.
		* @param actor - landing actor.
		* @param idempotencyKey - caller-owned replay key.
		*/
		async applyBreakerDecision(itemId, phaseRunRevision, actor, idempotencyKey) {
			const owner = this.requireText(actor, "actor");
			const key = this.requireText(idempotencyKey, "idempotencyKey");
			const revision = this.requireRevision(phaseRunRevision, "phaseRunRevision");
			const item = this.ctx.attention.getItem(this.requireText(itemId, "itemId"));
			if (item === void 0) throw new ReviewPolicyError("not-found", `breaker item "${itemId}" is unknown`);
			if (item.decisionKind !== "breaker-tripped") throw new ReviewPolicyError("invalid-option", `item "${itemId}" is not a breaker decision`);
			if (item.state !== "resolved" || item.outcome === void 0) throw new ReviewPolicyError("not-resolved", `breaker decision "${itemId}" is not resolved`);
			if (item.phaseRunId === void 0) throw new ReviewPolicyError("invalid-transition", `breaker item "${itemId}" has no parked phase run`);
			if (item.outcome === "continue-repair") {
				await this.resetCounter(item.taskId, item.checkId ?? "", key);
				await this.ctx.tasks.resumePhaseFromAwaiting(String(item.phaseRunId), {
					actor: owner,
					reason: `breaker decision ${item.outcome}`,
					expectedRevision: revision,
					idempotencyKey: key
				});
			} else if (item.outcome === "pause" || item.outcome === "cancel") {
				const task = await this.ctx.tasks.getTask(String(item.taskId));
				if (task === void 0) throw new ReviewPolicyError("not-found", `task "${String(item.taskId)}" is unknown`);
				const mutation = {
					actor: owner,
					reason: `breaker decision ${item.outcome}`,
					expectedRevision: task.revision,
					idempotencyKey: key
				};
				if (item.outcome === "pause") await this.ctx.tasks.requestPause(String(item.taskId), mutation);
				else await this.ctx.tasks.requestCancel(String(item.taskId), mutation);
			}
			await this.appendFact(item.taskId, "review-policy/breaker-decision", key, item.entityRevision, {
				itemId: String(item.itemId),
				outcome: item.outcome,
				actor: owner
			});
		}
		/** Fold one recorded verdict into its breaker counter and maybe trip the fuse. */
		/** Completion veto: unsigned B-class confirmations of this task block completion. */
		vetoOpenBatchConfirms(task) {
			const unsigned = this.ctx.attention.listOpen().filter((item) => item.taskId === task.taskId && item.kind === "b-confirm");
			if (unsigned.length > 0) throw new Error(`${unsigned.length} unsigned B item(s) block completion`);
			return Promise.resolve();
		}
		/** Completion veto: an open rewind decision of this task suspends completion. */
		vetoOpenRewindDecisions(task) {
			const suspended = this.ctx.attention.listOpen().filter((item) => item.taskId === task.taskId && item.decisionKind === "rewind");
			if (suspended.length > 0) throw new Error(`${suspended.length} suspended rewind decision(s) block completion`);
			return Promise.resolve();
		}
		async observeVerdict(result) {
			if (result.stale === true) return;
			const submission = await this.ctx.tasks.getSubmission(String(result.submissionId));
			if (submission === void 0) return;
			const taskId = submission.taskId;
			const counted = this.mutationTail.then(() => this.countVerdict(taskId, result.checkId, result.passed));
			this.mutationTail = counted.then(() => void 0, () => void 0);
			const tripped = await counted;
			if (tripped === void 0) return;
			await this.ctx.tasks.markPhaseAwaitingDecision(String(tripped.phaseRunId), {
				actor: FACT_ACTOR$5,
				reason: `breaker tripped on check "${result.checkId}"`,
				expectedRevision: tripped.epoch,
				idempotencyKey: `breaker-park:${result.checkId}:${tripped.epoch}`
			});
			await this.ctx.attention.createItem({
				itemId: AttentionItemId(`breaker:${String(taskId)}:${result.checkId}:${tripped.epoch}`),
				taskId,
				phaseRunId: tripped.phaseRunId,
				submissionId: result.submissionId,
				checkId: result.checkId,
				kind: "recovery",
				decisionKind: "breaker-tripped",
				options: [...BREAKER_OPTIONS]
			}, FACT_ACTOR$5, `breaker:${String(taskId)}:${result.checkId}:${tripped.epoch}`);
		}
		async countVerdict(taskId, checkId, passed) {
			const stored = this.requireBreakers().get(this.breakerKey(taskId, checkId));
			const consecutiveFailures = passed ? 0 : (stored?.consecutiveFailures ?? 0) + 1;
			const revision = (stored?.revision ?? 0) + 1;
			const counter = {
				taskId,
				checkId,
				consecutiveFailures,
				revision
			};
			await this.requireBreakers().put(this.breakerKey(taskId, checkId), counter);
			if (passed) return void 0;
			const task = await this.ctx.tasks.getTask(String(taskId));
			if (task === void 0 || task.currentRunId === void 0) return void 0;
			const pinned = this.ctx.recipes.getPinned({
				recipeId: task.pinnedRecipe.recipeId,
				revision: task.pinnedRecipe.revision
			});
			const check = pinned.payload.gateChecks.find((candidate) => candidate.checkId === checkId);
			if (check?.circuitBreaker === void 0) return void 0;
			const breaker = pinned.payload.breakers?.find((candidate) => candidate.key === check.circuitBreaker);
			if (breaker === void 0 || consecutiveFailures < breaker.maxConsecutiveRepairs) return void 0;
			await this.appendFact(taskId, "review-policy/breaker-tripped", `breaker:${checkId}:${revision}`, revision, {
				checkId,
				consecutiveFailures,
				cap: breaker.maxConsecutiveRepairs
			});
			const parked = (await this.ctx.tasks.listPhaseRuns(String(task.currentRunId))).find((phase) => phase.state === "gate-running" && phase.phaseId === check.phaseId);
			if (parked === void 0) return void 0;
			return {
				phaseRunId: parked.phaseRunId,
				epoch: parked.revision
			};
		}
		/** Reset one breaker counter after a continue-repair decision. */
		async resetCounter(taskId, checkId, idempotencyKey) {
			const counter = {
				taskId,
				checkId,
				consecutiveFailures: 0,
				revision: (this.requireBreakers().get(this.breakerKey(taskId, checkId))?.revision ?? 0) + 1
			};
			await this.appendFact(taskId, "review-policy/breaker-reset", idempotencyKey, counter.revision, { checkId });
			await this.requireBreakers().put(this.breakerKey(taskId, checkId), counter);
		}
		async setTierNow(taskId, tier, actor, idempotencyKey) {
			const stored = this.requireTiers().get(String(taskId));
			const record = {
				recordId: stored?.recordId ?? ReviewPolicyRecordId(`review-policy:${String(taskId)}`),
				taskId,
				tier,
				revision: (stored?.revision ?? 0) + 1
			};
			await this.appendFact(taskId, "review-policy/tier-set", idempotencyKey, record.revision, {
				tier,
				actor
			});
			await this.requireTiers().put(String(taskId), record);
			return record;
		}
		breakerKey(taskId, checkId) {
			return `${String(taskId)}:${checkId}`;
		}
		/** Append one review-policy fact; the journal's durable write is the commit point. */
		async appendFact(taskId, kind, idempotencyKey, entityRevision, payload) {
			await this.ctx.workbenchJournal.append({
				taskId,
				kind,
				actor: FACT_ACTOR$5,
				idempotencyKey: `${kind}:${String(taskId)}:${idempotencyKey}`,
				entityRevision,
				payload
			});
		}
		requireTaskId(taskId) {
			return this.requireText(taskId, "taskId");
		}
		/** Validate one non-empty wire field, returning the trimmed value. */
		requireText(value, field) {
			if (typeof value !== "string" || value.trim().length === 0) throw new ReviewPolicyError("invalid-argument", `${field} must be a non-empty string`);
			return value.trim();
		}
		/** Validate one compare-and-set revision. */
		requireRevision(value, field) {
			if (!Number.isSafeInteger(value) || value < 1) throw new ReviewPolicyError("invalid-argument", `${field} must be a positive safe integer`);
			return value;
		}
		requireTiers() {
			if (this.tiers === void 0) throw new ReviewPolicyError("not-found", "review-policy domain is not initialized");
			return this.tiers;
		}
		requireBreakers() {
			if (this.breakers === void 0) throw new ReviewPolicyError("not-found", "review-policy domain is not initialized");
			return this.breakers;
		}
	};
})();
//#endregion
//#region lib/types/gate/index.js
/**
* Complex-gate service (`ctx.gate`): recognizes B/C gate checks and advances
* the covered phase run to `awaiting-decision`, so the M4 attention service
* can collect a decision. The engine still runs A checks and records their
* verdicts (now with `uncoveredScope` + `evidenceRefs`); B/C checks carry no
* machine verdict, so this service never writes a passed/failed result.
* @module @deepseek-ai/dsh-gate
*/
/** Actor recorded on the awaiting-decision transition the gate service writes. */
const FACT_ACTOR$4 = "gate";
/**
* Watches gate-running phase runs and parks any run whose recipe declares a
* B/C check for the phase, awaiting an external decision. A-check-only runs
* pass through untouched so the engine can settle them.
*/
var GateService = class extends Service {
	/** Task, recipe, and attention services: read the pinned checks, create the decision items, and write the transition. */
	static {
		this.inject = [
			"tasks",
			"recipes",
			"attention"
		];
	}
	/**
	* @param ctx - Host context carrying the task and recipe services.
	*/
	constructor(ctx) {
		super(ctx, "gate");
	}
	/** Listen for gate-running phase runs and park the complex-gate ones. */
	[Service.init]() {
		this.ctx.on("phase-run/updated", (phaseRun) => {
			if (phaseRun.state !== "gate-running") return;
			this.maybeAwaitDecision(phaseRun);
		});
	}
	/**
	* Create one decision item per B/C check on a gate-running phase run, then
	* advance the run to awaiting-decision. A-check-only runs are left for the
	* engine.
	* @param phaseRun - the gate-running run the event reported.
	*/
	async maybeAwaitDecision(phaseRun) {
		try {
			const task = await this.ctx.tasks.getTask(String(phaseRun.taskId));
			if (task === void 0) return;
			const complexChecks = this.ctx.recipes.getPinned({
				recipeId: task.pinnedRecipe.recipeId,
				revision: task.pinnedRecipe.revision
			}).payload.gateChecks.filter((check) => check.phaseId === phaseRun.phaseId && check.kind !== "A");
			if (complexChecks.length === 0) return;
			const phaseRunId = String(phaseRun.phaseRunId);
			const itemPromises = complexChecks.map((check) => this.ctx.attention.createItem({
				itemId: AttentionItemId(`gate:${phaseRunId}:${check.checkId}`),
				taskId: phaseRun.taskId,
				runId: phaseRun.runId,
				phaseRunId: phaseRun.phaseRunId,
				...phaseRun.activeSubmissionId === void 0 ? {} : { submissionId: phaseRun.activeSubmissionId },
				kind: check.kind === "B" ? "b-confirm" : "c-decision",
				decisionKind: "gate",
				checkId: check.checkId,
				options: check.humanAction
			}, FACT_ACTOR$4, `gate/create-item:${phaseRunId}:${check.checkId}`));
			const reviewPolicy = this.ctx.get("reviewPolicy");
			const markPromise = complexChecks.every((check) => check.kind === "B") && reviewPolicy?.defersBatchConfirm(String(phaseRun.taskId)) === true ? void 0 : this.ctx.tasks.markPhaseAwaitingDecision(phaseRunId, {
				actor: FACT_ACTOR$4,
				reason: "complex gate check awaits a decision",
				expectedRevision: phaseRun.revision,
				idempotencyKey: `gate/await-decision:${phaseRunId}`
			});
			await Promise.all(markPromise === void 0 ? itemPromises : [...itemPromises, markPromise]);
		} catch {}
	}
};
//#endregion
//#region lib/types/recipe-engine-core/spec.js
/**
* The recipe-engine storage-domain declaration: one table of durable
* phase-session bindings keyed by phase run id. Bindings survive restarts
* and drive recovery: which phase run ran which attempt in which session,
* and which submission the latest attempt recorded.
* @module @deepseek-ai/dsh-recipe-engine-core/src/spec
*/
/** Wire string branded at the durable boundary. */
const idString$1 = z.string().min(1);
/** Durable phase-session binding schema. */
const phaseSessionBindingSchema = z.object({
	phaseRunId: idString$1,
	taskId: idString$1,
	taskRunId: idString$1,
	phaseId: idString$1,
	attempt: z.number().int().min(0),
	sessionId: idString$1.optional(),
	submissionId: idString$1.optional(),
	updatedAt: z.number()
});
/** The recipe-engine domain: identity, format version, and the binding table. */
const recipeEngineDomainSpec = defineDomain({
	name: "recipe_engine",
	version: 1,
	tables: { phase_sessions: domainTable(phaseSessionBindingSchema) }
});
//#endregion
//#region lib/types/recipe-engine-core/types.js
/**
* Type surface of the recipe engine core: the contributed phase-executor
* seam, the durable phase-session binding, and engine failure codes.
* @module @deepseek-ai/dsh-recipe-engine-core/types
*/
/** Engine failure with code and message. */
var RecipeEngineError = class extends Error {
	constructor(code, message) {
		super(message);
		this.code = code;
		this.name = "RecipeEngineError";
	}
};
//#endregion
//#region lib/types/recipe-engine-core/index.js
/**
* Recipe engine core (`ctx.recipeEngine`): schedules pinned-recipe phase
* runs on the durable task service, drives the submission-gate-pass chain
* through a contributed phase executor, and reconciles pause, cancel, and
* restart recovery against the workbench journal. The injection closure
* is frozen by the M1 freeze: attention, clarifications, and deliverable
* services never enter this engine; deliverable-ref validation already
* runs inside the task write chain.
* @module @deepseek-ai/dsh-recipe-engine-core
*/
/** Task states that end a task; the engine stops scheduling them. */
const TERMINAL_TASK_STATES = [
	"completed",
	"failed",
	"cancelled"
];
/** Phase-run states that end a phase; the engine never re-executes them. */
const TERMINAL_PHASE_STATES = [
	"passed",
	"failed",
	"cancelled",
	"superseded",
	"stale"
];
/** The one deterministic A-check machine scope the M1 engine evaluates. */
const MACHINE_SCOPE_OUTPUTS = "the accepted submission lists every declared phase output";
/**
* Schedules one task through its pinned recipe: opens the run and phase
* runs, executes each phase via the contributed executor, records the
* submission, runs the deterministic gate, and advances or settles the
* task. Pause and cancel are barriers observed between atomic actions;
* restart recovery rebuilds from the durable bindings and journal.
*/
var RecipeEngineCore = class extends Service {
	static {
		this.inject = [
			"tasks",
			"recipes",
			"agents",
			"goals",
			"storageDomain",
			"workbenchJournal"
		];
	}
	constructor(ctx) {
		super(ctx, "recipeEngine");
		/** Per-task serialized scheduling chains; one scheduleNow runs at a time per task. */
		this.tails = /* @__PURE__ */ new Map();
		/** In-flight executor promises keyed by phase run id, with their task key. */
		this.inFlight = /* @__PURE__ */ new Map();
		/** Live phase-session handles keyed by phase run id, disposed when the phase settles. */
		this.sessions = /* @__PURE__ */ new Map();
		/** Tasks whose recipe or journal state the engine refuses to schedule again this session. */
		this.poisoned = /* @__PURE__ */ new Set();
		ctx.on("task/updated", (task) => {
			this.trigger(task.taskId);
		}, { global: true });
		ctx.on("phase-run/updated", (run) => {
			this.trigger(run.taskId);
		}, { global: true });
	}
	/** Open the engine domain, then reconcile recovery for every known task. */
	async [Service.init]() {
		const domain = await this.ctx.storageDomain.open(recipeEngineDomainSpec);
		this.ctx.effect(() => async () => {
			await domain.close();
		}, "recipe-engine.domainClose");
		this.bindingsTable = domain.table("phase_sessions");
		await this.recover();
	}
	/**
	* Register the single phase executor. Disposal proves removal (HMR-safe).
	* @param executor - the executor that performs every scheduled phase.
	* @returns the disposer clearing this registration.
	*/
	registerExecutor(executor) {
		if (this.executor !== void 0) throw new Error("a phase executor is already registered");
		this.executor = executor;
		this.recover();
		return () => {
			if (this.executor === executor) this.executor = void 0;
		};
	}
	/**
	* Wake the scheduler for one task. Wakes queue per task, so concurrent
	* events never interleave scheduling steps for the same task.
	* @param taskId - the task to schedule.
	*/
	async trigger(taskId) {
		if (this.bindingsTable === void 0) return;
		const key = String(taskId);
		const run = (this.tails.get(key) ?? Promise.resolve()).then(() => this.scheduleNow(taskId)).catch((error) => {
			if (error instanceof RecipeEngineError) {
				this.ctx.logger("recipe-engine").warn(`scheduling "${key}" stopped: ${error.message}`);
				return;
			}
			throw error;
		});
		this.tails.set(key, run.then(() => void 0, () => void 0));
		await run;
	}
	/**
	* Reconcile recovery: validate each non-terminal task's journal head
	* against its projection revision, then wake every non-terminal task.
	* Scheduling itself resumes submitted-but-ungated phases and re-executes
	* phase runs whose executor died mid-flight.
	*/
	async recover() {
		if (this.bindingsTable === void 0) return;
		const live = (await this.ctx.tasks.listTasks()).filter((task) => !TERMINAL_TASK_STATES.includes(task.state));
		for (const task of live) this.validateJournalHead(task);
		await Promise.all(live.map((task) => this.trigger(task.taskId)));
	}
	/** Require the opened bindings table, failing loud when unopened. */
	requireBindings() {
		if (this.bindingsTable === void 0) throw new Error("recipe-engine bindings table is not open");
		return this.bindingsTable;
	}
	/**
	* Validate the task's journal head against its projection revision
	* (design §8). A disagreement poisons the task: the engine stops
	* scheduling it rather than acting on a projection the journal cannot
	* rebuild.
	*/
	validateJournalHead(task) {
		const head = this.ctx.workbenchJournal.replay(0).filter((fact) => fact.taskId === task.taskId && fact.kind === "task/updated").reduce((max, fact) => Math.max(max, fact.entityRevision), 0);
		if (head !== task.revision) this.poison(task.taskId, `recovery-mismatch: projection revision ${task.revision} disagrees with journal head ${head}`);
	}
	poison(taskId, message) {
		const key = String(taskId);
		if (this.poisoned.has(key)) return;
		this.poisoned.add(key);
		this.ctx.logger("recipe-engine").error(`task "${key}": ${message}`);
	}
	/**
	* One scheduling pass: read state and advance one step per iteration until
	* no step remains. The task mutation commands are idempotent-by-state,
	* so the loop terminates on the acyclic state machine.
	*/
	async scheduleNow(taskId) {
		const key = String(taskId);
		if (this.poisoned.has(key)) return;
		this.requireBindings();
		for (;;) {
			const task = await this.ctx.tasks.getTask(key);
			if (task === void 0) return;
			if (TERMINAL_TASK_STATES.includes(task.state)) {
				this.disposeTaskSessions(task);
				return;
			}
			if (task.state === "pausing") {
				if (this.hasInFlightForTask(key)) return;
				await this.ctx.tasks.settlePause(key, this.mutation(task.taskId, task.revision, "settle-pause"));
				continue;
			}
			if (task.state === "cancelling") {
				if (this.hasInFlightForTask(key)) return;
				await this.cancelActivePhases(task);
				await this.ctx.tasks.settleCancel(key, this.mutation(task.taskId, task.revision, "settle-cancel"));
				continue;
			}
			if (task.state !== "running") return;
			const pinned = this.resolvePinned(task);
			if (pinned === void 0) return;
			if (!await this.advanceTask(task, pinned)) return;
		}
	}
	/** Resolve the task's pinned revision and verify its hash; poison on disagreement. */
	resolvePinned(task) {
		let pinned;
		try {
			pinned = this.ctx.recipes.getPinned({
				recipeId: task.pinnedRecipe.recipeId,
				revision: task.pinnedRecipe.revision
			});
		} catch (error) {
			if (error instanceof RecipeError) {
				this.poison(task.taskId, `recipe-unsupported: ${error.message}`);
				return;
			}
			throw error;
		}
		if (pinned.contentHash !== task.pinnedRecipe.contentHash) {
			this.poison(task.taskId, `recipe-unsupported: pinned hash disagrees with the registered revision ${task.pinnedRecipe.revision}`);
			return;
		}
		return pinned;
	}
	/**
	* Advance one running task by one step. Returns true when the step made
	* progress (re-read and continue), false when the task needs no step now.
	*/
	async advanceTask(task, pinned) {
		const key = String(task.taskId);
		const phaseOrder = pinned.payload.phases;
		if (task.currentRunId === void 0) {
			await this.ctx.tasks.createTaskRun(key, this.mutation(task.taskId, task.revision, "create-run"));
			return true;
		}
		const runs = await this.ctx.tasks.listPhaseRuns(String(task.currentRunId));
		for (const run of runs) if (TERMINAL_PHASE_STATES.includes(run.state)) this.disposeSession(String(run.phaseRunId));
		const active = runs.filter((run) => !TERMINAL_PHASE_STATES.includes(run.state));
		if (active.length === 0) return this.advancePhases(task, runs, phaseOrder);
		if (active.length > 1) {
			const keep = active[active.length - 1];
			for (const run of active) {
				if (keep === void 0 || run.phaseRunId === keep.phaseRunId) continue;
				await this.ctx.tasks.cancelPhaseRun(String(run.phaseRunId), this.mutation(task.taskId, run.revision, "cancel-orphan-phase"));
			}
			return true;
		}
		const phaseRun = active[0];
		if (phaseRun === void 0) return false;
		if (phaseRun.schedulingFrozen === true) return false;
		const binding = this.bindingOf(String(phaseRun.phaseRunId));
		const phase = phaseOrder.find((spec) => spec.phaseId === phaseRun.phaseId);
		if (phase === void 0) {
			this.poison(task.taskId, `recipe-unsupported: phase run names undeclared phase "${phaseRun.phaseId}"`);
			return false;
		}
		switch (phaseRun.state) {
			case "created":
			case "scheduled": {
				const started = await this.ctx.tasks.startPhaseRun(String(phaseRun.phaseRunId), this.mutation(task.taskId, phaseRun.revision, "start-phase"));
				await this.executePhase(task, task.currentRunId, started, phase, pinned, binding);
				return true;
			}
			case "running":
				if (this.inFlight.has(String(phaseRun.phaseRunId))) return false;
				await this.executePhase(task, task.currentRunId, phaseRun, phase, pinned, binding);
				return true;
			case "submitted":
			case "gate-running":
				await this.runGate(task, phaseRun, phase, binding, pinned);
				return true;
			case "submitting":
			case "awaiting-input":
			case "awaiting-decision":
			case "patching":
			case "stale": return false;
			case "passed":
			case "failed":
			case "cancelled":
			case "superseded": return false;
		}
	}
	/** With every phase run terminal, open the next phase or complete/fail the task. */
	async advancePhases(task, runs, phaseOrder) {
		if (runs.some((run) => run.schedulingFrozen === true)) return false;
		const key = String(task.taskId);
		const passed = new Set(runs.filter((run) => run.state === "passed").map((run) => run.phaseId));
		const next = phaseOrder.find((spec) => !passed.has(spec.phaseId));
		if (next === void 0) {
			await this.ctx.tasks.completeTask(key, this.mutation(task.taskId, task.revision, "complete"));
			return true;
		}
		if (runs.find((run) => run.phaseId === next.phaseId && (run.state === "failed" || run.state === "cancelled")) !== void 0) {
			await this.ctx.tasks.failTask(key, this.mutation(task.taskId, task.revision, "fail-after-failed-phase"));
			return true;
		}
		const runId = task.currentRunId;
		if (runId === void 0) return false;
		const phaseRun = await this.ctx.tasks.createPhaseRun(String(runId), next.phaseId, this.mutation(task.taskId, 1, "create-phase"));
		await this.putBinding({
			phaseRunId: phaseRun.phaseRunId,
			taskId: task.taskId,
			taskRunId: runId,
			phaseId: next.phaseId,
			attempt: 0,
			updatedAt: Date.now()
		});
		return true;
	}
	/**
	* Execute one phase: open its session, run the executor to a terminal
	* outcome, and record the submission (the atomic action's durable
	* commit). An executor failure cancels the phase and rethrows loudly.
	*/
	async executePhase(task, runId, phaseRun, phase, pinned, binding) {
		const executor = this.requireExecutor();
		const attempt = (binding?.attempt ?? 0) + 1;
		const submissionId = this.submissionIdFor(phaseRun, attempt);
		const session = await this.openSession(phaseRun, phase, attempt, pinned.payload.phases[0]?.phaseId === phase.phaseId);
		await this.ctx.tasks.recordPhaseSession(String(phaseRun.phaseRunId), session.sessionId, this.mutation(task.taskId, phaseRun.revision, "record-session"));
		const next = {
			phaseRunId: phaseRun.phaseRunId,
			taskId: task.taskId,
			taskRunId: runId,
			phaseId: phaseRun.phaseId,
			attempt,
			sessionId: session.sessionId,
			...binding?.submissionId === void 0 ? {} : { submissionId: binding.submissionId },
			updatedAt: Date.now()
		};
		await this.putBinding(next);
		const assignment = {
			taskId: task.taskId,
			taskRunId: runId,
			phaseRunId: phaseRun.phaseRunId,
			pinned,
			phase,
			gateChecks: pinned.payload.gateChecks.filter((check) => check.phaseId === phaseRun.phaseId),
			attempt,
			submissionId,
			...session.agent === void 0 ? {} : { agent: session.agent }
		};
		const runPromise = executor.execute(assignment);
		const phaseKey = String(phaseRun.phaseRunId);
		this.inFlight.set(phaseKey, {
			taskKey: String(task.taskId),
			promise: runPromise
		});
		let outcome;
		try {
			outcome = await runPromise;
		} catch (error) {
			this.inFlight.delete(phaseKey);
			await this.ctx.tasks.cancelPhaseRun(phaseKey, this.mutation(task.taskId, phaseRun.revision, "cancel-after-executor-failure"));
			this.disposeSession(phaseKey);
			throw error;
		}
		this.inFlight.delete(phaseKey);
		const settled = await this.ctx.tasks.getTask(String(task.taskId));
		if (settled === void 0 || settled.state === "cancelling" || TERMINAL_TASK_STATES.includes(settled.state)) return;
		const submission = this.buildSubmission(task, runId, phaseRun, attempt, submissionId, next, outcome);
		await this.ctx.tasks.recordSubmission(submission, {
			submittedBy: "recipe-engine",
			sourceSeqPersisted: outcome.sourceSeqPersisted,
			inputsCurrent: true,
			outputsValid: true
		});
		await this.putBinding({
			...next,
			submissionId: submission.submissionId,
			updatedAt: Date.now()
		});
	}
	/** Deterministic submission id: same phase run and attempt, same id, so a retried record replays the stored submission. */
	submissionIdFor(phaseRun, attempt) {
		return SubmissionId(`sub-${String(phaseRun.phaseRunId)}-a${attempt}`);
	}
	/** Build the immutable submission from the executor outcome and the binding. */
	buildSubmission(task, runId, phaseRun, attempt, submissionId, binding, outcome) {
		const raw = String(phaseRun.phaseRunId);
		return {
			submissionId,
			taskId: task.taskId,
			taskRunId: runId,
			phaseRunId: phaseRun.phaseRunId,
			phaseId: phaseRun.phaseId,
			attempt,
			pinnedRecipe: task.pinnedRecipe,
			sourceSessionId: binding.sessionId ?? `phase-${raw}`,
			sourceSeqRange: outcome.sourceSeqRange,
			inputVersions: outcome.result === "completed" ? outcome.inputVersions : [],
			outputVersions: outcome.result === "completed" ? outcome.outputVersions : [],
			unresolvedIssues: outcome.result === "completed" ? outcome.unresolvedIssues : [],
			result: outcome.result,
			...outcome.result === "failed" ? { failureReason: outcome.failureReason } : {},
			idempotencyKey: `engine:submit:${raw}:${attempt}`,
			submittedAt: Date.now(),
			...binding.submissionId === void 0 ? {} : { supersedesSubmissionId: binding.submissionId }
		};
	}
	/**
	* Run the gate for one submitted phase: start it once, record only the
	* missing deterministic A checks, then pass or fail the phase. Retried
	* checks reuse the submission timestamp so replays deduplicate exactly.
	*/
	async runGate(task, phaseRun, phase, binding, pinned) {
		const submissionId = phaseRun.activeSubmissionId ?? binding?.submissionId;
		if (submissionId === void 0) {
			this.poison(task.taskId, `recovery-mismatch: phase run "${phaseRun.phaseRunId}" has no active submission`);
			return;
		}
		const submission = await this.ctx.tasks.getSubmission(String(submissionId));
		if (submission === void 0) {
			this.poison(task.taskId, `recovery-mismatch: submission "${submissionId}" is missing`);
			return;
		}
		let current = phaseRun;
		if (phaseRun.state === "submitted") current = await this.ctx.tasks.startGate(String(submissionId), this.mutation(task.taskId, phaseRun.revision, "start-gate"));
		if (submission.result === "failed") {
			await this.ctx.tasks.markPhaseFailed(String(phaseRun.phaseRunId), this.mutation(task.taskId, current.revision, "fail-phase"));
			return;
		}
		const checks = pinned.payload.gateChecks.filter((check) => check.phaseId === phaseRun.phaseId);
		const aChecks = checks.filter((check) => check.kind === "A");
		const hasComplexChecks = checks.length !== aChecks.length;
		const recorded = await this.ctx.tasks.listGateResults(String(submissionId));
		const recordedIds = new Set(recorded.map((result) => result.checkId));
		for (const check of aChecks) {
			if (recordedIds.has(check.checkId)) continue;
			const verdict = this.evaluateCheck(check, phase, submission);
			await this.ctx.tasks.recordGateCheck({
				submissionId,
				checkId: check.checkId,
				passed: verdict.passed,
				detail: verdict.detail,
				recordedAt: submission.submittedAt,
				uncoveredScope: [...check.humanAction],
				evidenceRefs: submission.outputVersions.map((ref) => String(ref.versionId))
			});
		}
		if (hasComplexChecks) return;
		const results = await this.ctx.tasks.listGateResults(String(submissionId));
		if (results.length === aChecks.length && results.every((result) => result.passed && result.stale !== true)) await this.ctx.tasks.markPhasePassed(String(phaseRun.phaseRunId), this.mutation(task.taskId, current.revision, "pass-phase"));
		else await this.ctx.tasks.markPhaseFailed(String(phaseRun.phaseRunId), this.mutation(task.taskId, current.revision, "fail-phase"));
	}
	/** Evaluate one deterministic A check; unsupported scopes fail loud. */
	evaluateCheck(check, phase, submission) {
		const scope = check.machineScope.join("; ");
		if (scope !== MACHINE_SCOPE_OUTPUTS) throw new RecipeEngineError("recipe-unsupported", `check "${check.checkId}" machine scope "${scope}" is not an M1 deterministic check`);
		const declared = new Set(phase.outputs);
		const produced = new Set(submission.outputVersions.map((ref) => String(ref.deliverableId)));
		const missing = [...declared].filter((output) => !produced.has(output));
		return missing.length === 0 ? {
			passed: true,
			detail: `all ${declared.size} declared output(s) listed`
		} : {
			passed: false,
			detail: `missing declared output(s): ${missing.join(", ")}`
		};
	}
	/**
	* Open the phase session: create an agent and goal when an agent factory
	* is registered, otherwise record a synthetic session id so submissions
	* still name their source. The handle is disposed when the phase settles.
	*/
	async openSession(phaseRun, phase, attempt, shouldSeed) {
		const raw = String(phaseRun.phaseRunId);
		try {
			const handle = await this.ctx.agents.create({ sessionId: SessionId(`phase-${raw}-a${attempt}`) });
			this.ctx.goals.create(handle.agent, { objective: phase.goal });
			this.sessions.set(raw, handle);
			if (shouldSeed) this.seedOpenedSessionIfVoid(handle.agent.session, phaseRun.taskId);
			return {
				handle,
				agent: handle.agent,
				sessionId: `phase-${raw}-a${attempt}`
			};
		} catch (error) {
			if (error instanceof Error && error.message.includes("no agent factory registered")) return { sessionId: `phase-${raw}` };
			throw error;
		}
	}
	/**
	* Seed a freshly opened first-phase session with the task's confirmed
	* creation context: the journaled task/seed-created goal followed by its
	* inherited points, each as a user/message append. Runs at most once per
	* session: a non-empty event log (reopened session or already seeded)
	* skips, and a missing journal seed is a silent no-op.
	*/
	seedOpenedSessionIfVoid(session, taskId) {
		if (session.events.length > 0) return;
		const seed = [...this.ctx.workbenchJournal.replay(0)].filter((fact) => fact.taskId === taskId && fact.kind === "task/seed-created").at(-1);
		if (seed === void 0) return;
		const content = seed.payload;
		if (content.goal.length > 0) session.append("user/message", createUserMessage({
			content: [{
				type: "text",
				text: content.goal
			}],
			source: { kind: "user" }
		}), { surfaceOp: "append" });
		for (const point of content.points) session.append("user/message", createUserMessage({
			content: [{
				type: "text",
				text: point.text
			}],
			source: { kind: "user" }
		}), { surfaceOp: "append" });
	}
	/** Cancel every active phase run of a cancelling task, then its sessions. */
	async cancelActivePhases(task) {
		const runId = task.currentRunId;
		if (runId === void 0) return;
		const runs = await this.ctx.tasks.listPhaseRuns(String(runId));
		for (const run of runs) {
			if (TERMINAL_PHASE_STATES.includes(run.state)) continue;
			await this.ctx.tasks.cancelPhaseRun(String(run.phaseRunId), this.mutation(task.taskId, run.revision, "cancel-phase"));
			this.disposeSession(String(run.phaseRunId));
		}
	}
	hasInFlightForTask(taskKey) {
		for (const entry of this.inFlight.values()) if (entry.taskKey === taskKey) return true;
		return false;
	}
	bindingOf(phaseRunKey) {
		return this.requireBindings().get(phaseRunKey);
	}
	async putBinding(binding) {
		await this.requireBindings().put(binding.phaseRunId, binding);
	}
	disposeSession(phaseRunKey) {
		const handle = this.sessions.get(phaseRunKey);
		if (handle === void 0) return;
		this.sessions.delete(phaseRunKey);
		handle.dispose();
	}
	disposeTaskSessions(task) {
		for (const [, binding] of this.requireBindings().entries()) if (binding.taskId === task.taskId) this.disposeSession(String(binding.phaseRunId));
	}
	requireExecutor() {
		if (this.executor === void 0) throw new RecipeEngineError("no-executor", "no phase executor registered (call ctx.recipeEngine.registerExecutor)");
		return this.executor;
	}
	mutation(taskId, expectedRevision, action) {
		return {
			actor: "recipe-engine",
			reason: action,
			expectedRevision,
			idempotencyKey: `engine:${String(taskId)}:${action}`
		};
	}
};
//#endregion
//#region lib/types/recipe-multiphase/types.js
/**
* Type surface of the per-kind executor registry: machine-routable failure
* codes and the registry error.
* @module @deepseek-ai/dsh-recipe-multiphase/types
*/
/** Registry failure with a code and message. */
var RecipeMultiphaseError = class extends Error {
	/**
	* @param code - Machine-routable failure code.
	* @param message - Human-readable failure description.
	*/
	constructor(code, message) {
		super(message);
		this.code = code;
		this.name = "RecipeMultiphaseError";
	}
};
//#endregion
//#region lib/types/recipe-multiphase/index.js
/**
* Per-kind phase executor registry (`ctx.recipeMultiphase`): routes the
* multi-phase recipe's stages to executors by `RecipePhaseSpec.kind`, and
* exposes one aggregating `PhaseExecutor` that the assembly registers into
* recipe-engine-core's single executor slot. The engine closure stays
* untouched: routing lives here, not in the engine.
* @module @deepseek-ai/dsh-recipe-multiphase
*/
/**
* Registers executors by phase kind and dispatches each phase assignment to
* the executor registered for its kind. On construction it registers one
* aggregating executor into the recipe engine, so the engine's single slot
* fans out by `RecipePhaseSpec.kind` without any engine change.
*/
var RecipeMultiphaseService = class extends Service {
	/** The recipe engine, whose single slot the aggregating executor fills. */
	static {
		this.inject = ["recipeEngine"];
	}
	/**
	* @param ctx - Host context carrying the recipe engine.
	*/
	constructor(ctx) {
		super(ctx, "recipeMultiphase");
		this.executors = /* @__PURE__ */ new Map();
	}
	/**
	* Register one executor for a phase kind. Disposal removes it (HMR-safe).
	* @param phaseKind - the `RecipePhaseSpec.kind` value this executor serves.
	* @param executor - the executor performing every phase of that kind.
	* @returns the disposer removing the registration.
	*/
	registerExecutor(phaseKind, executor) {
		const kind = phaseKind.trim();
		if (kind === "") throw new RecipeMultiphaseError("invalid-kind", "phase kind must be a non-blank string");
		if (this.executors.has(kind)) throw new RecipeMultiphaseError("duplicate-kind", `an executor is already registered for phase kind "${kind}"`);
		this.executors.set(kind, executor);
		return () => {
			if (this.executors.get(kind) === executor) this.executors.delete(kind);
		};
	}
	/**
	* The aggregating executor to register into the engine's single slot. It
	* dispatches each assignment to the executor registered for the assignment
	* phase's kind.
	* @returns a `PhaseExecutor` routing by `assignment.phase.kind`.
	*/
	aggregatingExecutor() {
		const executors = this.executors;
		return {
			name: "recipe-multiphase",
			async execute(assignment) {
				const kind = assignment.phase.kind;
				const executor = executors.get(kind);
				if (executor === void 0) throw new RecipeMultiphaseError("no-executor", `no executor registered for phase kind "${kind}"`);
				return executor.execute(assignment);
			}
		};
	}
	/**
	* The phase kinds with a registered executor, in registration order.
	* @returns the registered kinds.
	*/
	listKinds() {
		return [...this.executors.keys()];
	}
	/** Register the aggregating executor into the engine on init. */
	[Service.init]() {
		this.ctx.effect(() => this.ctx.recipeEngine.registerExecutor(this.aggregatingExecutor()), "recipe-multiphase.executor-registration");
	}
};
//#endregion
//#region lib/types/clarification/runtime.js
/**
* Runtime values of the clarification package: branded identity constructors.
* @module @deepseek-ai/dsh-clarification/src/runtime
*/
/**
* Brand one wire value as a clarification-request id.
* @param value - Wire value from the boundary.
* @returns the branded request id.
*/
function ClarificationRequestId(value) {
	return value;
}
/**
* Brand one wire value as a clarification-question id.
* @param value - Wire value from the boundary.
* @returns the branded question id.
*/
function ClarificationQuestionId(value) {
	return value;
}
//#endregion
//#region lib/types/clarification/spec.js
/**
* The clarification storage-domain declaration: requests, questions, answers,
* and the request_keys idempotency index. The domain name and version reject
* earlier media — pre-release stance, no migration.
* @module @deepseek-ai/dsh-clarification/src/spec
*/
/** One stored clarification request. */
const clarificationRequestSchema = z.object({
	requestId: z.string().min(1),
	phaseRunId: z.string().min(1),
	taskId: z.string().min(1),
	questionIds: z.array(z.string().min(1)),
	injectedEventId: z.number().int().min(0).optional(),
	state: z.enum([
		"open",
		"injected",
		"closed"
	]),
	revision: z.number().int().min(1),
	createdAt: z.number().int().min(1)
});
/** One stored question. */
const questionSchema = z.object({
	questionId: z.string().min(1),
	requestId: z.string().min(1),
	phaseId: z.string().min(1),
	required: z.boolean(),
	order: z.number().int().min(0),
	text: z.string().min(1),
	revision: z.number().int().min(1)
});
/** One stored answer. */
const answerSchema = z.object({
	questionId: z.string().min(1),
	actor: z.string().min(1),
	value: z.string(),
	submittedAt: z.number().int().min(1),
	revision: z.number().int().min(1)
});
/** The request-idempotency index entry: one caller key to the request it created. */
const requestKeySchema = z.object({ requestId: z.string().min(1) });
/** The clarification domain: identity, format version, and owned tables. */
const clarificationDomainSpec = defineDomain({
	name: "clarification",
	version: 1,
	tables: {
		requests: domainTable(clarificationRequestSchema),
		request_keys: domainTable(requestKeySchema),
		questions: domainTable(questionSchema),
		answers: domainTable(answerSchema)
	}
});
//#endregion
//#region lib/types/clarification/types.js
/**
* Clarification type surface: persistent question/answer requests over one
* phase run, with idempotent partial answers and injected-answer recovery.
* Types only — no runtime code.
* @module @deepseek-ai/dsh-clarification/types
*/
/** A validation, lookup, or idempotency-conflict failure. */
var ClarificationError = class extends Error {
	constructor(code, message) {
		super(message);
		this.code = code;
		this.name = "ClarificationError";
	}
};
//#endregion
//#region lib/types/clarification/index.js
/**
* Clarification service (ctx.clarifications): persistent question/answer
* requests over one phase run, with idempotent partial answers. When every
* required question is answered, the service injects the answer summary as a
* model-visible user message into the phase session, records the persisted
* session event id, marks the request injected, appends the journal fact, and
* resumes the phase run out of awaiting-input. Recovery replays the journal
* fact rather than trusting a process-local promise, so a restart neither
* duplicates the session message nor re-injects a settled request.
* @module @deepseek-ai/dsh-clarification
*/
var __runInitializers$8 = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate$8 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
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
/** The actor recorded on clarification facts: answers carry their own actor. */
const FACT_ACTOR$3 = "clarifications";
/** The single option a clarification item resolves with once every required question is answered. */
const SATISFIED_OPTION = "satisfied";
/** The injected fact's journal idempotency key, one per request. */
function injectedFactKey(requestId) {
	return `clarification/injected:${String(requestId)}`;
}
/** Build the stored question records for a request's validated question list. */
function storedQuestions(questions, requestId) {
	return questions.map((input, index) => ({
		questionId: ClarificationQuestionId(`${String(requestId)}/q${index}`),
		requestId,
		phaseId: input.phaseId,
		required: input.required,
		order: input.order,
		text: input.text,
		revision: 1
	}));
}
/**
* Clarification service: the M3 persistent-clarification domain, with
* idempotent request creation, idempotent per-question partial answers, and
* recovered answer injection into the phase session.
*/
let ClarificationService = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _createRequest_decorators;
	let _answerPartial_decorators;
	let _getRequest_decorators;
	let _listOpen_decorators;
	return class ClarificationService extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_createRequest_decorators = [Remote("createRequest")];
			_answerPartial_decorators = [Remote("answerPartial")];
			_getRequest_decorators = [Remote("getRequest")];
			_listOpen_decorators = [Remote("listOpen")];
			__esDecorate$8(this, null, _createRequest_decorators, {
				kind: "method",
				name: "createRequest",
				static: false,
				private: false,
				access: {
					has: (obj) => "createRequest" in obj,
					get: (obj) => obj.createRequest
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$8(this, null, _answerPartial_decorators, {
				kind: "method",
				name: "answerPartial",
				static: false,
				private: false,
				access: {
					has: (obj) => "answerPartial" in obj,
					get: (obj) => obj.answerPartial
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$8(this, null, _getRequest_decorators, {
				kind: "method",
				name: "getRequest",
				static: false,
				private: false,
				access: {
					has: (obj) => "getRequest" in obj,
					get: (obj) => obj.getRequest
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$8(this, null, _listOpen_decorators, {
				kind: "method",
				name: "listOpen",
				static: false,
				private: false,
				access: {
					has: (obj) => "listOpen" in obj,
					get: (obj) => obj.listOpen
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
		/** The service opens its domain, appends facts, reads phase runs, and injects into phase sessions. */
		static {
			this.inject = [
				"storageDomain",
				"workbenchJournal",
				"tasks",
				"sessions",
				"attention"
			];
		}
		/**
		* @param ctx - Host context carrying storage, journal, task, and session services.
		*/
		constructor(ctx) {
			super(ctx, "clarifications");
			this.requests = __runInitializers$8(this, _instanceExtraInitializers);
			/** Serializes read-validate-write mutations so concurrent writers never interleave. */
			this.mutationTail = Promise.resolve();
		}
		/** Open and own the clarification domain. */
		async [Service.init]() {
			const domain = await this.ctx.storageDomain.open(clarificationDomainSpec);
			this.ctx.effect(() => async () => {
				await domain.close();
			}, "clarification.domainClose");
			this.requests = domain.table("requests");
			this.requestKeys = domain.table("request_keys");
			this.questions = domain.table("questions");
			this.answers = domain.table("answers");
		}
		/**
		* Create one clarification request over a phase run. Idempotent: replaying a
		* caller key with the same questions returns the stored request; a replay
		* with different questions fails loud with conflict.
		* @param phaseRunId - the phase run the request clarifies.
		* @param questions - the question definitions, in request order.
		* @param actor - the actor opening the request.
		* @param idempotencyKey - caller-owned replay key.
		* @returns the stored request with its assigned questions.
		*/
		createRequest(phaseRunId, questions, actor, idempotencyKey) {
			const runId = this.requireText(phaseRunId, "phaseRunId");
			const actorValue = this.requireText(actor, "actor");
			const key = this.requireText(idempotencyKey, "idempotencyKey");
			const validated = this.validateQuestions(questions);
			const result = this.mutationTail.then(() => this.createRequestNow(runId, validated, actorValue, key));
			this.mutationTail = result.then(() => void 0, () => void 0);
			return result;
		}
		/**
		* Record one answer for a question, at the question's current revision.
		* Idempotent: replaying the same question revision with the same value
		* returns the stored answer; a different value fails loud with conflict.
		* When the answer completes every required question, the service injects
		* the answer summary and resumes the phase run.
		* @param questionId - the question to answer.
		* @param expectedRevision - the question revision the answer satisfies.
		* @param answer - the answer text; may be empty.
		* @param actor - the actor supplying the answer.
		* @param idempotencyKey - caller-owned replay key for the journal fact.
		* @returns the stored answer.
		*/
		answerPartial(questionId, expectedRevision, answer, actor, idempotencyKey) {
			const qid = ClarificationQuestionId(this.requireText(questionId, "questionId"));
			if (typeof answer !== "string") throw new ClarificationError("invalid-argument", "answer must be a string");
			if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) throw new ClarificationError("invalid-argument", "expectedRevision must be a positive safe integer");
			const actorValue = this.requireText(actor, "actor");
			const key = this.requireText(idempotencyKey, "idempotencyKey");
			const result = this.mutationTail.then(() => this.answerPartialNow(qid, expectedRevision, answer, actorValue, key));
			this.mutationTail = result.then(() => void 0, () => void 0);
			return result;
		}
		/**
		* Read one clarification request.
		* @param requestId - the request identity.
		* @returns the request, or undefined when unknown.
		*/
		getRequest(requestId) {
			const id = ClarificationRequestId(this.requireText(requestId, "requestId"));
			return this.requireRequests().get(String(id));
		}
		/**
		* List the open requests of one phase run, in creation order.
		* @param phaseRunId - the phase run.
		* @returns the open requests.
		*/
		listOpen(phaseRunId) {
			const id = this.requireText(phaseRunId, "phaseRunId");
			const open = [];
			for (const [, request] of this.requireRequests().entries()) if (String(request.phaseRunId) === id && request.state === "open") open.push(request);
			open.sort((a, b) => a.createdAt - b.createdAt);
			return open;
		}
		async createRequestNow(phaseRunId, questions, actor, idempotencyKey) {
			const existingKey = this.requireRequestKeys().get(idempotencyKey);
			if (existingKey !== void 0) {
				const stored = this.requireRequests().get(existingKey.requestId);
				if (stored === void 0) throw new ClarificationError("not-found", `request "${existingKey.requestId}" is missing`);
				if (!this.sameQuestions(stored, questions)) throw new ClarificationError("conflict", "clarification idempotency key reused with different questions");
				return stored;
			}
			const phaseRun = await this.ctx.tasks.getPhaseRun(String(phaseRunId));
			if (phaseRun === void 0) throw new ClarificationError("not-found", `phase run "${phaseRunId}" is unknown`);
			const requestId = ClarificationRequestId(randomUUID());
			const questionIds = storedQuestions(questions, requestId).map((question) => question.questionId);
			const request = {
				requestId,
				phaseRunId,
				taskId: phaseRun.taskId,
				questionIds,
				state: "open",
				revision: 1,
				createdAt: Date.now()
			};
			await this.appendFact({
				kind: "clarification/request-created",
				taskId: phaseRun.taskId,
				idempotencyKey: `clarification/request-created:${idempotencyKey}`,
				entityRevision: 1,
				payload: {
					requestId: String(requestId),
					phaseRunId: String(phaseRunId),
					actor
				}
			});
			await this.requireRequests().put(String(requestId), request);
			await this.requireRequestKeys().put(idempotencyKey, { requestId: String(requestId) });
			const questionTable = this.requireQuestions();
			for (const question of storedQuestions(questions, requestId)) await questionTable.put(String(question.questionId), question);
			await this.ctx.attention.createItem({
				itemId: AttentionItemId(`clarification:${String(requestId)}`),
				taskId: phaseRun.taskId,
				phaseRunId,
				kind: "clarification",
				decisionKind: "clarification",
				options: [SATISFIED_OPTION]
			}, FACT_ACTOR$3, `clarification/item:${idempotencyKey}`);
			return request;
		}
		async answerPartialNow(questionId, expectedRevision, value, actor, idempotencyKey) {
			const question = this.requireQuestions().get(String(questionId));
			if (question === void 0) throw new ClarificationError("not-found", `question "${questionId}" is unknown`);
			if (expectedRevision !== question.revision) throw new ClarificationError("conflict", `question "${questionId}" revision is ${question.revision}, expected ${expectedRevision}`);
			const answers = this.requireAnswers();
			const existing = answers.get(String(questionId));
			if (existing !== void 0) {
				if (existing.value === value) return existing;
				throw new ClarificationError("conflict", `question "${questionId}" already answered differently`);
			}
			const request = this.requireRequests().get(String(question.requestId));
			if (request === void 0) throw new ClarificationError("not-found", `request "${question.requestId}" is missing`);
			const answer = {
				questionId,
				actor,
				value,
				submittedAt: Date.now(),
				revision: question.revision
			};
			await this.appendFact({
				kind: "clarification/answer-recorded",
				taskId: request.taskId,
				idempotencyKey: `clarification/answer-recorded:${idempotencyKey}`,
				entityRevision: answer.revision,
				payload: {
					questionId: String(questionId),
					value
				}
			});
			await answers.put(String(questionId), answer);
			await this.injectIfComplete(question.requestId);
			return answer;
		}
		/** Inject and resume when every required question of an open request is answered. */
		async injectIfComplete(requestId) {
			const requests = this.requireRequests();
			const request = requests.get(String(requestId));
			if (request === void 0 || request.state !== "open") return;
			if (!this.allRequiredAnswered(request)) return;
			const factKey = injectedFactKey(requestId);
			const existingFact = this.ctx.workbenchJournal.replay(0).find((fact) => fact.idempotencyKey === factKey);
			let injectedEventId;
			if (existingFact !== void 0) injectedEventId = existingFact.payload.injectedEventId;
			else {
				injectedEventId = await this.appendSessionMessage(request);
				await this.appendFact({
					kind: "clarification/injected",
					taskId: request.taskId,
					idempotencyKey: factKey,
					entityRevision: request.revision + 1,
					payload: {
						requestId: String(requestId),
						injectedEventId
					}
				});
			}
			await requests.put(String(requestId), {
				...request,
				state: "injected",
				injectedEventId,
				revision: request.revision + 1
			});
			await this.ctx.attention.resolveDecision(`clarification:${String(requestId)}`, 1, SATISFIED_OPTION, FACT_ACTOR$3, `clarification/resolve-item:${String(requestId)}`);
			await this.resumePhaseRun(request);
		}
		/** Whether every required question of the request has a recorded answer. */
		allRequiredAnswered(request) {
			const questions = this.requireQuestions();
			const answers = this.requireAnswers();
			for (const questionId of request.questionIds) {
				const question = questions.get(String(questionId));
				if (question === void 0 || !question.required) continue;
				if (answers.get(String(questionId)) === void 0) return false;
			}
			return true;
		}
		/** Append the answer summary as a model-visible user message; return its persisted event seq. */
		async appendSessionMessage(request) {
			const phaseRun = await this.ctx.tasks.getPhaseRun(String(request.phaseRunId));
			if (phaseRun === void 0 || phaseRun.sessionId === void 0) throw new ClarificationError("not-found", `phase run "${request.phaseRunId}" has no recorded session id`);
			const session = this.ctx.sessions.get(phaseRun.sessionId);
			if (session === void 0) throw new ClarificationError("not-found", `phase session "${phaseRun.sessionId}" is not live`);
			const questions = this.requireQuestions();
			const answers = this.requireAnswers();
			const lines = [];
			for (const questionId of request.questionIds) {
				const question = questions.get(String(questionId));
				const answer = answers.get(String(questionId));
				if (question === void 0 || answer === void 0) continue;
				lines.push(`${question.text}: ${answer.value}`);
			}
			const text = `Clarification answers:\n${lines.join("\n")}`;
			return session.append("user/message", createUserMessage({
				content: [{
					type: "text",
					text
				}],
				source: { kind: "user" }
			}), { surfaceOp: "append" }).seq;
		}
		/** Resume the phase run out of awaiting-input; a no-op once already resumed. */
		async resumePhaseRun(request) {
			const phaseRun = await this.ctx.tasks.getPhaseRun(String(request.phaseRunId));
			if (phaseRun === void 0 || phaseRun.state !== "awaiting-input") return;
			await this.ctx.tasks.resumePhaseFromAwaiting(String(request.phaseRunId), {
				actor: FACT_ACTOR$3,
				reason: "clarification-answers-injected",
				expectedRevision: phaseRun.revision,
				idempotencyKey: `clarification/resume:${String(request.requestId)}`
			});
		}
		/** Compare a stored request's questions against the validated wire questions. */
		sameQuestions(request, questions) {
			if (request.questionIds.length !== questions.length) return false;
			const stored = this.requireQuestions();
			let index = 0;
			for (const input of questions) {
				const questionId = request.questionIds[index];
				index += 1;
				const question = stored.get(String(questionId));
				if (question === void 0 || question.phaseId !== input.phaseId || question.required !== input.required || question.order !== input.order || question.text !== input.text) return false;
			}
			return true;
		}
		/** Validate the wire question list and normalize field defaults. */
		validateQuestions(questions) {
			if (!Array.isArray(questions) || questions.length === 0) throw new ClarificationError("invalid-argument", "questions must be a non-empty array");
			return questions.map((input, index) => ({
				phaseId: this.requireText(input.phaseId, "phaseId"),
				required: typeof input.required === "boolean" && input.required,
				order: Number.isSafeInteger(input.order) ? input.order : index,
				text: this.requireText(input.text, "text")
			}));
		}
		/** Append one clarification fact; the journal's durable write is the commit point. */
		async appendFact(input) {
			await this.ctx.workbenchJournal.append({
				taskId: input.taskId,
				kind: input.kind,
				actor: FACT_ACTOR$3,
				idempotencyKey: input.idempotencyKey,
				entityRevision: input.entityRevision,
				payload: input.payload
			});
		}
		/** Validate one non-empty wire field, returning the trimmed value. */
		requireText(value, field) {
			if (typeof value !== "string" || value.trim().length === 0) throw new ClarificationError("invalid-argument", `${field} must be a non-empty string`);
			return value.trim();
		}
		requireRequests() {
			if (this.requests === void 0) throw new ClarificationError("not-found", "clarification domain is not initialized");
			return this.requests;
		}
		requireRequestKeys() {
			if (this.requestKeys === void 0) throw new ClarificationError("not-found", "clarification domain is not initialized");
			return this.requestKeys;
		}
		requireQuestions() {
			if (this.questions === void 0) throw new ClarificationError("not-found", "clarification domain is not initialized");
			return this.questions;
		}
		requireAnswers() {
			if (this.answers === void 0) throw new ClarificationError("not-found", "clarification domain is not initialized");
			return this.answers;
		}
	};
})();
//#endregion
//#region lib/types/rewind/types.js
/**
* Types of the rewind service (`ctx.rewind`): the impact preview, the
* command error ladder, and the applied outcome. Types only — no runtime
* code.
* @module @deepseek-ai/dsh-rewind/types
*/
/** The decision options of one rewind item. */
const REWIND_OPTIONS = [
	"confirm-rewind",
	"keep-current",
	"cancel"
];
/** Rewind failure with code and message. */
var RewindError = class extends Error {
	constructor(code, message) {
		super(message);
		this.code = code;
	}
};
//#endregion
//#region lib/types/rewind/index.js
/**
* Rewind service (`ctx.rewind`): the M5 branch-abandonment flow. A rewind
* request computes the deliverable impact closure, persists the preview on
* the decision item (the first `impactSnapshot` writer), and only a resolved
* `confirm-rewind` outcome creates the new task run — superseding every phase
* run of the retired branch. Declined outcomes keep the task plane untouched:
* the upstream edit already staled the versions it staled.
* @module @deepseek-ai/dsh-rewind
*/
var __runInitializers$7 = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate$7 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
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
/** The actor recorded on rewind facts; decisions carry their own actor. */
const FACT_ACTOR$2 = "rewind";
/**
* Rewind service: preview-through-decision branch replacement.
*/
let RewindService = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _requestRewind_decorators;
	let _applyRewind_decorators;
	return class RewindService extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_requestRewind_decorators = [Remote("requestRewind")];
			_applyRewind_decorators = [Remote("applyRewind")];
			__esDecorate$7(this, null, _requestRewind_decorators, {
				kind: "method",
				name: "requestRewind",
				static: false,
				private: false,
				access: {
					has: (obj) => "requestRewind" in obj,
					get: (obj) => obj.requestRewind
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$7(this, null, _applyRewind_decorators, {
				kind: "method",
				name: "applyRewind",
				static: false,
				private: false,
				access: {
					has: (obj) => "applyRewind" in obj,
					get: (obj) => obj.applyRewind
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
		/** The service reads deliverable closures, writes task branches, and files decisions. */
		static {
			this.inject = [
				"deliverables",
				"tasks",
				"attention",
				"workbenchJournal"
			];
		}
		/**
		* @param ctx - Host context carrying deliverables, tasks, attention, and the journal.
		*/
		constructor(ctx) {
			super(ctx, "rewind");
			/** Serializes read-validate-write mutations so concurrent writers never interleave. */
			this.mutationTail = (__runInitializers$7(this, _instanceExtraInitializers), Promise.resolve());
		}
		/**
		* Request one rewind: compute the impact closure, persist the preview, and
		* open the decision item. No task-plane write happens before the decision.
		* @param taskId - the task whose branch the rewind would replace.
		* @param rootVersionIds - the deliverable versions the upstream edit staled.
		* @param actor - requesting actor.
		* @param idempotencyKey - caller-owned replay key.
		* @returns the open rewind decision item.
		*/
		async requestRewind(taskId, rootVersionIds, actor, idempotencyKey) {
			const task = this.requireTaskId(taskId);
			const owner = this.requireText(actor, "actor");
			const key = this.requireText(idempotencyKey, "idempotencyKey");
			if (!Array.isArray(rootVersionIds) || rootVersionIds.length === 0) throw new RewindError("invalid-argument", "rootVersionIds must be a non-empty array");
			for (const id of rootVersionIds) this.requireText(id, "rootVersionId");
			const result = this.mutationTail.then(() => this.requestNow(task, [...rootVersionIds], owner, key));
			this.mutationTail = result.then(() => void 0, () => void 0);
			return result;
		}
		/**
		* Apply one resolved rewind decision: create the successor run, supersede
		* the retired branch's phase runs, and journal the branch fact.
		* @param itemId - the resolved rewind decision item.
		* @param taskRevision - the task revision the caller read.
		* @param actor - applying actor.
		* @param idempotencyKey - caller-owned replay key.
		* @returns the new run and the retired phase runs.
		*/
		async applyRewind(itemId, taskRevision, actor, idempotencyKey) {
			const owner = this.requireText(actor, "actor");
			const key = this.requireText(idempotencyKey, "idempotencyKey");
			const revision = this.requireRevision(taskRevision, "taskRevision");
			const result = this.mutationTail.then(() => this.applyNow(AttentionItemId(this.requireText(itemId, "itemId")), revision, owner, key));
			this.mutationTail = result.then(() => void 0, () => void 0);
			return result;
		}
		async requestNow(taskId, rootVersionIds, actor, idempotencyKey) {
			const task = await this.ctx.tasks.getTask(String(taskId));
			if (task === void 0) throw new RewindError("not-found", `task "${String(taskId)}" is unknown`);
			if (task.currentRunId === void 0) throw new RewindError("invalid-transition", `task "${String(taskId)}" has no run to rewind`);
			const snapshot = await this.ctx.deliverables.invalidateDownstream(rootVersionIds);
			const rerunPhaseIds = /* @__PURE__ */ new Set();
			for (const phaseRunId of snapshot.affectedPhaseRuns) {
				const phaseRun = await this.ctx.tasks.getPhaseRun(String(phaseRunId));
				if (phaseRun !== void 0) rerunPhaseIds.add(phaseRun.phaseId);
			}
			const invalidatedVersionIds = snapshot.staledVersions.flatMap((group) => group.versionIds.map(String));
			const reusableClarificationIds = this.ctx.workbenchJournal.replay(0).filter((fact) => fact.kind === "clarification/injected" && String(fact.taskId) === String(taskId)).map((fact) => fact.payload.requestId);
			const preview = {
				snapshotId: String(snapshot.snapshotId),
				invalidatedVersionIds,
				rerunPhaseIds: [...rerunPhaseIds],
				reusableClarificationIds,
				costHint: "uncalibrated"
			};
			const itemId = `rewind:${String(taskId)}:${preview.snapshotId}`;
			await this.appendFact(taskId, "rewind/preview-requested", idempotencyKey, task.revision, {
				itemId,
				actor,
				roots: rootVersionIds,
				preview
			});
			await this.ctx.attention.createItem({
				itemId: AttentionItemId(itemId),
				taskId,
				runId: task.currentRunId,
				kind: "c-decision",
				decisionKind: "rewind",
				options: [...REWIND_OPTIONS],
				impactSnapshot: JSON.stringify(preview)
			}, FACT_ACTOR$2, `rewind-preview:${idempotencyKey}`);
			return {
				...preview,
				itemId
			};
		}
		async applyNow(itemId, taskRevision, actor, idempotencyKey) {
			const item = this.ctx.attention.getItem(String(itemId));
			if (item === void 0) throw new RewindError("not-found", `rewind item "${String(itemId)}" is unknown`);
			if (item.decisionKind !== "rewind") throw new RewindError("invalid-option", `item "${String(itemId)}" is not a rewind decision`);
			if (item.state !== "resolved" || item.outcome === void 0) throw new RewindError("not-resolved", `rewind decision "${String(itemId)}" is not resolved`);
			if (item.outcome !== "confirm-rewind") {
				await this.appendFact(item.taskId, "rewind/declined", idempotencyKey, item.entityRevision, {
					itemId: String(itemId),
					outcome: item.outcome,
					actor
				});
				throw new RewindError("invalid-option", `rewind decision "${String(itemId)}" resolved to "${item.outcome}", not "confirm-rewind"`);
			}
			const task = await this.ctx.tasks.getTask(String(item.taskId));
			if (task === void 0) throw new RewindError("not-found", `task "${String(item.taskId)}" is unknown`);
			if (task.currentRunId === void 0) throw new RewindError("invalid-transition", `task "${String(item.taskId)}" has no run to retire`);
			const retiredRunId = String(task.currentRunId);
			const mutation = {
				actor,
				reason: `rewind ${String(itemId)}`,
				expectedRevision: taskRevision,
				idempotencyKey
			};
			const run = await this.ctx.tasks.createTaskRun(String(item.taskId), mutation, retiredRunId);
			const phaseRuns = await this.ctx.tasks.listPhaseRuns(retiredRunId);
			const supersededPhaseRunIds = [];
			for (const phaseRun of phaseRuns) {
				const superseded = await this.ctx.tasks.markPhaseSuperseded(String(phaseRun.phaseRunId), {
					...mutation,
					expectedRevision: phaseRun.revision
				});
				supersededPhaseRunIds.push(String(superseded.phaseRunId));
			}
			await this.appendFact(item.taskId, "rewind/applied", idempotencyKey, run.revision, {
				itemId: String(itemId),
				newRunId: String(run.runId),
				retiredRunId,
				supersededPhaseRunIds,
				actor
			});
			return {
				run,
				supersededPhaseRunIds
			};
		}
		/** Append one rewind fact; the journal's durable write is the commit point. */
		async appendFact(taskId, kind, idempotencyKey, entityRevision, payload) {
			await this.ctx.workbenchJournal.append({
				taskId,
				kind,
				actor: FACT_ACTOR$2,
				idempotencyKey: `${kind}:${String(taskId)}:${idempotencyKey}`,
				entityRevision,
				payload
			});
		}
		requireTaskId(taskId) {
			return this.requireText(taskId, "taskId");
		}
		/** Validate one non-empty wire field, returning the trimmed value. */
		requireText(value, field) {
			if (typeof value !== "string" || value.trim().length === 0) throw new RewindError("invalid-argument", `${field} must be a non-empty string`);
			return value.trim();
		}
		/** Validate one compare-and-set revision. */
		requireRevision(value, field) {
			if (!Number.isSafeInteger(value) || value < 1) throw new RewindError("invalid-argument", `${field} must be a positive safe integer`);
			return value;
		}
	};
})();
//#endregion
//#region lib/types/budget/types.js
/**
* Types of the task budget ledger (`ctx.budget`): the durable record, the
* explicit limits, the usage intake, and the command error ladder. Types
* only — no runtime code.
* @module @deepseek-ai/dsh-budget/types
*/
/** Budget failure with code and message. */
var BudgetError = class extends Error {
	constructor(code, message) {
		super(message);
		this.code = code;
	}
};
//#endregion
//#region lib/types/budget/runtime.js
/**
* Runtime constructors for the budget ledger's branded ids.
* @module @deepseek-ai/dsh-budget/src/runtime
*/
/**
* Brand one wire value as a budget record id.
* @param value - Wire value from the boundary.
* @returns the branded budget record id.
*/
function BudgetRecordId(value) {
	return value;
}
//#endregion
//#region lib/types/budget/spec.js
/**
* The budget storage-domain declaration: one durable ledger record per task.
* The domain name and version reject earlier media — pre-release stance, no
* migration.
* @module @deepseek-ai/dsh-budget/src/spec
*/
/** One stored budget ledger record. */
const budgetRecordSchema = z.object({
	recordId: z.string().min(1),
	taskId: z.string().min(1),
	limits: z.object({
		maxTokens: z.number().int().min(1).optional(),
		maxDurationMs: z.number().int().min(1).optional(),
		maxReruns: z.number().int().min(1).optional()
	}),
	spent: z.object({
		tokens: z.number().int().min(0),
		durationMs: z.number().int().min(0),
		reruns: z.number().int().min(0)
	}),
	revision: z.number().int().min(1),
	warned: z.array(z.enum([
		"tokens",
		"durationMs",
		"reruns"
	]))
});
/** The budget domain: identity, format version, and owned tables. */
const budgetDomainSpec = defineDomain({
	name: "budget",
	version: 1,
	tables: { records: domainTable(budgetRecordSchema) }
});
//#endregion
//#region lib/types/budget/index.js
/**
* Task budget service (`ctx.budget`): one explicit durable ledger per task
* over the three budget dimensions (tokens, duration, reruns). Recording
* usage evaluates thresholds per dimension — 80% raises a batch-confirmable
* warning item once per budget revision, crossing the limit parks the task
* in `awaiting-decision` behind a blocking decision item. Limits are never
* defaulted: provisioning requires explicit values, and appending budget is
* itself the over-limit decision's landing path.
* @module @deepseek-ai/dsh-budget
*/
var __runInitializers$6 = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate$6 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
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
/** The actor recorded on budget facts; decisions carry their own actor. */
const FACT_ACTOR$1 = "budget";
/** The decision options of one budget-exceeded item. */
const EXCEEDED_OPTIONS = [
	"append-budget",
	"pause",
	"cancel"
];
/** Ledger limit field per budget dimension. */
const LIMIT_KEYS = {
	tokens: "maxTokens",
	durationMs: "maxDurationMs",
	reruns: "maxReruns"
};
/** The acknowledgment option of one budget-warning item. */
const WARNING_OPTIONS = ["acknowledged"];
/**
* Budget service: the M5 explicit task ledger with threshold decisions.
*/
let BudgetService = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _provisionBudget_decorators;
	let _appendBudget_decorators;
	let _recordUsage_decorators;
	let _getBudget_decorators;
	let _applyBudgetDecision_decorators;
	return class BudgetService extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_provisionBudget_decorators = [Remote("provisionBudget")];
			_appendBudget_decorators = [Remote("appendBudget")];
			_recordUsage_decorators = [Remote("recordUsage")];
			_getBudget_decorators = [Remote("getBudget")];
			_applyBudgetDecision_decorators = [Remote("applyBudgetDecision")];
			__esDecorate$6(this, null, _provisionBudget_decorators, {
				kind: "method",
				name: "provisionBudget",
				static: false,
				private: false,
				access: {
					has: (obj) => "provisionBudget" in obj,
					get: (obj) => obj.provisionBudget
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$6(this, null, _appendBudget_decorators, {
				kind: "method",
				name: "appendBudget",
				static: false,
				private: false,
				access: {
					has: (obj) => "appendBudget" in obj,
					get: (obj) => obj.appendBudget
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$6(this, null, _recordUsage_decorators, {
				kind: "method",
				name: "recordUsage",
				static: false,
				private: false,
				access: {
					has: (obj) => "recordUsage" in obj,
					get: (obj) => obj.recordUsage
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$6(this, null, _getBudget_decorators, {
				kind: "method",
				name: "getBudget",
				static: false,
				private: false,
				access: {
					has: (obj) => "getBudget" in obj,
					get: (obj) => obj.getBudget
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$6(this, null, _applyBudgetDecision_decorators, {
				kind: "method",
				name: "applyBudgetDecision",
				static: false,
				private: false,
				access: {
					has: (obj) => "applyBudgetDecision" in obj,
					get: (obj) => obj.applyBudgetDecision
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
		/** The service owns its domain, appends facts, and parks/resumes the task. */
		static {
			this.inject = [
				"storageDomain",
				"workbenchJournal",
				"tasks",
				"attention"
			];
		}
		/**
		* @param ctx - Host context carrying storage, journal, task, and attention services.
		*/
		constructor(ctx) {
			super(ctx, "budget");
			this.records = __runInitializers$6(this, _instanceExtraInitializers);
			/** Serializes read-validate-write mutations so concurrent writers never interleave. */
			this.mutationTail = Promise.resolve();
		}
		/** Open and own the budget domain. */
		async [Service.init]() {
			const domain = await this.ctx.storageDomain.open(budgetDomainSpec);
			this.ctx.effect(() => async () => {
				await domain.close();
			}, "budget.domainClose");
			this.records = domain.table("records");
		}
		/**
		* Provision one task's ledger. One record per task; explicit limits only —
		* an absent dimension is unlimited, not defaulted.
		* @param taskId - the task the ledger tracks.
		* @param limits - explicit limits; at least one dimension.
		* @param actor - provisioning actor.
		* @param idempotencyKey - caller-owned replay key.
		* @returns the stored ledger record.
		*/
		async provisionBudget(taskId, limits, actor, idempotencyKey) {
			const task = this.requireTaskId(taskId);
			const owner = this.requireText(actor, "actor");
			const key = this.requireText(idempotencyKey, "idempotencyKey");
			const normalized = this.normalizeLimits(limits);
			const result = this.mutationTail.then(() => this.provisionNow(task, normalized, owner, key));
			this.mutationTail = result.then(() => void 0, () => void 0);
			return result;
		}
		/**
		* Append budget: raise explicit limits and re-arm the warning latch.
		* @param taskId - the task whose ledger grows.
		* @param deltas - the limit increases per dimension; at least one positive.
		* @param expectedRevision - the ledger revision the caller read.
		* @param actor - appending actor.
		* @param idempotencyKey - caller-owned replay key.
		* @returns the post-append ledger record.
		*/
		async appendBudget(taskId, deltas, expectedRevision, actor, idempotencyKey) {
			const task = this.requireTaskId(taskId);
			const revision = this.requireRevision(expectedRevision, "expectedRevision");
			const owner = this.requireText(actor, "actor");
			const key = this.requireText(idempotencyKey, "idempotencyKey");
			const normalized = this.normalizeLimits(deltas);
			const result = this.mutationTail.then(() => this.appendNow(task, normalized, revision, owner, key));
			this.mutationTail = result.then(() => void 0, () => void 0);
			return result;
		}
		/**
		* Record one explicit usage intake and evaluate thresholds per dimension.
		* @param taskId - the task whose ledger accumulates.
		* @param usage - the spend delta; absent dimensions spend nothing.
		* @param actor - recording actor.
		* @param idempotencyKey - caller-owned replay key.
		* @returns the post-intake ledger record.
		*/
		async recordUsage(taskId, usage, actor, idempotencyKey) {
			const task = this.requireTaskId(taskId);
			const owner = this.requireText(actor, "actor");
			const key = this.requireText(idempotencyKey, "idempotencyKey");
			const normalized = this.normalizeUsage(usage);
			const result = this.mutationTail.then(() => this.recordNow(task, normalized, owner, key));
			this.mutationTail = result.then(() => void 0, () => void 0);
			return result;
		}
		/**
		* Read one task's ledger.
		* @param taskId - the task the ledger tracks.
		* @returns the ledger record, or undefined when never provisioned.
		*/
		getBudget(taskId) {
			return this.requireRecords().get(this.requireTaskId(taskId));
		}
		/**
		* Land one resolved budget-exceeded decision on the task plane: the
		* append-budget outcome grows the ledger and resumes the task; pause and
		* cancel route to the task commands. The item must already be resolved —
		* no silent landing of an open decision.
		* @param itemId - the resolved budget-exceeded item.
		* @param deltas - the limit increases (append-budget only; at least one).
		* @param taskRevision - the task revision the caller read.
		* @param actor - landing actor.
		* @param idempotencyKey - caller-owned replay key.
		*/
		async applyBudgetDecision(itemId, deltas, taskRevision, actor, idempotencyKey) {
			const id = AttentionItemId(this.requireText(itemId, "itemId"));
			const owner = this.requireText(actor, "actor");
			const key = this.requireText(idempotencyKey, "idempotencyKey");
			const item = this.ctx.attention.getItem(String(id));
			if (item === void 0) throw new BudgetError("not-found", `budget item "${itemId}" is unknown`);
			if (item.decisionKind !== "budget-exceeded") throw new BudgetError("invalid-option", `item "${itemId}" is not a budget-exceeded decision`);
			if (item.state !== "resolved" || item.outcome === void 0) throw new BudgetError("not-resolved", `budget decision "${itemId}" is not resolved`);
			if (await this.ctx.tasks.getTask(String(item.taskId)) === void 0) throw new BudgetError("not-found", `task "${String(item.taskId)}" is unknown`);
			const mutation = {
				actor: owner,
				reason: `budget decision ${item.outcome}`,
				expectedRevision: taskRevision,
				idempotencyKey: key
			};
			if (item.outcome === "append-budget") {
				const appended = await this.appendBudget(String(item.taskId), deltas, this.requireBudgetOf(item.taskId).revision, owner, key);
				await this.ctx.tasks.resumeTaskFromDecision(String(item.taskId), mutation);
				await this.appendFact(appended.taskId, "budget/decision-applied", key, appended.revision, {
					itemId: String(id),
					outcome: item.outcome,
					revision: appended.revision
				});
				return;
			}
			if (item.outcome === "pause") await this.ctx.tasks.requestPause(String(item.taskId), mutation);
			else if (item.outcome === "cancel") await this.ctx.tasks.requestCancel(String(item.taskId), mutation);
			else throw new BudgetError("invalid-option", `outcome "${item.outcome}" is not a budget decision option`);
			await this.appendFact(item.taskId, "budget/decision-applied", key, item.entityRevision, {
				itemId: String(id),
				outcome: item.outcome
			});
		}
		async provisionNow(taskId, limits, actor, idempotencyKey) {
			const records = this.requireRecords();
			if (records.get(String(taskId)) !== void 0) throw new BudgetError("already-provisioned", `task "${String(taskId)}" already has a budget ledger`);
			const record = {
				recordId: BudgetRecordId(`budget:${String(taskId)}`),
				taskId,
				limits,
				spent: {
					tokens: 0,
					durationMs: 0,
					reruns: 0
				},
				revision: 1,
				warned: []
			};
			await this.appendFact(taskId, "budget/provisioned", idempotencyKey, 1, {
				limits,
				actor
			});
			await records.put(String(taskId), record);
			return record;
		}
		async appendNow(taskId, deltas, expectedRevision, actor, idempotencyKey) {
			const stored = this.requireBudgetOf(taskId);
			if (stored.revision !== expectedRevision) throw new BudgetError("stale-revision", `expected ledger revision ${expectedRevision}, stored ${stored.revision}`);
			let limits = { ...stored.limits };
			for (const dimension of [
				"tokens",
				"durationMs",
				"reruns"
			]) {
				const key = LIMIT_KEYS[dimension];
				const current = stored.limits[key];
				if (current !== void 0) limits = {
					...limits,
					[key]: current + (deltas[key] ?? 0)
				};
			}
			const record = {
				...stored,
				limits,
				revision: stored.revision + 1,
				warned: []
			};
			await this.appendFact(taskId, "budget/appended", idempotencyKey, record.revision, {
				deltas,
				actor
			});
			await this.requireRecords().put(String(taskId), record);
			return record;
		}
		async recordNow(taskId, usage, actor, idempotencyKey) {
			const stored = this.requireBudgetOf(taskId);
			const spent = {
				tokens: stored.spent.tokens + (usage.tokens ?? 0),
				durationMs: stored.spent.durationMs + (usage.durationMs ?? 0),
				reruns: stored.spent.reruns + (usage.reruns ?? 0)
			};
			let record = {
				...stored,
				spent
			};
			await this.appendFact(taskId, "budget/used", idempotencyKey, stored.revision, {
				usage,
				actor,
				spent
			});
			const crossed = [];
			for (const dimension of [
				"tokens",
				"durationMs",
				"reruns"
			]) {
				const limit = stored.limits[LIMIT_KEYS[dimension]];
				if (limit === void 0) continue;
				const value = spent[dimension];
				if (value > limit) crossed.push(dimension);
				else if (value * 5 >= limit * 4 && !stored.warned.includes(dimension)) {
					record = {
						...record,
						warned: [...record.warned, dimension]
					};
					await this.ctx.attention.createItem({
						itemId: AttentionItemId(`budget-warning:${String(taskId)}:${dimension}:${record.revision}`),
						taskId,
						kind: "b-confirm",
						decisionKind: "budget-warning",
						options: [...WARNING_OPTIONS]
					}, FACT_ACTOR$1, `budget-warning:${String(taskId)}:${dimension}:${record.revision}`);
					await this.appendFact(taskId, "budget/warned", idempotencyKey, record.revision, {
						dimension,
						value,
						limit
					});
				}
			}
			if (crossed.length > 0) {
				const task = await this.ctx.tasks.getTask(String(taskId));
				if (task === void 0) throw new BudgetError("not-found", `task "${String(taskId)}" is unknown`);
				if (task.state === "running") await this.ctx.tasks.markTaskAwaitingDecision(String(taskId), {
					actor: FACT_ACTOR$1,
					reason: `budget exceeded: ${crossed.join(", ")}`,
					expectedRevision: task.revision,
					idempotencyKey: `budget-exceed:${idempotencyKey}`
				});
				for (const dimension of crossed) {
					await this.ctx.attention.createItem({
						itemId: AttentionItemId(`budget-exceeded:${String(taskId)}:${dimension}:${record.revision}`),
						taskId,
						kind: "c-decision",
						decisionKind: "budget-exceeded",
						options: [...EXCEEDED_OPTIONS]
					}, FACT_ACTOR$1, `budget-exceeded:${String(taskId)}:${dimension}:${record.revision}`);
					await this.appendFact(taskId, "budget/exceeded", idempotencyKey, record.revision, {
						dimension,
						value: spent[dimension]
					});
				}
			}
			await this.requireRecords().put(String(taskId), record);
			return record;
		}
		requireBudgetOf(taskId) {
			const stored = this.requireRecords().get(String(taskId));
			if (stored === void 0) throw new BudgetError("not-found", `task "${String(taskId)}" has no budget ledger`);
			return stored;
		}
		/** Append one budget fact; the journal's durable write is the commit point. */
		async appendFact(taskId, kind, idempotencyKey, entityRevision, payload) {
			await this.ctx.workbenchJournal.append({
				taskId,
				kind,
				actor: FACT_ACTOR$1,
				idempotencyKey: `${kind}:${String(taskId)}:${idempotencyKey}`,
				entityRevision,
				payload
			});
		}
		normalizeLimits(limits) {
			if (limits === null || typeof limits !== "object") throw new BudgetError("invalid-argument", "limits must be an object");
			const out = {};
			let any = false;
			for (const key of [
				"maxTokens",
				"maxDurationMs",
				"maxReruns"
			]) {
				const value = limits[key];
				if (value === void 0) continue;
				if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) throw new BudgetError("invalid-argument", `${key} must be a positive safe integer`);
				out[key] = value;
				any = true;
			}
			if (!any) throw new BudgetError("invalid-argument", "limits require at least one dimension");
			return out;
		}
		normalizeUsage(usage) {
			if (usage === null || typeof usage !== "object") throw new BudgetError("invalid-argument", "usage must be an object");
			const out = {};
			for (const key of [
				"tokens",
				"durationMs",
				"reruns"
			]) {
				const value = usage[key];
				if (value === void 0) continue;
				if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) throw new BudgetError("invalid-argument", `${key} must be a positive safe integer`);
				out[key] = value;
			}
			return out;
		}
		requireTaskId(taskId) {
			return this.requireText(taskId, "taskId");
		}
		/** Validate one non-empty wire field, returning the trimmed value. */
		requireText(value, field) {
			if (typeof value !== "string" || value.trim().length === 0) throw new BudgetError("invalid-argument", `${field} must be a non-empty string`);
			return value.trim();
		}
		/** Validate one compare-and-set revision. */
		requireRevision(value, field) {
			if (!Number.isSafeInteger(value) || value < 1) throw new BudgetError("invalid-argument", `${field} must be a positive safe integer`);
			return value;
		}
		requireRecords() {
			if (this.records === void 0) throw new BudgetError("not-found", "budget domain is not initialized");
			return this.records;
		}
	};
})();
//#endregion
//#region lib/types/digest/runtime.js
/**
* Digest derivation: a pure function from the task projection, its phase
* runs, the journal facts, and the deliverable versions to the `TaskDigest`.
* No I/O here — the service fetches the inputs, this module folds them.
* @module @deepseek-ai/dsh-digest/runtime
*/
/** Rewind facts carry the branch handoff: new run retires the old one. */
const REWIND_APPLIED$1 = "rewind/applied";
const TASK_RUN_UPDATED = "task-run/updated";
const PHASE_RUN_UPDATED$1 = "phase-run/updated";
const SUBMISSION_RECORDED$1 = "submission/recorded";
const ATTENTION_RESOLVED$1 = "attention/item-resolved";
/** Run branches: rewind handoffs plus the current run, newest-first. */
function buildRuns(task, facts) {
	const byRunId = /* @__PURE__ */ new Map();
	const index = (runId, parentRunId, createdAt, supersededAt) => {
		const existing = byRunId.get(runId);
		if (existing !== void 0) {
			if (supersededAt !== void 0) byRunId.set(runId, {
				...existing,
				supersededAt
			});
			return;
		}
		const branch = {
			runId,
			createdAt
		};
		if (parentRunId !== void 0) branch.parentRunId = parentRunId;
		if (supersededAt !== void 0) branch.supersededAt = supersededAt;
		byRunId.set(runId, branch);
	};
	for (const fact of facts) if (fact.kind === TASK_RUN_UPDATED) {
		const payload = fact.payload;
		if (typeof payload.runId === "string") index(payload.runId, payload.parentRunId, fact.occurredAt);
	} else if (fact.kind === REWIND_APPLIED$1) {
		const payload = fact.payload;
		if (typeof payload.newRunId === "string") index(payload.newRunId, payload.retiredRunId, fact.occurredAt, fact.occurredAt);
		if (typeof payload.retiredRunId === "string") index(payload.retiredRunId, void 0, fact.occurredAt, fact.occurredAt);
	}
	if (task.currentRunId !== void 0 && !byRunId.has(String(task.currentRunId))) index(String(task.currentRunId), void 0, task.createdAt);
	return [...byRunId.values()].sort((a, b) => b.createdAt - a.createdAt);
}
/** Timeline: every journal fact of the task in journal order. */
function buildTimeline(facts) {
	return facts.map((fact) => ({
		seq: fact.journalSeq,
		kind: fact.kind,
		occurredAt: fact.occurredAt,
		actor: fact.actor,
		summary: fact.kind
	}));
}
/** Phase summaries of the current run; attempt counts from submissions. */
function buildPhases(phaseRuns, facts) {
	const attempts = /* @__PURE__ */ new Map();
	for (const fact of facts) {
		if (fact.kind !== SUBMISSION_RECORDED$1) continue;
		const payload = fact.payload;
		if (typeof payload.phaseRunId !== "string") continue;
		attempts.set(payload.phaseRunId, (attempts.get(payload.phaseRunId) ?? 0) + 1);
	}
	const settledAt = /* @__PURE__ */ new Map();
	for (const fact of facts) {
		if (fact.kind !== PHASE_RUN_UPDATED$1) continue;
		const payload = fact.payload;
		if (typeof payload.phaseRunId !== "string") continue;
		if (payload.state === "passed") settledAt.set(payload.phaseRunId, { passedAt: fact.occurredAt });
		if (payload.state === "failed") settledAt.set(payload.phaseRunId, { failedAt: fact.occurredAt });
	}
	return phaseRuns.map((phase) => {
		const phaseRunId = phase.phaseRunId;
		const settled = settledAt.get(phaseRunId);
		const summary = {
			phaseId: phase.phaseId,
			state: phase.state,
			attemptCount: attempts.get(phaseRunId) ?? 0
		};
		if (settled?.passedAt !== void 0) summary.passedAt = settled.passedAt;
		if (settled?.failedAt !== void 0) summary.failedAt = settled.failedAt;
		return summary;
	});
}
/** Decision history: resolved attention items, newest first. */
function buildDecisions(facts) {
	const decisions = [];
	for (const fact of facts) {
		if (fact.kind !== ATTENTION_RESOLVED$1) continue;
		const payload = fact.payload;
		decisions.push({
			decisionKind: payload.decisionKind ?? "gate",
			...typeof payload.outcome === "string" ? { outcome: payload.outcome } : {},
			...fact.occurredAt > 0 ? { resolvedAt: fact.occurredAt } : {}
		});
	}
	return decisions.reverse();
}
/** Deliverable families: current valid version plus total version count. */
function buildDeliverables(versions) {
	const byDeliverable = /* @__PURE__ */ new Map();
	for (const version of versions) {
		const id = String(version.deliverableId);
		const prev = byDeliverable.get(id);
		const next = {
			deliverableId: id,
			state: prev?.state ?? "none",
			versionCount: (prev?.versionCount ?? 0) + 1
		};
		if (prev?.currentVersionId !== void 0) next.currentVersionId = prev.currentVersionId;
		if (version.state === "current") {
			next.currentVersionId = String(version.versionId);
			next.state = version.state;
		}
		byDeliverable.set(id, next);
	}
	return [...byDeliverable.values()];
}
/**
* Fold the digest inputs into the projection.
* @param task - the task projection.
* @param phaseRuns - phase runs of the task's current run.
* @param facts - journal facts of the task, in journal order.
* @param versions - every deliverable version.
* @returns the full task digest.
*/
function buildDigest(task, phaseRuns, facts, versions) {
	return {
		taskId: task.taskId,
		state: task.state,
		revision: task.revision,
		runs: buildRuns(task, facts),
		timeline: buildTimeline(facts),
		phaseSummaries: buildPhases(phaseRuns, facts),
		decisionHistory: buildDecisions(facts),
		deliverableStates: buildDeliverables(versions)
	};
}
//#endregion
//#region lib/types/digest/index.js
/**
* Digest service (`ctx.digest`): the M6 journal-derived read projection of
* one task — run branches, timeline, phase summaries, decision history, and
* deliverable states. Pure read: it never writes the task plane, never opens
* attention items, and never touches Gate or scheduling.
* @module @deepseek-ai/dsh-digest
*/
var __runInitializers$5 = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate$5 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
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
/** Digest read errors; no write-side ladder exists. */
var DigestError = class extends Error {
	constructor(code, message) {
		super(message);
		this.code = code;
		this.name = "DigestError";
	}
};
/** The digest service: one read-only Remote per task. */
let DigestService = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _digest_decorators;
	return class DigestService extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_digest_decorators = [Remote("digest")];
			__esDecorate$5(this, null, _digest_decorators, {
				kind: "method",
				name: "digest",
				static: false,
				private: false,
				access: {
					has: (obj) => "digest" in obj,
					get: (obj) => obj.digest
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
		/** The service reads the journal, the task projection, and the versions. */
		static {
			this.inject = [
				"tasks",
				"workbenchJournal",
				"deliverables"
			];
		}
		/**
		* @param ctx - Host context carrying the task, journal, and deliverable services.
		*/
		constructor(ctx) {
			super(ctx, "digest");
			__runInitializers$5(this, _instanceExtraInitializers);
		}
		/**
		* Derive one task's digest from the journal and the entity projections.
		* @param taskId - the task to digest.
		* @returns the full digest projection.
		*/
		async digest(taskId) {
			const id = this.requireText(taskId, "taskId");
			const task = await this.ctx.tasks.getTask(id);
			if (task === void 0) throw new DigestError("not-found", "task \"" + taskId + "\" is unknown");
			return buildDigest(task, task.currentRunId === void 0 ? [] : await this.ctx.tasks.listPhaseRuns(String(task.currentRunId)), this.ctx.workbenchJournal.replay(0).filter((fact) => String(fact.taskId) === String(id)), this.ctx.deliverables.listVersions());
		}
		/** Validate one non-empty wire field, returning the trimmed value. */
		requireText(value, field) {
			if (typeof value !== "string" || value.trim().length === 0) throw new DigestError("invalid-argument", field + " must be a non-empty string");
			return value.trim();
		}
	};
})();
//#endregion
//#region lib/types/workbench/host/runtime.js
/** Runtime constructors for the workbench attention domain. */
/**
* Brand a string as a workbench item id.
* @param id - raw item identifier.
* @returns the same string with the compile-time brand.
*/
function WorkbenchItemId(id) {
	return id;
}
//#endregion
//#region lib/types/workbench/host/index.js
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
var __runInitializers$4 = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate$4 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
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
/** Validate one wire actor identity: non-empty after trim. */
function resolveActor(value) {
	if (typeof value !== "string" || value.trim().length === 0) throw new TypeError("workbench actor must be a non-empty string");
	return value.trim();
}
/** Validate one wire compare-and-set revision. */
function resolveRevision(value, field) {
	if (!Number.isSafeInteger(value) || value < 1) throw new TypeError(`workbench ${field} must be a positive safe integer`);
	return value;
}
/** Validate one wire free-text field: non-empty after trim. */
function resolveText(value, field) {
	if (typeof value !== "string" || value.trim().length === 0) throw new TypeError(`workbench ${field} must be a non-empty string`);
	return value.trim();
}
/** Project one open attention item into its immutable wire view. */
function viewOf(item) {
	return {
		itemId: WorkbenchItemId(String(item.itemId)),
		kind: item.kind,
		status: item.state,
		entityRevision: item.entityRevision,
		title: item.checkId ?? item.decisionKind
	};
}
/**
* Workbench attention inbox (`ctx.workbenchHost`): the M4 client-safe
* projection over the persistent attention service.
*/
let WorkbenchHostService = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _listSnapshot_decorators;
	let _confirmBatch_decorators;
	let _resolveDecision_decorators;
	let _invalidateItem_decorators;
	return class WorkbenchHostService extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_listSnapshot_decorators = [Remote("listSnapshot")];
			_confirmBatch_decorators = [Remote("confirmBatch")];
			_resolveDecision_decorators = [Remote("resolveDecision")];
			_invalidateItem_decorators = [Remote("invalidateItem")];
			__esDecorate$4(this, null, _listSnapshot_decorators, {
				kind: "method",
				name: "listSnapshot",
				static: false,
				private: false,
				access: {
					has: (obj) => "listSnapshot" in obj,
					get: (obj) => obj.listSnapshot
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$4(this, null, _confirmBatch_decorators, {
				kind: "method",
				name: "confirmBatch",
				static: false,
				private: false,
				access: {
					has: (obj) => "confirmBatch" in obj,
					get: (obj) => obj.confirmBatch
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$4(this, null, _resolveDecision_decorators, {
				kind: "method",
				name: "resolveDecision",
				static: false,
				private: false,
				access: {
					has: (obj) => "resolveDecision" in obj,
					get: (obj) => obj.resolveDecision
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$4(this, null, _invalidateItem_decorators, {
				kind: "method",
				name: "invalidateItem",
				static: false,
				private: false,
				access: {
					has: (obj) => "invalidateItem" in obj,
					get: (obj) => obj.invalidateItem
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
		/** The service projects and delegates to the persistent attention service and reads the journal position. */
		static {
			this.inject = ["attention", "workbenchJournal"];
		}
		constructor(ctx) {
			super(ctx, "workbenchHost");
			__runInitializers$4(this, _instanceExtraInitializers);
		}
		/**
		* Read the whole open inbox with per-item compare-and-set revisions.
		* @returns the current snapshot.
		*/
		listSnapshot() {
			return {
				snapshotVersion: this.ctx.workbenchJournal.checkpoint().journalSeq,
				items: this.ctx.attention.listOpen().map(viewOf)
			};
		}
		/**
		* Confirm a batch of B-class items in one pass: every still-open
		* revision-matching item resolves, and each target reports its own outcome.
		* @param request - actor plus the compare-and-set targets.
		* @returns per-item results and the post-commit snapshot version.
		*/
		async confirmBatch(request) {
			const actor = resolveActor(request.actor);
			const targets = request.items.map((target) => ({
				itemId: AttentionItemId(String(target.itemId)),
				expectedEntityRevision: resolveRevision(target.expectedEntityRevision, "expectedEntityRevision")
			}));
			const settled = await this.ctx.attention.confirmBatch(targets, actor, randomUUID());
			const changed = [];
			const results = settled.map((row) => {
				if (row.outcome === "resolved" && row.currentRevision !== void 0) changed.push({
					itemId: WorkbenchItemId(String(row.itemId)),
					status: "resolved",
					entityRevision: row.currentRevision
				});
				return {
					itemId: WorkbenchItemId(String(row.itemId)),
					outcome: row.outcome,
					...row.currentRevision === void 0 ? {} : { currentRevision: row.currentRevision }
				};
			});
			return {
				snapshotVersion: this.commit(changed),
				results
			};
		}
		/**
		* Resolve one C-class decision item; C items are never batched.
		* @param request - compare-and-set target plus the recorded decision text.
		* @returns the single-item outcome and the post-commit snapshot version.
		*/
		async resolveDecision(request) {
			const actor = resolveActor(request.actor);
			const decision = resolveText(request.decision, "decision");
			const revision = resolveRevision(request.expectedEntityRevision, "expectedEntityRevision");
			const settled = await this.ctx.attention.resolveDecision(String(request.itemId), revision, decision, actor, randomUUID());
			const changed = [];
			if (settled.outcome === "resolved" && settled.currentRevision !== void 0) changed.push({
				itemId: WorkbenchItemId(String(request.itemId)),
				status: "resolved",
				entityRevision: settled.currentRevision
			});
			return {
				snapshotVersion: this.commit(changed),
				outcome: settled.outcome,
				...settled.currentRevision === void 0 ? {} : { currentRevision: settled.currentRevision }
			};
		}
		/**
		* Invalidate one open item upstream: the stale-propagation trigger that
		* makes later confirms report `stale` instead of silently resolving.
		* @param request - compare-and-set target plus the recorded reason.
		* @returns the single-item outcome and the post-commit snapshot version.
		*/
		async invalidateItem(request) {
			const actor = resolveActor(request.actor);
			const reason = resolveText(request.reason, "reason");
			const revision = resolveRevision(request.expectedEntityRevision, "expectedEntityRevision");
			const settled = await this.ctx.attention.invalidateItem(String(request.itemId), revision, reason, actor, randomUUID());
			const changed = [];
			if (settled.outcome === "invalidated" && settled.currentRevision !== void 0) changed.push({
				itemId: WorkbenchItemId(String(request.itemId)),
				status: "invalidated",
				entityRevision: settled.currentRevision
			});
			return {
				snapshotVersion: this.commit(changed),
				outcome: settled.outcome,
				...settled.currentRevision === void 0 ? {} : { currentRevision: settled.currentRevision }
			};
		}
		/**
		* Resolve the snapshot version from the journal checkpoint and push the
		* change set when it is non-empty. Synchronous listener failures are
		* contained and logged so a committed change never looks failed.
		*/
		commit(changed) {
			const snapshotVersion = this.ctx.workbenchJournal.checkpoint().journalSeq;
			if (changed.length === 0) return snapshotVersion;
			const update = {
				snapshotVersion,
				changed
			};
			for (const listener of this.ctx.events.dispatch("emit", ["workbench/attention-updated", update])) try {
				listener(update);
			} catch (error) {
				this.ctx.logger.warn("workbench-host: an attention-updated listener failed: %s", error);
			}
			return snapshotVersion;
		}
	};
})();
//#endregion
//#region lib/types/metrics/runtime.js
/**
* Metrics derivation: pure functions from entity projections and journal
* facts to the KPI and per-task measures. No I/O here — the service fetches
* the inputs, this module folds them.
* @module @deepseek-ai/dsh-metrics/runtime
*/
const REWIND_APPLIED = "rewind/applied";
const SUBMISSION_RECORDED = "submission/recorded";
const PHASE_RUN_UPDATED = "phase-run/updated";
const GATE_CHECK_RECORDED = "gate-check/recorded";
const ATTENTION_RESOLVED = "attention/item-resolved";
/** Terminal task states; everything else counts as live work. */
const TERMINAL = /* @__PURE__ */ new Set([
	"completed",
	"cancelled",
	"failed"
]);
/** One day bucket key in the local timezone. */
function dayKey(occurredAt) {
	const d = new Date(occurredAt);
	const pad = (n) => String(n).padStart(2, "0");
	return String(d.getFullYear()) + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}
/**
* Fold the workbench KPI projection.
* @param tasks - every task projection.
* @param items - the attention inbox snapshot items.
* @param versions - every deliverable version.
* @param facts - the whole journal, in journal order.
* @returns the KPI counts, throughput buckets, and gate pass rates.
*/
function buildWorkbenchMetrics(tasks, items, versions, facts) {
	const live = tasks.filter((task) => !TERMINAL.has(task.state)).length;
	const openItems = items.filter((item) => item.status === "open");
	const gate = openItems.filter((item) => item.kind === "b-confirm" || item.kind === "c-decision").length;
	const ask = openItems.filter((item) => item.kind === "clarification").length;
	const asset = versions.filter((version) => version.state === "current").length;
	const windowStart = Date.now() - 6048e5;
	const throughputByDay = /* @__PURE__ */ new Map();
	for (const fact of facts) {
		if (fact.kind !== PHASE_RUN_UPDATED || fact.occurredAt < windowStart) continue;
		if (fact.payload.state !== "passed") continue;
		const day = dayKey(fact.occurredAt);
		throughputByDay.set(day, (throughputByDay.get(day) ?? 0) + 1);
	}
	const throughput = [...throughputByDay.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([day, completedPhases]) => ({
		day,
		completedPhases
	}));
	const counts = /* @__PURE__ */ new Map();
	for (const fact of facts) {
		if (fact.kind !== GATE_CHECK_RECORDED) continue;
		const payload = fact.payload;
		const kind = payload.kind ?? "A";
		const entry = counts.get(kind) ?? {
			passed: 0,
			total: 0
		};
		entry.total += 1;
		if (payload.passed === true) entry.passed += 1;
		counts.set(kind, entry);
	}
	const rate = (kind) => {
		const entry = counts.get(kind);
		return entry === void 0 || entry.total === 0 ? 0 : entry.passed / entry.total;
	};
	return {
		live,
		gate,
		ask,
		asset,
		throughput,
		gatePassRate: {
			a: rate("A"),
			b: rate("B"),
			c: rate("C")
		}
	};
}
/**
* Fold per-task measures.
* @param task - the task projection.
* @param facts - journal facts of the task.
* @param budget - the budget ledger record, when one exists.
* @returns the per-task measures.
*/
function buildTaskMetrics(task, facts, budget) {
	const starts = /* @__PURE__ */ new Map();
	const passes = /* @__PURE__ */ new Map();
	for (const fact of facts) {
		if (fact.kind !== PHASE_RUN_UPDATED) continue;
		const payload = fact.payload;
		if (typeof payload.phaseRunId !== "string") continue;
		if ((payload.state === "running" || payload.state === "scheduled") && !starts.has(payload.phaseRunId)) starts.set(payload.phaseRunId, fact.occurredAt);
		if (payload.state === "passed" && !passes.has(payload.phaseRunId)) passes.set(payload.phaseRunId, fact.occurredAt);
	}
	const phaseDurations = [];
	for (const [phaseRunId, startedAt] of starts) {
		const passedAt = passes.get(phaseRunId);
		phaseDurations.push({
			phaseId: phaseRunId,
			startedAt,
			...passedAt === void 0 ? {} : { passedAt },
			...passedAt === void 0 ? {} : { durationMs: passedAt - startedAt }
		});
	}
	phaseDurations.sort((a, b) => (a.startedAt ?? 0) - (b.startedAt ?? 0));
	const rewindCount = facts.filter((fact) => fact.kind === REWIND_APPLIED).length;
	const submissionsByPhase = /* @__PURE__ */ new Map();
	for (const fact of facts) {
		if (fact.kind !== SUBMISSION_RECORDED) continue;
		const payload = fact.payload;
		if (typeof payload.phaseRunId !== "string") continue;
		submissionsByPhase.set(payload.phaseRunId, (submissionsByPhase.get(payload.phaseRunId) ?? 0) + 1);
	}
	const retriedSubmissions = [...submissionsByPhase.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
	const decisionCount = facts.filter((fact) => fact.kind === ATTENTION_RESOLVED).length;
	return {
		taskId: String(task.taskId),
		phaseDurations,
		rerunCount: rewindCount + retriedSubmissions,
		decisionCount,
		...budget === void 0 ? {} : { budgetUsed: budget }
	};
}
//#endregion
//#region lib/types/metrics/index.js
/**
* Metrics service (`ctx.metrics`): the M6 workbench KPI projection and
* per-task measures, derived from the entity projections and the journal.
* Pure read: it never writes the task plane, never opens attention items,
* and never touches Gate or scheduling.
* @module @deepseek-ai/dsh-metrics
*/
var __runInitializers$3 = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate$3 = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
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
/** Metrics read errors; no write-side ladder exists. */
var MetricsError = class extends Error {
	constructor(code, message) {
		super(message);
		this.code = code;
		this.name = "MetricsError";
	}
};
/** The metrics service: read-only KPI and per-task measures. */
let MetricsService = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _metrics_decorators;
	let _taskMetrics_decorators;
	return class MetricsService extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_metrics_decorators = [Remote("metrics")];
			_taskMetrics_decorators = [Remote("taskMetrics")];
			__esDecorate$3(this, null, _metrics_decorators, {
				kind: "method",
				name: "metrics",
				static: false,
				private: false,
				access: {
					has: (obj) => "metrics" in obj,
					get: (obj) => obj.metrics
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$3(this, null, _taskMetrics_decorators, {
				kind: "method",
				name: "taskMetrics",
				static: false,
				private: false,
				access: {
					has: (obj) => "taskMetrics" in obj,
					get: (obj) => obj.taskMetrics
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
		/** The service aggregates the task plane, the inbox, the versions, and the journal. */
		static {
			this.inject = [
				"tasks",
				"workbenchHost",
				"deliverables",
				"workbenchJournal"
			];
		}
		/**
		* @param ctx - Host context carrying the aggregate services.
		*/
		constructor(ctx) {
			super(ctx, "metrics");
			__runInitializers$3(this, _instanceExtraInitializers);
		}
		/**
		* Fold the whole-workbench KPI projection.
		* @returns the KPI counts, throughput buckets, and gate pass rates.
		*/
		async metrics() {
			const [tasks, snapshot, versions, facts] = await Promise.all([
				this.ctx.tasks.listTasks(),
				Promise.resolve(this.ctx.workbenchHost.listSnapshot()),
				Promise.resolve(this.ctx.deliverables.listVersions()),
				Promise.resolve(this.ctx.workbenchJournal.replay(0))
			]);
			return buildWorkbenchMetrics(tasks, snapshot.items, versions, facts);
		}
		/**
		* Fold one task's measures.
		* @param taskId - the task to measure.
		* @returns the per-task measures.
		*/
		async taskMetrics(taskId) {
			const id = this.requireText(taskId, "taskId");
			const task = await this.ctx.tasks.getTask(id);
			if (task === void 0) throw new MetricsError("not-found", "task \"" + taskId + "\" is unknown");
			const facts = this.ctx.workbenchJournal.replay(0).filter((fact) => String(fact.taskId) === String(id));
			const budget = this.ctx.get("budget")?.getBudget(id);
			return buildTaskMetrics(task, facts, budget);
		}
		/** Validate one non-empty wire field, returning the trimmed value. */
		requireText(value, field) {
			if (typeof value !== "string" || value.trim().length === 0) throw new MetricsError("invalid-argument", field + " must be a non-empty string");
			return value.trim();
		}
	};
})();
//#endregion
//#region lib/types/impact/index.js
/**
* Impact propagation (`ctx.impactPropagation`): applies one deliverable-side
* `ImpactSnapshot` to the task plane. The upstream-edit flow calls
* `deliverables.invalidateDownstream` first, then `apply` here: covered
* phase runs move into terminal `stale` through the task command (the
* engine re-opens the phase as a new run and revoked passes are re-earned),
* and covered gate verdicts are annotated stale so they support no pass
* decision. The task commands own every journal fact this flow produces.
* @module @deepseek-ai/dsh-impact-propagation
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
* Impact-propagation service: composes the frozen task commands over one
* snapshot; owns no durable state of its own.
*/
let ImpactPropagationService = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _apply_decorators;
	return class ImpactPropagationService extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_apply_decorators = [Remote("apply")];
			__esDecorate$2(this, null, _apply_decorators, {
				kind: "method",
				name: "apply",
				static: false,
				private: false,
				access: {
					has: (obj) => "apply" in obj,
					get: (obj) => obj.apply
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
		/** The service drives the task plane through the deliverable and task services. */
		static {
			this.inject = [
				"deliverables",
				"tasks",
				"workbenchJournal"
			];
		}
		/**
		* @param ctx - Host context carrying deliverables, tasks, and the workbench journal.
		*/
		constructor(ctx) {
			super(ctx, "impactPropagation");
			__runInitializers$2(this, _instanceExtraInitializers);
		}
		/**
		* Apply one impact snapshot to the task plane. Phase runs the snapshot
		* covers move into terminal `stale` (already-stale runs are skipped), then
		* the covered gate verdicts are annotated stale. The engine wakes on the
		* committed phase-run changes and re-opens covered phases as new runs.
		* @param snapshot - the impact snapshot `invalidateDownstream` returned.
		* @param mutation - actor, reason, idempotency key of the applying flow.
		* @returns the task-plane writes this call performed.
		*/
		async apply(snapshot, mutation) {
			const staledPhaseRuns = [];
			for (const phaseRunId of snapshot.affectedPhaseRuns) {
				const run = await this.ctx.tasks.getPhaseRun(String(phaseRunId));
				if (run === void 0) throw new TaskError("not-found", `snapshot covers phase run "${String(phaseRunId)}" which is not stored`);
				if (run.state === "stale") continue;
				staledPhaseRuns.push(await this.ctx.tasks.markPhaseStale(String(phaseRunId), {
					...mutation,
					expectedRevision: run.revision
				}));
			}
			const staledGateChecks = [];
			for (const group of snapshot.staledGateChecks) {
				const staled = await this.ctx.tasks.markGateChecksStale(String(group.submissionId), [...group.checkIds], mutation);
				staledGateChecks.push(...staled);
			}
			return {
				staledPhaseRuns,
				staledGateChecks
			};
		}
	};
})();
//#endregion
//#region lib/types/edit-lock/runtime.js
/**
* Runtime values of the edit-lock package: the lease-id brand constructor
* and the journal-fact sentinel for leases no task owns.
* @module @deepseek-ai/dsh-edit-lock/src/runtime
*/
/**
* Brand one wire value as a lease id.
* @param value - Wire value from the boundary.
* @returns the branded lease id.
*/
function EditLeaseId(value) {
	return value;
}
//#endregion
//#region lib/types/edit-lock/spec.js
/**
* The edit-lock storage-domain declaration: one `leases` table of durable
* lease records. The domain name and version are pre-release; no migration
* from earlier media is promised.
* @module @deepseek-ai/dsh-edit-lock/src/spec
*/
/** One durable lease record as persisted on the medium. */
const leaseSchema = z.object({
	leaseId: z.string().min(1),
	taskId: z.string().min(1).optional(),
	deliverableId: z.string().min(1),
	targetVersionId: z.string().min(1),
	owner: z.string().min(1),
	acquiredAt: z.number().int().min(1),
	renewedAt: z.number().int().min(1),
	expiresAt: z.number().int().min(1),
	entityRevision: z.number().int().min(1),
	state: z.enum([
		"active",
		"released",
		"expired"
	])
});
/** The edit-lock domain: identity, format version, and owned tables. */
const editLockDomainSpec = defineDomain({
	name: "edit_lock",
	version: 1,
	tables: { leases: domainTable(leaseSchema) }
});
//#endregion
//#region lib/types/edit-lock/types.js
/**
* Edit-lock type surface: the durable lease record and its failure codes.
* Types only — no runtime code.
* @module @deepseek-ai/dsh-edit-lock/types
*/
/** Edit-lock failure with a code and, for lock conflicts, the holder. */
var EditLockError = class extends Error {
	/**
	* @param code - Machine-routable failure code.
	* @param message - Human-readable failure description.
	* @param holder - Current holder for `lock-held`.
	* @param expiresAt - Current expiry for `lock-held`.
	*/
	constructor(code, message, holder, expiresAt) {
		super(message);
		this.code = code;
		if (holder !== void 0) this.holder = holder;
		if (expiresAt !== void 0) this.expiresAt = expiresAt;
		this.name = "EditLockError";
	}
};
//#endregion
//#region lib/types/edit-lock/index.js
/**
* Edit lock (`ctx.editLock`): durable leases over deliverable versions.
* Acquisition is first-write-wins — a held target fails loud with the
* current holder and expiry — and freezes scheduling of the phase runs that
* consume the target version; release or expiry clears the freeze. Timeout
* only breaks the lease, never commits a local buffer, and a lease never
* exempts the version-chain base check. Leases of a task that enters
* cancelling/cancelled are released through the task-updated listener.
* @module @deepseek-ai/dsh-edit-lock
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
/** The actor recorded on edit-lock facts. */
const FACT_ACTOR = "edit-lock";
/**
* Edit-lock service: durable lease records over deliverable versions.
*/
let EditLockService = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _acquire_decorators;
	let _renew_decorators;
	let _release_decorators;
	let _listActive_decorators;
	return class EditLockService extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_acquire_decorators = [Remote("acquire")];
			_renew_decorators = [Remote("renew")];
			_release_decorators = [Remote("release")];
			_listActive_decorators = [Remote("listActive")];
			__esDecorate$1(this, null, _acquire_decorators, {
				kind: "method",
				name: "acquire",
				static: false,
				private: false,
				access: {
					has: (obj) => "acquire" in obj,
					get: (obj) => obj.acquire
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _renew_decorators, {
				kind: "method",
				name: "renew",
				static: false,
				private: false,
				access: {
					has: (obj) => "renew" in obj,
					get: (obj) => obj.renew
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _release_decorators, {
				kind: "method",
				name: "release",
				static: false,
				private: false,
				access: {
					has: (obj) => "release" in obj,
					get: (obj) => obj.release
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate$1(this, null, _listActive_decorators, {
				kind: "method",
				name: "listActive",
				static: false,
				private: false,
				access: {
					has: (obj) => "listActive" in obj,
					get: (obj) => obj.listActive
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
		/** The service needs the lease domain, the journal, the task commands, and the deliverable domain. */
		static {
			this.inject = [
				"storageDomain",
				"workbenchJournal",
				"tasks",
				"deliverables"
			];
		}
		/** Deploy-variable sweep cadence; the lease TTL is an acquire argument. */
		static {
			this.Config = z.object({ sweepIntervalMs: z.number().int().min(50).default(5e3) }).default({ sweepIntervalMs: 5e3 });
		}
		/**
		* @param ctx - Host context carrying storage-domain, journal, tasks, and deliverables.
		* @param config - Optional service configuration.
		*/
		constructor(ctx, config = { sweepIntervalMs: 5e3 }) {
			super(ctx, "editLock");
			this.leases = __runInitializers$1(this, _instanceExtraInitializers);
			/** Serializes read-validate-write mutations so concurrent writers never interleave. */
			this.mutationTail = Promise.resolve();
			this.sweepIntervalMs = config.sweepIntervalMs;
		}
		/** Open and own the edit-lock domain, start the sweep, and release leases of cancelled tasks. */
		async [Service.init]() {
			const domain = await this.ctx.storageDomain.open(editLockDomainSpec);
			this.ctx.effect(() => async () => {
				await domain.close();
			}, "edit-lock.domainClose");
			this.leases = domain.table("leases");
			const timer = setInterval(() => {
				this.enqueue(() => this.expireDueNow());
			}, this.sweepIntervalMs);
			this.ctx.effect(() => () => {
				clearInterval(timer);
			}, "edit-lock.sweepTimer");
			this.ctx.on("task/updated", (task) => {
				if (task.state === "cancelling" || task.state === "cancelled") this.releaseTaskLeases(task.taskId);
			}, { global: true });
		}
		/**
		* Acquire a lease on one deliverable version. First write wins: a held
		* target fails loud with the current holder and expiry. Acquiring also
		* freezes scheduling of the phase runs that consume the target version.
		* @param deliverableId - raw deliverable identifier.
		* @param targetVersionId - raw version the holder edits; must belong to the deliverable.
		* @param owner - actor holding the lease.
		* @param ttlMs - lease time-to-live in milliseconds.
		* @param taskId - optional owning task; cancelled tasks release their leases.
		* @returns the stored lease.
		*/
		async acquire(deliverableId, targetVersionId, owner, ttlMs, taskId) {
			const deliverable = this.requireText(deliverableId, "deliverableId");
			const target = this.requireText(targetVersionId, "targetVersionId");
			const ownerName = this.requireText(owner, "owner");
			const ttl = this.requireTtl(ttlMs);
			const task = taskId === void 0 || taskId === null ? void 0 : this.requireText(taskId, "taskId");
			return this.enqueue(() => this.acquireNow(deliverable, target, ownerName, ttl, task));
		}
		/**
		* Renew a lease: advance renewedAt and expiresAt. A lapsed lease fails loud.
		* @param leaseId - raw lease identifier.
		* @param expectedRevision - the lease's current compare-and-set revision.
		* @param ttlMs - renewed time-to-live in milliseconds.
		* @returns the renewed lease.
		*/
		async renew(leaseId, expectedRevision, ttlMs) {
			const id = this.requireText(leaseId, "leaseId");
			const ttl = this.requireTtl(ttlMs);
			return this.enqueue(() => this.renewNow(id, expectedRevision, ttl));
		}
		/**
		* Release a lease explicitly and clear the consumer freezes it holds.
		* Releasing an already-released or expired lease returns it unchanged.
		* @param leaseId - raw lease identifier.
		* @param expectedRevision - the lease's current compare-and-set revision.
		* @param actor - actor releasing the lease.
		* @returns the released lease.
		*/
		async release(leaseId, expectedRevision, actor) {
			const id = this.requireText(leaseId, "leaseId");
			const actorName = this.requireText(actor, "actor");
			return this.enqueue(() => this.releaseNow(id, expectedRevision, actorName));
		}
		/**
		* List active leases, optionally filtered to one task.
		* @param taskId - optional owning task filter.
		* @returns the active leases, newest expiry last in no particular order.
		*/
		listActive(taskId) {
			const leases = this.requireLeases();
			const now = Date.now();
			const active = [];
			for (const [, lease] of leases.entries()) {
				if (lease.state !== "active") continue;
				if (lease.expiresAt <= now) continue;
				if (taskId !== void 0 && taskId !== null && String(lease.taskId ?? "") !== taskId) continue;
				active.push(lease);
			}
			return active;
		}
		async acquireNow(deliverable, target, owner, ttl, task) {
			await this.expireDueNow();
			const version = this.ctx.deliverables.getVersion(String(target));
			if (version === void 0) throw new EditLockError("not-found", `no deliverable version ${String(target)}`);
			if (version.deliverableId !== deliverable) throw new EditLockError("invalid-argument", "target version belongs to another deliverable");
			const existing = this.activeLeaseOf(deliverable);
			if (existing !== void 0) {
				if (existing.taskId === task && existing.owner === owner && existing.targetVersionId === target) return existing;
				throw new EditLockError("lock-held", `deliverable ${String(deliverable)} is already leased by ${existing.owner} until ${existing.expiresAt}`, existing.owner, existing.expiresAt);
			}
			const now = Date.now();
			const lease = {
				leaseId: EditLeaseId(randomUUID()),
				...task === void 0 ? {} : { taskId: task },
				deliverableId: deliverable,
				targetVersionId: target,
				owner,
				acquiredAt: now,
				renewedAt: now,
				expiresAt: now + ttl,
				entityRevision: 1,
				state: "active"
			};
			await this.appendFact("edit-lock/acquired", lease);
			await this.requireLeases().put(String(lease.leaseId), lease);
			await this.freezeConsumers(lease);
			return lease;
		}
		async renewNow(id, expectedRevision, ttl) {
			await this.expireDueNow();
			const lease = this.loadLeaseOrThrow(id);
			if (lease.state !== "active") throw new EditLockError("invalid-transition", `lease is ${lease.state}`);
			if (lease.entityRevision !== expectedRevision) throw new EditLockError("invalid-transition", "lease revision mismatch");
			const now = Date.now();
			const next = {
				...lease,
				renewedAt: now,
				expiresAt: now + ttl,
				entityRevision: lease.entityRevision + 1
			};
			await this.appendFact("edit-lock/renewed", next);
			await this.requireLeases().put(String(id), next);
			return next;
		}
		async releaseNow(id, expectedRevision, _actor) {
			await this.expireDueNow();
			const lease = this.loadLeaseOrThrow(id);
			if (lease.state !== "active") return lease;
			if (lease.entityRevision !== expectedRevision) throw new EditLockError("invalid-transition", "lease revision mismatch");
			const next = {
				...lease,
				state: "released",
				entityRevision: lease.entityRevision + 1
			};
			await this.appendFact("edit-lock/released", next);
			await this.requireLeases().put(String(id), next);
			await this.unfreezeConsumers(lease);
			return next;
		}
		/** Lapse every active lease whose expiry passed; the sweep and every write path call this. */
		async expireDueNow() {
			const now = Date.now();
			for (const [, lease] of [...this.requireLeases().entries()]) if (lease.state === "active" && lease.expiresAt <= now) await this.expireOne(lease);
		}
		async expireOne(lease) {
			const next = {
				...lease,
				state: "expired",
				entityRevision: lease.entityRevision + 1
			};
			await this.appendFact("edit-lock/expired", next);
			await this.requireLeases().put(String(lease.leaseId), next);
			await this.unfreezeConsumers(lease);
		}
		/** Release every active lease owned by one task; the task-updated listener calls this on cancel. */
		async releaseTaskLeases(taskId) {
			await this.enqueue(async () => {
				await this.expireDueNow();
				for (const [, lease] of [...this.requireLeases().entries()]) {
					if (lease.state !== "active" || lease.taskId !== taskId) continue;
					const next = {
						...lease,
						state: "released",
						entityRevision: lease.entityRevision + 1
					};
					await this.appendFact("edit-lock/released", next);
					await this.requireLeases().put(String(lease.leaseId), next);
					await this.unfreezeConsumers(lease);
				}
			});
		}
		/** Freeze the phase runs consuming the leased version from scheduling. */
		async freezeConsumers(lease) {
			for (const runId of this.ctx.deliverables.listConsumingPhaseRuns(String(lease.targetVersionId))) {
				const run = await this.ctx.tasks.getPhaseRun(String(runId));
				if (run === void 0 || run.schedulingFrozen === true) continue;
				await this.ctx.tasks.freezePhaseScheduling(String(runId), this.freezeMutation(lease, run.revision, true));
			}
		}
		/** Clear the consumer freezes a lease held. */
		async unfreezeConsumers(lease) {
			for (const runId of this.ctx.deliverables.listConsumingPhaseRuns(String(lease.targetVersionId))) {
				const run = await this.ctx.tasks.getPhaseRun(String(runId));
				if (run === void 0 || run.schedulingFrozen !== true) continue;
				await this.ctx.tasks.clearPhaseScheduling(String(runId), this.freezeMutation(lease, run.revision, false));
			}
		}
		freezeMutation(lease, runRevision, freeze) {
			return {
				actor: lease.owner,
				reason: `edit-lock ${freeze ? "acquired" : "released"} on ${String(lease.targetVersionId)}`,
				expectedRevision: runRevision,
				idempotencyKey: `edit-lock:${freeze ? "freeze" : "unfreeze"}:${String(lease.leaseId)}:${String(lease.targetVersionId)}`
			};
		}
		activeLeaseOf(deliverable) {
			for (const [, lease] of this.requireLeases().entries()) if (lease.state === "active" && lease.expiresAt > Date.now() && lease.deliverableId === deliverable) return lease;
		}
		loadLeaseOrThrow(id) {
			const lease = this.requireLeases().get(String(id));
			if (lease === void 0) throw new EditLockError("not-found", `no lease ${String(id)}`);
			return lease;
		}
		async appendFact(kind, lease) {
			const payload = {
				leaseId: String(lease.leaseId),
				deliverableId: String(lease.deliverableId),
				targetVersionId: String(lease.targetVersionId),
				...lease.taskId === void 0 ? {} : { taskId: String(lease.taskId) },
				owner: lease.owner,
				acquiredAt: lease.acquiredAt,
				renewedAt: lease.renewedAt,
				expiresAt: lease.expiresAt,
				state: lease.state
			};
			const label = kind.split("/")[1];
			await this.ctx.workbenchJournal.append({
				taskId: lease.taskId ?? "edit-lock",
				kind,
				actor: FACT_ACTOR,
				idempotencyKey: `edit-lock/${label}:${String(lease.leaseId)}:${lease.entityRevision}`,
				entityRevision: lease.entityRevision,
				payload
			});
		}
		requireLeases() {
			if (this.leases === void 0) throw new EditLockError("not-found", "edit_lock domain is not open");
			return this.leases;
		}
		requireText(value, field) {
			if (typeof value !== "string" || value.trim() === "") throw new EditLockError("invalid-argument", `${field} must be a non-blank string`);
			return value;
		}
		requireTtl(ttlMs) {
			if (typeof ttlMs !== "number" || !Number.isFinite(ttlMs) || ttlMs <= 0) throw new EditLockError("invalid-argument", "ttlMs must be a positive number");
			return Math.floor(ttlMs);
		}
		/** Run one mutation after every earlier one settles. */
		enqueue(step) {
			const result = this.mutationTail.then(step);
			this.mutationTail = result.then(() => void 0, () => void 0);
			return result;
		}
	};
})();
//#endregion
//#region lib/types/task-local/spec.js
/**
* The task-local storage-domain declaration: one table per task-flow
* entity, keyed by the entity's branded id, plus the per-submission gate
* result list. Fact keys pair each projection write with its journal fact.
* @module @deepseek-ai/dsh-task-local/src/spec
*/
/** Wire string branded at the durable boundary. */
const idString = z.string().min(1);
/** Frozen recipe identity pinned on task and run records. */
const pinnedRecipe = z.object({
	recipeId: idString,
	revision: z.number().int().min(1),
	schemaVersion: z.number().int().min(1),
	contentHash: z.string().min(1)
});
/** Durable task projection schema. */
const taskRecordSchema = z.object({
	taskId: idString,
	workspaceId: idString,
	pinnedRecipe,
	state: z.enum([
		"planning",
		"running",
		"awaiting-input",
		"awaiting-decision",
		"pausing",
		"paused",
		"cancelling",
		"cancelled",
		"completed",
		"failed"
	]),
	revision: z.number().int().min(1),
	currentRunId: idString.optional(),
	idempotencyKey: z.string().min(1).optional(),
	createdAt: z.number().int().min(1)
});
/** Durable task-run projection schema. */
const taskRunRecordSchema = z.object({
	runId: idString,
	taskId: idString,
	pinnedRecipe,
	revision: z.number().int().min(1),
	parentRunId: idString.optional(),
	createdAt: z.number().int().min(1)
});
/** Durable phase-run projection schema. */
const phaseRunRecordSchema = z.object({
	phaseRunId: idString,
	runId: idString,
	taskId: idString,
	phaseId: idString,
	state: z.enum([
		"created",
		"scheduled",
		"running",
		"submitting",
		"submitted",
		"gate-running",
		"awaiting-input",
		"awaiting-decision",
		"patching",
		"stale",
		"passed",
		"failed",
		"superseded",
		"cancelled"
	]),
	revision: z.number().int().min(1),
	activeSubmissionId: idString.optional(),
	sessionId: z.string().optional(),
	schedulingFrozen: z.boolean().optional()
});
/** Deliverable version reference inside a submission. */
const versionRef = z.object({
	deliverableId: idString,
	versionId: idString
});
/** Immutable phase submission schema. */
const phaseSubmissionSchema = z.object({
	submissionId: idString,
	taskId: idString,
	taskRunId: idString,
	phaseRunId: idString,
	phaseId: idString,
	attempt: z.number().int().min(1),
	pinnedRecipe,
	sourceSessionId: idString,
	sourceSeqRange: z.object({
		start: z.number().int().min(0),
		end: z.number().int().min(0)
	}),
	inputVersions: z.array(versionRef),
	outputVersions: z.array(versionRef),
	unresolvedIssues: z.array(z.string()),
	result: z.enum([
		"completed",
		"needs-clarification",
		"failed"
	]),
	failureReason: z.string().optional(),
	idempotencyKey: z.string().min(1),
	submittedAt: z.number().int().min(1),
	supersedesSubmissionId: idString.optional()
});
/** Gate-check verdict list stored per submission, in recording order. */
const gateResultsSchema = z.array(z.object({
	submissionId: idString,
	checkId: idString,
	passed: z.boolean(),
	detail: z.string().optional(),
	recordedAt: z.number().int().min(1),
	uncoveredScope: z.array(z.string()).optional(),
	evidenceRefs: z.array(z.string()).optional()
}));
/** The task-local domain: identity, format version, and the entity tables. */
const taskLocalDomainSpec = defineDomain({
	name: "task_local",
	version: 1,
	tables: {
		tasks: domainTable(taskRecordSchema),
		task_runs: domainTable(taskRunRecordSchema),
		phase_runs: domainTable(phaseRunRecordSchema),
		submissions: domainTable(phaseSubmissionSchema),
		gate_results: domainTable(gateResultsSchema)
	}
});
/**
* Journal-fact idempotency key of one projection write: deterministic in
* the post-commit entity revision, so a retried write replays the stored
* fact instead of appending a second one.
* @param kind - the fact kind this provider owns for the write.
* @param entityId - the written entity's id.
* @param entityRevision - the post-commit revision the write produced.
* @returns the deterministic fact key.
*/
function taskFactKey(kind, entityId, entityRevision) {
	return `${kind}:${entityId}:${entityRevision}`;
}
//#endregion
//#region lib/types/task-local/index.js
/**
* Task-local durable task provider (`ctx.tasks`): implements the TaskHandle
* storage hooks over one storageDomain unit. Each write appends its journal
* fact first - the append is the commit point of the write - then persists
* the projection, so replay rebuilds projections and Cordis events stay
* droppable wake-ups. Submission acceptance validates deliverable refs
* inside the task write chain through the injected minimal deliverable
* service.
* @module @deepseek-ai/dsh-task-local
*/
/** Durable TaskHandle provider over one storageDomain unit. */
var LocalTaskService = class extends TaskHandle {
	/** The provider opens its domain, the journal, the deliverable service, and the live session store. */
	static {
		this.inject = [
			"storageDomain",
			"workbenchJournal",
			"deliverables",
			"sessions"
		];
	}
	/** Session-inheritance tunables (entry B seed); deployment-variable via Config. */
	static {
		this.Config = z.object({
			/** How many recent source user-messages become seed points at most. */
			seedMaxPoints: z.number().int().min(0).max(200).default(20),
			/** Per-point character ceiling applied before journaling the seed. */
			seedMaxPointLength: z.number().int().min(1).max(1e5).default(4e3)
		}).default({
			seedMaxPoints: 20,
			seedMaxPointLength: 4e3
		});
	}
	/**
	* @param ctx - Host context carrying the storage-domain facility, the
	* workbench journal, the deliverable service, and the live session store.
	* @param config - Optional session-inheritance tunables.
	*/
	constructor(ctx, config = {
		seedMaxPoints: 20,
		seedMaxPointLength: 4e3
	}) {
		super(ctx);
		this.seedMaxPoints = config.seedMaxPoints;
		this.seedMaxPointLength = config.seedMaxPointLength;
	}
	/** Open and own the task-local domain tables. */
	async [Service.init]() {
		const domain = await this.ctx.storageDomain.open(taskLocalDomainSpec);
		this.ctx.effect(() => async () => {
			await domain.close();
		}, "task-local.domainClose");
		this.tasks = domain.table("tasks");
		this.runs = domain.table("task_runs");
		this.phaseRuns = domain.table("phase_runs");
		this.submissions = domain.table("submissions");
		this.gateResults = domain.table("gate_results");
	}
	loadTask(taskId) {
		return Promise.resolve(this.require(this.tasks).get(taskId));
	}
	loadTaskByIdempotencyKey(key) {
		for (const [, task] of this.require(this.tasks).entries()) if (task.idempotencyKey === key) return Promise.resolve(task);
		return Promise.resolve(void 0);
	}
	loadAllTasks() {
		return Promise.resolve([...this.require(this.tasks).entries()].map(([, task]) => task));
	}
	async saveTask(task, provenance) {
		const stored = this.require(this.tasks).get(task.taskId);
		if (stored !== void 0 && stored.revision !== task.revision - 1) return false;
		await this.appendFact({
			kind: "task/updated",
			taskId: task.taskId,
			entityId: task.taskId,
			entityRevision: task.revision,
			provenance,
			payload: task
		});
		await this.require(this.tasks).put(task.taskId, task);
		return true;
	}
	loadRun(runId) {
		return Promise.resolve(this.require(this.runs).get(runId));
	}
	async saveRun(run, provenance) {
		const stored = this.require(this.runs).get(run.runId);
		if (stored !== void 0 && stored.revision !== run.revision - 1) return false;
		await this.appendFact({
			kind: "task-run/updated",
			taskId: run.taskId,
			entityId: run.runId,
			entityRevision: run.revision,
			provenance,
			payload: run
		});
		await this.require(this.runs).put(run.runId, run);
		return true;
	}
	loadPhaseRun(phaseRunId) {
		return Promise.resolve(this.require(this.phaseRuns).get(phaseRunId));
	}
	loadPhaseRunsOfRun(runId) {
		return Promise.resolve([...this.require(this.phaseRuns).entries()].map(([, phase]) => phase).filter((phase) => phase.runId === runId));
	}
	async savePhaseRun(phaseRun, provenance) {
		const stored = this.require(this.phaseRuns).get(phaseRun.phaseRunId);
		if (stored !== void 0 && stored.revision !== phaseRun.revision - 1) return false;
		await this.appendFact({
			kind: "phase-run/updated",
			taskId: phaseRun.taskId,
			entityId: phaseRun.phaseRunId,
			entityRevision: phaseRun.revision,
			provenance,
			payload: phaseRun
		});
		await this.require(this.phaseRuns).put(phaseRun.phaseRunId, phaseRun);
		return true;
	}
	loadSubmission(submissionId) {
		return Promise.resolve(this.require(this.submissions).get(submissionId));
	}
	loadSubmissionByIdempotencyKey(key) {
		for (const [, submission] of this.require(this.submissions).entries()) if (submission.idempotencyKey === key) return Promise.resolve(submission);
		return Promise.resolve(void 0);
	}
	async saveSubmission(submission, provenance) {
		await this.appendFact({
			kind: "submission/recorded",
			taskId: submission.taskId,
			entityId: submission.submissionId,
			entityRevision: 1,
			provenance,
			payload: submission
		});
		await this.require(this.submissions).put(submission.submissionId, submission);
	}
	loadGateResults(submissionId) {
		return Promise.resolve([...this.require(this.gateResults).get(submissionId) ?? []]);
	}
	async staleGateChecks(submissionId, checkIds, provenance) {
		const submission = this.require(this.submissions).get(submissionId);
		if (submission === void 0) throw new TaskError("not-found", "submission of a gate check is not stored");
		const wanted = new Set(checkIds);
		const existing = [...this.require(this.gateResults).get(submissionId) ?? []];
		const staled = [];
		const next = existing.map((result, index) => {
			if (!wanted.has(result.checkId) || result.stale === true) return result;
			const annotated = {
				...result,
				stale: true
			};
			staled.push({
				result: annotated,
				position: index + 1
			});
			return annotated;
		});
		for (const entry of staled) await this.appendFact({
			kind: "gate-check/staled",
			taskId: submission.taskId,
			entityId: submissionId,
			entityRevision: entry.position,
			provenance,
			payload: entry.result
		});
		if (staled.length > 0) await this.require(this.gateResults).put(submissionId, next);
		return staled.map((entry) => entry.result);
	}
	async saveGateResult(result, provenance) {
		const submission = this.require(this.submissions).get(result.submissionId);
		if (submission === void 0) throw new TaskError("not-found", "submission of a gate check is not stored");
		const existing = this.require(this.gateResults).get(result.submissionId) ?? [];
		if (existing.some((stored) => sameGateCheck(stored, result))) return;
		const next = [...existing, result];
		await this.appendFact({
			kind: "gate-check/recorded",
			taskId: submission.taskId,
			entityId: result.submissionId,
			entityRevision: next.length,
			provenance,
			payload: result
		});
		await this.require(this.gateResults).put(result.submissionId, next);
	}
	resolveSubmissionEnvironment(submission, environment) {
		const deliverables = this.ctx.deliverables;
		const inputsCurrent = submission.inputVersions.every((ref) => {
			const version = deliverables.getVersion(ref.versionId);
			return version !== void 0 && version.deliverableId === ref.deliverableId && version.state === "current";
		});
		const outputsValid = submission.outputVersions.every((ref) => {
			const version = deliverables.getVersion(ref.versionId);
			return version !== void 0 && version.deliverableId === ref.deliverableId && version.sourceSubmissionId === submission.submissionId;
		});
		return Promise.resolve({
			...environment,
			inputsCurrent,
			outputsValid
		});
	}
	/** At acceptance the write chain owns both durable registrations: the run's input versions and the output versions' dependency edges. */
	async onSubmissionAccepted(submission) {
		if (submission.inputVersions.length === 0) return;
		await this.ctx.deliverables.recordPhaseInputs(submission.phaseRunId, submission.inputVersions.map((ref) => ref.versionId));
		for (const output of submission.outputVersions) await this.ctx.deliverables.registerVersionDependencies(output.versionId, submission.inputVersions);
	}
	/**
	* Derive the session-inherited seed points from a live source conversation:
	* the content of the most recent user messages (newest-last), each truncated
	* at the point ceiling. Declined inheritance or an unknown source yields none.
	*/
	resolveSeedPoints(sourceSessionId, inheritSession) {
		if (!inheritSession) return Promise.resolve([]);
		const session = this.ctx.sessions.get(sourceSessionId);
		if (session === void 0) return Promise.resolve([]);
		const recent = session.events.filter((event) => event.type === "user/message").slice(-this.seedMaxPoints);
		const points = [];
		for (const event of recent) {
			const text = event.data.content.filter((block) => block.type === "text").map((block) => block.text).join("").trim();
			if (text.length === 0) continue;
			points.push({ text: text.slice(0, this.seedMaxPointLength) });
		}
		return Promise.resolve(points);
	}
	/**
	* Persist the confirmed-creation seed as one idempotent journal fact; a
	* re-confirmed replay returns the originally stored points without a write.
	*/
	async persistConfirmSeed(task, content, idempotencyKey, actor) {
		const factKey = "task/seed-created:" + idempotencyKey;
		const existing = this.ctx.workbenchJournal.replay(0).find((fact) => fact.idempotencyKey === factKey);
		if (existing !== void 0) return [...existing.payload.points];
		const payload = {
			goal: content.goal,
			sourceSessionId: content.sourceSessionId,
			points: content.points.map((point) => ({ text: point.text }))
		};
		await this.ctx.workbenchJournal.append({
			taskId: task.taskId,
			kind: TASK_SEED_FACT_KIND,
			actor,
			idempotencyKey: factKey,
			entityRevision: task.revision,
			payload
		});
		return [...content.points];
	}
	/**
	* Append one journal fact; the durable append is the commit point of
	* the write, so the projection put that follows can rebuild from replay.
	* @param input - the fact fields; the journal assigns the envelope.
	*/
	async appendFact(input) {
		await this.ctx.workbenchJournal.append({
			taskId: input.taskId,
			kind: input.kind,
			actor: input.provenance.actor,
			idempotencyKey: taskFactKey(input.kind, input.entityId, input.entityRevision),
			entityRevision: input.entityRevision,
			payload: input.payload
		});
	}
	/** The opened table; absent before service start or after disposal. */
	require(table) {
		if (table === void 0) throw new TaskError("invalid-argument", "task-local storage is not open");
		return table;
	}
};
/** Whether two stored gate-check verdicts are the same recording. */
function sameGateCheck(stored, result) {
	return stored.submissionId === result.submissionId && stored.checkId === result.checkId && stored.recordedAt === result.recordedAt;
}
//#endregion
//#region lib/types/tool-task-create/index.js
/**
* Model-facing task creation (entry B). Each call turns an explicit create
* request into a confirmation proposal: it validates the inferred recipe,
* records the goal and the session-inheritance choice, and returns the
* metadata the confirmation card renders. Creation itself is deferred to
* the human — the tool never creates (v1 responds to explicit intent only;
* the confirm step owns createTask and the session seed).
* @module @deepseek-ai/dsh-tool-task-create
*/
var tool_task_create_exports = /* @__PURE__ */ __exportAll({
	apply: () => apply$1,
	inject: () => inject$1,
	name: () => name$1
});
const name$1 = "tool-task-create";
const inject$1 = ["tools", "recipes"];
let idempotencySeq = 0;
/** One pre-create lookup: confirm the recipe exists and read its shape for the card. */
function proposalOf(ctx, input) {
	const recipeId = input.recipeId.trim();
	if (recipeId.length === 0) throw new Error("task-create: recipeId must be a non-empty string");
	const latest = ctx.recipes.latest(recipeId);
	if (latest === void 0) throw new Error("task-create: unknown recipe \"" + recipeId + "\"");
	const payload = latest.payload;
	idempotencySeq += 1;
	return {
		recipeId: latest.recipeId,
		goal: input.goal.trim(),
		inheritSession: input.inheritSession,
		phaseCount: payload.phases.length,
		checks: payload.gateChecks.length,
		idempotencyKey: "task-create:" + recipeId + ":" + Date.now().toString(36) + ":" + String(idempotencySeq)
	};
}
const DESCRIPTION = "Create a flow task from an explicit request. Given a recipe the human names (e.g. a research pipeline), the goal, and whether to seed the first phase from the current session, return a confirmation proposal — the task is NOT created until the human confirms the rendered card. Respond to explicit create intent only; never suggest a task unprompted.";
/**
* Register the task_create tool on ctx.tools.
* @param ctx - registrant context carrying the tool registry and the recipe registry.
*/
function apply$1(ctx) {
	ctx.tools.register(defineTool({
		name: "task_create",
		description: DESCRIPTION,
		parameters: {
			recipeId: {
				type: "string",
				required: true,
				description: "The inferred recipe id (the task template the goal fits)."
			},
			goal: {
				type: "string",
				required: true,
				description: "A short summary of the desired outcome; seeds the first phase on confirm."
			},
			inheritSession: {
				type: "boolean",
				required: true,
				description: "Whether to derive the first phase from the current session discussion."
			}
		},
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: {
					recipeId: {
						type: "string",
						required: true
					},
					goal: {
						type: "string",
						required: true
					},
					inheritSession: {
						type: "boolean",
						required: true
					},
					phaseCount: {
						type: "integer",
						required: true
					},
					checks: {
						type: "integer",
						required: true
					},
					idempotencyKey: {
						type: "string",
						required: true
					}
				}
			},
			render: (_args, value) => [{
				type: "text",
				text: "Proposed a \"" + value.recipeId + "\" task (" + String(value.phaseCount) + " phases, " + String(value.checks) + " checks, inherit=" + String(value.inheritSession) + "). Creation awaits human confirmation."
			}],
			presentationMeta: (_args, value) => value
		},
		execute(args, _exec) {
			const input = args;
			return Promise.resolve(proposalOf(ctx, input));
		},
		presentCall: (args) => ({
			card: "generic",
			title: "Create flow task",
			kind: "other",
			rawInput: args
		})
	}));
}
//#endregion
//#region lib/types/workbench/host-stream/index.js
/**
* Attention incremental-stream host service (`ctx.workbenchHostStream`):
* projects the workbench journal's attention facts into a cursor-ordered
* change stream. A client reads a snapshot, then advances by `cursor`
* (a journal sequence) with `listIncremental`; events carry the journal
* event id for dedupe and the post-commit entity revision for optimistic
* concurrency. The stream id is a per-boot epoch: when it changes the client
* discards its cursor and resnapshots.
* @module @deepseek-ai/dsh-workbench-host-stream
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
/** Fact-kind prefix of every attention fact this stream narrows. */
const ATTENTION_KIND_PREFIX = "attention/";
/** Narrow one journal fact kind to its stream operation. */
function operationOf(kind) {
	switch (kind) {
		case "attention/item-created": return "created";
		case "attention/item-resolved": return "resolved";
		case "attention/item-invalidated": return "invalidated";
		default: return "updated";
	}
}
/** Extract the itemId a fact mutated; attention facts always carry a string itemId. */
function entityIdOf(fact) {
	const payload = fact.payload;
	if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) {
		const itemId = payload["itemId"];
		if (typeof itemId === "string") return itemId;
	}
	return "";
}
/** Project one attention journal fact into the stream envelope. */
function eventOf(fact) {
	return {
		cursor: fact.journalSeq,
		previousCursor: fact.journalSeq - 1,
		eventId: String(fact.eventId),
		entityKind: "attention",
		entityId: entityIdOf(fact),
		entityRevision: fact.entityRevision,
		operation: operationOf(fact.kind),
		payload: fact.payload
	};
}
/**
* Attention incremental stream: the M4 cursor-based change feed over the
* persistent attention inbox, derived from the append-only workbench journal.
*/
let WorkbenchHostStreamService = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _listIncremental_decorators;
	return class WorkbenchHostStreamService extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_listIncremental_decorators = [Remote("listIncremental")];
			__esDecorate(this, null, _listIncremental_decorators, {
				kind: "method",
				name: "listIncremental",
				static: false,
				private: false,
				access: {
					has: (obj) => "listIncremental" in obj,
					get: (obj) => obj.listIncremental
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
		/** The service reads the workbench journal; it owns no durable domain. */
		static {
			this.inject = ["workbenchJournal"];
		}
		constructor(ctx) {
			super(ctx, "workbenchHostStream");
			/** Per-boot epoch; a client holding a cursor from another boot resnapshots. */
			this.streamId = (__runInitializers(this, _instanceExtraInitializers), randomUUID());
		}
		/**
		* Read the attention change events after a journal cursor and the new cursor.
		* @param cursor - exclusive journal lower bound; omitted or non-positive replays the whole stream.
		* @returns the events in journal order plus this boot's stream id and cursor.
		*/
		listIncremental(cursor) {
			const after = cursor === void 0 || !Number.isFinite(cursor) || cursor <= 0 ? 0 : Math.floor(cursor);
			const events = this.ctx.workbenchJournal.replay(after).filter((fact) => fact.kind.startsWith(ATTENTION_KIND_PREFIX)).map(eventOf);
			return {
				streamId: this.streamId,
				cursor: this.ctx.workbenchJournal.checkpoint().journalSeq,
				events
			};
		}
	};
})();
//#endregion
//#region lib/types/plugin.js
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
/** Plugin display name: the `dsh web` fiber identity on the mounted host. */
const name = "dsh-task-flow-host";
/**
* External platform services the folded domains require; the host provides
* them (never this package). Declaring them on the outer plugin keeps it
* PENDING until the host exposes all of them, so every `ctx.plugin(...)`
* below resolves without a dangling service probe.
*/
const inject = [
	"storageDomain",
	"sessions",
	"agents",
	"goals",
	"tools"
];
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
	tool_task_create_exports,
	LocalTaskService,
	RecipeEngineCore
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
	7,
	6,
	8,
	17,
	18,
	3,
	0,
	1,
	2,
	12,
	13,
	14,
	9,
	10,
	11,
	4,
	15,
	5,
	16
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
async function apply(ctx) {
	const fibers = HOST_DOMAINS.map((domain) => ctx.plugin(domain));
	for (const position of LOAD_ORDER) {
		const fiber = fibers[position];
		if (fiber === void 0) continue;
		await fiber.await();
	}
}
//#endregion
export { AttentionError, AttentionItemId, AttentionService, BUGFIX_RECIPE_ID, BUGFIX_TEMPLATE, BudgetError, BudgetRecordId, BudgetService, CODE_REVIEW_RECIPE_ID, CODE_REVIEW_TEMPLATE, ClarificationError, ClarificationQuestionId, ClarificationRequestId, ClarificationService, DeliverableError, DeliverableId, DeliverableService, DeliverableVersionId, DigestError, DigestService, EMPTY_TEMPLATE, EMPTY_TEMPLATE_RECIPE_ID, EditLeaseId, EditLockError, EditLockService, GateService, ImpactPropagationService, ImpactSnapshotId, JOURNAL_SEQ_KEY_WIDTH, JournalError, JournalEventId, LocalTaskService, MetricsError, MetricsService, PhaseRunId, REQUIREMENT_RECIPE_ID, REQUIREMENT_TEMPLATE, REWIND_OPTIONS, RecipeEngineCore, RecipeError, RecipeId, RecipeMultiphaseError, RecipeMultiphaseService, RecipeRegistry, ReviewPolicyError, ReviewPolicyRecordId, ReviewPolicyService, RewindError, RewindService, SubmissionId, TASK_SEED_FACT_KIND, TaskError, TaskHandle, TaskId, TaskRunId, WorkbenchHostService, WorkbenchHostStreamService, WorkbenchItemId, WorkbenchJournalService, acceptSubmission, answerSchema, apply, attentionDomainSpec, attentionItemSchema, breakerCounterSchema, budgetDomainSpec, budgetRecordSchema, canCompleteTask, clarificationDomainSpec, clarificationRequestSchema, deliverableLocalDomainSpec, deliverableVersionSchema, editLockDomainSpec, gateResultsSchema, hashRecipePayload, inject, itemKeySchema, journalFactSchema, journalSeqKey, leaseSchema, name, phaseInputsSchema, phaseRunRecordSchema, phaseSubmissionSchema, phaseTransition, questionSchema, reviewPolicyDomainSpec, reviewPolicyRecordSchema, taskFactKey, taskLocalDomainSpec, taskRecordSchema, taskRunRecordSchema, taskTransition, validateRecipePayload, verifyRecipeHash, workbenchJournalDomainSpec };
