/**
 * std-sequencer-game
 *
 * Educational game molecule: menu -> playing -> complete.
 * Uses the `sequencer-board` pattern for the playing state.
 *
 * @level molecule
 * @family game
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdSequencerGameParams {
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

interface SequencerGameConfig {
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

function resolve(params: StdSequencerGameParams): SequencerGameConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const p = plural(entityName);

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    collection: params.collection,
    traitName: `${entityName}SequencerGame`,
    gameTitle: params.gameTitle ?? 'Sequencer',
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Trait
// ============================================================================

function buildTrait(c: SequencerGameConfig): Trait {
  const { entityName, gameTitle } = c;

  const menuUI = {
    type: 'game-menu',
    title: gameTitle,
    menuItems: [
      { label: 'Start', event: 'START', variant: 'primary' },
    ],
  };

  const playingUI = {
    type: 'sequencer-board',
    entity: entityName,
    completeEvent: 'COMPLETE',
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

function buildEntity(c: SequencerGameConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection });
}

function buildPage(c: SequencerGameConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdSequencerGameEntity(params: StdSequencerGameParams): Entity {
  return buildEntity(resolve(params));
}

export function stdSequencerGameTrait(params: StdSequencerGameParams): Trait {
  return buildTrait(resolve(params));
}

export function stdSequencerGamePage(params: StdSequencerGameParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdSequencerGame(params: StdSequencerGameParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
