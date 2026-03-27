/**
 * std-confirmation as a Function
 *
 * Confirmation dialog behavior parameterized for any domain.
 * Provides a two-step confirm/cancel flow before performing destructive actions.
 * The caller handles the actual action via emits/listens.
 * The state machine structure is fixed. The caller controls data and presentation.
 *
 * @level atom
 * @family confirmation
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdConfirmationParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';

  // Trait naming (molecules override this)
  traitName?: string;

  // Display
  confirmTitle?: string;
  confirmMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  headerIcon?: string;

  // Event/Effect injection
  /** Event key that opens the confirmation (default: 'REQUEST') */
  requestEvent?: string;
  /** Event key for confirm action (default: 'CONFIRM') */
  confirmEvent?: string;
  /** Additional effects to run on confirm (e.g., persist delete) */
  confirmEffects?: unknown[];
  /** Event to emit after confirm succeeds. Browse traits listen for this. */
  emitOnConfirm?: string;
  /** When false, INIT renders nothing to main (used inside molecules). Default true. */
  standalone?: boolean;

  // Page
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface ConfirmationConfig {
  entityName: string;
  fields: EntityField[];
  displayField: string;
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  confirmTitle: string;
  confirmMessage: string;
  confirmLabel: string;
  cancelLabel: string;
  headerIcon: string;
  requestEvent: string;
  confirmEvent: string;
  confirmEffects: unknown[];
  emitOnConfirm: string | null;
  standalone: boolean;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdConfirmationParams): ConfirmationConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const nonIdFields = fields.filter(f => f.name !== 'id');
  const p = plural(entityName);

  return {
    entityName,
    fields,
    displayField: nonIdFields[0]?.name ?? 'id',
    persistence: params.persistence ?? 'runtime',
    traitName: params.traitName ?? `${entityName}Confirmation`,
    pluralName: p,
    confirmTitle: params.confirmTitle ?? 'Confirm Action',
    confirmMessage: params.confirmMessage ?? 'Are you sure?',
    confirmLabel: params.confirmLabel ?? 'Confirm',
    cancelLabel: params.cancelLabel ?? 'Cancel',
    headerIcon: params.headerIcon ?? 'shield-check',
    requestEvent: params.requestEvent ?? 'REQUEST',
    confirmEvent: params.confirmEvent ?? 'CONFIRM',
    confirmEffects: params.confirmEffects ?? [],
    emitOnConfirm: params.emitOnConfirm ?? null,
    standalone: params.standalone ?? true,
    pageName: params.pageName ?? `${entityName}ConfirmPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/confirm`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: ConfirmationConfig): Entity {
  // Add pendingId field to store the entity ID across REQUEST → CONFIRM flow
  const fields = [
    ...c.fields.filter(f => f.name !== 'pendingId'),
    { name: 'pendingId', type: 'string' as const, default: '' },
  ];
  return makeEntity({ name: c.entityName, fields, persistence: c.persistence });
}

function buildTrait(c: ConfirmationConfig): Trait {
  const { entityName, displayField, pluralName, confirmTitle, confirmMessage, confirmLabel, cancelLabel, headerIcon } = c;

  const idleMainView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'md', align: 'center', children: [
        { type: 'icon', name: headerIcon, size: 'lg' },
        { type: 'typography', content: pluralName, variant: 'h2' },
      ] },
      { type: 'divider' },
      {
        type: 'data-grid', entity: entityName,
        emptyIcon: 'inbox',
        emptyTitle: `No ${pluralName.toLowerCase()} yet`,
        emptyDescription: 'Items will appear here.',
        itemActions: [{ label: confirmTitle, event: c.requestEvent, variant: 'danger' }],
        renderItem: ['fn', 'item', { type: 'stack', direction: 'vertical', gap: 'sm', children: [
          { type: 'typography', variant: 'h4', content: `@item.${displayField}` },
        ] }],
      },
    ],
  };

  const confirmModalView = {
    type: 'stack', direction: 'vertical', gap: 'md',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'alert-triangle', size: 'md' },
          { type: 'typography', content: confirmTitle, variant: 'h3' },
        ],
      },
      { type: 'divider' },
      {
        type: 'alert',
        variant: 'danger',
        message: confirmMessage,
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'end',
        children: [
          { type: 'button', label: cancelLabel, event: 'CANCEL', variant: 'ghost' },
          { type: 'button', label: confirmLabel, event: c.confirmEvent, variant: 'danger', icon: 'check' },
        ],
      },
    ],
  };

  // Effects to dismiss modal and refresh main view
  const dismissAndRefresh: unknown[] = [
    ['render-ui', 'modal', null],
    ...(c.standalone ? [['ref', entityName], ['render-ui', 'main', idleMainView]] : [['ref', entityName]]),
  ];

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    ...(c.emitOnConfirm ? { emits: [{ event: c.emitOnConfirm }] } : {}),
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'confirming' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: c.requestEvent, name: 'Request Confirmation', payload: [{ name: 'id', type: 'string', required: true }] },
        { key: c.confirmEvent, name: 'Confirm' },
        { key: 'CANCEL', name: 'Cancel' },
        { key: 'CLOSE', name: 'Close' },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: c.standalone
            ? [['ref', entityName], ['render-ui', 'main', idleMainView]]
            : [['ref', entityName]],
        },
        {
          from: 'idle', to: 'confirming', event: c.requestEvent,
          effects: [
            ['set', '@entity.pendingId', '@payload.id'],
            ['fetch', entityName, '@payload.id'],
            ['render-ui', 'modal', confirmModalView],
          ],
        },
        {
          from: 'confirming', to: 'idle', event: c.confirmEvent,
          effects: [
            ...c.confirmEffects,
            ...dismissAndRefresh,
            ...(c.emitOnConfirm ? [['emit', c.emitOnConfirm]] : []),
          ],
        },
        {
          from: 'confirming', to: 'idle', event: 'CANCEL',
          effects: dismissAndRefresh,
        },
        {
          from: 'confirming', to: 'idle', event: 'CLOSE',
          effects: dismissAndRefresh,
        },
      ],
    },
  } as Trait;
}

function buildPage(c: ConfirmationConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdConfirmationEntity(params: StdConfirmationParams): Entity {
  return buildEntity(resolve(params));
}

export function stdConfirmationTrait(params: StdConfirmationParams): Trait {
  return buildTrait(resolve(params));
}

export function stdConfirmationPage(params: StdConfirmationParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdConfirmation(params: StdConfirmationParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
