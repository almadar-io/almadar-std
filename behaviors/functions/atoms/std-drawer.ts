/**
 * std-drawer as a Function
 *
 * Drawer behavior parameterized for any domain.
 * Provides a slide-out drawer that displays entity detail.
 * Two states: closed and open, with transitions to toggle visibility.
 * Similar to std-modal but renders to a "drawer" slot concept.
 *
 * @level atom
 * @family drawer
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

export interface StdDrawerParams {
  /** Entity name in PascalCase (e.g., "Panel", "Sidebar") */
  entityName: string;
  /** Entity fields (id is auto-added) */
  fields: EntityField[];
  /** Persistence mode */
  persistence?: 'persistent' | 'runtime' | 'singleton';

  // Display
  /** Drawer title (defaults to "Details") */
  drawerTitle?: string;
  /** Header icon (Lucide name) */
  headerIcon?: string;

  // Standalone mode
  /** When true (default), renders main view with Open button. When false, only renders to drawer slot. */
  standalone?: boolean;

  // Page
  /** Page name (defaults to "{Entity}DrawerPage") */
  pageName?: string;
  /** Route path (defaults to "/{entities}/drawer") */
  pagePath?: string;
  /** Whether this is the initial/home page */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface DrawerConfig {
  entityName: string;
  fields: EntityField[];
  nonIdFields: EntityField[];
  displayField: string;
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  drawerTitle: string;
  headerIcon: string;
  standalone: boolean;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdDrawerParams): DrawerConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const nonIdFields = fields.filter(f => f.name !== 'id');
  const p = plural(entityName);

  return {
    entityName,
    fields,
    nonIdFields,
    displayField: nonIdFields[0]?.name ?? 'id',
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Drawer`,
    pluralName: p,
    drawerTitle: params.drawerTitle ?? 'Details',
    headerIcon: params.headerIcon ?? 'panel-right',
    standalone: params.standalone ?? true,
    pageName: params.pageName ?? `${entityName}DrawerPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/drawer`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: DrawerConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

/** S-expression: get field from first entity in collection */
const ef = (field: string): unknown[] => ['object/get', ['array/first', '@entity'], field];

function buildTrait(c: DrawerConfig): Trait {
  const { entityName, nonIdFields, displayField, pluralName, drawerTitle, headerIcon } = c;

  const closedView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between', align: 'center',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
            children: [
              { type: 'icon', name: headerIcon, size: 'lg' },
              { type: 'typography', content: drawerTitle, variant: 'h2' },
            ],
          },
          { type: 'button', label: 'Open', event: 'OPEN', variant: 'primary', icon: headerIcon },
        ],
      },
      { type: 'divider' },
      {
        type: 'data-grid', entity: entityName,
        emptyIcon: 'inbox',
        emptyTitle: `No ${pluralName.toLowerCase()} yet`,
        emptyDescription: `Add ${pluralName.toLowerCase()} to see them here.`,
        renderItem: ['fn', 'item', {
          type: 'stack', direction: 'vertical', gap: 'sm',
          children: [
            { type: 'typography', variant: 'h4', content: `@item.${displayField}` },
          ],
        }],
      },
    ],
  };

  // Side-panel alternative view
  const sidePanelView = {
    type: 'side-panel',
    title: drawerTitle,
    isOpen: true,
    position: 'right',
    children: [
      {
        type: 'stack', direction: 'vertical', gap: 'md',
        children: nonIdFields.map(field => ({
          type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between',
          children: [
            { type: 'typography', variant: 'caption', content: field.name.charAt(0).toUpperCase() + field.name.slice(1) },
            { type: 'typography', variant: 'body', content: ef(field.name) },
          ],
        })),
      },
    ],
  };

  // Drawer with field details and close button
  const openView = {
    type: 'drawer',
    title: drawerTitle,
    isOpen: true,
    children: [
      {
        type: 'stack', direction: 'vertical', gap: 'md',
        children: [
          ...nonIdFields.map(field => ({
            type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between',
            children: [
              { type: 'typography', variant: 'caption', content: field.name.charAt(0).toUpperCase() + field.name.slice(1) },
              { type: 'typography', variant: 'body', content: ef(field.name) },
            ],
          })),
          { type: 'divider' },
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'end',
            children: [
              { type: 'button', label: 'Close', event: 'CLOSE', variant: 'ghost' },
            ],
          },
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
        { name: 'closed', isInitial: true },
        { name: 'open' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'OPEN', name: 'Open' },
        { key: 'CLOSE', name: 'Close' },
      ],
      transitions: [
        {
          from: 'closed', to: 'closed', event: 'INIT',
          effects: c.standalone
            ? [['fetch', entityName], ['render-ui', 'main', closedView]]
            : [['fetch', entityName]],
        },
        {
          from: 'closed', to: 'open', event: 'OPEN',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'drawer', {
              type: 'stack', direction: 'vertical', gap: 'none',
              children: [openView, sidePanelView],
            }],
          ],
        },
        {
          from: 'open', to: 'closed', event: 'CLOSE',
          effects: c.standalone
            ? [['render-ui', 'drawer', null], ['fetch', entityName], ['render-ui', 'main', closedView]]
            : [['render-ui', 'drawer', null], ['fetch', entityName]],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: DrawerConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdDrawerEntity(params: StdDrawerParams): Entity {
  return buildEntity(resolve(params));
}

export function stdDrawerTrait(params: StdDrawerParams): Trait {
  return buildTrait(resolve(params));
}

export function stdDrawerPage(params: StdDrawerParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdDrawer(params: StdDrawerParams): OrbitalSchema {
  const c = resolve(params);
  return makeSchema(`${c.entityName}Orbital`, makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  ));
}
