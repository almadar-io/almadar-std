/**
 * std-game-menu
 *
 * Game main menu atom using the `game-menu` pattern.
 * Shows title, subtitle, and menu options (Start, Options, Credits, etc.).
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

import type { OrbitalDefinition, OrbitalSchema, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, makeSchema, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdGameMenuParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Game title */
  gameTitle?: string;
  /** Game subtitle */
  subtitle?: string;
  /** Menu items: each has a label and an event to fire */
  menuItems?: Array<{ label: string; event: string }>;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface GameMenuConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  gameTitle: string;
  subtitle: string;
  menuItems: Array<{ label: string; event: string }>;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdGameMenuParams): GameMenuConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const p = plural(entityName);

  return {
    entityName, fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Menu`,
    gameTitle: params.gameTitle ?? entityName,
    subtitle: params.subtitle ?? 'Press Start',
    menuItems: params.menuItems ?? [
      { label: 'Start Game', event: 'START' },
      { label: 'Options', event: 'OPTIONS' },
      { label: 'Credits', event: 'CREDITS' },
    ],
    pageName: params.pageName ?? `${entityName}MenuPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: GameMenuConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: GameMenuConfig): Trait {
  const { entityName, gameTitle, subtitle, menuItems } = c;

  const menuView = {
    type: 'game-menu',
    title: gameTitle,
    subtitle,
    menuItems: menuItems.map(item => ({
      label: item.label,
      action: item.event,
    })),
  };

  // Build event declarations from menu items
  const menuEvents = menuItems.map(item => ({
    key: item.event,
    name: item.label,
  }));

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [{ name: 'idle', isInitial: true }],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'NAVIGATE', name: 'Navigate' },
        ...menuEvents,
      ],
      transitions: [
        { from: 'idle', to: 'idle', event: 'INIT', effects: [['render-ui', 'main', menuView]] },
        { from: 'idle', to: 'idle', event: 'NAVIGATE', effects: [] },
        // Each menu item is a self-loop (the actual navigation happens via the event bus to other traits)
        ...menuItems.map(item => ({
          from: 'idle', to: 'idle', event: item.event, effects: [['render-ui', 'main', menuView]],
        })),
      ],
    },
  } as Trait;
}

function buildPage(c: GameMenuConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdGameMenuEntity(params: StdGameMenuParams): Entity { return buildEntity(resolve(params)); }
export function stdGameMenuTrait(params: StdGameMenuParams): Trait { return buildTrait(resolve(params)); }
export function stdGameMenuPage(params: StdGameMenuParams): Page { return buildPage(resolve(params)); }

export function stdGameMenu(params: StdGameMenuParams): OrbitalSchema {
  const c = resolve(params);
  return makeSchema(`${c.entityName}Orbital`, makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]));
}
