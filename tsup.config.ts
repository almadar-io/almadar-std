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
    'behaviors/query.ts',
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
    cpSync('behaviors/exports', 'dist/behaviors/exports', { recursive: true });
    cpSync('behaviors/exports', 'dist/exports', { recursive: true });
    // Copy behaviors-registry.json so query.ts can find it at runtime.
    cpSync('behaviors/behaviors-registry.json', 'dist/behaviors/behaviors-registry.json');
    cpSync('behaviors/behaviors-registry.json', 'dist/behaviors-registry.json');
  },
});
