/**
 * Behavior Embeddings — typed loader for the publish-time-baked
 * `behaviors-embeddings.json` artifact.
 *
 * The catalog in `behaviors-registry.json` lists every organism + atom
 * available in the std library. At publish time, `scripts/build-embeddings.ts`
 * calls the OpenAI Embeddings API once per entry and writes the resulting
 * vectors to `behaviors-embeddings.json`. Downstream consumers
 * (`@almadar-io/agent` Stage A cosine retrieval) read these vectors at
 * runtime to rank organisms / atoms against the user's request — top-K
 * survives into the prompt, the rest is filtered out.
 *
 * One embedding bake per std publish. Runtime cost: one OpenAI embed call
 * per Stage A turn (the user request); the catalog side is free.
 *
 * @packageDocumentation
 */

import { resolveStdDataDir } from './data-dir.js';

export interface BehaviorEmbeddingsManifest {
  /** Std version at bake time. Matches `package.json` `version`. */
  version: string;
  /** Embedding model used (e.g. `text-embedding-3-small`). */
  model: string;
  /** Vector dimensionality (e.g. 1536 for text-embedding-3-small). */
  dimensions: number;
  /** Per-behavior vectors keyed by canonical name (matches registry keys). */
  vectors: Record<string, readonly number[]>;
}

let cache: BehaviorEmbeddingsManifest | null = null;

async function loadManifest(): Promise<BehaviorEmbeddingsManifest | null> {
  if (cache) return cache;
  try {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const dir = await resolveStdDataDir();
    const raw = readFileSync(resolve(dir, 'behaviors-embeddings.json'), 'utf-8');
    const parsed = JSON.parse(raw) as BehaviorEmbeddingsManifest;
    if (
      typeof parsed?.version !== 'string' ||
      typeof parsed?.model !== 'string' ||
      typeof parsed?.dimensions !== 'number' ||
      !parsed?.vectors ||
      typeof parsed.vectors !== 'object'
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
 * Return the typed embeddings manifest. Returns `null` when the bake step
 * hasn't run (dev workflow, unbundled std checkout without
 * `pnpm run build:embeddings`). Consumers fall back to the full catalog
 * walk in that case.
 */
export async function getBehaviorEmbeddings(): Promise<BehaviorEmbeddingsManifest | null> {
  return loadManifest();
}

/**
 * Fetch the embedding vector for one behavior by name. Returns `null` when
 * the manifest is missing OR the behavior wasn't indexed at bake time
 * (e.g. a new atom landed after the most recent publish — bake again).
 */
export async function getBehaviorEmbedding(behaviorName: string): Promise<readonly number[] | null> {
  const manifest = await loadManifest();
  if (!manifest) return null;
  return manifest.vectors[behaviorName] ?? null;
}
