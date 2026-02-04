/**
 * Standard Behaviors Registry
 *
 * Combined registry of all Standard Behaviors with lookup functions.
 *
 * @packageDocumentation
 */
import { getBehaviorMetadata } from './types.js';
import { UI_INTERACTION_BEHAVIORS } from './ui-interaction.js';
import { DATA_MANAGEMENT_BEHAVIORS } from './data-management.js';
import { ASYNC_BEHAVIORS } from './async.js';
import { FEEDBACK_BEHAVIORS } from './feedback.js';
import { GAME_CORE_BEHAVIORS } from './game-core.js';
import { GAME_ENTITY_BEHAVIORS } from './game-entity.js';
import { GAME_UI_BEHAVIORS } from './game-ui.js';
// ============================================================================
// Combined Registry
// ============================================================================
/**
 * All Standard Behaviors combined into a single array.
 */
export const STANDARD_BEHAVIORS = [
    ...UI_INTERACTION_BEHAVIORS,
    ...DATA_MANAGEMENT_BEHAVIORS,
    ...ASYNC_BEHAVIORS,
    ...FEEDBACK_BEHAVIORS,
    ...GAME_CORE_BEHAVIORS,
    ...GAME_ENTITY_BEHAVIORS,
    ...GAME_UI_BEHAVIORS,
];
/**
 * Behavior registry indexed by name for fast lookup.
 */
export const BEHAVIOR_REGISTRY = STANDARD_BEHAVIORS.reduce((acc, behavior) => {
    acc[behavior.name] = behavior;
    return acc;
}, {});
/**
 * Behaviors grouped by category.
 */
export const BEHAVIORS_BY_CATEGORY = {
    'ui-interaction': UI_INTERACTION_BEHAVIORS,
    'data-management': DATA_MANAGEMENT_BEHAVIORS,
    'async': ASYNC_BEHAVIORS,
    'feedback': FEEDBACK_BEHAVIORS,
    'game-core': GAME_CORE_BEHAVIORS,
    'game-entity': GAME_ENTITY_BEHAVIORS,
    'game-ui': GAME_UI_BEHAVIORS,
};
// ============================================================================
// Lookup Functions
// ============================================================================
/**
 * Get a behavior by name.
 *
 * @param name - Behavior name (e.g., 'std/List')
 * @returns The behavior or undefined if not found
 */
export function getBehavior(name) {
    return BEHAVIOR_REGISTRY[name];
}
/**
 * Check if a behavior exists.
 *
 * @param name - Behavior name
 * @returns true if the behavior exists
 */
export function isKnownBehavior(name) {
    return name in BEHAVIOR_REGISTRY;
}
/**
 * Get all behaviors in a category.
 *
 * @param category - Behavior category
 * @returns Array of behaviors in that category
 */
export function getBehaviorsByCategory(category) {
    return BEHAVIORS_BY_CATEGORY[category] ?? [];
}
/**
 * Get all behavior names.
 *
 * @returns Array of all behavior names
 */
export function getAllBehaviorNames() {
    return Object.keys(BEHAVIOR_REGISTRY);
}
/**
 * Get all behaviors.
 *
 * @returns Array of all behaviors
 */
export function getAllBehaviors() {
    return STANDARD_BEHAVIORS;
}
/**
 * Get metadata for all behaviors (lightweight).
 *
 * @returns Array of behavior metadata
 */
export function getAllBehaviorMetadata() {
    return STANDARD_BEHAVIORS.map(getBehaviorMetadata);
}
/**
 * Find behaviors that match a use case.
 *
 * @param useCase - Use case description to match
 * @returns Array of matching behaviors
 */
export function findBehaviorsForUseCase(useCase) {
    const lowerUseCase = useCase.toLowerCase();
    return STANDARD_BEHAVIORS.filter((behavior) => behavior.suggestedFor?.some((suggestion) => suggestion.toLowerCase().includes(lowerUseCase) ||
        lowerUseCase.includes(suggestion.toLowerCase())) ?? false);
}
/**
 * Get behaviors that handle a specific event.
 *
 * @param event - Event name
 * @returns Array of behaviors that handle this event
 */
export function getBehaviorsForEvent(event) {
    return STANDARD_BEHAVIORS.filter((behavior) => {
        const events = behavior.stateMachine?.events || [];
        return events.some(e => (typeof e === 'string' ? e : e.key) === event);
    });
}
/**
 * Get behaviors that have a specific state.
 *
 * @param state - State name
 * @returns Array of behaviors that have this state
 */
export function getBehaviorsWithState(state) {
    return STANDARD_BEHAVIORS.filter((behavior) => {
        const states = behavior.stateMachine?.states || [];
        return states.some(s => (typeof s === 'string' ? s : s.name) === state);
    });
}
// ============================================================================
// Validation Functions
// ============================================================================
/**
 * Validate that a behavior reference is valid.
 *
 * @param name - Behavior name
 * @returns Error message if invalid, null if valid
 */
export function validateBehaviorReference(name) {
    if (!name.startsWith('std/')) {
        return `Behavior name must start with 'std/': ${name}`;
    }
    if (!isKnownBehavior(name)) {
        const suggestions = findSimilarBehaviors(name);
        if (suggestions.length > 0) {
            return `Unknown behavior '${name}'. Did you mean: ${suggestions.join(', ')}?`;
        }
        return `Unknown behavior: ${name}`;
    }
    return null;
}
/**
 * Find behaviors with similar names (for suggestions).
 *
 * @param name - Input name
 * @returns Array of similar behavior names
 */
function findSimilarBehaviors(name) {
    const normalizedInput = name.toLowerCase().replace('std/', '');
    return getAllBehaviorNames().filter((behaviorName) => {
        const normalizedBehavior = behaviorName.toLowerCase().replace('std/', '');
        return (normalizedBehavior.includes(normalizedInput) ||
            normalizedInput.includes(normalizedBehavior) ||
            levenshteinDistance(normalizedInput, normalizedBehavior) <= 3);
    });
}
/**
 * Simple Levenshtein distance for string similarity.
 */
function levenshteinDistance(a, b) {
    if (a.length === 0)
        return b.length;
    if (b.length === 0)
        return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            }
            else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[b.length][a.length];
}
// ============================================================================
// Statistics
// ============================================================================
/**
 * Get statistics about the behavior library.
 */
export function getBehaviorLibraryStats() {
    const byCategory = {};
    let totalStates = 0;
    let totalEvents = 0;
    let totalTransitions = 0;
    let totalTicks = 0;
    for (const behavior of STANDARD_BEHAVIORS) {
        byCategory[behavior.category] = (byCategory[behavior.category] ?? 0) + 1;
        const sm = behavior.stateMachine;
        if (sm) {
            totalStates += (sm.states || []).length;
            totalEvents += (sm.events || []).length;
            totalTransitions += (sm.transitions || []).length;
        }
        totalTicks += (behavior.ticks || []).length;
    }
    return {
        totalBehaviors: STANDARD_BEHAVIORS.length,
        byCategory,
        totalStates,
        totalEvents,
        totalTransitions,
        totalTicks,
    };
}
