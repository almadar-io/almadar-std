/**
 * `applyParamsToWholeOrb` — pure runtime overlay for an ENTIRE stored orb.
 *
 * Companion to `applyParamsToOrb` (single-orbital). Where `applyParamsToOrb`
 * materialises one orbital from a multi-orbital schema, this function applies
 * the same overlay to every orbital in the schema by joining each orbital to
 * its matching manifest entry from `manifests[]`. Returns a new
 * `OrbitalSchema` with the rebuilt orbitals.
 *
 * Used by team-behavior dispatch on the LLM-loop seam (`call_behavior` tool
 * in @almadar/agent): the LLM emits `call_behavior('team/<name>@<v>', params)`,
 * std-import returns undefined, the agent's `extra.dispatchWhole` port runs
 * this function over the Firestore-stored record's `{ orb, manifests }`.
 *
 * Reference: `docs/Almadar_Studio_SDK.md` §7.4.4.
 *
 * Pure data → data. No I/O.
 *
 * @packageDocumentation
 */

import type { OrbitalDefinition, OrbitalSchema } from '@almadar/core';
import type { OrbitalParamsManifest } from '../behaviors/functions/dispatch.js';
import type { OrbitalFactoryParams } from './types.js';
import { applyParamsToOrb } from './apply-params-to-orb.js';

/**
 * Apply `params` to every orbital in `orb` that has a matching manifest in
 * `manifests[]`. Orbitals with no manifest are passed through unchanged —
 * the storage convention is one manifest per orbital, so a missing manifest
 * indicates a stored orbital we don't know how to parameterise (rare; the
 * promote path writes manifests for every orbital it knows).
 *
 * @param orb        The full team-behavior schema as stored.
 * @param manifests  Per-orbital param manifests; joined to orbitals by name.
 * @param params     One shared params bag applied to every parameterised
 *                   orbital. Mirrors the std whole-behavior factories'
 *                   convention of a single `params` argument.
 */
export function applyParamsToWholeOrb(
  orb: OrbitalSchema,
  manifests: readonly OrbitalParamsManifest[],
  params: OrbitalFactoryParams,
): OrbitalSchema {
  const manifestByOrbital = new Map<string, OrbitalParamsManifest>();
  for (const m of manifests) {
    manifestByOrbital.set(m.orbitalName, m);
  }
  const rebuilt: OrbitalDefinition[] = [];
  for (const orbital of orb.orbitals) {
    const manifest = manifestByOrbital.get(orbital.name);
    if (!manifest) {
      rebuilt.push(orbital);
      continue;
    }
    rebuilt.push(applyParamsToOrb(orb, orbital.name, manifest, params));
  }
  return { ...orb, orbitals: rebuilt };
}
