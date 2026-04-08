/**
 * std-flip-card
 *
 * Flip card atom for flashcard-style front/back content.
 * Absorbs: flip-container, flip-card.
 *
 * @level atom
 * @family flip-card
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

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdFlipCardParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  headerIcon?: string;
  pageTitle?: string;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface FlipCardConfig {
  entityName: string;
  fields: EntityField[];
  displayField: string;
  secondaryField: string;
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  headerIcon: string;
  pageTitle: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdFlipCardParams): FlipCardConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'question') ? [] : [{ name: 'question', type: 'string' as const, default: '' }]),
    ...(baseFields.some(f => f.name === 'answer') ? [] : [{ name: 'answer', type: 'string' as const, default: '' }]),
  ];
  const nonIdFields = baseFields.filter(f => f.name !== 'id');
  const p = plural(entityName);

  return {
    entityName,
    fields,
    displayField: nonIdFields[0]?.name ?? 'id',
    secondaryField: nonIdFields[1]?.name ?? nonIdFields[0]?.name ?? 'id',
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}FlipCard`,
    pluralName: p,
    headerIcon: params.headerIcon ?? 'rotate-3d',
    pageTitle: params.pageTitle ?? `${p} Flashcards`,
    pageName: params.pageName ?? `${entityName}FlipCardPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/flashcards`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

const ef = (field: string): unknown[] => ['object/get', ['array/first', '@entity'], field];

function buildEntity(c: FlipCardConfig): Entity {
  const instances = [
    { id: 'fc-1', name: 'What is photosynthesis?', description: 'The process by which plants convert sunlight into energy', status: 'active', createdAt: '2026-01-01', question: 'What is photosynthesis?', answer: 'The process by which green plants use sunlight to synthesize foods from carbon dioxide and water.' },
    { id: 'fc-2', name: 'What is the speed of light?', description: '299,792,458 meters per second', status: 'active', createdAt: '2026-01-02', question: 'What is the speed of light?', answer: 'Approximately 299,792,458 meters per second in a vacuum.' },
    { id: 'fc-3', name: 'What is DNA?', description: 'Deoxyribonucleic acid', status: 'active', createdAt: '2026-01-03', question: 'What is DNA?', answer: 'Deoxyribonucleic acid, the molecule that carries genetic instructions for life.' },
  ];
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, instances });
}

function buildTrait(c: FlipCardConfig): Trait {
  const { entityName, displayField, secondaryField, headerIcon, pageTitle } = c;

  const frontFace = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'icon', name: 'help-circle', size: 'lg' },
      { type: 'typography', variant: 'h3', content: ef(displayField) },
      { type: 'typography', variant: 'caption', color: 'muted', content: 'Tap to reveal answer' },
    ],
  };

  const backFace = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'icon', name: 'lightbulb', size: 'lg' },
      { type: 'typography', variant: 'h3', content: ef(secondaryField) },
      { type: 'badge', label: 'Answer' },
    ],
  };

  const frontView = {
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
      {
        type: 'flip-card',
        front: frontFace,
        back: backFace,
        flipped: false,
      },
      { type: 'button', label: 'Flip', event: 'FLIP', variant: 'primary', icon: 'rotate-3d' },
    ],
  };

  const backView = {
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
      {
        type: 'flip-card',
        front: frontFace,
        back: backFace,
        flipped: true,
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'Flip Back', event: 'FLIP_BACK', variant: 'ghost', icon: 'rotate-3d' },
          { type: 'button', label: 'Next', event: 'NEXT', variant: 'primary', icon: 'arrow-right' },
        ],
      },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'front', isInitial: true },
        { name: 'back' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'FLIP', name: 'Flip Card' },
        { key: 'FLIP_BACK', name: 'Flip Back' },
        { key: 'NEXT', name: 'Next Card' },
      ],
      transitions: [
        { from: 'front', to: 'front', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', frontView]] },
        { from: 'front', to: 'back', event: 'FLIP', effects: [['render-ui', 'main', backView]] },
        { from: 'back', to: 'front', event: 'FLIP_BACK', effects: [['render-ui', 'main', frontView]] },
        { from: 'back', to: 'front', event: 'NEXT', effects: [['fetch', entityName], ['render-ui', 'main', frontView]] },
      ],
    },
  } as Trait;
}

function buildPage(c: FlipCardConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdFlipCardEntity(params: StdFlipCardParams): Entity { return buildEntity(resolve(params)); }
export function stdFlipCardTrait(params: StdFlipCardParams): Trait { return buildTrait(resolve(params)); }
export function stdFlipCardPage(params: StdFlipCardParams): Page { return buildPage(resolve(params)); }

export function stdFlipCard(params: StdFlipCardParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
