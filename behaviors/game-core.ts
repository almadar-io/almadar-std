/**
 * Game Core Behaviors
 *
 * Foundation behaviors for game systems: loop, physics, input, collision.
 * These use the Trait architecture with stateMachine and ticks.
 *
 * @packageDocumentation
 */

import type { BehaviorTrait } from './types.js';

// ============================================================================
// std/GameLoop - Master Game Tick Coordination
// ============================================================================

/**
 * std/GameLoop - Coordinates game tick execution at 60fps.
 *
 * States: Running, Paused
 * Provides the master clock for all game systems.
 */
export const GAME_LOOP_BEHAVIOR: BehaviorTrait = {
    name: 'std/GameLoop',
    description: 'Master game loop coordinator running at 60fps',

    dataEntities: [
        {
            name: 'GameLoopState',
            runtime: true,
            singleton: true,
            fields: [
                { name: 'frameCount', type: 'number', default: 0 },
                { name: 'deltaTime', type: 'number', default: 16 },
                { name: 'elapsedTime', type: 'number', default: 0 },
            ],
        },
    ],

    stateMachine: {
        states: [
            { name: 'Stopped', isInitial: true },
            { name: 'Running' },
            { name: 'Paused' },
        ],
        events: [
            { key: 'START', name: 'START' },
            { key: 'STOP', name: 'STOP' },
            { key: 'PAUSE', name: 'PAUSE' },
            { key: 'RESUME', name: 'RESUME' },
            { key: 'TICK', name: 'TICK' },
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

};

// ============================================================================
// std/Physics2D - Gravity and Velocity
// ============================================================================

/**
 * std/Physics2D - 2D physics with gravity, velocity, and friction.
 *
 * Applied to entities that need physics simulation.
 */
export const PHYSICS_2D_BEHAVIOR: BehaviorTrait = {
    name: 'std/Physics2D',
    description: '2D physics with gravity, velocity, and friction',

    requiredFields: [
        { name: 'x', type: 'number', description: 'Entity X position' },
        { name: 'y', type: 'number', description: 'Entity Y position' },
    ],

    dataEntities: [
        {
            name: 'Physics2DState',
            runtime: true,
            fields: [
                { name: 'vx', type: 'number', default: 0 },
                { name: 'vy', type: 'number', default: 0 },
                { name: 'isGrounded', type: 'boolean', default: false },
            ],
        },
    ],

    stateMachine: {
        states: [
            { name: 'Active', isInitial: true },
            { name: 'Frozen' },
        ],
        events: [
            { key: 'INIT', name: 'INIT' },
            { key: 'APPLY_FORCE', name: 'APPLY_FORCE' },
            { key: 'GROUND_HIT', name: 'GROUND_HIT' },
            { key: 'FREEZE', name: 'FREEZE' },
            { key: 'UNFREEZE', name: 'UNFREEZE' },
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
                    ['set', '@entity.vx', ['*', '@entity.vx', '@config.friction']],
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
                ['set', '@entity.vy', ['math/min', '@config.maxVelocityY', ['+', '@entity.vy', '@config.gravity']]],
            ],
        },
        {
            name: 'ApplyVelocity',
            interval: 'frame',
            guard: ['=', '@state', 'Active'],
            effects: [
                ['set', '@entity.vx', ['*', '@entity.vx', '@config.airResistance']],
                ['set', '@entity.x', ['+', '@entity.x', '@entity.vx']],
                ['set', '@entity.y', ['+', '@entity.y', '@entity.vy']],
            ],
        },
    ],

};

// ============================================================================
// std/Input - Unified Input State
// ============================================================================

/**
 * std/Input - Manages keyboard and touch input state.
 *
 * Singleton behavior that tracks all input state.
 */
export const INPUT_BEHAVIOR: BehaviorTrait = {
    name: 'std/Input',
    description: 'Unified keyboard and touch input state management',

    dataEntities: [
        {
            name: 'InputState',
            runtime: true,
            singleton: true,
            fields: [
                { name: 'left', type: 'boolean', default: false },
                { name: 'right', type: 'boolean', default: false },
                { name: 'up', type: 'boolean', default: false },
                { name: 'down', type: 'boolean', default: false },
                { name: 'jump', type: 'boolean', default: false },
                { name: 'action', type: 'boolean', default: false },
                { name: 'pause', type: 'boolean', default: false },
            ],
        },
    ],

    stateMachine: {
        states: [
            { name: 'Ready', isInitial: true },
        ],
        events: [
            { key: 'KEY_DOWN', name: 'KEY_DOWN' },
            { key: 'KEY_UP', name: 'KEY_UP' },
            { key: 'TOUCH_START', name: 'TOUCH_START' },
            { key: 'TOUCH_END', name: 'TOUCH_END' },
            { key: 'RESET', name: 'RESET' },
        ],
        transitions: [
            {
                from: 'Ready',
                to: 'Ready',
                event: 'KEY_DOWN',
                effects: [
                    ['if', ['or', ['=', '@payload.key', 'ArrowLeft'], ['=', '@payload.key', 'a']],
                        ['set', '@entity.left', true]],
                    ['if', ['or', ['=', '@payload.key', 'ArrowRight'], ['=', '@payload.key', 'd']],
                        ['set', '@entity.right', true]],
                    ['if', ['or', ['=', '@payload.key', 'ArrowUp'], ['=', '@payload.key', 'w']],
                        ['set', '@entity.up', true]],
                    ['if', ['or', ['=', '@payload.key', 'ArrowDown'], ['=', '@payload.key', 's']],
                        ['set', '@entity.down', true]],
                    ['if', ['=', '@payload.key', ' '],
                        ['set', '@entity.jump', true]],
                    ['if', ['or', ['=', '@payload.key', 'Enter'], ['=', '@payload.key', 'e']],
                        ['set', '@entity.action', true]],
                    ['if', ['or', ['=', '@payload.key', 'Escape'], ['=', '@payload.key', 'p']],
                        ['set', '@entity.pause', true]],
                ],
            },
            {
                from: 'Ready',
                to: 'Ready',
                event: 'KEY_UP',
                effects: [
                    ['if', ['or', ['=', '@payload.key', 'ArrowLeft'], ['=', '@payload.key', 'a']],
                        ['set', '@entity.left', false]],
                    ['if', ['or', ['=', '@payload.key', 'ArrowRight'], ['=', '@payload.key', 'd']],
                        ['set', '@entity.right', false]],
                    ['if', ['or', ['=', '@payload.key', 'ArrowUp'], ['=', '@payload.key', 'w']],
                        ['set', '@entity.up', false]],
                    ['if', ['or', ['=', '@payload.key', 'ArrowDown'], ['=', '@payload.key', 's']],
                        ['set', '@entity.down', false]],
                    ['if', ['=', '@payload.key', ' '],
                        ['set', '@entity.jump', false]],
                    ['if', ['or', ['=', '@payload.key', 'Enter'], ['=', '@payload.key', 'e']],
                        ['set', '@entity.action', false]],
                    ['if', ['or', ['=', '@payload.key', 'Escape'], ['=', '@payload.key', 'p']],
                        ['set', '@entity.pause', false]],
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

};

// ============================================================================
// std/Collision - Collision Detection & Response
// ============================================================================

/**
 * std/Collision - Handles collision detection and response.
 *
 * Configures how an entity responds to collisions.
 */
export const COLLISION_BEHAVIOR: BehaviorTrait = {
    name: 'std/Collision',
    description: 'Collision detection and response configuration',

    dataEntities: [
        {
            name: 'CollisionState',
            runtime: true,
            fields: [
                { name: 'isColliding', type: 'boolean', default: false },
                { name: 'collidingWith', type: 'array', default: [] },
            ],
        },
    ],

    stateMachine: {
        states: [
            { name: 'Active', isInitial: true },
            { name: 'Disabled' },
        ],
        events: [
            { key: 'COLLISION', name: 'COLLISION' },
            { key: 'TRIGGER_ENTER', name: 'TRIGGER_ENTER' },
            { key: 'TRIGGER_EXIT', name: 'TRIGGER_EXIT' },
            { key: 'ENABLE', name: 'ENABLE' },
            { key: 'DISABLE', name: 'DISABLE' },
        ],
        transitions: [
            {
                from: 'Active',
                to: 'Active',
                event: 'COLLISION',
                effects: [
                    ['set', '@entity.isColliding', true],
                    ['set', '@entity.collidingWith', ['array/append', '@entity.collidingWith', '@payload.entityId']],
                    ['if', '@config.onCollision',
                        ['emit', '@config.onCollision', { entityId: '@payload.entityId', side: '@payload.side' }]],
                ],
            },
            {
                from: 'Active',
                to: 'Active',
                event: 'TRIGGER_ENTER',
                effects: [
                    ['if', '@config.onTrigger',
                        ['emit', '@config.onTrigger', { entityId: '@payload.entityId', action: 'enter' }]],
                ],
            },
            {
                from: 'Active',
                to: 'Active',
                event: 'TRIGGER_EXIT',
                effects: [
                    ['set', '@entity.collidingWith', ['array/filter', '@entity.collidingWith', ['fn', 'id', ['!=', '@id', '@payload.entityId']]]],
                    ['if', ['=', ['array/len', '@entity.collidingWith'], 0],
                        ['set', '@entity.isColliding', false]],
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

};

// ============================================================================
// Export All Behaviors
// ============================================================================

export const GAME_CORE_BEHAVIORS: BehaviorTrait[] = [
    GAME_LOOP_BEHAVIOR,
    PHYSICS_2D_BEHAVIOR,
    INPUT_BEHAVIOR,
    COLLISION_BEHAVIOR,
];
