/**
 * std-agent-memory
 *
 * Memory lifecycle atom for agent memory operations.
 * Provides memorize, recall, pin, forget, reinforce, and decay
 * using agent/* operators.
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

export interface StdAgentMemoryParams {
  /** Entity name in PascalCase (default: "Memory") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, memory fields are always included) */
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

interface MemoryConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdAgentMemoryParams): MemoryConfig {
  const entityName = params.entityName ?? 'Memory';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'content', type: 'string', default: '' },
    { name: 'category', type: 'string', default: 'general' },
    { name: 'strength', type: 'number', default: 1.0 },
    { name: 'pinned', type: 'boolean', default: false },
    { name: 'scope', type: 'string', default: 'session' },
    { name: 'lastAccessedAt', type: 'string', default: '' },
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

function buildEntity(c: MemoryConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: MemoryConfig): Trait {
  const { entityName } = c;

  const idleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'brain', size: 'lg' },
          { type: 'typography', content: `${entityName} Manager`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'button', label: 'Memorize', event: 'MEMORIZE', variant: 'primary', icon: 'plus' },
          { type: 'button', label: 'Recall', event: 'RECALL', variant: 'secondary', icon: 'search' },
          { type: 'button', label: 'Decay All', event: 'DECAY', variant: 'ghost', icon: 'clock' },
        ],
      },
    ],
  };

  const activeUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'brain', size: 'lg' },
          { type: 'typography', content: `${entityName} Active`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'typography', variant: 'body', content: '@entity.content' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'badge', label: '@entity.category' },
          { type: 'badge', label: '@entity.strength' },
        ],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'button', label: 'Pin', event: 'PIN', variant: 'secondary', icon: 'pin' },
          { type: 'button', label: 'Reinforce', event: 'REINFORCE', variant: 'secondary', icon: 'zap' },
          { type: 'button', label: 'Forget', event: 'FORGET', variant: 'destructive', icon: 'trash' },
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
        { name: 'idle', isInitial: true },
        { name: 'active' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'MEMORIZE', name: 'Memorize', payload: [
          { name: 'content', type: 'string', required: true },
          { name: 'category', type: 'string', required: false },
        ]},
        { key: 'RECALL', name: 'Recall', payload: [
          { name: 'query', type: 'string', required: true },
        ]},
        { key: 'PIN', name: 'Pin', payload: [
          { name: 'id', type: 'string', required: true },
        ]},
        { key: 'FORGET', name: 'Forget', payload: [
          { name: 'id', type: 'string', required: true },
        ]},
        { key: 'REINFORCE', name: 'Reinforce', payload: [
          { name: 'id', type: 'string', required: true },
        ]},
        { key: 'DECAY', name: 'Decay' },
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
          from: 'idle', to: 'active', event: 'MEMORIZE',
          effects: [
            ['agent/memorize', '@payload.content', '@payload.category'],
            ['set', '@entity.content', '@payload.content'],
            ['set', '@entity.category', '@payload.category'],
            ['set', '@entity.createdAt', '@now'],
            ['render-ui', 'main', activeUI],
          ],
        },
        {
          from: 'idle', to: 'active', event: 'RECALL',
          effects: [
            ['agent/recall', '@payload.query'],
            ['render-ui', 'main', activeUI],
          ],
        },
        {
          from: 'active', to: 'active', event: 'PIN',
          guard: ['not', ['agent/is-pinned', '@payload.id']],
          effects: [
            ['agent/pin', '@payload.id'],
            ['set', '@entity.pinned', true],
          ],
        },
        {
          from: 'active', to: 'idle', event: 'FORGET',
          effects: [
            ['agent/forget', '@payload.id'],
            ['render-ui', 'main', idleUI],
          ],
        },
        {
          from: 'active', to: 'active', event: 'REINFORCE',
          effects: [
            ['agent/reinforce', '@payload.id'],
          ],
        },
        {
          from: 'idle', to: 'idle', event: 'DECAY',
          effects: [
            ['agent/decay'],
          ],
        },
        {
          from: 'active', to: 'idle', event: 'DECAY',
          effects: [
            ['agent/decay'],
            ['render-ui', 'main', idleUI],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: MemoryConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentMemoryEntity(params: StdAgentMemoryParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentMemoryTrait(params: StdAgentMemoryParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdAgentMemoryPage(params: StdAgentMemoryParams = {}): Page {
  return buildPage(resolve(params));
}

export function stdAgentMemory(params: StdAgentMemoryParams = {}): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
