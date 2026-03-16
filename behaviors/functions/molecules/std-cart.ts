/**
 * std-cart
 *
 * Shopping cart molecule. Composes atoms:
 * - Cart-specific browse trait (empty/hasItems/checkout states)
 * - stdModal for the add-item form (responds to ADD_ITEM)
 *
 * @level molecule
 * @family commerce
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, ensureIdField, extractTrait } from '@almadar/core/builders';
import { stdModal } from '../atoms/std-modal.js';

// ============================================================================
// Params
// ============================================================================

export interface StdCartParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  listFields?: string[];
  formFields?: string[];
  pageTitle?: string;
  addButtonLabel?: string;
  checkoutButtonLabel?: string;
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

interface CartConfig {
  entityName: string;
  fields: EntityField[];
  nonIdFields: EntityField[];
  listFields: string[];
  formFields: string[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  pageTitle: string;
  addButtonLabel: string;
  checkoutButtonLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  headerIcon: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdCartParams): CartConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const nonIdFields = fields.filter(f => f.name !== 'id');

  return {
    entityName, fields, nonIdFields,
    listFields: params.listFields ?? nonIdFields.slice(0, 3).map(f => f.name),
    formFields: params.formFields ?? nonIdFields.map(f => f.name),
    persistence: params.persistence ?? 'persistent',
    collection: params.collection,
    pageTitle: params.pageTitle ?? 'Shopping Cart',
    addButtonLabel: params.addButtonLabel ?? 'Add Item',
    checkoutButtonLabel: params.checkoutButtonLabel ?? 'Proceed to Checkout',
    emptyTitle: params.emptyTitle ?? 'Your cart is empty',
    emptyDescription: params.emptyDescription ?? 'Add items to get started.',
    headerIcon: params.headerIcon ?? 'shopping-cart',
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? '/cart',
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Cart-specific browse trait (empty/hasItems/checkout)
// ============================================================================

function buildCartTrait(c: CartConfig): Trait {
  const { entityName, listFields, headerIcon, pageTitle, addButtonLabel, checkoutButtonLabel, emptyTitle, emptyDescription } = c;

  const listItemChildren: unknown[] = [
    {
      type: 'stack', direction: 'horizontal', justify: 'space-between', align: 'center',
      children: [
        { type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', children: [
          { type: 'icon', name: headerIcon, size: 'sm' },
          { type: 'typography', variant: 'h4', content: `@entity.${listFields[0] ?? 'id'}` },
        ] },
        ...(listFields.length > 1 ? [{ type: 'badge', label: `@entity.${listFields[1]}` }] : []),
      ],
    },
  ];
  if (listFields.length > 2) {
    listItemChildren.push({ type: 'typography', variant: 'caption', content: `@entity.${listFields[2]}` });
  }

  const headerBar = {
    type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'md', children: [
        { type: 'icon', name: headerIcon, size: 'lg' },
        { type: 'typography', content: pageTitle, variant: 'h2' },
      ] },
      { type: 'button', label: addButtonLabel, event: 'ADD_ITEM', variant: 'primary', icon: 'plus' },
    ],
  };

  const cartGrid = {
    type: 'data-grid', entity: entityName,
    emptyIcon: 'inbox', emptyTitle, emptyDescription,
    itemActions: [{ label: 'Remove', event: 'REMOVE_ITEM', variant: 'danger' }],
    children: [{ type: 'stack', direction: 'vertical', gap: 'sm', children: listItemChildren }],
  };

  return {
    name: `${entityName}CartBrowse`,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'browsing', isInitial: true },
        { name: 'checkout' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'ADD_ITEM', name: 'Add Item' },
        { key: 'SAVE', name: 'Save', payload: [{ name: 'data', type: 'object', required: true }] },
        { key: 'REMOVE_ITEM', name: 'Remove Item', payload: [{ name: 'id', type: 'string', required: true }] },
        { key: 'PROCEED_CHECKOUT', name: 'Proceed to Checkout' },
        { key: 'BACK_TO_CART', name: 'Back to Cart' },
        { key: 'CONFIRM_ORDER', name: 'Confirm Order' },
      ],
      transitions: [
        // browsing + INIT (data-grid handles empty vs populated automatically)
        { from: 'browsing', to: 'browsing', event: 'INIT', effects: [
          ['fetch', entityName],
          ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
            headerBar, { type: 'divider' }, cartGrid,
            { type: 'button', label: checkoutButtonLabel, event: 'PROCEED_CHECKOUT', variant: 'primary', icon: 'arrow-right' },
          ] }],
        ] },
        // SAVE: re-fetch after modal adds an item (shared event bus)
        { from: 'browsing', to: 'browsing', event: 'SAVE', effects: [['fetch', entityName]] },
        // REMOVE_ITEM
        { from: 'browsing', to: 'browsing', event: 'REMOVE_ITEM', effects: [
          ['persist', 'delete', entityName, '@payload.id'], ['fetch', entityName],
        ] },
        // PROCEED_CHECKOUT
        { from: 'browsing', to: 'checkout', event: 'PROCEED_CHECKOUT', effects: [
          ['fetch', entityName],
          ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
            { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
              { type: 'icon', name: 'clipboard', size: 'lg' },
              { type: 'typography', content: 'Checkout', variant: 'h2' },
            ] },
            { type: 'divider' },
            cartGrid,
            { type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'end', children: [
              { type: 'button', label: 'Back to Cart', event: 'BACK_TO_CART', variant: 'ghost', icon: 'arrow-left' },
              { type: 'button', label: 'Confirm Order', event: 'CONFIRM_ORDER', variant: 'primary', icon: 'check' },
            ] },
          ] }],
        ] },
        // BACK_TO_CART
        { from: 'checkout', to: 'browsing', event: 'BACK_TO_CART', effects: [['fetch', entityName]] },
        // CONFIRM_ORDER
        { from: 'checkout', to: 'browsing', event: 'CONFIRM_ORDER', effects: [
          ['fetch', entityName],
          ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', align: 'center', children: [
            { type: 'icon', name: 'check-circle', size: 'lg' },
            { type: 'typography', content: 'Order Confirmed', variant: 'h2' },
            { type: 'typography', content: 'Your order has been placed successfully.', variant: 'body' },
            { type: 'button', label: 'Continue Shopping', event: 'INIT', variant: 'primary' },
          ] }],
        ] },
      ],
    },
  } as Trait;
}

// ============================================================================
// Projections
// ============================================================================

export function stdCartEntity(params: StdCartParams): Entity {
  const c = resolve(params);
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection });
}

export function stdCartTrait(params: StdCartParams): Trait {
  return buildCartTrait(resolve(params));
}

export function stdCartPage(params: StdCartParams): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [{ ref: `${c.entityName}CartBrowse` }, { ref: `${c.entityName}AddItem` }],
  } as Page;
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdCart(params: StdCartParams): OrbitalDefinition {
  const c = resolve(params);
  const { entityName, fields, formFields } = c;

  // Cart-specific browse trait
  const cartTrait = buildCartTrait(c);

  // Add-item modal (stdModal atom)
  const addTrait = extractTrait(stdModal({ standalone: false,
    entityName, fields,
    traitName: `${entityName}AddItem`,
    modalTitle: c.addButtonLabel,
    headerIcon: 'plus-circle',
    openContent: {
      type: 'stack', direction: 'vertical', gap: 'md',
      children: [
        { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
          { type: 'icon', name: 'plus-circle', size: 'md' },
          { type: 'typography', content: c.addButtonLabel, variant: 'h3' },
        ] },
        { type: 'divider' },
        { type: 'form-section', entity: entityName, mode: 'create', submitEvent: 'SAVE', cancelEvent: 'CLOSE', fields: formFields },
      ],
    },
    openEvent: 'ADD_ITEM',
    closeEvent: 'CLOSE',
    openEffects: [['fetch', entityName]],
    saveEvent: 'SAVE',
    saveEffects: [['persist', 'create', entityName, '@payload.data'], ['fetch', entityName]],
  }));

  const entity = makeEntity({ name: entityName, fields, persistence: c.persistence, collection: c.collection });

  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [{ ref: cartTrait.name }, { ref: addTrait.name }],
  } as Page;

  return {
    name: `${entityName}Orbital`,
    entity,
    traits: [cartTrait, addTrait],
    pages: [page],
  } as OrbitalDefinition;
}
