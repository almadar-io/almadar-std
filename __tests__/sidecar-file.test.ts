import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveDeclaredDataFile, resolveSidecarFile, type DeclaredDataFileRequest, type SidecarFileRequest } from '../behaviors/data-dir.js';
import { readKnobEmbeddingsFile } from '../behaviors/knob-embeddings.js';

const PKG = 'sidecar-test-pkg';
const REL = 'dist/knob-embeddings.json';
const orb = {
  prefix: 'x',
  registry: 'r',
  index: 'i',
  factorySignatures: 'f',
  loloContracts: 'l',
  signatures: 's',
  embeddings: [REL],
  compiler: '>=1.0.0',
};

function knobFile(marker: string): string {
  return JSON.stringify({ model: marker, dimensions: 1, vectors: { k: [1] } });
}

describe('resolveSidecarFile', () => {
  let tmp: string;
  let pkgRoot: string;
  let cache: string;
  let request: SidecarFileRequest;
  const saved = { cache: process.env['ALMADAR_SIDECAR_CACHE'], override: process.env['SIDECAR_TEST_DIR'] };

  beforeEach(() => {
    tmp = realpathSync(mkdtempSync(join(tmpdir(), 'sidecar-file-')));
    pkgRoot = join(tmp, 'node_modules', PKG);
    cache = join(tmp, 'cache');
    mkdirSync(join(pkgRoot, 'dist'), { recursive: true });
    mkdirSync(cache, { recursive: true });
    writeFileSync(join(pkgRoot, 'package.json'), JSON.stringify({ name: PKG, version: '1.0.0', orb }));
    writeFileSync(join(pkgRoot, REL), knobFile('package-copy'));
    process.env['ALMADAR_SIDECAR_CACHE'] = cache;
    delete process.env['SIDECAR_TEST_DIR'];
    request = {
      packageName: PKG,
      fromUrl: pathToFileURL(join(tmp, 'caller.js')).href,
      relPath: REL,
      overrideEnv: 'SIDECAR_TEST_DIR',
      dataDir: async () => join(tmp, 'module-relative'),
    };
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
    if (saved.cache === undefined) delete process.env['ALMADAR_SIDECAR_CACHE'];
    else process.env['ALMADAR_SIDECAR_CACHE'] = saved.cache;
    if (saved.override === undefined) delete process.env['SIDECAR_TEST_DIR'];
    else process.env['SIDECAR_TEST_DIR'] = saved.override;
  });

  it('resolves a lock-declared file to its pre-seeded cache entry, not the package copy', async () => {
    const cached = knobFile('cached-copy');
    const sha256 = createHash('sha256').update(cached).digest('hex');
    writeFileSync(join(cache, sha256), cached);
    writeFileSync(
      join(pkgRoot, 'sidecars.lock.json'),
      JSON.stringify({ version: 1, files: { [REL]: { sha256, bytes: Buffer.byteLength(cached), url: 'https://store.invalid/blob' } } }),
    );
    const path = await resolveSidecarFile(request);
    expect(path).toBe(join(cache, sha256));
    expect((await readKnobEmbeddingsFile(path))?.model).toBe('cached-copy');
  });

  it('fails with ORB_SIDECAR_FETCH_FAILED for an uncached lock entry instead of reading the package copy', async () => {
    const bytes = Buffer.from('x');
    writeFileSync(
      join(pkgRoot, 'sidecars.lock.json'),
      JSON.stringify({
        version: 1,
        files: { [REL]: { sha256: createHash('sha256').update(bytes).digest('hex'), bytes: 1, url: 'http://127.0.0.1:1/blob' } },
      }),
    );
    await expect(resolveSidecarFile(request)).rejects.toThrow(/ORB_SIDECAR_FETCH_FAILED/);
  });

  it('reads a package without a lock from its own file', async () => {
    const path = await resolveSidecarFile(request);
    expect(path).toBe(join(pkgRoot, REL));
    expect(JSON.parse(readFileSync(path, 'utf-8')).model).toBe('package-copy');
  });

  it('reads a path absent from the lock from the package even when the lock declares other files', async () => {
    writeFileSync(
      join(pkgRoot, 'sidecars.lock.json'),
      JSON.stringify({ version: 1, files: { 'dist/other.json': { sha256: 'a'.repeat(64), bytes: 1, url: 'https://store.invalid/o' } } }),
    );
    expect(await resolveSidecarFile(request)).toBe(join(pkgRoot, REL));
  });

  it('lets the data-dir override win over the package and its lock', async () => {
    process.env['SIDECAR_TEST_DIR'] = join(tmp, 'override');
    expect(await resolveSidecarFile(request)).toBe(join(tmp, 'override', 'knob-embeddings.json'));
  });

  it('falls back to the module-relative data dir when the package is not installed', async () => {
    expect(await resolveSidecarFile({ ...request, packageName: 'not-installed-anywhere-pkg' })).toBe(
      join(tmp, 'module-relative', 'knob-embeddings.json'),
    );
  });
});

describe('resolveDeclaredDataFile — a declared key, read where the manifest says', () => {
  let tmp: string;
  let pkgRoot: string;
  let request: DeclaredDataFileRequest;
  const saved = process.env['SIDECAR_TEST_DIR'];

  function install(declared: string): void {
    writeFileSync(join(pkgRoot, 'package.json'), JSON.stringify({ name: PKG, version: '1.0.0', orb: { ...orb, factorySignatures: declared } }));
  }

  beforeEach(() => {
    tmp = realpathSync(mkdtempSync(join(tmpdir(), 'declared-data-')));
    pkgRoot = join(tmp, 'node_modules', PKG);
    mkdirSync(pkgRoot, { recursive: true });
    delete process.env['SIDECAR_TEST_DIR'];
    request = {
      packageName: PKG,
      fromUrl: pathToFileURL(join(tmp, 'caller.js')).href,
      key: 'factorySignatures',
      dataRel: 'registry/factory-signatures.json',
      overrideEnv: 'SIDECAR_TEST_DIR',
      dataDir: async () => join(tmp, 'module-relative'),
    };
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
    if (saved === undefined) delete process.env['SIDECAR_TEST_DIR'];
    else process.env['SIDECAR_TEST_DIR'] = saved;
  });

  it('follows the manifest: a published (dist) and a workspace (behaviors) declaration resolve to their own paths', async () => {
    install('dist/registry/factory-signatures.json');
    expect(await resolveDeclaredDataFile(request)).toBe(join(pkgRoot, 'dist/registry/factory-signatures.json'));
    install('behaviors/factory-signatures.json');
    expect(await resolveDeclaredDataFile(request)).toBe(join(pkgRoot, 'behaviors/factory-signatures.json'));
  });

  it('control: the bundle override wins, read at the data-dir layout', async () => {
    install('behaviors/factory-signatures.json');
    process.env['SIDECAR_TEST_DIR'] = join(tmp, 'override');
    expect(await resolveDeclaredDataFile(request)).toBe(join(tmp, 'override', 'registry/factory-signatures.json'));
  });

  it('edge: a package that is not installed reads the module-relative data dir', async () => {
    expect(await resolveDeclaredDataFile({ ...request, packageName: 'not-installed-anywhere-pkg' })).toBe(
      join(tmp, 'module-relative', 'registry/factory-signatures.json'),
    );
  });
});
