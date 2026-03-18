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
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: BrowseConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection });
}

function buildTrait(c: BrowseConfig): Trait {
  const { entityName, listFields, headerIcon, pageTitle, emptyTitle, emptyDescription } = c;

  // List item template — each card gets a hover lift and muted secondary field
  const listItemChildren: unknown[] = [
    {
      type: 'stack', direction: 'horizontal', justify: 'space-between', align: 'center',
      children: [
        {
          type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
          children: [
            { type: 'icon', name: headerIcon, size: 'sm' },
            { type: 'typography', variant: 'h4', content: `@item.${listFields[0] ?? 'id'}` },
          ],
        },
        ...(listFields.length > 1 ? [{ type: 'badge', label: `@item.${listFields[1]}` }] : []),
      ],
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
                {
                  type: 'data-grid', entity: entityName,
                  emptyIcon: 'inbox', emptyTitle, emptyDescription,
                  ...(c.itemActions.length > 0 ? { itemActions: c.itemActions } : {}),
                  // hover lift: cards rise on hover for interactive feel
                  className: 'transition-shadow hover:shadow-md cursor-pointer',
                  renderItem: ['fn', 'item', { type: 'stack', direction: 'vertical', gap: 'sm', children: listItemChildren }],
                },
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
