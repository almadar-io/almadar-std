/**
 * std-puzzle-game
 *
 * Puzzle game molecule.
 * Composes game atoms into a two-trait orbital:
 *
 * 1. PuzzleFlow trait (primary): menu -> playing -> paused -> gameover
 *    Renders game-menu, game-canvas-2d with score-board, game-over-screen.
 * 2. PuzzleScore trait (secondary): extracted from stdScoreBoard,
 *    INIT render-ui removed (standalone: false pattern) so the flow trait
 *    owns the main render slot.
 *
 * @level molecule
 * @family game
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, ensureIdField, plural, extractTrait } from '@almadar/core/builders';
import { stdScoreBoard } from '../atoms/std-score-board.js';

// ============================================================================
// Params
// ============================================================================

export interface StdPuzzleGameParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;

  // Game config
  gameTitle?: string;
  width?: number;
  height?: number;

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

interface PuzzleGameConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  flowTraitName: string;
  scoreTraitName: string;
  gameTitle: string;
  width: number;
  height: number;
  menuSubtitle: string;
  pauseTitle: string;
  gameoverTitle: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdPuzzleGameParams): PuzzleGameConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);
  const p = plural(entityName);

  // Merge in score-board fields that the extracted PuzzleScore trait references
  // plus domain fields required by render-ui bindings (@entity.moves)
  const domainFields: EntityField[] = [
    { name: 'score', type: 'number', default: 0, min: 0, max: 9999 },
    { name: 'highScore', type: 'number', default: 0, min: 0, max: 9999 },
    { name: 'combo', type: 'number', default: 0, min: 0, max: 99 },
    { name: 'multiplier', type: 'number', default: 1, min: 1, max: 10 },
    { name: 'level', type: 'number', default: 1, min: 1, max: 99 },
    { name: 'moves', type: 'number', default: 0, min: 0, max: 9999 },
  ];
  const userFieldNames = new Set(baseFields.map(f => f.name));
  const fields = [...baseFields, ...domainFields.filter(f => !userFieldNames.has(f.name))];

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    collection: params.collection,
    flowTraitName: `${entityName}PuzzleFlow`,
    scoreTraitName: `${entityName}PuzzleScore`,
    gameTitle: params.gameTitle ?? 'Puzzle',
    width: params.width ?? 800,
    height: params.height ?? 600,
    menuSubtitle: params.menuSubtitle ?? 'Puzzle Challenge',
    pauseTitle: params.pauseTitle ?? 'Paused',
    gameoverTitle: params.gameoverTitle ?? 'Puzzle Complete',
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// PuzzleFlow trait (primary state machine)
// ============================================================================

function buildPuzzleFlowTrait(c: PuzzleGameConfig): Trait {
  const { entityName, gameTitle, menuSubtitle, pauseTitle, gameoverTitle, width, height } = c;

  // menu state: game-menu with Start Puzzle button
  const menuUI = {
    type: 'game-menu',
    title: gameTitle,
    subtitle: menuSubtitle,
    menuItems: [
      { label: 'Start Puzzle', event: 'START', variant: 'primary' },
    ],
  };

  // playing state: game-canvas-2d for puzzle rendering
  const playingUI = {
    type: 'game-canvas-2d',
    width,
    height,
    fps: 60,
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
      { label: 'Moves', value: '@entity.moves' },
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
        { key: 'START', name: 'Start Puzzle' },
        { key: 'MOVE', name: 'Make Move' },
        { key: 'HINT', name: 'Show Hint' },
        { key: 'PAUSE', name: 'Pause' },
        { key: 'RESUME', name: 'Resume' },
        { key: 'GAME_OVER', name: 'Puzzle Complete' },
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
        // START: menu -> playing (render puzzle canvas)
        {
          from: 'menu', to: 'playing', event: 'START',
          effects: [['render-ui', 'main', playingUI]],
        },
        // MOVE: playing -> playing (increment moves)
        {
          from: 'playing', to: 'playing', event: 'MOVE',
          effects: [
            ['set', '@entity.moves', ['+', '@entity.moves', 1]],
            ['render-ui', 'main', playingUI],
          ],
        },
        // HINT: playing -> playing self-loop
        {
          from: 'playing', to: 'playing', event: 'HINT',
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
// PuzzleScore trait (extracted from stdScoreBoard, INIT render removed)
// ============================================================================

function buildPuzzleScoreTrait(c: PuzzleGameConfig): Trait {
  const scoreTrait = extractTrait(stdScoreBoard({
    entityName: c.entityName,
    fields: c.fields,
  }));

  // Override name to avoid collision with standalone score-board
  scoreTrait.name = c.scoreTraitName;

  // Remove the INIT transition's render-ui effect so the score board does not
  // render to main on page load (the PuzzleFlow trait owns main).
  // Keep the fetch so entity data is ready when ADD_SCORE fires.
  const sm = scoreTrait.stateMachine;
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

  return scoreTrait;
}

// ============================================================================
// Entity, Page builders
// ============================================================================

function buildEntity(c: PuzzleGameConfig): Entity {
  const instances = [
    { id: 'puzzle-1', name: 'Puzzle Board', description: 'Active puzzle', status: 'active', score: 0, highScore: 0, combo: 0, multiplier: 1, level: 1, moves: 0 },
  ];
  return makeEntity({
    name: c.entityName,
    fields: c.fields,
    persistence: c.persistence,
    collection: c.collection,
    instances,
  });
}

function buildPage(c: PuzzleGameConfig): Page {
  return {
    name: c.pageName,
    path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: c.flowTraitName },
      { ref: c.scoreTraitName },
    ],
  } as Page;
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdPuzzleGameEntity(params: StdPuzzleGameParams): Entity {
  return buildEntity(resolve(params));
}

export function stdPuzzleGameTrait(params: StdPuzzleGameParams): Trait {
  return buildPuzzleFlowTrait(resolve(params));
}

export function stdPuzzleGamePage(params: StdPuzzleGameParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdPuzzleGame(params: StdPuzzleGameParams): OrbitalDefinition {
  const c = resolve(params);

  const flowTrait = buildPuzzleFlowTrait(c);
  const scoreTrait = buildPuzzleScoreTrait(c);
  const entity = buildEntity(c);
  const page = buildPage(c);

  return {
    name: `${c.entityName}Orbital`,
    entity,
    traits: [flowTrait, scoreTrait],
    pages: [page],
  } as OrbitalDefinition;
}
