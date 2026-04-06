/**
 * std-agent-assistant
 *
 * Full chat assistant organism. Composes agent atoms into a multi-turn
 * conversational agent with memory persistence, context compaction,
 * and provider switching.
 *
 * Composed from:
 * - stdAgentMemory: memory lifecycle (memorize, recall, pin, forget, reinforce, decay)
 * - inline ConversationTrait: multi-turn chat with generate + context tracking
 * - inline ProviderTrait: provider switching based on task complexity
 *
 * Cross-trait events:
 * - MEMORIZE_RESPONSE (Conversation -> Memory): auto-memorize important responses
 * - PROVIDER_CHANGED (Provider -> Conversation): notify conversation of provider switch
 *
 * Pages: /chat (initial), /memory, /provider
 *
 * @level organism
 * @family agent
 * @packageDocumentation
 */

import type { OrbitalSchema, OrbitalDefinition, Entity, Trait, Page, EntityField } from '@almadar/core/types';
import { makeEntity, makeOrbital, makePage, ensureIdField, compose } from '@almadar/core/builders';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { stdAgentMemory } from '../atoms/std-agent-memory.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdAgentAssistantParams {
  appName?: string;
  assistantFields?: EntityField[];
  memoryFields?: EntityField[];
  providerFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_ASSISTANT_FIELDS: EntityField[] = [
  { name: 'messages', type: 'string', default: '[]' },
  { name: 'currentMessage', type: 'string', default: '' },
  { name: 'response', type: 'string', default: '' },
  { name: 'memoryCount', type: 'number', default: 0 },
  { name: 'contextUsage', type: 'number', default: 0 },
  { name: 'provider', type: 'string', default: 'default' },
  { name: 'sessionId', type: 'string', default: '' },
  { name: 'status', type: 'string', default: 'idle' },
  { name: 'error', type: 'string', default: '' },
];

const DEFAULT_PROVIDER_FIELDS: EntityField[] = [
  { name: 'currentProvider', type: 'string', default: 'default' },
  { name: 'currentModel', type: 'string', default: '' },
  { name: 'availableProviders', type: 'string', default: 'default,openai,anthropic' },
  { name: 'switchReason', type: 'string', default: '' },
];

// ============================================================================
// UI Builders
// ============================================================================

function chatIdleUI(entityName: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', justify: 'space-between',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
            children: [
              { type: 'icon', name: 'message-circle', size: 'lg' },
              { type: 'typography', content: 'Assistant', variant: 'h2' },
            ],
          },
          {
            type: 'stack', direction: 'horizontal', gap: 'xs',
            children: [
              { type: 'badge', label: '@entity.provider' },
              { type: 'badge', label: '@entity.sessionId' },
            ],
          },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: 'Send a message to begin the conversation.', variant: 'body' },
            { type: 'form-section', entity: entityName, mode: 'edit', submitEvent: 'SEND', fields: ['currentMessage'] },
          ],
        }],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'button', label: 'Compact Context', event: 'COMPACT', variant: 'ghost', icon: 'minimize-2' },
        ],
      },
    ],
  };
}

function chatListeningUI(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'mic', size: 'lg' },
      { type: 'typography', content: 'Listening...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
    ],
  };
}

function chatThinkingUI(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'brain', size: 'lg' },
      { type: 'typography', content: 'Thinking...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
      { type: 'typography', content: 'Context usage: @entity.contextUsage', variant: 'caption' },
    ],
  };
}

function chatRespondingUI(entityName: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'message-circle', size: 'lg' },
          { type: 'typography', content: 'Assistant Response', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: '@entity.response', variant: 'body' },
            {
              type: 'stack', direction: 'horizontal', gap: 'xs',
              children: [
                { type: 'badge', label: '@entity.provider' },
                { type: 'badge', label: '@entity.contextUsage' },
              ],
            },
          ],
        }],
      },
      { type: 'form-section', entity: entityName, mode: 'edit', submitEvent: 'SEND', fields: ['currentMessage'] },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'button', label: 'Compact Context', event: 'COMPACT', variant: 'ghost', icon: 'minimize-2' },
          { type: 'button', label: 'Switch Provider', event: 'SWITCH_PROVIDER', variant: 'ghost', icon: 'refresh-cw' },
        ],
      },
    ],
  };
}

