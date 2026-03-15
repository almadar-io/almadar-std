/**
 * Behavior Functions
 *
 * Pure functions that return OrbitalDefinitions.
 * Atoms: self-contained, irreducible state machines.
 * Molecules: compose atoms via extractTrait + shared event bus.
 * Organisms: compose atoms/molecules via connect/compose/pipe.
 *
 * @packageDocumentation
 */

// ============================================================================
// Molecules (compose atoms)
// ============================================================================

export { stdList, stdListEntity, stdListTrait, stdListPage, type StdListParams } from './std-list.js';
export { stdCart, stdCartEntity, stdCartTrait, stdCartPage, type StdCartParams } from './std-cart.js';
export { stdDetail, stdDetailEntity, stdDetailTrait, stdDetailPage, type StdDetailParams } from './std-detail.js';
export { stdInventory, stdInventoryEntity, stdInventoryTrait, stdInventoryPage, type StdInventoryParams } from './std-inventory.js';
export { stdMessaging, stdMessagingEntity, stdMessagingTrait, stdMessagingPage, type StdMessagingParams } from './std-messaging.js';
export { stdGeospatial, stdGeospatialEntity, stdGeospatialTrait, stdGeospatialPage, type StdGeospatialParams } from './std-geospatial.js';

// ============================================================================
// Atoms: UI building blocks (used by molecules)
// ============================================================================

export { stdBrowse, stdBrowseEntity, stdBrowseTrait, stdBrowsePage, type StdBrowseParams } from './std-browse.js';
export { stdModal, stdModalEntity, stdModalTrait, stdModalPage, type StdModalParams } from './std-modal.js';
export { stdConfirmation, stdConfirmationEntity, stdConfirmationTrait, stdConfirmationPage, type StdConfirmationParams } from './std-confirmation.js';
export { stdSearch, stdSearchEntity, stdSearchTrait, stdSearchPage, type StdSearchParams } from './std-search.js';
export { stdFilter, stdFilterEntity, stdFilterTrait, stdFilterPage, type StdFilterParams } from './std-filter.js';
export { stdSort, stdSortEntity, stdSortTrait, stdSortPage, type StdSortParams } from './std-sort.js';
export { stdPagination, stdPaginationEntity, stdPaginationTrait, stdPaginationPage, type StdPaginationParams } from './std-pagination.js';
export { stdDrawer, stdDrawerEntity, stdDrawerTrait, stdDrawerPage, type StdDrawerParams } from './std-drawer.js';
export { stdNotification, stdNotificationEntity, stdNotificationTrait, stdNotificationPage, type StdNotificationParams } from './std-notification.js';
export { stdTimer, stdTimerEntity, stdTimerTrait, stdTimerPage, type StdTimerParams } from './std-timer.js';
export { stdTabs, stdTabsEntity, stdTabsTrait, stdTabsPage, type StdTabsParams } from './std-tabs.js';
export { stdLoading, stdLoadingEntity, stdLoadingTrait, stdLoadingPage, type StdLoadingParams } from './std-loading.js';
export { stdSelection, stdSelectionEntity, stdSelectionTrait, stdSelectionPage, type StdSelectionParams } from './std-selection.js';
export { stdUndo, stdUndoEntity, stdUndoTrait, stdUndoPage, type StdUndoParams } from './std-undo.js';
export { stdInput, stdInputEntity, stdInputTrait, stdInputPage, type StdInputParams } from './std-input.js';

// ============================================================================
// Atoms: Domain-specific (self-contained, not decomposable)
// ============================================================================

