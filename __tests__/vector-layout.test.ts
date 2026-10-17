import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg: {
  orb: Record<string, unknown>;
  scripts: Record<string, string>;
  files: string[];
} = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const RETIRED = ['behaviors-embeddings', 'knob-embeddings', 'embed.mjs', 'build:embeddings', 'build:knob-embeddings'];

function lockedPaths(): string[] {
  const lock = join(root, 'sidecars.lock.json');
  if (!existsSync(lock)) return [];
  const parsed: { files?: Record<string, object> } = JSON.parse(readFileSync(lock, 'utf8'));
  return Object.keys(parsed.files ?? {});
}

describe('retired legacy behavior embeddings', () => {
  it('declares no embeddings in the orb block', () => {
    expect(pkg.orb['embeddings']).toBeUndefined();
  });

  it('exposes no embedding build script and its default build runs none', () => {
    expect(Object.keys(pkg.scripts).filter((name) => name.includes('embeddings'))).toEqual([]);
    expect(Object.values(pkg.scripts).filter((cmd) => RETIRED.some((r) => cmd.includes(r)))).toEqual([]);
  });

  it('ships no legacy embedding module, script or sidecar file', () => {
    for (const rel of ['behaviors/embeddings.ts', 'behaviors/knob-embeddings.ts', 'scripts/embed.mjs']) {
      expect(existsSync(join(root, rel)), rel).toBe(false);
    }
    expect(pkg.files.filter((f) => RETIRED.some((r) => f.includes(r)))).toEqual([]);
  });

  it('does not export the legacy loaders from the package root', () => {
    const index = readFileSync(join(root, 'index.ts'), 'utf8');
    expect(index).not.toMatch(/getBehaviorEmbedding|getKnobEmbeddings|KnobEmbeddingsManifest|BehaviorEmbeddingsManifest/);
  });

  it('control: the sidecar lock carries no legacy embedding path', () => {
    expect(lockedPaths().filter((p) => RETIRED.some((r) => p.includes(r)))).toEqual([]);
  });
});
