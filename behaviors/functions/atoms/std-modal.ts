/**
 * std-modal
 *
 * Modal overlay atom. Accepts content injection so molecules
 * can control what renders inside the open state.
 *
 * @level atom
 * @family modal
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';
import { humanizeLabel, SYSTEM_FIELDS } from '../utils.js';

// ============================================================================
// Params
// ============================================================================

export interface StdModalParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';

  // Trait naming (molecules override this to avoid collisions)
  traitName?: string;

  // Content
  modalTitle?: string;
  headerIcon?: string;
  /** Render-ui tree for the open state. Defaults to entity field detail view. */
  openContent?: unknown;

  // Event/Effect injection (molecules wire through these)
  /** Event key that opens the modal (default: 'OPEN') */
  openEvent?: string;
  /** Payload schema for the open event (e.g., [{ name: 'id', type: 'string', required: true }]) */
  openPayload?: Array<{ name: string; type: string; required?: boolean }>;
  /** Event key that closes the modal (default: 'CLOSE') */
  closeEvent?: string;
  /** Additional effects to run before render on open (e.g., fetch) */
  openEffects?: unknown[];
  /** If provided, adds a save transition: open → closed with these effects */
  saveEvent?: string;
  saveEffects?: unknown[];
  /** Event to emit after save succeeds. Browse traits listen for this instead of raw SAVE. */
  emitOnSave?: string;
  /** When false, INIT renders nothing to main (used inside molecules). Default true. */
  standalone?: boolean;

  // Page (standalone use)
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface ModalConfig {
  entityName: string;
  fields: EntityField[];
  nonIdFields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  modalTitle: string;
  headerIcon: string;
  openContent: unknown;
  openEvent: string;
  openPayload: Array<{ name: string; type: string; required?: boolean }>;
  closeEvent: string;
  openEffects: unknown[];
  saveEvent: string | null;
  saveEffects: unknown[];
  emitOnSave: string | null;
  standalone: boolean;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdModalParams): ModalConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const nonIdFields = fields.filter(f => f.name !== 'id');
  const p = plural(entityName);

  // Default open content: modal molecule wrapping field detail view
  const displayFields = nonIdFields.filter(f => !SYSTEM_FIELDS.has(f.name));
  const defaultContent = {
    type: 'modal',
    title: params.modalTitle ?? 'Details',
    isOpen: true,
    children: [
      {
        type: 'stack', direction: 'vertical', gap: 'md',
        children: [
          ...displayFields.map(f => ({
            type: 'stack', direction: 'horizontal', gap: 'md',
            children: [
              { type: 'typography', variant: 'caption', content: humanizeLabel(f.name) },
              { type: 'typography', variant: 'body', content: ['object/get', ['array/first', '@entity'], f.name] },
            ],
          })),
          { type: 'divider' },
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'end',
            children: [{ type: 'button', label: 'Close', event: params.closeEvent ?? 'CLOSE', variant: 'ghost' }],
          },
        ],
      },
    ],
  };

  return {
    entityName,
    fields,
    nonIdFields,
    persistence: params.persistence ?? 'runtime',
    traitName: params.traitName ?? `${entityName}Modal`,
    modalTitle: params.modalTitle ?? 'Details',
    headerIcon: params.headerIcon ?? 'layout-panel-top',
    openContent: params.openContent ?? defaultContent,
    openEvent: params.openEvent ?? 'OPEN',
    openPayload: params.openPayload ?? [],
    closeEvent: params.closeEvent ?? 'CLOSE',
    openEffects: params.openEffects ?? [],
    saveEvent: params.saveEvent ?? null,
    saveEffects: params.saveEffects ?? [],
    emitOnSave: params.emitOnSave ?? null,
    standalone: params.standalone ?? true,
    pageName: params.pageName ?? `${entityName}ModalPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/modal`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: ModalConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: ModalConfig): Trait {
  const events: unknown[] = [
    { key: 'INIT', name: 'Initialize' },
    { key: c.openEvent, name: 'Open', ...(c.openPayload.length > 0 ? { payload: c.openPayload } : {}) },
    { key: c.closeEvent, name: 'Close' },
  ];
  if (c.saveEvent) {
    events.push({ key: c.saveEvent, name: 'Save', payload: [{ name: 'data', type: 'object', required: true }] });
  }

  const transitions: unknown[] = [
    // INIT: closed → closed
    {
      from: 'closed', to: 'closed', event: 'INIT',
      effects: c.standalone
        ? [['ref', c.entityName], ['render-ui', 'main', {
            type: 'stack', direction: 'vertical', gap: 'lg',
            children: [
              { type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between', children: [
                { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                  { type: 'icon', name: c.headerIcon, size: 'lg' },
                  { type: 'typography', content: c.modalTitle, variant: 'h2' },
                ] },
                { type: 'button', label: 'Open', event: c.openEvent, variant: 'primary', icon: c.headerIcon },
              ] },
              { type: 'divider' },
              { type: 'empty-state', icon: c.headerIcon, title: 'Nothing open', description: 'Click Open to view details in a modal overlay.' },
            ],
          }]]
        : [['ref', c.entityName]],
    },
    // OPEN: closed → open (Modal component in CompiledPortal provides backdrop)
    {
      from: 'closed', to: 'open', event: c.openEvent,
      effects: [...c.openEffects, ['render-ui', 'modal', c.openContent]],
    },
    // CLOSE: open → closed (re-render main to avoid stale content)
    { from: 'open', to: 'closed', event: c.closeEvent, effects: [
      ['render-ui', 'modal', null],
      ['notify', 'Cancelled', 'info'],
      ...(c.standalone ? [['ref', c.entityName], ['render-ui', 'main', {
        type: 'stack', direction: 'vertical', gap: 'lg',
        children: [
          { type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between', children: [
            { type: 'stack', direction: 'horizontal', gap: 'md', children: [
              { type: 'icon', name: c.headerIcon, size: 'lg' },
              { type: 'typography', content: c.modalTitle, variant: 'h2' },
            ] },
            { type: 'button', label: 'Open', event: c.openEvent, variant: 'primary', icon: c.headerIcon },
          ] },
          { type: 'divider' },
          { type: 'empty-state', icon: c.headerIcon, title: 'Nothing open', description: 'Click Open to view details in a modal overlay.' },
        ],
      }]] : []),
    ] },
  ];

  // Save transition (molecule injects this for create/edit modals)
  if (c.saveEvent) {
    transitions.push({
      from: 'open', to: 'closed', event: c.saveEvent,
      effects: [
        ...c.saveEffects,
        ['render-ui', 'modal', null],
        // Emit after persist succeeds so browse traits can fetch fresh data
        ...(c.emitOnSave ? [['emit', c.emitOnSave]] : []),
      ],
    });
  }

  return {
    name: c.traitName,
    linkedEntity: c.entityName,
    category: 'interaction',
    ...(c.emitOnSave ? { emits: [{ event: c.emitOnSave }] } : {}),
    stateMachine: {
      states: [{ name: 'closed', isInitial: true }, { name: 'open' }],
      events,
      transitions,
    },
  } as Trait;
}

function buildPage(c: ModalConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdModalEntity(params: StdModalParams): Entity { return buildEntity(resolve(params)); }
export function stdModalTrait(params: StdModalParams): Trait { return buildTrait(resolve(params)); }
export function stdModalPage(params: StdModalParams): Page { return buildPage(resolve(params)); }

export function stdModal(params: StdModalParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
