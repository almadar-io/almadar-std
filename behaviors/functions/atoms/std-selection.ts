/**
 * std-selection as a Function
 *
 * Selection behavior parameterized for any domain.
 * Provides item selection from a list with confirm/deselect controls.
 * Three states: idle, selecting, selected with transitions for the full lifecycle.
 *
 * @level atom
 * @family selection
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdSelectionParams {
  /** Entity name in PascalCase (e.g., "Item", "Option") */
  entityName: string;
  /** Entity fields (id is auto-added) */
  fields: EntityField[];
  /** Persistence mode */
  persistence?: 'persistent' | 'runtime' | 'singleton';

  // Display
  /** Header icon (Lucide name) */
  headerIcon?: string;
  /** Page title (defaults to plural entity name) */
  pageTitle?: string;

  // Page
  /** Page name (defaults to "{Entity}SelectionPage") */
  pageName?: string;
  /** Route path (defaults to "/{entities}/selection") */
  pagePath?: string;
  /** Whether this is the initial/home page */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface SelectionConfig {
  entityName: string;
  fields: EntityField[];
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

function resolve(params: StdSelectionParams): SelectionConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  const fields = baseFields;
  const nonIdFields = baseFields.filter(f => f.name !== 'id');
  const p = plural(entityName);

  return {
    entityName,
    fields,
    displayField: nonIdFields[0]?.name ?? 'id',
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Selection`,
    pluralName: p,
    headerIcon: params.headerIcon ?? 'check-square',
    pageTitle: params.pageTitle ?? p,
    pageName: params.pageName ?? `${entityName}SelectionPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/selection`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: SelectionConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: SelectionConfig): Trait {
  const { entityName, displayField, pluralName, headerIcon, pageTitle } = c;

  const idleView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: pageTitle, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'typography', variant: 'caption', color: 'muted',
        content: `Choose a ${entityName.toLowerCase()} to continue.` },
      {
        type: 'data-grid', entity: entityName,
        emptyIcon: 'inbox',
        emptyTitle: `No ${pluralName.toLowerCase()} yet`,
        emptyDescription: `Add ${pluralName.toLowerCase()} to see them here.`,
        className: 'transition-shadow hover:shadow-md cursor-pointer',
        itemActions: [{ label: 'Select', event: 'SELECT', icon: 'check' }],
        renderItem: ['fn', 'item', {
          type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
          children: [
            { type: 'checkbox', label: `@item.${displayField}` },
          ],
        }],
      },
    ],
  };

  const selectingView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between', align: 'center',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
            children: [
              { type: 'icon', name: headerIcon, size: 'lg' },
              { type: 'typography', content: pageTitle, variant: 'h2' },
            ],
          },
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
            children: [
              { type: 'badge', label: 'Selecting' },
              { type: 'button', label: 'Clear', event: 'CLEAR', variant: 'ghost', icon: 'x' },
            ],
          },
        ],
      },
      { type: 'divider' },
      {
        type: 'alert', variant: 'info',
        message: ['concat', 'Selected: ', '@payload.id'],
      },
      {
        type: 'data-grid', entity: entityName,
        emptyIcon: 'inbox',
        emptyTitle: `No ${pluralName.toLowerCase()} yet`,
        emptyDescription: `Add ${pluralName.toLowerCase()} to see them here.`,
        itemActions: [{ label: 'Select', event: 'SELECT', icon: 'check' }],
        renderItem: ['fn', 'item', {
          type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
          children: [
            { type: 'checkbox', label: `@item.${displayField}`, checked: ['==', '@item.id', '@payload.id'] },
          ],
        }],
      },
      { type: 'divider' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'Confirm', event: 'CONFIRM_SELECTION', actionPayload: { id: '@payload.id' }, variant: 'primary', icon: 'check' },
          { type: 'button', label: 'Deselect', event: 'DESELECT', variant: 'ghost', icon: 'x' },
        ],
      },
    ],
  };

  const selectedView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between', align: 'center',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
            children: [
              { type: 'icon', name: 'check-circle', size: 'lg' },
              { type: 'typography', content: 'Selection Confirmed', variant: 'h2' },
            ],
          },
          { type: 'badge', label: 'Confirmed' },
        ],
      },
      { type: 'divider' },
      {
        type: 'alert', variant: 'success',
        message: 'Selection confirmed successfully.',
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'typography', variant: 'caption', content: 'Selected ID:' },
          { type: 'typography', variant: 'body', content: '@payload.id' },
        ],
      },
      { type: 'button', label: 'Clear Selection', event: 'CLEAR', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'selecting' },
        { name: 'selected' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'SELECT', name: 'Select', payload: [
          { name: 'id', type: 'string', required: true },
        ] },
        { key: 'DESELECT', name: 'Deselect' },
        { key: 'CLEAR', name: 'Clear' },
        { key: 'CONFIRM_SELECTION', name: 'Confirm Selection', payload: [
          { name: 'id', type: 'string', required: true },
        ] },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', idleView],
          ],
        },
        {
          from: 'idle', to: 'selecting', event: 'SELECT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', selectingView],
          ],
        },
        {
          from: 'selecting', to: 'selecting', event: 'SELECT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', selectingView],
          ],
        },
        {
          from: 'selecting', to: 'idle', event: 'DESELECT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', idleView],
          ],
        },
        {
          from: 'selecting', to: 'idle', event: 'CLEAR',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', idleView],
          ],
        },
        {
          from: 'selecting', to: 'selected', event: 'CONFIRM_SELECTION',
          effects: [
            ['render-ui', 'main', selectedView],
          ],
        },
        {
          from: 'selected', to: 'idle', event: 'CLEAR',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', idleView],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: SelectionConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdSelectionEntity(params: StdSelectionParams): Entity {
  return buildEntity(resolve(params));
}

export function stdSelectionTrait(params: StdSelectionParams): Trait {
  return buildTrait(resolve(params));
}

export function stdSelectionPage(params: StdSelectionParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdSelection(params: StdSelectionParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
