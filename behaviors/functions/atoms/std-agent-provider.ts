/**
 * std-agent-provider
 *
 * Provider routing atom for agent model/provider switching.
 * Manages current provider, model selection, and fallback routing.
 * Uses agent/switch-provider, agent/provider, and agent/model operators.
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

export interface StdAgentProviderParams {
  /** Entity name in PascalCase (default: "ProviderState") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, provider fields are always included) */
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

interface ProviderConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdAgentProviderParams): ProviderConfig {
  const entityName = params.entityName ?? 'ProviderState';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'currentProvider', type: 'string', default: 'anthropic' },
    { name: 'currentModel', type: 'string', default: 'claude-sonnet-4-20250514' },
    { name: 'fallbackProvider', type: 'string', default: 'openai' },
    { name: 'requestCount', type: 'number', default: 0 },
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
    traitName: `${entityName}Router`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: ProviderConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: ProviderConfig): Trait {
  const { entityName } = c;

  const idleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'server', size: 'lg' },
          { type: 'typography', content: `${entityName}`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md',
        children: [
          { type: 'typography', variant: 'caption', content: 'Provider:' },
          { type: 'badge', label: '@entity.currentProvider' },
          { type: 'typography', variant: 'caption', content: 'Model:' },
          { type: 'badge', label: '@entity.currentModel' },
        ],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'md',
        children: [
          { type: 'typography', variant: 'caption', content: 'Fallback:' },
          { type: 'badge', label: '@entity.fallbackProvider', variant: 'secondary' },
          { type: 'typography', variant: 'caption', content: 'Requests:' },
          { type: 'badge', label: '@entity.requestCount' },
        ],
      },
      { type: 'button', label: 'Switch Provider', event: 'SWITCH', variant: 'primary', icon: 'repeat' },
    ],
  };

  const activeUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'server', size: 'lg' },
          { type: 'typography', content: `${entityName} (Active)`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'alert', variant: 'success', message: 'Provider is active and routing requests.' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md',
        children: [
          { type: 'badge', label: '@entity.currentProvider' },
          { type: 'badge', label: '@entity.currentModel' },
          { type: 'badge', label: '@entity.requestCount' },
        ],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'button', label: 'Switch', event: 'SWITCH', variant: 'secondary', icon: 'repeat' },
          { type: 'button', label: 'Auto Switch', event: 'SWITCH_AUTO', variant: 'ghost', icon: 'zap' },
        ],
      },
    ],
  };

  const switchingUI = {
    type: 'loading-state', title: 'Switching...', message: 'Switching provider...',
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'active' },
        { name: 'switching' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'SWITCH', name: 'Switch Provider', payload: [
          { name: 'provider', type: 'string', required: true },
          { name: 'model', type: 'string', required: false },
        ]},
        { key: 'SWITCH_AUTO', name: 'Auto Switch to Fallback' },
      ],
      transitions: [
        {
          from: 'idle', to: 'active', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['agent/provider'],
            ['agent/model'],
            ['render-ui', 'main', activeUI],
          ],
        },
        {
          from: 'active', to: 'switching', event: 'SWITCH',
          effects: [
            ['render-ui', 'main', switchingUI],
            ['agent/switch-provider', '@payload.provider', '@payload.model'],
            ['set', '@entity.currentProvider', '@payload.provider'],
            ['set', '@entity.currentModel', '@payload.model'],
          ],
        },
        {
          from: 'switching', to: 'active', event: 'INIT',
          effects: [
            ['agent/provider'],
            ['agent/model'],
            ['set', '@entity.requestCount', ['+', '@entity.requestCount', 1]],
            ['render-ui', 'main', activeUI],
          ],
        },
        {
          from: 'active', to: 'switching', event: 'SWITCH_AUTO',
          effects: [
            ['render-ui', 'main', switchingUI],
            ['agent/switch-provider', '@entity.fallbackProvider'],
            ['set', '@entity.currentProvider', '@entity.fallbackProvider'],
          ],
        },
        {
          from: 'idle', to: 'switching', event: 'SWITCH',
          effects: [
            ['render-ui', 'main', switchingUI],
            ['agent/switch-provider', '@payload.provider', '@payload.model'],
            ['set', '@entity.currentProvider', '@payload.provider'],
            ['set', '@entity.currentModel', '@payload.model'],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: ProviderConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentProviderEntity(params: StdAgentProviderParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentProviderTrait(params: StdAgentProviderParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdAgentProviderPage(params: StdAgentProviderParams = {}): Page {
  return buildPage(resolve(params));
}

export function stdAgentProvider(params: StdAgentProviderParams = {}): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
