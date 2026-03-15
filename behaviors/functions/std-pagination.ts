/**
 * std-pagination as a Function
 *
 * Pagination behavior parameterized for any domain.
 * Provides page/pageSize controls that paginate entity data.
 * Single idle state with a self-loop that re-renders with the new page applied.
 *
 * @level atom
 * @family pagination
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdPaginationParams {
  /** Entity name in PascalCase (e.g., "Article", "Product") */
  entityName: string;
  /** Entity fields (id is auto-added) */
  fields: EntityField[];
  /** Persistence mode */
  persistence?: 'persistent' | 'runtime' | 'singleton';

  // Display
  /** Header icon (Lucide name) */
  headerIcon?: string;
  /** Page title (defaults to plural entity name) */
  pageTitle?: string;

  // Page
  /** Page name (defaults to "{Entity}PaginationPage") */
  pageName?: string;
  /** Route path (defaults to "/{entities}/paginated") */
  pagePath?: string;
  /** Whether this is the initial/home page */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface PaginationConfig {
  entityName: string;
  fields: EntityField[];
  displayField: string;
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  headerIcon: string;
  pageTitle: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdPaginationParams): PaginationConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  // Ensure pagination tracking fields exist on entity
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'currentPage') ? [] : [{ name: 'currentPage', type: 'number' as const, default: 1 }]),
    ...(baseFields.some(f => f.name === 'pageSize') ? [] : [{ name: 'pageSize', type: 'number' as const, default: 10 }]),
  ];

  const nonIdFields = baseFields.filter(f => f.name !== 'id' && f.name !== 'currentPage' && f.name !== 'pageSize');
  const p = plural(entityName);

  return {
    entityName,
    fields,
    displayField: nonIdFields[0]?.name ?? 'id',
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Pagination`,
    pluralName: p,
    headerIcon: params.headerIcon ?? 'list',
    pageTitle: params.pageTitle ?? p,
    pageName: params.pageName ?? `${entityName}PaginationPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/paginated`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: PaginationConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: PaginationConfig): Trait {
  const { entityName, displayField, pluralName, headerIcon, pageTitle } = c;

  const mainView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        // Clean header: just title, no duplicate page number badge
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'space-between', align: 'center',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
            children: [
              { type: 'icon', name: headerIcon, size: 'lg' },
              { type: 'typography', content: pageTitle, variant: 'h2' },
            ],
          },
        ],
      },
      { type: 'divider' },
      {
        type: 'data-grid', entity: entityName,
        emptyIcon: 'inbox',
        emptyTitle: `No ${pluralName.toLowerCase()} yet`,
        emptyDescription: `Add ${pluralName.toLowerCase()} to see them here.`,
        className: 'transition-shadow hover:shadow-md cursor-pointer',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'sm',
          children: [
            { type: 'typography', variant: 'h4', content: `@entity.${displayField}` },
            // secondary caption row to distinguish items
            { type: 'typography', variant: 'caption', color: 'muted', content: `@entity.id` },
          ],
        }],
      },
      {
        // Pagination footer with context: "Page N" and Prev/Next nav
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center', align: 'center',
        children: [
          { type: 'button', label: 'Previous', event: 'PAGE', variant: 'ghost', icon: 'chevron-left' },
          { type: 'typography', variant: 'body', color: 'muted',
            content: ['concat', 'Page ', '@entity.currentPage'] },
          { type: 'button', label: 'Next', event: 'PAGE', variant: 'ghost', icon: 'chevron-right' },
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
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'PAGE', name: 'Change Page', payload: [
          { name: 'page', type: 'number', required: true },
          { name: 'pageSize', type: 'number', required: true },
        ] },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', mainView],
          ],
        },
        {
          from: 'idle', to: 'idle', event: 'PAGE',
          effects: [
            ['set', '@entity.currentPage', '@payload.page'],
            ['set', '@entity.pageSize', '@payload.pageSize'],
            ['fetch', entityName],
            ['render-ui', 'main', mainView],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: PaginationConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdPaginationEntity(params: StdPaginationParams): Entity {
  return buildEntity(resolve(params));
}

export function stdPaginationTrait(params: StdPaginationParams): Trait {
  return buildTrait(resolve(params));
}

export function stdPaginationPage(params: StdPaginationParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdPagination(params: StdPaginationParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
