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

// Types
export {
  /** @deprecated Use OrbitalSchema directly */
  type BehaviorTrait,
  type BehaviorMetadata,
  type ItemAction,
  // Re-exported core types
  type Effect,
  type Expression,
  type Trait,
  type StateMachine,
  type State,
  type Event,
  type Transition,
  type TraitTick,
  type TraitDataEntity,
  type TraitEntityField,
  type TraitCategory,
  type OrbitalSchema,
  type Orbital,
  type Entity,
  getBehaviorMetadata,
  validateBehaviorStructure,
  validateBehaviorEvents,
  validateBehaviorStates,
} from './types.js';


// Action Affinity
export {
  type ActionAffinity,
  type ActionPlacement,
  type UIEventInfo,
  ACTION_AFFINITY,
  UI_EVENTS,
  isActionValidForComponent,
  isActionInvalidForComponent,
  getValidActionsForComponent,
  getInvalidActionsForComponent,
  getComponentsForEvent,
  validateActionsForComponent,
  getAllKnownComponents,
  getComponentsByCategory,
} from './action-affinity.js';

// UI Interaction Behaviors
export {
  LIST_BEHAVIOR,
  DETAIL_BEHAVIOR,
  FORM_BEHAVIOR,
  MODAL_BEHAVIOR,
  DRAWER_BEHAVIOR,
  TABS_BEHAVIOR,
  WIZARD_BEHAVIOR,
  MASTER_DETAIL_BEHAVIOR,
  UI_INTERACTION_BEHAVIORS,
} from './ui-interaction.js';

// Data Management Behaviors
export {
  PAGINATION_BEHAVIOR,
  SELECTION_BEHAVIOR,
  SORT_BEHAVIOR,
  FILTER_BEHAVIOR,
  SEARCH_BEHAVIOR,
  DATA_MANAGEMENT_BEHAVIORS,
} from './data-management.js';

// Async Behaviors
export {
  LOADING_BEHAVIOR,
  FETCH_BEHAVIOR,
  SUBMIT_BEHAVIOR,
  RETRY_BEHAVIOR,
  POLL_BEHAVIOR,
  ASYNC_BEHAVIORS,
} from './async.js';

// Feedback Behaviors
export {
  NOTIFICATION_BEHAVIOR,
  CONFIRMATION_BEHAVIOR,
  UNDO_BEHAVIOR,
  FEEDBACK_BEHAVIORS,
} from './feedback.js';

// Game Core Behaviors
export {
  GAME_LOOP_BEHAVIOR,
  PHYSICS_2D_BEHAVIOR,
  INPUT_BEHAVIOR,
  COLLISION_BEHAVIOR,
  GAME_CORE_BEHAVIORS,
} from './game-core.js';

// Game Entity Behaviors
export {
  HEALTH_BEHAVIOR,
  SCORE_BEHAVIOR,
  MOVEMENT_BEHAVIOR,
  COMBAT_BEHAVIOR,
  INVENTORY_BEHAVIOR,
  GAME_ENTITY_BEHAVIORS,
} from './game-entity.js';

// Game UI Behaviors
export {
  GAME_FLOW_BEHAVIOR,
  DIALOGUE_BEHAVIOR,
  LEVEL_PROGRESS_BEHAVIOR,
  GAME_UI_BEHAVIORS,
} from './game-ui.js';

// Infrastructure Behaviors
export {
  CIRCUIT_BREAKER_BEHAVIOR,
  HEALTH_CHECK_BEHAVIOR,
  RATE_LIMITER_BEHAVIOR,
  CACHE_ASIDE_BEHAVIOR,
  SAGA_BEHAVIOR,
  METRICS_COLLECTOR_BEHAVIOR,
  INFRASTRUCTURE_BEHAVIORS,
} from './infrastructure.js';

// Domain: Game 2D Platformer
export {
  PLATFORMER_BEHAVIOR,
  TILEMAP_BEHAVIOR,
  POWERUP_BEHAVIOR,
  ENEMY_AI_BEHAVIOR,
  GAME_2D_PLATFORMER_BEHAVIORS,
} from './domain/game-2d-platformer.js';

// Domain: Game 2D RPG
export {
  OVERWORLD_BEHAVIOR,
  QUEST_BEHAVIOR,
  NPC_BEHAVIOR,
  CRAFTING_BEHAVIOR,
  GAME_2D_RPG_BEHAVIORS,
} from './domain/game-2d-rpg.js';

// Domain: Game 2D Strategy
export {
  TURN_SYSTEM_BEHAVIOR,
  UNIT_COMMAND_BEHAVIOR,
  FOG_OF_WAR_BEHAVIOR,
  RESOURCE_BEHAVIOR,
  GAME_2D_STRATEGY_BEHAVIORS,
} from './domain/game-2d-strategy.js';

