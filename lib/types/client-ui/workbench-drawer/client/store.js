/**
 * Workbench drawer UI store: the shared interaction state that rides across
 * the two registrations — the sidebar.footer.action trigger button and the
 * shell.overlay drawer panel. The trigger and the panel are separate slot
 * entries in different containers, so open/tab/detail selection live here
 * (a declared store, per the client layering rules) instead of a single
 * component's local state.
 */
import { defineStore } from '@deepseek-ai/dsh-client-runtime/client';
/**
 * Create the shared drawer interaction store handle.
 * @returns the store handle (spec + type + identity + factory in one).
 */
export function createWorkbenchStore() {
    return defineStore({
        init: () => ({ open: false, tab: 'tasks', detailTaskId: undefined, createRecipeId: undefined, recipesOpen: false, returnTab: 'tasks' }),
        actions: {
            openDrawer: (d) => { d.open = true; },
            closeDrawer: (d) => { d.open = false; },
            toggleDrawer: (d) => { d.open = !d.open; },
            selectTab: (d, tab) => { d.tab = tab; d.returnTab = tab; },
            openDetail: (d, taskId) => { d.returnTab = d.tab; d.tab = 'detail'; d.detailTaskId = taskId; },
            setDetailTaskId: (d, taskId) => { d.detailTaskId = taskId; },
            openCreate: (d, recipeId) => { d.returnTab = d.tab; d.tab = 'create'; d.createRecipeId = recipeId; },
            setCreateRecipeId: (d, recipeId) => { d.createRecipeId = recipeId; },
            openRecipes: (d) => { d.open = true; d.recipesOpen = true; },
            closeRecipes: (d) => { d.recipesOpen = false; },
            back: (d) => { d.tab = d.returnTab; },
        },
    });
}
//# sourceMappingURL=store.js.map