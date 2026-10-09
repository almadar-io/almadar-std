import { describe, expect, it } from 'vitest';
import {
  decodeKnobEmbeddingsFile,
  getKnobEmbeddings,
  type StoredKnobEmbeddingsFile,
} from '../behaviors/knob-embeddings.js';

function quantize(values: number[]): { s: number; d: string } {
  const s = Math.max(...values.map(Math.abs));
  const bytes = Buffer.from(Int8Array.from(values, (v) => Math.round((v * 127) / s)).buffer);
  return { s, d: bytes.toString('base64') };
}

function floatDecode(stored: { s: number; d: string }): number[] {
  const bytes = Buffer.from(stored.d, 'base64');
  return Array.from({ length: bytes.length }, (_, i) => (bytes.readInt8(i) * stored.s) / 127);
}

function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

const header = { version: '1', model: 'test-model', dimensions: 4 } as const;

describe('decodeKnobEmbeddingsFile', () => {
  it('keeps flat int8 vectors as Int8Array views over one buffer sized keys × dimensions', () => {
    const file: StoredKnobEmbeddingsFile = {
      ...header,
      encoding: 'int8-b64',
      vectors: { a: quantize([0.5, -0.25, 0.1, 0]), b: quantize([-1, 0.5, 0.5, 0.2]) },
    };
    const manifest = decodeKnobEmbeddingsFile(file);
    expect(manifest).not.toBeNull();
    const a = manifest!.vectors.a;
    const b = manifest!.vectors.b;
    expect(a).toBeInstanceOf(Int8Array);
    expect(a.length).toBe(4);
    expect(a.buffer).toBe(b.buffer);
    expect(a.buffer.byteLength).toBe(2 * 4);
  });

  it('decodes each interned table entry once and shares it across every key pointing at it', () => {
    const file: StoredKnobEmbeddingsFile = {
      ...header,
      encoding: 'int8-b64',
      table: [quantize([1, 0, 0, 0]), quantize([0, 1, 0, 0])],
      keys: { x: 0, y: 0, z: 1 },
    };
    const manifest = decodeKnobEmbeddingsFile(file)!;
    expect(manifest.vectors.x.buffer.byteLength).toBe(2 * 4);
    expect(manifest.vectors.x.byteOffset).toBe(manifest.vectors.y.byteOffset);
    expect(manifest.vectors.z.byteOffset).not.toBe(manifest.vectors.x.byteOffset);
  });

  it('drops an interned key whose index is outside the table, as the float loader did', () => {
    const file: StoredKnobEmbeddingsFile = {
      ...header,
      table: [quantize([1, 0, 0, 0])],
      keys: { inRange: 0, outOfRange: 7 },
    };
    const manifest = decodeKnobEmbeddingsFile(file)!;
    expect(Object.keys(manifest.vectors)).toEqual(['inRange']);
  });

  it('quantizes a legacy float vector so it ranks like the floats it came from', () => {
    const floats = [0.3, -0.7, 0.05, 0.6];
    const manifest = decodeKnobEmbeddingsFile({ ...header, vectors: { legacy: floats } })!;
    expect(manifest.vectors.legacy).toBeInstanceOf(Int8Array);
    expect(cosine(manifest.vectors.legacy, floats)).toBeCloseTo(1, 4);
  });

  it('ranks int8 vectors identically to the old float decode (cosine ignores the scale)', () => {
    const stored = {
      k1: quantize([0.9, 0.1, -0.2, 0.05]),
      k2: quantize([-0.1, 0.8, 0.3, 0.2]),
      k3: quantize([0.4, 0.4, 0.4, -0.4]),
    };
    const manifest = decodeKnobEmbeddingsFile({ ...header, encoding: 'int8-b64', vectors: stored })!;
    const request = [0.7, 0.2, -0.1, 0.1];
    const keys = Object.keys(stored) as Array<keyof typeof stored>;
    for (const key of keys) {
      expect(cosine(request, manifest.vectors[key])).toBeCloseTo(cosine(request, floatDecode(stored[key])), 12);
    }
  });

  it('returns null for a file without a model, dimensions, or vectors', () => {
    expect(decodeKnobEmbeddingsFile({ version: '1', dimensions: 4, vectors: {} })).toBeNull();
    expect(decodeKnobEmbeddingsFile({ version: '1', model: 'm', vectors: {} })).toBeNull();
    expect(decodeKnobEmbeddingsFile({ ...header })).toBeNull();
  });

  it('returns null when a stored vector does not match the declared dimensions', () => {
    const file: StoredKnobEmbeddingsFile = { ...header, vectors: { short: quantize([1, 0, 0]) } };
    expect(decodeKnobEmbeddingsFile(file)).toBeNull();
  });

  it('accepts a file with no knobs as an empty manifest', () => {
    const manifest = decodeKnobEmbeddingsFile({ ...header, vectors: {} });
    expect(manifest).not.toBeNull();
    expect(Object.keys(manifest!.vectors)).toHaveLength(0);
  });
});

describe('getKnobEmbeddings (baked sidecar)', () => {
  it('holds one byte per dimension per stored vector, never a float per dimension', async () => {
    const manifest = await getKnobEmbeddings();
    expect(manifest).not.toBeNull();
    const vectors = Object.values(manifest!.vectors);
    expect(vectors.length).toBeGreaterThan(0);
    const backing = vectors[0].buffer;
    expect(vectors.every((v) => v instanceof Int8Array && v.buffer === backing)).toBe(true);
    expect(backing.byteLength).toBeLessThanOrEqual(vectors.length * manifest!.dimensions);
  });
});
