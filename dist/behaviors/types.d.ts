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
import type { SExpr } from '../../types/expression.js';
import type { RequiredField } from '../../types/trait.js';
/**
 * Categories of Standard Behaviors
 */
export declare const BEHAVIOR_CATEGORIES: readonly ["ui-interaction", "data-management", "async", "feedback", "game-core", "game-entity", "game-ui"];
export type BehaviorCategory = (typeof BEHAVIOR_CATEGORIES)[number];
export type FieldType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'entity' | 'slot' | 'pattern' | 'event' | 'action[]';
export interface ConfigField {
    name: string;
    type: FieldType;
    description: string;
    default?: unknown;
    enum?: string[];
}
/**
 * State definition - can be string or object
 */
export interface BehaviorState {
    name: string;
    isInitial?: boolean;
    isFinal?: boolean;
    description?: string;
}
/**
 * Event definition - simplified, only key required
 */
export interface BehaviorEvent {
    key: string;
    name?: string;
    description?: string;
    payload?: Record<string, unknown>;
}
/**
 * Transition definition - flexible from/to
 */
export interface BehaviorTransition {
    /** Source state(s) - string, '*' for any, or array */
    from?: string | string[] | '*';
    /** Target state - optional for self-transitions */
    to?: string;
    /** Event that triggers this transition */
    event: string;
    /** Guard condition (S-expression) */
    guard?: SExpr;
    /** Effects to execute (S-expressions) */
    effects?: SExpr[];
}
/**
 * State machine for behaviors - more flexible than core StateMachine
 */
export interface BehaviorStateMachine {
    initial: string;
    states: (string | BehaviorState)[];
    events: (string | BehaviorEvent)[];
    transitions: BehaviorTransition[];
    guards?: Array<{
        name: string;
        condition: SExpr;
        description?: string;
    }>;
}
export interface BehaviorTick {
    name: string;
    description?: string;
    priority?: number;
    interval: 'frame' | number;
    appliesTo?: string[];
    guard?: SExpr;
    effects: SExpr[];
}
export interface BehaviorEntityField {
    name: string;
    type: string;
    default?: unknown;
    required?: boolean;
    description?: string;
}
export interface BehaviorDataEntity {
    name: string;
    runtime?: boolean;
    singleton?: boolean;
    fields: BehaviorEntityField[];
    description?: string;
}
export interface ItemAction {
    label: string;
    event?: string;
    navigatesTo?: string;
    placement?: 'row' | 'bulk' | 'card' | 'footer' | 'header';
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    showWhen?: SExpr | string;
}
/**
 * Configuration schema for documentation and IDE hints
 */
export interface BehaviorConfig {
    required: ConfigField[];
    optional: ConfigField[];
}
/**
 * Standard Behavior definition
 */
export interface StandardBehavior {
    /** Behavior identifier (e.g., 'std/List', 'std/Form') */
    name: string;
    /** Category for organization */
    category: BehaviorCategory;
    /** Human-readable description */
    description: string;
    /** When to use this behavior */
    suggestedFor?: string[];
    /** Configuration schema for IDE hints */
    configSchema?: BehaviorConfig;
    /** State machine definition */
    stateMachine?: BehaviorStateMachine;
    /** Required fields from linked entity */
    requiredFields?: RequiredField[];
    /** Runtime data entities */
    dataEntities?: BehaviorDataEntity[];
    /** Frame-by-frame execution */
    ticks?: BehaviorTick[];
    /** Cross-behavior event listeners */
    listens?: Array<{
        event: string;
        triggers: string;
        guard?: SExpr;
    }>;
    /** Initial effects on behavior activation */
    initialEffects?: SExpr[];
}
/**
 * Behavior metadata for quick lookup
 */
export interface BehaviorMetadata {
    name: string;
    category: BehaviorCategory;
    description: string;
    suggestedFor: string[];
    states: string[];
    events: string[];
    tickCount: number;
    transitionCount: number;
    hasDataEntities: boolean;
}
export declare function isBehaviorCategory(value: string): value is BehaviorCategory;
export declare function isGameBehaviorCategory(category: BehaviorCategory): boolean;
/**
 * Extract metadata from a StandardBehavior
 */
export declare function getBehaviorMetadata(behavior: StandardBehavior): BehaviorMetadata;
/**
 * Validate behavior structure
 */
export declare function validateBehaviorStructure(behavior: StandardBehavior): string[];
/**
 * Validate behavior events match transitions
 */
export declare function validateBehaviorEvents(behavior: StandardBehavior): string[];
/**
 * Validate behavior states match transitions
 */
export declare function validateBehaviorStates(behavior: StandardBehavior): string[];
