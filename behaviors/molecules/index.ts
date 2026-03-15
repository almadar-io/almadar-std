/**
 * Molecule Behaviors
 *
 * Composed atom patterns forming cohesive interactions.
 * Each molecule internally uses modal, form, list, or other atom patterns.
 *
 * @level molecule
 * @packageDocumentation
 */

// Re-export key molecules for direct import
export { LIST_BEHAVIOR } from '../ui-interaction.js';
export { DETAIL_BEHAVIOR } from '../ui-interaction.js';
export { WIZARD_BEHAVIOR } from '../ui-interaction.js';
export { MASTER_DETAIL_BEHAVIOR } from '../ui-interaction.js';
export { FORM_BEHAVIOR } from '../ui-interaction.js';
export { FETCH_BEHAVIOR } from '../async.js';
export { SUBMIT_BEHAVIOR } from '../async.js';
export { RETRY_BEHAVIOR } from '../async.js';
export { POLL_BEHAVIOR } from '../async.js';
export { GAME_LOOP_BEHAVIOR } from '../game-core.js';
export { MOVEMENT_BEHAVIOR } from '../game-entity.js';
export { COMBAT_BEHAVIOR } from '../game-entity.js';
export { HEALTH_BEHAVIOR } from '../game-entity.js';
export { INVENTORY_BEHAVIOR } from '../game-entity.js';
export { GAME_FLOW_BEHAVIOR } from '../game-ui.js';
export { DIALOGUE_BEHAVIOR } from '../game-ui.js';
export { CIRCUIT_BREAKER_BEHAVIOR } from '../infrastructure.js';
export { HEALTH_CHECK_BEHAVIOR } from '../infrastructure.js';
export { CACHE_ASIDE_BEHAVIOR } from '../infrastructure.js';
export { SAGA_BEHAVIOR } from '../infrastructure.js';

// Family classification by name
export const CRUD_BEHAVIORS = [
  'std-list', 'std-detail', 'std-calendar', 'std-kanban',
  'std-article', 'std-playlist', 'std-pricing',
] as const;

export const BROWSE_VIEW_BEHAVIORS = [
  'std-bookmark', 'std-annotation', 'std-feed', 'std-ledger',
  'std-map-view', 'std-prescription', 'std-content-feed', 'std-gallery',
  'std-catalog', 'std-curriculum', 'std-device-mgmt', 'std-order-tracking',
  'std-pipeline', 'std-portfolio', 'std-reminder', 'std-review',
  'std-sensor-feed', 'std-transaction', 'std-vitals', 'std-approval',
  'std-availability', 'std-player',
] as const;

export const WIZARD_BEHAVIORS = [
  'std-wizard', 'std-booking', 'std-checkout', 'std-intake-form',
] as const;

export const COMMERCE_BEHAVIORS = [
  'std-cart', 'std-checkout', 'std-catalog', 'std-pricing',
] as const;

export const ASYNC_BEHAVIORS = [
  'std-fetch', 'std-submit', 'std-retry', 'std-upload',
  'std-poll', 'std-form',
] as const;

export const DISPLAY_BEHAVIORS = [
  'std-chart-view', 'std-stats-panel', 'std-kpi', 'std-report',
  'std-reader', 'std-profile', 'std-progress-tracker', 'std-masterdetail',
] as const;

export const MESSAGING_BEHAVIORS = [
  'std-messaging', 'std-reactions',
] as const;

export const TIMER_BEHAVIORS = [
  'std-agent-sim', 'std-time-step', 'std-poll',
] as const;

export const GAME_PHYSICS_BEHAVIORS = [
  'std-movement', 'std-platformer',
] as const;

export const GAME_COMBAT_BEHAVIORS = [
  'std-combat', 'std-health', 'std-enemy-ai',
] as const;

export const GAME_FLOW_BEHAVIORS = [
  'std-gameflow', 'std-gameloop', 'std-turn-system', 'std-npc',
  'std-dialogue',
] as const;

export const GAME_PROGRESSION_BEHAVIORS = [
  'std-inventory', 'std-quest', 'std-crafting', 'std-powerup',
  'std-scoring-chain',
] as const;

export const GAME_WORLD_BEHAVIORS = [
  'std-overworld', 'std-tilemap', 'std-fog-of-war', 'std-unit-command',
] as const;

export const INFRASTRUCTURE_BEHAVIORS = [
  'std-circuit-breaker', 'std-health-check', 'std-cache-aside',
  'std-saga',
] as const;

export const GEOSPATIAL_BEHAVIORS = [
  'std-location-picker', 'std-route-planner',
] as const;

export const EDUCATION_BEHAVIORS = [
  'std-quiz', 'std-grading', 'std-curriculum',
] as const;

export const HEALTHCARE_BEHAVIORS = [
  'std-prescription', 'std-intake-form', 'std-vitals',
] as const;

export const FINANCE_BEHAVIORS = [
  'std-ledger', 'std-portfolio', 'std-transaction',
] as const;

export const WORKFLOW_BEHAVIORS = [
  'std-approval', 'std-pipeline', 'std-rule-engine',
  'std-alert-threshold',
] as const;

export const IOT_BEHAVIORS = [
  'std-device-mgmt', 'std-sensor-feed',
] as const;

export const SIMULATION_BEHAVIORS = [
  'std-agent-sim', 'std-time-step', 'std-grid-puzzle',
  'std-resource',
] as const;

/**
 * Family-to-behaviors mapping for registry.
 */
export const MOLECULE_FAMILIES: Record<string, readonly string[]> = {
  crud: CRUD_BEHAVIORS,
  'browse-view': BROWSE_VIEW_BEHAVIORS,
  wizard: WIZARD_BEHAVIORS,
  commerce: COMMERCE_BEHAVIORS,
  async: ASYNC_BEHAVIORS,
  display: DISPLAY_BEHAVIORS,
  messaging: MESSAGING_BEHAVIORS,
  timer: TIMER_BEHAVIORS,
  'game-physics': GAME_PHYSICS_BEHAVIORS,
  'game-combat': GAME_COMBAT_BEHAVIORS,
  'game-flow': GAME_FLOW_BEHAVIORS,
  'game-progression': GAME_PROGRESSION_BEHAVIORS,
  'game-world': GAME_WORLD_BEHAVIORS,
  infrastructure: INFRASTRUCTURE_BEHAVIORS,
  geospatial: GEOSPATIAL_BEHAVIORS,
  education: EDUCATION_BEHAVIORS,
  healthcare: HEALTHCARE_BEHAVIORS,
  finance: FINANCE_BEHAVIORS,
  workflow: WORKFLOW_BEHAVIORS,
  iot: IOT_BEHAVIORS,
  simulation: SIMULATION_BEHAVIORS,
};

/**
 * Get the family for a behavior name.
 */
export function getBehaviorFamily(name: string): string | undefined {
  for (const [family, behaviors] of Object.entries(MOLECULE_FAMILIES)) {
    if ((behaviors as readonly string[]).includes(name)) return family;
  }
  return undefined;
}
