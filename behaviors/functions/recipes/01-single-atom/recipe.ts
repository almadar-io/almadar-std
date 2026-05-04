/**
 * Recipe 01 — Single atom, default params.
 *
 * The simplest possible composition: drop the std-modal atom into a
 * runnable schema with one entity. Demonstrates the minimum surface
 * area an agent needs to produce a validated `.orb`:
 *   - call the atom's factory (`stdModal`) with `entityName` + `fields`
 *   - wrap the resulting `OrbitalDefinition` in `makeSchema(...)`
 *
 * Everything else (uses declaration, trait reference, page reference)
 * is constructed by the factory under the hood.
 */
import { stdModal } from '@almadar/std/behaviors/functions';
import { makeSchema } from '@almadar/core/builders';
import type { OrbitalSchema } from '@almadar/core/types';

export const schema: OrbitalSchema = makeSchema(
  'recipe-01-single-atom',
  stdModal({
    entityName: 'Article',
    fields: [
      { name: 'id', type: 'string', required: true },
      { name: 'title', type: 'string', required: true },
      { name: 'content', type: 'string' },
      { name: 'pendingId', type: 'string', default: '' },
    ],
  }),
);
