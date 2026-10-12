/**
 * Explode Behavior Composition
 *
 * Human-authoring primitive (Phase 5.3 of Almadar_Agent_Behaviors_Plan).
 *
 * Returns the flat list of `TraitReference` objects a behavior is
 * composed from. For molecules/organisms with `uses:` imports, walks the
 * orbital's `traits:` array and filters for `TraitReference` entries
 * (skipping inline trait definitions). For leaf atoms (no composition),
 * returns a single synthetic `TraitReference` pointing at the atom's own
 * trait so consumers always get a non-empty array.
 *
 * **Not exposed to the agent or LLM** — this is for developers designing
 * new molecules or debugging compositions. The plan's §6a.3 explicitly
 * scopes it as human tooling.
 *
 * Implementation notes:
 * - Reads the behavior's program from the package registry (`loadGoldenOrb`).
 * - `TraitReference.from` is backfilled from the orbital's `uses:` header
 *   when the call-site omitted it but the `ref:` uses an imported alias.
 *
 * @packageDocumentation
 */

import { loadGoldenOrb } from './exports-reader.js';
import type { OrbitalDefinition, UseDeclaration } from '@almadar/core/types';
import type { Trait, TraitRef, TraitReference } from '@almadar/core/types';
import { isInlineTrait } from '@almadar/core/types';

// ============================================================================
// Helpers
// ============================================================================

function isTraitReferenceObject(entry: TraitRef): entry is TraitReference {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    'ref' in entry &&
    typeof (entry as { ref: unknown }).ref === 'string' &&
    !isInlineTrait(entry as TraitRef)
  );
}

function aliasToFromMap(uses: UseDeclaration[] | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!uses) return map;
  for (const use of uses) {
    map.set(use.as, use.from);
  }
  return map;
}

function extractAlias(ref: string): string | null {
  const match = ref.match(/^([A-Z][a-zA-Z0-9]*)\.traits\.[A-Z][a-zA-Z0-9]*$/);
  return match ? match[1] : null;
}

function findAtomInlineTrait(orbital: OrbitalDefinition): Trait | undefined {
  for (const entry of orbital.traits) {
    if (typeof entry === 'object' && entry !== null && isInlineTrait(entry as TraitRef)) {
      return entry as Trait;
    }
  }
  return undefined;
}

function syntheticLeafReference(
  behaviorName: string,
  orbital: OrbitalDefinition,
  trait: Trait,
): TraitReference {
  const base = behaviorName.replace(/^std-/, '');
  const alias = base
    .split('-')
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('') || 'Behavior';

  const entityName =
    typeof orbital.entity === 'string'
      ? orbital.entity
      : 'name' in orbital.entity && typeof orbital.entity.name === 'string'
        ? orbital.entity.name
        : undefined;

  const reference: TraitReference = {
    ref: `${alias}.traits.${trait.name}`,
    from: `std/behaviors/${behaviorName}`,
  };
  if (trait.linkedEntity !== undefined) {
    reference.linkedEntity = trait.linkedEntity;
  } else if (entityName !== undefined) {
    reference.linkedEntity = entityName;
  }
  return reference;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Flatten a behavior's composition into the list of `TraitReference`
 * objects it's built from.
 *
 * For composed behaviors (molecules, organisms) this returns every
 * `TraitReference` entry from every orbital's `traits:` array, carrying
 * the call-site `ref`, backfilled `from` (looked up against the
 * orbital's `uses:` imports when omitted), `linkedEntity`, `events`,
 * `effects`, and any other override fields declared at the call site.
 *
 * For leaf atoms the function returns a single synthetic `TraitReference`
 * pointing at the atom's own trait, so consumers always get a non-empty
 * array.
 *
 * @param behaviorName - Registry name of the behavior (`"std-cart"`,
 *   `"std-browse"`, etc.).
 * @throws When `@almadar/std` ships no behavior by that name.
 */
export function explodeBehaviorComposition(behaviorName: string): TraitReference[] {
  const program = loadGoldenOrb(behaviorName);
  if (!program) {
    throw new Error(`explodeBehaviorComposition: "${behaviorName}" is not a behavior @almadar/std ships.`);
  }

  const refs: TraitReference[] = [];
  for (const orbital of program.orbitals) {
    const uses = aliasToFromMap(orbital.uses);
    for (const entry of orbital.traits) {
      if (!isTraitReferenceObject(entry)) continue;
      const ref: TraitReference = { ...entry };
      if (ref.from === undefined) {
        const alias = extractAlias(ref.ref);
        const mapped = alias !== null ? uses.get(alias) : undefined;
        if (mapped !== undefined) {
          ref.from = mapped;
        }
      }
      refs.push(ref);
    }
  }

  const first = program.orbitals[0];
  if (refs.length === 0 && first !== undefined) {
    const inline = findAtomInlineTrait(first);
    if (inline !== undefined) {
      return [syntheticLeafReference(behaviorName, first, inline)];
    }
  }

  return refs;
}
