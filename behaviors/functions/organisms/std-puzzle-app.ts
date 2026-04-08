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

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { compose } from '@almadar/core/builders';
import { stdPuzzleGame } from '../molecules/std-puzzle-game.js';
import { stdScoreBoard } from '../atoms/std-score-board.js';
import { wrapInGameShell } from '../layout.js';

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
  });

  const pages: ComposePage[] = [
    { name: 'PuzzlePage', path: '/puzzle', traits: ['PuzzleLevelPuzzleFlow', 'PuzzleLevelPuzzleScore'], isInitial: true },
    { name: 'ScoresPage', path: '/scores', traits: ['PuzzleScoreScoreBoard'] },
  ];

  const connections: ComposeConnection[] = [];

  const appName = 'Puzzle App';


  const schema = compose([puzzleOrbital, scoreOrbital], pages, connections, appName);


  return wrapInGameShell(schema, appName);
}
