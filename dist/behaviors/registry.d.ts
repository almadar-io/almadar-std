/**
 * Standard Behaviors Registry
 *
 * Combined registry of all Standard Behaviors with lookup functions.
 *
 * @packageDocumentation
 */
import type { StandardBehavior, BehaviorMetadata, BehaviorCategory } from './types.js';
/**
 * All Standard Behaviors combined into a single array.
 */
export declare const STANDARD_BEHAVIORS: StandardBehavior[];
/**
 * Behavior registry indexed by name for fast lookup.
 */
export declare const BEHAVIOR_REGISTRY: Record<string, StandardBehavior>;
/**
 * Behaviors grouped by category.
 */
export declare const BEHAVIORS_BY_CATEGORY: Record<BehaviorCategory, StandardBehavior[]>;
/**
 * Get a behavior by name.
 *
 * @param name - Behavior name (e.g., 'std/List')
 * @returns The behavior or undefined if not found
 */
export declare function getBehavior(name: string): StandardBehavior | undefined;
/**
 * Check if a behavior exists.
 *
 * @param name - Behavior name
 * @returns true if the behavior exists
 */
export declare function isKnownBehavior(name: string): boolean;
/**
 * Get all behaviors in a category.
 *
 * @param category - Behavior category
 * @returns Array of behaviors in that category
 */
export declare function getBehaviorsByCategory(category: BehaviorCategory): StandardBehavior[];
/**
 * Get all behavior names.
 *
 * @returns Array of all behavior names
 */
export declare function getAllBehaviorNames(): string[];
/**
 * Get all behaviors.
 *
 * @returns Array of all behaviors
 */
export declare function getAllBehaviors(): StandardBehavior[];
/**
 * Get metadata for all behaviors (lightweight).
 *
 * @returns Array of behavior metadata
 */
export declare function getAllBehaviorMetadata(): BehaviorMetadata[];
/**
 * Find behaviors that match a use case.
 *
 * @param useCase - Use case description to match
 * @returns Array of matching behaviors
 */
export declare function findBehaviorsForUseCase(useCase: string): StandardBehavior[];
/**
 * Get behaviors that handle a specific event.
 *
 * @param event - Event name
 * @returns Array of behaviors that handle this event
 */
export declare function getBehaviorsForEvent(event: string): StandardBehavior[];
/**
 * Get behaviors that have a specific state.
 *
 * @param state - State name
 * @returns Array of behaviors that have this state
 */
export declare function getBehaviorsWithState(state: string): StandardBehavior[];
/**
 * Validate that a behavior reference is valid.
 *
 * @param name - Behavior name
 * @returns Error message if invalid, null if valid
 */
export declare function validateBehaviorReference(name: string): string | null;
/**
 * Get statistics about the behavior library.
 */
export declare function getBehaviorLibraryStats(): {
    totalBehaviors: number;
    byCategory: Record<string, number>;
    totalStates: number;
    totalEvents: number;
    totalTransitions: number;
    totalTicks: number;
};
