/**
 * Game Entity Behaviors
 *
 * Entity state behaviors: health, score, movement, combat, inventory.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema, Effect } from './types.js';

// ============================================================================
// Shared theme for all game-entity behaviors
// ============================================================================

const GAME_ENTITY_THEME = {
  name: 'game-entity-rose',
  tokens: {
    colors: {
      primary: '#e11d48',
      'primary-hover': '#be123c',
      'primary-foreground': '#ffffff',
      accent: '#fb7185',
      'accent-foreground': '#000000',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ============================================================================
// Game Asset Constants
// ============================================================================

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
  },
};

const TILES_5X5 = [
  { x: 0, y: 0, terrain: 'stone' }, { x: 1, y: 0, terrain: 'dirt' }, { x: 2, y: 0, terrain: 'stone' }, { x: 3, y: 0, terrain: 'dirt' }, { x: 4, y: 0, terrain: 'stone' },
  { x: 0, y: 1, terrain: 'dirt' }, { x: 1, y: 1, terrain: 'stone' }, { x: 2, y: 1, terrain: 'dirt' }, { x: 3, y: 1, terrain: 'stone' }, { x: 4, y: 1, terrain: 'dirt' },
  { x: 0, y: 2, terrain: 'stone' }, { x: 1, y: 2, terrain: 'dirt' }, { x: 2, y: 2, terrain: 'bridge' }, { x: 3, y: 2, terrain: 'dirt' }, { x: 4, y: 2, terrain: 'stone' },
  { x: 0, y: 3, terrain: 'dirt' }, { x: 1, y: 3, terrain: 'stone' }, { x: 2, y: 3, terrain: 'dirt' }, { x: 3, y: 3, terrain: 'stone' }, { x: 4, y: 3, terrain: 'dirt' },
  { x: 0, y: 4, terrain: 'stone' }, { x: 1, y: 4, terrain: 'dirt' }, { x: 2, y: 4, terrain: 'stone' }, { x: 3, y: 4, terrain: 'wall' }, { x: 4, y: 4, terrain: 'stone' },
];

// ============================================================================
// Shared render-ui compositions
// ============================================================================

const healthCanvasView: Effect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_5X5,
  units: [{ id: 'guardian-1', unitType: 'guardian', x: 2, y: 2 }],
  scale: 1,
  boardWidth: 5,
  boardHeight: 5,
  enableCamera: true,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
  tileClickEvent: 'TILE_CLICK',
  unitClickEvent: 'UNIT_CLICK',
}];

const healthOverlayView: Effect = ['render-ui', 'overlay', {
  type: 'game-hud',
  elements: [
    { type: 'stat', label: 'HP', value: '@entity.currentHealth', icon: 'heart' },
    { type: 'stat', label: 'Max HP', value: '@entity.maxHealth', icon: 'heart' },
    { type: 'stat', label: 'Invulnerable', value: '@entity.isInvulnerable', icon: 'shield' },
    { type: 'button', label: 'Damage', action: 'DAMAGE', icon: 'sword', variant: 'secondary' },
    { type: 'button', label: 'Heal', action: 'HEAL', icon: 'heart', variant: 'primary' },
    { type: 'button', label: 'Respawn', action: 'RESPAWN', icon: 'refresh-cw', variant: 'secondary' },
  ],
}];

const healthDamageEffectOverlay: Effect = ['render-ui', 'overlay', {
  type: 'canvas-effect',
  actionType: 'hit',
  x: 200,
  y: 200,
  duration: 600,
}];

const scoreCanvasView: Effect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_5X5,
  units: [{ id: 'scorer-1', unitType: 'guardian', x: 2, y: 2 }],
  scale: 1,
  boardWidth: 5,
  boardHeight: 5,
  enableCamera: true,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
  tileClickEvent: 'TILE_CLICK',
  unitClickEvent: 'UNIT_CLICK',
}];

const scoreOverlayView: Effect = ['render-ui', 'overlay', {
  type: 'game-hud',
  elements: [
    { type: 'stat', label: 'Score', value: '@entity.currentScore', icon: 'star' },
    { type: 'stat', label: 'High Score', value: '@entity.highScore', icon: 'award' },
    { type: 'stat', label: 'Combo', value: '@entity.comboCount', icon: 'zap' },
    { type: 'stat', label: 'Multiplier', value: '@entity.multiplier', icon: 'trending-up' },
    { type: 'button', label: 'Add Points', action: 'ADD_POINTS', icon: 'plus', variant: 'primary' },
    { type: 'button', label: 'Reset', action: 'RESET', icon: 'refresh-cw', variant: 'secondary' },
  ],
}];

const movementCanvasView: Effect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_5X5,
  units: [{ id: 'mover-1', unitType: 'guardian', x: 2, y: 2 }],
  scale: 1,
  boardWidth: 5,
  boardHeight: 5,
  enableCamera: true,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
  tileClickEvent: 'TILE_CLICK',
  unitClickEvent: 'UNIT_CLICK',
}];

const movementOverlayView: Effect = ['render-ui', 'overlay', {
  type: 'game-hud',
  elements: [
    { type: 'stat', label: 'X', value: '@entity.x', icon: 'arrow-right' },
    { type: 'stat', label: 'Y', value: '@entity.y', icon: 'arrow-up' },
    { type: 'stat', label: 'Speed', value: '@entity.moveSpeed', icon: 'gauge' },
    { type: 'stat', label: 'Direction', value: '@entity.direction', icon: 'compass' },
    { type: 'button', label: 'Move Left', action: 'MOVE_LEFT', icon: 'arrow-left', variant: 'secondary' },
    { type: 'button', label: 'Move Right', action: 'MOVE_RIGHT', icon: 'arrow-right', variant: 'secondary' },
    { type: 'button', label: 'Jump', action: 'JUMP', icon: 'arrow-big-up', variant: 'primary' },
    { type: 'button', label: 'Stop', action: 'STOP', icon: 'square', variant: 'secondary' },
  ],
}];

const combatCanvasView: Effect = ['render-ui', 'main', {
  type: 'isometric-canvas',
  tiles: TILES_5X5,
  units: [
    { id: 'attacker-1', unitType: 'guardian', x: 1, y: 2 },
    { id: 'target-1', unitType: 'breaker', x: 3, y: 2 },
  ],
  scale: 1,
  boardWidth: 5,
  boardHeight: 5,
  enableCamera: true,
  assetBaseUrl: KFLOW_ASSETS,
  assetManifest: GAME_MANIFEST,
  tileClickEvent: 'TILE_CLICK',
  unitClickEvent: 'UNIT_CLICK',
}];

const combatLogOverlay: Effect = ['render-ui', 'overlay', {
  type: 'combat-log',
  events: [],
  maxVisible: 10,
  title: 'Battle Log',
}];

const combatHudOverlay: Effect = ['render-ui', 'overlay', {
  type: 'game-hud',
  elements: [
    { type: 'stat', label: 'Damage', value: '@entity.attackDamage', icon: 'sword' },
    { type: 'stat', label: 'Duration', value: '@entity.attackDuration', icon: 'timer' },
    { type: 'stat', label: 'Cooldown', value: '@entity.cooldownDuration', icon: 'clock' },
    { type: 'stat', label: 'Hit Count', value: '@entity.hitCount', icon: 'target' },
    { type: 'button', label: 'Attack', action: 'ATTACK', icon: 'sword', variant: 'primary' },
    { type: 'button', label: 'Defend', action: 'DEFEND', icon: 'shield', variant: 'secondary' },
  ],
}];

const combatAttackEffect: Effect = ['render-ui', 'overlay', {
  type: 'canvas-effect',
  actionType: 'melee',
  x: 200,
  y: 200,
  duration: 600,
}];

const inventoryBrowseView: Effect = ['render-ui', 'main', {
  type: 'inventory-panel',
  items: '@entity',
  slots: 12,
  columns: 4,
  selectSlotEvent: 'SELECT',
  showTooltips: true,
}];

const inventoryDetailView: Effect = ['render-ui', 'main', {
  type: 'stack', direction: 'vertical', children: [
    { type: 'stack', direction: 'horizontal', children: [
      { type: 'icon', name: 'package' },
      { type: 'typography', content: 'Item Detail', variant: 'h2' },
    ] },
    { type: 'divider' },
    { type: 'stack', direction: 'vertical', gap: 'md', children: [
      { type: 'typography', content: '@entity.name', variant: 'h2' },
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'typography', content: 'Quantity:', variant: 'body' },
        { type: 'typography', content: '@entity.quantity', variant: 'body' },
      ] },
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'typography', content: 'Slot:', variant: 'body' },
        { type: 'typography', content: '@entity.slot', variant: 'body' },
      ] },
      { type: 'badge', label: '@entity.isEquipped', variant: 'outline' },
    ] },
  ],
}];

// ============================================================================
// std-health - Entity Health System
// ============================================================================

/**
 * std-health - Manages entity health with damage, healing, and death.
 *
 * States: Alive -> Damaged -> Dead
 */
