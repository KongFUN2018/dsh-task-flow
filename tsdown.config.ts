import { defineConfig } from 'tsdown'

/**
 * Host-only task-flow single package. The client/GUI packages stay in the
 * official DSH web monorepo; this package ships no browser bundle and no
 * `dsh.client` declaration. Build the type-checked entry + invariant
 * companion into `lib/`.
 */
export default defineConfig([
  {
    entry: ['lib/types/index.js'],
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
  },
  {
    entry: ['lib/types/invariant.js'],
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
  },
])
