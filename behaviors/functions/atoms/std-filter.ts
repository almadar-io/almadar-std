/**
 * std-filter
 *
 * Filter atom. Shows filter buttons per field with predefined values.
 * Clicking a filter value transitions to filtered state. Clear resets.
 *
 * @level atom
 * @family filter
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdFilterParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Fields to show as filter buttons (defaults to fields with `values` defined) */
  filterFields?: string[];
  headerIcon?: string;
  pageTitle?: string;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface FilterConfig {
  entityName: string;
  fields: EntityField[];
  allFields: EntityField[];
  filterableFields: EntityField[];
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

function resolve(params: StdFilterParams): FilterConfig {
  const { entityName } = params;
  const allFields = ensureIdField(params.fields);
  const nonIdFields = allFields.filter(f => f.name !== 'id');
  const p = plural(entityName);

  // Filterable fields: explicitly specified, or fields that have `values` defined
  const filterFieldNames = params.filterFields ?? nonIdFields.filter(f => f.values && f.values.length > 0).map(f => f.name);
  const filterableFields = nonIdFields.filter(f => filterFieldNames.includes(f.name));

  return {
    entityName,
    fields: allFields,
    allFields,
    filterableFields,
    displayField: nonIdFields[0]?.name ?? 'id',
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Filter`,
    pluralName: p,
    headerIcon: params.headerIcon ?? 'filter',
    pageTitle: params.pageTitle ?? p,
    pageName: params.pageName ?? `${entityName}FilterPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: FilterConfig): Entity {
  const fields = [
    ...c.fields.filter(f => !['activeFilterField', 'activeFilterValue'].includes(f.name)),
    { name: 'activeFilterField', type: 'string' as const, default: '' },
    { name: 'activeFilterValue', type: 'string' as const, default: '' },
  ];
  return makeEntity({ name: c.entityName, fields, persistence: c.persistence });
}

function buildTrait(c: FilterConfig): Trait {
  const { entityName, displayField, pluralName, headerIcon, pageTitle, filterableFields } = c;

  // Build filter controls using filter-group molecule for proper chip state management
  const filterControls: unknown[] = filterableFields.length > 0
    ? [{
        type: 'filter-group',
        entity: entityName,
        filters: filterableFields.map(f => ({
          field: f.name,
          label: f.name.charAt(0).toUpperCase() + f.name.slice(1),
          options: f.values ?? [],
          filterType: f.type === 'boolean' ? 'toggle' : 'select',
        })),
      }]
    : [{ type: 'empty-state', icon: 'filter-x', title: 'No filter fields', description: 'Add fields with predefined values to enable filtering.' }];

  // Boolean filter fields get switch toggles
  const booleanFilters = filterableFields.filter(f => f.type === 'boolean');
  const switchControls: unknown[] = booleanFilters.map(f => ({
    type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', justify: 'space-between',
    children: [
      { type: 'typography', variant: 'body', content: f.name.charAt(0).toUpperCase() + f.name.slice(1) },
      { type: 'switch', checked: false },
    ],
  }));

  const header = {
    type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between', align: 'center',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'md', align: 'center', children: [
        { type: 'icon', name: headerIcon, size: 'lg' },
        { type: 'typography', content: pageTitle, variant: 'h2' },
      ] },
      { type: 'badge', label: 'All' },
    ],
  };

  const dataGrid = {
    type: 'data-grid', entity: entityName,
    emptyIcon: 'inbox',
    emptyTitle: `No ${pluralName.toLowerCase()} yet`,
    emptyDescription: `Add ${pluralName.toLowerCase()} to see them here.`,
    className: 'transition-shadow hover:shadow-md cursor-pointer',
    children: [{ type: 'stack', direction: 'vertical', gap: 'sm', children: [
      { type: 'typography', variant: 'h4', content: `@entity.${displayField}` },
      // show the filterable field value to confirm what was filtered
      ...(filterableFields[0]
        ? [{ type: 'typography', variant: 'caption', color: 'muted', content: `@entity.${filterableFields[0].name}` }]
        : []),
    ] }],
  };

  const browsingView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      header,
      { type: 'divider' },
      ...filterControls,
      ...(switchControls.length > 0 ? [{ type: 'divider' }, ...switchControls] : []),
      { type: 'divider' },
      dataGrid,
    ],
  };

  // Active filter indicator: shows what field and value are currently filtering
  const activeFilterIndicator = {
    type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
    children: [
      { type: 'icon', name: 'filter', size: 'sm' },
      { type: 'typography', variant: 'caption', color: 'muted', content: 'Filtered by' },
      { type: 'badge', label: '@entity.activeFilterField', variant: 'secondary' },
      { type: 'typography', variant: 'caption', content: '=' },
      { type: 'badge', label: '@entity.activeFilterValue', variant: 'primary' },
    ],
  };

  const filteredView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between', align: 'center',
        children: [
          { type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', children: [
            { type: 'icon', name: headerIcon, size: 'lg' },
            { type: 'typography', content: pageTitle, variant: 'h2' },
          ] },
          { type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', children: [
            { type: 'badge', label: 'Filtered', variant: 'primary' },
            { type: 'button', label: 'Clear All', event: 'CLEAR_FILTERS', variant: 'ghost', icon: 'x' },
          ] },
        ],
      },
      activeFilterIndicator,
      { type: 'divider' },
      ...filterControls,
      ...(switchControls.length > 0 ? [{ type: 'divider' }, ...switchControls] : []),
      { type: 'divider' },
      dataGrid,
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'browsing', isInitial: true },
        { name: 'filtered' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'FILTER', name: 'Filter', payload: [
          { name: 'field', type: 'string', required: true },
          { name: 'value', type: 'string', required: true },
        ] },
        { key: 'CLEAR_FILTERS', name: 'Clear Filters' },
      ],
      transitions: [
        { from: 'browsing', to: 'browsing', event: 'INIT', effects: [
          ['fetch', entityName],
          ['render-ui', 'main', browsingView],
        ] },
        { from: 'browsing', to: 'filtered', event: 'FILTER', effects: [
          ['set', '@entity.activeFilterField', '@payload.field'],
          ['set', '@entity.activeFilterValue', '@payload.value'],
          ['fetch', entityName, ['==', ['object/get', '@entity', '@payload.field'], '@payload.value']],
          ['render-ui', 'main', filteredView],
        ] },
        { from: 'filtered', to: 'filtered', event: 'FILTER', effects: [
          ['set', '@entity.activeFilterField', '@payload.field'],
          ['set', '@entity.activeFilterValue', '@payload.value'],
          ['fetch', entityName, ['==', ['object/get', '@entity', '@payload.field'], '@payload.value']],
          ['render-ui', 'main', filteredView],
        ] },
        { from: 'filtered', to: 'browsing', event: 'CLEAR_FILTERS', effects: [
          ['set', '@entity.activeFilterField', ''],
          ['set', '@entity.activeFilterValue', ''],
          ['fetch', entityName],
          ['render-ui', 'main', browsingView],
        ] },
      ],
    },
  } as Trait;
}

function buildPage(c: FilterConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdFilterEntity(params: StdFilterParams): Entity { return buildEntity(resolve(params)); }
export function stdFilterTrait(params: StdFilterParams): Trait { return buildTrait(resolve(params)); }
export function stdFilterPage(params: StdFilterParams): Page { return buildPage(resolve(params)); }

export function stdFilter(params: StdFilterParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
