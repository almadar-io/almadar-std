/**
 * std-quiz
 *
 * Quiz molecule composing flip-card atom with question/answer flow.
 * Absorbs: quiz-block.
 *
 * @level molecule
 * @family quiz
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

export interface StdQuizParams {
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

interface QuizConfig {
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

function resolve(params: StdQuizParams): QuizConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'question') ? [] : [{ name: 'question', type: 'string' as const, default: '' }]),
    ...(baseFields.some(f => f.name === 'answer') ? [] : [{ name: 'answer', type: 'string' as const, default: '' }]),
    ...(baseFields.some(f => f.name === 'optionA') ? [] : [{ name: 'optionA', type: 'string' as const, default: '' }]),
    ...(baseFields.some(f => f.name === 'optionB') ? [] : [{ name: 'optionB', type: 'string' as const, default: '' }]),
    ...(baseFields.some(f => f.name === 'optionC') ? [] : [{ name: 'optionC', type: 'string' as const, default: '' }]),
    ...(baseFields.some(f => f.name === 'optionD') ? [] : [{ name: 'optionD', type: 'string' as const, default: '' }]),
    ...(baseFields.some(f => f.name === 'difficulty') ? [] : [{ name: 'difficulty', type: 'string' as const, default: 'medium' }]),
    ...(baseFields.some(f => f.name === 'currentIndex') ? [] : [{ name: 'currentIndex', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'totalQuestions') ? [] : [{ name: 'totalQuestions', type: 'number' as const, default: 3 }]),
  ];
  const nonIdFields = baseFields.filter(f => f.name !== 'id');
  const p = plural(entityName);

  return {
    entityName,
    fields,
    displayField: nonIdFields[0]?.name ?? 'id',
    secondaryField: nonIdFields[1]?.name ?? nonIdFields[0]?.name ?? 'id',
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Quiz`,
    pluralName: p,
    headerIcon: params.headerIcon ?? 'help-circle',
    pageTitle: params.pageTitle ?? 'Quiz',
    pageName: params.pageName ?? `${entityName}QuizPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/quiz`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

const ef = (field: string): unknown[] => ['object/get', ['array/first', '@entity'], field];

function buildEntity(c: QuizConfig): Entity {
  const instances = [
    { id: 'q-1', name: 'What planet is closest to the Sun?', description: 'Mercury', status: 'active', createdAt: '2026-01-01', question: 'What planet is closest to the Sun?', answer: 'Mercury', optionA: 'Mercury', optionB: 'Venus', optionC: 'Mars', optionD: 'Earth', difficulty: 'easy', currentIndex: 0, totalQuestions: 3 },
    { id: 'q-2', name: 'What is the chemical symbol for gold?', description: 'Au', status: 'active', createdAt: '2026-01-02', question: 'What is the chemical symbol for gold?', answer: 'Au', optionA: 'Ag', optionB: 'Au', optionC: 'Fe', optionD: 'Cu', difficulty: 'medium', currentIndex: 0, totalQuestions: 3 },
    { id: 'q-3', name: 'Who painted the Mona Lisa?', description: 'Leonardo da Vinci', status: 'active', createdAt: '2026-01-03', question: 'Who painted the Mona Lisa?', answer: 'Leonardo da Vinci', optionA: 'Michelangelo', optionB: 'Raphael', optionC: 'Leonardo da Vinci', optionD: 'Donatello', difficulty: 'easy', currentIndex: 0, totalQuestions: 3 },
  ];
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, instances });
}

function buildTrait(c: QuizConfig): Trait {
  const { entityName, displayField, secondaryField, headerIcon, pageTitle } = c;

  const questionView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
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
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
          children: [
            { type: 'icon', name: 'help-circle', size: 'lg' },
            { type: 'typography', variant: 'h3', content: ef(displayField) },
          ],
        }],
      },
      {
        type: 'simple-grid', columns: 2,
        children: [
          { type: 'button', label: ef('optionA'), event: 'ANSWER', variant: 'secondary', actionPayload: { answer: 'A' } },
          { type: 'button', label: ef('optionB'), event: 'ANSWER', variant: 'secondary', actionPayload: { answer: 'B' } },
          { type: 'button', label: ef('optionC'), event: 'ANSWER', variant: 'secondary', actionPayload: { answer: 'C' } },
          { type: 'button', label: ef('optionD'), event: 'ANSWER', variant: 'secondary', actionPayload: { answer: 'D' } },
        ],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center', justify: 'space-between',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
            children: [
              { type: 'icon', name: 'signal', size: 'sm' },
              { type: 'typography', variant: 'caption', color: 'muted', content: 'Difficulty:' },
              { type: 'badge', label: ef('difficulty') },
            ],
          },
          {
            type: 'stack', direction: 'horizontal', gap: 'xs', align: 'center',
            children: [
              { type: 'typography', variant: 'caption', color: 'muted', content: 'Question' },
              { type: 'typography', variant: 'caption', content: ['+', ['or', ef('currentIndex'), 0], 1] },
              { type: 'typography', variant: 'caption', color: 'muted', content: 'of' },
              { type: 'typography', variant: 'caption', content: ['or', ef('totalQuestions'), 0] },
            ],
          },
        ],
      },
    ],
  };

  const revealedView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: 'Answer Revealed', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', variant: 'caption', color: 'muted', content: 'Question' },
            { type: 'typography', variant: 'body', content: ef(displayField) },
            { type: 'divider' },
            { type: 'typography', variant: 'caption', color: 'muted', content: 'Answer' },
            { type: 'typography', variant: 'h3', content: ef(secondaryField) },
          ],
        }],
      },
      { type: 'alert', variant: 'info', message: 'Review the answer above.' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'Next Question', event: 'NEXT', variant: 'primary', icon: 'arrow-right' },
        ],
      },
    ],
  };

  const completeView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'typography', content: 'Quiz Complete!', variant: 'h2' },
      { type: 'alert', variant: 'success', message: 'You have completed all questions.' },
      { type: 'button', label: 'Restart', event: 'RESTART', variant: 'primary', icon: 'rotate-ccw' },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'question', isInitial: true },
        { name: 'answer-revealed' },
        { name: 'complete' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'ANSWER', name: 'Answer', payload: [{ name: 'answer', type: 'string', required: true }] },
        { key: 'NEXT', name: 'Next Question' },
        { key: 'RESTART', name: 'Restart' },
      ],
      transitions: [
        { from: 'question', to: 'question', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', questionView]] },
        { from: 'question', to: 'answer-revealed', event: 'ANSWER', effects: [['render-ui', 'main', revealedView]] },
        { from: 'answer-revealed', to: 'question', event: 'NEXT', effects: [
          ['set', '@entity.currentIndex', ['+', '@entity.currentIndex', 1]],
          ['fetch', entityName],
          ['render-ui', 'main', questionView],
        ] },
        { from: 'answer-revealed', to: 'complete', event: 'RESTART', effects: [['render-ui', 'main', completeView]] },
        { from: 'complete', to: 'question', event: 'RESTART', effects: [['fetch', entityName], ['render-ui', 'main', questionView]] },
      ],
    },
  } as Trait;
}

function buildPage(c: QuizConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdQuizEntity(params: StdQuizParams): Entity { return buildEntity(resolve(params)); }
export function stdQuizTrait(params: StdQuizParams): Trait { return buildTrait(resolve(params)); }
export function stdQuizPage(params: StdQuizParams): Page { return buildPage(resolve(params)); }

export function stdQuiz(params: StdQuizParams): OrbitalSchema {
  const c = resolve(params);
  return makeSchema(`${c.entityName}Orbital`, makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]));
}
