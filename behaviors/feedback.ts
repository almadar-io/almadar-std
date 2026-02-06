/**
 * Feedback Behaviors
 *
 * Standard behaviors for user feedback including notifications,
 * confirmations, and undo functionality.
 * Each behavior is a self-contained OrbitalSchema that can function as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from './types.js';

// ============================================================================
// std-notification - Toast Notifications
// ============================================================================

export const NOTIFICATION_BEHAVIOR: OrbitalSchema = {
  name: 'std-notification',
  version: '1.0.0',
  description: 'Toast notification with auto-dismiss',
  orbitals: [
    {
      name: 'NotificationOrbital',
      entity: {
        name: 'NotificationState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'notifications', type: 'array', default: [] },
          { name: 'currentId', type: 'number', default: 0 },
          { name: 'autoDismissMs', type: 'number', default: 5000 },
        ],
      },
      traits: [
        {
          name: 'Notification',
          linkedEntity: 'NotificationState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Hidden', isInitial: true },
              { name: 'Visible' },
              { name: 'Dismissing' },
            ],
            events: [
              { key: 'SHOW', name: 'Show' },
              { key: 'HIDE', name: 'Hide' },
              { key: 'DISMISS', name: 'Dismiss' },
              { key: 'AUTO_DISMISS', name: 'Auto Dismiss' },
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
                      ['when', ['>', '@entity.autoDismissMs', 0],
                        ['async/delay', '@entity.autoDismissMs', ['emit', 'AUTO_DISMISS', { id: '@id' }]]]]],
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
                      ['when', ['>', '@entity.autoDismissMs', 0],
                        ['async/delay', '@entity.autoDismissMs', ['emit', 'AUTO_DISMISS', { id: '@id' }]]]]],
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
                effects: [['set', '@entity.notifications', []]],
              },
            ],
          },
        },
      ],
      pages: [],
    },
  ],
};

// ============================================================================
// std-confirmation - Confirmation Dialog
// ============================================================================

export const CONFIRMATION_BEHAVIOR: OrbitalSchema = {
  name: 'std-confirmation',
  version: '1.0.0',
  description: 'Confirmation dialog with confirm/cancel actions',
  orbitals: [
    {
      name: 'ConfirmationOrbital',
      entity: {
        name: 'ConfirmationState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
          { name: 'message', type: 'string', default: '' },
          { name: 'pendingAction', type: 'object', default: null },
          { name: 'confirmLabel', type: 'string', default: 'Confirm' },
          { name: 'cancelLabel', type: 'string', default: 'Cancel' },
          { name: 'confirmVariant', type: 'string', default: 'danger' },
        ],
      },
      traits: [
        {
          name: 'Confirmation',
          linkedEntity: 'ConfirmationState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Closed', isInitial: true },
              { name: 'Open' },
            ],
            events: [
              { key: 'REQUEST', name: 'Request' },
              { key: 'CONFIRM', name: 'Confirm' },
              { key: 'CANCEL', name: 'Cancel' },
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
                    confirmLabel: '@entity.confirmLabel',
                    cancelLabel: '@entity.cancelLabel',
                    confirmVariant: '@entity.confirmVariant',
                  }],
                ],
              },
              {
                from: 'Open',
                to: 'Closed',
                event: 'CONFIRM',
                effects: [
                  ['when', '@entity.pendingAction', ['emit', '@entity.pendingAction.event', '@entity.pendingAction.payload']],
                  ['set', '@entity.pendingAction', null],
                ],
              },
              {
                from: 'Open',
                to: 'Closed',
                event: 'CANCEL',
                effects: [['set', '@entity.pendingAction', null]],
              },
            ],
          },
        },
      ],
      pages: [],
    },
  ],
};

// ============================================================================
// std-undo - Undo Stack
// ============================================================================

export const UNDO_BEHAVIOR: OrbitalSchema = {
  name: 'std-undo',
  version: '1.0.0',
  description: 'Undo/redo stack for reversible actions',
  orbitals: [
    {
      name: 'UndoOrbital',
      entity: {
        name: 'UndoState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'undoStack', type: 'array', default: [] },
          { name: 'redoStack', type: 'array', default: [] },
          { name: 'maxHistory', type: 'number', default: 50 },
          { name: 'showToast', type: 'boolean', default: true },
        ],
      },
      traits: [
        {
          name: 'Undo',
          linkedEntity: 'UndoState',
          category: 'interaction',
          stateMachine: {
            states: [{ name: 'Ready', isInitial: true }],
            events: [
              { key: 'PUSH', name: 'Push' },
              { key: 'UNDO', name: 'Undo' },
              { key: 'REDO', name: 'Redo' },
              { key: 'CLEAR', name: 'Clear' },
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
                      0, '@entity.maxHistory']],
                  ['set', '@entity.redoStack', []],
                  ['when', '@entity.showToast',
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
        },
      ],
      pages: [],
    },
  ],
};

// ============================================================================
// Export All Feedback Behaviors
// ============================================================================

export const FEEDBACK_BEHAVIORS: OrbitalSchema[] = [
  NOTIFICATION_BEHAVIOR,
  CONFIRMATION_BEHAVIOR,
  UNDO_BEHAVIOR,
];
