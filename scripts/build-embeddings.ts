#!/usr/bin/env npx tsx
/**
 * Build `behaviors/behaviors-embeddings.json` at publish time.
 *
 * Reads every organism + atom in `behaviors-registry.json`, composes a
 * domain-text snippet per entry, sends a single batch request to the
 * OpenRouter Embeddings API (baai/bge-base-en-v1.5, 768-d), and writes
 * the manifest to `behaviors/behaviors-embeddings.json`. `tsup.config.ts`
 * then copies it into `dist/` alongside the registry JSON so consumers
 * find it next to the published package's other artifacts.
 *
 * Runtime: ~1 second for ~190 entries × 1 batch call.
 * Cost: bge-base-en-v1.5 via OpenRouter ≈ $0.005 per 1M tokens × ~20k tokens ≈ $0.0001 per bake.
 *
 * Required env var: `OPEN_ROUTER_API_KEY`. Skips with a warning when unset —
 * dev workflows can `pnpm run build` without embeddings (consumers fall
 * back to a full catalog walk if `behaviors-embeddings.json` is missing).
 *
 * Usage:
 *   pnpm run build:embeddings          # bake to behaviors/behaviors-embeddings.json
 *   pnpm run build                     # bake + tsup
 *
 * In CI: add OPEN_ROUTER_API_KEY to the std publish workflow's secrets.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EmbeddingClient } from '@almadar/llm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STD_ROOT = resolve(__dirname, '..');
const REGISTRY_PATH = join(STD_ROOT, 'behaviors', 'behaviors-registry.json');
const OUTPUT_PATH = join(STD_ROOT, 'behaviors', 'behaviors-embeddings.json');
const PKG_PATH = join(STD_ROOT, 'package.json');

const EMBEDDING_PROVIDER = 'openrouter' as const;
const EMBEDDING_MODEL = 'baai/bge-base-en-v1.5';
const EMBEDDING_DIMS = 768;
const PRICE_PER_1M = 0.005;

interface RegistryEntry {
  name: string;
  level: 'atom' | 'molecule' | 'organism';
  family?: string;
  layer?: string;
  description?: string;
  defaultEntity?: { name?: string };
  connectableEvents?: string[];
}

interface RegistryFile {
  behaviors: Record<string, RegistryEntry>;
}

interface PackageJson {
  version: string;
}

/**
 * Build the searchable text snippet per entry. Includes:
 *   - canonical name (the LLM emits this as `organism` or in `from:`)
 *   - description (the domain language signal)
 *   - default entity name (signals what nouns the behavior is about)
 *   - connectable events (signals what the behavior emits/listens)
 *
 * The snippet is what we embed; the query side (Stage A) embeds the
 * user's request and ranks against these vectors via cosine similarity.
 */
function buildEntryText(entry: RegistryEntry): string {
  const parts: string[] = [entry.name];
  if (entry.description) parts.push(entry.description);
  if (entry.defaultEntity?.name) parts.push(`Entity: ${entry.defaultEntity.name}`);
  if (entry.connectableEvents && entry.connectableEvents.length > 0) {
    parts.push(`Events: ${entry.connectableEvents.join(' ')}`);
  }
  return parts.join('\n');
}

async function main(): Promise<void> {
  const apiKey = process.env['OPEN_ROUTER_API_KEY'];
  if (!apiKey) {
    console.warn(
      '[build-embeddings] OPEN_ROUTER_API_KEY not set — skipping embeddings bake. ' +
        'Consumers will fall back to the full catalog walk at runtime.',
    );
    process.exit(0);
  }

  const registry: RegistryFile = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'));
  const pkg: PackageJson = JSON.parse(readFileSync(PKG_PATH, 'utf-8'));

  // Index every entry from the registry. The registry already excludes
  // categories we don't surface in the agent prompt; we don't filter
  // further here. Stage A picks among organisms (level === 'organism')
  // and atoms (level === 'atom') — molecules ride along for completeness.
  const entries = Object.entries(registry.behaviors);
  console.log(`[build-embeddings] Found ${entries.length} behaviors in registry`);

  const names: string[] = [];
  const texts: string[] = [];
  for (const [name, entry] of entries) {
    names.push(name);
    texts.push(buildEntryText(entry));
  }

  const client = new EmbeddingClient({ provider: EMBEDDING_PROVIDER, model: EMBEDDING_MODEL });
  console.log(`[build-embeddings] Calling ${EMBEDDING_MODEL} via ${EMBEDDING_PROVIDER} for ${texts.length} entries...`);
  const result = await client.embedBatch(texts);
  console.log(
    `[build-embeddings] Got ${result.embeddings.length} vectors; ` +
      `tokens: ${result.usage.totalTokens} (≈ $${(result.usage.totalTokens / 1_000_000 * PRICE_PER_1M).toFixed(6)})`,
  );

  const vectors: Record<string, number[]> = {};
  for (let i = 0; i < names.length; i++) {
    const embedding = result.embeddings[i];
    if (!embedding || embedding.length !== EMBEDDING_DIMS) {
      throw new Error(
        `[build-embeddings] Vector for "${names[i]}" has dimension ${embedding?.length ?? 0}, expected ${EMBEDDING_DIMS}`,
      );
    }
    vectors[names[i]] = [...embedding];
  }

  const manifest = {
    version: pkg.version,
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMS,
    vectors,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2) + '\n');
  const sizeBytes = JSON.stringify(manifest).length;
  console.log(
    `[build-embeddings] Wrote ${OUTPUT_PATH} (${(sizeBytes / 1024 / 1024).toFixed(2)} MB, ` +
      `${Object.keys(vectors).length} entries × ${EMBEDDING_DIMS} dims)`,
  );
}

main().catch((err) => {
  console.error('[build-embeddings] FAILED:', err);
  process.exit(1);
});
