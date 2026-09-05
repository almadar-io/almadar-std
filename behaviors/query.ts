/**
 * Behavior Registry Query Helpers
 *
 * Programmatic access to behaviors-registry.json for filtering,
 * searching, and summarizing behaviors. Used by @almadar/skills
 * to compose agent prompts dynamically.
 *
 * @packageDocumentation
 */

import type {
  FactoryConfigParam,
  FactoryEventSignature,
  FactoryExposure,
  FactoryProvenance,
  JsonValue,
} from '@almadar/core';
import { loadGoldenOrb } from './exports-reader.js';
import { resolveStdDataDir } from './data-dir.js';

// Import registry data directly — bundlers inline this at build time.
// Falls back to fs read for dev mode (unbundled).
// Promise-memoized: concurrent first callers share ONE in-flight load (the
// result-memoized form raced — a concurrent failure handed one caller an
// EMPTY registry while the other succeeded, silently dropping its results).
// A failed/empty load is never cached: the memo clears so the next call
// retries instead of poisoning the process lifetime.
let registryDataPending: Promise<{ behaviors: Record<string, unknown> }> | null = null;

function loadRegistryData(): Promise<{ behaviors: Record<string, unknown> }> {
  registryDataPending ??= loadRegistryDataUncached().then((data) => {
    if (Object.keys(data.behaviors).length === 0) registryDataPending = null;
    return data;
  });
  return registryDataPending;
}

async function loadRegistryDataUncached(): Promise<{ behaviors: Record<string, unknown> }> {
  try {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const dir = await resolveStdDataDir();
    const raw = readFileSync(resolve(dir, 'behaviors-registry.json'), 'utf-8');
    return JSON.parse(raw) as { behaviors: Record<string, unknown> };
  } catch {
    return { behaviors: {} };
  }
}

// ============================================================================
// Types
// ============================================================================

/**
 * The role a trait plays inside its orbital — stamped by
 * `tools/almadar-pattern-sync` (`behaviors` command) via `deriveTraitRole`.
 * `authority` = owns ticking state it provides fields for; `reactor` = wires
 * transitions off listened/transitioned events with no tick of its own;
 * `renderer` = renders UI; `chrome` = a generated `ui-*` atom wrapper;
 * `frame` = an organism-level ref trait sharing a `linkedEntity` with a
 * sibling ref trait (≥2), neither independently classified; `catalog` = a
 * trait declaring the `asset-catalog` capability; `passive` = none of the
 * above (config-only binding).
 */
export type BehaviorTraitRole =
  | 'authority'
  | 'reactor'
  | 'renderer'
  | 'chrome'
  | 'frame'
  | 'catalog'
  | 'passive';

/**
 * Per-trait exposure surface for one trait inside a `RegistryEntry`'s
 * orbital — the registry-record mirror of `FactoryTraitSignature`
 * (`@almadar/core` `src/factory/types.ts`) plus the fields
 * `*.signature.json` computes but the trait-signature type doesn't carry
 * (`ticks`, `rendersUi`) and the derived `role`. Stamped by
 * `tools/almadar-pattern-sync` (`behaviors` command); a ref trait (organism
 * call site) inherits `entityContract`/`transitionEvents`/`ticks`/
 * `rendersUi`/`overridableConfigKeys` from the referenced atom.
 */
export interface RegistryTraitSurface {
  name: string;
  orbital: string;
  ref?: string;
  category?: string;
  role: BehaviorTraitRole;
  entityRebindable?: boolean;
  linkedEntity?: string;
  entityContract?: { requires: string[]; provides: string[] };
  effectRow?: Array<{
    kind: string;
    resource?: string;
    resolved?: boolean;
    site?: 'transition' | 'tick';
  }>;
  transitionEvents?: string[];
  emittedEvents: string[];
  listenedEvents: string[];
  events?: FactoryEventSignature[];
  overridableConfigKeys: FactoryConfigParam[];
  definerKnobs?: string[];
  capabilities: string[];
  ticks: Array<{ name: string; interval: string | number }>;
  rendersUi: boolean;
}

