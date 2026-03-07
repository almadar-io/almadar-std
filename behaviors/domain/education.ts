/**
 * Education Domain Behaviors
 *
 * Standard behaviors for education: quizzes, progress tracking,
 * grading, and curriculum browsing.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from '../types.js';

// ============================================================================
// std-quiz - Quiz System
// ============================================================================

/**
 * std-quiz - Quiz system with answer submission and scoring.
 * States: idle -> taking -> reviewing -> completed
 */
export const QUIZ_BEHAVIOR: OrbitalSchema = {
  name: 'std-quiz',
  version: '1.0.0',
  description: 'Quiz system with answer submission and scoring',
  orbitals: [
    {
      name: 'QuizOrbital',
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
                  ['fetch', 'Quiz'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Quizzes' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Quiz',
                  
  itemActions: [
    { label: 'Refresh', event: 'INIT' },
  ],
}],
                ],
              },
              {
                from: 'idle',
                to: 'taking',
                event: 'START',
                effects: [
                  ['set', '@entity.currentQuestion', 1],
                  ['set', '@entity.score', 0],
                  ['render-ui', 'main', { type: 'page-header', title: 'Taking Quiz' }],
                  ['render-ui', 'main', { type: 'card', title: 'Quiz Question' }],
                ],
              },
              {
                from: 'taking',
                to: 'taking',
                event: 'ANSWER',
                guard: ['<', '@entity.currentQuestion', '@entity.totalQuestions'],
                effects: [
                  ['set', '@entity.currentQuestion', ['+', '@entity.currentQuestion', 1]],
                  ['render-ui', 'main', { type: 'card', title: 'Quiz Question' }],
                ],
              },
              {
                from: 'taking',
                to: 'reviewing',
                event: 'ANSWER',
                guard: ['>=', '@entity.currentQuestion', '@entity.totalQuestions'],
                effects: [
                  ['fetch', 'Quiz'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Quiz Review' }],
                  ['render-ui', 'main', { type: 'detail-panel', entity: 'Quiz' }],
                ],
              },
              {
                from: 'reviewing',
                to: 'completed',
                event: 'FINISH',
                effects: [
                  ['fetch', 'Quiz'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Quiz Complete' }],
                  ['render-ui', 'main', { type: 'stats', entity: 'Quiz' }],
                ],
              },
              {
                from: 'completed',
                to: 'idle',
                event: 'RESET',
                effects: [
                  ['set', '@entity.currentQuestion', 0],
                  ['set', '@entity.score', 0],
                  ['fetch', 'Quiz'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Quizzes' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Quiz',
                  
  itemActions: [
    { label: 'Refresh', event: 'INIT' },
  ],
}],
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
export const PROGRESS_TRACKER_BEHAVIOR: OrbitalSchema = {
  name: 'std-progress-tracker',
  version: '1.0.0',
  description: 'Learning progress tracking with completion metrics',
  orbitals: [
    {
      name: 'ProgressTrackerOrbital',
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
                  ['fetch', 'LearningProgress'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Learning Progress' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'LearningProgress',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ['fetch', 'LearningProgress'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Progress Detail',
                    actions: [{ label: 'Back', event: 'BACK' }],
                  }],
                  ['render-ui', 'main', { type: 'progress-bar', value: 0, label: 'Progress' }],
                  ['render-ui', 'main', { type: 'stats', entity: 'LearningProgress' }],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'BACK',
                effects: [
                  ['fetch', 'LearningProgress'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Learning Progress' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'LearningProgress',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
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
export const GRADING_BEHAVIOR: OrbitalSchema = {
  name: 'std-grading',
  version: '1.0.0',
  description: 'Grading system for student assignments',
  orbitals: [
    {
      name: 'GradingOrbital',
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
                  ['fetch', 'Grade'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Grades' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'Grade',
                    itemActions: [
                      { label: 'Refresh', event: 'INIT' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'grading',
                event: 'START_GRADING',
                effects: [
                  ['fetch', 'Grade'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Enter Grade' }],
                  ['render-ui', 'main', { type: 'form-section', entity: 'Grade' }],
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
                  ['render-ui', 'main', { type: 'page-header', title: 'Grade Submitted', 
                    actions: [{ label: 'Back', event: 'BACK' }],
                  }],
                  ['render-ui', 'main', { type: 'detail-panel', entity: 'Grade' }],
                ],
              },
              {
                from: 'reviewed',
                to: 'browsing',
                event: 'BACK',
                effects: [
                  ['fetch', 'Grade'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Grades' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'Grade',
                    itemActions: [
                      { label: 'Refresh', event: 'INIT' },
                    ],
                  }],
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
export const CURRICULUM_BEHAVIOR: OrbitalSchema = {
  name: 'std-curriculum',
  version: '1.0.0',
  description: 'Curriculum browser with course catalog and enrollment',
  orbitals: [
    {
      name: 'CurriculumOrbital',
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
                  ['fetch', 'Course'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Course Catalog' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Course',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ['fetch', 'Course'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Course Details', 
                    actions: [{ label: 'Back', event: 'BACK' }],
                  }],
                  ['render-ui', 'main', { type: 'detail-panel', entity: 'Course' }],
                ],
              },
              {
                from: 'viewing',
                to: 'enrolling',
                event: 'ENROLL',
                effects: [
                  ['render-ui', 'modal', { type: 'confirm-dialog',
                    title: 'Enroll in Course',
                    message: 'Are you sure you want to enroll in this course?',
                    confirmText: 'Confirm',
                    cancelText: 'Cancel',
                  }],
                ],
              },
              {
                from: 'enrolling',
                to: 'browsing',
                event: 'CONFIRM',
                effects: [
                  ['render-ui', 'modal', null],
                  ['fetch', 'Course'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Course Catalog' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Course',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'enrolling',
                to: 'viewing',
                event: 'CANCEL',
                effects: [
                  ['fetch', 'Course'],
                  ['render-ui', 'modal', null],
                  ['render-ui', 'main', { type: 'page-header', title: 'Course Details', 
                    actions: [{ label: 'Back', event: 'BACK' }],
                  }],
                  ['render-ui', 'main', { type: 'detail-panel', entity: 'Course' }],
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'BACK',
                effects: [
                  ['fetch', 'Course'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Course Catalog' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Course',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
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

export const EDUCATION_BEHAVIORS: OrbitalSchema[] = [
  QUIZ_BEHAVIOR,
  PROGRESS_TRACKER_BEHAVIOR,
  GRADING_BEHAVIOR,
  CURRICULUM_BEHAVIOR,
];
