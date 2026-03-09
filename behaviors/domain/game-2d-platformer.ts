/**
 * 2D Platformer Game Behaviors
 *
 * Standard behaviors for 2D platformer games: character state, tile maps,
 * power-ups, and enemy AI.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * UI Composition: molecule-first (atoms + molecules only, no organisms).
 * Each behavior has unique, domain-appropriate layouts composed with
 * VStack/HStack/Box wrappers around atoms and molecules.
 *
 * @packageDocumentation
 */

import type { BehaviorSchema, BehaviorEffect } from '../types.js';

// ── Shared Platformer Theme ────────────────────────────────────────

const PLATFORMER_THEME = {
  name: 'game-platformer-red',
  tokens: {
    colors: {
      primary: '#dc2626',
      'primary-hover': '#b91c1c',
      'primary-foreground': '#ffffff',
      accent: '#f87171',
      'accent-foreground': '#000000',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ============================================================================
// std-platformer - Platform Game Character State
// ============================================================================

// ── Level layout (static platforms) ──────────────────────────────────

const LEVEL_PLATFORMS = [
  // Ground
  { x: 0, y: 368, width: 800, height: 32, type: 'ground' },
  // Floating platforms
  { x: 150, y: 288, width: 120, height: 16, type: 'platform' },
  { x: 350, y: 240, width: 100, height: 16, type: 'platform' },
  { x: 520, y: 300, width: 80, height: 16, type: 'platform' },
  { x: 680, y: 200, width: 100, height: 16, type: 'platform' },
  // Hazard
  { x: 300, y: 352, width: 60, height: 16, type: 'hazard' },
  // Goal
  { x: 720, y: 184, width: 32, height: 16, type: 'goal' },
];

// ── Reusable render-ui effects ──────────────────────────────────────

const platformerPlayingEffects: BehaviorEffect[] = [
  ['render-ui', 'main', {
    type: 'platformer-canvas',
    entity: 'PlatformerData',
    platforms: LEVEL_PLATFORMS,
    worldWidth: 800,
    worldHeight: 400,
    canvasWidth: 800,
    canvasHeight: 400,
    followCamera: false,
    leftEvent: 'MOVE_LEFT',
    rightEvent: 'MOVE_RIGHT',
    jumpEvent: 'JUMP',
    stopEvent: 'STOP_MOVE',
  }],
  ['render-ui', 'overlay', { type: 'stack', direction: 'vertical', gap: 'sm', children: [
    { type: 'game-hud', position: 'top', elements: [
      { icon: 'heart', label: 'Lives', value: '@entity.lives' },
      { icon: 'map-pin', label: 'X', value: '@entity.x' },
      { icon: 'arrow-down', label: 'Y', value: '@entity.y' },
      { icon: 'zap', label: 'VY', value: '@entity.vy' },
    ]},
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'd-pad', size: 'md', directionEvent: 'MOVE' },
      { type: 'action-buttons', layout: 'diamond', size: 'md', buttons: [
        { id: 'jump', label: 'Jump', icon: 'arrow-up' },
      ], actionEvent: 'JUMP' },
    ]},
  ]}],
];

const platformerDeadEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center', children: [
      { type: 'icon', name: 'skull', size: 'lg' },
      { type: 'typography', variant: 'h1', content: 'Game Over' },
    ]},
    { type: 'divider' },
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Lives Left', icon: 'heart', entity: 'PlatformerData' },
    ]},
    { type: 'divider' },
    { type: 'button', label: 'Respawn', icon: 'rotate-ccw', variant: 'primary', action: 'RESPAWN' },
  ]}],
];

/**
 * std-platformer - 2D platformer with physics tick loop.
 *
 * States: Playing, Dead
 * PhysicsTick: gravity (vy += 0.5), velocity (x += vx, y += vy) every frame.
 * GroundClampTick: clamp to ground (y >= 350 -> y = 350, vy = 0, grounded = true).
 * Keyboard: arrow keys / WASD for movement, space for jump.
 */
