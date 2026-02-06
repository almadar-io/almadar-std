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

import type {
  SExpr,
  RequiredField,
  Effect,
  Expression,
  Trait,
  TraitCategory,
  StateMachine,
  State,
  Event,
  Transition,
  Guard,
  TraitTick,
  TraitDataEntity,
  TraitEntityField,
  TraitEventListener,
} from '@almadar/core/types';

// Re-export core types for use in behaviors
export type {
  Effect,
  Expression,
  Trait,
  StateMachine,
  State,
  Event,
  Transition,
  Guard,
  TraitTick,
  TraitDataEntity,
  TraitEntityField,
};

// ============================================================================
// Behavior Categories
// ============================================================================

/**
 * Categories of Standard Behaviors
 */
export const BEHAVIOR_CATEGORIES = [
  'ui-interaction',   // User interface state management
  'data-management',  // Data operations and state
  'async',            // Asynchronous workflows
  'feedback',         // User feedback and confirmations
  'game-core',        // Game loop and systems
  'game-entity',      // Game entity behaviors
  'game-ui',          // Game interface
] as const;

export type BehaviorCategory = (typeof BEHAVIOR_CATEGORIES)[number];

// ============================================================================
// Config Field Types (for IDE hints and documentation)
// ============================================================================

export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'entity'
  | 'slot'
  | 'pattern'
  | 'event'
  | 'action[]';

export interface ConfigField {
  name: string;
  type: FieldType;
  description: string;
  default?: unknown;
  enum?: string[];
}

// ============================================================================
// Deprecated Aliases (for backwards compatibility)
// Use the core types directly from @almadar/core/types
// ============================================================================

/** @deprecated Use State from @almadar/core/types */
export type BehaviorState = State;

/** @deprecated Use Event from @almadar/core/types */
export type BehaviorEvent = Event;

/** @deprecated Use Transition from @almadar/core/types */
export type BehaviorTransition = Transition;

/** @deprecated Use StateMachine from @almadar/core/types */
export type BehaviorStateMachine = StateMachine;

/** @deprecated Use TraitTick from @almadar/core/types */
export type BehaviorTick = TraitTick;

/** @deprecated Use TraitEntityField from @almadar/core/types */
export type BehaviorEntityField = TraitEntityField;

/** @deprecated Use TraitDataEntity from @almadar/core/types */
export type BehaviorDataEntity = TraitDataEntity;

// ============================================================================
// Item Action (for render_ui props)
// ============================================================================

export interface ItemAction {
  label: string;
  event?: string;
  navigatesTo?: string;
  placement?: 'row' | 'bulk' | 'card' | 'footer' | 'header';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  showWhen?: SExpr | string;
}

// ============================================================================
// Standard Behavior Interface
// ============================================================================

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

  // ========== Documentation Extensions ==========

  /** When to use this behavior */
  suggestedFor?: string[];

  /** Configuration schema for IDE hints */
  configSchema?: BehaviorConfig;

  // ========== State Machine ==========

  /** State machine definition */
  stateMachine?: BehaviorStateMachine;

  // ========== Trait Features ==========

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
    guard?: Expression;
  }>;

  /** Initial effects on behavior activation */
  initialEffects?: Effect[];
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

// ============================================================================
// Helper Functions
// ============================================================================

export function isBehaviorCategory(value: string): value is BehaviorCategory {
  return BEHAVIOR_CATEGORIES.includes(value as BehaviorCategory);
}

export function isGameBehaviorCategory(category: BehaviorCategory): boolean {
  return category.startsWith('game-');
}

/**
 * Extract metadata from a StandardBehavior
 */
export function getBehaviorMetadata(behavior: StandardBehavior): BehaviorMetadata {
  const sm = behavior.stateMachine;

  // Core types: State is always an object with name
  const states: string[] = (sm?.states || []).map(s => s.name);

  // Core types: Event is always an object with key
  const events: string[] = (sm?.events || []).map(e => e.key);

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
export function validateBehaviorStructure(behavior: StandardBehavior): string[] {
  const errors: string[] = [];

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

    // Core types: check initial state using isInitial flag on State
    const hasInitialState = sm.states?.some(s => s.isInitial);
    if (!hasInitialState) {
      errors.push('State machine must have an initial state (set isInitial: true on one state)');
    }
  }

  return errors;
}

/**
 * Validate behavior events match transitions
 */
export function validateBehaviorEvents(behavior: StandardBehavior): string[] {
  const errors: string[] = [];
  const sm = behavior.stateMachine;
  if (!sm) return errors;

  // Core types: Event is always an object with key
  const declaredEvents = new Set(
    (sm.events || []).map(e => e.key)
  );

  const transitionEvents = new Set(
    (sm.transitions || []).map(t => t.event)
  );

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
export function validateBehaviorStates(behavior: StandardBehavior): string[] {
  const errors: string[] = [];
  const sm = behavior.stateMachine;
  if (!sm) return errors;

  // Core types: State is always an object with name
  const declaredStates = new Set(
    (sm.states || []).map(s => s.name)
  );

  for (const t of sm.transitions || []) {
    // Core types: from and to are both strings
    if (t.from && !declaredStates.has(t.from)) {
      errors.push(`Transition from undeclared state: ${t.from}`);
    }

    if (t.to && !declaredStates.has(t.to)) {
      errors.push(`Transition to undeclared state: ${t.to}`);
    }
  }

  return errors;
}

// ============================================================================
// Normalization Functions
// Convert flexible Behavior types to strict core types
// ============================================================================

/**
 * Humanize an event key to a readable name.
 * E.g., 'CONFIRM_DELETE' -> 'Confirm Delete'
 */
function humanizeEventKey(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Map BehaviorCategory to TraitCategory.
 * Falls back to 'interaction' for unmapped categories.
 */
function mapBehaviorCategoryToTraitCategory(category: BehaviorCategory): TraitCategory {
  const mapping: Record<BehaviorCategory, TraitCategory> = {
    'ui-interaction': 'interaction',
    'data-management': 'lifecycle',
    'async': 'integration',
    'feedback': 'notification',
    'game-core': 'game-core',
    'game-entity': 'game-character',
    'game-ui': 'interaction',
  };
  return mapping[category] || 'interaction';
}
