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

// Node builtins are loaded via DYNAMIC import (not static `import { … }`) so browser
// bundlers (vite/rollup) keep `@almadar/std` bundleable — a static named/namespace
// import of `module`/`path`/`url` makes them error on the browser stub. In the
// browser the node branch is skipped and resolution returns "" (the data sidecars
// aren't read there anyway — the loaders are behind their own dynamic `import('fs')`).
// Promise-memoized (not result-memoized): concurrent first callers share ONE
// in-flight resolution — the `if (cached) … await … cached =` form let two
// concurrent loads interleave.
let pending: Promise<string> | null = null;

export function resolveStdDataDir(): Promise<string> {
  pending ??= resolveStdDataDirUncached();
  return pending;
}

async function resolveStdDataDirUncached(): Promise<string> {
  const override = (typeof process !== 'undefined' && process.env?.ALMADAR_STD_DATA_DIR) || '';
  if (override) return override;

  // Browser / non-Node: no filesystem, no sidecars to resolve.
  if (typeof process === 'undefined' || !process.versions?.node) return '';

  const [{ createRequire }, nodePath, nodeUrl] = await Promise.all([
    import('module'),
    import('path'),
    import('url'),
  ]);
  try {
    const req = createRequire(import.meta.url);
    return nodePath.resolve(nodePath.dirname(req.resolve('@almadar/std/package.json')), 'dist');
  } catch {
    // @almadar/std not resolvable on disk (bundled w/o the package) — fall through.
  }
  return nodePath.dirname(nodeUrl.fileURLToPath(import.meta.url));
}
