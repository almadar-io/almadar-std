/**
 * std-agent-context-window
 *
 * Context window management atom for agent token tracking.
 * Monitors token usage and auto-compacts when approaching limits.
 * States: normal -> approaching_limit -> at_limit with guards on thresholds.
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

export interface StdAgentContextWindowParams {
  /** Entity name in PascalCase (default: "ContextWindow") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, context window fields are always included) */
  fields?: EntityField[];
  /** Persistence mode (default: "persistent") */
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Token threshold percentage for approaching_limit (default: 0.85) */
  warningThreshold?: number;
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

interface ContextWindowConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  warningThreshold: number;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdAgentContextWindowParams): ContextWindowConfig {
  const entityName = params.entityName ?? 'ContextWindow';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'tokenCount', type: 'number', default: 0 },
    { name: 'maxTokens', type: 'number', default: 200000 },
    { name: 'usage', type: 'number', default: 0 },
    { name: 'lastCompactedAt', type: 'string', default: '' },
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
    traitName: `${entityName}Manager`,
    pluralName: p,
    warningThreshold: params.warningThreshold ?? 0.85,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: ContextWindowConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: ContextWindowConfig): Trait {
  const { entityName, warningThreshold } = c;

  const normalUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'layers', size: 'lg' },
          { type: 'typography', content: `${entityName}`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md',
        children: [
          { type: 'badge', label: '@entity.tokenCount', variant: 'default' },
          { type: 'typography', variant: 'caption', content: '/' },
          { type: 'badge', label: '@entity.maxTokens', variant: 'default' },
        ],
      },
      { type: 'progress-bar', value: '@entity.usage', max: 100 },
      { type: 'button', label: 'Update Tokens', event: 'UPDATE_TOKENS', variant: 'secondary', icon: 'refresh-cw' },
    ],
  };

  const warningUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'alert-triangle', size: 'lg' },
          { type: 'typography', content: `${entityName} (Warning)`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'alert', variant: 'warning', message: 'Context window approaching limit.' },
      { type: 'progress-bar', value: '@entity.usage', max: 100 },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'button', label: 'Compact', event: 'COMPACT', variant: 'primary', icon: 'minimize-2' },
          { type: 'button', label: 'Update', event: 'UPDATE_TOKENS', variant: 'secondary', icon: 'refresh-cw' },
        ],
      },
    ],
  };

  const limitUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'alert-octagon', size: 'lg' },
          { type: 'typography', content: `${entityName} (At Limit)`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'alert', variant: 'error', message: 'Context window at capacity. Compaction required.' },
      { type: 'progress-bar', value: 100, max: 100 },
      { type: 'button', label: 'Compact Now', event: 'COMPACT', variant: 'primary', icon: 'minimize-2' },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'normal', isInitial: true },
        { name: 'approaching_limit' },
        { name: 'at_limit' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'UPDATE_TOKENS', name: 'Update Token Count' },
        { key: 'COMPACT', name: 'Compact Context' },
      ],
      transitions: [
        {
          from: 'normal', to: 'normal', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['agent/token-count'],
            ['agent/context-usage'],
            ['render-ui', 'main', normalUI],
          ],
        },
        {
          from: 'normal', to: 'normal', event: 'UPDATE_TOKENS',
          guard: ['<', ['/', '@entity.tokenCount', '@entity.maxTokens'], warningThreshold],
          effects: [
            ['agent/token-count'],
            ['agent/context-usage'],
            ['set', '@entity.usage', ['*', ['/', '@entity.tokenCount', '@entity.maxTokens'], 100]],
            ['render-ui', 'main', normalUI],
          ],
        },
        {
          from: 'normal', to: 'approaching_limit', event: 'UPDATE_TOKENS',
          guard: ['and',
            ['>=', ['/', '@entity.tokenCount', '@entity.maxTokens'], warningThreshold],
            ['<', ['/', '@entity.tokenCount', '@entity.maxTokens'], 1],
          ],
          effects: [
            ['agent/token-count'],
            ['agent/context-usage'],
            ['set', '@entity.usage', ['*', ['/', '@entity.tokenCount', '@entity.maxTokens'], 100]],
            ['render-ui', 'main', warningUI],
          ],
        },
        {
          from: 'approaching_limit', to: 'at_limit', event: 'UPDATE_TOKENS',
          guard: ['>=', ['/', '@entity.tokenCount', '@entity.maxTokens'], 1],
          effects: [
            ['agent/token-count'],
            ['agent/context-usage'],
            ['set', '@entity.usage', 100],
            ['render-ui', 'main', limitUI],
          ],
        },
        {
          from: 'approaching_limit', to: 'normal', event: 'COMPACT',
          effects: [
            ['agent/compact'],
            ['agent/token-count'],
            ['agent/context-usage'],
            ['set', '@entity.lastCompactedAt', '@now'],
            ['set', '@entity.usage', ['*', ['/', '@entity.tokenCount', '@entity.maxTokens'], 100]],
            ['render-ui', 'main', normalUI],
          ],
        },
        {
          from: 'at_limit', to: 'normal', event: 'COMPACT',
          effects: [
            ['agent/compact'],
            ['agent/token-count'],
            ['agent/context-usage'],
            ['set', '@entity.lastCompactedAt', '@now'],
            ['set', '@entity.usage', ['*', ['/', '@entity.tokenCount', '@entity.maxTokens'], 100]],
            ['render-ui', 'main', normalUI],
          ],
        },
        {
          from: 'approaching_limit', to: 'approaching_limit', event: 'UPDATE_TOKENS',
          guard: ['and',
            ['>=', ['/', '@entity.tokenCount', '@entity.maxTokens'], warningThreshold],
            ['<', ['/', '@entity.tokenCount', '@entity.maxTokens'], 1],
          ],
          effects: [
            ['agent/token-count'],
            ['agent/context-usage'],
            ['set', '@entity.usage', ['*', ['/', '@entity.tokenCount', '@entity.maxTokens'], 100]],
            ['render-ui', 'main', warningUI],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: ContextWindowConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentContextWindowEntity(params: StdAgentContextWindowParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentContextWindowTrait(params: StdAgentContextWindowParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdAgentContextWindowPage(params: StdAgentContextWindowParams = {}): Page {
  return buildPage(resolve(params));
}

export function stdAgentContextWindow(params: StdAgentContextWindowParams = {}): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
