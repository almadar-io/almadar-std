import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from 'fs';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';

/**
 * Copy the canonical data sidecars (registry `.orb` tree + generated JSON catalogs)
 * from `behaviors/` into `dist/`. This is the ONLY part of the build the interpreter,
 * `runtime-verify`, and the orbital binary's `ORBITAL_STD_BEHAVIORS_DIR` override read
 * at runtime — none of them touch the compiled factory-function JS. Shared by tsup's
 * `onSuccess` (full build) and the `build:data` script (fast dev-loop refresh, no bundle),
 * so the copy set can never drift between the two.
 *
 * Filters:
 *  - Only `.orb` and `.json` files are copied (the runtime only needs these).
 *  - `.orbital/`, `.git/`, `node_modules/`, `dist/`, `output/`, and other scaffolding
 *    directories are skipped, so stray `orb create` skeletons never ship in the tarball.
 *  - The registry tree is published once under `dist/behaviors/registry/`; the legacy
 *    `dist/registry/` path is kept only for `factory-signatures.json` (read by the
 *    factory-signature loader) to avoid duplicating the whole tree.
 */

const EXCLUDED_DIRS = new Set([
  '.orbital',
  '.git',
  'node_modules',
  'dist',
  'output',
  'coverage',
  '.turbo',
  '.pnpm',
]);
const ALLOWED_EXTS = new Set(['.orb', '.json']);

function shouldSkipDir(name) {
  return EXCLUDED_DIRS.has(name) || name.startsWith('.');
}

function copyFiltered(srcDir, dstDir) {
  mkdirSync(dstDir, { recursive: true });
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = join(srcDir, entry.name);
    const dstPath = join(dstDir, entry.name);
    if (entry.isDirectory()) {
      if (shouldSkipDir(entry.name)) continue;
      copyFiltered(srcPath, dstPath);
    } else if (entry.isFile()) {
      const dot = entry.name.lastIndexOf('.');
      const ext = dot >= 0 ? entry.name.slice(dot) : '';
      if (!ALLOWED_EXTS.has(ext)) continue;
      mkdirSync(dirname(dstPath), { recursive: true });
      copyFileSync(srcPath, dstPath);
    }
  }
}

function copyIfExists(src, dst) {
  if (!existsSync(src)) return;
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
}

export function copyDistSidecars() {
  // Runtime registry layout (used by @almadar/runtime external-loader).
  copyFiltered('behaviors/registry', 'dist/behaviors/registry');

  // Legacy location for factory-signatures.json only (loader reads
  // `<dataDir>/registry/factory-signatures.json`). Do NOT duplicate the orb tree here.
  copyIfExists(
    'behaviors/registry/factory-signatures.json',
    'dist/registry/factory-signatures.json',
  );

  // Catalog + embedding manifests. Root dist copies are consumed by the loaders
  // (`getBehaviorRegistry`, `getBehaviorEmbeddings`, `getKnobEmbeddings`); nested
  // `dist/behaviors/` copies are consumed by `tools/almadar-pattern-sync` and some
  // legacy CI paths.
  copyIfExists('behaviors/behaviors-registry.json', 'dist/behaviors/behaviors-registry.json');
  copyIfExists('behaviors/behaviors-registry.json', 'dist/behaviors-registry.json');
  copyIfExists('behaviors/behaviors-embeddings.json', 'dist/behaviors/behaviors-embeddings.json');
  copyIfExists('behaviors/behaviors-embeddings.json', 'dist/behaviors-embeddings.json');
  copyIfExists('behaviors/knob-embeddings.json', 'dist/behaviors/knob-embeddings.json');
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