export const HEALTH_BEHAVIOR: OrbitalSchema = {
  name: 'std-health',
  version: '1.0.0',
  description: 'Entity health with damage, healing, invulnerability, and death',
  orbitals: [
    {
      name: 'HealthOrbital',
      theme: GAME_ENTITY_THEME,
      entity: {
        name: 'HealthData',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'currentHealth', type: 'number', default: 100 },
          { name: 'maxHealth', type: 'number', default: 100 },
          { name: 'isInvulnerable', type: 'boolean', default: false },
          { name: 'lastDamageTime', type: 'number', default: 0 },
          { name: 'invulnerabilityTime', type: 'number', default: 1000 },
        ],
      },
      traits: [
        {
          name: 'Health',
          linkedEntity: 'HealthData',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Alive', isInitial: true },
              { name: 'Damaged' },
              { name: 'Dead' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              {
                key: 'DAMAGE',
                name: 'Damage',
                payloadSchema: [{ name: 'amount', type: 'number', required: true }],
              },
              {
                key: 'HEAL',
                name: 'Heal',
                payloadSchema: [{ name: 'amount', type: 'number', required: true }],
              },
              { key: 'DIE', name: 'Die' },
              { key: 'RESPAWN', name: 'Respawn' },
              { key: 'INVULNERABILITY_END', name: 'Invulnerability End' },
            ],
            transitions: [
              {
                from: 'Alive',
                to: 'Alive',
                event: 'INIT',
                effects: [
                  ['fetch', 'HealthData'],
                  ['set', '@entity.currentHealth', '@entity.maxHealth'],
                  ['set', '@entity.isInvulnerable', false],
                  healthCanvasView,
                  healthOverlayView,
                ],
              },
              {
                from: 'Alive',
                to: 'Damaged',
                event: 'DAMAGE',
                guard: ['not', '@entity.isInvulnerable'],
                effects: [
                  ['fetch', 'HealthData'],
                  ['set', '@entity.currentHealth', ['math/max', 0, ['-', '@entity.currentHealth', '@payload.amount']]],
                  ['set', '@entity.lastDamageTime', '@now'],
                  ['set', '@entity.isInvulnerable', true],
                  healthCanvasView,
                  healthOverlayView,
                  healthDamageEffectOverlay,
                ],
              },
              {
                from: 'Damaged',
                to: 'Dead',
                event: 'DAMAGE',
                guard: ['<=', '@entity.currentHealth', 0],
                effects: [
                  ['fetch', 'HealthData'],
                  ['set', '@entity.currentHealth', 0],
                  healthCanvasView,
                  healthOverlayView,
                ],
              },
              {
                from: 'Damaged',
                to: 'Damaged',
                event: 'DAMAGE',
                guard: ['and', ['not', '@entity.isInvulnerable'], ['>', '@entity.currentHealth', 0]],
                effects: [
                  ['fetch', 'HealthData'],
                  ['set', '@entity.currentHealth', ['math/max', 0, ['-', '@entity.currentHealth', '@payload.amount']]],
                  ['set', '@entity.lastDamageTime', '@now'],
                  ['set', '@entity.isInvulnerable', true],
                  healthCanvasView,
                  healthOverlayView,
                  healthDamageEffectOverlay,
                ],
              },
              {
                from: 'Damaged',
                to: 'Alive',
                event: 'INVULNERABILITY_END',
                effects: [
                  ['fetch', 'HealthData'],
                  ['set', '@entity.isInvulnerable', false],
                  healthCanvasView,
                  healthOverlayView,
                ],
              },
              {
                from: 'Alive',
                to: 'Alive',
                event: 'HEAL',
                effects: [
                  ['fetch', 'HealthData'],
                  ['set', '@entity.currentHealth', ['math/min', '@entity.maxHealth', ['+', '@entity.currentHealth', '@payload.amount']]],
                  healthCanvasView,
                  healthOverlayView,
                ],
              },
              {
                from: 'Damaged',
                to: 'Damaged',
                event: 'HEAL',
                effects: [
                  ['fetch', 'HealthData'],
                  ['set', '@entity.currentHealth', ['math/min', '@entity.maxHealth', ['+', '@entity.currentHealth', '@payload.amount']]],
                  healthCanvasView,
                  healthOverlayView,
                ],
              },
              {
                from: 'Alive',
                to: 'Dead',
                event: 'DIE',
                effects: [
                  ['fetch', 'HealthData'],
                  ['set', '@entity.currentHealth', 0],
                  healthCanvasView,
                  healthOverlayView,
                ],
              },
              {
                from: 'Damaged',
                to: 'Dead',
                event: 'DIE',
                effects: [
                  ['fetch', 'HealthData'],
                  ['set', '@entity.currentHealth', 0],
                  healthCanvasView,
                  healthOverlayView,
                ],
              },
              {
                from: 'Dead',
                to: 'Alive',
                event: 'RESPAWN',
                effects: [
                  ['fetch', 'HealthData'],
                  ['set', '@entity.currentHealth', '@entity.maxHealth'],
                  ['set', '@entity.isInvulnerable', false],
                  healthCanvasView,
                  healthOverlayView,
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'InvulnerabilityTimer',
              interval: 'frame',
              guard: ['and', '@entity.isInvulnerable', ['>', ['-', '@now', '@entity.lastDamageTime'], '@entity.invulnerabilityTime']],
              effects: [
                ['set', '@entity.isInvulnerable', false],
              ],
            },
          ],
        },
      ],
      pages: [
        {
          name: 'HealthPage',
          path: '/health',
          isInitial: true,
          traits: [{ ref: 'Health' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-score - Points and Combo System
// ============================================================================

/**
 * std-score - Manages score with points, combos, and multipliers.
 */
export const SCORE_BEHAVIOR: OrbitalSchema = {
  name: 'std-score',
  version: '1.0.0',
  description: 'Score tracking with points, combos, and multipliers',
  orbitals: [
    {
      name: 'ScoreOrbital',
      theme: GAME_ENTITY_THEME,
      entity: {
        name: 'ScoreData',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'currentScore', type: 'number', default: 0 },
          { name: 'highScore', type: 'number', default: 0 },
          { name: 'comboCount', type: 'number', default: 0 },
          { name: 'multiplier', type: 'number', default: 1 },
          { name: 'lastScoreTime', type: 'number', default: 0 },
          { name: 'maxMultiplier', type: 'number', default: 5 },
          { name: 'comboTimeWindow', type: 'number', default: 2000 },
        ],
      },
      traits: [
        {
          name: 'Score',
          linkedEntity: 'ScoreData',
          category: 'interaction',
          stateMachine: {
            states: [{ name: 'Active', isInitial: true }],
            events: [
              { key: 'INIT', name: 'Initialize' },
              {
                key: 'ADD_POINTS',
                name: 'Add Points',
                payloadSchema: [{ name: 'points', type: 'number', required: true }],
              },
              { key: 'COMBO_HIT', name: 'Combo Hit' },
              { key: 'COMBO_BREAK', name: 'Combo Break' },
              { key: 'RESET', name: 'Reset' },
            ],
            transitions: [
              {
                from: 'Active',
                to: 'Active',
                event: 'INIT',
                effects: [
                  ['fetch', 'ScoreData'],
                  ['set', '@entity.currentScore', 0],
                  ['set', '@entity.comboCount', 0],
                  ['set', '@entity.multiplier', 1],
                  scoreCanvasView,
                  scoreOverlayView,
                ],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'ADD_POINTS',
                effects: [
                  ['fetch', 'ScoreData'],
                  ['set', '@entity.currentScore', ['+', '@entity.currentScore', ['*', '@payload.points', '@entity.multiplier']]],
                  ['set', '@entity.lastScoreTime', '@now'],
                  scoreCanvasView,
                  scoreOverlayView,
                ],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'COMBO_HIT',
                effects: [
                  ['fetch', 'ScoreData'],
                  ['set', '@entity.comboCount', ['+', '@entity.comboCount', 1]],
                  ['set', '@entity.multiplier', ['math/min', '@entity.maxMultiplier', ['+', 1, ['/', '@entity.comboCount', 5]]]],
                  ['set', '@entity.lastScoreTime', '@now'],
                  scoreCanvasView,
                  scoreOverlayView,
                ],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'COMBO_BREAK',
                effects: [
                  ['fetch', 'ScoreData'],
                  ['set', '@entity.comboCount', 0],
                  ['set', '@entity.multiplier', 1],
                  scoreCanvasView,
                  scoreOverlayView,
                ],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'RESET',
                guard: ['>', '@entity.currentScore', '@entity.highScore'],
                effects: [
                  ['fetch', 'ScoreData'],
                  ['set', '@entity.highScore', '@entity.currentScore'],
                  ['set', '@entity.currentScore', 0],
                  ['set', '@entity.comboCount', 0],
                  ['set', '@entity.multiplier', 1],
                  scoreCanvasView,
                  scoreOverlayView,
                ],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'RESET',
                guard: ['<=', '@entity.currentScore', '@entity.highScore'],
                effects: [
                  ['fetch', 'ScoreData'],
                  ['set', '@entity.currentScore', 0],
                  ['set', '@entity.comboCount', 0],
                  ['set', '@entity.multiplier', 1],
                  scoreCanvasView,
                  scoreOverlayView,
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'ComboTimeout',
              interval: 'frame',
              guard: ['and', ['>', '@entity.comboCount', 0], ['>', ['-', '@now', '@entity.lastScoreTime'], '@entity.comboTimeWindow']],
              effects: [
                ['set', '@entity.comboCount', 0],
                ['set', '@entity.multiplier', 1],
              ],
            },
          ],
        },
      ],
      pages: [
        {
          name: 'ScorePage',
          path: '/score',
          isInitial: true,
          traits: [{ ref: 'Score' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-movement - Entity Position and Velocity
// ============================================================================

/**
 * std-movement - Basic movement for any entity.
 *
 * Handles position updates based on input direction.
 * States: Idle -> Moving -> Jumping -> Falling
 */
export const MOVEMENT_BEHAVIOR: OrbitalSchema = {
  name: 'std-movement',
  version: '1.0.0',
  description: 'Entity movement with speed and direction',
  orbitals: [
    {
      name: 'MovementOrbital',
      theme: GAME_ENTITY_THEME,
      entity: {
        name: 'MovementData',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'x', type: 'number', default: 0 },
          { name: 'y', type: 'number', default: 0 },
          { name: 'direction', type: 'number', default: 0 },
          { name: 'facingRight', type: 'boolean', default: true },
          { name: 'canJump', type: 'boolean', default: true },
          { name: 'moveSpeed', type: 'number', default: 5 },
          { name: 'jumpForce', type: 'number', default: 15 },
        ],
      },
      traits: [
        {
          name: 'Movement',
          linkedEntity: 'MovementData',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Idle', isInitial: true },
              { name: 'Moving' },
              { name: 'Jumping' },
              { name: 'Falling' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              {
                key: 'MOVE_RIGHT',
                name: 'Move Right',
              },
              {
                key: 'MOVE_LEFT',
                name: 'Move Left',
              },
              { key: 'STOP', name: 'Stop' },
              { key: 'JUMP', name: 'Jump' },
              { key: 'LAND', name: 'Land' },
              { key: 'FALL', name: 'Fall' },
            ],
            transitions: [
              {
                from: 'Idle',
                to: 'Idle',
                event: 'INIT',
                effects: [
                  ['fetch', 'MovementData'],
                  ['set', '@entity.x', 0],
                  ['set', '@entity.y', 0],
                  ['set', '@entity.direction', 0],
                  ['set', '@entity.facingRight', true],
                  ['set', '@entity.canJump', true],
                  movementCanvasView,
                  movementOverlayView,
                ],
              },
              {
                from: 'Idle',
                to: 'Moving',
                event: 'MOVE_RIGHT',
                effects: [
                  ['fetch', 'MovementData'],
                  ['set', '@entity.direction', 1],
                  ['set', '@entity.facingRight', true],
                  movementCanvasView,
                  movementOverlayView,
                ],
              },
              {
                from: 'Idle',
                to: 'Moving',
                event: 'MOVE_LEFT',
                effects: [
                  ['fetch', 'MovementData'],
                  ['set', '@entity.direction', -1],
                  ['set', '@entity.facingRight', false],
                  movementCanvasView,
                  movementOverlayView,
                ],
              },
              {
                from: 'Moving',
                to: 'Moving',
                event: 'MOVE_RIGHT',
                effects: [
                  ['set', '@entity.direction', 1],
                  ['set', '@entity.facingRight', true],
                ],
              },
              {
                from: 'Moving',
                to: 'Moving',
                event: 'MOVE_LEFT',
                effects: [
                  ['set', '@entity.direction', -1],
                  ['set', '@entity.facingRight', false],
                ],
              },
              {
                from: 'Moving',
                to: 'Idle',
                event: 'STOP',
                effects: [
                  ['fetch', 'MovementData'],
                  ['set', '@entity.direction', 0],
                  movementCanvasView,
                  movementOverlayView,
                ],
              },
              {
                from: 'Idle',
                to: 'Jumping',
                event: 'JUMP',
                guard: '@entity.canJump',
                effects: [
                  ['fetch', 'MovementData'],
                  ['set', '@entity.canJump', false],
                  ['set', '@entity.y', ['-', '@entity.y', '@entity.jumpForce']],
                  movementCanvasView,
                  movementOverlayView,
                ],
              },
              {
                from: 'Moving',
                to: 'Jumping',
                event: 'JUMP',
                guard: '@entity.canJump',
                effects: [
                  ['set', '@entity.canJump', false],
                  ['set', '@entity.y', ['-', '@entity.y', '@entity.jumpForce']],
                ],
              },
              {
                from: 'Jumping',
                to: 'Falling',
                event: 'FALL',
                effects: [],
              },
              {
                from: 'Jumping',
                to: 'Idle',
                event: 'LAND',
                effects: [
                  ['fetch', 'MovementData'],
                  ['set', '@entity.canJump', true],
                  ['set', '@entity.direction', 0],
                  movementCanvasView,
                  movementOverlayView,
                ],
              },
              {
                from: 'Falling',
                to: 'Idle',
                event: 'LAND',
                effects: [
                  ['fetch', 'MovementData'],
                  ['set', '@entity.canJump', true],
                  ['set', '@entity.direction', 0],
                  movementCanvasView,
                  movementOverlayView,
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'ApplyMovement',
              interval: 'frame',
              guard: ['!=', '@entity.direction', 0],
              effects: [
                ['set', '@entity.x', ['+', '@entity.x', ['*', '@entity.direction', '@entity.moveSpeed']]],
              ],
            },
          ],
        },
      ],
      pages: [
        {
          name: 'MovementPage',
          path: '/movement',
          isInitial: true,
          traits: [{ ref: 'Movement' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-combat - Attack and Damage System
// ============================================================================

/**
 * std-combat - Handles attacks, cooldowns, and hit detection.
 *
 * States: Ready -> Attacking -> Cooldown
 */
export const COMBAT_BEHAVIOR: OrbitalSchema = {
  name: 'std-combat',
  version: '1.0.0',
  description: 'Combat system with attacks, cooldowns, and hitboxes',
  orbitals: [
    {
      name: 'CombatOrbital',
      theme: GAME_ENTITY_THEME,
      entity: {
        name: 'CombatData',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'isAttacking', type: 'boolean', default: false },
          { name: 'attackStartTime', type: 'number', default: 0 },
          { name: 'attackDamage', type: 'number', default: 10 },
          { name: 'attackDuration', type: 'number', default: 300 },
          { name: 'cooldownDuration', type: 'number', default: 500 },
          { name: 'hitCount', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'Combat',
          linkedEntity: 'CombatData',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Ready', isInitial: true },
              { name: 'Attacking' },
              { name: 'Cooldown' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'ATTACK', name: 'Attack' },
              { key: 'ATTACK_END', name: 'Attack End' },
              { key: 'COOLDOWN_END', name: 'Cooldown End' },
            ],
            transitions: [
              {
                from: 'Ready',
                to: 'Ready',
                event: 'INIT',
                effects: [
                  ['fetch', 'CombatData'],
                  ['set', '@entity.isAttacking', false],
                  ['set', '@entity.hitCount', 0],
                  ['set', '@entity.attackStartTime', 0],
                  combatCanvasView,
                  combatLogOverlay,
                  combatHudOverlay,
                ],
              },
              {
                from: 'Ready',
                to: 'Attacking',
                event: 'ATTACK',
                effects: [
                  ['fetch', 'CombatData'],
                  ['set', '@entity.isAttacking', true],
                  ['set', '@entity.attackStartTime', '@now'],
                  combatCanvasView,
                  combatLogOverlay,
                  combatHudOverlay,
                  combatAttackEffect,
                ],
              },
              {
                from: 'Attacking',
                to: 'Cooldown',
                event: 'ATTACK_END',
                effects: [
                  ['fetch', 'CombatData'],
                  ['set', '@entity.isAttacking', false],
                  ['set', '@entity.hitCount', ['+', '@entity.hitCount', 1]],
                  combatCanvasView,
                  combatLogOverlay,
                  combatHudOverlay,
                ],
              },
              {
                from: 'Cooldown',
                to: 'Ready',
                event: 'COOLDOWN_END',
                effects: [
                  ['fetch', 'CombatData'],
                  combatCanvasView,
                  combatLogOverlay,
                  combatHudOverlay,
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'AttackDuration',
              interval: 'frame',
              guard: ['and', '@entity.isAttacking', ['>', ['-', '@now', '@entity.attackStartTime'], '@entity.attackDuration']],
              effects: [
                ['set', '@entity.isAttacking', false],
              ],
            },
          ],
        },
      ],
      pages: [
        {
          name: 'CombatPage',
          path: '/combat',
          isInitial: true,
          traits: [{ ref: 'Combat' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-inventory - Item Collection and Management
// ============================================================================

/**
 * std-inventory - Manages collected items and equipment.
 *
 * States: browsing -> viewing
 */
export const INVENTORY_BEHAVIOR: OrbitalSchema = {
  name: 'std-inventory',
  version: '1.0.0',
  description: 'Item collection, storage, and usage',
  orbitals: [
    {
      name: 'InventoryOrbital',
      theme: GAME_ENTITY_THEME,
      entity: {
        name: 'InventoryItem',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'quantity', type: 'number', default: 1 },
          { name: 'slot', type: 'number', default: 0 },
          { name: 'isEquipped', type: 'boolean', default: false },
        ],
      },
      traits: [
        {
          name: 'InventoryManagement',
          linkedEntity: 'InventoryItem',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'viewing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              {
                key: 'SELECT',
                name: 'Select Item',
                payloadSchema: [{ name: 'itemId', type: 'string', required: true }],
              },
              { key: 'BACK', name: 'Back to List' },
              { key: 'EQUIP', name: 'Equip Item' },
              { key: 'UNEQUIP', name: 'Unequip Item' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'InventoryItem'],
                  inventoryBrowseView,
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'SELECT',
                effects: [
                  ['fetch', 'InventoryItem'],
                  inventoryDetailView,
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'BACK',
                effects: [
                  ['fetch', 'InventoryItem'],
                  inventoryBrowseView,
                ],
              },
              {
                from: 'viewing',
                to: 'viewing',
                event: 'EQUIP',
                effects: [
                  ['fetch', 'InventoryItem'],
                  ['set', '@entity.isEquipped', true],
                  inventoryDetailView,
                ],
              },
              {
                from: 'viewing',
                to: 'viewing',
                event: 'UNEQUIP',
                effects: [
                  ['fetch', 'InventoryItem'],
                  ['set', '@entity.isEquipped', false],
                  inventoryDetailView,
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'InventoryPage',
          path: '/inventory',
          isInitial: true,
          traits: [{ ref: 'InventoryManagement' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Behaviors
// ============================================================================

export const GAME_ENTITY_BEHAVIORS: OrbitalSchema[] = [
  HEALTH_BEHAVIOR,
  SCORE_BEHAVIOR,
  MOVEMENT_BEHAVIOR,
  COMBAT_BEHAVIOR,
  INVENTORY_BEHAVIOR,
];
