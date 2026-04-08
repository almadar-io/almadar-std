/**
 * std-service-content-pipeline
 *
 * Content research pipeline molecule. Composes youtube search + llm summarization
 * into a sequential pipeline: search -> select -> summarize.
 *
 * Single trait with six states (idle, searching, results, summarizing, complete, error)
 * that orchestrates call-service effects for youtube and llm services.
 *
 * @level molecule
 * @family service
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

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdServiceContentPipelineParams {
  entityName?: string;
  fields?: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface PipelineConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdServiceContentPipelineParams): PipelineConfig {
  const entityName = params.entityName ?? 'Research';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'query', type: 'string', default: '' },
    { name: 'videoTitle', type: 'string', default: '' },
    { name: 'videoDescription', type: 'string', default: '' },
    { name: 'summary', type: 'string', default: '' },
    { name: 'pipelineStatus', type: 'string', default: 'idle' },
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
    traitName: `${entityName}Pipeline`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// UI Content Builders
// ============================================================================

function searchFormView(entityName: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'search', size: 'lg' },
          { type: 'typography', content: 'Content Research', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: 'Search YouTube for content to summarize', variant: 'body' },
            { type: 'form-section', entity: entityName, mode: 'edit', submitEvent: 'SEARCH', fields: ['query'] },
          ],
        }],
      },
    ],
  };
}

function searchingView(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'search', size: 'lg' },
      { type: 'typography', content: 'Searching YouTube...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
      { type: 'typography', content: `@entity.query`, variant: 'caption' },
    ],
  };
}

function resultsView(entityName: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', justify: 'space-between',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
            children: [
              { type: 'icon', name: 'video', size: 'lg' },
              { type: 'typography', content: 'Search Results', variant: 'h2' },
            ],
          },
          { type: 'button', label: 'New Search', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
        ],
      },
      { type: 'divider' },
      {
        type: 'data-grid', entity: entityName,
        emptyIcon: 'inbox',
        emptyTitle: 'No results found',
        emptyDescription: 'Try a different search query.',
        itemActions: [{ label: 'Summarize', event: 'SELECT_AND_SUMMARIZE', variant: 'primary', size: 'sm' }],
        columns: [
          { name: 'videoTitle', label: 'Title', variant: 'h4', icon: 'video' },
          { name: 'videoDescription', label: 'Description', variant: 'caption' },
        ],
      },
    ],
  };
}

function summarizingView(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'cpu', size: 'lg' },
      { type: 'typography', content: 'Fetching & summarizing...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
      { type: 'typography', content: `@entity.videoTitle`, variant: 'caption' },
    ],
  };
}

function completeView(): unknown {
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
              { type: 'typography', content: 'Research Complete', variant: 'h2' },
            ],
          },
          { type: 'button', label: 'New Search', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            {
              type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
              children: [
                { type: 'icon', name: 'video', size: 'sm' },
                { type: 'typography', content: `@entity.videoTitle`, variant: 'h3' },
              ],
            },
            { type: 'divider' },
            { type: 'typography', content: 'Summary', variant: 'caption' },
            { type: 'typography', content: `@entity.summary`, variant: 'body' },
          ],
        }],
      },
    ],
  };
}

function errorView(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'alert-triangle', size: 'lg' },
      { type: 'typography', content: 'Pipeline Error', variant: 'h2' },
      { type: 'alert', variant: 'error', message: `@entity.error` },
      { type: 'button', label: 'Try Again', event: 'RESET', variant: 'primary', icon: 'rotate-ccw' },
    ],
  };
}

// ============================================================================
// Trait Builder
// ============================================================================

function buildTrait(c: PipelineConfig): Trait {
  const { entityName } = c;

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'searching' },
        { name: 'results' },
        { name: 'summarizing' },
        { name: 'complete' },
        { name: 'error' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'SEARCH', name: 'Search' },
        {
          key: 'SEARCH_COMPLETE', name: 'Search Complete',
          payload: [{ name: 'results', type: 'array', required: true }],
        },
        {
          key: 'SELECT_AND_SUMMARIZE', name: 'Select and Summarize',
          payload: [{ name: 'videoId', type: 'string', required: true }],
        },
        {
          key: 'VIDEO_FETCHED', name: 'Video Fetched',
          payload: [
            { name: 'title', type: 'string', required: true },
            { name: 'description', type: 'string', required: true },
          ],
        },
        {
          key: 'SUMMARY_COMPLETE', name: 'Summary Complete',
          payload: [{ name: 'content', type: 'string', required: true }],
        },
        {
          key: 'FAILED', name: 'Failed',
          payload: [{ name: 'error', type: 'string', required: true }],
        },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions: [
        // INIT: idle -> idle (render search form)
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['render-ui', 'main', searchFormView(entityName)],
          ],
        },
        // SEARCH: idle -> searching (call youtube search service)
        {
          from: 'idle', to: 'searching', event: 'SEARCH',
          effects: [
            ['set', '@entity.pipelineStatus', 'searching'],
            ['call-service', 'youtube', 'search', { query: '@entity.query', maxResults: 5, type: 'video' }],
            ['render-ui', 'main', searchingView()],
          ],
        },
        // SEARCH_COMPLETE: searching -> results
        {
          from: 'searching', to: 'results', event: 'SEARCH_COMPLETE',
          effects: [
            ['set', '@entity.pipelineStatus', 'results'],
            ['render-ui', 'main', resultsView(entityName)],
          ],
        },
        // SELECT_AND_SUMMARIZE: results -> summarizing (fetch video details)
        {
          from: 'results', to: 'summarizing', event: 'SELECT_AND_SUMMARIZE',
          effects: [
            ['set', '@entity.pipelineStatus', 'summarizing'],
            ['call-service', 'youtube', 'getVideo', { videoId: '@payload.videoId' }],
            ['render-ui', 'main', summarizingView()],
          ],
        },
        // VIDEO_FETCHED: summarizing -> summarizing (set video info, call llm summarize)
        {
          from: 'summarizing', to: 'summarizing', event: 'VIDEO_FETCHED',
          effects: [
            ['set', '@entity.videoTitle', '@payload.title'],
            ['set', '@entity.videoDescription', '@payload.description'],
            ['call-service', 'llm', 'summarize', { text: '@entity.videoDescription' }],
          ],
        },
        // SUMMARY_COMPLETE: summarizing -> complete
        {
          from: 'summarizing', to: 'complete', event: 'SUMMARY_COMPLETE',
          effects: [
            ['set', '@entity.summary', '@payload.content'],
            ['set', '@entity.pipelineStatus', 'complete'],
            ['render-ui', 'main', completeView()],
          ],
        },
        // FAILED: searching -> error
        {
          from: 'searching', to: 'error', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.pipelineStatus', 'error'],
            ['render-ui', 'main', errorView()],
          ],
        },
        // FAILED: summarizing -> error
        {
          from: 'summarizing', to: 'error', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.pipelineStatus', 'error'],
            ['render-ui', 'main', errorView()],
          ],
        },
        // RESET: complete -> idle
        {
          from: 'complete', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.pipelineStatus', 'idle'],
            ['set', '@entity.error', ''],
            ['set', '@entity.summary', ''],
            ['set', '@entity.videoTitle', ''],
            ['set', '@entity.videoDescription', ''],
            ['render-ui', 'main', searchFormView(entityName)],
          ],
        },
        // RESET: results -> idle
        {
          from: 'results', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.pipelineStatus', 'idle'],
            ['render-ui', 'main', searchFormView(entityName)],
          ],
        },
        // RESET: error -> idle
        {
          from: 'error', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.pipelineStatus', 'idle'],
            ['set', '@entity.error', ''],
            ['render-ui', 'main', searchFormView(entityName)],
          ],
        },
      ],
    },
  } as Trait;
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: PipelineConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildPage(c: PipelineConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

export function stdServiceContentPipelineEntity(params: StdServiceContentPipelineParams): Entity {
  return buildEntity(resolve(params));
}

export function stdServiceContentPipelineTrait(params: StdServiceContentPipelineParams): Trait {
  return buildTrait(resolve(params));
}

export function stdServiceContentPipelinePage(params: StdServiceContentPipelineParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdServiceContentPipeline(params: StdServiceContentPipelineParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