export const PLATFORMER_BEHAVIOR: BehaviorSchema = {
  name: 'std-platformer',
  version: '2.0.0',
  description: '2D platformer with physics, gravity, and keyboard controls',
  theme: PLATFORMER_THEME,
  orbitals: [
    {
      name: 'PlatformerOrbital',
      entity: {
        name: 'PlatformerData',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'x', type: 'number', default: 50 },
          { name: 'y', type: 'number', default: 336 },
          { name: 'vx', type: 'number', default: 0 },
          { name: 'vy', type: 'number', default: 0 },
          { name: 'grounded', type: 'boolean', default: true },
          { name: 'facingRight', type: 'boolean', default: true },
          { name: 'lives', type: 'number', default: 3 },
          { name: 'score', type: 'number', default: 0 },
          { name: 'groundLevel', type: 'number', default: 336 },
        ],
      },
      traits: [
        {
          name: 'Platformer',
          linkedEntity: 'PlatformerData',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Playing', isInitial: true },
              { name: 'Dead' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'MOVE_LEFT', name: 'Move Left' },
              { key: 'MOVE_RIGHT', name: 'Move Right' },
              { key: 'STOP_MOVE', name: 'Stop Moving' },
              { key: 'JUMP', name: 'Jump' },
              { key: 'DIE', name: 'Die' },
              { key: 'RESPAWN', name: 'Respawn' },
            ],
            transitions: [
              {
                from: 'Playing',
                to: 'Playing',
                event: 'INIT',
                effects: [
                  ['fetch', 'PlatformerData'],
                  ['set', '@entity.x', 50],
                  ['set', '@entity.y', 336],
                  ['set', '@entity.vx', 0],
                  ['set', '@entity.vy', 0],
                  ['set', '@entity.grounded', true],
                  ...platformerPlayingEffects,
                ],
              },
              {
                from: 'Playing',
                to: 'Playing',
                event: 'MOVE_LEFT',
                effects: [
                  ['fetch', 'PlatformerData'],
                  ['set', '@entity.vx', -3],
                  ['set', '@entity.facingRight', false],
                  ...platformerPlayingEffects,
                ],
              },
              {
                from: 'Playing',
                to: 'Playing',
                event: 'MOVE_RIGHT',
                effects: [
                  ['fetch', 'PlatformerData'],
                  ['set', '@entity.vx', 3],
                  ['set', '@entity.facingRight', true],
                  ...platformerPlayingEffects,
                ],
              },
              {
                from: 'Playing',
                to: 'Playing',
                event: 'STOP_MOVE',
                effects: [
                  ['fetch', 'PlatformerData'],
                  ['set', '@entity.vx', 0],
                  ...platformerPlayingEffects,
                ],
              },
              {
                from: 'Playing',
                to: 'Playing',
                event: 'JUMP',
                guard: ['=', '@entity.grounded', true],
                effects: [
                  ['fetch', 'PlatformerData'],
                  ['set', '@entity.vy', -8],
                  ['set', '@entity.grounded', false],
                  ...platformerPlayingEffects,
                ],
              },
              {
                from: 'Playing',
                to: 'Dead',
                event: 'DIE',
                effects: [
                  ['fetch', 'PlatformerData'],
                  ['set', '@entity.lives', ['-', '@entity.lives', 1]],
                  ['set', '@entity.vx', 0],
                  ['set', '@entity.vy', 0],
                  ...platformerDeadEffects,
                ],
              },
              {
                from: 'Dead',
                to: 'Playing',
                event: 'RESPAWN',
                guard: ['>', '@entity.lives', 0],
                effects: [
                  ['fetch', 'PlatformerData'],
                  ['set', '@entity.x', 50],
                  ['set', '@entity.y', 336],
                  ['set', '@entity.vx', 0],
                  ['set', '@entity.vy', 0],
                  ['set', '@entity.grounded', true],
                  ...platformerPlayingEffects,
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'PhysicsTick',
              interval: 'frame',
              guard: ['=', '@state', 'Playing'],
              effects: [
                // Gravity: vy += 0.5 each frame
                ['set', '@entity.vy', ['+', '@entity.vy', 0.5]],
                // Apply velocity to position
                ['set', '@entity.x', ['+', '@entity.x', '@entity.vx']],
                ['set', '@entity.y', ['+', '@entity.y', '@entity.vy']],
              ],
            },
            {
              name: 'GroundClampTick',
              interval: 'frame',
              guard: ['>', '@entity.y', '@entity.groundLevel'],
              effects: [
                // Snap to ground and stop vertical movement
                ['set', '@entity.y', '@entity.groundLevel'],
                ['set', '@entity.vy', 0],
                ['set', '@entity.grounded', true],
              ],
            },
          ],
        },
      ],
      pages: [
        {
          name: 'PlatformerPage',
          path: '/platformer',
          isInitial: true,
          traits: [{ ref: 'Platformer' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-tilemap - Tile Map Management
// ============================================================================

// ── Shared asset constants ───────────────────────────────────────────

const ASSET_BASE_URL = 'https://almadar-kflow-assets.web.app/shared';

const GAME_ASSET_MANIFEST = {
  terrain: {
    dirt: '/terrain/Isometric/dirt_N.png',
    stone: '/terrain/Isometric/stoneSide_N.png',
    bridge: '/terrain/Isometric/stoneStep_N.png',
    wall: '/terrain/Isometric/stoneWallArchway_N.png',
  },
  units: {
    guardian: '/sprite-sheets/guardian-sprite-sheet-se.png',
    breaker: '/sprite-sheets/breaker-sprite-sheet-se.png',
  },
  features: {
    gold_mine: '/world-map/gold_mine.png',
    portal: '/world-map/portal_open.png',
  },
};

// ── 5x5 mixed terrain grid ──────────────────────────────────────────

const TILEMAP_5X5_TILES = [
  { x: 0, y: 0, terrain: 'dirt' },  { x: 1, y: 0, terrain: 'dirt' },  { x: 2, y: 0, terrain: 'stone' }, { x: 3, y: 0, terrain: 'dirt' },  { x: 4, y: 0, terrain: 'wall' },
  { x: 0, y: 1, terrain: 'dirt' },  { x: 1, y: 1, terrain: 'bridge' },{ x: 2, y: 1, terrain: 'bridge' },{ x: 3, y: 1, terrain: 'bridge' },{ x: 4, y: 1, terrain: 'dirt' },
  { x: 0, y: 2, terrain: 'stone' }, { x: 1, y: 2, terrain: 'dirt' },  { x: 2, y: 2, terrain: 'dirt' },  { x: 3, y: 2, terrain: 'dirt' },  { x: 4, y: 2, terrain: 'stone' },
  { x: 0, y: 3, terrain: 'dirt' },  { x: 1, y: 3, terrain: 'wall' },  { x: 2, y: 3, terrain: 'dirt' },  { x: 3, y: 3, terrain: 'wall' },  { x: 4, y: 3, terrain: 'dirt' },
  { x: 0, y: 4, terrain: 'stone' }, { x: 1, y: 4, terrain: 'dirt' },  { x: 2, y: 4, terrain: 'stone' }, { x: 3, y: 4, terrain: 'dirt' },  { x: 4, y: 4, terrain: 'stone' },
];

// ── Reusable render-ui effects (tilemap: isometric canvas) ──────────

const tilemapDisplayEffects: BehaviorEffect[] = [
  ['render-ui', 'main', {
    type: 'isometric-canvas',
    entity: 'TileMapData',
    boardWidth: 5,
    boardHeight: 5,
    tiles: TILEMAP_5X5_TILES,
    units: [],
    scale: 1,
    enableCamera: true,
    assetBaseUrl: ASSET_BASE_URL,
    assetManifest: GAME_ASSET_MANIFEST,
  }],
  ['render-ui', 'overlay', { type: 'stack', direction: 'vertical', gap: 'sm', children: [
    { type: 'game-hud', position: 'top', elements: [
      { icon: 'map', label: 'Width', value: '@entity.width' },
      { icon: 'map', label: 'Height', value: '@entity.height' },
      { icon: 'move', label: 'Scroll X', value: '@entity.scrollX' },
      { icon: 'move', label: 'Scroll Y', value: '@entity.scrollY' },
    ]},
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'd-pad', size: 'md', directionEvent: 'SCROLL' },
      { type: 'action-buttons', layout: 'diamond', size: 'md', buttons: [
        { id: 'reset', label: 'Reset', icon: 'rotate-ccw' },
      ], actionEvent: 'RESET_SCROLL' },
    ]},
  ]}],
];

const tilemapLoadingEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center', children: [
      { type: 'icon', name: 'map', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Loading Map...' },
    ]},
    { type: 'progress-bar', value: 0, label: 'Loading Map...', icon: 'map' },
  ]}],
];

