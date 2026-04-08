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
import { makeEntity, ensureIdField, extractTrait } from '@almadar/core/builders';
import { stdModal } from '../atoms/std-modal.js';
import { stdConfirmation } from '../atoms/std-confirmation.js';
import { humanizeLabel, SYSTEM_FIELDS } from '../utils.js';

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
  const baseFields = ensureIdField(params.fields);
  // Domain field required by stdConfirmation's render-ui bindings (@entity.pendingId)
  const domainFields: EntityField[] = [
    { name: 'pendingId', type: 'string', default: '' },
  ];
  const userFieldNames = new Set(baseFields.map(f => f.name));
  const fields = [...baseFields, ...domainFields.filter(f => !userFieldNames.has(f.name))];
  const nonIdFields = fields.filter(f => f.name !== 'id');

  return {
    entityName, fields, nonIdFields,
    listFields: params.listFields ?? nonIdFields.slice(0, 3).map(f => f.name),
    formFields: params.formFields ?? nonIdFields.filter(f => !SYSTEM_FIELDS.has(f.name)).map(f => f.name),
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

  // Use columns-based rendering instead of legacy children/renderItem pattern
  // This leverages DataGrid's built-in card layout with proper entity binding
  const cartColumns = [
    { name: listFields[0] ?? 'id', label: humanizeLabel(listFields[0] ?? 'id'), variant: 'h4', icon: headerIcon },
    ...(listFields.length > 1 ? [{ name: listFields[1], label: humanizeLabel(listFields[1]), variant: 'caption' as const, format: 'currency' as const }] : []),
    ...(listFields.length > 2 ? [{ name: listFields[2], label: humanizeLabel(listFields[2]), variant: 'badge' as const }] : []),
  ];

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
    itemActions: [{ label: 'Remove', event: 'REQUEST_REMOVE', variant: 'danger', size: 'sm' }],
    columns: cartColumns,
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
        { key: 'REQUEST_REMOVE', name: 'Request Remove', payload: [{ name: 'id', type: 'string', required: true }] },
        { key: 'PROCEED_CHECKOUT', name: 'Proceed to Checkout' },
        { key: 'BACK_TO_CART', name: 'Back to Cart' },
        { key: 'CONFIRM_ORDER', name: 'Confirm Order' },
      ],
      transitions: [
        // browsing + INIT (data-grid handles empty vs populated automatically)
        { from: 'browsing', to: 'browsing', event: 'INIT', effects: [
          ['ref', entityName],
          ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
            headerBar, { type: 'divider' },
            // Order summary stats
            {
              type: 'simple-grid', columns: 3,
              children: [
                { type: 'stat-display', label: 'Items', value: ['array/len', '@entity'], icon: 'package' },
                { type: 'stat-display', label: 'Subtotal', value: ['array/len', '@entity'], icon: 'dollar-sign' },
                { type: 'stat-display', label: 'Total', value: ['array/len', '@entity'], icon: 'receipt' },
              ],
            },
            { type: 'divider' },
            cartGrid,
            { type: 'button', label: checkoutButtonLabel, event: 'PROCEED_CHECKOUT', variant: 'primary', icon: 'arrow-right' },
          ] }],
        ] },
        // PROCEED_CHECKOUT
        { from: 'browsing', to: 'checkout', event: 'PROCEED_CHECKOUT', effects: [
          ['ref', entityName],
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
        { from: 'checkout', to: 'browsing', event: 'BACK_TO_CART', effects: [['ref', entityName]] },
        // CONFIRM_ORDER
        { from: 'checkout', to: 'browsing', event: 'CONFIRM_ORDER', effects: [
          ['ref', entityName],
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
    traits: [{ ref: `${c.entityName}CartBrowse` }, { ref: `${c.entityName}AddItem` }, { ref: `${c.entityName}RemoveConfirm` }],
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
    saveEffects: [['persist', 'create', entityName, '@payload.data']],
  }));

  // Remove confirmation (stdConfirmation atom)
  const removeTrait = extractTrait(stdConfirmation({ standalone: false,
    entityName, fields,
    traitName: `${entityName}RemoveConfirm`,
    confirmTitle: 'Remove Item',
    confirmMessage: 'Are you sure you want to remove this item from your cart?',
    confirmLabel: 'Remove',
    headerIcon: 'trash-2',
    requestEvent: 'REQUEST_REMOVE',
    confirmEvent: 'CONFIRM_REMOVE',
    confirmEffects: [['persist', 'delete', entityName, '@entity.pendingId']],
  }));

  const entity = makeEntity({ name: entityName, fields, persistence: c.persistence, collection: c.collection });

  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [{ ref: cartTrait.name }, { ref: addTrait.name }, { ref: removeTrait.name }],
  } as Page;

  return {
    name: `${entityName}Orbital`,
    entity,
    traits: [cartTrait, addTrait, removeTrait],
    pages: [page],
  } as OrbitalDefinition;
}
