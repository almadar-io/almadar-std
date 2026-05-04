/**
 * Recipe 10 — Whole app: every primitive together.
 *
 * A complete shopping app composed from the primitives in recipes 01-09:
 *
 *   - Two orbitals (Cart + Order).
 *   - Browse + Modal (+ Confirmation in Cart) per orbital — the browse
 *     trait paints the initial list at /cart and /checkout so each
 *     page renders something on land instead of an empty `main` slot.
 *   - Trait renames at every call site.
 *   - Typed config block on the modal (icon + title).
 *   - Page wiring binding all per-orbital traits onto one page.
 *   - `makeSchema` ties it all together.
 *
 * If this validates clean, every primitive in the recipes folder is
 * agent-callable end-to-end. The orbital-agent's tool-use surface
 * mirrors this composition exactly.
 */
import {
  stdBrowseTrait,
  stdModalTrait,
  stdConfirmationTrait,
} from '@almadar/std/behaviors/functions';
import { makeSchema, makeOrbitalWithUses } from '@almadar/core/builders';
import type { OrbitalSchema, Entity } from '@almadar/core/types';

const cartItemEntity: Entity = {
  name: 'CartItem',
  fields: [
    { name: 'id', type: 'string', required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'quantity', type: 'number', default: 1 },
    { name: 'pendingId', type: 'string', default: '' },
  ],
};

const orderEntity: Entity = {
  name: 'Order',
  fields: [
    { name: 'id', type: 'string', required: true },
    { name: 'total', type: 'number', default: 0 },
    { name: 'status', type: 'string', default: 'pending' },
    { name: 'pendingId', type: 'string', default: '' },
  ],
};

const cartOrbital = makeOrbitalWithUses({
  name: 'CartItemOrbital',
  uses: [
    { from: 'std/behaviors/std-browse', as: 'Browse' },
    { from: 'std/behaviors/std-modal', as: 'Modal' },
    { from: 'std/behaviors/std-confirmation', as: 'Confirmation' },
  ],
  entity: cartItemEntity,
  traits: [
    stdBrowseTrait({
      entityName: 'CartItem',
      traitName: 'CartItemBrowse',
      config: {
        fields: [
          { name: 'name', label: 'Name' },
          { name: 'quantity', label: 'Qty' },
        ],
        pageSize: 10,
      },
    }),
    stdModalTrait({
      entityName: 'CartItem',
      traitName: 'CartItemAddItem',
      events: { OPEN: 'ADD_ITEM' },
      config: { icon: 'plus', title: 'Add to Cart', mode: 'create' },
    }),
    stdConfirmationTrait({
      entityName: 'CartItem',
      traitName: 'CartItemRemoveConfirm',
      events: {
        REQUEST: 'REQUEST_REMOVE',
        CONFIRM: 'CONFIRM_REMOVE',
        CANCEL: 'CANCEL_REMOVE',
      },
    }),
  ],
  pages: [
    {
      name: 'CartHubPage',
      path: '/cart',
      traits: [
        { ref: 'CartItemBrowse' },
        { ref: 'CartItemAddItem' },
        { ref: 'CartItemRemoveConfirm' },
      ],
    },
  ],
});

const orderOrbital = makeOrbitalWithUses({
  name: 'OrderOrbital',
  uses: [
    { from: 'std/behaviors/std-browse', as: 'Browse' },
    { from: 'std/behaviors/std-modal', as: 'Modal' },
  ],
  entity: orderEntity,
  traits: [
    stdBrowseTrait({
      entityName: 'Order',
      traitName: 'OrderBrowse',
      config: {
        fields: [
          { name: 'total', label: 'Total' },
          { name: 'status', label: 'Status' },
        ],
        pageSize: 10,
      },
    }),
    stdModalTrait({
      entityName: 'Order',
      traitName: 'OrderCheckout',
      events: { OPEN: 'BEGIN_CHECKOUT' },
      config: { icon: 'shopping-bag', title: 'Checkout', mode: 'edit' },
    }),
  ],
  pages: [
    {
      name: 'OrderHubPage',
      path: '/checkout',
      traits: [
        { ref: 'OrderBrowse' },
        { ref: 'OrderCheckout' },
      ],
    },
  ],
});

export const schema: OrbitalSchema = makeSchema(
  'recipe-10-whole-app',
  cartOrbital,
  orderOrbital,
);