/**
 * std-tilemap - Tile map loading and scroll management.
 *
 * States: Loading -> Ready
 * Tracks map dimensions, tile size, and scroll position.
 */
export const TILEMAP_BEHAVIOR: BehaviorSchema = {
  name: 'std-tilemap',
  version: '1.0.0',
  description: 'Tile map management with scroll and dimensions',
  theme: PLATFORMER_THEME,
  orbitals: [
    {
      name: 'TileMapOrbital',
      entity: {
        name: 'TileMapData',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'width', type: 'number', default: 20 },
          { name: 'height', type: 'number', default: 15 },
          { name: 'tileSize', type: 'number', default: 32 },
          { name: 'scrollX', type: 'number', default: 0 },
          { name: 'scrollY', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'TileMap',
          linkedEntity: 'TileMapData',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Loading', isInitial: true },
              { name: 'Ready' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'LOADED', name: 'Map Loaded' },
              { key: 'SCROLL', name: 'Scroll', payloadSchema: [
                { name: 'dx', type: 'number', required: true },
                { name: 'dy', type: 'number', required: true },
              ] },
              { key: 'RESET_SCROLL', name: 'Reset Scroll' },
            ],
            transitions: [
              {
                from: 'Loading',
                to: 'Ready',
                event: 'INIT',
                effects: [
                  ['fetch', 'TileMapData'],
                  ...tilemapDisplayEffects,
                ],
              },
              {
                from: 'Loading',
                to: 'Ready',
                event: 'LOADED',
                effects: [
                  ['fetch', 'TileMapData'],
                  ...tilemapDisplayEffects,
                ],
              },
              {
                from: 'Ready',
                to: 'Ready',
                event: 'SCROLL',
                effects: [
                  ['fetch', 'TileMapData'],
                  ['set', '@entity.scrollX', ['+', '@entity.scrollX', '@payload.dx']],
                  ['set', '@entity.scrollY', ['+', '@entity.scrollY', '@payload.dy']],
                  ...tilemapDisplayEffects,
                ],
              },
              {
                from: 'Ready',
                to: 'Ready',
                event: 'RESET_SCROLL',
                effects: [
                  ['fetch', 'TileMapData'],
                  ['set', '@entity.scrollX', 0],
                  ['set', '@entity.scrollY', 0],
                  ...tilemapDisplayEffects,
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'TileMapPage',
          path: '/tilemap',
          isInitial: true,
          traits: [{ ref: 'TileMap' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-powerup - Power-Up Collection
// ============================================================================

// ── Reusable render-ui effects (powerup: game HUD) ──────────────────

const powerupHudEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center', children: [
      { type: 'badge', label: 'Ready', variant: 'primary', icon: 'star' },
      { type: 'typography', variant: 'h3', content: 'No Active Power-Up' },
    ]},
    { type: 'divider' },
    { type: 'stack', direction: 'horizontal', gap: 'md', justify: 'center', children: [
      { type: 'stats', label: 'Type', icon: 'star', entity: 'PowerUpData' },
      { type: 'stats', label: 'Duration', icon: 'zap', entity: 'PowerUpData' },
      { type: 'stats', label: 'Remaining', icon: 'heart', entity: 'PowerUpData' },
    ]},
    { type: 'divider' },
    { type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center', children: [
      { type: 'button', label: 'Collect', icon: 'zap', variant: 'primary', action: 'COLLECT' },
      { type: 'button', label: 'Reset', icon: 'rotate-ccw', variant: 'secondary', action: 'RESET' },
    ]},
  ]}],
];

const powerupActiveEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'md', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center', children: [
      { type: 'badge', label: 'Active', variant: 'success', icon: 'zap' },
      { type: 'typography', variant: 'h3', content: 'Power-Up Active!' },
    ]},
    { type: 'divider' },
    { type: 'stack', direction: 'horizontal', gap: 'md', justify: 'center', children: [
      { type: 'stats', label: 'Type', icon: 'zap', entity: 'PowerUpData' },
      { type: 'stats', label: 'Remaining', icon: 'heart', entity: 'PowerUpData' },
      { type: 'stats', label: 'Duration', icon: 'shield', entity: 'PowerUpData' },
    ]},
    { type: 'divider' },
    { type: 'progress-bar', value: '@entity.remainingTime', max: '@entity.duration', label: 'Time Left', icon: 'zap' },
  ]}],
];

