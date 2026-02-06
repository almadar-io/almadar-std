/**
 * Game Entity Behaviors
 *
 * Entity state behaviors: health, score, movement, combat, inventory.
 * Each behavior is a self-contained OrbitalSchema that can function as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { BehaviorSchema } from './types.js';

// ============================================================================
// std-health - Entity Health System
// ============================================================================

/**
 * std-health - Manages entity health with damage, healing, and death.
 *
 * States: Alive → Damaged → Dead
 */
export const HEALTH_BEHAVIOR: BehaviorSchema = {
    name: 'std-health',
    version: '1.0.0',
    description: 'Entity health with damage, healing, invulnerability, and death',
    orbitals: [
        {
            name: 'HealthOrbital',
            entity: {
                name: 'HealthState',
                persistence: 'runtime',
                fields: [
                    { name: 'id', type: 'string', required: true },
                    { name: 'currentHealth', type: 'number', default: 100 },
                    { name: 'maxHealth', type: 'number', default: 100 },
                    { name: 'isInvulnerable', type: 'boolean', default: false },
                    { name: 'lastDamageTime', type: 'number', default: 0 },
                    { name: 'invulnerabilityTime', type: 'number', default: 1000 },
                    { name: 'onDeath', type: 'string', default: null },
                ],
            },
            traits: [
                {
                    name: 'Health',
                    linkedEntity: 'HealthState',
                    category: 'interaction',
                    stateMachine: {
                        states: [
                            { name: 'Alive', isInitial: true },
                            { name: 'Damaged' },
                            { name: 'Invulnerable' },
                            { name: 'Dead', isTerminal: true },
                        ],
                        events: [
                            { key: 'INIT', name: 'Initialize' },
                            { key: 'DAMAGE', name: 'Damage' },
                            { key: 'HEAL', name: 'Heal' },
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
                                    ['set', '@entity.currentHealth', '@entity.maxHealth'],
                                    ['set', '@entity.isInvulnerable', false],
                                    ['render-ui', 'hud.health', {
                                        type: 'stats',
                                        title: 'Health',
                                        value: '@entity.currentHealth',
                                        max: '@entity.maxHealth',
                                    }],
                                ],
                            },
                            {
                                from: 'Alive',
                                to: 'Damaged',
                                event: 'DAMAGE',
                                guard: ['not', '@entity.isInvulnerable'],
                                effects: [
                                    ['set', '@entity.currentHealth', ['math/max', 0, ['-', '@entity.currentHealth', '@payload.amount']]],
                                    ['set', '@entity.lastDamageTime', '@now'],
                                    ['if', ['<=', '@entity.currentHealth', 0],
                                        ['emit', 'DIE'],
                                        ['do',
                                            ['set', '@entity.isInvulnerable', true]]],
                                ],
                            },
                            {
                                from: 'Damaged',
                                to: 'Alive',
                                event: 'INVULNERABILITY_END',
                                effects: [['set', '@entity.isInvulnerable', false]],
                            },
                            {
                                from: 'Invulnerable',
                                to: 'Alive',
                                event: 'INVULNERABILITY_END',
                                effects: [['set', '@entity.isInvulnerable', false]],
                            },
                            {
                                from: 'Alive',
                                to: 'Alive',
                                event: 'HEAL',
                                effects: [
                                    ['set', '@entity.currentHealth', ['math/min', '@entity.maxHealth', ['+', '@entity.currentHealth', '@payload.amount']]],
                                ],
                            },
                            {
                                from: 'Damaged',
                                to: 'Damaged',
                                event: 'HEAL',
                                effects: [
                                    ['set', '@entity.currentHealth', ['math/min', '@entity.maxHealth', ['+', '@entity.currentHealth', '@payload.amount']]],
                                ],
                            },
                            {
                                from: 'Alive',
                                to: 'Dead',
                                event: 'DIE',
                                effects: [
                                    ['set', '@entity.currentHealth', 0],
                                    ['if', '@entity.onDeath', ['emit', '@entity.onDeath', { entityId: '@entity.id' }]],
                                ],
                            },
                            {
                                from: 'Damaged',
                                to: 'Dead',
                                event: 'DIE',
                                effects: [
                                    ['set', '@entity.currentHealth', 0],
                                    ['if', '@entity.onDeath', ['emit', '@entity.onDeath', { entityId: '@entity.id' }]],
                                ],
                            },
                            {
                                from: 'Dead',
                                to: 'Alive',
                                event: 'RESPAWN',
                                effects: [['emit', 'INIT']],
                            },
                        ],
                    },
                    ticks: [
                        {
                            name: 'InvulnerabilityTimer',
                            interval: 'frame',
                            guard: ['and', '@entity.isInvulnerable', ['>', ['-', '@now', '@entity.lastDamageTime'], '@entity.invulnerabilityTime']],
                            effects: [['emit', 'INVULNERABILITY_END']],
                        },
                    ],
                },
            ],
            pages: [],
        },
    ],
};

