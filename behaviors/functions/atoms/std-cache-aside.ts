/**
 * std-cache-aside
 *
 * Cache management behavior: empty, cached, stale with fetch/invalidate cycle.
 * Pure function: params in, OrbitalDefinition out.
 *
 * @level molecule
 * @family infrastructure
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdCacheAsideParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;

  // Display
  listFields?: string[];

  // Labels
  pageTitle?: string;
  emptyTitle?: string;
  emptyDescription?: string;

  // Icons
  headerIcon?: string;

  // Config
  ttl?: number;

  // Page
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface CacheAsideConfig {
  entityName: string;
  fields: EntityField[];
  nonIdFields: EntityField[];
  listFields: string[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  traitName: string;
  pageTitle: string;
  emptyTitle: string;
  emptyDescription: string;
  headerIcon: string;
  ttl: number;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdCacheAsideParams): CacheAsideConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const nonIdFields = fields.filter(f => f.name !== 'id');
  const p = plural(entityName);

  return {
    entityName,
    fields,
    nonIdFields,
    listFields: params.listFields ?? nonIdFields.slice(0, 3).map(f => f.name),
    persistence: params.persistence ?? 'runtime',
    collection: params.collection,
    traitName: `${entityName}CacheManager`,
    pageTitle: params.pageTitle ?? `${p} Cache`,
    emptyTitle: params.emptyTitle ?? 'Cache is empty',
    emptyDescription: params.emptyDescription ?? 'Fetch data to populate the cache.',
    headerIcon: params.headerIcon ?? 'database',
    ttl: params.ttl ?? 300,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: CacheAsideConfig): Entity {
  // Add cache metric fields
  const fields = [
    ...c.fields.filter(f => !['hitCount', 'cacheAge'].includes(f.name)),
    { name: 'hitCount', type: 'number' as const, default: 0 },
    { name: 'cacheAge', type: 'number' as const, default: 0 },
  ];
  return makeEntity({ name: c.entityName, fields, persistence: c.persistence, collection: c.collection });
}

function buildTrait(c: CacheAsideConfig): Trait {
  const { entityName, listFields, headerIcon } = c;
  const { pageTitle, emptyTitle, emptyDescription } = c;

  // List item children for data-grid
  const listItemChildren: unknown[] = [
    {
      type: 'stack', direction: 'horizontal', justify: 'space-between', align: 'center',
      children: [
        {
          type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
          children: [
            { type: 'icon', name: headerIcon, size: 'sm' },
            { type: 'typography', variant: 'h4', content: `@entity.${listFields[0] ?? 'id'}` },
          ],
        },
        ...(listFields.length > 1 ? [{ type: 'badge', label: `@entity.${listFields[1]}` }] : []),
      ],
    },
  ];
  if (listFields.length > 2) {
    listItemChildren.push({ type: 'typography', variant: 'caption', content: `@entity.${listFields[2]}` });
  }

  // Header bar
  const headerBar = {
    type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md',
        children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: pageTitle, variant: 'h2' },
        ],
      },
      { type: 'button', label: 'Fetch', event: 'FETCH', variant: 'primary', icon: 'download' },
    ],
  };

  // Empty state main view with status dot
  const emptyMainUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between',
        children: [
          headerBar,
          { type: 'status-dot', status: 'inactive', pulse: false, label: 'Empty' },
        ],
      },
      { type: 'divider' },
      { type: 'empty-state', icon: 'inbox', title: emptyTitle, description: emptyDescription },
    ],
  };

  // Cached state main view with status dot + stats
  const cachedMainUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'md',
            children: [
              { type: 'icon', name: headerIcon, size: 'lg' },
              { type: 'typography', content: pageTitle, variant: 'h2' },
            ],
          },
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
            children: [
              { type: 'status-dot', status: 'success', pulse: false, label: 'Cached' },
              { type: 'button', label: 'Invalidate', event: 'INVALIDATE', variant: 'ghost', icon: 'trash' },
            ],
          },
        ],
      },
      { type: 'divider' },
      {
        type: 'simple-grid', columns: 2,
        children: [
          { type: 'stat-display', label: 'Hit Count', value: '@entity.hitCount' },
          { type: 'stat-display', label: 'Cache Age', value: '@entity.cacheAge' },
        ],
      },
      {
        type: 'data-grid', entity: entityName, emptyIcon: 'inbox', emptyTitle, emptyDescription,
        children: [{ type: 'stack', direction: 'vertical', gap: 'sm', children: listItemChildren }],
      },
    ],
  };

  // Stale state main view with warning status + timeline
  const staleMainUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'md',
            children: [
              { type: 'icon', name: headerIcon, size: 'lg' },
              { type: 'typography', content: pageTitle, variant: 'h2' },
            ],
          },
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
            children: [
              { type: 'status-dot', status: 'warning', pulse: true, label: 'Stale' },
              { type: 'button', label: 'Refresh', event: 'REFRESH', variant: 'primary', icon: 'refresh-cw' },
            ],
          },
        ],
      },
      { type: 'divider' },
      { type: 'alert', variant: 'warning', message: 'Cache data is stale. Refresh to get the latest data.' },
      {
        type: 'data-grid', entity: entityName, emptyIcon: 'inbox', emptyTitle, emptyDescription,
        children: [{ type: 'stack', direction: 'vertical', gap: 'sm', children: listItemChildren }],
      },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'empty', isInitial: true },
        { name: 'cached' },
        { name: 'stale' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'FETCH', name: 'Fetch' },
        { key: 'CACHED', name: 'Cached', payload: [{ name: 'data', type: 'object', required: true }] },
        { key: 'INVALIDATE', name: 'Invalidate' },
        { key: 'REFRESH', name: 'Refresh' },
      ],
      transitions: [
        // INIT: empty -> empty
        {
          from: 'empty', to: 'empty', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', emptyMainUI],
          ],
        },
        // FETCH: empty -> cached
        {
          from: 'empty', to: 'cached', event: 'FETCH',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', cachedMainUI],
          ],
        },
        // INIT: cached -> cached (refresh)
        {
          from: 'cached', to: 'cached', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', cachedMainUI],
          ],
        },
        // CACHED: cached -> cached (update with new data)
        {
          from: 'cached', to: 'cached', event: 'CACHED',
          effects: [
            ['persist', 'update', entityName, '@payload.data'],
            ['fetch', entityName],
            ['render-ui', 'main', cachedMainUI],
          ],
        },
        // INVALIDATE: cached -> stale
        {
          from: 'cached', to: 'stale', event: 'INVALIDATE',
          effects: [
            ['render-ui', 'main', staleMainUI],
          ],
        },
        // REFRESH: stale -> cached
        {
          from: 'stale', to: 'cached', event: 'REFRESH',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', cachedMainUI],
          ],
        },
        // FETCH: stale -> cached (same as refresh)
        {
          from: 'stale', to: 'cached', event: 'FETCH',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', cachedMainUI],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: CacheAsideConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdCacheAsideEntity(params: StdCacheAsideParams): Entity {
  return buildEntity(resolve(params));
}

export function stdCacheAsideTrait(params: StdCacheAsideParams): Trait {
  return buildTrait(resolve(params));
}

export function stdCacheAsidePage(params: StdCacheAsideParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdCacheAside(params: StdCacheAsideParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
