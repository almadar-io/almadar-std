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
// Atoms: UI building blocks (used by molecules)
// ============================================================================

export { stdBrowse, stdBrowseEntity, stdBrowseTrait, stdBrowsePage, type StdBrowseParams } from './atoms/std-browse.js';
export { stdModal, stdModalEntity, stdModalTrait, stdModalPage, type StdModalParams } from './atoms/std-modal.js';
export { stdConfirmation, stdConfirmationEntity, stdConfirmationTrait, stdConfirmationPage, type StdConfirmationParams } from './atoms/std-confirmation.js';
export { stdSearch, stdSearchEntity, stdSearchTrait, stdSearchPage, type StdSearchParams } from './atoms/std-search.js';
export { stdFilter, stdFilterEntity, stdFilterTrait, stdFilterPage, type StdFilterParams } from './atoms/std-filter.js';
export { stdSort, stdSortEntity, stdSortTrait, stdSortPage, type StdSortParams } from './atoms/std-sort.js';
export { stdPagination, stdPaginationEntity, stdPaginationTrait, stdPaginationPage, type StdPaginationParams } from './atoms/std-pagination.js';
export { stdDrawer, stdDrawerEntity, stdDrawerTrait, stdDrawerPage, type StdDrawerParams } from './atoms/std-drawer.js';
export { stdNotification, stdNotificationEntity, stdNotificationTrait, stdNotificationPage, type StdNotificationParams } from './atoms/std-notification.js';
export { stdTimer, stdTimerEntity, stdTimerTrait, stdTimerPage, type StdTimerParams } from './atoms/std-timer.js';
export { stdTabs, stdTabsEntity, stdTabsTrait, stdTabsPage, type StdTabsParams } from './atoms/std-tabs.js';
export { stdLoading, stdLoadingEntity, stdLoadingTrait, stdLoadingPage, type StdLoadingParams } from './atoms/std-loading.js';
export { stdSelection, stdSelectionEntity, stdSelectionTrait, stdSelectionPage, type StdSelectionParams } from './atoms/std-selection.js';
export { stdUndo, stdUndoEntity, stdUndoTrait, stdUndoPage, type StdUndoParams } from './atoms/std-undo.js';
export { stdInput, stdInputEntity, stdInputTrait, stdInputPage, type StdInputParams } from './atoms/std-input.js';

// ============================================================================
// Atoms: Domain-specific (self-contained, not decomposable)
// ============================================================================

export { stdWizard, stdWizardEntity, stdWizardTrait, stdWizardPage, type StdWizardParams } from './atoms/std-wizard.js';
export { stdDisplay, stdDisplayEntity, stdDisplayTrait, stdDisplayPage, type StdDisplayParams } from './atoms/std-display.js';
export { stdAsync, stdAsyncEntity, stdAsyncTrait, stdAsyncPage, type StdAsyncParams } from './atoms/std-async.js';
export { stdCombat, stdCombatEntity, stdCombatTrait, stdCombatPage, type StdCombatParams } from './atoms/std-combat.js';
export { stdGameflow, stdGameflowEntity, stdGameflowTrait, stdGameflowPage, type StdGameflowParams } from './atoms/std-gameflow.js';
export { stdMovement, stdMovementEntity, stdMovementTrait, stdMovementPage, type StdMovementParams } from './atoms/std-movement.js';
export { stdQuest, stdQuestEntity, stdQuestTrait, stdQuestPage, type StdQuestParams } from './atoms/std-quest.js';
export { stdOverworld, stdOverworldEntity, stdOverworldTrait, stdOverworldPage, type StdOverworldParams } from './atoms/std-overworld.js';
export { stdCircuitBreaker, stdCircuitBreakerEntity, stdCircuitBreakerTrait, stdCircuitBreakerPage, type StdCircuitBreakerParams } from './atoms/std-circuit-breaker.js';
export { stdCacheAside, stdCacheAsideEntity, stdCacheAsideTrait, stdCacheAsidePage, type StdCacheAsideParams } from './atoms/std-cache-aside.js';
export { stdScore, stdScoreEntity, stdScoreTrait, stdScorePage, type StdScoreParams } from './atoms/std-score.js';
export { stdCalendar, stdCalendarEntity, stdCalendarTrait, stdCalendarPage, type StdCalendarParams } from './atoms/std-calendar.js';
export { stdGallery, stdGalleryEntity, stdGalleryTrait, stdGalleryPage, type StdGalleryParams } from './atoms/std-gallery.js';
export { stdFlipCard, stdFlipCardEntity, stdFlipCardTrait, stdFlipCardPage, type StdFlipCardParams } from './atoms/std-flip-card.js';
export { stdRating, stdRatingEntity, stdRatingTrait, stdRatingPage, type StdRatingParams } from './atoms/std-rating.js';
export { stdUpload, stdUploadEntity, stdUploadTrait, stdUploadPage, type StdUploadParams } from './atoms/std-upload.js';
export { stdTheme, stdThemeEntity, stdThemeTrait, stdThemePage, type StdThemeParams } from './atoms/std-theme.js';
export { stdTextEffects, stdTextEffectsEntity, stdTextEffectsTrait, stdTextEffectsPage, type StdTextEffectsParams } from './atoms/std-text-effects.js';
export { stdCollision, stdCollisionEntity, stdCollisionTrait, stdCollisionPage, type StdCollisionParams } from './atoms/std-collision.js';
export { stdPhysics2d, stdPhysics2dEntity, stdPhysics2dTrait, stdPhysics2dPage, type StdPhysics2dParams } from './atoms/std-physics2d.js';
export { stdRateLimiter, stdRateLimiterEntity, stdRateLimiterTrait, stdRateLimiterPage, type StdRateLimiterParams } from './atoms/std-rate-limiter.js';

