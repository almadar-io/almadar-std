/**
 * Recipe 03 — Atom with trait-name + event renames.
 *
 * The agent often imports the same atom multiple times into one orbital
 * with different rename overrides — std-cart's `CartItemAddItem` and
 * `CartItemEditItem` are both Modal traits with distinct `name:` and
 * `events:` overrides at each call site. This recipe shows the full
 * shape: rename the inlined trait at the call site (`traitName:`) AND
 * rewrite the atom's emit keys (`events: { OPEN: 'ADD_ARTICLE' }`).
 *
 * Demonstrates the inline-phase page-trait rename map: the bound page's
 * `traits: [{ref: "ModalRecordModal"}]` gets rewritten to
 * `[{ref: "ArticleAddItem"}]` automatically — without that fix the
 * schema would fail with `ORB_P_INVALID_TRAIT_REF`.
 */
import { stdModal } from '@almadar/std/behaviors/functions';
import { makeSchema } from '@almadar/core/builders';
import type { OrbitalSchema } from '@almadar/core/types';

export const schema: OrbitalSchema = makeSchema(
  'recipe-03-atom-event-rename',
  stdModal({
    entityName: 'Article',
    fields: [
      { name: 'id', type: 'string', required: true },
      { name: 'title', type: 'string', required: true },
      { name: 'pendingId', type: 'string', default: '' },
    ],
    traitName: 'ArticleAddItem',
    events: {
      OPEN: 'ADD_ARTICLE',
      CLOSE: 'CANCEL_ADD',
    },
  }),
);
