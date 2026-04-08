/**
 * std-overworld
 *
 * Map/zone navigation behavior: exploring, transitioning, entered.
 * Pure function: params in, OrbitalDefinition out.
 *
 * @level molecule
 * @family navigation
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

export interface StdOverworldParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;

  // Display
  listFields?: string[];

  // Labels
  pageTitle?: string;
  worldTitle?: string;
  emptyTitle?: string;
  emptyDescription?: string;

  // Icons
  headerIcon?: string;

  // Page
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface OverworldConfig {
  entityName: string;
  fields: EntityField[];
  nonIdFields: EntityField[];
  listFields: string[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  traitName: string;
  pageTitle: string;
  worldTitle: string;
  emptyTitle: string;
  emptyDescription: string;
  headerIcon: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdOverworldParams): OverworldConfig {
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
    traitName: `${entityName}Navigation`,
    pageTitle: params.pageTitle ?? `${p} Map`,
    worldTitle: params.worldTitle ?? 'World Map',
    emptyTitle: params.emptyTitle ?? `No ${p.toLowerCase()} discovered`,
    emptyDescription: params.emptyDescription ?? `Explore to discover new ${p.toLowerCase()}.`,
    headerIcon: params.headerIcon ?? 'map',
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: OverworldConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection });
}

function buildTrait(c: OverworldConfig): Trait {
  const { entityName, listFields, headerIcon } = c;
  const { pageTitle, worldTitle, emptyTitle, emptyDescription } = c;

  // List item children for data-grid
  const listItemChildren: unknown[] = [
    {
      type: 'stack', direction: 'horizontal', justify: 'space-between', align: 'center',
      children: [
        {
          type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
          children: [
            { type: 'icon', name: 'map-pin', size: 'sm' },
            { type: 'typography', variant: 'h4', content: `@item.${listFields[0] ?? 'id'}` },
          ],
        },
        ...(listFields.length > 1 ? [{ type: 'badge', label: `@item.${listFields[1]}` }] : []),
      ],
    },
  ];
  if (listFields.length > 2) {
    listItemChildren.push({ type: 'typography', variant: 'caption', content: `@item.${listFields[2]}` });
  }

  // Exploring main view with map-view and status
  const exploringMainUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'md',
            children: [
              { type: 'icon', name: headerIcon, size: 'lg' },
              { type: 'typography', content: worldTitle, variant: 'h2' },
            ],
          },
          { type: 'status-dot', status: 'active', pulse: false, label: 'Exploring' },
        ],
      },
      { type: 'divider' },
      { type: 'map-view', markers: [], height: '200px', zoom: 10 },
      {
        type: 'data-grid', entity: entityName, emptyIcon: 'compass', emptyTitle, emptyDescription,
        itemActions: [{ label: 'Travel', event: 'TRAVEL' }],
        renderItem: ['fn', 'item', { type: 'stack', direction: 'vertical', gap: 'sm', children: listItemChildren }],
      },
    ],
  };

  // Transitioning view
  const transitioningMainUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md',
        children: [
          { type: 'icon', name: 'loader', size: 'lg' },
          { type: 'typography', content: 'Traveling...', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'typography', content: `Traveling to the destination ${pageTitle.toLowerCase()}.`, variant: 'body' },
    ],
  };

  // Entered zone view
  const enteredMainUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'md',
            children: [
              { type: 'icon', name: headerIcon, size: 'lg' },
              { type: 'typography', content: pageTitle, variant: 'h2' },
            ],
          },
          { type: 'status-dot', status: 'success', label: 'Entered' },
        ],
      },
      { type: 'divider' },
      {
        type: 'data-grid', entity: entityName, emptyIcon: 'inbox', emptyTitle: 'Nothing here', emptyDescription: 'This zone is empty.',
        renderItem: ['fn', 'item', { type: 'stack', direction: 'vertical', gap: 'sm', children: listItemChildren }],
      },
      { type: 'divider' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'end',
        children: [
          { type: 'button', label: 'Back to Map', event: 'BACK', variant: 'ghost', icon: 'arrow-left' },
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
        { name: 'exploring', isInitial: true },
        { name: 'transitioning' },
        { name: 'entered' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'TRAVEL', name: 'Travel', payload: [{ name: 'zoneId', type: 'string', required: true }] },
        { key: 'ARRIVE', name: 'Arrive' },
        { key: 'BACK', name: 'Back' },
      ],
      transitions: [
        // INIT: exploring -> exploring
        {
          from: 'exploring', to: 'exploring', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', exploringMainUI],
          ],
        },
        // TRAVEL: exploring -> transitioning
        {
          from: 'exploring', to: 'transitioning', event: 'TRAVEL',
          effects: [
            ['render-ui', 'main', transitioningMainUI],
          ],
        },
        // ARRIVE: transitioning -> entered
        {
          from: 'transitioning', to: 'entered', event: 'ARRIVE',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', enteredMainUI],
          ],
        },
        // BACK: entered -> exploring
        {
          from: 'entered', to: 'exploring', event: 'BACK',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', exploringMainUI],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: OverworldConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdOverworldEntity(params: StdOverworldParams): Entity {
  return buildEntity(resolve(params));
}

export function stdOverworldTrait(params: StdOverworldParams): Trait {
  return buildTrait(resolve(params));
}

export function stdOverworldPage(params: StdOverworldParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdOverworld(params: StdOverworldParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
