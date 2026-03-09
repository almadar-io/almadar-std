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

import type { OrbitalSchema } from '../types.js';

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

// ── Reusable main-view effects (platformer: HUD) ──────────────────

const platformerHudEffects = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: gamepad icon + title
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'gamepad-2', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Platformer' },
      ]},
      { type: 'badge', label: 'Active', variant: 'success', icon: 'zap' },
    ]},
    { type: 'divider' },
    // Stats row: lives, position, jump status
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Lives', icon: 'heart', entity: 'PlatformerData' },
      { type: 'stats', label: 'Level', icon: 'flag', entity: 'PlatformerData' },
      { type: 'stats', label: 'Position X', icon: 'map', entity: 'PlatformerData' },
      { type: 'stats', label: 'Position Y', icon: 'map', entity: 'PlatformerData' },
    ]},
    { type: 'divider' },
    // Character info grid
    { type: 'data-grid', entity: 'PlatformerData', cols: 2, gap: 'md',
      fields: [
        { name: 'id', label: 'Character', icon: 'sword', variant: 'h4' },
        { name: 'level', label: 'Level', icon: 'flag', variant: 'body', format: 'number' },
        { name: 'lives', label: 'Lives', icon: 'heart', variant: 'body', format: 'number' },
        { name: 'isJumping', label: 'Jumping', icon: 'zap', variant: 'badge' },
      ],
    },
    { type: 'divider' },
    // Health meter
    { type: 'meter', value: 0, label: 'Lives Remaining', icon: 'heart', entity: 'PlatformerData' },
  ]}],
];

const platformerGameOverEffects = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Game over header
    { type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center', children: [
      { type: 'icon', name: 'trophy', size: 'lg' },
      { type: 'typography', variant: 'h1', content: 'Game Over' },
    ]},
    { type: 'divider' },
    // Final stats
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Final Level', icon: 'flag', entity: 'PlatformerData' },
      { type: 'stats', label: 'Lives Left', icon: 'heart', entity: 'PlatformerData' },
    ]},
    { type: 'divider' },
    // Respawn button
    { type: 'button', label: 'Respawn', icon: 'star', variant: 'primary', action: 'RESPAWN' },
  ]}],
];

/**
 * std-platformer - Platform game character state machine.
 *
 * States: idle -> running -> jumping -> falling -> dead
 * Tracks position, lives, and jump state.
 * Tick applies gravity when not grounded.
 */
