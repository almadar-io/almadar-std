/**
 * 2D Strategy Game Behaviors
 *
 * Standard behaviors for 2D strategy games: turn management, unit commands,
 * fog of war, and resource management.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from '../types.js';

// ============================================================================
// std-turn-system - Turn Management
// ============================================================================

/**
 * std-turn-system - Turn-based game cycle management.
 *
 * States: Waiting -> Acting -> Resolving
 * Tracks current player, turn number, and phase.
 */
export const TURN_SYSTEM_BEHAVIOR: OrbitalSchema = {
  name: 'std-turn-system',
  version: '1.0.0',
  description: 'Turn-based game cycle with phases',
  orbitals: [
    {
      name: 'TurnSystemOrbital',
      entity: {
        name: 'TurnState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'currentPlayer', type: 'number', default: 1 },
          { name: 'turnNumber', type: 'number', default: 1 },
          { name: 'phase', type: 'string', default: 'waiting' },
        ],
      },
      traits: [
        {
          name: 'TurnSystem',
          linkedEntity: 'TurnState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Waiting', isInitial: true },
              { name: 'Acting' },
              { name: 'Resolving' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'BEGIN_TURN', name: 'Begin Turn' },
              { key: 'END_ACTIONS', name: 'End Actions' },
              { key: 'RESOLVE', name: 'Resolve' },
              { key: 'NEXT_TURN', name: 'Next Turn' },
            ],
            transitions: [
              {
                from: 'Waiting',
                to: 'Waiting',
                event: 'INIT',
                effects: [
                  ['fetch', 'TurnState'],
                  ['set', '@entity.currentPlayer', 1],
                  ['set', '@entity.turnNumber', 1],
                  ['set', '@entity.phase', 'waiting'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Turn System' }],
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Waiting',
                to: 'Acting',
                event: 'BEGIN_TURN',
                effects: [
                  ['fetch', 'TurnState'],
                  ['set', '@entity.phase', 'acting'],
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Acting',
                to: 'Resolving',
                event: 'END_ACTIONS',
                effects: [
                  ['fetch', 'TurnState'],
                  ['set', '@entity.phase', 'resolving'],
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Resolving',
                to: 'Waiting',
                event: 'RESOLVE',
                effects: [
                  ['fetch', 'TurnState'],
                  ['set', '@entity.phase', 'waiting'],
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Resolving',
                to: 'Waiting',
                event: 'NEXT_TURN',
                effects: [
                  ['fetch', 'TurnState'],
                  ['set', '@entity.turnNumber', ['+', '@entity.turnNumber', 1]],
                  ['set', '@entity.currentPlayer', ['if', ['=', '@entity.currentPlayer', 1], 2, 1]],
                  ['set', '@entity.phase', 'waiting'],
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'TurnSystemPage',
          path: '/turn-system',
          isInitial: true,
          traits: [{ ref: 'TurnSystem' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-unit-command - Unit Orders
// ============================================================================

/**
 * std-unit-command - Unit selection and command issuing.
 *
 * States: Idle -> Selected -> Commanding
 * Select a unit and issue movement/attack orders.
 */
export const UNIT_COMMAND_BEHAVIOR: OrbitalSchema = {
  name: 'std-unit-command',
  version: '1.0.0',
  description: 'Unit selection and command issuing for strategy games',
  orbitals: [
    {
      name: 'UnitCommandOrbital',
      entity: {
        name: 'UnitCommand',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'unitId', type: 'string', default: '' },
          { name: 'commandType', type: 'string', default: '' },
          { name: 'targetX', type: 'number', default: 0 },
          { name: 'targetY', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'UnitCommander',
          linkedEntity: 'UnitCommand',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Idle', isInitial: true },
              { name: 'Selected' },
              { name: 'Commanding' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'SELECT_UNIT', name: 'Select Unit', payloadSchema: [
                { name: 'unitId', type: 'string', required: true },
              ] },
              { key: 'ISSUE_COMMAND', name: 'Issue Command', payloadSchema: [
                { name: 'commandType', type: 'string', required: true },
                { name: 'targetX', type: 'number', required: true },
                { name: 'targetY', type: 'number', required: true },
              ] },
              { key: 'EXECUTE', name: 'Execute Command' },
              { key: 'DESELECT', name: 'Deselect' },
            ],
            transitions: [
              {
                from: 'Idle',
                to: 'Idle',
                event: 'INIT',
                effects: [
                  ['fetch', 'UnitCommand'],
                  ['set', '@entity.unitId', ''],
                  ['set', '@entity.commandType', ''],
                  ['render-ui', 'main', { type: 'page-header', title: 'Unit Commands' }],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'UnitCommand',
                  }],
                ],
              },
              {
                from: 'Idle',
                to: 'Selected',
                event: 'SELECT_UNIT',
                effects: [
                  ['fetch', 'UnitCommand'],
                  ['set', '@entity.unitId', '@payload.unitId'],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'UnitCommand',
                  }],
                  ['render-ui', 'hud-bottom', { type: 'stats',
                    label: 'Unit', value: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Selected',
                to: 'Commanding',
                event: 'ISSUE_COMMAND',
                effects: [
                  ['fetch', 'UnitCommand'],
                  ['set', '@entity.commandType', '@payload.commandType'],
                  ['set', '@entity.targetX', '@payload.targetX'],
                  ['set', '@entity.targetY', '@payload.targetY'],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'UnitCommand',
                  }],
                ],
              },
              {
                from: 'Commanding',
                to: 'Idle',
                event: 'EXECUTE',
                effects: [
                  ['fetch', 'UnitCommand'],
                  ['set', '@entity.unitId', ''],
                  ['set', '@entity.commandType', ''],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'UnitCommand',
                  }],
                ],
              },
              {
                from: 'Selected',
                to: 'Idle',
                event: 'DESELECT',
                effects: [
                  ['fetch', 'UnitCommand'],
                  ['set', '@entity.unitId', ''],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'UnitCommand',
                  }],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'UnitCommandPage',
          path: '/unit-command',
          isInitial: true,
          traits: [{ ref: 'UnitCommander' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-fog-of-war - Visibility Management
// ============================================================================

/**
 * std-fog-of-war - Map visibility and exploration tracking.
 *
 * States: Hidden -> Partial -> Revealed
 * Tracks visible tiles, explored tiles, and reveal radius.
 */
export const FOG_OF_WAR_BEHAVIOR: OrbitalSchema = {
  name: 'std-fog-of-war',
  version: '1.0.0',
  description: 'Map visibility and fog of war management',
  orbitals: [
    {
      name: 'FogOfWarOrbital',
      entity: {
        name: 'FogState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'visibleTiles', type: 'number', default: 0 },
          { name: 'exploredTiles', type: 'number', default: 0 },
          { name: 'revealRadius', type: 'number', default: 3 },
        ],
      },
      traits: [
        {
          name: 'FogOfWar',
          linkedEntity: 'FogState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Hidden', isInitial: true },
              { name: 'Partial' },
              { name: 'Revealed' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'REVEAL', name: 'Reveal Area', payloadSchema: [
                { name: 'tiles', type: 'number', required: true },
              ] },
              { key: 'EXPLORE', name: 'Explore' },
              { key: 'REVEAL_ALL', name: 'Reveal All' },
              { key: 'RESET_FOG', name: 'Reset Fog' },
            ],
            transitions: [
              {
                from: 'Hidden',
                to: 'Hidden',
                event: 'INIT',
                effects: [
                  ['fetch', 'FogState'],
                  ['set', '@entity.visibleTiles', 0],
                  ['set', '@entity.exploredTiles', 0],
                  ['render-ui', 'main', { type: 'page-header', title: 'Fog of War' }],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'FogState',
                  }],
                ],
              },
              {
                from: 'Hidden',
                to: 'Partial',
                event: 'REVEAL',
                effects: [
                  ['fetch', 'FogState'],
                  ['set', '@entity.visibleTiles', '@payload.tiles'],
                  ['set', '@entity.exploredTiles', '@payload.tiles'],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'FogState',
                  }],
                ],
              },
              {
                from: 'Partial',
                to: 'Partial',
                event: 'REVEAL',
                effects: [
                  ['fetch', 'FogState'],
                  ['set', '@entity.visibleTiles', '@payload.tiles'],
                  ['set', '@entity.exploredTiles', ['+', '@entity.exploredTiles', '@payload.tiles']],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'FogState',
                  }],
                ],
              },
              {
                from: 'Partial',
                to: 'Partial',
                event: 'EXPLORE',
                effects: [
                  ['fetch', 'FogState'],
                  ['set', '@entity.exploredTiles', ['+', '@entity.exploredTiles', '@entity.revealRadius']],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'FogState',
                  }],
                ],
              },
              {
                from: 'Partial',
                to: 'Revealed',
                event: 'REVEAL_ALL',
                effects: [
                  ['fetch', 'FogState'],
                  ['set', '@entity.visibleTiles', '@entity.exploredTiles'],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'FogState',
                  }],
                ],
              },
              {
                from: 'Revealed',
                to: 'Hidden',
                event: 'RESET_FOG',
                effects: [
                  ['fetch', 'FogState'],
                  ['set', '@entity.visibleTiles', 0],
                  ['set', '@entity.exploredTiles', 0],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'FogState',
                  }],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'FogOfWarPage',
          path: '/fog-of-war',
          isInitial: true,
          traits: [{ ref: 'FogOfWar' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-resource - Resource Management
// ============================================================================

/**
 * std-resource - Strategy game resource tracking.
 *
 * States: Stable -> Surplus -> Deficit
 * Tracks gold, wood, stone, food, and capacity.
 */
export const RESOURCE_BEHAVIOR: OrbitalSchema = {
  name: 'std-resource',
  version: '1.0.0',
  description: 'Strategy game resource management',
  orbitals: [
    {
      name: 'ResourceOrbital',
      entity: {
        name: 'ResourceState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'gold', type: 'number', default: 100 },
          { name: 'wood', type: 'number', default: 50 },
          { name: 'stone', type: 'number', default: 30 },
          { name: 'food', type: 'number', default: 80 },
          { name: 'capacity', type: 'number', default: 500 },
        ],
      },
      traits: [
        {
          name: 'ResourceManager',
          linkedEntity: 'ResourceState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Stable', isInitial: true },
              { name: 'Surplus' },
              { name: 'Deficit' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'GATHER', name: 'Gather Resources', payloadSchema: [
                { name: 'amount', type: 'number', required: true },
              ] },
              { key: 'SPEND', name: 'Spend Resources', payloadSchema: [
                { name: 'amount', type: 'number', required: true },
              ] },
              { key: 'CHECK_STATUS', name: 'Check Status' },
              { key: 'STABILIZE', name: 'Stabilize' },
            ],
            transitions: [
              {
                from: 'Stable',
                to: 'Stable',
                event: 'INIT',
                effects: [
                  ['set', '@entity.gold', 100],
                  ['set', '@entity.wood', 50],
                  ['set', '@entity.stone', 30],
                  ['set', '@entity.food', 80],
                  ['render-ui', 'main', { type: 'page-header', title: 'Resources' }],
                  ['render-ui', 'main', { type: 'stats',
                    label: 'Resources', value: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Stable',
                to: 'Stable',
                event: 'GATHER',
                effects: [
                  ['set', '@entity.gold', ['+', '@entity.gold', '@payload.amount']],
                  ['render-ui', 'main', { type: 'stats',
                    label: 'Resources', value: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Stable',
                to: 'Stable',
                event: 'SPEND',
                guard: ['>=', '@entity.gold', '@payload.amount'],
                effects: [
                  ['set', '@entity.gold', ['-', '@entity.gold', '@payload.amount']],
                  ['render-ui', 'main', { type: 'stats',
                    label: 'Resources', value: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Stable',
                to: 'Surplus',
                event: 'CHECK_STATUS',
                guard: ['>', '@entity.gold', '@entity.capacity'],
                effects: [
                  ['render-ui', 'main', { type: 'stats',
                    label: 'Resources', value: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Stable',
                to: 'Deficit',
                event: 'CHECK_STATUS',
                guard: ['<', '@entity.food', 10],
                effects: [
                  ['render-ui', 'main', { type: 'stats',
                    label: 'Resources', value: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Surplus',
                to: 'Stable',
                event: 'STABILIZE',
                effects: [
                  ['render-ui', 'main', { type: 'stats',
                    label: 'Resources', value: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Deficit',
                to: 'Stable',
                event: 'STABILIZE',
                effects: [
                  ['render-ui', 'main', { type: 'stats',
                    label: 'Resources', value: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Surplus',
                to: 'Surplus',
                event: 'GATHER',
                effects: [
                  ['set', '@entity.gold', ['+', '@entity.gold', '@payload.amount']],
                  ['render-ui', 'main', { type: 'stats',
                    label: 'Resources', value: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Deficit',
                to: 'Deficit',
                event: 'GATHER',
                effects: [
                  ['set', '@entity.gold', ['+', '@entity.gold', '@payload.amount']],
                  ['render-ui', 'main', { type: 'stats',
                    label: 'Resources', value: '@entity.id',
                  }],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'ResourcePage',
          path: '/resources',
          isInitial: true,
          traits: [{ ref: 'ResourceManager' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Behaviors
// ============================================================================

export const GAME_2D_STRATEGY_BEHAVIORS: OrbitalSchema[] = [
  TURN_SYSTEM_BEHAVIOR,
  UNIT_COMMAND_BEHAVIOR,
  FOG_OF_WAR_BEHAVIOR,
  RESOURCE_BEHAVIOR,
];
