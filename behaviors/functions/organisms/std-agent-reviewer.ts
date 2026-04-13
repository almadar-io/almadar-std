/**
 * std-agent-reviewer
 *
 * Schema/code reviewer organism. Composes RAG molecule + classifier atom
 * to classify input, search for relevant patterns, recall best practices,
 * and generate structured review output with tabbed views and an issues browse.
 *
 * Composed from:
 * - stdAgentRag (molecule): retrieval-augmented generation pipeline
 * - stdAgentClassifier: classifies input type (schema, component, trait, etc.)
 * - stdAgentCompletion: generates review with scoring
 * - stdTabs: Input / Analysis / Review tab navigation
 * - stdBrowse: browsable issues list
 *
 * Cross-trait events:
 * - CLASSIFIED (Classifier -> Reviewer): input classified, begin review
 * - REVIEW_COMPLETE (Reviewer -> Memory): reinforce recalled best practices
 *
 * Pages: /review (initial), /analysis, /issues
 *
 * @level organism
 * @family agent
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

import type { OrbitalSchema, OrbitalDefinition, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makeOrbital, makePage, ensureIdField, extractTrait, compose } from '@almadar/core/builders';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { stdAgentRag } from '../molecules/std-agent-rag.js';
import { stdAgentClassifier } from '../atoms/std-agent-classifier.js';
import { stdAgentCompletion } from '../atoms/std-agent-completion.js';
import { stdTabs } from '../atoms/std-tabs.js';
import { stdBrowse } from '../atoms/std-browse.js';
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

// ============================================================================
// Trait Builders
// ============================================================================

function buildReviewerTrait(entityName: string): Trait {
  return {
    name: 'ReviewGenerator',
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'REVIEW_COMPLETE', description: 'Review is complete', scope: 'internal' as const, payload: [{ name: 'score', type: 'number' }] },
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

  // 1. Review orbital with inline reviewer trait
  const reviewFields = ensureIdField(params.reviewFields ?? DEFAULT_REVIEW_FIELDS);
  const reviewEntity = makeEntity({ name: 'Review', fields: reviewFields, persistence: 'runtime' });
  const reviewerTrait = buildReviewerTrait('Review');
  const reviewPage = makePage({ name: 'ReviewPage', path: '/review', traitName: 'ReviewGenerator', isInitial: true });
  const reviewOrbital = makeOrbital('ReviewOrbital', reviewEntity, [reviewerTrait], [reviewPage]);

  // 2. RAG molecule for retrieval-augmented context
  const ragOrbital = stdAgentRag({
    entityName: 'ReviewRag',
    persistence: 'runtime',
    pageName: 'RagPage',
    pagePath: '/rag',
  });

  // 3. Classifier atom
  const classifierOrbital = stdAgentClassifier({
    entityName: 'Analysis',
    fields: params.analysisFields,
    categories: ['schema', 'component', 'trait', 'page', 'behavior', 'style'],
    persistence: 'runtime',
    pageName: 'AnalysisPage',
    pagePath: '/analysis',
  });
  const classifierDef = classifierOrbital.orbitals[0] as OrbitalDefinition;
  const classifierTrait = (classifierDef.traits as Trait[])[0];
  classifierTrait.name = 'InputClassifier';
  classifierTrait.emits = [
    { event: 'CLASSIFIED', description: 'Input has been classified', scope: 'internal' as const, payload: [{ name: 'category', type: 'string' }] },
  ];

  // 4. Completion atom for review generation
  const completionOrbital = stdAgentCompletion({
    entityName: 'ReviewCompletion',
    persistence: 'runtime',
    pageName: 'CompletionPage',
    pagePath: '/completion',
  });
  const completionDef = completionOrbital.orbitals[0] as OrbitalDefinition;
  const completionTrait = (completionDef.traits as Trait[])[0];
  completionTrait.name = 'ReviewCompletionFlow';

  // 5. UI: tabs for Input / Analysis / Review
  const tabsTrait = extractTrait(stdTabs({
    entityName: 'Review',
    fields: reviewFields,
    tabItems: [
      { label: 'Input', value: 'input' },
      { label: 'Analysis', value: 'analysis' },
      { label: 'Review', value: 'review' },
    ],
    headerIcon: 'file-search',
    pageTitle: 'Code Reviewer',
  }));
  tabsTrait.name = 'ReviewerTabs';
  const tabsEntity = makeEntity({ name: 'ReviewNav', fields: reviewFields, persistence: 'runtime' });
  const tabsOrbital: OrbitalDefinition = makeOrbital('ReviewNavOrbital', tabsEntity, [tabsTrait], [
    makePage({ name: 'ReviewerNavPage', path: '/reviewer/nav', traitName: 'ReviewerTabs' }),
  ]);

  // 6. UI: issues browse list
  const issueFields = ensureIdField([
    { name: 'description', type: 'string', default: '' },
    { name: 'severity', type: 'string', default: 'info' },
    { name: 'line', type: 'number', default: 0 },
  ]);
  const issuesBrowseTrait = extractTrait(stdBrowse({
    entityName: 'ReviewIssue',
    fields: issueFields,
    traitName: 'IssuesBrowse',
    listFields: ['description', 'severity'],
    headerIcon: 'alert-triangle',
    pageTitle: 'Issues',
    emptyTitle: 'No issues found',
    emptyDescription: 'The review found no issues.',
    itemActions: [{ label: 'View', event: 'VIEW' }],
  }));
  issuesBrowseTrait.name = 'IssuesBrowse';
  const issuesEntity = makeEntity({ name: 'ReviewIssue', fields: issueFields, persistence: 'runtime' });
  const issuesOrbital: OrbitalDefinition = makeOrbital('ReviewIssueOrbital', issuesEntity, [issuesBrowseTrait], [
    makePage({ name: 'IssuesPage', path: '/issues', traitName: 'IssuesBrowse' }),
  ]);

  const pages: ComposePage[] = [
    { name: 'ReviewPage', path: '/review', traits: ['ReviewGenerator'], isInitial: true },
    { name: 'RagPage', path: '/rag', traits: ['ReviewRagRag'] },
    { name: 'AnalysisPage', path: '/analysis', traits: ['InputClassifier'] },
    { name: 'CompletionPage', path: '/completion', traits: ['ReviewCompletionFlow'] },
    { name: 'ReviewerNavPage', path: '/reviewer/nav', traits: ['ReviewerTabs'] },
    { name: 'IssuesPage', path: '/issues', traits: ['IssuesBrowse'] },
  ];

  const connections: ComposeConnection[] = [
    {
      from: 'InputClassifier',
      to: 'ReviewGenerator',
      event: { event: 'CLASSIFIED', description: 'Input classified, begin review', payload: [{ name: 'category', type: 'string' }] },
      triggers: 'SUBMIT_REVIEW',
    },
    {
      from: 'ReviewGenerator',
      to: 'IssuesBrowse',
      event: { event: 'REVIEW_COMPLETE', description: 'Refresh issues list with review findings', payload: [{ name: 'score', type: 'number' }] },
      triggers: 'INIT',
    },
  ];

  const schema = compose(
    [reviewOrbital, ragOrbital, classifierOrbital, completionOrbital, tabsOrbital, issuesOrbital],
    pages,
    connections,
    appName,
  );

  const navPages = pages.filter(p => ['/review', '/analysis', '/issues'].includes(p.path));
  return wrapInDashboardLayout(schema, appName, buildNavItems(navPages, {
    review: 'file-search',
    analysis: 'tag',
    issues: 'alert-triangle',
  }));
}
