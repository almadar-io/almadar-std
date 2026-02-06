/**
 * Game Core Behaviors
 *
 * Foundation behaviors for game systems: loop, physics, input, collision.
 * Each behavior is a self-contained OrbitalSchema that can function as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { BehaviorSchema } from './types.js';

// ============================================================================
// std-gameloop - Master Game Tick Coordination
// ============================================================================

/**
 * std-gameloop - Coordinates game tick execution at 60fps.
 *
 * States: Running, Paused
 * Provides the master clock for all game systems.
 */
export const GAME_LOOP_BEHAVIOR: BehaviorSchema = {
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
                            { key: 'START', name: 'Start' },
                            { key: 'STOP', name: 'Stop' },
                            { key: 'PAUSE', name: 'Pause' },
                            { key: 'RESUME', name: 'Resume' },
                            { key: 'TICK', name: 'Tick' },
                        ],
                        transitions: [
                            {
                                from: 'Stopped',
                                to: 'Running',
                                event: 'START',
                                effects: [
                                    ['set', '@entity.frameCount', 0],
                                    ['set', '@entity.elapsedTime', 0],
                                ],
                            },
                            {
                                from: 'Running',
                                to: 'Paused',
                                event: 'PAUSE',
                                effects: [],
                            },
                            {
                                from: 'Paused',
                                to: 'Running',
                                event: 'RESUME',
                                effects: [],
                            },
                            {
                                from: 'Running',
                                to: 'Stopped',
                                event: 'STOP',
                                effects: [],
                            },
                            {
                                from: 'Paused',
                                to: 'Stopped',
                                event: 'STOP',
                                effects: [],
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
                                ['emit', 'GAME_TICK', { frame: '@entity.frameCount', delta: '@entity.deltaTime' }],
                            ],
                        },
                    ],
                },
            ],
            pages: [],
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
 */
export const PHYSICS_2D_BEHAVIOR: BehaviorSchema = {
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
                    { name: 'isGrounded', type: 'boolean', default: false },
                    // Config fields (previously @config bindings)
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
                            { key: 'APPLY_FORCE', name: 'Apply Force' },
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
                                    ['set', '@entity.vx', 0],
                                    ['set', '@entity.vy', 0],
                                    ['set', '@entity.isGrounded', false],
                                ],
                            },
                            {
                                from: 'Frozen',
                                to: 'Active',
                                event: 'INIT',
                                effects: [
                                    ['set', '@entity.vx', 0],
                                    ['set', '@entity.vy', 0],
                                    ['set', '@entity.isGrounded', false],
                                ],
                            },
                            {
                                from: 'Active',
                                to: 'Active',
                                event: 'APPLY_FORCE',
                                effects: [
                                    ['set', '@entity.vx', ['+', '@entity.vx', '@payload.fx']],
                                    ['set', '@entity.vy', ['+', '@entity.vy', '@payload.fy']],
                                ],
                            },
                            {
                                from: 'Active',
                                to: 'Active',
                                event: 'GROUND_HIT',
                                effects: [
                                    ['set', '@entity.isGrounded', true],
                                    ['set', '@entity.vy', 0],
                                    ['set', '@entity.vx', ['*', '@entity.vx', '@entity.friction']],
                                ],
                            },
                            {
                                from: 'Active',
                                to: 'Frozen',
                                event: 'FREEZE',
                                effects: [],
                            },
                            {
                                from: 'Frozen',
                                to: 'Active',
                                event: 'UNFREEZE',
                                effects: [],
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
            pages: [],
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
 */
export const INPUT_BEHAVIOR: BehaviorSchema = {
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
                    { name: 'left', type: 'boolean', default: false },
                    { name: 'right', type: 'boolean', default: false },
                    { name: 'up', type: 'boolean', default: false },
                    { name: 'down', type: 'boolean', default: false },
                    { name: 'jump', type: 'boolean', default: false },
                    { name: 'action', type: 'boolean', default: false },
                    { name: 'pause', type: 'boolean', default: false },
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
                            { key: 'KEY_DOWN', name: 'Key Down' },
                            { key: 'KEY_UP', name: 'Key Up' },
                            { key: 'TOUCH_START', name: 'Touch Start' },
                            { key: 'TOUCH_END', name: 'Touch End' },
                            { key: 'RESET', name: 'Reset' },
                        ],
                        transitions: [
                            {
                                from: 'Ready',
                                to: 'Ready',
                                event: 'KEY_DOWN',
                                effects: [
                                    ['if', ['or', ['=', '@payload.key', 'ArrowLeft'], ['=', '@payload.key', 'a']], ['set', '@entity.left', true]],
                                    ['if', ['or', ['=', '@payload.key', 'ArrowRight'], ['=', '@payload.key', 'd']], ['set', '@entity.right', true]],
                                    ['if', ['or', ['=', '@payload.key', 'ArrowUp'], ['=', '@payload.key', 'w']], ['set', '@entity.up', true]],
                                    ['if', ['or', ['=', '@payload.key', 'ArrowDown'], ['=', '@payload.key', 's']], ['set', '@entity.down', true]],
                                    ['if', ['=', '@payload.key', ' '], ['set', '@entity.jump', true]],
                                    ['if', ['or', ['=', '@payload.key', 'Enter'], ['=', '@payload.key', 'e']], ['set', '@entity.action', true]],
                                    ['if', ['or', ['=', '@payload.key', 'Escape'], ['=', '@payload.key', 'p']], ['set', '@entity.pause', true]],
                                ],
                            },
                            {
                                from: 'Ready',
                                to: 'Ready',
                                event: 'KEY_UP',
                                effects: [
                                    ['if', ['or', ['=', '@payload.key', 'ArrowLeft'], ['=', '@payload.key', 'a']], ['set', '@entity.left', false]],
                                    ['if', ['or', ['=', '@payload.key', 'ArrowRight'], ['=', '@payload.key', 'd']], ['set', '@entity.right', false]],
                                    ['if', ['or', ['=', '@payload.key', 'ArrowUp'], ['=', '@payload.key', 'w']], ['set', '@entity.up', false]],
                                    ['if', ['or', ['=', '@payload.key', 'ArrowDown'], ['=', '@payload.key', 's']], ['set', '@entity.down', false]],
                                    ['if', ['=', '@payload.key', ' '], ['set', '@entity.jump', false]],
                                    ['if', ['or', ['=', '@payload.key', 'Enter'], ['=', '@payload.key', 'e']], ['set', '@entity.action', false]],
                                    ['if', ['or', ['=', '@payload.key', 'Escape'], ['=', '@payload.key', 'p']], ['set', '@entity.pause', false]],
                                ],
                            },
                            {
                                from: 'Ready',
                                to: 'Ready',
                                event: 'RESET',
                                effects: [
                                    ['set', '@entity.left', false],
                                    ['set', '@entity.right', false],
                                    ['set', '@entity.up', false],
                                    ['set', '@entity.down', false],
                                    ['set', '@entity.jump', false],
                                    ['set', '@entity.action', false],
                                    ['set', '@entity.pause', false],
                                ],
                            },
                        ],
                    },
                },
            ],
            pages: [],
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
 */
