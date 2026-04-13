/**
 * std-agent-rag -- Retrieval-Augmented Generation
 *
 * Composes agent atoms + UI atoms into a RAG pipeline with tabbed views.
 * Retrieves relevant memories and code snippets, injects them as context,
 * then generates a response with the augmented prompt.
 *
 * Composed atoms:
 * - stdAgentMemory: recall memories by semantic query
 * - stdAgentSearch: search code repositories for relevant snippets
 * - stdAgentCompletion: generate response with augmented context
 * - stdTabs: tabbed view for Query / Sources / Response
 *
 * Cross-trait events:
 * - GENERATE (RagOrchestrator -> MemoryLifecycle): trigger recall
 * - RETRIEVAL_DONE (RagOrchestrator -> SearchLifecycle): trigger search after recall
 * - GENERATION_DONE (RagOrchestrator -> CompletionFlow): trigger completion
 *
 * @level molecule
 * @family agent
 * @packageDocumentation
 *
 * @deprecated The TypeScript factory layer is deprecated as of Phase F.10
 * (2026-04-08). The canonical source for std behaviors is now the registry
 * `.orb` file at `packages/almadar-std/behaviors/registry/<level>/<name>.orb`,
 * which is generated from this TS source by `tools/almadar-behavior-ts-to-orb/`
 * and consumed by the compiler's embedded loader.
 *
 * Consumers should import behaviors via `.lolo`/`.orb` `uses` declarations and
 * reference them as `Alias.entity` / `Alias.traits.X` / `Alias.pages.X`, applying
 * overrides at the call site (`linkedEntity`, `name`, `events`, `effects`,
 * `listens`, `emitsScope`). The TS `*Params` interface and the exported factory
 * functions remain ONLY as the authoring path for the converter; they are NOT a
 * stable public API and may change without notice.
 *
 * See `docs/Almadar_Orb_Behaviors.md` for the orbital-as-function model and
 * `docs/LOLO_Gaps.md` for the migration plan.
 */

import type { OrbitalDefinition, OrbitalSchema, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makeOrbital, makeSchema, ensureIdField, plural, extractTrait } from '@almadar/core/builders';
import { stdAgentMemory } from '../atoms/std-agent-memory.js';
import { stdAgentSearch } from '../atoms/std-agent-search.js';
import { stdAgentCompletion } from '../atoms/std-agent-completion.js';
import { stdTabs } from '../atoms/std-tabs.js';

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
    // Fields for composed atoms (memory, search, completion)
    { name: 'content', type: 'string', default: '' },
    { name: 'category', type: 'string', default: '' },
    { name: 'scope', type: 'string', default: '' },
    { name: 'strength', type: 'number', default: 1 },
    { name: 'pinned', type: 'boolean', default: false },
    { name: 'language', type: 'string', default: '' },
    { name: 'resultCount', type: 'number', default: 0 },
    { name: 'results', type: 'string', default: '[]' },
    { name: 'prompt', type: 'string', default: '' },
    { name: 'provider', type: 'string', default: 'anthropic' },
    { name: 'model', type: 'string', default: 'claude-sonnet-4-20250514' },
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
          { type: 'badge', label: ['str/concat', ['str/concat', '@entity.memoryHits'], ' memories'] },
          { type: 'badge', label: ['str/concat', ['str/concat', '@entity.searchHits'], ' code hits'] },
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

