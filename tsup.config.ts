import { defineConfig } from 'tsup';
import { copyDistSidecars } from './scripts/copy-dist-sidecars.mjs';

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
  // The DTS type-check dominates build time but the runtime (interpreter / runtime-verify)
  // never reads `.d.ts` — only the compiled JS + `.orb` registry. The overlay dev loop sets
  // ALMADAR_FAST_OVERLAY to skip declaration emit; publish/CI leaves it unset → full types.
  // When skipping DTS, do NOT clean dist/ or the existing `.d.ts` files required by
  // downstream packages' tsc checks would be deleted.
  dts: !process.env.ALMADAR_FAST_OVERLAY,
  clean: !process.env.ALMADAR_FAST_OVERLAY,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  // The data sidecars (registry .orb tree + JSON catalogs) are copied by the shared
  // `copyDistSidecars` helper — the same one the `build:data` fast-refresh script calls,
  // so the full build and the dev-loop refresh can never diverge on what lands in dist/.
  onSuccess: async () => {
    copyDistSidecars();
  },
});
