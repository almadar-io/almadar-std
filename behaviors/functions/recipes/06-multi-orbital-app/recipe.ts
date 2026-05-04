/**
 * Recipe 06 — Multi-orbital app.
 *
 * Two orbitals — Articles and Comments — each owning a browse + modal
 * pair on its own entity. When the SAME atom is imported into multiple
 * orbitals in one schema, the agent must give each orbital a DISTINCT
 * name (and each page a distinct path) — the canonical atom-derived
 * names like `ModalRecordOrbital` / `ModalRecordModalPage` would
 * collide otherwise.
 *
 * Each orbital pairs `stdBrowseTrait` (for the initial visible list)
 * with `stdModalTrait` (for create/edit). The browse partner is what
 * makes the page render on land — without it the orbital would mount
 * a modal with no host content and the recipe would feel empty.
 *
 * The standard composition shape per orbital:
 *   - `stdBrowseTrait(...)` for the list view,
 *   - `stdModalTrait(...)` for the create/edit modal,
 *   - inline page with a distinct `name:` + `path:` and `traits:` that
 *     bind both the browse and the modal,
 *   - `makeOrbitalWithUses({ name, uses, entity, traits, pages })` to
 *     give the orbital a distinct name.
 *
 * Whenever the agent imports the same atoms twice, this is the recipe.
 */
import {
  stdBrowseTrait,
  stdModalTrait,
} from '@almadar/std/behaviors/functions';
import {
  makeSchema,
  makeOrbitalWithUses,
} from '@almadar/core/builders';
import type { OrbitalSchema, Entity } from '@almadar/core/types';

const articleEntity: Entity = {
  name: 'Article',
  fields: [
    { name: 'id', type: 'string', required: true },
    { name: 'title', type: 'string', required: true },
    { name: 'pendingId', type: 'string', default: '' },
  ],
};

const commentEntity: Entity = {
  name: 'Comment',
  fields: [
    { name: 'id', type: 'string', required: true },
    { name: 'body', type: 'string', required: true },
    { name: 'articleId', type: 'string' },
    { name: 'pendingId', type: 'string', default: '' },
  ],
};

export const schema: OrbitalSchema = makeSchema(
  'recipe-06-multi-orbital',
  makeOrbitalWithUses({
    name: 'ArticleOrbital',
    uses: [
      { from: 'std/behaviors/std-browse', as: 'Browse' },
      { from: 'std/behaviors/std-modal', as: 'Modal' },
    ],
    entity: articleEntity,
    traits: [
      stdBrowseTrait({
        entityName: 'Article',
        traitName: 'ArticleBrowse',
        config: {
          fields: [{ name: 'title', label: 'Title' }],
          pageSize: 10,
        },
      }),
      stdModalTrait({
        entityName: 'Article',
        traitName: 'ArticleEditor',
      }),
    ],
    pages: [
      {
        name: 'ArticleHubPage',
        path: '/articles',
        traits: [
          { ref: 'ArticleBrowse' },
          { ref: 'ArticleEditor' },
        ],
      },
    ],
  }),
  makeOrbitalWithUses({
    name: 'CommentOrbital',
    uses: [
      { from: 'std/behaviors/std-browse', as: 'Browse' },
      { from: 'std/behaviors/std-modal', as: 'Modal' },
    ],
    entity: commentEntity,
    traits: [
      stdBrowseTrait({
        entityName: 'Comment',
        traitName: 'CommentBrowse',
        config: {
          fields: [{ name: 'body', label: 'Body' }],
          pageSize: 10,
        },
      }),
      stdModalTrait({
        entityName: 'Comment',
        traitName: 'CommentEditor',
      }),
    ],
    pages: [
      {
        name: 'CommentHubPage',
        path: '/comments',
        traits: [
          { ref: 'CommentBrowse' },
          { ref: 'CommentEditor' },
        ],
      },
    ],
  }),
);
