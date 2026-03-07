/**
 * 2D Platformer Game Behaviors
 *
 * Standard behaviors for 2D platformer games: character state, tile maps,
 * power-ups, and enemy AI.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from '../types.js';

// ============================================================================
// std-platformer - Platform Game Character State
// ============================================================================

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
  orbitals: [
    {
      name: 'PlatformerOrbital',
      entity: {
        name: 'PlatformerState',
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
          linkedEntity: 'PlatformerState',
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Platformer' }],
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Idle',
                to: 'Running',
                event: 'RUN',
                effects: [
                  ['set', '@entity.x', ['+', '@entity.x', '@payload.direction']],
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Running',
                to: 'Running',
                event: 'RUN',
                effects: [
                  ['set', '@entity.x', ['+', '@entity.x', '@payload.direction']],
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Running',
                to: 'Idle',
                event: 'STOP',
                effects: [
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Idle',
                to: 'Jumping',
                event: 'JUMP',
                effects: [
                  ['set', '@entity.isJumping', true],
                  ['set', '@entity.y', ['-', '@entity.y', 10]],
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Running',
                to: 'Jumping',
                event: 'JUMP',
                effects: [
                  ['set', '@entity.isJumping', true],
                  ['set', '@entity.y', ['-', '@entity.y', 10]],
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Jumping',
                to: 'Falling',
                event: 'FALL',
                effects: [
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Falling',
                to: 'Idle',
                event: 'LAND',
                effects: [
                  ['set', '@entity.isJumping', false],
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Jumping',
                to: 'Idle',
                event: 'LAND',
                effects: [
                  ['set', '@entity.isJumping', false],
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Idle',
                to: 'Dead',
                event: 'DIE',
                effects: [
                  ['set', '@entity.lives', ['-', '@entity.lives', 1]],
                  ['render-ui', 'main', { type: 'game-over-screen',
                    title: 'Game Over',
                  }],
                ],
              },
              {
                from: 'Running',
                to: 'Dead',
                event: 'DIE',
                effects: [
                  ['set', '@entity.lives', ['-', '@entity.lives', 1]],
                  ['render-ui', 'main', { type: 'game-over-screen',
                    title: 'Game Over',
                  }],
                ],
              },
              {
                from: 'Falling',
                to: 'Dead',
                event: 'DIE',
                effects: [
                  ['set', '@entity.lives', ['-', '@entity.lives', 1]],
                  ['render-ui', 'main', { type: 'game-over-screen',
                    title: 'Game Over',
                  }],
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
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
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
  orbitals: [
    {
      name: 'TileMapOrbital',
      entity: {
        name: 'TileMapState',
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
          linkedEntity: 'TileMapState',
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
                  ['fetch', 'TileMapState'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Tile Map' }],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'TileMapState',
                  }],
                ],
              },
              {
                from: 'Loading',
                to: 'Ready',
                event: 'LOADED',
                effects: [
                  ['fetch', 'TileMapState'],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'TileMapState',
                  }],
                ],
              },
              {
                from: 'Ready',
                to: 'Ready',
                event: 'SCROLL',
                effects: [
                  ['fetch', 'TileMapState'],
                  ['set', '@entity.scrollX', ['+', '@entity.scrollX', '@payload.dx']],
                  ['set', '@entity.scrollY', ['+', '@entity.scrollY', '@payload.dy']],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'TileMapState',
                  }],
                ],
              },
              {
                from: 'Ready',
                to: 'Ready',
                event: 'RESET_SCROLL',
                effects: [
                  ['fetch', 'TileMapState'],
                  ['set', '@entity.scrollX', 0],
                  ['set', '@entity.scrollY', 0],
                  ['render-ui', 'main', { type: 'isometric-canvas',
                    entity: 'TileMapState',
                  }],
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
  orbitals: [
    {
      name: 'PowerUpOrbital',
      entity: {
        name: 'PowerUpState',
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
          linkedEntity: 'PowerUpState',
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Power-Ups' }],
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
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
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Active',
                to: 'Expired',
                event: 'EXPIRE',
                effects: [
                  ['set', '@entity.isActive', false],
                  ['set', '@entity.remainingTime', 0],
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Expired',
                to: 'Inactive',
                event: 'RESET',
                effects: [
                  ['set', '@entity.type', 'none'],
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
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
  orbitals: [
    {
      name: 'EnemyAIOrbital',
      entity: {
        name: 'EnemyState',
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
          linkedEntity: 'EnemyState',
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
                  ['fetch', 'EnemyState'],
                  ['set', '@entity.x', '@entity.patrolStart'],
                  ['set', '@entity.direction', 1],
                  ['render-ui', 'main', { type: 'page-header', title: 'Enemy AI' }],
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Patrolling',
                to: 'Chasing',
                event: 'DETECT_PLAYER',
                effects: [
                  ['fetch', 'EnemyState'],
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Chasing',
                to: 'Patrolling',
                event: 'LOSE_PLAYER',
                effects: [
                  ['fetch', 'EnemyState'],
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Patrolling',
                to: 'Stunned',
                event: 'STUN',
                effects: [
                  ['fetch', 'EnemyState'],
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Chasing',
                to: 'Stunned',
                event: 'STUN',
                effects: [
                  ['fetch', 'EnemyState'],
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
                ],
              },
              {
                from: 'Stunned',
                to: 'Patrolling',
                event: 'RECOVER',
                effects: [
                  ['fetch', 'EnemyState'],
                  ['render-ui', 'main', { type: 'game-hud',
                    stats: '@entity.id',
                  }],
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
