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
import { stdBrowse } from './std-browse.js';
import { stdModal } from './std-modal.js';
import { stdConfirmation } from './std-confirmation.js';

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
    persistence: params.persistence ?? 'runtime',
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
  return {
    type: 'stack', direction: 'vertical', gap: 'md',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: icon, size: 'md' },
        { type: 'typography', content: title, variant: 'h3' },
      ] },
      { type: 'divider' },
      { type: 'form-section', entity: entityName, mode, submitEvent: saveEvent, cancelEvent, fields: formFields },
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
    refreshEvents: ['ENTITY_SAVED', 'ENTITY_DELETED'],
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
    emitOnSave: 'ENTITY_SAVED',
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
    emitOnSave: 'ENTITY_SAVED',
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

  const deleteTrait = extractTrait(stdConfirmation({ standalone: false,
    entityName, fields,
    traitName: `${entityName}Delete`,
    confirmTitle: `Delete ${entityName}`,
    confirmMessage: c.deleteMessage,
    confirmLabel: 'Delete',
    headerIcon: 'trash-2',
    requestEvent: 'DELETE',
    confirmEvent: 'CONFIRM_DELETE',
    confirmEffects: [['persist', 'delete', entityName, '@payload.id'], ['fetch', entityName]],
    emitOnConfirm: 'ENTITY_DELETED',
  }));

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
      { ref: deleteTrait.name },
    ],
  } as Page;

  // 4. One orbital, multiple traits, shared event bus
  return {
    name: `${entityName}Orbital`,
    entity,
    traits: [browseTrait, createTrait, editTrait, viewTrait, deleteTrait],
    pages: [page],
  } as OrbitalDefinition;
}
