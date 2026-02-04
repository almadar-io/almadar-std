/**
 * Game Entity Behaviors
 *
 * Entity state behaviors: health, score, movement, combat, inventory.
 * These use the Trait architecture with stateMachine and ticks.
 *
 * @packageDocumentation
 */
import type { StandardBehavior } from './types.js';
/**
 * std/Health - Manages entity health with damage, healing, and death.
 *
 * States: Alive → Damaged → Dead
 */
export declare const HEALTH_BEHAVIOR: StandardBehavior;
/**
 * std/Score - Manages score with points, combos, and multipliers.
 */
export declare const SCORE_BEHAVIOR: StandardBehavior;
/**
 * std/Movement - Basic movement for any entity.
 *
 * Handles position updates based on input or AI.
 */
export declare const MOVEMENT_BEHAVIOR: StandardBehavior;
/**
 * std/Combat - Handles attacks, cooldowns, and hit detection.
 */
export declare const COMBAT_BEHAVIOR: StandardBehavior;
/**
 * std/Inventory - Manages collected items and equipment.
 */
export declare const INVENTORY_BEHAVIOR: StandardBehavior;
export declare const GAME_ENTITY_BEHAVIORS: StandardBehavior[];
