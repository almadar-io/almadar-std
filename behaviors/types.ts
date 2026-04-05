/**
 * Standard Behaviors Types
 *
 * Standard Behaviors are reusable OrbitalSchema definitions with a `std-` naming convention.
 * Each behavior is a self-contained .orb file that can function independently.
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
  OrbitalSchema,
  Orbital,
  Entity,
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
  TraitCategory,
  OrbitalSchema,
  Orbital,
  Entity,
};

// ============================================================================
// Behavior-local type aliases (use core types directly)
// ============================================================================

/**
 * @deprecated Use `Effect` from `@almadar/core` directly.
 * Kept for backward compatibility only.
 */
export type BehaviorEffect = Effect;

/**
 * @deprecated Use `OrbitalSchema` from `@almadar/core` directly.
 * Kept for backward compatibility only.
 */
export type BehaviorSchema = OrbitalSchema;

// ============================================================================
// Legacy Type Aliases (for backward compatibility only)
// ============================================================================

/**
 * @deprecated Use OrbitalSchema directly. BehaviorTrait is kept for backward compatibility.
 */
export type BehaviorTrait = Trait;

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
// Behavior Metadata (for quick lookup and documentation)
// ============================================================================

/**
 * Behavior metadata extracted from a Trait for documentation purposes
 */
export interface BehaviorMetadata {
  name: string;
  category?: TraitCategory;
  description: string;
  states: string[];
  events: string[];
  tickCount: number;
  transitionCount: number;
  hasDataEntities: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract metadata from a BehaviorTrait for documentation
 */
export function getBehaviorMetadata(behavior: BehaviorTrait): BehaviorMetadata {
  const sm = behavior.stateMachine;

  // Core types: State is always an object with name
  const states: string[] = (sm?.states || []).map(s => s.name);

  // Core types: Event is always an object with key
  const events: string[] = (sm?.events || []).map(e => e.key);

  return {
    name: behavior.name,
    category: behavior.category,
    description: behavior.description || '',
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
export function validateBehaviorStructure(behavior: BehaviorTrait): string[] {
  const errors: string[] = [];

  if (!behavior.name) {
    errors.push('Behavior must have a name');
  }

  if (!behavior.name.startsWith('std/')) {
    errors.push(`Behavior name should start with 'std/' (got: ${behavior.name})`);
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
export function validateBehaviorEvents(behavior: BehaviorTrait): string[] {
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
export function validateBehaviorStates(behavior: BehaviorTrait): string[] {
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