// ============================================================================
// Atoms: Game UI patterns
// ============================================================================

export { stdGameHud, stdGameHudEntity, stdGameHudTrait, stdGameHudPage, type StdGameHudParams } from './atoms/std-game-hud.js';
export { stdScoreBoard, stdScoreBoardEntity, stdScoreBoardTrait, stdScoreBoardPage, type StdScoreBoardParams } from './atoms/std-score-board.js';
export { stdGameMenu, stdGameMenuEntity, stdGameMenuTrait, stdGameMenuPage, type StdGameMenuParams } from './atoms/std-game-menu.js';
export { stdGameOverScreen, stdGameOverScreenEntity, stdGameOverScreenTrait, stdGameOverScreenPage, type StdGameOverScreenParams } from './atoms/std-game-over-screen.js';
export { stdDialogueBox, stdDialogueBoxEntity, stdDialogueBoxTrait, stdDialogueBoxPage, type StdDialogueBoxParams } from './atoms/std-dialogue-box.js';
export { stdInventoryPanel, stdInventoryPanelEntity, stdInventoryPanelTrait, stdInventoryPanelPage, type StdInventoryPanelParams } from './atoms/std-inventory-panel.js';
export { stdCombatLog, stdCombatLogEntity, stdCombatLogTrait, stdCombatLogPage, type StdCombatLogParams } from './atoms/std-combat-log.js';
export { stdSprite, stdSpriteEntity, stdSpriteTrait, stdSpritePage, type StdSpriteParams } from './atoms/std-sprite.js';
export { stdGameAudio, stdGameAudioEntity, stdGameAudioTrait, stdGameAudioPage, type StdGameAudioParams } from './atoms/std-game-audio.js';

// ============================================================================
// Atoms: Game canvas patterns
// ============================================================================

export { stdIsometricCanvas, stdIsometricCanvasEntity, stdIsometricCanvasTrait, stdIsometricCanvasPage, type StdIsometricCanvasParams } from './atoms/std-isometric-canvas.js';
export { stdPlatformerCanvas, stdPlatformerCanvasEntity, stdPlatformerCanvasTrait, stdPlatformerCanvasPage, type StdPlatformerCanvasParams } from './atoms/std-platformer-canvas.js';
export { stdSimulationCanvas, stdSimulationCanvasEntity, stdSimulationCanvasTrait, stdSimulationCanvasPage, type StdSimulationCanvasParams } from './atoms/std-simulation-canvas.js';
export { stdGameCanvas2d, stdGameCanvas2dEntity, stdGameCanvas2dTrait, stdGameCanvas2dPage, type StdGameCanvas2dParams } from './atoms/std-game-canvas-2d.js';
export { stdGameCanvas3d, stdGameCanvas3dEntity, stdGameCanvas3dTrait, stdGameCanvas3dPage, type StdGameCanvas3dParams } from './atoms/std-game-canvas-3d.js';

