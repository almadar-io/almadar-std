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
    'behaviors/embeddings.ts',
    'behaviors/factory-signatures.ts',
    'behaviors/knob-embeddings.ts',
    'behaviors/functions/index.ts',
    'factory-runtime/index.ts',
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
    // Mirror the same registry tree at `dist/registry/` so the bundled
    // `dist/index.js` (where `import.meta.url` resolves to `dist/`) can
    // also locate `factory-signatures.json`. Mirrors the dual-copy
    // pattern used for `behaviors-registry.json` / `behaviors-embeddings.json`.
    cpSync('behaviors/registry', 'dist/registry', { recursive: true });
    // Copy behaviors-registry.json so query.ts can find it at runtime.
    cpSync('behaviors/behaviors-registry.json', 'dist/behaviors/behaviors-registry.json');
    cpSync('behaviors/behaviors-registry.json', 'dist/behaviors-registry.json');
    // Copy behaviors-embeddings.json (when the bake step ran). When the
    // file is absent, consumers fall back to the full catalog walk —
    // `getBehaviorEmbeddings()` returns null gracefully.
    try {
      cpSync('behaviors/behaviors-embeddings.json', 'dist/behaviors/behaviors-embeddings.json');
      cpSync('behaviors/behaviors-embeddings.json', 'dist/behaviors-embeddings.json');
    } catch {
      // Bake step skipped (no OPENAI_API_KEY) — that's OK, consumers fall back.
    }
    // Copy knob-embeddings.json (publish-time bake). Same dual-copy
    // pattern: one next to `dist/behaviors/knob-embeddings.js` so the
    // un-bundled ESM loader finds it, one at the dist root so the
    // bundled entry's `import.meta.url` resolution also works.
    try {
      cpSync('behaviors/knob-embeddings.json', 'dist/behaviors/knob-embeddings.json');
      cpSync('behaviors/knob-embeddings.json', 'dist/knob-embeddings.json');
    } catch {
      // Bake step skipped — consumers fall back to full per-knob render.
    }
  },
});
