/**
 * std-puzzle-app
 *
 * Puzzle game organism.
 * Composes: stdPuzzleGame(PuzzleLevel) + stdScoreBoard(PuzzleScore)
 *
 * Pages: /puzzle (initial), /scores
 *
 * @level organism
 * @family game
 * @packageDocumentation
 */

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { compose } from '@almadar/core/builders';
import { stdPuzzleGame } from './std-puzzle-game.js';
import { stdScoreBoard } from './std-score-board.js';

// ============================================================================
// Params
// ============================================================================

export interface StdPuzzleAppParams {
  puzzleLevelFields?: EntityField[];
  puzzleScoreFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const defaultPuzzleLevelFields: EntityField[] = [
  { name: 'level', type: 'number', default: 1 },
  { name: 'score', type: 'number', default: 0 },
  { name: 'moves', type: 'number', default: 0 },
  { name: 'completed', type: 'boolean', default: false },
];

const defaultPuzzleScoreFields: EntityField[] = [
  { name: 'playerName', type: 'string', required: true },
  { name: 'score', type: 'number', required: true },
  { name: 'level', type: 'number' },
  { name: 'moves', type: 'number' },
];

// ============================================================================
// Organism
// ============================================================================

export function stdPuzzleApp(params: StdPuzzleAppParams): OrbitalSchema {
  const puzzleLevelFields = params.puzzleLevelFields ?? defaultPuzzleLevelFields;
  const puzzleScoreFields = params.puzzleScoreFields ?? defaultPuzzleScoreFields;

  const puzzleOrbital = stdPuzzleGame({
    entityName: 'PuzzleLevel',
    fields: puzzleLevelFields,
    gameTitle: 'Puzzle Challenge',
  });

  const scoreOrbital = stdScoreBoard({
    entityName: 'PuzzleScore',
    fields: puzzleScoreFields,
    headerIcon: 'award',
  });

  const pages: ComposePage[] = [
    { name: 'PuzzlePage', path: '/puzzle', traits: ['PuzzleLevelPuzzleFlow', 'PuzzleLevelPuzzleScore'], isInitial: true },
    { name: 'ScoresPage', path: '/scores', traits: ['PuzzleScoreScoreBoard'] },
  ];

  const connections: ComposeConnection[] = [];

  return compose(
    [puzzleOrbital, scoreOrbital],
    pages,
    connections,
    'Puzzle App',
  );
}
