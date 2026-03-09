/**
 * Feedback Behaviors
 *
 * Standard behaviors for user feedback including notifications,
 * confirmations, and undo functionality.
 * Each behavior is a self-contained OrbitalSchema that can function as a standalone .orb file.
 *
 * UI Composition: molecule-first (atoms + molecules only, no organisms).
 * Each behavior has unique, domain-appropriate layouts composed with
 * stack wrappers around atoms and molecules.
 *
 * @packageDocumentation
 */

import type { BehaviorSchema, BehaviorEffect } from './types.js';

// ── Shared Feedback Theme ──────────────────────────────────────────

const FEEDBACK_THEME = {
  name: 'feedback-amber',
  tokens: {
    colors: {
      primary: '#d97706',
      'primary-hover': '#b45309',
      'primary-foreground': '#ffffff',
      accent: '#f59e0b',
      'accent-foreground': '#000000',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ============================================================================
// std-notification - Toast Notifications
// ============================================================================

// ── Reusable main-view effects (notification: hidden/empty) ────────

const notificationEmptyEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'bell-off', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Notifications' },
    ]},
    { type: 'divider' },
    // Empty state
    { type: 'stack', direction: 'vertical', gap: 'md', align: 'center', children: [
      { type: 'icon', name: 'inbox', size: 'xl' },
      { type: 'typography', variant: 'h3', content: 'No Notifications' },
      { type: 'typography', variant: 'body', content: 'Nothing to display' },
      { type: 'button', label: 'Send Test Notification', action: 'SHOW', icon: 'bell', variant: 'primary' },
    ]},
  ]}],
];

// ── Reusable main-view effects (notification: visible) ─────────────

const notificationVisibleEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'bell', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Notifications' },
    ]},
    { type: 'divider' },
    // Notification list
    { type: 'data-list', entity: 'Notification',
      fields: [
        { name: 'title', label: 'Title', icon: 'tag', variant: 'h4' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
        { name: 'type', label: 'Type', icon: 'info', variant: 'badge' },
      ],
      actions: [
        { label: 'Dismiss', event: 'HIDE', icon: 'x', variant: 'ghost' },
      ],
    },
  ]}],
];

export const NOTIFICATION_BEHAVIOR: BehaviorSchema = {
  name: 'std-notification',
  version: '1.0.0',
  description: 'Toast notification with auto-dismiss',
  theme: FEEDBACK_THEME,
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
                  ...notificationEmptyEffects,
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
                  ...notificationVisibleEffects,
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
                  ...notificationVisibleEffects,
                ],
              },
              {
                from: 'visible',
                to: 'hidden',
                event: 'HIDE',
                effects: [
                  ['set', '@entity.message', ''],
                  ['set', '@entity.title', ''],
                  ...notificationEmptyEffects,
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

// ── Reusable main-view effects (confirmation: closed) ──────────────

const confirmationClosedEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'shield-check', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Confirmation' },
    ]},
    { type: 'divider' },
    // Idle state
    { type: 'stack', direction: 'vertical', gap: 'md', align: 'center', children: [
      { type: 'icon', name: 'check-circle', size: 'xl' },
      { type: 'typography', variant: 'body', content: 'No pending confirmations' },
    ]},
  ]}],
];

export const CONFIRMATION_BEHAVIOR: BehaviorSchema = {
  name: 'std-confirmation',
  version: '1.0.0',
  description: 'Confirmation dialog with confirm/cancel actions',
  theme: FEEDBACK_THEME,
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
                  ...confirmationClosedEffects,
                ],
              },
              {
                from: 'closed',
                to: 'open',
                event: 'REQUEST',
                effects: [
                  ['set', '@entity.title', '@payload.title'],
                  ['set', '@entity.message', '@payload.message'],
                  ['render-ui', 'modal', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
                    // Modal header: warning icon + title
                    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                      { type: 'icon', name: 'alert-triangle', size: 'lg' },
                      { type: 'typography', variant: 'h3', content: '@entity.title' },
                    ]},
                    { type: 'divider' },
                    // Message body
                    { type: 'typography', variant: 'body', content: '@entity.message' },
                    { type: 'divider' },
                    // Action buttons
                    { type: 'stack', direction: 'horizontal', gap: 'md', justify: 'end', children: [
                      { type: 'button', label: 'Cancel', icon: 'x', variant: 'secondary', action: 'CANCEL' },
                      { type: 'button', label: 'Confirm', icon: 'check', variant: 'primary', action: 'CONFIRM' },
                    ]},
                  ]}],
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

// ── Reusable main-view effects (undo: ready) ───────────────────────

const undoReadyEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title + clear button
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'rotate-ccw', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Undo History' },
      ]},
      { type: 'button', label: 'Clear All', icon: 'trash-2', variant: 'ghost', action: 'CLEAR' },
    ]},
    { type: 'divider' },
    // Stats row
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Actions', icon: 'layers', entity: 'UndoEntry' },
      { type: 'stats', label: 'Status', icon: 'activity', entity: 'UndoEntry' },
    ]},
    { type: 'divider' },
    // Undo entries data grid
    { type: 'data-grid', entity: 'UndoEntry', cols: 1, gap: 'sm',
      fields: [
        { name: 'action', label: 'Action', icon: 'zap', variant: 'h4' },
        { name: 'description', label: 'Description', icon: 'file-text', variant: 'body' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
      ],
      actions: [
        { label: 'Undo', event: 'UNDO', icon: 'rotate-ccw', variant: 'secondary' },
      ],
    },
  ]}],
];

export const UNDO_BEHAVIOR: BehaviorSchema = {
  name: 'std-undo',
  version: '1.0.0',
  description: 'Undo stack for reversible actions',
  theme: FEEDBACK_THEME,
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
                  ...undoReadyEffects,
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

export const FEEDBACK_BEHAVIORS: BehaviorSchema[] = [
  NOTIFICATION_BEHAVIOR,
  CONFIRMATION_BEHAVIOR,
  UNDO_BEHAVIOR,
];
