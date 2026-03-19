/**
 * std-rpg-game
 *
 * RPG game organism.
 * Composes: stdTurnBasedBattle(BattleState) + stdOverworld(WorldZone)
 *         + stdInventory(RpgItem) + stdQuest(Mission)
 *
 * Pages: /battle, /world (initial), /inventory, /quests
 * Connections: ENCOUNTER_STARTED (world->battle), LOOT_DROPPED (battle->inventory),
 *              QUEST_ACCEPTED (world->quests)
 *
 * @level organism
 * @family game
 * @packageDocumentation
 */

import type { OrbitalSchema, EntityField } from '@almadar/core/types';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { compose } from '@almadar/core/builders';
import { stdTurnBasedBattle } from '../molecules/std-turn-based-battle.js';
import { stdOverworld } from '../atoms/std-overworld.js';
import { stdInventory } from '../molecules/std-inventory.js';
import { stdQuest } from '../atoms/std-quest.js';
import { wrapInGameShell } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdRpgGameParams {
  battleStateFields?: EntityField[];
  worldZoneFields?: EntityField[];
  rpgItemFields?: EntityField[];
  missionFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const defaultBattleStateFields: EntityField[] = [
  { name: 'turn', type: 'number', default: 0 },
  { name: 'score', type: 'number', default: 0 },
  { name: 'phase', type: 'string', default: 'setup' },
  { name: 'outcome', type: 'string' },
];

const defaultWorldZoneFields: EntityField[] = [
  { name: 'name', type: 'string', required: true },
  { name: 'description', type: 'string' },
  { name: 'level', type: 'number', default: 1 },
  { name: 'explored', type: 'boolean', default: false },
];

const defaultRpgItemFields: EntityField[] = [
  { name: 'name', type: 'string', required: true },
  { name: 'type', type: 'string', required: true },
  { name: 'quantity', type: 'number', default: 1 },
  { name: 'rarity', type: 'string', default: 'common' },
];

const defaultMissionFields: EntityField[] = [
  { name: 'title', type: 'string', required: true },
  { name: 'description', type: 'string' },
  { name: 'status', type: 'string', default: 'available' },
  { name: 'reward', type: 'string' },
];

// ============================================================================
// Organism
// ============================================================================

export function stdRpgGame(params: StdRpgGameParams): OrbitalSchema {
  const battleStateFields = params.battleStateFields ?? defaultBattleStateFields;
  const worldZoneFields = params.worldZoneFields ?? defaultWorldZoneFields;
  const rpgItemFields = params.rpgItemFields ?? defaultRpgItemFields;
  const missionFields = params.missionFields ?? defaultMissionFields;

  const battleOrbital = stdTurnBasedBattle({
    entityName: 'BattleState',
    fields: battleStateFields,
    gameTitle: 'Battle Arena',
  });

  const worldOrbital = stdOverworld({
    entityName: 'WorldZone',
    fields: worldZoneFields,
    worldTitle: 'World Map',
    headerIcon: 'map',
  });

  const inventoryOrbital = stdInventory({
    entityName: 'RpgItem',
    fields: rpgItemFields,
    headerIcon: 'briefcase',
    pageTitle: 'Inventory',
  });

  const questOrbital = stdQuest({
    entityName: 'Mission',
    fields: missionFields,
    headerIcon: 'flag',
  });

  const pages: ComposePage[] = [
    { name: 'BattlePage', path: '/battle', traits: ['BattleStateBattleFlow', 'BattleStateCombatLog'] },
    { name: 'WorldPage', path: '/world', traits: ['WorldZoneNavigation'], isInitial: true },
    { name: 'InventoryPage', path: '/inventory', traits: ['RpgItemBrowse', 'RpgItemAdd', 'RpgItemUse', 'RpgItemDrop'] },
    { name: 'QuestsPage', path: '/quests', traits: ['MissionTracking'] },
  ];

  const connections: ComposeConnection[] = [
    {
      from: 'WorldZoneNavigation',
      to: 'BattleStateBattleFlow',
      event: {
        event: 'ENCOUNTER_STARTED',
        payload: [{ name: 'zoneId', type: 'string', required: true }],
      },
      triggers: 'START',
    },
    {
      from: 'BattleStateBattleFlow',
      to: 'RpgItemBrowse',
      event: {
        event: 'LOOT_DROPPED',
        payload: [{ name: 'itemId', type: 'string', required: true }],
      },
      triggers: 'INIT',
    },
    {
      from: 'WorldZoneNavigation',
      to: 'MissionTracking',
      event: {
        event: 'QUEST_ACCEPTED',
        payload: [{ name: 'questId', type: 'string', required: true }],
      },
      triggers: 'INIT',
    },
  ];

  const appName = 'RPG Game';


  const schema = compose([battleOrbital, worldOrbital, inventoryOrbital, questOrbital], pages, connections, appName);


  return wrapInGameShell(schema, appName);
}
