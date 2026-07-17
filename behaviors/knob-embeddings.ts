/**
 * Knob embeddings — typed loader for the publish-time
 * `knob-embeddings.json` artifact under `behaviors/`.
 *
 * Built by `scripts/build-knob-embeddings.ts` against the factory
 * signature catalog; one vector per overridable knob, keyed
 * `"<organism>/<orbital>/<trait>/<knob>"`. Stage A's catalog summary
 * ranks the surviving organism's knobs by cosine similarity to the
 * user's request and renders top-K in full detail (rest by name only),
 * bounding the prompt-size impact of per-knob descriptors.
 *
 * Loader mirrors `getBehaviorEmbeddings()` / `getFactorySignatureCatalog()`:
 * resolves the JSON relative to `import.meta.url`, parses on first
 * call, caches in memory.
 *
 * @packageDocumentation
 */

import { resolveStdDataDir } from './data-dir.js';

export interface KnobEmbeddingsManifest {
  version: string;
  model: string;
  dimensions: number;
  vectors: Record<string, ReadonlyArray<number>>;
}

/** Int8-quantized vector: `d` = base64 of one signed byte per dimension,
 *  `s` = per-vector max-abs scale; value = byte × s ÷ 127. Landed when the
 *  io manifest (41k knobs × 768 float literals) outgrew GitHub's 100 MB
 *  blob limit; cosine rank drift is negligible at 8 bits. */
export interface QuantizedKnobVector {
  s: number;
  d: string;
}

export type StoredKnobVector = ReadonlyArray<number> | QuantizedKnobVector;

/** On-disk knob file. Two shapes are accepted:
 *  - non-interned (legacy): one stored vector per knob key in `vectors`.
 *  - interned: a `table` of unique stored vectors + a `keys` map from knob
 *    key to its table index (many identical-text knobs share one vector). */
export interface StoredKnobEmbeddingsFile {
  version: string;
  model: string;
  dimensions: number;
  encoding?: 'int8-b64';
  vectors?: Record<string, StoredKnobVector>;
  table?: StoredKnobVector[];
  keys?: Record<string, number>;
}

// Promise-memoized: concurrent first callers share ONE in-flight load; a
// `null` (missing/invalid manifest) is never cached so a later bake is
// picked up — same retry semantics the result-memoized form had, minus the
// concurrent-first-load race.
let pending: Promise<KnobEmbeddingsManifest | null> | null = null;

function decodeVector(stored: StoredKnobVector): ReadonlyArray<number> {
  if (!('d' in stored)) return stored;
  const bytes = Buffer.from(stored.d, 'base64');
  const out = new Array<number>(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = (bytes.readInt8(i) * stored.s) / 127;
  }
  return out;
}

/** Reconstruct the public `key → vector` map from either on-disk shape.
 *  Interned table entries are decoded ONCE and shared across every key that
 *  points at them. */
function reconstructVectors(parsed: StoredKnobEmbeddingsFile): Record<string, ReadonlyArray<number>> {
  const vectors: Record<string, ReadonlyArray<number>> = {};
  if (parsed.table && parsed.keys) {
    const decoded = parsed.table.map(decodeVector);
    for (const [key, idx] of Object.entries(parsed.keys)) {
      const vec = decoded[idx];
      if (vec) vectors[key] = vec;
    }
    return vectors;
  }
  for (const [key, stored] of Object.entries(parsed.vectors ?? {})) {
    vectors[key] = decodeVector(stored);
  }
  return vectors;
}

function loadManifest(): Promise<KnobEmbeddingsManifest | null> {
  pending ??= loadManifestUncached().then((m) => {
    if (m === null) pending = null;
    return m;
  });
  return pending;
}

async function loadManifestUncached(): Promise<KnobEmbeddingsManifest | null> {
  try {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const dir = await resolveStdDataDir();
    const raw = readFileSync(resolve(dir, 'knob-embeddings.json'), 'utf-8');
    const parsed = JSON.parse(raw) as StoredKnobEmbeddingsFile;
    const interned = typeof parsed?.table === 'object' && typeof parsed?.keys === 'object';
    const nonInterned = typeof parsed?.vectors === 'object' && parsed.vectors !== null;
    if (typeof parsed?.model !== 'string' || typeof parsed?.dimensions !== 'number' || (!interned && !nonInterned)) {
      return null;
    }
    return {
      version: parsed.version,
      model: parsed.model,
      dimensions: parsed.dimensions,
      vectors: reconstructVectors(parsed),
    };
  } catch {
    return null;
  }
}

/**
 * Return the typed knob embeddings manifest. Returns `null` when the
 * JSON sidecar is missing (older std checkout, or a dev build with
 * `OPEN_ROUTER_API_KEY` unset at `build:knob-embeddings` time).
 * Consumers must degrade gracefully (fall back to full per-knob render).
 */
export async function getKnobEmbeddings(): Promise<KnobEmbeddingsManifest | null> {
  return loadManifest();
}
