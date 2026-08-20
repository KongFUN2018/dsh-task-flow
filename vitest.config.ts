import { defineConfig } from 'vitest/config'
import ts from 'typescript'

// The task-flow host domain uses standard (TC39) TypeScript decorators for its
// Typert `@Remote` services. Vite/rolldown's default TS transform cannot parse
// them, so transpile them with TypeScript's own transpileModule (which emits
// standard `__esDecorate` semantics — exactly what TypertRemoteService
// requires) before Vite's default parser sees the source. Same strategy as the
// deepseek-harness monorepo's `standardDecoratorPlugin`.
const decoratorSyntax = /^\s*@[A-Za-z_$][\w$]*/m

function standardDecoratorPlugin() {
  return {
    name: 'dsh-task-flow-standard-decorators',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      const file = id.split('?', 1)[0]!
      if (!/\.[cm]?tsx?$/.test(file) || !decoratorSyntax.test(code)) return
      const result = ts.transpileModule(code, {
        fileName: file,
        compilerOptions: {
          target: ts.ScriptTarget.ES2024,
          module: ts.ModuleKind.ESNext,
          jsx: file.endsWith('x') ? ts.JsxEmit.ReactJSX : undefined,
          sourceMap: true,
        },
      })
      return {
        code: result.outputText
          .replace(
            /^(\s*)(__esDecorate\()/gmu,
            '$1/* v8 ignore next -- compiler-synthetic decorator accessors have no source behavior */ $2',
          )
          .replace(/\n?\/\/# sourceMappingURL=.*$/u, '\n'),
        map: result.sourceMapText,
      }
    },
  }
}

export default defineConfig({
  plugins: [standardDecoratorPlugin()],
  test: {
    include: ['tests/**/*.spec.ts'],
  },
})
