/**
 * Standard Behaviors
 *
 * Composable state machine fragments that encode common interaction logic
 * with embedded UI via render_ui effects.
 *
 * Standard Behaviors replace both the trait library (domain-specific behaviors)
 * and pattern library (UI components) with unified, generic building blocks.
 *
 * @packageDocumentation
 */
export { type StandardBehavior, type BehaviorMetadata, type BehaviorCategory, type BehaviorConfig, type BehaviorTransition, type BehaviorStateMachine, type BehaviorState, type BehaviorEvent, type BehaviorTick, type BehaviorDataEntity, type BehaviorEntityField, type ConfigField, type ItemAction, type FieldType, BEHAVIOR_CATEGORIES, isBehaviorCategory, isGameBehaviorCategory, getBehaviorMetadata, validateBehaviorStructure, validateBehaviorEvents, validateBehaviorStates, } from './types.js';
export { type ActionAffinity, type ActionPlacement, type UIEventInfo, ACTION_AFFINITY, UI_EVENTS, isActionValidForComponent, isActionInvalidForComponent, getValidActionsForComponent, getInvalidActionsForComponent, getComponentsForEvent, validateActionsForComponent, getAllKnownComponents, getComponentsByCategory, } from './action-affinity.js';
export { LIST_BEHAVIOR, DETAIL_BEHAVIOR, FORM_BEHAVIOR, MODAL_BEHAVIOR, DRAWER_BEHAVIOR, TABS_BEHAVIOR, WIZARD_BEHAVIOR, MASTER_DETAIL_BEHAVIOR, UI_INTERACTION_BEHAVIORS, } from './ui-interaction.js';
export { PAGINATION_BEHAVIOR, SELECTION_BEHAVIOR, SORT_BEHAVIOR, FILTER_BEHAVIOR, SEARCH_BEHAVIOR, DATA_MANAGEMENT_BEHAVIORS, } from './data-management.js';
export { LOADING_BEHAVIOR, FETCH_BEHAVIOR, SUBMIT_BEHAVIOR, RETRY_BEHAVIOR, POLL_BEHAVIOR, ASYNC_BEHAVIORS, } from './async.js';
export { NOTIFICATION_BEHAVIOR, CONFIRMATION_BEHAVIOR, UNDO_BEHAVIOR, FEEDBACK_BEHAVIORS, } from './feedback.js';
export { GAME_LOOP_BEHAVIOR, PHYSICS_2D_BEHAVIOR, INPUT_BEHAVIOR, COLLISION_BEHAVIOR, GAME_CORE_BEHAVIORS, } from './game-core.js';
export { HEALTH_BEHAVIOR, SCORE_BEHAVIOR, MOVEMENT_BEHAVIOR, COMBAT_BEHAVIOR, INVENTORY_BEHAVIOR, GAME_ENTITY_BEHAVIORS, } from './game-entity.js';
export { GAME_FLOW_BEHAVIOR, DIALOGUE_BEHAVIOR, LEVEL_PROGRESS_BEHAVIOR, GAME_UI_BEHAVIORS, } from './game-ui.js';
export { STANDARD_BEHAVIORS, BEHAVIOR_REGISTRY, BEHAVIORS_BY_CATEGORY, getBehavior, isKnownBehavior, getBehaviorsByCategory, getAllBehaviorNames, getAllBehaviors, getAllBehaviorMetadata, findBehaviorsForUseCase, getBehaviorsForEvent, getBehaviorsWithState, validateBehaviorReference, getBehaviorLibraryStats, } from './registry.js';
