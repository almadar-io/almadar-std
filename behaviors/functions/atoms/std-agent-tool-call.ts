/**
 * std-agent-tool-call
 *
 * Tool execution atom for agent tool invocation.
 * Manages the lifecycle of invoking external tools: idle -> executing -> completed/failed.
 * Emits TOOL_STARTED and TOOL_COMPLETED for cross-trait wiring.
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

export interface StdAgentToolCallParams {
  /** Entity name in PascalCase (default: "ToolCall") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, tool call fields are always included) */
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

interface ToolCallConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdAgentToolCallParams): ToolCallConfig {
  const entityName = params.entityName ?? 'ToolCall';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'toolName', type: 'string', default: '' },
    { name: 'args', type: 'string', default: '' },
    { name: 'result', type: 'string', default: '' },
    { name: 'status', type: 'string', default: 'idle' },
    { name: 'duration', type: 'number', default: 0 },
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
    traitName: `${entityName}Executor`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: ToolCallConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: ToolCallConfig): Trait {
  const { entityName } = c;

  const idleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'wrench', size: 'lg' },
          { type: 'typography', content: `${entityName}`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'input', label: 'Tool Name', bind: '@entity.toolName', placeholder: 'e.g. read_file' },
      { type: 'textarea', label: 'Arguments', bind: '@entity.args', placeholder: 'Tool arguments (JSON)...' },
      { type: 'button', label: 'Invoke', event: 'INVOKE', variant: 'primary', icon: 'play' },
    ],
  };

  const executingUI = {
    type: 'loading-state', title: 'Executing...', message: 'Running tool...',
  };

  const completedUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'alert', variant: 'success', message: 'Tool execution complete' },
      { type: 'typography', variant: 'caption', content: '@entity.toolName' },
      { type: 'typography', variant: 'body', content: '@entity.result' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'badge', label: '@entity.duration' },
        ],
      },
      { type: 'button', label: 'Invoke Another', event: 'INVOKE', variant: 'primary', icon: 'play' },
    ],
  };

  const failedUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      { type: 'error-state', title: 'Tool Failed', message: '@entity.result' },
      { type: 'button', label: 'Retry', event: 'INVOKE', variant: 'primary', icon: 'refresh-cw' },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'TOOL_STARTED', scope: 'external' },
      { event: 'TOOL_COMPLETED', scope: 'external' },
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'executing' },
        { name: 'completed' },
        { name: 'failed' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'INVOKE', name: 'Invoke Tool', payload: [
          { name: 'toolName', type: 'string', required: true },
          { name: 'args', type: 'string', required: false },
        ]},
        { key: 'CANCEL', name: 'Cancel' },
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
          from: 'idle', to: 'executing', event: 'INVOKE',
          effects: [
            ['set', '@entity.toolName', '@payload.toolName'],
            ['set', '@entity.args', '@payload.args'],
            ['set', '@entity.status', 'executing'],
            ['emit', 'TOOL_STARTED'],
            ['render-ui', 'main', executingUI],
            ['agent/invoke', '@payload.toolName', '@payload.args'],
          ],
        },
        {
          from: 'completed', to: 'executing', event: 'INVOKE',
          effects: [
            ['set', '@entity.toolName', '@payload.toolName'],
            ['set', '@entity.args', '@payload.args'],
            ['set', '@entity.status', 'executing'],
            ['emit', 'TOOL_STARTED'],
            ['render-ui', 'main', executingUI],
            ['agent/invoke', '@payload.toolName', '@payload.args'],
          ],
        },
        {
          from: 'failed', to: 'executing', event: 'INVOKE',
          effects: [
            ['set', '@entity.toolName', '@payload.toolName'],
            ['set', '@entity.args', '@payload.args'],
            ['set', '@entity.status', 'executing'],
            ['emit', 'TOOL_STARTED'],
            ['render-ui', 'main', executingUI],
            ['agent/invoke', '@payload.toolName', '@payload.args'],
          ],
        },
        {
          from: 'executing', to: 'idle', event: 'CANCEL',
          effects: [
            ['set', '@entity.status', 'idle'],
            ['render-ui', 'main', idleUI],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: ToolCallConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentToolCallEntity(params: StdAgentToolCallParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentToolCallTrait(params: StdAgentToolCallParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdAgentToolCallPage(params: StdAgentToolCallParams = {}): Page {
  return buildPage(resolve(params));
}

export function stdAgentToolCall(params: StdAgentToolCallParams = {}): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
