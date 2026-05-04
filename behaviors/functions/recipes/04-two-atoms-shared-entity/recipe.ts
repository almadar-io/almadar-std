/**
 * Recipe 04 — Three atoms in one orbital, shared entity (the std-cart
 * pattern).
 *
 * This is THE composition shape for molecules: one entity, multiple
 * imported atoms each owning a slice of the workflow, every trait
 * referenced by the same `linkedEntity`. The browse trait paints the
 * initial list at /cart so the page is visible on first render; the
 * modal ADDs items; the confirmation REMOVEs them. All three operate
 * on the same `CartItem` rows.
 *
 * Without the browse partner, the modal and confirmation would render
 * to the `modal` slot only — the page's `main` slot would be empty on
 * INIT and the recipe wouldn't demonstrate an entire flow.
 *
 * Builders used:
 *   - `stdBrowseTrait(...)` for the visible list at INIT.
 *   - `stdModalTrait(...)` / `stdConfirmationTrait(...)` per-trait factories
 *     (returning typed `TraitReference` payloads).
 *   - `makePageRef(...)` to bind all three traits onto one page.
 *   - `makeOrbitalWithUses({uses, entity, traits, pages})` to assemble the
 *     orbital with its `uses:` declarations, shared entity, and trait
 *     references.
 *   - `makeSchema(...)` to wrap the orbital in a runnable schema.
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
    { name: 'quantity', type: 'number', default: 1 },
    { name: 'pendingId', type: 'string', default: '' },
  ],
};

export const schema: OrbitalSchema = makeSchema(
  'recipe-04-cart',
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
