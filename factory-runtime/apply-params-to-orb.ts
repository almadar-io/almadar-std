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
  Effect,
  Entity,
  EntityField,
  Expression,
  OrbitalDefinition,
  OrbitalEntity,
  OrbitalSchema,
  PageRefObject,
  SExpr,
  CallSiteConfig,
  CallSiteConfigEntry,
  Trait,
  TraitConfigValue,
  TraitEventContract,
  TraitEventListener,
  TraitReference,
  TraitTick,
} from '@almadar/core';
import { isCallSiteConfigDeclaration } from '@almadar/core';
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

  // Reject field shapes the validator will reject downstream. Catching
  // them at the factory boundary turns a multi-iteration subagent
  // repair loop into a single clear error the caller surfaces back to
  // the LLM. Two type-dependent payloads are required:
  //   - `type: "enum"` must carry `values: string[]` (ORB_E_EMPTY_ENUM_VALUES)
  //   - `type: "relation"` must carry `relation: { entity, cardinality }`
  //     (ORB_E_INVALID_RELATION)
  for (const f of extras) {
    if (f.type === 'enum') {
      if (!Array.isArray(f.values) || f.values.length === 0) {
        throw new Error(
          `Field "${f.name ?? '<unnamed>'}" (type: "enum") requires a non-empty \`values: string[]\` array. ` +
            `Got: ${f.values === undefined ? 'undefined' : JSON.stringify(f.values)}.`,
        );
      }
    }
    if (f.type === 'relation') {
      const rel = f.relation;
      if (!rel || typeof rel.entity !== 'string' || rel.entity.length === 0) {
        throw new Error(
          `Field "${f.name ?? '<unnamed>'}" (type: "relation") requires \`relation: { entity: <EntityName>, cardinality: "one" | "many" }\`. ` +
            `Got: ${rel === undefined ? 'undefined' : JSON.stringify(rel)}.`,
        );
      }
      if (rel.cardinality !== 'one' && rel.cardinality !== 'many') {
        throw new Error(
          `Field "${f.name ?? '<unnamed>'}" (type: "relation") requires \`relation.cardinality: "one" | "many"\`. ` +
            `Got: ${rel.cardinality === undefined ? 'undefined' : JSON.stringify(rel.cardinality)}.`,
        );
      }
    }
  }

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

/**
 * The ref-shape branch of `TraitRef` (`@almadar/core`) is an anonymous
 * object literal, not the exported `TraitReference` interface. Extract
 * the actual union member so the negation of `isTraitReferenceObject`
 * actually narrows away the ref branch and leaves the inline `Trait` shape.
 */
type TraitRefObject = Extract<TraitOrInline, { ref: string }>;

