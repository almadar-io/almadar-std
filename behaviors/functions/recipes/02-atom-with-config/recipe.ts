/**
 * Recipe 02 — Atom specialised via typed config.
 *
 * Most atoms expose a `config { ... }` block (modal title/icon/mode,
 * tabs/defaultTab/variant, browse fields, etc.). The factory's
 * `Params.config` is now a typed interface (`StdModalConfig`) generated
 * from the .orb's config schema, so the agent fills in fields it knows
 * are legal.
 *
 * Here the modal opens for "edit" mode by default and uses a
 * domain-specific icon + title — without modifying the trait's
 * state-machine topology.
 */
import { stdModal, type StdModalConfig } from '@almadar/std/behaviors/functions';
import { makeSchema } from '@almadar/core/builders';
import type { OrbitalSchema } from '@almadar/core/types';

const articleEditConfig: StdModalConfig = {
  icon: 'pencil',
  title: 'Edit Article',
  mode: 'edit',
  fields: ['title', 'content'],
};

export const schema: OrbitalSchema = makeSchema(
  'recipe-02-atom-with-config',
  stdModal({
    entityName: 'Article',
    fields: [
      { name: 'id', type: 'string', required: true },
      { name: 'title', type: 'string', required: true },
      { name: 'content', type: 'string' },
      { name: 'pendingId', type: 'string', default: '' },
    ],
    config: articleEditConfig,
  }),
);