export const COLLISION_BEHAVIOR: BehaviorSchema = {
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
                    { name: 'collidingWith', type: 'array', default: [] },
                    // Config fields (previously @config bindings)
                    { name: 'onCollision', type: 'string', default: null },
                    { name: 'onTrigger', type: 'string', default: null },
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
                            { key: 'COLLISION', name: 'Collision' },
                            { key: 'TRIGGER_ENTER', name: 'Trigger Enter' },
                            { key: 'TRIGGER_EXIT', name: 'Trigger Exit' },
                            { key: 'ENABLE', name: 'Enable' },
                            { key: 'DISABLE', name: 'Disable' },
                        ],
                        transitions: [
                            {
                                from: 'Active',
                                to: 'Active',
                                event: 'COLLISION',
                                effects: [
                                    ['set', '@entity.isColliding', true],
                                    ['set', '@entity.collidingWith', ['array/append', '@entity.collidingWith', '@payload.entityId']],
                                    ['if', '@entity.onCollision', ['emit', '@entity.onCollision', { entityId: '@payload.entityId', side: '@payload.side' }]],
                                ],
                            },
                            {
                                from: 'Active',
                                to: 'Active',
                                event: 'TRIGGER_ENTER',
                                effects: [
                                    ['if', '@entity.onTrigger', ['emit', '@entity.onTrigger', { entityId: '@payload.entityId', action: 'enter' }]],
                                ],
                            },
                            {
                                from: 'Active',
                                to: 'Active',
                                event: 'TRIGGER_EXIT',
                                effects: [
                                    ['set', '@entity.collidingWith', ['array/filter', '@entity.collidingWith', ['fn', 'id', ['!=', '@id', '@payload.entityId']]]],
                                    ['if', ['=', ['array/len', '@entity.collidingWith'], 0], ['set', '@entity.isColliding', false]],
                                ],
                            },
                            {
                                from: 'Active',
                                to: 'Disabled',
                                event: 'DISABLE',
                                effects: [
                                    ['set', '@entity.isColliding', false],
                                    ['set', '@entity.collidingWith', []],
                                ],
                            },
                            {
                                from: 'Disabled',
                                to: 'Active',
                                event: 'ENABLE',
                                effects: [],
                            },
                        ],
                    },
                },
            ],
            pages: [],
        },
    ],
};

// ============================================================================
// Export All Behaviors
// ============================================================================

export const GAME_CORE_BEHAVIORS: BehaviorSchema[] = [
    GAME_LOOP_BEHAVIOR,
    PHYSICS_2D_BEHAVIOR,
    INPUT_BEHAVIOR,
    COLLISION_BEHAVIOR,
];
