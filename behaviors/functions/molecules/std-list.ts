/**
 * std-list
 *
 * CRUD list molecule. Composes atoms via shared event bus:
 * - stdBrowse: data-grid with item actions (fires CREATE, VIEW, EDIT, DELETE)
 * - stdModal (x3): create form, edit form, detail view (responds to matching events)
 * - stdConfirmation: delete confirmation (responds to DELETE)
 *
 * No emits/listens wiring. Traits on the same page share the event bus.
 * Only the trait with a matching transition from its current state responds.
 *
 * @level molecule
 * @family crud
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, ensureIdField, plural, extractTrait } from '@almadar/core/builders';
import { stdBrowse } from '../atoms/std-browse.js';
import { stdModal } from '../atoms/std-modal.js';
// Delete confirmation is inline in the browse trait (single-trait for entity context)

// ============================================================================
// Params
// ============================================================================

export interface StdListParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  listFields?: string[];
  detailFields?: string[];
  formFields?: string[];
  pageTitle?: string;
  createButtonLabel?: string;
  editFormTitle?: string;
  createFormTitle?: string;
  deleteMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  headerIcon?: string;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface ListConfig {
  entityName: string;
  fields: EntityField[];
  nonIdFields: EntityField[];
  listFields: string[];
  detailFields: string[];
  formFields: string[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  pageTitle: string;
  createButtonLabel: string;
  createFormTitle: string;
  editFormTitle: string;
  deleteMessage: string;
  emptyTitle: string;
  emptyDescription: string;
  headerIcon: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdListParams): ListConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const nonIdFields = fields.filter(f => f.name !== 'id');
  const p = plural(entityName);

  return {
    entityName, fields, nonIdFields,
    listFields: params.listFields ?? nonIdFields.slice(0, 3).map(f => f.name),
    detailFields: params.detailFields ?? nonIdFields.map(f => f.name),
    formFields: params.formFields ?? nonIdFields.map(f => f.name),
    persistence: params.persistence ?? 'persistent',
    collection: params.collection,
    pageTitle: params.pageTitle ?? p,
    createButtonLabel: params.createButtonLabel ?? `Create ${entityName}`,
    createFormTitle: params.createFormTitle ?? `Create ${entityName}`,
    editFormTitle: params.editFormTitle ?? `Edit ${entityName}`,
    deleteMessage: params.deleteMessage ?? `Are you sure you want to delete this ${entityName.toLowerCase()}?`,
    emptyTitle: params.emptyTitle ?? `No ${p.toLowerCase()} yet`,
    emptyDescription: params.emptyDescription ?? `Create your first ${entityName.toLowerCase()} to get started.`,
    headerIcon: params.headerIcon ?? 'list',
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Content builders
// ============================================================================

function formContent(entityName: string, mode: 'create' | 'edit', title: string, icon: string, formFields: string[], saveEvent: string, cancelEvent: string): unknown {
  const formSection: Record<string, unknown> = { type: 'form-section', entity: entityName, mode, submitEvent: saveEvent, cancelEvent, fields: formFields };
  if (mode === 'edit') {
    formSection.entityId = '@entity.id';
  }
  return {
    type: 'stack', direction: 'vertical', gap: 'md',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: icon, size: 'md' },
        { type: 'typography', content: title, variant: 'h3' },
      ] },
      { type: 'divider' },
      formSection,
    ],
  };
}

function detailContent(detailFields: string[], closeEvent: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'md',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', children: [
        { type: 'icon', name: 'eye', size: 'md' },
        { type: 'typography', variant: 'h3', content: `@entity.${detailFields[0] ?? 'id'}` },
      ] },
      { type: 'divider' },
      ...detailFields.map(f => ({
        type: 'stack', direction: 'horizontal', gap: 'md',
        children: [
          { type: 'typography', variant: 'caption', content: f.charAt(0).toUpperCase() + f.slice(1) },
          { type: 'typography', variant: 'body', content: `@entity.${f}` },
        ],
      })),
      { type: 'divider' },
      { type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'end', children: [
        { type: 'button', label: 'Edit', event: 'EDIT', variant: 'primary', icon: 'edit' },
        { type: 'button', label: 'Close', event: closeEvent, variant: 'ghost' },
      ] },
    ],
  };
}

// ============================================================================
// Projections
// ============================================================================

export function stdListEntity(params: StdListParams): Entity {
  const c = resolve(params);
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection });
}

export function stdListTrait(params: StdListParams): Trait {
  return extractTrait(stdList(params));
}

export function stdListPage(params: StdListParams): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: `${c.entityName}Browse` },
      { ref: `${c.entityName}Create` },
      { ref: `${c.entityName}Edit` },
      { ref: `${c.entityName}View` },
      { ref: `${c.entityName}Delete` },
    ],
  } as Page;
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdList(params: StdListParams): OrbitalDefinition {
  const c = resolve(params);
  const { entityName, fields, formFields, detailFields } = c;
  const UPPER = entityName.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
  const CREATED = `${UPPER}_CREATED`;
  const UPDATED = `${UPPER}_UPDATED`;

  // 1. Build atoms (shared event names, no wiring needed)
  const browseTrait = extractTrait(stdBrowse({
    entityName, fields,
    traitName: `${entityName}Browse`,
    listFields: c.listFields,
    headerIcon: c.headerIcon,
    pageTitle: c.pageTitle,
    emptyTitle: c.emptyTitle,
    emptyDescription: c.emptyDescription,
    headerActions: [{ label: c.createButtonLabel, event: 'CREATE', variant: 'primary', icon: 'plus' }],
    itemActions: [
      { label: 'View', event: 'VIEW' },
      { label: 'Edit', event: 'EDIT' },
      { label: 'Delete', event: 'DELETE', variant: 'danger' },
    ],
    refreshEvents: [CREATED, UPDATED],
  }));

  const createTrait = extractTrait(stdModal({ standalone: false,
    entityName, fields,
    traitName: `${entityName}Create`,
    modalTitle: c.createFormTitle,
    headerIcon: 'plus-circle',
    openContent: formContent(entityName, 'create', c.createFormTitle, 'plus-circle', formFields, 'SAVE', 'CLOSE'),
    openEvent: 'CREATE',
    closeEvent: 'CLOSE',
    openEffects: [['fetch', entityName]],
    saveEvent: 'SAVE',
    saveEffects: [['persist', 'create', entityName, '@payload.data'], ['fetch', entityName]],
    emitOnSave: CREATED,
  }));

  const editTrait = extractTrait(stdModal({ standalone: false,
    entityName, fields,
    traitName: `${entityName}Edit`,
    modalTitle: c.editFormTitle,
    headerIcon: 'edit',
    openContent: formContent(entityName, 'edit', c.editFormTitle, 'edit', formFields, 'SAVE', 'CLOSE'),
    openEvent: 'EDIT',
    openPayload: [{ name: 'id', type: 'string', required: true }],
    closeEvent: 'CLOSE',
    openEffects: [['fetch', entityName, '@payload.id']],
    saveEvent: 'SAVE',
    saveEffects: [['persist', 'update', entityName, '@payload.data'], ['fetch', entityName]],
    emitOnSave: UPDATED,
  }));

  const viewTrait = extractTrait(stdModal({ standalone: false,
    entityName, fields,
    traitName: `${entityName}View`,
    modalTitle: `View ${entityName}`,
    headerIcon: 'eye',
    openContent: detailContent(detailFields, 'CLOSE'),
    openEvent: 'VIEW',
    openPayload: [{ name: 'id', type: 'string', required: true }],
    closeEvent: 'CLOSE',
    openEffects: [['fetch', entityName, '@payload.id']],
  }));

  // Delete: inline in browse trait (single-trait so entity context carries across DELETE → CONFIRM_DELETE)
  // Add deleting state + transitions directly to the browse trait's state machine
  const sm = browseTrait.stateMachine as { states: unknown[]; events: unknown[]; transitions: unknown[] };
  sm.states.push({ name: 'deleting' });
  // DELETE already exists from itemActions. Only add events that aren't already there.
  const existingKeys = new Set((sm.events as Array<{key: string}>).map(e => e.key));
  if (!existingKeys.has('CONFIRM_DELETE')) sm.events.push({ key: 'CONFIRM_DELETE', name: 'Confirm Delete' });
  if (!existingKeys.has('CANCEL')) sm.events.push({ key: 'CANCEL', name: 'Cancel' });
  if (!existingKeys.has('CLOSE')) sm.events.push({ key: 'CLOSE', name: 'Close' });
  sm.transitions.push(
    // DELETE: browsing → deleting (fetch entity by ID, show confirmation modal)
    { from: 'browsing', to: 'deleting', event: 'DELETE', effects: [
      ['fetch', entityName, '@payload.id'],
      ['render-ui', 'modal', {
        type: 'stack', direction: 'vertical', gap: 'md',
        children: [
          { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
            { type: 'icon', name: 'trash-2', size: 'md' },
            { type: 'typography', content: `Delete ${entityName}`, variant: 'h3' },
          ] },
          { type: 'divider' },
          { type: 'typography', content: c.deleteMessage, variant: 'body' },
          { type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'end', children: [
            { type: 'button', label: 'Cancel', event: 'CANCEL', variant: 'ghost' },
            { type: 'button', label: 'Delete', event: 'CONFIRM_DELETE', variant: 'danger', icon: 'trash' },
          ] },
        ],
      }],
    ] },
    // CONFIRM_DELETE: deleting → browsing (persist delete using selected entity's ID)
    { from: 'deleting', to: 'browsing', event: 'CONFIRM_DELETE', effects: [
      ['persist', 'delete', entityName, '@entity.id'],
      ['render-ui', 'modal', null],
      ['fetch', entityName],
    ] },
    // CANCEL/CLOSE from deleting
    { from: 'deleting', to: 'browsing', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
    { from: 'deleting', to: 'browsing', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
  );

  // 2. Shared entity
  const entity = makeEntity({ name: entityName, fields, persistence: c.persistence, collection: c.collection });

  // 3. Page references all traits
  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: browseTrait.name },
      { ref: createTrait.name },
      { ref: editTrait.name },
      { ref: viewTrait.name },
    ],
  } as Page;

  // 4. One orbital, multiple traits, shared event bus
  return {
    name: `${entityName}Orbital`,
    entity,
    traits: [browseTrait, createTrait, editTrait, viewTrait],
    pages: [page],
  } as OrbitalDefinition;
}
