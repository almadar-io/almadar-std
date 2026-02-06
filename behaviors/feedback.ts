/**
 * Feedback Behaviors
 *
 * Standard behaviors for user feedback including notifications,
 * confirmations, and undo functionality.
 *
 * @packageDocumentation
 */

import type { BehaviorTrait } from './types.js';

// ============================================================================
// std/Notification - Toast Notifications
// ============================================================================

export const NOTIFICATION_BEHAVIOR: BehaviorTrait = {
  name: 'std/Notification',
  description: 'Toast notification with auto-dismiss',

  dataEntities: [
    {
      name: 'NotificationState',
      runtime: true,
      singleton: true,
      fields: [
        { name: 'notifications', type: 'array', default: [] },
        { name: 'currentId', type: 'number', default: 0 },
      ],
    },
  ],

  stateMachine: {
    states: [
      { name: 'Hidden', isInitial: true },
      { name: 'Visible' },
      { name: 'Dismissing' },
    ],
    events: [
      { key: 'SHOW', name: 'SHOW' },
      { key: 'HIDE', name: 'HIDE' },
      { key: 'DISMISS', name: 'DISMISS' },
      { key: 'AUTO_DISMISS', name: 'AUTO_DISMISS' },
    ],
    transitions: [
      {
        from: 'Hidden',
        to: 'Visible',
        event: 'SHOW',
        effects: [
          ['let', [['id', ['+', '@entity.currentId', 1]]],
            ['do',
              ['set', '@entity.currentId', '@id'],
              ['set', '@entity.notifications',
                ['array/append', '@entity.notifications', {
                  id: '@id',
                  type: '@payload.type',
                  message: '@payload.message',
                  title: '@payload.title',
                }]],
              ['when', ['>', '@config.autoDismissMs', 0],
                ['async/delay', '@config.autoDismissMs', ['emit', 'AUTO_DISMISS', { id: '@id' }]]]]],
        ],
      },
      {
        from: 'Visible',
        to: 'Visible',
        event: 'SHOW',
        effects: [
          ['let', [['id', ['+', '@entity.currentId', 1]]],
            ['do',
              ['set', '@entity.currentId', '@id'],
              ['set', '@entity.notifications',
                ['array/append', '@entity.notifications', {
                  id: '@id',
                  type: '@payload.type',
                  message: '@payload.message',
                  title: '@payload.title',
                }]],
              ['when', ['>', '@config.autoDismissMs', 0],
                ['async/delay', '@config.autoDismissMs', ['emit', 'AUTO_DISMISS', { id: '@id' }]]]]],
        ],
      },
      {
        from: 'Visible',
        to: 'Visible',
        event: 'DISMISS',
        effects: [
          ['set', '@entity.notifications',
            ['array/filter', '@entity.notifications', ['fn', 'n', ['!=', '@n.id', '@payload.id']]]],
        ],
      },
      {
        from: 'Visible',
        to: 'Visible',
        event: 'AUTO_DISMISS',
        effects: [
          ['set', '@entity.notifications',
            ['array/filter', '@entity.notifications', ['fn', 'n', ['!=', '@n.id', '@payload.id']]]],
        ],
      },
      {
        from: 'Visible',
        to: 'Hidden',
        event: 'HIDE',
        effects: [
          ['set', '@entity.notifications', []],
        ],
      },
    ],
  },

};

// ============================================================================
// std/Confirmation - Confirmation Dialog
// ============================================================================

