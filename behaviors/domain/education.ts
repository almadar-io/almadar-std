/**
 * Education Domain Behaviors
 *
 * Standard behaviors for education: quizzes, progress tracking,
 * grading, and curriculum browsing.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * UI Composition: molecule-first (atoms + molecules only, no organisms).
 * Each behavior has unique, domain-appropriate layouts composed with
 * VStack/HStack/Box wrappers around atoms and molecules.
 *
 * @packageDocumentation
 */

import type { BehaviorSchema, BehaviorEffect } from '../types.js';

// ── Shared Education Theme ──────────────────────────────────────────

const EDUCATION_THEME = {
  name: 'education-blue',
  tokens: {
    colors: {
      primary: '#2563eb',
      'primary-hover': '#1d4ed8',
      'primary-foreground': '#ffffff',
      accent: '#3b82f6',
      'accent-foreground': '#ffffff',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ── Reusable main-view effects (quiz browsing) ──────────────────────

const quizBrowsingEffects: BehaviorEffect[] = [
  ['fetch', 'Quiz'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: graduation cap icon + title
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'graduation-cap', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Quizzes' },
      ]},
    ]},
    { type: 'divider' },
    // Quiz card list
    { type: 'data-list', entity: 'Quiz', variant: 'card',
      fields: [
        { name: 'title', label: 'Title', icon: 'book-open', variant: 'h4' },
        { name: 'totalQuestions', label: 'Questions', icon: 'clipboard', variant: 'body' },
        { name: 'score', label: 'Best Score', icon: 'award', variant: 'badge' },
      ],
      itemActions: [
        { label: 'Start', event: 'START', icon: 'play' },
      ],
    },
  ]}],
];

// ── Reusable main-view effects (quiz taking) ────────────────────────

const quizTakingEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: brain icon + "Taking Quiz"
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'brain', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Taking Quiz' },
    ]},
    { type: 'divider' },
    // Wizard progress bar
    { type: 'wizard-progress',
      currentStep: '@entity.currentQuestion',
      steps: [{ label: 'Question 1' }, { label: 'Question 2' }, { label: 'Question 3' }],
    },
    // Question area
    { type: 'stack', direction: 'vertical', gap: 'md', children: [
      { type: 'typography', variant: 'h3', content: 'Question' },
      { type: 'typography', variant: 'body', content: 'Answer the question below.' },
    ]},
    // Progress indicator
    { type: 'progress-bar', value: '@entity.currentQuestion', max: '@entity.totalQuestions', label: 'Progress' },
  ]}],
];

// ── Reusable main-view effects (progress browsing) ──────────────────

const progressBrowsingEffects: BehaviorEffect[] = [
  ['fetch', 'LearningProgress'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: book icon + title
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'book-open', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Learning Progress' },
      ]},
    ]},
    { type: 'divider' },
    // Summary stats row
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Courses', icon: 'graduation-cap', entity: 'LearningProgress' },
      { type: 'stats', label: 'Completed', icon: 'check-circle', entity: 'LearningProgress' },
      { type: 'stats', label: 'In Progress', icon: 'clock', entity: 'LearningProgress' },
    ]},
    { type: 'divider' },
    // Progress card list
    { type: 'data-list', entity: 'LearningProgress', variant: 'card',
      fields: [
        { name: 'courseName', label: 'Course', icon: 'book-open', variant: 'h4' },
        { name: 'completed', label: 'Completed', icon: 'check-circle', variant: 'body' },
        { name: 'total', label: 'Total', icon: 'clipboard', variant: 'body' },
        { name: 'percentage', label: 'Completion', icon: 'award', variant: 'badge', format: 'percent' },
      ],
      itemActions: [
        { label: 'View', event: 'VIEW', icon: 'eye' },
      ],
    },
  ]}],
];

// ── Reusable main-view effects (grades browsing) ────────────────────

