/**
 * std-agent-rag — Retrieval-Augmented Generation
 *
 * Composes memory recall, code search, and LLM completion into a RAG pipeline.
 * Retrieves relevant memories and code snippets, injects them as context,
 * then generates a response with the augmented prompt. Reinforces memories
 * that contributed to the final output.
 *
 * Traits composed (inline, representing atom-level concerns):
 * - RagMemory: recall memories by semantic query
 * - RagSearch: search code repositories for relevant snippets
 * - RagCompletion: generate response with augmented context
 *
 * @level molecule
 * @family agent
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdAgentRagParams {
  entityName?: string;
  fields?: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
  /** Max memory hits to retrieve (default 5) */
  memoryLimit?: number;
  /** Programming language filter for code search */
  searchLanguage?: string;
}

// ============================================================================
// Resolve
// ============================================================================

interface RagConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
  memoryLimit: number;
  searchLanguage: string | null;
}

function resolve(params: StdAgentRagParams): RagConfig {
  const entityName = params.entityName ?? 'RagRequest';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'query', type: 'string', default: '' },
    { name: 'context', type: 'string', default: '' },
    { name: 'response', type: 'string', default: '' },
    { name: 'memoryHits', type: 'number', default: 0 },
    { name: 'searchHits', type: 'number', default: 0 },
    { name: 'status', type: 'string', default: 'idle' },
    { name: 'error', type: 'string', default: '' },
  ];

  const baseFields = ensureIdField(params.fields ?? []);
  const userFieldNames = new Set(baseFields.map(f => f.name));
  const fields = [
    ...baseFields,
    ...requiredFields.filter(f => !userFieldNames.has(f.name)),
  ];

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Rag`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
    memoryLimit: params.memoryLimit ?? 5,
    searchLanguage: params.searchLanguage ?? null,
  };
}

// ============================================================================
// UI Content Builders
// ============================================================================

function idleView(entityName: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'brain', size: 'lg' },
          { type: 'typography', content: 'RAG Pipeline', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: 'Enter a query to retrieve context and generate a response', variant: 'body' },
            { type: 'form-section', entity: entityName, mode: 'edit', submitEvent: 'GENERATE', fields: ['query'] },
          ],
        }],
      },
    ],
  };
}

function retrievingView(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'search', size: 'lg' },
      { type: 'typography', content: 'Retrieving context...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'center',
        children: [
          { type: 'badge', label: 'Recalling memories' },
          { type: 'badge', label: 'Searching code' },
        ],
      },
    ],
  };
}

function generatingView(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'cpu', size: 'lg' },
      { type: 'typography', content: 'Generating response...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'center',
        children: [
          { type: 'badge', label: ['string/concat', ['string/of', '@entity.memoryHits'], ' memories'] },
          { type: 'badge', label: ['string/concat', ['string/of', '@entity.searchHits'], ' code hits'] },
        ],
      },
    ],
  };
}

function completedView(entityName: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', justify: 'space-between',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
            children: [
              { type: 'icon', name: 'check-circle', size: 'lg' },
              { type: 'typography', content: 'RAG Complete', variant: 'h2' },
            ],
          },
          { type: 'button', label: 'New Query', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
        ],
      },
      { type: 'divider' },
      {
        type: 'simple-grid', columns: 2,
        children: [
          { type: 'stat-display', label: 'Memory Hits', value: `@entity.memoryHits`, icon: 'brain' },
          { type: 'stat-display', label: 'Code Hits', value: `@entity.searchHits`, icon: 'code' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: 'Query', variant: 'caption' },
            { type: 'typography', content: `@entity.query`, variant: 'body' },
            { type: 'divider' },
            { type: 'typography', content: 'Response', variant: 'caption' },
            { type: 'typography', content: `@entity.response`, variant: 'body' },
          ],
        }],
      },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'sm',
          children: [
            { type: 'typography', content: 'Retrieved Context', variant: 'caption' },
            { type: 'typography', content: `@entity.context`, variant: 'body' },
          ],
        }],
      },
    ],
  };
}

function errorView(entityName: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'alert-triangle', size: 'lg' },
      { type: 'typography', content: 'RAG Pipeline Error', variant: 'h2' },
      { type: 'alert', variant: 'error', message: `@entity.error` },
      { type: 'button', label: 'Try Again', event: 'RESET', variant: 'primary', icon: 'rotate-ccw' },
    ],
  };
}

// ============================================================================
// Trait Builder
// ============================================================================

function buildTrait(c: RagConfig): Trait {
  const { entityName, memoryLimit, searchLanguage } = c;

  const searchArgs: Record<string, unknown> = { query: '@entity.query' };
  if (searchLanguage) {
    searchArgs.language = searchLanguage;
  }

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'retrieving' },
        { name: 'generating' },
        { name: 'completed' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'GENERATE', name: 'Generate' },
        {
          key: 'RETRIEVAL_DONE', name: 'Retrieval Done',
          payload: [
            { name: 'context', type: 'string', required: true },
            { name: 'memoryHits', type: 'number', required: true },
            { name: 'searchHits', type: 'number', required: true },
          ],
        },
        {
          key: 'GENERATION_DONE', name: 'Generation Done',
          payload: [{ name: 'response', type: 'string', required: true }],
        },
        {
          key: 'FAILED', name: 'Failed',
          payload: [{ name: 'error', type: 'string', required: true }],
        },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions: [
        // INIT: idle -> idle (render query form)
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['render-ui', 'main', idleView(entityName)],
          ],
        },
        // GENERATE: idle -> retrieving (recall memories + search code)
        {
          from: 'idle', to: 'retrieving', event: 'GENERATE',
          effects: [
            ['set', '@entity.status', 'retrieving'],
            ['agent/recall', '@entity.query', memoryLimit],
            ['agent/search-code', '@entity.query', ...(searchLanguage ? [searchLanguage] : [])],
            ['render-ui', 'main', retrievingView()],
          ],
        },
        // RETRIEVAL_DONE: retrieving -> generating (inject context, generate with augmented prompt)
        {
          from: 'retrieving', to: 'generating', event: 'RETRIEVAL_DONE',
          effects: [
            ['set', '@entity.context', '@payload.context'],
            ['set', '@entity.memoryHits', '@payload.memoryHits'],
            ['set', '@entity.searchHits', '@payload.searchHits'],
            ['set', '@entity.status', 'generating'],
            ['agent/generate', ['string/concat',
              'Context:\n', '@entity.context',
              '\n\nQuery: ', '@entity.query',
              '\n\nProvide a comprehensive answer based on the retrieved context.',
            ]],
            ['render-ui', 'main', generatingView()],
          ],
        },
        // GENERATION_DONE: generating -> completed (store response, reinforce used memories)
        {
          from: 'generating', to: 'completed', event: 'GENERATION_DONE',
          effects: [
            ['set', '@entity.response', '@payload.response'],
            ['set', '@entity.status', 'completed'],
            ['agent/memorize', ['string/concat', 'RAG query: ', '@entity.query'], 'pattern-affinity'],
            ['render-ui', 'main', completedView(entityName)],
          ],
        },
        // FAILED: retrieving -> idle
        {
          from: 'retrieving', to: 'idle', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'error'],
            ['render-ui', 'main', errorView(entityName)],
          ],
        },
        // FAILED: generating -> idle
        {
          from: 'generating', to: 'idle', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'error'],
            ['render-ui', 'main', errorView(entityName)],
          ],
        },
        // RESET: completed -> idle
        {
          from: 'completed', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.status', 'idle'],
            ['set', '@entity.response', ''],
            ['set', '@entity.context', ''],
            ['set', '@entity.memoryHits', 0],
            ['set', '@entity.searchHits', 0],
            ['set', '@entity.error', ''],
            ['render-ui', 'main', idleView(entityName)],
          ],
        },
      ],
    },
  } as Trait;
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: RagConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildPage(c: RagConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

export function stdAgentRagEntity(params: StdAgentRagParams): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentRagTrait(params: StdAgentRagParams): Trait {
  return buildTrait(resolve(params));
}

export function stdAgentRagPage(params: StdAgentRagParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdAgentRag(params: StdAgentRagParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
