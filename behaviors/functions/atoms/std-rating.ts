/**
 * std-rating
 *
 * Rating atom with star-rating input and display.
 * Absorbs: star-rating.
 *
 * @level atom
 * @family rating
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

import type { OrbitalDefinition, OrbitalSchema, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, makeSchema, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdRatingParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  headerIcon?: string;
  pageTitle?: string;
  maxRating?: number;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface RatingConfig {
  entityName: string;
  fields: EntityField[];
  displayField: string;
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  headerIcon: string;
  pageTitle: string;
  maxRating: number;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdRatingParams): RatingConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'rating') ? [] : [{ name: 'rating', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'comment') ? [] : [{ name: 'comment', type: 'string' as const, default: '' }]),
  ];
  const nonIdFields = baseFields.filter(f => f.name !== 'id');
  const p = plural(entityName);

  return {
    entityName,
    fields,
    displayField: nonIdFields[0]?.name ?? 'id',
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Rating`,
    pluralName: p,
    headerIcon: params.headerIcon ?? 'star',
    pageTitle: params.pageTitle ?? 'Rating',
    maxRating: params.maxRating ?? 5,
    pageName: params.pageName ?? `${entityName}RatingPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/rating`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

const ef = (field: string): unknown[] => ['object/get', ['array/first', '@entity'], field];

function buildEntity(c: RatingConfig): Entity {
  const instances = [
    { id: 'rev-1', name: 'Great product', description: 'Exceeded expectations', status: 'active', createdAt: '2026-01-10', rating: 4, comment: 'Really solid quality' },
  ];
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, instances });
}

function buildTrait(c: RatingConfig): Trait {
  const { entityName, headerIcon, pageTitle, maxRating } = c;

  const idleView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: pageTitle, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'typography', variant: 'body', color: 'muted', content: 'How would you rate this?' },
      { type: 'star-rating', value: ef('rating'), max: maxRating, event: 'RATE', size: 'lg' },
      { type: 'button', label: 'Submit Rating', event: 'RATE', variant: 'primary', icon: 'star' },
    ],
  };

  const ratedView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'check-circle', size: 'lg' },
          { type: 'typography', content: 'Thank You!', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'star-rating', value: ef('rating'), max: maxRating, readOnly: true, size: 'lg' },
      { type: 'alert', variant: 'success', message: 'Your rating has been recorded.' },
      { type: 'button', label: 'Rate Again', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'rated' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'RATE', name: 'Rate', payload: [{ name: 'rating', type: 'number', required: true }] },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions: [
        { from: 'idle', to: 'idle', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', idleView]] },
        { from: 'idle', to: 'rated', event: 'RATE', effects: [['set', '@entity.rating', '@payload.rating'], ['render-ui', 'main', ratedView]] },
        { from: 'rated', to: 'idle', event: 'RESET', effects: [['set', '@entity.rating', 0], ['render-ui', 'main', idleView]] },
      ],
    },
  } as Trait;
}

function buildPage(c: RatingConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdRatingEntity(params: StdRatingParams): Entity { return buildEntity(resolve(params)); }
export function stdRatingTrait(params: StdRatingParams): Trait { return buildTrait(resolve(params)); }
export function stdRatingPage(params: StdRatingParams): Page { return buildPage(resolve(params)); }

export function stdRating(params: StdRatingParams): OrbitalSchema {
  const c = resolve(params);
  return makeSchema(`${c.entityName}Orbital`, makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]));
}
