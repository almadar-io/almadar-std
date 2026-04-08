/**
 * std-service-youtube
 *
 * YouTube service integration behavior: search videos, view video details.
 * Wraps the `youtube` service integration with search and getVideo operations.
 * Pure function: params in, OrbitalDefinition out.
 *
 * @level atom
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

export interface StdServiceYoutubeParams {
  /** Entity name in PascalCase (default: "VideoSearch") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, youtube fields are always included) */
  fields?: EntityField[];
  /** Persistence mode */
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** When true, INIT renders the search form to main. Default true. */
  standalone?: boolean;
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

interface YoutubeConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  standalone: boolean;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdServiceYoutubeParams): YoutubeConfig {
  const entityName = params.entityName ?? 'VideoSearch';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'query', type: 'string' },
    { name: 'selectedVideoId', type: 'string' },
    { name: 'videoTitle', type: 'string' },
    { name: 'videoDescription', type: 'string' },
    { name: 'searchStatus', type: 'string', default: 'idle' },
    { name: 'error', type: 'string' },
  ];
  const baseFields = params.fields ?? [];
  const existingNames = new Set(baseFields.map(f => f.name));
  const mergedFields = [
    ...baseFields,
    ...requiredFields.filter(f => !existingNames.has(f.name)),
  ];

  return {
    entityName,
    fields: ensureIdField(mergedFields),
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Youtube`,
    standalone: params.standalone ?? true,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: YoutubeConfig): Entity {
  const youtubeFields: EntityField[] = [
    { name: 'query', type: 'string' as const, default: '' },
    { name: 'selectedVideoId', type: 'string' as const, default: '' },
    { name: 'videoTitle', type: 'string' as const, default: '' },
    { name: 'videoDescription', type: 'string' as const, default: '' },
    { name: 'searchStatus', type: 'string' as const, default: 'idle' },
    { name: 'error', type: 'string' as const, default: '' },
  ];

  // Merge: youtube fields first, then any extra user fields (skip duplicates)
  const youtubeFieldNames = new Set(youtubeFields.map(f => f.name));
  const extraFields = c.fields.filter(f => f.name !== 'id' && !youtubeFieldNames.has(f.name));
  const allFields = ensureIdField([...youtubeFields, ...extraFields]);

  return makeEntity({ name: c.entityName, fields: allFields, persistence: c.persistence });
}

function buildTrait(c: YoutubeConfig): Trait {
  const { entityName, standalone } = c;

  // ---- UI definitions ----

  const searchFormChildren: unknown[] = [
    {
      type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
      children: [
        { type: 'icon', name: 'video', size: 'lg' },
        { type: 'typography', content: 'YouTube Search', variant: 'h2' },
      ],
    },
    { type: 'divider' },
  ];

  if (standalone) {
    searchFormChildren.push(
      { type: 'input', label: 'Search', bind: '@entity.query', placeholder: 'Search YouTube videos...' },
    );
  }

  searchFormChildren.push(
    { type: 'button', label: 'Search', event: 'SEARCH', variant: 'primary', icon: 'search' },
  );

  const idleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'stretch',
    children: searchFormChildren,
  };

  const searchingUI = {
    type: 'loading-state', title: 'Searching...', message: 'Searching YouTube for videos...',
  };

  const resultsUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'stretch',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'icon', name: 'video', size: 'lg' },
          { type: 'typography', content: 'Search Results', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'typography', content: 'Select a video to view details.', variant: 'body' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'New Search', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
          { type: 'button', label: 'Search Again', event: 'SEARCH', variant: 'outline', icon: 'search' },
        ],
      },
    ],
  };

  const detailLoadingUI = {
    type: 'loading-state', title: 'Loading video...', message: 'Fetching video details...',
  };

  const detailUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'stretch',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'icon', name: 'video', size: 'lg' },
          { type: 'typography', content: '@entity.videoTitle', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'typography', content: '@entity.videoDescription', variant: 'body' },
      { type: 'button', label: 'Back to Results', event: 'BACK', variant: 'ghost', icon: 'arrow-left' },
    ],
  };

  const errorUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'error-state', title: 'Search Failed', message: '@entity.error', onRetry: 'SEARCH' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'Retry', event: 'SEARCH', variant: 'primary', icon: 'refresh-cw' },
          { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
        ],
      },
    ],
  };

  // ---- Transitions ----

  const transitions: unknown[] = [
    // INIT: idle -> idle (fetch existing data + render search form)
    {
      from: 'idle', to: 'idle', event: 'INIT',
      effects: [
        ...(standalone ? [['fetch', entityName], ['render-ui', 'main', idleUI]] : [['fetch', entityName]]),
      ],
    },
    // SEARCH: idle -> searching (call youtube search + show loading)
    {
      from: 'idle', to: 'searching', event: 'SEARCH',
      effects: [
        ['render-ui', 'main', searchingUI],
        ['call-service', 'youtube', 'search', { query: '@entity.query', maxResults: 10, type: 'video' }],
      ],
    },
    // SEARCH: results -> searching (re-search from results)
    {
      from: 'results', to: 'searching', event: 'SEARCH',
      effects: [
        ['render-ui', 'main', searchingUI],
        ['call-service', 'youtube', 'search', { query: '@entity.query', maxResults: 10, type: 'video' }],
      ],
    },
    // SEARCH_COMPLETE: searching -> results (display results)
    {
      from: 'searching', to: 'results', event: 'SEARCH_COMPLETE',
      effects: [
        ['set', '@entity.searchStatus', 'complete'],
        ['render-ui', 'main', resultsUI],
      ],
    },
    // SELECT_VIDEO: results -> viewingDetail (call youtube getVideo + show loading)
    {
      from: 'results', to: 'viewingDetail', event: 'SELECT_VIDEO',
      effects: [
        ['set', '@entity.selectedVideoId', '@payload.videoId'],
        ['render-ui', 'main', detailLoadingUI],
        ['call-service', 'youtube', 'getVideo', { videoId: '@payload.videoId' }],
      ],
    },
    // VIDEO_LOADED: viewingDetail -> viewingDetail (set title/description + render detail)
    {
      from: 'viewingDetail', to: 'viewingDetail', event: 'VIDEO_LOADED',
      effects: [
        ['set', '@entity.videoTitle', '@payload.title'],
        ['set', '@entity.videoDescription', '@payload.description'],
        ['render-ui', 'main', detailUI],
      ],
    },
    // BACK: viewingDetail -> results (return to results list)
    {
      from: 'viewingDetail', to: 'results', event: 'BACK',
      effects: [['render-ui', 'main', resultsUI]],
    },
    // FAILED: searching -> error (search failed)
    {
      from: 'searching', to: 'error', event: 'FAILED',
      effects: [
        ['set', '@entity.error', '@payload.error'],
        ['set', '@entity.searchStatus', 'error'],
        ['render-ui', 'main', errorUI],
      ],
    },
    // RESET: results -> idle
    {
      from: 'results', to: 'idle', event: 'RESET',
      effects: [
        ['set', '@entity.searchStatus', 'idle'],
        ['render-ui', 'main', idleUI],
      ],
    },
    // RESET: error -> idle
    {
      from: 'error', to: 'idle', event: 'RESET',
      effects: [
        ['set', '@entity.searchStatus', 'idle'],
        ['set', '@entity.error', ''],
        ['render-ui', 'main', idleUI],
      ],
    },
  ];

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'searching' },
        { name: 'results' },
        { name: 'viewingDetail' },
        { name: 'error' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'SEARCH', name: 'Search Videos' },
        { key: 'SEARCH_COMPLETE', name: 'Search Complete', payload: [
          { name: 'results', type: 'string', required: true },
        ]},
        { key: 'SELECT_VIDEO', name: 'Select Video', payload: [
          { name: 'videoId', type: 'string', required: true },
        ]},
        { key: 'VIDEO_LOADED', name: 'Video Loaded', payload: [
          { name: 'title', type: 'string', required: true },
          { name: 'description', type: 'string', required: true },
        ]},
        { key: 'BACK', name: 'Back to Results' },
        { key: 'FAILED', name: 'Failed', payload: [
          { name: 'error', type: 'string', required: true },
        ]},
        { key: 'RESET', name: 'Reset' },
      ],
      transitions,
    },
  } as Trait;
}

function buildPage(c: YoutubeConfig): Page | undefined {
  if (!c.standalone) return undefined;
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdServiceYoutubeEntity(params: StdServiceYoutubeParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdServiceYoutubeTrait(params: StdServiceYoutubeParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdServiceYoutubePage(params: StdServiceYoutubeParams = {}): Page | undefined {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdServiceYoutube(params: StdServiceYoutubeParams = {}): OrbitalDefinition {
  const c = resolve(params);
  const pages: Page[] = [];
  const page = buildPage(c);
  if (page) pages.push(page);

  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    pages,
  );
}