const gradesBrowsingEffects: BehaviorEffect[] = [
  ['fetch', 'Grade'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: award icon + title
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'award', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Grades' },
      ]},
    ]},
    { type: 'divider' },
    // Stats row + chart
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Students', icon: 'users', entity: 'Grade' },
      { type: 'stats', label: 'Avg Score', icon: 'bar-chart-2', entity: 'Grade' },
      { type: 'stats', label: 'Submissions', icon: 'clipboard', entity: 'Grade' },
    ]},
    { type: 'line-chart', entity: 'Grade' },
    { type: 'meter', value: 0, label: 'Average Score' },
    { type: 'divider' },
    // Grade data grid
    { type: 'data-grid', entity: 'Grade',
      columns: [
        { name: 'studentName', label: 'Student', icon: 'users' },
        { name: 'assignment', label: 'Assignment', icon: 'pen-tool' },
        { name: 'score', label: 'Score', icon: 'award', format: 'number' },
        { name: 'maxScore', label: 'Max', icon: 'target', format: 'number' },
      ],
      itemActions: [
        { label: 'Grade', event: 'START_GRADING', icon: 'pen-tool' },
      ],
    },
  ]}],
];

// ── Reusable main-view effects (curriculum browsing) ────────────────

const curriculumBrowsingEffects: BehaviorEffect[] = [
  ['fetch', 'Course'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: graduation cap + title + search
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'graduation-cap', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Course Catalog' },
      ]},
      { type: 'search-input', placeholder: 'Search courses...', entity: 'Course' },
    ]},
    { type: 'divider' },
    // Course card list
    { type: 'data-list', entity: 'Course', variant: 'card',
      fields: [
        { name: 'title', label: 'Title', icon: 'book-open', variant: 'h4' },
        { name: 'description', label: 'Description', icon: 'file-text', variant: 'body' },
        { name: 'modules', label: 'Modules', icon: 'layers', variant: 'body' },
        { name: 'duration', label: 'Duration', icon: 'clock', variant: 'caption' },
        { name: 'level', label: 'Level', icon: 'bar-chart-2', variant: 'badge' },
      ],
      itemActions: [
        { label: 'View', event: 'VIEW', icon: 'eye' },
      ],
    },
  ]}],
];

// ── Course detail view effects ──────────────────────────────────────

const courseDetailEffects: BehaviorEffect[] = [
  ['fetch', 'Course'],
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header with back + enroll buttons
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'book-open', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Course Details' },
      ]},
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'button', label: 'Back', icon: 'arrow-left', variant: 'secondary', action: 'BACK' },
        { type: 'button', label: 'Enroll', icon: 'check-circle', variant: 'primary', action: 'ENROLL' },
      ]},
    ]},
    { type: 'divider' },
    // Course progress
    { type: 'progress-bar', value: 0, label: 'Course Progress' },
    // Course info fields
    { type: 'stack', direction: 'vertical', gap: 'md', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'layers' },
        { type: 'typography', variant: 'body', content: 'Modules' },
        { type: 'badge', content: '@entity.modules' },
      ]},
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'clock' },
        { type: 'typography', variant: 'body', content: 'Duration' },
        { type: 'badge', content: '@entity.duration' },
      ]},
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'bar-chart-2' },
        { type: 'typography', variant: 'body', content: 'Level' },
        { type: 'badge', content: '@entity.level' },
      ]},
    ]},
    { type: 'divider' },
    { type: 'typography', variant: 'body', content: '@entity.description' },
  ]}],
];

// ============================================================================
// std-quiz - Quiz System
// ============================================================================

/**
 * std-quiz - Quiz system with answer submission and scoring.
 * States: idle -> taking -> reviewing -> completed
 */
