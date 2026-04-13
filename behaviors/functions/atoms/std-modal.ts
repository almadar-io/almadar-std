/**
 * std-modal
 *
 * Modal overlay atom. Accepts content injection so molecules
 * can control what renders inside the open state.
 *
 * @level atom
 * @family modal
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
  // Phase F.10: SAVE is part of std-modal's permanent topology. Always set.
  saveEvent: string;
  saveEffects: unknown[];
  // Always set (defaults to saveEvent so the atom's emits[] is always populated).
  emitOnSave: string;
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

  // Phase F.10: SAVE is now part of std-modal's permanent topology, not
  // conditional. Default saveEvent = 'SAVE' so the transition + event entry
  // always exist in the atom's state machine. Molecules that don't customize
  // SAVE inherit a no-op effect; molecules that do override the effects via
  // the F.8 effects override.
  const saveEvent = params.saveEvent ?? 'SAVE';
  // emitOnSave defaults to the same key as saveEvent so the atom's emits
  // declaration always lists SAVE (or the molecule's renamed key). This
  // makes the lifted reference's emits[] declaration valid without needing
  // a separate addEmits override.
  const emitOnSave = params.emitOnSave ?? saveEvent;

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
    saveEvent,
    saveEffects: params.saveEffects ?? [],
    emitOnSave,
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
  // Phase F.10: SAVE is always declared, not conditional. The atom's
  // permanent topology includes INIT + open + close + save events.
  const events: unknown[] = [
    { key: 'INIT', name: 'Initialize' },
    { key: c.openEvent, name: 'Open', ...(c.openPayload.length > 0 ? { payload: c.openPayload } : {}) },
    { key: c.closeEvent, name: 'Close' },
    { key: c.saveEvent, name: 'Save', payload: [{ name: 'data', type: 'object', required: true }] },
  ];

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

  // Phase F.10: SAVE transition is now permanent (no `if (c.saveEvent)` guard).
  // Molecules customize the effects via the F.8 effects override; molecules
  // that don't supply saveEffects inherit a no-op save (just close the modal
  // and refresh the main render). The atom always declares its emit so the
  // lifted reference's emits[] is valid even when molecules add their own
  // ['emit', X] inside the override effects (because emitOnSave defaults to
  // saveEvent).
  const mainRefresh = c.standalone ? [['ref', c.entityName], ['render-ui', 'main', {
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
  }]] : [];
  transitions.push({
    from: 'open', to: 'closed', event: c.saveEvent,
    effects: [
      ...c.saveEffects,
      ['render-ui', 'modal', null],
      // Emit after persist succeeds so browse traits can fetch fresh data.
      // Skip the emit when emitOnSave equals saveEvent — that's a self-emit
      // that the runtime would short-circuit anyway, and avoids double
      // dispatch on every save.
      ...(c.emitOnSave !== c.saveEvent ? [['emit', c.emitOnSave]] : []),
      ...mainRefresh,
    ],
  });

  return {
    name: c.traitName,
    linkedEntity: c.entityName,
    category: 'interaction',
    // Phase F.10: emits[] is always populated (default emitOnSave = saveEvent).
    // If a molecule supplies a distinct emitOnSave, declare both events.
    emits: c.emitOnSave === c.saveEvent
      ? [{ event: c.saveEvent }]
      : [{ event: c.saveEvent }, { event: c.emitOnSave }],
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

export function stdModal(params: StdModalParams): OrbitalSchema {
  const c = resolve(params);
  return makeSchema(`${c.entityName}Orbital`, makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]));
}
