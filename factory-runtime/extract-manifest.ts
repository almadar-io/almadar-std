/**
 * `extractManifest(orb)` — derive the typed `OrbitalParamsManifest[]` from a
 * resolved `.orb`, one entry per orbital. The result has the exact same
 * shape the codegen `regenerate-std-ts.mjs` emits as `*OrbitalManifest`
 * literals.
 *
 * Pure data → data. No I/O. No behavior-specific branching.
 *
 * Used by:
 * - `scripts/regenerate-std-ts.mjs` — emits the manifest as a TS literal.
 * - The promotion server (Phase B) — stores `manifests[]` alongside the orb.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema, TraitReference } from '@almadar/core';
import type {
  OrbitalParamsManifest,
  ParamFieldDescriptor,
} from '../behaviors/functions/dispatch.js';

/**
 * Canonical param-field descriptors. Static across all factories — every
 * orbital accepts the same six knobs (the codegen emits this exact list
 * verbatim into every generated manifest).
 */
const STATIC_PARAM_FIELDS: readonly ParamFieldDescriptor[] = [
  {
    name: 'fields',
    type: 'EntityField[]',
    description: 'Extra fields appended to the canonical entity.',
  },
  {
    name: 'pagePath',
    type: 'string',
    description: 'URL override for the orbital first page.',
  },
  {
    name: 'persistence',
    type: "'persistent' | 'runtime' | 'singleton' | 'instance' | 'local'",
    description: 'Override the canonical entity persistence mode.',
  },
  {
    name: 'entityName',
    type: 'string',
    description:
      "Rename the canonical entity. PascalCase singular, ≤32 chars. Threads through every trait's linkedEntity binding; compiler rewrites @Entity.x refs.",
  },
  {
    name: 'collection',
    type: 'string',
    description:
      'Override derived collection key. Defaults to plural(entityName).toLowerCase().',
  },
  {
    name: 'traitOverrides',
    type: 'Partial<Record<TraitName, { config?, linkedEntity?, events?, name?, emitsScope?, listens? }>>',
    description:
      ".lolo's native trait-composition surface 1:1: per-imported-trait config, linkedEntity, events, name, emitsScope, listens. effects is excluded (atom-owned; use listens via a sibling trait).",
  },
] as const;

interface SplitTraits {
  readonly refTraitNames: readonly string[];
  readonly inlineTraitNames: readonly string[];
}

function splitTraits(traits: OrbitalSchema['orbitals'][number]['traits']): SplitTraits {
  const refTraitNames: string[] = [];
  const inlineTraitNames: string[] = [];
  for (const t of traits) {
    if (!t || typeof t !== 'object') continue;
    const tName = typeof (t as TraitReference).name === 'string'
      ? (t as TraitReference).name
      : null;
    if (!tName) continue;
    if (typeof (t as TraitReference).ref === 'string') {
      refTraitNames.push(tName);
    } else {
      inlineTraitNames.push(tName);
    }
  }
  return { refTraitNames, inlineTraitNames };
}

/**
 * Produce one `OrbitalParamsManifest` per orbital in the orb. The orb's
 * top-level `name` is the behavior name (e.g. `std-embedded-dashboard`);
 * each orbital's `name` is the orbital name (e.g. `DashboardOrbital`).
 */
export function extractManifest(orb: OrbitalSchema): readonly OrbitalParamsManifest[] {
  const behaviorName = orb.name;
  return orb.orbitals.map((orbital) => {
    const { refTraitNames, inlineTraitNames } = splitTraits(orbital.traits);
    return {
      organism: behaviorName,
      orbitalName: orbital.name,
      paramFields: STATIC_PARAM_FIELDS,
      traitNames: refTraitNames,
      inlineTraitNames,
    };
  });
}
