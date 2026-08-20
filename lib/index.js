import { createHash } from "node:crypto";
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
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
			__esDecorate(this, null, _register_decorators, {
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
			__esDecorate(this, null, _getPinned_decorators, {
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
			__esDecorate(this, null, _latest_decorators, {
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
			__esDecorate(this, null, _list_decorators, {
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
			__esDecorate(this, null, _listDetails_decorators, {
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
		revisions = (__runInitializers(this, _instanceExtraInitializers), /* @__PURE__ */ new Map());
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
export { BUGFIX_RECIPE_ID, BUGFIX_TEMPLATE, CODE_REVIEW_RECIPE_ID, CODE_REVIEW_TEMPLATE, EMPTY_TEMPLATE, EMPTY_TEMPLATE_RECIPE_ID, REQUIREMENT_RECIPE_ID, REQUIREMENT_TEMPLATE, RecipeError, RecipeId, RecipeRegistry, RecipeRegistry as default, hashRecipePayload, validateRecipePayload, verifyRecipeHash };