// ============================================================================
// Molecules (compose atoms)
// ============================================================================

export { stdList, stdListEntity, stdListTrait, stdListPage, type StdListParams } from './molecules/std-list.js';
export { stdCart, stdCartEntity, stdCartTrait, stdCartPage, type StdCartParams } from './molecules/std-cart.js';
export { stdDetail, stdDetailEntity, stdDetailTrait, stdDetailPage, type StdDetailParams } from './molecules/std-detail.js';
export { stdInventory, stdInventoryEntity, stdInventoryTrait, stdInventoryPage, type StdInventoryParams } from './molecules/std-inventory.js';
export { stdMessaging, stdMessagingEntity, stdMessagingTrait, stdMessagingPage, type StdMessagingParams } from './molecules/std-messaging.js';
export { stdGeospatial, stdGeospatialEntity, stdGeospatialTrait, stdGeospatialPage, type StdGeospatialParams } from './molecules/std-geospatial.js';
export { stdQuiz, stdQuizEntity, stdQuizTrait, stdQuizPage, type StdQuizParams } from './molecules/std-quiz.js';
export { stdFormAdvanced, stdFormAdvancedEntity, stdFormAdvancedTrait, stdFormAdvancedPage, type StdFormAdvancedParams } from './molecules/std-form-advanced.js';

// Molecules: Game genres
export { stdTurnBasedBattle, stdTurnBasedBattleEntity, stdTurnBasedBattleTrait, stdTurnBasedBattlePage, type StdTurnBasedBattleParams } from './molecules/std-turn-based-battle.js';
export { stdPlatformerGame, stdPlatformerGameEntity, stdPlatformerGameTrait, stdPlatformerGamePage, type StdPlatformerGameParams } from './molecules/std-platformer-game.js';
export { stdPuzzleGame, stdPuzzleGameEntity, stdPuzzleGameTrait, stdPuzzleGamePage, type StdPuzzleGameParams } from './molecules/std-puzzle-game.js';

// Molecules: Educational games (board-based)
export { stdBuilderGame, stdBuilderGameEntity, stdBuilderGameTrait, stdBuilderGamePage, type StdBuilderGameParams } from './molecules/std-builder-game.js';
export { stdClassifierGame, stdClassifierGameEntity, stdClassifierGameTrait, stdClassifierGamePage, type StdClassifierGameParams } from './molecules/std-classifier-game.js';
export { stdSequencerGame, stdSequencerGameEntity, stdSequencerGameTrait, stdSequencerGamePage, type StdSequencerGameParams } from './molecules/std-sequencer-game.js';
export { stdDebuggerGame, stdDebuggerGameEntity, stdDebuggerGameTrait, stdDebuggerGamePage, type StdDebuggerGameParams } from './molecules/std-debugger-game.js';
export { stdNegotiatorGame, stdNegotiatorGameEntity, stdNegotiatorGameTrait, stdNegotiatorGamePage, type StdNegotiatorGameParams } from './molecules/std-negotiator-game.js';
export { stdSimulatorGame, stdSimulatorGameEntity, stdSimulatorGameTrait, stdSimulatorGamePage, type StdSimulatorGameParams } from './molecules/std-simulator-game.js';
export { stdEventHandlerGame, stdEventHandlerGameEntity, stdEventHandlerGameTrait, stdEventHandlerGamePage, type StdEventHandlerGameParams } from './molecules/std-event-handler-game.js';

