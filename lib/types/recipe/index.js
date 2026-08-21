/**
 * Immutable recipe revision registry (`ctx.recipes`): validated payloads,
 * content-addressed revisions, pinned-identity reads with hash verification,
 * and the built-in empty-template revision for new tasks. Storage is
 * in-memory in M1 — the filesystem provider registers real recipes later,
 * and the registry surface does not change.
 * @module @deepseek-ai/dsh-recipe
 */
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { createHash } from 'node:crypto';
import { Service } from '@deepseek-ai/cordis';
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { RecipeId } from "./runtime.js";
import { EMPTY_TEMPLATE, EMPTY_TEMPLATE_RECIPE_ID } from "./empty-template.js";
import { BUGFIX_RECIPE_ID, BUGFIX_TEMPLATE, CODE_REVIEW_RECIPE_ID, CODE_REVIEW_TEMPLATE, REQUIREMENT_RECIPE_ID, REQUIREMENT_TEMPLATE, } from "./seed-templates.js";
import { RecipeError } from "./types.js";
import { recipeStoreDomainSpec } from "./spec.js";
export { RecipeError } from "./types.js";
export { RecipeId } from "./runtime.js";
export { recipeStoreDomainSpec } from "./spec.js";
export { EMPTY_TEMPLATE, EMPTY_TEMPLATE_RECIPE_ID } from "./empty-template.js";
export { BUGFIX_RECIPE_ID, BUGFIX_TEMPLATE, CODE_REVIEW_RECIPE_ID, CODE_REVIEW_TEMPLATE, REQUIREMENT_RECIPE_ID, REQUIREMENT_TEMPLATE, } from "./seed-templates.js";
/**
 * Registry-level validation of one revision payload.
 * @param payload - the candidate revision payload.
 * @returns problem descriptions; empty when the payload is valid.
 */
export function validateRecipePayload(payload) {
    const problems = [];
    if (payload.phases.length === 0)
        problems.push('payload requires at least one phase');
    const phaseIds = new Set();
    for (const phase of payload.phases) {
        if (phaseIds.has(phase.phaseId))
            problems.push(`duplicate phaseId "${phase.phaseId}"`);
        phaseIds.add(phase.phaseId);
        if (typeof phase.kind !== 'string' || phase.kind.trim() === '')
            problems.push(`phase "${phase.phaseId}" requires a non-blank kind`);
    }
    const checkIds = new Set();
    for (const check of payload.gateChecks) {
        if (checkIds.has(check.checkId))
            problems.push(`duplicate checkId "${check.checkId}"`);
        checkIds.add(check.checkId);
        if (!phaseIds.has(check.phaseId))
            problems.push(`check "${check.checkId}" names unknown phaseId "${check.phaseId}"`);
    }
    problems.push(...validateBreakers(payload));
    problems.push(...validateDefaults(payload.defaults));
    return problems;
}
/** Breaker-shape validation: every declared fuse key is explicit, unique, and referenced. */
function validateBreakers(payload) {
    const problems = [];
    const breakerKeys = new Set();
    const checkBreakerRefs = new Set();
    for (const breaker of payload.breakers ?? []) {
        if (typeof breaker.key !== 'string' || breaker.key.trim() === '') {
            problems.push('breaker key must be a non-blank string');
            continue;
        }
        if (breakerKeys.has(breaker.key))
            problems.push(`duplicate breaker key "${breaker.key}"`);
        breakerKeys.add(breaker.key);
        if (!Number.isSafeInteger(breaker.maxConsecutiveRepairs) || breaker.maxConsecutiveRepairs < 1) {
            problems.push(`breaker "${breaker.key}" maxConsecutiveRepairs must be a positive safe integer`);
        }
    }
    for (const check of payload.gateChecks) {
        if (check.circuitBreaker !== undefined)
            checkBreakerRefs.add(check.circuitBreaker);
    }
    for (const key of breakerKeys) {
        if (!checkBreakerRefs.has(key))
            problems.push(`breaker key "${key}" names no check circuitBreaker`);
    }
    return problems;
}
/** Wire-valid batch-confirm strategies. */
const BATCH_CONFIRM_VALUES = ['per-phase-single', 'per-check'];
/** Wire-valid draft policies; the frozen recipe pins one. */
const DRAFT_POLICY_VALUES = ['block-finalize-not-draft'];
/** Defaults-shape validation. */
function validateDefaults(defaults) {
    const problems = [];
    if (defaults === undefined) {
        problems.push('payload requires defaults');
        return problems;
    }
    if (!BATCH_CONFIRM_VALUES.includes(defaults.batchConfirm)) {
        problems.push('defaults.batchConfirm must be per-phase-single or per-check');
    }
    if (!Number.isSafeInteger(defaults.clarify.maxRounds) || defaults.clarify.maxRounds < 1) {
        problems.push('defaults.clarify.maxRounds must be a positive safe integer');
    }
    if (typeof defaults.clarify.splitMustDefault !== 'boolean') {
        problems.push('defaults.clarify.splitMustDefault must be boolean');
    }
    if (!DRAFT_POLICY_VALUES.includes(defaults.draftPolicy)) {
        problems.push('defaults.draftPolicy must be block-finalize-not-draft');
    }
    return problems;
}
/**
 * Content hash of one revision payload, stable over JSON key order.
 * @param payload - the canonical revision payload.
 * @returns the lowercase hex sha256 digest.
 */
