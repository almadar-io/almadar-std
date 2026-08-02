import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { pathToFileURL } from 'url';

/**
 * Copy the generated JSON sidecars from `behaviors/` into `dist/` — the ONE
 * shipped location per the data-dir contract (`behaviors/data-dir.ts`). Shared
 * by tsup's `onSuccess` (full build) and the `build:data` script (fast dev-loop
 * refresh, no bundle), so the copy set can never drift between the two. The
 * `.orb` registry tree is NOT mirrored into dist — every tree reader (the
 * @almadar/runtime external-loader, runtime-verify, the cascade's
 * `ORBITAL_STD_BEHAVIORS_DIR` override) reads the source layout
 * (`<pkgRoot>/behaviors/registry`), which ships via the package.json `files`
 * allowlist.
 */

function copyIfExists(src, dst) {
  if (!existsSync(src)) return;
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
}

export function copyDistSidecars() {
  // ONE shipped copy per sidecar (tarball-size dedupe, 2026-08-02). The `.orb`
  // registry TREE ships only in the source layout (`behaviors/registry/<topic>`
  // in the `files` allowlist — the @almadar/runtime external-loader probes
  // `<pkgRoot>/behaviors/registry`); the JSON sidecars ship only under `dist/`
  // per the data-dir contract (`behaviors/data-dir.ts`), which is what the
  // shipped loaders (`getBehaviorRegistry`, `getBehaviorEmbeddings`,
  // `getKnobEmbeddings`) AND pattern-sync's pinned bake read.
  copyIfExists(
    'behaviors/registry/factory-signatures.json',
    'dist/registry/factory-signatures.json',
  );
  copyIfExists('behaviors/behaviors-registry.json', 'dist/behaviors-registry.json');
  copyIfExists('behaviors/behaviors-embeddings.json', 'dist/behaviors-embeddings.json');
  copyIfExists('behaviors/knob-embeddings.json', 'dist/knob-embeddings.json');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  if (!existsSync('behaviors/behaviors-registry.json')) {
    console.error('[build:data] behaviors/behaviors-registry.json missing — run the cascade `behaviors` step first.');
    process.exit(1);
  }
  copyDistSidecars();
  console.log('[build:data] dist data sidecars refreshed (.orb + .json only, .orbital skipped).');
}
