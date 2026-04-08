/**
 * std-sort
 *
 * Sort atom. Shows sort-by buttons for each sortable field.
 * Clicking a field name sorts by that field. Clicking again toggles direction.
 *
 * @level atom
 * @family sort
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

  // Sort toolbar: each button carries its field name + direction in actionPayload
  const sortToolbar = {
    type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
    children: [
      { type: 'typography', variant: 'caption', color: 'muted', content: 'Sort by' },
      ...sortableFields.map(f => ({
        type: 'button',
        label: f.charAt(0).toUpperCase() + f.slice(1),
        event: 'SORT',
        actionPayload: { field: f, direction: 'asc' },
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
        actionPayload: { field: f, direction: f === activeField ? 'desc' : 'asc' },
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
    columns: [
      { name: displayField, label: displayField.charAt(0).toUpperCase() + displayField.slice(1), variant: 'h4' },
      ...(sortableFields[1] ? [{ name: sortableFields[1], label: sortableFields[1].charAt(0).toUpperCase() + sortableFields[1].slice(1), variant: 'caption' }] : []),
      ...(c.fields.some(f => f.name === 'status') ? [{ name: 'status', label: 'Status', variant: 'badge' }] : []),
    ],
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
      sortToolbar,
      dataGrid,
    ],
  };

  // After sorting: show active sort with primary variant + sortable-list for manual reorder
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
      { type: 'sortable-list', entity: entityName, onReorder: 'SORT', renderItem: ['fn', 'item', {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'icon', name: 'grip-vertical', size: 'sm' },
          { type: 'typography', variant: 'body', content: `@item.${displayField}` },
        ],
      }] },
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
        { key: 'SORT', name: 'Sort', payload: [
          { name: 'field', type: 'string', required: true },
          { name: 'direction', type: 'string' },
        ] },
      ],
      transitions: [
        { from: 'idle', to: 'idle', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', mainView]] },
        { from: 'idle', to: 'sorted', event: 'SORT', effects: [
          ['fetch', entityName, null, ['concat', '@payload.field', ':', '@payload.direction']],
          ['render-ui', 'main', mainSortedView],
        ] },
        { from: 'sorted', to: 'sorted', event: 'SORT', effects: [
          ['fetch', entityName, null, ['concat', '@payload.field', ':', '@payload.direction']],
          ['render-ui', 'main', mainSortedView],
        ] },
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