// Molecules: ML pipelines
export { stdClassifier, stdClassifierEntity, stdClassifierTrait, stdClassifierPage, type StdClassifierParams } from './ml/molecules/std-classifier.js';
export { stdTrainer, stdTrainerEntity, stdTrainerTrait, stdTrainerPage, type StdTrainerParams } from './ml/molecules/std-trainer.js';
export { stdRlAgent, stdRlAgentEntity, stdRlAgentTrait, stdRlAgentPage, type StdRlAgentParams } from './ml/molecules/std-rl-agent.js';
export { stdGraphClassifier, stdGraphClassifierEntity, stdGraphClassifierTrait, stdGraphClassifierPage, type StdGraphClassifierParams } from './ml/molecules/std-graph-classifier.js';
export { stdTextClassifier, stdTextClassifierEntity, stdTextClassifierTrait, stdTextClassifierPage, type StdTextClassifierParams } from './ml/molecules/std-text-classifier.js';
export { stdAutoregressive, stdAutoregressiveEntity, stdAutoregressiveTrait, stdAutoregressivePage, type StdAutoregressiveParams } from './ml/molecules/std-autoregressive.js';

// ============================================================================
// Molecules: Service compositions
// ============================================================================

export { stdServicePaymentFlow, stdServicePaymentFlowEntity, stdServicePaymentFlowPage, type StdServicePaymentFlowParams } from './molecules/std-service-payment-flow.js';
export { stdServiceNotificationHub, stdServiceNotificationHubEntity, stdServiceNotificationHubTrait, stdServiceNotificationHubPage, type StdServiceNotificationHubParams } from './molecules/std-service-notification-hub.js';
export { stdServiceContentPipeline, stdServiceContentPipelineEntity, stdServiceContentPipelineTrait, stdServiceContentPipelinePage, type StdServiceContentPipelineParams } from './molecules/std-service-content-pipeline.js';
export { stdServiceDevopsToolkit, stdServiceDevopsToolkitEntity, stdServiceDevopsToolkitPage, type StdServiceDevopsToolkitParams } from './molecules/std-service-devops-toolkit.js';
export { stdServiceCustomApiTester, stdServiceCustomApiTesterEntity, stdServiceCustomApiTesterTrait, stdServiceCustomApiTesterPage, type StdServiceCustomApiTesterParams } from './molecules/std-service-custom-api-tester.js';

// ============================================================================
// Organisms (compose molecules via compose)
// ============================================================================

export { stdSocialFeed, type StdSocialFeedParams } from './organisms/std-social-feed.js';
export { stdLms, type StdLmsParams } from './organisms/std-lms.js';
export { stdCrm, type StdCrmParams } from './organisms/std-crm.js';
export { stdHrPortal, type StdHrPortalParams } from './organisms/std-hr-portal.js';
export { stdHelpdesk, type StdHelpdeskParams } from './organisms/std-helpdesk.js';
export { stdEcommerce, type StdEcommerceParams } from './organisms/std-ecommerce.js';
export { stdHealthcare, type StdHealthcareParams } from './organisms/std-healthcare.js';
export { stdCms, type StdCmsParams } from './organisms/std-cms.js';
export { stdProjectManager, type StdProjectManagerParams } from './organisms/std-project-manager.js';
export { stdBookingSystem, type StdBookingSystemParams } from './organisms/std-booking-system.js';

// DevOps
export { stdDevopsDashboard, type StdDevopsDashboardParams } from './organisms/std-devops-dashboard.js';
export { stdCicdPipeline, type StdCicdPipelineParams } from './organisms/std-cicd-pipeline.js';
export { stdApiGateway, type StdApiGatewayParams } from './organisms/std-api-gateway.js';

// Games
export { stdRpgGame, type StdRpgGameParams } from './organisms/std-rpg-game.js';
export { stdPlatformerApp, type StdPlatformerAppParams } from './organisms/std-platformer-app.js';
export { stdPuzzleApp, type StdPuzzleAppParams } from './organisms/std-puzzle-app.js';
export { stdStrategyGame, type StdStrategyGameParams } from './organisms/std-strategy-game.js';
export { stdArcadeGame, type StdArcadeGameParams } from './organisms/std-arcade-game.js';

// Educational
export { stdCodingAcademy, type StdCodingAcademyParams } from './organisms/std-coding-academy.js';
export { stdStemLab, type StdStemLabParams } from './organisms/std-stem-lab.js';
export { stdLogicTraining, type StdLogicTrainingParams } from './organisms/std-logic-training.js';

