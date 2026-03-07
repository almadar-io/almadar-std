/**
 * Game Core Behaviors
 *
 * Foundation behaviors for game systems: loop, physics, input, collision.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from './types.js';

// ============================================================================
// std-gameloop - Master Game Tick Coordination
// ============================================================================

/**
 * std-gameloop - Coordinates game tick execution at 60fps.
 *
 * States: Stopped -> Running -> Paused
 * Provides the master clock for all game systems.
 * Uses a concrete GameLoopState entity to track frame count and elapsed time.
 */
export const GAME_LOOP_BEHAVIOR: OrbitalSchema = {
  name: 'std-gameloop',
  version: '1.0.0',
  description: 'Master game loop coordinator running at 60fps',
  orbitals: [
    {
      name: 'GameLoopOrbital',
      entity: {
        name: 'GameLoopState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'frameCount', type: 'number', default: 0 },
          { name: 'deltaTime', type: 'number', default: 16 },
          { name: 'elapsedTime', type: 'number', default: 0 },
          { name: 'status', type: 'string', default: 'stopped' },
        ],
      },
      traits: [
        {
          name: 'GameLoop',
          linkedEntity: 'GameLoopState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Stopped', isInitial: true },
              { name: 'Running' },
              { name: 'Paused' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'START', name: 'Start' },
              { key: 'STOP', name: 'Stop' },
              { key: 'PAUSE', name: 'Pause' },
              { key: 'RESUME', name: 'Resume' },
            ],
            transitions: [
              {
                from: 'Stopped',
                to: 'Stopped',
                event: 'INIT',
                effects: [
                  ['fetch', 'GameLoopState'],
                  ['set', '@entity.frameCount', 0],
                  ['set', '@entity.elapsedTime', 0],
                  ['set', '@entity.status', 'stopped'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Game Loop' }],
                  ['render-ui', 'main', { type: 'card' }, { entity: 'GameLoopState' }],
                ],
              },
              {
                from: 'Stopped',
                to: 'Running',
                event: 'START',
                effects: [
                  ['fetch', 'GameLoopState'],
                  ['set', '@entity.frameCount', 0],
                  ['set', '@entity.elapsedTime', 0],
                  ['set', '@entity.status', 'running'],
                  ['render-ui', 'main', { type: 'card' }, { entity: 'GameLoopState' }],
                ],
              },
              {
                from: 'Running',
                to: 'Paused',
                event: 'PAUSE',
                effects: [
                  ['fetch', 'GameLoopState'],
                  ['set', '@entity.status', 'paused'],
                  ['render-ui', 'main', { type: 'card' }, { entity: 'GameLoopState' }],
                ],
              },
              {
                from: 'Paused',
                to: 'Running',
                event: 'RESUME',
                effects: [
                  ['fetch', 'GameLoopState'],
                  ['set', '@entity.status', 'running'],
                  ['render-ui', 'main', { type: 'card' }, { entity: 'GameLoopState' }],
                ],
              },
              {
                from: 'Running',
                to: 'Stopped',
                event: 'STOP',
                effects: [
                  ['fetch', 'GameLoopState'],
                  ['set', '@entity.status', 'stopped'],
                  ['render-ui', 'main', { type: 'card' }, { entity: 'GameLoopState' }],
                ],
              },
              {
                from: 'Paused',
                to: 'Stopped',
                event: 'STOP',
                effects: [
                  ['fetch', 'GameLoopState'],
                  ['set', '@entity.status', 'stopped'],
                  ['render-ui', 'main', { type: 'card' }, { entity: 'GameLoopState' }],
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'GameTick',
              interval: 'frame',
              guard: ['=', '@state', 'Running'],
              effects: [
                ['set', '@entity.frameCount', ['+', '@entity.frameCount', 1]],
                ['set', '@entity.elapsedTime', ['+', '@entity.elapsedTime', '@entity.deltaTime']],
              ],
            },
          ],
        },
      ],
      pages: [
        {
          name: 'GameLoopPage',
          path: '/game-loop',
          isInitial: true,
          traits: [{ ref: 'GameLoop' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-physics2d - Gravity and Velocity
// ============================================================================

/**
 * std-physics2d - 2D physics with gravity, velocity, and friction.
 *
 * Applied to entities that need physics simulation.
 * Uses a concrete Physics2DState entity to track position and velocity.
 */
export const PHYSICS_2D_BEHAVIOR: OrbitalSchema = {
  name: 'std-physics2d',
  version: '1.0.0',
  description: '2D physics with gravity, velocity, and friction',
  orbitals: [
    {
      name: 'Physics2DOrbital',
      entity: {
        name: 'Physics2DState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'x', type: 'number', default: 0 },
          { name: 'y', type: 'number', default: 0 },
          { name: 'vx', type: 'number', default: 0 },
          { name: 'vy', type: 'number', default: 0 },
          { name: 'fx', type: 'number', default: 0 },
          { name: 'fy', type: 'number', default: 0 },
          { name: 'isGrounded', type: 'boolean', default: false },
          { name: 'gravity', type: 'number', default: 0.5 },
          { name: 'friction', type: 'number', default: 0.8 },
          { name: 'airResistance', type: 'number', default: 0.99 },
          { name: 'maxVelocityY', type: 'number', default: 20 },
        ],
      },
      traits: [
        {
          name: 'Physics2D',
          linkedEntity: 'Physics2DState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Active', isInitial: true },
              { name: 'Frozen' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'APPLY_FORCE', name: 'Apply Force', payloadSchema: [
                { name: 'fx', type: 'number', required: true },
                { name: 'fy', type: 'number', required: true },
              ] },
              { key: 'GROUND_HIT', name: 'Ground Hit' },
              { key: 'FREEZE', name: 'Freeze' },
              { key: 'UNFREEZE', name: 'Unfreeze' },
            ],
            transitions: [
              {
                from: 'Active',
                to: 'Active',
                event: 'INIT',
                effects: [
                  ['fetch', 'Physics2DState'],
                  ['set', '@entity.vx', 0],
                  ['set', '@entity.vy', 0],
                  ['set', '@entity.isGrounded', false],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Physics 2D' }],
                  ['render-ui', 'main', { type: 'card' }, { entity: 'Physics2DState' }],
                ],
              },
              {
                from: 'Frozen',
                to: 'Active',
                event: 'INIT',
                effects: [
                  ['fetch', 'Physics2DState'],
                  ['set', '@entity.vx', 0],
                  ['set', '@entity.vy', 0],
                  ['set', '@entity.isGrounded', false],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Physics 2D' }],
                  ['render-ui', 'main', { type: 'card' }, { entity: 'Physics2DState' }],
                ],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'APPLY_FORCE',
                effects: [
                  ['fetch', 'Physics2DState'],
                  ['set', '@entity.vx', ['+', '@entity.vx', '@payload.fx']],
                  ['set', '@entity.vy', ['+', '@entity.vy', '@payload.fy']],
                  ['render-ui', 'main', { type: 'card' }, { entity: 'Physics2DState' }],
                ],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'GROUND_HIT',
                effects: [
                  ['fetch', 'Physics2DState'],
                  ['set', '@entity.isGrounded', true],
                  ['set', '@entity.vy', 0],
                  ['set', '@entity.vx', ['*', '@entity.vx', '@entity.friction']],
                  ['render-ui', 'main', { type: 'card' }, { entity: 'Physics2DState' }],
                ],
              },
              {
                from: 'Active',
                to: 'Frozen',
                event: 'FREEZE',
                effects: [
                  ['fetch', 'Physics2DState'],
                  ['render-ui', 'main', { type: 'empty-state' }, { entity: 'Physics2DState' }],
                ],
              },
              {
                from: 'Frozen',
                to: 'Active',
                event: 'UNFREEZE',
                effects: [
                  ['fetch', 'Physics2DState'],
                  ['render-ui', 'main', { type: 'card' }, { entity: 'Physics2DState' }],
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'ApplyGravity',
              interval: 'frame',
              guard: ['and', ['=', '@state', 'Active'], ['not', '@entity.isGrounded']],
              effects: [
                ['set', '@entity.vy', ['math/min', '@entity.maxVelocityY', ['+', '@entity.vy', '@entity.gravity']]],
              ],
            },
            {
              name: 'ApplyVelocity',
              interval: 'frame',
              guard: ['=', '@state', 'Active'],
              effects: [
                ['set', '@entity.vx', ['*', '@entity.vx', '@entity.airResistance']],
                ['set', '@entity.x', ['+', '@entity.x', '@entity.vx']],
                ['set', '@entity.y', ['+', '@entity.y', '@entity.vy']],
              ],
            },
          ],
        },
      ],
      pages: [
        {
          name: 'PhysicsPage',
          path: '/physics',
          isInitial: true,
          traits: [{ ref: 'Physics2D' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-input - Unified Input State
// ============================================================================

/**
 * std-input - Manages keyboard and touch input state.
 *
 * Singleton behavior that tracks all input state.
 * Simplified to track last key pressed/released as strings
 * rather than mapping individual keys via conditionals.
 */
export const INPUT_BEHAVIOR: OrbitalSchema = {
  name: 'std-input',
  version: '1.0.0',
  description: 'Unified keyboard and touch input state management',
  orbitals: [
    {
      name: 'InputOrbital',
      entity: {
        name: 'InputState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'lastKeyDown', type: 'string', default: '' },
          { name: 'lastKeyUp', type: 'string', default: '' },
          { name: 'isActive', type: 'boolean', default: true },
        ],
      },
      traits: [
        {
          name: 'Input',
          linkedEntity: 'InputState',
          category: 'interaction',
          stateMachine: {
            states: [{ name: 'Ready', isInitial: true }],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'KEY_DOWN', name: 'Key Down', payloadSchema: [
                { name: 'key', type: 'string', required: true },
              ] },
              { key: 'KEY_UP', name: 'Key Up', payloadSchema: [
                { name: 'key', type: 'string', required: true },
              ] },
              { key: 'RESET', name: 'Reset' },
            ],
            transitions: [
              {
                from: 'Ready',
                to: 'Ready',
                event: 'INIT',
                effects: [
                  ['fetch', 'InputState'],
                  ['set', '@entity.lastKeyDown', ''],
                  ['set', '@entity.lastKeyUp', ''],
                  ['set', '@entity.isActive', true],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Input State' }],
                  ['render-ui', 'main', { type: 'card' }, { entity: 'InputState' }],
                ],
              },
              {
                from: 'Ready',
                to: 'Ready',
                event: 'KEY_DOWN',
                effects: [
                  ['fetch', 'InputState'],
                  ['set', '@entity.lastKeyDown', '@payload.key'],
                  ['render-ui', 'main', { type: 'card' }, { entity: 'InputState' }],
                ],
              },
              {
                from: 'Ready',
                to: 'Ready',
                event: 'KEY_UP',
                effects: [
                  ['fetch', 'InputState'],
                  ['set', '@entity.lastKeyUp', '@payload.key'],
                  ['render-ui', 'main', { type: 'card' }, { entity: 'InputState' }],
                ],
              },
              {
                from: 'Ready',
                to: 'Ready',
                event: 'RESET',
                effects: [
                  ['fetch', 'InputState'],
                  ['set', '@entity.lastKeyDown', ''],
                  ['set', '@entity.lastKeyUp', ''],
                  ['render-ui', 'main', { type: 'card' }, { entity: 'InputState' }],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'InputPage',
          path: '/input',
          isInitial: true,
          traits: [{ ref: 'Input' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-collision - Collision Detection & Response
// ============================================================================

/**
 * std-collision - Handles collision detection and response.
 *
 * Configures how an entity responds to collisions.
 * Uses a concrete CollisionState entity to track collision status.
 */
export const COLLISION_BEHAVIOR: OrbitalSchema = {
  name: 'std-collision',
  version: '1.0.0',
  description: 'Collision detection and response configuration',
  orbitals: [
    {
      name: 'CollisionOrbital',
      entity: {
        name: 'CollisionState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'isColliding', type: 'boolean', default: false },
          { name: 'lastCollisionId', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'Collision',
          linkedEntity: 'CollisionState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Active', isInitial: true },
              { name: 'Disabled' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'COLLISION', name: 'Collision', payloadSchema: [
                { name: 'entityId', type: 'string', required: true },
              ] },
              { key: 'CLEAR', name: 'Clear Collision' },
              { key: 'ENABLE', name: 'Enable' },
              { key: 'DISABLE', name: 'Disable' },
            ],
            transitions: [
              {
                from: 'Active',
                to: 'Active',
                event: 'INIT',
                effects: [
                  ['fetch', 'CollisionState'],
                  ['set', '@entity.isColliding', false],
                  ['set', '@entity.lastCollisionId', ''],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Collision Detection' }],
                  ['render-ui', 'main', { type: 'card' }, { entity: 'CollisionState' }],
                ],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'COLLISION',
                effects: [
                  ['fetch', 'CollisionState'],
                  ['set', '@entity.isColliding', true],
                  ['set', '@entity.lastCollisionId', '@payload.entityId'],
                  ['render-ui', 'main', { type: 'card' }, { entity: 'CollisionState' }],
                ],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'CLEAR',
                effects: [
                  ['fetch', 'CollisionState'],
                  ['set', '@entity.isColliding', false],
                  ['set', '@entity.lastCollisionId', ''],
                  ['render-ui', 'main', { type: 'card' }, { entity: 'CollisionState' }],
                ],
              },
              {
                from: 'Active',
                to: 'Disabled',
                event: 'DISABLE',
                effects: [
                  ['fetch', 'CollisionState'],
                  ['set', '@entity.isColliding', false],
                  ['set', '@entity.lastCollisionId', ''],
                  ['render-ui', 'main', { type: 'empty-state' }, { entity: 'CollisionState' }],
                ],
              },
              {
                from: 'Disabled',
                to: 'Active',
                event: 'ENABLE',
                effects: [
                  ['fetch', 'CollisionState'],
                  ['render-ui', 'main', { type: 'card' }, { entity: 'CollisionState' }],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'CollisionPage',
          path: '/collision',
          isInitial: true,
          traits: [{ ref: 'Collision' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Behaviors
// ============================================================================

export const GAME_CORE_BEHAVIORS: OrbitalSchema[] = [
  GAME_LOOP_BEHAVIOR,
  PHYSICS_2D_BEHAVIOR,
  INPUT_BEHAVIOR,
  COLLISION_BEHAVIOR,
];
