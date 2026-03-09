/**
 * 2D Strategy Game Behaviors
 *
 * Standard behaviors for 2D strategy games: turn management, unit commands,
 * fog of war, and resource management.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * UI Composition: game-first patterns (isometric-canvas, game-hud)
 * replacing stat-card dashboard layouts with proper game components.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema, Effect } from '../types.js';

// ── Shared Strategy Game Theme ──────────────────────────────────────

const STRATEGY_THEME = {
  name: 'game-strategy-emerald',
  tokens: {
    colors: {
      primary: '#059669',
      'primary-hover': '#047857',
      'primary-foreground': '#ffffff',
      accent: '#34d399',
      'accent-foreground': '#000000',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ── Asset constants ─────────────────────────────────────────────────

const KFLOW_ASSETS = 'https://almadar-kflow-assets.web.app/shared';
const GAME_MANIFEST = {
  terrain: {
    stone: '/terrain/Isometric/stoneSide_N.png',
    dirt: '/terrain/Isometric/dirt_N.png',
    bridge: '/terrain/Isometric/stoneStep_N.png',
    wall: '/terrain/Isometric/stoneWallArchway_N.png',
  },
  units: {
    guardian: '/sprite-sheets/guardian-sprite-sheet-se.png',
    breaker: '/sprite-sheets/breaker-sprite-sheet-se.png',
    archivist: '/sprite-sheets/archivist-sprite-sheet-se.png',
  },
  features: {
    gold_mine: '/world-map/gold_mine.png',
    portal: '/world-map/portal_open.png',
    treasure: '/world-map/treasure_chest_closed.png',
    battle_marker: '/world-map/battle_marker.png',
    power_node: '/world-map/power_node.png',
  },
};

const TILES_8X6: Array<{ x: number; y: number; terrain: string }> = [];
for (let y = 0; y < 6; y++) {
  for (let x = 0; x < 8; x++) {
    TILES_8X6.push({ x, y, terrain: (x + y) % 3 === 0 ? 'stone' : (x + y) % 3 === 1 ? 'dirt' : 'bridge' });
  }
}

// ============================================================================
// std-turn-system - Turn Management
// ============================================================================

const turnCanvasView: Effect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_8X6,
  units: [
    { id: 'player1', x: 1, y: 2, unitType: 'guardian' },
    { id: 'player2', x: 5, y: 3, unitType: 'breaker' },
  ],
  scale: 0.4,
  boardWidth: 8,
  boardHeight: 6,
  enableCamera: true,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
}];

const turnHudOverlay: Effect = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'game-hud', position: 'top', elements: [
      { label: 'Turn', value: '@entity.turnNumber', icon: 'layers' },
      { label: 'Player', value: '@entity.currentPlayer', icon: 'users' },
      { label: 'Phase', value: '@entity.phase', icon: 'flag' },
    ] },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Begin Turn', action: 'BEGIN_TURN', icon: 'sword', variant: 'primary' },
      { type: 'button', label: 'End Actions', action: 'END_ACTIONS', icon: 'shield', variant: 'secondary' },
      { type: 'button', label: 'Next Turn', action: 'NEXT_TURN', icon: 'castle', variant: 'secondary' },
    ] },
  ],
}];

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
  theme: STRATEGY_THEME,
  orbitals: [
    {
      name: 'TurnSystemOrbital',
      entity: {
        name: 'TurnData',
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
          linkedEntity: 'TurnData',
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
                  ['fetch', 'TurnData'],
                  ['set', '@entity.currentPlayer', 1],
                  ['set', '@entity.turnNumber', 1],
                  ['set', '@entity.phase', 'waiting'],
                  turnCanvasView,
                  turnHudOverlay,
                ],
              },
              {
                from: 'Waiting',
                to: 'Acting',
                event: 'BEGIN_TURN',
                effects: [
                  ['fetch', 'TurnData'],
                  ['set', '@entity.phase', 'acting'],
                  turnCanvasView,
                  turnHudOverlay,
                ],
              },
              {
                from: 'Acting',
                to: 'Resolving',
                event: 'END_ACTIONS',
                effects: [
                  ['fetch', 'TurnData'],
                  ['set', '@entity.phase', 'resolving'],
                  turnCanvasView,
                  turnHudOverlay,
                ],
              },
              {
                from: 'Resolving',
                to: 'Waiting',
                event: 'RESOLVE',
                effects: [
                  ['fetch', 'TurnData'],
                  ['set', '@entity.phase', 'waiting'],
                  turnCanvasView,
                  turnHudOverlay,
                ],
              },
              {
                from: 'Resolving',
                to: 'Waiting',
                event: 'NEXT_TURN',
                effects: [
                  ['fetch', 'TurnData'],
                  ['set', '@entity.turnNumber', ['+', '@entity.turnNumber', 1]],
                  ['set', '@entity.currentPlayer', ['if', ['=', '@entity.currentPlayer', 1], 2, 1]],
                  ['set', '@entity.phase', 'waiting'],
                  turnCanvasView,
                  turnHudOverlay,
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

const unitCommandCanvasView: Effect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_8X6,
  units: [
    { id: 'unit1', x: 2, y: 1, unitType: 'guardian' },
    { id: 'unit2', x: 4, y: 3, unitType: 'breaker' },
    { id: 'unit3', x: 6, y: 2, unitType: 'archivist' },
  ],
  scale: 0.4,
  boardWidth: 8,
  boardHeight: 6,
  enableCamera: true,
  unitClickEvent: 'SELECT_UNIT',
  tileClickEvent: 'ISSUE_COMMAND',
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
}];

const unitCommandHudOverlay: Effect = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'game-hud', position: 'top', elements: [
      { label: 'Unit', value: '@entity.unitId', icon: 'users' },
      { label: 'Command', value: '@entity.commandType', icon: 'map' },
      { label: 'Target X', value: '@entity.targetX', icon: 'target' },
      { label: 'Target Y', value: '@entity.targetY', icon: 'target' },
    ] },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Select Unit', action: 'SELECT_UNIT', icon: 'users', variant: 'primary' },
      { type: 'button', label: 'Issue Command', action: 'ISSUE_COMMAND', icon: 'sword', variant: 'primary' },
      { type: 'button', label: 'Execute', action: 'EXECUTE', icon: 'shield', variant: 'secondary' },
      { type: 'button', label: 'Deselect', action: 'DESELECT', icon: 'target', variant: 'secondary' },
    ] },
  ],
}];

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
  theme: STRATEGY_THEME,
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
                  unitCommandCanvasView,
                  unitCommandHudOverlay,
                ],
              },
              {
                from: 'Idle',
                to: 'Selected',
                event: 'SELECT_UNIT',
                effects: [
                  ['fetch', 'UnitCommand'],
                  ['set', '@entity.unitId', '@payload.unitId'],
                  unitCommandCanvasView,
                  unitCommandHudOverlay,
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
                  unitCommandCanvasView,
                  unitCommandHudOverlay,
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
                  unitCommandCanvasView,
                  unitCommandHudOverlay,
                ],
              },
              {
                from: 'Selected',
                to: 'Idle',
                event: 'DESELECT',
                effects: [
                  ['fetch', 'UnitCommand'],
                  ['set', '@entity.unitId', ''],
                  unitCommandCanvasView,
                  unitCommandHudOverlay,
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

const fogCanvasView: Effect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_8X6,
  units: [{ id: 'scout', x: 3, y: 2, unitType: 'guardian' }],
  features: [
    { id: 'mine', x: 1, y: 1, featureType: 'gold_mine' },
    { id: 'node', x: 6, y: 4, featureType: 'power_node' },
  ],
  scale: 0.4,
  boardWidth: 8,
  boardHeight: 6,
  enableCamera: true,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
}];

const fogHudOverlay: Effect = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'game-hud', position: 'top', elements: [
      { label: 'Visible', value: '@entity.visibleTiles', icon: 'target' },
      { label: 'Explored', value: '@entity.exploredTiles', icon: 'map' },
      { label: 'Radius', value: '@entity.revealRadius', icon: 'layers' },
    ] },
    { type: 'progress-bar', value: '@entity.visibleTiles', max: '@entity.exploredTiles', label: 'Visibility Coverage' },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Reveal Area', action: 'REVEAL', icon: 'target', variant: 'primary' },
      { type: 'button', label: 'Explore', action: 'EXPLORE', icon: 'map', variant: 'primary' },
      { type: 'button', label: 'Reveal All', action: 'REVEAL_ALL', icon: 'layers', variant: 'secondary' },
      { type: 'button', label: 'Reset Fog', action: 'RESET_FOG', icon: 'shield', variant: 'secondary' },
    ] },
  ],
}];

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
  theme: STRATEGY_THEME,
  orbitals: [
    {
      name: 'FogOfWarOrbital',
      entity: {
        name: 'FogData',
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
          linkedEntity: 'FogData',
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
                  ['fetch', 'FogData'],
                  ['set', '@entity.visibleTiles', 0],
                  ['set', '@entity.exploredTiles', 0],
                  fogCanvasView,
                  fogHudOverlay,
                ],
              },
              {
                from: 'Hidden',
                to: 'Partial',
                event: 'REVEAL',
                effects: [
                  ['fetch', 'FogData'],
                  ['set', '@entity.visibleTiles', '@payload.tiles'],
                  ['set', '@entity.exploredTiles', '@payload.tiles'],
                  fogCanvasView,
                  fogHudOverlay,
                ],
              },
              {
                from: 'Partial',
                to: 'Partial',
                event: 'REVEAL',
                effects: [
                  ['fetch', 'FogData'],
                  ['set', '@entity.visibleTiles', '@payload.tiles'],
                  ['set', '@entity.exploredTiles', ['+', '@entity.exploredTiles', '@payload.tiles']],
                  fogCanvasView,
                  fogHudOverlay,
                ],
              },
              {
                from: 'Partial',
                to: 'Partial',
                event: 'EXPLORE',
                effects: [
                  ['fetch', 'FogData'],
                  ['set', '@entity.exploredTiles', ['+', '@entity.exploredTiles', '@entity.revealRadius']],
                  fogCanvasView,
                  fogHudOverlay,
                ],
              },
              {
                from: 'Partial',
                to: 'Revealed',
                event: 'REVEAL_ALL',
                effects: [
                  ['fetch', 'FogData'],
                  ['set', '@entity.visibleTiles', '@entity.exploredTiles'],
                  fogCanvasView,
                  fogHudOverlay,
                ],
              },
              {
                from: 'Revealed',
                to: 'Hidden',
                event: 'RESET_FOG',
                effects: [
                  ['fetch', 'FogData'],
                  ['set', '@entity.visibleTiles', 0],
                  ['set', '@entity.exploredTiles', 0],
                  fogCanvasView,
                  fogHudOverlay,
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

const resourceCanvasView: Effect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_8X6,
  units: [{ id: 'gatherer', x: 3, y: 2, unitType: 'guardian' }],
  features: [
    { id: 'mine', x: 1, y: 1, featureType: 'gold_mine' },
    { id: 'node', x: 6, y: 4, featureType: 'power_node' },
    { id: 'chest', x: 4, y: 0, featureType: 'treasure' },
  ],
  scale: 0.4,
  boardWidth: 8,
  boardHeight: 6,
  enableCamera: true,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
}];

const resourceHudOverlay: Effect = ['render-ui', 'overlay', {
  type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'game-hud', position: 'top', elements: [
      { label: 'Gold', value: '@entity.gold', icon: 'coins' },
      { label: 'Wood', value: '@entity.wood', icon: 'layers' },
      { label: 'Stone', value: '@entity.stone', icon: 'castle' },
      { label: 'Food', value: '@entity.food', icon: 'shield' },
    ] },
    { type: 'progress-bar', value: '@entity.gold', max: '@entity.capacity', label: 'Gold Capacity' },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Gather', action: 'GATHER', icon: 'coins', variant: 'primary' },
      { type: 'button', label: 'Spend', action: 'SPEND', icon: 'sword', variant: 'secondary' },
      { type: 'button', label: 'Check Status', action: 'CHECK_STATUS', icon: 'flag', variant: 'secondary' },
    ] },
  ],
}];

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
  theme: STRATEGY_THEME,
  orbitals: [
    {
      name: 'ResourceOrbital',
      entity: {
        name: 'ResourceData',
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
          linkedEntity: 'ResourceData',
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
                  resourceCanvasView,
                  resourceHudOverlay,
                ],
              },
              {
                from: 'Stable',
                to: 'Stable',
                event: 'GATHER',
                effects: [
                  ['set', '@entity.gold', ['+', '@entity.gold', '@payload.amount']],
                  resourceCanvasView,
                  resourceHudOverlay,
                ],
              },
              {
                from: 'Stable',
                to: 'Stable',
                event: 'SPEND',
                guard: ['>=', '@entity.gold', '@payload.amount'],
                effects: [
                  ['set', '@entity.gold', ['-', '@entity.gold', '@payload.amount']],
                  resourceCanvasView,
                  resourceHudOverlay,
                ],
              },
              {
                from: 'Stable',
                to: 'Surplus',
                event: 'CHECK_STATUS',
                guard: ['>', '@entity.gold', '@entity.capacity'],
                effects: [
                  resourceCanvasView,
                  resourceHudOverlay,
                ],
              },
              {
                from: 'Stable',
                to: 'Deficit',
                event: 'CHECK_STATUS',
                guard: ['<', '@entity.food', 10],
                effects: [
                  resourceCanvasView,
                  resourceHudOverlay,
                ],
              },
              {
                from: 'Surplus',
                to: 'Stable',
                event: 'STABILIZE',
                effects: [
                  resourceCanvasView,
                  resourceHudOverlay,
                ],
              },
              {
                from: 'Deficit',
                to: 'Stable',
                event: 'STABILIZE',
                effects: [
                  resourceCanvasView,
                  resourceHudOverlay,
                ],
              },
              {
                from: 'Surplus',
                to: 'Surplus',
                event: 'GATHER',
                effects: [
                  ['set', '@entity.gold', ['+', '@entity.gold', '@payload.amount']],
                  resourceCanvasView,
                  resourceHudOverlay,
                ],
              },
              {
                from: 'Deficit',
                to: 'Deficit',
                event: 'GATHER',
                effects: [
                  ['set', '@entity.gold', ['+', '@entity.gold', '@payload.amount']],
                  resourceCanvasView,
                  resourceHudOverlay,
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
