/**
 * std-agent-search
 *
 * Code search flow atom for agent-powered codebase searching.
 * Composes stdBrowse (results table) with an agent trait that
 * handles agent/search-code.
 *
 * @level atom
 * @family agent
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makeOrbital, ensureIdField, plural, extractTrait } from '@almadar/core/builders';
import { stdBrowse } from './std-browse.js';

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

function buildAgentTrait(c: SearchConfig): Trait {
  const { entityName } = c;
  const agentTraitName = `${entityName}Agent`;

  return {
    name: agentTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'SEARCHED', scope: 'external' as const, payload: [
        { name: 'query', type: 'string' },
        { name: 'resultCount', type: 'number' },
      ]},
    ],
    listens: [
      { event: 'SEARCHED', triggers: 'INIT', scope: 'external' as const },
    ],
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
            ['render-ui', 'main', { type: 'empty-state', icon: 'search', title: 'Code Search', description: 'Code Search is ready' }],
          ],
        },
        {
          from: 'idle', to: 'searching', event: 'SEARCH',
          effects: [
            ['set', '@entity.query', '@payload.query'],
            ['set', '@entity.language', '@payload.language'],
            ['agent/search-code', '@payload.query', '@payload.language'],
          ],
        },
        {
          from: 'searching', to: 'results', event: 'SEARCH',
          effects: [
            ['fetch', entityName],
            ['emit', 'SEARCHED'],
          ],
        },
        {
          from: 'results', to: 'searching', event: 'SEARCH',
          effects: [
            ['set', '@entity.query', '@payload.query'],
            ['set', '@entity.language', '@payload.language'],
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
          ],
        },
      ],
    },
  } as Trait;
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentSearchEntity(params: StdAgentSearchParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentSearchTrait(params: StdAgentSearchParams = {}): Trait {
  return buildAgentTrait(resolve(params));
}

export function stdAgentSearchPage(params: StdAgentSearchParams = {}): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: `${c.entityName}Browse` },
      { ref: `${c.entityName}Agent` },
    ],
  } as Page;
}

export function stdAgentSearch(params: StdAgentSearchParams = {}): OrbitalDefinition {
  const c = resolve(params);
  const { entityName, fields } = c;

  // UI trait: browse results table
  const browseTrait = extractTrait(stdBrowse({
    entityName, fields,
    traitName: `${entityName}Browse`,
    listFields: ['query', 'language', 'resultCount'],
    headerIcon: 'search',
    pageTitle: `${entityName}`,
    emptyTitle: 'No search results',
    emptyDescription: 'Enter a query to search the codebase.',
    headerActions: [
      { label: 'Search', event: 'SEARCH', variant: 'primary', icon: 'search' },
      { label: 'Clear', event: 'CLEAR', variant: 'ghost', icon: 'x' },
    ],
    itemActions: [
      { label: 'View', event: 'VIEW' },
    ],
    refreshEvents: ['SEARCHED'],
  }));

  const agentTrait = buildAgentTrait(c);
  const entity = buildEntity(c);

  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: browseTrait.name },
      { ref: agentTrait.name },
    ],
  } as Page;

  return makeOrbital(`${c.entityName}Orbital`, entity, [browseTrait, agentTrait], [page]);
}
