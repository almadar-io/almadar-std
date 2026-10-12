/**
 * Golden behaviors: the programs this package ships, read from its registry through its manifest
 * (`@almadar/core/behavior-package` `behaviorProgramFiles`). Node only, loaded on first call so a
 * browser bundle of the package never touches it.
 *
 * @packageDocumentation
 */

import { parseOrbitalSchema } from '@almadar/core';
import type { OrbitalSchema } from '@almadar/core/types';
import type * as BehaviorPackageApi from '@almadar/core/behavior-package';

export type BehaviorLevel = 'atoms' | 'molecules' | 'organisms';

const PACKAGE_NAME = '@almadar/std';

let programFiles: Map<string, string> | null = null;

function programs(): Map<string, string> {
  if (programFiles) return programFiles;
  const nodePath = process.getBuiltinModule('node:path');
  const nodeUrl = process.getBuiltinModule('node:url');
  const here = nodePath.dirname(nodeUrl.fileURLToPath(import.meta.url));
  const api: typeof BehaviorPackageApi = process.getBuiltinModule('node:module').createRequire(import.meta.url)('@almadar/core/behavior-package');
  const files = api.behaviorProgramFiles(api.findInstalledBehaviorPackage(PACKAGE_NAME, here));
  programFiles = files;
  return files;
}

function readProgram(file: string): OrbitalSchema {
  return parseOrbitalSchema(JSON.parse(process.getBuiltinModule('node:fs').readFileSync(file, 'utf-8')));
}

export function getAllBehaviorNames(): string[] {
  return [...programs().keys()].sort();
}

export function getAllBehaviors(): OrbitalSchema[] {
  return getAllBehaviorNames().map((name) => readProgram(programs().get(name) ?? ''));
}

export function getBehaviorsByLevel(_level: BehaviorLevel): OrbitalSchema[] {
  return getAllBehaviors();
}

export function loadGoldenOrb(behaviorName: string): OrbitalSchema | null {
  const file = programs().get(behaviorName);
  return file === undefined ? null : readProgram(file);
}

export function hasGoldenOrb(behaviorName: string): boolean {
  return programs().has(behaviorName);
}

export function getBehavior(behaviorName: string): OrbitalSchema | null {
  return loadGoldenOrb(behaviorName);
}
