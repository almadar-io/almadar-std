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
import type { FactorySignatureCatalog, FactoryTraitSignature } from '@almadar/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STD_ROOT = resolve(__dirname, '..');
const REGISTRY_PATH = join(STD_ROOT, 'behaviors', 'behaviors-registry.json');
const SIGNATURES_PATH = join(STD_ROOT, 'behaviors', 'registry', 'factory-signatures.json');
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
 * Pool every trait signature by its organism name. One organism can span
 * multiple orbitals (e.g. `learning-algorithms` spans 20) — traits from
 * every orbital are pooled so `buildEntryText` sees the organism's full
 * capability/synonym surface regardless of which orbital carries it.
 */
export function indexTraitsByOrganism(
  catalog: FactorySignatureCatalog,
): Map<string, FactoryTraitSignature[]> {
  const traitsByOrganism = new Map<string, FactoryTraitSignature[]>();
  for (const signature of catalog.signatures) {
    const existing = traitsByOrganism.get(signature.organism);
    if (existing) {
      existing.push(...signature.traits);
    } else {
      traitsByOrganism.set(signature.organism, [...signature.traits]);
    }
  }
  return traitsByOrganism;
}

/**
 * Build the searchable text snippet per entry. Includes:
 *   - canonical name (the LLM emits this as `organism` or in `from:`)
 *   - description (the domain language signal)
 *   - default entity name (signals what nouns the behavior is about)
 *   - connectable events (signals what the behavior emits/listens)
 *   - trait capabilities + entity-binding synonyms lifted from
 *     `factory-signatures.json` (source-tagged `.lolo` metadata) — widens
 *     the thin name/description/entity/events text that compressed cosine
 *     margins on tightly-clustered candidates (G7)
 *
 * Knob-level synonyms are deliberately excluded: they belong to Stage B
 * (`knob-embeddings.json`, one vector per knob). Pooled into the organism
 * text they form a generic soup shared across every CRUD organism — it
 * pushes the text past the embedding window so identity keywords compete
 * with knob phrasing, and any signature shift reshuffles which synonyms
 * survive, silently moving Stage-A scores.
 *
 * The snippet is what we embed; the query side (Stage A) embeds the
 * user's request and ranks against these vectors via cosine similarity.
 */
export function buildEntryText(
  entry: RegistryEntry,
  traits: ReadonlyArray<FactoryTraitSignature> | undefined,
): string {
  const parts: string[] = [entry.name];
  if (entry.description) parts.push(entry.description);
  if (entry.defaultEntity?.name) parts.push(`Entity: ${entry.defaultEntity.name}`);
  if (entry.connectableEvents && entry.connectableEvents.length > 0) {
    parts.push(`Events: ${entry.connectableEvents.join(' ')}`);
  }
  if (traits && traits.length > 0) {
    const capabilities = new Set<string>();
    const synonyms = new Set<string>();
    for (const trait of traits) {
      for (const capability of trait.capabilities) capabilities.add(capability);
      if (trait.entityBindingSynonyms) synonyms.add(trait.entityBindingSynonyms);
    }
    if (capabilities.size > 0) {
      parts.push(`Capabilities: ${[...capabilities].sort().join(' ')}`);
    }
    if (synonyms.size > 0) {
      parts.push(`Synonyms: ${[...synonyms].sort().join(' ')}`);
    }
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
  const signatureCatalog: FactorySignatureCatalog = JSON.parse(readFileSync(SIGNATURES_PATH, 'utf-8'));
  const traitsByOrganism = indexTraitsByOrganism(signatureCatalog);
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
    texts.push(buildEntryText(entry, traitsByOrganism.get(name)));
  }

  const client = new EmbeddingClient({ provider: EMBEDDING_PROVIDER, model: EMBEDDING_MODEL });
  console.log(`[build-embeddings] Calling ${EMBEDDING_MODEL} via ${EMBEDDING_PROVIDER} for ${texts.length} entries...`);
  // Chunked — a single full-catalog batch (500+ enriched entries) makes the
  // provider return a 200 with no `data` array; 100-entry calls stay under
  // that ceiling.
  const BATCH = 100;
  // Per-attempt char caps. bge-base-en-v1.5 holds 512 tokens; the client's
  // own 2000-char trim assumes ~4 chars/token, but the enriched
  // `Capabilities:`/`Synonyms:` keyword lists tokenize denser and a single
  // over-limit entry 400s the whole batch. Attempt 1 sends the full text
  // (client trims at 2000); later attempts tighten only if the provider
  // proved it necessary — identifying content (name/description) leads
  // each entry text, so a tail trim sheds keywords, not identity.
  const ATTEMPT_CAPS = [Infinity, 1500, 1100];
  const embeddings: number[][] = [];
  let totalTokens = 0;
  for (let start = 0; start < texts.length; start += BATCH) {
    const chunk = texts.slice(start, start + BATCH);
    let lastError: unknown = null;
    for (let attempt = 0; attempt < ATTEMPT_CAPS.length; attempt++) {
      const cap = ATTEMPT_CAPS[attempt];
      const trimmed = cap === Infinity ? chunk : chunk.map((t) => (t.length > cap ? t.slice(0, cap) : t));
      try {
        const result = await client.embedBatch(trimmed);
        embeddings.push(...result.embeddings.map((e) => [...e]));
        totalTokens += result.usage.totalTokens;
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        console.warn(`[build-embeddings]   chunk @${start} attempt ${attempt + 1}/${ATTEMPT_CAPS.length} (cap ${cap}) failed: ${err instanceof Error ? err.message : String(err)}`);
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      }
    }
    if (lastError !== null) throw lastError;
    console.log(`[build-embeddings]   ${Math.min(start + BATCH, texts.length)}/${texts.length}`);
  }
  console.log(
    `[build-embeddings] Got ${embeddings.length} vectors; ` +
      `tokens: ${totalTokens} (≈ $${(totalTokens / 1_000_000 * PRICE_PER_1M).toFixed(6)})`,
  );

  const vectors: Record<string, number[]> = {};
  for (let i = 0; i < names.length; i++) {
    const embedding = embeddings[i];
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

// Guard the auto-invoke so the module can be imported (e.g. by a dry
// text-preview harness) without triggering the network call.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('[build-embeddings] FAILED:', err);
    process.exit(1);
  });
}
