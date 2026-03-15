/**
 * Atom Behaviors
 *
 * Single-concern behaviors with 1-2 states. Building blocks for molecules.
 * These cannot be decomposed further.
 *
 * @level atom
 * @packageDocumentation
 */

// UI primitives
export { MODAL_BEHAVIOR } from '../ui-interaction.js';
export { DRAWER_BEHAVIOR } from '../ui-interaction.js';
export { TABS_BEHAVIOR } from '../ui-interaction.js';
export { FILTER_BEHAVIOR } from '../ui-interaction.js';

// Feedback
export { CONFIRMATION_BEHAVIOR } from '../feedback.js';
export { NOTIFICATION_BEHAVIOR } from '../feedback.js';
export { UNDO_BEHAVIOR } from '../feedback.js';

// Data controls
export { SEARCH_BEHAVIOR } from '../data-management.js';
export { SORT_BEHAVIOR } from '../data-management.js';
export { PAGINATION_BEHAVIOR } from '../data-management.js';
export { SELECTION_BEHAVIOR } from '../data-management.js';

// Async primitives
export { LOADING_BEHAVIOR } from '../async.js';

// Game primitives
export { INPUT_BEHAVIOR } from '../game-core.js';
export { COLLISION_BEHAVIOR } from '../game-core.js';
export { SCORE_BEHAVIOR } from '../game-entity.js';
export { PHYSICS_2D_BEHAVIOR } from '../game-core.js';
export { LEVEL_PROGRESS_BEHAVIOR } from '../game-ui.js';

// Infrastructure primitives
export { RATE_LIMITER_BEHAVIOR } from '../infrastructure.js';
export { METRICS_COLLECTOR_BEHAVIOR } from '../infrastructure.js';

// Timer (from game-2d-puzzle domain)
export { TIMER_BEHAVIOR } from '../domain/game-2d-puzzle.js';

/**
 * All atom behavior names for classification.
 */
export const ATOM_NAMES = [
  'std-modal', 'std-drawer', 'std-tabs', 'std-filter', 'std-filter-ui',
  'std-confirmation', 'std-notification', 'std-undo', 'std-action-log',
  'std-search', 'std-sort', 'std-pagination', 'std-selection',
  'std-loading',
  'std-input', 'std-collision', 'std-score', 'std-physics2d', 'std-levelprogress',
  'std-rate-limiter', 'std-metrics-collector',
  'std-timer',
] as const;