export interface RegistryEntry {
  name: string;
  level: 'atom' | 'molecule' | 'organism';
  /**
   * Topic tier directory the behavior's `.orb` lives under (e.g. `core`,
   * `agent`, `app`, `game`). Stamped by `tools/almadar-pattern-sync`
   * (`behaviors` command) from the on-disk registry path; every generated
   * entry in `behaviors-registry.json` carries it (G14).
   */
  topic: string;
  family: string;
  layer: string;
  description: string;
  /**
   * Organism-level `;; @capabilities` header tag — a closed, author-declared
   * list of what the organism DOES (comma-separated phrases), stamped by
   * `tools/almadar-pattern-sync` from `.lolo` metadata (V4-P6a §3.1). Embedded
   * as a SEPARATE `<name>#capabilities` vector for the grounded organism pick.
   * Optional: only app-pickable organisms carry it.
   */
  capabilities?: string;
  /**
   * Default orbital class name (`^[A-Z][A-Za-z0-9]+Orbital$`) stamped by
   * `tools/almadar-pattern-sync` (`behaviors` command); every generated
   * entry in `behaviors-registry.json` carries it.
   */
  defaultOrbitalName: string;
  statePattern: string;
  complexity: { states: number; events: number; transitions: number };
  defaultEntity: {
    name: string;
    persistence: string;
    fields: Array<{ name: string; type: string; required?: boolean; default?: JsonValue }>;
  };
  defaultLabels: {
    title: string;
    createButton?: string;
    entitySingular: string;
    entityPlural: string;
  };
  /** Icon names lifted from the INIT render-ui tree. Stamped by `tools/almadar-pattern-sync` (`behaviors` command). */
  defaultIcons?: string[];
  composableWith: string[];
  connectableEvents: string[];
  eventPayloads: Record<string, Array<{ name: string; type: string; required?: boolean }>>;
  /**
   * Where the behavior may be dispatched: `app` (whole-app organisms),
   * `palette` (composable primitives), `both`, or `internal` (never
   * offered). Stamped by `tools/almadar-pattern-sync` (`behaviors`
   * command) from `.lolo` `@exposure` tags + per-topic defaults.
   *
   * Optional: registries are not yet stamped (V3 Phase 2 rollout). A
   * missing field means a pre-V3 registry — consumers fall back to their
   * legacy filters.
   */
  exposure?: FactoryExposure;
  /**
   * How the behavior entered the registry: `generated` (pattern-sync
   * emitted wrapper), `authored` (hand-authored, blessed via
   * `.hand-authored.json`), or `promoted` (curated from a verified
   * cache miss). Stamped by `tools/almadar-pattern-sync` (`behaviors`
   * command).
   *
   * Optional: registries are not yet stamped (V3 Phase 2 rollout). A
   * missing field means a pre-V3 registry — consumers fall back to their
   * legacy filters.
   */
  provenance?: FactoryProvenance;
  /**
   * Per-trait exposure surfaces for the orbital's first (canonical) orbital
   * — the registry-record mirror of `FactorySignature.traits`. Stamped by
   * `tools/almadar-pattern-sync` (`behaviors` command) via `extractSignatures`
   * + `inheritCallSiteOverrideTypes`. Optional: pre-W0 registries don't carry it.
   */
  traits?: RegistryTraitSurface[];
  /** Sorted unique union of `traits[].role`. Optional: pre-W0 registries don't carry it. */
  roles?: BehaviorTraitRole[];
  /**
   * `orb validate`/`orb resolve` readiness, back-stamped by `std-ts`
   * (`tools/almadar-pattern-sync` `regenerate.ts`) right after it computes
   * the same fields for `*.signature.json` — one writer, pipeline-ordered.
   * Optional: unstamped until the `orb` binary is available at regen time.
   */
  sourceValid?: boolean;
  /** `orb validate`/`orb resolve` error strings when `sourceValid` is `false`. Back-stamped alongside `sourceValid`. */
  sourceErrors?: string[];
  /** Path (relative to the package root) of the generated factory source, mirrors `FactorySignature.factoryPath`. */
  factoryPath?: string;
}

export interface BehaviorSummary {
  name: string;
  level: string;
  description: string;
  states: string[];
  events: string[];
  slots: string[];
  patterns: string[];
  complexity: { states: number; events: number; transitions: number };
  composableWith: string[];
}

// ============================================================================
// Registry Cache
// ============================================================================

/**
 * Read and cache the behavior registry.
 * Async to support bundled environments where fs may not be available.
 * Caching (and its concurrency safety) lives in `loadRegistryData`.
 */
