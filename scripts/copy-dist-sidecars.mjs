import { cpSync, mkdirSync, existsSync } from 'fs';
import { pathToFileURL } from 'url';

/**
 * Copy the canonical data sidecars (registry `.orb` tree + generated JSON catalogs)
 * from `behaviors/` into `dist/`. This is the ONLY part of the build the interpreter,
 * `runtime-verify`, and the orbital binary's `ORBITAL_STD_BEHAVIORS_DIR` override read
 * at runtime — none of them touch the compiled factory-function JS. Shared by tsup's
 * `onSuccess` (full build) and the `build:data` script (fast dev-loop refresh, no bundle),
 * so the copy set can never drift between the two.
 */
export function copyDistSidecars() {
  mkdirSync('dist/behaviors', { recursive: true });
  cpSync('behaviors/registry', 'dist/behaviors/registry', { recursive: true });
  cpSync('behaviors/registry', 'dist/registry', { recursive: true });
  cpSync('behaviors/behaviors-registry.json', 'dist/behaviors/behaviors-registry.json');
  cpSync('behaviors/behaviors-registry.json', 'dist/behaviors-registry.json');
  try {
    cpSync('behaviors/behaviors-embeddings.json', 'dist/behaviors/behaviors-embeddings.json');
    cpSync('behaviors/behaviors-embeddings.json', 'dist/behaviors-embeddings.json');
  } catch {
    // Bake step skipped (no OPENAI_API_KEY) — consumers fall back to the full catalog walk.
  }
  try {
    cpSync('behaviors/knob-embeddings.json', 'dist/behaviors/knob-embeddings.json');
    cpSync('behaviors/knob-embeddings.json', 'dist/knob-embeddings.json');
  } catch {
    // Bake step skipped — consumers fall back to the full per-knob render.
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  if (!existsSync('behaviors/behaviors-registry.json')) {
    console.error('[build:data] behaviors/behaviors-registry.json missing — run the cascade `behaviors` step first.');
    process.exit(1);
  }
  copyDistSidecars();
  console.log('[build:data] dist data sidecars refreshed (registry .orb + behaviors-registry.json).');
}