function providerIdleUI(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'settings', size: 'lg' },
          { type: 'typography', content: 'Provider Settings', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: 'Current Provider', variant: 'caption' },
            { type: 'typography', content: '@entity.currentProvider', variant: 'h3' },
            { type: 'typography', content: 'Model', variant: 'caption' },
            { type: 'typography', content: '@entity.currentModel', variant: 'body' },
          ],
        }],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'button', label: 'Switch Provider', event: 'SWITCH', variant: 'primary', icon: 'refresh-cw' },
        ],
      },
    ],
  };
}

// ============================================================================
// Trait Builders
// ============================================================================

function buildConversationTrait(entityName: string): Trait {
  return {
    name: 'AssistantConversation',
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'MEMORIZE_RESPONSE', description: 'Auto-memorize important responses', scope: 'internal' },
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'listening' },
        { name: 'thinking' },
        { name: 'responding' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        {
          key: 'SEND', name: 'Send Message',
          payload: [{ name: 'currentMessage', type: 'string', required: true }],
        },
        { key: 'COMPACT', name: 'Compact Context' },
        {
          key: 'SWITCH_PROVIDER', name: 'Switch Provider',
          payload: [{ name: 'provider', type: 'string', required: false }],
        },
        { key: 'GENERATION_COMPLETE', name: 'Generation Complete' },
        {
          key: 'FAILED', name: 'Failed',
          payload: [{ name: 'error', type: 'string', required: true }],
        },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['set', '@entity.sessionId', ['agent/session-id']],
            ['set', '@entity.provider', ['agent/provider']],
            ['set', '@entity.contextUsage', ['agent/context-usage']],
            ['fetch', entityName],
            ['render-ui', 'main', chatIdleUI(entityName)],
          ],
        },
        {
          from: 'idle', to: 'listening', event: 'SEND',
          effects: [
            ['set', '@entity.currentMessage', '@payload.currentMessage'],
            ['set', '@entity.status', 'listening'],
            ['render-ui', 'main', chatListeningUI()],
          ],
        },
        {
          from: 'responding', to: 'listening', event: 'SEND',
          effects: [
            ['set', '@entity.currentMessage', '@payload.currentMessage'],
            ['set', '@entity.status', 'listening'],
            ['render-ui', 'main', chatListeningUI()],
          ],
        },
        {
          from: 'listening', to: 'thinking', event: 'INIT',
          effects: [
            ['set', '@entity.status', 'thinking'],
            ['set', '@entity.contextUsage', ['agent/context-usage']],
            ['agent/generate', '@entity.currentMessage'],
            ['render-ui', 'main', chatThinkingUI()],
          ],
        },
        {
          from: 'thinking', to: 'responding', event: 'GENERATION_COMPLETE',
          effects: [
            ['set', '@entity.status', 'responding'],
            ['set', '@entity.contextUsage', ['agent/context-usage']],
            ['agent/memorize', '@entity.response', 'conversation'],
            ['emit', 'MEMORIZE_RESPONSE'],
            ['render-ui', 'main', chatRespondingUI(entityName)],
          ],
        },
        {
          from: 'thinking', to: 'responding', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'responding'],
            ['render-ui', 'main', chatRespondingUI(entityName)],
          ],
        },
        {
          from: 'responding', to: 'responding', event: 'COMPACT',
          effects: [
            ['agent/compact'],
            ['set', '@entity.contextUsage', ['agent/context-usage']],
            ['render-ui', 'main', chatRespondingUI(entityName)],
          ],
        },
        {
          from: 'idle', to: 'idle', event: 'COMPACT',
          effects: [
            ['agent/compact'],
            ['set', '@entity.contextUsage', ['agent/context-usage']],
            ['render-ui', 'main', chatIdleUI(entityName)],
          ],
        },
        {
          from: 'responding', to: 'responding', event: 'SWITCH_PROVIDER',
          effects: [
            ['agent/switch-provider', '@payload.provider'],
            ['set', '@entity.provider', ['agent/provider']],
            ['render-ui', 'main', chatRespondingUI(entityName)],
          ],
        },
      ],
    },
  } as Trait;
}

