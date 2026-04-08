/**
 * std-agent-tutor
 *
 * Teaching assistant organism. Composes conversation + memory + classifier
 * atoms with tabbed views and a concept browse list. Classifies student level,
 * recalls prior learning from memory, generates explanations with
 * context-aware difficulty, and tracks concept strength.
 *
 * Composed from:
 * - stdAgentConversation: multi-turn teaching interaction
 * - stdAgentMemory: tracks concept strength per student topic
 * - stdAgentClassifier: classifies student level
 * - stdTabs: Teach / Quiz / Progress tab navigation
 * - stdBrowse: browsable concepts list with strength tracking
 *
 * Cross-trait events:
 * - ASSESSMENT_DONE (Teaching -> Quiz): student assessed, generate quiz
 * - QUIZ_GRADED (Quiz -> Memory): reinforce or decay concept based on answer
 *
 * Pages: /teach (initial), /quiz, /concepts
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
import { stdAgentConversation } from '../atoms/std-agent-conversation.js';
import { stdAgentMemory } from '../atoms/std-agent-memory.js';
import { stdAgentClassifier } from '../atoms/std-agent-classifier.js';
import { stdTabs } from '../atoms/std-tabs.js';
import { stdBrowse } from '../atoms/std-browse.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdAgentTutorParams {
  appName?: string;
  sessionFields?: EntityField[];
  quizFields?: EntityField[];
  memoryFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_SESSION_FIELDS: EntityField[] = [
  { name: 'topic', type: 'string', default: '' },
  { name: 'studentLevel', type: 'string', default: 'unknown' },
  { name: 'explanation', type: 'string', default: '' },
  { name: 'questionsAsked', type: 'number', default: 0 },
  { name: 'correctAnswers', type: 'number', default: 0 },
  { name: 'sessionStatus', type: 'string', default: 'idle' },
  { name: 'error', type: 'string', default: '' },
];

const DEFAULT_QUIZ_FIELDS: EntityField[] = [
  { name: 'question', type: 'string', default: '' },
  { name: 'options', type: 'string', default: '[]' },
  { name: 'correctAnswer', type: 'string', default: '' },
  { name: 'studentAnswer', type: 'string', default: '' },
  { name: 'isCorrect', type: 'boolean', default: false },
  { name: 'feedback', type: 'string', default: '' },
  { name: 'quizStatus', type: 'string', default: 'idle' },
];

// ============================================================================
// UI Builders
// ============================================================================

function teachIdleUI(entityName: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'graduation-cap', size: 'lg' },
          { type: 'typography', content: 'Tutor', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: 'What topic would you like to learn about? The tutor will assess your level and guide you through it.', variant: 'body' },
            { type: 'form-section', entity: entityName, mode: 'edit', submitEvent: 'START_SESSION', fields: ['topic'] },
          ],
        }],
      },
    ],
  };
}

function assessingUI(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'search', size: 'lg' },
      { type: 'typography', content: 'Assessing your level...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
      { type: 'typography', content: 'Recalling prior learning and classifying skill level', variant: 'caption' },
    ],
  };
}

function teachingUI(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', justify: 'space-between',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
            children: [
              { type: 'icon', name: 'book-open', size: 'lg' },
              { type: 'typography', content: 'Lesson: @entity.topic', variant: 'h2' },
            ],
          },
          { type: 'badge', label: '@entity.studentLevel' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: '@entity.explanation', variant: 'body' },
          ],
        }],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'button', label: 'Quiz Me', event: 'START_QUIZ', variant: 'primary', icon: 'help-circle' },
          { type: 'button', label: 'Explain More', event: 'EXPLAIN_MORE', variant: 'secondary', icon: 'book-open' },
          { type: 'button', label: 'New Topic', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
        ],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'xs',
        children: [
          { type: 'badge', label: '@entity.questionsAsked' },
          { type: 'badge', label: '@entity.correctAnswers' },
        ],
      },
    ],
  };
}

function quizIdleUI(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'help-circle', size: 'lg' },
          { type: 'typography', content: 'Quiz', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'typography', content: 'Waiting for a quiz to start...', variant: 'body' },
    ],
  };
}

function quizzingUI(entityName: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'help-circle', size: 'lg' },
          { type: 'typography', content: 'Quiz Question', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: '@entity.question', variant: 'h3' },
            { type: 'typography', content: '@entity.options', variant: 'body' },
            { type: 'form-section', entity: entityName, mode: 'edit', submitEvent: 'SUBMIT_ANSWER', fields: ['studentAnswer'] },
          ],
        }],
      },
    ],
  };
}

function reviewingUI(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'check-circle', size: 'lg' },
          { type: 'typography', content: 'Answer Review', variant: 'h2' },
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
                { type: 'badge', label: '@entity.isCorrect' },
              ],
            },
            { type: 'typography', content: '@entity.feedback', variant: 'body' },
            { type: 'typography', content: 'Correct answer', variant: 'caption' },
            { type: 'typography', content: '@entity.correctAnswer', variant: 'body' },
          ],
        }],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'button', label: 'Next Question', event: 'NEXT_QUESTION', variant: 'primary', icon: 'arrow-right' },
          { type: 'button', label: 'Back to Lesson', event: 'BACK_TO_LESSON', variant: 'ghost', icon: 'book-open' },
        ],
      },
    ],
  };
}

// ============================================================================
// Trait Builders
// ============================================================================

function buildTeachingTrait(entityName: string): Trait {
  return {
    name: 'TeachingSession',
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'ASSESSMENT_DONE', description: 'Student level assessed', scope: 'internal' as const, payload: [{ name: 'level', type: 'string' }] },
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'assessing' },
        { name: 'teaching' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        {
          key: 'START_SESSION', name: 'Start Session',
          payload: [{ name: 'topic', type: 'string', required: true }],
        },
        { key: 'ASSESSMENT_COMPLETE', name: 'Assessment Complete' },
        { key: 'EXPLAIN_MORE', name: 'Explain More' },
        { key: 'START_QUIZ', name: 'Start Quiz' },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', teachIdleUI(entityName)],
          ],
        },
        {
          from: 'idle', to: 'assessing', event: 'START_SESSION',
          effects: [
            ['set', '@entity.topic', '@payload.topic'],
            ['set', '@entity.sessionStatus', 'assessing'],
            ['agent/recall', '@payload.topic'],
            ['agent/generate', '@payload.topic'],
            ['render-ui', 'main', assessingUI()],
          ],
        },
        {
          from: 'assessing', to: 'teaching', event: 'ASSESSMENT_COMPLETE',
          effects: [
            ['set', '@entity.sessionStatus', 'teaching'],
            ['agent/memorize', '@entity.topic', 'student-level'],
            ['emit', 'ASSESSMENT_DONE'],
            ['render-ui', 'main', teachingUI()],
          ],
        },
        {
          from: 'teaching', to: 'teaching', event: 'EXPLAIN_MORE',
          effects: [
            ['agent/generate', '@entity.topic'],
            ['render-ui', 'main', teachingUI()],
          ],
        },
        {
          from: 'teaching', to: 'teaching', event: 'START_QUIZ',
          effects: [
            ['emit', 'ASSESSMENT_DONE'],
            ['render-ui', 'main', teachingUI()],
          ],
        },
        {
          from: 'teaching', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.sessionStatus', 'idle'],
            ['set', '@entity.topic', ''],
            ['set', '@entity.explanation', ''],
            ['set', '@entity.questionsAsked', 0],
            ['set', '@entity.correctAnswers', 0],
            ['render-ui', 'main', teachIdleUI(entityName)],
          ],
        },
      ],
    },
  } as Trait;
}

function buildQuizTrait(entityName: string): Trait {
  return {
    name: 'QuizEngine',
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'QUIZ_GRADED', description: 'Answer graded, reinforce or decay concept', scope: 'internal' as const, payload: [{ name: 'correct', type: 'boolean' }] },
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'quizzing' },
        { name: 'reviewing' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'GENERATE_QUESTION', name: 'Generate Question' },
        { key: 'QUESTION_READY', name: 'Question Ready' },
        {
          key: 'SUBMIT_ANSWER', name: 'Submit Answer',
          payload: [{ name: 'studentAnswer', type: 'string', required: true }],
        },
        { key: 'NEXT_QUESTION', name: 'Next Question' },
        { key: 'BACK_TO_LESSON', name: 'Back to Lesson' },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', quizIdleUI()],
          ],
        },
        {
          from: 'idle', to: 'quizzing', event: 'GENERATE_QUESTION',
          effects: [
            ['set', '@entity.quizStatus', 'generating'],
            ['agent/generate', '@entity.question'],
            ['render-ui', 'main', quizzingUI(entityName)],
          ],
        },
        {
          from: 'quizzing', to: 'quizzing', event: 'QUESTION_READY',
          effects: [
            ['set', '@entity.quizStatus', 'waiting'],
            ['render-ui', 'main', quizzingUI(entityName)],
          ],
        },
        {
          from: 'quizzing', to: 'reviewing', event: 'SUBMIT_ANSWER',
          effects: [
            ['set', '@entity.studentAnswer', '@payload.studentAnswer'],
            ['set', '@entity.quizStatus', 'grading'],
            ['agent/generate', '@payload.studentAnswer'],
            ['emit', 'QUIZ_GRADED'],
            ['render-ui', 'main', reviewingUI()],
          ],
        },
        {
          from: 'reviewing', to: 'quizzing', event: 'NEXT_QUESTION',
          effects: [
            ['set', '@entity.quizStatus', 'generating'],
            ['set', '@entity.studentAnswer', ''],
            ['set', '@entity.feedback', ''],
            ['agent/generate', '@entity.question'],
            ['render-ui', 'main', quizzingUI(entityName)],
          ],
        },
        {
          from: 'reviewing', to: 'idle', event: 'BACK_TO_LESSON',
          effects: [
            ['set', '@entity.quizStatus', 'idle'],
            ['render-ui', 'main', quizIdleUI()],
          ],
        },
      ],
    },
  } as Trait;
}

// ============================================================================
// Organism
// ============================================================================

export function stdAgentTutor(params: StdAgentTutorParams = {}): OrbitalSchema {
  const appName = params.appName ?? 'AI Tutor';

  // 1. Teaching session orbital with inline trait
  const sessionFields = ensureIdField(params.sessionFields ?? DEFAULT_SESSION_FIELDS);
  const sessionEntity = makeEntity({ name: 'TutorSession', fields: sessionFields, persistence: 'runtime' });
  const teachingTrait = buildTeachingTrait('TutorSession');
  const teachPage = makePage({ name: 'TeachPage', path: '/teach', traitName: 'TeachingSession', isInitial: true });
  const sessionOrbital = makeOrbital('TutorSessionOrbital', sessionEntity, [teachingTrait], [teachPage]);

  // 2. Quiz orbital with inline trait
  const quizFields = ensureIdField(params.quizFields ?? DEFAULT_QUIZ_FIELDS);
  const quizEntity = makeEntity({ name: 'QuizQuestion', fields: quizFields, persistence: 'runtime' });
  const quizTrait = buildQuizTrait('QuizQuestion');
  const quizPage = makePage({ name: 'QuizPage', path: '/quiz', traitName: 'QuizEngine' });
  const quizOrbital = makeOrbital('QuizQuestionOrbital', quizEntity, [quizTrait], [quizPage]);

  // 3. Conversation atom for multi-turn dialogue
  const conversationOrbital = stdAgentConversation({
    entityName: 'TutorChat',
    persistence: 'runtime',
    pageName: 'TeachPage',
    pagePath: '/teach',
    isInitial: true,
  });
  const convTrait = (conversationOrbital.traits as Trait[])[0];
  convTrait.name = 'TutorConversation';

  // 4. Memory atom for concept tracking
  const memoryOrbital = stdAgentMemory({
    entityName: 'Concept',
    fields: params.memoryFields,
    persistence: 'persistent',
    pageName: 'ConceptsPage',
    pagePath: '/concepts',
  });

  // 5. Classifier atom for student level assessment
  const classifierOrbital = stdAgentClassifier({
    entityName: 'StudentAssessment',
    categories: ['beginner', 'intermediate', 'advanced', 'expert'],
    persistence: 'runtime',
    pageName: 'AssessmentPage',
    pagePath: '/assessment',
  });
  const clsTrait = (classifierOrbital.traits as Trait[])[0];
  clsTrait.name = 'LevelClassifier';

  // 6. UI: tabs for Teach / Quiz / Progress navigation
  const tabsTrait = extractTrait(stdTabs({
    entityName: 'TutorSession',
    fields: sessionFields,
    tabItems: [
      { label: 'Teach', value: 'teach' },
      { label: 'Quiz', value: 'quiz' },
      { label: 'Progress', value: 'progress' },
    ],
    headerIcon: 'graduation-cap',
    pageTitle: 'AI Tutor',
  }));
  tabsTrait.name = 'TutorTabs';
  const tabsEntity = makeEntity({ name: 'TutorNav', fields: sessionFields, persistence: 'runtime' });
  const tabsOrbital: OrbitalDefinition = makeOrbital('TutorNavOrbital', tabsEntity, [tabsTrait], [
    makePage({ name: 'TutorNavPage', path: '/tutor/nav', traitName: 'TutorTabs' }),
  ]);

  // 7. UI: concepts browse list
  const conceptFields = ensureIdField([
    { name: 'content', type: 'string', default: '' },
    { name: 'category', type: 'string', default: '' },
    { name: 'strength', type: 'number', default: 0 },
  ]);
  const conceptsBrowseTrait = extractTrait(stdBrowse({
    entityName: 'Concept',
    fields: conceptFields,
    traitName: 'ConceptsBrowse',
    listFields: ['content', 'category', 'strength'],
    headerIcon: 'brain',
    pageTitle: 'Learned Concepts',
    emptyTitle: 'No concepts yet',
    emptyDescription: 'Complete lessons and quizzes to build your concept library.',
    itemActions: [{ label: 'View', event: 'VIEW' }],
  }));
  conceptsBrowseTrait.name = 'ConceptsBrowse';
  const conceptsEntity = makeEntity({ name: 'ConceptView', fields: conceptFields, persistence: 'persistent' });
  const conceptsOrbital: OrbitalDefinition = makeOrbital('ConceptViewOrbital', conceptsEntity, [conceptsBrowseTrait], [
    makePage({ name: 'ConceptsViewPage', path: '/tutor/concepts', traitName: 'ConceptsBrowse' }),
  ]);

  const pages: ComposePage[] = [
    { name: 'TeachPage', path: '/teach', traits: ['TeachingSession'], isInitial: true },
    { name: 'ChatPage', path: '/chat', traits: ['TutorConversation'] },
    { name: 'AssessmentPage', path: '/assessment', traits: ['LevelClassifier'] },
    { name: 'TutorNavPage', path: '/tutor/nav', traits: ['TutorTabs'] },
    { name: 'QuizPage', path: '/quiz', traits: ['QuizEngine'] },
    { name: 'ConceptsPage', path: '/concepts', traits: ['ConceptBrowse', 'ConceptCreate', 'ConceptAgent'] },
    { name: 'ConceptsViewPage', path: '/tutor/concepts', traits: ['ConceptsBrowse'] },
  ];

  const connections: ComposeConnection[] = [
    {
      from: 'TeachingSession',
      to: 'QuizEngine',
      event: { event: 'ASSESSMENT_DONE', description: 'Student assessed, generate quiz', payload: [{ name: 'level', type: 'string' }] },
      triggers: 'GENERATE_QUESTION',
    },
    {
      from: 'QuizEngine',
      to: 'ConceptAgent',
      event: { event: 'QUIZ_GRADED', description: 'Reinforce or decay concept based on answer', payload: [{ name: 'correct', type: 'boolean' }] },
      triggers: 'REINFORCE',
    },
  ];

  const schema = compose(
    [sessionOrbital, quizOrbital, conversationOrbital, memoryOrbital, classifierOrbital, tabsOrbital, conceptsOrbital],
    pages,
    connections,
    appName,
  );

  const navPages = pages.filter(p => ['/teach', '/quiz', '/concepts'].includes(p.path));
  return wrapInDashboardLayout(schema, appName, buildNavItems(navPages, {
    teach: 'book-open',
    quiz: 'help-circle',
    concepts: 'brain',
  }));
}