// Service applications
export { stdServiceMarketplace, type StdServiceMarketplaceParams } from './organisms/std-service-marketplace.js';
export { stdServiceResearchAssistant, type StdServiceResearchAssistantParams } from './organisms/std-service-research-assistant.js';

// IoT + Finance
export { stdIotDashboard, type StdIotDashboardParams } from './organisms/std-iot-dashboard.js';
export { stdRealtimeChat, type StdRealtimeChatParams } from './organisms/std-realtime-chat.js';
export { stdFinanceTracker, type StdFinanceTrackerParams } from './organisms/std-finance-tracker.js';
export { stdTradingDashboard, type StdTradingDashboardParams } from './organisms/std-trading-dashboard.js';

// Agent organisms
export { stdAgentAssistant, type StdAgentAssistantParams } from './organisms/std-agent-assistant.js';
export { stdAgentBuilder, type StdAgentBuilderParams } from './organisms/std-agent-builder.js';
export { stdAgentReviewer, type StdAgentReviewerParams } from './organisms/std-agent-reviewer.js';
export { stdAgentPipeline, type StdAgentPipelineParams } from './organisms/std-agent-pipeline.js';
export { stdAgentTutor, type StdAgentTutorParams } from './organisms/std-agent-tutor.js';

// Atoms: Agent
export { stdAgentMemory, stdAgentMemoryEntity, stdAgentMemoryTrait, stdAgentMemoryPage, type StdAgentMemoryParams } from './atoms/std-agent-memory.js';
export { stdAgentCompletion, stdAgentCompletionEntity, stdAgentCompletionTrait, stdAgentCompletionPage, type StdAgentCompletionParams } from './atoms/std-agent-completion.js';
export { stdAgentConversation, stdAgentConversationEntity, stdAgentConversationTrait, stdAgentConversationPage, type StdAgentConversationParams } from './atoms/std-agent-conversation.js';
export { stdAgentToolCall, stdAgentToolCallEntity, stdAgentToolCallTrait, stdAgentToolCallPage, type StdAgentToolCallParams } from './atoms/std-agent-tool-call.js';
export { stdAgentContextWindow, stdAgentContextWindowEntity, stdAgentContextWindowTrait, stdAgentContextWindowPage, type StdAgentContextWindowParams } from './atoms/std-agent-context-window.js';
export { stdAgentProvider, stdAgentProviderEntity, stdAgentProviderTrait, stdAgentProviderPage, type StdAgentProviderParams } from './atoms/std-agent-provider.js';
export { stdAgentSession, stdAgentSessionEntity, stdAgentSessionTrait, stdAgentSessionPage, type StdAgentSessionParams } from './atoms/std-agent-session.js';
export { stdAgentClassifier, stdAgentClassifierEntity, stdAgentClassifierTrait, stdAgentClassifierPage, type StdAgentClassifierParams } from './atoms/std-agent-classifier.js';
export { stdAgentSearch, stdAgentSearchEntity, stdAgentSearchTrait, stdAgentSearchPage, type StdAgentSearchParams } from './atoms/std-agent-search.js';
export { stdAgentChatThread, stdAgentChatThreadEntity, stdAgentChatThreadTrait, stdAgentChatThreadPage, type StdAgentChatThreadParams } from './atoms/std-agent-chat-thread.js';
export { stdAgentActivityLog, stdAgentActivityLogEntity, stdAgentActivityLogTrait, stdAgentActivityLogPage, type StdAgentActivityLogParams } from './atoms/std-agent-activity-log.js';
export { stdAgentStepProgress, stdAgentStepProgressEntity, stdAgentStepProgressTrait, stdAgentStepProgressPage, type StdAgentStepProgressParams } from './atoms/std-agent-step-progress.js';
export { stdAgentTokenGauge, stdAgentTokenGaugeEntity, stdAgentTokenGaugeTrait, stdAgentTokenGaugePage, type StdAgentTokenGaugeParams } from './atoms/std-agent-token-gauge.js';

