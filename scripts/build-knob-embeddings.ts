#!/usr/bin/env npx tsx
/**
 * Build `behaviors/knob-embeddings.json` at publish time.
 *
 * Reads `behaviors/registry/factory-signatures.json` and emits one
 * embedding per overridable knob, keyed
 * `"<organism>/<orbital>/<trait>/<knob>"`. Consumers (Stage A's catalog
 * summary, the studio `TraitKnobsPanel`) rank knobs by cosine
 * similarity against the user's request so the prompt + UI surface
 * only the relevant subset of the ~3500-knob catalog.
 *
 * Runtime: ~3 seconds for ~3500 knobs in a single batch call.
 * Cost: bge-base-en-v1.5 via OpenRouter ≈ $0.005 per 1M tokens ×
 * ~120k tokens ≈ $0.0006 per bake.
 *
 * Required env var: `OPEN_ROUTER_API_KEY`. Skips with a warning when
 * unset — Stage A falls back to the full per-knob render when the
 * manifest is missing.
 *
 * Usage:
 *   pnpm run build:knob-embeddings
 *   pnpm run build                       # bake + tsup
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EmbeddingClient } from '@almadar/llm';
import type {
  FactoryConfigParam,
  FactorySignature,
  FactorySignatureCatalog,
  FactoryTraitSignature,
} from '@almadar/core';
import type { QuantizedKnobVector } from '../behaviors/knob-embeddings.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STD_ROOT = resolve(__dirname, '..');
const CATALOG_PATH = join(STD_ROOT, 'behaviors', 'registry', 'factory-signatures.json');
const SYNONYMS_PATH = join(STD_ROOT, 'behaviors', 'knob-synonyms.json');
const OUTPUT_PATH = join(STD_ROOT, 'behaviors', 'knob-embeddings.json');
const PKG_PATH = join(STD_ROOT, 'package.json');

const EMBEDDING_PROVIDER = 'openrouter' as const;
const EMBEDDING_MODEL = 'baai/bge-base-en-v1.5';
const EMBEDDING_DIMS = 768;
const PRICE_PER_1M = 0.005;

interface PackageJson {
  version: string;
}

/** Compose embedding text for one knob. The shape pairs the trait
 *  + knob coordinate with the human-friendly label / description /
 *  enum / user-vocabulary synonyms so cosine similarity against a
 *  user prompt resolves on the right signal (the knob, not just the
 *  trait). Synonyms widen recall — "taller" matches `height` because
 *  the `.lolo` `@synonyms` annotation appends "taller / shorter /
 *  pixel height" to the knob's embedding text.
 */
function buildKnobText(
  sig: FactorySignature,
  trait: FactoryTraitSignature,
  knob: FactoryConfigParam,
): string {
  const parts: string[] = [`${sig.organism} ${sig.orbital} ${trait.name}.${knob.key}`];
  if (knob.label) parts.push(knob.label);
  if (knob.description) parts.push(knob.description);
  if (knob.enumValues && knob.enumValues.length > 0) {
    parts.push(`values: ${knob.enumValues.join(', ')}`);
  }
  if (knob.synonyms) {
    parts.push(`synonyms: ${knob.synonyms}`);
  }
  return parts.join('\n');
}

/** Int8 quantization with per-vector max-abs scale — the JSON-float
 *  manifest outgrew GitHub's 100 MB blob limit at 41k io knobs; 8-bit
 *  cosine rank drift is negligible for bge-base embeddings. */
function quantizeInt8(vector: ReadonlyArray<number>): QuantizedKnobVector {
  let max = 0;
  for (const v of vector) {
    const a = Math.abs(v);
    if (a > max) max = a;
  }
  const scale = max === 0 ? 1 : max;
  const bytes = Buffer.alloc(vector.length);
  for (let i = 0; i < vector.length; i++) {
    bytes.writeInt8(Math.round(((vector[i] ?? 0) / scale) * 127), i);
  }
  return { s: Number(scale.toPrecision(6)), d: bytes.toString('base64') };
}