// ============================================================================
// std-score - Points and Combo System
// ============================================================================

/**
 * std-score - Manages score with points, combos, and multipliers.
 */
export const SCORE_BEHAVIOR: BehaviorSchema = {
    name: 'std-score',
    version: '1.0.0',
    description: 'Score tracking with points, combos, and multipliers',
    orbitals: [
        {
            name: 'ScoreOrbital',
            entity: {
                name: 'ScoreState',
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
                    linkedEntity: 'ScoreState',
                    category: 'interaction',
                    stateMachine: {
                        states: [{ name: 'Active', isInitial: true }],
                        events: [
                            { key: 'INIT', name: 'Initialize' },
                            { key: 'ADD_POINTS', name: 'Add Points' },
                            { key: 'COMBO_HIT', name: 'Combo Hit' },
                            { key: 'COMBO_BREAK', name: 'Combo Break' },
                            { key: 'RESET', name: 'Reset' },
                            { key: 'SAVE_HIGH_SCORE', name: 'Save High Score' },
                        ],
                        transitions: [
                            {
                                from: 'Active',
                                to: 'Active',
                                event: 'INIT',
                                effects: [
                                    ['set', '@entity.currentScore', 0],
                                    ['set', '@entity.comboCount', 0],
                                    ['set', '@entity.multiplier', 1],
                                    ['render-ui', 'hud.score', {
                                        type: 'stats',
                                        title: 'Score',
                                        value: '@entity.currentScore',
                                        subtitle: 'High: @entity.highScore',
                                    }],
                                ],
                            },
                            {
                                from: 'Active',
                                to: 'Active',
                                event: 'ADD_POINTS',
                                effects: [
                                    ['set', '@entity.currentScore', ['+', '@entity.currentScore', ['*', '@payload.points', '@entity.multiplier']]],
                                    ['set', '@entity.lastScoreTime', '@now'],
                                ],
                            },
                            {
                                from: 'Active',
                                to: 'Active',
                                event: 'COMBO_HIT',
                                effects: [
                                    ['set', '@entity.comboCount', ['+', '@entity.comboCount', 1]],
                                    ['set', '@entity.multiplier', ['math/min', '@entity.maxMultiplier', ['+', 1, ['/', '@entity.comboCount', 5]]]],
                                    ['set', '@entity.lastScoreTime', '@now'],
                                ],
                            },
                            {
                                from: 'Active',
                                to: 'Active',
                                event: 'COMBO_BREAK',
                                effects: [
                                    ['set', '@entity.comboCount', 0],
                                    ['set', '@entity.multiplier', 1],
                                ],
                            },
                            {
                                from: 'Active',
                                to: 'Active',
                                event: 'RESET',
                                effects: [
                                    ['if', ['>', '@entity.currentScore', '@entity.highScore'],
                                        ['set', '@entity.highScore', '@entity.currentScore']],
                                    ['emit', 'INIT'],
                                ],
                            },
                            {
                                from: 'Active',
                                to: 'Active',
                                event: 'SAVE_HIGH_SCORE',
                                guard: ['>', '@entity.currentScore', '@entity.highScore'],
                                effects: [
                                    ['set', '@entity.highScore', '@entity.currentScore'],
                                    ['persist', 'save', 'HighScore', { score: '@entity.highScore' }],
                                ],
                            },
                        ],
                    },
                    ticks: [
                        {
                            name: 'ComboTimeout',
                            interval: 'frame',
                            guard: ['and', ['>', '@entity.comboCount', 0], ['>', ['-', '@now', '@entity.lastScoreTime'], '@entity.comboTimeWindow']],
                            effects: [['emit', 'COMBO_BREAK']],
                        },
                    ],
                },
            ],
            pages: [],
        },
    ],
};

