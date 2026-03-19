/**
 * std-browse
 *
 * Data grid browsing atom. Renders a list of entities with
 * configurable item actions. The browsing view that molecules
 * compose with modal/confirmation atoms.
 *
 * @level atom
 * @family browse
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdBrowseParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;

  // Trait naming
  traitName?: string;

  // Display
  listFields?: string[];
  headerIcon?: string;
  pageTitle?: string;
  emptyTitle?: string;
  emptyDescription?: string;

  // Actions (molecules inject these to emit events that other atoms listen for)
  headerActions?: Array<{ label: string; event: string; variant?: string; icon?: string }>;
  itemActions?: Array<{ label: string; event: string; variant?: string }>;

  // Refresh events: when these events fire (from other traits), re-fetch entity data
  refreshEvents?: string[];

  // Display customization (organisms override these for domain-specific layouts)
  /** Display pattern: 'data-grid' (default), 'entity-table', 'entity-cards', 'data-list' */
  displayPattern?: string;
  /** Custom renderItem template (overrides the auto-generated icon+title+badge template) */
  customRenderItem?: unknown;
  /** Field definitions for DataGrid/DataList built-in rendering (skips renderItem when provided) */
  displayColumns?: unknown[];
  /** Stats bar: array of stat-display patterns rendered above the list */
  statsBar?: unknown[];
  /** Extra props passed to the display pattern (e.g., variant, groupBy, cols) */
  displayProps?: Record<string, unknown>;

  // Page
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface BrowseConfig {
  entityName: string;
  fields: EntityField[];
  nonIdFields: EntityField[];
  listFields: string[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  traitName: string;
  headerIcon: string;
  pageTitle: string;
  emptyTitle: string;
  emptyDescription: string;
  headerActions: Array<{ label: string; event: string; variant?: string; icon?: string }>;
  itemActions: Array<{ label: string; event: string; variant?: string }>;
  refreshEvents: string[];
  displayPattern: string;
  customRenderItem: unknown | null;
  displayColumns: unknown[] | null;
  statsBar: unknown[];
  displayProps: Record<string, unknown>;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdBrowseParams): BrowseConfig {
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
    traitName: params.traitName ?? `${entityName}Browse`,
    headerIcon: params.headerIcon ?? 'list',
    pageTitle: params.pageTitle ?? p,
    emptyTitle: params.emptyTitle ?? `No ${p.toLowerCase()} yet`,
    emptyDescription: params.emptyDescription ?? `Create your first ${entityName.toLowerCase()} to get started.`,
    headerActions: params.headerActions ?? [],
    itemActions: params.itemActions ?? [],
    refreshEvents: params.refreshEvents ?? [],
    displayPattern: params.displayPattern ?? 'data-grid',
    customRenderItem: params.customRenderItem ?? null,
    displayColumns: params.displayColumns ?? null,
    statsBar: params.statsBar ?? [],
    displayProps: params.displayProps ?? {},
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

/**
 * Build the display pattern node for the browse view.
 * When displayColumns is provided, uses DataGrid/DataList built-in field rendering
 * (proper card styling, grid layout, format support). Otherwise uses renderItem.
 */
function buildDisplayPattern(c: BrowseConfig, entityName: string, emptyTitle: string, emptyDescription: string, listItemChildren: unknown[]): unknown {
  const base: Record<string, unknown> = {
    type: c.displayPattern, entity: entityName,
    emptyIcon: 'inbox', emptyTitle, emptyDescription,
    ...(c.itemActions.length > 0 ? { itemActions: c.itemActions } : {}),
  };

  if (c.displayColumns) {
    // Field-based rendering: DataGrid/DataList uses built-in card layout
    base.columns = c.displayColumns;
  } else if (c.customRenderItem) {
    // Custom renderItem template from organism
    base.renderItem = ['fn', 'item', c.customRenderItem];
  } else {
    // Default renderItem: icon+title+badge
    base.renderItem = ['fn', 'item', { type: 'stack', direction: 'vertical', gap: 'sm', children: listItemChildren }];
  }

  return { ...base, ...c.displayProps };
}

function buildEntity(c: BrowseConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection });
}

