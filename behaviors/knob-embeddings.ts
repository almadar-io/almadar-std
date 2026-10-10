/**
 * Knob embeddings — typed loader for the publish-time
 * `knob-embeddings.json` artifact under `behaviors/`.
 *
 * Built by `almadar-calibrate embed` (via `scripts/embed.mjs`) against the factory
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

/** Each knob's vector as int8, all views over one shared buffer — the on-disk
 *  bytes, never widened to a float per dimension (that was 8× the memory and
 *  OOM-killed the builder server). The per-vector scale is dropped, so a
 *  vector here is a direction: compare it with cosine similarity only. */
export interface KnobEmbeddingsManifest {
  version: string;
  model: string;
  dimensions: number;
  vectors: Readonly<Record<string, Int8Array>>;
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

/** Write `stored` into `slot` as int8; false when its length is not `slot.length`. */
function writeVector(stored: StoredKnobVector, slot: Int8Array): boolean {
  if ('d' in stored) {
    const bytes = Buffer.from(stored.d, 'base64');
    if (bytes.length !== slot.length) return false;
    slot.set(new Int8Array(bytes.buffer, bytes.byteOffset, bytes.length));
    return true;
  }
  if (stored.length !== slot.length) return false;
  let maxAbs = 0;
  for (const v of stored) maxAbs = Math.max(maxAbs, Math.abs(v));
  for (let i = 0; i < stored.length; i++) {
    slot[i] = maxAbs === 0 ? 0 : Math.round((stored[i] * 127) / maxAbs);
  }
  return true;
}

/**
 * Decode a parsed `knob-embeddings.json` into int8 vectors over one buffer
 * sized (stored vectors × dimensions). Interned table entries are written
 * once and shared by every key that points at them. Returns `null` for a
 * file missing its model, dimensions or vectors, or holding a vector whose
 * length is not `dimensions`.
 */
export function decodeKnobEmbeddingsFile(parsed: Partial<StoredKnobEmbeddingsFile>): KnobEmbeddingsManifest | null {
  const interned = typeof parsed?.table === 'object' && typeof parsed?.keys === 'object';
  const nonInterned = typeof parsed?.vectors === 'object' && parsed.vectors !== null;
  if (typeof parsed?.model !== 'string' || typeof parsed?.dimensions !== 'number' || (!interned && !nonInterned)) {
    return null;
  }
  const dims = parsed.dimensions;
  const stored: StoredKnobVector[] = interned ? (parsed.table ?? []) : Object.values(parsed.vectors ?? {});
  const backing = new Int8Array(stored.length * dims);
  const slots: Int8Array[] = [];
  for (let i = 0; i < stored.length; i++) {
    const slot = backing.subarray(i * dims, (i + 1) * dims);
    if (!writeVector(stored[i], slot)) return null;
    slots.push(slot);
  }
  const vectors: Record<string, Int8Array> = {};
  if (interned) {
    for (const [key, idx] of Object.entries(parsed.keys ?? {})) {
      const slot = slots[idx];
      if (slot) vectors[key] = slot;
    }
  } else {
    Object.keys(parsed.vectors ?? {}).forEach((key, i) => {
      vectors[key] = slots[i];
    });
  }
  return { version: parsed.version ?? '', model: parsed.model, dimensions: dims, vectors };
}

/** Read and decode a `knob-embeddings.json` at `path`; `null` when it is missing or invalid. */
export async function readKnobEmbeddingsFile(path: string): Promise<KnobEmbeddingsManifest | null> {
  try {
    const { readFileSync } = await import('fs');
    return decodeKnobEmbeddingsFile(JSON.parse(readFileSync(path, 'utf-8')) as Partial<StoredKnobEmbeddingsFile>);
  } catch {
    return null;
  }
}

function loadManifest(): Promise<KnobEmbeddingsManifest | null> {
  pending ??= loadManifestUncached().then((m) => {
    if (m === null) pending = null;
    return m;
  });
  return pending;
}

async function loadManifestUncached(): Promise<KnobEmbeddingsManifest | null> {
  const { resolve } = await import('path');
  return readKnobEmbeddingsFile(resolve(await resolveStdDataDir(), 'knob-embeddings.json'));
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
