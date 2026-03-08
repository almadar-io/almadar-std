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
        name: 'Notification',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'message', type: 'string', default: '' },
          { name: 'type', type: 'string', default: 'info' },
          { name: 'title', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'NotificationDisplay',
          linkedEntity: 'Notification',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'hidden', isInitial: true },
              { name: 'visible' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              {
                key: 'SHOW',
                name: 'Show',
                payloadSchema: [
                  { name: 'message', type: 'string', required: true },
                  { name: 'type', type: 'string', required: false },
                  { name: 'title', type: 'string', required: false },
                ],
              },
              { key: 'HIDE', name: 'Hide' },
            ],
            transitions: [
              {
                from: 'hidden',
                to: 'hidden',
                event: 'INIT',
                effects: [
                  ['render-ui', 'main', { type: 'page-header', title: 'Notifications' }],
                  ['render-ui', 'main', { type: 'empty-state',
                    title: 'No Notifications',
                    message: 'Nothing to display',
                  }],
                ],
              },
              {
                from: 'hidden',
                to: 'visible',
                event: 'SHOW',
                effects: [
                  ['fetch', 'Notification'],
                  ['set', '@entity.message', '@payload.message'],
                  ['set', '@entity.type', '@payload.type'],
                  ['set', '@entity.title', '@payload.title'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Notifications' }],
                  ['render-ui', 'main', { type: 'entity-list', entity: 'Notification',
                    itemActions: [
                      { label: 'Hide', event: 'HIDE' },
                    ],
                  }],
                ],
              },
              {
                from: 'visible',
                to: 'visible',
                event: 'SHOW',
                effects: [
                  ['fetch', 'Notification'],
                  ['set', '@entity.message', '@payload.message'],
                  ['set', '@entity.type', '@payload.type'],
                  ['set', '@entity.title', '@payload.title'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Notifications' }],
                  ['render-ui', 'main', { type: 'entity-list', entity: 'Notification',
                    itemActions: [
                      { label: 'Hide', event: 'HIDE' },
                    ],
                  }],
                ],
              },
              {
                from: 'visible',
                to: 'hidden',
                event: 'HIDE',
                effects: [
                  ['set', '@entity.message', ''],
                  ['set', '@entity.title', ''],
                  ['render-ui', 'main', { type: 'page-header', title: 'Notifications' }],
                  ['render-ui', 'main', { type: 'empty-state',
                    title: 'No Notifications',
                    message: 'Nothing to display',
                  }],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'NotificationsPage',
          path: '/notifications',
          isInitial: true,
          traits: [{ ref: 'NotificationDisplay' }],
        },
      ],
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
        name: 'Confirmation',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
          { name: 'message', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'ConfirmationDialog',
          linkedEntity: 'Confirmation',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'closed', isInitial: true },
              { name: 'open' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              {
                key: 'REQUEST',
                name: 'Request',
                payloadSchema: [
                  { name: 'title', type: 'string', required: true },
                  { name: 'message', type: 'string', required: true },
                ],
              },
              { key: 'CONFIRM', name: 'Confirm' },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'CLOSE', name: 'Close' },
            ],
            transitions: [
              {
                from: 'closed',
                to: 'closed',
                event: 'INIT',
                effects: [
                  ['render-ui', 'main', { type: 'page-header', 
                    title: 'Confirmation',
                  }],
                ],
              },
              {
                from: 'closed',
                to: 'open',
                event: 'REQUEST',
                effects: [
                  ['set', '@entity.title', '@payload.title'],
                  ['set', '@entity.message', '@payload.message'],
                  ['render-ui', 'modal', { type: 'confirm-dialog', title: '@entity.title', message: '@entity.message' }, { confirmEvent: 'CONFIRM', cancelEvent: 'CANCEL' }],
                ],
              },
              {
                from: 'open',
                to: 'closed',
                event: 'CONFIRM',
                effects: [
                  ['set', '@entity.title', ''],
                  ['set', '@entity.message', ''],
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'open',
                to: 'closed',
                event: 'CANCEL',
                effects: [
                  ['set', '@entity.title', ''],
                  ['set', '@entity.message', ''],
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'open',
                to: 'closed',
                event: 'CLOSE',
                effects: [
                  ['set', '@entity.title', ''],
                  ['set', '@entity.message', ''],
                  ['render-ui', 'modal', null],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'ConfirmationPage',
          path: '/confirmation',
          isInitial: true,
          traits: [{ ref: 'ConfirmationDialog' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-undo - Undo Stack
// ============================================================================

export const UNDO_BEHAVIOR: OrbitalSchema = {
  name: 'std-undo',
  version: '1.0.0',
  description: 'Undo stack for reversible actions',
  orbitals: [
    {
      name: 'UndoOrbital',
      entity: {
        name: 'UndoEntry',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'action', type: 'string', default: '' },
          { name: 'description', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'ready' },
        ],
      },
      traits: [
        {
          name: 'UndoManagement',
          linkedEntity: 'UndoEntry',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'ready', isInitial: true },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              {
                key: 'PUSH',
                name: 'Push',
                payloadSchema: [
                  { name: 'action', type: 'string', required: true },
                  { name: 'description', type: 'string', required: true },
                ],
              },
              { key: 'UNDO', name: 'Undo' },
              { key: 'CLEAR', name: 'Clear' },
            ],
            transitions: [
              {
                from: 'ready',
                to: 'ready',
                event: 'INIT',
                effects: [
                  ['fetch', 'UndoEntry'],
                  ['render-ui', 'main', { type: 'page-header', 
                    title: 'Undo History',
                  }],
                  ['render-ui', 'main', { type: 'entity-cards', entity: 'UndoEntry',
                  
  itemActions: [
    { label: 'Refresh', event: 'INIT' },
  ],
}],
                ],
              },
              {
                from: 'ready',
                to: 'ready',
                event: 'PUSH',
                effects: [
                  ['set', '@entity.action', '@payload.action'],
                  ['set', '@entity.description', '@payload.description'],
                  ['set', '@entity.status', 'recorded'],
                ],
              },
              {
                from: 'ready',
                to: 'ready',
                event: 'UNDO',
                effects: [
                  ['set', '@entity.status', 'undone'],
                ],
              },
              {
                from: 'ready',
                to: 'ready',
                event: 'CLEAR',
                effects: [
                  ['set', '@entity.action', ''],
                  ['set', '@entity.description', ''],
                  ['set', '@entity.status', 'ready'],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'UndoPage',
          path: '/undo',
          isInitial: true,
          traits: [{ ref: 'UndoManagement' }],
        },
      ],
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
