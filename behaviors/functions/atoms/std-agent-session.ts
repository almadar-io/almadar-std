/**
 * std-agent-session
 *
 * Session lifecycle atom for agent session management.
 * Handles session creation, forking, labeling, and ending.
 * Uses agent/fork, agent/label, and agent/session-id operators.
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

export interface StdAgentSessionParams {
  /** Entity name in PascalCase (default: "Session") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, session fields are always included) */
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

interface SessionConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdAgentSessionParams): SessionConfig {
  const entityName = params.entityName ?? 'Session';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'sessionId', type: 'string', default: '' },
    { name: 'parentId', type: 'string', default: '' },
    { name: 'label', type: 'string', default: '' },
    { name: 'status', type: 'string', default: 'active' },
    { name: 'createdAt', type: 'string', default: '' },
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
    traitName: `${entityName}Lifecycle`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: SessionConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: SessionConfig): Trait {
  const { entityName } = c;

  const activeUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'terminal', size: 'lg' },
          { type: 'typography', content: `${entityName}`, variant: 'h2' },
          { type: 'badge', label: 'Active', variant: 'success' },
        ],
      },
      { type: 'divider' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md',
        children: [
          { type: 'typography', variant: 'caption', content: 'Session ID:' },
          { type: 'badge', label: '@entity.sessionId' },
        ],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'md',
        children: [
          { type: 'typography', variant: 'caption', content: 'Label:' },
          { type: 'badge', label: '@entity.label' },
        ],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'button', label: 'Fork', event: 'FORK', variant: 'secondary', icon: 'git-branch' },
          { type: 'button', label: 'Label', event: 'LABEL', variant: 'secondary', icon: 'tag' },
          { type: 'button', label: 'End', event: 'END', variant: 'destructive', icon: 'square' },
        ],
      },
    ],
  };

  const forkedUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'git-branch', size: 'lg' },
          { type: 'typography', content: `${entityName} (Forked)`, variant: 'h2' },
          { type: 'badge', label: 'Forked', variant: 'info' },
        ],
      },
      { type: 'divider' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md',
        children: [
          { type: 'typography', variant: 'caption', content: 'Session:' },
          { type: 'badge', label: '@entity.sessionId' },
          { type: 'typography', variant: 'caption', content: 'Parent:' },
          { type: 'badge', label: '@entity.parentId' },
        ],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'button', label: 'Fork Again', event: 'FORK', variant: 'secondary', icon: 'git-branch' },
          { type: 'button', label: 'Label', event: 'LABEL', variant: 'secondary', icon: 'tag' },
          { type: 'button', label: 'End', event: 'END', variant: 'destructive', icon: 'square' },
        ],
      },
    ],
  };

  const endedUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'check-circle', size: 'lg' },
          { type: 'typography', content: `${entityName} (Ended)`, variant: 'h2' },
          { type: 'badge', label: 'Ended', variant: 'secondary' },
        ],
      },
      { type: 'divider' },
      { type: 'alert', variant: 'info', message: 'Session has ended.' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md',
        children: [
          { type: 'typography', variant: 'caption', content: 'Session:' },
          { type: 'badge', label: '@entity.sessionId' },
          { type: 'typography', variant: 'caption', content: 'Label:' },
          { type: 'badge', label: '@entity.label' },
        ],
      },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'active', isInitial: true },
        { name: 'forked' },
        { name: 'ended' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'FORK', name: 'Fork Session' },
        { key: 'LABEL', name: 'Label Session', payload: [
          { name: 'label', type: 'string', required: true },
        ]},
        { key: 'END', name: 'End Session' },
      ],
      transitions: [
        {
          from: 'active', to: 'active', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['agent/session-id'],
            ['set', '@entity.createdAt', '@now'],
            ['render-ui', 'main', activeUI],
          ],
        },
        {
          from: 'active', to: 'forked', event: 'FORK',
          effects: [
            ['set', '@entity.parentId', '@entity.sessionId'],
            ['agent/fork'],
            ['agent/session-id'],
            ['render-ui', 'main', forkedUI],
          ],
        },
        {
          from: 'forked', to: 'forked', event: 'FORK',
          effects: [
            ['set', '@entity.parentId', '@entity.sessionId'],
            ['agent/fork'],
            ['agent/session-id'],
            ['render-ui', 'main', forkedUI],
          ],
        },
        {
          from: 'active', to: 'active', event: 'LABEL',
          effects: [
            ['agent/label', '@payload.label'],
            ['set', '@entity.label', '@payload.label'],
            ['render-ui', 'main', activeUI],
          ],
        },
        {
          from: 'forked', to: 'forked', event: 'LABEL',
          effects: [
            ['agent/label', '@payload.label'],
            ['set', '@entity.label', '@payload.label'],
            ['render-ui', 'main', forkedUI],
          ],
        },
        {
          from: 'active', to: 'ended', event: 'END',
          effects: [
            ['set', '@entity.status', 'ended'],
            ['render-ui', 'main', endedUI],
          ],
        },
        {
          from: 'forked', to: 'ended', event: 'END',
          effects: [
            ['set', '@entity.status', 'ended'],
            ['render-ui', 'main', endedUI],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: SessionConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentSessionEntity(params: StdAgentSessionParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentSessionTrait(params: StdAgentSessionParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdAgentSessionPage(params: StdAgentSessionParams = {}): Page {
  return buildPage(resolve(params));
}

export function stdAgentSession(params: StdAgentSessionParams = {}): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