function isTraitReferenceObject(t: TraitOrInline): t is TraitRefObject {
  // Narrow guard. `t` comes from `orbital.traits` which is a union of
  // `string | TraitRefObject | Trait`. The codegen emits the same
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

/**
 * Rebind the `linkedEntity` on any inline trait or inline page literal that
 * was authored against the canonical entity name. Mirrors the substitution
 * the codegen emits for ref-shaped traits/pages, so `params.entityName`
 * overrides flow through inline literals too. Symmetric with
 * `tools/almadar-pattern-sync/src/std-ts/regenerate.ts` —
 * the two paths MUST stay in lockstep (see plan rule 6).
 */
function rewriteInlineLinkedEntity<T extends { linkedEntity?: string }>(
  shape: T,
  oldName: string,
  newName: string,
): T {
  if (shape.linkedEntity !== oldName) return shape;
  return { ...shape, linkedEntity: newName };
}

// ============================================================================
// AGENT-005 — Inline-trait entity-name rebinding (Phase 1c body fix)
//
// Phase 1 rebound the trait's top-level `linkedEntity`. AGENT-005's
// deeper half is the SExpression / payload / event-listener literals
// embedded inside the trait — `(fetch X)`, `(persist op X …)`, `(ref X)`,
// `(spawn X …)`, `@X.path` binding roots, render-ui pattern props that
// address the entity store, and payload-schema type strings like `"X"`
// or `"[X]"`. The orbital-rust inline phase rewrites all of these for
// REF-imported traits (when the call-site supplies a `linkedEntity`
// override) but has no record of the canonical name for INLINE-authored
// traits, so the rewrite never fires there. The factory layer is the
// only place that knows BOTH names (`oCanonicalEntityName` baked at
// codegen, `params.entityName` at runtime), so the substitution lives
// here, mirroring `crates/orbital-compiler/src/phases/inline.rs:578`
// (`rewrite_identifiers`) on the canonical `@almadar/core` types.
// ============================================================================

/**
 * Entity-bound positional operators per the canonical operator registry
 * at `packages/almadar-std/modules/core.ts`. For each operator we record:
 *  - the operator string at SExpression index 0
 *  - an optional `actionGuard` for the discriminated form (only `persist`
 *    today: `["persist", "create"|"update"|"delete", entity, …]`)
 *  - the SExpression index that holds the entity-name literal
 *
 * Adding a new entity-bound operator means adding one row here. No code
 * paths elsewhere have to change.
 */
const ENTITY_POSITIONAL_OPS: ReadonlyArray<{
  readonly op: string;
  readonly actionGuard?: ReadonlySet<string>;
  readonly entityIndex: number;
}> = [
  { op: 'fetch', entityIndex: 1 },
  { op: 'ref', entityIndex: 1 },
  { op: 'spawn', entityIndex: 1 },
  { op: 'persist', actionGuard: new Set(['create', 'update', 'delete']), entityIndex: 2 },
];

/**
 * Object keys whose string value carries an entity name. Matches the
 * `ENTITY_VALUED_PROPS` set used by the orbital-rust inline phase
 * (`crates/orbital-compiler/src/phases/inline.rs:695`) so render-ui
 * patterns + trait-ref objects rebind consistently across both layers.
 */
const ENTITY_VALUED_PROPS: ReadonlySet<string> = new Set([
  'entity',
  'source',
  'entityType',
  'linkedEntity',
]);

/**
 * Strict-recursive map shape for SExpr object literals. The canonical
 * `SExprAtom` object branch (`@almadar/core/types/expression.ts`) uses
 * `Record<string, unknown>` to allow open value types at the schema
 * boundary; within the rewriter we work with a stricter view where every
 * value is itself an `SExpr`. The narrowing assertion at the object-branch
 * entry point is the single boundary between the two views.
 */
interface SExprMap { readonly [k: string]: SExpr }

/**
 * Rewrite entity-name references inside a canonical `SExpr`. Covers every
 * shape the orbital runtime treats as an entity reference:
 *
 *   - `(<op> ENTITY …)`              — positional, per `ENTITY_POSITIONAL_OPS`
 *   - `"@ENTITY"` / `"@ENTITY.path"` — binding root rewrite (covers `set`,
 *                                      `get`, and any operator that takes
 *                                      a `@Entity`-rooted binding string)
 *   - `{ "<entityProp>": ENTITY }`   — object props per `ENTITY_VALUED_PROPS`
 *     inside an `SExprAtom` object literal (render-ui pattern config,
 *     payload data, etc.)
 *
 * Operates on the canonical `SExpr` from `@almadar/core` so callers can
 * pass typed `Effect` / `Expression` values directly.
 */
function rewriteEntityInSExpr(value: SExpr, oldName: string, newName: string): SExpr {
  if (value === null) return null;
  if (typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'string') {
    const prefix = `@${oldName}`;
    if (value === prefix || value.startsWith(`${prefix}.`)) {
      return `@${newName}${value.slice(prefix.length)}`;
    }
    return value;
  }
  if (Array.isArray(value)) {
    const first = value[0];
    if (typeof first === 'string') {
      for (const entry of ENTITY_POSITIONAL_OPS) {
        if (first !== entry.op) continue;
        if (entry.actionGuard !== undefined) {
          const action = value[1];
          if (typeof action !== 'string' || !entry.actionGuard.has(action)) continue;
        }
        const at = entry.entityIndex;
        const slot = value[at];
        if (typeof slot !== 'string' || slot !== oldName) continue;
        const rewritten: SExpr[] = [];
        for (let i = 0; i < value.length; i++) {
          rewritten.push(i === at ? newName : rewriteEntityInSExpr(value[i], oldName, newName));
        }
        return rewritten;
      }
    }
    return value.map((v) => rewriteEntityInSExpr(v, oldName, newName));
  }
  // Object-literal branch of `SExprAtom` (render-ui pattern props,
  // payload data, etc.). Narrow the canonical `Record<string, unknown>`
  // to the stricter `SExprMap` view for the recursive walk.
  return rewriteEntityInSExprMap(value as SExprMap, oldName, newName);
}

function rewriteEntityInSExprMap(obj: SExprMap, oldName: string, newName: string): SExprMap {
  const next: { [k: string]: SExpr } = {};
  for (const [k, v] of Object.entries(obj)) {
    if (ENTITY_VALUED_PROPS.has(k) && typeof v === 'string' && v === oldName) {
      next[k] = newName;
    } else {
      next[k] = rewriteEntityInSExpr(v, oldName, newName);
    }
  }
  return next;
}

/**
 * Rewrite the entity-name literal inside an `EventPayloadField.type`
 * (and `entityType`) string. Payload types can read `"Product"`,
 * `"[Product]"`, or a primitive (`"string"` / `"number"` / …). Only the
 * entity-name shapes get rewritten; primitives pass through.
 */
function rewritePayloadFieldType(typeStr: string, oldName: string, newName: string): string {
  if (typeStr === oldName) return newName;
  if (typeStr === `[${oldName}]`) return `[${newName}]`;
  return typeStr;
}

function rewriteEventContract(
  contract: TraitEventContract,
  oldName: string,
  newName: string,
): TraitEventContract {
  if (!contract.payloadSchema || contract.payloadSchema.length === 0) return contract;
  return {
    ...contract,
    payloadSchema: contract.payloadSchema.map((f) => {
      const next = { ...f, type: rewritePayloadFieldType(f.type, oldName, newName) };
      if (typeof f.entityType === 'string' && f.entityType === oldName) {
        next.entityType = newName;
      }
      return next;
    }),
  };
}

function rewriteListener(
  listener: TraitEventListener,
  oldName: string,
  newName: string,
): TraitEventListener {
  // payloadMapping values are strings (`@OldEntity.path` binding roots).
  if (!listener.payloadMapping) return listener;
  const prefix = `@${oldName}`;
  const nextMapping: Record<string, string> = {};
  for (const [k, v] of Object.entries(listener.payloadMapping)) {
    nextMapping[k] =
      v === prefix || v.startsWith(`${prefix}.`)
        ? `@${newName}${v.slice(prefix.length)}`
        : v;
  }
  return { ...listener, payloadMapping: nextMapping };
}

function rewriteTick(tick: TraitTick, oldName: string, newName: string): TraitTick {
  const next: TraitTick = { ...tick };
  if (next.guard !== undefined && next.guard !== null) {
    next.guard = rewriteEntityInSExpr(next.guard as SExpr, oldName, newName) as Expression;
  }
  next.effects = next.effects.map(
    (e) => rewriteEntityInSExpr(e as SExpr, oldName, newName) as Effect,
  );
  return next;
}

/**
 * Rewrite every entity-name reference inside an inline `Trait` so a
 * factory-driven `params.entityName` rename actually lands on the
 * SExpression literals embedded in transitions / effects / ticks /
 * payload type strings. The trait's top-level `linkedEntity` is rewritten
 * separately by `rewriteInlineLinkedEntity`; this function walks every
 * field that can carry a body-level reference. Returns the same canonical
 * `Trait` shape — no widening, no `unknown`.
 */
/**
 * Rebind an inline `Trait` to a renamed entity. Combines top-level
 * `linkedEntity` rewrite + body-level entity-ref rewriting (SExpr literals
 * in transitions / effects / ticks / payloads / listens).
 *
 * Exported for use by codegen-emitted std factories
 * (`packages/almadar-std/behaviors/functions/*.ts`) so the codegen and the
 * runtime overlay share ONE rewriter. Plan rule 6: codegen + runtime overlay
 * MUST stay symmetric — making both call this single helper enforces that.
 */
export function rebindInlineTraitEntity(trait: Trait, oldName: string, newName: string): Trait {
  if (oldName === newName) return trait;
  return rewriteEntityInInlineTrait(rewriteInlineLinkedEntity(trait, oldName, newName), oldName, newName);
}

export function rewriteEntityInInlineTrait(trait: Trait, oldName: string, newName: string): Trait {
  if (oldName === newName) return trait;
  const next: Trait = { ...trait };

  if (next.stateMachine) {
    next.stateMachine = {
      ...next.stateMachine,
      transitions: next.stateMachine.transitions.map((t) => {
        const updated = { ...t };
        if (updated.guard !== undefined && updated.guard !== null) {
          updated.guard = rewriteEntityInSExpr(updated.guard as SExpr, oldName, newName) as Expression;
        }
        if (updated.effects) {
          updated.effects = updated.effects.map(
            (e) => rewriteEntityInSExpr(e as SExpr, oldName, newName) as Effect,
          );
        }
        return updated;
      }),
    };
  }

  if (next.initialEffects) {
    next.initialEffects = next.initialEffects.map(
      (e) => rewriteEntityInSExpr(e as SExpr, oldName, newName) as Effect,
    );
  }

  if (next.ticks) {
    next.ticks = next.ticks.map((t) => rewriteTick(t, oldName, newName));
  }

  if (next.emits) {
    next.emits = next.emits.map((c) => rewriteEventContract(c, oldName, newName));
  }

  if (next.listens) {
    next.listens = next.listens.map((l) => rewriteListener(l, oldName, newName));
  }

  return next;
}

type TraitInput = OrbitalSchema['orbitals'][number]['traits'][number];
type PageInput = NonNullable<OrbitalSchema['orbitals'][number]['pages']>[number];

function rebuildTraits(
  ctx: OverlayContext,
  effectiveEntityName: string,
  traits: OrbitalSchema['orbitals'][number]['traits'],
): OrbitalDefinition['traits'] {
  return traits.map((t): TraitInput => {
    if (!isTraitReferenceObject(t)) {
      if (typeof t === 'string') return t;
      // Inline-authored trait. Phase 1 rebound the trait's top-level
      // `linkedEntity`; AGENT-005 (Rust inline-phase gap) is the deeper
      // body rewrite — `(fetch X)` / `(persist op X …)` / `(ref X)` /
      // `(spawn X …)` / `@X.path` / `linkedEntity: X` literals embedded
      // in the trait's transitions/effects/payloads/render-ui pattern
      // props. We do both here so the compiler sees a fully-rebound
      // trait.
      return rebindInlineTraitEntity(t, ctx.canonicalEntityName, effectiveEntityName);
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
  return pages.map((p): PageInput => {
    if (!isPageRefObject(p)) {
      // Inline `OrbitalPage` has no top-level `linkedEntity` (it carries
      // `primaryEntity` and per-trait `linkedEntity` via `PageTraitRef`).
      // The AGENT-005 fix lives on the ref branch + on inline traits inside
      // the page's `traits[]`, both already symmetric with codegen.
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
        // Every entry in the emitted `config` must be a ConfigField (Rust's
        // `HashMap<String, ConfigField>`). Normalize the base, then merge each
        // override: fold a bare value over a declared field into its `default`,
        // keep a full re-declaration, otherwise wrap bare/render values as
        // `{ type: 'unknown', default }`. A render-ui value object (e.g.
        // `{ type: 'tabs', items: '@entity.items' }`) is NOT a declaration — it
        // has no `default` slot — so it gets wrapped, never dropped raw into the
        // map where serde would parse its inner `items` as a FieldDefinition.
        const base: CallSiteConfig = t.config ?? {};
        const next: Record<string, CallSiteConfigEntry> = {};
        for (const [k, entry] of Object.entries(base)) {
          next[k] = isCallSiteConfigDeclaration(entry)
            ? entry
            : { type: 'unknown', default: entry };
        }
        for (const [k, v] of Object.entries(override.config)) {
          if (isCallSiteConfigDeclaration(v)) {
            next[k] = v;
            continue;
          }
          const existing = base[k];
          next[k] = existing !== undefined && isCallSiteConfigDeclaration(existing)
            ? { ...existing, default: v }
            : { type: 'unknown', default: v };
        }
        merged.config = next;
      }
      if (override.linkedEntity !== undefined) merged.linkedEntity = override.linkedEntity;
      if (override.events !== undefined) {
        // `events` is a string->string rename map (Record<string, string>).
        // A bare array like ["X"] would spread to {"0":"X"} which serde
        // can't deserialize as a TraitReference — the resulting .orb fails
        // validate downstream. Throw at the merge point so the caller (LLM
        // subagent or coordinator) sees a clear error instead of a silent
        // "trait not defined" cascade.
        if (
          override.events === null ||
          typeof override.events !== 'object' ||
          Array.isArray(override.events)
        ) {
          throw new Error(
            `traitOverrides["${t.name}"].events must be a Record<string,string> ` +
              `(rename map like { "OPEN": "ADD_ITEM" }), got ${
                Array.isArray(override.events) ? 'an array' : typeof override.events
              }`,
          );
        }
        for (const [k, v] of Object.entries(override.events)) {
          if (typeof v !== 'string') {
            throw new Error(
              `traitOverrides["${t.name}"].events["${k}"] must be a string ` +
                `(target event name), got ${typeof v}`,
            );
          }
        }
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