// Domain: Game 2D Puzzle
export {
  GRID_PUZZLE_BEHAVIOR,
  TIMER_BEHAVIOR,
  SCORING_CHAIN_BEHAVIOR,
  GAME_2D_PUZZLE_BEHAVIORS,
} from './domain/game-2d-puzzle.js';

// Domain: Commerce
export {
  CART_BEHAVIOR,
  CHECKOUT_BEHAVIOR,
  CATALOG_BEHAVIOR,
  PRICING_BEHAVIOR,
  ORDER_TRACKING_BEHAVIOR,
  COMMERCE_BEHAVIORS,
} from './domain/commerce.js';

// Domain: Content
export {
  ARTICLE_BEHAVIOR,
  READER_BEHAVIOR,
  BOOKMARK_BEHAVIOR,
  ANNOTATION_BEHAVIOR,
  CONTENT_FEED_BEHAVIOR,
  CONTENT_BEHAVIORS,
} from './domain/content.js';

// Domain: Dashboard
export {
  STATS_PANEL_BEHAVIOR,
  CHART_VIEW_BEHAVIOR,
  KPI_BEHAVIOR,
  REPORT_BEHAVIOR,
  DASHBOARD_BEHAVIORS,
} from './domain/dashboard.js';

// Domain: Scheduling
export {
  CALENDAR_BEHAVIOR,
  BOOKING_BEHAVIOR,
  AVAILABILITY_BEHAVIOR,
  REMINDER_BEHAVIOR,
  SCHEDULING_BEHAVIORS,
} from './domain/scheduling.js';

// Domain: Workflow
export {
  APPROVAL_BEHAVIOR,
  PIPELINE_BEHAVIOR,
  KANBAN_BEHAVIOR,
  REVIEW_BEHAVIOR,
  WORKFLOW_BEHAVIORS,
} from './domain/workflow.js';

// Domain: Social
export {
  FEED_BEHAVIOR,
  MESSAGING_BEHAVIOR,
  PROFILE_BEHAVIOR,
  REACTIONS_BEHAVIOR,
  SOCIAL_BEHAVIORS,
} from './domain/social.js';

// Domain: Education
export {
  QUIZ_BEHAVIOR,
  PROGRESS_TRACKER_BEHAVIOR,
  GRADING_BEHAVIOR,
  CURRICULUM_BEHAVIOR,
  EDUCATION_BEHAVIORS,
} from './domain/education.js';

// Domain: Media
export {
  GALLERY_BEHAVIOR,
  PLAYER_BEHAVIOR,
  PLAYLIST_BEHAVIOR,
  UPLOAD_BEHAVIOR,
  MEDIA_BEHAVIORS,
} from './domain/media.js';

// Domain: Geospatial
export {
  MAP_VIEW_BEHAVIOR,
  LOCATION_PICKER_BEHAVIOR,
  ROUTE_PLANNER_BEHAVIOR,
  GEOSPATIAL_BEHAVIORS,
} from './domain/geospatial.js';

// Domain: Finance
export {
  LEDGER_BEHAVIOR,
  TRANSACTION_BEHAVIOR,
  PORTFOLIO_BEHAVIOR,
  FINANCE_BEHAVIORS,
} from './domain/finance.js';

// Domain: Healthcare
export {
  VITALS_BEHAVIOR,
  INTAKE_FORM_BEHAVIOR,
  PRESCRIPTION_BEHAVIOR,
  HEALTHCARE_BEHAVIORS,
} from './domain/healthcare.js';

// Domain: IoT
export {
  SENSOR_FEED_BEHAVIOR,
  ALERT_THRESHOLD_BEHAVIOR,
  DEVICE_MGMT_BEHAVIOR,
  IOT_BEHAVIORS,
} from './domain/iot.js';

// Domain: Simulation
export {
  AGENT_SIM_BEHAVIOR,
  RULE_ENGINE_BEHAVIOR,
  TIME_STEP_BEHAVIOR,
  SIMULATION_BEHAVIORS,
} from './domain/simulation.js';

// Registry
export {
  STANDARD_BEHAVIORS,
  BEHAVIOR_REGISTRY,
  getBehavior,
  isKnownBehavior,
  getAllBehaviorNames,
  getAllBehaviors,
  getAllBehaviorMetadata,
  findBehaviorsForUseCase,
  getBehaviorsForEvent,
  getBehaviorsWithState,
  validateBehaviorReference,
  getBehaviorLibraryStats,
} from './registry.js';
