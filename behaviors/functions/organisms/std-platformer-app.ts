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
import { stdPlatformerGame } from '../molecules/std-platformer-game.js';
import { stdScoreBoard } from '../atoms/std-score-board.js';
import { stdInventory } from '../molecules/std-inventory.js';
import { wrapInGameShell } from '../layout.js';

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
  });

  const collectibleOrbital = stdInventory({
    entityName: 'Collectible',
    fields: collectibleFields,
    pageTitle: 'Collectibles',
  });

  const pages: ComposePage[] = [
    { name: 'GamePage', path: '/game', traits: ['PlatLevelPlatformerFlow', 'PlatLevelPlatformerCanvas'], isInitial: true },
    { name: 'ScoresPage', path: '/scores', traits: ['PlatScoreScoreBoard'] },
    { name: 'CollectiblesPage', path: '/collectibles', traits: ['CollectibleBrowse', 'CollectibleAdd', 'CollectibleUse', 'CollectibleDrop'] },
  ];

  const connections: ComposeConnection[] = [];

  const appName = 'Platformer App';


  const schema = compose([gameOrbital, scoreOrbital, collectibleOrbital], pages, connections, appName);


  return wrapInGameShell(schema, appName);
}
