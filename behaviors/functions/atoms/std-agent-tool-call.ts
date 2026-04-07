/**
 * std-agent-tool-call
 *
 * Tool execution atom for agent tool invocation.
 * Composes UI atoms (stdModal for invoke form, stdAgentActivityLog for call history)
 * with an agent trait that handles agent/invoke and TOOL_STARTED/TOOL_COMPLETED emits.
 *
 * @level atom
 * @family agent
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makeOrbital, ensureIdField, plural, extractTrait } from '@almadar/core/builders';
import { stdModal } from './std-modal.js';

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
    { name: 'error', type: 'string', default: '' },
    { name: 'duration', type: 'number', default: 0 },
    { name: 'action', type: 'string', default: '' },
    { name: 'detail', type: 'string', default: '' },
    { name: 'timestamp', type: 'string', default: '' },
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

function buildEntity(c: ToolCallConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildAgentTrait(c: ToolCallConfig): Trait {
  const { entityName } = c;
  const agentTraitName = `${entityName}Agent`;

  return {
    name: agentTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'TOOL_STARTED', scope: 'internal' as const, payload: [
        { name: 'toolName', type: 'string' },
      ]},
      { event: 'TOOL_COMPLETED', scope: 'internal' as const, payload: [
        { name: 'toolName', type: 'string' },
        { name: 'result', type: 'string' },
      ]},
      { event: 'LOG_ENTRY', scope: 'internal' as const, payload: [
        { name: 'action', type: 'string' },
        { name: 'detail', type: 'string' },
        { name: 'status', type: 'string' },
      ]},
    ],
    listens: [
      { event: 'INVOKED', triggers: 'INVOKED', scope: 'external' as const },
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
        { key: 'DO_INVOKE', name: 'Do Invoke', payload: [
          { name: 'data', type: 'object', required: true },
        ]},
        { key: 'CANCEL', name: 'Cancel' },
        { key: 'INVOKED', name: 'Invoked', payload: [{ name: 'data', type: 'object', required: true }] },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', { type: 'empty-state', icon: 'wrench', title: 'Tool Call', description: 'Tool Call is ready' }],
          ],
        },
        {
          from: 'idle', to: 'executing', event: 'DO_INVOKE',
          effects: [
            ['set', '@entity.toolName', '@payload.data.toolName'],
            ['set', '@entity.args', '@payload.data.args'],
            ['set', '@entity.status', 'executing'],
            ['emit', 'TOOL_STARTED'],
            ['emit', 'LOG_ENTRY'],
            ['agent/invoke', '@payload.data.toolName', '@payload.data.args'],
          ],
        },
        // Listen for INVOKED from modal save
        {
          from: 'idle', to: 'executing', event: 'INVOKED',
          effects: [
            ['set', '@entity.status', 'executing'],
            ['emit', 'TOOL_STARTED'],
            ['emit', 'LOG_ENTRY'],
            ['agent/invoke', '@entity.toolName', '@entity.args'],
          ],
        },
        {
          from: 'completed', to: 'executing', event: 'DO_INVOKE',
          effects: [
            ['set', '@entity.toolName', '@payload.data.toolName'],
            ['set', '@entity.args', '@payload.data.args'],
            ['set', '@entity.status', 'executing'],
            ['emit', 'TOOL_STARTED'],
            ['emit', 'LOG_ENTRY'],
            ['agent/invoke', '@payload.data.toolName', '@payload.data.args'],
          ],
        },
        {
          from: 'failed', to: 'executing', event: 'DO_INVOKE',
          effects: [
            ['set', '@entity.toolName', '@payload.data.toolName'],
            ['set', '@entity.args', '@payload.data.args'],
            ['set', '@entity.status', 'executing'],
            ['emit', 'TOOL_STARTED'],
            ['emit', 'LOG_ENTRY'],
            ['agent/invoke', '@payload.data.toolName', '@payload.data.args'],
          ],
        },
        // Successful completion: executing -> completed
        {
          from: 'executing', to: 'completed', event: 'DO_INVOKE',
          effects: [
            ['set', '@entity.status', 'completed'],
            ['set', '@entity.result', '@payload.data.result'],
            ['emit', 'TOOL_COMPLETED'],
            ['emit', 'LOG_ENTRY'],
          ],
        },
        // Failure: executing -> failed
        {
          from: 'executing', to: 'failed', event: 'CANCEL',
          guard: ['=', '@entity.status', 'executing'],
          effects: [
            ['set', '@entity.status', 'failed'],
            ['set', '@entity.error', 'Cancelled'],
            ['emit', 'TOOL_COMPLETED'],
          ],
        },
        {
          from: 'executing', to: 'idle', event: 'CANCEL',
          effects: [
            ['set', '@entity.status', 'idle'],
            ['emit', 'TOOL_COMPLETED'],
          ],
        },
      ],
    },
  } as Trait;
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentToolCallEntity(params: StdAgentToolCallParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentToolCallTrait(params: StdAgentToolCallParams = {}): Trait {
  return buildAgentTrait(resolve(params));
}

export function stdAgentToolCallPage(params: StdAgentToolCallParams = {}): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: `${c.entityName}Modal` },
      { ref: `${c.entityName}Agent` },
    ],
  } as Page;
}

export function stdAgentToolCall(params: StdAgentToolCallParams = {}): OrbitalDefinition {
  const c = resolve(params);
  const { entityName, fields } = c;

  // UI trait: invoke form modal
  const invokeContent = {
    type: 'stack', direction: 'vertical', gap: 'md',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'wrench', size: 'md' },
        { type: 'typography', content: 'Invoke Tool', variant: 'h3' },
      ] },
      { type: 'divider' },
      { type: 'form-section', entity: entityName, mode: 'create', submitEvent: 'SAVE', cancelEvent: 'CLOSE', fields: ['toolName', 'args'] },
    ],
  };

  const modalTrait = extractTrait(stdModal({
    entityName, fields,
    traitName: `${entityName}Modal`,
    modalTitle: 'Invoke Tool',
    headerIcon: 'wrench',
    openContent: invokeContent,
    openEvent: 'INVOKE',
    closeEvent: 'CLOSE',
    saveEvent: 'SAVE',
    saveEffects: [['persist', 'create', entityName, '@payload.data']],
    emitOnSave: 'INVOKED',
  }));

  const agentTrait = buildAgentTrait(c);
  const entity = buildEntity(c);

  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: modalTrait.name },
      { ref: agentTrait.name },
    ],
  } as Page;

  return makeOrbital(`${c.entityName}Orbital`, entity, [modalTrait, agentTrait], [page]);
}
