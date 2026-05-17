/**
 * `applyParamsToOrb` — pure runtime overlay function. Equivalent to the body
 * the codegen `regenerate-std-ts.mjs` emits inline for every std factory
 * (`scripts/regenerate-std-ts.mjs:612-737`), lifted out so that:
 *   1. team-published behaviors (Firestore-stored) can dispatch through the
 *      same overlay as std behaviors;
 *   2. std factories *can* (future cleanup) collapse to a one-line wrapper
 *      calling this function.
 *
 * Reference: `docs/Almadar_Studio_SDK.md` §7.4.2.
 *
 * Pure data → data. No I/O.
 *
 * @packageDocumentation
 */

import type {
  Entity,
  EntityField,
  OrbitalDefinition,
  OrbitalEntity,
  OrbitalSchema,
  PageRefObject,
  TraitReference,
} from '@almadar/core';
import type {
  MakePageRefOpts,
  MakeTraitRefOpts,
} from '@almadar/core/builders';
import {
  makeOrbitalWithUses,
  makePageRef,
  makeTraitRef,
} from '@almadar/core/builders';
import type { OrbitalParamsManifest } from '../behaviors/functions/dispatch.js';
import type {
  OrbitalFactoryParams,
  OrbitalTraitOverride,
  ParamValidationResult,
} from './types.js';

/**
 * Structural validation of caller-supplied params against the manifest.
 * Rejects unknown top-level keys and unknown `traitOverrides` keys (the
 * latter against the manifest's `traitNames` allow-list).
 *
 * `raw: object` is the minimum-typed input: callers must already have
 * narrowed from JSON / LLM output to a plain object. The discriminated
 * result lifts callers into the typed `OrbitalFactoryParams` on success.
 */
export function validateOrbitalFactoryParams(
  manifest: OrbitalParamsManifest,
  raw: object,
): ParamValidationResult {
  if (raw === null || Array.isArray(raw)) {
    return {
      ok: false,
      error: { kind: 'not-object', received: Array.isArray(raw) ? 'array' : 'null' },
    };
  }

  const ALLOWED_KEYS = new Set<string>([
    'fields',
    'pagePath',
    'persistence',
    'entityName',
    'collection',
    'traitOverrides',
  ]);
  for (const key of Object.keys(raw)) {
    if (!ALLOWED_KEYS.has(key)) {
      return { ok: false, error: { kind: 'unknown-key', key } };
    }
  }

  // raw is a plain object whose keys are restricted to OrbitalFactoryParams
  // keys; assert the shape now (no widening to follow). Field-level type
  // checks live downstream — the orbital validator catches malformed
  // EntityField / TraitConfig at the lolo / orbital-rust layer.
  const candidate = raw as OrbitalFactoryParams;
  if (candidate.traitOverrides !== undefined) {
    const to = candidate.traitOverrides;
    if (to === null || typeof to !== 'object' || Array.isArray(to)) {
      return {
        ok: false,
        error: {
          kind: 'trait-overrides-not-object',
          received: Array.isArray(to) ? 'array' : typeof to,
        },
      };
    }
    const allowed = new Set<string>(manifest.traitNames);
    for (const traitName of Object.keys(to)) {
      if (!allowed.has(traitName)) {
        return {
          ok: false,
          error: {
            kind: 'unknown-trait-override',
            trait: traitName,
            allowed: manifest.traitNames,
          },
        };
      }
    }
  }

  return { ok: true, params: candidate };
}

interface OverlayContext {
  readonly canonicalEntityName: string;
  readonly canonicalEntity: OrbitalEntity;
}

/**
 * `orbital.entity` is `EntityRef = Entity | string | EntityCall`. For the
 * overlay we require a fully-resolved inline `OrbitalEntity` (the script
 * runs against resolved `.orb`s where every entity has been materialized).
 * Strings and `EntityCall` shapes mean the caller passed an unresolved orb.
 */
function assertResolvedEntity(
  entity: OrbitalSchema['orbitals'][number]['entity'],
  orbitalName: string,
  orbName: string,
): OrbitalEntity {
  if (typeof entity === 'string') {
    throw new Error(
      `applyParamsToOrb: orbital "${orbitalName}" in orb "${orbName}" has an unresolved entity reference (string form). Pass a resolved .orb.`,
    );
  }
  if ('extends' in entity) {
    throw new Error(
      `applyParamsToOrb: orbital "${orbitalName}" in orb "${orbName}" has an unresolved EntityCall ("extends" form). Pass a resolved .orb.`,
    );
  }
  return entity;
}

function findOrbitalOrThrow(
  orb: OrbitalSchema,
  orbitalName: string,
): OrbitalSchema['orbitals'][number] {
  const orbital = orb.orbitals.find((o) => o.name === orbitalName);
  if (!orbital) {
    throw new Error(
      `applyParamsToOrb: orbital "${orbitalName}" not found in orb "${orb.name}". Available: ${orb.orbitals
        .map((o) => o.name)
        .join(', ')}`,
    );
  }
  return orbital;
}

function buildEntity(
  ctx: OverlayContext,
  effectiveName: string,
  effectiveCollection: string | undefined,
  params: OrbitalFactoryParams,
): Entity {
  const canonicalFields: readonly EntityField[] = Array.isArray(ctx.canonicalEntity.fields)
    ? ctx.canonicalEntity.fields
    : [];

  // Caller-wins merge: drop canonical entries whose name appears in
  // params.fields, then concat the extras. Prevents ORB_E_DUPLICATE_FIELD
  // when the analyzer hallucinates a canonical-named field as an "extra".
  const extras: readonly EntityField[] = params.fields ?? [];
  let mergedFields: readonly EntityField[];
  if (extras.length === 0) {
    mergedFields = canonicalFields;
  } else {
    const extraNames = new Set(extras.map((f) => f.name));
    mergedFields = [
      ...canonicalFields.filter((f) => !extraNames.has(f.name)),
      ...extras,
    ];
  }

  const entity: Entity = {
    name: effectiveName,
    persistence: params.persistence ?? ctx.canonicalEntity.persistence,
    fields: [...mergedFields],
  };
  if (effectiveCollection !== undefined) {
    entity.collection = effectiveCollection;
  }
  return entity;
}