export const PLATFORMER_BEHAVIOR: OrbitalSchema = {
  name: 'std-platformer',
  version: '1.0.0',
  description: 'Platform game character state with movement and gravity',
  theme: PLATFORMER_THEME,
  orbitals: [
    {
      name: 'PlatformerOrbital',
      entity: {
        name: 'PlatformerData',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'level', type: 'number', default: 1 },
          { name: 'lives', type: 'number', default: 3 },
          { name: 'x', type: 'number', default: 0 },
          { name: 'y', type: 'number', default: 0 },
          { name: 'isJumping', type: 'boolean', default: false },
        ],
      },
      traits: [
        {
          name: 'Platformer',
          linkedEntity: 'PlatformerData',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Idle', isInitial: true },
              { name: 'Running' },
              { name: 'Jumping' },
              { name: 'Falling' },
              { name: 'Dead' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'RUN', name: 'Run', payloadSchema: [
                { name: 'direction', type: 'number', required: true },
              ] },
              { key: 'STOP', name: 'Stop' },
              { key: 'JUMP', name: 'Jump' },
              { key: 'LAND', name: 'Land' },
              { key: 'FALL', name: 'Fall' },
              { key: 'DIE', name: 'Die' },
              { key: 'RESPAWN', name: 'Respawn' },
            ],
            transitions: [
              {
                from: 'Idle',
                to: 'Idle',
                event: 'INIT',
                effects: [
                  ['set', '@entity.x', 0],
                  ['set', '@entity.y', 0],
                  ['set', '@entity.isJumping', false],
                  ...platformerHudEffects,
                ],
              },
              {
                from: 'Idle',
                to: 'Running',
                event: 'RUN',
                effects: [
                  ['set', '@entity.x', ['+', '@entity.x', '@payload.direction']],
                  ...platformerHudEffects,
                ],
              },
              {
                from: 'Running',
                to: 'Running',
                event: 'RUN',
                effects: [
                  ['set', '@entity.x', ['+', '@entity.x', '@payload.direction']],
                  ...platformerHudEffects,
                ],
              },
              {
                from: 'Running',
                to: 'Idle',
                event: 'STOP',
                effects: [
                  ...platformerHudEffects,
                ],
              },
              {
                from: 'Idle',
                to: 'Jumping',
                event: 'JUMP',
                effects: [
                  ['set', '@entity.isJumping', true],
                  ['set', '@entity.y', ['-', '@entity.y', 10]],
                  ...platformerHudEffects,
                ],
              },
              {
                from: 'Running',
                to: 'Jumping',
                event: 'JUMP',
                effects: [
                  ['set', '@entity.isJumping', true],
                  ['set', '@entity.y', ['-', '@entity.y', 10]],
                  ...platformerHudEffects,
                ],
              },
              {
                from: 'Jumping',
                to: 'Falling',
                event: 'FALL',
                effects: [
                  ...platformerHudEffects,
                ],
              },
              {
                from: 'Falling',
                to: 'Idle',
                event: 'LAND',
                effects: [
                  ['set', '@entity.isJumping', false],
                  ...platformerHudEffects,
                ],
              },
              {
                from: 'Jumping',
                to: 'Idle',
                event: 'LAND',
                effects: [
                  ['set', '@entity.isJumping', false],
                  ...platformerHudEffects,
                ],
              },
              {
                from: 'Idle',
                to: 'Dead',
                event: 'DIE',
                effects: [
                  ['set', '@entity.lives', ['-', '@entity.lives', 1]],
                  ...platformerGameOverEffects,
                ],
              },
              {
                from: 'Running',
                to: 'Dead',
                event: 'DIE',
                effects: [
                  ['set', '@entity.lives', ['-', '@entity.lives', 1]],
                  ...platformerGameOverEffects,
                ],
              },
              {
                from: 'Falling',
                to: 'Dead',
                event: 'DIE',
                effects: [
                  ['set', '@entity.lives', ['-', '@entity.lives', 1]],
                  ...platformerGameOverEffects,
                ],
              },
              {
                from: 'Dead',
                to: 'Idle',
                event: 'RESPAWN',
                guard: ['>', '@entity.lives', 0],
                effects: [
                  ['set', '@entity.x', 0],
                  ['set', '@entity.y', 0],
                  ['set', '@entity.isJumping', false],
                  ...platformerHudEffects,
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'GravityTick',
              interval: 'frame',
              guard: ['and', ['=', '@state', 'Falling'], ['=', '@entity.isJumping', false]],
              effects: [
                ['set', '@entity.y', ['+', '@entity.y', 1]],
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

// ── Reusable main-view effects (tilemap: map display) ──────────────

const tilemapDisplayEffects = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: map icon + title + reset button
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'map', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Tile Map' },
      ]},
      { type: 'button', label: 'Reset View', icon: 'star', variant: 'secondary', action: 'RESET_SCROLL' },
    ]},
    { type: 'divider' },
    // Map stats row
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Width', icon: 'shield', entity: 'TileMapData' },
      { type: 'stats', label: 'Height', icon: 'shield', entity: 'TileMapData' },
      { type: 'stats', label: 'Tile Size', icon: 'gamepad-2', entity: 'TileMapData' },
    ]},
    { type: 'divider' },
    // Scroll position info
    { type: 'data-grid', entity: 'TileMapData', cols: 2, gap: 'md',
      fields: [
        { name: 'id', label: 'Map ID', icon: 'map', variant: 'h4' },
        { name: 'width', label: 'Width', icon: 'shield', variant: 'body', format: 'number' },
        { name: 'height', label: 'Height', icon: 'shield', variant: 'body', format: 'number' },
        { name: 'scrollX', label: 'Scroll X', icon: 'zap', variant: 'body', format: 'number' },
        { name: 'scrollY', label: 'Scroll Y', icon: 'zap', variant: 'body', format: 'number' },
      ],
    },
    { type: 'divider' },
    // Scroll progress meter
    { type: 'meter', value: 0, label: 'Scroll Progress', icon: 'map', entity: 'TileMapData' },
  ]}],
];

