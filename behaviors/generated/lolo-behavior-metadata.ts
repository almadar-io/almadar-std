/**
 * lolo-behavior-metadata.ts
 *
 * AUTO-GENERATED — DO NOT EDIT BY HAND.
 *
 * Regenerate with:
 *   cd packages/almadar-std && npx tsx scripts/build-lolo-behavior-metadata.ts
 *
 * This module ships @almadar/std's behavior parameter metadata as a runtime
 * constant so consumers like @almadar-tools/lolo-types-sync can import it
 * via the package's public API instead of walking workspace source files.
 */

export const LOLO_BEHAVIOR_METADATA = {
  "generatedAt": "2026-04-08T05:15:55.664Z",
  "behaviors": [
    {
      "name": "std-agent-activity-log",
      "level": "atom",
      "family": "agent",
      "description": "Chronological action log atom for tracking agent operations. Provides a timeline view of agent actions with status indicators, duration tracking, and clear functionality. Listens for LOG_ENTRY events from sibling traits.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "LOG_ENTRY",
        "CLEAR"
      ],
      "composableWith": [
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-collision",
        "std-combat-log",
        "std-rate-limiter",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-undo",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-agent-activity-log.ts (StdAgentActivityLogParams)"
    },
    {
      "name": "std-agent-assistant",
      "level": "organism",
      "family": "agent",
      "description": "Full chat assistant organism. Composes molecule + atoms into a multi-turn conversational agent with memory persistence, context compaction, provider switching, tabbed views, and a memory sidebar drawer. Composed from: - stdAgentConversation: multi-turn chat with generate + context tracking - stdAgentMemory: memory lifecycle (memorize, recall, pin, forget, reinforce, decay) - stdAgentContextWindow: token monitoring and auto-compaction - stdAgentProvider: provider switching based on task complexity - stdTabs: Chat / Memory / Settings tab navigation - stdDrawer: memory sidebar for quick recall Cross-trait events: - MEMORIZE_RESPONSE (Conversation -> Memory): auto-memorize important responses - PROVIDER_CHANGED (Provider -> Conversation): notify conversation of provider switch Pages: /chat (initial), /memory, /settings",
      "params": [
        {
          "name": "appName",
          "type": "string",
          "optional": true
        },
        {
          "name": "assistantFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "memoryFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "providerFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "COMPOSE",
        "SEND",
        "CLEAR"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-collision",
        "std-combat-log",
        "std-messaging",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-undo",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-agent-assistant.ts (StdAgentAssistantParams)"
    },
    {
      "name": "std-agent-builder",
      "level": "organism",
      "family": "agent",
      "description": "Schema builder agent organism. Full build cycle that plans, generates, validates, and fixes .orb programs. Composes planner + tool-loop + fix-loop molecules with session management and tabbed views. Composed from: - stdAgentPlanner (molecule): task planning with classification and memory - stdAgentToolLoop (molecule): iterative tool execution - stdAgentFixLoop (molecule): validation-fix cycle - stdAgentSession: session forking and checkpointing - stdTabs: Plan / Build / Validate / Fix tab navigation - stdAgentStepProgress: overall build pipeline progress indicator Cross-trait events: - PLAN_READY (Planner -> ToolLoop): plan complete, begin building - TOOL_LOOP_DONE (ToolLoop -> FixLoop): schema generated, validate it - FIX_SUCCEEDED (FixLoop -> Memory): record successful fix pattern Pages: /plan (initial), /build, /validate, /fix",
      "params": [
        {
          "name": "appName",
          "type": "string",
          "optional": true
        },
        {
          "name": "taskFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "fixFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "memoryFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "PLAN",
        "CLASSIFIED",
        "MEMORIES_LOADED",
        "PLAN_GENERATED",
        "FAILED",
        "RESET"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-combat",
        "std-devops-dashboard",
        "std-form-advanced",
        "std-loading",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-score",
        "std-score-board",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-text-effects",
        "std-timer",
        "std-upload",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-agent-builder.ts (StdAgentBuilderParams)"
    },
    {
      "name": "std-agent-chat-thread",
      "level": "atom",
      "family": "agent",
      "description": "Chat message thread atom for agent conversations. Displays a chronological list of messages (user, assistant, tool) with compose/send flow. Emits configurable send event for orchestrating traits to handle the actual agent call.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "onSendEvent",
          "type": "string",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "COMPOSE",
        "SEND",
        "CLEAR"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-collision",
        "std-combat-log",
        "std-messaging",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-undo",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-agent-chat-thread.ts (StdAgentChatThreadParams)"
    },
    {
      "name": "std-agent-classifier",
      "level": "atom",
      "family": "agent",
      "description": "Classification flow atom for agent-powered text classification. Composes UI atoms (stdModal for input form, stdNotification for result badge) with an agent trait that uses agent/generate with a classification prompt.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "categories",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CLASSIFY",
        "CLOSE",
        "SAVE"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-drawer",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-modal",
        "std-movement",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-rpg-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-agent-classifier.ts (StdAgentClassifierParams)"
    },
    {
      "name": "std-agent-completion",
      "level": "atom",
      "family": "agent",
      "description": "Completion flow atom for agent text generation. Composes UI atoms (stdModal for prompt input, stdNotification for feedback) with an agent trait that handles agent/generate and retry logic.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "GENERATE",
        "CLOSE",
        "SAVE"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-drawer",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-modal",
        "std-movement",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-rpg-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-agent-completion.ts (StdAgentCompletionParams)"
    },
    {
      "name": "std-agent-context-window",
      "level": "atom",
      "family": "agent",
      "description": "Context window management atom for agent token tracking. Composes UI atoms (stdAgentTokenGauge for visual display, stdNotification for threshold alerts) with an agent trait that handles agent/compact, agent/token-count, and agent/context-usage.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "warningThreshold",
          "type": "number",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "UPDATE",
        "COMPACT",
        "RESET"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-combat",
        "std-devops-dashboard",
        "std-form-advanced",
        "std-loading",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-score",
        "std-score-board",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-text-effects",
        "std-timer",
        "std-upload",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-agent-context-window.ts (StdAgentContextWindowParams)"
    },
    {
      "name": "std-agent-conversation",
      "level": "atom",
      "family": "agent",
      "description": "Conversation flow atom for multi-turn agent interactions. Composes stdAgentChatThread (message display and compose) with an agent trait that handles agent/generate for AI replies and TOKEN_UPDATE emitting.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "COMPOSE",
        "SEND",
        "CLEAR"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-collision",
        "std-combat-log",
        "std-messaging",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-undo",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-agent-conversation.ts (StdAgentConversationParams)"
    },
    {
      "name": "std-agent-fix-loop",
      "level": "molecule",
      "family": "agent",
      "description": "Composes agent atoms + UI atoms into an iterative validation-fix loop with step progress tracking and an errors browse list. Validates a target, generates a fix via LLM, applies it via tool invocation, then re-validates. Composed atoms: - stdAgentToolCall (validate): run validation tool - stdAgentToolCall (fix): apply generated fix - stdAgentCompletion: generate fix via LLM - stdAgentStepProgress: visual step indicator - stdBrowse: browsable errors list",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "maxAttempts",
          "type": "number",
          "optional": true
        },
        {
          "name": "validateTool",
          "type": "string",
          "optional": true
        },
        {
          "name": "fixTool",
          "type": "string",
          "optional": true
        }
      ],
      "connectableEvents": [
        "FIX",
        "VALIDATION_PASSED",
        "VALIDATION_ERRORS",
        "FIX_GENERATED",
        "FIX_APPLIED",
        "EXCEEDED_ATTEMPTS",
        "FAILED",
        "RESET"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-combat",
        "std-devops-dashboard",
        "std-form-advanced",
        "std-loading",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-score",
        "std-score-board",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-text-effects",
        "std-timer",
        "std-upload",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/molecules/std-agent-fix-loop.ts (StdAgentFixLoopParams)"
    },
    {
      "name": "std-agent-learner",
      "level": "molecule",
      "family": "agent",
      "description": "Composes agent atoms + UI atoms into an outcome learning pipeline with an activity log for learning history and a browse list for records. Listens for task success/failure events, memorizes outcomes, reinforces memories for successes, applies decay for failures, and adjusts provider routing based on accumulated results. Composed atoms: - stdAgentMemory: memorize outcomes, reinforce/decay based on results - stdAgentCompletion: analyze outcome impact via LLM - stdAgentProvider: adjust provider routing based on success patterns - stdAgentActivityLog: chronological learning timeline - stdBrowse: browsable records list",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "fallbackProvider",
          "type": "string",
          "optional": true
        },
        {
          "name": "failureThreshold",
          "type": "number",
          "optional": true
        }
      ],
      "connectableEvents": [
        "TASK_SUCCEEDED",
        "TASK_FAILED",
        "RECORDED",
        "ANALYSIS_DONE",
        "FAILED",
        "RESET"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-combat",
        "std-devops-dashboard",
        "std-form-advanced",
        "std-loading",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-score",
        "std-score-board",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-text-effects",
        "std-timer",
        "std-upload",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/molecules/std-agent-learner.ts (StdAgentLearnerParams)"
    },
    {
      "name": "std-agent-memory",
      "level": "atom",
      "family": "agent",
      "description": "Memory lifecycle atom for agent memory operations. Composes UI atoms (stdBrowse for memory table, stdModal for memorize form) with an agent trait that handles agent/memorize, agent/recall, agent/pin, agent/forget, agent/reinforce, and agent/decay operators.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "MEMORIZE",
        "RECALL",
        "DECAY",
        "PIN",
        "REINFORCE",
        "FORGET",
        "MEMORIZED",
        "PINNED",
        "FORGOT",
        "REINFORCED",
        "DECAYED"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-rate-limiter",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-agent-memory.ts (StdAgentMemoryParams)"
    },
    {
      "name": "std-agent-pipeline",
      "level": "organism",
      "family": "agent",
      "description": "Multi-step pipeline organism. Composes planner + tool-loop molecules with session management, step progress tracking, and a session tree drawer. Composed from: - stdAgentPlanner (molecule): breaks goal into ordered steps - stdAgentToolLoop (molecule): executes steps with tool invocations - stdAgentSession: forks sessions at checkpoints, supports rollback - stdAgentStepProgress: visual pipeline step indicator - stdDrawer: session tree sidebar for navigating branches Cross-trait events: - PIPELINE_PLANNED (Planner -> ToolLoop): plan ready, start execution - STEP_COMPLETE (ToolLoop -> Session): checkpoint after each step - PIPELINE_FINISHED (ToolLoop -> Memory): pipeline done, archive results Pages: /pipeline (initial), /execution, /logs",
      "params": [
        {
          "name": "appName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pipelineFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "executionFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "memoryFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "PLAN",
        "CLASSIFIED",
        "MEMORIES_LOADED",
        "PLAN_GENERATED",
        "FAILED",
        "RESET"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-combat",
        "std-devops-dashboard",
        "std-form-advanced",
        "std-loading",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-score",
        "std-score-board",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-text-effects",
        "std-timer",
        "std-upload",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-agent-pipeline.ts (StdAgentPipelineParams)"
    },
    {
      "name": "std-agent-planner",
      "level": "molecule",
      "family": "agent",
      "description": "Composes agent atoms + UI atoms into a task planning pipeline with a modal for task input and an activity log for plan history. Classifies the incoming task, recalls relevant memories for context, then generates a step-by-step execution plan with confidence scoring. Composed atoms: - stdAgentClassifier: categorize the task type - stdAgentCompletion: generate the step-by-step plan via LLM - stdAgentMemory: recall relevant past patterns and plans - stdModal: task input form overlay - stdAgentActivityLog: plan history timeline",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "categories",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "memoryLimit",
          "type": "number",
          "optional": true
        }
      ],
      "connectableEvents": [
        "PLAN",
        "CLASSIFIED",
        "MEMORIES_LOADED",
        "PLAN_GENERATED",
        "FAILED",
        "RESET"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-combat",
        "std-devops-dashboard",
        "std-form-advanced",
        "std-loading",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-score",
        "std-score-board",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-text-effects",
        "std-timer",
        "std-upload",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/molecules/std-agent-planner.ts (StdAgentPlannerParams)"
    },
    {
      "name": "std-agent-provider",
      "level": "atom",
      "family": "agent",
      "description": "Provider routing atom for agent model/provider switching. Composes UI atoms (stdModal for switch form, stdNotification for confirmation) with an agent trait that handles agent/switch-provider, agent/provider, and agent/model operators.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "SWITCH",
        "CLOSE",
        "SAVE"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-drawer",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-modal",
        "std-movement",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-rpg-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-agent-provider.ts (StdAgentProviderParams)"
    },
    {
      "name": "std-agent-rag",
      "level": "molecule",
      "family": "agent",
      "description": "Composes agent atoms + UI atoms into a RAG pipeline with tabbed views. Retrieves relevant memories and code snippets, injects them as context, then generates a response with the augmented prompt. Composed atoms: - stdAgentMemory: recall memories by semantic query - stdAgentSearch: search code repositories for relevant snippets - stdAgentCompletion: generate response with augmented context - stdTabs: tabbed view for Query / Sources / Response Cross-trait events: - GENERATE (RagOrchestrator -> MemoryLifecycle): trigger recall - RETRIEVAL_DONE (RagOrchestrator -> SearchLifecycle): trigger search after recall - GENERATION_DONE (RagOrchestrator -> CompletionFlow): trigger completion",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "memoryLimit",
          "type": "number",
          "optional": true
        },
        {
          "name": "searchLanguage",
          "type": "string",
          "optional": true
        }
      ],
      "connectableEvents": [
        "GENERATE",
        "RETRIEVAL_DONE",
        "GENERATION_DONE",
        "FAILED",
        "RESET"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-async",
        "std-autoregressive",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-combat",
        "std-devops-dashboard",
        "std-form-advanced",
        "std-loading",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-score",
        "std-score-board",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-text-effects",
        "std-timer",
        "std-upload",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/molecules/std-agent-rag.ts (StdAgentRagParams)"
    },
    {
      "name": "std-agent-reviewer",
      "level": "organism",
      "family": "agent",
      "description": "Schema/code reviewer organism. Composes RAG molecule + classifier atom to classify input, search for relevant patterns, recall best practices, and generate structured review output with tabbed views and an issues browse. Composed from: - stdAgentRag (molecule): retrieval-augmented generation pipeline - stdAgentClassifier: classifies input type (schema, component, trait, etc.) - stdAgentCompletion: generates review with scoring - stdTabs: Input / Analysis / Review tab navigation - stdBrowse: browsable issues list Cross-trait events: - CLASSIFIED (Classifier -> Reviewer): input classified, begin review - REVIEW_COMPLETE (Reviewer -> Memory): reinforce recalled best practices Pages: /review (initial), /analysis, /issues",
      "params": [
        {
          "name": "appName",
          "type": "string",
          "optional": true
        },
        {
          "name": "reviewFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "analysisFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "memoryFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "SUBMIT_REVIEW",
        "PATTERNS_FOUND",
        "REVIEW_GENERATED",
        "RESET"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-combat",
        "std-devops-dashboard",
        "std-form-advanced",
        "std-loading",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-score",
        "std-score-board",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-text-effects",
        "std-timer",
        "std-upload",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-agent-reviewer.ts (StdAgentReviewerParams)"
    },
    {
      "name": "std-agent-search",
      "level": "atom",
      "family": "agent",
      "description": "Code search flow atom for agent-powered codebase searching. Composes stdBrowse (results table) with an agent trait that handles agent/search-code.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "SEARCH",
        "CLEAR",
        "VIEW",
        "SEARCHED"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-collision",
        "std-combat-log",
        "std-crm",
        "std-detail",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-messaging",
        "std-project-manager",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-undo",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-agent-search.ts (StdAgentSearchParams)"
    },
    {
      "name": "std-agent-session",
      "level": "atom",
      "family": "agent",
      "description": "Session lifecycle atom for agent session management. Composes UI atoms (stdBrowse for session list, stdModal for fork label form) with an agent trait that handles agent/fork, agent/label, and agent/session-id.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "FORK",
        "LABEL",
        "END",
        "VIEW",
        "FORKED",
        "LABELED",
        "ENDED"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-crm",
        "std-detail",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-messaging",
        "std-project-manager",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-agent-session.ts (StdAgentSessionParams)"
    },
    {
      "name": "std-agent-step-progress",
      "level": "atom",
      "family": "agent",
      "description": "Pipeline/workflow step indicator atom. Tracks progress through a series of named steps with start/advance/complete/fail lifecycle. Listens for ADVANCE, COMPLETE, FAIL so orchestrating traits can drive the progress externally.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "stepLabels",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "ADVANCE",
        "COMPLETE",
        "FAIL",
        "RESET"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-coding-academy",
        "std-combat",
        "std-debugger-game",
        "std-devops-dashboard",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-form-advanced",
        "std-game-canvas2d",
        "std-game-menu",
        "std-gameflow",
        "std-loading",
        "std-logic-training",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-rpg-game",
        "std-score",
        "std-score-board",
        "std-sequencer-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-stem-lab",
        "std-strategy-game",
        "std-text-effects",
        "std-timer",
        "std-turn-based-battle",
        "std-upload",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-agent-step-progress.ts (StdAgentStepProgressParams)"
    },
    {
      "name": "std-agent-token-gauge",
      "level": "atom",
      "family": "agent",
      "description": "Token usage display atom with threshold-based state transitions. Shows current token count, usage percentage, and progress bar. Transitions from normal -> warning -> critical based on configurable thresholds. Provides compact and reset actions.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "threshold",
          "type": "number",
          "optional": true
        },
        {
          "name": "maxTokens",
          "type": "number",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "UPDATE",
        "COMPACT",
        "RESET"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-combat",
        "std-devops-dashboard",
        "std-form-advanced",
        "std-loading",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-score",
        "std-score-board",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-text-effects",
        "std-timer",
        "std-upload",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-agent-token-gauge.ts (StdAgentTokenGaugeParams)"
    },
    {
      "name": "std-agent-tool-call",
      "level": "atom",
      "family": "agent",
      "description": "Tool execution atom for agent tool invocation. Composes UI atoms (stdModal for invoke form, stdAgentActivityLog for call history) with an agent trait that handles agent/invoke and TOOL_STARTED/TOOL_COMPLETED emits.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "INVOKE",
        "CLOSE",
        "SAVE"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-drawer",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-modal",
        "std-movement",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-rpg-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-agent-tool-call.ts (StdAgentToolCallParams)"
    },
    {
      "name": "std-agent-tool-loop",
      "level": "molecule",
      "family": "agent",
      "description": "Composes agent atoms + UI atoms into an iterative tool-use loop with step progress tracking and activity logging. The agent generates a plan, invokes tools to execute steps, checks results, and either loops or finishes. Composed atoms: - stdAgentCompletion: LLM plan generation and result checking - stdAgentToolCall: tool invocation with argument passing - stdAgentContextWindow: context window monitoring and compaction - stdAgentStepProgress: visual pipeline step indicator - stdAgentActivityLog: chronological action timeline",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "maxIterations",
          "type": "number",
          "optional": true
        },
        {
          "name": "compactThreshold",
          "type": "number",
          "optional": true
        }
      ],
      "connectableEvents": [
        "EXECUTE",
        "PLAN_GENERATED",
        "TOOL_RESULT",
        "CHECK_PASSED",
        "CHECK_NEEDS_MORE",
        "MAX_ITERATIONS",
        "FAILED",
        "RESET"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tutor",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-combat",
        "std-devops-dashboard",
        "std-form-advanced",
        "std-loading",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-score",
        "std-score-board",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-text-effects",
        "std-timer",
        "std-upload",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/molecules/std-agent-tool-loop.ts (StdAgentToolLoopParams)"
    },
    {
      "name": "std-agent-tutor",
      "level": "organism",
      "family": "agent",
      "description": "Teaching assistant organism. Composes conversation + memory + classifier atoms with tabbed views and a concept browse list. Classifies student level, recalls prior learning from memory, generates explanations with context-aware difficulty, and tracks concept strength. Composed from: - stdAgentConversation: multi-turn teaching interaction - stdAgentMemory: tracks concept strength per student topic - stdAgentClassifier: classifies student level - stdTabs: Teach / Quiz / Progress tab navigation - stdBrowse: browsable concepts list with strength tracking Cross-trait events: - ASSESSMENT_DONE (Teaching -> Quiz): student assessed, generate quiz - QUIZ_GRADED (Quiz -> Memory): reinforce or decay concept based on answer Pages: /teach (initial), /quiz, /concepts",
      "params": [
        {
          "name": "appName",
          "type": "string",
          "optional": true
        },
        {
          "name": "sessionFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "quizFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "memoryFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START_SESSION",
        "ASSESSMENT_COMPLETE",
        "EXPLAIN_MORE",
        "START_QUIZ",
        "RESET"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-combat",
        "std-devops-dashboard",
        "std-form-advanced",
        "std-loading",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-score",
        "std-score-board",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-text-effects",
        "std-timer",
        "std-upload",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-agent-tutor.ts (StdAgentTutorParams)"
    },
    {
      "name": "std-api-gateway",
      "level": "organism",
      "family": "devops",
      "description": "API gateway management organism. Composes: stdList(Route) + stdCircuitBreaker(Backend) + stdDisplay(Analytics) Pages: /routes (initial), /backends, /analytics",
      "params": [
        {
          "name": "routeFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "backendFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "analyticsFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CREATE",
        "VIEW",
        "EDIT",
        "DELETE",
        "ROUTE_CREATED",
        "ROUTE_UPDATED",
        "CONFIRM_DELETE",
        "CANCEL",
        "CLOSE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-search",
        "std-agent-session",
        "std-agent-tool-call",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-devops-dashboard",
        "std-drawer",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-messaging",
        "std-modal",
        "std-movement",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-rpg-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-api-gateway.ts (StdApiGatewayParams)"
    },
    {
      "name": "std-arcade-game",
      "level": "organism",
      "family": "game",
      "description": "Arcade game organism. Composes: stdGameflow(ArcadeState) + stdGameCanvas2d(ArcadeCanvas)         + stdScoreBoard(ArcadeScore) + stdGameHud(ArcadeHud) Pages: /game (initial), /scores",
      "params": [
        {
          "name": "arcadeStateFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "arcadeCanvasFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "arcadeScoreFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "arcadeHudFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "PAUSE",
        "RESUME",
        "GAME_OVER",
        "RESTART",
        "CLOSE",
        "NAVIGATE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-step-progress",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-async",
        "std-booking-system",
        "std-builder-game",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-combat-log",
        "std-confirmation",
        "std-crm",
        "std-debugger-game",
        "std-dialogue-box",
        "std-drawer",
        "std-ecommerce",
        "std-event-handler-game",
        "std-finance-tracker",
        "std-gallery",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-modal",
        "std-movement",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-service-marketplace",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-timer",
        "std-turn-based-battle",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/organisms/std-arcade-game.ts (StdArcadeGameParams)"
    },
    {
      "name": "std-async",
      "level": "atom",
      "family": "async",
      "description": "Async operation behavior: idle, loading, success, error. Covers fetch, submit, retry, and polling patterns in one molecule. Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "loadingMessage",
          "type": "string",
          "optional": true
        },
        {
          "name": "successMessage",
          "type": "string",
          "optional": true
        },
        {
          "name": "errorMessage",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "retryable",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "LOADED",
        "FAILED",
        "RETRY",
        "RESET"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-arcade-game",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-builder-game",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-cms",
        "std-coding-academy",
        "std-collision",
        "std-combat",
        "std-combat-log",
        "std-confirmation",
        "std-crm",
        "std-debugger-game",
        "std-detail",
        "std-devops-dashboard",
        "std-dialogue-box",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-event-handler-game",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-inventory",
        "std-inventory-panel",
        "std-iot-dashboard",
        "std-isometric-canvas",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-movement",
        "std-negotiator-game",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-rpg-game",
        "std-score",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-sequencer-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-social-feed",
        "std-sort",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-turn-based-battle",
        "std-undo",
        "std-upload",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-async.ts (StdAsyncParams)"
    },
    {
      "name": "std-booking-system",
      "level": "organism",
      "family": "scheduling",
      "description": "Booking system organism. Composes molecules via compose: - stdList(Provider): provider directory with CRUD - stdWizard(Booking): booking wizard - stdList(Appointment): appointment list with CRUD - stdDisplay(Schedule): schedule overview dashboard Cross-orbital connections: - BOOK: ProviderBrowse -> BookingWizard - CONFIRM: BookingWizard -> AppointmentBrowse",
      "params": [
        {
          "name": "appName",
          "type": "string",
          "optional": true
        },
        {
          "name": "providerFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "bookingFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "appointmentFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "scheduleFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CREATE",
        "VIEW",
        "EDIT",
        "DELETE",
        "PROVIDER_CREATED",
        "PROVIDER_UPDATED",
        "CONFIRM_DELETE",
        "CANCEL",
        "CLOSE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-search",
        "std-agent-session",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-drawer",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-messaging",
        "std-modal",
        "std-movement",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-rpg-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-booking-system.ts (StdBookingSystemParams)"
    },
    {
      "name": "std-browse",
      "level": "atom",
      "family": "browse",
      "description": "Data grid browsing atom. Renders a list of entities with configurable item actions. The browsing view that molecules compose with modal/confirmation atoms.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "traitName",
          "type": "string",
          "optional": true
        },
        {
          "name": "listFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "emptyTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "emptyDescription",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerActions",
          "type": "Array",
          "optional": true
        },
        {
          "name": "itemActions",
          "type": "Array",
          "optional": true
        },
        {
          "name": "refreshEvents",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "displayPattern",
          "type": "string",
          "optional": true
        },
        {
          "name": "customRenderItem",
          "type": "any",
          "optional": true
        },
        {
          "name": "displayColumns",
          "type": "[any]",
          "optional": true
        },
        {
          "name": "statsBar",
          "type": "[any]",
          "optional": true
        },
        {
          "name": "displayProps",
          "type": "Record",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [],
      "composableWith": [
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-rate-limiter",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-browse.ts (StdBrowseParams)"
    },
    {
      "name": "std-builder-game",
      "level": "molecule",
      "family": "game",
      "description": "Educational game molecule: menu -> playing -> complete. Uses the `builder-board` pattern for the playing state.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "gameTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "COMPLETE",
        "RESTART",
        "NAVIGATE"
      ],
      "composableWith": [
        "std-agent-step-progress",
        "std-arcade-game",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-coding-academy",
        "std-combat",
        "std-combat-log",
        "std-debugger-game",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-loading",
        "std-logic-training",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-service-llm",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-timer",
        "std-turn-based-battle",
        "std-upload",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/molecules/std-builder-game.ts (StdBuilderGameParams)"
    },
    {
      "name": "std-cache-aside",
      "level": "atom",
      "family": "infrastructure",
      "description": "Cache management behavior: empty, cached, stale with fetch/invalidate cycle. Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "listFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "emptyTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "emptyDescription",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "ttl",
          "type": "number",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "FETCH",
        "CACHED",
        "INVALIDATE",
        "REFRESH"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-builder-game",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-cms",
        "std-coding-academy",
        "std-collision",
        "std-combat",
        "std-combat-log",
        "std-confirmation",
        "std-crm",
        "std-debugger-game",
        "std-detail",
        "std-devops-dashboard",
        "std-dialogue-box",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-event-handler-game",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-inventory",
        "std-inventory-panel",
        "std-iot-dashboard",
        "std-isometric-canvas",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-movement",
        "std-negotiator-game",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-rpg-game",
        "std-score",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-sequencer-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-social-feed",
        "std-sort",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-turn-based-battle",
        "std-undo",
        "std-upload",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-cache-aside.ts (StdCacheAsideParams)"
    },
    {
      "name": "std-calendar",
      "level": "atom",
      "family": "calendar",
      "description": "Calendar browsing atom with month/day/slot views. Absorbs: calendar-grid, day-cell, time-slot-cell, date-range-selector.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "SELECT_DAY",
        "SELECT_SLOT",
        "BACK"
      ],
      "composableWith": [
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-inventory-panel",
        "std-overworld",
        "std-rate-limiter",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-calendar.ts (StdCalendarParams)"
    },
    {
      "name": "std-cart",
      "level": "molecule",
      "family": "commerce",
      "description": "Shopping cart molecule. Composes atoms: - Cart-specific browse trait (empty/hasItems/checkout states) - stdModal for the add-item form (responds to ADD_ITEM)",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "listFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "formFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "addButtonLabel",
          "type": "string",
          "optional": true
        },
        {
          "name": "checkoutButtonLabel",
          "type": "string",
          "optional": true
        },
        {
          "name": "emptyTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "emptyDescription",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "ADD_ITEM",
        "REQUEST_REMOVE",
        "PROCEED_CHECKOUT",
        "BACK_TO_CART",
        "CONFIRM_ORDER"
      ],
      "composableWith": [
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-ecommerce",
        "std-inventory",
        "std-rate-limiter",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/molecules/std-cart.ts (StdCartParams)"
    },
    {
      "name": "std-cicd-pipeline",
      "level": "organism",
      "family": "devops",
      "description": "CI/CD pipeline organism. Composes: stdList(Build) + stdDisplay(Stage) + stdAsync(Deployment) Pages: /builds (initial), /stages, /deploy",
      "params": [
        {
          "name": "buildFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "stageFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "deploymentFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CREATE",
        "VIEW",
        "EDIT",
        "DELETE",
        "BUILD_CREATED",
        "BUILD_UPDATED",
        "CONFIRM_DELETE",
        "CANCEL",
        "CLOSE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-search",
        "std-agent-session",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-cms",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-devops-dashboard",
        "std-drawer",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-messaging",
        "std-modal",
        "std-movement",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-rpg-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-cicd-pipeline.ts (StdCicdPipelineParams)"
    },
    {
      "name": "std-circuit-breaker",
      "level": "atom",
      "family": "resilience",
      "description": "Circuit breaker pattern behavior: closed, open, halfOpen. Protects services from cascading failures with automatic recovery. Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "closedLabel",
          "type": "string",
          "optional": true
        },
        {
          "name": "openLabel",
          "type": "string",
          "optional": true
        },
        {
          "name": "halfOpenLabel",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "FAILURE",
        "SUCCESS",
        "TIMEOUT",
        "RESET"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-builder-game",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-classifier-game",
        "std-cms",
        "std-coding-academy",
        "std-collision",
        "std-combat",
        "std-combat-log",
        "std-confirmation",
        "std-crm",
        "std-debugger-game",
        "std-detail",
        "std-devops-dashboard",
        "std-dialogue-box",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-event-handler-game",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-inventory",
        "std-inventory-panel",
        "std-iot-dashboard",
        "std-isometric-canvas",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-movement",
        "std-negotiator-game",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-rpg-game",
        "std-score",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-sequencer-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-social-feed",
        "std-sort",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-turn-based-battle",
        "std-undo",
        "std-upload",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-circuit-breaker.ts (StdCircuitBreakerParams)"
    },
    {
      "name": "std-classifier-game",
      "level": "molecule",
      "family": "game",
      "description": "Educational game molecule: menu -> playing -> complete. Uses the `classifier-board` pattern for the playing state.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "gameTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "COMPLETE",
        "RESTART",
        "NAVIGATE"
      ],
      "composableWith": [
        "std-agent-step-progress",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-coding-academy",
        "std-combat",
        "std-combat-log",
        "std-debugger-game",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-loading",
        "std-logic-training",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-service-llm",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-timer",
        "std-turn-based-battle",
        "std-upload",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/molecules/std-classifier-game.ts (StdClassifierGameParams)"
    },
    {
      "name": "std-cms",
      "level": "organism",
      "family": "content",
      "description": "Content management organism. Composes molecules via compose: - stdList(Article): article management with CRUD - stdDetail(MediaAsset): media library browse + view - stdList(Category): category management Cross-orbital connections: - PUBLISH: ArticleBrowse -> MediaAssetBrowse - CATEGORIZE: ArticleBrowse -> CategoryBrowse",
      "params": [
        {
          "name": "appName",
          "type": "string",
          "optional": true
        },
        {
          "name": "articleFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "mediaAssetFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "categoryFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CREATE",
        "VIEW",
        "EDIT",
        "DELETE",
        "ARTICLE_CREATED",
        "ARTICLE_UPDATED",
        "CONFIRM_DELETE",
        "CANCEL",
        "CLOSE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-search",
        "std-agent-session",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-drawer",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-messaging",
        "std-modal",
        "std-movement",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-rpg-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-cms.ts (StdCmsParams)"
    },
    {
      "name": "std-coding-academy",
      "level": "organism",
      "family": "educational",
      "description": "Coding academy organism. Composes: stdSequencerGame(SeqChallenge) + stdBuilderGame(BuildChallenge)         + stdEventHandlerGame(EventChallenge) + stdDisplay(StudentProgress) Pages: /sequencer (initial), /builder, /events, /progress",
      "params": [
        {
          "name": "seqChallengeFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "buildChallengeFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "eventChallengeFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "studentProgressFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "COMPLETE",
        "RESTART",
        "NAVIGATE"
      ],
      "composableWith": [
        "std-agent-step-progress",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-debugger-game",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-game-canvas2d",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-loading",
        "std-logic-training",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rpg-game",
        "std-sequencer-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-stem-lab",
        "std-strategy-game",
        "std-timer",
        "std-turn-based-battle",
        "std-upload",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/organisms/std-coding-academy.ts (StdCodingAcademyParams)"
    },
    {
      "name": "std-collision",
      "level": "atom",
      "family": "collision",
      "description": "Game collision detection parameterized for any domain. Provides idle and detecting states for checking collisions between game entities. Tracks collision targets via entity fields. The state machine structure is fixed. The caller controls data and presentation.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CHECK",
        "COLLISION_DETECTED",
        "CLEAR"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-chat-thread",
        "std-agent-conversation",
        "std-agent-search",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-combat-log",
        "std-rate-limiter",
        "std-search",
        "std-selection",
        "std-undo"
      ],
      "source": "behaviors/functions/atoms/std-collision.ts (StdCollisionParams)"
    },
    {
      "name": "std-combat",
      "level": "atom",
      "family": "game",
      "description": "Attack cycle behavior: ready, attacking, cooldown, defeated. Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "attackLabel",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "ATTACK",
        "HIT",
        "COOLDOWN_END",
        "DEFEAT",
        "RESET"
      ],
      "composableWith": [
        "std-agent-builder",
        "std-agent-context-window",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-combat-log",
        "std-debugger-game",
        "std-devops-dashboard",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-form-advanced",
        "std-game-audio",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-loading",
        "std-negotiator-game",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-rpg-game",
        "std-score",
        "std-score-board",
        "std-sequencer-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-notification-hub",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-strategy-game",
        "std-text-effects",
        "std-timer",
        "std-turn-based-battle",
        "std-upload"
      ],
      "source": "behaviors/functions/atoms/std-combat.ts (StdCombatParams)"
    },
    {
      "name": "std-combat-log",
      "level": "atom",
      "family": "game",
      "description": "Scrollable combat event log atom using the `combat-log` pattern. Displays timestamped combat events with icons and colors. Supports appending new events and clearing the log.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "title",
          "type": "string",
          "optional": true
        },
        {
          "name": "maxVisible",
          "type": "number",
          "optional": true
        },
        {
          "name": "autoScroll",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "showTimestamps",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "LOG_EVENT",
        "CLEAR"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-chat-thread",
        "std-agent-conversation",
        "std-agent-search",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-collision",
        "std-combat",
        "std-debugger-game",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-game-audio",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-negotiator-game",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-sequencer-game",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-undo"
      ],
      "source": "behaviors/functions/atoms/std-combat-log.ts (StdCombatLogParams)"
    },
    {
      "name": "std-confirmation",
      "level": "atom",
      "family": "confirmation",
      "description": "Confirmation dialog behavior parameterized for any domain. Provides a two-step confirm/cancel flow before performing destructive actions. The caller handles the actual action via emits/listens. The state machine structure is fixed. The caller controls data and presentation.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "traitName",
          "type": "string",
          "optional": true
        },
        {
          "name": "confirmTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "confirmMessage",
          "type": "string",
          "optional": true
        },
        {
          "name": "confirmLabel",
          "type": "string",
          "optional": true
        },
        {
          "name": "cancelLabel",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "requestEvent",
          "type": "string",
          "optional": true
        },
        {
          "name": "confirmEvent",
          "type": "string",
          "optional": true
        },
        {
          "name": "confirmEffects",
          "type": "[any]",
          "optional": true
        },
        {
          "name": "emitOnConfirm",
          "type": "string",
          "optional": true
        },
        {
          "name": "standalone",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "REQUEST",
        "CONFIRM",
        "CANCEL",
        "CLOSE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-crm",
        "std-drawer",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-modal",
        "std-movement",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-rpg-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-confirmation.ts (StdConfirmationParams)"
    },
    {
      "name": "std-crm",
      "level": "organism",
      "family": "business",
      "description": "Customer relationship management organism. Composes molecules via compose: - stdList(Contact): CRUD list of contacts - stdList(Deal): CRUD list of deals - stdDisplay(Pipeline): read-only pipeline dashboard - stdMessaging(Note): notes/communication thread Pages: /contacts (initial), /deals, /pipeline, /notes Connections: CONVERT_LEAD (contacts->deals), CLOSE_DEAL (deals->pipeline)",
      "params": [
        {
          "name": "appName",
          "type": "string",
          "optional": true
        },
        {
          "name": "contactFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "dealFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "pipelineFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "noteFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CREATE",
        "VIEW",
        "EDIT",
        "DELETE",
        "CONTACT_CREATED",
        "CONTACT_UPDATED",
        "CONFIRM_DELETE",
        "CANCEL",
        "CLOSE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-search",
        "std-agent-session",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-confirmation",
        "std-detail",
        "std-drawer",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-messaging",
        "std-modal",
        "std-movement",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-rpg-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-crm.ts (StdCrmParams)"
    },
    {
      "name": "std-debugger-game",
      "level": "molecule",
      "family": "game",
      "description": "Educational game molecule: menu -> playing -> complete. Uses the `debugger-board` pattern for the playing state.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "gameTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "COMPLETE",
        "RESTART",
        "NAVIGATE"
      ],
      "composableWith": [
        "std-agent-step-progress",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-coding-academy",
        "std-combat",
        "std-combat-log",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-loading",
        "std-logic-training",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-service-llm",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-timer",
        "std-turn-based-battle",
        "std-upload",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/molecules/std-debugger-game.ts (StdDebuggerGameParams)"
    },
    {
      "name": "std-detail",
      "level": "molecule",
      "family": "crud",
      "description": "Browse + Create + View molecule. Composes atoms: - stdBrowse: data-grid with View item action and Create header action - stdModal: create form (responds to CREATE) - stdModal: view detail (responds to VIEW) No edit/delete from list. Used for feeds, ledgers, galleries.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "listFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "detailFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "formFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "createButtonLabel",
          "type": "string",
          "optional": true
        },
        {
          "name": "createFormTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "emptyTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "emptyDescription",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "displayPattern",
          "type": "string",
          "optional": true
        },
        {
          "name": "customRenderItem",
          "type": "any",
          "optional": true
        },
        {
          "name": "displayColumns",
          "type": "[any]",
          "optional": true
        },
        {
          "name": "statsBar",
          "type": "[any]",
          "optional": true
        },
        {
          "name": "displayProps",
          "type": "Record",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CREATE",
        "VIEW",
        "SAVE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-search",
        "std-agent-session",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-crm",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-messaging",
        "std-project-manager",
        "std-quest",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/molecules/std-detail.ts (StdDetailParams)"
    },
    {
      "name": "std-devops-dashboard",
      "level": "organism",
      "family": "devops",
      "description": "DevOps monitoring organism. Composes: stdCircuitBreaker(ServiceNode) + stdDisplay(AlertMetric)         + stdList(LogEntry) + stdDisplay(SystemMetric) Pages: /services (initial), /alerts, /logs, /metrics",
      "params": [
        {
          "name": "serviceNodeFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "alertMetricFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "logEntryFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "systemMetricFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "FAILURE",
        "SUCCESS",
        "TIMEOUT",
        "RESET"
      ],
      "composableWith": [
        "std-agent-builder",
        "std-agent-context-window",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-combat",
        "std-form-advanced",
        "std-loading",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-score",
        "std-score-board",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-text-effects",
        "std-timer",
        "std-upload",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-devops-dashboard.ts (StdDevopsDashboardParams)"
    },
    {
      "name": "std-dialogue-box",
      "level": "atom",
      "family": "game",
      "description": "RPG dialogue atom using the `dialogue-box` pattern. Shows speaker, portrait, typewriter text, and choices.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "typewriterSpeed",
          "type": "number",
          "optional": true
        },
        {
          "name": "position",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "ADVANCE",
        "CHOICE",
        "COMPLETE",
        "START_DIALOGUE"
      ],
      "composableWith": [
        "std-agent-step-progress",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-coding-academy",
        "std-combat",
        "std-combat-log",
        "std-debugger-game",
        "std-event-handler-game",
        "std-game-audio",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-logic-training",
        "std-negotiator-game",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-service-llm",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-dialogue-box.ts (StdDialogueBoxParams)"
    },
    {
      "name": "std-display",
      "level": "atom",
      "family": "display",
      "description": "Read-only display molecule with loading/refresh. Single trait (display is self-contained, no modal atoms needed). Used for dashboards, stats panels, KPIs.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "displayFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "refreshButtonLabel",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "columns",
          "type": "number",
          "optional": true
        },
        {
          "name": "emptyTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "emptyDescription",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "LOADED",
        "REFRESH",
        "REFRESHED"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-game-hud",
        "std-iot-dashboard",
        "std-loading",
        "std-rate-limiter",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-trading-dashboard",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-display.ts (StdDisplayParams)"
    },
    {
      "name": "std-drawer",
      "level": "atom",
      "family": "drawer",
      "description": "Drawer behavior parameterized for any domain. Provides a slide-out drawer that displays entity detail. Two states: closed and open, with transitions to toggle visibility. Similar to std-modal but renders to a \"drawer\" slot concept.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "drawerTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "standalone",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "OPEN",
        "CLOSE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-confirmation",
        "std-crm",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-modal",
        "std-movement",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-rpg-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-drawer.ts (StdDrawerParams)"
    },
    {
      "name": "std-ecommerce",
      "level": "organism",
      "family": "commerce",
      "description": "E-commerce organism. Composes molecules via compose: - stdList(Product): product catalog with CRUD - stdCart(CartItem): shopping cart with add/remove - stdWizard(Checkout): checkout wizard - stdList(OrderRecord): order history Cross-orbital connections: - ADD_TO_CART: ProductBrowse -> CartItemCartBrowse - CHECKOUT_STARTED: CartItemCartBrowse -> CheckoutWizard - ORDER_PLACED: CheckoutWizard -> OrderRecordBrowse",
      "params": [
        {
          "name": "appName",
          "type": "string",
          "optional": true
        },
        {
          "name": "productFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "cartItemFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "orderFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CREATE",
        "VIEW",
        "EDIT",
        "DELETE",
        "PRODUCT_CREATED",
        "PRODUCT_UPDATED",
        "CONFIRM_DELETE",
        "CANCEL",
        "CLOSE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-search",
        "std-agent-session",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-drawer",
        "std-finance-tracker",
        "std-gallery",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-messaging",
        "std-modal",
        "std-movement",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-rpg-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-ecommerce.ts (StdEcommerceParams)"
    },
    {
      "name": "std-event-handler-game",
      "level": "molecule",
      "family": "game",
      "description": "Educational game molecule: menu -> playing -> complete. Uses the `event-handler-board` pattern for the playing state.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "gameTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "COMPLETE",
        "RESTART",
        "NAVIGATE"
      ],
      "composableWith": [
        "std-agent-step-progress",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-coding-academy",
        "std-combat",
        "std-combat-log",
        "std-debugger-game",
        "std-dialogue-box",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-loading",
        "std-logic-training",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-service-llm",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-timer",
        "std-turn-based-battle",
        "std-upload",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/molecules/std-event-handler-game.ts (StdEventHandlerGameParams)"
    },
    {
      "name": "std-filter",
      "level": "atom",
      "family": "filter",
      "description": "Filter atom. Shows filter buttons per field with predefined values. Clicking a filter value transitions to filtered state. Clear resets.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "filterFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "FILTER",
        "CLEAR_FILTERS"
      ],
      "composableWith": [
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-rate-limiter",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-filter.ts (StdFilterParams)"
    },
    {
      "name": "std-finance-tracker",
      "level": "organism",
      "family": "finance",
      "description": "Finance tracker organism. Composes: stdList(Transaction) + stdDisplay(FinanceSummary) + stdDetail(FinanceReport) Pages: /transactions (initial), /summary, /reports",
      "params": [
        {
          "name": "transactionFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "financeSummaryFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "financeReportFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CREATE",
        "VIEW",
        "EDIT",
        "DELETE",
        "TRANSACTION_CREATED",
        "TRANSACTION_UPDATED",
        "CONFIRM_DELETE",
        "CANCEL",
        "CLOSE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-search",
        "std-agent-session",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-drawer",
        "std-ecommerce",
        "std-gallery",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-messaging",
        "std-modal",
        "std-movement",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-rpg-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-strategy-game",
        "std-trading-dashboard",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-finance-tracker.ts (StdFinanceTrackerParams)"
    },
    {
      "name": "std-flip-card",
      "level": "atom",
      "family": "flip-card",
      "description": "Flip card atom for flashcard-style front/back content. Absorbs: flip-container, flip-card.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "FLIP",
        "FLIP_BACK",
        "NEXT"
      ],
      "composableWith": [
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-quiz",
        "std-rate-limiter",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-flip-card.ts (StdFlipCardParams)"
    },
    {
      "name": "std-form-advanced",
      "level": "molecule",
      "family": "form",
      "description": "Advanced form molecule with relation-select for linked entity fields. Absorbs: relation-select.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "relatedEntity",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "SUBMIT",
        "RESET"
      ],
      "composableWith": [
        "std-agent-builder",
        "std-agent-context-window",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-combat",
        "std-devops-dashboard",
        "std-loading",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-score",
        "std-score-board",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-text-effects",
        "std-timer",
        "std-upload",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/molecules/std-form-advanced.ts (StdFormAdvancedParams)"
    },
    {
      "name": "std-gallery",
      "level": "atom",
      "family": "gallery",
      "description": "Image gallery atom with carousel browsing and lightbox viewing. Absorbs: carousel, lightbox.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "VIEW",
        "CLOSE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-search",
        "std-agent-session",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-drawer",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-messaging",
        "std-modal",
        "std-movement",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-rpg-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-gallery.ts (StdGalleryParams)"
    },
    {
      "name": "std-game-audio",
      "level": "atom",
      "family": "game",
      "description": "Game audio provider atom using the `game-audio-provider` pattern. Wraps child content with an audio context, providing sound playback and mute toggling.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "initialMuted",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "TOGGLE_MUTE"
      ],
      "composableWith": [
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-combat",
        "std-combat-log",
        "std-debugger-game",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-negotiator-game",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-strategy-game",
        "std-turn-based-battle"
      ],
      "source": "behaviors/functions/atoms/std-game-audio.ts (StdGameAudioParams)"
    },
    {
      "name": "std-game-canvas-2d",
      "level": "atom",
      "description": "std-game-canvas-2d behavior",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "width",
          "type": "number",
          "optional": true
        },
        {
          "name": "height",
          "type": "number",
          "optional": true
        },
        {
          "name": "fps",
          "type": "number",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [],
      "composableWith": [],
      "source": "behaviors/functions/atoms/std-game-canvas-2d.ts (StdGameCanvas2dParams)"
    },
    {
      "name": "std-game-canvas-3d",
      "level": "atom",
      "description": "std-game-canvas-3d behavior",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "orientation",
          "type": "string",
          "optional": true
        },
        {
          "name": "cameraMode",
          "type": "string",
          "optional": true
        },
        {
          "name": "showGrid",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "shadows",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "backgroundColor",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [],
      "composableWith": [],
      "source": "behaviors/functions/atoms/std-game-canvas-3d.ts (StdGameCanvas3dParams)"
    },
    {
      "name": "std-game-hud",
      "level": "atom",
      "family": "game",
      "description": "Heads-up display atom. Renders the `game-hud` pattern showing health, score, lives, and other stats.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "statFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "position",
          "type": "string",
          "optional": true
        },
        {
          "name": "size",
          "type": "string",
          "optional": true
        },
        {
          "name": "transparent",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "REFRESH"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-combat",
        "std-combat-log",
        "std-debugger-game",
        "std-dialogue-box",
        "std-display",
        "std-event-handler-game",
        "std-game-audio",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-inventory",
        "std-inventory-panel",
        "std-iot-dashboard",
        "std-isometric-canvas",
        "std-negotiator-game",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-service-oauth",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-strategy-game",
        "std-trading-dashboard",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-game-hud.ts (StdGameHudParams)"
    },
    {
      "name": "std-game-menu",
      "level": "atom",
      "family": "game",
      "description": "Game main menu atom using the `game-menu` pattern. Shows title, subtitle, and menu options (Start, Options, Credits, etc.).",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "gameTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "subtitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "menuItems",
          "type": "Array",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "NAVIGATE",
        "START",
        "OPTIONS",
        "CREDITS"
      ],
      "composableWith": [
        "std-agent-step-progress",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-coding-academy",
        "std-combat",
        "std-combat-log",
        "std-debugger-game",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-hud",
        "std-game-over-screen",
        "std-gameflow",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-loading",
        "std-logic-training",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-timer",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-game-menu.ts (StdGameMenuParams)"
    },
    {
      "name": "std-game-over-screen",
      "level": "atom",
      "family": "game",
      "description": "Game over screen atom using the `game-over-screen` pattern. Shows final score, high score, and retry/quit actions.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "title",
          "type": "string",
          "optional": true
        },
        {
          "name": "message",
          "type": "string",
          "optional": true
        },
        {
          "name": "actions",
          "type": "Array",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "NAVIGATE",
        "RESTART",
        "RETRY",
        "QUIT"
      ],
      "composableWith": [
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-coding-academy",
        "std-combat",
        "std-combat-log",
        "std-debugger-game",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-game-audio",
        "std-game-hud",
        "std-game-menu",
        "std-gameflow",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-logic-training",
        "std-negotiator-game",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quiz",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-stripe",
        "std-service-twilio",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-upload",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-game-over-screen.ts (StdGameOverScreenParams)"
    },
    {
      "name": "std-gameflow",
      "level": "atom",
      "family": "game",
      "description": "Game state management behavior: menu, playing, paused, gameover. Uses game UI patterns per state:   menu     -> game-menu (title, subtitle, Start Game button)   playing  -> game-hud (score, level stats)   paused   -> game-menu in modal (Resume, Quit buttons)   gameover -> game-over-screen (score, Play Again, Main Menu) Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "gameTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "menuTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pauseTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "gameoverTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "PAUSE",
        "RESUME",
        "GAME_OVER",
        "RESTART",
        "CLOSE",
        "NAVIGATE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-step-progress",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-builder-game",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-combat-log",
        "std-confirmation",
        "std-crm",
        "std-debugger-game",
        "std-dialogue-box",
        "std-drawer",
        "std-ecommerce",
        "std-event-handler-game",
        "std-finance-tracker",
        "std-gallery",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-modal",
        "std-movement",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-service-marketplace",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-timer",
        "std-turn-based-battle",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-gameflow.ts (StdGameflowParams)"
    },
    {
      "name": "std-geospatial",
      "level": "molecule",
      "family": "location",
      "description": "Location selection molecule. Composes atoms via shared event bus: - stdBrowse: location list with \"Select\" item action (fires SELECT) - stdModal: select/view location detail (responds to SELECT) - stdConfirmation: confirm location selection (responds to CONFIRM_SELECT) No emits/listens wiring. Traits on the same page share the event bus. Only the trait with a matching transition from its current state responds.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "listFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "detailFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "selectLabel",
          "type": "string",
          "optional": true
        },
        {
          "name": "emptyTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "emptyDescription",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "SELECT",
        "CONFIRMED"
      ],
      "composableWith": [
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-rate-limiter",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-theme",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/molecules/std-geospatial.ts (StdGeospatialParams)"
    },
    {
      "name": "std-healthcare",
      "level": "organism",
      "family": "healthcare",
      "description": "Healthcare organism. Composes molecules via compose: - stdList(Patient): patient registry with CRUD - stdList(Appointment): appointment management - stdWizard(IntakeForm): patient intake wizard - stdDetail(Prescription): prescription browse + view - stdDisplay(Dashboard): clinic dashboard KPIs Cross-orbital connections: - INTAKE_COMPLETE: IntakeFormWizard -> PatientBrowse - PRESCRIBE: AppointmentBrowse -> PrescriptionBrowse",
      "params": [
        {
          "name": "appName",
          "type": "string",
          "optional": true
        },
        {
          "name": "patientFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "appointmentFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "intakeFormFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "prescriptionFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "dashboardFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CREATE",
        "VIEW",
        "EDIT",
        "DELETE",
        "PATIENT_CREATED",
        "PATIENT_UPDATED",
        "CONFIRM_DELETE",
        "CANCEL",
        "CLOSE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-search",
        "std-agent-session",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-drawer",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-gameflow",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-messaging",
        "std-modal",
        "std-movement",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-rpg-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-healthcare.ts (StdHealthcareParams)"
    },
    {
      "name": "std-helpdesk",
      "level": "organism",
      "family": "support",
      "description": "Helpdesk organism. Composes molecules via compose: - stdList(Ticket): CRUD list of support tickets - stdMessaging(Response): messaging thread for ticket responses - stdDisplay(SupportMetrics): read-only metrics dashboard Pages: /tickets (initial), /responses, /metrics Connections: ASSIGN (tickets->responses), RESOLVE (responses->metrics)",
      "params": [
        {
          "name": "appName",
          "type": "string",
          "optional": true
        },
        {
          "name": "ticketFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "responseFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "metricsFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CREATE",
        "VIEW",
        "EDIT",
        "DELETE",
        "TICKET_CREATED",
        "TICKET_UPDATED",
        "CONFIRM_DELETE",
        "CANCEL",
        "CLOSE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-search",
        "std-agent-session",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-drawer",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-gameflow",
        "std-healthcare",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-messaging",
        "std-modal",
        "std-movement",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-rpg-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-helpdesk.ts (StdHelpdeskParams)"
    },
    {
      "name": "std-hr-portal",
      "level": "organism",
      "family": "hr",
      "description": "HR portal organism. Composes molecules via compose: - stdList(Employee): CRUD list of employees - stdWizard(Onboarding): multi-step onboarding wizard - stdList(TimeOff): CRUD list of time-off requests - stdDisplay(OrgChart): read-only org chart dashboard Pages: /employees (initial), /onboarding, /timeoff, /org-chart Connections: ONBOARD (employees->onboarding), APPROVE_LEAVE (timeoff->orgchart)",
      "params": [
        {
          "name": "appName",
          "type": "string",
          "optional": true
        },
        {
          "name": "employeeFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "onboardingFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "timeOffFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "orgChartFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CREATE",
        "VIEW",
        "EDIT",
        "DELETE",
        "EMPLOYEE_CREATED",
        "EMPLOYEE_UPDATED",
        "CONFIRM_DELETE",
        "CANCEL",
        "CLOSE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-search",
        "std-agent-session",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-drawer",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-list",
        "std-lms",
        "std-messaging",
        "std-modal",
        "std-movement",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-rpg-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-hr-portal.ts (StdHrPortalParams)"
    },
    {
      "name": "std-input",
      "level": "atom",
      "family": "input",
      "description": "Input state management parameterized for any domain. Provides idle, focused, and validating states with change tracking. The state machine structure is fixed. The caller controls data and presentation.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "inputLabel",
          "type": "string",
          "optional": true
        },
        {
          "name": "placeholder",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "FOCUS",
        "BLUR",
        "CHANGE",
        "VALIDATE"
      ],
      "composableWith": [
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-rate-limiter",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-input.ts (StdInputParams)"
    },
    {
      "name": "std-inventory",
      "level": "molecule",
      "family": "game",
      "description": "Item collection molecule. Composes atoms via shared event bus: - stdBrowse: data-grid with item actions (fires ADD_ITEM, USE_ITEM, DROP) - stdModal (add): create form for adding items (responds to ADD_ITEM) - stdModal (use): item detail for using items (responds to USE_ITEM) - stdConfirmation: drop confirmation (responds to DROP) No emits/listens wiring. Traits on the same page share the event bus. Only the trait with a matching transition from its current state responds.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "listFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "formFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "addLabel",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "ADD_ITEM",
        "USE_ITEM",
        "DROP",
        "ITEM_ADDED",
        "ITEM_USED",
        "CONFIRM_DROP"
      ],
      "composableWith": [
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-cart",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-combat",
        "std-combat-log",
        "std-debugger-game",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-game-audio",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-negotiator-game",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-strategy-game",
        "std-turn-based-battle"
      ],
      "source": "behaviors/functions/molecules/std-inventory.ts (StdInventoryParams)"
    },
    {
      "name": "std-inventory-panel",
      "level": "atom",
      "family": "game",
      "description": "Grid-based inventory atom using the `inventory-panel` pattern. Shows items in a grid with select, use, and drop actions.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "columns",
          "type": "number",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "SELECT_SLOT",
        "USE_ITEM",
        "DROP_ITEM"
      ],
      "composableWith": [
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-calendar",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-combat",
        "std-combat-log",
        "std-debugger-game",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-game-audio",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-inventory",
        "std-isometric-canvas",
        "std-negotiator-game",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-strategy-game",
        "std-turn-based-battle"
      ],
      "source": "behaviors/functions/atoms/std-inventory-panel.ts (StdInventoryPanelParams)"
    },
    {
      "name": "std-iot-dashboard",
      "level": "organism",
      "family": "iot",
      "description": "IoT dashboard organism. Composes: stdDisplay(SensorReading) + stdList(Device) + stdCircuitBreaker(DeviceAlert) Pages: /sensors (initial), /devices, /alerts",
      "params": [
        {
          "name": "sensorReadingFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "deviceFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "deviceAlertFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "LOADED",
        "REFRESH",
        "REFRESHED"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-display",
        "std-game-hud",
        "std-loading",
        "std-rate-limiter",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-trading-dashboard",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-iot-dashboard.ts (StdIotDashboardParams)"
    },
    {
      "name": "std-isometric-canvas",
      "level": "atom",
      "family": "game",
      "description": "Isometric game renderer atom using the `isometric-canvas` pattern. Renders tiles, units, and features on an isometric grid. Handles tile clicks, unit clicks, and hover events.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "boardWidth",
          "type": "number",
          "optional": true
        },
        {
          "name": "boardHeight",
          "type": "number",
          "optional": true
        },
        {
          "name": "scale",
          "type": "number",
          "optional": true
        },
        {
          "name": "unitScale",
          "type": "number",
          "optional": true
        },
        {
          "name": "debug",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "showMinimap",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "enableCamera",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "TILE_CLICK",
        "UNIT_CLICK",
        "TILE_HOVER",
        "TILE_LEAVE",
        "DESELECT"
      ],
      "composableWith": [
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-combat",
        "std-combat-log",
        "std-debugger-game",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-game-audio",
        "std-game-canvas3d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-inventory",
        "std-inventory-panel",
        "std-negotiator-game",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-selection",
        "std-sequencer-game",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-strategy-game",
        "std-turn-based-battle"
      ],
      "source": "behaviors/functions/atoms/std-isometric-canvas.ts (StdIsometricCanvasParams)"
    },
    {
      "name": "std-list",
      "level": "molecule",
      "family": "crud",
      "description": "CRUD list molecule. Composes atoms via shared event bus: - stdBrowse: data-grid with item actions (fires CREATE, VIEW, EDIT, DELETE) - stdModal (x3): create form, edit form, detail view (responds to matching events) - stdConfirmation: delete confirmation (responds to DELETE) No emits/listens wiring. Traits on the same page share the event bus. Only the trait with a matching transition from its current state responds.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "listFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "detailFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "formFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "createButtonLabel",
          "type": "string",
          "optional": true
        },
        {
          "name": "editFormTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "createFormTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "deleteMessage",
          "type": "string",
          "optional": true
        },
        {
          "name": "emptyTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "emptyDescription",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "displayPattern",
          "type": "string",
          "optional": true
        },
        {
          "name": "customRenderItem",
          "type": "any",
          "optional": true
        },
        {
          "name": "displayColumns",
          "type": "[any]",
          "optional": true
        },
        {
          "name": "statsBar",
          "type": "[any]",
          "optional": true
        },
        {
          "name": "displayProps",
          "type": "Record",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CREATE",
        "VIEW",
        "EDIT",
        "DELETE",
        "LIST_ITEM_CREATED",
        "LIST_ITEM_UPDATED",
        "CONFIRM_DELETE",
        "CANCEL",
        "CLOSE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-search",
        "std-agent-session",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-drawer",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-lms",
        "std-messaging",
        "std-modal",
        "std-movement",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-rpg-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/molecules/std-list.ts (StdListParams)"
    },
    {
      "name": "std-lms",
      "level": "organism",
      "family": "education",
      "description": "Learning management system organism. Composes molecules via compose: - stdList(Course): CRUD list of courses - stdWizard(Enrollment): multi-step enrollment wizard - stdDisplay(Progress): read-only progress dashboard Pages: /courses (initial), /enroll, /progress Connections: ENROLL (courses->enrollment), COMPLETE_LESSON (enrollment->progress)",
      "params": [
        {
          "name": "appName",
          "type": "string",
          "optional": true
        },
        {
          "name": "courseFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "enrollmentFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "progressFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CREATE",
        "VIEW",
        "EDIT",
        "DELETE",
        "COURSE_CREATED",
        "COURSE_UPDATED",
        "CONFIRM_DELETE",
        "CANCEL",
        "CLOSE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-search",
        "std-agent-session",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-drawer",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-messaging",
        "std-modal",
        "std-movement",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-rpg-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-lms.ts (StdLmsParams)"
    },
    {
      "name": "std-loading",
      "level": "atom",
      "family": "loading",
      "description": "Loading behavior parameterized for any domain. Provides a multi-state loading lifecycle: idle, loading, success, error. Tracks async operation status with appropriate UI for each state.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "title",
          "type": "string",
          "optional": true
        },
        {
          "name": "standalone",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "LOADED",
        "FAILED",
        "RESET"
      ],
      "composableWith": [
        "std-agent-builder",
        "std-agent-context-window",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-coding-academy",
        "std-combat",
        "std-debugger-game",
        "std-devops-dashboard",
        "std-display",
        "std-event-handler-game",
        "std-form-advanced",
        "std-game-canvas2d",
        "std-game-menu",
        "std-gameflow",
        "std-iot-dashboard",
        "std-logic-training",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-rpg-game",
        "std-score",
        "std-score-board",
        "std-sequencer-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-stem-lab",
        "std-strategy-game",
        "std-text-effects",
        "std-timer",
        "std-trading-dashboard",
        "std-turn-based-battle",
        "std-upload",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-loading.ts (StdLoadingParams)"
    },
    {
      "name": "std-logic-training",
      "level": "organism",
      "family": "educational",
      "description": "Logic training organism. Composes: stdDebuggerGame(DebugChallenge) + stdNegotiatorGame(NegotiateChallenge)         + stdScoreBoard(TrainingScore) Pages: /debugger (initial), /negotiator, /scores",
      "params": [
        {
          "name": "debugChallengeFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "negotiateChallengeFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "trainingScoreFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "COMPLETE",
        "RESTART",
        "NAVIGATE"
      ],
      "composableWith": [
        "std-agent-step-progress",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-coding-academy",
        "std-debugger-game",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-game-canvas2d",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-loading",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rpg-game",
        "std-sequencer-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-stem-lab",
        "std-strategy-game",
        "std-timer",
        "std-turn-based-battle",
        "std-upload",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/organisms/std-logic-training.ts (StdLogicTrainingParams)"
    },
    {
      "name": "std-messaging",
      "level": "molecule",
      "family": "communication",
      "description": "Messaging molecule. Composes atoms via shared event bus: - stdBrowse: message list with \"Compose\" header action, \"View\" item action - stdModal (compose): compose/send message form (COMPOSE -> SEND) - stdModal (view): view message detail (VIEW with id payload) No emits/listens wiring. Traits on the same page share the event bus. Only the trait with a matching transition from its current state responds.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "listFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "formFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "detailFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "composerTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "displayPattern",
          "type": "string",
          "optional": true
        },
        {
          "name": "customRenderItem",
          "type": "any",
          "optional": true
        },
        {
          "name": "displayColumns",
          "type": "[any]",
          "optional": true
        },
        {
          "name": "statsBar",
          "type": "[any]",
          "optional": true
        },
        {
          "name": "displayProps",
          "type": "Record",
          "optional": true
        }
      ],
      "connectableEvents": [
        "COMPOSE",
        "VIEW",
        "SEND"
      ],
      "composableWith": [
        "std-agent-assistant",
        "std-agent-chat-thread",
        "std-agent-conversation",
        "std-agent-search",
        "std-agent-session",
        "std-api-gateway",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-crm",
        "std-detail",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-project-manager",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/molecules/std-messaging.ts (StdMessagingParams)"
    },
    {
      "name": "std-modal",
      "level": "atom",
      "family": "modal",
      "description": "Modal overlay atom. Accepts content injection so molecules can control what renders inside the open state.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "traitName",
          "type": "string",
          "optional": true
        },
        {
          "name": "modalTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "openContent",
          "type": "any",
          "optional": true
        },
        {
          "name": "openEvent",
          "type": "string",
          "optional": true
        },
        {
          "name": "openPayload",
          "type": "Array",
          "optional": true
        },
        {
          "name": "closeEvent",
          "type": "string",
          "optional": true
        },
        {
          "name": "openEffects",
          "type": "[any]",
          "optional": true
        },
        {
          "name": "saveEvent",
          "type": "string",
          "optional": true
        },
        {
          "name": "saveEffects",
          "type": "[any]",
          "optional": true
        },
        {
          "name": "emitOnSave",
          "type": "string",
          "optional": true
        },
        {
          "name": "standalone",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "OPEN",
        "CLOSE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-confirmation",
        "std-crm",
        "std-drawer",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-movement",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-rpg-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-modal.ts (StdModalParams)"
    },
    {
      "name": "std-movement",
      "level": "atom",
      "family": "simulation",
      "description": "Entity movement behavior: idle, moving, collision detection and resolution. Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "moveSpeed",
          "type": "number",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "MOVE",
        "STOP",
        "COLLISION",
        "RESOLVE",
        "CANCEL",
        "CLOSE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-confirmation",
        "std-crm",
        "std-drawer",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-game-canvas2d",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-modal",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-rpg-game",
        "std-service-marketplace",
        "std-simulation-canvas",
        "std-strategy-game",
        "std-turn-based-battle"
      ],
      "source": "behaviors/functions/atoms/std-movement.ts (StdMovementParams)"
    },
    {
      "name": "std-negotiator-game",
      "level": "molecule",
      "family": "game",
      "description": "Educational game molecule: menu -> playing -> complete. Uses the `negotiator-board` pattern for the playing state.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "gameTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "COMPLETE",
        "RESTART",
        "NAVIGATE"
      ],
      "composableWith": [
        "std-agent-step-progress",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-coding-academy",
        "std-combat",
        "std-combat-log",
        "std-debugger-game",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-loading",
        "std-logic-training",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-service-llm",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-timer",
        "std-turn-based-battle",
        "std-upload",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/molecules/std-negotiator-game.ts (StdNegotiatorGameParams)"
    },
    {
      "name": "std-notification",
      "level": "atom",
      "family": "notification",
      "description": "Notification behavior parameterized for any domain. Provides a show/hide notification display. The state machine structure is fixed. The caller controls data and presentation.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "standalone",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "SHOW",
        "HIDE"
      ],
      "composableWith": [
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-rate-limiter",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-notification.ts (StdNotificationParams)"
    },
    {
      "name": "std-overworld",
      "level": "atom",
      "family": "navigation",
      "description": "Map/zone navigation behavior: exploring, transitioning, entered. Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "listFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "worldTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "emptyTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "emptyDescription",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "TRAVEL",
        "ARRIVE",
        "BACK"
      ],
      "composableWith": [
        "std-async",
        "std-cache-aside",
        "std-calendar",
        "std-circuit-breaker",
        "std-rate-limiter",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-overworld.ts (StdOverworldParams)"
    },
    {
      "name": "std-pagination",
      "level": "atom",
      "family": "pagination",
      "description": "Pagination behavior parameterized for any domain. Provides page/pageSize controls that paginate entity data. Single idle state with a self-loop that re-renders with the new page applied.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "PAGE"
      ],
      "composableWith": [
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-rate-limiter",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-pagination.ts (StdPaginationParams)"
    },
    {
      "name": "std-physics2d",
      "level": "atom",
      "family": "physics2d",
      "description": "2D physics simulation parameterized for any domain. Provides idle and simulating states with force application and tick updates. Tracks position and velocity via entity fields. The state machine structure is fixed. The caller controls data and presentation.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "STOP",
        "TICK",
        "APPLY_FORCE"
      ],
      "composableWith": [
        "std-agent-step-progress",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-coding-academy",
        "std-debugger-game",
        "std-event-handler-game",
        "std-game-canvas2d",
        "std-game-menu",
        "std-gameflow",
        "std-loading",
        "std-logic-training",
        "std-movement",
        "std-negotiator-game",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-rate-limiter",
        "std-rpg-game",
        "std-sequencer-game",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-stem-lab",
        "std-strategy-game",
        "std-timer",
        "std-turn-based-battle"
      ],
      "source": "behaviors/functions/atoms/std-physics2d.ts (StdPhysics2dParams)"
    },
    {
      "name": "std-platformer-app",
      "level": "organism",
      "family": "game",
      "description": "Platformer game organism. Composes: stdPlatformerGame(PlatLevel) + stdScoreBoard(PlatScore) + stdInventory(Collectible) Pages: /game (initial), /scores, /collectibles",
      "params": [
        {
          "name": "platLevelFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "platScoreFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "collectibleFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "LEFT",
        "RIGHT",
        "JUMP",
        "STOP",
        "PAUSE",
        "RESUME",
        "GAME_OVER",
        "RESTART",
        "CLOSE",
        "NAVIGATE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-step-progress",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-builder-game",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-combat-log",
        "std-confirmation",
        "std-crm",
        "std-debugger-game",
        "std-dialogue-box",
        "std-drawer",
        "std-ecommerce",
        "std-event-handler-game",
        "std-finance-tracker",
        "std-gallery",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-modal",
        "std-movement",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-service-marketplace",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-timer",
        "std-turn-based-battle",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/organisms/std-platformer-app.ts (StdPlatformerAppParams)"
    },
    {
      "name": "std-platformer-canvas",
      "level": "atom",
      "family": "game",
      "description": "Side-scrolling platformer atom using the `platformer-canvas` pattern. Renders player, platforms, and handles movement events.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "canvasWidth",
          "type": "number",
          "optional": true
        },
        {
          "name": "canvasHeight",
          "type": "number",
          "optional": true
        },
        {
          "name": "worldWidth",
          "type": "number",
          "optional": true
        },
        {
          "name": "worldHeight",
          "type": "number",
          "optional": true
        },
        {
          "name": "followCamera",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "bgColor",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "LEFT",
        "RIGHT",
        "JUMP",
        "STOP",
        "START"
      ],
      "composableWith": [
        "std-agent-step-progress",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-coding-academy",
        "std-combat",
        "std-combat-log",
        "std-debugger-game",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-loading",
        "std-logic-training",
        "std-movement",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-timer",
        "std-turn-based-battle"
      ],
      "source": "behaviors/functions/atoms/std-platformer-canvas.ts (StdPlatformerCanvasParams)"
    },
    {
      "name": "std-platformer-game",
      "level": "molecule",
      "family": "game",
      "description": "Side-scrolling platformer game molecule. Composes game atoms into a two-trait orbital: 1. PlatformerFlow trait (primary): menu -> playing -> paused -> gameover    Renders game-menu, platformer-canvas, game-over-screen per state. 2. PlatformerCanvas trait (secondary): extracted from stdPlatformerCanvas,    INIT render-ui removed (standalone: false pattern) so the flow trait    owns the main render slot.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "gameTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "canvasWidth",
          "type": "number",
          "optional": true
        },
        {
          "name": "canvasHeight",
          "type": "number",
          "optional": true
        },
        {
          "name": "menuSubtitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pauseTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "gameoverTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "LEFT",
        "RIGHT",
        "JUMP",
        "STOP",
        "PAUSE",
        "RESUME",
        "GAME_OVER",
        "RESTART",
        "CLOSE",
        "NAVIGATE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-step-progress",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-builder-game",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-combat-log",
        "std-confirmation",
        "std-crm",
        "std-debugger-game",
        "std-dialogue-box",
        "std-drawer",
        "std-ecommerce",
        "std-event-handler-game",
        "std-finance-tracker",
        "std-gallery",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-modal",
        "std-movement",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-service-marketplace",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-timer",
        "std-turn-based-battle",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/molecules/std-platformer-game.ts (StdPlatformerGameParams)"
    },
    {
      "name": "std-project-manager",
      "level": "organism",
      "family": "productivity",
      "description": "Project management organism. Composes molecules via compose: - stdList(Task): task management with CRUD - stdList(Sprint): sprint management with CRUD - stdDisplay(Burndown): burndown chart dashboard Cross-orbital connections: - ASSIGN_TASK: SprintBrowse -> TaskBrowse - COMPLETE_SPRINT: SprintBrowse -> BurndownDisplay",
      "params": [
        {
          "name": "appName",
          "type": "string",
          "optional": true
        },
        {
          "name": "taskFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "sprintFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "burndownFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CREATE",
        "VIEW",
        "EDIT",
        "DELETE",
        "TASK_CREATED",
        "TASK_UPDATED",
        "CONFIRM_DELETE",
        "CANCEL",
        "CLOSE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-search",
        "std-agent-session",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-drawer",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-messaging",
        "std-modal",
        "std-movement",
        "std-platformer-app",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-rpg-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-project-manager.ts (StdProjectManagerParams)"
    },
    {
      "name": "std-puzzle-app",
      "level": "organism",
      "family": "game",
      "description": "Puzzle game organism. Composes: stdPuzzleGame(PuzzleLevel) + stdScoreBoard(PuzzleScore) Pages: /puzzle (initial), /scores",
      "params": [
        {
          "name": "puzzleLevelFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "puzzleScoreFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "MOVE",
        "HINT",
        "PAUSE",
        "RESUME",
        "GAME_OVER",
        "RESTART",
        "CLOSE",
        "NAVIGATE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-step-progress",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-builder-game",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-combat-log",
        "std-confirmation",
        "std-crm",
        "std-debugger-game",
        "std-dialogue-box",
        "std-drawer",
        "std-ecommerce",
        "std-event-handler-game",
        "std-finance-tracker",
        "std-gallery",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-modal",
        "std-movement",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-service-marketplace",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-timer",
        "std-turn-based-battle",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/organisms/std-puzzle-app.ts (StdPuzzleAppParams)"
    },
    {
      "name": "std-puzzle-game",
      "level": "molecule",
      "family": "game",
      "description": "Puzzle game molecule. Composes game atoms into a two-trait orbital: 1. PuzzleFlow trait (primary): menu -> playing -> paused -> gameover    Renders game-menu, game-canvas-2d with score-board, game-over-screen. 2. PuzzleScore trait (secondary): extracted from stdScoreBoard,    INIT render-ui removed (standalone: false pattern) so the flow trait    owns the main render slot.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "gameTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "width",
          "type": "number",
          "optional": true
        },
        {
          "name": "height",
          "type": "number",
          "optional": true
        },
        {
          "name": "menuSubtitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pauseTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "gameoverTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "MOVE",
        "HINT",
        "PAUSE",
        "RESUME",
        "GAME_OVER",
        "RESTART",
        "CLOSE",
        "NAVIGATE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-step-progress",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-builder-game",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-combat-log",
        "std-confirmation",
        "std-crm",
        "std-debugger-game",
        "std-dialogue-box",
        "std-drawer",
        "std-ecommerce",
        "std-event-handler-game",
        "std-finance-tracker",
        "std-gallery",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-modal",
        "std-movement",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-service-marketplace",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-timer",
        "std-turn-based-battle",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/molecules/std-puzzle-game.ts (StdPuzzleGameParams)"
    },
    {
      "name": "std-quest",
      "level": "atom",
      "family": "gameplay",
      "description": "Quest/objective tracking behavior: available, active, complete, failed. Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "listFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "formFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "questTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "emptyTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "emptyDescription",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "ACCEPT",
        "PROGRESS",
        "SAVE",
        "COMPLETE",
        "FAIL",
        "RESET",
        "CANCEL",
        "CLOSE"
      ],
      "composableWith": [
        "std-agent-builder",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-builder-game",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-confirmation",
        "std-crm",
        "std-debugger-game",
        "std-detail",
        "std-devops-dashboard",
        "std-dialogue-box",
        "std-drawer",
        "std-ecommerce",
        "std-event-handler-game",
        "std-finance-tracker",
        "std-form-advanced",
        "std-gallery",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-modal",
        "std-movement",
        "std-negotiator-game",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-rate-limiter",
        "std-rating",
        "std-rpg-game",
        "std-score",
        "std-score-board",
        "std-sequencer-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-social-feed",
        "std-stem-lab",
        "std-strategy-game",
        "std-text-effects",
        "std-timer",
        "std-turn-based-battle",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-quest.ts (StdQuestParams)"
    },
    {
      "name": "std-quiz",
      "level": "molecule",
      "family": "quiz",
      "description": "Quiz molecule composing flip-card atom with question/answer flow. Absorbs: quiz-block.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "ANSWER",
        "NEXT",
        "RESTART"
      ],
      "composableWith": [
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-coding-academy",
        "std-debugger-game",
        "std-event-handler-game",
        "std-flip-card",
        "std-game-over-screen",
        "std-gameflow",
        "std-logic-training",
        "std-negotiator-game",
        "std-platformer-app",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-rate-limiter",
        "std-rpg-game",
        "std-sequencer-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulator-game",
        "std-stem-lab",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/molecules/std-quiz.ts (StdQuizParams)"
    },
    {
      "name": "std-rate-limiter",
      "level": "atom",
      "family": "rate-limiter",
      "description": "Rate limiting parameterized for any domain. Provides open and throttled states for controlling request frequency. Tracks request count and throttle status via entity fields. The state machine structure is fixed. The caller controls data and presentation.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "REQUEST",
        "THROTTLE",
        "RESET"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-builder-game",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-cms",
        "std-coding-academy",
        "std-collision",
        "std-combat",
        "std-combat-log",
        "std-confirmation",
        "std-crm",
        "std-debugger-game",
        "std-detail",
        "std-devops-dashboard",
        "std-dialogue-box",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-event-handler-game",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-inventory",
        "std-inventory-panel",
        "std-iot-dashboard",
        "std-isometric-canvas",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-movement",
        "std-negotiator-game",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rating",
        "std-realtime-chat",
        "std-rpg-game",
        "std-score",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-sequencer-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-social-feed",
        "std-sort",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-turn-based-battle",
        "std-undo",
        "std-upload",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-rate-limiter.ts (StdRateLimiterParams)"
    },
    {
      "name": "std-rating",
      "level": "atom",
      "family": "rating",
      "description": "Rating atom with star-rating input and display. Absorbs: star-rating.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "maxRating",
          "type": "number",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "RATE",
        "RESET"
      ],
      "composableWith": [
        "std-agent-builder",
        "std-agent-context-window",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-combat",
        "std-devops-dashboard",
        "std-form-advanced",
        "std-loading",
        "std-quest",
        "std-rate-limiter",
        "std-score",
        "std-score-board",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-text-effects",
        "std-timer",
        "std-upload",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-rating.ts (StdRatingParams)"
    },
    {
      "name": "std-realtime-chat",
      "level": "organism",
      "family": "communication",
      "description": "Realtime chat organism. Composes: stdMessaging(ChatMessage) + stdList(Channel) + stdDisplay(OnlineUser) Pages: /chat (initial), /channels, /online",
      "params": [
        {
          "name": "chatMessageFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "channelFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "onlineUserFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "COMPOSE",
        "VIEW",
        "SEND"
      ],
      "composableWith": [
        "std-agent-assistant",
        "std-agent-chat-thread",
        "std-agent-conversation",
        "std-agent-search",
        "std-agent-session",
        "std-api-gateway",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-crm",
        "std-detail",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-messaging",
        "std-project-manager",
        "std-rate-limiter",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-realtime-chat.ts (StdRealtimeChatParams)"
    },
    {
      "name": "std-rpg-game",
      "level": "organism",
      "family": "game",
      "description": "RPG game organism. Composes: stdTurnBasedBattle(BattleState) + stdOverworld(WorldZone)         + stdInventory(RpgItem) + stdQuest(Mission) Pages: /battle, /world (initial), /inventory, /quests Connections: ENCOUNTER_STARTED (world->battle), LOOT_DROPPED (battle->inventory),              QUEST_ACCEPTED (world->quests)",
      "params": [
        {
          "name": "battleStateFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "worldZoneFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "rpgItemFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "missionFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "END_TURN",
        "PAUSE",
        "RESUME",
        "GAME_OVER",
        "RESTART",
        "CLOSE",
        "NAVIGATE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-step-progress",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-builder-game",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-combat-log",
        "std-confirmation",
        "std-crm",
        "std-debugger-game",
        "std-dialogue-box",
        "std-drawer",
        "std-ecommerce",
        "std-event-handler-game",
        "std-finance-tracker",
        "std-gallery",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-modal",
        "std-movement",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-score-board",
        "std-sequencer-game",
        "std-service-marketplace",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-timer",
        "std-turn-based-battle",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/organisms/std-rpg-game.ts (StdRpgGameParams)"
    },
    {
      "name": "std-score",
      "level": "atom",
      "family": "score",
      "description": "Score tracking parameterized for any domain. Provides a single-state machine with self-loops for adding, subtracting, resetting, and applying combo multipliers to a score. The state machine structure is fixed. The caller controls data and presentation.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "scoreTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "ADD",
        "SUBTRACT",
        "RESET",
        "COMBO"
      ],
      "composableWith": [
        "std-agent-builder",
        "std-agent-context-window",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-combat",
        "std-devops-dashboard",
        "std-form-advanced",
        "std-loading",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-score-board",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-text-effects",
        "std-timer",
        "std-upload",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-score.ts (StdScoreParams)"
    },
    {
      "name": "std-score-board",
      "level": "atom",
      "family": "game",
      "description": "Score display atom using the `score-board` pattern. Shows score, high score, combo, multiplier, level.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "ADD_SCORE",
        "COMBO",
        "RESET"
      ],
      "composableWith": [
        "std-agent-builder",
        "std-agent-context-window",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-combat",
        "std-combat-log",
        "std-debugger-game",
        "std-devops-dashboard",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-form-advanced",
        "std-game-audio",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-loading",
        "std-negotiator-game",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-rpg-game",
        "std-score",
        "std-sequencer-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-notification-hub",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-strategy-game",
        "std-text-effects",
        "std-timer",
        "std-turn-based-battle",
        "std-upload"
      ],
      "source": "behaviors/functions/atoms/std-score-board.ts (StdScoreBoardParams)"
    },
    {
      "name": "std-search",
      "level": "atom",
      "family": "search",
      "description": "Search behavior parameterized for any domain. Provides a search input that filters entity data by query string. The state machine structure is fixed. The caller controls data and presentation.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "placeholder",
          "type": "string",
          "optional": true
        },
        {
          "name": "searchIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "SEARCH",
        "CLEAR"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-chat-thread",
        "std-agent-conversation",
        "std-agent-search",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-collision",
        "std-combat-log",
        "std-rate-limiter",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-undo",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-search.ts (StdSearchParams)"
    },
    {
      "name": "std-selection",
      "level": "atom",
      "family": "selection",
      "description": "Selection behavior parameterized for any domain. Provides item selection from a list with confirm/deselect controls. Three states: idle, selecting, selected with transitions for the full lifecycle.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "SELECT",
        "DESELECT",
        "CLEAR",
        "CONFIRM_SELECTION"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-chat-thread",
        "std-agent-conversation",
        "std-agent-search",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-collision",
        "std-combat-log",
        "std-geospatial",
        "std-isometric-canvas",
        "std-rate-limiter",
        "std-search",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-theme",
        "std-undo",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-selection.ts (StdSelectionParams)"
    },
    {
      "name": "std-sequencer-game",
      "level": "molecule",
      "family": "game",
      "description": "Educational game molecule: menu -> playing -> complete. Uses the `sequencer-board` pattern for the playing state.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "gameTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "COMPLETE",
        "RESTART",
        "NAVIGATE"
      ],
      "composableWith": [
        "std-agent-step-progress",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-coding-academy",
        "std-combat",
        "std-combat-log",
        "std-debugger-game",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-loading",
        "std-logic-training",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-service-llm",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-timer",
        "std-turn-based-battle",
        "std-upload",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/molecules/std-sequencer-game.ts (StdSequencerGameParams)"
    },
    {
      "name": "std-service-content-pipeline",
      "level": "molecule",
      "family": "service",
      "description": "Content research pipeline molecule. Composes youtube search + llm summarization into a sequential pipeline: search -> select -> summarize. Single trait with six states (idle, searching, results, summarizing, complete, error) that orchestrates call-service effects for youtube and llm services.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "SEARCH",
        "SEARCH_COMPLETE",
        "SELECT_AND_SUMMARIZE",
        "VIDEO_FETCHED",
        "SUMMARY_COMPLETE",
        "FAILED",
        "RESET"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-devops-dashboard",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-iot-dashboard",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-project-manager",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-score",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-social-feed",
        "std-sort",
        "std-stem-lab",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-undo",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/molecules/std-service-content-pipeline.ts (StdServiceContentPipelineParams)"
    },
    {
      "name": "std-service-custom-api-tester",
      "level": "molecule",
      "family": "service",
      "description": "Unified API tester molecule that exercises all 4 custom REST auth patterns (header API key, bearer token, query param API key, no auth) with a tab selector. Single entity, single trait, 4 call events. Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "headerBaseUrl",
          "type": "string",
          "optional": true
        },
        {
          "name": "bearerBaseUrl",
          "type": "string",
          "optional": true
        },
        {
          "name": "queryBaseUrl",
          "type": "string",
          "optional": true
        },
        {
          "name": "noauthBaseUrl",
          "type": "string",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CALL_HEADER_API",
        "CALL_BEARER_API",
        "CALL_QUERY_API",
        "CALL_NOAUTH_API",
        "API_RESPONSE",
        "FAILED",
        "RETRY",
        "RESET"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-devops-dashboard",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-game-over-screen",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-iot-dashboard",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-project-manager",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-score",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-social-feed",
        "std-sort",
        "std-stem-lab",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-undo",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/molecules/std-service-custom-api-tester.ts (StdServiceCustomApiTesterParams)"
    },
    {
      "name": "std-service-custom-bearer",
      "level": "atom",
      "family": "service",
      "description": "Custom REST API behavior with Bearer token authentication. Tests the schema-level service declaration pattern with bearer auth. Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "standalone",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "baseUrl",
          "type": "string",
          "optional": false
        },
        {
          "name": "secretEnvVar",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CALL_API",
        "API_RESPONSE",
        "FAILED",
        "RETRY",
        "RESET"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-devops-dashboard",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-game-over-screen",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-iot-dashboard",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-project-manager",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-score",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-social-feed",
        "std-sort",
        "std-stem-lab",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-undo",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-service-custom-bearer.ts (StdServiceCustomBearerParams)"
    },
    {
      "name": "std-service-custom-header",
      "level": "atom",
      "family": "service",
      "description": "Custom REST API behavior with header-based API key authentication. Tests the schema-level service declaration pattern (no pre-built integration). Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "standalone",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "baseUrl",
          "type": "string",
          "optional": false
        },
        {
          "name": "secretEnvVar",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerKeyName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CALL_API",
        "API_RESPONSE",
        "FAILED",
        "RETRY",
        "RESET"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-devops-dashboard",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-game-over-screen",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-iot-dashboard",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-project-manager",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-score",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-social-feed",
        "std-sort",
        "std-stem-lab",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-undo",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-service-custom-header.ts (StdServiceCustomHeaderParams)"
    },
    {
      "name": "std-service-custom-noauth",
      "level": "atom",
      "family": "service",
      "description": "Custom REST API behavior with no authentication. Tests the schema-level service declaration pattern for public APIs. Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "standalone",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "baseUrl",
          "type": "string",
          "optional": false
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CALL_API",
        "API_RESPONSE",
        "FAILED",
        "RETRY",
        "RESET"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-devops-dashboard",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-game-over-screen",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-iot-dashboard",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-project-manager",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-score",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-social-feed",
        "std-sort",
        "std-stem-lab",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-undo",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-service-custom-noauth.ts (StdServiceCustomNoauthParams)"
    },
    {
      "name": "std-service-custom-query",
      "level": "atom",
      "family": "service",
      "description": "Custom REST API behavior with query-string API key authentication. Tests the schema-level service declaration pattern with query-based auth. Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "standalone",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "baseUrl",
          "type": "string",
          "optional": false
        },
        {
          "name": "secretEnvVar",
          "type": "string",
          "optional": true
        },
        {
          "name": "queryKeyName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CALL_API",
        "API_RESPONSE",
        "FAILED",
        "RETRY",
        "RESET"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-devops-dashboard",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-game-over-screen",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-iot-dashboard",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-project-manager",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-score",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-social-feed",
        "std-sort",
        "std-stem-lab",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-undo",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-service-custom-query.ts (StdServiceCustomQueryParams)"
    },
    {
      "name": "std-service-devops-toolkit",
      "level": "molecule",
      "family": "service",
      "description": "DevOps toolkit molecule. Three independent traits on a single page sharing one entity via the event bus: - GitHubTrait: PR creation flow (ghIdle -> creatingPR -> prCreated / ghError) - RedisTrait: cache get/set/delete (redisIdle -> redisExecuting -> redisComplete / redisError) - StorageTrait: file upload/download/list/delete (storageIdle -> storageExecuting -> storageComplete / storageError) Each trait renders its own UI section. No cross-trait events needed (independent flows).",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CREATE_PR",
        "PR_CREATED",
        "GH_FAILED",
        "GH_RETRY",
        "GH_RESET"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-coding-academy",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-devops-dashboard",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-iot-dashboard",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-project-manager",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-score",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-sort",
        "std-stem-lab",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-undo",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/molecules/std-service-devops-toolkit.ts (StdServiceDevopsToolkitParams)"
    },
    {
      "name": "std-service-email",
      "level": "atom",
      "family": "service",
      "description": "Email service integration behavior: compose, send, track delivery status. Wraps the `email` service with call-service for send operations. Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "standalone",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "SEND",
        "SENT",
        "FAILED",
        "RETRY",
        "RESET"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-devops-dashboard",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-game-over-screen",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-iot-dashboard",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-project-manager",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-score",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-social-feed",
        "std-sort",
        "std-stem-lab",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-undo",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-service-email.ts (StdServiceEmailParams)"
    },
    {
      "name": "std-service-github",
      "level": "atom",
      "family": "service",
      "description": "GitHub service integration behavior: idle, creatingPR, prCreated, error. Wraps the `github` integration (listIssues, createPR) with a PR creation flow. Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "standalone",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CREATE_PR",
        "PR_CREATED",
        "FAILED",
        "RETRY",
        "RESET"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-devops-dashboard",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-game-over-screen",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-iot-dashboard",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-project-manager",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-score",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-social-feed",
        "std-sort",
        "std-stem-lab",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-undo",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-service-github.ts (StdServiceGithubParams)"
    },
    {
      "name": "std-service-llm",
      "level": "atom",
      "family": "service",
      "description": "LLM service integration behavior: generate, classify, summarize text. Wraps the `llm` integration with 4 actions via separate action events. Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "standalone",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "GENERATE",
        "CLASSIFY",
        "SUMMARIZE",
        "COMPLETE",
        "FAILED",
        "RETRY",
        "RESET"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-builder-game",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-confirmation",
        "std-crm",
        "std-debugger-game",
        "std-detail",
        "std-devops-dashboard",
        "std-dialogue-box",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-event-handler-game",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-game-over-screen",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-iot-dashboard",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-negotiator-game",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-project-manager",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-score",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-sequencer-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-social-feed",
        "std-sort",
        "std-stem-lab",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-undo",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-service-llm.ts (StdServiceLlmParams)"
    },
    {
      "name": "std-service-marketplace",
      "level": "organism",
      "family": "service",
      "description": "Service marketplace organism. Composes molecules and atoms via compose: - stdList(Product): product catalog with CRUD - stdServiceOauth(AuthSession): OAuth login with standalone provider picker - stdServicePaymentFlow(OrderPayment): Stripe payment + email receipt - stdList(Order): order history with CRUD Cross-orbital connections: - CHECKOUT: ProductBrowse -> OrderPaymentPayment",
      "params": [
        {
          "name": "appName",
          "type": "string",
          "optional": true
        },
        {
          "name": "productFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "orderFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CREATE",
        "VIEW",
        "EDIT",
        "DELETE",
        "PRODUCT_CREATED",
        "PRODUCT_UPDATED",
        "CONFIRM_DELETE",
        "CANCEL",
        "CLOSE"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-coding-academy",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-devops-dashboard",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-gameflow",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-iot-dashboard",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-movement",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-rpg-game",
        "std-score",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-sort",
        "std-stem-lab",
        "std-strategy-game",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-turn-based-battle",
        "std-undo",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/organisms/std-service-marketplace.ts (StdServiceMarketplaceParams)"
    },
    {
      "name": "std-service-notification-hub",
      "level": "molecule",
      "family": "service",
      "description": "Unified notification sender molecule. Composes email and twilio into a single trait with channel selection (Email, SMS, WhatsApp). A single state machine routes to the appropriate call-service based on the chosen channel. States: idle -> sending -> sent | error Channels: email (call-service email/send), sms (call-service twilio/sendSMS),           whatsapp (call-service twilio/sendWhatsApp)",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "SEND_EMAIL",
        "SEND_SMS",
        "SEND_WHATSAPP",
        "SENT",
        "FAILED",
        "RETRY",
        "RESET"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-devops-dashboard",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-game-over-screen",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-iot-dashboard",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-project-manager",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-score",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-social-feed",
        "std-sort",
        "std-stem-lab",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-undo",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/molecules/std-service-notification-hub.ts (StdServiceNotificationHubParams)"
    },
    {
      "name": "std-service-oauth",
      "level": "atom",
      "family": "service",
      "description": "OAuth service integration behavior: authorize, token exchange, refresh. Wraps the `oauth` integration with a multi-step authorization flow. Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "standalone",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "LOGIN",
        "AUTH_URL_RECEIVED",
        "CALLBACK",
        "TOKEN_RECEIVED",
        "REFRESH",
        "TOKEN_REFRESHED",
        "LOGOUT",
        "FAILED",
        "RETRY"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-coding-academy",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-devops-dashboard",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-game-hud",
        "std-game-over-screen",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-iot-dashboard",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-project-manager",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-score",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-social-feed",
        "std-sort",
        "std-stem-lab",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-undo",
        "std-upload",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-service-oauth.ts (StdServiceOauthParams)"
    },
    {
      "name": "std-service-payment-flow",
      "level": "molecule",
      "family": "service",
      "description": "Payment flow molecule. Composes stripe payment and email receipt into a single orchestrated flow: pay, then auto-send receipt email. Two inline traits share one entity and one page: - Payment trait: idle -> creating -> confirming -> succeeded -> error   Emits SEND_RECEIPT when payment is confirmed. - Receipt trait: waiting -> sending -> sent -> receiptError   Listens for SEND_RECEIPT and calls the email service. Traits on the same page share the event bus automatically.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "recipientEmail",
          "type": "string",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CREATE_PAYMENT",
        "PAYMENT_CREATED",
        "PAYMENT_CONFIRMED",
        "FAILED",
        "RETRY",
        "RESET"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-devops-dashboard",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-game-over-screen",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-iot-dashboard",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-project-manager",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-score",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-social-feed",
        "std-sort",
        "std-stem-lab",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-undo",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/molecules/std-service-payment-flow.ts (StdServicePaymentFlowParams)"
    },
    {
      "name": "std-service-redis",
      "level": "atom",
      "family": "service",
      "description": "Redis cache integration behavior: get, set, delete with TTL support. Wraps the `redis` service with separate events for each operation. Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "standalone",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "GET_KEY",
        "SET_KEY",
        "DELETE_KEY",
        "EXECUTED",
        "FAILED",
        "RESET"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-devops-dashboard",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-iot-dashboard",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-project-manager",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-score",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-social-feed",
        "std-sort",
        "std-stem-lab",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-undo",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-service-redis.ts (StdServiceRedisParams)"
    },
    {
      "name": "std-service-research-assistant",
      "level": "organism",
      "family": "service",
      "description": "Content research assistant organism. Composes service atoms/molecules via compose: - stdServiceContentPipeline(Research): YouTube search + LLM summarization - stdServiceRedis(CacheEntry): Redis cache management (standalone) - stdServiceStorage(Report): saving research reports to storage (standalone) - stdServiceCustomBearer(KnowledgeQuery): custom knowledge API queries (standalone) Cross-orbital connections: (none - each page operates independently, user navigates via dashboard nav)",
      "params": [
        {
          "name": "appName",
          "type": "string",
          "optional": true
        },
        {
          "name": "researchFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "cacheFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "storageFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "SEARCH",
        "SEARCH_COMPLETE",
        "SELECT_AND_SUMMARIZE",
        "VIDEO_FETCHED",
        "SUMMARY_COMPLETE",
        "FAILED",
        "RESET"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-devops-dashboard",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-iot-dashboard",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-project-manager",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-score",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-social-feed",
        "std-sort",
        "std-stem-lab",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-undo",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/organisms/std-service-research-assistant.ts (StdServiceResearchAssistantParams)"
    },
    {
      "name": "std-service-storage",
      "level": "atom",
      "family": "service",
      "description": "Storage service integration behavior: upload, download, list, delete files. Wraps the `storage` service with separate events for each operation. Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "standalone",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "defaultBucket",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "UPLOAD_FILE",
        "DOWNLOAD_FILE",
        "LIST_FILES",
        "DELETE_FILE",
        "EXECUTED",
        "FAILED",
        "RESET"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-devops-dashboard",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-iot-dashboard",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-project-manager",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-score",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-social-feed",
        "std-sort",
        "std-stem-lab",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-undo",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-service-storage.ts (StdServiceStorageParams)"
    },
    {
      "name": "std-service-stripe",
      "level": "atom",
      "family": "service",
      "description": "Stripe payment integration behavior: idle, creating, confirming, succeeded, error. Wraps the `stripe` service integration with a multi-step payment flow. Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "standalone",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "defaultCurrency",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CREATE_PAYMENT",
        "PAYMENT_CREATED",
        "CONFIRM_PAYMENT",
        "PAYMENT_CONFIRMED",
        "FAILED",
        "RETRY",
        "RESET"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-devops-dashboard",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-game-over-screen",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-iot-dashboard",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-project-manager",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-score",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-social-feed",
        "std-sort",
        "std-stem-lab",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-undo",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-service-stripe.ts (StdServiceStripeParams)"
    },
    {
      "name": "std-service-twilio",
      "level": "atom",
      "family": "service",
      "description": "Twilio messaging integration behavior: compose, send SMS or WhatsApp, track delivery. Wraps the `twilio` service integration with sendSMS and sendWhatsApp operations. Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "standalone",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "SEND_SMS",
        "SEND_WHATSAPP",
        "SENT",
        "FAILED",
        "RETRY",
        "RESET"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-devops-dashboard",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-game-over-screen",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-iot-dashboard",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-project-manager",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-score",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-social-feed",
        "std-sort",
        "std-stem-lab",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-undo",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-service-twilio.ts (StdServiceTwilioParams)"
    },
    {
      "name": "std-service-youtube",
      "level": "atom",
      "family": "service",
      "description": "YouTube service integration behavior: search videos, view video details. Wraps the `youtube` service integration with search and getVideo operations. Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "standalone",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "SEARCH",
        "SEARCH_COMPLETE",
        "SELECT_VIDEO",
        "VIDEO_LOADED",
        "BACK",
        "FAILED",
        "RESET"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-confirmation",
        "std-crm",
        "std-detail",
        "std-devops-dashboard",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-iot-dashboard",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-project-manager",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-score",
        "std-score-board",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-simulation-canvas",
        "std-social-feed",
        "std-sort",
        "std-stem-lab",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-undo",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-service-youtube.ts (StdServiceYoutubeParams)"
    },
    {
      "name": "std-simulation-canvas",
      "level": "atom",
      "family": "game",
      "description": "2D physics simulation renderer atom using the `simulation-canvas` pattern. Runs built-in Euler integration for educational presets (pendulum, spring, etc.). Supports start, stop, and reset controls.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "preset",
          "type": "string",
          "optional": true
        },
        {
          "name": "width",
          "type": "number",
          "optional": true
        },
        {
          "name": "height",
          "type": "number",
          "optional": true
        },
        {
          "name": "speed",
          "type": "number",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "STOP",
        "RESET"
      ],
      "composableWith": [
        "std-agent-builder",
        "std-agent-context-window",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-coding-academy",
        "std-combat",
        "std-combat-log",
        "std-debugger-game",
        "std-devops-dashboard",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-form-advanced",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-loading",
        "std-logic-training",
        "std-movement",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-rpg-game",
        "std-score",
        "std-score-board",
        "std-sequencer-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-notification-hub",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulator-game",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-text-effects",
        "std-timer",
        "std-turn-based-battle",
        "std-upload"
      ],
      "source": "behaviors/functions/atoms/std-simulation-canvas.ts (StdSimulationCanvasParams)"
    },
    {
      "name": "std-simulator-game",
      "level": "molecule",
      "family": "game",
      "description": "Educational game molecule: menu -> playing -> complete. Uses the `simulator-board` pattern for the playing state.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "gameTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "COMPLETE",
        "RESTART",
        "NAVIGATE"
      ],
      "composableWith": [
        "std-agent-step-progress",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-coding-academy",
        "std-combat",
        "std-combat-log",
        "std-debugger-game",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-loading",
        "std-logic-training",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-service-llm",
        "std-simulation-canvas",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-timer",
        "std-turn-based-battle",
        "std-upload",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/molecules/std-simulator-game.ts (StdSimulatorGameParams)"
    },
    {
      "name": "std-social-feed",
      "level": "organism",
      "family": "social",
      "description": "Social feed organism. Composes molecules via compose: - stdDetail(Post): browse + create + view posts - stdMessaging(Comment): messaging thread for comments Pages: /feed (initial), /messages Connections: COMMENT event wires posts to comments.",
      "params": [
        {
          "name": "appName",
          "type": "string",
          "optional": true
        },
        {
          "name": "postFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "commentFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "CREATE",
        "VIEW",
        "SAVE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-search",
        "std-agent-session",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-async",
        "std-booking-system",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-cms",
        "std-crm",
        "std-detail",
        "std-ecommerce",
        "std-finance-tracker",
        "std-gallery",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-list",
        "std-lms",
        "std-messaging",
        "std-project-manager",
        "std-quest",
        "std-rate-limiter",
        "std-realtime-chat",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-social-feed.ts (StdSocialFeedParams)"
    },
    {
      "name": "std-sort",
      "level": "atom",
      "family": "sort",
      "description": "Sort atom. Shows sort-by buttons for each sortable field. Clicking a field name sorts by that field. Clicking again toggles direction.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "sortFields",
          "type": "[string]",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "SORT"
      ],
      "composableWith": [
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-rate-limiter",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-sort.ts (StdSortParams)"
    },
    {
      "name": "std-sprite",
      "level": "atom",
      "family": "game",
      "description": "Sprite renderer atom using the `sprite` pattern. Renders a single frame from a spritesheet with position and scale. Handles frame changes and click events.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "frameWidth",
          "type": "number",
          "optional": true
        },
        {
          "name": "frameHeight",
          "type": "number",
          "optional": true
        },
        {
          "name": "scale",
          "type": "number",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "SET_FRAME",
        "CLICK"
      ],
      "composableWith": [
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-combat",
        "std-combat-log",
        "std-debugger-game",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-game-audio",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-negotiator-game",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-strategy-game",
        "std-turn-based-battle"
      ],
      "source": "behaviors/functions/atoms/std-sprite.ts (StdSpriteParams)"
    },
    {
      "name": "std-stem-lab",
      "level": "organism",
      "family": "educational",
      "description": "STEM lab organism. Composes: stdSimulatorGame(Experiment) + stdClassifierGame(Classification)         + stdDisplay(LabResult) Pages: /simulator (initial), /classifier, /results",
      "params": [
        {
          "name": "experimentFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "classificationFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "labResultFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "COMPLETE",
        "RESTART",
        "NAVIGATE"
      ],
      "composableWith": [
        "std-agent-step-progress",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-coding-academy",
        "std-debugger-game",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-game-canvas2d",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-loading",
        "std-logic-training",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rpg-game",
        "std-sequencer-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-strategy-game",
        "std-timer",
        "std-turn-based-battle",
        "std-upload",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/organisms/std-stem-lab.ts (StdStemLabParams)"
    },
    {
      "name": "std-strategy-game",
      "level": "organism",
      "family": "game",
      "description": "Strategy game organism. Composes: stdTurnBasedBattle(ArmyBattle) + stdOverworld(Territory) + stdDisplay(Resource) Pages: /battle, /map (initial), /resources",
      "params": [
        {
          "name": "armyBattleFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "territoryFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "resourceFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "END_TURN",
        "PAUSE",
        "RESUME",
        "GAME_OVER",
        "RESTART",
        "CLOSE",
        "NAVIGATE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-step-progress",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-builder-game",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-combat-log",
        "std-confirmation",
        "std-crm",
        "std-debugger-game",
        "std-dialogue-box",
        "std-drawer",
        "std-ecommerce",
        "std-event-handler-game",
        "std-finance-tracker",
        "std-gallery",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-modal",
        "std-movement",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-service-marketplace",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-stem-lab",
        "std-timer",
        "std-turn-based-battle",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/organisms/std-strategy-game.ts (StdStrategyGameParams)"
    },
    {
      "name": "std-tabs",
      "level": "atom",
      "family": "tabs",
      "description": "Tab navigation atom. Uses the `tabs` pattern component with clickable tab headers. Each tab shows different entity data.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "tabItems",
          "type": "Array",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "SELECT_TAB"
      ],
      "composableWith": [
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-rate-limiter",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-tabs.ts (StdTabsParams)"
    },
    {
      "name": "std-text-effects",
      "level": "atom",
      "family": "text-effects",
      "description": "Text animation and highlighting atom. Absorbs: typewriter-text, text-highlight, law-reference-tooltip.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "ANIMATE",
        "HIGHLIGHT",
        "RESET"
      ],
      "composableWith": [
        "std-agent-builder",
        "std-agent-context-window",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-combat",
        "std-devops-dashboard",
        "std-form-advanced",
        "std-loading",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-score",
        "std-score-board",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-timer",
        "std-upload",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-text-effects.ts (StdTextEffectsParams)"
    },
    {
      "name": "std-theme",
      "level": "atom",
      "family": "theme",
      "description": "Theme selection atom with toggle and full selector. Absorbs: theme-toggle, theme-selector.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "TOGGLE",
        "SELECT"
      ],
      "composableWith": [
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-geospatial",
        "std-rate-limiter",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-theme.ts (StdThemeParams)"
    },
    {
      "name": "std-timer",
      "level": "atom",
      "family": "timer",
      "description": "Timer behavior parameterized for any domain. Provides a countdown timer with start, pause, resume, and reset controls. The state machine structure is fixed. The caller controls data and presentation.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "duration",
          "type": "number",
          "optional": true
        },
        {
          "name": "timerTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "PAUSE",
        "RESUME",
        "RESET",
        "TICK",
        "EXPIRE"
      ],
      "composableWith": [
        "std-agent-builder",
        "std-agent-context-window",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-coding-academy",
        "std-combat",
        "std-debugger-game",
        "std-devops-dashboard",
        "std-event-handler-game",
        "std-form-advanced",
        "std-game-canvas2d",
        "std-game-menu",
        "std-gameflow",
        "std-loading",
        "std-logic-training",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-rpg-game",
        "std-score",
        "std-score-board",
        "std-sequencer-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-stem-lab",
        "std-strategy-game",
        "std-text-effects",
        "std-turn-based-battle",
        "std-upload",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-timer.ts (StdTimerParams)"
    },
    {
      "name": "std-trading-dashboard",
      "level": "organism",
      "family": "finance",
      "description": "Trading dashboard organism. Composes: stdDisplay(Portfolio) + stdList(TradeOrder) + stdAsync(MarketFeed) Pages: /portfolio (initial), /orders, /market",
      "params": [
        {
          "name": "portfolioFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "tradeOrderFields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "marketFeedFields",
          "type": "[EntityField]",
          "optional": true
        }
      ],
      "connectableEvents": [
        "LOADED",
        "REFRESH",
        "REFRESHED"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-display",
        "std-finance-tracker",
        "std-game-hud",
        "std-iot-dashboard",
        "std-loading",
        "std-rate-limiter",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/organisms/std-trading-dashboard.ts (StdTradingDashboardParams)"
    },
    {
      "name": "std-turn-based-battle",
      "level": "molecule",
      "family": "game",
      "description": "Turn-based strategy game molecule (Fire Emblem, XCOM style). Composes game atoms into a two-trait orbital: 1. BattleFlow trait (primary): menu -> playing -> paused -> gameover    Renders game-menu, game-hud + combat-log, game-over-screen per state. 2. BattleLog trait (secondary): idle state, combat-log pattern.    Only renders when LOG_EVENT fires from the shared event bus. Composition pattern: extractTrait from atom orbitals, assemble into one orbital with one shared entity and one page.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "gameTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "boardWidth",
          "type": "number",
          "optional": true
        },
        {
          "name": "boardHeight",
          "type": "number",
          "optional": true
        },
        {
          "name": "menuSubtitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pauseTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "gameoverTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "logTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "logMaxVisible",
          "type": "number",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "START",
        "END_TURN",
        "PAUSE",
        "RESUME",
        "GAME_OVER",
        "RESTART",
        "CLOSE",
        "NAVIGATE"
      ],
      "composableWith": [
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-provider",
        "std-agent-step-progress",
        "std-agent-tool-call",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-booking-system",
        "std-builder-game",
        "std-cache-aside",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-cms",
        "std-coding-academy",
        "std-combat",
        "std-combat-log",
        "std-confirmation",
        "std-crm",
        "std-debugger-game",
        "std-dialogue-box",
        "std-drawer",
        "std-ecommerce",
        "std-event-handler-game",
        "std-finance-tracker",
        "std-gallery",
        "std-game-audio",
        "std-game-canvas2d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-inventory",
        "std-inventory-panel",
        "std-isometric-canvas",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-modal",
        "std-movement",
        "std-negotiator-game",
        "std-physics2d",
        "std-platformer-app",
        "std-platformer-canvas",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rpg-game",
        "std-score-board",
        "std-sequencer-game",
        "std-service-marketplace",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-sprite",
        "std-stem-lab",
        "std-strategy-game",
        "std-timer",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/molecules/std-turn-based-battle.ts (StdTurnBasedBattleParams)"
    },
    {
      "name": "std-undo",
      "level": "atom",
      "family": "undo",
      "description": "Undo/Redo atom using array operators as a stack. - PUSH: appends to undoStack, clears redoStack - UNDO: pops from undoStack, pushes to redoStack - REDO: pops from redoStack, pushes to undoStack - CLEAR: empties both stacks Entity fields: undoStack (array), redoStack (array), current (string)",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "PUSH",
        "UNDO",
        "REDO",
        "CLEAR"
      ],
      "composableWith": [
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-chat-thread",
        "std-agent-conversation",
        "std-agent-search",
        "std-async",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-collision",
        "std-combat-log",
        "std-rate-limiter",
        "std-search",
        "std-selection",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-undo.ts (StdUndoParams)"
    },
    {
      "name": "std-upload",
      "level": "atom",
      "family": "upload",
      "description": "File upload atom with drag-and-drop zone and progress tracking. Absorbs: upload-drop-zone.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "acceptedTypes",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "UPLOAD",
        "COMPLETE",
        "FAILED",
        "RETRY",
        "RESET"
      ],
      "composableWith": [
        "std-agent-builder",
        "std-agent-context-window",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-coding-academy",
        "std-combat",
        "std-debugger-game",
        "std-devops-dashboard",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-form-advanced",
        "std-game-over-screen",
        "std-loading",
        "std-logic-training",
        "std-negotiator-game",
        "std-quest",
        "std-rate-limiter",
        "std-rating",
        "std-score",
        "std-score-board",
        "std-sequencer-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulation-canvas",
        "std-simulator-game",
        "std-stem-lab",
        "std-text-effects",
        "std-timer",
        "std-validate-on-save",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-upload.ts (StdUploadParams)"
    },
    {
      "name": "std-validate-on-save",
      "level": "atom",
      "family": "os-trigger",
      "description": "OS trigger that watches .orb files and validates them on save. Shows a status dashboard with validation results. Emits AGENT_INTERRUPT with validation results to interrupt autonomous agents with ground truth.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": true
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": true
        },
        {
          "name": "glob",
          "type": "string",
          "optional": true
        },
        {
          "name": "debounceMs",
          "type": "number",
          "optional": true
        },
        {
          "name": "blocking",
          "type": "boolean",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        }
      ],
      "connectableEvents": [
        "OS_FILE_MODIFIED",
        "REFRESH",
        "VALIDATION_PASSED",
        "VALIDATION_FAILED",
        "NAVIGATE"
      ],
      "composableWith": [
        "os-trigger-simulation",
        "std-agent-activity-log",
        "std-agent-assistant",
        "std-agent-builder",
        "std-agent-chat-thread",
        "std-agent-classifier",
        "std-agent-completion",
        "std-agent-context-window",
        "std-agent-conversation",
        "std-agent-fix-loop",
        "std-agent-learner",
        "std-agent-memory",
        "std-agent-pipeline",
        "std-agent-planner",
        "std-agent-provider",
        "std-agent-rag",
        "std-agent-reviewer",
        "std-agent-search",
        "std-agent-session",
        "std-agent-step-progress",
        "std-agent-token-gauge",
        "std-agent-tool-call",
        "std-agent-tool-loop",
        "std-agent-tutor",
        "std-api-gateway",
        "std-arcade-game",
        "std-async",
        "std-autoregressive",
        "std-booking-system",
        "std-browse",
        "std-builder-game",
        "std-cache-aside",
        "std-calendar",
        "std-cart",
        "std-cicd-pipeline",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-cms",
        "std-coding-academy",
        "std-confirmation",
        "std-crm",
        "std-debugger-game",
        "std-detail",
        "std-devops-dashboard",
        "std-display",
        "std-drawer",
        "std-ecommerce",
        "std-event-handler-game",
        "std-filter",
        "std-finance-tracker",
        "std-flip-card",
        "std-form-advanced",
        "std-gallery",
        "std-game-canvas2d",
        "std-game-canvas3d",
        "std-game-hud",
        "std-game-menu",
        "std-game-over-screen",
        "std-gameflow",
        "std-geospatial",
        "std-healthcare",
        "std-helpdesk",
        "std-hr-portal",
        "std-input",
        "std-iot-dashboard",
        "std-list",
        "std-lms",
        "std-loading",
        "std-logic-training",
        "std-messaging",
        "std-modal",
        "std-negotiator-game",
        "std-notification",
        "std-overworld",
        "std-pagination",
        "std-platformer-app",
        "std-platformer-game",
        "std-project-manager",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quiz",
        "std-rate-limiter",
        "std-rating",
        "std-realtime-chat",
        "std-rpg-game",
        "std-score",
        "std-search",
        "std-selection",
        "std-sequencer-game",
        "std-service-oauth",
        "std-simulator-game",
        "std-social-feed",
        "std-sort",
        "std-stem-lab",
        "std-strategy-game",
        "std-tabs",
        "std-text-effects",
        "std-theme",
        "std-timer",
        "std-trading-dashboard",
        "std-turn-based-battle",
        "std-undo",
        "std-upload",
        "std-wizard"
      ],
      "source": "behaviors/functions/atoms/std-validate-on-save.ts (StdValidateOnSaveParams)"
    },
    {
      "name": "std-wizard",
      "level": "atom",
      "family": "workflow",
      "description": "Multi-step wizard behavior parameterized for any domain. Generates a dynamic number of steps based on the `steps` parameter, with a review screen and completion view. Pure function: params in, OrbitalDefinition out.",
      "params": [
        {
          "name": "entityName",
          "type": "string",
          "optional": false
        },
        {
          "name": "fields",
          "type": "[EntityField]",
          "optional": false
        },
        {
          "name": "persistence",
          "type": "\"persistent\" | \"runtime\" | \"singleton\"",
          "optional": true
        },
        {
          "name": "collection",
          "type": "string",
          "optional": true
        },
        {
          "name": "steps",
          "type": "Array",
          "optional": false
        },
        {
          "name": "wizardTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "completeTitle",
          "type": "string",
          "optional": true
        },
        {
          "name": "completeDescription",
          "type": "string",
          "optional": true
        },
        {
          "name": "submitButtonLabel",
          "type": "string",
          "optional": true
        },
        {
          "name": "headerIcon",
          "type": "string",
          "optional": true
        },
        {
          "name": "pageName",
          "type": "string",
          "optional": true
        },
        {
          "name": "pagePath",
          "type": "string",
          "optional": true
        },
        {
          "name": "isInitial",
          "type": "boolean",
          "optional": true
        }
      ],
      "connectableEvents": [
        "NEXT",
        "PREV",
        "COMPLETE",
        "RESTART"
      ],
      "composableWith": [
        "std-agent-step-progress",
        "std-arcade-game",
        "std-async",
        "std-builder-game",
        "std-cache-aside",
        "std-circuit-breaker",
        "std-classifier-game",
        "std-coding-academy",
        "std-debugger-game",
        "std-dialogue-box",
        "std-event-handler-game",
        "std-flip-card",
        "std-game-over-screen",
        "std-gameflow",
        "std-logic-training",
        "std-negotiator-game",
        "std-platformer-app",
        "std-platformer-game",
        "std-puzzle-app",
        "std-puzzle-game",
        "std-quest",
        "std-quiz",
        "std-rate-limiter",
        "std-rpg-game",
        "std-sequencer-game",
        "std-service-content-pipeline",
        "std-service-custom-api-tester",
        "std-service-custom-bearer",
        "std-service-custom-header",
        "std-service-custom-noauth",
        "std-service-custom-query",
        "std-service-devops-toolkit",
        "std-service-email",
        "std-service-github",
        "std-service-llm",
        "std-service-marketplace",
        "std-service-notification-hub",
        "std-service-oauth",
        "std-service-payment-flow",
        "std-service-redis",
        "std-service-research-assistant",
        "std-service-storage",
        "std-service-stripe",
        "std-service-twilio",
        "std-service-youtube",
        "std-simulator-game",
        "std-stem-lab",
        "std-strategy-game",
        "std-turn-based-battle",
        "std-upload",
        "std-validate-on-save"
      ],
      "source": "behaviors/functions/atoms/std-wizard.ts (StdWizardParams)"
    }
  ]
} as const;

export type LoloBehaviorMetadata = typeof LOLO_BEHAVIOR_METADATA;
