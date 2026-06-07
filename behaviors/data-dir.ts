/**
 * Location-independent resolver for std's publish-time data sidecars
 * (`registry/factory-signatures.json`, `behaviors-registry.json`,
 * `behaviors-embeddings.json`, `knob-embeddings.json` — all under `dist/`).
 *
 * The loaders used to derive their directory from `import.meta.url`, which
 * breaks the moment `@almadar/std` is inlined into a downstream single-file
 * bundle (e.g. the orb agent's `cli.js`): `import.meta.url` then points at the
 * bundle, not at this package, so the sidecars aren't found. Resolution order:
 *
 *   1. `ALMADAR_STD_DATA_DIR` — explicit override. For embedded/bundled
 *      deployments that ship the sidecars to a known directory.
 *   2. Package identity — `require.resolve('@almadar/std/package.json')` →
 *      the package's own `dist/`. Robust whether installed in node_modules or
 *      shipped (data-only) beside a bundle. Requires `./package.json` in the
 *      package `exports`.
 *   3. `import.meta.url` — module-relative. The original behavior; correct for
 *      the normal unbundled case and the last-resort fallback.
 */

import { createRequire } from 'module';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

let cached: string | null = null;

export function resolveStdDataDir(): string {
  if (cached) return cached;

  const override = process.env.ALMADAR_STD_DATA_DIR;
  if (override) return (cached = override);

  try {
    const req = createRequire(import.meta.url);
    return (cached = resolve(dirname(req.resolve('@almadar/std/package.json')), 'dist'));
  } catch {
    // @almadar/std not resolvable on disk (e.g. bundled with no package present
    // and no sidecars shipped) — fall through to the module-relative path.
  }

  return (cached = dirname(fileURLToPath(import.meta.url)));
}