export const CONFIRMATION_BEHAVIOR: BehaviorTrait = {
  name: 'std/Confirmation',
  description: 'Confirmation dialog with confirm/cancel actions',

  dataEntities: [
    {
      name: 'ConfirmationState',
      runtime: true,
      singleton: true,
      fields: [
        { name: 'title', type: 'string', default: '' },
        { name: 'message', type: 'string', default: '' },
        { name: 'pendingAction', type: 'object', default: null },
      ],
    },
  ],

  stateMachine: {
    states: [
      { name: 'Closed', isInitial: true },
      { name: 'Open' },
    ],
    events: [
      { key: 'REQUEST', name: 'REQUEST' },
      { key: 'CONFIRM', name: 'CONFIRM' },
      { key: 'CANCEL', name: 'CANCEL' },
    ],
    transitions: [
      {
        from: 'Closed',
        to: 'Open',
        event: 'REQUEST',
        effects: [
          ['set', '@entity.title', '@payload.title'],
          ['set', '@entity.message', '@payload.message'],
          ['set', '@entity.pendingAction', '@payload.onConfirm'],
          ['render-ui', 'modal', {
            type: 'confirmation',
            title: '@entity.title',
            message: '@entity.message',
            confirmLabel: '@config.confirmLabel',
            cancelLabel: '@config.cancelLabel',
            confirmVariant: '@config.confirmVariant',
          }],
        ],
      },
      {
        from: 'Open',
        to: 'Closed',
        event: 'CONFIRM',
        effects: [
          ['render-ui', 'modal', null],
          ['when', '@entity.pendingAction', ['emit', '@entity.pendingAction.event', '@entity.pendingAction.payload']],
          ['set', '@entity.pendingAction', null],
        ],
      },
      {
        from: 'Open',
        to: 'Closed',
        event: 'CANCEL',
        effects: [
          ['render-ui', 'modal', null],
          ['set', '@entity.pendingAction', null],
        ],
      },
    ],
  },

};

// ============================================================================
// std/Undo - Undo Stack
// ============================================================================

export const UNDO_BEHAVIOR: BehaviorTrait = {
  name: 'std/Undo',
  description: 'Undo/redo stack for reversible actions',

  dataEntities: [
    {
      name: 'UndoState',
      runtime: true,
      singleton: true,
      fields: [
        { name: 'undoStack', type: 'array', default: [] },
        { name: 'redoStack', type: 'array', default: [] },
      ],
    },
  ],

  stateMachine: {
    states: [
      { name: 'Ready', isInitial: true },
    ],
    events: [
      { key: 'PUSH', name: 'PUSH' },
      { key: 'UNDO', name: 'UNDO' },
      { key: 'REDO', name: 'REDO' },
      { key: 'CLEAR', name: 'CLEAR' },
    ],
    transitions: [
      {
        from: 'Ready',
        to: 'Ready',
        event: 'PUSH',
        effects: [
          ['set', '@entity.undoStack',
            ['array/slice',
              ['array/prepend', '@entity.undoStack', {
                action: '@payload.action',
                data: '@payload.data',
                reverseAction: '@payload.reverseAction',
                reverseData: '@payload.reverseData',
                description: '@payload.description',
              }],
              0, '@config.maxHistory']],
          ['set', '@entity.redoStack', []],
          ['when', '@config.showToast',
            ['emit', 'NOTIFY', {
              type: 'info',
              message: ['str/concat', '@payload.description', ' - Click to undo'],
              action: { label: 'Undo', event: 'UNDO' },
            }]],
        ],
      },
      {
        from: 'Ready',
        to: 'Ready',
        event: 'UNDO',
        guard: ['>', ['array/len', '@entity.undoStack'], 0],
        effects: [
          ['let', [['action', ['array/first', '@entity.undoStack']]],
            ['do',
              ['set', '@entity.undoStack', ['array/slice', '@entity.undoStack', 1]],
              ['set', '@entity.redoStack', ['array/prepend', '@entity.redoStack', '@action']],
              ['emit', '@action.reverseAction', '@action.reverseData']]],
        ],
      },
      {
        from: 'Ready',
        to: 'Ready',
        event: 'REDO',
        guard: ['>', ['array/len', '@entity.redoStack'], 0],
        effects: [
          ['let', [['action', ['array/first', '@entity.redoStack']]],
            ['do',
              ['set', '@entity.redoStack', ['array/slice', '@entity.redoStack', 1]],
              ['set', '@entity.undoStack', ['array/prepend', '@entity.undoStack', '@action']],
              ['emit', '@action.action', '@action.data']]],
        ],
      },
      {
        from: 'Ready',
        to: 'Ready',
        event: 'CLEAR',
        effects: [
          ['set', '@entity.undoStack', []],
          ['set', '@entity.redoStack', []],
        ],
      },
    ],
  },

};

// ============================================================================
// Export All Feedback Behaviors
// ============================================================================

export const FEEDBACK_BEHAVIORS: BehaviorTrait[] = [
  NOTIFICATION_BEHAVIOR,
  CONFIRMATION_BEHAVIOR,
  UNDO_BEHAVIOR,
];
