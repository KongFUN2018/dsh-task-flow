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
		const css$9 = ".TBm3Va_trigger{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-floating-fill);color:var(--dsw-alias-label-primary);cursor:pointer;box-shadow:0 6px 24px var(--dsw-alias-bg-mask-drop);border-radius:999px;align-items:center;gap:8px;padding:10px 18px;font-size:13px;font-weight:500;transition:background .16s,transform .16s;display:inline-flex}.TBm3Va_trigger:hover{background:var(--dsw-alias-button-floating-hover);transform:translateY(-1px)}.TBm3Va_trigger:focus-visible,.TBm3Va_close:focus-visible,.TBm3Va_tabs button:focus-visible,.TBm3Va_resize:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.TBm3Va_triggerLabel{white-space:nowrap}.TBm3Va_dotIdle,.TBm3Va_dotActive{border-radius:50%;flex:none;width:8px;height:8px}.TBm3Va_dotIdle{background:var(--dsw-alias-border-l3)}.TBm3Va_dotActive{background:var(--dsw-alias-state-success-primary);animation:2s infinite TBm3Va_badgePulse}.TBm3Va_badge{background:var(--dsw-alias-state-error-primary);min-width:18px;color:var(--dsw-alias-label-primary-foreground);text-align:center;border-radius:999px;padding:0 6px;font-size:11px;font-weight:600;line-height:18px}@keyframes TBm3Va_badgePulse{0%{box-shadow:0 0 0 0 var(--dsw-alias-state-success-primary)}70%{box-shadow:0 0 0 6px #0000}to{box-shadow:0 0 #0000}}.TBm3Va_drawer{z-index:1000;background:var(--dsw-alias-bg-layer-1);border-left:1px solid var(--dsw-alias-border-l2);box-shadow:-16px 0 48px var(--dsw-alias-bg-mask-drop);flex-direction:column;max-width:94vw;display:flex;position:fixed;top:0;bottom:0;right:0}.TBm3Va_resize{cursor:col-resize;touch-action:none;width:8px;position:absolute;top:0;bottom:0;left:-4px}.TBm3Va_resize:hover{background:var(--dsw-alias-interactive-bg-hover)}.TBm3Va_head{border-bottom:1px solid var(--dsw-alias-border-l1);align-items:center;gap:10px;padding:14px 18px;display:flex}.TBm3Va_headTitle{color:var(--dsw-alias-label-primary);flex:1;font-size:15px;font-weight:600}.TBm3Va_close{color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:7px;padding:4px 10px;font-size:13px}.TBm3Va_close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.TBm3Va_tabs{border-bottom:1px solid var(--dsw-alias-border-l1);gap:2px;padding:0 18px;display:flex}.TBm3Va_tabs button{cursor:pointer;background:0 0;border:0;border-radius:8px 8px 0 0;padding:10px 14px;font-size:13px;transition:color .16s,background .16s;position:relative}.TBm3Va_tabOff{color:var(--dsw-alias-label-secondary)}.TBm3Va_tabOff:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.TBm3Va_tabOn{color:var(--dsw-alias-label-primary);font-weight:600}.TBm3Va_tabOn:after{content:\"\";background:var(--dsw-alias-state-business-primary);border-radius:2px;height:2px;position:absolute;bottom:-1px;left:12px;right:12px}.TBm3Va_tabCount,.TBm3Va_tabCountHot{text-align:center;border-radius:999px;min-width:18px;margin-left:6px;padding:0 5px;font-size:11px;font-weight:500;line-height:17px;display:inline-block}.TBm3Va_tabCount{background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-secondary)}.TBm3Va_tabCountHot{background:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-label-primary-foreground);font-weight:600}.TBm3Va_body{--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);flex:1;padding:16px 18px;overflow:auto}";
		const tagId$9 = "@kongfun2018/dsh-task-flow/WorkbenchDrawer.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$9) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@kongfun2018/dsh-task-flow";
			tag.dataset.pluginCss = tagId$9;
			tag.textContent = css$9;
			document.head.appendChild(tag);
		}
		var WorkbenchDrawer_module_css_default = {
			"badgePulse": "TBm3Va_badgePulse",
			"head": "TBm3Va_head",
			"trigger": "TBm3Va_trigger",
			"dotActive": "TBm3Va_dotActive",
			"close": "TBm3Va_close",
			"resize": "TBm3Va_resize",
			"badge": "TBm3Va_badge",
			"triggerLabel": "TBm3Va_triggerLabel",
			"tabs": "TBm3Va_tabs",
			"drawer": "TBm3Va_drawer",
			"headTitle": "TBm3Va_headTitle",
			"tabOff": "TBm3Va_tabOff",
			"tabOn": "TBm3Va_tabOn",
			"tabCountHot": "TBm3Va_tabCountHot",
			"body": "TBm3Va_body",
			"tabCount": "TBm3Va_tabCount",
			"dotIdle": "TBm3Va_dotIdle"
		};
		//#endregion
		//#region lib/types/client-ui/workbench-drawer/client/WorkbenchDrawer.js
		/** Conversation-relative drawer width: ~92% of the shell's center column. */
		const CONVERSATION_WIDTH_RATIO = .92;
		/** Shell default geometry the center column derives from (sidebar | details). */
		const CENTER_OFFSET_X = 640;
		/** Lower and upper width bounds for the user-resized drawer (px). */
		const WIDTH_MIN = 360;
		const WIDTH_MAX = 1320;
		/** Viewport share the width may never exceed, matching the CSS clamp. */
		const VIEWPORT_SHARE = .94;
		/**
		* Conversation-relative drawer width for the current viewport: the shell's
		* center column (viewport minus the default sidebar/details offset) scaled
		* by CONVERSATION_WIDTH_RATIO, capped to the draggable maximum. All tabs
		* share one default; a user drag overrides it within WIDTH_MIN..WIDTH_MAX.
		* @param viewport - current window.innerWidth.
		* @returns the default drawer width in px, capped to both bounds.
		*/
		function defaultWidthFor(viewport) {
			const center = Math.max(0, viewport - CENTER_OFFSET_X);
			return Math.round(Math.min(center * CONVERSATION_WIDTH_RATIO, WIDTH_MAX));
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
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: WorkbenchDrawer_module_css_default.headTitle,
							children: t("trigger")
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: WorkbenchDrawer_module_css_default.close,
							onClick: () => {
								actions.closeDrawer();
							},
							children: t("close")
						})]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: WorkbenchDrawer_module_css_default.tabs,
						role: "tablist",
						children: [
							"tasks",
							"taskList",
							"recipeLibrary",
							"inbox",
							"clarifications",
							"detail",
							"create"
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
					(0, react_jsx_runtime.jsxs)("div", {
						className: WorkbenchDrawer_module_css_default.body,
						children: [
							tab === "tasks" && renderSlot("workbench.drawer.tasks", owner),
							tab === "taskList" && renderSlot("workbench.drawer.taskList", owner),
							tab === "recipeLibrary" && renderSlot("workbench.drawer.recipeLibrary", owner),
							tab === "inbox" && renderSlot("workbench.drawer.inbox", {}),
							tab === "clarifications" && renderSlot("workbench.drawer.clarifications", {}),
							tab === "detail" && renderSlot("workbench.drawer.detail", {
								taskId: detailTaskId,
								openInbox: owner.openInbox
							}),
							tab === "create" && renderSlot("workbench.drawer.create", owner)
						]
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
			"trigger": "IKEv-q_trigger",
			"railDot": "IKEv-q_railDot",
			"label": "IKEv-q_label",
			"rail": "IKEv-q_rail"
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
					createRecipeId: void 0
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
					},
					openDetail: (d, taskId) => {
						d.tab = "detail";
						d.detailTaskId = taskId;
					},
					setDetailTaskId: (d, taskId) => {
						d.detailTaskId = taskId;
					},
					openCreate: (d, recipeId) => {
						d.tab = "create";
						d.createRecipeId = recipeId;
					},
					setCreateRecipeId: (d, recipeId) => {
						d.createRecipeId = recipeId;
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
			"batchSpacer": "aLUtLq_batchSpacer",
			"list": "aLUtLq_list",
			"rowMain": "aLUtLq_rowMain",
			"section": "aLUtLq_section",
			"footer": "aLUtLq_footer",
			"sectionTitle": "aLUtLq_sectionTitle",
			"row": "aLUtLq_row",
			"panel": "aLUtLq_panel",
			"decision": "aLUtLq_decision",
			"batchbar": "aLUtLq_batchbar",
			"rowDot": "aLUtLq_rowDot",
			"itemId": "aLUtLq_itemId",
			"statusLine": "aLUtLq_statusLine",
			"errorLine": "aLUtLq_errorLine",
			"batchCount": "aLUtLq_batchCount",
			"meta": "aLUtLq_meta"
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
		function kindLabel(kind, t) {
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
								kindLabel(item.kind, t),
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
								kindLabel(item.kind, t),
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
							kindLabel(item.kind, t),
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
			"source": "kzp9OG_source",
			"section": "kzp9OG_section",
			"meta": "kzp9OG_meta",
			"errorLine": "kzp9OG_errorLine",
			"footer": "kzp9OG_footer",
			"sectionTitle": "kzp9OG_sectionTitle",
			"list": "kzp9OG_list",
			"statusLine": "kzp9OG_statusLine",
			"panel": "kzp9OG_panel",
			"rowMain": "kzp9OG_rowMain",
			"rowDot": "kzp9OG_rowDot",
			"row": "kzp9OG_row"
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
		};
		//#endregion
		//#region \0dsh-css:E:\Codes\private\dsh-task-flow\src\client-ui\recipe-library\client\RecipeLibraryAction.module.css.mjs
		const css$5 = ".SEZ_Wa_panel{flex-direction:column;gap:10px;display:flex}.SEZ_Wa_title{color:var(--dsw-alias-label-primary);margin:0;font-size:15px;font-weight:600;line-height:22px}.SEZ_Wa_statusLine,.SEZ_Wa_errorLine{margin:0;padding:4px 2px;font-size:12px;line-height:18px}.SEZ_Wa_statusLine{color:var(--dsw-alias-label-tertiary)}.SEZ_Wa_errorLine{color:var(--dsw-alias-state-error-primary)}.SEZ_Wa_grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin:0;padding:0;list-style:none;display:grid}.SEZ_Wa_card{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-surface-l1);border-radius:10px;flex-direction:column;gap:8px;padding:10px 12px;display:flex}.SEZ_Wa_card:hover{border-color:var(--dsw-alias-border-l2)}.SEZ_Wa_cardHead{flex-direction:column;gap:2px;display:flex}.SEZ_Wa_name{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:18px;overflow:hidden}.SEZ_Wa_meta{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}.SEZ_Wa_summary{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px;line-height:18px}.SEZ_Wa_cardFoot{justify-content:flex-end;margin-top:auto;padding-top:2px;display:flex}.SEZ_Wa_footer{justify-content:flex-end;padding-top:2px;display:flex}";
		const tagId$5 = "@kongfun2018/dsh-task-flow/RecipeLibraryAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$5) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@kongfun2018/dsh-task-flow";
			tag.dataset.pluginCss = tagId$5;
			tag.textContent = css$5;
			document.head.appendChild(tag);
		}
		var RecipeLibraryAction_module_css_default = {
			"meta": "SEZ_Wa_meta",
			"card": "SEZ_Wa_card",
			"summary": "SEZ_Wa_summary",
			"cardFoot": "SEZ_Wa_cardFoot",
			"cardHead": "SEZ_Wa_cardHead",
			"grid": "SEZ_Wa_grid",
			"name": "SEZ_Wa_name",
			"statusLine": "SEZ_Wa_statusLine",
			"panel": "SEZ_Wa_panel",
			"title": "SEZ_Wa_title",
			"footer": "SEZ_Wa_footer",
			"errorLine": "SEZ_Wa_errorLine"
		};
		//#endregion
		//#region lib/types/client-ui/recipe-library/client/RecipeLibraryAction.js
		/**
		* One recipe card: name, derived phase/check/deliverable counts, a one-line
		* description, and a `使用模板新建` action. The action switches the drawer to
		* the task-creation wizard tab; the owner's `openCreate` currently takes no
		* recipe, so the card routes only the tab switch (no pre-selection).
		* @param card - the flat card view to render.
		* @param onUse - callback invoked when `使用模板新建` is pressed.
		* @param busy - whether the card's action is momentarily in flight.
		* @param t - recipeLibrary namespace translate.
		*/
		function RecipeCard({ card, onUse, busy, t }) {
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
					(0, react_jsx_runtime.jsx)("div", {
						className: RecipeLibraryAction_module_css_default.cardFoot,
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							size: "sm",
							variant: "primary",
							disabled: busy,
							onClick: () => {
								onUse(card.recipeId);
							},
							children: busy ? t("creating") : t("use")
						})
					})
				]
			});
		}
		/**
		* Render the drawer's Recipe-library tab body: a grid of processing-template
		* cards over the loaded catalogue, each `使用模板新建` pressing the owner's
		* `openCreate` to switch into the creation wizard.
		* @param props - composed slot props (owner openCreate, locale, inject face).
		* @returns the recipe card grid filling the drawer's tab body.
		*/
		function RecipeLibraryAction(props) {
			const { openCreate, t, useLibrary, refresh } = props;
			const state = useLibrary((snapshot) => snapshot);
			const [busy, setBusy] = (0, react.useState)(false);
			const handleUse = (recipeId) => {
				setBusy(true);
				openCreate(recipeId);
				window.setTimeout(() => {
					setBusy(false);
				}, 300);
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: RecipeLibraryAction_module_css_default.panel,
				children: [
					(0, react_jsx_runtime.jsx)("h2", {
						className: RecipeLibraryAction_module_css_default.title,
						children: t("title")
					}),
					state.status === "loading" && (0, react_jsx_runtime.jsx)("p", {
						className: RecipeLibraryAction_module_css_default.statusLine,
						children: t("loading")
					}),
					state.error !== void 0 && (0, react_jsx_runtime.jsx)("p", {
						className: RecipeLibraryAction_module_css_default.errorLine,
						role: "alert",
						children: t("error.load", { code: state.error })
					}),
					state.status === "ready" && state.cards.length === 0 && (0, react_jsx_runtime.jsx)("p", {
						className: RecipeLibraryAction_module_css_default.statusLine,
						children: t("empty")
					}),
					state.cards.length > 0 && (0, react_jsx_runtime.jsx)("ul", {
						className: RecipeLibraryAction_module_css_default.grid,
						children: state.cards.map((card) => (0, react_jsx_runtime.jsx)(RecipeCard, {
							card,
							onUse: handleUse,
							busy,
							t
						}, card.recipeId))
					}),
					state.status !== "loading" && (0, react_jsx_runtime.jsx)("div", {
						className: RecipeLibraryAction_module_css_default.footer,
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							size: "sm",
							variant: "ghost",
							onClick: () => {
								refresh();
							},
							children: t("refresh")
						})
					})
				]
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
			"meta": "{phases} 阶段 · {checks} 道闸 · {deliverables} 产物",
			"description": "该模板由 {phases} 个阶段组成：{goals}",
			"use": "使用模板新建",
			"creating": "打开向导…",
			"refresh": "刷新"
		};
		/** English dictionary, key-identical to the Chinese source of truth. */
		const en$5 = {
			"title": "Recipe library",
			"loading": "Loading…",
			"empty": "No recipes available",
			"error.load": "Recipes failed to load: {code}",
			"meta": "{phases} phases · {checks} checks · {deliverables} deliverables",
			"description": "Runs through {phases} phases: {goals}",
			"use": "New task from this recipe",
			"creating": "Opening wizard…",
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
					refresh: () => controller.refresh()
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
			"row": "FELT1G_row",
			"bars": "FELT1G_bars",
			"kpiLabel": "FELT1G_kpiLabel",
			"list": "FELT1G_list",
			"chartEmpty": "FELT1G_chartEmpty",
			"taskId": "FELT1G_taskId",
			"barFill": "FELT1G_barFill",
			"verbs": "FELT1G_verbs",
			"rowDot": "FELT1G_rowDot",
			"barLabel": "FELT1G_barLabel",
			"statusLine": "FELT1G_statusLine",
			"syncedLine": "FELT1G_syncedLine",
			"chartRow": "FELT1G_chartRow",
			"barCol": "FELT1G_barCol",
			"rowMain": "FELT1G_rowMain",
			"chartTitle": "FELT1G_chartTitle",
			"panel": "FELT1G_panel",
			"barTrack": "FELT1G_barTrack",
			"kpiRow": "FELT1G_kpiRow",
			"errorLine": "FELT1G_errorLine",
			"meta": "FELT1G_meta",
			"kpiValue": "FELT1G_kpiValue",
			"chartCard": "FELT1G_chartCard",
			"gateBadge": "FELT1G_gateBadge",
			"sparkline": "FELT1G_sparkline",
			"footer": "FELT1G_footer",
			"chartHint": "FELT1G_chartHint",
			"kpiCard": "FELT1G_kpiCard",
			"sparkLine": "FELT1G_sparkLine"
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
				if (result.ok) return String(result.value.taskId);
				throw new Error("create failed: " + result.error.code);
			}
		};
		//#endregion
		//#region \0dsh-css:E:\Codes\private\dsh-task-flow\src\client-ui\task-create\client\TaskCreateAction.module.css.mjs
		const css$3 = ".uSmRfG_panel{flex-direction:column;height:100%;padding:16px 18px;display:flex}.uSmRfG_title{margin:0 0 12px;font-size:16px}.uSmRfG_columns{flex:1;grid-template-columns:1.1fr 1fr 1.1fr;gap:12px;min-height:0;display:grid}.uSmRfG_column{min-width:0}.uSmRfG_section{color:var(--dsw-alias-label-secondary);margin:0 0 8px;font-size:12px;font-weight:600}.uSmRfG_recipeList{flex-direction:column;gap:6px;margin:0;padding:0;list-style:none;display:flex}.uSmRfG_recipeCard{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-surface-l1);width:100%;color:inherit;font:inherit;text-align:left;cursor:pointer;border-radius:8px;flex-direction:column;align-items:flex-start;gap:2px;padding:8px 10px;display:flex}.uSmRfG_recipeCardSelected{border-color:var(--dsw-alias-border-strong)}.uSmRfG_recipeName{font-weight:600}.uSmRfG_recipeMeta{color:var(--dsw-alias-label-secondary);font-size:12px}.uSmRfG_preview{flex-direction:column;gap:4px;margin:0;padding:0;list-style:none;display:flex}.uSmRfG_previewStep{border-left:3px solid var(--dsw-alias-border-l2);padding:6px 8px}.uSmRfG_previewName{font-weight:500}.uSmRfG_field{color:var(--dsw-alias-label-secondary);flex-direction:column;gap:4px;margin-bottom:10px;font-size:12px;display:flex}.uSmRfG_review{color:var(--dsw-alias-label-secondary);font-size:12px}.uSmRfG_review summary{cursor:pointer;font-weight:600}.uSmRfG_statusLine{color:var(--dsw-alias-label-secondary);font-size:13px}.uSmRfG_errorLine{color:var(--dsw-alias-state-error-primary);font-size:13px}.uSmRfG_footer{justify-content:flex-end;gap:8px;margin-top:12px;display:flex}";
		const tagId$3 = "@kongfun2018/dsh-task-flow/TaskCreateAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@kongfun2018/dsh-task-flow";
			tag.dataset.pluginCss = tagId$3;
			tag.textContent = css$3;
			document.head.appendChild(tag);
		}
		var TaskCreateAction_module_css_default = {
			"recipeCard": "uSmRfG_recipeCard",
			"recipeName": "uSmRfG_recipeName",
			"column": "uSmRfG_column",
			"section": "uSmRfG_section",
			"previewName": "uSmRfG_previewName",
			"errorLine": "uSmRfG_errorLine",
			"previewStep": "uSmRfG_previewStep",
			"title": "uSmRfG_title",
			"preview": "uSmRfG_preview",
			"footer": "uSmRfG_footer",
			"recipeList": "uSmRfG_recipeList",
			"columns": "uSmRfG_columns",
			"review": "uSmRfG_review",
			"recipeMeta": "uSmRfG_recipeMeta",
			"statusLine": "uSmRfG_statusLine",
			"field": "uSmRfG_field",
			"panel": "uSmRfG_panel",
			"recipeCardSelected": "uSmRfG_recipeCardSelected"
		};
		//#endregion
		//#region lib/types/client-ui/task-create/client/TaskCreateAction.js
		/** One recipe's phase summary for the preview column. */
		function phaseNames(recipe) {
			return recipe.payload.phases.map((phase) => phase.goal);
		}
		function recipeMeta(recipe) {
			const payload = recipe.payload;
			return {
				phases: payload.phases.length,
				checks: payload.gateChecks.length
			};
		}
		function TaskCreateAction(props) {
			const { t, openDetail, initialRecipeId, useCreate, create } = props;
			const state = useCreate((state) => state);
			const [selectedId, setSelectedId] = (0, react.useState)(void 0);
			const [goal, setGoal] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				if (initialRecipeId !== void 0) setSelectedId(String(initialRecipeId));
			}, [initialRecipeId]);
			const selected = state.recipes.find((recipe) => recipe.recipeId === selectedId);
			return (0, react_jsx_runtime.jsxs)("div", {
				className: TaskCreateAction_module_css_default.panel,
				children: [
					(0, react_jsx_runtime.jsx)("h2", {
						className: TaskCreateAction_module_css_default.title,
						children: t("title")
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
					state.status === "ready" && state.recipes.length > 0 && (0, react_jsx_runtime.jsxs)("div", {
						className: TaskCreateAction_module_css_default.columns,
						children: [
							(0, react_jsx_runtime.jsxs)("section", {
								className: TaskCreateAction_module_css_default.column,
								children: [(0, react_jsx_runtime.jsx)("p", {
									className: TaskCreateAction_module_css_default.section,
									children: t("column.recipe")
								}), (0, react_jsx_runtime.jsx)("ul", {
									className: TaskCreateAction_module_css_default.recipeList,
									children: state.recipes.map((recipe) => (0, react_jsx_runtime.jsx)("li", { children: (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: selectedId === recipe.recipeId ? (TaskCreateAction_module_css_default.recipeCard ?? "") + " " + (TaskCreateAction_module_css_default.recipeCardSelected ?? "") : TaskCreateAction_module_css_default.recipeCard,
										onClick: () => {
											setSelectedId(recipe.recipeId);
										},
										children: [(0, react_jsx_runtime.jsx)("span", {
											className: TaskCreateAction_module_css_default.recipeName,
											children: recipe.recipeId
										}), (0, react_jsx_runtime.jsx)("span", {
											className: TaskCreateAction_module_css_default.recipeMeta,
											children: t("recipe.meta", {
												phases: String(recipeMeta(recipe).phases),
												checks: String(recipeMeta(recipe).checks),
												deliverables: "0"
											})
										})]
									}) }, recipe.recipeId))
								})]
							}),
							(0, react_jsx_runtime.jsxs)("section", {
								className: TaskCreateAction_module_css_default.column,
								children: [
									(0, react_jsx_runtime.jsx)("p", {
										className: TaskCreateAction_module_css_default.section,
										children: t("column.preview")
									}),
									selected === void 0 && (0, react_jsx_runtime.jsx)("p", {
										className: TaskCreateAction_module_css_default.statusLine,
										children: t("preview.empty")
									}),
									selected !== void 0 && (0, react_jsx_runtime.jsx)("ol", {
										className: TaskCreateAction_module_css_default.preview,
										children: phaseNames(selected).map((phase, index) => (0, react_jsx_runtime.jsx)("li", {
											className: TaskCreateAction_module_css_default.previewStep,
											children: (0, react_jsx_runtime.jsx)("span", {
												className: TaskCreateAction_module_css_default.previewName,
												children: phase
											})
										}, index))
									})
								]
							}),
							(0, react_jsx_runtime.jsxs)("section", {
								className: TaskCreateAction_module_css_default.column,
								children: [
									(0, react_jsx_runtime.jsx)("p", {
										className: TaskCreateAction_module_css_default.section,
										children: t("column.config")
									}),
									(0, react_jsx_runtime.jsxs)("label", {
										className: TaskCreateAction_module_css_default.field,
										children: [(0, react_jsx_runtime.jsx)("span", { children: t("goal.label") }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
											value: goal,
											onChange: (event) => {
												setGoal(event.target.value);
											},
											placeholder: t("goal.placeholder")
										})]
									}),
									(0, react_jsx_runtime.jsxs)("label", {
										className: TaskCreateAction_module_css_default.field,
										children: [(0, react_jsx_runtime.jsx)("span", { children: t("workspace.label") }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
											value: "default",
											readOnly: true
										})]
									}),
									(0, react_jsx_runtime.jsxs)("details", {
										className: TaskCreateAction_module_css_default.review,
										children: [(0, react_jsx_runtime.jsx)("summary", { children: t("review.label") }), (0, react_jsx_runtime.jsx)("p", { children: t("review.detail") })]
									})
								]
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
							},
							children: t("cancel")
						}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							size: "sm",
							variant: "primary",
							disabled: selected === void 0 || busy,
							onClick: () => {
								if (selected === void 0) return;
								setBusy(true);
								create(selected.recipeId, "default", goal).then((taskId) => {
									setBusy(false);
									setSelectedId(void 0);
									setGoal("");
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
			"preview.empty": "选中左侧模板查看流程预览",
			"create": "创建并开始第一阶段",
			"cancel": "取消"
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
			"preview.empty": "Pick a recipe on the left to preview its phases",
			"create": "Create and start phase one",
			"cancel": "Cancel"
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
					create: (recipeId, workspaceId, goal) => controller.create(recipeId, workspaceId, "workbench-ui", goal)
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
			"hint": "RLoCuq_hint",
			"title": "RLoCuq_title",
			"inherit": "RLoCuq_inherit",
			"actions": "RLoCuq_actions",
			"meta": "RLoCuq_meta",
			"card": "RLoCuq_card",
			"goal": "RLoCuq_goal"
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
		/** Issue the create through the tasks Remote; the proposal carries the idempotency key. */
		async function confirmTask(ctx, proposal, inherit) {
			const result = await ctx.remote.tasks.createTask(proposal.recipeId, "default", "workbench-ui", proposal.idempotencyKey);
			if (!result.ok) throw new Error("create failed: " + result.error.code);
			return String(result.value.taskId);
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
			"patchPanel": "hVSv0W_patchPanel",
			"rootRow": "hVSv0W_rootRow",
			"archivedPhase": "hVSv0W_archivedPhase",
			"taskRow": "hVSv0W_taskRow",
			"successLine": "hVSv0W_successLine",
			"section": "hVSv0W_section",
			"patchActions": "hVSv0W_patchActions",
			"panel": "hVSv0W_panel",
			"verbRow": "hVSv0W_verbRow",
			"timeline": "hVSv0W_timeline",
			"gateGroup": "hVSv0W_gateGroup",
			"rootList": "hVSv0W_rootList",
			"gateClass": "hVSv0W_gateClass",
			"itemId": "hVSv0W_itemId",
			"meta": "hVSv0W_meta",
			"body": "hVSv0W_body",
			"rootsHint": "hVSv0W_rootsHint",
			"row": "hVSv0W_row",
			"list": "hVSv0W_list",
			"rowDot": "hVSv0W_rowDot",
			"errorLine": "hVSv0W_errorLine",
			"statusLine": "hVSv0W_statusLine",
			"patchNote": "hVSv0W_patchNote",
			"hintLine": "hVSv0W_hintLine",
			"rewindPanel": "hVSv0W_rewindPanel"
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
		const css = ".SaoCrW_panel{flex-direction:column;gap:8px;display:flex}.SaoCrW_list{flex-direction:column;gap:2px;margin:0;padding:0;list-style:none;display:flex;overflow:visible}.SaoCrW_row{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1);width:100%;min-height:40px;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:10px;align-items:center;gap:8px;padding:6px 8px;font-size:13px;line-height:18px;display:flex}.SaoCrW_row:hover,.SaoCrW_row:focus-visible{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l2)}.SaoCrW_row:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-1px}.SaoCrW_rowDot{flex:none}.SaoCrW_rowMain{flex-direction:column;flex:1;gap:1px;min-width:0;display:flex}.SaoCrW_taskId{text-overflow:ellipsis;white-space:nowrap;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;overflow:hidden}.SaoCrW_meta{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}.SaoCrW_gateBadge{color:var(--dsw-alias-state-warn-primary);border:1px solid var(--dsw-alias-state-warn-primary);border-radius:10px;margin-left:6px;padding:1px 6px;font-size:11px;line-height:16px}.SaoCrW_activity{color:var(--dsw-alias-text-tertiary)}.SaoCrW_verbs{flex:none;gap:4px;display:flex}.SaoCrW_statusLine,.SaoCrW_errorLine{margin:0;padding:4px 2px;font-size:12px;line-height:18px}.SaoCrW_statusLine{color:var(--dsw-alias-label-tertiary)}.SaoCrW_errorLine{color:var(--dsw-alias-state-error-primary)}.SaoCrW_footer{justify-content:flex-end;align-items:center;gap:8px;padding-top:2px;display:flex}.SaoCrW_syncedLine{color:var(--dsw-alias-state-success-primary);margin:0;font-size:12px;line-height:18px}";
		const tagId = "@kongfun2018/dsh-task-flow/TaskListAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@kongfun2018/dsh-task-flow";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var TaskListAction_module_css_default = {
			"activity": "SaoCrW_activity",
			"rowDot": "SaoCrW_rowDot",
			"syncedLine": "SaoCrW_syncedLine",
			"meta": "SaoCrW_meta",
			"gateBadge": "SaoCrW_gateBadge",
			"list": "SaoCrW_list",
			"statusLine": "SaoCrW_statusLine",
			"errorLine": "SaoCrW_errorLine",
			"rowMain": "SaoCrW_rowMain",
			"verbs": "SaoCrW_verbs",
			"row": "SaoCrW_row",
			"footer": "SaoCrW_footer",
			"panel": "SaoCrW_panel",
			"taskId": "SaoCrW_taskId"
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
			const { openDetail, t, useList, refresh, command } = props;
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
		/** Required services across every folded domain's `apply`. */
		const inject = [
			"slots",
			"locale",
			"remote",
			"remote.tasks",
			"remote.metrics",
			"remote.workbenchHost",
			"remote.workbenchHostStream",
			"remote.recipes",
			"remote.digest",
			"remote.rewind",
			"remote.deliverables"
		];
		/**
		* Mount every task-flow client feature: the drawer shell (footer trigger +
		* overlay), the eight drawer content seats, and the toolview confirmation.
		* Each domain registers itself into its declared seat; the shell's overlay
		* declares the content seats its children consume.
		* @param ctx - Client Cordis root.
		*/
		function apply(ctx) {
			apply$9(ctx);
			apply$8(ctx);
			apply$7(ctx);
			apply$6(ctx);
			apply$5(ctx);
			apply$4(ctx);
			apply$3(ctx);
			apply$2(ctx);
			apply$1(ctx);
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map