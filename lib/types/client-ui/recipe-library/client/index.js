import { RecipeLibraryController } from "./recipeLibrary.js";
import { RecipeLibraryAction } from "./RecipeLibraryAction.js";
import { en, NS, zh } from "./locales.js";
/** Required services for the drawer seat, the recipes Remote, and copy. */
export const inject = ['slots', 'remote', 'remote.recipes', 'locale'];
/**
 * Client plugin body: the dictionaries, the controller, and the drawer seat.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-recipe-library: dictionaries');
    const controller = new RecipeLibraryController(ctx);
    ctx.slots.inject('workbench.drawer.recipeLibrary', () => ctx.slots.register({
        name: 'workbench.drawer.recipeLibrary',
        locale: NS,
        inject: () => ({
            hooks: { library: controller.store },
            refresh: () => controller.refresh(),
        }),
    }, RecipeLibraryAction));
}
//# sourceMappingURL=index.js.map