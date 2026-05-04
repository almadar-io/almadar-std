/**
 * Recipe 05 — Cross-trait listen via the `listens:` override.
 *
 * Same shape as recipe 04 (browse + modal + confirmation, shared
 * `CartItem`), but now the confirmation trait declares an explicit
 * `listens:` array so it only opens when the browse trait emits a
 * `REQUEST_REMOVE` for a specific row. Demonstrates passing a fully-
 * formed `listens` array to `stdConfirmationTrait` — the entries are
 * typed `TraitEventListener` payloads, with source-trait paths in the
 * form `{Trait}.{EVENT}` for same-orbital listens.
 *
 * The browse partner provides the initial visible state (the CartItem
 * list at /cart) and is the natural source of `REQUEST_REMOVE` events;
 * without it the confirmation has no upstream emitter and the recipe's
 * point would be invisible.
 */
import {
  stdBrowseTrait,
  stdModalTrait,
  stdConfirmationTrait,
} from '@almadar/std/behaviors/functions';
import { makeSchema, makeOrbitalWithUses, makePageRef } from '@almadar/core/builders';
import type { OrbitalSchema, Entity } from '@almadar/core/types';

const cartItemEntity: Entity = {
  name: 'CartItem',
  fields: [
    { name: 'id', type: 'string', required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'pendingId', type: 'string', default: '' },
  ],
};

export const schema: OrbitalSchema = makeSchema(
  'recipe-05-cross-trait-listen',
  makeOrbitalWithUses({
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
          fields: [{ name: 'name', label: 'Name' }],
          pageSize: 10,
        },
      }),
      stdModalTrait({
        entityName: 'CartItem',
        traitName: 'CartItemAddItem',
        events: { OPEN: 'ADD_ITEM' },
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
      makePageRef({
        from: 'std/behaviors/std-browse',
        ref: 'Browse.pages.BrowseItemPage',
        path: '/cart',
        linkedEntity: 'CartItem',
        traits: [
          { ref: 'CartItemBrowse' },
          { ref: 'CartItemAddItem' },
          { ref: 'CartItemRemoveConfirm' },
        ],
      }),
    ],
  }),
);
