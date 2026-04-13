/**
 * std-platformer-game
 *
 * Side-scrolling platformer game molecule.
 * Composes game atoms into a two-trait orbital:
 *
 * 1. PlatformerFlow trait (primary): menu -> playing -> paused -> gameover
 *    Renders game-menu, platformer-canvas, game-over-screen per state.
 * 2. PlatformerCanvas trait (secondary): extracted from stdPlatformerCanvas,
 *    INIT render-ui removed (standalone: false pattern) so the flow trait
 *    owns the main render slot.
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

import type { OrbitalDefinition, OrbitalSchema, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, ensureIdField, plural, extractTrait, makeSchema, } from '@almadar/core/builders';
import { stdPlatformerCanvas } from '../atoms/std-platformer-canvas.js';

// ============================================================================
// Params
// ============================================================================

export interface StdPlatformerGameParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;

  // Game config
  gameTitle?: string;
  canvasWidth?: number;
  canvasHeight?: number;

  // Labels
  menuSubtitle?: string;
  pauseTitle?: string;
  gameoverTitle?: string;

  // Page
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface PlatformerGameConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  flowTraitName: string;
  canvasTraitName: string;
  gameTitle: string;
  canvasWidth: number;
  canvasHeight: number;
  menuSubtitle: string;
  pauseTitle: string;
  gameoverTitle: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdPlatformerGameParams): PlatformerGameConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);
  const p = plural(entityName);

  // Domain fields required by render-ui bindings (@entity.score, @entity.lives, @entity.player, @entity.platforms)
  const domainFields: EntityField[] = [
    { name: 'score', type: 'number', default: 0, min: 0, max: 9999 },
    { name: 'lives', type: 'number', default: 3, min: 0, max: 10 },
    { name: 'player', type: 'string', default: '' },
    { name: 'platforms', type: 'string', default: '' },
  ];
  const userFieldNames = new Set(baseFields.map(f => f.name));
  const fields = [...baseFields, ...domainFields.filter(f => !userFieldNames.has(f.name))];

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    collection: params.collection,
    flowTraitName: `${entityName}PlatformerFlow`,
    canvasTraitName: `${entityName}PlatformerCanvas`,
    gameTitle: params.gameTitle ?? 'Platformer',
    canvasWidth: params.canvasWidth ?? 800,
    canvasHeight: params.canvasHeight ?? 400,
    menuSubtitle: params.menuSubtitle ?? 'Side-Scrolling Adventure',
    pauseTitle: params.pauseTitle ?? 'Paused',
    gameoverTitle: params.gameoverTitle ?? 'Game Over',
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// PlatformerFlow trait (primary state machine)
// ============================================================================

function buildPlatformerFlowTrait(c: PlatformerGameConfig): Trait {
  const { entityName, gameTitle, menuSubtitle, pauseTitle, gameoverTitle, canvasWidth, canvasHeight } = c;

  // menu state: game-menu with Start Game button
  const menuUI = {
    type: 'game-menu',
    title: gameTitle,
    subtitle: menuSubtitle,
    menuItems: [
      { label: 'Start Game', event: 'START', variant: 'primary' },
    ],
  };

  // playing state: platformer-canvas for side-scrolling gameplay
  const playingUI = {
    type: 'platformer-canvas',
    canvasWidth,
    canvasHeight,
    worldWidth: canvasWidth * 3,
    worldHeight: canvasHeight,
    followCamera: true,
    bgColor: '#1a1a2e',
    leftEvent: 'LEFT',
    rightEvent: 'RIGHT',
    jumpEvent: 'JUMP',
    stopEvent: 'STOP',
  };

  // paused state: game-menu in modal with Resume/Quit
  const pausedModalUI = {
    type: 'game-menu',
    title: pauseTitle,
    menuItems: [
      { label: 'Resume', event: 'RESUME', variant: 'primary' },
      { label: 'Quit', event: 'RESTART', variant: 'ghost' },
    ],
  };

  // gameover state: game-over-screen with final stats
  const gameoverUI = {
    type: 'game-over-screen',
    title: gameoverTitle,
    stats: [
      { label: 'Score', value: '@entity.score' },
      { label: 'Lives', value: '@entity.lives' },
    ],
    menuItems: [
      { label: 'Play Again', event: 'RESTART', variant: 'primary' },
      { label: 'Main Menu', event: 'RESTART', variant: 'secondary' },
    ],
  };

  return {
    name: c.flowTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'menu', isInitial: true },
        { name: 'playing' },
        { name: 'paused' },
        { name: 'gameover' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'START', name: 'Start Game' },
        { key: 'LEFT', name: 'Move Left' },
        { key: 'RIGHT', name: 'Move Right' },
        { key: 'JUMP', name: 'Jump' },
        { key: 'STOP', name: 'Stop' },
        { key: 'PAUSE', name: 'Pause' },
        { key: 'RESUME', name: 'Resume' },
        { key: 'GAME_OVER', name: 'Game Over' },
        { key: 'RESTART', name: 'Restart' },
        { key: 'CLOSE', name: 'Close' },
        { key: 'NAVIGATE', name: 'Navigate' },
      ],
      transitions: [
        // INIT: menu -> menu (fetch entity, render menu)
        {
          from: 'menu', to: 'menu', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', menuUI],
          ],
        },
        // START: menu -> playing (render platformer canvas)
        {
          from: 'menu', to: 'playing', event: 'START',
          effects: [['render-ui', 'main', playingUI]],
        },
        // Movement: playing -> playing self-loops
        {
          from: 'playing', to: 'playing', event: 'LEFT',
          effects: [],
        },
        {
          from: 'playing', to: 'playing', event: 'RIGHT',
          effects: [],
        },
        {
          from: 'playing', to: 'playing', event: 'JUMP',
          effects: [],
        },
        {
          from: 'playing', to: 'playing', event: 'STOP',
          effects: [],
        },
        // NAVIGATE: self-loops (game-menu emits NAVIGATE internally)
        {
          from: 'menu', to: 'menu', event: 'NAVIGATE',
          effects: [],
        },
        {
          from: 'paused', to: 'paused', event: 'NAVIGATE',
          effects: [],
        },
        // PAUSE: playing -> paused (modal)
        {
          from: 'playing', to: 'paused', event: 'PAUSE',
          effects: [['render-ui', 'modal', pausedModalUI]],
        },
        // RESUME: paused -> playing (dismiss modal, re-render main)
        {
          from: 'paused', to: 'playing', event: 'RESUME',
          effects: [['render-ui', 'modal', null], ['render-ui', 'main', playingUI]],
        },
        // CLOSE: paused -> playing (modal exit requirement)
        {
          from: 'paused', to: 'playing', event: 'CLOSE',
          effects: [['render-ui', 'modal', null], ['render-ui', 'main', playingUI]],
        },
        // GAME_OVER: playing -> gameover
        {
          from: 'playing', to: 'gameover', event: 'GAME_OVER',
          effects: [['render-ui', 'main', gameoverUI]],
        },
        // RESTART: gameover -> menu
        {
          from: 'gameover', to: 'menu', event: 'RESTART',
          effects: [['render-ui', 'main', menuUI]],
        },
        // RESTART: paused -> menu
        {
          from: 'paused', to: 'menu', event: 'RESTART',
          effects: [
            ['render-ui', 'modal', null],
            ['render-ui', 'main', menuUI],
          ],
        },
      ],
    },
  } as Trait;
}

// ============================================================================
// PlatformerCanvas trait (extracted from stdPlatformerCanvas, INIT render removed)
// ============================================================================

function buildPlatformerCanvasTrait(c: PlatformerGameConfig): Trait {
  const canvasTrait = extractTrait(stdPlatformerCanvas({
    entityName: c.entityName,
    fields: c.fields,
    canvasWidth: c.canvasWidth,
    canvasHeight: c.canvasHeight,
    followCamera: true,
    bgColor: '#1a1a2e',
  }));

  // Override name to avoid collision with standalone platformer-canvas
  canvasTrait.name = c.canvasTraitName;

  // Remove the INIT transition's render-ui effect so the canvas does not
  // render to main on page load (the PlatformerFlow trait owns main).
  // Keep the fetch so entity data is ready.
  const sm = canvasTrait.stateMachine;
  if (sm && 'transitions' in sm) {
    const transitions = sm.transitions as Array<{
      event: string;
      effects: unknown[];
    }>;
    for (const t of transitions) {
      if (t.event === 'INIT') {
        t.effects = t.effects.filter(e =>
          !(Array.isArray(e) && e[0] === 'render-ui'),
        );
      }
    }
  }

  return canvasTrait;
}

// ============================================================================
// Entity, Page builders
// ============================================================================

function buildEntity(c: PlatformerGameConfig): Entity {
  const instances = [
    { id: 'player-1', name: 'Player', description: 'Main character', status: 'active', score: 0, lives: 3, player: '', platforms: '' },
  ];
  return makeEntity({
    name: c.entityName,
    fields: c.fields,
    persistence: c.persistence,
    collection: c.collection,
    instances,
  });
}

function buildPage(c: PlatformerGameConfig): Page {
  return {
    name: c.pageName,
    path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: c.flowTraitName },
      { ref: c.canvasTraitName },
    ],
  } as Page;
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdPlatformerGameEntity(params: StdPlatformerGameParams): Entity {
  return buildEntity(resolve(params));
}

export function stdPlatformerGameTrait(params: StdPlatformerGameParams): Trait {
  return buildPlatformerFlowTrait(resolve(params));
}

export function stdPlatformerGamePage(params: StdPlatformerGameParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdPlatformerGame(params: StdPlatformerGameParams): OrbitalSchema {
  const c = resolve(params);

  const flowTrait = buildPlatformerFlowTrait(c);
  const canvasTrait = buildPlatformerCanvasTrait(c);
  const entity = buildEntity(c);
  const page = buildPage(c);

  return makeSchema(`${c.entityName}Orbital`, {
    name: `${c.entityName}Orbital`,
    entity,
    traits: [flowTrait, canvasTrait],
    pages: [page],
  } as OrbitalDefinition);
}