// ============================================================================
// std-movement - Entity Position and Velocity
// ============================================================================

/**
 * std-movement - Basic movement for any entity.
 *
 * Handles position updates based on input or AI.
 */
export const MOVEMENT_BEHAVIOR: BehaviorSchema = {
    name: 'std-movement',
    version: '1.0.0',
    description: 'Entity movement with speed and direction',
    orbitals: [
        {
            name: 'MovementOrbital',
            entity: {
                name: 'MovementState',
                persistence: 'runtime',
                fields: [
                    { name: 'id', type: 'string', required: true },
                    { name: 'x', type: 'number', default: 0 },
                    { name: 'y', type: 'number', default: 0 },
                    { name: 'direction', type: 'number', default: 0 },
                    { name: 'facingRight', type: 'boolean', default: true },
                    { name: 'canJump', type: 'boolean', default: true },
                    { name: 'moveSpeed', type: 'number', default: 5 },
                    { name: 'jumpForce', type: 'number', default: -15 },
                ],
            },
            traits: [
                {
                    name: 'Movement',
                    linkedEntity: 'MovementState',
                    category: 'interaction',
                    stateMachine: {
                        states: [
                            { name: 'Idle', isInitial: true },
                            { name: 'Moving' },
                            { name: 'Jumping' },
                            { name: 'Falling' },
                        ],
                        events: [
                            { key: 'MOVE', name: 'Move' },
                            { key: 'STOP', name: 'Stop' },
                            { key: 'JUMP', name: 'Jump' },
                            { key: 'LAND', name: 'Land' },
                        ],
                        transitions: [
                            {
                                from: 'Idle',
                                to: 'Moving',
                                event: 'MOVE',
                                effects: [
                                    ['set', '@entity.direction', '@payload.direction'],
                                    ['if', ['>', '@payload.direction', 0], ['set', '@entity.facingRight', true]],
                                    ['if', ['<', '@payload.direction', 0], ['set', '@entity.facingRight', false]],
                                ],
                            },
                            {
                                from: 'Moving',
                                to: 'Moving',
                                event: 'MOVE',
                                effects: [
                                    ['set', '@entity.direction', '@payload.direction'],
                                    ['if', ['>', '@payload.direction', 0], ['set', '@entity.facingRight', true]],
                                    ['if', ['<', '@payload.direction', 0], ['set', '@entity.facingRight', false]],
                                ],
                            },
                            {
                                from: 'Moving',
                                to: 'Idle',
                                event: 'STOP',
                                effects: [['set', '@entity.direction', 0]],
                            },
                            {
                                from: 'Idle',
                                to: 'Jumping',
                                event: 'JUMP',
                                guard: '@entity.canJump',
                                effects: [
                                    ['set', '@entity.canJump', false],
                                    ['emit', 'APPLY_FORCE', { fx: 0, fy: '@entity.jumpForce' }],
                                ],
                            },
                            {
                                from: 'Moving',
                                to: 'Jumping',
                                event: 'JUMP',
                                guard: '@entity.canJump',
                                effects: [
                                    ['set', '@entity.canJump', false],
                                    ['emit', 'APPLY_FORCE', { fx: 0, fy: '@entity.jumpForce' }],
                                ],
                            },
                            {
                                from: 'Jumping',
                                to: 'Idle',
                                event: 'LAND',
                                effects: [
                                    ['set', '@entity.canJump', true],
                                    ['if', ['!=', '@entity.direction', 0], ['emit', 'MOVE', { direction: '@entity.direction' }]],
                                ],
                            },
                            {
                                from: 'Falling',
                                to: 'Idle',
                                event: 'LAND',
                                effects: [
                                    ['set', '@entity.canJump', true],
                                    ['if', ['!=', '@entity.direction', 0], ['emit', 'MOVE', { direction: '@entity.direction' }]],
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
            pages: [],
        },
    ],
};

// ============================================================================
// std-combat - Attack and Damage System
// ============================================================================

/**
 * std-combat - Handles attacks, cooldowns, and hit detection.
 */
export const COMBAT_BEHAVIOR: BehaviorSchema = {
    name: 'std-combat',
    version: '1.0.0',
    description: 'Combat system with attacks, cooldowns, and hitboxes',
    orbitals: [
        {
            name: 'CombatOrbital',
            entity: {
                name: 'CombatState',
                persistence: 'runtime',
                fields: [
                    { name: 'id', type: 'string', required: true },
                    { name: 'isAttacking', type: 'boolean', default: false },
                    { name: 'attackStartTime', type: 'number', default: 0 },
                    { name: 'hitEntities', type: 'array', default: [] },
                    { name: 'attackDamage', type: 'number', default: 10 },
                    { name: 'attackDuration', type: 'number', default: 300 },
                    { name: 'cooldownDuration', type: 'number', default: 500 },
                    { name: 'hitboxOffset', type: 'object', default: { x: 20, y: 0 } },
                    { name: 'hitboxSize', type: 'object', default: { width: 30, height: 30 } },
                ],
            },
            traits: [
                {
                    name: 'Combat',
                    linkedEntity: 'CombatState',
                    category: 'interaction',
                    stateMachine: {
                        states: [
                            { name: 'Ready', isInitial: true },
                            { name: 'Attacking' },
                            { name: 'Cooldown' },
                        ],
                        events: [
                            { key: 'ATTACK', name: 'Attack' },
                            { key: 'ATTACK_END', name: 'Attack End' },
                            { key: 'HIT_CONNECT', name: 'Hit Connect' },
                            { key: 'COOLDOWN_END', name: 'Cooldown End' },
                        ],
                        transitions: [
                            {
                                from: 'Ready',
                                to: 'Attacking',
                                event: 'ATTACK',
                                effects: [
                                    ['set', '@entity.isAttacking', true],
                                    ['set', '@entity.attackStartTime', '@now'],
                                    ['set', '@entity.hitEntities', []],
                                ],
                            },
                            {
                                from: 'Attacking',
                                to: 'Attacking',
                                event: 'HIT_CONNECT',
                                guard: ['not', ['array/includes', '@entity.hitEntities', '@payload.entityId']],
                                effects: [
                                    ['set', '@entity.hitEntities', ['array/append', '@entity.hitEntities', '@payload.entityId']],
                                    ['emit', 'DAMAGE', { target: '@payload.entityId', amount: '@entity.attackDamage' }],
                                ],
                            },
                            {
                                from: 'Attacking',
                                to: 'Cooldown',
                                event: 'ATTACK_END',
                                effects: [['set', '@entity.isAttacking', false]],
                            },
                            {
                                from: 'Cooldown',
                                to: 'Ready',
                                event: 'COOLDOWN_END',
                                effects: [],
                            },
                        ],
                    },
                    ticks: [
                        {
                            name: 'AttackDuration',
                            interval: 'frame',
                            guard: ['and', '@entity.isAttacking', ['>', ['-', '@now', '@entity.attackStartTime'], '@entity.attackDuration']],
                            effects: [['emit', 'ATTACK_END']],
                        },
                        {
                            name: 'CooldownTimer',
                            interval: 'frame',
                            guard: ['and', ['=', '@state', 'Cooldown'], ['>', ['-', '@now', '@entity.attackStartTime'], ['+', '@entity.attackDuration', '@entity.cooldownDuration']]],
                            effects: [['emit', 'COOLDOWN_END']],
                        },
                    ],
                },
            ],
            pages: [],
        },
    ],
};

// ============================================================================
// std-inventory - Item Collection and Management
// ============================================================================

/**
 * std-inventory - Manages collected items and equipment.
 */
export const INVENTORY_BEHAVIOR: BehaviorSchema = {
    name: 'std-inventory',
    version: '1.0.0',
    description: 'Item collection, storage, and usage',
    orbitals: [
        {
            name: 'InventoryOrbital',
            entity: {
                name: 'InventoryState',
                persistence: 'runtime',
                fields: [
                    { name: 'id', type: 'string', required: true },
                    { name: 'x', type: 'number', default: 0 },
                    { name: 'y', type: 'number', default: 0 },
                    { name: 'items', type: 'array', default: [] },
                    { name: 'selectedSlot', type: 'number', default: 0 },
                    { name: 'isOpen', type: 'boolean', default: false },
                    { name: 'equipped', type: 'object', default: {} },
                    { name: 'maxSlots', type: 'number', default: 20 },
                ],
            },
            traits: [
                {
                    name: 'Inventory',
                    linkedEntity: 'InventoryState',
                    category: 'interaction',
                    stateMachine: {
                        states: [
                            { name: 'Empty', isInitial: true },
                            { name: 'HasItems' },
                            { name: 'Full' },
                        ],
                        events: [
                            { key: 'COLLECT', name: 'Collect' },
                            { key: 'USE', name: 'Use' },
                            { key: 'DROP', name: 'Drop' },
                            { key: 'EQUIP', name: 'Equip' },
                            { key: 'UNEQUIP', name: 'Unequip' },
                            { key: 'OPEN', name: 'Open' },
                            { key: 'CLOSE', name: 'Close' },
                            { key: 'INVENTORY_EMPTY', name: 'Inventory Empty' },
                        ],
                        transitions: [
                            {
                                from: 'Empty',
                                to: 'HasItems',
                                event: 'COLLECT',
                                guard: ['<', ['array/len', '@entity.items'], '@entity.maxSlots'],
                                effects: [
                                    ['set', '@entity.items', ['array/append', '@entity.items', '@payload.item']],
                                    ['notify', { type: 'info', message: ['str/concat', 'Collected ', '@payload.item.name'] }],
                                ],
                            },
                            {
                                from: 'HasItems',
                                to: 'HasItems',
                                event: 'COLLECT',
                                guard: ['<', ['array/len', '@entity.items'], '@entity.maxSlots'],
                                effects: [
                                    ['set', '@entity.items', ['array/append', '@entity.items', '@payload.item']],
                                    ['notify', { type: 'info', message: ['str/concat', 'Collected ', '@payload.item.name'] }],
                                ],
                            },
                            {
                                from: 'HasItems',
                                to: 'HasItems',
                                event: 'USE',
                                effects: [
                                    ['let', [['item', ['array/nth', '@entity.items', '@payload.slot']]],
                                        ['if', '@item.onUse', ['emit', '@item.onUse', { item: '@item' }]],
                                        ['if', '@item.consumable',
                                            ['set', '@entity.items', ['array/filter', '@entity.items', ['fn', 'i', 'idx', ['!=', '@idx', '@payload.slot']]]]]],
                                    ['if', ['=', ['array/len', '@entity.items'], 0], ['emit', 'INVENTORY_EMPTY']],
                                ],
                            },
                            {
                                from: 'HasItems',
                                to: 'HasItems',
                                event: 'DROP',
                                effects: [
                                    ['let', [['item', ['array/nth', '@entity.items', '@payload.slot']]],
                                        ['set', '@entity.items', ['array/filter', '@entity.items', ['fn', 'i', 'idx', ['!=', '@idx', '@payload.slot']]]],
                                        ['emit', 'ITEM_DROPPED', { item: '@item', position: { x: '@entity.x', y: '@entity.y' } }]],
                                    ['if', ['=', ['array/len', '@entity.items'], 0], ['emit', 'INVENTORY_EMPTY']],
                                ],
                            },
                            {
                                from: 'HasItems',
                                to: 'Empty',
                                event: 'INVENTORY_EMPTY',
                                effects: [],
                            },
                            {
                                from: 'Empty',
                                to: 'Empty',
                                event: 'EQUIP',
                                effects: [
                                    ['set', '@entity.equipped', ['object/set', '@entity.equipped', '@payload.slot', '@payload.item']],
                                    ['emit', 'STATS_UPDATED', { equipped: '@entity.equipped' }],
                                ],
                            },
                            {
                                from: 'HasItems',
                                to: 'HasItems',
                                event: 'EQUIP',
                                effects: [
                                    ['set', '@entity.equipped', ['object/set', '@entity.equipped', '@payload.slot', '@payload.item']],
                                    ['emit', 'STATS_UPDATED', { equipped: '@entity.equipped' }],
                                ],
                            },
                            {
                                from: 'Empty',
                                to: 'Empty',
                                event: 'UNEQUIP',
                                effects: [
                                    ['set', '@entity.equipped', ['object/remove', '@entity.equipped', '@payload.slot']],
                                    ['emit', 'STATS_UPDATED', { equipped: '@entity.equipped' }],
                                ],
                            },
                            {
                                from: 'HasItems',
                                to: 'HasItems',
                                event: 'UNEQUIP',
                                effects: [
                                    ['set', '@entity.equipped', ['object/remove', '@entity.equipped', '@payload.slot']],
                                    ['emit', 'STATS_UPDATED', { equipped: '@entity.equipped' }],
                                ],
                            },
                            {
                                from: 'Empty',
                                to: 'Empty',
                                event: 'OPEN',
                                effects: [
                                    ['set', '@entity.isOpen', true],
                                    ['render-ui', 'overlay.inventory', {
                                        type: 'modal',
                                        title: 'Inventory',
                                        content: { items: '@entity.items', equipped: '@entity.equipped', maxSlots: '@entity.maxSlots' },
                                        actions: [{ event: 'CLOSE', label: 'Close' }],
                                    }],
                                ],
                            },
                            {
                                from: 'HasItems',
                                to: 'HasItems',
                                event: 'OPEN',
                                effects: [
                                    ['set', '@entity.isOpen', true],
                                    ['render-ui', 'overlay.inventory', {
                                        type: 'modal',
                                        title: 'Inventory',
                                        content: { items: '@entity.items', equipped: '@entity.equipped', maxSlots: '@entity.maxSlots' },
                                        actions: [{ event: 'CLOSE', label: 'Close' }],
                                    }],
                                ],
                            },
                            {
                                from: 'Empty',
                                to: 'Empty',
                                event: 'CLOSE',
                                effects: [['set', '@entity.isOpen', false]],
                            },
                            {
                                from: 'HasItems',
                                to: 'HasItems',
                                event: 'CLOSE',
                                effects: [['set', '@entity.isOpen', false]],
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

export const GAME_ENTITY_BEHAVIORS: BehaviorSchema[] = [
    HEALTH_BEHAVIOR,
    SCORE_BEHAVIOR,
    MOVEMENT_BEHAVIOR,
    COMBAT_BEHAVIOR,
    INVENTORY_BEHAVIOR,
];
