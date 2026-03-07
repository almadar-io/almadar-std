/**
 * Game Entity Behaviors
 *
 * Entity state behaviors: health, score, movement, combat, inventory.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from './types.js';

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
                  ['fetch', 'HealthState'],
                  ['set', '@entity.currentHealth', '@entity.maxHealth'],
                  ['set', '@entity.isInvulnerable', false],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'HealthState',
                  }],
                ],
              },
              {
                from: 'Alive',
                to: 'Damaged',
                event: 'DAMAGE',
                guard: ['not', '@entity.isInvulnerable'],
                effects: [
                  ['fetch', 'HealthState'],
                  ['set', '@entity.currentHealth', ['math/max', 0, ['-', '@entity.currentHealth', '@payload.amount']]],
                  ['set', '@entity.lastDamageTime', '@now'],
                  ['set', '@entity.isInvulnerable', true],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'HealthState',
                  }],
                ],
              },
              {
                from: 'Damaged',
                to: 'Dead',
                event: 'DAMAGE',
                guard: ['<=', '@entity.currentHealth', 0],
                effects: [
                  ['fetch', 'HealthState'],
                  ['set', '@entity.currentHealth', 0],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'HealthState',
                  }],
                ],
              },
              {
                from: 'Damaged',
                to: 'Damaged',
                event: 'DAMAGE',
                guard: ['and', ['not', '@entity.isInvulnerable'], ['>', '@entity.currentHealth', 0]],
                effects: [
                  ['fetch', 'HealthState'],
                  ['set', '@entity.currentHealth', ['math/max', 0, ['-', '@entity.currentHealth', '@payload.amount']]],
                  ['set', '@entity.lastDamageTime', '@now'],
                  ['set', '@entity.isInvulnerable', true],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'HealthState',
                  }],
                ],
              },
              {
                from: 'Damaged',
                to: 'Alive',
                event: 'INVULNERABILITY_END',
                effects: [
                  ['fetch', 'HealthState'],
                  ['set', '@entity.isInvulnerable', false],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'HealthState',
                  }],
                ],
              },
              {
                from: 'Alive',
                to: 'Alive',
                event: 'HEAL',
                effects: [
                  ['fetch', 'HealthState'],
                  ['set', '@entity.currentHealth', ['math/min', '@entity.maxHealth', ['+', '@entity.currentHealth', '@payload.amount']]],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'HealthState',
                  }],
                ],
              },
              {
                from: 'Damaged',
                to: 'Damaged',
                event: 'HEAL',
                effects: [
                  ['fetch', 'HealthState'],
                  ['set', '@entity.currentHealth', ['math/min', '@entity.maxHealth', ['+', '@entity.currentHealth', '@payload.amount']]],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'HealthState',
                  }],
                ],
              },
              {
                from: 'Alive',
                to: 'Dead',
                event: 'DIE',
                effects: [
                  ['fetch', 'HealthState'],
                  ['set', '@entity.currentHealth', 0],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'HealthState',
                  }],
                ],
              },
              {
                from: 'Damaged',
                to: 'Dead',
                event: 'DIE',
                effects: [
                  ['fetch', 'HealthState'],
                  ['set', '@entity.currentHealth', 0],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'HealthState',
                  }],
                ],
              },
              {
                from: 'Dead',
                to: 'Alive',
                event: 'RESPAWN',
                effects: [
                  ['fetch', 'HealthState'],
                  ['set', '@entity.currentHealth', '@entity.maxHealth'],
                  ['set', '@entity.isInvulnerable', false],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'HealthState',
                  }],
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
                  ['fetch', 'ScoreState'],
                  ['set', '@entity.currentScore', 0],
                  ['set', '@entity.comboCount', 0],
                  ['set', '@entity.multiplier', 1],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'ScoreState',
                  }],
                ],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'ADD_POINTS',
                effects: [
                  ['fetch', 'ScoreState'],
                  ['set', '@entity.currentScore', ['+', '@entity.currentScore', ['*', '@payload.points', '@entity.multiplier']]],
                  ['set', '@entity.lastScoreTime', '@now'],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'ScoreState',
                  }],
                ],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'COMBO_HIT',
                effects: [
                  ['fetch', 'ScoreState'],
                  ['set', '@entity.comboCount', ['+', '@entity.comboCount', 1]],
                  ['set', '@entity.multiplier', ['math/min', '@entity.maxMultiplier', ['+', 1, ['/', '@entity.comboCount', 5]]]],
                  ['set', '@entity.lastScoreTime', '@now'],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'ScoreState',
                  }],
                ],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'COMBO_BREAK',
                effects: [
                  ['fetch', 'ScoreState'],
                  ['set', '@entity.comboCount', 0],
                  ['set', '@entity.multiplier', 1],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'ScoreState',
                  }],
                ],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'RESET',
                guard: ['>', '@entity.currentScore', '@entity.highScore'],
                effects: [
                  ['fetch', 'ScoreState'],
                  ['set', '@entity.highScore', '@entity.currentScore'],
                  ['set', '@entity.currentScore', 0],
                  ['set', '@entity.comboCount', 0],
                  ['set', '@entity.multiplier', 1],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'ScoreState',
                  }],
                ],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'RESET',
                guard: ['<=', '@entity.currentScore', '@entity.highScore'],
                effects: [
                  ['fetch', 'ScoreState'],
                  ['set', '@entity.currentScore', 0],
                  ['set', '@entity.comboCount', 0],
                  ['set', '@entity.multiplier', 1],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'ScoreState',
                  }],
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
          { name: 'jumpForce', type: 'number', default: 15 },
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
                  ['fetch', 'MovementState'],
                  ['set', '@entity.x', 0],
                  ['set', '@entity.y', 0],
                  ['set', '@entity.direction', 0],
                  ['set', '@entity.facingRight', true],
                  ['set', '@entity.canJump', true],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'MovementState',
                  }],
                ],
              },
              {
                from: 'Idle',
                to: 'Moving',
                event: 'MOVE_RIGHT',
                effects: [
                  ['fetch', 'MovementState'],
                  ['set', '@entity.direction', 1],
                  ['set', '@entity.facingRight', true],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'MovementState',
                  }],
                ],
              },
              {
                from: 'Idle',
                to: 'Moving',
                event: 'MOVE_LEFT',
                effects: [
                  ['fetch', 'MovementState'],
                  ['set', '@entity.direction', -1],
                  ['set', '@entity.facingRight', false],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'MovementState',
                  }],
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
                  ['fetch', 'MovementState'],
                  ['set', '@entity.direction', 0],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'MovementState',
                  }],
                ],
              },
              {
                from: 'Idle',
                to: 'Jumping',
                event: 'JUMP',
                guard: '@entity.canJump',
                effects: [
                  ['fetch', 'MovementState'],
                  ['set', '@entity.canJump', false],
                  ['set', '@entity.y', ['-', '@entity.y', '@entity.jumpForce']],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'MovementState',
                  }],
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
                  ['fetch', 'MovementState'],
                  ['set', '@entity.canJump', true],
                  ['set', '@entity.direction', 0],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'MovementState',
                  }],
                ],
              },
              {
                from: 'Falling',
                to: 'Idle',
                event: 'LAND',
                effects: [
                  ['fetch', 'MovementState'],
                  ['set', '@entity.canJump', true],
                  ['set', '@entity.direction', 0],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'MovementState',
                  }],
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
      entity: {
        name: 'CombatState',
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
          linkedEntity: 'CombatState',
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
                  ['fetch', 'CombatState'],
                  ['set', '@entity.isAttacking', false],
                  ['set', '@entity.hitCount', 0],
                  ['set', '@entity.attackStartTime', 0],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'CombatState',
                  }],
                ],
              },
              {
                from: 'Ready',
                to: 'Attacking',
                event: 'ATTACK',
                effects: [
                  ['fetch', 'CombatState'],
                  ['set', '@entity.isAttacking', true],
                  ['set', '@entity.attackStartTime', '@now'],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'CombatState',
                  }],
                ],
              },
              {
                from: 'Attacking',
                to: 'Cooldown',
                event: 'ATTACK_END',
                effects: [
                  ['fetch', 'CombatState'],
                  ['set', '@entity.isAttacking', false],
                  ['set', '@entity.hitCount', ['+', '@entity.hitCount', 1]],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'CombatState',
                  }],
                ],
              },
              {
                from: 'Cooldown',
                to: 'Ready',
                event: 'COOLDOWN_END',
                effects: [
                  ['fetch', 'CombatState'],
                  ['render-ui', 'main', { type: 'stats', 
                    entity: 'CombatState',
                  }],
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Inventory' }],
                  ['render-ui', 'main', { type: 'entity-cards', 
                    entity: 'InventoryItem',
                    itemActions: [
                      { label: 'Select', event: 'SELECT' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'SELECT',
                effects: [
                  ['fetch', 'InventoryItem'],
                  ['render-ui', 'main', { type: 'detail-panel', 
                    entity: 'InventoryItem',
                  }],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'BACK',
                effects: [
                  ['fetch', 'InventoryItem'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Inventory' }],
                  ['render-ui', 'main', { type: 'entity-cards', 
                    entity: 'InventoryItem',
                    itemActions: [
                      { label: 'Select', event: 'SELECT' },
                    ],
                  }],
                ],
              },
              {
                from: 'viewing',
                to: 'viewing',
                event: 'EQUIP',
                effects: [
                  ['fetch', 'InventoryItem'],
                  ['set', '@entity.isEquipped', true],
                  ['render-ui', 'main', { type: 'detail-panel', 
                    entity: 'InventoryItem',
                  }],
                ],
              },
              {
                from: 'viewing',
                to: 'viewing',
                event: 'UNEQUIP',
                effects: [
                  ['fetch', 'InventoryItem'],
                  ['set', '@entity.isEquipped', false],
                  ['render-ui', 'main', { type: 'detail-panel', 
                    entity: 'InventoryItem',
                  }],
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
