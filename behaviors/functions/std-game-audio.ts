/**
 * std-game-audio
 *
 * Game audio provider atom using the `game-audio-provider` pattern.
 * Wraps child content with an audio context, providing sound playback
 * and mute toggling.
 *
 * @level atom
 * @family game
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdGameAudioParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Initial muted state */
  initialMuted?: boolean;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface GameAudioConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  initialMuted: boolean;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdGameAudioParams): GameAudioConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const p = plural(entityName);

  return {
    entityName, fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}GameAudio`,
    initialMuted: params.initialMuted ?? false,
    pageName: params.pageName ?? `${entityName}AudioPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: GameAudioConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: GameAudioConfig): Trait {
  const { entityName, initialMuted } = c;

  const audioView = {
    type: 'game-audio-provider',
    manifest: {},
    baseUrl: '',
    initialMuted,
    children: [],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'TOGGLE_MUTE', name: 'Toggle Mute' },
      ],
      transitions: [
        { from: 'idle', to: 'idle', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', audioView]] },
        { from: 'idle', to: 'idle', event: 'TOGGLE_MUTE', effects: [['render-ui', 'main', audioView]] },
      ],
    },
  } as Trait;
}

function buildPage(c: GameAudioConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdGameAudioEntity(params: StdGameAudioParams): Entity { return buildEntity(resolve(params)); }
export function stdGameAudioTrait(params: StdGameAudioParams): Trait { return buildTrait(resolve(params)); }
export function stdGameAudioPage(params: StdGameAudioParams): Page { return buildPage(resolve(params)); }

export function stdGameAudio(params: StdGameAudioParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
