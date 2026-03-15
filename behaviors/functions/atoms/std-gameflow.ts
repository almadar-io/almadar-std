/**
 * std-gameflow
 *
 * Game state management behavior: menu, playing, paused, gameover.
 * Uses game UI patterns per state:
 *   menu     -> game-menu (title, subtitle, Start Game button)
 *   playing  -> game-hud (score, level stats)
 *   paused   -> game-menu in modal (Resume, Quit buttons)
 *   gameover -> game-over-screen (score, Play Again, Main Menu)
 *
 * Pure function: params in, OrbitalDefinition out.
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

export interface StdGameflowParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;

  // Labels
  gameTitle?: string;
  menuTitle?: string;
  pauseTitle?: string;
  gameoverTitle?: string;

  // Icons
  headerIcon?: string;

  // Page
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface GameflowConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  traitName: string;
  gameTitle: string;
  menuTitle: string;
  pauseTitle: string;
  gameoverTitle: string;
  headerIcon: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdGameflowParams): GameflowConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);
  const p = plural(entityName);

  // Domain fields required by render-ui bindings (@entity.score, @entity.level)
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
    traitName: `${entityName}Gameflow`,
    gameTitle: params.gameTitle ?? entityName,
    menuTitle: params.menuTitle ?? 'Main Menu',
    pauseTitle: params.pauseTitle ?? 'Paused',
    gameoverTitle: params.gameoverTitle ?? 'Game Over',
    headerIcon: params.headerIcon ?? 'gamepad-2',
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: GameflowConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection });
}

function buildTrait(c: GameflowConfig): Trait {
  const { entityName, gameTitle, menuTitle, pauseTitle, gameoverTitle } = c;

  // Menu state: game-menu with Start Game button
  const menuUI = {
    type: 'game-menu',
    title: gameTitle,
    subtitle: menuTitle,
    menuItems: [
      { label: 'Start Game', event: 'START', variant: 'primary' },
    ],
  };

  // Playing state: game-hud with score/level stats
  const playingUI = {
    type: 'game-hud',
    stats: [
      { label: 'Score', value: '@entity.score' },
      { label: 'Level', value: '@entity.level' },
    ],
  };

  // Paused state: game-menu in modal with Resume/Quit
  const pausedModalUI = {
    type: 'game-menu',
    title: pauseTitle,
    menuItems: [
      { label: 'Resume', event: 'RESUME', variant: 'primary' },
      { label: 'Quit', event: 'RESTART', variant: 'ghost' },
    ],
  };

  // Game over state: game-over-screen with score and actions
  const gameoverUI = {
    type: 'game-over-screen',
    title: gameoverTitle,
    stats: [
      { label: 'Score', value: '@entity.score' },
      { label: 'Level', value: '@entity.level' },
    ],
    menuItems: [
      { label: 'Play Again', event: 'RESTART', variant: 'primary' },
      { label: 'Main Menu', event: 'RESTART', variant: 'secondary' },
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
        { name: 'paused' },
        { name: 'gameover' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'START', name: 'Start' },
        { key: 'PAUSE', name: 'Pause' },
        { key: 'RESUME', name: 'Resume' },
        { key: 'GAME_OVER', name: 'Game Over' },
        { key: 'RESTART', name: 'Restart' },
        { key: 'CLOSE', name: 'Close' },
        { key: 'NAVIGATE', name: 'Navigate' },
      ],
      transitions: [
        // INIT: menu -> menu
        {
          from: 'menu', to: 'menu', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', menuUI],
          ],
        },
        // START: menu -> playing
        {
          from: 'menu', to: 'playing', event: 'START',
          effects: [['render-ui', 'main', playingUI]],
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
        // PAUSE: playing -> paused
        {
          from: 'playing', to: 'paused', event: 'PAUSE',
          effects: [['render-ui', 'modal', pausedModalUI]],
        },
        // RESUME: paused -> playing
        {
          from: 'paused', to: 'playing', event: 'RESUME',
          effects: [['render-ui', 'modal', null]],
        },
        // CLOSE: paused -> playing (modal exit requirement)
        {
          from: 'paused', to: 'playing', event: 'CLOSE',
          effects: [['render-ui', 'modal', null]],
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

function buildPage(c: GameflowConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdGameflowEntity(params: StdGameflowParams): Entity {
  return buildEntity(resolve(params));
}

export function stdGameflowTrait(params: StdGameflowParams): Trait {
  return buildTrait(resolve(params));
}

export function stdGameflowPage(params: StdGameflowParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdGameflow(params: StdGameflowParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
