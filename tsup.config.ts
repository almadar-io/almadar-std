import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'index.ts',
    'registry.ts',
    'modules/*.ts',
  ],
  format: ['esm'],
  // The DTS type-check dominates build time but the runtime (interpreter / runtime-verify)
  // never reads `.d.ts` — only the compiled JS + `.orb` registry. The overlay dev loop sets
  // ALMADAR_FAST_OVERLAY to skip declaration emit; publish/CI leaves it unset → full types.
  // When skipping DTS, do NOT clean dist/ or the existing `.d.ts` files required by
  // downstream packages' tsc checks would be deleted.
  dts: !process.env.ALMADAR_FAST_OVERLAY,
  clean: !process.env.ALMADAR_FAST_OVERLAY,
  sourcemap: false,
  splitting: true,
  treeshake: true,
});