function buildProviderOrbital(fields: EntityField[]): OrbitalDefinition {
  const entityName = 'ProviderConfig';
  const allFields = ensureIdField(fields);
  const entity = makeEntity({ name: entityName, fields: allFields, persistence: 'runtime' });

  const trait: Trait = {
    name: 'ProviderManager',
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'PROVIDER_CHANGED', description: 'Provider was switched', scope: 'internal' },
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        {
          key: 'SWITCH', name: 'Switch',
          payload: [{ name: 'provider', type: 'string', required: false }],
        },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['set', '@entity.currentProvider', ['agent/provider']],
            ['set', '@entity.currentModel', ['agent/model']],
            ['fetch', entityName],
            ['render-ui', 'main', providerIdleUI()],
          ],
        },
        {
          from: 'idle', to: 'idle', event: 'SWITCH',
          effects: [
            ['agent/switch-provider', '@payload.provider'],
            ['set', '@entity.currentProvider', ['agent/provider']],
            ['set', '@entity.currentModel', ['agent/model']],
            ['emit', 'PROVIDER_CHANGED'],
            ['render-ui', 'main', providerIdleUI()],
          ],
        },
      ],
    },
  } as Trait;

  const page = makePage({ name: 'ProviderPage', path: '/provider', traitName: 'ProviderManager' });
  return makeOrbital('ProviderConfigOrbital', entity, [trait], [page]);
}

// ============================================================================
// Organism
// ============================================================================

export function stdAgentAssistant(params: StdAgentAssistantParams = {}): OrbitalSchema {
  const appName = params.appName ?? 'Agent Assistant';

  // Build conversation orbital with inline trait
  const assistantFields = ensureIdField(params.assistantFields ?? DEFAULT_ASSISTANT_FIELDS);
  const assistantEntity = makeEntity({ name: 'Assistant', fields: assistantFields, persistence: 'runtime' });
  const conversationTrait = buildConversationTrait('Assistant');
  const chatPage = makePage({ name: 'ChatPage', path: '/chat', traitName: 'AssistantConversation', isInitial: true });
  const conversationOrbital = makeOrbital('AssistantOrbital', assistantEntity, [conversationTrait], [chatPage]);

  // Memory from atom
  const memoryOrbital = stdAgentMemory({
    entityName: 'Memory',
    fields: params.memoryFields,
    persistence: 'persistent',
    pageName: 'MemoryPage',
    pagePath: '/memory',
  });

  // Provider management
  const providerOrbital = buildProviderOrbital(params.providerFields ?? DEFAULT_PROVIDER_FIELDS);

  const pages: ComposePage[] = [
    { name: 'ChatPage', path: '/chat', traits: ['AssistantConversation'], isInitial: true },
    { name: 'MemoryPage', path: '/memory', traits: ['MemoryLifecycle'] },
    { name: 'ProviderPage', path: '/provider', traits: ['ProviderManager'] },
  ];

  const connections: ComposeConnection[] = [
    {
      from: 'AssistantConversation',
      to: 'MemoryLifecycle',
      event: { event: 'MEMORIZE_RESPONSE', description: 'Auto-memorize important responses' },
      triggers: 'MEMORIZE',
    },
    {
      from: 'ProviderManager',
      to: 'AssistantConversation',
      event: { event: 'PROVIDER_CHANGED', description: 'Provider was switched' },
      triggers: 'INIT',
    },
  ];

  const schema = compose([conversationOrbital, memoryOrbital, providerOrbital], pages, connections, appName);

  return wrapInDashboardLayout(schema, appName, buildNavItems(pages, {
    chat: 'message-circle',
    memory: 'brain',
    provider: 'settings',
  }));
}
