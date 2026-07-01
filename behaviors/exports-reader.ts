/**
 * Exports Reader
 *
 * Provides programmatic access to golden behaviors.
 * Uses behavior functions from ./functions/ instead of reading .orb files from disk.
 * This makes the package work in bundled environments (no filesystem access for package data).
 *
 * @packageDocumentation
 */

import * as behaviorFns from './functions/index.js';
import type { OrbitalDefinition, OrbitalSchema } from '@almadar/core/types';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type BehaviorLevel = 'atoms' | 'molecules' | 'organisms';

/**
 * Convert function name (stdCart) to behavior name (std-cart).
 * Returns null for non-behavior exports (types, helpers, entity/trait/page variants).
 */
function fnNameToBehaviorName(fnName: string): string | null {
  if (fnName.includes('Entity') || fnName.includes('Trait') || fnName.includes('Page')) return null;
  if (['connect', 'compose', 'pipe', 'makeEntity', 'makePage', 'makeOrbital', 'mergeOrbitals', 'wire', 'extractTrait', 'ensureIdField', 'plural'].includes(fnName)) return null;

  const withDashes = fnName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  if (!withDashes.startsWith('std-')) return null;
  return withDashes;
}

interface BehaviorEntry {
  name: string;
  fn: (params: { entityName: string }) => unknown;
}

let cachedEntries: BehaviorEntry[] | null = null;

function getEntries(): BehaviorEntry[] {
  if (cachedEntries) return cachedEntries;

  cachedEntries = [];
  const fns = behaviorFns as Record<string, unknown>;

  for (const [fnName, fn] of Object.entries(fns)) {
    if (typeof fn !== 'function') continue;
    const behaviorName = fnNameToBehaviorName(fnName);
    if (!behaviorName) continue;
    cachedEntries.push({ name: behaviorName, fn: fn as (params: { entityName: string }) => unknown });
  }

  return cachedEntries;
}

function callBehavior(entry: BehaviorEntry): OrbitalSchema {
  const result = entry.fn({ entityName: entry.name.replace(/^std-/, '') });
  // Phase 4.2: per-orbital factories return a single `OrbitalDefinition`.
  // Phase 2 (organism-oriented model): the bundled wrapper for each app
  // organism (`stdEcommerce`, `stdHelpdesk`, etc.) returns
  // `OrbitalDefinition[]` — one entry per per-orbital factory it
  // composes. Detect both shapes and spread the array form so the
  // wrapping schema's `orbitals` stays flat. Without this branch,
  // every app organism round-tripped through `loadGoldenOrb` came
  // back as `{ orbitals: [ [orb1, orb2, ...] ] }` and downstream
  // consumers (analyzer catalog, compiler embedded loader) iterated
  // arrays where they expected OrbitalDefinitions.
  const orbitals: OrbitalDefinition[] = Array.isArray(result)
    ? (result as OrbitalDefinition[])
    : [result as OrbitalDefinition];
  return {
    name: entry.name,
    orbitals,
  };
}

export function getAllBehaviorNames(): string[] {
  return getEntries().map(e => e.name);
}

export function getAllBehaviors(): OrbitalSchema[] {
  const results: OrbitalSchema[] = [];
  for (const entry of getEntries()) {
    try {
      results.push(callBehavior(entry));
    } catch {
      // Some behaviors require params beyond { entityName } (e.g. fields, categories).
      // Skip them when enumerating the catalog — they still work when called with full params.
    }
  }
  return results;
}

export function getBehaviorsByLevel(level: BehaviorLevel): OrbitalSchema[] {
  // Level is encoded in the behavior name pattern via the registry
  // For now, return all and let the caller filter via the registry
  return getAllBehaviors();
}

function findEntry(behaviorName: string): BehaviorEntry | undefined {
  // Fast path: exact match (the normal std-* convention).
  let entry = getEntries().find(e => e.name === behaviorName);
  if (entry) return entry;

  // Some generated wrapper functions prefix the behavior name with `std-`
  // even when the registry name does not start with `std-` (e.g. the
  // function `stdLearningMathLab` maps to `std-learning-math-lab`, but the
  // registry name is `learning-math-lab`). Try the prefixed name and, if it
  // exists, return that wrapper instead of treating the organism as missing.
  if (!behaviorName.startsWith('std-')) {
    entry = getEntries().find(e => e.name === `std-${behaviorName}`);
  }
  return entry;
}

export function loadGoldenOrb(behaviorName: string): OrbitalSchema | null {
  const entry = findEntry(behaviorName);
  if (!entry) return null;
  try {
    const orb = callBehavior(entry);
    // Ensure the returned schema uses the requested name, not the prefixed
    // wrapper-derived name.
    if (orb.name !== behaviorName) {
      return { ...orb, name: behaviorName };
    }
    return orb;
  } catch {
    return null;
  }
}

export function hasGoldenOrb(behaviorName: string): boolean {
  return findEntry(behaviorName) !== undefined;
}

export function getBehavior(behaviorName: string): OrbitalSchema | null {
  return loadGoldenOrb(behaviorName);
}
