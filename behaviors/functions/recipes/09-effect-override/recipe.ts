/**
 * Recipe 09 — Effect override per event.
 *
 * The atom ships canonical effects per transition (modal opens with
 * `(render-ui modal {...})` etc.). Sometimes the agent wants to add
 * extra side-effects on a specific event without modifying the atom's
 * state-machine topology. The trait reference's `effects:` override
 * accepts a `Record<post-rename-event-name, SExpr[]>` — keys are POST-
 * rename event names (so they match what the trait actually transitions
 * on after `events:` is applied).
 *
 * Here we add a `notify` side effect on the modal's SAVE so the cart
 * shows a toast after a save without changing how the modal flows.
 */
import { stdModalTrait, stdModalPage } from '@almadar/std/behaviors/functions';
import { makeSchema, makeOrbitalWithUses } from '@almadar/core/builders';
import type {
  OrbitalSchema,
  Entity,
  SExpr,
} from '@almadar/core/types';

const articleEntity: Entity = {
  name: 'Article',
  fields: [
    { name: 'id', type: 'string', required: true },
    { name: 'title', type: 'string', required: true },
    { name: 'pendingId', type: 'string', default: '' },
  ],
};

// SExpr literal for the SAVE transition — the agent constructs this as
// nested arrays, same shape as the .orb's `effects[]` JSON. Each entry
// is a top-level effect (`["render-ui", ...]`, `["notify", ...]`, etc.)
const saveEffects: SExpr[] = [
  ['render-ui', 'modal', null] as SExpr,
  ['notify', { type: 'success', title: 'Saved', message: 'Article saved.' }] as SExpr,
];

export const schema: OrbitalSchema = makeSchema(
  'recipe-09-effect-override',
  makeOrbitalWithUses({
    name: 'ArticleOrbital',
    uses: [{ from: 'std/behaviors/std-modal', as: 'Modal' }],
    entity: articleEntity,
    traits: [
      stdModalTrait({
        entityName: 'Article',
        traitName: 'ArticleSaveModal',
        events: { OPEN: 'OPEN_EDITOR' },
        effects: { SAVE: saveEffects },
      }),
    ],
    pages: [stdModalPage({ entityName: 'Article', pagePath: '/articles' })],
  }),
);
