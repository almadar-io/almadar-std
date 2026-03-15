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
 */

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { compose } from '@almadar/core/builders';
import { stdDebuggerGame } from './std-debugger-game.js';
import { stdNegotiatorGame } from './std-negotiator-game.js';
import { stdScoreBoard } from './std-score-board.js';

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

  return compose(
    [debuggerOrbital, negotiatorOrbital, scoreOrbital],
    pages,
    connections,
    'Logic Training',
  );
}