export { stdWizard, stdWizardEntity, stdWizardTrait, stdWizardPage, type StdWizardParams } from './std-wizard.js';
export { stdDisplay, stdDisplayEntity, stdDisplayTrait, stdDisplayPage, type StdDisplayParams } from './std-display.js';
export { stdAsync, stdAsyncEntity, stdAsyncTrait, stdAsyncPage, type StdAsyncParams } from './std-async.js';
export { stdCombat, stdCombatEntity, stdCombatTrait, stdCombatPage, type StdCombatParams } from './std-combat.js';
export { stdGameflow, stdGameflowEntity, stdGameflowTrait, stdGameflowPage, type StdGameflowParams } from './std-gameflow.js';
export { stdMovement, stdMovementEntity, stdMovementTrait, stdMovementPage, type StdMovementParams } from './std-movement.js';
export { stdQuest, stdQuestEntity, stdQuestTrait, stdQuestPage, type StdQuestParams } from './std-quest.js';
export { stdOverworld, stdOverworldEntity, stdOverworldTrait, stdOverworldPage, type StdOverworldParams } from './std-overworld.js';
export { stdCircuitBreaker, stdCircuitBreakerEntity, stdCircuitBreakerTrait, stdCircuitBreakerPage, type StdCircuitBreakerParams } from './std-circuit-breaker.js';
export { stdCacheAside, stdCacheAsideEntity, stdCacheAsideTrait, stdCacheAsidePage, type StdCacheAsideParams } from './std-cache-aside.js';
export { stdScore, stdScoreEntity, stdScoreTrait, stdScorePage, type StdScoreParams } from './std-score.js';
export { stdCollision, stdCollisionEntity, stdCollisionTrait, stdCollisionPage, type StdCollisionParams } from './std-collision.js';
export { stdPhysics2d, stdPhysics2dEntity, stdPhysics2dTrait, stdPhysics2dPage, type StdPhysics2dParams } from './std-physics2d.js';
export { stdRateLimiter, stdRateLimiterEntity, stdRateLimiterTrait, stdRateLimiterPage, type StdRateLimiterParams } from './std-rate-limiter.js';

// ============================================================================
// Atoms: Game UI patterns
// ============================================================================

export { stdGameHud, stdGameHudEntity, stdGameHudTrait, stdGameHudPage, type StdGameHudParams } from './std-game-hud.js';
export { stdScoreBoard, stdScoreBoardEntity, stdScoreBoardTrait, stdScoreBoardPage, type StdScoreBoardParams } from './std-score-board.js';
export { stdGameMenu, stdGameMenuEntity, stdGameMenuTrait, stdGameMenuPage, type StdGameMenuParams } from './std-game-menu.js';
export { stdGameOverScreen, stdGameOverScreenEntity, stdGameOverScreenTrait, stdGameOverScreenPage, type StdGameOverScreenParams } from './std-game-over-screen.js';
export { stdDialogueBox, stdDialogueBoxEntity, stdDialogueBoxTrait, stdDialogueBoxPage, type StdDialogueBoxParams } from './std-dialogue-box.js';
export { stdInventoryPanel, stdInventoryPanelEntity, stdInventoryPanelTrait, stdInventoryPanelPage, type StdInventoryPanelParams } from './std-inventory-panel.js';
export { stdCombatLog, stdCombatLogEntity, stdCombatLogTrait, stdCombatLogPage, type StdCombatLogParams } from './std-combat-log.js';
export { stdSprite, stdSpriteEntity, stdSpriteTrait, stdSpritePage, type StdSpriteParams } from './std-sprite.js';
export { stdGameAudio, stdGameAudioEntity, stdGameAudioTrait, stdGameAudioPage, type StdGameAudioParams } from './std-game-audio.js';

// ============================================================================
// Atoms: Game canvas patterns
// ============================================================================

export { stdIsometricCanvas, stdIsometricCanvasEntity, stdIsometricCanvasTrait, stdIsometricCanvasPage, type StdIsometricCanvasParams } from './std-isometric-canvas.js';
export { stdPlatformerCanvas, stdPlatformerCanvasEntity, stdPlatformerCanvasTrait, stdPlatformerCanvasPage, type StdPlatformerCanvasParams } from './std-platformer-canvas.js';
export { stdSimulationCanvas, stdSimulationCanvasEntity, stdSimulationCanvasTrait, stdSimulationCanvasPage, type StdSimulationCanvasParams } from './std-simulation-canvas.js';
export { stdGameCanvas2d, stdGameCanvas2dEntity, stdGameCanvas2dTrait, stdGameCanvas2dPage, type StdGameCanvas2dParams } from './std-game-canvas-2d.js';
export { stdGameCanvas3d, stdGameCanvas3dEntity, stdGameCanvas3dTrait, stdGameCanvas3dPage, type StdGameCanvas3dParams } from './std-game-canvas-3d.js';

// ============================================================================
// Molecules: Game genres
// ============================================================================