const tilemapLoadingEffects = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Loading header
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'map', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Tile Map' },
    ]},
    { type: 'divider' },
    // Loading indicator
    { type: 'progress-bar', value: 0, label: 'Loading Map...', icon: 'map' },
    // Map dimensions preview
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Width', icon: 'shield', entity: 'TileMapData' },
      { type: 'stats', label: 'Height', icon: 'shield', entity: 'TileMapData' },
    ]},
  ]}],
];

/**
 * std-tilemap - Tile map loading and scroll management.
 *
 * States: Loading -> Ready
 * Tracks map dimensions, tile size, and scroll position.
 */
export const TILEMAP_BEHAVIOR: OrbitalSchema = {
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
                to: 'Loading',
                event: 'INIT',
                effects: [
                  ['fetch', 'TileMapData'],
                  ...tilemapLoadingEffects,
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

// ── Reusable main-view effects (powerup: HUD) ─────────────────────

const powerupHudEffects = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: zap icon + title
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'zap', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Power-Ups' },
      ]},
      { type: 'badge', label: 'Ready', variant: 'primary', icon: 'star' },
    ]},
    { type: 'divider' },
    // Power-up stats
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Type', icon: 'star', entity: 'PowerUpData' },
      { type: 'stats', label: 'Duration', icon: 'zap', entity: 'PowerUpData' },
      { type: 'stats', label: 'Remaining', icon: 'heart', entity: 'PowerUpData' },
    ]},
    { type: 'divider' },
    // Power-up details grid
    { type: 'data-grid', entity: 'PowerUpData', cols: 2, gap: 'md',
      fields: [
        { name: 'id', label: 'Power-Up', icon: 'star', variant: 'h4' },
        { name: 'type', label: 'Type', icon: 'zap', variant: 'badge' },
        { name: 'duration', label: 'Duration', icon: 'shield', variant: 'body', format: 'number' },
        { name: 'remainingTime', label: 'Time Left', icon: 'heart', variant: 'body', format: 'number' },
        { name: 'isActive', label: 'Active', icon: 'zap', variant: 'badge' },
      ],
    },
    { type: 'divider' },
    // Duration meter
    { type: 'meter', value: 0, label: 'Time Remaining', icon: 'zap', entity: 'PowerUpData' },
  ]}],
];

const powerupActiveEffects = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Active header
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'zap', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Power-Ups' },
      ]},
      { type: 'badge', label: 'Active', variant: 'success', icon: 'zap' },
    ]},
    { type: 'divider' },
    // Active power-up stats
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Type', icon: 'star', entity: 'PowerUpData' },
      { type: 'stats', label: 'Remaining', icon: 'heart', entity: 'PowerUpData' },
    ]},
    { type: 'divider' },
    // Duration countdown bar
    { type: 'progress-bar', value: 0, label: 'Power-Up Duration', icon: 'zap', entity: 'PowerUpData' },
    // Details
    { type: 'data-grid', entity: 'PowerUpData', cols: 2, gap: 'md',
      fields: [
        { name: 'type', label: 'Type', icon: 'star', variant: 'badge' },
        { name: 'remainingTime', label: 'Time Left', icon: 'heart', variant: 'body', format: 'number' },
      ],
    },
  ]}],
];

