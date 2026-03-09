/**
 * UI Interaction Behaviors
 *
 * Standard behaviors for common UI interaction patterns.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * Uses molecule-first UI composition: stack, typography, icon, button, badge,
 * divider, data-grid, data-list, search-input, meter, stats, form-section,
 * progress-bar, wizard-progress, tabs.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema, Effect } from './types.js';

// ============================================================================
// Shared Theme
// ============================================================================

const UI_SLATE_THEME = {
  name: 'ui-slate',
  tokens: {
    colors: {
      primary: '#475569',
      'primary-hover': '#334155',
      'primary-foreground': '#ffffff',
      accent: '#64748b',
      'accent-foreground': '#ffffff',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ============================================================================
// std-list - Reusable main-view effect
// ============================================================================

const LIST_MAIN_VIEW: Effect = ['render-ui', 'main', {
  type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'icon', name: 'list', size: 'lg' },
      { type: 'typography', content: 'Items', variant: 'heading' },
      { type: 'button', label: 'Create', event: 'CREATE', variant: 'primary', icon: 'plus' },
    ] },
    { type: 'divider' },
    { type: 'data-grid', entity: 'Item', columns: ['name', 'status', 'createdAt'], itemActions: [
      { label: 'View', event: 'VIEW' },
      { label: 'Edit', event: 'EDIT' },
      { label: 'Delete', event: 'DELETE', variant: 'danger' },
    ] },
  ],
}];

// ============================================================================
// std-list - Entity List Management
// ============================================================================

/**
 * std-list - The core behavior for displaying and interacting with entity collections.
 *
 * States: browsing -> creating/viewing/editing/deleting
 * Implements complete CRUD operations with modal UI.
 */
