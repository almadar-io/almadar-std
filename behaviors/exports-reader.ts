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
import type { OrbitalSchema } from '@almadar/core/types';

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
  const schema = result as OrbitalSchema;
  schema.name = entry.name;
  return schema;
}

export function getAllBehaviorNames(): string[] {
  return getEntries().map(e => e.name);
}

export function getAllBehaviors(): OrbitalSchema[] {
  return getEntries().map(e => callBehavior(e));
}

export function getBehaviorsByLevel(level: BehaviorLevel): OrbitalSchema[] {
  // Level is encoded in the behavior name pattern via the registry
  // For now, return all and let the caller filter via the registry
  return getAllBehaviors();
}

export function loadGoldenOrb(behaviorName: string): OrbitalSchema | null {
  const entry = getEntries().find(e => e.name === behaviorName);
  if (!entry) return null;
  try {
    return callBehavior(entry);
  } catch {
    return null;
  }
}

export function hasGoldenOrb(behaviorName: string): boolean {
  return getEntries().some(e => e.name === behaviorName);
}

export function getBehavior(behaviorName: string): OrbitalSchema | null {
  return loadGoldenOrb(behaviorName);
}
