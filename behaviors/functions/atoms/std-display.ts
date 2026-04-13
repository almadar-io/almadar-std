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
import { makeEntity, makePage, makeOrbital, makeSchema, ensureIdField, plural } from '@almadar/core/builders';

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

/** S-expression: get field from first entity in collection */
const ef = (field: string): unknown[] => ['object/get', ['array/first', '@entity'], field];

function buildTrait(c: DisplayConfig): Trait {
  const { entityName, displayFields, headerIcon, pageTitle, refreshButtonLabel, columns } = c;

  // Use stat-display molecule for numeric fields, card+typography for others
  const cardChildren = displayFields.map(f => {
    const field = c.nonIdFields.find(nf => nf.name === f);
    const isNumeric = field?.type === 'number';
    if (isNumeric) {
      return { type: 'stat-display', label: f.charAt(0).toUpperCase() + f.slice(1), value: ef(f) };
    }
    return {
      type: 'card',
      children: [{
        type: 'stack', direction: 'vertical', gap: 'sm',
        children: [
          { type: 'typography', variant: 'caption', content: f.charAt(0).toUpperCase() + f.slice(1) },
          { type: 'typography', variant: 'h3', content: ef(f) },
        ],
      }],
    };
  });

  const mainView = {
    type: 'scaled-diagram',
    children: [{
      type: 'stack', direction: 'vertical', gap: 'lg',
      children: [
        { type: 'breadcrumb', items: [{ label: 'Home', href: '/' }, { label: pageTitle }] },
        { type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between', children: [
          { type: 'stack', direction: 'horizontal', gap: 'md', children: [
            { type: 'icon', name: headerIcon, size: 'lg' },
            { type: 'typography', content: pageTitle, variant: 'h2' },
          ] },
          { type: 'button', label: refreshButtonLabel, event: 'REFRESH', variant: 'secondary', icon: 'refresh-cw' },
        ] },
        { type: 'divider' },
        { type: 'box', padding: 'md', children: [
          { type: 'simple-grid', columns, children: cardChildren },
        ] },
        { type: 'divider' },
        { type: 'grid', columns: 2, gap: 'md', children: [
          { type: 'card', children: [{ type: 'typography', variant: 'caption', content: 'Chart View' }] },
          { type: 'card', children: [{ type: 'typography', variant: 'caption', content: 'Graph View' }] },
        ] },
        { type: 'line-chart', data: [
          { date: 'Jan', value: 12 }, { date: 'Feb', value: 19 }, { date: 'Mar', value: 15 },
          { date: 'Apr', value: 25 }, { date: 'May', value: 22 }, { date: 'Jun', value: 30 },
        ], xKey: 'date', yKey: 'value', title: 'Trend' },
        { type: 'chart-legend', items: [{ label: 'Current', color: 'primary' }, { label: 'Previous', color: 'muted' }] },
        { type: 'graph-view', nodes: [
          { id: 'a', label: 'Start', x: 50, y: 100 },
          { id: 'b', label: 'Process', x: 200, y: 50 },
          { id: 'c', label: 'End', x: 350, y: 100 },
        ], edges: [
          { from: 'a', to: 'b' },
          { from: 'b', to: 'c' },
        ], width: 400, height: 200 },
      ],
    }],
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

export function stdDisplay(params: StdDisplayParams): OrbitalSchema {
  const c = resolve(params);
  return makeSchema(`${c.entityName}Orbital`, makeOrbital(
    `${c.entityName}Orbital`,
    makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection }),
    [buildTrait(c)],
    [makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial })],
  ));
}
