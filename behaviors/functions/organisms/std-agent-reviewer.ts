/**
 * std-agent-reviewer
 *
 * Schema/code reviewer organism. Classifies input, searches for relevant
 * patterns via RAG, recalls best practices from memory, and generates
 * structured review output with issues, suggestions, and a score.
 *
 * Composed from:
 * - inline ClassifierTrait: classifies input type (schema, component, trait, etc.)
 * - inline ReviewerTrait: RAG-powered review generation with scoring
 * - stdAgentMemory: best practices recall and reinforcement
 *
 * Cross-trait events:
 * - CLASSIFIED (Classifier -> Reviewer): input classified, begin review
 * - REVIEW_COMPLETE (Reviewer -> Memory): reinforce recalled best practices
 *
 * Pages: /review (initial), /analysis, /practices
 *
 * @level organism
 * @family agent
 * @packageDocumentation
 */

import type { OrbitalSchema, OrbitalDefinition, Entity, Trait, Page, EntityField } from '@almadar/core/types';
import { makeEntity, makeOrbital, makePage, ensureIdField, compose } from '@almadar/core/builders';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { stdAgentMemory } from '../atoms/std-agent-memory.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdAgentReviewerParams {
  appName?: string;
  reviewFields?: EntityField[];
  analysisFields?: EntityField[];
  memoryFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_REVIEW_FIELDS: EntityField[] = [
  { name: 'target', type: 'string', default: '' },
  { name: 'category', type: 'string', default: '' },
  { name: 'issues', type: 'string', default: '[]' },
  { name: 'suggestions', type: 'string', default: '[]' },
  { name: 'score', type: 'number', default: 0 },
  { name: 'reviewStatus', type: 'string', default: 'idle' },
  { name: 'error', type: 'string', default: '' },
];

const DEFAULT_ANALYSIS_FIELDS: EntityField[] = [
  { name: 'inputText', type: 'string', default: '' },
  { name: 'detectedCategory', type: 'string', default: '' },
  { name: 'confidence', type: 'number', default: 0 },
  { name: 'classifyStatus', type: 'string', default: 'idle' },
];

// ============================================================================
// UI Builders
// ============================================================================

function reviewIdleUI(entityName: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'file-search', size: 'lg' },
          { type: 'typography', content: 'Code Review', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: 'Paste schema or code to review. The agent will classify, search for patterns, and generate a structured review.', variant: 'body' },
            { type: 'form-section', entity: entityName, mode: 'edit', submitEvent: 'SUBMIT_REVIEW', fields: ['target'] },
          ],
        }],
      },
    ],
  };
}

function analyzingUI(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'search', size: 'lg' },
      { type: 'typography', content: 'Analyzing input...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
      { type: 'typography', content: 'Classifying and searching for patterns', variant: 'caption' },
    ],
  };
}

function reviewingUI(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'cpu', size: 'lg' },
      { type: 'typography', content: 'Generating review...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
      { type: 'typography', content: 'Category: @entity.category', variant: 'caption' },
    ],
  };
}

function completedUI(entityName: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', justify: 'space-between',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
            children: [
              { type: 'icon', name: 'check-circle', size: 'lg' },
              { type: 'typography', content: 'Review Complete', variant: 'h2' },
            ],
          },
          { type: 'badge', label: '@entity.score' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            {
              type: 'stack', direction: 'horizontal', gap: 'sm',
              children: [
                { type: 'badge', label: '@entity.category' },
                { type: 'badge', label: '@entity.reviewStatus' },
              ],
            },
            { type: 'typography', content: 'Issues', variant: 'h4' },
            { type: 'typography', content: '@entity.issues', variant: 'body' },
            { type: 'divider' },
            { type: 'typography', content: 'Suggestions', variant: 'h4' },
            { type: 'typography', content: '@entity.suggestions', variant: 'body' },
          ],
        }],
      },
      { type: 'button', label: 'New Review', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };
}

function classifierIdleUI(entityName: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'tag', size: 'lg' },
          { type: 'typography', content: 'Input Analysis', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: 'Category', variant: 'caption' },
            { type: 'typography', content: '@entity.detectedCategory', variant: 'h3' },
            { type: 'typography', content: 'Confidence', variant: 'caption' },
            { type: 'typography', content: '@entity.confidence', variant: 'body' },
          ],
        }],
      },
    ],
  };
}

// ============================================================================
// Trait Builders
// ============================================================================

