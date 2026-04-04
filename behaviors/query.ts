/**
 * Behavior Registry Query Helpers
 *
 * Programmatic access to behaviors-registry.json for filtering,
 * searching, and summarizing behaviors. Used by @almadar/skills
 * to compose agent prompts dynamically.
 *
 * @packageDocumentation
 */

import { loadGoldenOrb } from './exports-reader.js';

// Import registry data directly — bundlers inline this at build time.
// Falls back to fs read for dev mode (unbundled).
let registryJsonData: { behaviors: Record<string, unknown> } | null = null;

async function loadRegistryData(): Promise<{ behaviors: Record<string, unknown> }> {
  if (registryJsonData) return registryJsonData;
  try {
    // Try dynamic import (works in bundled and unbundled ESM)
    const { readFileSync } = await import('fs');
    const { resolve, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    const dir = dirname(fileURLToPath(import.meta.url));
    const raw = readFileSync(resolve(dir, 'behaviors-registry.json'), 'utf-8');
    registryJsonData = JSON.parse(raw);
  } catch {
    registryJsonData = { behaviors: {} };
  }
  return registryJsonData!;
}

// ============================================================================
// Types
// ============================================================================

export interface RegistryEntry {
  name: string;
  level: 'atom' | 'molecule' | 'organism';
  family: string;
  layer: string;
  description: string;
  statePattern: string;
  complexity: { states: number; events: number; transitions: number };
  defaultEntity: {
    name: string;
    persistence: string;
    fields: Array<{ name: string; type: string; default?: string }>;
  };
  defaultLabels: {
    title: string;
    entitySingular: string;
    entityPlural: string;
  };
  composableWith: string[];
  connectableEvents: string[];
  eventPayloads: Record<string, Array<{ name: string; type: string; required: boolean }>>;
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

let registryCache: Record<string, RegistryEntry> | null = null;

/**
 * Read and cache the behavior registry.
 * Async to support bundled environments where fs may not be available.
 */
export async function getBehaviorRegistry(): Promise<Record<string, RegistryEntry>> {
  if (registryCache) return registryCache;
  try {
    const data = await loadRegistryData();
    registryCache = data.behaviors as Record<string, RegistryEntry>;
    return registryCache;
  } catch {
    return {};
  }
}

// ============================================================================
// Query Functions
// ============================================================================

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