/**
 * std-powerup - Power-up activation and duration tracking.
 *
 * States: Inactive -> Active -> Expired
 * Tick counts down remaining time when active.
 */
export const POWERUP_BEHAVIOR: OrbitalSchema = {
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

// ── Reusable main-view effects (enemy AI: patrol HUD) ──────────────

const enemyPatrolHudEffects = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: sword icon + title + state badge
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'sword', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Enemy AI' },
      ]},
      { type: 'badge', label: 'Patrolling', variant: 'primary', icon: 'shield' },
    ]},
    { type: 'divider' },
    // Enemy stats row
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Position X', icon: 'map', entity: 'EnemyData' },
      { type: 'stats', label: 'Position Y', icon: 'map', entity: 'EnemyData' },
      { type: 'stats', label: 'Speed', icon: 'zap', entity: 'EnemyData' },
      { type: 'stats', label: 'Direction', icon: 'flag', entity: 'EnemyData' },
    ]},
    { type: 'divider' },
    // Enemy details grid
    { type: 'data-grid', entity: 'EnemyData', cols: 2, gap: 'md',
      fields: [
        { name: 'id', label: 'Enemy', icon: 'sword', variant: 'h4' },
        { name: 'speed', label: 'Speed', icon: 'zap', variant: 'body', format: 'number' },
        { name: 'patrolStart', label: 'Patrol Start', icon: 'flag', variant: 'body', format: 'number' },
        { name: 'patrolEnd', label: 'Patrol End', icon: 'flag', variant: 'body', format: 'number' },
        { name: 'direction', label: 'Direction', icon: 'map', variant: 'badge' },
      ],
    },
    { type: 'divider' },
    // Patrol progress meter
    { type: 'meter', value: 0, label: 'Patrol Progress', icon: 'shield', entity: 'EnemyData' },
  ]}],
];

const enemyChaseHudEffects = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Chase header
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'sword', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Enemy AI' },
      ]},
      { type: 'badge', label: 'Chasing', variant: 'warning', icon: 'zap' },
    ]},
    { type: 'divider' },
    // Chase stats
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Position X', icon: 'map', entity: 'EnemyData' },
      { type: 'stats', label: 'Position Y', icon: 'map', entity: 'EnemyData' },
      { type: 'stats', label: 'Speed', icon: 'zap', entity: 'EnemyData' },
    ]},
    { type: 'divider' },
    // Enemy data
    { type: 'data-grid', entity: 'EnemyData', cols: 2, gap: 'md',
      fields: [
        { name: 'id', label: 'Enemy', icon: 'sword', variant: 'h4' },
        { name: 'speed', label: 'Speed', icon: 'zap', variant: 'body', format: 'number' },
        { name: 'direction', label: 'Direction', icon: 'map', variant: 'badge' },
      ],
    },
  ]}],
];

const enemyStunnedHudEffects = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Stunned header
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'sword', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Enemy AI' },
      ]},
      { type: 'badge', label: 'Stunned', variant: 'error', icon: 'star' },
    ]},
    { type: 'divider' },
    // Stunned stats
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Position X', icon: 'map', entity: 'EnemyData' },
      { type: 'stats', label: 'Position Y', icon: 'map', entity: 'EnemyData' },
    ]},
    { type: 'divider' },
    // Recovery button
    { type: 'button', label: 'Recover', icon: 'heart', variant: 'primary', action: 'RECOVER' },
  ]}],
];

/**
 * std-enemy-ai - Enemy patrol and chase behavior.
 *
 * States: Patrolling -> Chasing -> Stunned
 * Tick moves enemy along patrol path.
 */
export const ENEMY_AI_BEHAVIOR: OrbitalSchema = {
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

export const GAME_2D_PLATFORMER_BEHAVIORS: OrbitalSchema[] = [
  PLATFORMER_BEHAVIOR,
  TILEMAP_BEHAVIOR,
  POWERUP_BEHAVIOR,
  ENEMY_AI_BEHAVIOR,
];
