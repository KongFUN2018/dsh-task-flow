import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import css from './WorkbenchDrawer.module.css';
/** Conversation-relative drawer width: ~92% of the shell's center column. */
const CONVERSATION_WIDTH_RATIO = 0.92;
/** Shell default geometry the center column derives from (sidebar | details). */
const CENTER_OFFSET_X = 280 + 360;
/** Lower and upper width bounds for the user-resized drawer (px). */
const WIDTH_MIN = 360;
const WIDTH_MAX = 1320;
/** Viewport share the width may never exceed, matching the CSS clamp. */
const VIEWPORT_SHARE = 0.94;
/**
 * Conversation-relative drawer width for the current viewport: the shell's
 * center column (viewport minus the default sidebar/details offset) scaled
 * by CONVERSATION_WIDTH_RATIO, capped to the draggable maximum. All tabs
 * share one default; a user drag overrides it within WIDTH_MIN..WIDTH_MAX.
 * @param viewport - current window.innerWidth.
 * @returns the default drawer width in px, capped to both bounds.
 */
export function defaultWidthFor(viewport) {
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
export function WorkbenchDrawer(props) {
    const { t, renderSlot, useStore, actions } = props;
    const [userWidth, setUserWidth] = useState(undefined);
    // Track the live viewport so the conversation-relative default tracks window
    // resizes; a user drag still overrides it until the next tab switch.
    const [viewport, setViewport] = useState(() => (typeof window === 'undefined' ? 0 : window.innerWidth));
    const drawerRef = useRef(null);
    const resizeRef = useRef(null);
    const dragStart = useRef(null);
    const open = useStore(s => s.open);
    const tab = useStore(s => s.tab);
    const detailTaskId = useStore(s => s.detailTaskId);
    const createRecipeId = useStore(s => s.createRecipeId);
    const recipesOpen = useStore(s => s.recipesOpen);
    const selectTab = (next) => {
        actions.selectTab(next);
        setUserWidth(undefined);
    };
    // A user drag pins a fixed width; otherwise each tab shares the
    // conversation-relative default for the current viewport.
    const defaultWidth = defaultWidthFor(viewport);
    const width = userWidth ?? defaultWidth;
    const currentWidth = drawerRef.current?.offsetWidth ?? defaultWidth;
    // Re-derive the conversation-relative default whenever the window resizes.
    useEffect(() => {
        const onResize = () => { setViewport(window.innerWidth); };
        window.addEventListener('resize', onResize);
        return () => { window.removeEventListener('resize', onResize); };
    }, []);
    const onResizeDown = (event) => {
        event.preventDefault();
        dragStart.current = { x: event.clientX, w: currentWidth };
        const el = resizeRef.current;
        if (el !== null && typeof el.setPointerCapture === 'function') {
            el.setPointerCapture(event.pointerId);
        }
    };
    const onResizeMove = (event) => {
        const drag = dragStart.current;
        if (drag === null)
            return;
        const maxWidth = Math.min(WIDTH_MAX, window.innerWidth * VIEWPORT_SHARE);
        setUserWidth(Math.max(WIDTH_MIN, Math.min(maxWidth, drag.w + (drag.x - event.clientX))));
    };
    const onResizeUp = (event) => {
        dragStart.current = null;
        const el = resizeRef.current;
        if (el !== null && typeof el.hasPointerCapture === 'function' && el.hasPointerCapture(event.pointerId)) {
            el.releasePointerCapture(event.pointerId);
        }
    };
    /** Owner share for the tasks/create seats, derived from store actions. */
    const owner = {
        openDetail: (taskId) => { actions.openDetail(taskId); },
        openInbox: () => { actions.selectTab('inbox'); },
        openCreate: (recipeId) => { actions.openCreate(recipeId); },
        initialRecipeId: createRecipeId,
    };
    if (!open)
        return null;
    return (_jsxs("div", { ref: drawerRef, className: css.drawer, style: { width: `${width}px` }, role: "dialog", "aria-label": t('trigger'), children: [_jsx("div", { ref: resizeRef, className: css.resize, role: "separator", "aria-orientation": "vertical", "aria-label": t('resize'), onPointerDown: onResizeDown, onPointerMove: onResizeMove, onPointerUp: onResizeUp }), _jsxs("div", { className: css.head, children: [_jsx("span", { className: css.headTitle, children: t('trigger') }), _jsx("button", { type: "button", className: css.recipesButton, onClick: () => { actions.openRecipes(); }, title: t('tab.recipeLibrary'), children: t('tab.recipeLibrary') }), _jsx("button", { type: "button", className: css.close, onClick: () => { actions.closeDrawer(); }, children: t('close') })] }), _jsx("div", { className: css.tabs, role: "tablist", children: ['tasks', 'taskList', 'inbox', 'clarifications'].map(key => (_jsx("button", { type: "button", role: "tab", "aria-selected": tab === key, className: tab === key ? css.tabOn : css.tabOff, onClick: () => { selectTab(key); }, children: t(`tab.${key}`) }, key))) }), tab === 'detail' || tab === 'create' ? (_jsxs("div", { className: css.drillBar, children: [_jsx("button", { type: "button", className: css.back, onClick: () => { actions.back(); }, children: t('back') }), _jsx("span", { className: css.drillTitle, children: t(`tab.${tab}`) })] })) : null, _jsxs("div", { className: css.body, children: [tab === 'tasks' && renderSlot('workbench.drawer.tasks', owner), tab === 'taskList' && renderSlot('workbench.drawer.taskList', owner), tab === 'inbox' && renderSlot('workbench.drawer.inbox', {}), tab === 'clarifications' && renderSlot('workbench.drawer.clarifications', {}), tab === 'detail' && renderSlot('workbench.drawer.detail', { taskId: detailTaskId, openInbox: owner.openInbox }), tab === 'create' && renderSlot('workbench.drawer.create', owner)] }), renderSlot('workbench.drawer.recipeLibrary', { open: recipesOpen, onClose: () => { actions.closeRecipes(); } })] }));
}
//# sourceMappingURL=WorkbenchDrawer.js.map