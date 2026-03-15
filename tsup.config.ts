import { defineConfig } from 'tsup';
import { cpSync } from 'fs';

export default defineConfig({
  entry: [
    'index.ts',
    'registry.ts',
    'modules/*.ts',
    'behaviors/index.ts',
    'behaviors/types.ts',
    'behaviors/exports-reader.ts',
    'behaviors/functions/index.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  onSuccess: async () => {
    // Copy golden .orb files so exports-reader.ts can find them at runtime.
    // The standalone entry point (dist/behaviors/exports-reader.js) resolves
    // __dirname to dist/behaviors/, so it needs dist/behaviors/exports/.
    // The bundled index.js resolves __dirname to dist/, so it needs dist/exports/.
    cpSync('behaviors/exports', 'dist/behaviors/exports', { recursive: true });
    cpSync('behaviors/exports', 'dist/exports', { recursive: true });
  },
});