type TraitOrInline = OrbitalSchema['orbitals'][number]['traits'][number];
type PageOrRef = NonNullable<OrbitalSchema['orbitals'][number]['pages']>[number];

function isTraitReferenceObject(t: TraitOrInline): t is TraitReference {
  // Narrow guard. `t` comes from `orbital.traits` which is a union of
  // `TraitReference | (inline trait shape)`. The codegen emits the same
  // structural test before rewriting `linkedEntity`.
  if (t === null || typeof t !== 'object') return false;
  if (!('ref' in t)) return false;
  return typeof t.ref === 'string';
}

function isPageRefObject(p: PageOrRef): p is PageRefObject {
  if (p === null || typeof p !== 'object') return false;
  if (!('ref' in p)) return false;
  return typeof p.ref === 'string';
}

function rebuildTraits(
  ctx: OverlayContext,
  effectiveEntityName: string,
  traits: OrbitalSchema['orbitals'][number]['traits'],
): OrbitalDefinition['traits'] {
  return traits.map((t) => {
    if (!isTraitReferenceObject(t)) {
      return t;
    }
    const rewrittenLinkedEntity =
      t.linkedEntity === ctx.canonicalEntityName ? effectiveEntityName : t.linkedEntity;
    // Cast widens `TraitReference.effects: Record<string, unknown[]>` to the
    // narrower `MakeTraitRefOpts.effects: Record<string, SExpr[]>` — same
    // runtime data, looser typing on the schema side. Not `as unknown as`.
    const opts: MakeTraitRefOpts = {
      ...t,
      linkedEntity: rewrittenLinkedEntity,
    } as MakeTraitRefOpts;
    return makeTraitRef(opts);
  });
}

function rebuildPages(
  ctx: OverlayContext,
  effectiveEntityName: string,
  pages: OrbitalSchema['orbitals'][number]['pages'],
): NonNullable<OrbitalDefinition['pages']> {
  if (!pages) return [];
  return pages.map((p) => {
    if (!isPageRefObject(p)) {
      return p;
    }
    const rewrittenLinkedEntity =
      p.linkedEntity === ctx.canonicalEntityName ? effectiveEntityName : p.linkedEntity;
    const opts: MakePageRefOpts = {
      ...p,
      linkedEntity: rewrittenLinkedEntity,
    } as MakePageRefOpts;
    return makePageRef(opts);
  });
}

/**
 * The overlay. Resolves the effective entity name + collection, calls
 * `makeOrbitalWithUses` with the rewritten data, then applies the params'
 * trait/page overrides post-hoc — exactly mirroring the codegen emit at
 * `scripts/regenerate-std-ts.mjs:612-737`.
 *
 * `_manifest` is accepted for parity with the future dispatcher signature
 * but is unused in this overlay — the manifest is consumed by
 * `validateOrbitalFactoryParams` upstream. Kept on the signature so std
 * factories can collapse to one-line wrappers without an arg-shape change.
 */
export function applyParamsToOrb(
  orb: OrbitalSchema,
  orbitalName: string,
  _manifest: OrbitalParamsManifest,
  params: OrbitalFactoryParams,
): OrbitalDefinition {
  const orbital = findOrbitalOrThrow(orb, orbitalName);
  const canonicalEntity = assertResolvedEntity(orbital.entity, orbitalName, orb.name);
  const canonicalEntityName = canonicalEntity.name;
  const effectiveEntityName = params.entityName ?? canonicalEntityName;
  const effectiveCollection =
    typeof canonicalEntity.collection === 'string'
      ? (params.collection ??
        (params.entityName
          ? `${params.entityName.toLowerCase()}s`
          : canonicalEntity.collection))
      : params.collection;

  const ctx: OverlayContext = { canonicalEntityName, canonicalEntity };

  const built = makeOrbitalWithUses({
    name: orbital.name,
    uses: orbital.uses ?? [],
    entity: buildEntity(ctx, effectiveEntityName, effectiveCollection, params),
    traits: rebuildTraits(ctx, effectiveEntityName, orbital.traits),
    pages: rebuildPages(ctx, effectiveEntityName, orbital.pages),
  });

  if (built.traits && params.traitOverrides !== undefined) {
    built.traits = built.traits.map((t) => {
      if (!isTraitReferenceObject(t) || typeof t.name !== 'string') return t;
      const override: OrbitalTraitOverride | undefined = params.traitOverrides?.[t.name];
      if (!override) return t;
      const merged: TraitReference = { ...t };
      if (override.config !== undefined) {
        merged.config = { ...(t.config ?? {}), ...override.config };
      }
      if (override.linkedEntity !== undefined) merged.linkedEntity = override.linkedEntity;
      if (override.events !== undefined) {
        merged.events = { ...(t.events ?? {}), ...override.events };
      }
      if (override.name !== undefined) merged.name = override.name;
      if (override.emitsScope !== undefined) merged.emitsScope = override.emitsScope;
      if (override.listens !== undefined) merged.listens = override.listens;
      return merged;
    });
  }

  if (built.pages && params.pagePath !== undefined) {
    built.pages = built.pages.map((p, idx) => {
      if (!isPageRefObject(p) || idx !== 0) return p;
      return { ...p, path: params.pagePath } as PageRefObject;
    });
  }

  return built;
}
