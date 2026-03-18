/**
 * std-tabs
 *
 * Tab navigation atom. Uses the `tabs` pattern component
 * with clickable tab headers. Each tab shows different entity data.
 *
 * @level atom
 * @family tabs
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdTabsParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Tab definitions: each tab has a label and the fields it shows */
  tabItems?: Array<{ label: string; value: string }>;
  headerIcon?: string;
  pageTitle?: string;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface TabsConfig {
  entityName: string;
  fields: EntityField[];
  nonIdFields: EntityField[];
  tabItems: Array<{ label: string; value: string }>;
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

function resolve(params: StdTabsParams): TabsConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);
  const p = plural(entityName);

  const fields = baseFields;

  const nonIdFields = fields.filter(f => f.name !== 'id');

  // Default tabs: one per non-id field (excluding domain-only fields)
  const tabItems = params.tabItems ?? nonIdFields.filter(f => f.name !== 'activeTab').map(f => ({
    label: f.name.charAt(0).toUpperCase() + f.name.slice(1),
    value: f.name,
  }));

  return {
    entityName, fields, nonIdFields, tabItems,
    displayField: nonIdFields[0]?.name ?? 'id',
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Tabs`,
    pluralName: p,
    headerIcon: params.headerIcon ?? 'layout-grid',
    pageTitle: params.pageTitle ?? p,
    pageName: params.pageName ?? `${entityName}TabsPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: TabsConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: TabsConfig): Trait {
  const { entityName, displayField, pluralName, headerIcon, pageTitle, tabItems } = c;

  // Tab content with accordion for hierarchical data within each tab
  const tabContentChildren: unknown[] = [
    {
      type: 'data-grid', entity: entityName,
      emptyIcon: 'inbox',
      emptyTitle: `No ${pluralName.toLowerCase()} yet`,
      emptyDescription: `Add ${pluralName.toLowerCase()} to see them here.`,
      className: 'transition-shadow hover:shadow-md cursor-pointer',
      renderItem: ['fn', 'item', { type: 'stack', direction: 'vertical', gap: 'sm', children: [
        { type: 'typography', variant: 'h4', content: `@item.${displayField}` },
        { type: 'typography', variant: 'caption', color: 'muted', content: `@item.${tabItems[0]?.value ?? displayField}` },
      ] }],
    },
  ];

  // Note: accordion for tab content removed due to compiler limitation
  // (nested pattern config objects in props not compiled to JSX)

  const initView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', children: [
        { type: 'icon', name: headerIcon, size: 'lg' },
        { type: 'typography', content: pageTitle, variant: 'h2' },
      ] },
      { type: 'divider' },
      {
        type: 'tabs',
        tabs: tabItems,
        defaultActiveTab: tabItems[0]?.value ?? '',
        onTabChange: 'SELECT_TAB',
      },
      { type: 'divider' },
      ...tabContentChildren,
    ],
  };

  const tabSelectedView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', children: [
        { type: 'icon', name: headerIcon, size: 'lg' },
        { type: 'typography', content: pageTitle, variant: 'h2' },
      ] },
      { type: 'divider' },
      {
        type: 'tabs',
        tabs: tabItems,
        defaultActiveTab: tabItems[0]?.value ?? '',
        activeTab: '@payload.tab',
        onTabChange: 'SELECT_TAB',
      },
      { type: 'divider' },
      ...tabContentChildren,
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [{ name: 'idle', isInitial: true }],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'SELECT_TAB', name: 'Select Tab', payload: [
          { name: 'tab', type: 'string', required: true },
        ] },
      ],
      transitions: [
        { from: 'idle', to: 'idle', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', initView]] },
        { from: 'idle', to: 'idle', event: 'SELECT_TAB', effects: [['fetch', entityName], ['render-ui', 'main', tabSelectedView]] },
      ],
    },
  } as Trait;
}

function buildPage(c: TabsConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdTabsEntity(params: StdTabsParams): Entity { return buildEntity(resolve(params)); }
export function stdTabsTrait(params: StdTabsParams): Trait { return buildTrait(resolve(params)); }
export function stdTabsPage(params: StdTabsParams): Page { return buildPage(resolve(params)); }

export function stdTabs(params: StdTabsParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
