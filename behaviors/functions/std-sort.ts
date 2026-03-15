/**
 * std-sort
 *
 * Sort atom. Shows sort-by buttons for each sortable field.
 * Clicking a field name sorts by that field. Clicking again toggles direction.
 *
 * @level atom
 * @family sort
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdSortParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Fields available for sorting (defaults to all non-id fields) */
  sortFields?: string[];
  headerIcon?: string;
  pageTitle?: string;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface SortConfig {
  entityName: string;
  fields: EntityField[];
  sortableFields: string[];
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

function resolve(params: StdSortParams): SortConfig {
  const { entityName } = params;
  const allFields = ensureIdField(params.fields);
  const nonIdFields = allFields.filter(f => f.name !== 'id');
  const p = plural(entityName);

  return {
    entityName,
    fields: allFields,
    sortableFields: params.sortFields ?? nonIdFields.map(f => f.name),
    displayField: nonIdFields[0]?.name ?? 'id',
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Sort`,
    pluralName: p,
    headerIcon: params.headerIcon ?? 'arrow-up-down',
    pageTitle: params.pageTitle ?? p,
    pageName: params.pageName ?? `${entityName}SortPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: SortConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: SortConfig): Trait {
  const { entityName, sortableFields, displayField, pluralName, headerIcon, pageTitle } = c;

  // Sort toolbar: placed directly above the data list (not in the page header)
  const sortToolbar = {
    type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
    children: [
      { type: 'typography', variant: 'caption', color: 'muted', content: 'Sort by' },
      ...sortableFields.map(f => ({
        type: 'button',
        label: f.charAt(0).toUpperCase() + f.slice(1),
        event: 'SORT',
        // secondary in idle; molecules can override active to primary
        variant: 'secondary',
        icon: 'arrow-up-down',
      })),
    ],
  };

  // Sort toolbar for 'sorted' state: active field button uses primary + ChevronUp
  const activeSortToolbar = (activeField: string) => ({
    type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
    children: [
      { type: 'typography', variant: 'caption', color: 'muted', content: 'Sort by' },
      ...sortableFields.map(f => ({
        type: 'button',
        label: f.charAt(0).toUpperCase() + f.slice(1),
        event: 'SORT',
        // highlight the active sort field with primary + directional arrow
        variant: f === activeField ? 'primary' : 'secondary',
        icon: f === activeField ? 'chevron-up' : 'arrow-up-down',
      })),
    ],
  });

  const dataGrid = {
    type: 'data-grid', entity: entityName,
    emptyIcon: 'inbox',
    emptyTitle: `No ${pluralName.toLowerCase()} yet`,
    emptyDescription: `Add ${pluralName.toLowerCase()} to see them here.`,
    className: 'transition-shadow hover:shadow-md cursor-pointer',
    children: [{ type: 'stack', direction: 'vertical', gap: 'sm', children: [
      { type: 'typography', variant: 'h4', content: `@entity.${displayField}` },
      // Show the first sortable field as a secondary datum so sorting is visually meaningful
      ...(sortableFields[1]
        ? [{ type: 'typography', variant: 'caption', color: 'muted', content: `@entity.${sortableFields[1]}` }]
        : []),
    ] }],
  };

  const mainView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'space-between', align: 'center', children: [
        { type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: pageTitle, variant: 'h2' },
        ] },
      ] },
      { type: 'divider' },
      // Sort toolbar lives just above the data list
      sortToolbar,
      dataGrid,
    ],
  };

  // After sorting: show active sort with primary variant
  const sortedView = activeSortToolbar(sortableFields[0] ?? displayField);
  const mainSortedView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'space-between', align: 'center', children: [
        { type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: pageTitle, variant: 'h2' },
        ] },
        { type: 'button', label: 'Clear sort', event: 'INIT', variant: 'ghost', icon: 'x' },
      ] },
      { type: 'divider' },
      sortedView,
      dataGrid,
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [{ name: 'idle', isInitial: true }, { name: 'sorted' }],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'SORT', name: 'Sort' },
      ],
      transitions: [
        { from: 'idle', to: 'idle', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', mainView]] },
        { from: 'idle', to: 'sorted', event: 'SORT', effects: [['fetch', entityName], ['render-ui', 'main', mainSortedView]] },
        { from: 'sorted', to: 'sorted', event: 'SORT', effects: [['fetch', entityName], ['render-ui', 'main', mainSortedView]] },
        { from: 'sorted', to: 'idle', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', mainView]] },
      ],
    },
  } as Trait;
}

function buildPage(c: SortConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdSortEntity(params: StdSortParams): Entity { return buildEntity(resolve(params)); }
export function stdSortTrait(params: StdSortParams): Trait { return buildTrait(resolve(params)); }
export function stdSortPage(params: StdSortParams): Page { return buildPage(resolve(params)); }

export function stdSort(params: StdSortParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
