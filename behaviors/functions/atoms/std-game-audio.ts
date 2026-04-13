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

  const audioControls = {
    type: 'stack',
    direction: 'vertical',
    gap: 'lg',
    className: 'max-w-md mx-auto',
    children: [
      {
        type: 'stack',
        direction: 'horizontal',
        gap: 'sm',
        align: 'center',
        children: [
          { type: 'icon', name: 'volume-2', size: 'lg' },
          { type: 'typography', content: 'Audio Controls', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [
          {
            type: 'stack', direction: 'vertical', gap: 'md',
            children: [
              { type: 'typography', content: initialMuted ? 'Audio Muted' : 'Audio Active', variant: 'h4' },
              { type: 'typography', content: 'Toggle mute to control game audio playback.', variant: 'body', color: 'muted' },
              {
                type: 'stack', direction: 'horizontal', gap: 'sm',
                children: [
                  { type: 'button', label: 'Toggle Mute', icon: initialMuted ? 'volume-x' : 'volume-2', event: 'TOGGLE_MUTE', variant: 'primary' },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'card',
        children: [
          {
            type: 'stack', direction: 'vertical', gap: 'sm',
            children: [
              { type: 'typography', content: 'Sound Effects', variant: 'h4' },
              {
                type: 'stack', direction: 'horizontal', gap: 'sm',
                children: [
                  { type: 'button', label: 'Play Click', icon: 'play', variant: 'outline' },
                  { type: 'button', label: 'Play Confirm', icon: 'play', variant: 'outline' },
                  { type: 'button', label: 'Play Drop', icon: 'play', variant: 'outline' },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  const audioView = {
    type: 'game-audio-provider',
    manifest: {
      click: 'https://almadar-kflow-assets.web.app/shared/audio/sfx/close_001.ogg',
      confirm: 'https://almadar-kflow-assets.web.app/shared/audio/sfx/confirmation_001.ogg',
      drop: 'https://almadar-kflow-assets.web.app/shared/audio/sfx/drop_001.ogg',
    },
    baseUrl: 'https://almadar-kflow-assets.web.app/shared/audio',
    initialMuted,
    children: [audioControls],
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

export function stdGameAudio(params: StdGameAudioParams): OrbitalSchema {
  const c = resolve(params);
  return makeSchema(`${c.entityName}Orbital`, makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]));
}
