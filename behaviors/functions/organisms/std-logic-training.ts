/**
 * std-logic-training
 *
 * Logic training organism.
 * Composes: stdDebuggerGame(DebugChallenge) + stdNegotiatorGame(NegotiateChallenge)
 *         + stdScoreBoard(TrainingScore)
 *
 * Pages: /debugger (initial), /negotiator, /scores
 *
 * @level organism
 * @family educational
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
import { stdDebuggerGame } from '../molecules/std-debugger-game.js';
import { stdNegotiatorGame } from '../molecules/std-negotiator-game.js';
import { stdScoreBoard } from '../atoms/std-score-board.js';
import { wrapInGameShell } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdLogicTrainingParams {
  debugChallengeFields?: EntityField[];
  negotiateChallengeFields?: EntityField[];
  trainingScoreFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const defaultDebugChallengeFields: EntityField[] = [
  { name: 'title', type: 'string', required: true },
  { name: 'bugType', type: 'string' },
  { name: 'score', type: 'number', default: 0 },
  { name: 'solved', type: 'boolean', default: false },
];

const defaultNegotiateChallengeFields: EntityField[] = [
  { name: 'title', type: 'string', required: true },
  { name: 'scenario', type: 'string' },
  { name: 'score', type: 'number', default: 0 },
  { name: 'outcome', type: 'string' },
];

const defaultTrainingScoreFields: EntityField[] = [
  { name: 'playerName', type: 'string', required: true },
  { name: 'score', type: 'number', required: true },
  { name: 'category', type: 'string' },
  { name: 'completedAt', type: 'string' },
];

// ============================================================================
// Organism
// ============================================================================

export function stdLogicTraining(params: StdLogicTrainingParams): OrbitalSchema {
  const debugChallengeFields = params.debugChallengeFields ?? defaultDebugChallengeFields;
  const negotiateChallengeFields = params.negotiateChallengeFields ?? defaultNegotiateChallengeFields;
  const trainingScoreFields = params.trainingScoreFields ?? defaultTrainingScoreFields;

  const debuggerOrbital = stdDebuggerGame({
    entityName: 'DebugChallenge',
    fields: debugChallengeFields,
    gameTitle: 'Debug Challenge',
  });

  const negotiatorOrbital = stdNegotiatorGame({
    entityName: 'NegotiateChallenge',
    fields: negotiateChallengeFields,
    gameTitle: 'Negotiate Challenge',
  });

  const scoreOrbital = stdScoreBoard({
    entityName: 'TrainingScore',
    fields: trainingScoreFields,
  });

  const pages: ComposePage[] = [
    { name: 'DebuggerPage', path: '/debugger', traits: ['DebugChallengeDebuggerGame'], isInitial: true },
    { name: 'NegotiatorPage', path: '/negotiator', traits: ['NegotiateChallengeNegotiatorGame'] },
    { name: 'ScoresPage', path: '/scores', traits: ['TrainingScoreScoreBoard'] },
  ];

  const connections: ComposeConnection[] = [];

  const appName = 'Logic Training';


  const schema = compose([debuggerOrbital, negotiatorOrbital, scoreOrbital], pages, connections, appName);


  return wrapInGameShell(schema, appName);
}