export const QUIZ_BEHAVIOR: BehaviorSchema = {
  name: 'std-quiz',
  version: '1.0.0',
  description: 'Quiz system with answer submission and scoring',
  orbitals: [
    {
      name: 'QuizOrbital',
      theme: EDUCATION_THEME,
      entity: {
        name: 'Quiz',
        persistence: 'persistent',
        collection: 'quizzes',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
          { name: 'questions', type: 'number', default: 0 },
          { name: 'currentQuestion', type: 'number', default: 0 },
          { name: 'score', type: 'number', default: 0 },
          { name: 'totalQuestions', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'QuizControl',
          linkedEntity: 'Quiz',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'idle', isInitial: true },
              { name: 'taking' },
              { name: 'reviewing' },
              { name: 'completed' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'START', name: 'Start Quiz' },
              { key: 'ANSWER', name: 'Submit Answer', payloadSchema: [{ name: 'correct', type: 'boolean', required: true }] },
              { key: 'REVIEW', name: 'Review Results' },
              { key: 'FINISH', name: 'Finish Quiz' },
              { key: 'RESET', name: 'Reset Quiz' },
            ],
            transitions: [
              {
                from: 'idle',
                to: 'idle',
                event: 'INIT',
                effects: [
                  ...quizBrowsingEffects,
                ],
              },
              {
                from: 'idle',
                to: 'taking',
                event: 'START',
                effects: [
                  ['set', '@entity.currentQuestion', 1],
                  ['set', '@entity.score', 0],
                  ...quizTakingEffects,
                ],
              },
              {
                from: 'taking',
                to: 'taking',
                event: 'ANSWER',
                guard: ['<', '@entity.currentQuestion', '@entity.totalQuestions'],
                effects: [
                  ['set', '@entity.currentQuestion', ['+', '@entity.currentQuestion', 1]],
                  ...quizTakingEffects,
                ],
              },
              {
                from: 'taking',
                to: 'reviewing',
                event: 'ANSWER',
                guard: ['>=', '@entity.currentQuestion', '@entity.totalQuestions'],
                effects: [
                  ['fetch', 'Quiz'],
                  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
                    // Review header
                    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                      { type: 'icon', name: 'clipboard', size: 'lg' },
                      { type: 'typography', variant: 'h2', content: 'Quiz Review' },
                    ]},
                    { type: 'divider' },
                    // Score stats
                    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                      { type: 'stats', label: 'Score', icon: 'award', entity: 'Quiz' },
                      { type: 'stats', label: 'Questions', icon: 'clipboard', entity: 'Quiz' },
                    ]},
                    // Score meter
                    { type: 'meter', value: '@entity.score', label: 'Score' },
                    // Detail fields
                    { type: 'stack', direction: 'vertical', gap: 'sm', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'book-open' },
                        { type: 'typography', variant: 'body', content: '@entity.title' },
                      ]},
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'check-circle' },
                        { type: 'typography', variant: 'body', content: 'Correct answers:' },
                        { type: 'badge', content: '@entity.score' },
                      ]},
                    ]},
                    // Action button
                    { type: 'button', label: 'Finish', icon: 'check-circle', variant: 'primary', action: 'FINISH' },
                  ]}],
                ],
              },
              {
                from: 'reviewing',
                to: 'completed',
                event: 'FINISH',
                effects: [
                  ['fetch', 'Quiz'],
                  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
                    // Completed header
                    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                      { type: 'icon', name: 'check-circle', size: 'lg' },
                      { type: 'typography', variant: 'h2', content: 'Quiz Complete' },
                    ]},
                    { type: 'divider' },
                    // Final stats
                    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                      { type: 'stats', label: 'Final Score', icon: 'award', entity: 'Quiz' },
                      { type: 'stats', label: 'Total Questions', icon: 'clipboard', entity: 'Quiz' },
                    ]},
                    // Reset button
                    { type: 'button', label: 'Try Again', icon: 'refresh-cw', variant: 'secondary', action: 'RESET' },
                  ]}],
                ],
              },
              {
                from: 'completed',
                to: 'idle',
                event: 'RESET',
                effects: [
                  ['set', '@entity.currentQuestion', 0],
                  ['set', '@entity.score', 0],
                  ...quizBrowsingEffects,
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'QuizPage',
          path: '/quiz',
          isInitial: true,
          traits: [{ ref: 'QuizControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-progress-tracker - Learning Progress
// ============================================================================

/**
 * std-progress-tracker - Learning progress tracking.
 * States: browsing -> viewing
 */
export const PROGRESS_TRACKER_BEHAVIOR: BehaviorSchema = {
  name: 'std-progress-tracker',
  version: '1.0.0',
  description: 'Learning progress tracking with completion metrics',
  orbitals: [
    {
      name: 'ProgressTrackerOrbital',
      theme: EDUCATION_THEME,
      entity: {
        name: 'LearningProgress',
        persistence: 'persistent',
        collection: 'learning_progress',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'courseName', type: 'string', default: '' },
          { name: 'completed', type: 'number', default: 0 },
          { name: 'total', type: 'number', default: 0 },
          { name: 'percentage', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'ProgressControl',
          linkedEntity: 'LearningProgress',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'viewing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'VIEW', name: 'View Progress', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'BACK', name: 'Back to List' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ...progressBrowsingEffects,
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ['fetch', 'LearningProgress'],
                  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
                    // Detail header with back button
                    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'book-open', size: 'lg' },
                        { type: 'typography', variant: 'h2', content: 'Progress Detail' },
                      ]},
                      { type: 'button', label: 'Back', icon: 'arrow-left', variant: 'secondary', action: 'BACK' },
                    ]},
                    { type: 'divider' },
                    // Course name
                    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                      { type: 'icon', name: 'graduation-cap' },
                      { type: 'typography', variant: 'h3', content: '@entity.courseName' },
                    ]},
                    // Progress visuals
                    { type: 'progress-bar', value: '@entity.percentage', label: 'Progress' },
                    { type: 'meter', value: '@entity.percentage', label: 'Completion' },
                    // Detail stats
                    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                      { type: 'stats', label: 'Completed', icon: 'check-circle', entity: 'LearningProgress' },
                      { type: 'stats', label: 'Remaining', icon: 'clock', entity: 'LearningProgress' },
                      { type: 'stats', label: 'Percentage', icon: 'award', entity: 'LearningProgress' },
                    ]},
                  ]}],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'BACK',
                effects: [
                  ...progressBrowsingEffects,
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'ProgressPage',
          path: '/progress',
          isInitial: true,
          traits: [{ ref: 'ProgressControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-grading - Grading System
// ============================================================================

/**
 * std-grading - Grade entry and review system.
 * States: browsing -> grading -> reviewed
 */
export const GRADING_BEHAVIOR: BehaviorSchema = {
  name: 'std-grading',
  version: '1.0.0',
  description: 'Grading system for student assignments',
  orbitals: [
    {
      name: 'GradingOrbital',
      theme: EDUCATION_THEME,
      entity: {
        name: 'Grade',
        persistence: 'persistent',
        collection: 'grades',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'studentName', type: 'string', default: '' },
          { name: 'assignment', type: 'string', default: '' },
          { name: 'score', type: 'number', default: 0 },
          { name: 'maxScore', type: 'number', default: 100 },
          { name: 'feedback', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'GradingControl',
          linkedEntity: 'Grade',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'grading' },
              { name: 'reviewed' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'START_GRADING', name: 'Start Grading', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'SUBMIT_GRADE', name: 'Submit Grade', payloadSchema: [{ name: 'score', type: 'number', required: true }, { name: 'feedback', type: 'string', required: true }] },
              { key: 'BACK', name: 'Back to List' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ...gradesBrowsingEffects,
                ],
              },
              {
                from: 'browsing',
                to: 'grading',
                event: 'START_GRADING',
                effects: [
                  ['fetch', 'Grade'],
                  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
                    // Grading header with back
                    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'pen-tool', size: 'lg' },
                        { type: 'typography', variant: 'h2', content: 'Enter Grade' },
                      ]},
                      { type: 'button', label: 'Back', icon: 'arrow-left', variant: 'secondary', action: 'BACK' },
                    ]},
                    { type: 'divider' },
                    // Student info
                    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                      { type: 'icon', name: 'users' },
                      { type: 'typography', variant: 'h3', content: '@entity.studentName' },
                      { type: 'badge', content: '@entity.assignment' },
                    ]},
                    // Grade form
                    { type: 'form-section', entity: 'Grade' },
                  ]}],
                ],
              },
              {
                from: 'grading',
                to: 'reviewed',
                event: 'SUBMIT_GRADE',
                effects: [
                  ['fetch', 'Grade'],
                  ['set', '@entity.score', '@payload.score'],
                  ['set', '@entity.feedback', '@payload.feedback'],
                  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
                    // Submitted header with back
                    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'check-circle', size: 'lg' },
                        { type: 'typography', variant: 'h2', content: 'Grade Submitted' },
                      ]},
                      { type: 'button', label: 'Back', icon: 'arrow-left', variant: 'secondary', action: 'BACK' },
                    ]},
                    { type: 'divider' },
                    // Result stats
                    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                      { type: 'stats', label: 'Score', icon: 'award', entity: 'Grade' },
                      { type: 'stats', label: 'Max Score', icon: 'target', entity: 'Grade' },
                    ]},
                    // Score meter
                    { type: 'meter', value: '@entity.score', label: 'Score' },
                    // Detail fields
                    { type: 'stack', direction: 'vertical', gap: 'sm', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'users' },
                        { type: 'typography', variant: 'body', content: '@entity.studentName' },
                      ]},
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'pen-tool' },
                        { type: 'typography', variant: 'body', content: '@entity.assignment' },
                      ]},
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'message-square' },
                        { type: 'typography', variant: 'body', content: '@entity.feedback' },
                      ]},
                    ]},
                  ]}],
                ],
              },
              {
                from: 'grading',
                to: 'browsing',
                event: 'BACK',
                effects: [
                  ...gradesBrowsingEffects,
                ],
              },
              {
                from: 'reviewed',
                to: 'browsing',
                event: 'BACK',
                effects: [
                  ...gradesBrowsingEffects,
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'GradesPage',
          path: '/grades',
          isInitial: true,
          traits: [{ ref: 'GradingControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-curriculum - Curriculum Browser
// ============================================================================

/**
 * std-curriculum - Course catalog and enrollment.
 * States: browsing -> viewing -> enrolling
 */
export const CURRICULUM_BEHAVIOR: BehaviorSchema = {
  name: 'std-curriculum',
  version: '1.0.0',
  description: 'Curriculum browser with course catalog and enrollment',
  orbitals: [
    {
      name: 'CurriculumOrbital',
      theme: EDUCATION_THEME,
      entity: {
        name: 'Course',
        persistence: 'persistent',
        collection: 'courses',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
          { name: 'description', type: 'string', default: '' },
          { name: 'modules', type: 'number', default: 0 },
          { name: 'duration', type: 'string', default: '' },
          { name: 'level', type: 'string', default: 'beginner' },
        ],
      },
      traits: [
        {
          name: 'CurriculumControl',
          linkedEntity: 'Course',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'viewing' },
              { name: 'enrolling' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'VIEW', name: 'View Course', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'ENROLL', name: 'Enroll' },
              { key: 'CONFIRM', name: 'Confirm Enrollment' },
              { key: 'CANCEL', name: 'Cancel Enrollment' },
              { key: 'BACK', name: 'Back to Catalog' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ...curriculumBrowsingEffects,
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ...courseDetailEffects,
                ],
              },
              {
                from: 'viewing',
                to: 'enrolling',
                event: 'ENROLL',
                effects: [
                  ['render-ui', 'modal', { type: 'stack', direction: 'vertical', gap: 'md', children: [
                    // Enrollment confirmation modal
                    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                      { type: 'icon', name: 'graduation-cap', size: 'lg' },
                      { type: 'typography', variant: 'h3', content: 'Enroll in Course' },
                    ]},
                    { type: 'divider' },
                    { type: 'typography', variant: 'body', content: 'Are you sure you want to enroll in this course?' },
                    { type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'end', children: [
                      { type: 'button', label: 'Cancel', icon: 'x', variant: 'secondary', action: 'CANCEL' },
                      { type: 'button', label: 'Confirm', icon: 'check-circle', variant: 'primary', action: 'CONFIRM' },
                    ]},
                  ]}],
                ],
              },
              {
                from: 'enrolling',
                to: 'browsing',
                event: 'CONFIRM',
                effects: [
                  ['render-ui', 'modal', null],
                  ...curriculumBrowsingEffects,
                ],
              },
              {
                from: 'enrolling',
                to: 'viewing',
                event: 'CANCEL',
                effects: [
                  ['render-ui', 'modal', null],
                  ...courseDetailEffects,
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'BACK',
                effects: [
                  ...curriculumBrowsingEffects,
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'CurriculumPage',
          path: '/curriculum',
          isInitial: true,
          traits: [{ ref: 'CurriculumControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Education Behaviors
// ============================================================================

export const EDUCATION_BEHAVIORS: BehaviorSchema[] = [
  QUIZ_BEHAVIOR,
  PROGRESS_TRACKER_BEHAVIOR,
  GRADING_BEHAVIOR,
  CURRICULUM_BEHAVIOR,
];
