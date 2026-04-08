/**
 * std-agent-chat-thread
 *
 * Chat message thread atom for agent conversations.
 * Displays a chronological list of messages (user, assistant, tool)
 * with compose/send flow. Emits configurable send event for
 * orchestrating traits to handle the actual agent call.
 *
 * @level atom
 * @family agent
 * @packageDocumentation
 *
 * @deprecated The TypeScript factory layer is deprecated as of Phase F.10
 * (2026-04-08). The canonical source for std behaviors is now the registry
 * `.orb` file at `packages/almadar-std/behaviors/registry/<level>/<name>.orb`,
 * which is generated from this TS source by `tools/almadar-behavior-ts-to-orb/`
 * and consumed by the compiler's embedded loader.
 *
 * Consumers should import behaviors via `.lolo`/`.orb` `uses` declarations and
 * reference them as `Alias.entity` / `Alias.traits.X` / `Alias.pages.X`, applying
 * overrides at the call site (`linkedEntity`, `name`, `events`, `effects`,
 * `listens`, `emitsScope`). The TS `*Params` interface and the exported factory
 * functions remain ONLY as the authoring path for the converter; they are NOT a
 * stable public API and may change without notice.
 *
 * See `docs/Almadar_Orb_Behaviors.md` for the orbital-as-function model and
 * `docs/LOLO_Gaps.md` for the migration plan.
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdAgentChatThreadParams {
  /** Entity name in PascalCase (default: "ChatMessage") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, chat message fields are always included) */
  fields?: EntityField[];
  /** Event name emitted when user sends a message (default: "SEND_MESSAGE") */
  onSendEvent?: string;
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

interface ChatThreadConfig {
  entityName: string;
  fields: EntityField[];
  onSendEvent: string;
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdAgentChatThreadParams): ChatThreadConfig {
  const entityName = params.entityName ?? 'ChatMessage';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
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
    onSendEvent: params.onSendEvent ?? 'SEND_MESSAGE',
    persistence: params.persistence ?? 'persistent',
    traitName: `${entityName}Thread`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: ChatThreadConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: ChatThreadConfig): Trait {
  const { entityName, onSendEvent } = c;

  const messageListUI = {
    type: 'data-list', entity: entityName,
    emptyIcon: 'message-circle', emptyTitle: 'No messages yet',
    emptyDescription: 'Start a conversation by sending a message.',
    renderItem: ['fn', 'item', {
      type: 'stack', direction: 'vertical', gap: 'xs',
      children: [
        {
          type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
          children: [
            { type: 'badge', label: '@item.role' },
            { type: 'badge', label: '@item.status', variant: 'outline' },
            { type: 'typography', variant: 'caption', color: 'muted', content: '@item.timestamp' },
          ],
        },
        { type: 'typography', variant: 'body', content: '@item.content' },
      ],
    }],
  };

  const idleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'space-between', align: 'center',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
            children: [
              { type: 'icon', name: 'message-circle', size: 'lg' },
              { type: 'typography', content: `${entityName} Thread`, variant: 'h2' },
            ],
          },
          { type: 'button', label: 'New Message', event: 'COMPOSE', variant: 'primary', icon: 'plus' },
        ],
      },
      { type: 'divider' },
      messageListUI,
    ],
  };

  const composingUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'space-between', align: 'center',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
            children: [
              { type: 'icon', name: 'message-circle', size: 'lg' },
              { type: 'typography', content: `${entityName} Thread`, variant: 'h2' },
            ],
          },
          { type: 'button', label: 'New Message', event: 'COMPOSE', variant: 'primary', icon: 'plus', disabled: true },
        ],
      },
      { type: 'divider' },
      messageListUI,
      {
        type: 'form-section', title: 'Compose Message',
        children: [
          { type: 'textarea', label: 'Message', bind: '@entity.content', placeholder: 'Type your message...' },
          {
            type: 'stack', direction: 'horizontal', gap: 'sm',
            children: [
              { type: 'button', label: 'Send', event: 'SEND', variant: 'primary', icon: 'send' },
            ],
          },
        ],
      },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: onSendEvent, scope: 'internal' as const, payload: [
        { name: 'content', type: 'string' },
      ]},
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'composing' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'COMPOSE', name: 'Compose Message' },
        { key: 'SEND', name: 'Send Message', payload: [
          { name: 'content', type: 'string', required: true },
        ]},
        { key: 'CLEAR', name: 'Clear Thread' },
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
          from: 'idle', to: 'composing', event: 'COMPOSE',
          effects: [
            ['render-ui', 'main', composingUI],
          ],
        },
        {
          from: 'composing', to: 'idle', event: 'SEND',
          effects: [
            ['set', '@entity.content', '@payload.content'],
            ['set', '@entity.role', 'user'],
            ['set', '@entity.timestamp', '@now'],
            ['set', '@entity.status', 'sent'],
            ['persist', 'create', entityName, {
              role: 'user',
              content: '@payload.content',
              timestamp: '@now',
              status: 'sent',
            }],
            ['emit', onSendEvent],
            ['fetch', entityName],
            ['render-ui', 'main', idleUI],
          ],
        },
        {
          from: 'idle', to: 'idle', event: 'CLEAR',
          effects: [
            ['persist', 'delete', entityName],
            ['fetch', entityName],
            ['render-ui', 'main', idleUI],
          ],
        },
        {
          from: 'composing', to: 'idle', event: 'CLEAR',
          effects: [
            ['persist', 'delete', entityName],
            ['fetch', entityName],
            ['render-ui', 'main', idleUI],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: ChatThreadConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentChatThreadEntity(params: StdAgentChatThreadParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentChatThreadTrait(params: StdAgentChatThreadParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdAgentChatThreadPage(params: StdAgentChatThreadParams = {}): Page {
  return buildPage(resolve(params));
}

export function stdAgentChatThread(params: StdAgentChatThreadParams = {}): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
