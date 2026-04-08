/**
 * std-strategy-game
 *
 * Strategy game organism.
 * Composes: stdTurnBasedBattle(ArmyBattle) + stdOverworld(Territory) + stdDisplay(Resource)
 *
 * Pages: /battle, /map (initial), /resources
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
import { stdTurnBasedBattle } from '../molecules/std-turn-based-battle.js';
import { stdOverworld } from '../atoms/std-overworld.js';
import { stdDisplay } from '../atoms/std-display.js';
import { wrapInGameShell } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdStrategyGameParams {
  armyBattleFields?: EntityField[];
  territoryFields?: EntityField[];
  resourceFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const defaultArmyBattleFields: EntityField[] = [
  { name: 'turn', type: 'number', default: 0 },
  { name: 'score', type: 'number', default: 0 },
  { name: 'armySize', type: 'number', default: 10 },
  { name: 'morale', type: 'number', default: 100 },
];

const defaultTerritoryFields: EntityField[] = [
  { name: 'name', type: 'string', required: true },
  { name: 'owner', type: 'string' },
  { name: 'defense', type: 'number', default: 0 },
  { name: 'explored', type: 'boolean', default: false },
];

const defaultResourceFields: EntityField[] = [
  { name: 'gold', type: 'number', default: 0 },
  { name: 'food', type: 'number', default: 0 },
  { name: 'wood', type: 'number', default: 0 },
  { name: 'iron', type: 'number', default: 0 },
];

// ============================================================================
// Organism
// ============================================================================

export function stdStrategyGame(params: StdStrategyGameParams): OrbitalSchema {
  const armyBattleFields = params.armyBattleFields ?? defaultArmyBattleFields;
  const territoryFields = params.territoryFields ?? defaultTerritoryFields;
  const resourceFields = params.resourceFields ?? defaultResourceFields;

  const battleOrbital = stdTurnBasedBattle({
    entityName: 'ArmyBattle',
    fields: armyBattleFields,
    gameTitle: 'Army Battle',
    menuSubtitle: 'Turn-Based Strategy',
  });

  const overworldOrbital = stdOverworld({
    entityName: 'Territory',
    fields: territoryFields,
    worldTitle: 'Territory Map',
    headerIcon: 'map',
  });

  const resourceOrbital = stdDisplay({
    entityName: 'Resource',
    fields: resourceFields,
    headerIcon: 'database',
    pageTitle: 'Resources',
  });

  const pages: ComposePage[] = [
    { name: 'BattlePage', path: '/battle', traits: ['ArmyBattleBattleFlow', 'ArmyBattleCombatLog'] },
    { name: 'MapPage', path: '/map', traits: ['TerritoryNavigation'], isInitial: true },
    { name: 'ResourcesPage', path: '/resources', traits: ['ResourceDisplay'] },
  ];

  const connections: ComposeConnection[] = [];

  const appName = 'Strategy Game';


  const schema = compose([battleOrbital, overworldOrbital, resourceOrbital], pages, connections, appName);


  return wrapInGameShell(schema, appName);
}
