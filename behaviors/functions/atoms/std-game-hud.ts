/**
 * std-game-hud
 *
 * Heads-up display atom. Renders the `game-hud` pattern
 * showing health, score, lives, and other stats.
 *
 * @level atom
 * @family game
 * @packageDocumentation
 *
 * @deprecated The TypeScript factory layer is deprecated as of Phase F.10
 * (2026-04-08). The canonical source for std behaviors is now the registry
 * `.orb` file at `packages/almadar-std/behaviors/registry/<level>/<name>.orb`,
 * which is generated from this TS source by `tools/almadar-behavior-ts-to-orb/`
 * and consumed by the compiler's embedded loader.
 *
 * Consumers should import behaviors via `.lolo`/`.orb` `uses` declarations and
 * reference them as `Alias.entity` / `Alias.traits.X` / `Alias.pages.X`, applying
 * overrides at the call site (`linkedEntity`, `name`, `events`, `effects`,
 * `listens`, `emitsScope`). The TS `*Params` interface and the exported factory
 * functions remain ONLY as the authoring path for the converter; they are NOT a
 * stable public API and may change without notice.
 *
 * See `docs/Almadar_Orb_Behaviors.md` for the orbital-as-function model and
 * `docs/LOLO_Gaps.md` for the migration plan.
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdGameHudParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Stats to display in the HUD (defaults to all non-id fields) */
  statFields?: string[];
  /** HUD position: top-left, top-right, bottom-left, bottom-right */
  position?: string;
  /** HUD size */
  size?: string;
  /** Transparent background */
  transparent?: boolean;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface GameHudConfig {
  entityName: string;
  fields: EntityField[];
  nonIdFields: EntityField[];
  statFields: string[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  position: string;
  size: string;
  transparent: boolean;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdGameHudParams): GameHudConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const nonIdFields = fields.filter(f => f.name !== 'id');
  const p = plural(entityName);

  return {
    entityName, fields, nonIdFields,
    statFields: params.statFields ?? nonIdFields.map(f => f.name),
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Hud`,
    position: params.position ?? 'top-left',
    size: params.size ?? 'md',
    transparent: params.transparent ?? false,
    pageName: params.pageName ?? `${entityName}HudPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: GameHudConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: GameHudConfig): Trait {
  const { entityName, statFields, position, size, transparent } = c;

  // Build stats array for the game-hud pattern
  const stats = statFields.map(f => ({
    label: f.charAt(0).toUpperCase() + f.slice(1),
    value: `@entity.${f}`,
  }));

  const hudView = {
    type: 'game-hud',
    position,
    size,
    transparent,
    stats,
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [{ name: 'idle', isInitial: true }],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'REFRESH', name: 'Refresh' },
      ],
      transitions: [
        { from: 'idle', to: 'idle', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', hudView]] },
        { from: 'idle', to: 'idle', event: 'REFRESH', effects: [['fetch', entityName], ['render-ui', 'main', hudView]] },
      ],
    },
  } as Trait;
}

function buildPage(c: GameHudConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdGameHudEntity(params: StdGameHudParams): Entity { return buildEntity(resolve(params)); }
export function stdGameHudTrait(params: StdGameHudParams): Trait { return buildTrait(resolve(params)); }
export function stdGameHudPage(params: StdGameHudParams): Page { return buildPage(resolve(params)); }

export function stdGameHud(params: StdGameHudParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