export const LIST_BEHAVIOR: OrbitalSchema = {
  name: 'std-list',
  version: '1.0.0',
  description: 'Entity list management with CRUD operations',
  theme: UI_SLATE_THEME,
  orbitals: [
    {
      name: 'ListOrbital',
      entity: {
        name: 'Item',
        persistence: 'persistent',
        collection: 'items',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'status', type: 'enum', default: 'active', values: ['active', 'inactive', 'archived'] },
          { name: 'createdAt', type: 'date', default: '' },
        ],
      },
      traits: [
        {
          name: 'ListManagement',
          linkedEntity: 'Item',
          category: 'interaction',
          // When composed with other behaviors, add emits for cross-trait events:
          // emits: [{ event: 'ITEM_CREATED', scope: 'external', payloadSchema: [...] }]
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'creating' },
              { name: 'viewing' },
              { name: 'editing' },
              { name: 'deleting' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'CREATE', name: 'Create' },
              { key: 'VIEW', name: 'View', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'EDIT', name: 'Edit', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'DELETE', name: 'Delete', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'CONFIRM_DELETE', name: 'Confirm Delete', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'CLOSE', name: 'Close' },
              { key: 'SAVE', name: 'Save', payloadSchema: [{ name: 'data', type: 'object', required: true }] },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'Item'],
                  LIST_MAIN_VIEW,
                ],
              },
              {
                from: 'browsing',
                to: 'creating',
                event: 'CREATE',
                effects: [
                  ['fetch', 'Item'],
                  ['render-ui', 'modal', {
                    type: 'stack', direction: 'vertical', gap: 'md', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'plus-circle', size: 'md' },
                        { type: 'typography', content: 'Create Item', variant: 'heading' },
                      ] },
                      { type: 'divider' },
                      { type: 'form-section', entity: 'Item', mode: 'create', submitEvent: 'SAVE', cancelEvent: 'CANCEL' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ['fetch', 'Item', { id: '@payload.id' }],
                  ['render-ui', 'modal', {
                    type: 'stack', direction: 'vertical', gap: 'md', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'eye', size: 'md' },
                        { type: 'typography', content: '@Item.name', variant: 'heading' },
                        { type: 'badge', label: '@Item.status', variant: 'outline' },
                      ] },
                      { type: 'divider' },
                      { type: 'detail-panel', entity: 'Item', fields: ['name', 'status', 'createdAt'] },
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'button', label: 'Edit', event: 'EDIT', actionPayload: { id: '@payload.id' }, variant: 'primary', icon: 'pencil' },
                        { type: 'button', label: 'Close', event: 'CLOSE', variant: 'secondary' },
                      ] },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'editing',
                event: 'EDIT',
                effects: [
                  ['fetch', 'Item', { id: '@payload.id' }],
                  ['render-ui', 'modal', {
                    type: 'stack', direction: 'vertical', gap: 'md', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'pencil', size: 'md' },
                        { type: 'typography', content: 'Edit Item', variant: 'heading' },
                      ] },
                      { type: 'divider' },
                      { type: 'form-section', entity: 'Item', entityId: '@payload.id', submitEvent: 'SAVE', cancelEvent: 'CANCEL' },
                    ],
                  }],
                ],
              },
              {
                from: 'viewing',
                to: 'editing',
                event: 'EDIT',
                effects: [
                  ['fetch', 'Item', { id: '@payload.id' }],
                  ['render-ui', 'modal', {
                    type: 'stack', direction: 'vertical', gap: 'md', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'pencil', size: 'md' },
                        { type: 'typography', content: 'Edit Item', variant: 'heading' },
                      ] },
                      { type: 'divider' },
                      { type: 'form-section', entity: 'Item', entityId: '@payload.id', submitEvent: 'SAVE', cancelEvent: 'CANCEL' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'deleting',
                event: 'DELETE',
                effects: [
                  ['fetch', 'Item', { id: '@payload.id' }],
                  ['render-ui', 'modal', {
                    type: 'stack', direction: 'vertical', gap: 'md', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'alert-triangle', size: 'md' },
                        { type: 'typography', content: 'Delete Confirmation', variant: 'heading' },
                      ] },
                      { type: 'divider' },
                      { type: 'typography', content: 'Are you sure you want to delete this item?', variant: 'body' },
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'button', label: 'Delete', event: 'CONFIRM_DELETE', actionPayload: { id: '@payload.id' }, variant: 'primary', icon: 'trash' },
                        { type: 'button', label: 'Cancel', event: 'CANCEL', variant: 'secondary' },
                      ] },
                    ],
                  }],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'SAVE',
                effects: [
                  ['persist', 'create', 'Item', '@payload.data'],
                  ['fetch', 'Item'],
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'editing',
                to: 'browsing',
                event: 'SAVE',
                effects: [
                  ['persist', 'update', 'Item', '@payload.data'],
                  ['fetch', 'Item'],
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'deleting',
                to: 'browsing',
                event: 'CONFIRM_DELETE',
                effects: [
                  ['persist', 'delete', 'Item', { id: '@payload.id' }],
                  ['fetch', 'Item'],
                  ['render-ui', 'modal', null],
                ],
              },
              // CANCEL transitions (close modal + re-fetch collection)
              { from: 'creating', to: 'browsing', event: 'CANCEL', effects: [['fetch', 'Item'], ['render-ui', 'modal', null]] },
              { from: 'viewing', to: 'browsing', event: 'CANCEL', effects: [['fetch', 'Item'], ['render-ui', 'modal', null]] },
              { from: 'editing', to: 'browsing', event: 'CANCEL', effects: [['fetch', 'Item'], ['render-ui', 'modal', null]] },
              { from: 'deleting', to: 'browsing', event: 'CANCEL', effects: [['fetch', 'Item'], ['render-ui', 'modal', null]] },
              // CLOSE transitions (alias for CANCEL on view states)
              { from: 'creating', to: 'browsing', event: 'CLOSE', effects: [['fetch', 'Item'], ['render-ui', 'modal', null]] },
              { from: 'viewing', to: 'browsing', event: 'CLOSE', effects: [['fetch', 'Item'], ['render-ui', 'modal', null]] },
              { from: 'editing', to: 'browsing', event: 'CLOSE', effects: [['fetch', 'Item'], ['render-ui', 'modal', null]] },
              { from: 'deleting', to: 'browsing', event: 'CLOSE', effects: [['fetch', 'Item'], ['render-ui', 'modal', null]] },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'ItemsPage',
          path: '/items',
          isInitial: true,
          traits: [{ ref: 'ListManagement' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-detail - Reusable main-view effect
// ============================================================================

const DETAIL_LIST_VIEW: Effect = ['render-ui', 'main', {
  type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'file-text', size: 'lg' },
        { type: 'typography', content: 'Records', variant: 'h2' },
      ] },
      { type: 'button', label: 'Create', action: 'CREATE', variant: 'primary', icon: 'plus' },
    ] },
    { type: 'divider' },
    { type: 'data-list', entity: 'Record',
      fields: [
        { name: 'name', label: 'Name', icon: 'file-text', variant: 'h4' },
        { name: 'description', label: 'Description', icon: 'align-left', variant: 'body' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
      ],
      actions: [
        { label: 'View', event: 'SELECT', icon: 'eye', variant: 'secondary' },
      ],
    },
  ],
}];

const DETAIL_MAIN_VIEW: Effect = ['render-ui', 'main', {
  type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'file-text', size: 'lg' },
        { type: 'typography', content: '@entity.name', variant: 'h2' },
      ] },
      { type: 'badge', label: '@entity.status', variant: 'outline' },
    ] },
    { type: 'divider' },
    { type: 'data-list', entity: 'Record',
      fields: [
        { name: 'name', label: 'Name', icon: 'file-text', variant: 'h4' },
        { name: 'description', label: 'Description', icon: 'align-left', variant: 'body' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
      ],
    },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Edit', action: 'EDIT', variant: 'primary', icon: 'pencil' },
      { type: 'button', label: 'Delete', action: 'DELETE', variant: 'secondary', icon: 'trash' },
      { type: 'button', label: 'Back', action: 'BACK', variant: 'ghost', icon: 'arrow-left' },
    ] },
  ],
}];