function buildTrait(c: BrowseConfig): Trait {
  const { entityName, listFields, headerIcon, pageTitle, emptyTitle, emptyDescription } = c;

  // List item template — avatar + title + badge + menu, wrapped in swipeable-row
  const itemContent: unknown = {
    type: 'stack', direction: 'horizontal', justify: 'space-between', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'avatar', name: `@item.${listFields[0] ?? 'id'}`, size: 'sm' },
          { type: 'typography', variant: 'h4', content: `@item.${listFields[0] ?? 'id'}` },
        ],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          ...(listFields.length > 1 ? [{ type: 'badge', label: `@item.${listFields[1]}` }] : []),
          { type: 'menu', items: [
            { label: 'View', event: 'VIEW', icon: 'eye' },
            { label: 'Edit', event: 'EDIT', icon: 'pencil' },
            { label: 'Delete', event: 'DELETE', icon: 'trash-2' },
          ] },
        ],
      },
    ],
  };

  const listItemChildren: unknown[] = [
    {
      type: 'swipeable-row',
      leftAction: { label: 'Edit', event: 'EDIT', variant: 'primary' },
      rightAction: { label: 'Delete', event: 'DELETE', variant: 'destructive' },
      children: [itemContent],
    },
  ];
  if (listFields.length > 2) {
    listItemChildren.push({
      type: 'typography', variant: 'caption', color: 'muted',
      content: `@item.${listFields[2]}`,
    });
  }

  // Header buttons — gap-2 between icon and title for breathing room
  const headerChildren: unknown[] = [
    {
      type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
      children: [
        { type: 'icon', name: headerIcon, size: 'lg' },
        { type: 'typography', content: pageTitle, variant: 'h2' },
      ],
    },
  ];
  if (c.headerActions.length > 0) {
    headerChildren.push({
      type: 'stack', direction: 'horizontal', gap: 'sm',
      children: c.headerActions.map(a => ({
        type: 'button', label: a.label, event: a.event, variant: a.variant ?? 'primary', ...(a.icon ? { icon: a.icon } : {}),
      })),
    });
  }

  // Collect all event keys from actions
  const actionEvents = new Set<string>();
  for (const a of c.headerActions) actionEvents.add(a.event);
  for (const a of c.itemActions) actionEvents.add(a.event);

  // Add refresh events to the set (they need event declarations too)
  for (const re of c.refreshEvents) actionEvents.add(re);

  const events: unknown[] = [
    { key: 'INIT', name: 'Initialize' },
    ...Array.from(actionEvents).map(e => {
      const needsId = c.itemActions.some(a => a.event === e);
      // Refresh events with 'data' payload (SAVE-like events)
      const isRefresh = c.refreshEvents.includes(e);
      if (isRefresh) {
        return { key: e, name: e, payload: [{ name: 'data', type: 'object', required: true }] };
      }
      return needsId
        ? { key: e, name: e, payload: [{ name: 'id', type: 'string', required: true }] }
        : { key: e, name: e };
    }),
  ];

  // Declare listens for refresh events (emitted by modal/confirmation atoms after persist)
  const listensDecl = c.refreshEvents.length > 0
    ? c.refreshEvents.map(evt => ({ event: evt, triggers: evt }))
    : undefined;

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    ...(listensDecl ? { listens: listensDecl } : {}),
    stateMachine: {
      states: [{ name: 'browsing', isInitial: true }],
      events,
      transitions: [
        {
          from: 'browsing', to: 'browsing', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', {
              type: 'stack', direction: 'vertical', gap: 'lg',
              children: [
                { type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between', children: headerChildren },
                { type: 'divider' },
                // Stats bar (dashboard-style summary above the list)
                ...(c.statsBar.length > 0 ? [{
                  type: 'simple-grid', columns: Math.min(c.statsBar.length, 4),
                  children: c.statsBar,
                }, { type: 'divider' }] : []),
                // Pull-to-refresh wrapper around data display
                {
                  type: 'pull-to-refresh', onRefresh: 'INIT',
                  children: [
                    buildDisplayPattern(c, entityName, emptyTitle, emptyDescription, listItemChildren),
                  ],
                },
                // Floating action button for quick create
                { type: 'floating-action-button', icon: 'plus', event: c.headerActions[0]?.event ?? 'INIT', label: 'Create' },
              ],
            }],
          ],
        },
        // Refresh self-loops: when modal atoms fire SAVE etc., re-fetch data
        ...c.refreshEvents.map(evt => ({
          from: 'browsing', to: 'browsing', event: evt,
          effects: [['fetch', entityName]],
        })),
      ],
    },
  } as Trait;
}

function buildPage(c: BrowseConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Build the browse entity.
 *
 * @param {StdBrowseParams} params - Browse configuration parameters
 * @returns {Entity} The configured browse entity
 */
export function stdBrowseEntity(params: StdBrowseParams): Entity { return buildEntity(resolve(params)); }
/**
 * Build the browse trait.
 *
 * @param {StdBrowseParams} params - Browse configuration parameters
 * @returns {Trait} The configured browse trait
 */
export function stdBrowseTrait(params: StdBrowseParams): Trait { return buildTrait(resolve(params)); }
/**
 * Build the browse page.
 *
 * @param {StdBrowseParams} params - Browse configuration parameters
 * @returns {Page} The configured browse page
 */
export function stdBrowsePage(params: StdBrowseParams): Page { return buildPage(resolve(params)); }

export function stdBrowse(params: StdBrowseParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