export async function getBehaviorRegistry(): Promise<Record<string, RegistryEntry>> {
  const data = await loadRegistryData();
  return data.behaviors as Record<string, RegistryEntry>;
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Filter behaviors by the derived per-trait role (`authority`/`reactor`/
 * `renderer`/`chrome`/`frame`/`catalog`/`passive`) — matches an entry whose
 * `roles` union contains `role`. Entries from a pre-W0 registry (no `roles`
 * stamped) never match.
 */
export async function getBehaviorsByRole(role: BehaviorTraitRole): Promise<RegistryEntry[]> {
  const registry = await getBehaviorRegistry();
  return Object.values(registry).filter((b) => (b.roles ?? []).includes(role));
}

/**
 * Look up one trait's exposure surface by behavior name + trait name.
 * Returns `null` when the behavior or trait isn't found, or the registry
 * entry predates `traits` stamping (V0 rollout).
 */
export async function getTraitSurface(
  name: string,
  trait: string,
): Promise<RegistryTraitSurface | null> {
  const registry = await getBehaviorRegistry();
  const entry = registry[name];
  if (!entry) return null;
  return entry.traits?.find((t) => t.name === trait) ?? null;
}

/**
 * Filter behaviors by domain. Matches against layer (primary) and family (fallback).
 */
export async function getBehaviorsByDomain(domain: string): Promise<RegistryEntry[]> {
  const registry = await getBehaviorRegistry();
  const lower = domain.toLowerCase();
  return Object.values(registry).filter((b) => {
    return b.layer.toLowerCase() === lower ||
      b.layer.toLowerCase().includes(lower) ||
      b.family.toLowerCase() === lower ||
      b.family.toLowerCase().includes(lower);
  });
}

/**
 * Filter behaviors by connectable operations (events).
 * Returns behaviors sorted by match count (most matching ops first).
 */
export async function getBehaviorsByOperations(ops: string[]): Promise<RegistryEntry[]> {
  const registry = await getBehaviorRegistry();
  const upperOps = ops.map(o => o.toUpperCase());

  const scored = Object.values(registry).map((b) => {
    const matches = upperOps.filter(op =>
      b.connectableEvents.some(e => e.toUpperCase() === op || e.toUpperCase().includes(op))
    );
    return { entry: b, score: matches.length };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.entry);
}

/**
 * Fuzzy search across name, description, family, layer, and entity name.
 */
export async function searchBehaviors(query: string): Promise<RegistryEntry[]> {
  const registry = await getBehaviorRegistry();
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);

  const scored = Object.values(registry).map((b) => {
    const searchText = [
      b.name,
      b.description,
      b.family,
      b.layer,
      b.defaultEntity.name,
      b.statePattern,
    ].join(' ').toLowerCase();

    const score = tokens.filter(t => searchText.includes(t)).length;
    return { entry: b, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.entry);
}

/**
 * Get a compact summary of a behavior including slots and patterns from the .orb file.
 */
export async function getBehaviorSummary(name: string): Promise<BehaviorSummary | null> {
  const registry = await getBehaviorRegistry();
  const entry = registry[name];
  if (!entry) return null;

  // Base data from registry
  const summary: BehaviorSummary = {
    name: entry.name,
    level: entry.level,
    description: entry.description,
    states: entry.statePattern.split(', ').filter(Boolean),
    events: entry.connectableEvents,
    slots: [],
    patterns: [],
    complexity: entry.complexity,
    composableWith: entry.composableWith.slice(0, 10),
  };

  // Enrich with slots and patterns from the actual .orb file
  try {
    const orb = loadGoldenOrb(name);
    if (orb) {
      const slots = new Set<string>();
      const patterns = new Set<string>();
      extractSlotsAndPatterns(orb, slots, patterns);
      summary.slots = Array.from(slots);
      summary.patterns = Array.from(patterns);
    }
  } catch {
    // .orb load failed, return registry-only data
  }

  return summary;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Walk an object recursively to extract render-ui slots and pattern types.
 */
function extractSlotsAndPatterns(
  obj: unknown,
  slots: Set<string>,
  patterns: Set<string>,
): void {
  if (Array.isArray(obj)) {
    // Check for render-ui effect: ["render-ui", slotName, uiTree]
    if (obj.length >= 3 && obj[0] === 'render-ui' && typeof obj[1] === 'string') {
      slots.add(obj[1]);
      if (obj[2] && typeof obj[2] === 'object') {
        extractPatternTypes(obj[2], patterns);
      }
    }
    for (const item of obj) {
      extractSlotsAndPatterns(item, slots, patterns);
    }
  } else if (obj && typeof obj === 'object') {
    for (const value of Object.values(obj)) {
      extractSlotsAndPatterns(value, slots, patterns);
    }
  }
}

/**
 * Walk a render-ui tree to collect all pattern type values.
 */
function extractPatternTypes(node: unknown, patterns: Set<string>): void {
  if (!node || typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;
  if (typeof obj.type === 'string') {
    patterns.add(obj.type);
  }
  if (Array.isArray(obj.children)) {
    for (const child of obj.children) {
      extractPatternTypes(child, patterns);
    }
  }
}
