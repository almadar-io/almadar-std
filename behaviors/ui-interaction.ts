/**
 * UI Interaction Behaviors
 *
 * Standard behaviors for common UI interaction patterns.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from './types.js';

// ============================================================================
// std-list - Entity List Management
// ============================================================================

/**
 * std-list - The core behavior for displaying and interacting with entity collections.
 *
 * States: browsing → creating/viewing/editing/deleting
 * Implements complete CRUD operations with modal UI.
 */
export const LIST_BEHAVIOR: OrbitalSchema = {
  name: 'std-list',
  version: '1.0.0',
  description: 'Entity list management with CRUD operations',
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
          { name: 'status', type: 'string', default: 'active' },
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
              { key: 'CONFIRM_DELETE', name: 'Confirm Delete' },
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
                  ['render-ui', 'main', { type: 'page-header', 
                    title: 'Items',
                    actions: [{ label: 'Create', event: 'CREATE', variant: 'primary' }],
                  }],
                  ['render-ui', 'main', { type: 'entity-cards', entity: 'Item',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                      { label: 'Edit', event: 'EDIT' },
                      { label: 'Delete', event: 'DELETE', variant: 'danger' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'creating',
                event: 'CREATE',
                effects: [
                  ['fetch', 'Item'],
                  ['render-ui', 'modal', { type: 'form-section', 
                    entity: 'Item',
                    mode: 'create',
                    submitEvent: 'SAVE',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ['fetch', 'Item'],
                  ['render-ui', 'modal', { type: 'detail-panel', entity: 'Item',
                    actions: [
                      { label: 'Edit', event: 'EDIT' },
                      { label: 'Close', event: 'CLOSE' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'editing',
                event: 'EDIT',
                effects: [
                  ['fetch', 'Item'],
                  ['render-ui', 'modal', { type: 'form-section', 
                    entity: 'Item',
                    mode: 'edit',
                    submitEvent: 'SAVE',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'viewing',
                to: 'editing',
                event: 'EDIT',
                effects: [
                  ['fetch', 'Item'],
                  ['render-ui', 'modal', { type: 'form-section', 
                    entity: 'Item',
                    mode: 'edit',
                    submitEvent: 'SAVE',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'deleting',
                event: 'DELETE',
                effects: [
                  ['render-ui', 'modal', { type: 'confirm-dialog', title: 'Delete Confirmation', message: 'Are you sure you want to delete this item?' }, { confirmEvent: 'CONFIRM_DELETE', cancelEvent: 'CANCEL' }],
                ],
              },
              {
                from: 'creating',
                to: 'browsing',
                event: 'SAVE',
                effects: [
                  ['persist', 'create', 'Item', '@payload.data'],
                ],
              },
              {
                from: 'editing',
                to: 'browsing',
                event: 'SAVE',
                effects: [
                  ['persist', 'update', 'Item', '@payload.data'],
                ],
              },
              {
                from: 'deleting',
                to: 'browsing',
                event: 'CONFIRM_DELETE',
                effects: [
                  ['persist', 'delete', 'Item'],
                ],
              },
              // CANCEL transitions (close modal)
              { from: 'creating', to: 'browsing', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
              { from: 'viewing', to: 'browsing', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
              { from: 'editing', to: 'browsing', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
              { from: 'deleting', to: 'browsing', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
              // CLOSE transitions (alias for CANCEL on view states)
              { from: 'creating', to: 'browsing', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
              { from: 'viewing', to: 'browsing', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
              { from: 'editing', to: 'browsing', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
              { from: 'deleting', to: 'browsing', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
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
// std-detail - Single Entity View
// ============================================================================

export const DETAIL_BEHAVIOR: OrbitalSchema = {
  name: 'std-detail',
  version: '1.0.0',
  description: 'Single entity view with edit/delete capabilities',
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
              { name: 'viewing', isInitial: true },
              { name: 'editing' },
              { name: 'deleting' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'EDIT', name: 'Edit' },
              { key: 'SAVE', name: 'Save', payloadSchema: [{ name: 'data', type: 'object', required: true }] },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'CLOSE', name: 'Close' },
              { key: 'DELETE', name: 'Delete' },
              { key: 'CONFIRM_DELETE', name: 'Confirm Delete' },
            ],
            transitions: [
              {
                from: 'viewing',
                to: 'viewing',
                event: 'INIT',
                effects: [
                  ['fetch', 'Record'],
                  ['render-ui', 'main', { type: 'page-header', title: '@entity.name' }],
                  ['render-ui', 'main', { type: 'detail-panel', entity: 'Record',
                    actions: [
                      { label: 'Edit', event: 'EDIT' },
                      { label: 'Delete', event: 'DELETE', variant: 'danger' },
                    ],
                  }],
                ],
              },
              {
                from: 'viewing',
                to: 'editing',
                event: 'EDIT',
                effects: [
                  ['fetch', 'Record'],
                  ['render-ui', 'modal', { type: 'form-section', 
                    entity: 'Record',
                    mode: 'edit',
                    submitEvent: 'SAVE',
                    cancelEvent: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'editing',
                to: 'viewing',
                event: 'SAVE',
                effects: [
                  ['persist', 'update', 'Record', '@payload.data'],
                ],
              },
              {
                from: 'viewing',
                to: 'deleting',
                event: 'DELETE',
                effects: [
                  ['render-ui', 'modal', { type: 'confirm-dialog', title: 'Delete Confirmation', message: 'Are you sure you want to delete this record?' }, { confirmEvent: 'CONFIRM_DELETE', cancelEvent: 'CANCEL' }],
                ],
              },
              {
                from: 'deleting',
                to: 'viewing',
                event: 'CONFIRM_DELETE',
                effects: [
                  ['persist', 'delete', 'Record'],
                ],
              },
              // Modal close transitions
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
          name: 'RecordPage',
          path: '/records/:id',
          traits: [{ ref: 'DetailView' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-form - Form State Management
// ============================================================================

export const FORM_BEHAVIOR: OrbitalSchema = {
  name: 'std-form',
  version: '1.0.0',
  description: 'Form state management with validation and submission',
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
                  ['render-ui', 'main', { type: 'page-header',  title: 'New Entry' }],
                  ['render-ui', 'main', { type: 'form-section', 
                    entity: 'FormEntry',
                    mode: 'create',
                    submitEvent: 'SUBMIT',
                  }],
                ],
              },
              {
                from: 'editing',
                to: 'submitting',
                event: 'SUBMIT',
                effects: [
                  ['persist', 'create', 'FormEntry', '@payload.data'],
                  ['render-ui', 'main', { type: 'empty-state',  title: 'Saving', message: 'Please wait...' }],
                ],
              },
              {
                from: 'submitting',
                to: 'success',
                event: 'SUBMIT_SUCCESS',
                effects: [
                  ['render-ui', 'main', { type: 'empty-state',  title: 'Success', message: 'Entry saved successfully.' }],
                ],
              },
              {
                from: 'submitting',
                to: 'error',
                event: 'SUBMIT_ERROR',
                effects: [
                  ['render-ui', 'main', { type: 'empty-state',  title: 'Error', message: 'Failed to save. Please try again.' }],
                ],
              },
              {
                from: 'error',
                to: 'editing',
                event: 'RETRY',
                effects: [
                  ['fetch', 'FormEntry'],
                  ['render-ui', 'main', { type: 'form-section', 
                    entity: 'FormEntry',
                    mode: 'create',
                    submitEvent: 'SUBMIT',
                  }],
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
                  ['render-ui', 'main', { type: 'empty-state',  title: 'Ready', message: 'Click to open dialog.' }],
                ],
              },
              {
                from: 'closed',
                to: 'open',
                event: 'OPEN',
                effects: [
                  ['render-ui', 'modal', { type: 'confirm-dialog', title: '@entity.title', message: '@entity.message' }, { confirmEvent: 'CONFIRM', cancelEvent: 'CANCEL' }],
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
                  ['render-ui', 'main', { type: 'empty-state',  title: 'Drawer', message: 'Select an item to open the drawer.' }],
                ],
              },
              {
                from: 'closed',
                to: 'open',
                event: 'OPEN',
                effects: [
                  ['fetch', 'DrawerItem'],
                  ['render-ui', 'modal', { type: 'detail-panel',  entity: 'DrawerItem' }],
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
                  ['render-ui', 'main', { type: 'page-header',  title: 'Tabs' }],
                  ['render-ui', 'main', { type: 'tabs', onTabChange: 'SELECT_TAB' }, { entity: 'TabContent' }],
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
// std-wizard - Multi-Step Flow
// ============================================================================

export const WIZARD_BEHAVIOR: OrbitalSchema = {
  name: 'std-wizard',
  version: '1.0.0',
  description: 'Multi-step wizard flow',
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
                  ['render-ui', 'main', { type: 'wizard-progress', 
                    steps: ['Basic Info', 'Details', 'Review'],
                    currentStep: 0,
                  }],
                  ['render-ui', 'main', { type: 'form-section', 
                    entity: 'WizardEntry',
                    submitEvent: 'NEXT',
                  }],
                ],
              },
              {
                from: 'step1',
                to: 'step2',
                event: 'NEXT',
                effects: [
                  ['fetch', 'WizardEntry'],
                  ['render-ui', 'main', { type: 'wizard-progress', 
                    steps: ['Basic Info', 'Details', 'Review'],
                    currentStep: 1,
                  }],
                  ['render-ui', 'main', { type: 'form-section', 
                    entity: 'WizardEntry',
                    submitEvent: 'NEXT',
                    cancelEvent: 'PREV',
                  }],
                ],
              },
              {
                from: 'step2',
                to: 'step1',
                event: 'PREV',
                effects: [
                  ['fetch', 'WizardEntry'],
                  ['render-ui', 'main', { type: 'wizard-progress', 
                    steps: ['Basic Info', 'Details', 'Review'],
                    currentStep: 0,
                  }],
                  ['render-ui', 'main', { type: 'form-section', 
                    entity: 'WizardEntry',
                    submitEvent: 'NEXT',
                  }],
                ],
              },
              {
                from: 'step2',
                to: 'review',
                event: 'NEXT',
                effects: [
                  ['fetch', 'WizardEntry'],
                  ['render-ui', 'main', { type: 'wizard-progress', 
                    steps: ['Basic Info', 'Details', 'Review'],
                    currentStep: 2,
                  }],
                  ['render-ui', 'main', { type: 'detail-panel', entity: 'WizardEntry',
                    actions: [
                      { label: 'Back', event: 'PREV' },
                      { label: 'Complete', event: 'COMPLETE', variant: 'primary' },
                    ],
                  }],
                ],
              },
              {
                from: 'review',
                to: 'step2',
                event: 'PREV',
                effects: [
                  ['fetch', 'WizardEntry'],
                  ['render-ui', 'main', { type: 'wizard-progress', 
                    steps: ['Basic Info', 'Details', 'Review'],
                    currentStep: 1,
                  }],
                  ['render-ui', 'main', { type: 'form-section', 
                    entity: 'WizardEntry',
                    submitEvent: 'NEXT',
                    cancelEvent: 'PREV',
                  }],
                ],
              },
              {
                from: 'review',
                to: 'complete',
                event: 'COMPLETE',
                effects: [
                  ['persist', 'create', 'WizardEntry', {}],
                  ['render-ui', 'main', { type: 'empty-state',  title: 'Complete', message: 'Your entry has been submitted.' }],
                ],
              },
              {
                from: 'complete',
                to: 'step1',
                event: 'INIT',
                effects: [
                  ['fetch', 'WizardEntry'],
                  ['render-ui', 'main', { type: 'wizard-progress', 
                    steps: ['Basic Info', 'Details', 'Review'],
                    currentStep: 0,
                  }],
                  ['render-ui', 'main', { type: 'form-section', 
                    entity: 'WizardEntry',
                    submitEvent: 'NEXT',
                  }],
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
// std-masterdetail - List + Detail Layout
// ============================================================================

export const MASTER_DETAIL_BEHAVIOR: OrbitalSchema = {
  name: 'std-masterdetail',
  version: '1.0.0',
  description: 'Master-detail layout with synchronized list and detail views',
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
                  ['render-ui', 'main', { type: 'entity-list', 
                    entity: 'Asset',
                    itemActions: [{ label: 'View', event: 'SELECT' }],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'selected',
                event: 'SELECT',
                effects: [
                  ['fetch', 'Asset'],
                  ['render-ui', 'main', { type: 'entity-list', 
                    entity: 'Asset',
                    itemActions: [{ label: 'View', event: 'SELECT' }],
                  }],
                  ['render-ui', 'main', { type: 'detail-panel', 
                    entity: 'Asset',
                    actions: [{ label: 'Back', event: 'DESELECT' }],
                  }],
                ],
              },
              {
                from: 'selected',
                to: 'selected',
                event: 'SELECT',
                effects: [
                  ['fetch', 'Asset'],
                  ['render-ui', 'main', { type: 'detail-panel', 
                    entity: 'Asset',
                    actions: [{ label: 'Back', event: 'DESELECT' }],
                  }],
                ],
              },
              {
                from: 'selected',
                to: 'browsing',
                event: 'DESELECT',
                effects: [
                  ['fetch', 'Asset'],
                  ['render-ui', 'main', { type: 'entity-list', 
                    entity: 'Asset',
                    itemActions: [{ label: 'View', event: 'SELECT' }],
                  }],
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
// std-filter-ui - Filter Management
// ============================================================================

export const FILTER_BEHAVIOR: OrbitalSchema = {
  name: 'std-filter-ui',
  version: '1.0.0',
  description: 'Filter and search management for lists',
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
                  ['render-ui', 'main', { type: 'page-header',  title: 'Items' }],
                  ['render-ui', 'main', { type: 'entity-cards', 
                    entity: 'FilterableItem',
                    itemActions: [
                      { label: 'Refresh', event: 'INIT' },
                    ],
                  }],
                ],
              },
              {
                from: 'idle',
                to: 'filtering',
                event: 'SET_FILTER',
                effects: [
                  ['fetch', 'FilterableItem'],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'FilterableItem',
                    itemActions: [{ label: 'View', event: 'VIEW' }],
                  }],
                ],
              },
              {
                from: 'filtering',
                to: 'filtering',
                event: 'SET_FILTER',
                effects: [
                  ['fetch', 'FilterableItem'],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'FilterableItem',
                    itemActions: [{ label: 'View', event: 'VIEW' }],
                  }],
                ],
              },
              {
                from: 'filtering',
                to: 'idle',
                event: 'CLEAR_FILTERS',
                effects: [
                  ['fetch', 'FilterableItem'],
                  ['render-ui', 'main', { type: 'entity-cards', 
                    entity: 'FilterableItem',
                    itemActions: [
                      { label: 'Refresh', event: 'INIT' },
                    ],
                  }],
                ],
              },
              {
                from: 'idle',
                to: 'filtering',
                event: 'SEARCH',
                effects: [
                  ['fetch', 'FilterableItem'],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'FilterableItem',
                    itemActions: [{ label: 'View', event: 'VIEW' }],
                  }],
                ],
              },
              {
                from: 'filtering',
                to: 'filtering',
                event: 'VIEW',
                effects: [
                  ['fetch', 'FilterableItem'],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'FilterableItem',
                    itemActions: [{ label: 'View', event: 'VIEW' }],
                  }],
                ],
              },
              {
                from: 'idle',
                to: 'idle',
                event: 'VIEW',
                effects: [
                  ['fetch', 'FilterableItem'],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'FilterableItem',
                    itemActions: [{ label: 'View', event: 'VIEW' }],
                  }],
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