async function main(): Promise<void> {
  const apiKey = process.env['OPEN_ROUTER_API_KEY'];
  if (!apiKey) {
    console.warn(
      '[build-knob-embeddings] OPEN_ROUTER_API_KEY not set — skipping knob embeddings bake. ' +
        'Stage A will fall back to the full per-knob render at runtime.',
    );
    process.exit(0);
  }

  const catalog: FactorySignatureCatalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf-8'));
  const pkg: PackageJson = JSON.parse(readFileSync(PKG_PATH, 'utf-8'));

  const keys: string[] = [];
  const texts: string[] = [];
  for (const sig of catalog.signatures) {
    // internal-exposure organisms never reach Stage-A knob ranking — no consumer can rank their vectors.
    if (sig.exposure === 'internal') continue;
    for (const trait of sig.traits) {
      for (const knob of trait.overridableConfigKeys) {
        keys.push(`${sig.organism}/${sig.orbital}/${trait.name}/${knob.key}`);
        texts.push(buildKnobText(sig, trait, knob));
      }
    }
  }
  console.log(`[build-knob-embeddings] Found ${keys.length} knobs across ${catalog.signatures.length} signatures`);

  const client = new EmbeddingClient({ provider: EMBEDDING_PROVIDER, model: EMBEDDING_MODEL });
  // Chunk-batch — OpenRouter rejects single requests with thousands of
  // inputs (the 3695-knob payload returned no `data` array). 256 per
  // request is comfortably under provider limits and keeps the bake at
  // ~15 chunked calls for the full catalog.
  const CHUNK = 256;
  const embeddings: ReadonlyArray<ReadonlyArray<number>>[] = [];
  let totalTokens = 0;
  for (let start = 0; start < texts.length; start += CHUNK) {
    const slice = texts.slice(start, start + CHUNK);
    console.log(
      `[build-knob-embeddings] Embedding chunk ${start / CHUNK + 1}/${Math.ceil(texts.length / CHUNK)} ` +
        `(${slice.length} knobs)...`,
    );
    const chunkResult = await client.embedBatch(slice);
    embeddings.push(chunkResult.embeddings);
    totalTokens += chunkResult.usage.totalTokens;
  }
  const flatEmbeddings = embeddings.flat();
  console.log(
    `[build-knob-embeddings] Got ${flatEmbeddings.length} vectors; ` +
      `tokens: ${totalTokens} ` +
      `(≈ $${(totalTokens / 1_000_000 * PRICE_PER_1M).toFixed(6)})`,
  );

  const vectors: Record<string, QuantizedKnobVector> = {};
  for (let i = 0; i < keys.length; i++) {
    const embedding = flatEmbeddings[i];
    if (!embedding || embedding.length !== EMBEDDING_DIMS) {
      throw new Error(
        `[build-knob-embeddings] Vector for "${keys[i]}" has dimension ${embedding?.length ?? 0}, expected ${EMBEDDING_DIMS}`,
      );
    }
    vectors[keys[i]] = quantizeInt8(embedding);
  }

  const manifest = {
    version: pkg.version,
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMS,
    encoding: 'int8-b64' as const,
    vectors,
  };

  // Compact JSON — the manifest is read once + cached, no human ever
  // diffs it; the publish-time savings (~30 MB) are worth more than the
  // ergonomic pretty-print.
  writeFileSync(OUTPUT_PATH, JSON.stringify(manifest) + '\n');
  const sizeBytes = JSON.stringify(manifest).length;
  console.log(
    `[build-knob-embeddings] Wrote ${OUTPUT_PATH} (${(sizeBytes / 1024 / 1024).toFixed(2)} MB, ` +
      `${Object.keys(vectors).length} entries × ${EMBEDDING_DIMS} dims)`,
  );
}

main().catch((err) => {
  console.error('[build-knob-embeddings] FAILED:', err);
  process.exit(1);
});
