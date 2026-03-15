/**
 * Exports Reader
 *
 * Provides programmatic access to the golden .orb files in behaviors/exports/.
 * Other packages import these functions instead of reading the filesystem directly.
 *
 * Directory structure mirrors functions/:
 *   exports/atoms/*.orb
 *   exports/molecules/*.orb
 *   exports/organisms/*.orb
 *
 * @packageDocumentation
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { BehaviorSchema } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXPORTS_DIR = resolve(__dirname, 'exports');
const LEVEL_DIRS = ['atoms', 'molecules', 'organisms'] as const;

export type BehaviorLevel = typeof LEVEL_DIRS[number];

/** Read all .orb files from a single directory. */
function readOrbDir(dir: string): Array<{ name: string; path: string }> {
  try {
    return readdirSync(dir)
      .filter((f: string) => f.endsWith('.orb'))
      .map((f: string) => ({ name: f.replace('.orb', ''), path: resolve(dir, f) }));
  } catch {
    return [];
  }
}

/** Read all .orb entries across atoms/molecules/organisms. */
function readAllOrbEntries(): Array<{ name: string; path: string; level: BehaviorLevel }> {
  const entries: Array<{ name: string; path: string; level: BehaviorLevel }> = [];
  for (const level of LEVEL_DIRS) {
    for (const entry of readOrbDir(resolve(EXPORTS_DIR, level))) {
      entries.push({ ...entry, level });
    }
  }
  return entries;
}

/**
 * List all available golden behavior names (without .orb extension).
 */
export function getAllBehaviorNames(): string[] {
  return readAllOrbEntries().map(e => e.name);
}

/**
 * Load all golden .orb files as BehaviorSchema objects.
 */
export function getAllBehaviors(): BehaviorSchema[] {
  return readAllOrbEntries().map(e =>
    JSON.parse(readFileSync(e.path, 'utf-8')) as BehaviorSchema
  );
}

/**
 * Load all golden .orb files for a specific level (atoms, molecules, organisms).
 */
export function getBehaviorsByLevel(level: BehaviorLevel): BehaviorSchema[] {
  return readOrbDir(resolve(EXPORTS_DIR, level)).map(e =>
    JSON.parse(readFileSync(e.path, 'utf-8')) as BehaviorSchema
  );
}

/**
 * Load a single golden .orb file by behavior name.
 * Searches across all levels. Returns null if not found.
 */
export function loadGoldenOrb(behaviorName: string): BehaviorSchema | null {
  for (const level of LEVEL_DIRS) {
    const orbPath = resolve(EXPORTS_DIR, level, `${behaviorName}.orb`);
    if (existsSync(orbPath)) {
      try {
        return JSON.parse(readFileSync(orbPath, 'utf-8')) as BehaviorSchema;
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Check if a golden .orb file exists for the given behavior name.
 */
export function hasGoldenOrb(behaviorName: string): boolean {
  return LEVEL_DIRS.some(level =>
    existsSync(resolve(EXPORTS_DIR, level, `${behaviorName}.orb`))
  );
}
