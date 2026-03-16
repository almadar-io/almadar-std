/**
 * Standard Behaviors
 *
 * Pure functions that return OrbitalDefinitions.
 * Every behavior is a function: call it with params → get a complete .orb program.
 *
 * Hierarchy:
 * - Atoms: self-contained, irreducible state machines
 * - Molecules: compose atoms via extractTrait + shared event bus
 * - Organisms: compose atoms/molecules via connect/compose/pipe
 *
 * @packageDocumentation
 */

// Types
export type {
  BehaviorTrait,
  BehaviorMetadata,
  BehaviorSchema,
  BehaviorEffect,
  ItemAction,
  Effect,
  Expression,
  Trait,
  StateMachine,
  State,
  Event,
  Transition,
  TraitTick,
  TraitDataEntity,
  TraitEntityField,
  TraitCategory,
  OrbitalSchema,
  Orbital,
  Entity,
} from './types.js';

export {
  getBehaviorMetadata,
  validateBehaviorStructure,
  validateBehaviorEvents,
  validateBehaviorStates,
} from './types.js';

// Golden .orb exports reader
export {
  type BehaviorLevel,
  getAllBehaviorNames,
  getAllBehaviors,
  getBehaviorsByLevel,
  loadGoldenOrb,
  hasGoldenOrb,
  getBehavior,
} from './exports-reader.js';

// All behavior functions (atoms, molecules, organisms)
export * from './functions/index.js';
