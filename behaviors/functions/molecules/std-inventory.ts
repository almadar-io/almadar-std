/**
 * std-inventory
 *
 * Item collection molecule. Composes atoms via shared event bus:
 * - stdBrowse: data-grid with item actions (fires ADD_ITEM, USE_ITEM, DROP)
 * - stdModal (add): create form for adding items (responds to ADD_ITEM)
 * - stdModal (use): item detail for using items (responds to USE_ITEM)
 * - stdConfirmation: drop confirmation (responds to DROP)
 *
 * No emits/listens wiring. Traits on the same page share the event bus.
 * Only the trait with a matching transition from its current state responds.
 *
 * @level molecule
 * @family game
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, ensureIdField, plural, extractTrait } from '@almadar/core/builders';
import { stdBrowse } from '../atoms/std-browse.js';
import { stdModal } from '../atoms/std-modal.js';
import { stdConfirmation } from '../atoms/std-confirmation.js';
import { SYSTEM_FIELDS } from '../utils.js';

// ============================================================================
// Params
// ============================================================================

export interface StdInventoryParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;

  // Display
  listFields?: string[];
  formFields?: string[];

  // Labels
  pageTitle?: string;
  addLabel?: string;

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

interface InventoryConfig {
  entityName: string;
  fields: EntityField[];
  nonIdFields: EntityField[];
  listFields: string[];
  formFields: string[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  pageTitle: string;
  addLabel: string;
  headerIcon: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdInventoryParams): InventoryConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);
  const p = plural(entityName);

  // Domain fields required by stdConfirmation's render-ui bindings (@entity.pendingId)
  const domainFields: EntityField[] = [
    { name: 'pendingId', type: 'string', default: '' },
  ];
  const userFieldNames = new Set(baseFields.map(f => f.name));
  const fields = [...baseFields, ...domainFields.filter(f => !userFieldNames.has(f.name))];
  const nonIdFields = fields.filter(f => f.name !== 'id');

  return {
    entityName,
    fields,
    nonIdFields,
    listFields: params.listFields ?? nonIdFields.slice(0, 3).map(f => f.name),
    formFields: params.formFields ?? nonIdFields.filter(f => !SYSTEM_FIELDS.has(f.name)).map(f => f.name),
    persistence: params.persistence ?? 'persistent',
    collection: params.collection,
    pageTitle: params.pageTitle ?? `${p} Inventory`,
    addLabel: params.addLabel ?? `Add ${entityName}`,
    headerIcon: params.headerIcon ?? 'package',
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Content builders
// ============================================================================

function addFormContent(entityName: string, addLabel: string, formFields: string[]): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'md',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'plus-circle', size: 'md' },
        { type: 'typography', content: addLabel, variant: 'h3' },
      ] },
      { type: 'divider' },
      { type: 'form-section', entity: entityName, mode: 'create', submitEvent: 'SAVE', cancelEvent: 'CLOSE', fields: formFields },
    ],
  };
}

function useItemContent(entityName: string, listFields: string[]): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', children: [
        { type: 'icon', name: 'zap', size: 'md' },
        { type: 'typography', content: `Use ${entityName}`, variant: 'h3' },
      ] },
      { type: 'divider' },
      { type: 'typography', content: `@entity.${listFields[0] ?? 'id'}`, variant: 'body' },
      { type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center', children: [
        { type: 'button', label: 'Cancel', event: 'CLOSE', variant: 'ghost' },
        { type: 'button', label: 'Confirm Use', event: 'SAVE', variant: 'primary', icon: 'check' },
      ] },
    ],
  };
}

// ============================================================================
// Projections
// ============================================================================

export function stdInventoryEntity(params: StdInventoryParams): Entity {
  const c = resolve(params);
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection });
}

export function stdInventoryTrait(params: StdInventoryParams): Trait {
  return extractTrait(stdInventory(params));
}

export function stdInventoryPage(params: StdInventoryParams): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: `${c.entityName}Browse` },
      { ref: `${c.entityName}Add` },
      { ref: `${c.entityName}Use` },
      { ref: `${c.entityName}Drop` },
    ],
  } as Page;
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdInventory(params: StdInventoryParams): OrbitalDefinition {
  const c = resolve(params);
  const { entityName, fields, formFields, listFields } = c;

  // 1. Build atoms (shared event names, no wiring needed)
  const browseTrait = extractTrait(stdBrowse({
    entityName, fields,
    traitName: `${entityName}Browse`,
    listFields: c.listFields,
    headerIcon: c.headerIcon,
    pageTitle: c.pageTitle,
    emptyTitle: 'No items yet',
    emptyDescription: 'Add your first item to get started.',
    headerActions: [{ label: c.addLabel, event: 'ADD_ITEM', variant: 'primary', icon: 'plus' }],
    itemActions: [
      { label: 'Use', event: 'USE_ITEM' },
      { label: 'Drop', event: 'DROP', variant: 'danger' },
    ],
    refreshEvents: ['ITEM_ADDED', 'ITEM_USED', 'CONFIRM_DROP'],
  }));

  const addTrait = extractTrait(stdModal({ standalone: false,
    entityName, fields,
    traitName: `${entityName}Add`,
    modalTitle: c.addLabel,
    headerIcon: 'plus-circle',
    openContent: addFormContent(entityName, c.addLabel, formFields),
    openEvent: 'ADD_ITEM',
    closeEvent: 'CLOSE',
    openEffects: [['fetch', entityName]],
    saveEvent: 'SAVE',
    saveEffects: [['persist', 'create', entityName, '@payload.data']],
    emitOnSave: 'ITEM_ADDED',
  }));

  const useTrait = extractTrait(stdModal({ standalone: false,
    entityName, fields,
    traitName: `${entityName}Use`,
    modalTitle: `Use ${entityName}`,
    headerIcon: 'zap',
    openContent: useItemContent(entityName, listFields),
    openEvent: 'USE_ITEM',
    openPayload: [{ name: 'id', type: 'string', required: true }],
    closeEvent: 'CLOSE',
    openEffects: [['fetch', entityName, { id: '@payload.id' }]],
    saveEvent: 'SAVE',
    saveEffects: [['persist', 'update', entityName, '@payload.data']],
    emitOnSave: 'ITEM_USED',
  }));

  // Phase F.10: dropTrait composes std-confirmation cleanly. The
  // std-confirmation atom stores @payload.id in @entity.pendingId during the
  // REQUEST → confirming transition, so confirmEffects bind the id via
  // @entity.pendingId rather than @payload.id (which the CONFIRM event
  // doesn't carry). This matches std-cart's remove-confirmation pattern.
  const dropTrait = extractTrait(stdConfirmation({ standalone: false,
    entityName, fields,
    traitName: `${entityName}Drop`,
    confirmTitle: `Drop ${entityName}`,
    confirmMessage: `Are you sure you want to drop this ${entityName.toLowerCase()}?`,
    confirmLabel: 'Drop',
    headerIcon: 'trash-2',
    requestEvent: 'DROP',
    confirmEvent: 'CONFIRM_DROP',
    confirmEffects: [['persist', 'delete', entityName, '@entity.pendingId']],
    emitOnConfirm: 'CONFIRM_DROP',
  }));

  // 2. Shared entity with seed instances so INIT fetch returns data
  const instances = [
    { id: 'item-1', name: 'Health Potion', description: 'Restores 50 HP', status: 'active', pendingId: '' },
    { id: 'item-2', name: 'Iron Sword', description: 'A sturdy blade', status: 'active', pendingId: '' },
    { id: 'item-3', name: 'Wooden Shield', description: 'Basic protection', status: 'active', pendingId: '' },
  ];
  const entity = makeEntity({ name: entityName, fields, persistence: c.persistence, collection: c.collection, instances });

  // 3. Page references all traits
  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: browseTrait.name },
      { ref: addTrait.name },
      { ref: useTrait.name },
      { ref: dropTrait.name },
    ],
  } as Page;

  // 4. One orbital, multiple traits, shared event bus
  return {
    name: `${entityName}Orbital`,
    entity,
    traits: [browseTrait, addTrait, useTrait, dropTrait],
    pages: [page],
  } as OrbitalDefinition;
}
