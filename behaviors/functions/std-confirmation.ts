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
    headerIcon: params.headerIcon ?? 'alert-triangle',
    requestEvent: params.requestEvent ?? 'REQUEST',
    confirmEvent: params.confirmEvent ?? 'CONFIRM',
    confirmEffects: params.confirmEffects ?? [],
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
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: ConfirmationConfig): Trait {
  const { entityName, displayField, pluralName, confirmTitle, confirmMessage, confirmLabel, cancelLabel, headerIcon } = c;

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'confirming' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: c.requestEvent, name: 'Request Confirmation', payload: [{ name: 'id', type: 'string', required: true }] },
        { key: c.confirmEvent, name: 'Confirm', payload: [{ name: 'id', type: 'string', required: true }] },
        { key: 'CANCEL', name: 'Cancel' },
        { key: 'CLOSE', name: 'Close' },
      ],
      transitions: [
        // INIT: idle -> idle
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: c.standalone
            ? [['fetch', entityName], ['render-ui', 'main', {
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
                    children: [{ type: 'stack', direction: 'vertical', gap: 'sm', children: [
                      { type: 'typography', variant: 'h4', content: `@entity.${displayField}` },
                    ] }],
                  },
                ],
              }]]
            : [['fetch', entityName]],
        },
        // REQUEST: idle -> confirming
        {
          from: 'idle', to: 'confirming', event: c.requestEvent,
          effects: [
            ['render-ui', 'modal', {
              type: 'stack', direction: 'vertical', gap: 'md',
              children: [
                {
                  type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
                  children: [
                    { type: 'icon', name: headerIcon, size: 'md' },
                    { type: 'typography', content: confirmTitle, variant: 'h3' },
                  ],
                },
                { type: 'divider' },
                { type: 'typography', content: confirmMessage, variant: 'body' },
                {
                  type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'end',
                  children: [
                    { type: 'button', label: cancelLabel, event: 'CANCEL', variant: 'ghost' },
                    { type: 'button', label: confirmLabel, event: c.confirmEvent, variant: 'danger', icon: 'check' },
                  ],
                },
              ],
            }],
          ],
        },
        // CONFIRM: confirming -> idle (run injected effects, dismiss modal)
        {
          from: 'confirming', to: 'idle', event: c.confirmEvent,
          effects: [
            ...c.confirmEffects,
            ['render-ui', 'modal', null],
          ],
        },
        // CANCEL: confirming -> idle (dismiss modal)
        {
          from: 'confirming', to: 'idle', event: 'CANCEL',
          effects: [
            ['render-ui', 'modal', null],
          ],
        },
        // CLOSE: confirming -> idle (dismiss modal)
        {
          from: 'confirming', to: 'idle', event: 'CLOSE',
          effects: [
            ['render-ui', 'modal', null],
          ],
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
