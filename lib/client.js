window.__ModuleLoader__.load({
	id: "@kongfun2018/dsh-task-flow",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/core.js
		var _a$1;
		function $constructor(name, initializer, params) {
			function init(inst, def) {
				if (!inst._zod) Object.defineProperty(inst, "_zod", {
					value: {
						def,
						constr: _,
						traits: /* @__PURE__ */ new Set()
					},
					enumerable: false
				});
				if (inst._zod.traits.has(name)) return;
				inst._zod.traits.add(name);
				initializer(inst, def);
				const proto = _.prototype;
				const keys = Object.keys(proto);
				for (let i = 0; i < keys.length; i++) {
					const k = keys[i];
					if (!(k in inst)) inst[k] = proto[k].bind(inst);
				}
			}
			const Parent = params?.Parent ?? Object;
			class Definition extends Parent {}
			Object.defineProperty(Definition, "name", { value: name });
			function _(def) {
				var _a;
				const inst = params?.Parent ? new Definition() : this;
				init(inst, def);
				(_a = inst._zod).deferred ?? (_a.deferred = []);
				for (const fn of inst._zod.deferred) fn();
				return inst;
			}
			Object.defineProperty(_, "init", { value: init });
			Object.defineProperty(_, Symbol.hasInstance, { value: (inst) => {
				if (params?.Parent && inst instanceof params.Parent) return true;
				return inst?._zod?.traits?.has(name);
			} });
			Object.defineProperty(_, "name", { value: name });
			return _;
		}
		var $ZodAsyncError = class extends Error {
			constructor() {
				super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
			}
		};
		var $ZodEncodeError = class extends Error {
			constructor(name) {
				super(`Encountered unidirectional transform during encode: ${name}`);
				this.name = "ZodEncodeError";
			}
		};
		(_a$1 = globalThis).__zod_globalConfig ?? (_a$1.__zod_globalConfig = {});
		const globalConfig = globalThis.__zod_globalConfig;
		function config(newConfig) {
			if (newConfig) Object.assign(globalConfig, newConfig);
			return globalConfig;
		}
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/util.js
		function getEnumValues(entries) {
			const numericValues = Object.values(entries).filter((v) => typeof v === "number");
			return Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
		}
		function jsonStringifyReplacer(_, value) {
			if (typeof value === "bigint") return value.toString();
			return value;
		}
		function cached(getter) {
			return { get value() {
				{
					const value = getter();
					Object.defineProperty(this, "value", { value });
					return value;
				}
			} };
		}
		function nullish(input) {
			return input === null || input === void 0;
		}
		function cleanRegex(source) {
			const start = source.startsWith("^") ? 1 : 0;
			const end = source.endsWith("$") ? source.length - 1 : source.length;
			return source.slice(start, end);
		}
		function floatSafeRemainder(val, step) {
			const ratio = val / step;
			const roundedRatio = Math.round(ratio);
			const tolerance = Number.EPSILON * Math.max(Math.abs(ratio), 1);
			if (Math.abs(ratio - roundedRatio) < tolerance) return 0;
			return ratio - roundedRatio;
		}
		const EVALUATING = /* @__PURE__*/ Symbol("evaluating");
		function defineLazy(object, key, getter) {
			let value = void 0;
			Object.defineProperty(object, key, {
				get() {
					if (value === EVALUATING) return;
					if (value === void 0) {
						value = EVALUATING;
						value = getter();
					}
					return value;
				},
				set(v) {
					Object.defineProperty(object, key, { value: v });
				},
				configurable: true
			});
		}
		function assignProp(target, prop, value) {
			Object.defineProperty(target, prop, {
				value,
				writable: true,
				enumerable: true,
				configurable: true
			});
		}
		function mergeDefs(...defs) {
			const mergedDescriptors = {};
			for (const def of defs) {
				const descriptors = Object.getOwnPropertyDescriptors(def);
				Object.assign(mergedDescriptors, descriptors);
			}
			return Object.defineProperties({}, mergedDescriptors);
		}
		function esc(str) {
			return JSON.stringify(str);
		}
		function slugify(input) {
			return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
		}
		const captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
		function isObject(data) {
			return typeof data === "object" && data !== null && !Array.isArray(data);
		}
		const allowsEval = /* @__PURE__*/ cached(() => {
			if (globalConfig.jitless) return false;
			if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) return false;
			try {
				new Function("");
				return true;
			} catch (_) {
				return false;
			}
		});
		function isPlainObject(o) {
			if (isObject(o) === false) return false;
			const ctor = o.constructor;
			if (ctor === void 0) return true;
			if (typeof ctor !== "function") return true;
			const prot = ctor.prototype;
			if (isObject(prot) === false) return false;
			if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) return false;
			return true;
		}
		function shallowClone(o) {
			if (isPlainObject(o)) return { ...o };
			if (Array.isArray(o)) return [...o];
			if (o instanceof Map) return new Map(o);
			if (o instanceof Set) return new Set(o);
			return o;
		}
		const propertyKeyTypes = /* @__PURE__*/ new Set([
			"string",
			"number",
			"symbol"
		]);
		function escapeRegex(str) {
			return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		}
		function clone(inst, def, params) {
			const cl = new inst._zod.constr(def ?? inst._zod.def);
			if (!def || params?.parent) cl._zod.parent = inst;
			return cl;
		}
		function normalizeParams(_params) {
			const params = _params;
			if (!params) return {};
			if (typeof params === "string") return { error: () => params };
			if (params?.message !== void 0) {
				if (params?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
				params.error = params.message;
			}
			delete params.message;
			if (typeof params.error === "string") return {
				...params,
				error: () => params.error
			};
			return params;
		}
		function optionalKeys(shape) {
			return Object.keys(shape).filter((k) => {
				return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
			});
		}
		const NUMBER_FORMAT_RANGES = {
			safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
			int32: [-2147483648, 2147483647],
			uint32: [0, 4294967295],
			float32: [-34028234663852886e22, 34028234663852886e22],
			float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
		};
		function pick(schema, mask) {
			const currDef = schema._zod.def;
			const checks = currDef.checks;
			if (checks && checks.length > 0) throw new Error(".pick() cannot be used on object schemas containing refinements");
			return clone(schema, mergeDefs(schema._zod.def, {
				get shape() {
					const newShape = {};
					for (const key in mask) {
						if (!(key in currDef.shape)) throw new Error(`Unrecognized key: "${key}"`);
						if (!mask[key]) continue;
						newShape[key] = currDef.shape[key];
					}
					assignProp(this, "shape", newShape);
					return newShape;
				},
				checks: []
			}));
		}
		function omit(schema, mask) {
			const currDef = schema._zod.def;
			const checks = currDef.checks;
			if (checks && checks.length > 0) throw new Error(".omit() cannot be used on object schemas containing refinements");
			return clone(schema, mergeDefs(schema._zod.def, {
				get shape() {
					const newShape = { ...schema._zod.def.shape };
					for (const key in mask) {
						if (!(key in currDef.shape)) throw new Error(`Unrecognized key: "${key}"`);
						if (!mask[key]) continue;
						delete newShape[key];
					}
					assignProp(this, "shape", newShape);
					return newShape;
				},
				checks: []
			}));
		}
		function extend(schema, shape) {
			if (!isPlainObject(shape)) throw new Error("Invalid input to extend: expected a plain object");
			const checks = schema._zod.def.checks;
			if (checks && checks.length > 0) {
				const existingShape = schema._zod.def.shape;
				for (const key in shape) if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
			}
			return clone(schema, mergeDefs(schema._zod.def, { get shape() {
				const _shape = {
					...schema._zod.def.shape,
					...shape
				};
				assignProp(this, "shape", _shape);
				return _shape;
			} }));
		}
		function safeExtend(schema, shape) {
			if (!isPlainObject(shape)) throw new Error("Invalid input to safeExtend: expected a plain object");
			return clone(schema, mergeDefs(schema._zod.def, { get shape() {
				const _shape = {
					...schema._zod.def.shape,
					...shape
				};
				assignProp(this, "shape", _shape);
				return _shape;
			} }));
		}
		function merge(a, b) {
			if (a._zod.def.checks?.length) throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
			return clone(a, mergeDefs(a._zod.def, {
				get shape() {
					const _shape = {
						...a._zod.def.shape,
						...b._zod.def.shape
					};
					assignProp(this, "shape", _shape);
					return _shape;
				},
				get catchall() {
					return b._zod.def.catchall;
				},
				checks: b._zod.def.checks ?? []
			}));
		}
		function partial(Class, schema, mask) {
			const checks = schema._zod.def.checks;
			if (checks && checks.length > 0) throw new Error(".partial() cannot be used on object schemas containing refinements");
			return clone(schema, mergeDefs(schema._zod.def, {
				get shape() {
					const oldShape = schema._zod.def.shape;
					const shape = { ...oldShape };
					if (mask) for (const key in mask) {
						if (!(key in oldShape)) throw new Error(`Unrecognized key: "${key}"`);
						if (!mask[key]) continue;
						shape[key] = Class ? new Class({
							type: "optional",
							innerType: oldShape[key]
						}) : oldShape[key];
					}
					else for (const key in oldShape) shape[key] = Class ? new Class({
						type: "optional",
						innerType: oldShape[key]
					}) : oldShape[key];
					assignProp(this, "shape", shape);
					return shape;
				},
				checks: []
			}));
		}
		function required(Class, schema, mask) {
			return clone(schema, mergeDefs(schema._zod.def, { get shape() {
				const oldShape = schema._zod.def.shape;
				const shape = { ...oldShape };
				if (mask) for (const key in mask) {
					if (!(key in shape)) throw new Error(`Unrecognized key: "${key}"`);
					if (!mask[key]) continue;
					shape[key] = new Class({
						type: "nonoptional",
						innerType: oldShape[key]
					});
				}
				else for (const key in oldShape) shape[key] = new Class({
					type: "nonoptional",
					innerType: oldShape[key]
				});
				assignProp(this, "shape", shape);
				return shape;
			} }));
		}
		function aborted(x, startIndex = 0) {
			if (x.aborted === true) return true;
			for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue !== true) return true;
			return false;
		}
		function explicitlyAborted(x, startIndex = 0) {
			if (x.aborted === true) return true;
			for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue === false) return true;
			return false;
		}
		function prefixIssues(path, issues) {
			return issues.map((iss) => {
				var _a;
				(_a = iss).path ?? (_a.path = []);
				iss.path.unshift(path);
				return iss;
			});
		}
		function unwrapMessage(message) {
			return typeof message === "string" ? message : message?.message;
		}
		function finalizeIssue(iss, ctx, config) {
			const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
			const { inst: _inst, continue: _continue, input: _input, ...rest } = iss;
			rest.path ?? (rest.path = []);
			rest.message = message;
			if (ctx?.reportInput) rest.input = _input;
			return rest;
		}
		function getLengthableOrigin(input) {
			if (Array.isArray(input)) return "array";
			if (typeof input === "string") return "string";
			return "unknown";
		}
		function issue(...args) {
			const [iss, input, inst] = args;
			if (typeof iss === "string") return {
				message: iss,
				code: "custom",
				input,
				inst
			};
			return { ...iss };
		}
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/errors.js
		const initializer$1 = (inst, def) => {
			inst.name = "$ZodError";
			Object.defineProperty(inst, "_zod", {
				value: inst._zod,
				enumerable: false
			});
			Object.defineProperty(inst, "issues", {
				value: def,
				enumerable: false
			});
			inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
			Object.defineProperty(inst, "toString", {
				value: () => inst.message,
				enumerable: false
			});
		};
		const $ZodError = $constructor("$ZodError", initializer$1);
		const $ZodRealError = $constructor("$ZodError", initializer$1, { Parent: Error });
		function flattenError(error, mapper = (issue) => issue.message) {
			const fieldErrors = {};
			const formErrors = [];
			for (const sub of error.issues) if (sub.path.length > 0) {
				fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
				fieldErrors[sub.path[0]].push(mapper(sub));
			} else formErrors.push(mapper(sub));
			return {
				formErrors,
				fieldErrors
			};
		}
		function formatError(error, mapper = (issue) => issue.message) {
			const fieldErrors = { _errors: [] };
			const processError = (error, path = []) => {
				for (const issue of error.issues) if (issue.code === "invalid_union" && issue.errors.length) issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
				else if (issue.code === "invalid_key") processError({ issues: issue.issues }, [...path, ...issue.path]);
				else if (issue.code === "invalid_element") processError({ issues: issue.issues }, [...path, ...issue.path]);
				else {
					const fullpath = [...path, ...issue.path];
					if (fullpath.length === 0) fieldErrors._errors.push(mapper(issue));
					else {
						let curr = fieldErrors;
						let i = 0;
						while (i < fullpath.length) {
							const el = fullpath[i];
							if (!(i === fullpath.length - 1)) curr[el] = curr[el] || { _errors: [] };
							else {
								curr[el] = curr[el] || { _errors: [] };
								curr[el]._errors.push(mapper(issue));
							}
							curr = curr[el];
							i++;
						}
					}
				}
			};
			processError(error);
			return fieldErrors;
		}
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/parse.js
		const _parse = (_Err) => (schema, value, _ctx, _params) => {
			const ctx = _ctx ? {
				..._ctx,
				async: false
			} : { async: false };
			const result = schema._zod.run({
				value,
				issues: []
			}, ctx);
			if (result instanceof Promise) throw new $ZodAsyncError();
			if (result.issues.length) {
				const e = new ((_params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
				captureStackTrace(e, _params?.callee);
				throw e;
			}
			return result.value;
		};
		const _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
			const ctx = _ctx ? {
				..._ctx,
				async: true
			} : { async: true };
			let result = schema._zod.run({
				value,
				issues: []
			}, ctx);
			if (result instanceof Promise) result = await result;
			if (result.issues.length) {
				const e = new ((params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
				captureStackTrace(e, params?.callee);
				throw e;
			}
			return result.value;
		};
		const _safeParse = (_Err) => (schema, value, _ctx) => {
			const ctx = _ctx ? {
				..._ctx,
				async: false
			} : { async: false };
			const result = schema._zod.run({
				value,
				issues: []
			}, ctx);
			if (result instanceof Promise) throw new $ZodAsyncError();
			return result.issues.length ? {
				success: false,
				error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
			} : {
				success: true,
				data: result.value
			};
		};
		const safeParse$1 = /* @__PURE__*/ _safeParse($ZodRealError);
		const _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
			const ctx = _ctx ? {
				..._ctx,
				async: true
			} : { async: true };
			let result = schema._zod.run({
				value,
				issues: []
			}, ctx);
			if (result instanceof Promise) result = await result;
			return result.issues.length ? {
				success: false,
				error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
			} : {
				success: true,
				data: result.value
			};
		};
		const safeParseAsync$1 = /* @__PURE__*/ _safeParseAsync($ZodRealError);
		const _encode = (_Err) => (schema, value, _ctx) => {
			const ctx = _ctx ? {
				..._ctx,
				direction: "backward"
			} : { direction: "backward" };
			return _parse(_Err)(schema, value, ctx);
		};
		const _decode = (_Err) => (schema, value, _ctx) => {
			return _parse(_Err)(schema, value, _ctx);
		};
		const _encodeAsync = (_Err) => async (schema, value, _ctx) => {
			const ctx = _ctx ? {
				..._ctx,
				direction: "backward"
			} : { direction: "backward" };
			return _parseAsync(_Err)(schema, value, ctx);
		};
		const _decodeAsync = (_Err) => async (schema, value, _ctx) => {
			return _parseAsync(_Err)(schema, value, _ctx);
		};
		const _safeEncode = (_Err) => (schema, value, _ctx) => {
			const ctx = _ctx ? {
				..._ctx,
				direction: "backward"
			} : { direction: "backward" };
			return _safeParse(_Err)(schema, value, ctx);
		};
		const _safeDecode = (_Err) => (schema, value, _ctx) => {
			return _safeParse(_Err)(schema, value, _ctx);
		};
		const _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
			const ctx = _ctx ? {
				..._ctx,
				direction: "backward"
			} : { direction: "backward" };
			return _safeParseAsync(_Err)(schema, value, ctx);
		};
		const _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
			return _safeParseAsync(_Err)(schema, value, _ctx);
		};
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/regexes.js
		/**
		* @deprecated CUID v1 is deprecated by its authors due to information leakage
		* (timestamps embedded in the id). Use {@link cuid2} instead.
		* See https://github.com/paralleldrive/cuid.
		*/
		const cuid = /^[cC][0-9a-z]{6,}$/;
		const cuid2 = /^[0-9a-z]+$/;
		const ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
		const xid = /^[0-9a-vA-V]{20}$/;
		const ksuid = /^[A-Za-z0-9]{27}$/;
		const nanoid = /^[a-zA-Z0-9_-]{21}$/;
		/** ISO 8601-1 duration regex. Does not support the 8601-2 extensions like negative durations or fractional/negative components. */
		const duration$1 = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
		/** A regex for any UUID-like identifier: 8-4-4-4-12 hex pattern */
		const guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
		/** Returns a regex for validating an RFC 9562/4122 UUID.
		*
		* @param version Optionally specify a version 1-8. If no version is specified, all versions are supported. */
		const uuid = (version) => {
			if (!version) return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
			return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
		};
		/** Practical email validation */
		const email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
		const _emoji$1 = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
		function emoji() {
			return new RegExp(_emoji$1, "u");
		}
		const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
		const ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
		const cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
		const cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
		const base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
		const base64url = /^[A-Za-z0-9_-]*$/;
		const httpProtocol = /^https?$/;
		const e164 = /^\+[1-9]\d{6,14}$/;
		const dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
		const date$1 = /*@__PURE__*/ new RegExp(`^${dateSource}$`);
		function timeSource(args) {
			const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
			return typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
		}
		function time$1(args) {
			return new RegExp(`^${timeSource(args)}$`);
		}
		function datetime$1(args) {
			const time = timeSource({ precision: args.precision });
			const opts = ["Z"];
			if (args.local) opts.push("");
			if (args.offset) opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
			const timeRegex = `${time}(?:${opts.join("|")})`;
			return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
		}
		const string$1 = (params) => {
			const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
			return new RegExp(`^${regex}$`);
		};
		const integer = /^-?\d+$/;
		const number$1 = /^-?\d+(?:\.\d+)?$/;
		const boolean$1 = /^(?:true|false)$/i;
		const _undefined$2 = /^undefined$/i;
		const lowercase = /^[^A-Z]*$/;
		const uppercase = /^[^a-z]*$/;
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/checks.js
		const $ZodCheck = /*@__PURE__*/ $constructor("$ZodCheck", (inst, def) => {
			var _a;
			inst._zod ?? (inst._zod = {});
			inst._zod.def = def;
			(_a = inst._zod).onattach ?? (_a.onattach = []);
		});
		const numericOriginMap = {
			number: "number",
			bigint: "bigint",
			object: "date"
		};
		const $ZodCheckLessThan = /*@__PURE__*/ $constructor("$ZodCheckLessThan", (inst, def) => {
			$ZodCheck.init(inst, def);
			const origin = numericOriginMap[typeof def.value];
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
				if (def.value < curr) {
					if (def.inclusive) bag.maximum = def.value;
					else bag.exclusiveMaximum = def.value;
				}
			});
			inst._zod.check = (payload) => {
				if (def.inclusive ? payload.value <= def.value : payload.value < def.value) return;
				payload.issues.push({
					origin,
					code: "too_big",
					maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
					input: payload.value,
					inclusive: def.inclusive,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckGreaterThan = /*@__PURE__*/ $constructor("$ZodCheckGreaterThan", (inst, def) => {
			$ZodCheck.init(inst, def);
			const origin = numericOriginMap[typeof def.value];
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
				if (def.value > curr) {
					if (def.inclusive) bag.minimum = def.value;
					else bag.exclusiveMinimum = def.value;
				}
			});
			inst._zod.check = (payload) => {
				if (def.inclusive ? payload.value >= def.value : payload.value > def.value) return;
				payload.issues.push({
					origin,
					code: "too_small",
					minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
					input: payload.value,
					inclusive: def.inclusive,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckMultipleOf = /*@__PURE__*/ $constructor("$ZodCheckMultipleOf", (inst, def) => {
			$ZodCheck.init(inst, def);
			inst._zod.onattach.push((inst) => {
				var _a;
				(_a = inst._zod.bag).multipleOf ?? (_a.multipleOf = def.value);
			});
			inst._zod.check = (payload) => {
				if (typeof payload.value !== typeof def.value) throw new Error("Cannot mix number and bigint in multiple_of check.");
				if (typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0) return;
				payload.issues.push({
					origin: typeof payload.value,
					code: "not_multiple_of",
					divisor: def.value,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckNumberFormat = /*@__PURE__*/ $constructor("$ZodCheckNumberFormat", (inst, def) => {
			$ZodCheck.init(inst, def);
			def.format = def.format || "float64";
			const isInt = def.format?.includes("int");
			const origin = isInt ? "int" : "number";
			const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				bag.format = def.format;
				bag.minimum = minimum;
				bag.maximum = maximum;
				if (isInt) bag.pattern = integer;
			});
			inst._zod.check = (payload) => {
				const input = payload.value;
				if (isInt) {
					if (!Number.isInteger(input)) {
						payload.issues.push({
							expected: origin,
							format: def.format,
							code: "invalid_type",
							continue: false,
							input,
							inst
						});
						return;
					}
					if (!Number.isSafeInteger(input)) {
						if (input > 0) payload.issues.push({
							input,
							code: "too_big",
							maximum: Number.MAX_SAFE_INTEGER,
							note: "Integers must be within the safe integer range.",
							inst,
							origin,
							inclusive: true,
							continue: !def.abort
						});
						else payload.issues.push({
							input,
							code: "too_small",
							minimum: Number.MIN_SAFE_INTEGER,
							note: "Integers must be within the safe integer range.",
							inst,
							origin,
							inclusive: true,
							continue: !def.abort
						});
						return;
					}
				}
				if (input < minimum) payload.issues.push({
					origin: "number",
					input,
					code: "too_small",
					minimum,
					inclusive: true,
					inst,
					continue: !def.abort
				});
				if (input > maximum) payload.issues.push({
					origin: "number",
					input,
					code: "too_big",
					maximum,
					inclusive: true,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckMaxLength = /*@__PURE__*/ $constructor("$ZodCheckMaxLength", (inst, def) => {
			var _a;
			$ZodCheck.init(inst, def);
			(_a = inst._zod.def).when ?? (_a.when = (payload) => {
				const val = payload.value;
				return !nullish(val) && val.length !== void 0;
			});
			inst._zod.onattach.push((inst) => {
				const curr = inst._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
				if (def.maximum < curr) inst._zod.bag.maximum = def.maximum;
			});
			inst._zod.check = (payload) => {
				const input = payload.value;
				if (input.length <= def.maximum) return;
				const origin = getLengthableOrigin(input);
				payload.issues.push({
					origin,
					code: "too_big",
					maximum: def.maximum,
					inclusive: true,
					input,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckMinLength = /*@__PURE__*/ $constructor("$ZodCheckMinLength", (inst, def) => {
			var _a;
			$ZodCheck.init(inst, def);
			(_a = inst._zod.def).when ?? (_a.when = (payload) => {
				const val = payload.value;
				return !nullish(val) && val.length !== void 0;
			});
			inst._zod.onattach.push((inst) => {
				const curr = inst._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
				if (def.minimum > curr) inst._zod.bag.minimum = def.minimum;
			});
			inst._zod.check = (payload) => {
				const input = payload.value;
				if (input.length >= def.minimum) return;
				const origin = getLengthableOrigin(input);
				payload.issues.push({
					origin,
					code: "too_small",
					minimum: def.minimum,
					inclusive: true,
					input,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckLengthEquals = /*@__PURE__*/ $constructor("$ZodCheckLengthEquals", (inst, def) => {
			var _a;
			$ZodCheck.init(inst, def);
			(_a = inst._zod.def).when ?? (_a.when = (payload) => {
				const val = payload.value;
				return !nullish(val) && val.length !== void 0;
			});
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				bag.minimum = def.length;
				bag.maximum = def.length;
				bag.length = def.length;
			});
			inst._zod.check = (payload) => {
				const input = payload.value;
				const length = input.length;
				if (length === def.length) return;
				const origin = getLengthableOrigin(input);
				const tooBig = length > def.length;
				payload.issues.push({
					origin,
					...tooBig ? {
						code: "too_big",
						maximum: def.length
					} : {
						code: "too_small",
						minimum: def.length
					},
					inclusive: true,
					exact: true,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckStringFormat = /*@__PURE__*/ $constructor("$ZodCheckStringFormat", (inst, def) => {
			var _a, _b;
			$ZodCheck.init(inst, def);
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				bag.format = def.format;
				if (def.pattern) {
					bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
					bag.patterns.add(def.pattern);
				}
			});
			if (def.pattern) (_a = inst._zod).check ?? (_a.check = (payload) => {
				def.pattern.lastIndex = 0;
				if (def.pattern.test(payload.value)) return;
				payload.issues.push({
					origin: "string",
					code: "invalid_format",
					format: def.format,
					input: payload.value,
					...def.pattern ? { pattern: def.pattern.toString() } : {},
					inst,
					continue: !def.abort
				});
			});
			else (_b = inst._zod).check ?? (_b.check = () => {});
		});
		const $ZodCheckRegex = /*@__PURE__*/ $constructor("$ZodCheckRegex", (inst, def) => {
			$ZodCheckStringFormat.init(inst, def);
			inst._zod.check = (payload) => {
				def.pattern.lastIndex = 0;
				if (def.pattern.test(payload.value)) return;
				payload.issues.push({
					origin: "string",
					code: "invalid_format",
					format: "regex",
					input: payload.value,
					pattern: def.pattern.toString(),
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckLowerCase = /*@__PURE__*/ $constructor("$ZodCheckLowerCase", (inst, def) => {
			def.pattern ?? (def.pattern = lowercase);
			$ZodCheckStringFormat.init(inst, def);
		});
		const $ZodCheckUpperCase = /*@__PURE__*/ $constructor("$ZodCheckUpperCase", (inst, def) => {
			def.pattern ?? (def.pattern = uppercase);
			$ZodCheckStringFormat.init(inst, def);
		});
		const $ZodCheckIncludes = /*@__PURE__*/ $constructor("$ZodCheckIncludes", (inst, def) => {
			$ZodCheck.init(inst, def);
			const escapedRegex = escapeRegex(def.includes);
			const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
			def.pattern = pattern;
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
				bag.patterns.add(pattern);
			});
			inst._zod.check = (payload) => {
				if (payload.value.includes(def.includes, def.position)) return;
				payload.issues.push({
					origin: "string",
					code: "invalid_format",
					format: "includes",
					includes: def.includes,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckStartsWith = /*@__PURE__*/ $constructor("$ZodCheckStartsWith", (inst, def) => {
			$ZodCheck.init(inst, def);
			const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
			def.pattern ?? (def.pattern = pattern);
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
				bag.patterns.add(pattern);
			});
			inst._zod.check = (payload) => {
				if (payload.value.startsWith(def.prefix)) return;
				payload.issues.push({
					origin: "string",
					code: "invalid_format",
					format: "starts_with",
					prefix: def.prefix,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckEndsWith = /*@__PURE__*/ $constructor("$ZodCheckEndsWith", (inst, def) => {
			$ZodCheck.init(inst, def);
			const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
			def.pattern ?? (def.pattern = pattern);
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
				bag.patterns.add(pattern);
			});
			inst._zod.check = (payload) => {
				if (payload.value.endsWith(def.suffix)) return;
				payload.issues.push({
					origin: "string",
					code: "invalid_format",
					format: "ends_with",
					suffix: def.suffix,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckOverwrite = /*@__PURE__*/ $constructor("$ZodCheckOverwrite", (inst, def) => {
			$ZodCheck.init(inst, def);
			inst._zod.check = (payload) => {
				payload.value = def.tx(payload.value);
			};
		});
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/doc.js
		var Doc = class {
			constructor(args = []) {
				this.content = [];
				this.indent = 0;
				if (this) this.args = args;
			}
			indented(fn) {
				this.indent += 1;
				fn(this);
				this.indent -= 1;
			}
			write(arg) {
				if (typeof arg === "function") {
					arg(this, { execution: "sync" });
					arg(this, { execution: "async" });
					return;
				}
				const lines = arg.split("\n").filter((x) => x);
				const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
				const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
				for (const line of dedented) this.content.push(line);
			}
			compile() {
				const F = Function;
				const args = this?.args;
				const lines = [...(this?.content ?? [``]).map((x) => `  ${x}`)];
				return new F(...args, lines.join("\n"));
			}
		};
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/versions.js
		const version = {
			major: 4,
			minor: 4,
			patch: 3
		};
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/schemas.js
		const $ZodType = /*@__PURE__*/ $constructor("$ZodType", (inst, def) => {
			var _a;
			inst ?? (inst = {});
			inst._zod.def = def;
			inst._zod.bag = inst._zod.bag || {};
			inst._zod.version = version;
			const checks = [...inst._zod.def.checks ?? []];
			if (inst._zod.traits.has("$ZodCheck")) checks.unshift(inst);
			for (const ch of checks) for (const fn of ch._zod.onattach) fn(inst);
			if (checks.length === 0) {
				(_a = inst._zod).deferred ?? (_a.deferred = []);
				inst._zod.deferred?.push(() => {
					inst._zod.run = inst._zod.parse;
				});
			} else {
				const runChecks = (payload, checks, ctx) => {
					let isAborted = aborted(payload);
					let asyncResult;
					for (const ch of checks) {
						if (ch._zod.def.when) {
							if (explicitlyAborted(payload)) continue;
							if (!ch._zod.def.when(payload)) continue;
						} else if (isAborted) continue;
						const currLen = payload.issues.length;
						const _ = ch._zod.check(payload);
						if (_ instanceof Promise && ctx?.async === false) throw new $ZodAsyncError();
						if (asyncResult || _ instanceof Promise) asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
							await _;
							if (payload.issues.length === currLen) return;
							if (!isAborted) isAborted = aborted(payload, currLen);
						});
						else {
							if (payload.issues.length === currLen) continue;
							if (!isAborted) isAborted = aborted(payload, currLen);
						}
					}
					if (asyncResult) return asyncResult.then(() => {
						return payload;
					});
					return payload;
				};
				const handleCanaryResult = (canary, payload, ctx) => {
					if (aborted(canary)) {
						canary.aborted = true;
						return canary;
					}
					const checkResult = runChecks(payload, checks, ctx);
					if (checkResult instanceof Promise) {
						if (ctx.async === false) throw new $ZodAsyncError();
						return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
					}
					return inst._zod.parse(checkResult, ctx);
				};
				inst._zod.run = (payload, ctx) => {
					if (ctx.skipChecks) return inst._zod.parse(payload, ctx);
					if (ctx.direction === "backward") {
						const canary = inst._zod.parse({
							value: payload.value,
							issues: []
						}, {
							...ctx,
							skipChecks: true
						});
						if (canary instanceof Promise) return canary.then((canary) => {
							return handleCanaryResult(canary, payload, ctx);
						});
						return handleCanaryResult(canary, payload, ctx);
					}
					const result = inst._zod.parse(payload, ctx);
					if (result instanceof Promise) {
						if (ctx.async === false) throw new $ZodAsyncError();
						return result.then((result) => runChecks(result, checks, ctx));
					}
					return runChecks(result, checks, ctx);
				};
			}
			defineLazy(inst, "~standard", () => ({
				validate: (value) => {
					try {
						const r = safeParse$1(inst, value);
						return r.success ? { value: r.data } : { issues: r.error?.issues };
					} catch (_) {
						return safeParseAsync$1(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
					}
				},
				vendor: "zod",
				version: 1
			}));
		});
		const $ZodString = /*@__PURE__*/ $constructor("$ZodString", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string$1(inst._zod.bag);
			inst._zod.parse = (payload, _) => {
				if (def.coerce) try {
					payload.value = String(payload.value);
				} catch (_) {}
				if (typeof payload.value === "string") return payload;
				payload.issues.push({
					expected: "string",
					code: "invalid_type",
					input: payload.value,
					inst
				});
				return payload;
			};
		});
		const $ZodStringFormat = /*@__PURE__*/ $constructor("$ZodStringFormat", (inst, def) => {
			$ZodCheckStringFormat.init(inst, def);
			$ZodString.init(inst, def);
		});
		const $ZodGUID = /*@__PURE__*/ $constructor("$ZodGUID", (inst, def) => {
			def.pattern ?? (def.pattern = guid);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodUUID = /*@__PURE__*/ $constructor("$ZodUUID", (inst, def) => {
			if (def.version) {
				const v = {
					v1: 1,
					v2: 2,
					v3: 3,
					v4: 4,
					v5: 5,
					v6: 6,
					v7: 7,
					v8: 8
				}[def.version];
				if (v === void 0) throw new Error(`Invalid UUID version: "${def.version}"`);
				def.pattern ?? (def.pattern = uuid(v));
			} else def.pattern ?? (def.pattern = uuid());
			$ZodStringFormat.init(inst, def);
		});
		const $ZodEmail = /*@__PURE__*/ $constructor("$ZodEmail", (inst, def) => {
			def.pattern ?? (def.pattern = email);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodURL = /*@__PURE__*/ $constructor("$ZodURL", (inst, def) => {
			$ZodStringFormat.init(inst, def);
			inst._zod.check = (payload) => {
				try {
					const trimmed = payload.value.trim();
					if (!def.normalize && def.protocol?.source === httpProtocol.source) {
						if (!/^https?:\/\//i.test(trimmed)) {
							payload.issues.push({
								code: "invalid_format",
								format: "url",
								note: "Invalid URL format",
								input: payload.value,
								inst,
								continue: !def.abort
							});
							return;
						}
					}
					const url = new URL(trimmed);
					if (def.hostname) {
						def.hostname.lastIndex = 0;
						if (!def.hostname.test(url.hostname)) payload.issues.push({
							code: "invalid_format",
							format: "url",
							note: "Invalid hostname",
							pattern: def.hostname.source,
							input: payload.value,
							inst,
							continue: !def.abort
						});
					}
					if (def.protocol) {
						def.protocol.lastIndex = 0;
						if (!def.protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol)) payload.issues.push({
							code: "invalid_format",
							format: "url",
							note: "Invalid protocol",
							pattern: def.protocol.source,
							input: payload.value,
							inst,
							continue: !def.abort
						});
					}
					if (def.normalize) payload.value = url.href;
					else payload.value = trimmed;
					return;
				} catch (_) {
					payload.issues.push({
						code: "invalid_format",
						format: "url",
						input: payload.value,
						inst,
						continue: !def.abort
					});
				}
			};
		});
		const $ZodEmoji = /*@__PURE__*/ $constructor("$ZodEmoji", (inst, def) => {
			def.pattern ?? (def.pattern = emoji());
			$ZodStringFormat.init(inst, def);
		});
		const $ZodNanoID = /*@__PURE__*/ $constructor("$ZodNanoID", (inst, def) => {
			def.pattern ?? (def.pattern = nanoid);
			$ZodStringFormat.init(inst, def);
		});
		/**
		* @deprecated CUID v1 is deprecated by its authors due to information leakage
		* (timestamps embedded in the id). Use {@link $ZodCUID2} instead.
		* See https://github.com/paralleldrive/cuid.
		*/
		const $ZodCUID = /*@__PURE__*/ $constructor("$ZodCUID", (inst, def) => {
			def.pattern ?? (def.pattern = cuid);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodCUID2 = /*@__PURE__*/ $constructor("$ZodCUID2", (inst, def) => {
			def.pattern ?? (def.pattern = cuid2);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodULID = /*@__PURE__*/ $constructor("$ZodULID", (inst, def) => {
			def.pattern ?? (def.pattern = ulid);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodXID = /*@__PURE__*/ $constructor("$ZodXID", (inst, def) => {
			def.pattern ?? (def.pattern = xid);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodKSUID = /*@__PURE__*/ $constructor("$ZodKSUID", (inst, def) => {
			def.pattern ?? (def.pattern = ksuid);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodISODateTime = /*@__PURE__*/ $constructor("$ZodISODateTime", (inst, def) => {
			def.pattern ?? (def.pattern = datetime$1(def));
			$ZodStringFormat.init(inst, def);
		});
		const $ZodISODate = /*@__PURE__*/ $constructor("$ZodISODate", (inst, def) => {
			def.pattern ?? (def.pattern = date$1);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodISOTime = /*@__PURE__*/ $constructor("$ZodISOTime", (inst, def) => {
			def.pattern ?? (def.pattern = time$1(def));
			$ZodStringFormat.init(inst, def);
		});
		const $ZodISODuration = /*@__PURE__*/ $constructor("$ZodISODuration", (inst, def) => {
			def.pattern ?? (def.pattern = duration$1);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodIPv4 = /*@__PURE__*/ $constructor("$ZodIPv4", (inst, def) => {
			def.pattern ?? (def.pattern = ipv4);
			$ZodStringFormat.init(inst, def);
			inst._zod.bag.format = `ipv4`;
		});
		const $ZodIPv6 = /*@__PURE__*/ $constructor("$ZodIPv6", (inst, def) => {
			def.pattern ?? (def.pattern = ipv6);
			$ZodStringFormat.init(inst, def);
			inst._zod.bag.format = `ipv6`;
			inst._zod.check = (payload) => {
				try {
					new URL(`http://[${payload.value}]`);
				} catch {
					payload.issues.push({
						code: "invalid_format",
						format: "ipv6",
						input: payload.value,
						inst,
						continue: !def.abort
					});
				}
			};
		});
		const $ZodCIDRv4 = /*@__PURE__*/ $constructor("$ZodCIDRv4", (inst, def) => {
			def.pattern ?? (def.pattern = cidrv4);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodCIDRv6 = /*@__PURE__*/ $constructor("$ZodCIDRv6", (inst, def) => {
			def.pattern ?? (def.pattern = cidrv6);
			$ZodStringFormat.init(inst, def);
			inst._zod.check = (payload) => {
				const parts = payload.value.split("/");
				try {
					if (parts.length !== 2) throw new Error();
					const [address, prefix] = parts;
					if (!prefix) throw new Error();
					const prefixNum = Number(prefix);
					if (`${prefixNum}` !== prefix) throw new Error();
					if (prefixNum < 0 || prefixNum > 128) throw new Error();
					new URL(`http://[${address}]`);
				} catch {
					payload.issues.push({
						code: "invalid_format",
						format: "cidrv6",
						input: payload.value,
						inst,
						continue: !def.abort
					});
				}
			};
		});
		function isValidBase64(data) {
			if (data === "") return true;
			if (/\s/.test(data)) return false;
			if (data.length % 4 !== 0) return false;
			try {
				atob(data);
				return true;
			} catch {
				return false;
			}
		}
		const $ZodBase64 = /*@__PURE__*/ $constructor("$ZodBase64", (inst, def) => {
			def.pattern ?? (def.pattern = base64);
			$ZodStringFormat.init(inst, def);
			inst._zod.bag.contentEncoding = "base64";
			inst._zod.check = (payload) => {
				if (isValidBase64(payload.value)) return;
				payload.issues.push({
					code: "invalid_format",
					format: "base64",
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		function isValidBase64URL(data) {
			if (!base64url.test(data)) return false;
			const base64 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
			return isValidBase64(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
		}
		const $ZodBase64URL = /*@__PURE__*/ $constructor("$ZodBase64URL", (inst, def) => {
			def.pattern ?? (def.pattern = base64url);
			$ZodStringFormat.init(inst, def);
			inst._zod.bag.contentEncoding = "base64url";
			inst._zod.check = (payload) => {
				if (isValidBase64URL(payload.value)) return;
				payload.issues.push({
					code: "invalid_format",
					format: "base64url",
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodE164 = /*@__PURE__*/ $constructor("$ZodE164", (inst, def) => {
			def.pattern ?? (def.pattern = e164);
			$ZodStringFormat.init(inst, def);
		});
		function isValidJWT(token, algorithm = null) {
			try {
				const tokensParts = token.split(".");
				if (tokensParts.length !== 3) return false;
				const [header] = tokensParts;
				if (!header) return false;
				const parsedHeader = JSON.parse(atob(header));
				if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT") return false;
				if (!parsedHeader.alg) return false;
				if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm)) return false;
				return true;
			} catch {
				return false;
			}
		}
		const $ZodJWT = /*@__PURE__*/ $constructor("$ZodJWT", (inst, def) => {
			$ZodStringFormat.init(inst, def);
			inst._zod.check = (payload) => {
				if (isValidJWT(payload.value, def.alg)) return;
				payload.issues.push({
					code: "invalid_format",
					format: "jwt",
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodNumber = /*@__PURE__*/ $constructor("$ZodNumber", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.pattern = inst._zod.bag.pattern ?? number$1;
			inst._zod.parse = (payload, _ctx) => {
				if (def.coerce) try {
					payload.value = Number(payload.value);
				} catch (_) {}
				const input = payload.value;
				if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) return payload;
				const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : void 0 : void 0;
				payload.issues.push({
					expected: "number",
					code: "invalid_type",
					input,
					inst,
					...received ? { received } : {}
				});
				return payload;
			};
		});
		const $ZodNumberFormat = /*@__PURE__*/ $constructor("$ZodNumberFormat", (inst, def) => {
			$ZodCheckNumberFormat.init(inst, def);
			$ZodNumber.init(inst, def);
		});
		const $ZodBoolean = /*@__PURE__*/ $constructor("$ZodBoolean", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.pattern = boolean$1;
			inst._zod.parse = (payload, _ctx) => {
				if (def.coerce) try {
					payload.value = Boolean(payload.value);
				} catch (_) {}
				const input = payload.value;
				if (typeof input === "boolean") return payload;
				payload.issues.push({
					expected: "boolean",
					code: "invalid_type",
					input,
					inst
				});
				return payload;
			};
		});
		const $ZodUndefined = /*@__PURE__*/ $constructor("$ZodUndefined", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.pattern = _undefined$2;
			inst._zod.values = /* @__PURE__ */ new Set([void 0]);
			inst._zod.parse = (payload, _ctx) => {
				const input = payload.value;
				if (typeof input === "undefined") return payload;
				payload.issues.push({
					expected: "undefined",
					code: "invalid_type",
					input,
					inst
				});
				return payload;
			};
		});
		const $ZodUnknown = /*@__PURE__*/ $constructor("$ZodUnknown", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.parse = (payload) => payload;
		});
		const $ZodNever = /*@__PURE__*/ $constructor("$ZodNever", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.parse = (payload, _ctx) => {
				payload.issues.push({
					expected: "never",
					code: "invalid_type",
					input: payload.value,
					inst
				});
				return payload;
			};
		});
		function handleArrayResult(result, final, index) {
			if (result.issues.length) final.issues.push(...prefixIssues(index, result.issues));
			final.value[index] = result.value;
		}
		const $ZodArray = /*@__PURE__*/ $constructor("$ZodArray", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.parse = (payload, ctx) => {
				const input = payload.value;
				if (!Array.isArray(input)) {
					payload.issues.push({
						expected: "array",
						code: "invalid_type",
						input,
						inst
					});
					return payload;
				}
				payload.value = Array(input.length);
				const proms = [];
				for (let i = 0; i < input.length; i++) {
					const item = input[i];
					const result = def.element._zod.run({
						value: item,
						issues: []
					}, ctx);
					if (result instanceof Promise) proms.push(result.then((result) => handleArrayResult(result, payload, i)));
					else handleArrayResult(result, payload, i);
				}
				if (proms.length) return Promise.all(proms).then(() => payload);
				return payload;
			};
		});
		function handlePropertyResult(result, final, key, input, isOptionalIn, isOptionalOut) {
			const isPresent = key in input;
			if (result.issues.length) {
				if (isOptionalIn && isOptionalOut && !isPresent) return;
				final.issues.push(...prefixIssues(key, result.issues));
			}
			if (!isPresent && !isOptionalIn) {
				if (!result.issues.length) final.issues.push({
					code: "invalid_type",
					expected: "nonoptional",
					input: void 0,
					path: [key]
				});
				return;
			}
			if (result.value === void 0) {
				if (isPresent) final.value[key] = void 0;
			} else final.value[key] = result.value;
		}
		function normalizeDef(def) {
			const keys = Object.keys(def.shape);
			for (const k of keys) if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
			const okeys = optionalKeys(def.shape);
			return {
				...def,
				keys,
				keySet: new Set(keys),
				numKeys: keys.length,
				optionalKeys: new Set(okeys)
			};
		}
		function handleCatchall(proms, input, payload, ctx, def, inst) {
			const unrecognized = [];
			const keySet = def.keySet;
			const _catchall = def.catchall._zod;
			const t = _catchall.def.type;
			const isOptionalIn = _catchall.optin === "optional";
			const isOptionalOut = _catchall.optout === "optional";
			for (const key in input) {
				if (key === "__proto__") continue;
				if (keySet.has(key)) continue;
				if (t === "never") {
					unrecognized.push(key);
					continue;
				}
				const r = _catchall.run({
					value: input[key],
					issues: []
				}, ctx);
				if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut)));
				else handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
			}
			if (unrecognized.length) payload.issues.push({
				code: "unrecognized_keys",
				keys: unrecognized,
				input,
				inst
			});
			if (!proms.length) return payload;
			return Promise.all(proms).then(() => {
				return payload;
			});
		}
		const $ZodObject = /*@__PURE__*/ $constructor("$ZodObject", (inst, def) => {
			$ZodType.init(inst, def);
			if (!Object.getOwnPropertyDescriptor(def, "shape")?.get) {
				const sh = def.shape;
				Object.defineProperty(def, "shape", { get: () => {
					const newSh = { ...sh };
					Object.defineProperty(def, "shape", { value: newSh });
					return newSh;
				} });
			}
			const _normalized = cached(() => normalizeDef(def));
			defineLazy(inst._zod, "propValues", () => {
				const shape = def.shape;
				const propValues = {};
				for (const key in shape) {
					const field = shape[key]._zod;
					if (field.values) {
						propValues[key] ?? (propValues[key] = /* @__PURE__ */ new Set());
						for (const v of field.values) propValues[key].add(v);
					}
				}
				return propValues;
			});
			const isObject$1 = isObject;
			const catchall = def.catchall;
			let value;
			inst._zod.parse = (payload, ctx) => {
				value ?? (value = _normalized.value);
				const input = payload.value;
				if (!isObject$1(input)) {
					payload.issues.push({
						expected: "object",
						code: "invalid_type",
						input,
						inst
					});
					return payload;
				}
				payload.value = {};
				const proms = [];
				const shape = value.shape;
				for (const key of value.keys) {
					const el = shape[key];
					const isOptionalIn = el._zod.optin === "optional";
					const isOptionalOut = el._zod.optout === "optional";
					const r = el._zod.run({
						value: input[key],
						issues: []
					}, ctx);
					if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut)));
					else handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
				}
				if (!catchall) return proms.length ? Promise.all(proms).then(() => payload) : payload;
				return handleCatchall(proms, input, payload, ctx, _normalized.value, inst);
			};
		});
		const $ZodObjectJIT = /*@__PURE__*/ $constructor("$ZodObjectJIT", (inst, def) => {
			$ZodObject.init(inst, def);
			const superParse = inst._zod.parse;
			const _normalized = cached(() => normalizeDef(def));
			const generateFastpass = (shape) => {
				const doc = new Doc([
					"shape",
					"payload",
					"ctx"
				]);
				const normalized = _normalized.value;
				const parseStr = (key) => {
					const k = esc(key);
					return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
				};
				doc.write(`const input = payload.value;`);
				const ids = Object.create(null);
				let counter = 0;
				for (const key of normalized.keys) ids[key] = `key_${counter++}`;
				doc.write(`const newResult = {};`);
				for (const key of normalized.keys) {
					const id = ids[key];
					const k = esc(key);
					const schema = shape[key];
					const isOptionalIn = schema?._zod?.optin === "optional";
					const isOptionalOut = schema?._zod?.optout === "optional";
					doc.write(`const ${id} = ${parseStr(key)};`);
					if (isOptionalIn && isOptionalOut) doc.write(`
        if (${id}.issues.length) {
          if (${k} in input) {
            payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${k}, ...iss.path] : [${k}]
            })));
          }
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
					else if (!isOptionalIn) doc.write(`
        const ${id}_present = ${k} in input;
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
        }

        if (${id}_present) {
          if (${id}.value === undefined) {
            newResult[${k}] = undefined;
          } else {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
					else doc.write(`
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
				}
				doc.write(`payload.value = newResult;`);
				doc.write(`return payload;`);
				const fn = doc.compile();
				return (payload, ctx) => fn(shape, payload, ctx);
			};
			let fastpass;
			const isObject$2 = isObject;
			const jit = !globalConfig.jitless;
			const fastEnabled = jit && allowsEval.value;
			const catchall = def.catchall;
			let value;
			inst._zod.parse = (payload, ctx) => {
				value ?? (value = _normalized.value);
				const input = payload.value;
				if (!isObject$2(input)) {
					payload.issues.push({
						expected: "object",
						code: "invalid_type",
						input,
						inst
					});
					return payload;
				}
				if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
					if (!fastpass) fastpass = generateFastpass(def.shape);
					payload = fastpass(payload, ctx);
					if (!catchall) return payload;
					return handleCatchall([], input, payload, ctx, value, inst);
				}
				return superParse(payload, ctx);
			};
		});
		function handleUnionResults(results, final, inst, ctx) {
			for (const result of results) if (result.issues.length === 0) {
				final.value = result.value;
				return final;
			}
			const nonaborted = results.filter((r) => !aborted(r));
			if (nonaborted.length === 1) {
				final.value = nonaborted[0].value;
				return nonaborted[0];
			}
			final.issues.push({
				code: "invalid_union",
				input: final.value,
				inst,
				errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
			});
			return final;
		}
		const $ZodUnion = /*@__PURE__*/ $constructor("$ZodUnion", (inst, def) => {
			$ZodType.init(inst, def);
			defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : void 0);
			defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
			defineLazy(inst._zod, "values", () => {
				if (def.options.every((o) => o._zod.values)) return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
			});
			defineLazy(inst._zod, "pattern", () => {
				if (def.options.every((o) => o._zod.pattern)) {
					const patterns = def.options.map((o) => o._zod.pattern);
					return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
				}
			});
			const first = def.options.length === 1 ? def.options[0]._zod.run : null;
			inst._zod.parse = (payload, ctx) => {
				if (first) return first(payload, ctx);
				let async = false;
				const results = [];
				for (const option of def.options) {
					const result = option._zod.run({
						value: payload.value,
						issues: []
					}, ctx);
					if (result instanceof Promise) {
						results.push(result);
						async = true;
					} else {
						if (result.issues.length === 0) return result;
						results.push(result);
					}
				}
				if (!async) return handleUnionResults(results, payload, inst, ctx);
				return Promise.all(results).then((results) => {
					return handleUnionResults(results, payload, inst, ctx);
				});
			};
		});
		const $ZodIntersection = /*@__PURE__*/ $constructor("$ZodIntersection", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.parse = (payload, ctx) => {
				const input = payload.value;
				const left = def.left._zod.run({
					value: input,
					issues: []
				}, ctx);
				const right = def.right._zod.run({
					value: input,
					issues: []
				}, ctx);
				if (left instanceof Promise || right instanceof Promise) return Promise.all([left, right]).then(([left, right]) => {
					return handleIntersectionResults(payload, left, right);
				});
				return handleIntersectionResults(payload, left, right);
			};
		});
		function mergeValues(a, b) {
			if (a === b) return {
				valid: true,
				data: a
			};
			if (a instanceof Date && b instanceof Date && +a === +b) return {
				valid: true,
				data: a
			};
			if (isPlainObject(a) && isPlainObject(b)) {
				const bKeys = Object.keys(b);
				const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
				const newObj = {
					...a,
					...b
				};
				for (const key of sharedKeys) {
					const sharedValue = mergeValues(a[key], b[key]);
					if (!sharedValue.valid) return {
						valid: false,
						mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
					};
					newObj[key] = sharedValue.data;
				}
				return {
					valid: true,
					data: newObj
				};
			}
			if (Array.isArray(a) && Array.isArray(b)) {
				if (a.length !== b.length) return {
					valid: false,
					mergeErrorPath: []
				};
				const newArray = [];
				for (let index = 0; index < a.length; index++) {
					const itemA = a[index];
					const itemB = b[index];
					const sharedValue = mergeValues(itemA, itemB);
					if (!sharedValue.valid) return {
						valid: false,
						mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
					};
					newArray.push(sharedValue.data);
				}
				return {
					valid: true,
					data: newArray
				};
			}
			return {
				valid: false,
				mergeErrorPath: []
			};
		}
		function handleIntersectionResults(result, left, right) {
			const unrecKeys = /* @__PURE__ */ new Map();
			let unrecIssue;
			for (const iss of left.issues) if (iss.code === "unrecognized_keys") {
				unrecIssue ?? (unrecIssue = iss);
				for (const k of iss.keys) {
					if (!unrecKeys.has(k)) unrecKeys.set(k, {});
					unrecKeys.get(k).l = true;
				}
			} else result.issues.push(iss);
			for (const iss of right.issues) if (iss.code === "unrecognized_keys") for (const k of iss.keys) {
				if (!unrecKeys.has(k)) unrecKeys.set(k, {});
				unrecKeys.get(k).r = true;
			}
			else result.issues.push(iss);
			const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
			if (bothKeys.length && unrecIssue) result.issues.push({
				...unrecIssue,
				keys: bothKeys
			});
			if (aborted(result)) return result;
			const merged = mergeValues(left.value, right.value);
			if (!merged.valid) throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
			result.value = merged.data;
			return result;
		}
		const $ZodRecord = /*@__PURE__*/ $constructor("$ZodRecord", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.parse = (payload, ctx) => {
				const input = payload.value;
				if (!isPlainObject(input)) {
					payload.issues.push({
						expected: "record",
						code: "invalid_type",
						input,
						inst
					});
					return payload;
				}
				const proms = [];
				const values = def.keyType._zod.values;
				if (values) {
					payload.value = {};
					const recordKeys = /* @__PURE__ */ new Set();
					for (const key of values) if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
						recordKeys.add(typeof key === "number" ? key.toString() : key);
						const keyResult = def.keyType._zod.run({
							value: key,
							issues: []
						}, ctx);
						if (keyResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
						if (keyResult.issues.length) {
							payload.issues.push({
								code: "invalid_key",
								origin: "record",
								issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
								input: key,
								path: [key],
								inst
							});
							continue;
						}
						const outKey = keyResult.value;
						const result = def.valueType._zod.run({
							value: input[key],
							issues: []
						}, ctx);
						if (result instanceof Promise) proms.push(result.then((result) => {
							if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
							payload.value[outKey] = result.value;
						}));
						else {
							if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
							payload.value[outKey] = result.value;
						}
					}
					let unrecognized;
					for (const key in input) if (!recordKeys.has(key)) {
						unrecognized = unrecognized ?? [];
						unrecognized.push(key);
					}
					if (unrecognized && unrecognized.length > 0) payload.issues.push({
						code: "unrecognized_keys",
						input,
						inst,
						keys: unrecognized
					});
				} else {
					payload.value = {};
					for (const key of Reflect.ownKeys(input)) {
						if (key === "__proto__") continue;
						if (!Object.prototype.propertyIsEnumerable.call(input, key)) continue;
						let keyResult = def.keyType._zod.run({
							value: key,
							issues: []
						}, ctx);
						if (keyResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
						if (typeof key === "string" && number$1.test(key) && keyResult.issues.length) {
							const retryResult = def.keyType._zod.run({
								value: Number(key),
								issues: []
							}, ctx);
							if (retryResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
							if (retryResult.issues.length === 0) keyResult = retryResult;
						}
						if (keyResult.issues.length) {
							if (def.mode === "loose") payload.value[key] = input[key];
							else payload.issues.push({
								code: "invalid_key",
								origin: "record",
								issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
								input: key,
								path: [key],
								inst
							});
							continue;
						}
						const result = def.valueType._zod.run({
							value: input[key],
							issues: []
						}, ctx);
						if (result instanceof Promise) proms.push(result.then((result) => {
							if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
							payload.value[keyResult.value] = result.value;
						}));
						else {
							if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
							payload.value[keyResult.value] = result.value;
						}
					}
				}
				if (proms.length) return Promise.all(proms).then(() => payload);
				return payload;
			};
		});
		const $ZodEnum = /*@__PURE__*/ $constructor("$ZodEnum", (inst, def) => {
			$ZodType.init(inst, def);
			const values = getEnumValues(def.entries);
			const valuesSet = new Set(values);
			inst._zod.values = valuesSet;
			inst._zod.pattern = new RegExp(`^(${values.filter((k) => propertyKeyTypes.has(typeof k)).map((o) => typeof o === "string" ? escapeRegex(o) : o.toString()).join("|")})$`);
			inst._zod.parse = (payload, _ctx) => {
				const input = payload.value;
				if (valuesSet.has(input)) return payload;
				payload.issues.push({
					code: "invalid_value",
					values,
					input,
					inst
				});
				return payload;
			};
		});
		const $ZodLiteral = /*@__PURE__*/ $constructor("$ZodLiteral", (inst, def) => {
			$ZodType.init(inst, def);
			if (def.values.length === 0) throw new Error("Cannot create literal schema with no valid values");
			const values = new Set(def.values);
			inst._zod.values = values;
			inst._zod.pattern = new RegExp(`^(${def.values.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$`);
			inst._zod.parse = (payload, _ctx) => {
				const input = payload.value;
				if (values.has(input)) return payload;
				payload.issues.push({
					code: "invalid_value",
					values: def.values,
					input,
					inst
				});
				return payload;
			};
		});
		const $ZodTransform = /*@__PURE__*/ $constructor("$ZodTransform", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.optin = "optional";
			inst._zod.parse = (payload, ctx) => {
				if (ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
				const _out = def.transform(payload.value, payload);
				if (ctx.async) return (_out instanceof Promise ? _out : Promise.resolve(_out)).then((output) => {
					payload.value = output;
					payload.fallback = true;
					return payload;
				});
				if (_out instanceof Promise) throw new $ZodAsyncError();
				payload.value = _out;
				payload.fallback = true;
				return payload;
			};
		});
		function handleOptionalResult(result, input) {
			if (input === void 0 && (result.issues.length || result.fallback)) return {
				issues: [],
				value: void 0
			};
			return result;
		}
		const $ZodOptional = /*@__PURE__*/ $constructor("$ZodOptional", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.optin = "optional";
			inst._zod.optout = "optional";
			defineLazy(inst._zod, "values", () => {
				return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, void 0]) : void 0;
			});
			defineLazy(inst._zod, "pattern", () => {
				const pattern = def.innerType._zod.pattern;
				return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
			});
			inst._zod.parse = (payload, ctx) => {
				if (def.innerType._zod.optin === "optional") {
					const input = payload.value;
					const result = def.innerType._zod.run(payload, ctx);
					if (result instanceof Promise) return result.then((r) => handleOptionalResult(r, input));
					return handleOptionalResult(result, input);
				}
				if (payload.value === void 0) return payload;
				return def.innerType._zod.run(payload, ctx);
			};
		});
		const $ZodExactOptional = /*@__PURE__*/ $constructor("$ZodExactOptional", (inst, def) => {
			$ZodOptional.init(inst, def);
			defineLazy(inst._zod, "values", () => def.innerType._zod.values);
			defineLazy(inst._zod, "pattern", () => def.innerType._zod.pattern);
			inst._zod.parse = (payload, ctx) => {
				return def.innerType._zod.run(payload, ctx);
			};
		});
		const $ZodNullable = /*@__PURE__*/ $constructor("$ZodNullable", (inst, def) => {
			$ZodType.init(inst, def);
			defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
			defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
			defineLazy(inst._zod, "pattern", () => {
				const pattern = def.innerType._zod.pattern;
				return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
			});
			defineLazy(inst._zod, "values", () => {
				return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, null]) : void 0;
			});
			inst._zod.parse = (payload, ctx) => {
				if (payload.value === null) return payload;
				return def.innerType._zod.run(payload, ctx);
			};
		});
		const $ZodDefault = /*@__PURE__*/ $constructor("$ZodDefault", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.optin = "optional";
			defineLazy(inst._zod, "values", () => def.innerType._zod.values);
			inst._zod.parse = (payload, ctx) => {
				if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
				if (payload.value === void 0) {
					payload.value = def.defaultValue;
					/**
					* $ZodDefault returns the default value immediately in forward direction.
					* It doesn't pass the default value into the validator ("prefault"). There's no reason to pass the default value through validation. The validity of the default is enforced by TypeScript statically. Otherwise, it's the responsibility of the user to ensure the default is valid. In the case of pipes with divergent in/out types, you can specify the default on the `in` schema of your ZodPipe to set a "prefault" for the pipe.   */
					return payload;
				}
				const result = def.innerType._zod.run(payload, ctx);
				if (result instanceof Promise) return result.then((result) => handleDefaultResult(result, def));
				return handleDefaultResult(result, def);
			};
		});
		function handleDefaultResult(payload, def) {
			if (payload.value === void 0) payload.value = def.defaultValue;
			return payload;
		}
		const $ZodPrefault = /*@__PURE__*/ $constructor("$ZodPrefault", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.optin = "optional";
			defineLazy(inst._zod, "values", () => def.innerType._zod.values);
			inst._zod.parse = (payload, ctx) => {
				if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
				if (payload.value === void 0) payload.value = def.defaultValue;
				return def.innerType._zod.run(payload, ctx);
			};
		});
		const $ZodNonOptional = /*@__PURE__*/ $constructor("$ZodNonOptional", (inst, def) => {
			$ZodType.init(inst, def);
			defineLazy(inst._zod, "values", () => {
				const v = def.innerType._zod.values;
				return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
			});
			inst._zod.parse = (payload, ctx) => {
				const result = def.innerType._zod.run(payload, ctx);
				if (result instanceof Promise) return result.then((result) => handleNonOptionalResult(result, inst));
				return handleNonOptionalResult(result, inst);
			};
		});
		function handleNonOptionalResult(payload, inst) {
			if (!payload.issues.length && payload.value === void 0) payload.issues.push({
				code: "invalid_type",
				expected: "nonoptional",
				input: payload.value,
				inst
			});
			return payload;
		}
		const $ZodCatch = /*@__PURE__*/ $constructor("$ZodCatch", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.optin = "optional";
			defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
			defineLazy(inst._zod, "values", () => def.innerType._zod.values);
			inst._zod.parse = (payload, ctx) => {
				if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
				const result = def.innerType._zod.run(payload, ctx);
				if (result instanceof Promise) return result.then((result) => {
					payload.value = result.value;
					if (result.issues.length) {
						payload.value = def.catchValue({
							...payload,
							error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
							input: payload.value
						});
						payload.issues = [];
						payload.fallback = true;
					}
					return payload;
				});
				payload.value = result.value;
				if (result.issues.length) {
					payload.value = def.catchValue({
						...payload,
						error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
						input: payload.value
					});
					payload.issues = [];
					payload.fallback = true;
				}
				return payload;
			};
		});
		const $ZodPipe = /*@__PURE__*/ $constructor("$ZodPipe", (inst, def) => {
			$ZodType.init(inst, def);
			defineLazy(inst._zod, "values", () => def.in._zod.values);
			defineLazy(inst._zod, "optin", () => def.in._zod.optin);
			defineLazy(inst._zod, "optout", () => def.out._zod.optout);
			defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
			inst._zod.parse = (payload, ctx) => {
				if (ctx.direction === "backward") {
					const right = def.out._zod.run(payload, ctx);
					if (right instanceof Promise) return right.then((right) => handlePipeResult(right, def.in, ctx));
					return handlePipeResult(right, def.in, ctx);
				}
				const left = def.in._zod.run(payload, ctx);
				if (left instanceof Promise) return left.then((left) => handlePipeResult(left, def.out, ctx));
				return handlePipeResult(left, def.out, ctx);
			};
		});
		function handlePipeResult(left, next, ctx) {
			if (left.issues.length) {
				left.aborted = true;
				return left;
			}
			return next._zod.run({
				value: left.value,
				issues: left.issues,
				fallback: left.fallback
			}, ctx);
		}
		const $ZodReadonly = /*@__PURE__*/ $constructor("$ZodReadonly", (inst, def) => {
			$ZodType.init(inst, def);
			defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
			defineLazy(inst._zod, "values", () => def.innerType._zod.values);
			defineLazy(inst._zod, "optin", () => def.innerType?._zod?.optin);
			defineLazy(inst._zod, "optout", () => def.innerType?._zod?.optout);
			inst._zod.parse = (payload, ctx) => {
				if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
				const result = def.innerType._zod.run(payload, ctx);
				if (result instanceof Promise) return result.then(handleReadonlyResult);
				return handleReadonlyResult(result);
			};
		});
		function handleReadonlyResult(payload) {
			payload.value = Object.freeze(payload.value);
			return payload;
		}
		const $ZodLazy = /*@__PURE__*/ $constructor("$ZodLazy", (inst, def) => {
			$ZodType.init(inst, def);
			defineLazy(inst._zod, "innerType", () => {
				const d = def;
				if (!d._cachedInner) d._cachedInner = def.getter();
				return d._cachedInner;
			});
			defineLazy(inst._zod, "pattern", () => inst._zod.innerType?._zod?.pattern);
			defineLazy(inst._zod, "propValues", () => inst._zod.innerType?._zod?.propValues);
			defineLazy(inst._zod, "optin", () => inst._zod.innerType?._zod?.optin ?? void 0);
			defineLazy(inst._zod, "optout", () => inst._zod.innerType?._zod?.optout ?? void 0);
			inst._zod.parse = (payload, ctx) => {
				return inst._zod.innerType._zod.run(payload, ctx);
			};
		});
		const $ZodCustom = /*@__PURE__*/ $constructor("$ZodCustom", (inst, def) => {
			$ZodCheck.init(inst, def);
			$ZodType.init(inst, def);
			inst._zod.parse = (payload, _) => {
				return payload;
			};
			inst._zod.check = (payload) => {
				const input = payload.value;
				const r = def.fn(input);
				if (r instanceof Promise) return r.then((r) => handleRefineResult(r, payload, input, inst));
				handleRefineResult(r, payload, input, inst);
			};
		});
		function handleRefineResult(result, payload, input, inst) {
			if (!result) {
				const _iss = {
					code: "custom",
					input,
					inst,
					path: [...inst._zod.def.path ?? []],
					continue: !inst._zod.def.abort
				};
				if (inst._zod.def.params) _iss.params = inst._zod.def.params;
				payload.issues.push(issue(_iss));
			}
		}
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/registries.js
		var _a;
		var $ZodRegistry = class {
			constructor() {
				this._map = /* @__PURE__ */ new WeakMap();
				this._idmap = /* @__PURE__ */ new Map();
			}
			add(schema, ..._meta) {
				const meta = _meta[0];
				this._map.set(schema, meta);
				if (meta && typeof meta === "object" && "id" in meta) this._idmap.set(meta.id, schema);
				return this;
			}
			clear() {
				this._map = /* @__PURE__ */ new WeakMap();
				this._idmap = /* @__PURE__ */ new Map();
				return this;
			}
			remove(schema) {
				const meta = this._map.get(schema);
				if (meta && typeof meta === "object" && "id" in meta) this._idmap.delete(meta.id);
				this._map.delete(schema);
				return this;
			}
			get(schema) {
				const p = schema._zod.parent;
				if (p) {
					const pm = { ...this.get(p) ?? {} };
					delete pm.id;
					const f = {
						...pm,
						...this._map.get(schema)
					};
					return Object.keys(f).length ? f : void 0;
				}
				return this._map.get(schema);
			}
			has(schema) {
				return this._map.has(schema);
			}
		};
		function registry() {
			return new $ZodRegistry();
		}
		(_a = globalThis).__zod_globalRegistry ?? (_a.__zod_globalRegistry = registry());
		const globalRegistry = globalThis.__zod_globalRegistry;
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/api.js
		// @__NO_SIDE_EFFECTS__
		function _string(Class, params) {
			return new Class({
				type: "string",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _email(Class, params) {
			return new Class({
				type: "string",
				format: "email",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _guid(Class, params) {
			return new Class({
				type: "string",
				format: "guid",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _uuid(Class, params) {
			return new Class({
				type: "string",
				format: "uuid",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _uuidv4(Class, params) {
			return new Class({
				type: "string",
				format: "uuid",
				check: "string_format",
				abort: false,
				version: "v4",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _uuidv6(Class, params) {
			return new Class({
				type: "string",
				format: "uuid",
				check: "string_format",
				abort: false,
				version: "v6",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _uuidv7(Class, params) {
			return new Class({
				type: "string",
				format: "uuid",
				check: "string_format",
				abort: false,
				version: "v7",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _url(Class, params) {
			return new Class({
				type: "string",
				format: "url",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _emoji(Class, params) {
			return new Class({
				type: "string",
				format: "emoji",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _nanoid(Class, params) {
			return new Class({
				type: "string",
				format: "nanoid",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		/**
		* @deprecated CUID v1 is deprecated by its authors due to information leakage
		* (timestamps embedded in the id). Use {@link _cuid2} instead.
		* See https://github.com/paralleldrive/cuid.
		*/
		// @__NO_SIDE_EFFECTS__
		function _cuid(Class, params) {
			return new Class({
				type: "string",
				format: "cuid",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _cuid2(Class, params) {
			return new Class({
				type: "string",
				format: "cuid2",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _ulid(Class, params) {
			return new Class({
				type: "string",
				format: "ulid",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _xid(Class, params) {
			return new Class({
				type: "string",
				format: "xid",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _ksuid(Class, params) {
			return new Class({
				type: "string",
				format: "ksuid",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _ipv4(Class, params) {
			return new Class({
				type: "string",
				format: "ipv4",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _ipv6(Class, params) {
			return new Class({
				type: "string",
				format: "ipv6",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _cidrv4(Class, params) {
			return new Class({
				type: "string",
				format: "cidrv4",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _cidrv6(Class, params) {
			return new Class({
				type: "string",
				format: "cidrv6",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _base64(Class, params) {
			return new Class({
				type: "string",
				format: "base64",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _base64url(Class, params) {
			return new Class({
				type: "string",
				format: "base64url",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _e164(Class, params) {
			return new Class({
				type: "string",
				format: "e164",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _jwt(Class, params) {
			return new Class({
				type: "string",
				format: "jwt",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _isoDateTime(Class, params) {
			return new Class({
				type: "string",
				format: "datetime",
				check: "string_format",
				offset: false,
				local: false,
				precision: null,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _isoDate(Class, params) {
			return new Class({
				type: "string",
				format: "date",
				check: "string_format",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _isoTime(Class, params) {
			return new Class({
				type: "string",
				format: "time",
				check: "string_format",
				precision: null,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _isoDuration(Class, params) {
			return new Class({
				type: "string",
				format: "duration",
				check: "string_format",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _number(Class, params) {
			return new Class({
				type: "number",
				checks: [],
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _int(Class, params) {
			return new Class({
				type: "number",
				check: "number_format",
				abort: false,
				format: "safeint",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _boolean(Class, params) {
			return new Class({
				type: "boolean",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _undefined$1(Class, params) {
			return new Class({
				type: "undefined",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _unknown(Class) {
			return new Class({ type: "unknown" });
		}
		// @__NO_SIDE_EFFECTS__
		function _never(Class, params) {
			return new Class({
				type: "never",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _lt(value, params) {
			return new $ZodCheckLessThan({
				check: "less_than",
				...normalizeParams(params),
				value,
				inclusive: false
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _lte(value, params) {
			return new $ZodCheckLessThan({
				check: "less_than",
				...normalizeParams(params),
				value,
				inclusive: true
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _gt(value, params) {
			return new $ZodCheckGreaterThan({
				check: "greater_than",
				...normalizeParams(params),
				value,
				inclusive: false
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _gte(value, params) {
			return new $ZodCheckGreaterThan({
				check: "greater_than",
				...normalizeParams(params),
				value,
				inclusive: true
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _multipleOf(value, params) {
			return new $ZodCheckMultipleOf({
				check: "multiple_of",
				...normalizeParams(params),
				value
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _maxLength(maximum, params) {
			return new $ZodCheckMaxLength({
				check: "max_length",
				...normalizeParams(params),
				maximum
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _minLength(minimum, params) {
			return new $ZodCheckMinLength({
				check: "min_length",
				...normalizeParams(params),
				minimum
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _length(length, params) {
			return new $ZodCheckLengthEquals({
				check: "length_equals",
				...normalizeParams(params),
				length
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _regex(pattern, params) {
			return new $ZodCheckRegex({
				check: "string_format",
				format: "regex",
				...normalizeParams(params),
				pattern
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _lowercase(params) {
			return new $ZodCheckLowerCase({
				check: "string_format",
				format: "lowercase",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _uppercase(params) {
			return new $ZodCheckUpperCase({
				check: "string_format",
				format: "uppercase",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _includes(includes, params) {
			return new $ZodCheckIncludes({
				check: "string_format",
				format: "includes",
				...normalizeParams(params),
				includes
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _startsWith(prefix, params) {
			return new $ZodCheckStartsWith({
				check: "string_format",
				format: "starts_with",
				...normalizeParams(params),
				prefix
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _endsWith(suffix, params) {
			return new $ZodCheckEndsWith({
				check: "string_format",
				format: "ends_with",
				...normalizeParams(params),
				suffix
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _overwrite(tx) {
			return new $ZodCheckOverwrite({
				check: "overwrite",
				tx
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _normalize(form) {
			return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
		}
		// @__NO_SIDE_EFFECTS__
		function _trim() {
			return /* @__PURE__ */ _overwrite((input) => input.trim());
		}
		// @__NO_SIDE_EFFECTS__
		function _toLowerCase() {
			return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
		}
		// @__NO_SIDE_EFFECTS__
		function _toUpperCase() {
			return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
		}
		// @__NO_SIDE_EFFECTS__
		function _slugify() {
			return /* @__PURE__ */ _overwrite((input) => slugify(input));
		}
		// @__NO_SIDE_EFFECTS__
		function _array(Class, element, params) {
			return new Class({
				type: "array",
				element,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _refine(Class, fn, _params) {
			return new Class({
				type: "custom",
				check: "custom",
				fn,
				...normalizeParams(_params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _superRefine(fn, params) {
			const ch = /* @__PURE__ */ _check((payload) => {
				payload.addIssue = (issue$2) => {
					if (typeof issue$2 === "string") payload.issues.push(issue(issue$2, payload.value, ch._zod.def));
					else {
						const _issue = issue$2;
						if (_issue.fatal) _issue.continue = false;
						_issue.code ?? (_issue.code = "custom");
						_issue.input ?? (_issue.input = payload.value);
						_issue.inst ?? (_issue.inst = ch);
						_issue.continue ?? (_issue.continue = !ch._zod.def.abort);
						payload.issues.push(issue(_issue));
					}
				};
				return fn(payload.value, payload);
			}, params);
			return ch;
		}
		// @__NO_SIDE_EFFECTS__
		function _check(fn, params) {
			const ch = new $ZodCheck({
				check: "custom",
				...normalizeParams(params)
			});
			ch._zod.check = fn;
			return ch;
		}
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/to-json-schema.js
		function initializeContext(params) {
			let target = params?.target ?? "draft-2020-12";
			if (target === "draft-4") target = "draft-04";
			if (target === "draft-7") target = "draft-07";
			return {
				processors: params.processors ?? {},
				metadataRegistry: params?.metadata ?? globalRegistry,
				target,
				unrepresentable: params?.unrepresentable ?? "throw",
				override: params?.override ?? (() => {}),
				io: params?.io ?? "output",
				counter: 0,
				seen: /* @__PURE__ */ new Map(),
				cycles: params?.cycles ?? "ref",
				reused: params?.reused ?? "inline",
				external: params?.external ?? void 0
			};
		}
		function process(schema, ctx, _params = {
			path: [],
			schemaPath: []
		}) {
			var _a;
			const def = schema._zod.def;
			const seen = ctx.seen.get(schema);
			if (seen) {
				seen.count++;
				if (_params.schemaPath.includes(schema)) seen.cycle = _params.path;
				return seen.schema;
			}
			const result = {
				schema: {},
				count: 1,
				cycle: void 0,
				path: _params.path
			};
			ctx.seen.set(schema, result);
			const overrideSchema = schema._zod.toJSONSchema?.();
			if (overrideSchema) result.schema = overrideSchema;
			else {
				const params = {
					..._params,
					schemaPath: [..._params.schemaPath, schema],
					path: _params.path
				};
				if (schema._zod.processJSONSchema) schema._zod.processJSONSchema(ctx, result.schema, params);
				else {
					const _json = result.schema;
					const processor = ctx.processors[def.type];
					if (!processor) throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
					processor(schema, ctx, _json, params);
				}
				const parent = schema._zod.parent;
				if (parent) {
					if (!result.ref) result.ref = parent;
					process(parent, ctx, params);
					ctx.seen.get(parent).isParent = true;
				}
			}
			const meta = ctx.metadataRegistry.get(schema);
			if (meta) Object.assign(result.schema, meta);
			if (ctx.io === "input" && isTransforming(schema)) {
				delete result.schema.examples;
				delete result.schema.default;
			}
			if (ctx.io === "input" && "_prefault" in result.schema) (_a = result.schema).default ?? (_a.default = result.schema._prefault);
			delete result.schema._prefault;
			return ctx.seen.get(schema).schema;
		}
		function extractDefs(ctx, schema) {
			const root = ctx.seen.get(schema);
			if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
			const idToSchema = /* @__PURE__ */ new Map();
			for (const entry of ctx.seen.entries()) {
				const id = ctx.metadataRegistry.get(entry[0])?.id;
				if (id) {
					const existing = idToSchema.get(id);
					if (existing && existing !== entry[0]) throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
					idToSchema.set(id, entry[0]);
				}
			}
			const makeURI = (entry) => {
				const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
				if (ctx.external) {
					const externalId = ctx.external.registry.get(entry[0])?.id;
					const uriGenerator = ctx.external.uri ?? ((id) => id);
					if (externalId) return { ref: uriGenerator(externalId) };
					const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
					entry[1].defId = id;
					return {
						defId: id,
						ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}`
					};
				}
				if (entry[1] === root) return { ref: "#" };
				const defUriPrefix = `#/${defsSegment}/`;
				const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
				return {
					defId,
					ref: defUriPrefix + defId
				};
			};
			const extractToDef = (entry) => {
				if (entry[1].schema.$ref) return;
				const seen = entry[1];
				const { ref, defId } = makeURI(entry);
				seen.def = { ...seen.schema };
				if (defId) seen.defId = defId;
				const schema = seen.schema;
				for (const key in schema) delete schema[key];
				schema.$ref = ref;
			};
			if (ctx.cycles === "throw") for (const entry of ctx.seen.entries()) {
				const seen = entry[1];
				if (seen.cycle) throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
			}
			for (const entry of ctx.seen.entries()) {
				const seen = entry[1];
				if (schema === entry[0]) {
					extractToDef(entry);
					continue;
				}
				if (ctx.external) {
					const ext = ctx.external.registry.get(entry[0])?.id;
					if (schema !== entry[0] && ext) {
						extractToDef(entry);
						continue;
					}
				}
				if (ctx.metadataRegistry.get(entry[0])?.id) {
					extractToDef(entry);
					continue;
				}
				if (seen.cycle) {
					extractToDef(entry);
					continue;
				}
				if (seen.count > 1) {
					if (ctx.reused === "ref") {
						extractToDef(entry);
						continue;
					}
				}
			}
		}
		function finalize(ctx, schema) {
			const root = ctx.seen.get(schema);
			if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
			const flattenRef = (zodSchema) => {
				const seen = ctx.seen.get(zodSchema);
				if (seen.ref === null) return;
				const schema = seen.def ?? seen.schema;
				const _cached = { ...schema };
				const ref = seen.ref;
				seen.ref = null;
				if (ref) {
					flattenRef(ref);
					const refSeen = ctx.seen.get(ref);
					const refSchema = refSeen.schema;
					if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
						schema.allOf = schema.allOf ?? [];
						schema.allOf.push(refSchema);
					} else Object.assign(schema, refSchema);
					Object.assign(schema, _cached);
					if (zodSchema._zod.parent === ref) for (const key in schema) {
						if (key === "$ref" || key === "allOf") continue;
						if (!(key in _cached)) delete schema[key];
					}
					if (refSchema.$ref && refSeen.def) for (const key in schema) {
						if (key === "$ref" || key === "allOf") continue;
						if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) delete schema[key];
					}
				}
				const parent = zodSchema._zod.parent;
				if (parent && parent !== ref) {
					flattenRef(parent);
					const parentSeen = ctx.seen.get(parent);
					if (parentSeen?.schema.$ref) {
						schema.$ref = parentSeen.schema.$ref;
						if (parentSeen.def) for (const key in schema) {
							if (key === "$ref" || key === "allOf") continue;
							if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) delete schema[key];
						}
					}
				}
				ctx.override({
					zodSchema,
					jsonSchema: schema,
					path: seen.path ?? []
				});
			};
			for (const entry of [...ctx.seen.entries()].reverse()) flattenRef(entry[0]);
			const result = {};
			if (ctx.target === "draft-2020-12") result.$schema = "https://json-schema.org/draft/2020-12/schema";
			else if (ctx.target === "draft-07") result.$schema = "http://json-schema.org/draft-07/schema#";
			else if (ctx.target === "draft-04") result.$schema = "http://json-schema.org/draft-04/schema#";
			else if (ctx.target === "openapi-3.0") {}
			if (ctx.external?.uri) {
				const id = ctx.external.registry.get(schema)?.id;
				if (!id) throw new Error("Schema is missing an `id` property");
				result.$id = ctx.external.uri(id);
			}
			Object.assign(result, root.def ?? root.schema);
			const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
			if (rootMetaId !== void 0 && result.id === rootMetaId) delete result.id;
			const defs = ctx.external?.defs ?? {};
			for (const entry of ctx.seen.entries()) {
				const seen = entry[1];
				if (seen.def && seen.defId) {
					if (seen.def.id === seen.defId) delete seen.def.id;
					defs[seen.defId] = seen.def;
				}
			}
			if (ctx.external) {} else if (Object.keys(defs).length > 0) {
				if (ctx.target === "draft-2020-12") result.$defs = defs;
				else result.definitions = defs;
			}
			try {
				const finalized = JSON.parse(JSON.stringify(result));
				Object.defineProperty(finalized, "~standard", {
					value: {
						...schema["~standard"],
						jsonSchema: {
							input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
							output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
						}
					},
					enumerable: false,
					writable: false
				});
				return finalized;
			} catch (_err) {
				throw new Error("Error converting schema to JSON.");
			}
		}
		function isTransforming(_schema, _ctx) {
			const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
			if (ctx.seen.has(_schema)) return false;
			ctx.seen.add(_schema);
			const def = _schema._zod.def;
			if (def.type === "transform") return true;
			if (def.type === "array") return isTransforming(def.element, ctx);
			if (def.type === "set") return isTransforming(def.valueType, ctx);
			if (def.type === "lazy") return isTransforming(def.getter(), ctx);
			if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault") return isTransforming(def.innerType, ctx);
			if (def.type === "intersection") return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
			if (def.type === "record" || def.type === "map") return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
			if (def.type === "pipe") {
				if (_schema._zod.traits.has("$ZodCodec")) return true;
				return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
			}
			if (def.type === "object") {
				for (const key in def.shape) if (isTransforming(def.shape[key], ctx)) return true;
				return false;
			}
			if (def.type === "union") {
				for (const option of def.options) if (isTransforming(option, ctx)) return true;
				return false;
			}
			if (def.type === "tuple") {
				for (const item of def.items) if (isTransforming(item, ctx)) return true;
				if (def.rest && isTransforming(def.rest, ctx)) return true;
				return false;
			}
			return false;
		}
		/**
		* Creates a toJSONSchema method for a schema instance.
		* This encapsulates the logic of initializing context, processing, extracting defs, and finalizing.
		*/
		const createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
			const ctx = initializeContext({
				...params,
				processors
			});
			process(schema, ctx);
			extractDefs(ctx, schema);
			return finalize(ctx, schema);
		};
		const createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
			const { libraryOptions, target } = params ?? {};
			const ctx = initializeContext({
				...libraryOptions ?? {},
				target,
				io,
				processors
			});
			process(schema, ctx);
			extractDefs(ctx, schema);
			return finalize(ctx, schema);
		};
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/json-schema-processors.js
		const formatMap = {
			guid: "uuid",
			url: "uri",
			datetime: "date-time",
			json_string: "json-string",
			regex: ""
		};
		const stringProcessor = (schema, ctx, _json, _params) => {
			const json = _json;
			json.type = "string";
			const { minimum, maximum, format, patterns, contentEncoding } = schema._zod.bag;
			if (typeof minimum === "number") json.minLength = minimum;
			if (typeof maximum === "number") json.maxLength = maximum;
			if (format) {
				json.format = formatMap[format] ?? format;
				if (json.format === "") delete json.format;
				if (format === "time") delete json.format;
			}
			if (contentEncoding) json.contentEncoding = contentEncoding;
			if (patterns && patterns.size > 0) {
				const regexes = [...patterns];
				if (regexes.length === 1) json.pattern = regexes[0].source;
				else if (regexes.length > 1) json.allOf = [...regexes.map((regex) => ({
					...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
					pattern: regex.source
				}))];
			}
		};
		const numberProcessor = (schema, ctx, _json, _params) => {
			const json = _json;
			const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
			if (typeof format === "string" && format.includes("int")) json.type = "integer";
			else json.type = "number";
			const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
			const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
			const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
			if (exMin) {
				if (legacy) {
					json.minimum = exclusiveMinimum;
					json.exclusiveMinimum = true;
				} else json.exclusiveMinimum = exclusiveMinimum;
			} else if (typeof minimum === "number") json.minimum = minimum;
			if (exMax) {
				if (legacy) {
					json.maximum = exclusiveMaximum;
					json.exclusiveMaximum = true;
				} else json.exclusiveMaximum = exclusiveMaximum;
			} else if (typeof maximum === "number") json.maximum = maximum;
			if (typeof multipleOf === "number") json.multipleOf = multipleOf;
		};
		const booleanProcessor = (_schema, _ctx, json, _params) => {
			json.type = "boolean";
		};
		const undefinedProcessor = (_schema, ctx, _json, _params) => {
			if (ctx.unrepresentable === "throw") throw new Error("Undefined cannot be represented in JSON Schema");
		};
		const neverProcessor = (_schema, _ctx, json, _params) => {
			json.not = {};
		};
		const enumProcessor = (schema, _ctx, json, _params) => {
			const def = schema._zod.def;
			const values = getEnumValues(def.entries);
			if (values.every((v) => typeof v === "number")) json.type = "number";
			if (values.every((v) => typeof v === "string")) json.type = "string";
			json.enum = values;
		};
		const literalProcessor = (schema, ctx, json, _params) => {
			const def = schema._zod.def;
			const vals = [];
			for (const val of def.values) if (val === void 0) {
				if (ctx.unrepresentable === "throw") throw new Error("Literal `undefined` cannot be represented in JSON Schema");
			} else if (typeof val === "bigint") {
				if (ctx.unrepresentable === "throw") throw new Error("BigInt literals cannot be represented in JSON Schema");
				else vals.push(Number(val));
			} else vals.push(val);
			if (vals.length === 0) {} else if (vals.length === 1) {
				const val = vals[0];
				json.type = val === null ? "null" : typeof val;
				if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") json.enum = [val];
				else json.const = val;
			} else {
				if (vals.every((v) => typeof v === "number")) json.type = "number";
				if (vals.every((v) => typeof v === "string")) json.type = "string";
				if (vals.every((v) => typeof v === "boolean")) json.type = "boolean";
				if (vals.every((v) => v === null)) json.type = "null";
				json.enum = vals;
			}
		};
		const customProcessor = (_schema, ctx, _json, _params) => {
			if (ctx.unrepresentable === "throw") throw new Error("Custom types cannot be represented in JSON Schema");
		};
		const transformProcessor = (_schema, ctx, _json, _params) => {
			if (ctx.unrepresentable === "throw") throw new Error("Transforms cannot be represented in JSON Schema");
		};
		const arrayProcessor = (schema, ctx, _json, params) => {
			const json = _json;
			const def = schema._zod.def;
			const { minimum, maximum } = schema._zod.bag;
			if (typeof minimum === "number") json.minItems = minimum;
			if (typeof maximum === "number") json.maxItems = maximum;
			json.type = "array";
			json.items = process(def.element, ctx, {
				...params,
				path: [...params.path, "items"]
			});
		};
		const objectProcessor = (schema, ctx, _json, params) => {
			const json = _json;
			const def = schema._zod.def;
			json.type = "object";
			json.properties = {};
			const shape = def.shape;
			for (const key in shape) json.properties[key] = process(shape[key], ctx, {
				...params,
				path: [
					...params.path,
					"properties",
					key
				]
			});
			const allKeys = new Set(Object.keys(shape));
			const requiredKeys = new Set([...allKeys].filter((key) => {
				const v = def.shape[key]._zod;
				if (ctx.io === "input") return v.optin === void 0;
				else return v.optout === void 0;
			}));
			if (requiredKeys.size > 0) json.required = Array.from(requiredKeys);
			if (def.catchall?._zod.def.type === "never") json.additionalProperties = false;
			else if (!def.catchall) {
				if (ctx.io === "output") json.additionalProperties = false;
			} else if (def.catchall) json.additionalProperties = process(def.catchall, ctx, {
				...params,
				path: [...params.path, "additionalProperties"]
			});
		};
		const unionProcessor = (schema, ctx, json, params) => {
			const def = schema._zod.def;
			const isExclusive = def.inclusive === false;
			const options = def.options.map((x, i) => process(x, ctx, {
				...params,
				path: [
					...params.path,
					isExclusive ? "oneOf" : "anyOf",
					i
				]
			}));
			if (isExclusive) json.oneOf = options;
			else json.anyOf = options;
		};
		const intersectionProcessor = (schema, ctx, json, params) => {
			const def = schema._zod.def;
			const a = process(def.left, ctx, {
				...params,
				path: [
					...params.path,
					"allOf",
					0
				]
			});
			const b = process(def.right, ctx, {
				...params,
				path: [
					...params.path,
					"allOf",
					1
				]
			});
			const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
			json.allOf = [...isSimpleIntersection(a) ? a.allOf : [a], ...isSimpleIntersection(b) ? b.allOf : [b]];
		};
		const recordProcessor = (schema, ctx, _json, params) => {
			const json = _json;
			const def = schema._zod.def;
			json.type = "object";
			const keyType = def.keyType;
			const patterns = keyType._zod.bag?.patterns;
			if (def.mode === "loose" && patterns && patterns.size > 0) {
				const valueSchema = process(def.valueType, ctx, {
					...params,
					path: [
						...params.path,
						"patternProperties",
						"*"
					]
				});
				json.patternProperties = {};
				for (const pattern of patterns) json.patternProperties[pattern.source] = valueSchema;
			} else {
				if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") json.propertyNames = process(def.keyType, ctx, {
					...params,
					path: [...params.path, "propertyNames"]
				});
				json.additionalProperties = process(def.valueType, ctx, {
					...params,
					path: [...params.path, "additionalProperties"]
				});
			}
			const keyValues = keyType._zod.values;
			if (keyValues) {
				const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
				if (validKeyValues.length > 0) json.required = validKeyValues;
			}
		};
		const nullableProcessor = (schema, ctx, json, params) => {
			const def = schema._zod.def;
			const inner = process(def.innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			if (ctx.target === "openapi-3.0") {
				seen.ref = def.innerType;
				json.nullable = true;
			} else json.anyOf = [inner, { type: "null" }];
		};
		const nonoptionalProcessor = (schema, ctx, _json, params) => {
			const def = schema._zod.def;
			process(def.innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = def.innerType;
		};
		const defaultProcessor = (schema, ctx, json, params) => {
			const def = schema._zod.def;
			process(def.innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = def.innerType;
			json.default = JSON.parse(JSON.stringify(def.defaultValue));
		};
		const prefaultProcessor = (schema, ctx, json, params) => {
			const def = schema._zod.def;
			process(def.innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = def.innerType;
			if (ctx.io === "input") json._prefault = JSON.parse(JSON.stringify(def.defaultValue));
		};
		const catchProcessor = (schema, ctx, json, params) => {
			const def = schema._zod.def;
			process(def.innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = def.innerType;
			let catchValue;
			try {
				catchValue = def.catchValue(void 0);
			} catch {
				throw new Error("Dynamic catch values are not supported in JSON Schema");
			}
			json.default = catchValue;
		};
		const pipeProcessor = (schema, ctx, _json, params) => {
			const def = schema._zod.def;
			const inIsTransform = def.in._zod.traits.has("$ZodTransform");
			const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
			process(innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = innerType;
		};
		const readonlyProcessor = (schema, ctx, json, params) => {
			const def = schema._zod.def;
			process(def.innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = def.innerType;
			json.readOnly = true;
		};
		const optionalProcessor = (schema, ctx, _json, params) => {
			const def = schema._zod.def;
			process(def.innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = def.innerType;
		};
		const lazyProcessor = (schema, ctx, _json, params) => {
			const innerType = schema._zod.innerType;
			process(innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = innerType;
		};
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/classic/iso.js
		const ZodISODateTime = /*@__PURE__*/ $constructor("ZodISODateTime", (inst, def) => {
			$ZodISODateTime.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		function datetime(params) {
			return /* @__PURE__ */ _isoDateTime(ZodISODateTime, params);
		}
		const ZodISODate = /*@__PURE__*/ $constructor("ZodISODate", (inst, def) => {
			$ZodISODate.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		function date(params) {
			return /* @__PURE__ */ _isoDate(ZodISODate, params);
		}
		const ZodISOTime = /*@__PURE__*/ $constructor("ZodISOTime", (inst, def) => {
			$ZodISOTime.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		function time(params) {
			return /* @__PURE__ */ _isoTime(ZodISOTime, params);
		}
		const ZodISODuration = /*@__PURE__*/ $constructor("ZodISODuration", (inst, def) => {
			$ZodISODuration.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		function duration(params) {
			return /* @__PURE__ */ _isoDuration(ZodISODuration, params);
		}
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/classic/errors.js
		const initializer = (inst, issues) => {
			$ZodError.init(inst, issues);
			inst.name = "ZodError";
			Object.defineProperties(inst, {
				format: { value: (mapper) => formatError(inst, mapper) },
				flatten: { value: (mapper) => flattenError(inst, mapper) },
				addIssue: { value: (issue) => {
					inst.issues.push(issue);
					inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
				} },
				addIssues: { value: (issues) => {
					inst.issues.push(...issues);
					inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
				} },
				isEmpty: { get() {
					return inst.issues.length === 0;
				} }
			});
		};
		const ZodRealError = /*@__PURE__*/ $constructor("ZodError", initializer, { Parent: Error });
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/classic/parse.js
		const parse = /* @__PURE__ */ _parse(ZodRealError);
		const parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
		const safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
		const safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
		const encode = /* @__PURE__ */ _encode(ZodRealError);
		const decode = /* @__PURE__ */ _decode(ZodRealError);
		const encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
		const decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
		const safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
		const safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
		const safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
		const safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/classic/schemas.js
		const _installedGroups = /* @__PURE__ */ new WeakMap();
		function _installLazyMethods(inst, group, methods) {
			const proto = Object.getPrototypeOf(inst);
			let installed = _installedGroups.get(proto);
			if (!installed) {
				installed = /* @__PURE__ */ new Set();
				_installedGroups.set(proto, installed);
			}
			if (installed.has(group)) return;
			installed.add(group);
			for (const key in methods) {
				const fn = methods[key];
				Object.defineProperty(proto, key, {
					configurable: true,
					enumerable: false,
					get() {
						const bound = fn.bind(this);
						Object.defineProperty(this, key, {
							configurable: true,
							writable: true,
							enumerable: true,
							value: bound
						});
						return bound;
					},
					set(v) {
						Object.defineProperty(this, key, {
							configurable: true,
							writable: true,
							enumerable: true,
							value: v
						});
					}
				});
			}
		}
		const ZodType = /*@__PURE__*/ $constructor("ZodType", (inst, def) => {
			$ZodType.init(inst, def);
			Object.assign(inst["~standard"], { jsonSchema: {
				input: createStandardJSONSchemaMethod(inst, "input"),
				output: createStandardJSONSchemaMethod(inst, "output")
			} });
			inst.toJSONSchema = createToJSONSchemaMethod(inst, {});
			inst.def = def;
			inst.type = def.type;
			Object.defineProperty(inst, "_def", { value: def });
			inst.parse = (data, params) => parse(inst, data, params, { callee: inst.parse });
			inst.safeParse = (data, params) => safeParse(inst, data, params);
			inst.parseAsync = async (data, params) => parseAsync(inst, data, params, { callee: inst.parseAsync });
			inst.safeParseAsync = async (data, params) => safeParseAsync(inst, data, params);
			inst.spa = inst.safeParseAsync;
			inst.encode = (data, params) => encode(inst, data, params);
			inst.decode = (data, params) => decode(inst, data, params);
			inst.encodeAsync = async (data, params) => encodeAsync(inst, data, params);
			inst.decodeAsync = async (data, params) => decodeAsync(inst, data, params);
			inst.safeEncode = (data, params) => safeEncode(inst, data, params);
			inst.safeDecode = (data, params) => safeDecode(inst, data, params);
			inst.safeEncodeAsync = async (data, params) => safeEncodeAsync(inst, data, params);
			inst.safeDecodeAsync = async (data, params) => safeDecodeAsync(inst, data, params);
			_installLazyMethods(inst, "ZodType", {
				check(...chks) {
					const def = this.def;
					return this.clone(mergeDefs(def, { checks: [...def.checks ?? [], ...chks.map((ch) => typeof ch === "function" ? { _zod: {
						check: ch,
						def: { check: "custom" },
						onattach: []
					} } : ch)] }), { parent: true });
				},
				with(...chks) {
					return this.check(...chks);
				},
				clone(def, params) {
					return clone(this, def, params);
				},
				brand() {
					return this;
				},
				register(reg, meta) {
					reg.add(this, meta);
					return this;
				},
				refine(check, params) {
					return this.check(refine(check, params));
				},
				superRefine(refinement, params) {
					return this.check(superRefine(refinement, params));
				},
				overwrite(fn) {
					return this.check(/* @__PURE__ */ _overwrite(fn));
				},
				optional() {
					return optional(this);
				},
				exactOptional() {
					return exactOptional(this);
				},
				nullable() {
					return nullable(this);
				},
				nullish() {
					return optional(nullable(this));
				},
				nonoptional(params) {
					return nonoptional(this, params);
				},
				array() {
					return array(this);
				},
				or(arg) {
					return union([this, arg]);
				},
				and(arg) {
					return intersection(this, arg);
				},
				transform(tx) {
					return pipe(this, transform(tx));
				},
				default(d) {
					return _default(this, d);
				},
				prefault(d) {
					return prefault(this, d);
				},
				catch(params) {
					return _catch(this, params);
				},
				pipe(target) {
					return pipe(this, target);
				},
				readonly() {
					return readonly(this);
				},
				describe(description) {
					const cl = this.clone();
					globalRegistry.add(cl, { description });
					return cl;
				},
				meta(...args) {
					if (args.length === 0) return globalRegistry.get(this);
					const cl = this.clone();
					globalRegistry.add(cl, args[0]);
					return cl;
				},
				isOptional() {
					return this.safeParse(void 0).success;
				},
				isNullable() {
					return this.safeParse(null).success;
				},
				apply(fn) {
					return fn(this);
				}
			});
			Object.defineProperty(inst, "description", {
				get() {
					return globalRegistry.get(inst)?.description;
				},
				configurable: true
			});
			return inst;
		});
		/** @internal */
		const _ZodString = /*@__PURE__*/ $constructor("_ZodString", (inst, def) => {
			$ZodString.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
			const bag = inst._zod.bag;
			inst.format = bag.format ?? null;
			inst.minLength = bag.minimum ?? null;
			inst.maxLength = bag.maximum ?? null;
			_installLazyMethods(inst, "_ZodString", {
				regex(...args) {
					return this.check(/* @__PURE__ */ _regex(...args));
				},
				includes(...args) {
					return this.check(/* @__PURE__ */ _includes(...args));
				},
				startsWith(...args) {
					return this.check(/* @__PURE__ */ _startsWith(...args));
				},
				endsWith(...args) {
					return this.check(/* @__PURE__ */ _endsWith(...args));
				},
				min(...args) {
					return this.check(/* @__PURE__ */ _minLength(...args));
				},
				max(...args) {
					return this.check(/* @__PURE__ */ _maxLength(...args));
				},
				length(...args) {
					return this.check(/* @__PURE__ */ _length(...args));
				},
				nonempty(...args) {
					return this.check(/* @__PURE__ */ _minLength(1, ...args));
				},
				lowercase(params) {
					return this.check(/* @__PURE__ */ _lowercase(params));
				},
				uppercase(params) {
					return this.check(/* @__PURE__ */ _uppercase(params));
				},
				trim() {
					return this.check(/* @__PURE__ */ _trim());
				},
				normalize(...args) {
					return this.check(/* @__PURE__ */ _normalize(...args));
				},
				toLowerCase() {
					return this.check(/* @__PURE__ */ _toLowerCase());
				},
				toUpperCase() {
					return this.check(/* @__PURE__ */ _toUpperCase());
				},
				slugify() {
					return this.check(/* @__PURE__ */ _slugify());
				}
			});
		});
		const ZodString = /*@__PURE__*/ $constructor("ZodString", (inst, def) => {
			$ZodString.init(inst, def);
			_ZodString.init(inst, def);
			inst.email = (params) => inst.check(/* @__PURE__ */ _email(ZodEmail, params));
			inst.url = (params) => inst.check(/* @__PURE__ */ _url(ZodURL, params));
			inst.jwt = (params) => inst.check(/* @__PURE__ */ _jwt(ZodJWT, params));
			inst.emoji = (params) => inst.check(/* @__PURE__ */ _emoji(ZodEmoji, params));
			inst.guid = (params) => inst.check(/* @__PURE__ */ _guid(ZodGUID, params));
			inst.uuid = (params) => inst.check(/* @__PURE__ */ _uuid(ZodUUID, params));
			inst.uuidv4 = (params) => inst.check(/* @__PURE__ */ _uuidv4(ZodUUID, params));
			inst.uuidv6 = (params) => inst.check(/* @__PURE__ */ _uuidv6(ZodUUID, params));
			inst.uuidv7 = (params) => inst.check(/* @__PURE__ */ _uuidv7(ZodUUID, params));
			inst.nanoid = (params) => inst.check(/* @__PURE__ */ _nanoid(ZodNanoID, params));
			inst.guid = (params) => inst.check(/* @__PURE__ */ _guid(ZodGUID, params));
			inst.cuid = (params) => inst.check(/* @__PURE__ */ _cuid(ZodCUID, params));
			inst.cuid2 = (params) => inst.check(/* @__PURE__ */ _cuid2(ZodCUID2, params));
			inst.ulid = (params) => inst.check(/* @__PURE__ */ _ulid(ZodULID, params));
			inst.base64 = (params) => inst.check(/* @__PURE__ */ _base64(ZodBase64, params));
			inst.base64url = (params) => inst.check(/* @__PURE__ */ _base64url(ZodBase64URL, params));
			inst.xid = (params) => inst.check(/* @__PURE__ */ _xid(ZodXID, params));
			inst.ksuid = (params) => inst.check(/* @__PURE__ */ _ksuid(ZodKSUID, params));
			inst.ipv4 = (params) => inst.check(/* @__PURE__ */ _ipv4(ZodIPv4, params));
			inst.ipv6 = (params) => inst.check(/* @__PURE__ */ _ipv6(ZodIPv6, params));
			inst.cidrv4 = (params) => inst.check(/* @__PURE__ */ _cidrv4(ZodCIDRv4, params));
			inst.cidrv6 = (params) => inst.check(/* @__PURE__ */ _cidrv6(ZodCIDRv6, params));
			inst.e164 = (params) => inst.check(/* @__PURE__ */ _e164(ZodE164, params));
			inst.datetime = (params) => inst.check(datetime(params));
			inst.date = (params) => inst.check(date(params));
			inst.time = (params) => inst.check(time(params));
			inst.duration = (params) => inst.check(duration(params));
		});
		function string(params) {
			return /* @__PURE__ */ _string(ZodString, params);
		}
		const ZodStringFormat = /*@__PURE__*/ $constructor("ZodStringFormat", (inst, def) => {
			$ZodStringFormat.init(inst, def);
			_ZodString.init(inst, def);
		});
		const ZodEmail = /*@__PURE__*/ $constructor("ZodEmail", (inst, def) => {
			$ZodEmail.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodGUID = /*@__PURE__*/ $constructor("ZodGUID", (inst, def) => {
			$ZodGUID.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodUUID = /*@__PURE__*/ $constructor("ZodUUID", (inst, def) => {
			$ZodUUID.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodURL = /*@__PURE__*/ $constructor("ZodURL", (inst, def) => {
			$ZodURL.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodEmoji = /*@__PURE__*/ $constructor("ZodEmoji", (inst, def) => {
			$ZodEmoji.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodNanoID = /*@__PURE__*/ $constructor("ZodNanoID", (inst, def) => {
			$ZodNanoID.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		/**
		* @deprecated CUID v1 is deprecated by its authors due to information leakage
		* (timestamps embedded in the id). Use {@link ZodCUID2} instead.
		* See https://github.com/paralleldrive/cuid.
		*/
		const ZodCUID = /*@__PURE__*/ $constructor("ZodCUID", (inst, def) => {
			$ZodCUID.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodCUID2 = /*@__PURE__*/ $constructor("ZodCUID2", (inst, def) => {
			$ZodCUID2.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodULID = /*@__PURE__*/ $constructor("ZodULID", (inst, def) => {
			$ZodULID.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodXID = /*@__PURE__*/ $constructor("ZodXID", (inst, def) => {
			$ZodXID.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodKSUID = /*@__PURE__*/ $constructor("ZodKSUID", (inst, def) => {
			$ZodKSUID.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodIPv4 = /*@__PURE__*/ $constructor("ZodIPv4", (inst, def) => {
			$ZodIPv4.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodIPv6 = /*@__PURE__*/ $constructor("ZodIPv6", (inst, def) => {
			$ZodIPv6.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodCIDRv4 = /*@__PURE__*/ $constructor("ZodCIDRv4", (inst, def) => {
			$ZodCIDRv4.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodCIDRv6 = /*@__PURE__*/ $constructor("ZodCIDRv6", (inst, def) => {
			$ZodCIDRv6.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodBase64 = /*@__PURE__*/ $constructor("ZodBase64", (inst, def) => {
			$ZodBase64.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodBase64URL = /*@__PURE__*/ $constructor("ZodBase64URL", (inst, def) => {
			$ZodBase64URL.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodE164 = /*@__PURE__*/ $constructor("ZodE164", (inst, def) => {
			$ZodE164.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodJWT = /*@__PURE__*/ $constructor("ZodJWT", (inst, def) => {
			$ZodJWT.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodNumber = /*@__PURE__*/ $constructor("ZodNumber", (inst, def) => {
			$ZodNumber.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
			_installLazyMethods(inst, "ZodNumber", {
				gt(value, params) {
					return this.check(/* @__PURE__ */ _gt(value, params));
				},
				gte(value, params) {
					return this.check(/* @__PURE__ */ _gte(value, params));
				},
				min(value, params) {
					return this.check(/* @__PURE__ */ _gte(value, params));
				},
				lt(value, params) {
					return this.check(/* @__PURE__ */ _lt(value, params));
				},
				lte(value, params) {
					return this.check(/* @__PURE__ */ _lte(value, params));
				},
				max(value, params) {
					return this.check(/* @__PURE__ */ _lte(value, params));
				},
				int(params) {
					return this.check(int(params));
				},
				safe(params) {
					return this.check(int(params));
				},
				positive(params) {
					return this.check(/* @__PURE__ */ _gt(0, params));
				},
				nonnegative(params) {
					return this.check(/* @__PURE__ */ _gte(0, params));
				},
				negative(params) {
					return this.check(/* @__PURE__ */ _lt(0, params));
				},
				nonpositive(params) {
					return this.check(/* @__PURE__ */ _lte(0, params));
				},
				multipleOf(value, params) {
					return this.check(/* @__PURE__ */ _multipleOf(value, params));
				},
				step(value, params) {
					return this.check(/* @__PURE__ */ _multipleOf(value, params));
				},
				finite() {
					return this;
				}
			});
			const bag = inst._zod.bag;
			inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
			inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
			inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? .5);
			inst.isFinite = true;
			inst.format = bag.format ?? null;
		});
		function number(params) {
			return /* @__PURE__ */ _number(ZodNumber, params);
		}
		const ZodNumberFormat = /*@__PURE__*/ $constructor("ZodNumberFormat", (inst, def) => {
			$ZodNumberFormat.init(inst, def);
			ZodNumber.init(inst, def);
		});
		function int(params) {
			return /* @__PURE__ */ _int(ZodNumberFormat, params);
		}
		const ZodBoolean = /*@__PURE__*/ $constructor("ZodBoolean", (inst, def) => {
			$ZodBoolean.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => booleanProcessor(inst, ctx, json, params);
		});
		function boolean(params) {
			return /* @__PURE__ */ _boolean(ZodBoolean, params);
		}
		const ZodUndefined = /*@__PURE__*/ $constructor("ZodUndefined", (inst, def) => {
			$ZodUndefined.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => undefinedProcessor(inst, ctx, json, params);
		});
		function _undefined(params) {
			return /* @__PURE__ */ _undefined$1(ZodUndefined, params);
		}
		const ZodUnknown = /*@__PURE__*/ $constructor("ZodUnknown", (inst, def) => {
			$ZodUnknown.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => void 0;
		});
		function unknown() {
			return /* @__PURE__ */ _unknown(ZodUnknown);
		}
		const ZodNever = /*@__PURE__*/ $constructor("ZodNever", (inst, def) => {
			$ZodNever.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
		});
		function never(params) {
			return /* @__PURE__ */ _never(ZodNever, params);
		}
		const ZodArray = /*@__PURE__*/ $constructor("ZodArray", (inst, def) => {
			$ZodArray.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
			inst.element = def.element;
			_installLazyMethods(inst, "ZodArray", {
				min(n, params) {
					return this.check(/* @__PURE__ */ _minLength(n, params));
				},
				nonempty(params) {
					return this.check(/* @__PURE__ */ _minLength(1, params));
				},
				max(n, params) {
					return this.check(/* @__PURE__ */ _maxLength(n, params));
				},
				length(n, params) {
					return this.check(/* @__PURE__ */ _length(n, params));
				},
				unwrap() {
					return this.element;
				}
			});
		});
		function array(element, params) {
			return /* @__PURE__ */ _array(ZodArray, element, params);
		}
		const ZodObject = /*@__PURE__*/ $constructor("ZodObject", (inst, def) => {
			$ZodObjectJIT.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
			defineLazy(inst, "shape", () => {
				return def.shape;
			});
			_installLazyMethods(inst, "ZodObject", {
				keyof() {
					return _enum(Object.keys(this._zod.def.shape));
				},
				catchall(catchall) {
					return this.clone({
						...this._zod.def,
						catchall
					});
				},
				passthrough() {
					return this.clone({
						...this._zod.def,
						catchall: unknown()
					});
				},
				loose() {
					return this.clone({
						...this._zod.def,
						catchall: unknown()
					});
				},
				strict() {
					return this.clone({
						...this._zod.def,
						catchall: never()
					});
				},
				strip() {
					return this.clone({
						...this._zod.def,
						catchall: void 0
					});
				},
				extend(incoming) {
					return extend(this, incoming);
				},
				safeExtend(incoming) {
					return safeExtend(this, incoming);
				},
				merge(other) {
					return merge(this, other);
				},
				pick(mask) {
					return pick(this, mask);
				},
				omit(mask) {
					return omit(this, mask);
				},
				partial(...args) {
					return partial(ZodOptional, this, args[0]);
				},
				required(...args) {
					return required(ZodNonOptional, this, args[0]);
				}
			});
		});
		function object(shape, params) {
			const def = {
				type: "object",
				shape: shape ?? {},
				...normalizeParams(params)
			};
			return new ZodObject(def);
		}
		const ZodUnion = /*@__PURE__*/ $constructor("ZodUnion", (inst, def) => {
			$ZodUnion.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
			inst.options = def.options;
		});
		function union(options, params) {
			return new ZodUnion({
				type: "union",
				options,
				...normalizeParams(params)
			});
		}
		const ZodIntersection = /*@__PURE__*/ $constructor("ZodIntersection", (inst, def) => {
			$ZodIntersection.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
		});
		function intersection(left, right) {
			return new ZodIntersection({
				type: "intersection",
				left,
				right
			});
		}
		const ZodRecord = /*@__PURE__*/ $constructor("ZodRecord", (inst, def) => {
			$ZodRecord.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => recordProcessor(inst, ctx, json, params);
			inst.keyType = def.keyType;
			inst.valueType = def.valueType;
		});
		function record(keyType, valueType, params) {
			if (!valueType || !valueType._zod) return new ZodRecord({
				type: "record",
				keyType: string(),
				valueType: keyType,
				...normalizeParams(valueType)
			});
			return new ZodRecord({
				type: "record",
				keyType,
				valueType,
				...normalizeParams(params)
			});
		}
		const ZodEnum = /*@__PURE__*/ $constructor("ZodEnum", (inst, def) => {
			$ZodEnum.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params);
			inst.enum = def.entries;
			inst.options = Object.values(def.entries);
			const keys = new Set(Object.keys(def.entries));
			inst.extract = (values, params) => {
				const newEntries = {};
				for (const value of values) if (keys.has(value)) newEntries[value] = def.entries[value];
				else throw new Error(`Key ${value} not found in enum`);
				return new ZodEnum({
					...def,
					checks: [],
					...normalizeParams(params),
					entries: newEntries
				});
			};
			inst.exclude = (values, params) => {
				const newEntries = { ...def.entries };
				for (const value of values) if (keys.has(value)) delete newEntries[value];
				else throw new Error(`Key ${value} not found in enum`);
				return new ZodEnum({
					...def,
					checks: [],
					...normalizeParams(params),
					entries: newEntries
				});
			};
		});
		function _enum(values, params) {
			const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
			return new ZodEnum({
				type: "enum",
				entries,
				...normalizeParams(params)
			});
		}
		const ZodLiteral = /*@__PURE__*/ $constructor("ZodLiteral", (inst, def) => {
			$ZodLiteral.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => literalProcessor(inst, ctx, json, params);
			inst.values = new Set(def.values);
			Object.defineProperty(inst, "value", { get() {
				if (def.values.length > 1) throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
				return def.values[0];
			} });
		});
		function literal(value, params) {
			return new ZodLiteral({
				type: "literal",
				values: Array.isArray(value) ? value : [value],
				...normalizeParams(params)
			});
		}
		const ZodTransform = /*@__PURE__*/ $constructor("ZodTransform", (inst, def) => {
			$ZodTransform.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
			inst._zod.parse = (payload, _ctx) => {
				if (_ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
				payload.addIssue = (issue$1) => {
					if (typeof issue$1 === "string") payload.issues.push(issue(issue$1, payload.value, def));
					else {
						const _issue = issue$1;
						if (_issue.fatal) _issue.continue = false;
						_issue.code ?? (_issue.code = "custom");
						_issue.input ?? (_issue.input = payload.value);
						_issue.inst ?? (_issue.inst = inst);
						payload.issues.push(issue(_issue));
					}
				};
				const output = def.transform(payload.value, payload);
				if (output instanceof Promise) return output.then((output) => {
					payload.value = output;
					payload.fallback = true;
					return payload;
				});
				payload.value = output;
				payload.fallback = true;
				return payload;
			};
		});
		function transform(fn) {
			return new ZodTransform({
				type: "transform",
				transform: fn
			});
		}
		const ZodOptional = /*@__PURE__*/ $constructor("ZodOptional", (inst, def) => {
			$ZodOptional.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
		});
		function optional(innerType) {
			return new ZodOptional({
				type: "optional",
				innerType
			});
		}
		const ZodExactOptional = /*@__PURE__*/ $constructor("ZodExactOptional", (inst, def) => {
			$ZodExactOptional.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
		});
		function exactOptional(innerType) {
			return new ZodExactOptional({
				type: "optional",
				innerType
			});
		}
		const ZodNullable = /*@__PURE__*/ $constructor("ZodNullable", (inst, def) => {
			$ZodNullable.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
		});
		function nullable(innerType) {
			return new ZodNullable({
				type: "nullable",
				innerType
			});
		}
		const ZodDefault = /*@__PURE__*/ $constructor("ZodDefault", (inst, def) => {
			$ZodDefault.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
			inst.removeDefault = inst.unwrap;
		});
		function _default(innerType, defaultValue) {
			return new ZodDefault({
				type: "default",
				innerType,
				get defaultValue() {
					return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
				}
			});
		}
		const ZodPrefault = /*@__PURE__*/ $constructor("ZodPrefault", (inst, def) => {
			$ZodPrefault.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
		});
		function prefault(innerType, defaultValue) {
			return new ZodPrefault({
				type: "prefault",
				innerType,
				get defaultValue() {
					return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
				}
			});
		}
		const ZodNonOptional = /*@__PURE__*/ $constructor("ZodNonOptional", (inst, def) => {
			$ZodNonOptional.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
		});
		function nonoptional(innerType, params) {
			return new ZodNonOptional({
				type: "nonoptional",
				innerType,
				...normalizeParams(params)
			});
		}
		const ZodCatch = /*@__PURE__*/ $constructor("ZodCatch", (inst, def) => {
			$ZodCatch.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
			inst.removeCatch = inst.unwrap;
		});
		function _catch(innerType, catchValue) {
			return new ZodCatch({
				type: "catch",
				innerType,
				catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
			});
		}
		const ZodPipe = /*@__PURE__*/ $constructor("ZodPipe", (inst, def) => {
			$ZodPipe.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
			inst.in = def.in;
			inst.out = def.out;
		});
		function pipe(in_, out) {
			return new ZodPipe({
				type: "pipe",
				in: in_,
				out
			});
		}
		const ZodReadonly = /*@__PURE__*/ $constructor("ZodReadonly", (inst, def) => {
			$ZodReadonly.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
		});
		function readonly(innerType) {
			return new ZodReadonly({
				type: "readonly",
				innerType
			});
		}
		const ZodLazy = /*@__PURE__*/ $constructor("ZodLazy", (inst, def) => {
			$ZodLazy.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => lazyProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.getter();
		});
		function lazy(getter) {
			return new ZodLazy({
				type: "lazy",
				getter
			});
		}
		const ZodCustom = /*@__PURE__*/ $constructor("ZodCustom", (inst, def) => {
			$ZodCustom.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
		});
		function refine(fn, _params = {}) {
			return /* @__PURE__ */ _refine(ZodCustom, fn, _params);
		}
		function superRefine(fn, params) {
			return /* @__PURE__ */ _superRefine(fn, params);
		}
		//#endregion
		//#region remote/deliverables.js
		const _deepseek_ai_dsh_deliverable_local_deliverables_invalidateDownstream_parameter_0$schema = array(string());
		const _deepseek_ai_dsh_deliverable_local_deliverables_invalidateDownstream_result$schema = object({
			"snapshotId": intersection(string(), unknown()).readonly(),
			"roots": array(intersection(string(), unknown())).readonly(),
			"staledVersions": array(object({
				"deliverableId": intersection(string(), unknown()).readonly(),
				"versionIds": array(intersection(string(), unknown())).readonly()
			})).readonly(),
			"affectedPhaseRuns": array(intersection(string(), unknown())).readonly(),
			"staledGateChecks": array(object({
				"submissionId": intersection(string(), unknown()).readonly(),
				"checkIds": array(string()).readonly()
			})).readonly(),
			"createdAt": number().readonly()
		});
		const _deepseek_ai_dsh_deliverable_local_deliverables_listCurrentInputs_parameter_0$schema = string();
		const _deepseek_ai_dsh_deliverable_local_deliverables_listCurrentInputs_result$schema = array(object({
			"versionId": intersection(string(), unknown()).readonly(),
			"deliverableId": intersection(string(), unknown()).readonly(),
			"versionNumber": number().readonly(),
			"baseVersionId": intersection(string(), unknown()).readonly().optional(),
			"sourceSubmissionId": intersection(string(), unknown()).readonly().optional(),
			"dependsOn": array(object({
				"deliverableId": intersection(string(), unknown()).readonly(),
				"versionId": intersection(string(), unknown()).readonly()
			})).readonly().optional(),
			"state": union([
				literal("stale"),
				literal("cancelled"),
				literal("current"),
				literal("invalid"),
				literal("superseded")
			]).readonly(),
			"entityRevision": number().readonly(),
			"createdAt": number().readonly()
		}));
		const _deepseek_ai_dsh_deliverable_local_deliverables_listVersions_result$schema = array(object({
			"versionId": intersection(string(), unknown()).readonly(),
			"deliverableId": intersection(string(), unknown()).readonly(),
			"versionNumber": number().readonly(),
			"baseVersionId": intersection(string(), unknown()).readonly().optional(),
			"sourceSubmissionId": intersection(string(), unknown()).readonly().optional(),
			"dependsOn": array(object({
				"deliverableId": intersection(string(), unknown()).readonly(),
				"versionId": intersection(string(), unknown()).readonly()
			})).readonly().optional(),
			"state": union([
				literal("stale"),
				literal("cancelled"),
				literal("current"),
				literal("invalid"),
				literal("superseded")
			]).readonly(),
			"entityRevision": number().readonly(),
			"createdAt": number().readonly()
		}));
		const _deepseek_ai_dsh_deliverable_local_deliverables_saveVersion_parameter_0$schema = string();
		const _deepseek_ai_dsh_deliverable_local_deliverables_saveVersion_parameter_1$schema = union([literal(null), string()]);
		const _deepseek_ai_dsh_deliverable_local_deliverables_saveVersion_parameter_2$schema = union([literal(null), string()]);
		const _deepseek_ai_dsh_deliverable_local_deliverables_saveVersion_parameter_3$schema = union([
			_undefined(),
			literal(null),
			string()
		]);
		const _deepseek_ai_dsh_deliverable_local_deliverables_saveVersion_result$schema = object({
			"versionId": intersection(string(), unknown()).readonly(),
			"deliverableId": intersection(string(), unknown()).readonly(),
			"versionNumber": number().readonly(),
			"baseVersionId": intersection(string(), unknown()).readonly().optional(),
			"sourceSubmissionId": intersection(string(), unknown()).readonly().optional(),
			"dependsOn": array(object({
				"deliverableId": intersection(string(), unknown()).readonly(),
				"versionId": intersection(string(), unknown()).readonly()
			})).readonly().optional(),
			"state": union([
				literal("stale"),
				literal("cancelled"),
				literal("current"),
				literal("invalid"),
				literal("superseded")
			]).readonly(),
			"entityRevision": number().readonly(),
			"createdAt": number().readonly()
		});
		const TYPERT_REMOTE$7 = {
			package: "@deepseek-ai/dsh-deliverable-local",
			descriptors: [
				{
					id: "@deepseek-ai/dsh-deliverable-local#deliverables/invalidateDownstream",
					service: "deliverables",
					namespace: "deliverables",
					method: "invalidateDownstream",
					invocation: { kind: "direct" },
					parameters: [{
						name: "rootVersionIds",
						wire: "rootVersionIds",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-deliverable-local#deliverables/invalidateDownstream:rootVersionIds",
							schema: _deepseek_ai_dsh_deliverable_local_deliverables_invalidateDownstream_parameter_0$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-deliverable-local/types#ImpactSnapshot",
						schema: _deepseek_ai_dsh_deliverable_local_deliverables_invalidateDownstream_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/deliverable-local/src/index.ts",
						"line": 192,
						"column": 3
					}
				},
				{
					id: "@deepseek-ai/dsh-deliverable-local#deliverables/listCurrentInputs",
					service: "deliverables",
					namespace: "deliverables",
					method: "listCurrentInputs",
					invocation: { kind: "direct" },
					parameters: [{
						name: "phaseRunId",
						wire: "phaseRunId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-deliverable-local#deliverables/listCurrentInputs:phaseRunId",
							schema: _deepseek_ai_dsh_deliverable_local_deliverables_listCurrentInputs_parameter_0$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-deliverable-local#deliverables/listCurrentInputs:result",
						schema: _deepseek_ai_dsh_deliverable_local_deliverables_listCurrentInputs_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/deliverable-local/src/index.ts",
						"line": 156,
						"column": 3
					}
				},
				{
					id: "@deepseek-ai/dsh-deliverable-local#deliverables/listVersions",
					service: "deliverables",
					namespace: "deliverables",
					method: "listVersions",
					invocation: { kind: "direct" },
					parameters: [],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-deliverable-local#deliverables/listVersions:result",
						schema: _deepseek_ai_dsh_deliverable_local_deliverables_listVersions_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/deliverable-local/src/index.ts",
						"line": 175,
						"column": 3
					}
				},
				{
					id: "@deepseek-ai/dsh-deliverable-local#deliverables/saveVersion",
					service: "deliverables",
					namespace: "deliverables",
					method: "saveVersion",
					invocation: { kind: "direct" },
					parameters: [
						{
							name: "deliverableId",
							wire: "deliverableId",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-deliverable-local#deliverables/saveVersion:deliverableId",
								schema: _deepseek_ai_dsh_deliverable_local_deliverables_saveVersion_parameter_0$schema
							}
						},
						{
							name: "expectedBaseVersion",
							wire: "expectedBaseVersion",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-deliverable-local#deliverables/saveVersion:expectedBaseVersion",
								schema: _deepseek_ai_dsh_deliverable_local_deliverables_saveVersion_parameter_1$schema
							}
						},
						{
							name: "sourceSubmissionId",
							wire: "sourceSubmissionId",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-deliverable-local#deliverables/saveVersion:sourceSubmissionId",
								schema: _deepseek_ai_dsh_deliverable_local_deliverables_saveVersion_parameter_2$schema
							}
						},
						{
							name: "idempotencyKey",
							wire: "idempotencyKey",
							source: "json",
							acceptsUndefined: true,
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-deliverable-local#deliverables/saveVersion:idempotencyKey",
								schema: _deepseek_ai_dsh_deliverable_local_deliverables_saveVersion_parameter_3$schema
							}
						}
					],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-deliverable-local/types#DeliverableVersion",
						schema: _deepseek_ai_dsh_deliverable_local_deliverables_saveVersion_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/deliverable-local/src/index.ts",
						"line": 125,
						"column": 3
					}
				}
			]
		};
		//#endregion
		//#region remote/digest.js
		const _deepseek_ai_dsh_digest_digest_digest_parameter_0$schema = string();
		const _deepseek_ai_dsh_digest_digest_digest_result$schema = object({
			"taskId": intersection(string(), unknown()).readonly(),
			"state": string().readonly(),
			"revision": number().readonly(),
			"runs": array(object({
				"runId": string().readonly(),
				"parentRunId": string().readonly().optional(),
				"createdAt": number().readonly(),
				"supersededAt": number().readonly().optional()
			})).readonly(),
			"timeline": array(object({
				"seq": number().readonly(),
				"kind": string().readonly(),
				"occurredAt": number().readonly(),
				"actor": string().readonly(),
				"summary": string().readonly()
			})).readonly(),
			"phaseSummaries": array(object({
				"phaseId": string().readonly(),
				"state": string().readonly(),
				"attemptCount": number().readonly(),
				"passedAt": number().readonly().optional(),
				"failedAt": number().readonly().optional()
			})).readonly(),
			"decisionHistory": array(object({
				"decisionKind": string().readonly(),
				"outcome": string().readonly().optional(),
				"resolvedAt": number().readonly().optional()
			})).readonly(),
			"deliverableStates": array(object({
				"deliverableId": string().readonly(),
				"currentVersionId": string().readonly().optional(),
				"state": string().readonly(),
				"versionCount": number().readonly()
			})).readonly()
		});
		const TYPERT_REMOTE$6 = {
			package: "@deepseek-ai/dsh-digest",
			descriptors: [{
				id: "@deepseek-ai/dsh-digest#digest/digest",
				service: "digest",
				namespace: "digest",
				method: "digest",
				invocation: { kind: "direct" },
				parameters: [{
					name: "taskId",
					wire: "taskId",
					source: "json",
					codec: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-digest#digest/digest:taskId",
						schema: _deepseek_ai_dsh_digest_digest_digest_parameter_0$schema
					}
				}],
				result: {
					mode: "strict",
					typeSymbol: "@deepseek-ai/dsh-digest/types#TaskDigest",
					schema: _deepseek_ai_dsh_digest_digest_digest_result$schema
				},
				sourceLocation: {
					"file": "packages/task-flow/digest/src/index.ts",
					"line": 55,
					"column": 9
				}
			}]
		};
		//#endregion
		//#region remote/metrics.js
		const _deepseek_ai_dsh_metrics_metrics_metrics_result$schema = object({
			"live": number().readonly(),
			"gate": number().readonly(),
			"ask": number().readonly(),
			"asset": number().readonly(),
			"throughput": array(object({
				"day": string().readonly(),
				"completedPhases": number().readonly()
			})).readonly(),
			"gatePassRate": object({
				"a": number().readonly(),
				"b": number().readonly(),
				"c": number().readonly()
			}).readonly()
		});
		const _deepseek_ai_dsh_metrics_metrics_taskMetrics_parameter_0$schema = string();
		const _deepseek_ai_dsh_metrics_metrics_taskMetrics_result$schema = object({
			"taskId": string().readonly(),
			"phaseDurations": array(object({
				"phaseId": string().readonly(),
				"startedAt": number().readonly().optional(),
				"passedAt": number().readonly().optional(),
				"durationMs": number().readonly().optional()
			})).readonly(),
			"rerunCount": number().readonly(),
			"decisionCount": number().readonly(),
			"budgetUsed": object({
				"tokens": number().readonly(),
				"durationMs": number().readonly(),
				"reruns": number().readonly()
			}).readonly().optional()
		});
		const TYPERT_REMOTE$5 = {
			package: "@deepseek-ai/dsh-metrics",
			descriptors: [{
				id: "@deepseek-ai/dsh-metrics#metrics/metrics",
				service: "metrics",
				namespace: "metrics",
				method: "metrics",
				invocation: { kind: "direct" },
				parameters: [],
				result: {
					mode: "strict",
					typeSymbol: "@deepseek-ai/dsh-metrics/types#WorkbenchMetrics",
					schema: _deepseek_ai_dsh_metrics_metrics_metrics_result$schema
				},
				sourceLocation: {
					"file": "packages/task-flow/metrics/src/index.ts",
					"line": 55,
					"column": 9
				}
			}, {
				id: "@deepseek-ai/dsh-metrics#metrics/taskMetrics",
				service: "metrics",
				namespace: "metrics",
				method: "taskMetrics",
				invocation: { kind: "direct" },
				parameters: [{
					name: "taskId",
					wire: "taskId",
					source: "json",
					codec: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-metrics#metrics/taskMetrics:taskId",
						schema: _deepseek_ai_dsh_metrics_metrics_taskMetrics_parameter_0$schema
					}
				}],
				result: {
					mode: "strict",
					typeSymbol: "@deepseek-ai/dsh-metrics/types#TaskMetrics",
					schema: _deepseek_ai_dsh_metrics_metrics_taskMetrics_result$schema
				},
				sourceLocation: {
					"file": "packages/task-flow/metrics/src/index.ts",
					"line": 71,
					"column": 9
				}
			}]
		};
		//#endregion
		//#region remote/recipe.js
		const _deepseek_ai_dsh_recipe_recipes_getPinned_parameter_0$schema = object({
			"recipeId": intersection(string(), unknown()).readonly(),
			"revision": number().readonly()
		});
		const _deepseek_ai_dsh_recipe_recipes_getPinned_result$schema = object({
			"recipeId": intersection(string(), unknown()).readonly(),
			"revision": number().readonly(),
			"schemaVersion": number().readonly(),
			"contentHash": string().readonly(),
			"payload": object({
				"phases": array(object({
					"phaseId": string().readonly(),
					"kind": string().readonly(),
					"goal": string().readonly(),
					"inputs": array(string()).readonly(),
					"outputs": array(string()).readonly(),
					"submissionCriteria": array(string()).readonly()
				})).readonly(),
				"gateChecks": array(object({
					"checkId": string().readonly(),
					"phaseId": string().readonly(),
					"kind": union([
						literal("A"),
						literal("B"),
						literal("C")
					]).readonly(),
					"machineScope": array(string()).readonly(),
					"humanAction": array(string()).readonly(),
					"circuitBreaker": string().readonly().optional()
				})).readonly(),
				"defaults": object({
					"batchConfirm": union([literal("per-phase-single"), literal("per-check")]).readonly(),
					"clarify": object({
						"maxRounds": number().readonly(),
						"splitMustDefault": boolean().readonly()
					}).readonly(),
					"draftPolicy": literal("block-finalize-not-draft").readonly()
				}).readonly(),
				"p4Mode": object({ "mode": union([
					literal("auto"),
					literal("draft"),
					literal("skeleton"),
					literal("verify-normalize")
				]).readonly() }).readonly(),
				"breakers": array(object({
					"key": string().readonly(),
					"maxConsecutiveRepairs": number().readonly()
				})).readonly().optional()
			}).readonly(),
			"registeredAt": number().readonly()
		});
		const _deepseek_ai_dsh_recipe_recipes_latest_parameter_0$schema = string();
		const _deepseek_ai_dsh_recipe_recipes_latest_result$schema = union([_undefined(), object({
			"recipeId": intersection(string(), unknown()).readonly(),
			"revision": number().readonly(),
			"schemaVersion": number().readonly(),
			"contentHash": string().readonly(),
			"payload": object({
				"phases": array(object({
					"phaseId": string().readonly(),
					"kind": string().readonly(),
					"goal": string().readonly(),
					"inputs": array(string()).readonly(),
					"outputs": array(string()).readonly(),
					"submissionCriteria": array(string()).readonly()
				})).readonly(),
				"gateChecks": array(object({
					"checkId": string().readonly(),
					"phaseId": string().readonly(),
					"kind": union([
						literal("A"),
						literal("B"),
						literal("C")
					]).readonly(),
					"machineScope": array(string()).readonly(),
					"humanAction": array(string()).readonly(),
					"circuitBreaker": string().readonly().optional()
				})).readonly(),
				"defaults": object({
					"batchConfirm": union([literal("per-phase-single"), literal("per-check")]).readonly(),
					"clarify": object({
						"maxRounds": number().readonly(),
						"splitMustDefault": boolean().readonly()
					}).readonly(),
					"draftPolicy": literal("block-finalize-not-draft").readonly()
				}).readonly(),
				"p4Mode": object({ "mode": union([
					literal("auto"),
					literal("draft"),
					literal("skeleton"),
					literal("verify-normalize")
				]).readonly() }).readonly(),
				"breakers": array(object({
					"key": string().readonly(),
					"maxConsecutiveRepairs": number().readonly()
				})).readonly().optional()
			}).readonly(),
			"registeredAt": number().readonly()
		})]);
		const _deepseek_ai_dsh_recipe_recipes_list_result$schema = array(object({
			"recipeId": intersection(string(), unknown()).readonly(),
			"revision": number().readonly()
		}));
		const _deepseek_ai_dsh_recipe_recipes_listDetails_result$schema = array(object({
			"recipeId": intersection(string(), unknown()).readonly(),
			"revision": number().readonly(),
			"schemaVersion": number().readonly(),
			"contentHash": string().readonly(),
			"payload": object({
				"phases": array(object({
					"phaseId": string().readonly(),
					"kind": string().readonly(),
					"goal": string().readonly(),
					"inputs": array(string()).readonly(),
					"outputs": array(string()).readonly(),
					"submissionCriteria": array(string()).readonly()
				})).readonly(),
				"gateChecks": array(object({
					"checkId": string().readonly(),
					"phaseId": string().readonly(),
					"kind": union([
						literal("A"),
						literal("B"),
						literal("C")
					]).readonly(),
					"machineScope": array(string()).readonly(),
					"humanAction": array(string()).readonly(),
					"circuitBreaker": string().readonly().optional()
				})).readonly(),
				"defaults": object({
					"batchConfirm": union([literal("per-phase-single"), literal("per-check")]).readonly(),
					"clarify": object({
						"maxRounds": number().readonly(),
						"splitMustDefault": boolean().readonly()
					}).readonly(),
					"draftPolicy": literal("block-finalize-not-draft").readonly()
				}).readonly(),
				"p4Mode": object({ "mode": union([
					literal("auto"),
					literal("draft"),
					literal("skeleton"),
					literal("verify-normalize")
				]).readonly() }).readonly(),
				"breakers": array(object({
					"key": string().readonly(),
					"maxConsecutiveRepairs": number().readonly()
				})).readonly().optional()
			}).readonly(),
			"registeredAt": number().readonly()
		}));
		const _deepseek_ai_dsh_recipe_recipes_register_parameter_0$schema = string();
		const _deepseek_ai_dsh_recipe_recipes_register_parameter_1$schema = number();
		const _deepseek_ai_dsh_recipe_recipes_register_parameter_2$schema = object({
			"phases": array(object({
				"phaseId": string().readonly(),
				"kind": string().readonly(),
				"goal": string().readonly(),
				"inputs": array(string()).readonly(),
				"outputs": array(string()).readonly(),
				"submissionCriteria": array(string()).readonly()
			})).readonly(),
			"gateChecks": array(object({
				"checkId": string().readonly(),
				"phaseId": string().readonly(),
				"kind": union([
					literal("A"),
					literal("B"),
					literal("C")
				]).readonly(),
				"machineScope": array(string()).readonly(),
				"humanAction": array(string()).readonly(),
				"circuitBreaker": string().readonly().optional()
			})).readonly(),
			"defaults": object({
				"batchConfirm": union([literal("per-phase-single"), literal("per-check")]).readonly(),
				"clarify": object({
					"maxRounds": number().readonly(),
					"splitMustDefault": boolean().readonly()
				}).readonly(),
				"draftPolicy": literal("block-finalize-not-draft").readonly()
			}).readonly(),
			"p4Mode": object({ "mode": union([
				literal("auto"),
				literal("draft"),
				literal("skeleton"),
				literal("verify-normalize")
			]).readonly() }).readonly(),
			"breakers": array(object({
				"key": string().readonly(),
				"maxConsecutiveRepairs": number().readonly()
			})).readonly().optional()
		});
		const _deepseek_ai_dsh_recipe_recipes_register_result$schema = object({
			"recipeId": intersection(string(), unknown()).readonly(),
			"revision": number().readonly(),
			"schemaVersion": number().readonly(),
			"contentHash": string().readonly(),
			"payload": object({
				"phases": array(object({
					"phaseId": string().readonly(),
					"kind": string().readonly(),
					"goal": string().readonly(),
					"inputs": array(string()).readonly(),
					"outputs": array(string()).readonly(),
					"submissionCriteria": array(string()).readonly()
				})).readonly(),
				"gateChecks": array(object({
					"checkId": string().readonly(),
					"phaseId": string().readonly(),
					"kind": union([
						literal("A"),
						literal("B"),
						literal("C")
					]).readonly(),
					"machineScope": array(string()).readonly(),
					"humanAction": array(string()).readonly(),
					"circuitBreaker": string().readonly().optional()
				})).readonly(),
				"defaults": object({
					"batchConfirm": union([literal("per-phase-single"), literal("per-check")]).readonly(),
					"clarify": object({
						"maxRounds": number().readonly(),
						"splitMustDefault": boolean().readonly()
					}).readonly(),
					"draftPolicy": literal("block-finalize-not-draft").readonly()
				}).readonly(),
				"p4Mode": object({ "mode": union([
					literal("auto"),
					literal("draft"),
					literal("skeleton"),
					literal("verify-normalize")
				]).readonly() }).readonly(),
				"breakers": array(object({
					"key": string().readonly(),
					"maxConsecutiveRepairs": number().readonly()
				})).readonly().optional()
			}).readonly(),
			"registeredAt": number().readonly()
		});
		const _deepseek_ai_dsh_recipe_recipes_deleteRecipe_result$schema = boolean();
		const TYPERT_REMOTE$4 = {
			package: "@deepseek-ai/dsh-recipe",
			descriptors: [
				{
					id: "@deepseek-ai/dsh-recipe#recipes/createRecipe",
					service: "recipes",
					namespace: "recipes",
					method: "createRecipe",
					invocation: { kind: "direct" },
					parameters: [{
						name: "recipeId",
						wire: "recipeId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-recipe#recipes/createRecipe:recipeId",
							schema: _deepseek_ai_dsh_recipe_recipes_register_parameter_0$schema
						}
					}, {
						name: "payload",
						wire: "payload",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-recipe/types#RecipePayload",
							schema: _deepseek_ai_dsh_recipe_recipes_register_parameter_2$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-recipe/types#RecipeRevision",
						schema: _deepseek_ai_dsh_recipe_recipes_register_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/recipe/src/index.ts",
						"line": 300,
						"column": 3
					}
				},
				{
					id: "@deepseek-ai/dsh-recipe#recipes/deleteRecipe",
					service: "recipes",
					namespace: "recipes",
					method: "deleteRecipe",
					invocation: { kind: "direct" },
					parameters: [{
						name: "recipeId",
						wire: "recipeId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-recipe#recipes/deleteRecipe:recipeId",
							schema: _deepseek_ai_dsh_recipe_recipes_register_parameter_0$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-recipe#recipes/deleteRecipe:result",
						schema: _deepseek_ai_dsh_recipe_recipes_deleteRecipe_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/recipe/src/index.ts",
						"line": 360,
						"column": 3
					}
				},
				{
					id: "@deepseek-ai/dsh-recipe#recipes/getPinned",
					service: "recipes",
					namespace: "recipes",
					method: "getPinned",
					invocation: { kind: "direct" },
					parameters: [{
						name: "identity",
						wire: "identity",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-recipe/types#RecipeIdentity",
							schema: _deepseek_ai_dsh_recipe_recipes_getPinned_parameter_0$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-recipe/types#RecipeRevision",
						schema: _deepseek_ai_dsh_recipe_recipes_getPinned_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/recipe/src/index.ts",
						"line": 211,
						"column": 3
					}
				},
				{
					id: "@deepseek-ai/dsh-recipe#recipes/latest",
					service: "recipes",
					namespace: "recipes",
					method: "latest",
					invocation: { kind: "direct" },
					parameters: [{
						name: "recipeId",
						wire: "recipeId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-recipe#recipes/latest:recipeId",
							schema: _deepseek_ai_dsh_recipe_recipes_latest_parameter_0$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-recipe#recipes/latest:result",
						schema: _deepseek_ai_dsh_recipe_recipes_latest_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/recipe/src/index.ts",
						"line": 226,
						"column": 3
					}
				},
				{
					id: "@deepseek-ai/dsh-recipe#recipes/list",
					service: "recipes",
					namespace: "recipes",
					method: "list",
					invocation: { kind: "direct" },
					parameters: [],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-recipe#recipes/list:result",
						schema: _deepseek_ai_dsh_recipe_recipes_list_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/recipe/src/index.ts",
						"line": 241,
						"column": 3
					}
				},
				{
					id: "@deepseek-ai/dsh-recipe#recipes/listDetails",
					service: "recipes",
					namespace: "recipes",
					method: "listDetails",
					invocation: { kind: "direct" },
					parameters: [],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-recipe#recipes/listDetails:result",
						schema: _deepseek_ai_dsh_recipe_recipes_listDetails_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/recipe/src/index.ts",
						"line": 251,
						"column": 3
					}
				},
				{
					id: "@deepseek-ai/dsh-recipe#recipes/register",
					service: "recipes",
					namespace: "recipes",
					method: "register",
					invocation: { kind: "direct" },
					parameters: [
						{
							name: "recipeId",
							wire: "recipeId",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-recipe#recipes/register:recipeId",
								schema: _deepseek_ai_dsh_recipe_recipes_register_parameter_0$schema
							}
						},
						{
							name: "revision",
							wire: "revision",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-recipe#recipes/register:revision",
								schema: _deepseek_ai_dsh_recipe_recipes_register_parameter_1$schema
							}
						},
						{
							name: "payload",
							wire: "payload",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-recipe/types#RecipePayload",
								schema: _deepseek_ai_dsh_recipe_recipes_register_parameter_2$schema
							}
						}
					],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-recipe/types#RecipeRevision",
						schema: _deepseek_ai_dsh_recipe_recipes_register_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/recipe/src/index.ts",
						"line": 170,
						"column": 3
					}
				},
				{
					id: "@deepseek-ai/dsh-recipe#recipes/updateRecipe",
					service: "recipes",
					namespace: "recipes",
					method: "updateRecipe",
					invocation: { kind: "direct" },
					parameters: [{
						name: "recipeId",
						wire: "recipeId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-recipe#recipes/updateRecipe:recipeId",
							schema: _deepseek_ai_dsh_recipe_recipes_register_parameter_0$schema
						}
					}, {
						name: "payload",
						wire: "payload",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-recipe/types#RecipePayload",
							schema: _deepseek_ai_dsh_recipe_recipes_register_parameter_2$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-recipe/types#RecipeRevision",
						schema: _deepseek_ai_dsh_recipe_recipes_register_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/recipe/src/index.ts",
						"line": 320,
						"column": 3
					}
				}
			]
		};
		//#endregion
		//#region remote/rewind.js
		const _deepseek_ai_dsh_rewind_rewind_applyRewind_parameter_0$schema = string();
		const _deepseek_ai_dsh_rewind_rewind_applyRewind_parameter_1$schema = number();
		const _deepseek_ai_dsh_rewind_rewind_applyRewind_parameter_2$schema = string();
		const _deepseek_ai_dsh_rewind_rewind_applyRewind_parameter_3$schema = string();
		const _deepseek_ai_dsh_rewind_rewind_applyRewind_result$schema = object({
			"run": object({
				"runId": intersection(string(), unknown()).readonly(),
				"taskId": intersection(string(), unknown()).readonly(),
				"pinnedRecipe": object({
					"recipeId": intersection(string(), unknown()).readonly(),
					"revision": number().readonly(),
					"schemaVersion": number().readonly(),
					"contentHash": string().readonly()
				}).readonly(),
				"revision": number().readonly(),
				"parentRunId": intersection(string(), unknown()).readonly().optional(),
				"createdAt": number().readonly()
			}).readonly(),
			"supersededPhaseRunIds": array(string()).readonly()
		});
		const _deepseek_ai_dsh_rewind_rewind_requestRewind_parameter_0$schema = string();
		const _deepseek_ai_dsh_rewind_rewind_requestRewind_parameter_1$schema = array(string());
		const _deepseek_ai_dsh_rewind_rewind_requestRewind_parameter_2$schema = string();
		const _deepseek_ai_dsh_rewind_rewind_requestRewind_parameter_3$schema = string();
		const _deepseek_ai_dsh_rewind_rewind_requestRewind_result$schema = intersection(object({
			"snapshotId": string().readonly(),
			"invalidatedVersionIds": array(string()).readonly(),
			"rerunPhaseIds": array(string()).readonly(),
			"reusableClarificationIds": array(string()).readonly(),
			"costHint": literal("uncalibrated").readonly()
		}), object({ "itemId": string() }));
		const TYPERT_REMOTE$3 = {
			package: "@deepseek-ai/dsh-rewind",
			descriptors: [{
				id: "@deepseek-ai/dsh-rewind#rewind/applyRewind",
				service: "rewind",
				namespace: "rewind",
				method: "applyRewind",
				invocation: { kind: "direct" },
				parameters: [
					{
						name: "itemId",
						wire: "itemId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-rewind#rewind/applyRewind:itemId",
							schema: _deepseek_ai_dsh_rewind_rewind_applyRewind_parameter_0$schema
						}
					},
					{
						name: "taskRevision",
						wire: "taskRevision",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-rewind#rewind/applyRewind:taskRevision",
							schema: _deepseek_ai_dsh_rewind_rewind_applyRewind_parameter_1$schema
						}
					},
					{
						name: "actor",
						wire: "actor",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-rewind#rewind/applyRewind:actor",
							schema: _deepseek_ai_dsh_rewind_rewind_applyRewind_parameter_2$schema
						}
					},
					{
						name: "idempotencyKey",
						wire: "idempotencyKey",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-rewind#rewind/applyRewind:idempotencyKey",
							schema: _deepseek_ai_dsh_rewind_rewind_applyRewind_parameter_3$schema
						}
					}
				],
				result: {
					mode: "strict",
					typeSymbol: "@deepseek-ai/dsh-rewind/types#RewindApplication",
					schema: _deepseek_ai_dsh_rewind_rewind_applyRewind_result$schema
				},
				sourceLocation: {
					"file": "packages/task-flow/rewind/src/index.ts",
					"line": 92,
					"column": 9
				}
			}, {
				id: "@deepseek-ai/dsh-rewind#rewind/requestRewind",
				service: "rewind",
				namespace: "rewind",
				method: "requestRewind",
				invocation: { kind: "direct" },
				parameters: [
					{
						name: "taskId",
						wire: "taskId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-rewind#rewind/requestRewind:taskId",
							schema: _deepseek_ai_dsh_rewind_rewind_requestRewind_parameter_0$schema
						}
					},
					{
						name: "rootVersionIds",
						wire: "rootVersionIds",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-rewind#rewind/requestRewind:rootVersionIds",
							schema: _deepseek_ai_dsh_rewind_rewind_requestRewind_parameter_1$schema
						}
					},
					{
						name: "actor",
						wire: "actor",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-rewind#rewind/requestRewind:actor",
							schema: _deepseek_ai_dsh_rewind_rewind_requestRewind_parameter_2$schema
						}
					},
					{
						name: "idempotencyKey",
						wire: "idempotencyKey",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-rewind#rewind/requestRewind:idempotencyKey",
							schema: _deepseek_ai_dsh_rewind_rewind_requestRewind_parameter_3$schema
						}
					}
				],
				result: {
					mode: "strict",
					typeSymbol: "@deepseek-ai/dsh-rewind#rewind/requestRewind:result",
					schema: _deepseek_ai_dsh_rewind_rewind_requestRewind_result$schema
				},
				sourceLocation: {
					"file": "packages/task-flow/rewind/src/index.ts",
					"line": 64,
					"column": 9
				}
			}]
		};
		//#endregion
		//#region remote/task.js
		const _deepseek_ai_dsh_task_tasks_cancelPhaseRun_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_cancelPhaseRun_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_cancelPhaseRun_result$schema = object({
			"phaseRunId": intersection(string(), unknown()).readonly(),
			"runId": intersection(string(), unknown()).readonly(),
			"taskId": intersection(string(), unknown()).readonly(),
			"phaseId": string().readonly(),
			"state": union([
				literal("stale"),
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("superseded"),
				literal("created"),
				literal("scheduled"),
				literal("submitting"),
				literal("submitted"),
				literal("gate-running"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("patching"),
				literal("passed")
			]).readonly(),
			"revision": number().readonly(),
			"activeSubmissionId": intersection(string(), unknown()).readonly().optional(),
			"sessionId": string().readonly().optional(),
			"schedulingFrozen": boolean().readonly().optional()
		});
		const _deepseek_ai_dsh_task_tasks_clearPhaseScheduling_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_clearPhaseScheduling_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_clearPhaseScheduling_result$schema = object({
			"phaseRunId": intersection(string(), unknown()).readonly(),
			"runId": intersection(string(), unknown()).readonly(),
			"taskId": intersection(string(), unknown()).readonly(),
			"phaseId": string().readonly(),
			"state": union([
				literal("stale"),
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("superseded"),
				literal("created"),
				literal("scheduled"),
				literal("submitting"),
				literal("submitted"),
				literal("gate-running"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("patching"),
				literal("passed")
			]).readonly(),
			"revision": number().readonly(),
			"activeSubmissionId": intersection(string(), unknown()).readonly().optional(),
			"sessionId": string().readonly().optional(),
			"schedulingFrozen": boolean().readonly().optional()
		});
		const _deepseek_ai_dsh_task_tasks_completeTask_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_completeTask_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_completeTask_result$schema = object({
			"taskId": intersection(string(), unknown()).readonly(),
			"workspaceId": string().readonly(),
			"pinnedRecipe": object({
				"recipeId": intersection(string(), unknown()).readonly(),
				"revision": number().readonly(),
				"schemaVersion": number().readonly(),
				"contentHash": string().readonly()
			}).readonly(),
			"state": union([
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("paused"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("planning"),
				literal("pausing"),
				literal("cancelling"),
				literal("completed")
			]).readonly(),
			"revision": number().readonly(),
			"currentRunId": intersection(string(), unknown()).readonly().optional(),
			"idempotencyKey": string().readonly().optional(),
			"createdAt": number().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_confirmCreateTask_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_confirmCreateTask_parameter_1$schema = string();
		const _deepseek_ai_dsh_task_tasks_confirmCreateTask_parameter_2$schema = boolean();
		const _deepseek_ai_dsh_task_tasks_confirmCreateTask_parameter_3$schema = string();
		const _deepseek_ai_dsh_task_tasks_confirmCreateTask_parameter_4$schema = string();
		const _deepseek_ai_dsh_task_tasks_confirmCreateTask_parameter_5$schema = string();
		const _deepseek_ai_dsh_task_tasks_confirmCreateTask_parameter_6$schema = string();
		const _deepseek_ai_dsh_task_tasks_confirmCreateTask_result$schema = object({
			"task": object({
				"taskId": intersection(string(), unknown()).readonly(),
				"workspaceId": string().readonly(),
				"pinnedRecipe": object({
					"recipeId": intersection(string(), unknown()).readonly(),
					"revision": number().readonly(),
					"schemaVersion": number().readonly(),
					"contentHash": string().readonly()
				}).readonly(),
				"state": union([
					literal("running"),
					literal("cancelled"),
					literal("failed"),
					literal("paused"),
					literal("awaiting-input"),
					literal("awaiting-decision"),
					literal("planning"),
					literal("pausing"),
					literal("cancelling"),
					literal("completed")
				]).readonly(),
				"revision": number().readonly(),
				"currentRunId": intersection(string(), unknown()).readonly().optional(),
				"idempotencyKey": string().readonly().optional(),
				"createdAt": number().readonly()
			}).readonly(),
			"created": boolean().readonly(),
			"seedPoints": number().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_createPhaseRun_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_createPhaseRun_parameter_1$schema = string();
		const _deepseek_ai_dsh_task_tasks_createPhaseRun_parameter_2$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_createPhaseRun_result$schema = object({
			"phaseRunId": intersection(string(), unknown()).readonly(),
			"runId": intersection(string(), unknown()).readonly(),
			"taskId": intersection(string(), unknown()).readonly(),
			"phaseId": string().readonly(),
			"state": union([
				literal("stale"),
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("superseded"),
				literal("created"),
				literal("scheduled"),
				literal("submitting"),
				literal("submitted"),
				literal("gate-running"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("patching"),
				literal("passed")
			]).readonly(),
			"revision": number().readonly(),
			"activeSubmissionId": intersection(string(), unknown()).readonly().optional(),
			"sessionId": string().readonly().optional(),
			"schedulingFrozen": boolean().readonly().optional()
		});
		const _deepseek_ai_dsh_task_tasks_createTask_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_createTask_parameter_1$schema = string();
		const _deepseek_ai_dsh_task_tasks_createTask_parameter_2$schema = string();
		const _deepseek_ai_dsh_task_tasks_createTask_parameter_3$schema = string();
		const _deepseek_ai_dsh_task_tasks_createTask_result$schema = object({
			"taskId": intersection(string(), unknown()).readonly(),
			"workspaceId": string().readonly(),
			"pinnedRecipe": object({
				"recipeId": intersection(string(), unknown()).readonly(),
				"revision": number().readonly(),
				"schemaVersion": number().readonly(),
				"contentHash": string().readonly()
			}).readonly(),
			"state": union([
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("paused"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("planning"),
				literal("pausing"),
				literal("cancelling"),
				literal("completed")
			]).readonly(),
			"revision": number().readonly(),
			"currentRunId": intersection(string(), unknown()).readonly().optional(),
			"idempotencyKey": string().readonly().optional(),
			"createdAt": number().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_createTaskRun_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_createTaskRun_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_createTaskRun_parameter_2$schema = union([_undefined(), string()]);
		const _deepseek_ai_dsh_task_tasks_createTaskRun_result$schema = object({
			"runId": intersection(string(), unknown()).readonly(),
			"taskId": intersection(string(), unknown()).readonly(),
			"pinnedRecipe": object({
				"recipeId": intersection(string(), unknown()).readonly(),
				"revision": number().readonly(),
				"schemaVersion": number().readonly(),
				"contentHash": string().readonly()
			}).readonly(),
			"revision": number().readonly(),
			"parentRunId": intersection(string(), unknown()).readonly().optional(),
			"createdAt": number().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_failTask_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_failTask_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_failTask_result$schema = object({
			"taskId": intersection(string(), unknown()).readonly(),
			"workspaceId": string().readonly(),
			"pinnedRecipe": object({
				"recipeId": intersection(string(), unknown()).readonly(),
				"revision": number().readonly(),
				"schemaVersion": number().readonly(),
				"contentHash": string().readonly()
			}).readonly(),
			"state": union([
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("paused"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("planning"),
				literal("pausing"),
				literal("cancelling"),
				literal("completed")
			]).readonly(),
			"revision": number().readonly(),
			"currentRunId": intersection(string(), unknown()).readonly().optional(),
			"idempotencyKey": string().readonly().optional(),
			"createdAt": number().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_freezePhaseScheduling_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_freezePhaseScheduling_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_freezePhaseScheduling_result$schema = object({
			"phaseRunId": intersection(string(), unknown()).readonly(),
			"runId": intersection(string(), unknown()).readonly(),
			"taskId": intersection(string(), unknown()).readonly(),
			"phaseId": string().readonly(),
			"state": union([
				literal("stale"),
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("superseded"),
				literal("created"),
				literal("scheduled"),
				literal("submitting"),
				literal("submitted"),
				literal("gate-running"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("patching"),
				literal("passed")
			]).readonly(),
			"revision": number().readonly(),
			"activeSubmissionId": intersection(string(), unknown()).readonly().optional(),
			"sessionId": string().readonly().optional(),
			"schedulingFrozen": boolean().readonly().optional()
		});
		const _deepseek_ai_dsh_task_tasks_getPhaseRun_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_getPhaseRun_result$schema = union([_undefined(), object({
			"phaseRunId": intersection(string(), unknown()).readonly(),
			"runId": intersection(string(), unknown()).readonly(),
			"taskId": intersection(string(), unknown()).readonly(),
			"phaseId": string().readonly(),
			"state": union([
				literal("stale"),
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("superseded"),
				literal("created"),
				literal("scheduled"),
				literal("submitting"),
				literal("submitted"),
				literal("gate-running"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("patching"),
				literal("passed")
			]).readonly(),
			"revision": number().readonly(),
			"activeSubmissionId": intersection(string(), unknown()).readonly().optional(),
			"sessionId": string().readonly().optional(),
			"schedulingFrozen": boolean().readonly().optional()
		})]);
		const _deepseek_ai_dsh_task_tasks_getSubmission_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_getSubmission_result$schema = union([_undefined(), object({
			"submissionId": intersection(string(), unknown()).readonly(),
			"taskId": intersection(string(), unknown()).readonly(),
			"taskRunId": intersection(string(), unknown()).readonly(),
			"phaseRunId": intersection(string(), unknown()).readonly(),
			"phaseId": string().readonly(),
			"attempt": number().readonly(),
			"pinnedRecipe": object({
				"recipeId": intersection(string(), unknown()).readonly(),
				"revision": number().readonly(),
				"schemaVersion": number().readonly(),
				"contentHash": string().readonly()
			}).readonly(),
			"sourceSessionId": string().readonly(),
			"sourceSeqRange": object({
				"start": number().readonly(),
				"end": number().readonly()
			}).readonly(),
			"inputVersions": array(object({
				"deliverableId": intersection(string(), unknown()).readonly(),
				"versionId": intersection(string(), unknown()).readonly()
			})).readonly(),
			"outputVersions": array(object({
				"deliverableId": intersection(string(), unknown()).readonly(),
				"versionId": intersection(string(), unknown()).readonly()
			})).readonly(),
			"unresolvedIssues": array(string()).readonly(),
			"result": union([
				literal("failed"),
				literal("completed"),
				literal("needs-clarification")
			]).readonly(),
			"failureReason": string().readonly().optional(),
			"idempotencyKey": string().readonly(),
			"submittedAt": number().readonly(),
			"supersedesSubmissionId": intersection(string(), unknown()).readonly().optional()
		})]);
		const _deepseek_ai_dsh_task_tasks_getTask_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_getTask_result$schema = union([_undefined(), object({
			"taskId": intersection(string(), unknown()).readonly(),
			"workspaceId": string().readonly(),
			"pinnedRecipe": object({
				"recipeId": intersection(string(), unknown()).readonly(),
				"revision": number().readonly(),
				"schemaVersion": number().readonly(),
				"contentHash": string().readonly()
			}).readonly(),
			"state": union([
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("paused"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("planning"),
				literal("pausing"),
				literal("cancelling"),
				literal("completed")
			]).readonly(),
			"revision": number().readonly(),
			"currentRunId": intersection(string(), unknown()).readonly().optional(),
			"idempotencyKey": string().readonly().optional(),
			"createdAt": number().readonly()
		})]);
		const _deepseek_ai_dsh_task_tasks_listGateResults_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_listGateResults_result$schema = array(object({
			"submissionId": intersection(string(), unknown()).readonly(),
			"checkId": string().readonly(),
			"passed": boolean().readonly(),
			"kind": union([
				literal("A"),
				literal("B"),
				literal("C")
			]).readonly().optional(),
			"detail": string().readonly().optional(),
			"recordedAt": number().readonly(),
			"stale": boolean().readonly().optional(),
			"uncoveredScope": array(string()).readonly().optional(),
			"evidenceRefs": array(string()).readonly().optional()
		}));
		const _deepseek_ai_dsh_task_tasks_listPhaseRuns_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_listPhaseRuns_result$schema = array(object({
			"phaseRunId": intersection(string(), unknown()).readonly(),
			"runId": intersection(string(), unknown()).readonly(),
			"taskId": intersection(string(), unknown()).readonly(),
			"phaseId": string().readonly(),
			"state": union([
				literal("stale"),
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("superseded"),
				literal("created"),
				literal("scheduled"),
				literal("submitting"),
				literal("submitted"),
				literal("gate-running"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("patching"),
				literal("passed")
			]).readonly(),
			"revision": number().readonly(),
			"activeSubmissionId": intersection(string(), unknown()).readonly().optional(),
			"sessionId": string().readonly().optional(),
			"schedulingFrozen": boolean().readonly().optional()
		}));
		const _deepseek_ai_dsh_task_tasks_listTasks_result$schema = array(object({
			"taskId": intersection(string(), unknown()).readonly(),
			"workspaceId": string().readonly(),
			"pinnedRecipe": object({
				"recipeId": intersection(string(), unknown()).readonly(),
				"revision": number().readonly(),
				"schemaVersion": number().readonly(),
				"contentHash": string().readonly()
			}).readonly(),
			"state": union([
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("paused"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("planning"),
				literal("pausing"),
				literal("cancelling"),
				literal("completed")
			]).readonly(),
			"revision": number().readonly(),
			"currentRunId": intersection(string(), unknown()).readonly().optional(),
			"idempotencyKey": string().readonly().optional(),
			"createdAt": number().readonly()
		}));
		const _deepseek_ai_dsh_task_tasks_markGateChecksStale_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_markGateChecksStale_parameter_1$schema = array(string());
		const _deepseek_ai_dsh_task_tasks_markGateChecksStale_parameter_2$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_markGateChecksStale_result$schema = array(object({
			"submissionId": intersection(string(), unknown()).readonly(),
			"checkId": string().readonly(),
			"passed": boolean().readonly(),
			"kind": union([
				literal("A"),
				literal("B"),
				literal("C")
			]).readonly().optional(),
			"detail": string().readonly().optional(),
			"recordedAt": number().readonly(),
			"stale": boolean().readonly().optional(),
			"uncoveredScope": array(string()).readonly().optional(),
			"evidenceRefs": array(string()).readonly().optional()
		}));
		const _deepseek_ai_dsh_task_tasks_markPhaseAwaitingDecision_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_markPhaseAwaitingDecision_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_markPhaseAwaitingDecision_result$schema = object({
			"phaseRunId": intersection(string(), unknown()).readonly(),
			"runId": intersection(string(), unknown()).readonly(),
			"taskId": intersection(string(), unknown()).readonly(),
			"phaseId": string().readonly(),
			"state": union([
				literal("stale"),
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("superseded"),
				literal("created"),
				literal("scheduled"),
				literal("submitting"),
				literal("submitted"),
				literal("gate-running"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("patching"),
				literal("passed")
			]).readonly(),
			"revision": number().readonly(),
			"activeSubmissionId": intersection(string(), unknown()).readonly().optional(),
			"sessionId": string().readonly().optional(),
			"schedulingFrozen": boolean().readonly().optional()
		});
		const _deepseek_ai_dsh_task_tasks_markPhaseAwaitingInput_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_markPhaseAwaitingInput_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_markPhaseAwaitingInput_result$schema = object({
			"phaseRunId": intersection(string(), unknown()).readonly(),
			"runId": intersection(string(), unknown()).readonly(),
			"taskId": intersection(string(), unknown()).readonly(),
			"phaseId": string().readonly(),
			"state": union([
				literal("stale"),
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("superseded"),
				literal("created"),
				literal("scheduled"),
				literal("submitting"),
				literal("submitted"),
				literal("gate-running"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("patching"),
				literal("passed")
			]).readonly(),
			"revision": number().readonly(),
			"activeSubmissionId": intersection(string(), unknown()).readonly().optional(),
			"sessionId": string().readonly().optional(),
			"schedulingFrozen": boolean().readonly().optional()
		});
		const _deepseek_ai_dsh_task_tasks_markPhaseFailed_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_markPhaseFailed_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_markPhaseFailed_result$schema = object({
			"phaseRunId": intersection(string(), unknown()).readonly(),
			"runId": intersection(string(), unknown()).readonly(),
			"taskId": intersection(string(), unknown()).readonly(),
			"phaseId": string().readonly(),
			"state": union([
				literal("stale"),
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("superseded"),
				literal("created"),
				literal("scheduled"),
				literal("submitting"),
				literal("submitted"),
				literal("gate-running"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("patching"),
				literal("passed")
			]).readonly(),
			"revision": number().readonly(),
			"activeSubmissionId": intersection(string(), unknown()).readonly().optional(),
			"sessionId": string().readonly().optional(),
			"schedulingFrozen": boolean().readonly().optional()
		});
		const _deepseek_ai_dsh_task_tasks_markPhasePassed_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_markPhasePassed_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_markPhasePassed_result$schema = object({
			"phaseRunId": intersection(string(), unknown()).readonly(),
			"runId": intersection(string(), unknown()).readonly(),
			"taskId": intersection(string(), unknown()).readonly(),
			"phaseId": string().readonly(),
			"state": union([
				literal("stale"),
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("superseded"),
				literal("created"),
				literal("scheduled"),
				literal("submitting"),
				literal("submitted"),
				literal("gate-running"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("patching"),
				literal("passed")
			]).readonly(),
			"revision": number().readonly(),
			"activeSubmissionId": intersection(string(), unknown()).readonly().optional(),
			"sessionId": string().readonly().optional(),
			"schedulingFrozen": boolean().readonly().optional()
		});
		const _deepseek_ai_dsh_task_tasks_markPhaseStale_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_markPhaseStale_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_markPhaseStale_result$schema = object({
			"phaseRunId": intersection(string(), unknown()).readonly(),
			"runId": intersection(string(), unknown()).readonly(),
			"taskId": intersection(string(), unknown()).readonly(),
			"phaseId": string().readonly(),
			"state": union([
				literal("stale"),
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("superseded"),
				literal("created"),
				literal("scheduled"),
				literal("submitting"),
				literal("submitted"),
				literal("gate-running"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("patching"),
				literal("passed")
			]).readonly(),
			"revision": number().readonly(),
			"activeSubmissionId": intersection(string(), unknown()).readonly().optional(),
			"sessionId": string().readonly().optional(),
			"schedulingFrozen": boolean().readonly().optional()
		});
		const _deepseek_ai_dsh_task_tasks_markPhaseSuperseded_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_markPhaseSuperseded_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_markPhaseSuperseded_result$schema = object({
			"phaseRunId": intersection(string(), unknown()).readonly(),
			"runId": intersection(string(), unknown()).readonly(),
			"taskId": intersection(string(), unknown()).readonly(),
			"phaseId": string().readonly(),
			"state": union([
				literal("stale"),
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("superseded"),
				literal("created"),
				literal("scheduled"),
				literal("submitting"),
				literal("submitted"),
				literal("gate-running"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("patching"),
				literal("passed")
			]).readonly(),
			"revision": number().readonly(),
			"activeSubmissionId": intersection(string(), unknown()).readonly().optional(),
			"sessionId": string().readonly().optional(),
			"schedulingFrozen": boolean().readonly().optional()
		});
		const _deepseek_ai_dsh_task_tasks_markTaskAwaitingDecision_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_markTaskAwaitingDecision_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_markTaskAwaitingDecision_result$schema = object({
			"taskId": intersection(string(), unknown()).readonly(),
			"workspaceId": string().readonly(),
			"pinnedRecipe": object({
				"recipeId": intersection(string(), unknown()).readonly(),
				"revision": number().readonly(),
				"schemaVersion": number().readonly(),
				"contentHash": string().readonly()
			}).readonly(),
			"state": union([
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("paused"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("planning"),
				literal("pausing"),
				literal("cancelling"),
				literal("completed")
			]).readonly(),
			"revision": number().readonly(),
			"currentRunId": intersection(string(), unknown()).readonly().optional(),
			"idempotencyKey": string().readonly().optional(),
			"createdAt": number().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_recordGateCheck_parameter_0$schema = object({
			"submissionId": intersection(string(), unknown()).readonly(),
			"checkId": string().readonly(),
			"passed": boolean().readonly(),
			"kind": union([
				literal("A"),
				literal("B"),
				literal("C")
			]).readonly().optional(),
			"detail": string().readonly().optional(),
			"recordedAt": number().readonly(),
			"stale": boolean().readonly().optional(),
			"uncoveredScope": array(string()).readonly().optional(),
			"evidenceRefs": array(string()).readonly().optional()
		});
		const _deepseek_ai_dsh_task_tasks_recordGateCheck_result$schema = object({
			"submissionId": intersection(string(), unknown()).readonly(),
			"checkId": string().readonly(),
			"passed": boolean().readonly(),
			"kind": union([
				literal("A"),
				literal("B"),
				literal("C")
			]).readonly().optional(),
			"detail": string().readonly().optional(),
			"recordedAt": number().readonly(),
			"stale": boolean().readonly().optional(),
			"uncoveredScope": array(string()).readonly().optional(),
			"evidenceRefs": array(string()).readonly().optional()
		});
		const _deepseek_ai_dsh_task_tasks_recordPhaseSession_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_recordPhaseSession_parameter_1$schema = string();
		const _deepseek_ai_dsh_task_tasks_recordPhaseSession_parameter_2$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_recordPhaseSession_result$schema = object({
			"phaseRunId": intersection(string(), unknown()).readonly(),
			"runId": intersection(string(), unknown()).readonly(),
			"taskId": intersection(string(), unknown()).readonly(),
			"phaseId": string().readonly(),
			"state": union([
				literal("stale"),
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("superseded"),
				literal("created"),
				literal("scheduled"),
				literal("submitting"),
				literal("submitted"),
				literal("gate-running"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("patching"),
				literal("passed")
			]).readonly(),
			"revision": number().readonly(),
			"activeSubmissionId": intersection(string(), unknown()).readonly().optional(),
			"sessionId": string().readonly().optional(),
			"schedulingFrozen": boolean().readonly().optional()
		});
		const _deepseek_ai_dsh_task_tasks_recordSubmission_parameter_0$schema = object({
			"submissionId": intersection(string(), unknown()).readonly(),
			"taskId": intersection(string(), unknown()).readonly(),
			"taskRunId": intersection(string(), unknown()).readonly(),
			"phaseRunId": intersection(string(), unknown()).readonly(),
			"phaseId": string().readonly(),
			"attempt": number().readonly(),
			"pinnedRecipe": object({
				"recipeId": intersection(string(), unknown()).readonly(),
				"revision": number().readonly(),
				"schemaVersion": number().readonly(),
				"contentHash": string().readonly()
			}).readonly(),
			"sourceSessionId": string().readonly(),
			"sourceSeqRange": object({
				"start": number().readonly(),
				"end": number().readonly()
			}).readonly(),
			"inputVersions": array(object({
				"deliverableId": intersection(string(), unknown()).readonly(),
				"versionId": intersection(string(), unknown()).readonly()
			})).readonly(),
			"outputVersions": array(object({
				"deliverableId": intersection(string(), unknown()).readonly(),
				"versionId": intersection(string(), unknown()).readonly()
			})).readonly(),
			"unresolvedIssues": array(string()).readonly(),
			"result": union([
				literal("failed"),
				literal("completed"),
				literal("needs-clarification")
			]).readonly(),
			"failureReason": string().readonly().optional(),
			"idempotencyKey": string().readonly(),
			"submittedAt": number().readonly(),
			"supersedesSubmissionId": intersection(string(), unknown()).readonly().optional()
		});
		const _deepseek_ai_dsh_task_tasks_recordSubmission_parameter_1$schema = object({
			"submittedBy": string().readonly(),
			"sourceSeqPersisted": boolean().readonly(),
			"inputsCurrent": boolean().readonly(),
			"outputsValid": boolean().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_recordSubmission_result$schema = object({
			"submissionId": intersection(string(), unknown()).readonly(),
			"taskId": intersection(string(), unknown()).readonly(),
			"taskRunId": intersection(string(), unknown()).readonly(),
			"phaseRunId": intersection(string(), unknown()).readonly(),
			"phaseId": string().readonly(),
			"attempt": number().readonly(),
			"pinnedRecipe": object({
				"recipeId": intersection(string(), unknown()).readonly(),
				"revision": number().readonly(),
				"schemaVersion": number().readonly(),
				"contentHash": string().readonly()
			}).readonly(),
			"sourceSessionId": string().readonly(),
			"sourceSeqRange": object({
				"start": number().readonly(),
				"end": number().readonly()
			}).readonly(),
			"inputVersions": array(object({
				"deliverableId": intersection(string(), unknown()).readonly(),
				"versionId": intersection(string(), unknown()).readonly()
			})).readonly(),
			"outputVersions": array(object({
				"deliverableId": intersection(string(), unknown()).readonly(),
				"versionId": intersection(string(), unknown()).readonly()
			})).readonly(),
			"unresolvedIssues": array(string()).readonly(),
			"result": union([
				literal("failed"),
				literal("completed"),
				literal("needs-clarification")
			]).readonly(),
			"failureReason": string().readonly().optional(),
			"idempotencyKey": string().readonly(),
			"submittedAt": number().readonly(),
			"supersedesSubmissionId": intersection(string(), unknown()).readonly().optional()
		});
		const _deepseek_ai_dsh_task_tasks_requestCancel_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_requestCancel_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_requestCancel_result$schema = object({
			"taskId": intersection(string(), unknown()).readonly(),
			"workspaceId": string().readonly(),
			"pinnedRecipe": object({
				"recipeId": intersection(string(), unknown()).readonly(),
				"revision": number().readonly(),
				"schemaVersion": number().readonly(),
				"contentHash": string().readonly()
			}).readonly(),
			"state": union([
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("paused"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("planning"),
				literal("pausing"),
				literal("cancelling"),
				literal("completed")
			]).readonly(),
			"revision": number().readonly(),
			"currentRunId": intersection(string(), unknown()).readonly().optional(),
			"idempotencyKey": string().readonly().optional(),
			"createdAt": number().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_requestPatch_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_requestPatch_parameter_1$schema = string();
		const _deepseek_ai_dsh_task_tasks_requestPatch_parameter_2$schema = string();
		const _deepseek_ai_dsh_task_tasks_requestPatch_parameter_3$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_requestPatch_result$schema = object({
			"submissionId": intersection(string(), unknown()).readonly(),
			"taskId": intersection(string(), unknown()).readonly(),
			"taskRunId": intersection(string(), unknown()).readonly(),
			"phaseRunId": intersection(string(), unknown()).readonly(),
			"phaseId": string().readonly(),
			"attempt": number().readonly(),
			"pinnedRecipe": object({
				"recipeId": intersection(string(), unknown()).readonly(),
				"revision": number().readonly(),
				"schemaVersion": number().readonly(),
				"contentHash": string().readonly()
			}).readonly(),
			"sourceSessionId": string().readonly(),
			"sourceSeqRange": object({
				"start": number().readonly(),
				"end": number().readonly()
			}).readonly(),
			"inputVersions": array(object({
				"deliverableId": intersection(string(), unknown()).readonly(),
				"versionId": intersection(string(), unknown()).readonly()
			})).readonly(),
			"outputVersions": array(object({
				"deliverableId": intersection(string(), unknown()).readonly(),
				"versionId": intersection(string(), unknown()).readonly()
			})).readonly(),
			"unresolvedIssues": array(string()).readonly(),
			"result": union([
				literal("failed"),
				literal("completed"),
				literal("needs-clarification")
			]).readonly(),
			"failureReason": string().readonly().optional(),
			"idempotencyKey": string().readonly(),
			"submittedAt": number().readonly(),
			"supersedesSubmissionId": intersection(string(), unknown()).readonly().optional()
		});
		const _deepseek_ai_dsh_task_tasks_requestPause_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_requestPause_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_requestPause_result$schema = object({
			"taskId": intersection(string(), unknown()).readonly(),
			"workspaceId": string().readonly(),
			"pinnedRecipe": object({
				"recipeId": intersection(string(), unknown()).readonly(),
				"revision": number().readonly(),
				"schemaVersion": number().readonly(),
				"contentHash": string().readonly()
			}).readonly(),
			"state": union([
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("paused"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("planning"),
				literal("pausing"),
				literal("cancelling"),
				literal("completed")
			]).readonly(),
			"revision": number().readonly(),
			"currentRunId": intersection(string(), unknown()).readonly().optional(),
			"idempotencyKey": string().readonly().optional(),
			"createdAt": number().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_resume_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_resume_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_resume_result$schema = object({
			"taskId": intersection(string(), unknown()).readonly(),
			"workspaceId": string().readonly(),
			"pinnedRecipe": object({
				"recipeId": intersection(string(), unknown()).readonly(),
				"revision": number().readonly(),
				"schemaVersion": number().readonly(),
				"contentHash": string().readonly()
			}).readonly(),
			"state": union([
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("paused"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("planning"),
				literal("pausing"),
				literal("cancelling"),
				literal("completed")
			]).readonly(),
			"revision": number().readonly(),
			"currentRunId": intersection(string(), unknown()).readonly().optional(),
			"idempotencyKey": string().readonly().optional(),
			"createdAt": number().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_resumePhaseFromAwaiting_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_resumePhaseFromAwaiting_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_resumePhaseFromAwaiting_result$schema = object({
			"phaseRunId": intersection(string(), unknown()).readonly(),
			"runId": intersection(string(), unknown()).readonly(),
			"taskId": intersection(string(), unknown()).readonly(),
			"phaseId": string().readonly(),
			"state": union([
				literal("stale"),
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("superseded"),
				literal("created"),
				literal("scheduled"),
				literal("submitting"),
				literal("submitted"),
				literal("gate-running"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("patching"),
				literal("passed")
			]).readonly(),
			"revision": number().readonly(),
			"activeSubmissionId": intersection(string(), unknown()).readonly().optional(),
			"sessionId": string().readonly().optional(),
			"schedulingFrozen": boolean().readonly().optional()
		});
		const _deepseek_ai_dsh_task_tasks_resumeTaskFromDecision_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_resumeTaskFromDecision_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_resumeTaskFromDecision_result$schema = object({
			"taskId": intersection(string(), unknown()).readonly(),
			"workspaceId": string().readonly(),
			"pinnedRecipe": object({
				"recipeId": intersection(string(), unknown()).readonly(),
				"revision": number().readonly(),
				"schemaVersion": number().readonly(),
				"contentHash": string().readonly()
			}).readonly(),
			"state": union([
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("paused"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("planning"),
				literal("pausing"),
				literal("cancelling"),
				literal("completed")
			]).readonly(),
			"revision": number().readonly(),
			"currentRunId": intersection(string(), unknown()).readonly().optional(),
			"idempotencyKey": string().readonly().optional(),
			"createdAt": number().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_settleCancel_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_settleCancel_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_settleCancel_result$schema = object({
			"taskId": intersection(string(), unknown()).readonly(),
			"workspaceId": string().readonly(),
			"pinnedRecipe": object({
				"recipeId": intersection(string(), unknown()).readonly(),
				"revision": number().readonly(),
				"schemaVersion": number().readonly(),
				"contentHash": string().readonly()
			}).readonly(),
			"state": union([
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("paused"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("planning"),
				literal("pausing"),
				literal("cancelling"),
				literal("completed")
			]).readonly(),
			"revision": number().readonly(),
			"currentRunId": intersection(string(), unknown()).readonly().optional(),
			"idempotencyKey": string().readonly().optional(),
			"createdAt": number().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_settlePause_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_settlePause_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_settlePause_result$schema = object({
			"taskId": intersection(string(), unknown()).readonly(),
			"workspaceId": string().readonly(),
			"pinnedRecipe": object({
				"recipeId": intersection(string(), unknown()).readonly(),
				"revision": number().readonly(),
				"schemaVersion": number().readonly(),
				"contentHash": string().readonly()
			}).readonly(),
			"state": union([
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("paused"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("planning"),
				literal("pausing"),
				literal("cancelling"),
				literal("completed")
			]).readonly(),
			"revision": number().readonly(),
			"currentRunId": intersection(string(), unknown()).readonly().optional(),
			"idempotencyKey": string().readonly().optional(),
			"createdAt": number().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_startGate_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_startGate_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_startGate_result$schema = object({
			"phaseRunId": intersection(string(), unknown()).readonly(),
			"runId": intersection(string(), unknown()).readonly(),
			"taskId": intersection(string(), unknown()).readonly(),
			"phaseId": string().readonly(),
			"state": union([
				literal("stale"),
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("superseded"),
				literal("created"),
				literal("scheduled"),
				literal("submitting"),
				literal("submitted"),
				literal("gate-running"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("patching"),
				literal("passed")
			]).readonly(),
			"revision": number().readonly(),
			"activeSubmissionId": intersection(string(), unknown()).readonly().optional(),
			"sessionId": string().readonly().optional(),
			"schedulingFrozen": boolean().readonly().optional()
		});
		const _deepseek_ai_dsh_task_tasks_startPhaseRun_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_startPhaseRun_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_startPhaseRun_result$schema = object({
			"phaseRunId": intersection(string(), unknown()).readonly(),
			"runId": intersection(string(), unknown()).readonly(),
			"taskId": intersection(string(), unknown()).readonly(),
			"phaseId": string().readonly(),
			"state": union([
				literal("stale"),
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("superseded"),
				literal("created"),
				literal("scheduled"),
				literal("submitting"),
				literal("submitted"),
				literal("gate-running"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("patching"),
				literal("passed")
			]).readonly(),
			"revision": number().readonly(),
			"activeSubmissionId": intersection(string(), unknown()).readonly().optional(),
			"sessionId": string().readonly().optional(),
			"schedulingFrozen": boolean().readonly().optional()
		});
		const _deepseek_ai_dsh_task_tasks_startTask_parameter_0$schema = string();
		const _deepseek_ai_dsh_task_tasks_startTask_parameter_1$schema = object({
			"actor": string().readonly(),
			"reason": string().readonly(),
			"expectedRevision": number().readonly(),
			"idempotencyKey": string().readonly()
		});
		const _deepseek_ai_dsh_task_tasks_startTask_result$schema = object({
			"taskId": intersection(string(), unknown()).readonly(),
			"workspaceId": string().readonly(),
			"pinnedRecipe": object({
				"recipeId": intersection(string(), unknown()).readonly(),
				"revision": number().readonly(),
				"schemaVersion": number().readonly(),
				"contentHash": string().readonly()
			}).readonly(),
			"state": union([
				literal("running"),
				literal("cancelled"),
				literal("failed"),
				literal("paused"),
				literal("awaiting-input"),
				literal("awaiting-decision"),
				literal("planning"),
				literal("pausing"),
				literal("cancelling"),
				literal("completed")
			]).readonly(),
			"revision": number().readonly(),
			"currentRunId": intersection(string(), unknown()).readonly().optional(),
			"idempotencyKey": string().readonly().optional(),
			"createdAt": number().readonly()
		});
		const TYPERT_REMOTE$2 = {
			package: "@deepseek-ai/dsh-task",
			descriptors: [
				{
					id: "@deepseek-ai/dsh-task#tasks/cancelPhaseRun",
					service: "tasks",
					namespace: "tasks",
					method: "cancelPhaseRun",
					invocation: { kind: "direct" },
					parameters: [{
						name: "phaseRunId",
						wire: "phaseRunId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/cancelPhaseRun:phaseRunId",
							schema: _deepseek_ai_dsh_task_tasks_cancelPhaseRun_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_cancelPhaseRun_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#PhaseRunRecord",
						schema: _deepseek_ai_dsh_task_tasks_cancelPhaseRun_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 683,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/clearPhaseScheduling",
					service: "tasks",
					namespace: "tasks",
					method: "clearPhaseScheduling",
					invocation: { kind: "direct" },
					parameters: [{
						name: "phaseRunId",
						wire: "phaseRunId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/clearPhaseScheduling:phaseRunId",
							schema: _deepseek_ai_dsh_task_tasks_clearPhaseScheduling_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_clearPhaseScheduling_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#PhaseRunRecord",
						schema: _deepseek_ai_dsh_task_tasks_clearPhaseScheduling_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 790,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/completeTask",
					service: "tasks",
					namespace: "tasks",
					method: "completeTask",
					invocation: { kind: "direct" },
					parameters: [{
						name: "taskId",
						wire: "taskId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/completeTask:taskId",
							schema: _deepseek_ai_dsh_task_tasks_completeTask_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_completeTask_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#TaskRecord",
						schema: _deepseek_ai_dsh_task_tasks_completeTask_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 387,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/confirmCreateTask",
					service: "tasks",
					namespace: "tasks",
					method: "confirmCreateTask",
					invocation: { kind: "direct" },
					parameters: [
						{
							name: "recipeId",
							wire: "recipeId",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/confirmCreateTask:recipeId",
								schema: _deepseek_ai_dsh_task_tasks_confirmCreateTask_parameter_0$schema
							}
						},
						{
							name: "goal",
							wire: "goal",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/confirmCreateTask:goal",
								schema: _deepseek_ai_dsh_task_tasks_confirmCreateTask_parameter_1$schema
							}
						},
						{
							name: "inheritSession",
							wire: "inheritSession",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/confirmCreateTask:inheritSession",
								schema: _deepseek_ai_dsh_task_tasks_confirmCreateTask_parameter_2$schema
							}
						},
						{
							name: "idempotencyKey",
							wire: "idempotencyKey",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/confirmCreateTask:idempotencyKey",
								schema: _deepseek_ai_dsh_task_tasks_confirmCreateTask_parameter_3$schema
							}
						},
						{
							name: "sourceSessionId",
							wire: "sourceSessionId",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/confirmCreateTask:sourceSessionId",
								schema: _deepseek_ai_dsh_task_tasks_confirmCreateTask_parameter_4$schema
							}
						},
						{
							name: "workspaceId",
							wire: "workspaceId",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/confirmCreateTask:workspaceId",
								schema: _deepseek_ai_dsh_task_tasks_confirmCreateTask_parameter_5$schema
							}
						},
						{
							name: "actor",
							wire: "actor",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/confirmCreateTask:actor",
								schema: _deepseek_ai_dsh_task_tasks_confirmCreateTask_parameter_6$schema
							}
						}
					],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#TaskCreateConfirmResult",
						schema: _deepseek_ai_dsh_task_tasks_confirmCreateTask_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 239,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/createPhaseRun",
					service: "tasks",
					namespace: "tasks",
					method: "createPhaseRun",
					invocation: { kind: "direct" },
					parameters: [
						{
							name: "runId",
							wire: "runId",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/createPhaseRun:runId",
								schema: _deepseek_ai_dsh_task_tasks_createPhaseRun_parameter_0$schema
							}
						},
						{
							name: "phaseId",
							wire: "phaseId",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/createPhaseRun:phaseId",
								schema: _deepseek_ai_dsh_task_tasks_createPhaseRun_parameter_1$schema
							}
						},
						{
							name: "mutation",
							wire: "mutation",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
								schema: _deepseek_ai_dsh_task_tasks_createPhaseRun_parameter_2$schema
							}
						}
					],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#PhaseRunRecord",
						schema: _deepseek_ai_dsh_task_tasks_createPhaseRun_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 467,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/createTask",
					service: "tasks",
					namespace: "tasks",
					method: "createTask",
					invocation: { kind: "direct" },
					parameters: [
						{
							name: "recipeId",
							wire: "recipeId",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/createTask:recipeId",
								schema: _deepseek_ai_dsh_task_tasks_createTask_parameter_0$schema
							}
						},
						{
							name: "workspaceId",
							wire: "workspaceId",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/createTask:workspaceId",
								schema: _deepseek_ai_dsh_task_tasks_createTask_parameter_1$schema
							}
						},
						{
							name: "actor",
							wire: "actor",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/createTask:actor",
								schema: _deepseek_ai_dsh_task_tasks_createTask_parameter_2$schema
							}
						},
						{
							name: "idempotencyKey",
							wire: "idempotencyKey",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/createTask:idempotencyKey",
								schema: _deepseek_ai_dsh_task_tasks_createTask_parameter_3$schema
							}
						}
					],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#TaskRecord",
						schema: _deepseek_ai_dsh_task_tasks_createTask_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 176,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/createTaskRun",
					service: "tasks",
					namespace: "tasks",
					method: "createTaskRun",
					invocation: { kind: "direct" },
					parameters: [
						{
							name: "taskId",
							wire: "taskId",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/createTaskRun:taskId",
								schema: _deepseek_ai_dsh_task_tasks_createTaskRun_parameter_0$schema
							}
						},
						{
							name: "mutation",
							wire: "mutation",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
								schema: _deepseek_ai_dsh_task_tasks_createTaskRun_parameter_1$schema
							}
						},
						{
							name: "parentRunId",
							wire: "parentRunId",
							source: "json",
							acceptsUndefined: true,
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/createTaskRun:parentRunId",
								schema: _deepseek_ai_dsh_task_tasks_createTaskRun_parameter_2$schema
							}
						}
					],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#TaskRunRecord",
						schema: _deepseek_ai_dsh_task_tasks_createTaskRun_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 431,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/failTask",
					service: "tasks",
					namespace: "tasks",
					method: "failTask",
					invocation: { kind: "direct" },
					parameters: [{
						name: "taskId",
						wire: "taskId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/failTask:taskId",
							schema: _deepseek_ai_dsh_task_tasks_failTask_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_failTask_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#TaskRecord",
						schema: _deepseek_ai_dsh_task_tasks_failTask_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 373,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/freezePhaseScheduling",
					service: "tasks",
					namespace: "tasks",
					method: "freezePhaseScheduling",
					invocation: { kind: "direct" },
					parameters: [{
						name: "phaseRunId",
						wire: "phaseRunId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/freezePhaseScheduling:phaseRunId",
							schema: _deepseek_ai_dsh_task_tasks_freezePhaseScheduling_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_freezePhaseScheduling_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#PhaseRunRecord",
						schema: _deepseek_ai_dsh_task_tasks_freezePhaseScheduling_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 778,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/getPhaseRun",
					service: "tasks",
					namespace: "tasks",
					method: "getPhaseRun",
					invocation: { kind: "direct" },
					parameters: [{
						name: "phaseRunId",
						wire: "phaseRunId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/getPhaseRun:phaseRunId",
							schema: _deepseek_ai_dsh_task_tasks_getPhaseRun_parameter_0$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task#tasks/getPhaseRun:result",
						schema: _deepseek_ai_dsh_task_tasks_getPhaseRun_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 838,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/getSubmission",
					service: "tasks",
					namespace: "tasks",
					method: "getSubmission",
					invocation: { kind: "direct" },
					parameters: [{
						name: "submissionId",
						wire: "submissionId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/getSubmission:submissionId",
							schema: _deepseek_ai_dsh_task_tasks_getSubmission_parameter_0$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task#tasks/getSubmission:result",
						schema: _deepseek_ai_dsh_task_tasks_getSubmission_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 859,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/getTask",
					service: "tasks",
					namespace: "tasks",
					method: "getTask",
					invocation: { kind: "direct" },
					parameters: [{
						name: "taskId",
						wire: "taskId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/getTask:taskId",
							schema: _deepseek_ai_dsh_task_tasks_getTask_parameter_0$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task#tasks/getTask:result",
						schema: _deepseek_ai_dsh_task_tasks_getTask_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 819,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/listGateResults",
					service: "tasks",
					namespace: "tasks",
					method: "listGateResults",
					invocation: { kind: "direct" },
					parameters: [{
						name: "submissionId",
						wire: "submissionId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/listGateResults:submissionId",
							schema: _deepseek_ai_dsh_task_tasks_listGateResults_parameter_0$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task#tasks/listGateResults:result",
						schema: _deepseek_ai_dsh_task_tasks_listGateResults_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 869,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/listPhaseRuns",
					service: "tasks",
					namespace: "tasks",
					method: "listPhaseRuns",
					invocation: { kind: "direct" },
					parameters: [{
						name: "runId",
						wire: "runId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/listPhaseRuns:runId",
							schema: _deepseek_ai_dsh_task_tasks_listPhaseRuns_parameter_0$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task#tasks/listPhaseRuns:result",
						schema: _deepseek_ai_dsh_task_tasks_listPhaseRuns_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 848,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/listTasks",
					service: "tasks",
					namespace: "tasks",
					method: "listTasks",
					invocation: { kind: "direct" },
					parameters: [],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task#tasks/listTasks:result",
						schema: _deepseek_ai_dsh_task_tasks_listTasks_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 828,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/markGateChecksStale",
					service: "tasks",
					namespace: "tasks",
					method: "markGateChecksStale",
					invocation: { kind: "direct" },
					parameters: [
						{
							name: "submissionId",
							wire: "submissionId",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/markGateChecksStale:submissionId",
								schema: _deepseek_ai_dsh_task_tasks_markGateChecksStale_parameter_0$schema
							}
						},
						{
							name: "checkIds",
							wire: "checkIds",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/markGateChecksStale:checkIds",
								schema: _deepseek_ai_dsh_task_tasks_markGateChecksStale_parameter_1$schema
							}
						},
						{
							name: "mutation",
							wire: "mutation",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
								schema: _deepseek_ai_dsh_task_tasks_markGateChecksStale_parameter_2$schema
							}
						}
					],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task#tasks/markGateChecksStale:result",
						schema: _deepseek_ai_dsh_task_tasks_markGateChecksStale_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 804,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/markPhaseAwaitingDecision",
					service: "tasks",
					namespace: "tasks",
					method: "markPhaseAwaitingDecision",
					invocation: { kind: "direct" },
					parameters: [{
						name: "phaseRunId",
						wire: "phaseRunId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/markPhaseAwaitingDecision:phaseRunId",
							schema: _deepseek_ai_dsh_task_tasks_markPhaseAwaitingDecision_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_markPhaseAwaitingDecision_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#PhaseRunRecord",
						schema: _deepseek_ai_dsh_task_tasks_markPhaseAwaitingDecision_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 736,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/markPhaseAwaitingInput",
					service: "tasks",
					namespace: "tasks",
					method: "markPhaseAwaitingInput",
					invocation: { kind: "direct" },
					parameters: [{
						name: "phaseRunId",
						wire: "phaseRunId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/markPhaseAwaitingInput:phaseRunId",
							schema: _deepseek_ai_dsh_task_tasks_markPhaseAwaitingInput_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_markPhaseAwaitingInput_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#PhaseRunRecord",
						schema: _deepseek_ai_dsh_task_tasks_markPhaseAwaitingInput_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 724,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/markPhaseFailed",
					service: "tasks",
					namespace: "tasks",
					method: "markPhaseFailed",
					invocation: { kind: "direct" },
					parameters: [{
						name: "phaseRunId",
						wire: "phaseRunId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/markPhaseFailed:phaseRunId",
							schema: _deepseek_ai_dsh_task_tasks_markPhaseFailed_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_markPhaseFailed_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#PhaseRunRecord",
						schema: _deepseek_ai_dsh_task_tasks_markPhaseFailed_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 672,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/markPhasePassed",
					service: "tasks",
					namespace: "tasks",
					method: "markPhasePassed",
					invocation: { kind: "direct" },
					parameters: [{
						name: "phaseRunId",
						wire: "phaseRunId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/markPhasePassed:phaseRunId",
							schema: _deepseek_ai_dsh_task_tasks_markPhasePassed_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_markPhasePassed_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#PhaseRunRecord",
						schema: _deepseek_ai_dsh_task_tasks_markPhasePassed_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 661,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/markPhaseStale",
					service: "tasks",
					namespace: "tasks",
					method: "markPhaseStale",
					invocation: { kind: "direct" },
					parameters: [{
						name: "phaseRunId",
						wire: "phaseRunId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/markPhaseStale:phaseRunId",
							schema: _deepseek_ai_dsh_task_tasks_markPhaseStale_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_markPhaseStale_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#PhaseRunRecord",
						schema: _deepseek_ai_dsh_task_tasks_markPhaseStale_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 697,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/markPhaseSuperseded",
					service: "tasks",
					namespace: "tasks",
					method: "markPhaseSuperseded",
					invocation: { kind: "direct" },
					parameters: [{
						name: "phaseRunId",
						wire: "phaseRunId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/markPhaseSuperseded:phaseRunId",
							schema: _deepseek_ai_dsh_task_tasks_markPhaseSuperseded_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_markPhaseSuperseded_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#PhaseRunRecord",
						schema: _deepseek_ai_dsh_task_tasks_markPhaseSuperseded_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 712,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/markTaskAwaitingDecision",
					service: "tasks",
					namespace: "tasks",
					method: "markTaskAwaitingDecision",
					invocation: { kind: "direct" },
					parameters: [{
						name: "taskId",
						wire: "taskId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/markTaskAwaitingDecision:taskId",
							schema: _deepseek_ai_dsh_task_tasks_markTaskAwaitingDecision_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_markTaskAwaitingDecision_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#TaskRecord",
						schema: _deepseek_ai_dsh_task_tasks_markTaskAwaitingDecision_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 406,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/recordGateCheck",
					service: "tasks",
					namespace: "tasks",
					method: "recordGateCheck",
					invocation: { kind: "direct" },
					parameters: [{
						name: "result",
						wire: "result",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#GateCheckResult",
							schema: _deepseek_ai_dsh_task_tasks_recordGateCheck_parameter_0$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#GateCheckResult",
						schema: _deepseek_ai_dsh_task_tasks_recordGateCheck_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 640,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/recordPhaseSession",
					service: "tasks",
					namespace: "tasks",
					method: "recordPhaseSession",
					invocation: { kind: "direct" },
					parameters: [
						{
							name: "phaseRunId",
							wire: "phaseRunId",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/recordPhaseSession:phaseRunId",
								schema: _deepseek_ai_dsh_task_tasks_recordPhaseSession_parameter_0$schema
							}
						},
						{
							name: "sessionId",
							wire: "sessionId",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/recordPhaseSession:sessionId",
								schema: _deepseek_ai_dsh_task_tasks_recordPhaseSession_parameter_1$schema
							}
						},
						{
							name: "mutation",
							wire: "mutation",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
								schema: _deepseek_ai_dsh_task_tasks_recordPhaseSession_parameter_2$schema
							}
						}
					],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#PhaseRunRecord",
						schema: _deepseek_ai_dsh_task_tasks_recordPhaseSession_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 764,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/recordSubmission",
					service: "tasks",
					namespace: "tasks",
					method: "recordSubmission",
					invocation: { kind: "direct" },
					parameters: [{
						name: "submission",
						wire: "submission",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#PhaseSubmission",
							schema: _deepseek_ai_dsh_task_tasks_recordSubmission_parameter_0$schema
						}
					}, {
						name: "environment",
						wire: "environment",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#SubmissionEnvironmentFacts",
							schema: _deepseek_ai_dsh_task_tasks_recordSubmission_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#PhaseSubmission",
						schema: _deepseek_ai_dsh_task_tasks_recordSubmission_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 562,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/requestCancel",
					service: "tasks",
					namespace: "tasks",
					method: "requestCancel",
					invocation: { kind: "direct" },
					parameters: [{
						name: "taskId",
						wire: "taskId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/requestCancel:taskId",
							schema: _deepseek_ai_dsh_task_tasks_requestCancel_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_requestCancel_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#TaskRecord",
						schema: _deepseek_ai_dsh_task_tasks_requestCancel_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 351,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/requestPatch",
					service: "tasks",
					namespace: "tasks",
					method: "requestPatch",
					invocation: { kind: "direct" },
					parameters: [
						{
							name: "taskId",
							wire: "taskId",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/requestPatch:taskId",
								schema: _deepseek_ai_dsh_task_tasks_requestPatch_parameter_0$schema
							}
						},
						{
							name: "phaseRunId",
							wire: "phaseRunId",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/requestPatch:phaseRunId",
								schema: _deepseek_ai_dsh_task_tasks_requestPatch_parameter_1$schema
							}
						},
						{
							name: "note",
							wire: "note",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task#tasks/requestPatch:note",
								schema: _deepseek_ai_dsh_task_tasks_requestPatch_parameter_2$schema
							}
						},
						{
							name: "mutation",
							wire: "mutation",
							source: "json",
							codec: {
								mode: "strict",
								typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
								schema: _deepseek_ai_dsh_task_tasks_requestPatch_parameter_3$schema
							}
						}
					],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#PhaseSubmission",
						schema: _deepseek_ai_dsh_task_tasks_requestPatch_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 578,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/requestPause",
					service: "tasks",
					namespace: "tasks",
					method: "requestPause",
					invocation: { kind: "direct" },
					parameters: [{
						name: "taskId",
						wire: "taskId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/requestPause:taskId",
							schema: _deepseek_ai_dsh_task_tasks_requestPause_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_requestPause_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#TaskRecord",
						schema: _deepseek_ai_dsh_task_tasks_requestPause_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 318,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/resume",
					service: "tasks",
					namespace: "tasks",
					method: "resume",
					invocation: { kind: "direct" },
					parameters: [{
						name: "taskId",
						wire: "taskId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/resume:taskId",
							schema: _deepseek_ai_dsh_task_tasks_resume_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_resume_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#TaskRecord",
						schema: _deepseek_ai_dsh_task_tasks_resume_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 340,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/resumePhaseFromAwaiting",
					service: "tasks",
					namespace: "tasks",
					method: "resumePhaseFromAwaiting",
					invocation: { kind: "direct" },
					parameters: [{
						name: "phaseRunId",
						wire: "phaseRunId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/resumePhaseFromAwaiting:phaseRunId",
							schema: _deepseek_ai_dsh_task_tasks_resumePhaseFromAwaiting_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_resumePhaseFromAwaiting_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#PhaseRunRecord",
						schema: _deepseek_ai_dsh_task_tasks_resumePhaseFromAwaiting_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 749,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/resumeTaskFromDecision",
					service: "tasks",
					namespace: "tasks",
					method: "resumeTaskFromDecision",
					invocation: { kind: "direct" },
					parameters: [{
						name: "taskId",
						wire: "taskId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/resumeTaskFromDecision:taskId",
							schema: _deepseek_ai_dsh_task_tasks_resumeTaskFromDecision_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_resumeTaskFromDecision_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#TaskRecord",
						schema: _deepseek_ai_dsh_task_tasks_resumeTaskFromDecision_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 418,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/settleCancel",
					service: "tasks",
					namespace: "tasks",
					method: "settleCancel",
					invocation: { kind: "direct" },
					parameters: [{
						name: "taskId",
						wire: "taskId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/settleCancel:taskId",
							schema: _deepseek_ai_dsh_task_tasks_settleCancel_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_settleCancel_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#TaskRecord",
						schema: _deepseek_ai_dsh_task_tasks_settleCancel_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 362,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/settlePause",
					service: "tasks",
					namespace: "tasks",
					method: "settlePause",
					invocation: { kind: "direct" },
					parameters: [{
						name: "taskId",
						wire: "taskId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/settlePause:taskId",
							schema: _deepseek_ai_dsh_task_tasks_settlePause_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_settlePause_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#TaskRecord",
						schema: _deepseek_ai_dsh_task_tasks_settlePause_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 329,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/startGate",
					service: "tasks",
					namespace: "tasks",
					method: "startGate",
					invocation: { kind: "direct" },
					parameters: [{
						name: "submissionId",
						wire: "submissionId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/startGate:submissionId",
							schema: _deepseek_ai_dsh_task_tasks_startGate_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_startGate_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#PhaseRunRecord",
						schema: _deepseek_ai_dsh_task_tasks_startGate_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 629,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/startPhaseRun",
					service: "tasks",
					namespace: "tasks",
					method: "startPhaseRun",
					invocation: { kind: "direct" },
					parameters: [{
						name: "phaseRunId",
						wire: "phaseRunId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/startPhaseRun:phaseRunId",
							schema: _deepseek_ai_dsh_task_tasks_startPhaseRun_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_startPhaseRun_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#PhaseRunRecord",
						schema: _deepseek_ai_dsh_task_tasks_startPhaseRun_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 494,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-task#tasks/startTask",
					service: "tasks",
					namespace: "tasks",
					method: "startTask",
					invocation: { kind: "direct" },
					parameters: [{
						name: "taskId",
						wire: "taskId",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task#tasks/startTask:taskId",
							schema: _deepseek_ai_dsh_task_tasks_startTask_parameter_0$schema
						}
					}, {
						name: "mutation",
						wire: "mutation",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-task/types#TaskMutationContext",
							schema: _deepseek_ai_dsh_task_tasks_startTask_parameter_1$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-task/types#TaskRecord",
						schema: _deepseek_ai_dsh_task_tasks_startTask_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/task/src/index.ts",
						"line": 307,
						"column": 9
					}
				}
			]
		};
		//#endregion
		//#region remote/workbench.js
		const _deepseek_ai_dsh_workbench_host_workbenchHost_confirmBatch_parameter_0$schema = object({
			"actor": string().readonly(),
			"items": array(object({
				"itemId": intersection(string(), unknown()).readonly(),
				"expectedEntityRevision": number().readonly()
			})).readonly()
		});
		const _deepseek_ai_dsh_workbench_host_workbenchHost_confirmBatch_result$schema = object({
			"snapshotVersion": number().readonly(),
			"results": array(object({
				"itemId": intersection(string(), unknown()).readonly(),
				"outcome": union([
					literal("resolved"),
					literal("stale"),
					literal("conflict"),
					literal("withdrawn"),
					literal("already-resolved")
				]).readonly(),
				"currentRevision": number().readonly().optional()
			})).readonly()
		});
		const _deepseek_ai_dsh_workbench_host_workbenchHost_invalidateItem_parameter_0$schema = object({
			"itemId": intersection(string(), unknown()).readonly(),
			"expectedEntityRevision": number().readonly(),
			"reason": string().readonly(),
			"actor": string().readonly()
		});
		const _deepseek_ai_dsh_workbench_host_workbenchHost_invalidateItem_result$schema = object({
			"snapshotVersion": number().readonly(),
			"outcome": union([
				literal("invalidated"),
				literal("stale"),
				literal("conflict"),
				literal("withdrawn"),
				literal("already-resolved")
			]).readonly(),
			"currentRevision": number().readonly().optional()
		});
		const _deepseek_ai_dsh_workbench_host_workbenchHost_listSnapshot_result$schema = object({
			"snapshotVersion": number().readonly(),
			"items": array(object({
				"itemId": intersection(string(), unknown()).readonly(),
				"kind": union([
					literal("b-confirm"),
					literal("c-decision"),
					literal("clarification"),
					literal("recovery")
				]).readonly(),
				"status": union([
					literal("open"),
					literal("resolved"),
					literal("invalidated"),
					literal("stale")
				]).readonly(),
				"entityRevision": number().readonly(),
				"title": string().readonly(),
				"decision": string().readonly().optional()
			})).readonly()
		});
		const _deepseek_ai_dsh_workbench_host_workbenchHost_resolveDecision_parameter_0$schema = object({
			"itemId": intersection(string(), unknown()).readonly(),
			"expectedEntityRevision": number().readonly(),
			"decision": string().readonly(),
			"actor": string().readonly()
		});
		const _deepseek_ai_dsh_workbench_host_workbenchHost_resolveDecision_result$schema = object({
			"snapshotVersion": number().readonly(),
			"outcome": union([
				literal("resolved"),
				literal("stale"),
				literal("conflict"),
				literal("withdrawn"),
				literal("already-resolved")
			]).readonly(),
			"currentRevision": number().readonly().optional()
		});
		const TYPERT_REMOTE$1 = {
			package: "@deepseek-ai/dsh-workbench-host",
			descriptors: [
				{
					id: "@deepseek-ai/dsh-workbench-host#workbenchHost/confirmBatch",
					service: "workbenchHost",
					namespace: "workbenchHost",
					method: "confirmBatch",
					invocation: { kind: "direct" },
					parameters: [{
						name: "request",
						wire: "request",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-workbench-host/types#BatchConfirmRequest",
							schema: _deepseek_ai_dsh_workbench_host_workbenchHost_confirmBatch_parameter_0$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-workbench-host/types#BatchConfirmResponse",
						schema: _deepseek_ai_dsh_workbench_host_workbenchHost_confirmBatch_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/workbench-host/src/index.ts",
						"line": 116,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-workbench-host#workbenchHost/invalidateItem",
					service: "workbenchHost",
					namespace: "workbenchHost",
					method: "invalidateItem",
					invocation: { kind: "direct" },
					parameters: [{
						name: "request",
						wire: "request",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-workbench-host/types#InvalidateItemRequest",
							schema: _deepseek_ai_dsh_workbench_host_workbenchHost_invalidateItem_parameter_0$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-workbench-host/types#InvalidateItemResponse",
						schema: _deepseek_ai_dsh_workbench_host_workbenchHost_invalidateItem_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/workbench-host/src/index.ts",
						"line": 172,
						"column": 9
					}
				},
				{
					id: "@deepseek-ai/dsh-workbench-host#workbenchHost/listSnapshot",
					service: "workbenchHost",
					namespace: "workbenchHost",
					method: "listSnapshot",
					invocation: { kind: "direct" },
					parameters: [],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-workbench-host/types#WorkbenchSnapshot",
						schema: _deepseek_ai_dsh_workbench_host_workbenchHost_listSnapshot_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/workbench-host/src/index.ts",
						"line": 102,
						"column": 3
					}
				},
				{
					id: "@deepseek-ai/dsh-workbench-host#workbenchHost/resolveDecision",
					service: "workbenchHost",
					namespace: "workbenchHost",
					method: "resolveDecision",
					invocation: { kind: "direct" },
					parameters: [{
						name: "request",
						wire: "request",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-workbench-host/types#ResolveDecisionRequest",
							schema: _deepseek_ai_dsh_workbench_host_workbenchHost_resolveDecision_parameter_0$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-workbench-host/types#ResolveDecisionResponse",
						schema: _deepseek_ai_dsh_workbench_host_workbenchHost_resolveDecision_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/workbench-host/src/index.ts",
						"line": 143,
						"column": 9
					}
				}
			]
		};
		//#endregion
		//#region remote/workbenchHostStream.js
		const JournalPayloadRemoteCodec$schema = union([
			literal(null),
			string(),
			number(),
			literal(false),
			literal(true),
			array(lazy(() => JournalPayloadRemoteCodec$schema)),
			record(string(), lazy(() => JournalPayloadRemoteCodec$schema))
		]);
		const _deepseek_ai_dsh_workbench_host_stream_workbenchHostStream_listIncremental_parameter_0$schema = union([_undefined(), number()]);
		const _deepseek_ai_dsh_workbench_host_stream_workbenchHostStream_listIncremental_result$schema = object({
			"streamId": string().readonly(),
			"cursor": number().readonly(),
			"events": array(object({
				"cursor": number().readonly(),
				"previousCursor": number().readonly(),
				"eventId": string().readonly(),
				"entityKind": literal("attention").readonly(),
				"entityId": string().readonly(),
				"entityRevision": number().readonly(),
				"operation": union([
					literal("resolved"),
					literal("invalidated"),
					literal("created"),
					literal("updated")
				]).readonly(),
				"payload": union([
					literal(null),
					string(),
					number(),
					literal(false),
					literal(true),
					array(lazy(() => JournalPayloadRemoteCodec$schema)),
					record(string(), lazy(() => JournalPayloadRemoteCodec$schema))
				]).readonly()
			})).readonly()
		});
		//#endregion
		//#region lib/types/client/remotes-mount.js
		/**
		* Task-flow Host Remote contributions the client half must mount itself.
		*
		* The published `@deepseek-ai/dsh-api-remotes` peer selects only the official
		* Host namespaces and never mounts the task-flow domains, so this assembly
		* owns their Remote ground-truth: importing the folded generated
		* `remote/*` contributions and `$mount`ing each registers the `tasks`,
		* `recipes`, `workbenchHost`, `workbenchHostStream`, `deliverables`, `digest`,
		* `metrics`, and `rewind` client namespaces (`ctx.remote.<ns>.<method>`).
		*
		* Kept apart from the aggregating `index.ts` (which pulls in the React
		* feature domains) so a lightweight node test can assert the mount list
		* without a browser runtime.
		*
		* @module
		*/
		/**
		* The exact task-flow namespace contributions, in a stable order. Iterating
		* this list with `ctx.remote.$mount` makes each namespace a live client
		* service before any feature reads `ctx.remote.<namespace>`.
		*/
		const taskFlowRemoteContributions = [
			TYPERT_REMOTE$4,
			TYPERT_REMOTE$2,
			TYPERT_REMOTE$7,
			TYPERT_REMOTE$6,
			TYPERT_REMOTE$5,
			TYPERT_REMOTE$3,
			TYPERT_REMOTE$1,
			{
				package: "@deepseek-ai/dsh-workbench-host-stream",
				descriptors: [{
					id: "@deepseek-ai/dsh-workbench-host-stream#workbenchHostStream/listIncremental",
					service: "workbenchHostStream",
					namespace: "workbenchHostStream",
					method: "listIncremental",
					invocation: { kind: "direct" },
					parameters: [{
						name: "cursor",
						wire: "cursor",
						source: "json",
						acceptsUndefined: true,
						codec: {
							mode: "strict",
							typeSymbol: "@deepseek-ai/dsh-workbench-host-stream#workbenchHostStream/listIncremental:cursor",
							schema: _deepseek_ai_dsh_workbench_host_stream_workbenchHostStream_listIncremental_parameter_0$schema
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "@deepseek-ai/dsh-workbench-host-stream/types#IncrementalPage",
						schema: _deepseek_ai_dsh_workbench_host_stream_workbenchHostStream_listIncremental_result$schema
					},
					sourceLocation: {
						"file": "packages/task-flow/workbench-host-stream/src/index.ts",
						"line": 89,
						"column": 3
					}
				}]
			}
		];
		//#endregion
		//#region lib/types/client-ui/workbench-drawer/client/badge.js
		/** Whether one task state counts as actively working for the indicator. */
		function activeState(state) {
			return state === "planning" || state === "running" || state === "pausing";
		}
		/**
		* The badge's state owner. Created once per plugin fiber in `apply`; the
		* snapshot store it exposes is the inject `hooks` source, so components
		* subscribe through the renderer-bound hook and never see this object.
		*/
		var BadgeController = class {
			/**
			* @param ctx - owning client root context; subscriptions and refreshes ride
			* this fiber's lifetime.
			*/
			constructor(ctx) {
				this.ctx = ctx;
				this.store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)({
					openCount: 0,
					activeCount: 0
				});
				ctx.effect(() => ctx.remote.$on("workbench/attention-updated", () => {
					this.refreshAttention();
				}), "workbench-drawer: attention-updated badge refresh");
				ctx.effect(() => ctx.remote.$on("task/updated", () => {
					this.refreshTasks();
				}), "workbench-drawer: task/updated badge refresh");
				ctx.on("connection/reset", () => {
					this.refresh();
				});
				this.refresh();
			}
			/** Refresh both aggregates from their Remotes; one merged write so a
			*  concurrent pair cannot overwrite each other's failure code. */
			async refresh() {
				const [attention, tasks] = await Promise.all([this.ctx.remote.workbenchHost.listSnapshot(), this.ctx.remote.tasks.listTasks()]);
				const next = { ...this.store.getSnapshot() };
				let error;
				if (attention.ok) next.openCount = attention.value.items.length;
				else error = attention.error.code;
				if (tasks.ok) next.activeCount = tasks.value.filter((task) => activeState(task.state)).length;
				else error = tasks.error.code;
				next.error = error;
				this.store.set(next);
			}
			/** Reread the open-attention count from the workbench-host snapshot. */
			async refreshAttention() {
				const snap = await this.ctx.remote.workbenchHost.listSnapshot();
				const state = this.store.getSnapshot();
				if (!snap.ok) {
					this.store.set({
						...state,
						error: snap.error.code
					});
					return;
				}
				this.store.set({
					...state,
					openCount: snap.value.items.length,
					error: void 0
				});
			}
			/** Reread the active-task count from the tasks Remote. */
			async refreshTasks() {
				const list = await this.ctx.remote.tasks.listTasks();
				const state = this.store.getSnapshot();
				if (!list.ok) {
					this.store.set({
						...state,
						error: list.error.code
					});
					return;
				}
				this.store.set({
					...state,
					activeCount: list.value.filter((task) => activeState(task.state)).length,
					error: void 0
				});
			}
		};
		//#endregion
		//#region \0dsh-css:E:\Codes\private\dsh-task-flow\src\client-ui\workbench-drawer\client\WorkbenchDrawer.module.css.mjs
		const css$9 = ".TBm3Va_trigger{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-floating-fill);color:var(--dsw-alias-label-primary);cursor:pointer;box-shadow:0 6px 24px var(--dsw-alias-bg-mask-drop);border-radius:999px;align-items:center;gap:8px;padding:10px 18px;font-size:13px;font-weight:500;transition:background .16s,transform .16s;display:inline-flex}.TBm3Va_trigger:hover{background:var(--dsw-alias-button-floating-hover);transform:translateY(-1px)}.TBm3Va_trigger:focus-visible,.TBm3Va_close:focus-visible,.TBm3Va_tabs button:focus-visible,.TBm3Va_resize:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.TBm3Va_triggerLabel{white-space:nowrap}.TBm3Va_dotIdle,.TBm3Va_dotActive{border-radius:50%;flex:none;width:8px;height:8px}.TBm3Va_dotIdle{background:var(--dsw-alias-border-l3)}.TBm3Va_dotActive{background:var(--dsw-alias-state-success-primary);animation:2s infinite TBm3Va_badgePulse}.TBm3Va_badge{background:var(--dsw-alias-state-error-primary);min-width:18px;color:var(--dsw-alias-label-primary-foreground);text-align:center;border-radius:999px;padding:0 6px;font-size:11px;font-weight:600;line-height:18px}@keyframes TBm3Va_badgePulse{0%{box-shadow:0 0 0 0 var(--dsw-alias-state-success-primary)}70%{box-shadow:0 0 0 6px #0000}to{box-shadow:0 0 #0000}}.TBm3Va_drawer{z-index:1000;background:var(--dsw-alias-bg-layer-1);border-left:1px solid var(--dsw-alias-border-l2);box-shadow:-16px 0 48px var(--dsw-alias-bg-mask-drop);flex-direction:column;max-width:94vw;display:flex;position:fixed;top:0;bottom:0;right:0}.TBm3Va_resize{cursor:col-resize;touch-action:none;width:8px;position:absolute;top:0;bottom:0;left:-4px}.TBm3Va_resize:hover{background:var(--dsw-alias-interactive-bg-hover)}.TBm3Va_head{border-bottom:1px solid var(--dsw-alias-border-l1);align-items:center;gap:10px;padding:14px 18px;display:flex}.TBm3Va_headTitle{color:var(--dsw-alias-label-primary);flex:1;font-size:15px;font-weight:600}.TBm3Va_recipesButton{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-surface-l1);color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:8px;padding:4px 12px;font-size:13px}.TBm3Va_recipesButton:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l3)}.TBm3Va_close{color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:7px;padding:4px 10px;font-size:13px}.TBm3Va_close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.TBm3Va_tabs{border-bottom:1px solid var(--dsw-alias-border-l1);gap:2px;padding:0 18px;display:flex}.TBm3Va_tabs button{cursor:pointer;background:0 0;border:0;border-radius:8px 8px 0 0;padding:10px 14px;font-size:13px;transition:color .16s,background .16s;position:relative}.TBm3Va_tabOff{color:var(--dsw-alias-label-secondary)}.TBm3Va_tabOff:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.TBm3Va_tabOn{color:var(--dsw-alias-label-primary);font-weight:600}.TBm3Va_tabOn:after{content:\"\";background:var(--dsw-alias-state-business-primary);border-radius:2px;height:2px;position:absolute;bottom:-1px;left:12px;right:12px}.TBm3Va_tabCount,.TBm3Va_tabCountHot{text-align:center;border-radius:999px;min-width:18px;margin-left:6px;padding:0 5px;font-size:11px;font-weight:500;line-height:17px;display:inline-block}.TBm3Va_tabCount{background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-secondary)}.TBm3Va_tabCountHot{background:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-label-primary-foreground);font-weight:600}.TBm3Va_drillBar{border-bottom:1px solid var(--dsw-alias-border-l1);align-items:center;gap:10px;padding:8px 18px;display:flex}.TBm3Va_back{color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:7px;padding:4px 10px;font-size:13px}.TBm3Va_back:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.TBm3Va_drillTitle{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600}.TBm3Va_body{--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);flex:1;padding:16px 18px;overflow:auto}";
		const tagId$9 = "@kongfun2018/dsh-task-flow/WorkbenchDrawer.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$9) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@kongfun2018/dsh-task-flow";
			tag.dataset.pluginCss = tagId$9;
			tag.textContent = css$9;
			document.head.appendChild(tag);
		}
		var WorkbenchDrawer_module_css_default = {
			"tabCount": "TBm3Va_tabCount",
			"headTitle": "TBm3Va_headTitle",
			"triggerLabel": "TBm3Va_triggerLabel",
			"tabCountHot": "TBm3Va_tabCountHot",
			"tabOn": "TBm3Va_tabOn",
			"tabs": "TBm3Va_tabs",
			"dotActive": "TBm3Va_dotActive",
			"tabOff": "TBm3Va_tabOff",
			"close": "TBm3Va_close",
			"drawer": "TBm3Va_drawer",
			"recipesButton": "TBm3Va_recipesButton",
			"badge": "TBm3Va_badge",
			"drillTitle": "TBm3Va_drillTitle",
			"dotIdle": "TBm3Va_dotIdle",
			"trigger": "TBm3Va_trigger",
			"drillBar": "TBm3Va_drillBar",
			"badgePulse": "TBm3Va_badgePulse",
			"back": "TBm3Va_back",
			"body": "TBm3Va_body",
			"head": "TBm3Va_head",
			"resize": "TBm3Va_resize"
		};
		//#endregion
		//#region lib/types/client-ui/workbench-drawer/client/WorkbenchDrawer.js
		/** Default drawer width as a share of the viewport width (~2/3). */
		const DRAWER_WIDTH_RATIO = 2 / 3;
		/** Lower and upper width bounds for the user-resized drawer (px). */
		const WIDTH_MIN = 360;
		const WIDTH_MAX = 1320;
		/** Viewport share the width may never exceed, matching the CSS clamp. */
		const VIEWPORT_SHARE = .94;
		/**
		* Default drawer width for the current viewport: ~2/3 of the window width,
		* capped to the draggable maximum. A wide shell still stays under the 94vw
		* clamp. All tabs share one default; a user drag overrides it within
		* WIDTH_MIN..WIDTH_MAX.
		* @param viewport - current window.innerWidth.
		* @returns the default drawer width in px, capped to both bounds.
		*/
		function defaultWidthFor(viewport) {
			return Math.round(Math.min(viewport * DRAWER_WIDTH_RATIO, WIDTH_MAX));
		}
		/**
		* Render the right-side workbench drawer: four tabs dispatching the declared
		* content seats. The component stays mounted while the entry lives; the open
		* flag, active tab, and detail selection ride the shared store, so the sidebar
		* trigger and internal navigation keep the same drawer state.
		* @param props - composed slot props (runtime, seats, store, locale, inject).
		* @returns the open drawer panel, or nothing while closed.
		*/
		function WorkbenchDrawer(props) {
			const { t, renderSlot, useStore, actions } = props;
			const [userWidth, setUserWidth] = (0, react.useState)(void 0);
			const [viewport, setViewport] = (0, react.useState)(() => typeof window === "undefined" ? 0 : window.innerWidth);
			const drawerRef = (0, react.useRef)(null);
			const resizeRef = (0, react.useRef)(null);
			const dragStart = (0, react.useRef)(null);
			const open = useStore((s) => s.open);
			const tab = useStore((s) => s.tab);
			const detailTaskId = useStore((s) => s.detailTaskId);
			const createRecipeId = useStore((s) => s.createRecipeId);
			const recipesOpen = useStore((s) => s.recipesOpen);
			const selectTab = (next) => {
				actions.selectTab(next);
				setUserWidth(void 0);
			};
			const defaultWidth = defaultWidthFor(viewport);
			const width = userWidth ?? defaultWidth;
			const currentWidth = drawerRef.current?.offsetWidth ?? defaultWidth;
			(0, react.useEffect)(() => {
				const onResize = () => {
					setViewport(window.innerWidth);
				};
				window.addEventListener("resize", onResize);
				return () => {
					window.removeEventListener("resize", onResize);
				};
			}, []);
			const onResizeDown = (event) => {
				event.preventDefault();
				dragStart.current = {
					x: event.clientX,
					w: currentWidth
				};
				const el = resizeRef.current;
				if (el !== null && typeof el.setPointerCapture === "function") el.setPointerCapture(event.pointerId);
			};
			const onResizeMove = (event) => {
				const drag = dragStart.current;
				if (drag === null) return;
				const maxWidth = Math.min(WIDTH_MAX, window.innerWidth * VIEWPORT_SHARE);
				setUserWidth(Math.max(WIDTH_MIN, Math.min(maxWidth, drag.w + (drag.x - event.clientX))));
			};
			const onResizeUp = (event) => {
				dragStart.current = null;
				const el = resizeRef.current;
				if (el !== null && typeof el.hasPointerCapture === "function" && el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
			};
			/** Owner share for the tasks/create seats, derived from store actions. */
			const owner = {
				openDetail: (taskId) => {
					actions.openDetail(taskId);
				},
				openInbox: () => {
					actions.selectTab("inbox");
				},
				openCreate: (recipeId) => {
					actions.openCreate(recipeId);
				},
				initialRecipeId: createRecipeId
			};
			if (!open) return null;
			return (0, react_jsx_runtime.jsxs)("div", {
				ref: drawerRef,
				className: WorkbenchDrawer_module_css_default.drawer,
				style: { width: `${width}px` },
				role: "dialog",
				"aria-label": t("trigger"),
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						ref: resizeRef,
						className: WorkbenchDrawer_module_css_default.resize,
						role: "separator",
						"aria-orientation": "vertical",
						"aria-label": t("resize"),
						onPointerDown: onResizeDown,
						onPointerMove: onResizeMove,
						onPointerUp: onResizeUp
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: WorkbenchDrawer_module_css_default.head,
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: WorkbenchDrawer_module_css_default.headTitle,
								children: t("trigger")
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: WorkbenchDrawer_module_css_default.recipesButton,
								onClick: () => {
									actions.openRecipes();
								},
								title: t("tab.recipeLibrary"),
								children: t("tab.recipeLibrary")
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: WorkbenchDrawer_module_css_default.close,
								onClick: () => {
									actions.closeDrawer();
								},
								children: t("close")
							})
						]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: WorkbenchDrawer_module_css_default.tabs,
						role: "tablist",
						children: [
							"tasks",
							"taskList",
							"inbox",
							"clarifications"
						].map((key) => (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							role: "tab",
							"aria-selected": tab === key,
							className: tab === key ? WorkbenchDrawer_module_css_default.tabOn : WorkbenchDrawer_module_css_default.tabOff,
							onClick: () => {
								selectTab(key);
							},
							children: t(`tab.${key}`)
						}, key))
					}),
					tab === "detail" || tab === "create" ? (0, react_jsx_runtime.jsxs)("div", {
						className: WorkbenchDrawer_module_css_default.drillBar,
						children: [(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: WorkbenchDrawer_module_css_default.back,
							onClick: () => {
								actions.back();
							},
							children: t("back")
						}), (0, react_jsx_runtime.jsx)("span", {
							className: WorkbenchDrawer_module_css_default.drillTitle,
							children: t(`tab.${tab}`)
						})]
					}) : null,
					(0, react_jsx_runtime.jsxs)("div", {
						className: WorkbenchDrawer_module_css_default.body,
						children: [
							tab === "tasks" && renderSlot("workbench.drawer.tasks", owner),
							tab === "taskList" && renderSlot("workbench.drawer.taskList", owner),
							tab === "inbox" && renderSlot("workbench.drawer.inbox", {}),
							tab === "clarifications" && renderSlot("workbench.drawer.clarifications", {}),
							tab === "detail" && renderSlot("workbench.drawer.detail", {
								taskId: detailTaskId,
								openInbox: owner.openInbox
							}),
							tab === "create" && renderSlot("workbench.drawer.create", owner)
						]
					}),
					renderSlot("workbench.drawer.recipeLibrary", {
						open: recipesOpen,
						onClose: () => {
							actions.closeRecipes();
						}
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:E:\Codes\private\dsh-task-flow\src\client-ui\workbench-drawer\client\WorkbenchTrigger.module.css.mjs
		const css$8 = ".IKEv-q_trigger{box-sizing:border-box;border:1px solid var(--dsw-alias-state-business-primary);background:var(--dsw-alias-state-business-tertiary);width:100%;height:36px;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:10px;align-items:center;gap:8px;padding:0 12px;font-size:13px;font-weight:600;line-height:20px;display:inline-flex;overflow:hidden}.IKEv-q_trigger:hover{background:var(--dsw-alias-state-business-tertiary);filter:brightness(.97)}.IKEv-q_trigger:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.IKEv-q_icon{color:var(--dsw-alias-state-business-primary);flex:none}.IKEv-q_label{white-space:nowrap;text-overflow:ellipsis;max-width:180px;overflow:hidden}.IKEv-q_rail{box-sizing:border-box;width:36px;height:36px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:50%;justify-content:center;align-items:center;padding:0;display:inline-flex;position:relative}.IKEv-q_rail:hover{background:var(--dsw-alias-interactive-bg-hover)}.IKEv-q_rail:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.IKEv-q_railDot{background:var(--dsw-alias-state-success-primary);border-radius:50%;width:7px;height:7px;position:absolute;top:6px;right:6px}";
		const tagId$8 = "@kongfun2018/dsh-task-flow/WorkbenchTrigger.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$8) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@kongfun2018/dsh-task-flow";
			tag.dataset.pluginCss = tagId$8;
			tag.textContent = css$8;
			document.head.appendChild(tag);
		}
		var WorkbenchTrigger_module_css_default = {
			"icon": "IKEv-q_icon",
			"rail": "IKEv-q_rail",
			"railDot": "IKEv-q_railDot",
			"trigger": "IKEv-q_trigger",
			"label": "IKEv-q_label"
		};
		//#endregion
		//#region lib/types/client-ui/workbench-drawer/client/WorkbenchTrigger.js
		/**
		* Render the sidebar "任务流程" primary entry: a prominent, accent-styled
		* button (branch icon + label) that toggles the right-side drawer. Rendered
		* wide as a full row; collapsed into the 56px rail as an icon-only entry.
		* @param props - composed slot props for the 'sidebar.footer.action' hole.
		* @returns the trigger button.
		*/
		function WorkbenchTrigger(props) {
			const { t, wide, useStore, actions, useBadge } = props;
			const badge = useBadge((state) => state);
			const open = useStore((s) => s.open);
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
				label: t("trigger"),
				delayMs: 500,
				disabled: wide,
				children: (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: wide ? WorkbenchTrigger_module_css_default.trigger : WorkbenchTrigger_module_css_default.rail,
					"aria-haspopup": "dialog",
					"aria-expanded": open,
					"aria-label": t("trigger"),
					onClick: () => {
						actions.toggleDrawer();
					},
					children: [
						(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconBranchOutline16, {
							size: wide ? 16 : 18,
							className: WorkbenchTrigger_module_css_default.icon
						}),
						wide && (0, react_jsx_runtime.jsx)("span", {
							className: WorkbenchTrigger_module_css_default.label,
							children: t("trigger")
						}),
						!wide && badge.activeCount > 0 && (0, react_jsx_runtime.jsx)("span", {
							className: WorkbenchTrigger_module_css_default.railDot,
							"aria-hidden": "true"
						})
					]
				})
			});
		}
		//#endregion
		//#region lib/types/client-ui/workbench-drawer/client/locales.js
		/**
		* Drawer copy: the trigger, the tab labels, the close/resize affordances,
		* and the detail tab's empty state. Registered under one namespace by the
		* client plugin body; the framework synthesizes the typed `t` seat.
		*/
		/** Namespace key of the drawer's dictionary. */
		const NS$8 = "workbenchDrawer";
		/** Chinese dictionary (product copy language). */
		const zh$8 = {
			"trigger": "任务流程",
			"tab.tasks": "任务看板",
			"tab.taskList": "任务列表",
			"tab.recipeLibrary": "Recipe 库",
			"tab.inbox": "审批中心",
			"tab.clarifications": "澄清队列",
			"tab.create": "新建",
			"tab.detail": "详情",
			"back": "返回",
			"close": "关闭",
			"resize": "拖动调整宽度",
			"badge.open": "{count} 项待处理",
			"state.active": "有任务运行中",
			"state.idle": "无运行中任务",
			"detail.empty": "从任务列表选择一个任务查看详情"
		};
		/** English dictionary. */
		const en$8 = {
			"trigger": "Task Flow",
			"tab.tasks": "Board",
			"tab.taskList": "Task list",
			"tab.recipeLibrary": "Recipe library",
			"tab.inbox": "Approvals",
			"tab.clarifications": "Clarifications",
			"tab.create": "Create",
			"tab.detail": "Detail",
			"back": "Back",
			"close": "Close",
			"resize": "Drag to resize",
			"badge.open": "{count} items pending",
			"state.active": "Tasks running",
			"state.idle": "No running tasks",
			"detail.empty": "Select a task from the list to see its detail"
		};
		//#endregion
		//#region lib/types/client-ui/workbench-drawer/client/store.js
		/**
		* Workbench drawer UI store: the shared interaction state that rides across
		* the two registrations — the sidebar.footer.action trigger button and the
		* shell.overlay drawer panel. The trigger and the panel are separate slot
		* entries in different containers, so open/tab/detail selection live here
		* (a declared store, per the client layering rules) instead of a single
		* component's local state.
		*/
		/**
		* Create the shared drawer interaction store handle.
		* @returns the store handle (spec + type + identity + factory in one).
		*/
		function createWorkbenchStore() {
			return (0, _deepseek_ai_dsh_client_runtime_client.defineStore)({
				init: () => ({
					open: false,
					tab: "tasks",
					detailTaskId: void 0,
					createRecipeId: void 0,
					recipesOpen: false,
					returnTab: "tasks"
				}),
				actions: {
					openDrawer: (d) => {
						d.open = true;
					},
					closeDrawer: (d) => {
						d.open = false;
					},
					toggleDrawer: (d) => {
						d.open = !d.open;
					},
					selectTab: (d, tab) => {
						d.tab = tab;
						d.returnTab = tab;
					},
					openDetail: (d, taskId) => {
						d.returnTab = d.tab;
						d.tab = "detail";
						d.detailTaskId = taskId;
					},
					setDetailTaskId: (d, taskId) => {
						d.detailTaskId = taskId;
					},
					openCreate: (d, recipeId) => {
						d.returnTab = d.tab;
						d.tab = "create";
						d.createRecipeId = recipeId;
					},
					setCreateRecipeId: (d, recipeId) => {
						d.createRecipeId = recipeId;
					},
					openRecipes: (d) => {
						d.open = true;
						d.recipesOpen = true;
					},
					closeRecipes: (d) => {
						d.recipesOpen = false;
					},
					back: (d) => {
						d.tab = d.returnTab;
					}
				}
			});
		}
		//#endregion
		//#region lib/types/client-ui/workbench-drawer/client/index.js
		/**
		* Client plugin body: the dictionaries, the shared store handle, the badge
		* controller, and the two register entries — the sidebar footer action and the
		* overlay drawer — sharing one store handle and one badge source.
		* @param ctx - client root context.
		*/
		function apply$9(ctx) {
			ctx.effect(() => ctx.locale.register(NS$8, {
				zh: zh$8,
				en: en$8
			}), "ui-workbench-drawer: dictionaries");
			const badge = new BadgeController(ctx);
			const store = createWorkbenchStore();
			const badgeSource = () => ({ hooks: { badge: badge.store } });
			ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
				name: "sidebar.footer.action",
				id: "workbench-drawer-trigger",
				order: 0,
				locale: NS$8,
				store,
				inject: badgeSource
			}, WorkbenchTrigger));
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "workbench-drawer",
				order: 100,
				locale: NS$8,
				store,
				children: {
					"workbench.drawer.tasks": {
						kind: "single",
						scope: "root"
					},
					"workbench.drawer.taskList": {
						kind: "single",
						scope: "root"
					},
					"workbench.drawer.recipeLibrary": {
						kind: "single",
						scope: "root"
					},
					"workbench.drawer.inbox": {
						kind: "single",
						scope: "root"
					},
					"workbench.drawer.clarifications": {
						kind: "single",
						scope: "root"
					},
					"workbench.drawer.detail": {
						kind: "single",
						scope: "root"
					},
					"workbench.drawer.create": {
						kind: "single",
						scope: "root"
					}
				},
				inject: badgeSource
			}, WorkbenchDrawer));
		}
		//#endregion
		//#region lib/types/client-ui/attention-inbox/client/inbox.js
		/** Recorded actor for every command this surface issues. */
		const ACTOR = "workbench-inbox";
		/** Error-code prefix the component maps to the conflict copy. */
		const CONFLICT_PREFIX = "conflict:";
		/**
		* The inbox's state owner. Created once per plugin fiber in `apply`; the
		* snapshot store it exposes is the inject `hooks` source, so components
		* subscribe through the renderer-bound hook and never see this object.
		*/
		var AttentionInboxController = class {
			/**
			* @param ctx - owning client root context; subscriptions and refreshes ride
			* this fiber's lifetime.
			*/
			constructor(ctx) {
				this.ctx = ctx;
				this.store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)({
					status: "loading",
					items: [],
					snapshotVersion: 0,
					cursor: 0,
					conflictCount: 0,
					updatedAt: 0
				});
				ctx.effect(() => ctx.remote.$on("workbench/attention-updated", (update) => {
					this.fold(update);
				}), "attention-inbox: attention-updated fold");
				ctx.on("connection/reset", () => {
					this.reconnect();
				});
				this.refresh();
			}
			/**
			* Fold one forwarded attention update: newer revisions replace each changed
			* row's status, unknown item ids trigger a snapshot resync, and stale or
			* repeated deliveries drop.
			* @param update - snapshot version plus each changed item's new state.
			*/
			fold(update) {
				const state = this.store.getSnapshot();
				if (state.status !== "ready") return;
				if (update.snapshotVersion <= state.snapshotVersion) return;
				const byId = new Map(update.changed.map((row) => [String(row.itemId), row]));
				const known = new Set(state.items.map((item) => String(item.itemId)));
				const hasUnknown = update.changed.some((row) => !known.has(String(row.itemId)));
				const items = state.items.map((item) => {
					const row = byId.get(String(item.itemId));
					if (row === void 0 || row.entityRevision <= item.entityRevision) return item;
					return {
						...item,
						status: row.status,
						entityRevision: row.entityRevision
					};
				});
				this.store.set({
					...state,
					items,
					snapshotVersion: update.snapshotVersion,
					updatedAt: Date.now()
				});
				if (hasUnknown) this.refresh();
			}
			/**
			* Reload the full item list from the workbench-host snapshot, and refresh
			* the delta-stream epoch and cursor from the workbench-host stream.
			* @returns when the load settles; failures land in the state's error.
			*/
			async refresh() {
				const snap = await this.ctx.remote.workbenchHost.listSnapshot();
				if (!snap.ok) {
					this.store.set({
						...this.store.getSnapshot(),
						status: "failed",
						error: snap.error.code
					});
					return;
				}
				const page = await this.ctx.remote.workbenchHostStream.listIncremental(0);
				const { error, conflictCount, cursor, streamId } = this.store.getSnapshot();
				this.store.set({
					status: "ready",
					items: snap.value.items,
					snapshotVersion: snap.value.snapshotVersion,
					cursor: page.ok ? page.value.cursor : cursor,
					streamId: page.ok ? page.value.streamId : streamId,
					error,
					conflictCount,
					updatedAt: Date.now()
				});
			}
			/**
			* Replay the delta stream from the recorded cursor after a reconnect. An
			* epoch change or any pending attention events force a snapshot resync;
			* otherwise only the cursor advances.
			* @returns when the replay settles.
			*/
			async reconnect() {
				const state = this.store.getSnapshot();
				if (state.status !== "ready" || state.streamId === void 0) {
					await this.refresh();
					return;
				}
				const page = await this.ctx.remote.workbenchHostStream.listIncremental(state.cursor);
				if (!page.ok || page.value.streamId !== state.streamId || page.value.events.length > 0) {
					await this.refresh();
					return;
				}
				this.store.set({
					...this.store.getSnapshot(),
					cursor: page.value.cursor,
					streamId: page.value.streamId
				});
			}
			/**
			* Confirm a batch of B-class items in one pass. Every target reports its own
			* outcome; items that did not resolve (conflict, stale, withdrawn, or
			* already-resolved) are never silently removed — their count lands in
			* `conflictCount` and the list resyncs from the authoritative snapshot.
			* @param targets - the compare-and-set targets for the open B items selected.
			* @returns when the command settles and the list has resynced.
			*/
			async confirm(targets) {
				if (targets.length === 0) return;
				const result = await this.ctx.remote.workbenchHost.confirmBatch({
					actor: ACTOR,
					items: targets
				});
				if (!result.ok) {
					this.store.set({
						...this.store.getSnapshot(),
						error: result.error.code,
						conflictCount: 0
					});
					await this.refresh();
					return;
				}
				const settled = result.value;
				const conflicts = settled.results.filter((row) => row.outcome !== "resolved").length;
				this.store.set({
					...this.store.getSnapshot(),
					snapshotVersion: settled.snapshotVersion,
					error: conflicts > 0 ? CONFLICT_PREFIX + String(conflicts) : void 0,
					conflictCount: conflicts
				});
				await this.refresh();
			}
			/**
			* Resolve one C-class item with the recorded decision text. A non-resolved
			* outcome (conflict, stale, withdrawn, already-resolved, or an invalid
			* option) is never silently confirmed — it lands in `conflictCount` and the
			* list resyncs from the authoritative snapshot.
			* @param item - the open C item being decided, carrying its CAS revision.
			* @param decision - the non-empty decision text to record.
			* @returns when the command settles and the list has resynced.
			*/
			async decide(item, decision) {
				const result = await this.ctx.remote.workbenchHost.resolveDecision({
					itemId: item.itemId,
					expectedEntityRevision: item.entityRevision,
					decision,
					actor: ACTOR
				});
				if (!result.ok) {
					this.store.set({
						...this.store.getSnapshot(),
						error: result.error.code,
						conflictCount: 0
					});
					await this.refresh();
					return;
				}
				const settled = result.value;
				const conflict = settled.outcome !== "resolved";
				this.store.set({
					...this.store.getSnapshot(),
					snapshotVersion: settled.snapshotVersion,
					error: conflict ? "conflict:1" : void 0,
					conflictCount: conflict ? 1 : 0
				});
				await this.refresh();
			}
		};
		/** Whether one item's kind is batch-confirmable (B never batches with C).
		* @param item - the attention item to classify.
		* @returns true when the item's kind is `b-confirm`.
		*/
		function batchable(item) {
			return item.kind === "b-confirm";
		}
		/** Whether one item's kind takes a single decision (C never batches).
		* @param item - the attention item to classify.
		* @returns true when the item's kind is `c-decision`.
		*/
		function decidable(item) {
			return item.kind === "c-decision";
		}
		//#endregion
		//#region \0dsh-css:E:\Codes\private\dsh-task-flow\src\client-ui\attention-inbox\client\AttentionInboxAction.module.css.mjs
		const css$7 = ".aLUtLq_panel{flex-direction:column;gap:12px;display:flex}.aLUtLq_section{flex-direction:column;gap:6px;display:flex}.aLUtLq_sectionTitle{color:var(--dsw-alias-label-tertiary);text-transform:uppercase;letter-spacing:.04em;margin:0 0 4px;font-size:12px;font-weight:600}.aLUtLq_list{flex-direction:column;gap:4px;margin:0;padding:0;list-style:none;display:flex}.aLUtLq_row{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1);width:100%;min-height:40px;color:var(--dsw-alias-label-primary);border-radius:10px;align-items:center;gap:8px;padding:6px 10px;font-size:13px;line-height:18px;display:flex}.aLUtLq_row:hover{background:var(--dsw-alias-interactive-bg-hover)}.aLUtLq_rowDot{flex:none}.aLUtLq_rowMain{flex-direction:column;flex:1;gap:1px;min-width:0;display:flex}.aLUtLq_itemId{text-overflow:ellipsis;white-space:nowrap;font-size:13px;overflow:hidden}.aLUtLq_meta{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}.aLUtLq_decision{flex:none;align-items:center;gap:4px;display:flex}.aLUtLq_batchbar{z-index:5;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);box-shadow:0 4px 16px var(--dsw-alias-bg-mask-drop);border-radius:10px;align-items:center;gap:8px;margin-top:6px;padding:8px 10px;font-size:13px;display:flex;position:sticky;bottom:0}.aLUtLq_batchCount{color:var(--dsw-alias-label-secondary)}.aLUtLq_batchSpacer{flex:1}.aLUtLq_statusLine,.aLUtLq_errorLine{margin:0;padding:4px 2px;font-size:12px;line-height:18px}.aLUtLq_statusLine{color:var(--dsw-alias-label-tertiary)}.aLUtLq_errorLine{color:var(--dsw-alias-state-error-primary)}.aLUtLq_footer{justify-content:flex-end;gap:4px;padding-top:2px;display:flex}";
		const tagId$7 = "@kongfun2018/dsh-task-flow/AttentionInboxAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$7) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@kongfun2018/dsh-task-flow";
			tag.dataset.pluginCss = tagId$7;
			tag.textContent = css$7;
			document.head.appendChild(tag);
		}
		var AttentionInboxAction_module_css_default = {
			"batchbar": "aLUtLq_batchbar",
			"footer": "aLUtLq_footer",
			"row": "aLUtLq_row",
			"list": "aLUtLq_list",
			"itemId": "aLUtLq_itemId",
			"meta": "aLUtLq_meta",
			"decision": "aLUtLq_decision",
			"sectionTitle": "aLUtLq_sectionTitle",
			"panel": "aLUtLq_panel",
			"section": "aLUtLq_section",
			"batchSpacer": "aLUtLq_batchSpacer",
			"rowDot": "aLUtLq_rowDot",
			"statusLine": "aLUtLq_statusLine",
			"batchCount": "aLUtLq_batchCount",
			"rowMain": "aLUtLq_rowMain",
			"errorLine": "aLUtLq_errorLine"
		};
		//#endregion
		//#region lib/types/client-ui/attention-inbox/client/AttentionInboxAction.js
		/** Closed-union exhaustiveness fence for the wire kind set. */
		/* v8 ignore next 3 -- closed-union backstop; only reached if a kind is forged */
		function assertNever$3(value) {
			throw new Error(`unhandled attention kind: ${JSON.stringify(value)}`);
		}
		/** Status marker semantics for one item row. */
		function dotState$3(status) {
			switch (status) {
				case "open": return "warning";
				case "resolved": return "done";
				case "invalidated": return "error";
				case "stale": return "warning";
				/* v8 ignore next -- closed wire status union */
				default: return assertNever$3(status);
			}
		}
		/** Human kind word for one item row. */
		function kindLabel$1(kind, t) {
			switch (kind) {
				case "b-confirm": return t("kind.b-confirm");
				case "c-decision": return t("kind.c-decision");
				case "clarification": return t("kind.clarification");
				case "recovery": return t("kind.recovery");
				/* v8 ignore next -- closed wire kind union */
				default: return assertNever$3(kind);
			}
		}
		/** Human status word for one item row. */
		function statusLabel$1(status, t) {
			switch (status) {
				case "open": return t("status.open");
				case "resolved": return t("status.resolved");
				case "invalidated": return t("status.invalidated");
				case "stale": return t("status.stale");
				/* v8 ignore next -- closed wire status union */
				default: return assertNever$3(status);
			}
		}
		/** One batch-confirmable (B) row: checkbox plus identity and state. */
		function BatchRow({ item, checked, onToggle, t }) {
			return (0, react_jsx_runtime.jsxs)("li", {
				className: AttentionInboxAction_module_css_default.row,
				children: [
					(0, react_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked,
						"aria-label": String(item.itemId),
						onChange: () => {
							onToggle(String(item.itemId));
						}
					}),
					(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, {
						state: dotState$3(item.status),
						className: AttentionInboxAction_module_css_default.rowDot
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: AttentionInboxAction_module_css_default.rowMain,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: AttentionInboxAction_module_css_default.itemId,
							children: item.title
						}), (0, react_jsx_runtime.jsxs)("span", {
							className: AttentionInboxAction_module_css_default.meta,
							children: [
								kindLabel$1(item.kind, t),
								" · ",
								statusLabel$1(item.status, t),
								" · ",
								t("revision", { revision: item.entityRevision })
							]
						})]
					})
				]
			});
		}
		/** One single-decision (C) row: decision input plus submit. */
		function DecisionRow({ item, draft, onDraft, onSubmit, t }) {
			return (0, react_jsx_runtime.jsxs)("li", {
				className: AttentionInboxAction_module_css_default.row,
				children: [
					(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, {
						state: dotState$3(item.status),
						className: AttentionInboxAction_module_css_default.rowDot
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: AttentionInboxAction_module_css_default.rowMain,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: AttentionInboxAction_module_css_default.itemId,
							children: item.title
						}), (0, react_jsx_runtime.jsxs)("span", {
							className: AttentionInboxAction_module_css_default.meta,
							children: [
								kindLabel$1(item.kind, t),
								" · ",
								statusLabel$1(item.status, t),
								" · ",
								t("revision", { revision: item.entityRevision })
							]
						})]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: AttentionInboxAction_module_css_default.decision,
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
							value: draft,
							placeholder: t("decision.placeholder"),
							onChange: (event) => {
								onDraft(String(item.itemId), event.target.value);
							}
						}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							size: "sm",
							variant: "primary",
							disabled: draft.trim() === "",
							onClick: () => {
								onSubmit(String(item.itemId), draft.trim());
							},
							children: t("decide")
						})]
					})
				]
			});
		}
		/** One read-only (clarification/recovery) row: identity and state only. */
		function ReadonlyRow({ item, t }) {
			return (0, react_jsx_runtime.jsxs)("li", {
				className: AttentionInboxAction_module_css_default.row,
				children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, {
					state: dotState$3(item.status),
					className: AttentionInboxAction_module_css_default.rowDot
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: AttentionInboxAction_module_css_default.rowMain,
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: AttentionInboxAction_module_css_default.itemId,
						children: item.title
					}), (0, react_jsx_runtime.jsxs)("span", {
						className: AttentionInboxAction_module_css_default.meta,
						children: [
							kindLabel$1(item.kind, t),
							" · ",
							statusLabel$1(item.status, t),
							" · ",
							t("revision", { revision: item.entityRevision })
						]
					})]
				})]
			});
		}
		/**
		* Render the drawer's attention-inbox tab body: the B batch-confirm list,
		* the C single-decision rows, and the read-only items, over the controller
		* store through the inject face.
		* @param props - composed slot props (locale, inject face).
		* @returns the inbox panel filling the drawer's tab body.
		*/
		function AttentionInboxAction(props) {
			const { t, useInbox, refresh, confirm, decide } = props;
			const [selected, setSelected] = (0, react.useState)(/* @__PURE__ */ new Set());
			const [drafts, setDrafts] = (0, react.useState)({});
			const inbox = useInbox((state) => state);
			const batchItems = inbox.items.filter(batchable);
			const decisionItems = inbox.items.filter(decidable);
			const readonlyItems = inbox.items.filter((item) => !batchable(item) && !decidable(item));
			const toggle = (itemId) => {
				const next = new Set(selected);
				if (next.has(itemId)) next.delete(itemId);
				else next.add(itemId);
				setSelected(next);
			};
			const submitBatch = () => {
				const targets = batchItems.filter((item) => selected.has(String(item.itemId))).map((item) => ({
					itemId: item.itemId,
					expectedEntityRevision: item.entityRevision
				}));
				confirm(targets);
				setSelected(/* @__PURE__ */ new Set());
			};
			const submitDecision = (itemId, decision) => {
				decide(itemId, decision);
				setDrafts((prev) => ({
					...prev,
					[itemId]: ""
				}));
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: AttentionInboxAction_module_css_default.panel,
				children: [
					inbox.status === "loading" && (0, react_jsx_runtime.jsx)("p", {
						className: AttentionInboxAction_module_css_default.statusLine,
						children: t("loading")
					}),
					inbox.error !== void 0 && inbox.error.startsWith("conflict:") && inbox.conflictCount > 0 && (0, react_jsx_runtime.jsx)("p", {
						className: AttentionInboxAction_module_css_default.errorLine,
						role: "alert",
						children: t("error.conflict", { count: inbox.conflictCount })
					}),
					inbox.error !== void 0 && !inbox.error.startsWith("conflict:") && (0, react_jsx_runtime.jsx)("p", {
						className: AttentionInboxAction_module_css_default.errorLine,
						role: "alert",
						children: t(inbox.status === "failed" ? "error.load" : "error.command", { code: inbox.error })
					}),
					inbox.status !== "loading" && inbox.items.length === 0 && (0, react_jsx_runtime.jsx)("p", {
						className: AttentionInboxAction_module_css_default.statusLine,
						children: t("empty")
					}),
					batchItems.length > 0 && (0, react_jsx_runtime.jsxs)("section", {
						className: AttentionInboxAction_module_css_default.section,
						children: [
							(0, react_jsx_runtime.jsx)("h3", {
								className: AttentionInboxAction_module_css_default.sectionTitle,
								children: t("section.batch")
							}),
							(0, react_jsx_runtime.jsx)("ul", {
								className: AttentionInboxAction_module_css_default.list,
								children: batchItems.map((item) => (0, react_jsx_runtime.jsx)(BatchRow, {
									item,
									checked: selected.has(String(item.itemId)),
									onToggle: toggle,
									t
								}, String(item.itemId)))
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: AttentionInboxAction_module_css_default.batchbar,
								children: [
									(0, react_jsx_runtime.jsx)("span", {
										className: AttentionInboxAction_module_css_default.batchCount,
										children: t("selected", { count: selected.size })
									}),
									(0, react_jsx_runtime.jsx)("span", { className: AttentionInboxAction_module_css_default.batchSpacer }),
									(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										size: "sm",
										variant: "ghost",
										disabled: selected.size === 0,
										onClick: () => {
											setSelected(/* @__PURE__ */ new Set());
										},
										children: t("clear")
									}),
									(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										size: "sm",
										variant: "primary",
										disabled: selected.size === 0,
										onClick: submitBatch,
										children: t("confirm")
									})
								]
							})
						]
					}),
					decisionItems.length > 0 && (0, react_jsx_runtime.jsxs)("section", {
						className: AttentionInboxAction_module_css_default.section,
						children: [(0, react_jsx_runtime.jsx)("h3", {
							className: AttentionInboxAction_module_css_default.sectionTitle,
							children: t("section.decision")
						}), (0, react_jsx_runtime.jsx)("ul", {
							className: AttentionInboxAction_module_css_default.list,
							children: decisionItems.map((item) => (0, react_jsx_runtime.jsx)(DecisionRow, {
								item,
								draft: drafts[String(item.itemId)] ?? "",
								onDraft: (id, value) => {
									setDrafts((prev) => ({
										...prev,
										[id]: value
									}));
								},
								onSubmit: submitDecision,
								t
							}, String(item.itemId)))
						})]
					}),
					readonlyItems.length > 0 && (0, react_jsx_runtime.jsxs)("section", {
						className: AttentionInboxAction_module_css_default.section,
						children: [(0, react_jsx_runtime.jsx)("h3", {
							className: AttentionInboxAction_module_css_default.sectionTitle,
							children: t("section.readonly")
						}), (0, react_jsx_runtime.jsx)("ul", {
							className: AttentionInboxAction_module_css_default.list,
							children: readonlyItems.map((item) => (0, react_jsx_runtime.jsx)(ReadonlyRow, {
								item,
								t
							}, String(item.itemId)))
						})]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: AttentionInboxAction_module_css_default.footer,
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							size: "sm",
							variant: "outline",
							onClick: refresh,
							children: t("refresh")
						})
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client-ui/attention-inbox/client/locales.js
		/** `attentionInbox` namespace dictionaries. */
		/** Dictionary namespace owned by this plugin. */
		const NS$7 = "attentionInbox";
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh$7 = {
			"refresh": "刷新",
			"loading": "加载中…",
			"empty": "暂无待决策项",
			"error.load": "加载失败：{code}",
			"error.command": "操作失败：{code}，已重新同步",
			"error.conflict": "有 {count} 项未确认（冲突或已被处理），已重新同步",
			"revision": "版本 {revision}",
			"status.open": "待决策",
			"status.resolved": "已决策",
			"status.invalidated": "已失效",
			"status.stale": "已过时",
			"kind.b-confirm": "确认",
			"kind.c-decision": "决策",
			"kind.clarification": "澄清",
			"kind.recovery": "恢复",
			"section.batch": "机器判定 + 人工确认",
			"section.decision": "需要拍板",
			"section.readonly": "跟踪项",
			"selected": "已选 {count} 项",
			"clear": "清除",
			"confirm": "确认选中",
			"confirmOne": "确认",
			"decide": "提交决策",
			"decision.placeholder": "输入决策选项"
		};
		/** English dictionary, key-identical to the Chinese source of truth. */
		const en$7 = {
			"refresh": "Refresh",
			"loading": "Loading…",
			"empty": "Nothing awaiting a decision",
			"error.load": "Load failed: {code}",
			"error.command": "Command failed: {code}; resynced",
			"error.conflict": "{count} item(s) not confirmed (conflict or already handled); resynced",
			"revision": "rev {revision}",
			"status.open": "open",
			"status.resolved": "resolved",
			"status.invalidated": "invalidated",
			"status.stale": "stale",
			"kind.b-confirm": "confirm",
			"kind.c-decision": "decision",
			"kind.clarification": "clarification",
			"kind.recovery": "recovery",
			"section.batch": "Machine verdict + human confirm",
			"section.decision": "Needs a call",
			"section.readonly": "Tracking",
			"selected": "{count} selected",
			"clear": "Clear",
			"confirm": "Confirm selected",
			"confirmOne": "Confirm",
			"decide": "Submit decision",
			"decision.placeholder": "Enter a decision option"
		};
		//#endregion
		//#region lib/types/client-ui/attention-inbox/client/index.js
		/**
		* Client plugin body: the dictionaries, the controller, and the drawer seat.
		* @param ctx - client root context.
		*/
		function apply$8(ctx) {
			ctx.effect(() => ctx.locale.register(NS$7, {
				zh: zh$7,
				en: en$7
			}), "ui-attention-inbox: dictionaries");
			const inbox = new AttentionInboxController(ctx);
			ctx.slots.inject("workbench.drawer.inbox", () => ctx.slots.register({
				name: "workbench.drawer.inbox",
				locale: NS$7,
				inject: () => ({
					hooks: { inbox: inbox.store },
					refresh: () => {
						inbox.refresh();
					},
					confirm: (targets) => {
						inbox.confirm(targets);
					},
					decide: (itemId, decision) => {
						const item = inbox.store.getSnapshot().items.find((row) => String(row.itemId) === itemId);
						if (item !== void 0) inbox.decide(item, decision);
					}
				})
			}, AttentionInboxAction));
		}
		//#endregion
		//#region lib/types/client-ui/clarifications/client/clarifications.js
		/** Whether one attention item is an open clarification (the queue's one row kind). */
		function openClarification(item) {
			return item.kind === "clarification" && item.status === "open";
		}
		/** Filter one attention list to its read-only open-clarification rows. */
		function clarificationOf(items) {
			return items.filter(openClarification);
		}
		/**
		* The clarification queue's state owner. Created once per plugin fiber in
		* `apply`; the snapshot store it exposes is the inject `hooks` source, so
		* components subscribe through the renderer-bound hook and never see this
		* object.
		*/
		var ClarificationsController = class {
			/**
			* @param ctx - owning client root context; subscriptions and refreshes ride
			* this fiber's lifetime.
			*/
			constructor(ctx) {
				this.ctx = ctx;
				this.store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)({
					status: "loading",
					items: [],
					snapshotVersion: 0,
					updatedAt: 0
				});
				ctx.effect(() => ctx.remote.$on("workbench/attention-updated", (update) => {
					this.fold(update);
				}), "ui-clarifications: attention-updated fold");
				ctx.on("connection/reset", () => {
					this.refresh();
				});
				this.refresh();
			}
			/**
			* Fold one forwarded attention update: a changed open-clarification row is
			* kept with its newer revision (evicting it when the new status is no
			* longer open), and an unknown item id triggers a snapshot resync because
			* the queue cannot rule out a newly opened clarification. Stale or repeated
			* deliveries drop.
			* @param update - snapshot version plus each changed item's new state.
			*/
			fold(update) {
				const state = this.store.getSnapshot();
				if (state.status !== "ready") return;
				if (update.snapshotVersion <= state.snapshotVersion) return;
				const known = new Set(state.items.map((item) => String(item.itemId)));
				const hasUnknown = update.changed.some((row) => !known.has(String(row.itemId)));
				const byId = new Map(update.changed.map((row) => [String(row.itemId), row]));
				const items = state.items.map((item) => {
					const row = byId.get(String(item.itemId));
					if (row === void 0 || row.entityRevision <= item.entityRevision) return item;
					return {
						...item,
						status: row.status,
						entityRevision: row.entityRevision
					};
				}).filter(openClarification);
				this.store.set({
					...state,
					items,
					snapshotVersion: update.snapshotVersion,
					updatedAt: Date.now()
				});
				if (hasUnknown) this.refresh();
			}
			/**
			* Reload the full attention snapshot from the workbench-host Remote and
			* keep only its open-clarification rows.
			* @returns when the load settles; failures land in the state's error.
			*/
			async refresh() {
				const snap = await this.ctx.remote.workbenchHost.listSnapshot();
				if (!snap.ok) {
					this.store.set({
						...this.store.getSnapshot(),
						status: "failed",
						error: snap.error.code
					});
					return;
				}
				this.store.set({
					status: "ready",
					items: clarificationOf(snap.value.items),
					snapshotVersion: snap.value.snapshotVersion,
					updatedAt: Date.now()
				});
			}
		};
		//#endregion
		//#region \0dsh-css:E:\Codes\private\dsh-task-flow\src\client-ui\clarifications\client\ClarificationsAction.module.css.mjs
		const css$6 = ".kzp9OG_panel{flex-direction:column;gap:12px;display:flex}.kzp9OG_section{flex-direction:column;gap:6px;display:flex}.kzp9OG_sectionTitle{color:var(--dsw-alias-label-tertiary);text-transform:uppercase;letter-spacing:.04em;margin:0 0 4px;font-size:12px;font-weight:600}.kzp9OG_list{flex-direction:column;gap:4px;margin:0;padding:0;list-style:none;display:flex}.kzp9OG_row{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1);width:100%;min-height:40px;color:var(--dsw-alias-label-primary);border-radius:10px;align-items:center;gap:8px;padding:6px 10px;font-size:13px;line-height:18px;display:flex}.kzp9OG_row:hover{background:var(--dsw-alias-interactive-bg-hover)}.kzp9OG_rowDot{flex:none}.kzp9OG_rowMain{flex-direction:column;flex:1;gap:1px;min-width:0;display:flex}.kzp9OG_source{text-overflow:ellipsis;white-space:nowrap;font-size:13px;overflow:hidden}.kzp9OG_meta{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}.kzp9OG_statusLine,.kzp9OG_errorLine{margin:0;padding:4px 2px;font-size:12px;line-height:18px}.kzp9OG_statusLine{color:var(--dsw-alias-label-tertiary)}.kzp9OG_errorLine{color:var(--dsw-alias-state-error-primary)}.kzp9OG_footer{justify-content:flex-end;gap:4px;padding-top:2px;display:flex}";
		const tagId$6 = "@kongfun2018/dsh-task-flow/ClarificationsAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$6) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@kongfun2018/dsh-task-flow";
			tag.dataset.pluginCss = tagId$6;
			tag.textContent = css$6;
			document.head.appendChild(tag);
		}
		var ClarificationsAction_module_css_default = {
			"row": "kzp9OG_row",
			"list": "kzp9OG_list",
			"section": "kzp9OG_section",
			"panel": "kzp9OG_panel",
			"rowMain": "kzp9OG_rowMain",
			"rowDot": "kzp9OG_rowDot",
			"source": "kzp9OG_source",
			"sectionTitle": "kzp9OG_sectionTitle",
			"statusLine": "kzp9OG_statusLine",
			"meta": "kzp9OG_meta",
			"errorLine": "kzp9OG_errorLine",
			"footer": "kzp9OG_footer"
		};
		//#endregion
		//#region lib/types/client-ui/clarifications/client/ClarificationsAction.js
		/** Closed-union exhaustiveness fence for the wire kind set. */
		/* v8 ignore next 3 -- closed-union backstop; only reached if a kind is forged */
		function assertNever$2(value) {
			throw new Error(`unhandled attention kind: ${JSON.stringify(value)}`);
		}
		/** Status marker semantics for one item row. */
		function dotState$2(status) {
			switch (status) {
				case "open": return "warning";
				case "resolved": return "done";
				case "invalidated": return "error";
				case "stale": return "warning";
				/* v8 ignore next -- closed wire status union */
				default: return assertNever$2(status);
			}
		}
		/** Human status word for one item row. */
		function statusLabel(status, t) {
			switch (status) {
				case "open": return t("status.open");
				case "resolved": return t("status.resolved");
				case "invalidated": return t("status.invalidated");
				case "stale": return t("status.stale");
				/* v8 ignore next -- closed wire status union */
				default: return assertNever$2(status);
			}
		}
		/** One open-clarification row: read-only, identity and state only. */
		function ClarificationRow({ item, t }) {
			return (0, react_jsx_runtime.jsxs)("li", {
				className: ClarificationsAction_module_css_default.row,
				children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, {
					state: dotState$2(item.status),
					className: ClarificationsAction_module_css_default.rowDot
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: ClarificationsAction_module_css_default.rowMain,
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: ClarificationsAction_module_css_default.source,
						children: item.title
					}), (0, react_jsx_runtime.jsxs)("span", {
						className: ClarificationsAction_module_css_default.meta,
						children: [
							t("source.item", { id: String(item.itemId) }),
							" · ",
							statusLabel(item.status, t),
							" · ",
							t("revision", { revision: item.entityRevision })
						]
					})]
				})]
			});
		}
		/**
		* Render the drawer's clarification-queue tab body: the read-only list of
		* open clarification items over the controller store through the inject face.
		* @param props - composed slot props (locale, inject face).
		* @returns the clarification panel filling the drawer's tab body.
		*/
		function ClarificationsAction(props) {
			const { t, useClarifications, refresh } = props;
			const queue = useClarifications((state) => state);
			const items = queue.items.filter(openClarification);
			return (0, react_jsx_runtime.jsxs)("div", {
				className: ClarificationsAction_module_css_default.panel,
				children: [
					queue.status === "loading" && (0, react_jsx_runtime.jsx)("p", {
						className: ClarificationsAction_module_css_default.statusLine,
						children: t("loading")
					}),
					queue.error !== void 0 && (0, react_jsx_runtime.jsx)("p", {
						className: ClarificationsAction_module_css_default.errorLine,
						role: "alert",
						children: t("error.load", { code: queue.error })
					}),
					queue.status !== "loading" && items.length === 0 && (0, react_jsx_runtime.jsx)("p", {
						className: ClarificationsAction_module_css_default.statusLine,
						children: t("empty")
					}),
					items.length > 0 && (0, react_jsx_runtime.jsxs)("section", {
						className: ClarificationsAction_module_css_default.section,
						children: [(0, react_jsx_runtime.jsx)("h3", {
							className: ClarificationsAction_module_css_default.sectionTitle,
							children: t("section.clarifications")
						}), (0, react_jsx_runtime.jsx)("ul", {
							className: ClarificationsAction_module_css_default.list,
							children: items.map((item) => (0, react_jsx_runtime.jsx)(ClarificationRow, {
								item,
								t
							}, String(item.itemId)))
						})]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: ClarificationsAction_module_css_default.footer,
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							size: "sm",
							variant: "outline",
							onClick: refresh,
							children: t("refresh")
						})
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client-ui/clarifications/client/locales.js
		/** `clarifications` namespace dictionaries. */
		/** Dictionary namespace owned by this plugin. */
		const NS$6 = "clarifications";
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh$6 = {
			"refresh": "刷新",
			"loading": "加载中…",
			"empty": "暂无待澄清项",
			"error.load": "加载失败：{code}",
			"revision": "版本 {revision}",
			"source.item": "条目 {id}",
			"status.open": "待澄清",
			"status.resolved": "已处理",
			"status.invalidated": "已失效",
			"status.stale": "已过时",
			"kind.b-confirm": "确认",
			"kind.c-decision": "决策",
			"kind.clarification": "澄清",
			"kind.recovery": "恢复",
			"section.clarifications": "待澄清"
		};
		/** English dictionary, key-identical to the Chinese source of truth. */
		const en$6 = {
			"refresh": "Refresh",
			"loading": "Loading…",
			"empty": "No open clarifications",
			"error.load": "Load failed: {code}",
			"revision": "rev {revision}",
			"source.item": "item {id}",
			"status.open": "open",
			"status.resolved": "resolved",
			"status.invalidated": "invalidated",
			"status.stale": "stale",
			"kind.b-confirm": "confirm",
			"kind.c-decision": "decision",
			"kind.clarification": "clarification",
			"kind.recovery": "recovery",
			"section.clarifications": "Clarifications"
		};
		//#endregion
		//#region lib/types/client-ui/clarifications/client/index.js
		/**
		* Client plugin body: the dictionaries, the controller, and the drawer seat.
		* @param ctx - client root context.
		*/
		function apply$7(ctx) {
			ctx.effect(() => ctx.locale.register(NS$6, {
				zh: zh$6,
				en: en$6
			}), "ui-clarifications: dictionaries");
			const queue = new ClarificationsController(ctx);
			ctx.slots.inject("workbench.drawer.clarifications", () => ctx.slots.register({
				name: "workbench.drawer.clarifications",
				locale: NS$6,
				inject: () => ({
					hooks: { clarifications: queue.store },
					refresh: () => {
						queue.refresh();
					}
				})
			}, ClarificationsAction));
		}
		//#endregion
		//#region lib/types/client-ui/recipe-library/client/recipeLibrary.js
		/**
		* Number of distinct deliverable outputs across every phase of a recipe.
		* @param recipe - the revision whose outputs to count.
		* @returns count of unique output names across all phases.
		*/
		function deliverableCount(recipe) {
			const outputs = /* @__PURE__ */ new Set();
			for (const phase of recipe.payload.phases) for (const output of phase.outputs) outputs.add(output);
			return outputs.size;
		}
		/**
		* One-line description: the leading phase goals, joined. The catalogue has no
		* dedicated description field; the phase goals are the recipe's plain-text
		* intent, so the card summarizes the first few.
		* @param recipe - the revision whose goals drive the description.
		* @returns a compact summary of the leading phase goals.
		*/
		function describe(recipe) {
			const goals = recipe.payload.phases.map((phase) => phase.goal);
			return (goals.length > 3 ? [...goals.slice(0, 3), "…"] : goals).join(" · ");
		}
		/**
		* Derive the flat card view of one recipe revision.
		* @param recipe - the loaded immutable revision.
		* @returns the renderable card for the library grid.
		*/
		function cardOf(recipe) {
			return {
				recipeId: String(recipe.recipeId),
				phases: recipe.payload.phases.length,
				checks: recipe.payload.gateChecks.length,
				deliverables: deliverableCount(recipe),
				description: describe(recipe)
			};
		}
		/**
		* The library's state owner. Created once per plugin fiber in `apply`; the
		* snapshot store it exposes is the inject `hooks` source, so components
		* subscribe through the renderer-bound hook and never see this object.
		*/
		var RecipeLibraryController = class {
			/**
			* @param ctx - owning client root context; subscriptions and refreshes ride
			* this fiber's lifetime.
			*/
			constructor(ctx) {
				this.ctx = ctx;
				this.store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)({
					status: "loading",
					cards: [],
					updatedAt: 0
				});
				ctx.on("connection/reset", () => {
					this.refresh();
				});
				this.refresh();
			}
			/**
			* Reload the recipe catalogue from the recipes Remote and derive the cards.
			* @returns when the load settles; failures land in the state's error.
			*/
			async refresh() {
				const result = await this.ctx.remote.recipes.listDetails();
				if (!result.ok) {
					this.store.set({
						...this.store.getSnapshot(),
						status: "failed",
						cards: [],
						error: result.error.code,
						updatedAt: Date.now()
					});
					return;
				}
				this.store.set({
					status: "ready",
					cards: result.value.map(cardOf),
					error: void 0,
					updatedAt: Date.now()
				});
			}
			/**
			* Create a new recipe family and refresh the catalogue.
			* @param recipeId - the family id.
			* @param payload - the revision-1 payload.
			* @returns whether the create settled successfully.
			*/
			async createRecipe(recipeId, payload) {
				const result = await this.ctx.remote.recipes.createRecipe(recipeId.trim(), payload);
				if (result.ok) await this.refresh();
				return result;
			}
			/**
			* Update one recipe family (new immutable revision) and refresh.
			* @param recipeId - the family id.
			* @param payload - the replacement payload.
			* @returns whether the update settled successfully.
			*/
			async updateRecipe(recipeId, payload) {
				const result = await this.ctx.remote.recipes.updateRecipe(recipeId.trim(), payload);
				if (result.ok) await this.refresh();
				return result;
			}
			/**
			* Soft-delete one recipe family and refresh.
			* @param recipeId - the family id.
			* @returns whether the delete settled successfully.
			*/
			async deleteRecipe(recipeId) {
				const result = await this.ctx.remote.recipes.deleteRecipe(recipeId.trim());
				if (result.ok) await this.refresh();
				return result;
			}
		};
		//#endregion
		//#region \0dsh-css:E:\Codes\private\dsh-task-flow\src\client-ui\recipe-library\client\RecipeLibraryAction.module.css.mjs
		const css$5 = ".SEZ_Wa_panel{flex-direction:column;gap:10px;display:flex}.SEZ_Wa_title{color:var(--dsw-alias-label-primary);margin:0;font-size:15px;font-weight:600;line-height:22px}.SEZ_Wa_statusLine,.SEZ_Wa_errorLine{margin:0;padding:4px 2px;font-size:12px;line-height:18px}.SEZ_Wa_statusLine{color:var(--dsw-alias-label-tertiary)}.SEZ_Wa_errorLine{color:var(--dsw-alias-state-error-primary)}.SEZ_Wa_grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin:0;padding:0;list-style:none;display:grid}.SEZ_Wa_card{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-surface-l1);border-radius:10px;flex-direction:column;gap:8px;padding:10px 12px;display:flex}.SEZ_Wa_card:hover{border-color:var(--dsw-alias-border-l2)}.SEZ_Wa_cardHead{flex-direction:column;gap:2px;display:flex}.SEZ_Wa_name{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:18px;overflow:hidden}.SEZ_Wa_meta{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}.SEZ_Wa_summary{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px;line-height:18px}.SEZ_Wa_cardFoot{justify-content:flex-end;margin-top:auto;padding-top:2px;display:flex}.SEZ_Wa_footer{justify-content:flex-end;padding-top:2px;display:flex}.SEZ_Wa_deleteAction{color:var(--dsw-alias-state-error-primary)!important;border-color:var(--dsw-alias-state-error-primary)!important}.SEZ_Wa_gridRegion{flex-direction:column;gap:10px;display:flex}.SEZ_Wa_modalFoot{justify-content:flex-end;gap:8px;display:flex}.SEZ_Wa_form{flex-direction:column;gap:12px;display:flex}.SEZ_Wa_field{flex-direction:column;gap:6px;display:flex}.SEZ_Wa_fieldLabel{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:500;line-height:18px}.SEZ_Wa_payloadEditor{box-sizing:border-box;resize:vertical;width:100%;min-height:260px;font-family:var(--dsw-alias-font-mono,ui-monospace, \"Cascadia Code\", Consolas, monospace);color:var(--dsw-alias-label-primary);background:var(--dsw-alias-surface-l1);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;outline:none;padding:8px 10px;font-size:12px;line-height:18px}.SEZ_Wa_payloadEditor:focus{border-color:var(--dsw-alias-border-l3)}.SEZ_Wa_formFoot{justify-content:flex-end;gap:8px;display:flex}";
		const tagId$5 = "@kongfun2018/dsh-task-flow/RecipeLibraryAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$5) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@kongfun2018/dsh-task-flow";
			tag.dataset.pluginCss = tagId$5;
			tag.textContent = css$5;
			document.head.appendChild(tag);
		}
		var RecipeLibraryAction_module_css_default = {
			"cardHead": "SEZ_Wa_cardHead",
			"statusLine": "SEZ_Wa_statusLine",
			"summary": "SEZ_Wa_summary",
			"deleteAction": "SEZ_Wa_deleteAction",
			"meta": "SEZ_Wa_meta",
			"form": "SEZ_Wa_form",
			"formFoot": "SEZ_Wa_formFoot",
			"errorLine": "SEZ_Wa_errorLine",
			"footer": "SEZ_Wa_footer",
			"name": "SEZ_Wa_name",
			"field": "SEZ_Wa_field",
			"grid": "SEZ_Wa_grid",
			"title": "SEZ_Wa_title",
			"panel": "SEZ_Wa_panel",
			"modalFoot": "SEZ_Wa_modalFoot",
			"cardFoot": "SEZ_Wa_cardFoot",
			"gridRegion": "SEZ_Wa_gridRegion",
			"card": "SEZ_Wa_card",
			"fieldLabel": "SEZ_Wa_fieldLabel",
			"payloadEditor": "SEZ_Wa_payloadEditor"
		};
		//#endregion
		//#region lib/types/client-ui/recipe-library/client/RecipeLibraryAction.js
		/** A minimal, spec-compliant empty payload a user can edit before saving. */
		const BLANK_PAYLOAD = {
			phases: [{
				phaseId: "main",
				kind: "default",
				goal: "执行该阶段并提交产物。",
				inputs: [],
				outputs: ["主产物"],
				submissionCriteria: ["一次性提交说明该阶段产出的清单"]
			}],
			gateChecks: [{
				checkId: "main-submission-complete",
				phaseId: "main",
				kind: "A",
				machineScope: ["已提交清单包含本阶段全部声明产物"],
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
		/** Collapse the CRUD result into a plain serializable shape the UI can read. */
		function plain(result) {
			return {
				ok: result.ok,
				error: result.ok ? void 0 : String(result.error?.code ?? "unknown")
			};
		}
		/** One recipe card with management actions (edit / delete). */
		function RecipeCard({ card, onEdit, onDelete, busy, t }) {
			return (0, react_jsx_runtime.jsxs)("li", {
				className: RecipeLibraryAction_module_css_default.card,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: RecipeLibraryAction_module_css_default.cardHead,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: RecipeLibraryAction_module_css_default.name,
							children: card.recipeId
						}), (0, react_jsx_runtime.jsx)("span", {
							className: RecipeLibraryAction_module_css_default.meta,
							children: t("meta", {
								phases: String(card.phases),
								checks: String(card.checks),
								deliverables: String(card.deliverables)
							})
						})]
					}),
					(0, react_jsx_runtime.jsx)("p", {
						className: RecipeLibraryAction_module_css_default.summary,
						children: t("description", {
							phases: String(card.phases),
							goals: card.description
						})
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: RecipeLibraryAction_module_css_default.cardFoot,
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							size: "sm",
							variant: "outline",
							className: RecipeLibraryAction_module_css_default.deleteAction,
							disabled: busy !== void 0,
							onClick: () => {
								onDelete(card);
							},
							children: busy === card.recipeId ? t("deleting") : t("delete")
						}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							size: "sm",
							variant: "ghost",
							disabled: busy !== void 0,
							onClick: () => {
								onEdit(card);
							},
							children: t("edit")
						})]
					})
				]
			});
		}
		/** Editor form for creating or updating a recipe. */
		function RecipeEditor({ open, title, initialId, draft, saving, error, onClose, onSave, t }) {
			const [recipeId, setRecipeId] = (0, react.useState)(initialId);
			const [json, setJson] = (0, react.useState)(() => JSON.stringify(draft, null, 2));
			(0, react.useEffect)(() => {
				if (open) {
					setRecipeId(initialId);
					setJson(JSON.stringify(draft, null, 2));
				}
			}, [
				open,
				initialId,
				draft
			]);
			const parsed = (0, react.useMemo)(() => {
				try {
					const value = JSON.parse(json);
					if (typeof value !== "object" || value === null || !Array.isArray(value.phases)) return {
						payload: void 0,
						invalid: "payload must be an object with a `phases` array"
					};
					return {
						payload: value,
						invalid: void 0
					};
				} catch {
					return {
						payload: void 0,
						invalid: "invalid JSON"
					};
				}
			}, [json]);
			const payload = parsed.payload;
			const parseError = parsed.invalid;
			return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open,
				onClose,
				title,
				closeLabel: t("close"),
				footer: (0, react_jsx_runtime.jsxs)("div", {
					className: RecipeLibraryAction_module_css_default.formFoot,
					children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						size: "sm",
						variant: "ghost",
						onClick: onClose,
						children: t("cancel")
					}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						size: "sm",
						variant: "primary",
						disabled: saving || parseError !== void 0 || payload === void 0 || recipeId.trim() === "",
						onClick: () => {
							if (payload !== void 0) onSave(recipeId.trim(), payload);
						},
						children: saving ? t("saving") : t("save")
					})]
				}),
				children: (0, react_jsx_runtime.jsxs)("div", {
					className: RecipeLibraryAction_module_css_default.form,
					children: [
						(0, react_jsx_runtime.jsxs)("label", {
							className: RecipeLibraryAction_module_css_default.field,
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: RecipeLibraryAction_module_css_default.fieldLabel,
								children: t("field.id")
							}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
								value: recipeId,
								onChange: (event) => {
									setRecipeId(event.target.value);
								},
								placeholder: t("field.idHint")
							})]
						}),
						(0, react_jsx_runtime.jsxs)("label", {
							className: RecipeLibraryAction_module_css_default.field,
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: RecipeLibraryAction_module_css_default.fieldLabel,
								children: t("field.payload")
							}), (0, react_jsx_runtime.jsx)("textarea", {
								className: RecipeLibraryAction_module_css_default.payloadEditor,
								value: json,
								onChange: (event) => {
									setJson(event.target.value);
								},
								spellCheck: false
							})]
						}),
						parseError !== void 0 && (0, react_jsx_runtime.jsx)("p", {
							className: RecipeLibraryAction_module_css_default.errorLine,
							role: "alert",
							children: parseError
						}),
						error !== void 0 && (0, react_jsx_runtime.jsx)("p", {
							className: RecipeLibraryAction_module_css_default.errorLine,
							role: "alert",
							children: error
						})
					]
				})
			});
		}
		/**
		* Standalone Recipe-library management modal: a card grid over the loaded
		* catalogue with 新建 / 编辑 / 删除 affordances plus a JSON payload editor for
		* authoring or updating an immutable revision. No task-flow coupling lives
		* here — create/update/delete hit the recipes Remote through the inject face.
		* @param props - runtime seat props, locale, inject face, open flag, close.
		* @returns the management modal portal, or nothing while closed.
		*/
		function RecipeLibraryAction(props) {
			const { open, onClose, t, useLibrary, refresh, createRecipe, updateRecipe, deleteRecipe } = props;
			const state = useLibrary((snapshot) => snapshot);
			const [editing, setEditing] = (0, react.useState)(void 0);
			const [creating, setCreating] = (0, react.useState)({
				recipeId: "",
				draft: BLANK_PAYLOAD
			});
			const [formOpen, setFormOpen] = (0, react.useState)(false);
			const [formSaving, setFormSaving] = (0, react.useState)(false);
			const [formError, setFormError] = (0, react.useState)(void 0);
			const [actionError, setActionError] = (0, react.useState)(void 0);
			const [deleting, setDeleting] = (0, react.useState)(void 0);
			(0, react.useEffect)(() => {
				if (!open) return;
				setActionError(void 0);
				setFormOpen(false);
			}, [open]);
			const openCreate = () => {
				setCreating({
					recipeId: "",
					draft: BLANK_PAYLOAD
				});
				setFormError(void 0);
				setFormOpen(true);
			};
			const openEdit = (card) => {
				setEditing({
					recipeId: card.recipeId,
					draft: BLANK_PAYLOAD
				});
				setFormError(void 0);
				setFormOpen(true);
			};
			const handleSave = (recipeId, payload) => {
				(async () => {
					setFormSaving(true);
					setFormError(void 0);
					const isUpdate = editing !== void 0;
					const target = isUpdate ? editing.recipeId : recipeId;
					const p = plain(isUpdate ? await updateRecipe(target, payload) : await createRecipe(target, payload));
					setFormSaving(false);
					if (!p.ok) {
						setFormError(p.error);
						return;
					}
					setActionError(void 0);
					setFormOpen(false);
					setEditing(void 0);
				})();
			};
			const handleDelete = (card) => {
				(async () => {
					setDeleting(card.recipeId);
					setActionError(void 0);
					const p = plain(await deleteRecipe(card.recipeId));
					setDeleting(void 0);
					if (!p.ok) setActionError(p.error);
				})();
			};
			return (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open,
				onClose,
				title: t("title"),
				closeLabel: t("close"),
				footer: (0, react_jsx_runtime.jsxs)("div", {
					className: RecipeLibraryAction_module_css_default.modalFoot,
					children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						size: "sm",
						variant: "primary",
						onClick: openCreate,
						children: t("create")
					}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						size: "sm",
						variant: "ghost",
						onClick: () => {
							refresh();
						},
						disabled: state.status === "loading",
						children: t("refresh")
					})]
				}),
				children: [(0, react_jsx_runtime.jsxs)("div", {
					className: RecipeLibraryAction_module_css_default.gridRegion,
					children: [
						state.status === "loading" && (0, react_jsx_runtime.jsx)("p", {
							className: RecipeLibraryAction_module_css_default.statusLine,
							children: t("loading")
						}),
						state.error !== void 0 && (0, react_jsx_runtime.jsx)("p", {
							className: RecipeLibraryAction_module_css_default.errorLine,
							role: "alert",
							children: t("error.load", { code: state.error })
						}),
						actionError !== void 0 && (0, react_jsx_runtime.jsx)("p", {
							className: RecipeLibraryAction_module_css_default.errorLine,
							role: "alert",
							children: t("error.action", { code: actionError })
						}),
						state.status !== "loading" && state.cards.length === 0 && (0, react_jsx_runtime.jsx)("p", {
							className: RecipeLibraryAction_module_css_default.statusLine,
							children: t("empty")
						}),
						state.status !== "loading" && state.cards.length > 0 && (0, react_jsx_runtime.jsx)("ul", {
							className: RecipeLibraryAction_module_css_default.grid,
							children: state.cards.map((card) => (0, react_jsx_runtime.jsx)(RecipeCard, {
								card,
								onEdit: openEdit,
								onDelete: handleDelete,
								busy: deleting,
								t
							}, card.recipeId))
						})
					]
				}), (0, react_jsx_runtime.jsx)(RecipeEditor, {
					open: formOpen,
					title: editing !== void 0 ? t("editTitle") : t("createTitle"),
					initialId: editing !== void 0 ? editing.recipeId : creating.recipeId,
					draft: editing !== void 0 ? editing.draft : creating.draft,
					saving: formSaving,
					error: formError,
					onClose: () => {
						setFormOpen(false);
						setEditing(void 0);
					},
					onSave: handleSave,
					t
				})]
			});
		}
		//#endregion
		//#region lib/types/client-ui/recipe-library/client/locales.js
		/** `recipeLibrary` namespace dictionaries. */
		/** Dictionary namespace owned by this plugin. */
		const NS$5 = "recipeLibrary";
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh$5 = {
			"title": "Recipe 库",
			"loading": "加载中…",
			"empty": "暂无可用模板",
			"error.load": "模板加载失败：{code}",
			"error.action": "操作失败：{code}",
			"meta": "{phases} 阶段 · {checks} 道闸 · {deliverables} 产物",
			"description": "该模板由 {phases} 个阶段组成：{goals}",
			"edit": "编辑",
			"delete": "删除",
			"deleting": "删除中…",
			"create": "新建模板",
			"createTitle": "新建 Recipe 模板",
			"editTitle": "编辑 Recipe 模板（新增修订版）",
			"field.id": "模板标识（recipeId）",
			"field.idHint": "如：需求研发 / prd",
			"field.payload": "模板内容（phase / gateCheck 的 JSON）",
			"save": "保存",
			"saving": "保存中…",
			"cancel": "取消",
			"close": "关闭",
			"refresh": "刷新"
		};
		/** English dictionary, key-identical to the Chinese source of truth. */
		const en$5 = {
			"title": "Recipe library",
			"loading": "Loading…",
			"empty": "No recipes available",
			"error.load": "Recipes failed to load: {code}",
			"error.action": "Action failed: {code}",
			"meta": "{phases} phases · {checks} checks · {deliverables} deliverables",
			"description": "Runs through {phases} phases: {goals}",
			"edit": "Edit",
			"delete": "Delete",
			"deleting": "Deleting…",
			"create": "New recipe",
			"createTitle": "Create recipe template",
			"editTitle": "Edit recipe template (new revision)",
			"field.id": "Recipe id",
			"field.idHint": "e.g. requirement / prd",
			"field.payload": "Recipe payload (phases / gateChecks JSON)",
			"save": "Save",
			"saving": "Saving…",
			"cancel": "Cancel",
			"close": "Close",
			"refresh": "Refresh"
		};
		//#endregion
		//#region lib/types/client-ui/recipe-library/client/index.js
		/**
		* Client plugin body: the dictionaries, the controller, and the drawer seat.
		* @param ctx - client root context.
		*/
		function apply$6(ctx) {
			ctx.effect(() => ctx.locale.register(NS$5, {
				zh: zh$5,
				en: en$5
			}), "ui-recipe-library: dictionaries");
			const controller = new RecipeLibraryController(ctx);
			ctx.slots.inject("workbench.drawer.recipeLibrary", () => ctx.slots.register({
				name: "workbench.drawer.recipeLibrary",
				locale: NS$5,
				inject: () => ({
					hooks: { library: controller.store },
					refresh: () => controller.refresh(),
					createRecipe: (recipeId, payload) => controller.createRecipe(recipeId, payload),
					updateRecipe: (recipeId, payload) => controller.updateRecipe(recipeId, payload),
					deleteRecipe: (recipeId) => controller.deleteRecipe(recipeId)
				})
			}, RecipeLibraryAction));
		}
		//#endregion
		//#region lib/types/client-ui/task-board/client/board.js
		/** Phase states that settle a run row; everything before them counts as current. */
		const PHASE_SETTLED$1 = /* @__PURE__ */ new Set([
			"passed",
			"failed",
			"stale",
			"superseded",
			"cancelled"
		]);
		/**
		* Derive one run's phase progress: the first unsettled phase is current.
		* @param phaseRuns - the run's phase runs, in recording order.
		* @returns the 1-based current index and the total.
		*/
		function phaseProgressOf$1(phaseRuns) {
			const total = phaseRuns.length;
			const index = phaseRuns.findIndex((run) => !PHASE_SETTLED$1.has(run.state));
			return {
				current: index === -1 ? total : index + 1,
				total
			};
		}
		/** Phase states that park a run on a Gate, signalling a waiting decision. */
		const GATE_PAUSED$1 = /* @__PURE__ */ new Set([
			"gate-running",
			"awaiting-decision",
			"awaiting-input",
			"submitting",
			"submitted"
		]);
		/** Class order for choosing the highest-priority pending check. */
		const GATE_ORDER$1 = {
			A: 0,
			B: 1,
			C: 2
		};
		/**
		* Derive a task's gate pause class from its latest unsettled phase run: the
		* gate class of the first failing check on that phase's active submission.
		* @param runs - the run's phase runs, in recording order.
		* @param gates - the gate results of a submission, or undefined on a dropped read.
		* @returns the paused gate class, or undefined when no gate is waiting.
		*/
		function gatePauseOf$1(runs, gates) {
			if (runs.find((run) => GATE_PAUSED$1.has(run.state)) === void 0 || gates === void 0) return void 0;
			return gates.filter((gate) => gate.passed === false || gate.stale === true).map((gate) => gate.kind ?? "A").sort((a, b) => GATE_ORDER$1[a] - GATE_ORDER$1[b])[0];
		}
		/** Monotonic seed for idempotency keys; collisions within a page are impossible. */
		let idempotencySeq$2 = 0;
		/** Fresh idempotency key for one board command. */
		function nextIdempotencyKey$2(verb, taskId) {
			idempotencySeq$2 += 1;
			return `task-board-${verb}-${taskId}-${Date.now().toString(36)}-${idempotencySeq$2}`;
		}
		/** Compare-and-set mutation context for one board verb over the row's revision. */
		function mutationOf$1(verb, task) {
			return {
				actor: "task-board",
				reason: `task-board ${verb}`,
				expectedRevision: task.revision,
				idempotencyKey: nextIdempotencyKey$2(verb, task.taskId)
			};
		}
		/** Order the board rows: newest creation first, taskId as the stable tiebreak. */
		function byCreation$1(left, right) {
			return right.createdAt - left.createdAt || (left.taskId < right.taskId ? -1 : 1);
		}
		/**
		* The board's state owner. Created once per plugin fiber in `apply`; the
		* snapshot store it exposes is the inject `hooks` source, so components
		* subscribe through the renderer-bound hook and never see this object.
		*/
		var TaskBoardController = class {
			/**
			* @param ctx - owning client root context; subscriptions and refreshes ride
			* this fiber's lifetime.
			*/
			constructor(ctx) {
				this.ctx = ctx;
				this.store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)({
					status: "loading",
					tasks: [],
					metrics: void 0,
					phaseProgress: /* @__PURE__ */ new Map(),
					taskGates: /* @__PURE__ */ new Map(),
					updatedAt: 0
				});
				ctx.effect(() => ctx.remote.$on("task/updated", (task) => {
					this.fold(task);
				}), "task-board: task/updated fold");
				ctx.on("connection/reset", () => {
					this.refresh();
				});
				this.refresh();
			}
			/**
			* Fold one forwarded task projection: newer revisions replace the row,
			* unknown tasks join the list, and stale or repeated deliveries drop.
			* @param task - the post-commit task projection the host forwarded.
			*/
			fold(task) {
				const { tasks } = this.store.getSnapshot();
				const index = tasks.findIndex((row) => row.taskId === task.taskId);
				const existing = index >= 0 ? tasks[index] : void 0;
				if (existing !== void 0 && existing.revision >= task.revision) return;
				const next = index >= 0 ? tasks.with(index, task) : [...tasks, task];
				next.sort(byCreation$1);
				this.store.set({
					...this.store.getSnapshot(),
					tasks: next,
					updatedAt: Date.now()
				});
				this.refreshProgress(task);
			}
			/**
			* Re-read one task's phase progress after a fold; a dropped read keeps the
			* last known progress (the next full refresh recomputes it).
			* @param task - the folded task projection.
			*/
			async refreshProgress(task) {
				if (task.currentRunId === void 0) return;
				const runs = await this.ctx.remote.tasks.listPhaseRuns(String(task.currentRunId));
				if (!runs.ok) return;
				const snapshot = this.store.getSnapshot();
				if (!snapshot.tasks.some((row) => row.taskId === task.taskId)) return;
				const phaseProgress = new Map(snapshot.phaseProgress);
				const taskGates = new Map(snapshot.taskGates);
				phaseProgress.set(task.taskId, phaseProgressOf$1(runs.value));
				const paused = runs.value.find((run) => GATE_PAUSED$1.has(run.state));
				let gate = void 0;
				if (paused !== void 0 && paused.activeSubmissionId !== void 0) {
					const gates = await this.ctx.remote.tasks.listGateResults(String(paused.activeSubmissionId));
					gate = gates.ok ? gatePauseOf$1(runs.value, gates.value) : void 0;
				}
				taskGates.set(task.taskId, gate);
				this.store.set({
					...snapshot,
					phaseProgress,
					taskGates
				});
			}
			/**
			* Reload the full task list from the tasks Remote.
			* @returns when the load settles; failures land in the state's error.
			*/
			async refresh() {
				const [result, metricsResult] = await Promise.all([this.ctx.remote.tasks.listTasks(), this.ctx.remote.metrics.metrics()]);
				if (!result.ok) {
					this.store.set({
						...this.store.getSnapshot(),
						status: "failed",
						error: result.error.code
					});
					return;
				}
				const tasks = [...result.value].sort(byCreation$1);
				const metrics = metricsResult.ok ? metricsResult.value : void 0;
				const entries = await Promise.all(tasks.map(async (task) => {
					if (task.currentRunId === void 0) return [
						task.taskId,
						{
							current: 0,
							total: 0
						},
						void 0
					];
					const runs = await this.ctx.remote.tasks.listPhaseRuns(String(task.currentRunId));
					if (!runs.ok) return [
						task.taskId,
						{
							current: 0,
							total: 0
						},
						void 0
					];
					const progress = phaseProgressOf$1(runs.value);
					const paused = runs.value.find((run) => GATE_PAUSED$1.has(run.state));
					let gate = void 0;
					if (paused !== void 0 && paused.activeSubmissionId !== void 0) {
						const gates = await this.ctx.remote.tasks.listGateResults(String(paused.activeSubmissionId));
						gate = gates.ok ? gatePauseOf$1(runs.value, gates.value) : void 0;
					}
					return [
						task.taskId,
						progress,
						gate
					];
				}));
				const phaseProgress = new Map(entries.map(([id, progress]) => [id, progress]));
				const taskGates = new Map(entries.map(([id, , gate]) => [id, gate]));
				const { error } = this.store.getSnapshot();
				this.store.set({
					status: "ready",
					tasks,
					metrics,
					phaseProgress,
					taskGates,
					error,
					updatedAt: Date.now()
				});
			}
			/**
			* Issue one board verb against a task row.
			* @param taskId - the row's task id.
			* @param verb - the verb to issue.
			* @returns when the command settles; the row folds on success, and a
			* failure records the code and resyncs through {@link refresh} (the
			* compare-and-set revision is the guard, never a client-side fence).
			*/
			async command(taskId, verb) {
				const task = this.store.getSnapshot().tasks.find((row) => row.taskId === taskId);
				if (task === void 0) return;
				const mutation = mutationOf$1(verb, task);
				const result = verb === "pause" ? await this.ctx.remote.tasks.requestPause(taskId, mutation) : verb === "resume" ? await this.ctx.remote.tasks.resume(taskId, mutation) : await this.ctx.remote.tasks.requestCancel(taskId, mutation);
				if (result.ok) {
					this.fold(result.value);
					this.store.set({
						...this.store.getSnapshot(),
						error: void 0
					});
					return;
				}
				this.store.set({
					...this.store.getSnapshot(),
					error: result.error.code
				});
				await this.refresh();
			}
		};
		//#endregion
		//#region \0dsh-css:E:\Codes\private\dsh-task-flow\src\client-ui\task-board\client\TaskBoardAction.module.css.mjs
		const css$4 = ".FELT1G_panel{flex-direction:column;gap:8px;display:flex}.FELT1G_list{flex-direction:column;gap:2px;margin:0;padding:0;list-style:none;display:flex;overflow:visible}.FELT1G_row{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1);width:100%;min-height:40px;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:10px;align-items:center;gap:8px;padding:6px 8px;font-size:13px;line-height:18px;display:flex}.FELT1G_row:hover,.FELT1G_row:focus-visible{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l2)}.FELT1G_row:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-1px}.FELT1G_rowDot{flex:none}.FELT1G_rowMain{flex-direction:column;flex:1;gap:1px;min-width:0;display:flex}.FELT1G_taskId{text-overflow:ellipsis;white-space:nowrap;font-family:var(--dsw-font-mono,ui-monospace, SFMono-Regular, Menlo, monospace);font-size:12px;overflow:hidden}.FELT1G_meta{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}.FELT1G_verbs{flex:none;gap:4px;display:flex}.FELT1G_statusLine,.FELT1G_errorLine{margin:0;padding:4px 2px;font-size:12px;line-height:18px}.FELT1G_statusLine{color:var(--dsw-alias-label-tertiary)}.FELT1G_errorLine{color:var(--dsw-alias-state-error-primary)}.FELT1G_footer{justify-content:flex-end;align-items:center;gap:8px;padding-top:2px;display:flex}.FELT1G_syncedLine{color:var(--dsw-alias-state-success-primary);margin:0;font-size:12px;line-height:18px}.FELT1G_chartRow{grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;display:grid}.FELT1G_chartCard{background:var(--dsw-alias-interactive-bg-hover);border-radius:8px;flex-direction:column;gap:4px;padding:8px 10px;display:flex}.FELT1G_chartTitle{color:var(--dsw-alias-label-primary);font-size:12px;font-weight:500}.FELT1G_chartHint{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}.FELT1G_chartEmpty{color:var(--dsw-alias-label-tertiary);font-size:12px}.FELT1G_sparkline{width:100%;height:44px}.FELT1G_sparkLine{fill:none;stroke:var(--dsw-alias-state-business-primary);stroke-width:2px;stroke-linecap:round;stroke-linejoin:round}.FELT1G_bars{align-items:flex-end;gap:10px;height:60px;display:flex}.FELT1G_barCol{flex-direction:column;flex:1;align-items:center;gap:2px;display:flex}.FELT1G_barTrack{background:var(--dsw-alias-interactive-bg-hover);border-radius:3px;align-items:flex-end;width:22px;height:44px;display:flex;overflow:hidden}.FELT1G_barFill{background:var(--dsw-alias-state-business-primary);border-radius:3px;width:100%}.FELT1G_barLabel{color:var(--dsw-alias-label-secondary);font-size:11px}.FELT1G_gateBadge{color:var(--dsw-alias-state-warn-primary);border:1px solid var(--dsw-alias-state-warn-primary);border-radius:10px;margin-left:6px;padding:1px 6px;font-size:11px;line-height:16px}.FELT1G_kpiRow{grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;display:grid}.FELT1G_kpiCard{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-surface-l1);color:inherit;font:inherit;text-align:center;border-radius:8px;flex-direction:column;align-items:center;gap:2px;padding:8px 4px;display:flex}button.FELT1G_kpiCard{cursor:pointer}button.FELT1G_kpiCard:hover{border-color:var(--dsw-alias-border-strong)}.FELT1G_kpiValue{font-variant-numeric:tabular-nums;font-size:18px;font-weight:600}.FELT1G_kpiLabel{color:var(--dsw-alias-label-secondary);font-size:12px}";
		const tagId$4 = "@kongfun2018/dsh-task-flow/TaskBoardAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$4) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@kongfun2018/dsh-task-flow";
			tag.dataset.pluginCss = tagId$4;
			tag.textContent = css$4;
			document.head.appendChild(tag);
		}
		var TaskBoardAction_module_css_default = {
			"chartRow": "FELT1G_chartRow",
			"kpiLabel": "FELT1G_kpiLabel",
			"barFill": "FELT1G_barFill",
			"barLabel": "FELT1G_barLabel",
			"chartHint": "FELT1G_chartHint",
			"kpiRow": "FELT1G_kpiRow",
			"bars": "FELT1G_bars",
			"kpiCard": "FELT1G_kpiCard",
			"kpiValue": "FELT1G_kpiValue",
			"list": "FELT1G_list",
			"barTrack": "FELT1G_barTrack",
			"chartTitle": "FELT1G_chartTitle",
			"sparkline": "FELT1G_sparkline",
			"syncedLine": "FELT1G_syncedLine",
			"meta": "FELT1G_meta",
			"row": "FELT1G_row",
			"rowDot": "FELT1G_rowDot",
			"footer": "FELT1G_footer",
			"chartCard": "FELT1G_chartCard",
			"chartEmpty": "FELT1G_chartEmpty",
			"verbs": "FELT1G_verbs",
			"errorLine": "FELT1G_errorLine",
			"taskId": "FELT1G_taskId",
			"sparkLine": "FELT1G_sparkLine",
			"gateBadge": "FELT1G_gateBadge",
			"barCol": "FELT1G_barCol",
			"statusLine": "FELT1G_statusLine",
			"rowMain": "FELT1G_rowMain",
			"panel": "FELT1G_panel"
		};
		//#endregion
		//#region lib/types/client-ui/task-board/client/TaskBoardAction.js
		/**
		* Token-only charts under the KPI row: a last-7-day throughput sparkline and
		* per-class Gate pass-rate bars, both derived from the loaded metrics.
		* @param metrics - the loaded workbench metrics projection.
		* @param t - board namespace translate.
		*/
		function MetricsCharts({ metrics, t }) {
			const w = 160;
			const h = 44;
			const days = metrics.throughput;
			const max = days.reduce((peak, day) => Math.max(peak, day.completedPhases), 0);
			const pts = days.map((day, i) => {
				const x = days.length === 1 ? w / 2 : w * (i / (days.length - 1));
				const y = max === 0 ? h : h - h * day.completedPhases / max;
				return "" + x + "," + y;
			}).join(" ");
			return (0, react_jsx_runtime.jsxs)("div", {
				className: TaskBoardAction_module_css_default.chartRow,
				children: [(0, react_jsx_runtime.jsxs)("div", {
					className: TaskBoardAction_module_css_default.chartCard,
					children: [
						(0, react_jsx_runtime.jsx)("span", {
							className: TaskBoardAction_module_css_default.chartTitle,
							children: t("chart.throughput")
						}),
						pts !== "" ? (0, react_jsx_runtime.jsx)("svg", {
							className: TaskBoardAction_module_css_default.sparkline,
							viewBox: "0 0 160 44",
							role: "img",
							"aria-label": t("chart.throughput"),
							children: (0, react_jsx_runtime.jsx)("polyline", {
								points: pts,
								fill: "none",
								className: TaskBoardAction_module_css_default.sparkLine
							})
						}) : (0, react_jsx_runtime.jsx)("span", {
							className: TaskBoardAction_module_css_default.chartEmpty,
							children: t("kpi.empty")
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: TaskBoardAction_module_css_default.chartHint,
							children: t("chart.throughputHint")
						})
					]
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: TaskBoardAction_module_css_default.chartCard,
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: TaskBoardAction_module_css_default.chartTitle,
						children: t("chart.gateRate")
					}), (0, react_jsx_runtime.jsx)("div", {
						className: TaskBoardAction_module_css_default.bars,
						role: "img",
						"aria-label": t("chart.gateRate"),
						children: [
							["a", "A"],
							["b", "B"],
							["c", "C"]
						].map(([key, label]) => {
							const pct = Math.round((metrics.gatePassRate[key] ?? 0) * 100);
							return (0, react_jsx_runtime.jsxs)("div", {
								className: TaskBoardAction_module_css_default.barCol,
								children: [(0, react_jsx_runtime.jsx)("div", {
									className: TaskBoardAction_module_css_default.barTrack,
									children: (0, react_jsx_runtime.jsx)("div", {
										className: TaskBoardAction_module_css_default.barFill,
										style: { height: pct + "%" }
									})
								}), (0, react_jsx_runtime.jsxs)("span", {
									className: TaskBoardAction_module_css_default.barLabel,
									children: [
										label,
										" ",
										pct,
										"%"
									]
								})]
							}, key);
						})
					})]
				})]
			});
		}
		/**
		* Render the drawer's task-list tab body: the cross-session task list with
		* per-row verbs; opening a row switches the drawer to that task's detail.
		* @param props - composed slot props (owner openDetail, locale, inject face).
		* @returns the task list panel filling the drawer's tab body.
		*/
		function TaskBoardAction(props) {
			const { openInbox, t, useBoard, refresh } = props;
			const board = useBoard((state) => state);
			const [refreshing, setRefreshing] = (0, react.useState)(false);
			const [syncedAt, setSyncedAt] = (0, react.useState)(void 0);
			const handleRefresh = async () => {
				setRefreshing(true);
				try {
					await refresh();
					setSyncedAt(Date.now());
				} finally {
					setRefreshing(false);
				}
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: TaskBoardAction_module_css_default.panel,
				children: [
					board.status === "loading" && (0, react_jsx_runtime.jsx)("p", {
						className: TaskBoardAction_module_css_default.statusLine,
						children: t("loading")
					}),
					board.metrics !== void 0 && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("div", {
						className: TaskBoardAction_module_css_default.kpiRow,
						children: [
							(0, react_jsx_runtime.jsxs)("div", {
								className: TaskBoardAction_module_css_default.kpiCard,
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: TaskBoardAction_module_css_default.kpiValue,
									children: board.metrics.live
								}), (0, react_jsx_runtime.jsx)("span", {
									className: TaskBoardAction_module_css_default.kpiLabel,
									children: t("kpi.live")
								})]
							}),
							(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: TaskBoardAction_module_css_default.kpiCard,
								onClick: openInbox,
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: TaskBoardAction_module_css_default.kpiValue,
									children: board.metrics.gate
								}), (0, react_jsx_runtime.jsx)("span", {
									className: TaskBoardAction_module_css_default.kpiLabel,
									children: t("kpi.gate")
								})]
							}),
							(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: TaskBoardAction_module_css_default.kpiCard,
								onClick: openInbox,
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: TaskBoardAction_module_css_default.kpiValue,
									children: board.metrics.ask
								}), (0, react_jsx_runtime.jsx)("span", {
									className: TaskBoardAction_module_css_default.kpiLabel,
									children: t("kpi.ask")
								})]
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: TaskBoardAction_module_css_default.kpiCard,
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: TaskBoardAction_module_css_default.kpiValue,
									children: board.metrics.asset
								}), (0, react_jsx_runtime.jsx)("span", {
									className: TaskBoardAction_module_css_default.kpiLabel,
									children: t("kpi.asset")
								})]
							})
						]
					}), (0, react_jsx_runtime.jsx)(MetricsCharts, {
						metrics: board.metrics,
						t
					})] }),
					board.error !== void 0 && (0, react_jsx_runtime.jsx)("p", {
						className: TaskBoardAction_module_css_default.errorLine,
						role: "alert",
						children: t(board.status === "failed" ? "error.load" : "error.command", { code: board.error })
					}),
					board.status !== "loading" && board.metrics === void 0 && (0, react_jsx_runtime.jsx)("p", {
						className: TaskBoardAction_module_css_default.statusLine,
						children: t("empty")
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: TaskBoardAction_module_css_default.footer,
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							size: "sm",
							variant: "outline",
							disabled: refreshing,
							onClick: () => {
								handleRefresh();
							},
							children: refreshing ? t("refreshing") : t("refresh")
						}), syncedAt !== void 0 && !refreshing && (0, react_jsx_runtime.jsx)("span", {
							className: TaskBoardAction_module_css_default.syncedLine,
							role: "status",
							children: t("synced", { time: new Date(syncedAt).toLocaleTimeString() })
						})]
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client-ui/task-board/client/locales.js
		/** `taskBoard` namespace dictionaries. */
		/** Dictionary namespace owned by this plugin. */
		const NS$4 = "taskBoard";
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh$4 = {
			"kpi.live": "运行中任务",
			"kpi.gate": "待审查项",
			"kpi.ask": "未决疑问",
			"kpi.asset": "已登记产物",
			"kpi.empty": "—",
			"phase.progress": "阶段 {current}/{total}",
			"gate.badge": "Gate {kind} ⏳",
			"recipe": "模板 {recipeId}",
			"refresh": "刷新",
			"refreshing": "刷新中…",
			"synced": "已同步 · {time}",
			"chart.throughput": "近 7 日任务吞吐",
			"chart.throughputHint": "每日新增完成阶段数",
			"chart.gateRate": "Gate 通过率",
			"loading": "加载中…",
			"empty": "暂无任务",
			"error.load": "加载失败：{code}",
			"error.command": "操作失败：{code}，已重新同步",
			"revision": "版本 {revision}",
			"open": "打开任务 {taskId}",
			"state.planning": "规划中",
			"state.running": "运行中",
			"state.awaiting-input": "等待输入",
			"state.awaiting-decision": "等待决策",
			"state.pausing": "暂停中",
			"state.paused": "已暂停",
			"state.cancelling": "取消中",
			"state.cancelled": "已取消",
			"state.completed": "已完成",
			"state.failed": "已失败",
			"verb.pause": "暂停",
			"verb.resume": "继续",
			"verb.cancel": "取消"
		};
		/** English dictionary, key-identical to the Chinese source of truth. */
		const en$4 = {
			"kpi.live": "Live tasks",
			"kpi.gate": "Awaiting review",
			"kpi.ask": "Open questions",
			"kpi.asset": "Registered assets",
			"kpi.empty": "—",
			"phase.progress": "Phase {current}/{total}",
			"gate.badge": "Gate {kind} ⏳",
			"recipe": "Recipe {recipeId}",
			"refresh": "Refresh",
			"refreshing": "Refreshing…",
			"synced": "Synced · {time}",
			"chart.throughput": "Last 7-day throughput",
			"chart.throughputHint": "Completed phases per day",
			"chart.gateRate": "Gate pass rate",
			"loading": "Loading…",
			"empty": "No tasks yet",
			"error.load": "Load failed: {code}",
			"error.command": "Command failed: {code}; resynced",
			"revision": "rev {revision}",
			"open": "Open task {taskId}",
			"state.planning": "planning",
			"state.running": "running",
			"state.awaiting-input": "awaiting input",
			"state.awaiting-decision": "awaiting decision",
			"state.pausing": "pausing",
			"state.paused": "paused",
			"state.cancelling": "cancelling",
			"state.cancelled": "cancelled",
			"state.completed": "completed",
			"state.failed": "failed",
			"verb.pause": "Pause",
			"verb.resume": "Resume",
			"verb.cancel": "Cancel"
		};
		//#endregion
		//#region lib/types/client-ui/task-board/client/index.js
		/**
		* Client plugin body: the dictionaries, the controller, and the drawer seat.
		* @param ctx - client root context.
		*/
		function apply$5(ctx) {
			ctx.effect(() => ctx.locale.register(NS$4, {
				zh: zh$4,
				en: en$4
			}), "ui-task-board: dictionaries");
			const board = new TaskBoardController(ctx);
			ctx.slots.inject("workbench.drawer.tasks", () => ctx.slots.register({
				name: "workbench.drawer.tasks",
				locale: NS$4,
				inject: () => ({
					hooks: { board: board.store },
					refresh: () => board.refresh()
				})
			}, TaskBoardAction));
		}
		//#endregion
		//#region lib/types/client-ui/task-create/client/create.js
		/**
		* Task-creation object layer: a React-free controller that loads the recipe
		* catalogue through the recipes Remote, then creates a task through the
		* tasks Remote with a fresh idempotency key. The component reads only the
		* store snapshot and the command callback.
		*/
		let idempotencySeq$1 = 0;
		/** Fresh idempotency key for one create command. */
		function nextIdempotencyKey$1(recipeId) {
			idempotencySeq$1 += 1;
			return "task-create-" + recipeId + "-" + Date.now().toString(36) + "-" + String(idempotencySeq$1);
		}
		/**
		* The create panel's state owner. Created once per plugin fiber in apply.
		*/
		var TaskCreateController = class {
			constructor(ctx) {
				this.ctx = ctx;
				this.store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)({
					status: "loading",
					recipes: []
				});
				this.refresh();
			}
			/** Reload the recipe catalogue from the recipes Remote. */
			async refresh() {
				const result = await this.ctx.remote.recipes.listDetails();
				if (!result.ok) {
					this.store.set({
						status: "failed",
						recipes: [],
						error: result.error.code
					});
					return;
				}
				this.store.set({
					status: "ready",
					recipes: result.value,
					error: void 0
				});
			}
			/**
			* One-shot AI polish of the goal text through the host LLM.
			* @param goal - raw user-entered goal text.
			* @returns the clarified goal, or throws on failure (caller keeps the draft).
			*/
			async polish(goal) {
				const result = await this.ctx.remote.taskPolish.polish(goal);
				if (!result.ok) throw new Error("polish failed: " + result.error.code);
				return result.value;
			}
			/**
			* Create one task from the chosen recipe.
			* @param recipeId - the chosen recipe id, already in the catalogue.
			* @param workspaceId - the owning workspace.
			* @param actor - the creating actor.
			* @param goal - goal text; carried by the caller, not persisted here.
			* @returns the created task id.
			*/
			async create(recipeId, workspaceId, actor, goal) {
				if (this.store.getSnapshot().recipes.find((item) => item.recipeId === recipeId) === void 0) throw new Error("recipe \"" + recipeId + "\" is not in the catalogue");
				const result = await this.ctx.remote.tasks.createTask(recipeId, workspaceId, actor, nextIdempotencyKey$1(recipeId));
				if (!result.ok) throw new Error("create failed: " + result.error.code);
				const task = result.value;
				const start = {
					actor,
					reason: "auto-start after create",
					expectedRevision: task.revision,
					idempotencyKey: nextIdempotencyKey$1(recipeId + "-start")
				};
				const started = await this.ctx.remote.tasks.startTask(String(task.taskId), start);
				if (!started.ok) throw new Error("start failed: " + started.error.code);
				return String(task.taskId);
			}
		};
		//#endregion
		//#region \0dsh-css:E:\Codes\private\dsh-task-flow\src\client-ui\task-create\client\TaskCreateAction.module.css.mjs
		const css$3 = ".uSmRfG_panel{flex-direction:column;gap:14px;height:100%;padding:16px 18px 20px;display:flex}.uSmRfG_title{margin:0;font-size:16px}.uSmRfG_step{flex-direction:column;gap:8px;display:flex}.uSmRfG_section{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px;font-weight:600}.uSmRfG_recipeList{grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin:0;padding:0;list-style:none;display:grid}.uSmRfG_recipeCard{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-surface-l1);width:100%;color:inherit;font:inherit;text-align:left;cursor:pointer;border-radius:8px;flex-direction:column;align-items:flex-start;gap:2px;padding:9px 11px;transition:border-color .15s,background .15s;display:flex}.uSmRfG_recipeCard:hover{background:var(--dsw-alias-interactive-bg-hover)}.uSmRfG_recipeCardSelected{border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-interactive-bg-hover)}.uSmRfG_recipeName{font-weight:600}.uSmRfG_recipeMeta{color:var(--dsw-alias-label-secondary);font-size:12px}.uSmRfG_flow{margin:0;padding:0;list-style:none}.uSmRfG_flowItem{gap:12px;display:flex}.uSmRfG_phaseRail{flex-direction:column;flex:none;align-items:center;width:24px;display:flex}.uSmRfG_phaseDot{background:var(--dsw-alias-state-business-primary);width:24px;height:24px;color:var(--dsw-alias-label-primary-foreground);border-radius:50%;flex:none;justify-content:center;align-items:center;font-size:12px;font-weight:600;display:flex}.uSmRfG_phaseConnect{background:var(--dsw-alias-border-l2);flex:1;width:2px;min-height:14px}.uSmRfG_phaseBody{flex-direction:column;flex:1;gap:5px;min-width:0;padding:0 0 14px;display:flex}.uSmRfG_phaseHead{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.uSmRfG_kindBadge{background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:600}.uSmRfG_submitCriteria{color:var(--dsw-alias-label-tertiary);font-size:11px}.uSmRfG_phaseGoal{color:var(--dsw-alias-label-primary);margin:0;font-size:13px;line-height:1.5}.uSmRfG_outputs{flex-wrap:wrap;align-items:center;gap:6px;margin:0;display:flex}.uSmRfG_outputsLabel{color:var(--dsw-alias-label-tertiary);font-size:11px}.uSmRfG_outputPill{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);border-radius:6px;padding:1px 8px;font-size:11px}.uSmRfG_gates{flex-wrap:wrap;align-items:center;gap:6px;margin:0;display:flex}.uSmRfG_gateA,.uSmRfG_gateB,.uSmRfG_gateC{border:1px solid #0000;border-radius:999px;align-items:center;gap:4px;padding:2px 9px;font-size:11px;font-weight:600;display:inline-flex}.uSmRfG_gateA{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 14%, transparent);border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 40%, transparent)}.uSmRfG_gateB{color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent);border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 35%, transparent)}.uSmRfG_gateC{color:var(--dsw-alias-state-warn-primary);background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, transparent);border-color:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 35%, transparent)}.uSmRfG_breakerMark{font-size:11px}.uSmRfG_field{color:var(--dsw-alias-label-secondary);flex-direction:column;gap:4px;margin-bottom:10px;font-size:12px;display:flex}.uSmRfG_goalCombo{align-items:flex-start;gap:8px;display:flex}.uSmRfG_goalInput{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-surface-l1);width:100%;min-height:88px;color:var(--dsw-alias-label-primary);font:inherit;resize:vertical;border-radius:8px;padding:8px 10px;line-height:1.5}.uSmRfG_goalInput:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.uSmRfG_polishButton{flex:none;margin-top:2px}.uSmRfG_workspaceInput{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-surface-l1);width:100%;color:var(--dsw-alias-label-primary);font:inherit;border-radius:8px;padding:6px 10px}.uSmRfG_workspaceInput:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.uSmRfG_review{color:var(--dsw-alias-label-secondary);font-size:12px}.uSmRfG_review summary{cursor:pointer;font-weight:600}.uSmRfG_statusLine{color:var(--dsw-alias-label-secondary);font-size:13px}.uSmRfG_errorLine{color:var(--dsw-alias-state-error-primary);font-size:13px}.uSmRfG_footer{border-top:1px solid var(--dsw-alias-border-l1);justify-content:flex-end;gap:8px;margin-top:auto;padding-top:14px;display:flex}";
		const tagId$3 = "@kongfun2018/dsh-task-flow/TaskCreateAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@kongfun2018/dsh-task-flow";
			tag.dataset.pluginCss = tagId$3;
			tag.textContent = css$3;
			document.head.appendChild(tag);
		}
		var TaskCreateAction_module_css_default = {
			"errorLine": "uSmRfG_errorLine",
			"goalCombo": "uSmRfG_goalCombo",
			"polishButton": "uSmRfG_polishButton",
			"review": "uSmRfG_review",
			"footer": "uSmRfG_footer",
			"outputPill": "uSmRfG_outputPill",
			"phaseRail": "uSmRfG_phaseRail",
			"title": "uSmRfG_title",
			"submitCriteria": "uSmRfG_submitCriteria",
			"outputs": "uSmRfG_outputs",
			"outputsLabel": "uSmRfG_outputsLabel",
			"workspaceInput": "uSmRfG_workspaceInput",
			"flowItem": "uSmRfG_flowItem",
			"step": "uSmRfG_step",
			"statusLine": "uSmRfG_statusLine",
			"recipeCardSelected": "uSmRfG_recipeCardSelected",
			"gates": "uSmRfG_gates",
			"field": "uSmRfG_field",
			"panel": "uSmRfG_panel",
			"flow": "uSmRfG_flow",
			"recipeCard": "uSmRfG_recipeCard",
			"gateC": "uSmRfG_gateC",
			"gateB": "uSmRfG_gateB",
			"phaseConnect": "uSmRfG_phaseConnect",
			"breakerMark": "uSmRfG_breakerMark",
			"gateA": "uSmRfG_gateA",
			"goalInput": "uSmRfG_goalInput",
			"recipeList": "uSmRfG_recipeList",
			"phaseBody": "uSmRfG_phaseBody",
			"phaseGoal": "uSmRfG_phaseGoal",
			"section": "uSmRfG_section",
			"kindBadge": "uSmRfG_kindBadge",
			"phaseDot": "uSmRfG_phaseDot",
			"recipeMeta": "uSmRfG_recipeMeta",
			"phaseHead": "uSmRfG_phaseHead",
			"recipeName": "uSmRfG_recipeName"
		};
		//#endregion
		//#region lib/types/client-ui/task-create/client/TaskCreateAction.js
		function recipeMeta(recipe) {
			const payload = recipe.payload;
			const deliverables = new Set(payload.phases.flatMap((phase) => phase.outputs.map((output) => output)));
			return {
				phases: payload.phases.length,
				checks: payload.gateChecks.length,
				deliverables: deliverables.size
			};
		}
		/** The A/B/C gates bound to one phase, for its preview node. */
		function gatesFor(recipe, phaseId) {
			return recipe.payload.gateChecks.filter((check) => check.phaseId === phaseId);
		}
		/** Human label for a phase kind via the dictionary; unknown kinds keep their
		*  raw machine kind (the translate function echoes an unregistered key). */
		function kindLabel(t, kind) {
			const key = `phase.kind.${kind}`;
			const label = t(key);
			return label === key ? kind : label;
		}
		/**
		* New-task wizard: pick a recipe, preview its phase flow, then set the goal.
		* The three concerns stack top-to-bottom as numbered steps (1 · 2 · 3), with
		* the phase preview rendered as a visual flow — each phase node shows its
		* sequence, kind badge, full goal, produced outputs, and the A/B/C gates bound
		* to that phase (with circuit-breaker marks). Branch-routing (DAG) is a
		* follow-up iteration; the current model is a serial phase pipeline.
		*/
		function TaskCreateAction(props) {
			const { t, openDetail, initialRecipeId, useCreate, useWorkspaces, create, polish } = props;
			const tr = t;
			const state = useCreate((state) => state);
			const workspaceItems = useWorkspaces((snapshot) => snapshot).items;
			const [selectedId, setSelectedId] = (0, react.useState)(void 0);
			const [workspace, setWorkspace] = (0, react.useState)("default");
			const [goal, setGoal] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const [polishing, setPolishing] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				if (initialRecipeId !== void 0) setSelectedId(String(initialRecipeId));
			}, [initialRecipeId]);
			const selected = state.recipes.find((recipe) => recipe.recipeId === selectedId);
			const workspaceIdFor = (candidate) => {
				const trimmed = candidate.trim();
				const owned = workspaceItems.find((item) => item.title === trimmed);
				return owned !== void 0 ? String(owned.workspaceId) : trimmed === "" ? "default" : trimmed;
			};
			const polishGoal = async () => {
				const draft = goal.trim();
				if (draft === "" || polishing) return;
				setPolishing(true);
				try {
					const refined = await polish(draft);
					setGoal(refined);
				} catch {} finally {
					setPolishing(false);
				}
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: TaskCreateAction_module_css_default.panel,
				children: [
					(0, react_jsx_runtime.jsx)("h2", {
						className: TaskCreateAction_module_css_default.title,
						children: t("title")
					}),
					(0, react_jsx_runtime.jsxs)("section", {
						className: TaskCreateAction_module_css_default.step,
						children: [
							(0, react_jsx_runtime.jsx)("h3", {
								className: TaskCreateAction_module_css_default.section,
								children: t("column.recipe")
							}),
							state.status === "loading" && (0, react_jsx_runtime.jsx)("p", {
								className: TaskCreateAction_module_css_default.statusLine,
								children: t("column.recipe")
							}),
							state.error !== void 0 && (0, react_jsx_runtime.jsx)("p", {
								className: TaskCreateAction_module_css_default.errorLine,
								role: "alert",
								children: t("error.load", { code: state.error })
							}),
							state.status === "ready" && state.recipes.length === 0 && (0, react_jsx_runtime.jsx)("p", {
								className: TaskCreateAction_module_css_default.statusLine,
								children: t("empty")
							}),
							state.status === "ready" && state.recipes.length > 0 && (0, react_jsx_runtime.jsx)("ul", {
								className: TaskCreateAction_module_css_default.recipeList,
								children: state.recipes.map((recipe) => {
									const meta = recipeMeta(recipe);
									return (0, react_jsx_runtime.jsx)("li", { children: (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: selectedId === recipe.recipeId ? `${TaskCreateAction_module_css_default.recipeCard} ${TaskCreateAction_module_css_default.recipeCardSelected}` : TaskCreateAction_module_css_default.recipeCard,
										onClick: () => {
											setSelectedId(recipe.recipeId);
										},
										children: [(0, react_jsx_runtime.jsx)("span", {
											className: TaskCreateAction_module_css_default.recipeName,
											children: recipe.recipeId
										}), (0, react_jsx_runtime.jsx)("span", {
											className: TaskCreateAction_module_css_default.recipeMeta,
											children: t("recipe.meta", {
												phases: String(meta.phases),
												checks: String(meta.checks),
												deliverables: String(meta.deliverables)
											})
										})]
									}) }, recipe.recipeId);
								})
							})
						]
					}),
					(0, react_jsx_runtime.jsxs)("section", {
						className: TaskCreateAction_module_css_default.step,
						children: [
							(0, react_jsx_runtime.jsx)("h3", {
								className: TaskCreateAction_module_css_default.section,
								children: t("column.preview")
							}),
							selected === void 0 && (0, react_jsx_runtime.jsx)("p", {
								className: TaskCreateAction_module_css_default.statusLine,
								children: t("preview.empty")
							}),
							selected !== void 0 && (0, react_jsx_runtime.jsx)("ol", {
								className: TaskCreateAction_module_css_default.flow,
								children: selected.payload.phases.map((phase, index) => (0, react_jsx_runtime.jsxs)("li", {
									className: TaskCreateAction_module_css_default.flowItem,
									children: [(0, react_jsx_runtime.jsxs)("div", {
										className: TaskCreateAction_module_css_default.phaseRail,
										children: [(0, react_jsx_runtime.jsx)("span", {
											className: TaskCreateAction_module_css_default.phaseDot,
											children: index + 1
										}), index < selected.payload.phases.length - 1 && (0, react_jsx_runtime.jsx)("span", {
											className: TaskCreateAction_module_css_default.phaseConnect,
											"aria-hidden": "true"
										})]
									}), (0, react_jsx_runtime.jsxs)("div", {
										className: TaskCreateAction_module_css_default.phaseBody,
										children: [
											(0, react_jsx_runtime.jsxs)("div", {
												className: TaskCreateAction_module_css_default.phaseHead,
												children: [(0, react_jsx_runtime.jsx)("span", {
													className: TaskCreateAction_module_css_default.kindBadge,
													children: kindLabel(tr, phase.kind)
												}), (0, react_jsx_runtime.jsx)("span", {
													className: TaskCreateAction_module_css_default.submitCriteria,
													children: phase.submissionCriteria[0] ?? tr("phase.noCriteria")
												})]
											}),
											(0, react_jsx_runtime.jsx)("p", {
												className: TaskCreateAction_module_css_default.phaseGoal,
												children: phase.goal
											}),
											phase.outputs.length > 0 && (0, react_jsx_runtime.jsxs)("p", {
												className: TaskCreateAction_module_css_default.outputs,
												children: [(0, react_jsx_runtime.jsx)("span", {
													className: TaskCreateAction_module_css_default.outputsLabel,
													children: tr("phase.outputs")
												}), phase.outputs.map((output) => (0, react_jsx_runtime.jsx)("span", {
													className: TaskCreateAction_module_css_default.outputPill,
													children: output
												}, output))]
											}),
											(() => {
												const gates = gatesFor(selected, phase.phaseId);
												if (gates.length === 0) return null;
												return (0, react_jsx_runtime.jsx)("p", {
													className: TaskCreateAction_module_css_default.gates,
													children: gates.map((check) => (0, react_jsx_runtime.jsxs)("span", {
														className: check.kind === "A" ? TaskCreateAction_module_css_default.gateA : check.kind === "B" ? TaskCreateAction_module_css_default.gateB : TaskCreateAction_module_css_default.gateC,
														title: check.machineScope.join(" · "),
														children: [tr(`gate.${check.kind}`), check.circuitBreaker !== void 0 && (0, react_jsx_runtime.jsx)("span", {
															className: TaskCreateAction_module_css_default.breakerMark,
															title: tr("gate.breaker"),
															children: "⟲"
														})]
													}, check.checkId))
												});
											})()
										]
									})]
								}, phase.phaseId))
							})
						]
					}),
					(0, react_jsx_runtime.jsxs)("section", {
						className: TaskCreateAction_module_css_default.step,
						children: [
							(0, react_jsx_runtime.jsx)("h3", {
								className: TaskCreateAction_module_css_default.section,
								children: t("column.config")
							}),
							(0, react_jsx_runtime.jsxs)("label", {
								className: TaskCreateAction_module_css_default.field,
								children: [(0, react_jsx_runtime.jsx)("span", { children: t("goal.label") }), (0, react_jsx_runtime.jsxs)("div", {
									className: TaskCreateAction_module_css_default.goalCombo,
									children: [(0, react_jsx_runtime.jsx)("textarea", {
										className: TaskCreateAction_module_css_default.goalInput,
										value: goal,
										onChange: (event) => {
											setGoal(event.target.value);
										},
										placeholder: t("goal.placeholder"),
										spellCheck: false
									}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										size: "sm",
										variant: "outline",
										className: TaskCreateAction_module_css_default.polishButton,
										disabled: polishing || goal.trim() === "",
										onClick: () => {
											polishGoal();
										},
										title: t("polish.title"),
										children: polishing ? t("polish.busy") : t("polish.label")
									})]
								})]
							}),
							(0, react_jsx_runtime.jsxs)("label", {
								className: TaskCreateAction_module_css_default.field,
								children: [
									(0, react_jsx_runtime.jsx)("span", { children: t("workspace.label") }),
									(0, react_jsx_runtime.jsx)("input", {
										className: TaskCreateAction_module_css_default.workspaceInput,
										list: "task-create-workspaces",
										value: workspace,
										onChange: (event) => {
											setWorkspace(event.target.value);
										},
										placeholder: t("workspace.placeholder"),
										spellCheck: false
									}),
									(0, react_jsx_runtime.jsx)("datalist", {
										id: "task-create-workspaces",
										children: workspaceItems.map((item) => (0, react_jsx_runtime.jsx)("option", { value: item.title }, String(item.workspaceId)))
									})
								]
							}),
							(0, react_jsx_runtime.jsxs)("details", {
								className: TaskCreateAction_module_css_default.review,
								children: [(0, react_jsx_runtime.jsx)("summary", { children: t("review.label") }), (0, react_jsx_runtime.jsx)("p", { children: t("review.detail") })]
							})
						]
					}),
					state.status !== "loading" && (0, react_jsx_runtime.jsxs)("div", {
						className: TaskCreateAction_module_css_default.footer,
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							size: "sm",
							variant: "ghost",
							onClick: () => {
								setSelectedId(void 0);
								setGoal("");
								setWorkspace("default");
							},
							children: t("cancel")
						}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							size: "sm",
							variant: "primary",
							disabled: selected === void 0 || busy,
							onClick: () => {
								if (selected === void 0) return;
								setBusy(true);
								create(selected.recipeId, workspaceIdFor(workspace), goal).then((taskId) => {
									setBusy(false);
									setSelectedId(void 0);
									setGoal("");
									setWorkspace("default");
									openDetail(taskId);
								}).catch(() => {
									setBusy(false);
								});
							},
							children: t("create")
						})]
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client-ui/task-create/client/locales.js
		/** `uiTaskCreate` namespace dictionaries. */
		const NS$3 = "uiTaskCreate";
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh$3 = {
			"title": "新建任务 · 选择处理模板",
			"column.recipe": "1 · 任务类型（Recipe）",
			"column.preview": "2 · 流程预览",
			"column.config": "3 · 目标与配置",
			"empty": "无可用模板",
			"error.load": "模板加载失败：{code}",
			"goal.label": "任务目标",
			"goal.placeholder": "描述要达成的结果…",
			"workspace.label": "关联 Workspace",
			"review.label": "审查策略",
			"review.detail": "A 机器强制 · B 人工确认 · C 人工仲裁（默认折叠）",
			"recipe.meta": "{phases} 阶段 · {checks} 道闸 · {deliverables} 产物",
			"preview.empty": "选中上方模板查看流程预览",
			"create": "创建并开始第一阶段",
			"cancel": "取消",
			"phase.kind.default": "通用",
			"phase.kind.research": "调研",
			"phase.kind.review": "评审",
			"phase.kind.clarify": "澄清",
			"phase.kind.verify": "核验",
			"phase.kind.normalize": "规范化",
			"phase.outputs": "产出",
			"phase.noCriteria": "无提交验收标准",
			"gate.A": "A 机器强制",
			"gate.B": "B 人工确认",
			"gate.C": "C 人工仲裁",
			"gate.breaker": "含熔断保护",
			"workspace.placeholder": "选择已有工作区，或输入新工作区名…",
			"polish.label": "AI 优化",
			"polish.busy": "整理中…",
			"polish.title": "用 AI 把任务目标整理得更清晰、具体"
		};
		/** English dictionary, key-identical to the Chinese source of truth. */
		const en$3 = {
			"title": "New task · choose a recipe",
			"column.recipe": "1 · Recipe",
			"column.preview": "2 · Phase preview",
			"column.config": "3 · Goal & config",
			"empty": "No recipes available",
			"error.load": "Recipes failed to load: {code}",
			"goal.label": "Goal",
			"goal.placeholder": "Describe the outcome…",
			"workspace.label": "Workspace",
			"review.label": "Review policy",
			"review.detail": "A machine-mandatory · B human confirm · C human arbitration (folded by default)",
			"recipe.meta": "{phases} phases · {checks} checks · {deliverables} deliverables",
			"preview.empty": "Pick a template above to preview its phases",
			"create": "Create and start phase one",
			"cancel": "Cancel",
			"phase.kind.default": "General",
			"phase.kind.research": "Research",
			"phase.kind.review": "Review",
			"phase.kind.clarify": "Clarify",
			"phase.kind.verify": "Verify",
			"phase.kind.normalize": "Normalize",
			"phase.outputs": "Outputs",
			"phase.noCriteria": "No submission criteria",
			"gate.A": "A · machine",
			"gate.B": "B · human confirm",
			"gate.C": "C · human arbitration",
			"gate.breaker": "circuit-breaker enabled",
			"workspace.placeholder": "Pick an existing workspace, or type a new one…",
			"polish.label": "AI polish",
			"polish.busy": "Polishing…",
			"polish.title": "Ask AI to clarify and sharpen the task goal"
		};
		//#endregion
		//#region lib/types/client-ui/task-create/client/index.js
		/**
		* Task-creation wizard, browser half: one `workbench.drawer.create` seat
		* filling the drawer's create tab with the three-column new-task panel.
		*/
		function apply$4(ctx) {
			ctx.effect(() => ctx.locale.register(NS$3, {
				zh: zh$3,
				en: en$3
			}), "ui-task-create: dictionaries");
			const controller = new TaskCreateController(ctx);
			ctx.slots.inject("workbench.drawer.create", () => ctx.slots.register({
				name: "workbench.drawer.create",
				locale: NS$3,
				inject: () => ({
					hooks: { create: controller.store },
					refresh: () => {
						controller.refresh();
					},
					create: (recipeId, workspaceId, goal) => controller.create(recipeId, workspaceId, "workbench-ui", goal),
					polish: (goal) => controller.polish(goal)
				})
			}, TaskCreateAction));
		}
		//#endregion
		//#region \0dsh-css:E:\Codes\private\dsh-task-flow\src\client-ui\task-create-confirm\client\TaskCreateProposalView.module.css.mjs
		const css$2 = ".RLoCuq_card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-surface-l1);border-radius:10px;flex-direction:column;gap:8px;padding:12px 14px;display:flex}.RLoCuq_title{margin:0;font-weight:600}.RLoCuq_meta{color:var(--dsw-alias-label-secondary);gap:10px;font-size:13px;display:flex}.RLoCuq_goal{margin:0;font-size:13px}.RLoCuq_inherit{cursor:pointer;align-items:center;gap:6px;font-size:13px;display:flex}.RLoCuq_hint{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px}.RLoCuq_actions{justify-content:flex-end;gap:8px;display:flex}";
		const tagId$2 = "@kongfun2018/dsh-task-flow/TaskCreateProposalView.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@kongfun2018/dsh-task-flow";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var TaskCreateProposalView_module_css_default = {
			"actions": "RLoCuq_actions",
			"goal": "RLoCuq_goal",
			"hint": "RLoCuq_hint",
			"title": "RLoCuq_title",
			"meta": "RLoCuq_meta",
			"card": "RLoCuq_card",
			"inherit": "RLoCuq_inherit"
		};
		//#endregion
		//#region lib/types/client-ui/task-create-confirm/client/TaskCreateProposalView.js
		function proposalOf(view) {
			const result = "kind" in view ? view : void 0;
			if (result === void 0 || result.resultView === null) return void 0;
			const data = result.resultView;
			if (typeof data.recipeId !== "string" || typeof data.idempotencyKey !== "string") return void 0;
			return {
				recipeId: data.recipeId,
				goal: typeof data.goal === "string" ? data.goal : "",
				inheritSession: data.inheritSession === true,
				phaseCount: typeof data.phaseCount === "number" ? data.phaseCount : 0,
				checks: typeof data.checks === "number" ? data.checks : 0,
				idempotencyKey: data.idempotencyKey
			};
		}
		/** The keyed tool.call.toolview card for task_create: proposal, inherit toggle, confirm/cancel. */
		function TaskCreateProposalView(props) {
			const { block, t, confirm } = props;
			const proposal = proposalOf(block);
			const [inherit, setInherit] = (0, react.useState)(proposal?.inheritSession === true);
			const [busy, setBusy] = (0, react.useState)(false);
			const [createdTaskId, setCreatedTaskId] = (0, react.useState)(void 0);
			if (proposal === void 0) return null;
			if (createdTaskId !== void 0) return (0, react_jsx_runtime.jsx)("div", {
				className: TaskCreateProposalView_module_css_default.card,
				children: t("confirmed", { taskId: createdTaskId })
			});
			return (0, react_jsx_runtime.jsxs)("div", {
				className: TaskCreateProposalView_module_css_default.card,
				children: [
					(0, react_jsx_runtime.jsx)("p", {
						className: TaskCreateProposalView_module_css_default.title,
						children: t("title")
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: TaskCreateProposalView_module_css_default.meta,
						children: [(0, react_jsx_runtime.jsxs)("span", { children: [
							t("recipe"),
							": ",
							proposal.recipeId
						] }), (0, react_jsx_runtime.jsxs)("span", { children: [
							t("phases", { count: String(proposal.phaseCount) }),
							" · ",
							t("checks", { count: String(proposal.checks) })
						] })]
					}),
					proposal.goal !== "" && (0, react_jsx_runtime.jsxs)("p", {
						className: TaskCreateProposalView_module_css_default.goal,
						children: [
							t("goal"),
							": ",
							proposal.goal
						]
					}),
					(0, react_jsx_runtime.jsxs)("label", {
						className: TaskCreateProposalView_module_css_default.inherit,
						children: [(0, react_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: inherit,
							onChange: (event) => {
								setInherit(event.target.checked);
							}
						}), (0, react_jsx_runtime.jsx)("span", { children: t("inherit.label") })]
					}),
					(0, react_jsx_runtime.jsx)("p", {
						className: TaskCreateProposalView_module_css_default.hint,
						children: t("inherit.hint")
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: TaskCreateProposalView_module_css_default.actions,
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							size: "sm",
							variant: "ghost",
							onClick: () => {},
							children: t("cancel")
						}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							size: "sm",
							variant: "primary",
							disabled: busy,
							onClick: () => {
								setBusy(true);
								confirm(proposal, inherit).then((taskId) => {
									setBusy(false);
									setCreatedTaskId(taskId);
								}).catch(() => {
									setBusy(false);
								});
							},
							children: t("confirm")
						})]
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client-ui/task-create-confirm/client/locales.js
		/** `uiTaskCreateConfirm` namespace dictionaries. */
		const NS$2 = "uiTaskCreateConfirm";
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh$2 = {
			"title": "转为任务 · 请确认",
			"recipe": "推断 Recipe",
			"phases": "{count} 阶段",
			"checks": "{count} 道闸",
			"goal": "任务目标",
			"inherit.label": "从当前会话派生第一阶段",
			"inherit.hint": "fork · seed 继承讨论要点与澄清记录",
			"confirm": "确认创建任务",
			"cancel": "取消",
			"confirmed": "已创建任务 {taskId}"
		};
		/** English dictionary, key-identical to the Chinese source of truth. */
		const en$2 = {
			"title": "Turn into a task · confirm",
			"recipe": "Inferred recipe",
			"phases": "{count} phases",
			"checks": "{count} checks",
			"goal": "Goal",
			"inherit.label": "Derive the first phase from this session",
			"inherit.hint": "fork · seed inherits the discussion and clarification records",
			"confirm": "Confirm and create",
			"cancel": "Cancel",
			"confirmed": "Created task {taskId}"
		};
		//#endregion
		//#region lib/types/client-ui/task-create-confirm/client/index.js
		/**
		* Task-creation confirmation card, browser half: the keyed `tool.call.toolview`
		* renderer for the `task_create` tool. It shows the proposal, the session
		* inheritance toggle, and confirm/cancel; confirm issues createTask through the
		* tasks Remote and flips the card to the created state.
		*/
		function apply$3(ctx) {
			ctx.effect(() => ctx.locale.register(NS$2, {
				zh: zh$2,
				en: en$2
			}), "ui-task-create-confirm: dictionaries");
			ctx.slots.inject("tool.call.toolview", () => ctx.slots.register({
				name: "tool.call.toolview",
				key: "task_create",
				locale: NS$2,
				inject: () => ({ confirm: (proposal, inherit) => confirmTask(ctx, proposal, inherit) })
			}, TaskCreateProposalView));
		}
		/** Issue the create through the tasks Remote, then start it so the engine schedules it. */
		async function confirmTask(ctx, proposal, inherit) {
			const result = await ctx.remote.tasks.createTask(proposal.recipeId, "default", "workbench-ui", proposal.idempotencyKey);
			if (!result.ok) throw new Error("create failed: " + result.error.code);
			const task = result.value;
			const start = {
				actor: "workbench-ui",
				reason: "auto-start after create",
				expectedRevision: task.revision,
				idempotencyKey: proposal.idempotencyKey + "-start"
			};
			const started = await ctx.remote.tasks.startTask(String(task.taskId), start);
			if (!started.ok) throw new Error("start failed: " + started.error.code);
			return String(task.taskId);
		}
		//#endregion
		//#region lib/types/client-ui/task-detail/client/detail.js
		/**
		* The detail panel's state owner. Created once per plugin fiber in `apply`;
		* the snapshot store it exposes is the inject `hooks` source.
		*/
		var TaskDetailController = class {
			/**
			* @param ctx - owning client root context; loads ride this fiber's lifetime.
			*/
			constructor(ctx) {
				this.ctx = ctx;
				this.store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)({
					status: "idle",
					phaseRuns: [],
					gateResults: [],
					digest: void 0,
					rootVersions: []
				});
			}
			/**
			* Load one task, its phase runs, and the gate verdicts of each active
			* submission on demand. A missing task lands in the not-found error state.
			* @param taskId - the task to inspect.
			* @returns when the load settles; failures land in the state's error.
			*/
			async load(taskId) {
				const id = taskId.trim();
				if (id === "") return;
				this.store.set({
					status: "loading",
					phaseRuns: [],
					gateResults: [],
					digest: void 0,
					rootVersions: []
				});
				const task = await this.ctx.remote.tasks.getTask(id);
				if (!task.ok) {
					this.store.set({
						status: "failed",
						error: task.error.code,
						phaseRuns: [],
						gateResults: [],
						digest: void 0,
						rootVersions: []
					});
					return;
				}
				if (task.value === void 0) {
					this.store.set({
						status: "failed",
						error: "not-found",
						phaseRuns: [],
						gateResults: [],
						digest: void 0,
						rootVersions: []
					});
					return;
				}
				const runId = task.value.currentRunId;
				const phases = runId === void 0 ? {
					ok: true,
					value: []
				} : await this.ctx.remote.tasks.listPhaseRuns(String(runId));
				if (!phases.ok) {
					this.store.set({
						status: "failed",
						error: phases.error.code,
						task: task.value,
						phaseRuns: [],
						gateResults: [],
						digest: void 0,
						rootVersions: []
					});
					return;
				}
				const gateResults = [];
				for (const phase of phases.value) {
					if (phase.activeSubmissionId === void 0) continue;
					const gates = await this.ctx.remote.tasks.listGateResults(String(phase.activeSubmissionId));
					if (gates.ok) gateResults.push(...gates.value);
				}
				const digestResult = await this.ctx.remote.digest.digest(id);
				const digest = digestResult.ok ? digestResult.value : void 0;
				const rootVersions = [];
				for (const phase of phases.value) {
					const inputs = await this.ctx.remote.deliverables.listCurrentInputs(String(phase.phaseRunId));
					if (!inputs.ok) continue;
					for (const version of inputs.value) rootVersions.push({
						phaseRunId: String(phase.phaseRunId),
						phaseId: String(phase.phaseId),
						deliverableId: String(version.deliverableId),
						versionId: String(version.versionId)
					});
				}
				this.store.set({
					status: "ready",
					task: task.value,
					phaseRuns: phases.value,
					gateResults,
					digest,
					rootVersions,
					error: void 0
				});
			}
		};
		//#endregion
		//#region \0dsh-css:E:\Codes\private\dsh-task-flow\src\client-ui\task-detail\client\TaskDetailAction.module.css.mjs
		const css$1 = ".hVSv0W_panel{flex-direction:column;gap:8px;display:flex}.hVSv0W_body{flex-direction:column;gap:4px;display:flex}.hVSv0W_taskRow{color:var(--dsw-alias-label-primary);align-items:center;gap:8px;padding:4px 2px;font-size:13px;line-height:18px;display:flex}.hVSv0W_rowDot{flex:none}.hVSv0W_section{color:var(--dsw-alias-label-secondary);margin:6px 0 0;font-size:11px;line-height:16px}.hVSv0W_list{flex-direction:column;gap:2px;margin:0;padding:0;list-style:none;display:flex}.hVSv0W_row{color:var(--dsw-alias-label-primary);border-radius:6px;justify-content:space-between;align-items:center;gap:8px;padding:4px 6px;font-size:12px;line-height:18px;display:flex}.hVSv0W_row:hover{background:var(--dsw-alias-interactive-bg-hover)}.hVSv0W_itemId{text-overflow:ellipsis;white-space:nowrap;font-family:var(--dsw-font-mono,ui-monospace, SFMono-Regular, Menlo, monospace);font-size:12px;overflow:hidden}.hVSv0W_meta{color:var(--dsw-alias-label-tertiary);flex:none;font-size:11px;line-height:16px}.hVSv0W_statusLine,.hVSv0W_errorLine{margin:0;padding:4px 2px;font-size:12px;line-height:18px}.hVSv0W_statusLine{color:var(--dsw-alias-label-tertiary)}.hVSv0W_errorLine{color:var(--dsw-alias-state-error-primary)}.hVSv0W_runLine{color:var(--dsw-alias-label-secondary);margin:4px 0 8px;font-size:12px}.hVSv0W_timeline{flex-direction:column;gap:4px;margin:0;padding:0;list-style:none;display:flex}.hVSv0W_timeline li{border-left:3px solid var(--dsw-alias-border-l2);align-items:baseline;gap:8px;padding:6px 8px;display:flex}.hVSv0W_archivedPhase{opacity:.55;filter:grayscale(.6)}.hVSv0W_gateGroup{margin-bottom:8px}.hVSv0W_gateClass{color:var(--dsw-alias-label-secondary);margin:6px 0 2px;font-size:12px;font-weight:600}.hVSv0W_verbRow{gap:8px;margin-top:12px;display:flex}.hVSv0W_rewindPanel{background:var(--dsw-alias-interactive-bg-hover);border-radius:8px;flex-direction:column;align-items:flex-start;gap:6px;margin-top:10px;padding:10px;display:flex}.hVSv0W_rootList{flex-direction:column;gap:4px;margin-bottom:4px;display:flex}.hVSv0W_rootsHint{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px}.hVSv0W_rootRow{align-items:center;gap:6px;font-size:12px;display:flex}.hVSv0W_patchPanel{background:var(--dsw-alias-interactive-bg-hover);border-radius:8px;flex-direction:column;align-items:stretch;gap:6px;margin-top:10px;padding:10px;display:flex}.hVSv0W_patchNote{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);width:100%;font:inherit;resize:vertical;border-radius:6px;padding:6px 8px;font-size:12px}.hVSv0W_patchActions{gap:6px;display:flex}.hVSv0W_successLine{color:var(--dsw-alias-state-success-primary);margin:0;font-size:12px}.hVSv0W_hintLine{color:var(--dsw-alias-label-secondary);margin:6px 0 0;font-size:12px}";
		const tagId$1 = "@kongfun2018/dsh-task-flow/TaskDetailAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@kongfun2018/dsh-task-flow";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var TaskDetailAction_module_css_default = {
			"runLine": "hVSv0W_runLine",
			"successLine": "hVSv0W_successLine",
			"patchNote": "hVSv0W_patchNote",
			"errorLine": "hVSv0W_errorLine",
			"rootRow": "hVSv0W_rootRow",
			"panel": "hVSv0W_panel",
			"hintLine": "hVSv0W_hintLine",
			"gateClass": "hVSv0W_gateClass",
			"archivedPhase": "hVSv0W_archivedPhase",
			"taskRow": "hVSv0W_taskRow",
			"section": "hVSv0W_section",
			"verbRow": "hVSv0W_verbRow",
			"rewindPanel": "hVSv0W_rewindPanel",
			"meta": "hVSv0W_meta",
			"list": "hVSv0W_list",
			"body": "hVSv0W_body",
			"rootList": "hVSv0W_rootList",
			"statusLine": "hVSv0W_statusLine",
			"rootsHint": "hVSv0W_rootsHint",
			"patchPanel": "hVSv0W_patchPanel",
			"timeline": "hVSv0W_timeline",
			"row": "hVSv0W_row",
			"patchActions": "hVSv0W_patchActions",
			"itemId": "hVSv0W_itemId",
			"rowDot": "hVSv0W_rowDot",
			"gateGroup": "hVSv0W_gateGroup"
		};
		//#endregion
		//#region lib/types/client-ui/task-detail/client/TaskDetailAction.js
		/** Locale keys of the three gate classes, keyed by the GateCheckResult kind. */
		const GATE_CLASS_KEYS = {
			A: "gate.class.a",
			B: "gate.class.b",
			C: "gate.class.c"
		};
		/** Closed-union exhaustiveness fence for the wire task-state set. */
		/* v8 ignore next 3 -- closed-union backstop; only reached if a state is forged */
		function assertNever$1(value) {
			throw new Error(`unhandled task state: ${JSON.stringify(value)}`);
		}
		/** Status marker semantics for the task row. */
		function dotState$1(state) {
			switch (state) {
				case "planning": return "ongoing";
				case "running": return "ongoing";
				case "completed": return "done";
				case "failed": return "error";
				case "awaiting-input": return "warning";
				case "awaiting-decision": return "warning";
				case "pausing": return "warning";
				case "paused": return "warning";
				case "cancelling": return "warning";
				case "cancelled": return "warning";
				/* v8 ignore next -- closed wire state union */
				default: return assertNever$1(state);
			}
		}
		/**
		* Render the drawer's task-detail tab body: the owner-selected task's
		* projection, phase runs, and gate verdicts. A `taskId` change reloads
		* through the controller; no selection renders the empty state.
		* @param props - composed slot props (owner taskId, locale, inject face).
		* @returns the detail panel filling the drawer's tab body.
		*/
		function TaskDetailAction(props) {
			const { taskId, t, useDetail, load, requestRewind, requestPatch, openInbox } = props;
			const detail = useDetail((state) => state);
			const [showRoots, setShowRoots] = (0, react.useState)(false);
			const [selected, setSelected] = (0, react.useState)([]);
			const [pending, setPending] = (0, react.useState)(false);
			const [preview, setPreview] = (0, react.useState)(void 0);
			const [rewindError, setRewindError] = (0, react.useState)(void 0);
			const [showPatch, setShowPatch] = (0, react.useState)(false);
			const [patchNote, setPatchNote] = (0, react.useState)("");
			const [patchPending, setPatchPending] = (0, react.useState)(false);
			const [patchError, setPatchError] = (0, react.useState)(void 0);
			(0, react.useEffect)(() => {
				if (taskId !== void 0) load(taskId);
			}, [taskId, load]);
			(0, react.useEffect)(() => {
				setShowRoots(false);
				setPreview(void 0);
				setRewindError(void 0);
				setShowPatch(false);
				setPatchNote("");
				setPatchError(void 0);
			}, [taskId]);
			const requestRewindFlow = async () => {
				if (taskId === void 0 || selected.length === 0) return;
				setPending(true);
				setRewindError(void 0);
				try {
					const result = await requestRewind(taskId, [...selected], "workbench-ui", crypto.randomUUID());
					setPreview(result);
				} catch (error) {
					const code = error.code ?? "unknown";
					setRewindError(code);
				} finally {
					setPending(false);
				}
			};
			const requestPatchFlow = async () => {
				if (taskId === void 0) return;
				const target = detail.phaseRuns.find((run) => run.activeSubmissionId !== void 0);
				if (target === void 0 || patchNote.trim().length === 0) return;
				setPatchPending(true);
				setPatchError(void 0);
				try {
					await requestPatch(taskId, String(target.phaseRunId), patchNote.trim(), "workbench-ui", crypto.randomUUID());
					setPatchNote("");
					setShowPatch(false);
					load(taskId);
				} catch (error) {
					const code = error.code ?? "unknown";
					setPatchError(code);
				} finally {
					setPatchPending(false);
				}
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: TaskDetailAction_module_css_default.panel,
				children: [
					taskId === void 0 && (0, react_jsx_runtime.jsx)("p", {
						className: TaskDetailAction_module_css_default.statusLine,
						children: t("empty")
					}),
					taskId !== void 0 && detail.status === "loading" && (0, react_jsx_runtime.jsx)("p", {
						className: TaskDetailAction_module_css_default.statusLine,
						children: t("loading")
					}),
					taskId !== void 0 && detail.status === "failed" && (0, react_jsx_runtime.jsx)("p", {
						className: TaskDetailAction_module_css_default.errorLine,
						role: "alert",
						children: detail.error === "not-found" ? t("not-found") : t("error.load", { code: detail.error ?? "" })
					}),
					taskId !== void 0 && detail.status === "ready" && detail.task !== void 0 && (0, react_jsx_runtime.jsxs)("div", {
						className: TaskDetailAction_module_css_default.body,
						children: [
							(0, react_jsx_runtime.jsxs)("div", {
								className: TaskDetailAction_module_css_default.taskRow,
								children: [
									(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, {
										state: dotState$1(detail.task.state),
										className: TaskDetailAction_module_css_default.rowDot
									}),
									(0, react_jsx_runtime.jsx)("span", {
										className: TaskDetailAction_module_css_default.itemId,
										children: detail.task.taskId
									}),
									(0, react_jsx_runtime.jsxs)("span", {
										className: TaskDetailAction_module_css_default.meta,
										children: [
											detail.task.state,
											" · ",
											t("revision", { revision: detail.task.revision })
										]
									})
								]
							}),
							detail.digest !== void 0 && detail.digest.runs.length > 1 && (0, react_jsx_runtime.jsxs)("p", {
								className: TaskDetailAction_module_css_default.runLine,
								children: [t("runs.current", { runId: detail.digest.runs[0]?.runId ?? "" }), detail.digest.runs.slice(1).map((run) => " · " + t("runs.archived", { runId: run.runId }))]
							}),
							(0, react_jsx_runtime.jsx)("p", {
								className: TaskDetailAction_module_css_default.section,
								children: t("phases")
							}),
							detail.phaseRuns.length === 0 && (0, react_jsx_runtime.jsx)("p", {
								className: TaskDetailAction_module_css_default.statusLine,
								children: t("none")
							}),
							(0, react_jsx_runtime.jsx)("ol", {
								className: TaskDetailAction_module_css_default.timeline,
								children: detail.phaseRuns.map((phase) => {
									const archived = phase.state === "superseded" || phase.state === "stale" || phase.state === "cancelled";
									return (0, react_jsx_runtime.jsxs)("li", {
										className: archived ? TaskDetailAction_module_css_default.archivedPhase : void 0,
										children: [(0, react_jsx_runtime.jsx)("span", {
											className: TaskDetailAction_module_css_default.itemId,
											children: phase.phaseId
										}), (0, react_jsx_runtime.jsxs)("span", {
											className: TaskDetailAction_module_css_default.meta,
											children: [
												phase.state === "superseded" ? t("phase.superseded") : phase.state,
												" ",
												"· ",
												t("revision", { revision: phase.revision })
											]
										})]
									}, phase.phaseRunId);
								})
							}),
							(0, react_jsx_runtime.jsx)("p", {
								className: TaskDetailAction_module_css_default.section,
								children: t("gates")
							}),
							detail.gateResults.length === 0 && (0, react_jsx_runtime.jsx)("p", {
								className: TaskDetailAction_module_css_default.statusLine,
								children: t("none")
							}),
							[
								"A",
								"B",
								"C"
							].map((kind) => {
								const checks = detail.gateResults.filter((gate) => (gate.kind ?? "A") === kind);
								if (checks.length === 0) return null;
								return (0, react_jsx_runtime.jsxs)("div", {
									className: TaskDetailAction_module_css_default.gateGroup,
									children: [(0, react_jsx_runtime.jsx)("p", {
										className: TaskDetailAction_module_css_default.gateClass,
										children: t(GATE_CLASS_KEYS[kind])
									}), (0, react_jsx_runtime.jsx)("ul", {
										className: TaskDetailAction_module_css_default.list,
										children: checks.map((gate) => (0, react_jsx_runtime.jsxs)("li", {
											className: TaskDetailAction_module_css_default.row,
											children: [(0, react_jsx_runtime.jsx)("span", {
												className: TaskDetailAction_module_css_default.itemId,
												children: gate.checkId
											}), (0, react_jsx_runtime.jsxs)("span", {
												className: TaskDetailAction_module_css_default.meta,
												children: [gate.passed ? t("passed") : t("failed"), gate.stale === true ? t("gate.stale") : ""]
											})]
										}, `${String(gate.submissionId)}:${gate.checkId}`))
									})]
								}, kind);
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: TaskDetailAction_module_css_default.verbRow,
								children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									size: "sm",
									variant: "outline",
									onClick: () => {
										setShowPatch((show) => !show);
									},
									children: t("verb.patch")
								}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									size: "sm",
									variant: "primary",
									disabled: pending,
									onClick: () => {
										setShowRoots((show) => !show);
										setPreview(void 0);
										setRewindError(void 0);
									},
									children: t("verb.rewind")
								})]
							}),
							showPatch && (0, react_jsx_runtime.jsxs)("div", {
								className: TaskDetailAction_module_css_default.patchPanel,
								children: [
									(0, react_jsx_runtime.jsx)("p", {
										className: TaskDetailAction_module_css_default.section,
										children: t("patch.title")
									}),
									(0, react_jsx_runtime.jsx)("textarea", {
										className: TaskDetailAction_module_css_default.patchNote,
										value: patchNote,
										onChange: (event) => {
											setPatchNote(event.target.value);
										},
										placeholder: t("patch.placeholder"),
										rows: 3
									}),
									(0, react_jsx_runtime.jsxs)("div", {
										className: TaskDetailAction_module_css_default.patchActions,
										children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											size: "sm",
											variant: "primary",
											disabled: patchPending || patchNote.trim().length === 0,
											onClick: () => {
												requestPatchFlow();
											},
											children: patchPending ? t("patch.pending") : t("patch.submit")
										}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											size: "sm",
											variant: "outline",
											onClick: () => {
												setShowPatch(false);
											},
											children: t("patch.cancel")
										})]
									}),
									patchError !== void 0 && (0, react_jsx_runtime.jsx)("p", {
										className: TaskDetailAction_module_css_default.errorLine,
										role: "alert",
										children: t("patch.error", { code: patchError })
									})
								]
							}),
							showRoots && preview === void 0 && (0, react_jsx_runtime.jsxs)("div", {
								className: TaskDetailAction_module_css_default.rewindPanel,
								children: [
									(0, react_jsx_runtime.jsx)("p", {
										className: TaskDetailAction_module_css_default.section,
										children: t("rewind.title")
									}),
									detail.rootVersions.length === 0 && (0, react_jsx_runtime.jsx)("p", {
										className: TaskDetailAction_module_css_default.statusLine,
										children: t("rewind.rootsEmpty")
									}),
									detail.rootVersions.length > 0 && (0, react_jsx_runtime.jsxs)("div", {
										className: TaskDetailAction_module_css_default.rootList,
										children: [(0, react_jsx_runtime.jsx)("p", {
											className: TaskDetailAction_module_css_default.rootsHint,
											children: t("rewind.rootsHint")
										}), detail.rootVersions.map((root) => {
											const rootKey = String(root.versionId);
											const checked = selected.includes(rootKey);
											const toggle = () => {
												setSelected((prev) => checked ? prev.filter((id) => id !== rootKey) : [...prev, rootKey]);
											};
											return (0, react_jsx_runtime.jsxs)("label", {
												className: TaskDetailAction_module_css_default.rootRow,
												children: [
													(0, react_jsx_runtime.jsx)("input", {
														type: "checkbox",
														checked,
														onChange: toggle
													}),
													(0, react_jsx_runtime.jsx)("span", {
														className: TaskDetailAction_module_css_default.itemId,
														children: root.deliverableId
													}),
													(0, react_jsx_runtime.jsxs)("span", {
														className: TaskDetailAction_module_css_default.meta,
														children: [
															root.phaseId,
															" · ",
															root.versionId
														]
													})
												]
											}, rootKey);
										})]
									}),
									rewindError !== void 0 && (0, react_jsx_runtime.jsx)("p", {
										className: TaskDetailAction_module_css_default.errorLine,
										role: "alert",
										children: t("rewind.error", { code: rewindError })
									}),
									(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										size: "sm",
										variant: "primary",
										disabled: selected.length === 0 || pending,
										onClick: () => {
											requestRewindFlow();
										},
										children: pending ? t("loading") : t("rewind.confirm")
									}),
									(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										size: "sm",
										variant: "outline",
										onClick: () => {
											setShowRoots(false);
										},
										children: t("rewind.cancel")
									})
								]
							}),
							preview !== void 0 && (0, react_jsx_runtime.jsxs)("div", {
								className: TaskDetailAction_module_css_default.rewindPanel,
								children: [
									(0, react_jsx_runtime.jsx)("p", {
										className: TaskDetailAction_module_css_default.section,
										children: t("rewind.previewTitle")
									}),
									(0, react_jsx_runtime.jsxs)("ul", {
										className: TaskDetailAction_module_css_default.list,
										children: [
											(0, react_jsx_runtime.jsx)("li", {
												className: TaskDetailAction_module_css_default.row,
												children: (0, react_jsx_runtime.jsx)("span", {
													className: TaskDetailAction_module_css_default.itemId,
													children: t("rewind.previewVersions", { count: preview.invalidatedVersionIds.length })
												})
											}),
											(0, react_jsx_runtime.jsx)("li", {
												className: TaskDetailAction_module_css_default.row,
												children: (0, react_jsx_runtime.jsx)("span", {
													className: TaskDetailAction_module_css_default.itemId,
													children: t("rewind.previewPhases", { count: preview.rerunPhaseIds.length })
												})
											}),
											(0, react_jsx_runtime.jsx)("li", {
												className: TaskDetailAction_module_css_default.row,
												children: (0, react_jsx_runtime.jsx)("span", {
													className: TaskDetailAction_module_css_default.itemId,
													children: t("rewind.previewClarifications", { count: preview.reusableClarificationIds.length })
												})
											})
										]
									}),
									(0, react_jsx_runtime.jsx)("p", {
										className: TaskDetailAction_module_css_default.successLine,
										role: "status",
										children: t("rewind.success")
									}),
									(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										size: "sm",
										variant: "primary",
										onClick: openInbox,
										children: t("rewind.goInbox")
									})
								]
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client-ui/task-detail/client/locales.js
		/** `taskDetail` namespace dictionaries. */
		/** Dictionary namespace owned by this plugin. */
		const NS$1 = "taskDetail";
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh$1 = {
			"runs.current": "当前 Run #{runId}",
			"runs.archived": "已归档 Run #{runId}（rewind 退役）",
			"gate.class.a": "A · 机器强制",
			"gate.class.b": "B · 人工确认",
			"gate.class.c": "C · 人工仲裁",
			"gate.stale": "（已失效）",
			"phase.superseded": "已归档",
			"verb.patch": "patch · 原地修正",
			"verb.rewind": "rewind · 打回重走",
			"hint.patch": "进入上游会话修正后，Gate 将重验。",
			"patch.title": "提交产物修正",
			"patch.placeholder": "描述要修正的产物内容……",
			"patch.submit": "提交修正",
			"patch.pending": "提交中…",
			"patch.cancel": "取消",
			"patch.error": "修正失败：{code}",
			"rewind.title": "打回重走",
			"rewind.rootsHint": "选择打回起点（当前有效输入版本）：",
			"rewind.rootsEmpty": "当前运行无可打回的产物版本",
			"rewind.confirm": "发起打回",
			"rewind.previewTitle": "影响预览",
			"rewind.previewVersions": "{count} 个产物版本将失效",
			"rewind.previewPhases": "{count} 个阶段将在新 Run 重开",
			"rewind.previewClarifications": "{count} 条澄清可复用",
			"rewind.goInbox": "前往审批中心处理决策",
			"rewind.success": "打回决策已挂载，请到审批中心确认。",
			"rewind.error": "打回失败：{code}",
			"rewind.cancel": "取消",
			"loading": "加载中…",
			"empty": "从任务列表选择一个任务查看详情",
			"not-found": "任务不存在",
			"error.load": "加载失败：{code}",
			"revision": "版本 {revision}",
			"phases": "阶段运行",
			"gates": "门禁结论",
			"none": "无",
			"passed": "通过",
			"failed": "未通过"
		};
		/** English dictionary, key-identical to the Chinese source of truth. */
		const en$1 = {
			"runs.current": "Current run #{runId}",
			"runs.archived": "Archived run #{runId} (rewound)",
			"gate.class.a": "A · machine-mandatory",
			"gate.class.b": "B · human confirm",
			"gate.class.c": "C · human arbitration",
			"gate.stale": " (staled)",
			"phase.superseded": "archived",
			"verb.patch": "patch · fix in place",
			"verb.rewind": "rewind · restart from",
			"hint.patch": "Fix upstream in the session; the Gate re-verifies.",
			"patch.title": "Submit a product revision",
			"patch.placeholder": "Describe the product content to correct…",
			"patch.submit": "Submit revision",
			"patch.pending": "Submitting…",
			"patch.cancel": "Cancel",
			"patch.error": "Patch failed: {code}",
			"rewind.title": "Rewind",
			"rewind.rootsHint": "Choose rewind roots (current input versions):",
			"rewind.rootsEmpty": "No rewindable product versions on this run",
			"rewind.confirm": "Request rewind",
			"rewind.previewTitle": "Impact preview",
			"rewind.previewVersions": "{count} product versions will be invalidated",
			"rewind.previewPhases": "{count} phases will re-open on the new run",
			"rewind.previewClarifications": "{count} clarifications reusable",
			"rewind.goInbox": "Open approvals to decide",
			"rewind.success": "Rewind decision attached; confirm it in approvals.",
			"rewind.error": "Rewind failed: {code}",
			"rewind.cancel": "Cancel",
			"loading": "Loading…",
			"empty": "Select a task from the list to see its detail",
			"not-found": "Task not found",
			"error.load": "Load failed: {code}",
			"revision": "rev {revision}",
			"phases": "Phase runs",
			"gates": "Gate verdicts",
			"none": "none",
			"passed": "passed",
			"failed": "failed"
		};
		//#endregion
		//#region lib/types/client-ui/task-detail/client/index.js
		/**
		* Client plugin body: the dictionaries, the controller, and the drawer seat.
		* @param ctx - client root context.
		*/
		function apply$2(ctx) {
			ctx.effect(() => ctx.locale.register(NS$1, {
				zh: zh$1,
				en: en$1
			}), "ui-task-detail: dictionaries");
			const detail = new TaskDetailController(ctx);
			ctx.slots.inject("workbench.drawer.detail", () => ctx.slots.register({
				name: "workbench.drawer.detail",
				locale: NS$1,
				inject: () => ({
					hooks: { detail: detail.store },
					load: (taskId) => {
						detail.load(taskId);
					},
					requestRewind: async (taskId, roots, actor, idemKey) => {
						const result = await ctx.remote.rewind.requestRewind(taskId, roots, actor, idemKey);
						if (!result.ok) throw Object.assign(new Error(result.error.message), { code: result.error.code });
						return result.value;
					},
					requestPatch: async (taskId, phaseRunId, note, actor, idemKey) => {
						const result = await ctx.remote.tasks.requestPatch(taskId, phaseRunId, note, {
							actor,
							reason: "workbench-detail patch",
							expectedRevision: -1,
							idempotencyKey: idemKey
						});
						if (!result.ok) throw Object.assign(new Error(result.error.message), { code: result.error.code });
						return result.value;
					}
				})
			}, TaskDetailAction));
		}
		//#endregion
		//#region lib/types/client-ui/task-list/client/taskList.js
		/** Phase states that settle a run row; everything before them counts as current. */
		const PHASE_SETTLED = /* @__PURE__ */ new Set([
			"passed",
			"failed",
			"stale",
			"superseded",
			"cancelled"
		]);
		/** Phase states that park a run on a Gate, signalling a waiting decision. */
		const GATE_PAUSED = /* @__PURE__ */ new Set([
			"gate-running",
			"awaiting-decision",
			"awaiting-input",
			"submitting",
			"submitted"
		]);
		/** Class order for choosing the highest-priority pending check. */
		const GATE_ORDER = {
			A: 0,
			B: 1,
			C: 2
		};
		/**
		* Derive one run's phase progress: the first unsettled phase is current.
		* @param phaseRuns - the run's phase runs, in recording order.
		* @returns the 1-based current index and the total.
		*/
		function phaseProgressOf(phaseRuns) {
			const total = phaseRuns.length;
			const index = phaseRuns.findIndex((run) => !PHASE_SETTLED.has(run.state));
			return {
				current: index === -1 ? total : index + 1,
				total
			};
		}
		/**
		* Derive a task's gate pause class from its latest unsettled phase run: the
		* gate class of the first failing check on that phase's active submission.
		* @param runs - the run's phase runs, in recording order.
		* @param gates - the gate results of a submission, or undefined on a dropped read.
		* @returns the paused gate class, or undefined when no gate is waiting.
		*/
		function gatePauseOf(runs, gates) {
			if (runs.find((run) => GATE_PAUSED.has(run.state)) === void 0 || gates === void 0) return void 0;
			return gates.filter((gate) => gate.passed === false || gate.stale === true).map((gate) => gate.kind ?? "A").sort((a, b) => GATE_ORDER[a] - GATE_ORDER[b])[0];
		}
		/** Monotonic seed for idempotency keys; collisions within a page are impossible. */
		let idempotencySeq = 0;
		/** Fresh idempotency key for one task list command. */
		function nextIdempotencyKey(verb, taskId) {
			idempotencySeq += 1;
			return `task-list-${verb}-${taskId}-${Date.now().toString(36)}-${idempotencySeq}`;
		}
		/** Compare-and-set mutation context for one verb over the row's revision. */
		function mutationOf(verb, task) {
			return {
				actor: "task-list",
				reason: `task-list ${verb}`,
				expectedRevision: task.revision,
				idempotencyKey: nextIdempotencyKey(verb, task.taskId)
			};
		}
		/** Order the list rows: newest creation first, taskId as the stable tiebreak. */
		function byCreation(left, right) {
			return right.createdAt - left.createdAt || (left.taskId < right.taskId ? -1 : 1);
		}
		/** Task states whose row offers Resume; Paused is the only resumable one. */
		function resumable(state) {
			return state === "paused";
		}
		/** Task states whose row offers Pause; only an actively running task pauses. */
		function pausable(state) {
			return state === "running";
		}
		/** Task states whose row offers Cancel; terminal rows act on nothing. */
		function cancellable(state) {
			return state === "planning" || state === "running" || state === "pausing" || state === "paused";
		}
		/**
		* Verbs each task state offers the list row.
		* @param task - the task projection whose state gates the verb set.
		* @returns the verbs the row may dispatch, in display order.
		*/
		function verbsFor(task) {
			const verbs = [];
			if (pausable(task.state)) verbs.push("pause");
			if (resumable(task.state)) verbs.push("resume");
			if (cancellable(task.state)) verbs.push("cancel");
			return verbs;
		}
		/**
		* The task list's state owner. Created once per plugin fiber in `apply`; the
		* snapshot store it exposes is the inject `hooks` source, so components
		* subscribe through the renderer-bound hook and never see this object.
		*/
		var TaskListController = class {
			/**
			* @param ctx - owning client root context; subscriptions and refreshes ride
			* this fiber's lifetime.
			*/
			constructor(ctx) {
				this.ctx = ctx;
				this.store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)({
					status: "loading",
					tasks: [],
					phaseProgress: /* @__PURE__ */ new Map(),
					taskGates: /* @__PURE__ */ new Map(),
					recentActivity: /* @__PURE__ */ new Map(),
					updatedAt: 0
				});
				ctx.effect(() => ctx.remote.$on("task/updated", (task) => {
					this.fold(task);
				}), "task-list: task/updated fold");
				ctx.on("connection/reset", () => {
					this.refresh();
				});
				this.refresh();
			}
			/**
			* Fold one forwarded task projection: newer revisions replace the row,
			* unknown tasks join the list, and stale or repeated deliveries drop.
			* @param task - the post-commit task projection the host forwarded.
			*/
			fold(task) {
				const { tasks } = this.store.getSnapshot();
				const index = tasks.findIndex((row) => row.taskId === task.taskId);
				const existing = index >= 0 ? tasks[index] : void 0;
				if (existing !== void 0 && existing.revision >= task.revision) return;
				const next = index >= 0 ? tasks.with(index, task) : [...tasks, task];
				next.sort(byCreation);
				this.store.set({
					...this.store.getSnapshot(),
					tasks: next,
					updatedAt: Date.now()
				});
				this.refreshProgress(task);
			}
			/**
			* Re-read one task's phase progress after a fold; a dropped read keeps the
			* last known progress (the next full refresh recomputes it).
			* @param task - the folded task projection.
			*/
			async refreshProgress(task) {
				if (task.currentRunId === void 0) return;
				const runs = await this.ctx.remote.tasks.listPhaseRuns(String(task.currentRunId));
				if (!runs.ok) return;
				const snapshot = this.store.getSnapshot();
				if (!snapshot.tasks.some((row) => row.taskId === task.taskId)) return;
				const phaseProgress = new Map(snapshot.phaseProgress);
				const taskGates = new Map(snapshot.taskGates);
				phaseProgress.set(task.taskId, phaseProgressOf(runs.value));
				const paused = runs.value.find((run) => GATE_PAUSED.has(run.state));
				let gate = void 0;
				if (paused !== void 0 && paused.activeSubmissionId !== void 0) {
					const gates = await this.ctx.remote.tasks.listGateResults(String(paused.activeSubmissionId));
					gate = gates.ok ? gatePauseOf(runs.value, gates.value) : void 0;
				}
				taskGates.set(task.taskId, gate);
				const recentActivity = new Map(snapshot.recentActivity);
				recentActivity.set(task.taskId, await this.recentActivityOf(task, runs.value));
				this.store.set({
					...snapshot,
					phaseProgress,
					taskGates,
					recentActivity
				});
			}
			/**
			* Latest recorded activity of a task: the newest active submission's
			* submittedAt across its current run's phase runs, falling back to the
			* task's createdAt when nothing was submitted yet. A dropped submission
			* read keeps the creation time — the row still shows a stable 最近活跃.
			* @param task - the task projection whose activity to derive.
			* @param runs - the current run's phase runs, in recording order.
			* @returns the activity epoch ms.
			*/
			async recentActivityOf(task, runs) {
				let latest = task.createdAt;
				for (const run of runs) {
					if (run.activeSubmissionId === void 0) continue;
					const submission = await this.ctx.remote.tasks.getSubmission(String(run.activeSubmissionId));
					if (submission.ok && submission.value !== void 0 && submission.value.submittedAt > latest) latest = submission.value.submittedAt;
				}
				return latest;
			}
			/**
			* Reload the full task list from the tasks Remote.
			* @returns when the load settles; failures land in the state's error.
			*/
			async refresh() {
				const result = await this.ctx.remote.tasks.listTasks();
				if (!result.ok) {
					this.store.set({
						...this.store.getSnapshot(),
						status: "failed",
						error: result.error.code
					});
					return;
				}
				const tasks = [...result.value].sort(byCreation);
				const entries = await Promise.all(tasks.map(async (task) => {
					if (task.currentRunId === void 0) return [
						task.taskId,
						{
							current: 0,
							total: 0
						},
						void 0,
						task.createdAt
					];
					const runs = await this.ctx.remote.tasks.listPhaseRuns(String(task.currentRunId));
					if (!runs.ok) return [
						task.taskId,
						{
							current: 0,
							total: 0
						},
						void 0,
						task.createdAt
					];
					const progress = phaseProgressOf(runs.value);
					const paused = runs.value.find((run) => GATE_PAUSED.has(run.state));
					let gate = void 0;
					if (paused !== void 0 && paused.activeSubmissionId !== void 0) {
						const gates = await this.ctx.remote.tasks.listGateResults(String(paused.activeSubmissionId));
						gate = gates.ok ? gatePauseOf(runs.value, gates.value) : void 0;
					}
					const activity = await this.recentActivityOf(task, runs.value);
					return [
						task.taskId,
						progress,
						gate,
						activity
					];
				}));
				const phaseProgress = new Map(entries.map(([id, progress]) => [id, progress]));
				const taskGates = new Map(entries.map(([id, , gate]) => [id, gate]));
				const recentActivity = new Map(entries.map(([id, , , activity]) => [id, activity]));
				const { error } = this.store.getSnapshot();
				this.store.set({
					status: "ready",
					tasks,
					phaseProgress,
					taskGates,
					recentActivity,
					error,
					updatedAt: Date.now()
				});
			}
			/**
			* Issue one verb against a task row.
			* @param taskId - the row's task id.
			* @param verb - the verb to issue.
			* @returns when the command settles; the row folds on success, and a
			* failure records the code and resyncs through {@link refresh} (the
			* compare-and-set revision is the guard, never a client-side fence).
			*/
			async command(taskId, verb) {
				const task = this.store.getSnapshot().tasks.find((row) => row.taskId === taskId);
				if (task === void 0) return;
				const mutation = mutationOf(verb, task);
				const result = verb === "pause" ? await this.ctx.remote.tasks.requestPause(taskId, mutation) : verb === "resume" ? await this.ctx.remote.tasks.resume(taskId, mutation) : await this.ctx.remote.tasks.requestCancel(taskId, mutation);
				if (result.ok) {
					this.fold(result.value);
					this.store.set({
						...this.store.getSnapshot(),
						error: void 0
					});
					return;
				}
				this.store.set({
					...this.store.getSnapshot(),
					error: result.error.code
				});
				await this.refresh();
			}
		};
		//#endregion
		//#region \0dsh-css:E:\Codes\private\dsh-task-flow\src\client-ui\task-list\client\TaskListAction.module.css.mjs
		const css = ".SaoCrW_panel{flex-direction:column;gap:8px;display:flex}.SaoCrW_head{justify-content:flex-end;align-items:center;padding-bottom:2px;display:flex}.SaoCrW_list{flex-direction:column;gap:2px;margin:0;padding:0;list-style:none;display:flex;overflow:visible}.SaoCrW_row{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1);width:100%;min-height:40px;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:10px;align-items:center;gap:8px;padding:6px 8px;font-size:13px;line-height:18px;display:flex}.SaoCrW_row:hover,.SaoCrW_row:focus-visible{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l2)}.SaoCrW_row:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-1px}.SaoCrW_rowDot{flex:none}.SaoCrW_rowMain{flex-direction:column;flex:1;gap:1px;min-width:0;display:flex}.SaoCrW_taskId{text-overflow:ellipsis;white-space:nowrap;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;overflow:hidden}.SaoCrW_meta{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}.SaoCrW_gateBadge{color:var(--dsw-alias-state-warn-primary);border:1px solid var(--dsw-alias-state-warn-primary);border-radius:10px;margin-left:6px;padding:1px 6px;font-size:11px;line-height:16px}.SaoCrW_activity{color:var(--dsw-alias-text-tertiary)}.SaoCrW_verbs{flex:none;gap:4px;display:flex}.SaoCrW_statusLine,.SaoCrW_errorLine{margin:0;padding:4px 2px;font-size:12px;line-height:18px}.SaoCrW_statusLine{color:var(--dsw-alias-label-tertiary)}.SaoCrW_errorLine{color:var(--dsw-alias-state-error-primary)}.SaoCrW_footer{justify-content:flex-end;align-items:center;gap:8px;padding-top:2px;display:flex}.SaoCrW_syncedLine{color:var(--dsw-alias-state-success-primary);margin:0;font-size:12px;line-height:18px}";
		const tagId = "@kongfun2018/dsh-task-flow/TaskListAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@kongfun2018/dsh-task-flow";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var TaskListAction_module_css_default = {
			"panel": "SaoCrW_panel",
			"verbs": "SaoCrW_verbs",
			"statusLine": "SaoCrW_statusLine",
			"footer": "SaoCrW_footer",
			"syncedLine": "SaoCrW_syncedLine",
			"meta": "SaoCrW_meta",
			"errorLine": "SaoCrW_errorLine",
			"row": "SaoCrW_row",
			"gateBadge": "SaoCrW_gateBadge",
			"list": "SaoCrW_list",
			"rowDot": "SaoCrW_rowDot",
			"taskId": "SaoCrW_taskId",
			"head": "SaoCrW_head",
			"rowMain": "SaoCrW_rowMain",
			"activity": "SaoCrW_activity"
		};
		//#endregion
		//#region lib/types/client-ui/task-list/client/TaskListAction.js
		/**
		* Compact relative activity descriptor, mirroring the session list's time
		* display: just now / minutes / hours / days / an absolute short date beyond
		* a week. The row translates it through the locale keys.
		* @param epoch - the activity timestamp in epoch ms.
		* @param now - the reference time (usually Date.now()).
		* @returns a locale key plus its count, or an absolute date string.
		*/
		function activityDescriptor(epoch, now) {
			const delta = now - epoch;
			if (delta < 6e4) return {
				key: "time.justNow",
				count: 0
			};
			if (delta < 36e5) return {
				key: "time.minutesAgo",
				count: Math.floor(delta / 6e4)
			};
			if (delta < 864e5) return {
				key: "time.hoursAgo",
				count: Math.floor(delta / 36e5)
			};
			if (delta < 6048e5) return {
				key: "time.daysAgo",
				count: Math.floor(delta / 864e5)
			};
			return new Date(epoch).toLocaleDateString();
		}
		/** Translate one activity descriptor through its locale key. */
		function renderActivity(epoch, now, t) {
			const parsed = activityDescriptor(epoch, now);
			return typeof parsed === "string" ? parsed : t(parsed.key, { count: String(parsed.count) });
		}
		/** Closed-union exhaustiveness fence for the wire state set. */
		function assertNever(value) {
			/* v8 ignore next -- unreachable while the wire state union stays closed */
			throw new Error(`unhandled task state: ${JSON.stringify(value)}`);
		}
		/** Status marker semantics for one task row. */
		function dotState(state) {
			switch (state) {
				case "planning": return "ongoing";
				case "running": return "ongoing";
				case "completed": return "done";
				case "failed": return "error";
				case "awaiting-input": return "warning";
				case "awaiting-decision": return "warning";
				case "pausing": return "warning";
				case "paused": return "warning";
				case "cancelling": return "warning";
				case "cancelled": return "warning";
				/* v8 ignore next -- closed wire state union */
				default: return assertNever(state);
			}
		}
		/** Human status word for one task row. */
		function stateLabel(state, t) {
			switch (state) {
				case "planning": return t("state.planning");
				case "running": return t("state.running");
				case "awaiting-input": return t("state.awaiting-input");
				case "awaiting-decision": return t("state.awaiting-decision");
				case "pausing": return t("state.pausing");
				case "paused": return t("state.paused");
				case "cancelling": return t("state.cancelling");
				case "cancelled": return t("state.cancelled");
				case "completed": return t("state.completed");
				case "failed": return t("state.failed");
				/* v8 ignore next -- closed wire state union */
				default: return assertNever(state);
			}
		}
		/** One task row: state dot, identity, recipe, phase progress, gate badge, recent activity, verbs. */
		function TaskRow({ task, progress, gate, activity, t, onCommand, onOpen }) {
			const verbs = verbsFor(task);
			return (0, react_jsx_runtime.jsxs)("li", {
				className: TaskListAction_module_css_default.row,
				tabIndex: 0,
				role: "button",
				"aria-label": t("open", { taskId: task.taskId }),
				onClick: () => {
					onOpen(task.taskId);
				},
				onKeyDown: (event) => {
					if (event.key === "Enter" || event.key === " ") onOpen(task.taskId);
				},
				children: [
					(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, {
						state: dotState(task.state),
						className: TaskListAction_module_css_default.rowDot
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: TaskListAction_module_css_default.rowMain,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: TaskListAction_module_css_default.taskId,
							children: task.taskId
						}), (0, react_jsx_runtime.jsxs)("span", {
							className: TaskListAction_module_css_default.meta,
							children: [
								stateLabel(task.state, t),
								" · ",
								t("revision", { revision: task.revision }),
								" ",
								"· ",
								t("recipe", { recipeId: String(task.pinnedRecipe.recipeId) }),
								progress !== void 0 && progress.total > 0 && [" · ", t("phase.progress", {
									current: String(progress.current),
									total: String(progress.total)
								})],
								gate !== void 0 && (0, react_jsx_runtime.jsx)("span", {
									className: TaskListAction_module_css_default.gateBadge,
									children: t("gate.badge", { kind: gate })
								}),
								" · ",
								(0, react_jsx_runtime.jsx)("span", {
									className: TaskListAction_module_css_default.activity,
									children: t("recent", { time: renderActivity(activity, Date.now(), t) })
								})
							]
						})]
					}),
					verbs.length > 0 && (0, react_jsx_runtime.jsx)("div", {
						className: TaskListAction_module_css_default.verbs,
						children: verbs.map((verb) => (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							size: "sm",
							variant: "ghost",
							onClick: (event) => {
								event.stopPropagation();
								onCommand(task.taskId, verb);
							},
							children: t(`verb.${verb}`)
						}, verb))
					})
				]
			});
		}
		/**
		* Render the drawer's task-list tab body: a focused list over the same task
		* rows without KPI/chart chrome; opening a row switches the drawer to that
		* task's detail.
		* @param props - composed slot props (owner openDetail, locale, inject face).
		* @returns the task list panel filling the drawer's tab body.
		*/
		function TaskListAction(props) {
			const { openDetail, openCreate, t, useList, refresh, command } = props;
			const list = useList((state) => state);
			const [refreshing, setRefreshing] = (0, react.useState)(false);
			const [syncedAt, setSyncedAt] = (0, react.useState)(void 0);
			const handleRefresh = async () => {
				setRefreshing(true);
				try {
					await refresh();
					setSyncedAt(Date.now());
				} finally {
					setRefreshing(false);
				}
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: TaskListAction_module_css_default.panel,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: TaskListAction_module_css_default.head,
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							size: "sm",
							variant: "primary",
							onClick: () => {
								openCreate();
							},
							children: t("create")
						})
					}),
					list.status === "loading" && (0, react_jsx_runtime.jsx)("p", {
						className: TaskListAction_module_css_default.statusLine,
						children: t("loading")
					}),
					list.error !== void 0 && (0, react_jsx_runtime.jsx)("p", {
						className: TaskListAction_module_css_default.errorLine,
						role: "alert",
						children: t(list.status === "failed" ? "error.load" : "error.command", { code: list.error })
					}),
					list.status !== "loading" && list.tasks.length === 0 && (0, react_jsx_runtime.jsx)("p", {
						className: TaskListAction_module_css_default.statusLine,
						children: t("empty")
					}),
					list.tasks.length > 0 && (0, react_jsx_runtime.jsx)("ul", {
						className: TaskListAction_module_css_default.list,
						children: list.tasks.map((task) => (0, react_jsx_runtime.jsx)(TaskRow, {
							task,
							progress: list.phaseProgress.get(String(task.taskId)),
							gate: list.taskGates.get(String(task.taskId)),
							activity: list.recentActivity.get(String(task.taskId)) ?? task.createdAt,
							t,
							onCommand: command,
							onOpen: openDetail
						}, task.taskId))
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: TaskListAction_module_css_default.footer,
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							size: "sm",
							variant: "outline",
							disabled: refreshing,
							onClick: () => {
								handleRefresh();
							},
							children: refreshing ? t("refreshing") : t("refresh")
						}), syncedAt !== void 0 && !refreshing && (0, react_jsx_runtime.jsx)("span", {
							className: TaskListAction_module_css_default.syncedLine,
							role: "status",
							children: t("synced", { time: new Date(syncedAt).toLocaleTimeString() })
						})]
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client-ui/task-list/client/locales.js
		/** `taskList` namespace dictionaries. */
		/** Dictionary namespace owned by this plugin. */
		const NS = "taskList";
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"phase.progress": "阶段 {current}/{total}",
			"recipe": "模板 {recipeId}",
			"gate.badge": "闸机 {kind} ⏳",
			"recent": "最近活跃 {time}",
			"time.justNow": "刚刚",
			"time.minutesAgo": "{count} 分钟前",
			"time.hoursAgo": "{count} 小时前",
			"time.daysAgo": "{count} 天前",
			"refresh": "刷新",
			"refreshing": "刷新中…",
			"synced": "已同步 · {time}",
			"loading": "加载中…",
			"empty": "暂无任务",
			"create": "新建任务",
			"error.load": "加载失败：{code}",
			"error.command": "操作失败：{code}，已重新同步",
			"revision": "版本 {revision}",
			"open": "打开任务 {taskId}",
			"state.planning": "规划中",
			"state.running": "运行中",
			"state.awaiting-input": "等待输入",
			"state.awaiting-decision": "等待决策",
			"state.pausing": "暂停中",
			"state.paused": "已暂停",
			"state.cancelling": "取消中",
			"state.cancelled": "已取消",
			"state.completed": "已完成",
			"state.failed": "已失败",
			"verb.pause": "暂停",
			"verb.resume": "继续",
			"verb.cancel": "取消"
		};
		/** English dictionary, key-identical to the Chinese source of truth. */
		const en = {
			"phase.progress": "Phase {current}/{total}",
			"recipe": "Recipe {recipeId}",
			"gate.badge": "Gate {kind} ⏳",
			"recent": "active {time}",
			"time.justNow": "just now",
			"time.minutesAgo": "{count}m ago",
			"time.hoursAgo": "{count}h ago",
			"time.daysAgo": "{count}d ago",
			"refresh": "Refresh",
			"refreshing": "Refreshing…",
			"synced": "Synced · {time}",
			"loading": "Loading…",
			"empty": "No tasks yet",
			"create": "New task",
			"error.load": "Load failed: {code}",
			"error.command": "Command failed: {code}; resynced",
			"revision": "rev {revision}",
			"open": "Open task {taskId}",
			"state.planning": "planning",
			"state.running": "running",
			"state.awaiting-input": "awaiting input",
			"state.awaiting-decision": "awaiting decision",
			"state.pausing": "pausing",
			"state.paused": "paused",
			"state.cancelling": "cancelling",
			"state.cancelled": "cancelled",
			"state.completed": "completed",
			"state.failed": "failed",
			"verb.pause": "Pause",
			"verb.resume": "Resume",
			"verb.cancel": "Cancel"
		};
		//#endregion
		//#region lib/types/client-ui/task-list/client/index.js
		/**
		* Client plugin body: the dictionaries, the controller, and the drawer seat.
		* @param ctx - client root context.
		*/
		function apply$1(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-task-list: dictionaries");
			const ctl = new TaskListController(ctx);
			ctx.slots.inject("workbench.drawer.taskList", () => ctx.slots.register({
				name: "workbench.drawer.taskList",
				locale: NS,
				inject: () => ({
					hooks: { list: ctl.store },
					refresh: () => ctl.refresh(),
					command: (taskId, verb) => {
						ctl.command(taskId, verb);
					}
				})
			}, TaskListAction));
		}
		//#endregion
		//#region lib/types/client/index.js
		/**
		* Required services this aggregate needs directly: the slot system, locale, and
		* the base `remote` carrier onto which the namespaces are mounted. The
		* `remote.<namespace>` sub-services are provided by the mount child plugin, so
		* they are intentionally NOT here (a plugin cannot inject a service it
		* provides) — the feature child plugins declare them.
		*/
		const inject = [
			"slots",
			"locale",
			"remote"
		];
		/** The nine feature domains, each with the `remote.*` declarations it reads. */
		const FEATURES = [
			{
				id: "ui-workbench-drawer",
				inject: [
					"slots",
					"remote",
					"remote.workbenchHost",
					"remote.tasks",
					"locale"
				],
				apply: apply$9
			},
			{
				id: "ui-attention-inbox",
				inject: [
					"slots",
					"remote",
					"remote.workbenchHost",
					"remote.workbenchHostStream",
					"locale"
				],
				apply: apply$8
			},
			{
				id: "ui-clarifications",
				inject: [
					"slots",
					"remote",
					"remote.workbenchHost",
					"locale"
				],
				apply: apply$7
			},
			{
				id: "ui-recipe-library",
				inject: [
					"slots",
					"remote",
					"remote.recipes",
					"locale"
				],
				apply: apply$6
			},
			{
				id: "ui-task-board",
				inject: [
					"slots",
					"remote",
					"remote.tasks",
					"remote.metrics",
					"locale"
				],
				apply: apply$5
			},
			{
				id: "ui-task-create",
				inject: [
					"slots",
					"remote",
					"remote.recipes",
					"remote.tasks",
					"locale"
				],
				apply: apply$4
			},
			{
				id: "ui-task-create-confirm",
				inject: [
					"slots",
					"remote",
					"remote.tasks",
					"locale"
				],
				apply: apply$3
			},
			{
				id: "ui-task-detail",
				inject: [
					"slots",
					"remote",
					"remote.tasks",
					"remote.digest",
					"remote.rewind",
					"remote.deliverables",
					"locale"
				],
				apply: apply$2
			},
			{
				id: "ui-task-list",
				inject: [
					"slots",
					"remote",
					"remote.tasks",
					"locale"
				],
				apply: apply$1
			}
		];
		/** The mount child plugin: mounts every task-flow namespace before features run. */
		const REMOTE_MOUNT_PLUGIN = {
			name: "dsh-task-flow-remotes",
			inject: ["remote"],
			async apply(ctx) {
				const disposers = [];
				try {
					for (const contribution of taskFlowRemoteContributions) disposers.push(await ctx.remote.$mount(contribution));
				} catch (error) {
					for (const dispose of disposers.reverse()) await dispose();
					throw error;
				}
				return async () => {
					for (const dispose of disposers.reverse()) await dispose();
				};
			}
		};
		/**
		* Mount the task-flow Host Remote contributions, then activate every feature
		* domain as a child plugin (each injects the `remote.<ns>` it reads).
		* @param ctx - Client Cordis root carrying the typed API carrier.
		* @returns disposer for the mount child plugin; feature child plugins dispose
		* with this plugin's fiber.
		*/
		async function apply(ctx) {
			await (await ctx.plugin(REMOTE_MOUNT_PLUGIN)).await();
			for (const feature of FEATURES) await ctx.plugin({
				name: feature.id,
				inject: [...feature.inject],
				apply: feature.apply
			}).await();
			return async () => {};
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map