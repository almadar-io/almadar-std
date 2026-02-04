/**
 * Standard Behaviors Types
 *
 * Standard Behaviors are reusable Traits with a `std/` naming convention.
 * They use a more flexible state machine format optimized for authoring.
 *
 * ARCHITECTURE: Behaviors ARE Traits conceptually. They use:
 * - stateMachine: BehaviorStateMachine (flexible states, events, transitions)
 * - ticks: BehaviorTick[] (frame-by-frame execution for games)
 * - dataEntities: BehaviorDataEntity[] (runtime state)
 *
 * @packageDocumentation
 */
// ============================================================================
// Behavior Categories
// ============================================================================
/**
 * Categories of Standard Behaviors
 */
export const BEHAVIOR_CATEGORIES = [
    'ui-interaction', // User interface state management
    'data-management', // Data operations and state
    'async', // Asynchronous workflows
    'feedback', // User feedback and confirmations
    'game-core', // Game loop and systems
    'game-entity', // Game entity behaviors
    'game-ui', // Game interface
];
// ============================================================================
// Helper Functions
// ============================================================================
export function isBehaviorCategory(value) {
    return BEHAVIOR_CATEGORIES.includes(value);
}
export function isGameBehaviorCategory(category) {
    return category.startsWith('game-');
}
/**
 * Extract metadata from a StandardBehavior
 */
export function getBehaviorMetadata(behavior) {
    const sm = behavior.stateMachine;
    const states = (sm?.states || []).map(s => typeof s === 'string' ? s : s.name);
    const events = (sm?.events || []).map(e => typeof e === 'string' ? e : e.key);
    return {
        name: behavior.name,
        category: behavior.category,
        description: behavior.description || '',
        suggestedFor: behavior.suggestedFor || [],
        states,
        events,
        tickCount: behavior.ticks?.length || 0,
        transitionCount: sm?.transitions?.length || 0,
        hasDataEntities: (behavior.dataEntities?.length || 0) > 0,
    };
}
/**
 * Validate behavior structure
 */
export function validateBehaviorStructure(behavior) {
    const errors = [];
    if (!behavior.name) {
        errors.push('Behavior must have a name');
    }
    if (!behavior.name.startsWith('std/')) {
        errors.push(`Behavior name should start with 'std/' (got: ${behavior.name})`);
    }
    if (!behavior.category) {
        errors.push('Behavior must have a category');
    }
    if (!isBehaviorCategory(behavior.category)) {
        errors.push(`Invalid category: ${behavior.category}`);
    }
    const sm = behavior.stateMachine;
    if (sm) {
        if (!sm.states || sm.states.length === 0) {
            errors.push('State machine must have at least one state');
        }
        if (!sm.initial) {
            errors.push('State machine must have an initial state');
        }
    }
    return errors;
}
/**
 * Validate behavior events match transitions
 */
export function validateBehaviorEvents(behavior) {
    const errors = [];
    const sm = behavior.stateMachine;
    if (!sm)
        return errors;
    const declaredEvents = new Set((sm.events || []).map(e => typeof e === 'string' ? e : e.key));
    const transitionEvents = new Set((sm.transitions || []).map(t => t.event));
    for (const event of transitionEvents) {
        if (event && !declaredEvents.has(event)) {
            errors.push(`Transition uses undeclared event: ${event}`);
        }
    }
    return errors;
}
/**
 * Validate behavior states match transitions
 */
export function validateBehaviorStates(behavior) {
    const errors = [];
    const sm = behavior.stateMachine;
    if (!sm)
        return errors;
    const declaredStates = new Set((sm.states || []).map(s => typeof s === 'string' ? s : s.name));
    for (const t of sm.transitions || []) {
        // Check 'from' states (allow '*' and arrays)
        if (t.from && t.from !== '*') {
            const fromStates = Array.isArray(t.from) ? t.from : [t.from];
            for (const state of fromStates) {
                if (!declaredStates.has(state)) {
                    errors.push(`Transition from undeclared state: ${state}`);
                }
            }
        }
        // Check 'to' state (optional)
        if (t.to && !declaredStates.has(t.to)) {
            errors.push(`Transition to undeclared state: ${t.to}`);
        }
    }
    return errors;
}
