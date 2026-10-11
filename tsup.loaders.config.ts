import { defineConfig } from 'tsup';

/**
 * The behavior loaders alone (index / embeddings / factory signatures / data
 * dir), built in seconds for the dev loop (G-CROSS-142). The generated
 * factories under `behaviors/functions/` stay external: the loaders import
 * them at runtime from the last full build, so a loader edit never rebuilds
 * the factory corpus, and the `.lolo` data is never built in dev.
 */
export default defineConfig({
  entry: [
    'behaviors/query.ts',
    'behaviors/data-dir.ts',
    'behaviors/embeddings.ts',
    'behaviors/knob-embeddings.ts',
    'behaviors/factory-signatures.ts',
    'behaviors/exports-reader.ts',
    'behaviors/types.ts',
  ],
  outDir: process.env.LOADERS_OUT_DIR ?? 'dist/behaviors',
  format: ['esm'],
  dts: true,
  clean: false,
  splitting: false,
  sourcemap: false,
  external: [/\/functions\/index\.js$/, /^\.\/data-dir\.js$/, /^\.\/exports-reader\.js$/],
});
