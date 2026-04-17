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
    // Copy the canonical registry .orb files into dist/ so downstream consumers
    // that walk `node_modules/@almadar/std/behaviors/registry/` find them.
    // (Legacy copies under `dist/behaviors/exports/` and `dist/exports/` are
    // intentionally not emitted anymore — the `behaviors/exports/` layout is
    // retired as of 2026-04-17.)
    cpSync('behaviors/registry', 'dist/behaviors/registry', { recursive: true });
    // Copy behaviors-registry.json so query.ts can find it at runtime.
    cpSync('behaviors/behaviors-registry.json', 'dist/behaviors/behaviors-registry.json');
    cpSync('behaviors/behaviors-registry.json', 'dist/behaviors-registry.json');
  },
});