// Molecules: Agent
export { stdAgentRag, stdAgentRagEntity, stdAgentRagTrait, stdAgentRagPage, type StdAgentRagParams } from './molecules/std-agent-rag.js';
export { stdAgentToolLoop, stdAgentToolLoopEntity, stdAgentToolLoopTrait, stdAgentToolLoopPage, type StdAgentToolLoopParams } from './molecules/std-agent-tool-loop.js';
export { stdAgentFixLoop, stdAgentFixLoopEntity, stdAgentFixLoopTrait, stdAgentFixLoopPage, type StdAgentFixLoopParams } from './molecules/std-agent-fix-loop.js';
export { stdAgentPlanner, stdAgentPlannerEntity, stdAgentPlannerTrait, stdAgentPlannerPage, type StdAgentPlannerParams } from './molecules/std-agent-planner.js';
export { stdAgentLearner, stdAgentLearnerEntity, stdAgentLearnerTrait, stdAgentLearnerPage, type StdAgentLearnerParams } from './molecules/std-agent-learner.js';

// OS Triggers
export { stdValidateOnSave, type StdValidateOnSaveParams } from './atoms/std-validate-on-save.js';

// ============================================================================
// Atoms: Service integrations
// ============================================================================

export { stdServiceEmail, stdServiceEmailEntity, stdServiceEmailTrait, stdServiceEmailPage, type StdServiceEmailParams } from './atoms/std-service-email.js';
export { stdServiceStripe, stdServiceStripeEntity, stdServiceStripeTrait, stdServiceStripePage, type StdServiceStripeParams } from './atoms/std-service-stripe.js';
export { stdServiceTwilio, stdServiceTwilioEntity, stdServiceTwilioTrait, stdServiceTwilioPage, type StdServiceTwilioParams } from './atoms/std-service-twilio.js';
export { stdServiceGithub, stdServiceGithubEntity, stdServiceGithubTrait, stdServiceGithubPage, type StdServiceGithubParams } from './atoms/std-service-github.js';
export { stdServiceYoutube, stdServiceYoutubeEntity, stdServiceYoutubeTrait, stdServiceYoutubePage, type StdServiceYoutubeParams } from './atoms/std-service-youtube.js';
export { stdServiceLlm, stdServiceLlmEntity, stdServiceLlmTrait, stdServiceLlmPage, type StdServiceLlmParams } from './atoms/std-service-llm.js';
export { stdServiceRedis, stdServiceRedisEntity, stdServiceRedisTrait, stdServiceRedisPage, type StdServiceRedisParams } from './atoms/std-service-redis.js';
export { stdServiceStorage, stdServiceStorageEntity, stdServiceStorageTrait, stdServiceStoragePage, type StdServiceStorageParams } from './atoms/std-service-storage.js';
export { stdServiceOauth, stdServiceOauthEntity, stdServiceOauthTrait, stdServiceOauthPage, type StdServiceOauthParams } from './atoms/std-service-oauth.js';
export { stdServiceCustomHeader, stdServiceCustomHeaderEntity, stdServiceCustomHeaderTrait, stdServiceCustomHeaderPage, type StdServiceCustomHeaderParams } from './atoms/std-service-custom-header.js';
export { stdServiceCustomBearer, stdServiceCustomBearerEntity, stdServiceCustomBearerTrait, stdServiceCustomBearerPage, type StdServiceCustomBearerParams } from './atoms/std-service-custom-bearer.js';
export { stdServiceCustomQuery, stdServiceCustomQueryEntity, stdServiceCustomQueryTrait, stdServiceCustomQueryPage, type StdServiceCustomQueryParams } from './atoms/std-service-custom-query.js';
export { stdServiceCustomNoauth, stdServiceCustomNoauthEntity, stdServiceCustomNoauthTrait, stdServiceCustomNoauthPage, type StdServiceCustomNoauthParams } from './atoms/std-service-custom-noauth.js';

// ============================================================================
// Composition (re-export from core)
// ============================================================================

export { connect, compose, pipe, makeEntity, makePage, makeOrbital, makeSchema, mergeOrbitals, wire, extractTrait, ensureIdField, plural } from '@almadar/core/builders';