// ============================================================================
// std-detail - Single Entity View
// ============================================================================

export const DETAIL_BEHAVIOR: OrbitalSchema = {
  name: 'std-detail',
  version: '1.0.0',
  description: 'Single entity view with edit/delete capabilities',
  theme: UI_SLATE_THEME,
  orbitals: [
    {
      name: 'DetailOrbital',
      entity: {
        name: 'Record',
        persistence: 'persistent',
        collection: 'records',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'description', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'active' },
        ],
      },
      traits: [
        {
          name: 'DetailView',
          linkedEntity: 'Record',
          category: 'interaction',
          // When composed: emits: [{ event: 'RECORD_UPDATED', ... }, { event: 'RECORD_DELETED', ... }]
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'viewing' },
              { name: 'creating' },
              { name: 'editing' },
              { name: 'deleting' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'SELECT', name: 'Select Record' },
              { key: 'CREATE', name: 'Create Record' },
              { key: 'BACK', name: 'Back to List' },
              { key: 'EDIT', name: 'Edit' },
              { key: 'SAVE', name: 'Save', payloadSchema: [{ name: 'data', type: 'object', required: true }] },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'CLOSE', name: 'Close' },
              { key: 'DELETE', name: 'Delete' },
              { key: 'CONFIRM_DELETE', name: 'Confirm Delete' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'Record'],
                  DETAIL_LIST_VIEW,
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'SELECT',
                effects: [
                  ['fetch', 'Record'],
                  DETAIL_MAIN_VIEW,
                ],
              },
              {
                from: 'viewing',
                to: 'browsing',
                event: 'BACK',
                effects: [
                  ['fetch', 'Record'],
                  DETAIL_LIST_VIEW,
                ],
              },
              {
                from: 'browsing',
                to: 'creating',
                event: 'CREATE',
                effects: [
                  ['render-ui', 'modal', {
                    type: 'stack', direction: 'vertical', gap: 'md', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'plus', size: 'md' },
                        { type: 'typography', content: 'New Record', variant: 'h3' },
                      ] },
                      { type: 'divider' },
                      { type: 'form-section', entity: 'Record', mode: 'create', submitEvent: 'SAVE', cancelEvent: 'CANCEL' },
                    ],
                  }],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'SAVE',
                effects: [
                  ['persist', 'create', 'Record', '@payload.data'],
                  ['fetch', 'Record'],
                  ['render-ui', 'modal', null],
                  DETAIL_LIST_VIEW,
                ],
              },
              {
                from: 'viewing',
                to: 'editing',
                event: 'EDIT',
                effects: [
                  ['fetch', 'Record'],
                  ['render-ui', 'modal', {
                    type: 'stack', direction: 'vertical', gap: 'md', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'pencil', size: 'md' },
                        { type: 'typography', content: 'Edit Record', variant: 'h3' },
                      ] },
                      { type: 'divider' },
                      { type: 'form-section', entity: 'Record', mode: 'edit', submitEvent: 'SAVE', cancelEvent: 'CANCEL' },
                    ],
                  }],
                ],
              },
              {
                from: 'editing',
                to: 'viewing',
                event: 'SAVE',
                effects: [
                  ['persist', 'update', 'Record', '@payload.data'],
                  ['render-ui', 'modal', null],
                ],
              },
              {
                from: 'viewing',
                to: 'deleting',
                event: 'DELETE',
                effects: [
                  ['render-ui', 'modal', {
                    type: 'stack', direction: 'vertical', gap: 'md', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'alert-triangle', size: 'md' },
                        { type: 'typography', content: 'Delete Confirmation', variant: 'h3' },
                      ] },
                      { type: 'divider' },
                      { type: 'typography', content: 'Are you sure you want to delete this record?', variant: 'body' },
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'button', label: 'Delete', action: 'CONFIRM_DELETE', variant: 'primary', icon: 'trash' },
                        { type: 'button', label: 'Cancel', action: 'CANCEL', variant: 'secondary' },
                      ] },
                    ],
                  }],
                ],
              },
              {
                from: 'deleting',
                to: 'browsing',
                event: 'CONFIRM_DELETE',
                effects: [
                  ['persist', 'delete', 'Record'],
                  ['fetch', 'Record'],
                  ['render-ui', 'modal', null],
                  DETAIL_LIST_VIEW,
                ],
              },
              // Modal close transitions
              { from: 'creating', to: 'browsing', event: 'CANCEL', effects: [['render-ui', 'modal', null], DETAIL_LIST_VIEW] },
              { from: 'creating', to: 'browsing', event: 'CLOSE', effects: [['render-ui', 'modal', null], DETAIL_LIST_VIEW] },
              { from: 'editing', to: 'viewing', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
              { from: 'editing', to: 'viewing', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
              { from: 'deleting', to: 'viewing', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
              { from: 'deleting', to: 'viewing', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'RecordsPage',
          path: '/records',
          isInitial: true,
          traits: [{ ref: 'DetailView' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-form - Reusable main-view effects
// ============================================================================

const FORM_EDITING_VIEW: Effect = ['render-ui', 'main', {
  type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'icon', name: 'file-plus', size: 'lg' },
      { type: 'typography', content: 'New Entry', variant: 'heading' },
    ] },
    { type: 'divider' },
    { type: 'form-section', entity: 'FormEntry', mode: 'create', submitEvent: 'SUBMIT' },
  ],
}];

// ============================================================================
// std-form - Form State Management
// ============================================================================

export const FORM_BEHAVIOR: OrbitalSchema = {
  name: 'std-form',
  version: '1.0.0',
  description: 'Form state management with validation and submission',
  theme: UI_SLATE_THEME,
  orbitals: [
    {
      name: 'FormOrbital',
      entity: {
        name: 'FormEntry',
        persistence: 'persistent',
        collection: 'entries',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'value', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'draft' },
        ],
      },
      traits: [
        {
          name: 'FormFlow',
          linkedEntity: 'FormEntry',
          category: 'interaction',
          // When composed: emits: [{ event: 'FORM_SUBMITTED', ... }]
          stateMachine: {
            states: [
              { name: 'idle', isInitial: true },
              { name: 'editing' },
              { name: 'submitting' },
              { name: 'success' },
              { name: 'error' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'SUBMIT', name: 'Submit', payloadSchema: [{ name: 'data', type: 'object', required: true }] },
              { key: 'SUBMIT_SUCCESS', name: 'Submit Success' },
              { key: 'SUBMIT_ERROR', name: 'Submit Error', payloadSchema: [{ name: 'message', type: 'string', required: true }] },
              { key: 'RESET', name: 'Reset' },
              { key: 'RETRY', name: 'Retry' },
            ],
            transitions: [
              {
                from: 'idle',
                to: 'editing',
                event: 'INIT',
                effects: [
                  ['fetch', 'FormEntry'],
                  FORM_EDITING_VIEW,
                ],
              },
              {
                from: 'editing',
                to: 'submitting',
                event: 'SUBMIT',
                effects: [
                  ['persist', 'create', 'FormEntry', '@payload.data'],
                  ['render-ui', 'main', {
                    type: 'stack', direction: 'vertical', gap: 'md', children: [
                      { type: 'icon', name: 'loader', size: 'lg' },
                      { type: 'typography', content: 'Saving', variant: 'heading' },
                      { type: 'typography', content: 'Please wait...', variant: 'body' },
                      { type: 'progress-bar', value: 50 },
                    ],
                  }],
                ],
              },
              {
                from: 'submitting',
                to: 'success',
                event: 'SUBMIT_SUCCESS',
                effects: [
                  ['render-ui', 'main', {
                    type: 'stack', direction: 'vertical', gap: 'md', children: [
                      { type: 'icon', name: 'check-circle', size: 'lg' },
                      { type: 'typography', content: 'Success', variant: 'heading' },
                      { type: 'typography', content: 'Entry saved successfully.', variant: 'body' },
                      { type: 'button', label: 'Start Over', event: 'RESET', variant: 'primary', icon: 'refresh-cw' },
                    ],
                  }],
                ],
              },
              {
                from: 'submitting',
                to: 'error',
                event: 'SUBMIT_ERROR',
                effects: [
                  ['render-ui', 'main', {
                    type: 'stack', direction: 'vertical', gap: 'md', children: [
                      { type: 'icon', name: 'x-circle', size: 'lg' },
                      { type: 'typography', content: 'Error', variant: 'heading' },
                      { type: 'typography', content: 'Failed to save. Please try again.', variant: 'body' },
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'button', label: 'Retry', event: 'RETRY', variant: 'primary', icon: 'refresh-cw' },
                        { type: 'button', label: 'Reset', event: 'RESET', variant: 'secondary' },
                      ] },
                    ],
                  }],
                ],
              },
              {
                from: 'error',
                to: 'editing',
                event: 'RETRY',
                effects: [
                  ['fetch', 'FormEntry'],
                  FORM_EDITING_VIEW,
                ],
              },
              {
                from: 'success',
                to: 'idle',
                event: 'RESET',
                effects: [],
              },
              {
                from: 'error',
                to: 'idle',
                event: 'RESET',
                effects: [],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'FormPage',
          path: '/entries/new',
          isInitial: true,
          traits: [{ ref: 'FormFlow' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-modal - Modal Dialog
// ============================================================================

export const MODAL_BEHAVIOR: OrbitalSchema = {
  name: 'std-modal',
  version: '1.0.0',
  description: 'Modal dialog with open/close state management',
  theme: UI_SLATE_THEME,
  orbitals: [
    {
      name: 'ModalOrbital',
      entity: {
        name: 'ModalContent',
        persistence: 'runtime',
        collection: 'modals',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
          { name: 'message', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'ModalControl',
          linkedEntity: 'ModalContent',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'closed', isInitial: true },
              { name: 'open' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'OPEN', name: 'Open' },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'CONFIRM', name: 'Confirm' },
            ],
            transitions: [
              {
                from: 'closed',
                to: 'closed',
                event: 'INIT',
                effects: [
                  ['render-ui', 'main', {
                    type: 'stack', direction: 'vertical', gap: 'md', children: [
                      { type: 'icon', name: 'message-square', size: 'lg' },
                      { type: 'typography', content: 'Ready', variant: 'heading' },
                      { type: 'typography', content: 'Click to open dialog.', variant: 'body' },
                      { type: 'button', label: 'Open Dialog', event: 'OPEN', variant: 'primary', icon: 'external-link' },
                    ],
                  }],
                ],
              },
              {
                from: 'closed',
                to: 'open',
                event: 'OPEN',
                effects: [
                  ['render-ui', 'modal', {
                    type: 'stack', direction: 'vertical', gap: 'md', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'help-circle', size: 'md' },
                        { type: 'typography', content: '@entity.title', variant: 'heading' },
                      ] },
                      { type: 'divider' },
                      { type: 'typography', content: '@entity.message', variant: 'body' },
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'button', label: 'Confirm', event: 'CONFIRM', variant: 'primary', icon: 'check' },
                        { type: 'button', label: 'Cancel', event: 'CANCEL', variant: 'secondary' },
                      ] },
                    ],
                  }],
                ],
              },
              {
                from: 'open',
                to: 'closed',
                event: 'CLOSE',
                effects: [['render-ui', 'modal', null]],
              },
              {
                from: 'open',
                to: 'closed',
                event: 'CANCEL',
                effects: [['render-ui', 'modal', null]],
              },
              {
                from: 'open',
                to: 'closed',
                event: 'CONFIRM',
                effects: [['render-ui', 'modal', null]],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'ModalDemoPage',
          path: '/modal',
          isInitial: true,
          traits: [{ ref: 'ModalControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-drawer - Side Drawer Panel
// ============================================================================

export const DRAWER_BEHAVIOR: OrbitalSchema = {
  name: 'std-drawer',
  version: '1.0.0',
  description: 'Side drawer panel for detail views',
  theme: UI_SLATE_THEME,
  orbitals: [
    {
      name: 'DrawerOrbital',
      entity: {
        name: 'DrawerItem',
        persistence: 'runtime',
        collection: 'draweritems',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'DrawerControl',
          linkedEntity: 'DrawerItem',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'closed', isInitial: true },
              { name: 'open' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'OPEN', name: 'Open' },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
            ],
            transitions: [
              {
                from: 'closed',
                to: 'closed',
                event: 'INIT',
                effects: [
                  ['render-ui', 'main', {
                    type: 'stack', direction: 'vertical', gap: 'md', children: [
                      { type: 'icon', name: 'sidebar', size: 'lg' },
                      { type: 'typography', content: 'Drawer', variant: 'heading' },
                      { type: 'typography', content: 'Select an item to open the drawer.', variant: 'body' },
                    ],
                  }],
                ],
              },
              {
                from: 'closed',
                to: 'open',
                event: 'OPEN',
                effects: [
                  ['fetch', 'DrawerItem'],
                  ['render-ui', 'modal', {
                    type: 'stack', direction: 'vertical', gap: 'md', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
                        { type: 'icon', name: 'info', size: 'md' },
                        { type: 'typography', content: '@entity.title', variant: 'heading' },
                      ] },
                      { type: 'divider' },
                      { type: 'data-list', entity: 'DrawerItem', fields: ['title'] },
                      { type: 'button', label: 'Close', event: 'CLOSE', variant: 'secondary', icon: 'x' },
                    ],
                  }],
                ],
              },
              {
                from: 'open',
                to: 'closed',
                event: 'CLOSE',
                effects: [['render-ui', 'modal', null]],
              },
              {
                from: 'open',
                to: 'closed',
                event: 'CANCEL',
                effects: [['render-ui', 'modal', null]],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'DrawerDemoPage',
          path: '/drawer',
          isInitial: true,
          traits: [{ ref: 'DrawerControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-tabs - Tabbed Navigation
// ============================================================================

export const TABS_BEHAVIOR: OrbitalSchema = {
  name: 'std-tabs',
  version: '1.0.0',
  description: 'Tabbed navigation within a page',
  theme: UI_SLATE_THEME,
  orbitals: [
    {
      name: 'TabsOrbital',
      entity: {
        name: 'TabContent',
        persistence: 'runtime',
        collection: 'tabcontents',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'activeTab', type: 'string', default: 'overview' },
        ],
      },
      traits: [
        {
          name: 'TabNavigation',
          linkedEntity: 'TabContent',
          category: 'interaction',
          stateMachine: {
            states: [{ name: 'active', isInitial: true }],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'SELECT_TAB', name: 'Select Tab', payloadSchema: [{ name: 'tabId', type: 'string', required: true }] },
            ],
            transitions: [
              {
                from: 'active',
                to: 'active',
                event: 'INIT',
                effects: [
                  ['fetch', 'TabContent'],
                  ['render-ui', 'main', {
                    type: 'stack', direction: 'vertical', gap: 'lg', children: [
                      { type: 'stack', direction: 'horizontal', gap: 'md', children: [
                        { type: 'icon', name: 'layers', size: 'lg' },
                        { type: 'typography', content: 'Tabs', variant: 'h2' },
                        { type: 'button', label: 'Add Tab', action: 'SELECT_TAB', icon: 'plus', variant: 'primary' },
                      ] },
                      { type: 'divider' },
                      { type: 'tabs', entity: 'TabContent', onTabChange: 'SELECT_TAB',
                        tabs: [
                          { id: 'overview', label: 'Overview' },
                          { id: 'details', label: 'Details' },
                          { id: 'settings', label: 'Settings' },
                        ],
                      },
                    ],
                  }],
                ],
              },
              {
                from: 'active',
                to: 'active',
                event: 'SELECT_TAB',
                effects: [
                  ['set', '@entity.activeTab', '@payload.tabId'],
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'TabsPage',
          path: '/tabs',
          isInitial: true,
          traits: [{ ref: 'TabNavigation' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-wizard - Reusable step effects
// ============================================================================

const WIZARD_STEPS = ['Basic Info', 'Details', 'Review'];

const WIZARD_STEP1_VIEW: Effect = ['render-ui', 'main', {
  type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'icon', name: 'clipboard', size: 'lg' },
      { type: 'typography', content: 'Setup Wizard', variant: 'heading' },
      { type: 'badge', label: 'Step 1 of 3', variant: 'outline' },
    ] },
    { type: 'wizard-progress', steps: WIZARD_STEPS, currentStep: 0 },
    { type: 'divider' },
    { type: 'form-section', entity: 'WizardEntry', submitEvent: 'NEXT' },
  ],
}];

const WIZARD_STEP2_VIEW: Effect = ['render-ui', 'main', {
  type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'icon', name: 'clipboard', size: 'lg' },
      { type: 'typography', content: 'Setup Wizard', variant: 'heading' },
      { type: 'badge', label: 'Step 2 of 3', variant: 'outline' },
    ] },
    { type: 'wizard-progress', steps: WIZARD_STEPS, currentStep: 1 },
    { type: 'divider' },
    { type: 'form-section', entity: 'WizardEntry', submitEvent: 'NEXT', cancelEvent: 'PREV' },
  ],
}];

const WIZARD_REVIEW_VIEW: Effect = ['render-ui', 'main', {
  type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'icon', name: 'clipboard', size: 'lg' },
      { type: 'typography', content: 'Setup Wizard', variant: 'heading' },
      { type: 'badge', label: 'Step 3 of 3', variant: 'outline' },
    ] },
    { type: 'wizard-progress', steps: WIZARD_STEPS, currentStep: 2 },
    { type: 'divider' },
    { type: 'data-list', entity: 'WizardEntry', fields: ['name', 'category', 'details', 'status'] },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Back', event: 'PREV', variant: 'secondary', icon: 'arrow-left' },
      { type: 'button', label: 'Complete', event: 'COMPLETE', variant: 'primary', icon: 'check' },
    ] },
  ],
}];

// ============================================================================
// std-wizard - Multi-Step Flow
// ============================================================================

export const WIZARD_BEHAVIOR: OrbitalSchema = {
  name: 'std-wizard',
  version: '1.0.0',
  description: 'Multi-step wizard flow',
  theme: UI_SLATE_THEME,
  orbitals: [
    {
      name: 'WizardOrbital',
      entity: {
        name: 'WizardEntry',
        persistence: 'persistent',
        collection: 'wizardentries',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'category', type: 'string', default: '' },
          { name: 'details', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'draft' },
        ],
      },
      traits: [
        {
          name: 'WizardFlow',
          linkedEntity: 'WizardEntry',
          category: 'interaction',
          // When composed: emits: [{ event: 'WIZARD_COMPLETED', ... }]
          stateMachine: {
            states: [
              { name: 'step1', isInitial: true },
              { name: 'step2' },
              { name: 'review' },
              { name: 'complete' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'NEXT', name: 'Next', payloadSchema: [{ name: 'data', type: 'object', required: true }] },
              { key: 'PREV', name: 'Previous' },
              { key: 'COMPLETE', name: 'Complete' },
            ],
            transitions: [
              {
                from: 'step1',
                to: 'step1',
                event: 'INIT',
                effects: [
                  ['fetch', 'WizardEntry'],
                  WIZARD_STEP1_VIEW,
                ],
              },
              {
                from: 'step1',
                to: 'step2',
                event: 'NEXT',
                effects: [
                  ['fetch', 'WizardEntry'],
                  WIZARD_STEP2_VIEW,
                ],
              },
              {
                from: 'step2',
                to: 'step1',
                event: 'PREV',
                effects: [
                  ['fetch', 'WizardEntry'],
                  WIZARD_STEP1_VIEW,
                ],
              },
              {
                from: 'step2',
                to: 'review',
                event: 'NEXT',
                effects: [
                  ['fetch', 'WizardEntry'],
                  WIZARD_REVIEW_VIEW,
                ],
              },
              {
                from: 'review',
                to: 'step2',
                event: 'PREV',
                effects: [
                  ['fetch', 'WizardEntry'],
                  WIZARD_STEP2_VIEW,
                ],
              },
              {
                from: 'review',
                to: 'complete',
                event: 'COMPLETE',
                effects: [
                  ['persist', 'create', 'WizardEntry', {}],
                  ['render-ui', 'main', {
                    type: 'stack', direction: 'vertical', gap: 'md', children: [
                      { type: 'icon', name: 'check-circle', size: 'lg' },
                      { type: 'typography', content: 'Complete', variant: 'heading' },
                      { type: 'typography', content: 'Your entry has been submitted.', variant: 'body' },
                      { type: 'button', label: 'Start New', event: 'INIT', variant: 'primary', icon: 'plus' },
                    ],
                  }],
                ],
              },
              {
                from: 'complete',
                to: 'step1',
                event: 'INIT',
                effects: [
                  ['fetch', 'WizardEntry'],
                  WIZARD_STEP1_VIEW,
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'WizardPage',
          path: '/wizard',
          isInitial: true,
          traits: [{ ref: 'WizardFlow' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-masterdetail - Reusable main-view effects
// ============================================================================

const MASTER_LIST_VIEW: Effect = ['render-ui', 'main', {
  type: 'stack', direction: 'horizontal', gap: 'lg', children: [
    { type: 'stack', direction: 'vertical', gap: 'md', children: [
      { type: 'stack', direction: 'horizontal', gap: 'md', children: [
        { type: 'icon', name: 'layout', size: 'lg' },
        { type: 'typography', content: 'Assets', variant: 'h2' },
      ] },
      { type: 'data-list', entity: 'Asset', fields: ['name', 'type', 'description'], itemActions: [{ label: 'View', event: 'SELECT' }] },
    ] },
    { type: 'divider' },
    { type: 'stack', direction: 'vertical', gap: 'md', align: 'center', children: [
      { type: 'icon', name: 'file-text', size: 'xl' },
      { type: 'typography', content: 'Select an item to view details', variant: 'body' },
    ] },
  ],
}];

const MASTER_DETAIL_SELECTED_VIEW: Effect = ['render-ui', 'main', {
  type: 'stack', direction: 'horizontal', gap: 'lg', children: [
    { type: 'stack', direction: 'vertical', gap: 'md', children: [
      { type: 'stack', direction: 'horizontal', gap: 'md', children: [
        { type: 'icon', name: 'layout', size: 'lg' },
        { type: 'typography', content: 'Assets', variant: 'h2' },
      ] },
      { type: 'data-list', entity: 'Asset', fields: ['name', 'type'], itemActions: [{ label: 'View', event: 'SELECT' }] },
    ] },
    { type: 'divider' },
    { type: 'stack', direction: 'vertical', gap: 'md', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'file-text', size: 'md' },
        { type: 'typography', content: '@entity.name', variant: 'h3' },
        { type: 'badge', label: '@entity.type', variant: 'outline' },
      ] },
      { type: 'stack', direction: 'horizontal', gap: 'md', children: [
        { type: 'stat-card', label: 'Name', value: '@entity.name', icon: 'tag' },
        { type: 'stat-card', label: 'Type', value: '@entity.type', icon: 'folder' },
      ] },
      { type: 'data-list', entity: 'Asset', fields: ['name', 'type', 'description'] },
      { type: 'button', label: 'Back', action: 'DESELECT', variant: 'secondary', icon: 'arrow-left' },
    ] },
  ],
}];

// ============================================================================
// std-masterdetail - List + Detail Layout
// ============================================================================

export const MASTER_DETAIL_BEHAVIOR: OrbitalSchema = {
  name: 'std-masterdetail',
  version: '1.0.0',
  description: 'Master-detail layout with synchronized list and detail views',
  theme: UI_SLATE_THEME,
  orbitals: [
    {
      name: 'MasterDetailOrbital',
      entity: {
        name: 'Asset',
        persistence: 'persistent',
        collection: 'assets',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'type', type: 'string', default: '' },
          { name: 'description', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'MasterDetailNav',
          linkedEntity: 'Asset',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'selected' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'SELECT', name: 'Select', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'DESELECT', name: 'Deselect' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'Asset'],
                  MASTER_LIST_VIEW,
                ],
              },
              {
                from: 'browsing',
                to: 'selected',
                event: 'SELECT',
                effects: [
                  ['fetch', 'Asset'],
                  MASTER_DETAIL_SELECTED_VIEW,
                ],
              },
              {
                from: 'selected',
                to: 'selected',
                event: 'SELECT',
                effects: [
                  ['fetch', 'Asset'],
                  MASTER_DETAIL_SELECTED_VIEW,
                ],
              },
              {
                from: 'selected',
                to: 'browsing',
                event: 'DESELECT',
                effects: [
                  ['fetch', 'Asset'],
                  MASTER_LIST_VIEW,
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'AssetsPage',
          path: '/assets',
          isInitial: true,
          traits: [{ ref: 'MasterDetailNav' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-filter-ui - Reusable main-view effects
// ============================================================================

const FILTER_DEFAULT_VIEW: Effect = ['render-ui', 'main', {
  type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'icon', name: 'search', size: 'lg' },
      { type: 'typography', content: 'Items', variant: 'heading' },
    ] },
    { type: 'search-input', placeholder: 'Search items...', event: 'SEARCH' },
    { type: 'divider' },
    { type: 'data-grid', entity: 'FilterableItem', columns: ['name', 'category', 'status'], itemActions: [
      { label: 'Refresh', event: 'INIT' },
    ] },
  ],
}];

const FILTER_ACTIVE_VIEW: Effect = ['render-ui', 'main', {
  type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'icon', name: 'filter', size: 'lg' },
      { type: 'typography', content: 'Items', variant: 'heading' },
      { type: 'badge', label: 'Filtered', variant: 'outline' },
      { type: 'button', label: 'Clear', event: 'CLEAR_FILTERS', variant: 'secondary', icon: 'x' },
    ] },
    { type: 'search-input', placeholder: 'Search items...', event: 'SEARCH' },
    { type: 'divider' },
    { type: 'data-grid', entity: 'FilterableItem', columns: ['name', 'category', 'status'], itemActions: [
      { label: 'View', event: 'VIEW' },
    ] },
  ],
}];

// ============================================================================
// std-filter-ui - Filter Management
// ============================================================================

export const FILTER_BEHAVIOR: OrbitalSchema = {
  name: 'std-filter-ui',
  version: '1.0.0',
  description: 'Filter and search management for lists',
  theme: UI_SLATE_THEME,
  orbitals: [
    {
      name: 'FilterOrbital',
      entity: {
        name: 'FilterableItem',
        persistence: 'persistent',
        collection: 'filterableitems',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'category', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'active' },
        ],
      },
      traits: [
        {
          name: 'FilterControl',
          linkedEntity: 'FilterableItem',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'idle', isInitial: true },
              { name: 'filtering' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'SET_FILTER', name: 'Set Filter', payloadSchema: [{ name: 'field', type: 'string', required: true }, { name: 'value', type: 'string', required: true }] },
              { key: 'CLEAR_FILTERS', name: 'Clear Filters' },
              { key: 'SEARCH', name: 'Search', payloadSchema: [{ name: 'term', type: 'string', required: true }] },
              { key: 'VIEW', name: 'View', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
            ],
            transitions: [
              {
                from: 'idle',
                to: 'idle',
                event: 'INIT',
                effects: [
                  ['fetch', 'FilterableItem'],
                  FILTER_DEFAULT_VIEW,
                ],
              },
              {
                from: 'idle',
                to: 'filtering',
                event: 'SET_FILTER',
                effects: [
                  ['fetch', 'FilterableItem'],
                  FILTER_ACTIVE_VIEW,
                ],
              },
              {
                from: 'filtering',
                to: 'filtering',
                event: 'SET_FILTER',
                effects: [
                  ['fetch', 'FilterableItem'],
                  FILTER_ACTIVE_VIEW,
                ],
              },
              {
                from: 'filtering',
                to: 'idle',
                event: 'CLEAR_FILTERS',
                effects: [
                  ['fetch', 'FilterableItem'],
                  FILTER_DEFAULT_VIEW,
                ],
              },
              {
                from: 'idle',
                to: 'filtering',
                event: 'SEARCH',
                effects: [
                  ['fetch', 'FilterableItem'],
                  FILTER_ACTIVE_VIEW,
                ],
              },
              {
                from: 'filtering',
                to: 'filtering',
                event: 'VIEW',
                effects: [
                  ['fetch', 'FilterableItem'],
                  FILTER_ACTIVE_VIEW,
                ],
              },
              {
                from: 'idle',
                to: 'idle',
                event: 'VIEW',
                effects: [
                  ['fetch', 'FilterableItem'],
                  FILTER_DEFAULT_VIEW,
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'FilterPage',
          path: '/filter',
          isInitial: true,
          traits: [{ ref: 'FilterControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Behaviors
// ============================================================================

export const UI_INTERACTION_BEHAVIORS: OrbitalSchema[] = [
  LIST_BEHAVIOR,
  DETAIL_BEHAVIOR,
  FORM_BEHAVIOR,
  MODAL_BEHAVIOR,
  DRAWER_BEHAVIOR,
  TABS_BEHAVIOR,
  WIZARD_BEHAVIOR,
  MASTER_DETAIL_BEHAVIOR,
  FILTER_BEHAVIOR,
];
