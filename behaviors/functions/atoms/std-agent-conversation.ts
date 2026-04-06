/**
 * std-agent-conversation
 *
 * Conversation flow atom for multi-turn agent interactions.
 * Composes stdAgentChatThread (message display and compose) with an agent
 * trait that handles agent/generate for AI replies and TOKEN_UPDATE emitting.
 *
 * @level atom
 * @family agent
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makeOrbital, ensureIdField, plural, extractTrait } from '@almadar/core/builders';
import { stdAgentChatThread } from './std-agent-chat-thread.js';

// ============================================================================
// Params
// ============================================================================

export interface StdAgentConversationParams {
  /** Entity name in PascalCase (default: "Conversation") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, conversation fields are always included) */
  fields?: EntityField[];
  /** Persistence mode (default: "persistent") */
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Page name override */
  pageName?: string;
  /** Page path override */
  pagePath?: string;
  /** Whether this page is the initial route */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface ConversationConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdAgentConversationParams): ConversationConfig {
  const entityName = params.entityName ?? 'Conversation';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'messages', type: 'array', default: [] },
    { name: 'turnCount', type: 'number', default: 0 },
    { name: 'lastMessage', type: 'string', default: '' },
    { name: 'tokenCount', type: 'number', default: 0 },
    { name: 'role', type: 'string', default: 'user' },
    { name: 'content', type: 'string', default: '' },
    { name: 'timestamp', type: 'string', default: '' },
    { name: 'toolName', type: 'string', default: '' },
    { name: 'status', type: 'string', default: 'sent' },
  ];
  const baseFields = params.fields ?? [];
  const existingNames = new Set(baseFields.map(f => f.name));
  const mergedFields = [
    ...baseFields,
    ...requiredFields.filter(f => !existingNames.has(f.name)),
  ];
  const fields = ensureIdField(mergedFields);

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'persistent',
    pluralName: p,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: ConversationConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildAgentTrait(c: ConversationConfig): Trait {
  const { entityName } = c;
  const agentTraitName = `${entityName}Agent`;

  return {
    name: agentTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'TOKEN_UPDATE', scope: 'internal' as const, payload: [
        { name: 'tokenCount', type: 'number' },
      ]},
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'active' },
        { name: 'paused' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'SEND_MESSAGE', name: 'Send Message', payload: [
          { name: 'content', type: 'string', required: true },
        ]},
        { key: 'PAUSE', name: 'Pause' },
        { key: 'RESUME', name: 'Resume' },
        { key: 'CLEAR', name: 'Clear' },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', { type: 'empty-state', icon: 'message-circle', title: 'Conversation', description: 'Conversation is ready' }],
          ],
        },
        {
          from: 'idle', to: 'active', event: 'SEND_MESSAGE',
          effects: [
            ['set', '@entity.lastMessage', '@payload.content'],
            ['set', '@entity.turnCount', ['+', '@entity.turnCount', 1]],
            ['agent/generate', '@payload.content'],
            ['emit', 'TOKEN_UPDATE'],
          ],
        },
        {
          from: 'active', to: 'active', event: 'SEND_MESSAGE',
          effects: [
            ['set', '@entity.lastMessage', '@payload.content'],
            ['set', '@entity.turnCount', ['+', '@entity.turnCount', 1]],
            ['agent/generate', '@payload.content'],
            ['emit', 'TOKEN_UPDATE'],
          ],
        },
        {
          from: 'active', to: 'paused', event: 'PAUSE',
          effects: [],
        },
        {
          from: 'paused', to: 'active', event: 'RESUME',
          effects: [],
        },
        {
          from: 'active', to: 'idle', event: 'CLEAR',
          effects: [
            ['set', '@entity.messages', []],
            ['set', '@entity.turnCount', 0],
            ['set', '@entity.lastMessage', ''],
            ['set', '@entity.tokenCount', 0],
          ],
        },
        {
          from: 'paused', to: 'idle', event: 'CLEAR',
          effects: [
            ['set', '@entity.messages', []],
            ['set', '@entity.turnCount', 0],
            ['set', '@entity.lastMessage', ''],
            ['set', '@entity.tokenCount', 0],
          ],
        },
      ],
    },
  } as Trait;
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentConversationEntity(params: StdAgentConversationParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentConversationTrait(params: StdAgentConversationParams = {}): Trait {
  return buildAgentTrait(resolve(params));
}

export function stdAgentConversationPage(params: StdAgentConversationParams = {}): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: `${c.entityName}Thread` },
      { ref: `${c.entityName}Agent` },
    ],
  } as Page;
}

export function stdAgentConversation(params: StdAgentConversationParams = {}): OrbitalDefinition {
  const c = resolve(params);
  const { entityName } = c;

  // UI trait: chat thread for message display and compose
  const chatThreadTrait = extractTrait(stdAgentChatThread({
    entityName,
    fields: c.fields,
    onSendEvent: 'SEND_MESSAGE',
  }));

  // Agent trait: handles agent/generate for AI replies
  const agentTrait = buildAgentTrait(c);
  const entity = buildEntity(c);

  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: chatThreadTrait.name },
      { ref: agentTrait.name },
    ],
  } as Page;

  return makeOrbital(`${c.entityName}Orbital`, entity, [chatThreadTrait, agentTrait], [page]);
}
