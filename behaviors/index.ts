/**
 * Standard Behaviors
 *
 * The package's behavior programs (read from its registry) and the queries over its index.
 *
 * @packageDocumentation
 */

// Types
export type {
  BehaviorTrait,
  BehaviorMetadata,
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

// Behavior registry query helpers
export {
  type RegistryEntry,
  type RegistryTraitSurface,
  type BehaviorTraitRole,
  type BehaviorSummary,
  getBehaviorRegistry,
  getBehaviorsByRole,
  getTraitSurface,
  getBehaviorsByDomain,
  getBehaviorsByOperations,
  searchBehaviors,
  getBehaviorSummary,
} from './query.js';

// Behavior embeddings (publish-time bake via scripts/embed.mjs → @almadar/calibrate)
export {
  type BehaviorEmbeddingsManifest,
  getBehaviorEmbeddings,
  getBehaviorEmbedding,
} from './embeddings.js';


// Per-knob embeddings (publish-time bake — see scripts/embed.mjs / @almadar/calibrate).
// Drives Stage A's per-knob narrowing + the studio's TraitKnobsPanel
// relevance sort. Returns null when the manifest is missing.
export { getKnobEmbeddings } from './knob-embeddings.js';
export type { KnobEmbeddingsManifest } from './knob-embeddings.js';