function errorView(_entityName: string): unknown {
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

function buildRagTrait(c: RagConfig): Trait {
  const { entityName, memoryLimit, searchLanguage } = c;

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
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['render-ui', 'main', idleView(entityName)],
          ],
        },
        {
          from: 'idle', to: 'retrieving', event: 'GENERATE',
          effects: [
            ['set', '@entity.status', 'retrieving'],
            ['agent/recall', '@entity.query', memoryLimit],
            ['agent/search-code', '@entity.query', ...(searchLanguage ? [searchLanguage] : [])],
            ['render-ui', 'main', retrievingView()],
          ],
        },
        {
          from: 'retrieving', to: 'generating', event: 'RETRIEVAL_DONE',
          effects: [
            ['set', '@entity.context', '@payload.context'],
            ['set', '@entity.memoryHits', '@payload.memoryHits'],
            ['set', '@entity.searchHits', '@payload.searchHits'],
            ['set', '@entity.status', 'generating'],
            ['agent/generate', ['str/concat',
              'Context:\n', '@entity.context',
              '\n\nQuery: ', '@entity.query',
              '\n\nProvide a comprehensive answer based on the retrieved context.',
            ]],
            ['render-ui', 'main', generatingView()],
          ],
        },
        {
          from: 'generating', to: 'completed', event: 'GENERATION_DONE',
          effects: [
            ['set', '@entity.response', '@payload.response'],
            ['set', '@entity.status', 'completed'],
            ['agent/memorize', ['str/concat', 'RAG query: ', '@entity.query'], 'pattern-affinity'],
            ['render-ui', 'main', completedView(entityName)],
          ],
        },
        {
          from: 'retrieving', to: 'idle', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'error'],
            ['render-ui', 'main', errorView(entityName)],
          ],
        },
        {
          from: 'generating', to: 'idle', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'error'],
            ['render-ui', 'main', errorView(entityName)],
          ],
        },
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

export function stdAgentRagEntity(params: StdAgentRagParams): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentRagTrait(params: StdAgentRagParams): Trait {
  return buildRagTrait(resolve(params));
}

export function stdAgentRagPage(params: StdAgentRagParams): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: c.traitName },
      { ref: 'RagTabs' },
      { ref: 'RagMemoryLifecycle' },
      { ref: 'RagSearchLifecycle' },
      { ref: 'RagCompletionFlow' },
    ],
  } as Page;
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdAgentRag(params: StdAgentRagParams): OrbitalSchema {
  const c = resolve(params);
  const { entityName, fields } = c;

  // 1. Core RAG orchestrator trait
  const ragTrait = buildRagTrait(c);

  // 2. Compose atoms: memory for recall, search for code, completion for generation
  const memoryTrait = extractTrait(stdAgentMemory({
    entityName,
    fields,
    persistence: 'runtime',
  }));
  memoryTrait.name = 'RagMemoryLifecycle';
  memoryTrait.listens = [];
  if (memoryTrait.emits) { for (const e of memoryTrait.emits) { (e as unknown as { scope: string }).scope = 'internal'; } }

  const searchTrait = extractTrait(stdAgentSearch({
    entityName,
    fields,
    persistence: 'runtime',
  }));
  searchTrait.name = 'RagSearchLifecycle';
  searchTrait.listens = [];
  if (searchTrait.emits) { for (const e of searchTrait.emits) { (e as unknown as { scope: string }).scope = 'internal'; } }

  const completionTrait = extractTrait(stdAgentCompletion({
    entityName,
    fields,
    persistence: 'runtime',
  }));
  completionTrait.name = 'RagCompletionFlow';
  completionTrait.listens = [];
  if (completionTrait.emits) { for (const e of completionTrait.emits) { (e as unknown as { scope: string }).scope = 'internal'; } }

  // 3. UI atom: tabs for Query / Sources / Response views
  const tabsTrait = extractTrait(stdTabs({
    entityName,
    fields,
    tabItems: [
      { label: 'Query', value: 'query' },
      { label: 'Sources', value: 'sources' },
      { label: 'Response', value: 'response' },
    ],
    headerIcon: 'brain',
    pageTitle: 'RAG Pipeline',
  }));
  tabsTrait.name = 'RagTabs';

  // 4. Entity
  const entity = makeEntity({ name: entityName, fields, persistence: c.persistence });

  // 5. Page
  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: ragTrait.name },
      { ref: tabsTrait.name },
      { ref: memoryTrait.name },
      { ref: searchTrait.name },
      { ref: completionTrait.name },
    ],
  } as Page;

  return makeSchema(`${entityName}Orbital`, makeOrbital(
    `${entityName}Orbital`,
    entity,
    [ragTrait, tabsTrait, memoryTrait, searchTrait, completionTrait],
    [page],
  ));
}
