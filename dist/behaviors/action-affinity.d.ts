/**
 * Action-Component Affinity Rules
 *
 * Defines which actions are valid on which components in the Closed Circuit pattern.
 * This enforces that behaviors only emit actions that make sense for their component context.
 *
 * The Closed Circuit pattern:
 * Behavior → render_ui → Component → User Action → Event Bus → Behavior
 *
 * @packageDocumentation
 */
/**
 * Action affinity definition for a component
 */
export interface ActionAffinity {
    /** Actions that are valid on this component */
    valid: string[];
    /** Actions that should NEVER appear on this component */
    invalid: string[];
}
/**
 * Action placement options
 */
export type ActionPlacement = 'row' | 'bulk' | 'card' | 'footer' | 'header';
/**
 * Event naming convention for UI events
 */
export interface UIEventInfo {
    /** Event name (without UI: prefix) */
    event: string;
    /** Components that typically emit this event */
    emittedBy: string[];
    /** Expected payload shape */
    payload: Record<string, string>;
    /** Description of when this event is used */
    description: string;
}
/**
 * The action-component affinity matrix.
 * This defines which actions belong on which components.
 *
 * CRITICAL: Not all actions belong on all components.
 * The Closed Circuit pattern requires that actions match their component context.
 */
export declare const ACTION_AFFINITY: Record<string, ActionAffinity>;
/**
 * Standard UI events and their metadata
 */
export declare const UI_EVENTS: Record<string, UIEventInfo>;
/**
 * Check if an action is valid for a component
 */
export declare function isActionValidForComponent(action: string, component: string): boolean;
/**
 * Check if an action is explicitly invalid for a component
 */
export declare function isActionInvalidForComponent(action: string, component: string): boolean;
/**
 * Get valid actions for a component
 */
export declare function getValidActionsForComponent(component: string): string[];
/**
 * Get invalid actions for a component
 */
export declare function getInvalidActionsForComponent(component: string): string[];
/**
 * Get components that can emit a specific event
 */
export declare function getComponentsForEvent(event: string): string[];
/**
 * Validate that a set of item actions are appropriate for a component
 *
 * @returns Array of validation errors (empty if valid)
 */
export declare function validateActionsForComponent(actions: Array<{
    event?: string;
    label?: string;
}>, component: string): string[];
/**
 * Get all known components in the affinity matrix
 */
export declare function getAllKnownComponents(): string[];
/**
 * Get all components by category
 */
export declare function getComponentsByCategory(): Record<string, string[]>;