/**
 * std-powerup - Power-up activation and duration tracking.
 *
 * States: Inactive -> Active -> Expired
 * Tick counts down remaining time when active.
 */
export const POWERUP_BEHAVIOR: BehaviorSchema = {
  name: 'std-powerup',
  version: '1.0.0',
  description: 'Power-up collection with duration countdown',
  theme: PLATFORMER_THEME,
  orbitals: [
    {
      name: 'PowerUpOrbital',
      entity: {
        name: 'PowerUpData',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'type', type: 'string', default: 'none' },
          { name: 'duration', type: 'number', default: 300 },
          { name: 'isActive', type: 'boolean', default: false },
          { name: 'remainingTime', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'PowerUp',
          linkedEntity: 'PowerUpData',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Inactive', isInitial: true },
              { name: 'Active' },
              { name: 'Expired' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'COLLECT', name: 'Collect', payloadSchema: [
                { name: 'type', type: 'string', required: true },
                { name: 'duration', type: 'number', required: true },
              ] },
              { key: 'EXPIRE', name: 'Expire' },
              { key: 'RESET', name: 'Reset' },
            ],
            transitions: [
              {
                from: 'Inactive',
                to: 'Inactive',
                event: 'INIT',
                effects: [
                  ['set', '@entity.isActive', false],
                  ['set', '@entity.remainingTime', 0],
                  ...powerupHudEffects,
                ],
              },
              {
                from: 'Inactive',
                to: 'Active',
                event: 'COLLECT',
                effects: [
                  ['set', '@entity.type', '@payload.type'],
                  ['set', '@entity.duration', '@payload.duration'],
                  ['set', '@entity.remainingTime', '@payload.duration'],
                  ['set', '@entity.isActive', true],
                  ...powerupActiveEffects,
                ],
              },
              {
                from: 'Active',
                to: 'Expired',
                event: 'EXPIRE',
                effects: [
                  ['set', '@entity.isActive', false],
                  ['set', '@entity.remainingTime', 0],
                  ...powerupHudEffects,
                ],
              },
              {
                from: 'Expired',
                to: 'Inactive',
                event: 'RESET',
                effects: [
                  ['set', '@entity.type', 'none'],
                  ...powerupHudEffects,
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'DurationCountdown',
              interval: 'frame',
              guard: ['and', ['=', '@state', 'Active'], ['>', '@entity.remainingTime', 0]],
              effects: [
                ['set', '@entity.remainingTime', ['-', '@entity.remainingTime', 1]],
              ],
            },
          ],
        },
      ],
      pages: [
        {
          name: 'PowerUpPage',
          path: '/powerups',
          isInitial: true,
          traits: [{ ref: 'PowerUp' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-enemy-ai - Enemy Behavior
// ============================================================================

// ── Reusable render-ui effects (enemy AI: isometric canvas + HUD) ───

const ENEMY_TILES = [
  { x: 0, y: 0, terrain: 'dirt' },  { x: 1, y: 0, terrain: 'dirt' },  { x: 2, y: 0, terrain: 'dirt' },  { x: 3, y: 0, terrain: 'dirt' },  { x: 4, y: 0, terrain: 'dirt' },
  { x: 0, y: 1, terrain: 'dirt' },  { x: 1, y: 1, terrain: 'stone' }, { x: 2, y: 1, terrain: 'dirt' },  { x: 3, y: 1, terrain: 'stone' }, { x: 4, y: 1, terrain: 'dirt' },
  { x: 0, y: 2, terrain: 'dirt' },  { x: 1, y: 2, terrain: 'dirt' },  { x: 2, y: 2, terrain: 'bridge' },{ x: 3, y: 2, terrain: 'dirt' },  { x: 4, y: 2, terrain: 'dirt' },
  { x: 0, y: 3, terrain: 'dirt' },  { x: 1, y: 3, terrain: 'stone' }, { x: 2, y: 3, terrain: 'dirt' },  { x: 3, y: 3, terrain: 'stone' }, { x: 4, y: 3, terrain: 'dirt' },
  { x: 0, y: 4, terrain: 'dirt' },  { x: 1, y: 4, terrain: 'dirt' },  { x: 2, y: 4, terrain: 'dirt' },  { x: 3, y: 4, terrain: 'dirt' },  { x: 4, y: 4, terrain: 'dirt' },
];

const enemyPatrolHudEffects: BehaviorEffect[] = [
  ['render-ui', 'main', {
    type: 'isometric-canvas',
    entity: 'EnemyData',
    boardWidth: 5,
    boardHeight: 5,
    tiles: ENEMY_TILES,
    units: [{ id: 'enemy-1', x: 2, y: 2, unitType: 'guardian' }],
    scale: 1,
    enableCamera: false,
    assetBaseUrl: ASSET_BASE_URL,
    assetManifest: GAME_ASSET_MANIFEST,
  }],
  ['render-ui', 'overlay', { type: 'stack', direction: 'vertical', gap: 'sm', children: [
    { type: 'game-hud', position: 'top', elements: [
      { icon: 'sword', label: 'State', value: 'Patrol' },
      { icon: 'map-pin', label: 'X', value: '@entity.x' },
      { icon: 'zap', label: 'Speed', value: '@entity.speed' },
      { icon: 'flag', label: 'Dir', value: '@entity.direction' },
    ]},
  ]}],
];

const enemyChaseHudEffects: BehaviorEffect[] = [
  ['render-ui', 'main', {
    type: 'isometric-canvas',
    entity: 'EnemyData',
    boardWidth: 5,
    boardHeight: 5,
    tiles: ENEMY_TILES,
    units: [{ id: 'enemy-1', x: 2, y: 2, unitType: 'guardian' }],
    scale: 1,
    enableCamera: false,
    assetBaseUrl: ASSET_BASE_URL,
    assetManifest: GAME_ASSET_MANIFEST,
  }],
  ['render-ui', 'overlay', { type: 'stack', direction: 'vertical', gap: 'sm', children: [
    { type: 'game-hud', position: 'top', elements: [
      { icon: 'sword', label: 'State', value: 'Chase' },
      { icon: 'map-pin', label: 'X', value: '@entity.x' },
      { icon: 'zap', label: 'Speed', value: '@entity.speed' },
    ]},
    { type: 'badge', label: 'Chasing Player!', variant: 'warning', icon: 'zap' },
  ]}],
];

const enemyStunnedHudEffects: BehaviorEffect[] = [
  ['render-ui', 'main', {
    type: 'isometric-canvas',
    entity: 'EnemyData',
    boardWidth: 5,
    boardHeight: 5,
    tiles: ENEMY_TILES,
    units: [{ id: 'enemy-1', x: 2, y: 2, unitType: 'guardian' }],
    scale: 1,
    enableCamera: false,
    assetBaseUrl: ASSET_BASE_URL,
    assetManifest: GAME_ASSET_MANIFEST,
  }],
  ['render-ui', 'overlay', { type: 'stack', direction: 'vertical', gap: 'sm', children: [
    { type: 'game-hud', position: 'top', elements: [
      { icon: 'sword', label: 'State', value: 'Stunned' },
      { icon: 'map-pin', label: 'X', value: '@entity.x' },
    ]},
    { type: 'badge', label: 'Stunned!', variant: 'error', icon: 'star' },
    { type: 'button', label: 'Recover', icon: 'heart', variant: 'primary', action: 'RECOVER' },
  ]}],
];

/**
 * std-enemy-ai - Enemy patrol and chase behavior.
 *
 * States: Patrolling -> Chasing -> Stunned
 * Tick moves enemy along patrol path.
 */
export const ENEMY_AI_BEHAVIOR: BehaviorSchema = {
  name: 'std-enemy-ai',
  version: '1.0.0',
  description: 'Enemy AI with patrol, chase, and stun behavior',
  theme: PLATFORMER_THEME,
  orbitals: [
    {
      name: 'EnemyAIOrbital',
      entity: {
        name: 'EnemyData',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'x', type: 'number', default: 0 },
          { name: 'y', type: 'number', default: 0 },
          { name: 'patrolStart', type: 'number', default: 0 },
          { name: 'patrolEnd', type: 'number', default: 100 },
          { name: 'speed', type: 'number', default: 1 },
          { name: 'direction', type: 'number', default: 1 },
        ],
      },
      traits: [
        {
          name: 'EnemyAI',
          linkedEntity: 'EnemyData',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Patrolling', isInitial: true },
              { name: 'Chasing' },
              { name: 'Stunned' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'DETECT_PLAYER', name: 'Detect Player' },
              { key: 'LOSE_PLAYER', name: 'Lose Player' },
              { key: 'STUN', name: 'Stun' },
              { key: 'RECOVER', name: 'Recover' },
            ],
            transitions: [
              {
                from: 'Patrolling',
                to: 'Patrolling',
                event: 'INIT',
                effects: [
                  ['fetch', 'EnemyData'],
                  ['set', '@entity.x', '@entity.patrolStart'],
                  ['set', '@entity.direction', 1],
                  ...enemyPatrolHudEffects,
                ],
              },
              {
                from: 'Patrolling',
                to: 'Chasing',
                event: 'DETECT_PLAYER',
                effects: [
                  ['fetch', 'EnemyData'],
                  ...enemyChaseHudEffects,
                ],
              },
              {
                from: 'Chasing',
                to: 'Patrolling',
                event: 'LOSE_PLAYER',
                effects: [
                  ['fetch', 'EnemyData'],
                  ...enemyPatrolHudEffects,
                ],
              },
              {
                from: 'Patrolling',
                to: 'Stunned',
                event: 'STUN',
                effects: [
                  ['fetch', 'EnemyData'],
                  ...enemyStunnedHudEffects,
                ],
              },
              {
                from: 'Chasing',
                to: 'Stunned',
                event: 'STUN',
                effects: [
                  ['fetch', 'EnemyData'],
                  ...enemyStunnedHudEffects,
                ],
              },
              {
                from: 'Stunned',
                to: 'Patrolling',
                event: 'RECOVER',
                effects: [
                  ['fetch', 'EnemyData'],
                  ...enemyPatrolHudEffects,
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'PatrolMovement',
              interval: 'frame',
              guard: ['=', '@state', 'Patrolling'],
              effects: [
                ['set', '@entity.x', ['+', '@entity.x', ['*', '@entity.speed', '@entity.direction']]],
              ],
            },
          ],
        },
      ],
      pages: [
        {
          name: 'EnemyAIPage',
          path: '/enemy-ai',
          isInitial: true,
          traits: [{ ref: 'EnemyAI' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Behaviors
// ============================================================================

export const GAME_2D_PLATFORMER_BEHAVIORS: BehaviorSchema[] = [
  PLATFORMER_BEHAVIOR,
  TILEMAP_BEHAVIOR,
  POWERUP_BEHAVIOR,
  ENEMY_AI_BEHAVIOR,
];
