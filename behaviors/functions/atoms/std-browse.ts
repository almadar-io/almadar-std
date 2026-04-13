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
import { humanizeLabel } from '../utils.js';

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
function buildDisplayPattern(c: BrowseConfig, entityName: string, emptyTitle: string, emptyDescription: string, defaultColumns: unknown[], listItemChildren: unknown[]): unknown {
  const base: Record<string, unknown> = {
    type: c.displayPattern, entity: entityName,
    emptyIcon: 'inbox', emptyTitle, emptyDescription,
    ...(c.itemActions.length > 0 ? { itemActions: c.itemActions.map(a => ({ ...a, variant: a.variant ?? 'ghost', size: 'sm' })) } : {}),
  };

  if (c.displayColumns) {
    // Field-based rendering: DataGrid/DataList uses built-in card layout
    base.columns = c.displayColumns;
  } else if (c.customRenderItem) {
    // Custom renderItem template from organism
    base.renderItem = ['fn', 'item', c.customRenderItem];
  } else {
    // Use DataGrid built-in columns for proper badge colors, formatting, card styling
    base.columns = defaultColumns;
  }

  return { ...base, ...c.displayProps };
}

function buildEntity(c: BrowseConfig): Entity {
  const instances = [
    { id: 'bi-1', name: 'Terry Schultz', description: 'Senior product designer with 8 years of experience', status: 'active', createdAt: '2026-01-15' },
    { id: 'bi-2', name: 'Dale Franey', description: 'Full-stack developer specializing in React and Node.js', status: 'active', createdAt: '2026-01-18' },
    { id: 'bi-3', name: 'Lorena Mayer', description: 'Data analyst focused on business intelligence', status: 'pending', createdAt: '2026-01-20' },
    { id: 'bi-4', name: 'Andrea Paucek', description: 'Project manager with PMP certification', status: 'active', createdAt: '2026-02-01' },
    { id: 'bi-5', name: 'Geneva Durgan', description: 'UX researcher conducting user interviews', status: 'inactive', createdAt: '2026-02-05' },
    { id: 'bi-6', name: 'Samantha Okuneva', description: 'DevOps engineer managing cloud infrastructure', status: 'active', createdAt: '2026-02-10' },
    { id: 'bi-7', name: 'Nelson Halby', description: 'Technical writer documenting APIs', status: 'active', createdAt: '2026-02-15' },
    { id: 'bi-8', name: 'Tanya Hand', description: 'QA lead overseeing test automation', status: 'pending', createdAt: '2026-02-20' },
    { id: 'bi-9', name: 'Rosemary Lind', description: 'Marketing analyst tracking campaign performance', status: 'active', createdAt: '2026-03-01' },
    { id: 'bi-10', name: 'Bernadette Anderson', description: 'Security engineer conducting penetration tests', status: 'active', createdAt: '2026-03-05' },
  ];
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection, instances });
}

function buildTrait(c: BrowseConfig): Trait {
  const { entityName, listFields, headerIcon, pageTitle, emptyTitle, emptyDescription } = c;

  // Helper: detect date fields and add format
  const dateFormat = (fieldName: string): Record<string, string> => {
    const fieldDef = c.nonIdFields.find(f => f.name === fieldName);
    return (fieldDef?.type === 'date' || fieldDef?.type === 'datetime') ? { format: 'date' } : {};
  };

  // Default columns for DataGrid built-in card rendering (proper badge colors, formatting)
  const defaultColumns = [
    { name: listFields[0] ?? 'name', label: humanizeLabel(listFields[0] ?? 'name'), variant: 'h4', icon: headerIcon, ...dateFormat(listFields[0] ?? 'name') },
    ...(listFields.length > 1 ? [{
      name: listFields[1], label: humanizeLabel(listFields[1]),
      variant: 'badge' as const,
      colorMap: {
        active: 'success', completed: 'success', done: 'success',
        pending: 'warning', draft: 'warning', scheduled: 'warning',
        inactive: 'neutral', archived: 'neutral', disabled: 'neutral',
        error: 'destructive', cancelled: 'destructive', failed: 'destructive',
      },
      ...dateFormat(listFields[1]),
    }] : []),
    ...(listFields.length > 2 ? [{
      name: listFields[2], label: humanizeLabel(listFields[2]),
      variant: 'caption' as const,
      ...dateFormat(listFields[2]),
    }] : []),
  ];

  // Legacy renderItem for backward compatibility when customRenderItem is used
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

  // Collect all event keys from header + item actions. Refresh events are
  // NOT added to the events array — they are external events that flow in
  // via listens (Phase F.10), not local state-machine triggers.
  const actionEvents = new Set<string>();
  for (const a of c.headerActions) actionEvents.add(a.event);
  for (const a of c.itemActions) actionEvents.add(a.event);

  const events: unknown[] = [
    { key: 'INIT', name: 'Initialize' },
    ...Array.from(actionEvents).map(e => {
      const needsId = c.itemActions.some(a => a.event === e);
      return needsId
        ? { key: e, name: e, payload: [{ name: 'id', type: 'string', required: true }, { name: 'row', type: 'object' }] }
        : { key: e, name: e };
    }),
  ];

  // Phase F.10: refresh events become listens that trigger the existing
  // INIT transition (which re-fetches via `['ref', entityName]`). The atom
  // no longer adds refresh-specific transitions, so its topology stays
  // stable across customizations: always 1 transition (INIT). Molecules
  // that pass `refreshEvents: [...]` get their listens declared without
  // changing the transition graph.
  const listensDecl = c.refreshEvents.length > 0
    ? c.refreshEvents.map(evt => ({ event: evt, triggers: 'INIT' }))
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
            ['ref', entityName],
            ['render-ui', 'main', {
              type: 'stack', direction: 'vertical', gap: 'lg', className: 'max-w-5xl mx-auto w-full',
              children: [
                { type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between', align: 'center', children: headerChildren },
                { type: 'divider' },
                // Stats bar (dashboard-style summary above the list)
                ...(c.statsBar.length > 0 ? [{
                  type: 'simple-grid', columns: Math.min(c.statsBar.length, 4),
                  children: c.statsBar,
                }, { type: 'divider' }] : []),
                // Data display
                buildDisplayPattern(c, entityName, emptyTitle, emptyDescription, defaultColumns, listItemChildren),
                // Floating action button for quick create (only when no header button exists)
                ...(c.headerActions.length === 0 ? [{ type: 'floating-action-button', icon: 'plus', event: 'INIT', label: 'Create', tooltip: 'Create' }] : []),
              ],
            }],
          ],
        },
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

export function stdBrowse(params: StdBrowseParams): OrbitalSchema {
  const c = resolve(params);
  return makeSchema(`${c.entityName}Orbital`, makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]));
}
