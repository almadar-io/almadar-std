/**
 * std-agent-activity-log
 *
 * Chronological action log atom for tracking agent operations.
 * Provides a timeline view of agent actions with status indicators,
 * duration tracking, and clear functionality. Listens for LOG_ENTRY
 * events from sibling traits.
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

export interface StdAgentActivityLogParams {
  /** Entity name in PascalCase (default: "ActivityEntry") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, activity fields are always included) */
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

interface ActivityLogConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdAgentActivityLogParams): ActivityLogConfig {
  const entityName = params.entityName ?? 'ActivityEntry';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'action', type: 'string', default: '' },
    { name: 'detail', type: 'string', default: '' },
    { name: 'status', type: 'string', default: 'pending' },
    { name: 'timestamp', type: 'string', default: '' },
    { name: 'duration', type: 'number', default: 0 },
    { name: 'icon', type: 'string', default: 'circle' },
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
    traitName: `${entityName}Log`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: ActivityLogConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: ActivityLogConfig): Trait {
  const { entityName } = c;

  const loggingUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'space-between', align: 'center',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
            children: [
              { type: 'icon', name: 'activity', size: 'lg' },
              { type: 'typography', content: 'Activity Log', variant: 'h2' },
            ],
          },
          { type: 'button', label: 'Clear', event: 'CLEAR', variant: 'ghost', icon: 'trash' },
        ],
      },
      { type: 'divider' },
      {
        type: 'timeline', entity: entityName,
        emptyIcon: 'activity', emptyTitle: 'No activity yet',
        emptyDescription: 'Agent actions will appear here as they occur.',
        renderItem: ['fn', 'item', {
          type: 'stack', direction: 'vertical', gap: 'xs',
          children: [
            {
              type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
              children: [
                { type: 'badge', label: '@item.status' },
                { type: 'typography', variant: 'h4', content: '@item.action' },
              ],
            },
            { type: 'typography', variant: 'body', color: 'muted', content: '@item.detail' },
            {
              type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
              children: [
                { type: 'typography', variant: 'caption', color: 'muted', content: '@item.timestamp' },
                { type: 'badge', label: '@item.duration', variant: 'outline' },
              ],
            },
          ],
        }],
      },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'LOG_ENTRY', scope: 'external' as const, payload: [
        { name: 'action', type: 'string' },
        { name: 'detail', type: 'string' },
        { name: 'status', type: 'string' },
      ]},
    ],
    listens: [
      { event: 'LOG_ENTRY', triggers: 'LOG_ENTRY', scope: 'external' as const },
    ],
    stateMachine: {
      states: [
        { name: 'logging', isInitial: true },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'LOG_ENTRY', name: 'Log Entry', payload: [
          { name: 'action', type: 'string', required: true },
          { name: 'detail', type: 'string', required: true },
          { name: 'status', type: 'string', required: true },
        ]},
        { key: 'CLEAR', name: 'Clear Log' },
      ],
      transitions: [
        {
          from: 'logging', to: 'logging', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', loggingUI],
          ],
        },
        {
          from: 'logging', to: 'logging', event: 'LOG_ENTRY',
          effects: [
            ['persist', 'create', entityName, {
              action: '@payload.action',
              detail: '@payload.detail',
              status: '@payload.status',
              timestamp: '@now',
            }],
            ['fetch', entityName],
            ['render-ui', 'main', loggingUI],
          ],
        },
        {
          from: 'logging', to: 'logging', event: 'CLEAR',
          effects: [
            ['persist', 'delete', entityName],
            ['fetch', entityName],
            ['render-ui', 'main', loggingUI],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: ActivityLogConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentActivityLogEntity(params: StdAgentActivityLogParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentActivityLogTrait(params: StdAgentActivityLogParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdAgentActivityLogPage(params: StdAgentActivityLogParams = {}): Page {
  return buildPage(resolve(params));
}

export function stdAgentActivityLog(params: StdAgentActivityLogParams = {}): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
