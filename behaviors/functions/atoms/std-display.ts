/**
 * std-display
 *
 * Read-only display molecule with loading/refresh.
 * Single trait (display is self-contained, no modal atoms needed).
 * Used for dashboards, stats panels, KPIs.
 *
 * @level molecule
 * @family display
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdDisplayParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  displayFields?: string[];
  pageTitle?: string;
  refreshButtonLabel?: string;
  headerIcon?: string;
  columns?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface DisplayConfig {
  entityName: string;
  fields: EntityField[];
  nonIdFields: EntityField[];
  displayFields: string[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  traitName: string;
  pageTitle: string;
  refreshButtonLabel: string;
  headerIcon: string;
  columns: number;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdDisplayParams): DisplayConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const nonIdFields = fields.filter(f => f.name !== 'id');
  const p = plural(entityName);

  return {
    entityName, fields, nonIdFields,
    displayFields: params.displayFields ?? nonIdFields.map(f => f.name),
    persistence: params.persistence ?? 'runtime',
    collection: params.collection,
    traitName: `${entityName}Display`,
    pageTitle: params.pageTitle ?? p,
    refreshButtonLabel: params.refreshButtonLabel ?? 'Refresh',
    headerIcon: params.headerIcon ?? 'bar-chart-2',
    columns: params.columns ?? 3,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Trait builder
// ============================================================================

function buildTrait(c: DisplayConfig): Trait {
  const { entityName, displayFields, headerIcon, pageTitle, refreshButtonLabel, columns } = c;

  // Use stat-display molecule for numeric fields, card+typography for others
  const cardChildren = displayFields.map(f => {
    const field = c.nonIdFields.find(nf => nf.name === f);
    const isNumeric = field?.type === 'number';
    if (isNumeric) {
      return { type: 'stat-display', label: f.charAt(0).toUpperCase() + f.slice(1), value: `@entity.${f}` };
    }
    return {
      type: 'card',
      children: [{
        type: 'stack', direction: 'vertical', gap: 'sm',
        children: [
          { type: 'typography', variant: 'caption', content: f.charAt(0).toUpperCase() + f.slice(1) },
          { type: 'typography', variant: 'h3', content: `@entity.${f}` },
        ],
      }],
    };
  });

  const mainView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between', children: [
        { type: 'stack', direction: 'horizontal', gap: 'md', children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: pageTitle, variant: 'h2' },
        ] },
        { type: 'button', label: refreshButtonLabel, event: 'REFRESH', variant: 'secondary', icon: 'refresh-cw' },
      ] },
      { type: 'divider' },
      { type: 'simple-grid', columns, children: cardChildren },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'loading', isInitial: true },
        { name: 'displaying' },
        { name: 'refreshing' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'LOADED', name: 'Loaded' },
        { key: 'REFRESH', name: 'Refresh' },
        { key: 'REFRESHED', name: 'Refreshed' },
      ],
      transitions: [
        { from: 'loading', to: 'displaying', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', mainView]] },
        { from: 'loading', to: 'displaying', event: 'LOADED', effects: [['fetch', entityName], ['render-ui', 'main', mainView]] },
        { from: 'displaying', to: 'displaying', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', mainView]] },
        { from: 'displaying', to: 'refreshing', event: 'REFRESH', effects: [['fetch', entityName], ['render-ui', 'main', mainView]] },
        { from: 'refreshing', to: 'displaying', event: 'REFRESHED', effects: [['fetch', entityName], ['render-ui', 'main', mainView]] },
      ],
    },
  } as Trait;
}

// ============================================================================
// Projections
// ============================================================================

export function stdDisplayEntity(params: StdDisplayParams): Entity {
  const c = resolve(params);
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection });
}

/**
 * Build the display trait.
 *
 * @param {StdDisplayParams} params - Display configuration parameters
 * @returns {Trait} The configured display trait
 */
export function stdDisplayTrait(params: StdDisplayParams): Trait { return buildTrait(resolve(params)); }

export function stdDisplayPage(params: StdDisplayParams): Page {
  const c = resolve(params);
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdDisplay(params: StdDisplayParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection }),
    [buildTrait(c)],
    [makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial })],
  );
}
