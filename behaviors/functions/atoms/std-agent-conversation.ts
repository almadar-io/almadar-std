/**
 * std-agent-conversation
 *
 * Conversation flow atom for multi-turn agent interactions.
 * Manages message history, turn counting, and token tracking
 * using agent/generate for AI replies.
 *
 * @level atom
 * @family agent
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

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
  traitName: string;
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
    traitName: `${entityName}Flow`,
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

function buildTrait(c: ConversationConfig): Trait {
  const { entityName } = c;

  const idleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'message-circle', size: 'lg' },
          { type: 'typography', content: `${entityName}`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'typography', variant: 'caption', color: 'muted', content: 'Start a conversation with the agent.' },
      { type: 'input', label: 'Message', bind: '@entity.lastMessage', placeholder: 'Type a message...' },
      { type: 'button', label: 'Send', event: 'SEND_MESSAGE', variant: 'primary', icon: 'send' },
    ],
  };

  const activeUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'message-circle', size: 'lg' },
          { type: 'typography', content: `${entityName}`, variant: 'h2' },
          { type: 'badge', label: '@entity.turnCount' },
        ],
      },
      { type: 'divider' },
      { type: 'typography', variant: 'body', content: '@entity.lastMessage' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'badge', label: '@entity.tokenCount' },
        ],
      },
      { type: 'input', label: 'Message', bind: '@entity.lastMessage', placeholder: 'Type a message...' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'button', label: 'Send', event: 'SEND_MESSAGE', variant: 'primary', icon: 'send' },
          { type: 'button', label: 'Pause', event: 'PAUSE', variant: 'secondary', icon: 'pause' },
          { type: 'button', label: 'Clear', event: 'CLEAR', variant: 'ghost', icon: 'trash' },
        ],
      },
    ],
  };

  const pausedUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'pause-circle', size: 'lg' },
          { type: 'typography', content: `${entityName} (Paused)`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'alert', variant: 'info', message: 'Conversation paused.' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'button', label: 'Resume', event: 'RESUME', variant: 'primary', icon: 'play' },
          { type: 'button', label: 'Clear', event: 'CLEAR', variant: 'ghost', icon: 'trash' },
        ],
      },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'TOKEN_UPDATE', scope: 'external' },
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
            ['render-ui', 'main', idleUI],
          ],
        },
        {
          from: 'idle', to: 'active', event: 'SEND_MESSAGE',
          effects: [
            ['set', '@entity.lastMessage', '@payload.content'],
            ['set', '@entity.turnCount', ['+', '@entity.turnCount', 1]],
            ['agent/generate', '@payload.content'],
            ['emit', 'TOKEN_UPDATE'],
            ['render-ui', 'main', activeUI],
          ],
        },
        {
          from: 'active', to: 'active', event: 'SEND_MESSAGE',
          effects: [
            ['set', '@entity.lastMessage', '@payload.content'],
            ['set', '@entity.turnCount', ['+', '@entity.turnCount', 1]],
            ['agent/generate', '@payload.content'],
            ['emit', 'TOKEN_UPDATE'],
            ['render-ui', 'main', activeUI],
          ],
        },
        {
          from: 'active', to: 'paused', event: 'PAUSE',
          effects: [
            ['render-ui', 'main', pausedUI],
          ],
        },
        {
          from: 'paused', to: 'active', event: 'RESUME',
          effects: [
            ['render-ui', 'main', activeUI],
          ],
        },
        {
          from: 'active', to: 'idle', event: 'CLEAR',
          effects: [
            ['set', '@entity.messages', []],
            ['set', '@entity.turnCount', 0],
            ['set', '@entity.lastMessage', ''],
            ['set', '@entity.tokenCount', 0],
            ['render-ui', 'main', idleUI],
          ],
        },
        {
          from: 'paused', to: 'idle', event: 'CLEAR',
          effects: [
            ['set', '@entity.messages', []],
            ['set', '@entity.turnCount', 0],
            ['set', '@entity.lastMessage', ''],
            ['set', '@entity.tokenCount', 0],
            ['render-ui', 'main', idleUI],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: ConversationConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentConversationEntity(params: StdAgentConversationParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentConversationTrait(params: StdAgentConversationParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdAgentConversationPage(params: StdAgentConversationParams = {}): Page {
  return buildPage(resolve(params));
}

export function stdAgentConversation(params: StdAgentConversationParams = {}): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