function buildClassifierOrbital(fields: EntityField[]): OrbitalDefinition {
  const entityName = 'Analysis';
  const allFields = ensureIdField(fields);
  const entity = makeEntity({ name: entityName, fields: allFields, persistence: 'runtime' });

  const trait: Trait = {
    name: 'InputClassifier',
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'CLASSIFIED', description: 'Input has been classified', scope: 'internal' },
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'classifying' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        {
          key: 'CLASSIFY', name: 'Classify',
          payload: [{ name: 'inputText', type: 'string', required: true }],
        },
        { key: 'CLASSIFICATION_DONE', name: 'Classification Done' },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', classifierIdleUI(entityName)],
          ],
        },
        {
          from: 'idle', to: 'classifying', event: 'CLASSIFY',
          effects: [
            ['set', '@entity.inputText', '@payload.inputText'],
            ['set', '@entity.classifyStatus', 'classifying'],
            ['agent/generate', '@payload.inputText'],
            ['render-ui', 'main', analyzingUI()],
          ],
        },
        {
          from: 'classifying', to: 'idle', event: 'CLASSIFICATION_DONE',
          effects: [
            ['set', '@entity.classifyStatus', 'done'],
            ['emit', 'CLASSIFIED'],
            ['render-ui', 'main', classifierIdleUI(entityName)],
          ],
        },
      ],
    },
  } as Trait;

  const page = makePage({ name: 'AnalysisPage', path: '/analysis', traitName: 'InputClassifier' });
  return makeOrbital('AnalysisOrbital', entity, [trait], [page]);
}

function buildReviewerTrait(entityName: string): Trait {
  return {
    name: 'ReviewGenerator',
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'REVIEW_COMPLETE', description: 'Review is complete', scope: 'internal' },
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'analyzing' },
        { name: 'reviewing' },
        { name: 'completed' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        {
          key: 'SUBMIT_REVIEW', name: 'Submit Review',
          payload: [{ name: 'target', type: 'string', required: true }],
        },
        { key: 'PATTERNS_FOUND', name: 'Patterns Found' },
        { key: 'REVIEW_GENERATED', name: 'Review Generated' },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', reviewIdleUI(entityName)],
          ],
        },
        {
          from: 'idle', to: 'analyzing', event: 'SUBMIT_REVIEW',
          effects: [
            ['set', '@entity.target', '@payload.target'],
            ['set', '@entity.reviewStatus', 'analyzing'],
            ['agent/recall', '@payload.target'],
            ['agent/search-code', '@payload.target'],
            ['render-ui', 'main', analyzingUI()],
          ],
        },
        {
          from: 'analyzing', to: 'reviewing', event: 'PATTERNS_FOUND',
          effects: [
            ['set', '@entity.reviewStatus', 'reviewing'],
            ['agent/generate', '@entity.target'],
            ['render-ui', 'main', reviewingUI()],
          ],
        },
        {
          from: 'reviewing', to: 'completed', event: 'REVIEW_GENERATED',
          effects: [
            ['set', '@entity.reviewStatus', 'completed'],
            ['agent/memorize', '@entity.target', 'review-pattern'],
            ['emit', 'REVIEW_COMPLETE'],
            ['render-ui', 'main', completedUI(entityName)],
          ],
        },
        {
          from: 'completed', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.reviewStatus', 'idle'],
            ['set', '@entity.target', ''],
            ['set', '@entity.issues', '[]'],
            ['set', '@entity.suggestions', '[]'],
            ['set', '@entity.score', 0],
            ['render-ui', 'main', reviewIdleUI(entityName)],
          ],
        },
      ],
    },
  } as Trait;
}

// ============================================================================
// Organism
// ============================================================================

export function stdAgentReviewer(params: StdAgentReviewerParams = {}): OrbitalSchema {
  const appName = params.appName ?? 'Code Reviewer';

  // Review orbital with inline reviewer trait
  const reviewFields = ensureIdField(params.reviewFields ?? DEFAULT_REVIEW_FIELDS);
  const reviewEntity = makeEntity({ name: 'Review', fields: reviewFields, persistence: 'runtime' });
  const reviewerTrait = buildReviewerTrait('Review');
  const reviewPage = makePage({ name: 'ReviewPage', path: '/review', traitName: 'ReviewGenerator', isInitial: true });
  const reviewOrbital = makeOrbital('ReviewOrbital', reviewEntity, [reviewerTrait], [reviewPage]);

  // Classifier orbital
  const classifierOrbital = buildClassifierOrbital(params.analysisFields ?? DEFAULT_ANALYSIS_FIELDS);

  // Best practices memory from atom
  const memoryOrbital = stdAgentMemory({
    entityName: 'Practice',
    fields: params.memoryFields,
    persistence: 'persistent',
    pageName: 'PracticesPage',
    pagePath: '/practices',
  });

  const pages: ComposePage[] = [
    { name: 'ReviewPage', path: '/review', traits: ['ReviewGenerator'], isInitial: true },
    { name: 'AnalysisPage', path: '/analysis', traits: ['InputClassifier'] },
    { name: 'PracticesPage', path: '/practices', traits: ['PracticeLifecycle'] },
  ];

  const connections: ComposeConnection[] = [
    {
      from: 'InputClassifier',
      to: 'ReviewGenerator',
      event: { event: 'CLASSIFIED', description: 'Input classified, begin review' },
      triggers: 'SUBMIT_REVIEW',
    },
    {
      from: 'ReviewGenerator',
      to: 'PracticeLifecycle',
      event: { event: 'REVIEW_COMPLETE', description: 'Reinforce recalled best practices' },
      triggers: 'REINFORCE',
    },
  ];

  const schema = compose([reviewOrbital, classifierOrbital, memoryOrbital], pages, connections, appName);

  return wrapInDashboardLayout(schema, appName, buildNavItems(pages, {
    review: 'file-search',
    analysis: 'tag',
    practices: 'brain',
  }));
}