export { stdTurnBasedBattle, stdTurnBasedBattleEntity, stdTurnBasedBattleTrait, stdTurnBasedBattlePage, type StdTurnBasedBattleParams } from './std-turn-based-battle.js';
export { stdPlatformerGame, stdPlatformerGameEntity, stdPlatformerGameTrait, stdPlatformerGamePage, type StdPlatformerGameParams } from './std-platformer-game.js';
export { stdPuzzleGame, stdPuzzleGameEntity, stdPuzzleGameTrait, stdPuzzleGamePage, type StdPuzzleGameParams } from './std-puzzle-game.js';

// ============================================================================
// Molecules: Educational games (board-based)
// ============================================================================

export { stdBuilderGame, stdBuilderGameEntity, stdBuilderGameTrait, stdBuilderGamePage, type StdBuilderGameParams } from './std-builder-game.js';
export { stdClassifierGame, stdClassifierGameEntity, stdClassifierGameTrait, stdClassifierGamePage, type StdClassifierGameParams } from './std-classifier-game.js';
export { stdSequencerGame, stdSequencerGameEntity, stdSequencerGameTrait, stdSequencerGamePage, type StdSequencerGameParams } from './std-sequencer-game.js';
export { stdDebuggerGame, stdDebuggerGameEntity, stdDebuggerGameTrait, stdDebuggerGamePage, type StdDebuggerGameParams } from './std-debugger-game.js';
export { stdNegotiatorGame, stdNegotiatorGameEntity, stdNegotiatorGameTrait, stdNegotiatorGamePage, type StdNegotiatorGameParams } from './std-negotiator-game.js';
export { stdSimulatorGame, stdSimulatorGameEntity, stdSimulatorGameTrait, stdSimulatorGamePage, type StdSimulatorGameParams } from './std-simulator-game.js';
export { stdEventHandlerGame, stdEventHandlerGameEntity, stdEventHandlerGameTrait, stdEventHandlerGamePage, type StdEventHandlerGameParams } from './std-event-handler-game.js';

// ============================================================================
// Organisms (compose molecules via compose)
// ============================================================================

export { stdSocialFeed, type StdSocialFeedParams } from './std-social-feed.js';
export { stdLms, type StdLmsParams } from './std-lms.js';
export { stdCrm, type StdCrmParams } from './std-crm.js';
export { stdHrPortal, type StdHrPortalParams } from './std-hr-portal.js';
export { stdHelpdesk, type StdHelpdeskParams } from './std-helpdesk.js';
export { stdEcommerce, type StdEcommerceParams } from './std-ecommerce.js';
export { stdHealthcare, type StdHealthcareParams } from './std-healthcare.js';
export { stdCms, type StdCmsParams } from './std-cms.js';
export { stdProjectManager, type StdProjectManagerParams } from './std-project-manager.js';
export { stdBookingSystem, type StdBookingSystemParams } from './std-booking-system.js';

// DevOps
export { stdDevopsDashboard, type StdDevopsDashboardParams } from './std-devops-dashboard.js';
export { stdCicdPipeline, type StdCicdPipelineParams } from './std-cicd-pipeline.js';
export { stdApiGateway, type StdApiGatewayParams } from './std-api-gateway.js';

// Games
export { stdRpgGame, type StdRpgGameParams } from './std-rpg-game.js';
export { stdPlatformerApp, type StdPlatformerAppParams } from './std-platformer-app.js';
export { stdPuzzleApp, type StdPuzzleAppParams } from './std-puzzle-app.js';
export { stdStrategyGame, type StdStrategyGameParams } from './std-strategy-game.js';
export { stdArcadeGame, type StdArcadeGameParams } from './std-arcade-game.js';

// Educational
export { stdCodingAcademy, type StdCodingAcademyParams } from './std-coding-academy.js';
export { stdStemLab, type StdStemLabParams } from './std-stem-lab.js';
export { stdLogicTraining, type StdLogicTrainingParams } from './std-logic-training.js';

// IoT + Finance
export { stdIotDashboard, type StdIotDashboardParams } from './std-iot-dashboard.js';
export { stdRealtimeChat, type StdRealtimeChatParams } from './std-realtime-chat.js';
export { stdFinanceTracker, type StdFinanceTrackerParams } from './std-finance-tracker.js';
export { stdTradingDashboard, type StdTradingDashboardParams } from './std-trading-dashboard.js';

// ============================================================================
// Composition (re-export from core)
// ============================================================================

export { connect, compose, pipe, makeEntity, makePage, makeOrbital, mergeOrbitals, wire, extractTrait, ensureIdField, plural } from '@almadar/core/builders';
