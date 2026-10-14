import { defineConfig } from 'tsup';

/**
 * The behavior loaders alone (index / embeddings / data
 * dir), built in seconds for the dev loop (G-CROSS-142); the `.lolo` data is
 * never built in dev.
 */
export default defineConfig({
  entry: [
    'behaviors/query.ts',
    'behaviors/data-dir.ts',
    'behaviors/embeddings.ts',
    'behaviors/knob-embeddings.ts',
    'behaviors/exports-reader.ts',
    'behaviors/types.ts',
  ],
  outDir: process.env.LOADERS_OUT_DIR ?? 'dist/behaviors',
  format: ['esm'],
  dts: true,
  clean: false,
  splitting: false,
  sourcemap: false,
  external: [/^\.\/data-dir\.js$/, /^\.\/exports-reader\.js$/],
});
