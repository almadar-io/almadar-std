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

export interface SidecarFileRequest {
  /** npm name of the behavior package that declares the file. */
  packageName: string;
  /** `import.meta.url` of the calling module — where the package is resolved from. */
  fromUrl: string;
  /** Package-relative declared path, e.g. `dist/knob-embeddings.json`. */
  relPath: string;
  /** Env var naming a directory that holds the file by basename (bundled deployments). */
  overrideEnv: string;
  /** Module-relative data dir, used when the package cannot be resolved on disk. */
  dataDir: () => Promise<string>;
}

type BehaviorPackage = import('@almadar/core/behavior-package').BehaviorPackage;
type DeclaredFileKey = import('@almadar/core/behavior-package').DeclaredFileKey;

/** The installed package `request` names, or `null` when it is not on disk (a bundle shipped without it). */
async function installedPackage(request: Pick<SidecarFileRequest, 'packageName' | 'fromUrl'>): Promise<BehaviorPackage | null> {
  const [nodePath, nodeUrl] = await Promise.all([import('path'), import('url')]);
  const { findInstalledBehaviorPackage } = await import('@almadar/core/behavior-package');
  try {
    return findInstalledBehaviorPackage(request.packageName, nodePath.dirname(nodeUrl.fileURLToPath(request.fromUrl)));
  } catch {
    return null;
  }
}

/** A package-relative path: through the sidecar cache when `sidecars.lock.json` declares it, else the package's own file. */
async function fileInPackage(pkg: BehaviorPackage, relPath: string): Promise<string> {
  const [nodePath, { ensureDeclaredPath }] = await Promise.all([import('path'), import('@almadar/core/behavior-package')]);
  if (!pkg.lock?.files[relPath]) return nodePath.join(pkg.root, relPath);
  return ensureDeclaredPath(pkg, relPath);
}

function requireNode(what: string): void {
  if (typeof process === 'undefined' || !process.versions?.node) {
    throw new Error(`${what}: no filesystem to resolve a sidecar file`);
  }
}

/**
 * Absolute path of a declared sidecar file. A path in the package's
 * `sidecars.lock.json` resolves through the sidecar cache (downloaded and
 * verified on a miss); any other path is read from the package, and the
 * caller handles it being absent.
 */
export async function resolveSidecarFile(request: SidecarFileRequest): Promise<string> {
  const nodePath = await import('path');
  const name = nodePath.basename(request.relPath);
  const override = (typeof process !== 'undefined' && process.env?.[request.overrideEnv]) || '';
  if (override) return nodePath.join(override, name);
  requireNode(request.relPath);
  const pkg = await installedPackage(request);
  if (pkg === null) return nodePath.join(await request.dataDir(), name);
  return fileInPackage(pkg, request.relPath);
}

export interface DeclaredDataFileRequest extends Omit<SidecarFileRequest, 'relPath'> {
  /** The `orb` manifest key declaring the file. */
  key: DeclaredFileKey;
  /** The file's path inside an override or module-relative data dir (bundled deployments). */
  dataRel: string;
}

/**
 * Absolute path of a file the package declares under `orb.<key>`: the bundle
 * override dir, else the installed package's declared path (so a workspace
 * and a published manifest each resolve to their own layout), else the
 * module-relative data dir of a bundle shipped without its package.
 */
export async function resolveDeclaredDataFile(request: DeclaredDataFileRequest): Promise<string> {
  const nodePath = await import('path');
  const override = (typeof process !== 'undefined' && process.env?.[request.overrideEnv]) || '';
  if (override) return nodePath.join(override, request.dataRel);
  requireNode(`orb.${request.key}`);
  const pkg = await installedPackage(request);
  if (pkg === null) return nodePath.join(await request.dataDir(), request.dataRel);
  return fileInPackage(pkg, pkg.orb[request.key]);
}

export function resolveStdDeclaredFile(key: DeclaredFileKey, dataRel: string): Promise<string> {
  return resolveDeclaredDataFile({
    packageName: '@almadar/std',
    fromUrl: import.meta.url,
    key,
    dataRel,
    overrideEnv: 'ALMADAR_STD_DATA_DIR',
    dataDir: resolveStdDataDir,
  });
}

export function resolveStdSidecarFile(relPath: string): Promise<string> {
  return resolveSidecarFile({
    packageName: '@almadar/std',
    fromUrl: import.meta.url,
    relPath,
    overrideEnv: 'ALMADAR_STD_DATA_DIR',
    dataDir: resolveStdDataDir,
  });
}
