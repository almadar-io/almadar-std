/**
 * std-event-handler-game
 *
 * Educational game molecule: menu -> playing -> complete.
 * Uses the `event-handler-board` pattern for the playing state.
 *
 * @level molecule
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

export interface StdEventHandlerGameParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  gameTitle?: string;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface EventHandlerGameConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  traitName: string;
  gameTitle: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdEventHandlerGameParams): EventHandlerGameConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);
  const p = plural(entityName);

  const domainFields: EntityField[] = [
    { name: 'score', type: 'number', default: 0 },
    { name: 'level', type: 'number', default: 1 },
  ];
  const userFieldNames = new Set(baseFields.map(f => f.name));
  const fields = [...baseFields, ...domainFields.filter(f => !userFieldNames.has(f.name))];

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    collection: params.collection,
    traitName: `${entityName}EventHandlerGame`,
    gameTitle: params.gameTitle ?? 'Event Handler',
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Trait
// ============================================================================

function buildTrait(c: EventHandlerGameConfig): Trait {
  const { entityName, gameTitle } = c;

  const menuUI = {
    type: 'game-menu',
    title: gameTitle,
    menuItems: [
      { label: 'Start', event: 'START', variant: 'primary' },
    ],
  };

  const playingUI = {
    type: 'stack', direction: 'vertical', gap: 'md',
    children: [
      {
        type: 'game-hud',
        stats: [
          { label: 'Score', value: '@entity.score' },
          { label: 'Level', value: '@entity.level' },
        ],
      },
      {
        type: 'event-handler-board',
        entity: entityName,
        completeEvent: 'COMPLETE',
      },
    ],
  };

  const completeUI = {
    type: 'game-over-screen',
    title: 'Well Done!',
    menuItems: [
      { label: 'Play Again', event: 'RESTART', variant: 'primary' },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'menu', isInitial: true },
        { name: 'playing' },
        { name: 'complete' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'START', name: 'Start' },
        { key: 'COMPLETE', name: 'Complete' },
        { key: 'RESTART', name: 'Restart' },
        { key: 'NAVIGATE', name: 'Navigate' },
      ],
      transitions: [
        {
          from: 'menu', to: 'menu', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', menuUI],
          ],
        },
        {
          from: 'menu', to: 'playing', event: 'START',
          effects: [['render-ui', 'main', playingUI]],
        },
        {
          from: 'menu', to: 'menu', event: 'NAVIGATE',
          effects: [],
        },
        {
          from: 'playing', to: 'complete', event: 'COMPLETE',
          effects: [['render-ui', 'main', completeUI]],
        },
        {
          from: 'complete', to: 'menu', event: 'RESTART',
          effects: [['render-ui', 'main', menuUI]],
        },
      ],
    },
  } as Trait;
}

// ============================================================================
// Entity, Page
// ============================================================================

function buildEntity(c: EventHandlerGameConfig): Entity {
  const instances = [
    { id: 'game-1', name: 'Event Handler Session', description: 'Active game session', status: 'active', score: 0, level: 1 },
  ];
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection, instances });
}

function buildPage(c: EventHandlerGameConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdEventHandlerGameEntity(params: StdEventHandlerGameParams): Entity {
  return buildEntity(resolve(params));
}

export function stdEventHandlerGameTrait(params: StdEventHandlerGameParams): Trait {
  return buildTrait(resolve(params));
}

export function stdEventHandlerGamePage(params: StdEventHandlerGameParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdEventHandlerGame(params: StdEventHandlerGameParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
