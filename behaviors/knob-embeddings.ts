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

export interface KnobEmbeddingsManifest {
  version: string;
  model: string;
  dimensions: number;
  vectors: Record<string, ReadonlyArray<number>>;
}

let cache: KnobEmbeddingsManifest | null = null;

async function loadManifest(): Promise<KnobEmbeddingsManifest | null> {
  if (cache) return cache;
  try {
    const { readFileSync } = await import('fs');
    const { resolve, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    const dir = dirname(fileURLToPath(import.meta.url));
    const raw = readFileSync(resolve(dir, 'knob-embeddings.json'), 'utf-8');
    const parsed = JSON.parse(raw) as KnobEmbeddingsManifest;
    if (
      typeof parsed?.model !== 'string' ||
      typeof parsed?.dimensions !== 'number' ||
      typeof parsed?.vectors !== 'object' ||
      parsed.vectors === null
    ) {
      return null;
    }
    cache = parsed;
    return cache;
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