export function hashRecipePayload(payload) {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
/**
 * Fail loud when a stored revision's hash no longer matches its payload.
 * Pure and exported so both `getPinned` and the unit suite exercise the
 * corruption path directly.
 * @param revision - the stored revision under verification.
 */
export function verifyRecipeHash(revision) {
    if (revision.contentHash !== hashRecipePayload(revision.payload)) {
        throw new RecipeError('hash-mismatch', `recipe "${revision.recipeId}" revision ${revision.revision} failed its content-hash check`);
    }
}
/**
 * Immutable recipe revision registry (`ctx.recipes`): validated payloads,
 * content-addressed revisions, pinned-identity reads with hash verification,
 * and a durable recipe catalogue with create/update/delete management. The
 * in-process Map stays the synchronous read authority; when a `storageDomain`
 * backend is mounted the registry additionally persists every revision and the
 * soft-delete markers into a `recipe_store` domain, reloading them on init and
 * writing through on every mutation. Without a backend (pure unit contexts) it
 * degrades to the M1 in-memory registry, so isolated suites keep constructing
 * `new RecipeRegistry(ctx)` untouched.
 */
let RecipeRegistry = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _register_decorators;
    let _createRecipe_decorators;
    let _updateRecipe_decorators;
    let _deleteRecipe_decorators;
    let _getPinned_decorators;
    let _latest_decorators;
    let _list_decorators;
    let _listDetails_decorators;
    return class RecipeRegistry extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _register_decorators = [Remote('register')];
            _createRecipe_decorators = [Remote('createRecipe')];
            _updateRecipe_decorators = [Remote('updateRecipe')];
            _deleteRecipe_decorators = [Remote('deleteRecipe')];
            _getPinned_decorators = [Remote('getPinned')];
            _latest_decorators = [Remote('latest')];
            _list_decorators = [Remote('list')];
            _listDetails_decorators = [Remote('listDetails')];
            __esDecorate(this, null, _register_decorators, { kind: "method", name: "register", static: false, private: false, access: { has: obj => "register" in obj, get: obj => obj.register }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _createRecipe_decorators, { kind: "method", name: "createRecipe", static: false, private: false, access: { has: obj => "createRecipe" in obj, get: obj => obj.createRecipe }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _updateRecipe_decorators, { kind: "method", name: "updateRecipe", static: false, private: false, access: { has: obj => "updateRecipe" in obj, get: obj => obj.updateRecipe }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteRecipe_decorators, { kind: "method", name: "deleteRecipe", static: false, private: false, access: { has: obj => "deleteRecipe" in obj, get: obj => obj.deleteRecipe }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getPinned_decorators, { kind: "method", name: "getPinned", static: false, private: false, access: { has: obj => "getPinned" in obj, get: obj => obj.getPinned }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _latest_decorators, { kind: "method", name: "latest", static: false, private: false, access: { has: obj => "latest" in obj, get: obj => obj.latest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: obj => "list" in obj, get: obj => obj.list }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listDetails_decorators, { kind: "method", name: "listDetails", static: false, private: false, access: { has: obj => "listDetails" in obj, get: obj => obj.listDetails }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        constructor(ctx) {
            super(ctx, 'recipes');
            this.revisions = (__runInitializers(this, _instanceExtraInitializers), new Map());
            /** recipeId -> disabled marker (present means soft-deleted). */
            this.disabled = new Set();
            this.seedBuiltins();
        }
        /**
         * Open the durable store (when a backend is mounted) and reconcile the
         * in-memory registry with the persisted revisions and soft-delete markers.
         * The built-in templates are seeded in the constructor into memory (before
         * the store opens), so after a restart they are present immediately and are
         * canonical seeds — persisted CRUD revisions (create/update) add to them.
         *
         * No write-through of the built-ins happens here: they are single-source
         * shipped seeds re-registered on every boot, and re-writing revision 1 on
         * top of an existing persisted family would just duplicate the same row, so
         * only user-authored create/update revisions are durably written.
         */
        async [Service.init]() {
            // Optional durable backend: `ctx.get` reads without an inject requirement,
            // so isolated contexts (and the M1 in-memory suite) still construct one.
            // In the real assembly storageDomain is provided and, per the plugin
            // priority order, initialized before this service, so it resolves here.
            const facility = this.ctx.get('storageDomain');
            if (facility !== undefined) {
                try {
                    const domain = await facility.open(recipeStoreDomainSpec);
                    this.revisionsTable = domain.table('recipes');
                    this.metaTable = domain.table('recipe_meta');
                    this.ctx.effect(() => async () => { await domain.close(); }, 'recipe-store.close');
                    this.loadFromStorage();
                }
                catch {
                    // A missing/unwritable backend must not abort plugin load; the registry
                    // stays in-memory and tolerates a later reconnect.
                    this.revisionsTable = undefined;
                    this.metaTable = undefined;
                }
            }
        }
        /** Reconcile in-memory registry with the durable store. */
        loadFromStorage() {
            if (this.revisionsTable !== undefined) {
                for (const [, revision] of this.revisionsTable.entries()) {
                    this.revisions.set(recipeKey(revision.recipeId, revision.revision), revision);
                }
            }
            if (this.metaTable !== undefined) {
                for (const [id] of this.metaTable.entries()) {
                    if (id.trim().length > 0)
                        this.disabled.add(id.trim());
                }
            }
        }
        /** Seed the built-in templates for recipe families absent after a restart. */
        seedBuiltins() {
            const builtins = [
                [EMPTY_TEMPLATE_RECIPE_ID, EMPTY_TEMPLATE],
                [REQUIREMENT_RECIPE_ID, REQUIREMENT_TEMPLATE],
                [CODE_REVIEW_RECIPE_ID, CODE_REVIEW_TEMPLATE],
                [BUGFIX_RECIPE_ID, BUGFIX_TEMPLATE],
            ];
            for (const [id, payload] of builtins) {
                if (this.latest(id) === undefined)
                    this.register(id, 1, payload);
            }
        }
        /** Persist one revision write through to the durable store (best-effort). */
        persistRevision(revision) {
            if (this.revisionsTable === undefined)
                return;
            void this.revisionsTable.put(recipeKey(revision.recipeId, revision.revision), revision);
        }
        /** Persist one revision write and settle on durability (CRUD surface). */
        persistRevisionAwaited(revision) {
            if (this.revisionsTable === undefined)
                return Promise.resolve();
            return this.revisionsTable.put(recipeKey(revision.recipeId, revision.revision), revision);
        }
        /** Persist the soft-delete marker through to the durable store. */
        persistDisabledAwaited(recipeId, disabledAt) {
            if (this.metaTable === undefined)
                return Promise.resolve();
            return this.metaTable.put(recipeId, { recipeId, disabledAt });
        }
        /** Clear the soft-delete marker and settle on durability (CRUD surface). */
        persistEnabledAwaited(recipeId) {
            if (this.metaTable === undefined)
                return Promise.resolve();
            return this.metaTable.delete(recipeId).then(() => undefined);
        }
        /** Recipe families shipped with the package; these cannot be deleted. */
        isBuiltin(recipeId) {
            return recipeId === EMPTY_TEMPLATE_RECIPE_ID
                || recipeId === REQUIREMENT_RECIPE_ID
                || recipeId === CODE_REVIEW_RECIPE_ID
                || recipeId === BUGFIX_RECIPE_ID;
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
            if (canonical.length === 0) {
                throw new RecipeError('invalid-payload', 'recipeId must be a non-empty string');
            }
            if (!Number.isSafeInteger(revision) || revision < 1) {
                throw new RecipeError('invalid-payload', 'revision must be a positive safe integer');
            }
            const problems = validateRecipePayload(payload);
            if (problems.length > 0) {
                throw new RecipeError('invalid-payload', `recipe "${canonical}" payload has ${problems.length} problem(s)`, problems);
            }
            const contentHash = hashRecipePayload(payload);
            const key = recipeKey(canonical, revision);
            const existing = this.revisions.get(key);
            if (existing !== undefined) {
                if (existing.contentHash === contentHash)
                    return existing;
                throw new RecipeError('duplicate-revision', `recipe "${recipeId}" revision ${revision} is taken by a different payload`);
            }
            const stored = {
                recipeId: RecipeId(canonical),
                revision,
                schemaVersion: 1,
                contentHash,
                // Defensive copy: the registry's immutability contract does not share
                // the caller's object, so a post-register mutation cannot drift a
                // stored revision.
                payload: structuredClone(payload),
                registeredAt: Date.now(),
            };
            this.revisions.set(key, stored);
            this.persistRevision(stored);
            return stored;
        }
        /**
         * Create a brand-new recipe family at revision 1. The id must currently be
         * pickable (absent from the visible catalogue); re-creating a soft-deleted
         * recipe is allowed and clears its delete marker.
         * @param recipeId - recipe identifier; surrounding whitespace is trimmed.
         * @param payload - canonical revision payload, validated like `register`.
         * @returns the stored revision (revision 1).
         */
        async createRecipe(recipeId, payload) {
            const canonical = recipeId.trim();
            if (canonical.length === 0) {
                throw new RecipeError('invalid-payload', 'recipeId must be a non-empty string');
            }
            const prior = this.latest(canonical);
            if (prior !== undefined && !this.disabled.has(canonical)) {
                throw new RecipeError('duplicate-revision', `recipe "${canonical}" already exists`);
            }
            // Brand-new family starts at revision 1; a resurrected (soft-deleted)
            // family gets the next free revision so a different payload doesn't collide
            // with an old revision still held for pinned reads.
            const revision = prior === undefined ? 1 : prior.revision + 1;
            const stored = this.register(canonical, revision, payload);
            this.disabled.delete(canonical);
            await this.persistRevisionAwaited(stored);
            await this.persistEnabledAwaited(canonical);
            return stored;
        }
        /**
         * Update one recipe family by registering a new immutable revision at
         * `latest + 1`; older revisions stay addressable so in-flight tasks never
         * repoint. Re-creating a revision-equivalent newest payload is allowed
         * (idempotent), a conflicting payload under that new identity fails.
         * Built-in templates may be overridden here (a new revision shadows the
         * shipped seed) even though they cannot be deleted — override, not removal.
         * @param recipeId - recipe identifier; surrounding whitespace is trimmed.
         * @param payload - the replacement revision payload.
         * @returns the newly stored revision.
         */
        async updateRecipe(recipeId, payload) {
            const canonical = recipeId.trim();
            if (canonical.length === 0) {
                throw new RecipeError('invalid-payload', 'recipeId must be a non-empty string');
            }
            const next = (this.latest(canonical)?.revision ?? 0) + 1;
            const stored = this.register(canonical, next, payload);
            this.disabled.delete(canonical);
            await this.persistRevisionAwaited(stored);
            await this.persistEnabledAwaited(canonical);
            return stored;
        }
        /**
         * Soft-delete one recipe family: it leaves the pickable catalogue but its
         * revisions remain physically present, so a task that already pinned one
         * still satisfies `getPinned`. Built-in templates cannot be removed.
         * @param recipeId - recipe identifier; surrounding whitespace is trimmed.
         * @returns `true` when the family existed and was removed from the
         * pickable set, `false` when no visible recipe family matches.
         */
        async deleteRecipe(recipeId) {
            const canonical = recipeId.trim();
            if (canonical.length === 0) {
                throw new RecipeError('invalid-payload', 'recipeId must be a non-empty string');
            }
            if (this.isBuiltin(canonical)) {
                throw new RecipeError('invalid-payload', `built-in recipe "${canonical}" cannot be deleted`);
            }
            const exists = this.latest(canonical) !== undefined;
            if (!exists)
                return false;
            if (this.disabled.has(canonical))
                return false;
            this.disabled.add(canonical);
            await this.persistDisabledAwaited(canonical, Date.now());
            return true;
        }
        /**
         * Read one pinned identity, verifying the stored hash against the payload.
         * @param identity - recipe id plus exact revision; the id is trimmed to the
         * canonical form before keying, matching `register`.
         * @returns the stored revision.
         */
        getPinned(identity) {
            const stored = this.revisions.get(recipeKey(identity.recipeId, identity.revision));
            if (stored === undefined) {
                throw new RecipeError('not-found', `recipe "${identity.recipeId}" revision ${identity.revision} is not registered`);
            }
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
                if (stored.recipeId !== canonical)
                    continue;
                if (latest === undefined || stored.revision > latest.revision)
                    latest = stored;
            }
            return latest;
        }
        /**
         * Every pickable (non-disabled) identity, for registry inspection and the
         * task-creation picker.
         * @returns identity list ordered by registration.
         */
        list() {
            return [...this.revisions.values()]
                .filter(revision => !this.disabled.has(revision.recipeId))
                .map(({ recipeId, revision }) => ({ recipeId, revision }));
        }
        /**
         * Every recipe's latest revision with its full payload, for the task-creation
         * wizard's linked phase preview. One read per recipe, newest revision wins.
         * @returns latest revisions ordered by registration.
         */
        listDetails() {
            const latest = new Map();
            for (const stored of this.revisions.values()) {
                if (this.disabled.has(stored.recipeId))
                    continue;
                const known = latest.get(stored.recipeId);
                if (known === undefined || stored.revision > known.revision)
                    latest.set(stored.recipeId, stored);
            }
            return [...latest.values()];
        }
    };
})();
export { RecipeRegistry };
/** Durable table key of one revision identity. */
function recipeKey(recipeId, revision) {
    return `${recipeId.trim()}#${revision}`;
}
export default RecipeRegistry;
//# sourceMappingURL=index.js.map