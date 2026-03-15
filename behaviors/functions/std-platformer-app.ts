/**
 * std-platformer-app
 *
 * Platformer game organism.
 * Composes: stdPlatformerGame(PlatLevel) + stdScoreBoard(PlatScore) + stdInventory(Collectible)
 *
 * Pages: /game (initial), /scores, /collectibles
 *
 * @level organism
 * @family game
 * @packageDocumentation
 */

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { compose } from '@almadar/core/builders';
import { stdPlatformerGame } from './std-platformer-game.js';
import { stdScoreBoard } from './std-score-board.js';
import { stdInventory } from './std-inventory.js';

// ============================================================================
// Params
// ============================================================================

export interface StdPlatformerAppParams {
  platLevelFields?: EntityField[];
  platScoreFields?: EntityField[];
  collectibleFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const defaultPlatLevelFields: EntityField[] = [
  { name: 'level', type: 'number', default: 1 },
  { name: 'score', type: 'number', default: 0 },
  { name: 'lives', type: 'number', default: 3 },
  { name: 'time', type: 'number', default: 0 },
];

const defaultPlatScoreFields: EntityField[] = [
  { name: 'playerName', type: 'string', required: true },
  { name: 'score', type: 'number', required: true },
  { name: 'level', type: 'number' },
  { name: 'completedAt', type: 'string' },
];

const defaultCollectibleFields: EntityField[] = [
  { name: 'name', type: 'string', required: true },
  { name: 'type', type: 'string', required: true },
  { name: 'quantity', type: 'number', default: 1 },
  { name: 'rarity', type: 'string', default: 'common' },
];

// ============================================================================
// Organism
// ============================================================================

export function stdPlatformerApp(params: StdPlatformerAppParams): OrbitalSchema {
  const platLevelFields = params.platLevelFields ?? defaultPlatLevelFields;
  const platScoreFields = params.platScoreFields ?? defaultPlatScoreFields;
  const collectibleFields = params.collectibleFields ?? defaultCollectibleFields;

  const gameOrbital = stdPlatformerGame({
    entityName: 'PlatLevel',
    fields: platLevelFields,
    gameTitle: 'Platformer',
  });

  const scoreOrbital = stdScoreBoard({
    entityName: 'PlatScore',
    fields: platScoreFields,
    headerIcon: 'award',
  });

  const collectibleOrbital = stdInventory({
    entityName: 'Collectible',
    fields: collectibleFields,
    headerIcon: 'star',
    pageTitle: 'Collectibles',
  });

  const pages: ComposePage[] = [
    { name: 'GamePage', path: '/game', traits: ['PlatLevelPlatformerFlow', 'PlatLevelPlatformerCanvas'], isInitial: true },
    { name: 'ScoresPage', path: '/scores', traits: ['PlatScoreScoreBoard'] },
    { name: 'CollectiblesPage', path: '/collectibles', traits: ['CollectibleBrowse', 'CollectibleAdd', 'CollectibleUse', 'CollectibleDrop'] },
  ];

  const connections: ComposeConnection[] = [];

  return compose(
    [gameOrbital, scoreOrbital, collectibleOrbital],
    pages,
    connections,
    'Platformer App',
  );
}
