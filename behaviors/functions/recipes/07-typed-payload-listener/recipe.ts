/**
 * Recipe 07 — Typed payload listener.
 *
 * Each emit declaration in a behavior's .orb carries a `payloadSchema`,
 * which the regenerator lifts into a typed interface like
 * `StdModalSavePayload`. An agent or human authoring a downstream
 * listener can import that interface to declare the listener's payload
 * shape with TS-level confidence — same shape end-to-end from emit to
 * listen.
 *
 * Here we build a tiny notification flow that listens to the modal's
 * SAVE event. The trait reference's `linkedEntity` rebinds Article-side
 * state, and the listener interface (`StdModalSavePayload`) is type-
 * narrowed against the actual payload field set the trait emits.
 */
import {
  stdModal,
  type StdModalSavePayload,
} from '@almadar/std/behaviors/functions';
import { makeSchema } from '@almadar/core/builders';
import type { OrbitalSchema } from '@almadar/core/types';

// The agent uses this typed interface to know the SAVE payload shape
// when constructing a downstream listener — the actual listen wiring
// lives in a sibling trait (not modeled here for brevity); the point of
// this recipe is to demonstrate the typed surface flowing through.
type ArticleSaveHandler = (payload: StdModalSavePayload) => void;
const _check: ArticleSaveHandler = (p) => {
  void p.data;
};
void _check;

export const schema: OrbitalSchema = makeSchema(
  'recipe-07-typed-payload',
  stdModal({
    entityName: 'Article',
    fields: [
      { name: 'id', type: 'string', required: true },
      { name: 'title', type: 'string', required: true },
      { name: 'pendingId', type: 'string', default: '' },
    ],
  }),
);
