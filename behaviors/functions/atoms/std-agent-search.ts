/**
 * std-agent-search
 *
 * Code search flow atom for agent-powered codebase searching.
 * Uses agent/search-code to find relevant code across a repository.
 * States: idle -> searching -> results.
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

export interface StdAgentSearchParams {
  /** Entity name in PascalCase (default: "SearchResult") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, search fields are always included) */
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

interface SearchConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdAgentSearchParams): SearchConfig {
  const entityName = params.entityName ?? 'SearchResult';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'query', type: 'string', default: '' },
    { name: 'results', type: 'array', default: [] },
    { name: 'language', type: 'string', default: '' },
    { name: 'resultCount', type: 'number', default: 0 },
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

function buildEntity(c: SearchConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: SearchConfig): Trait {
  const { entityName } = c;

  const idleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'search', size: 'lg' },
          { type: 'typography', content: `${entityName}`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'input', label: 'Search Query', bind: '@entity.query', placeholder: 'Search codebase...' },
      { type: 'input', label: 'Language Filter', bind: '@entity.language', placeholder: 'e.g. typescript, rust' },
      { type: 'button', label: 'Search', event: 'SEARCH', variant: 'primary', icon: 'search' },
    ],
  };

  const searchingUI = {
    type: 'loading-state', title: 'Searching...', message: 'Searching codebase...',
  };

  const resultsUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'search', size: 'lg' },
          { type: 'typography', content: `${entityName}`, variant: 'h2' },
          { type: 'badge', label: '@entity.resultCount' },
        ],
      },
      { type: 'divider' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md',
        children: [
          { type: 'typography', variant: 'caption', content: 'Query:' },
          { type: 'badge', label: '@entity.query' },
          { type: 'typography', variant: 'caption', content: 'Language:' },
          { type: 'badge', label: '@entity.language' },
        ],
      },
      { type: 'typography', variant: 'body', content: '@entity.resultCount' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'button', label: 'New Search', event: 'SEARCH', variant: 'primary', icon: 'search' },
          { type: 'button', label: 'Clear', event: 'CLEAR', variant: 'ghost', icon: 'x' },
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
        { name: 'searching' },
        { name: 'results' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'SEARCH', name: 'Search', payload: [
          { name: 'query', type: 'string', required: true },
          { name: 'language', type: 'string', required: false },
        ]},
        { key: 'CLEAR', name: 'Clear Results' },
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
          from: 'idle', to: 'searching', event: 'SEARCH',
          effects: [
            ['set', '@entity.query', '@payload.query'],
            ['set', '@entity.language', '@payload.language'],
            ['render-ui', 'main', searchingUI],
            ['agent/search-code', '@payload.query', '@payload.language'],
          ],
        },
        {
          from: 'searching', to: 'results', event: 'SEARCH',
          effects: [
            ['render-ui', 'main', resultsUI],
          ],
        },
        {
          from: 'results', to: 'searching', event: 'SEARCH',
          effects: [
            ['set', '@entity.query', '@payload.query'],
            ['set', '@entity.language', '@payload.language'],
            ['render-ui', 'main', searchingUI],
            ['agent/search-code', '@payload.query', '@payload.language'],
          ],
        },
        {
          from: 'results', to: 'idle', event: 'CLEAR',
          effects: [
            ['set', '@entity.query', ''],
            ['set', '@entity.results', []],
            ['set', '@entity.language', ''],
            ['set', '@entity.resultCount', 0],
            ['render-ui', 'main', idleUI],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: SearchConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentSearchEntity(params: StdAgentSearchParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentSearchTrait(params: StdAgentSearchParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdAgentSearchPage(params: StdAgentSearchParams = {}): Page {
  return buildPage(resolve(params));
}

export function stdAgentSearch(params: StdAgentSearchParams = {}): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
