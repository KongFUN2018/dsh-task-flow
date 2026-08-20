/** Runtime value constructors and the error class for `@deepseek-ai/dsh-attention`. @module @deepseek-ai/dsh-attention */
/**
 * Brand a plain string as an attention item id.
 * @param id - the plain string to brand.
 * @returns the branded attention item id.
 */
export function AttentionItemId(id) {
    return id;
}
/** Domain error carrying a machine-routable code. */
export class AttentionError extends Error {
    /** The machine-routable failure code. */
    code;
    constructor(code, message) {
        super(message);
        this.name = 'AttentionError';
        this.code = code;
    }
}
//# sourceMappingURL=runtime.js.map