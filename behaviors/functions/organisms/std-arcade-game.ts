/**
 * std-arcade-game
 *
 * Arcade game organism.
 * Composes: stdGameflow(ArcadeState) + stdGameCanvas2d(ArcadeCanvas)
 *         + stdScoreBoard(ArcadeScore) + stdGameHud(ArcadeHud)
 *
 * Pages: /game (initial), /scores
 *
 * @level organism
 * @family game
 * @packageDocumentation
 */

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { compose } from '@almadar/core/builders';
import { stdGameflow } from '../atoms/std-gameflow.js';
import { stdGameCanvas2d } from '../atoms/std-game-canvas-2d.js';
import { stdScoreBoard } from '../atoms/std-score-board.js';
import { stdGameHud } from '../atoms/std-game-hud.js';
import { wrapInGameShell } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdArcadeGameParams {
  arcadeStateFields?: EntityField[];
  arcadeCanvasFields?: EntityField[];
  arcadeScoreFields?: EntityField[];
  arcadeHudFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const defaultArcadeStateFields: EntityField[] = [
  { name: 'level', type: 'number', default: 1 },
  { name: 'score', type: 'number', default: 0 },
  { name: 'lives', type: 'number', default: 3 },
  { name: 'highScore', type: 'number', default: 0 },
];

const defaultArcadeCanvasFields: EntityField[] = [
  { name: 'width', type: 'number', default: 800 },
  { name: 'height', type: 'number', default: 600 },
  { name: 'fps', type: 'number', default: 60 },
  { name: 'running', type: 'boolean', default: false },
];

const defaultArcadeScoreFields: EntityField[] = [
  { name: 'playerName', type: 'string', required: true },
  { name: 'score', type: 'number', required: true },
  { name: 'level', type: 'number' },
  { name: 'completedAt', type: 'string' },
];

const defaultArcadeHudFields: EntityField[] = [
  { name: 'score', type: 'number', default: 0 },
  { name: 'lives', type: 'number', default: 3 },
  { name: 'level', type: 'number', default: 1 },
  { name: 'timer', type: 'number', default: 0 },
];

// ============================================================================
// Organism
// ============================================================================

export function stdArcadeGame(params: StdArcadeGameParams): OrbitalSchema {
  const arcadeStateFields = params.arcadeStateFields ?? defaultArcadeStateFields;
  const arcadeCanvasFields = params.arcadeCanvasFields ?? defaultArcadeCanvasFields;
  const arcadeScoreFields = params.arcadeScoreFields ?? defaultArcadeScoreFields;
  const arcadeHudFields = params.arcadeHudFields ?? defaultArcadeHudFields;

  const gameflowOrbital = stdGameflow({
    entityName: 'ArcadeState',
    fields: arcadeStateFields,
    gameTitle: 'Arcade',
  });

  const canvasOrbital = stdGameCanvas2d({
    entityName: 'ArcadeCanvas',
    fields: arcadeCanvasFields,
  });

  const scoreOrbital = stdScoreBoard({
    entityName: 'ArcadeScore',
    fields: arcadeScoreFields,
  });

  const hudOrbital = stdGameHud({
    entityName: 'ArcadeHud',
    fields: arcadeHudFields,
  });

  const pages: ComposePage[] = [
    { name: 'GamePage', path: '/game', traits: ['ArcadeStateGameflow'], isInitial: true },
    { name: 'CanvasPage', path: '/canvas', traits: ['ArcadeCanvasGameCanvas2d'] },
    { name: 'HudPage', path: '/hud', traits: ['ArcadeHudHud'] },
    { name: 'ScoresPage', path: '/scores', traits: ['ArcadeScoreScoreBoard'] },
  ];

  const connections: ComposeConnection[] = [];

  const appName = 'Arcade Game';


  const schema = compose([gameflowOrbital, canvasOrbital, scoreOrbital, hudOrbital], pages, connections, appName);


  return wrapInGameShell(schema, appName);
}
