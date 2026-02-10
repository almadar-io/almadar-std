/**
 * UI Interaction Behaviors
 *
 * Standard behaviors for common UI interaction patterns.
 * Each behavior is a self-contained OrbitalSchema that can function as a standalone .orb file.
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
 * States: Browsing → Creating/Viewing/Editing/Deleting
 * Implements complete CRUD operations with modal/drawer UI patterns.
 */
export const LIST_BEHAVIOR: OrbitalSchema = {
  name: 'std-list',
  version: '1.0.0',
  description: 'Entity list management with CRUD operations',
  orbitals: [
    {
      name: 'ListOrbital',
      entity: {
        name: 'ListState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'selectedId', type: 'string', default: null },
          { name: 'entityType', type: 'string', default: '' },
          { name: 'title', type: 'string', default: 'Items' },
          { name: 'columns', type: 'array', default: [] },
        ],
      },
      traits: [
        {
          name: 'List',
          linkedEntity: 'ListState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Browsing', isInitial: true },
              { name: 'Creating' },
              { name: 'Viewing' },
              { name: 'Editing' },
              { name: 'Deleting' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'CREATE', name: 'Create' },
              { key: 'VIEW', name: 'View' },
              { key: 'EDIT', name: 'Edit' },
              { key: 'DELETE', name: 'Delete' },
              { key: 'CONFIRM_DELETE', name: 'Confirm Delete' },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'SAVE', name: 'Save' },
            ],
            transitions: [
              {
                from: 'Browsing',
                to: 'Browsing',
                event: 'INIT',
                effects: [
                  ['render-ui', 'main', {
                    type: 'page-header',
                    title: '@entity.title',
                    actions: [{ label: 'Create', event: 'CREATE', variant: 'primary' }],
                  }],
                  ['render-ui', 'main', {
                    type: 'entity-table',
                    entity: '@entity.entityType',
                    columns: '@entity.columns',
                    itemActions: [
                      { label: 'View', event: 'VIEW', placement: 'row' },
                      { label: 'Edit', event: 'EDIT', placement: 'row' },
                      { label: 'Delete', event: 'DELETE', variant: 'danger', placement: 'row' },
                    ],
                  }],
                ],
              },
              {
                from: 'Browsing',
                to: 'Creating',
                event: 'CREATE',
                effects: [
                  ['render-ui', 'modal', {
                    type: 'form-section',
                    entity: '@entity.entityType',
                    mode: 'create',
                    onSubmit: 'SAVE',
                    onCancel: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'Browsing',
                to: 'Viewing',
                event: 'VIEW',
                effects: [
                  ['set', '@entity.selectedId', '@payload.id'],
                  ['render-ui', 'drawer', {
                    type: 'detail-panel',
                    entity: '@entity.entityType',
                    data: '@payload.id',
                    actions: [
                      { label: 'Edit', event: 'EDIT' },
                      { label: 'Close', event: 'CANCEL' },
                    ],
                  }],
                ],
              },
              {
                from: 'Browsing',
                to: 'Editing',
                event: 'EDIT',
                effects: [
                  ['set', '@entity.selectedId', '@payload.id'],
                  ['render-ui', 'drawer', {
                    type: 'form-section',
                    entity: '@entity.entityType',
                    initialData: '@payload.id',
                    mode: 'edit',
                    onSubmit: 'SAVE',
                    onCancel: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'Viewing',
                to: 'Editing',
                event: 'EDIT',
                effects: [
                  ['render-ui', 'drawer', {
                    type: 'form-section',
                    entity: '@entity.entityType',
                    initialData: '@entity.selectedId',
                    mode: 'edit',
                    onSubmit: 'SAVE',
                    onCancel: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'Browsing',
                to: 'Deleting',
                event: 'DELETE',
                effects: [
                  ['set', '@entity.selectedId', '@payload.id'],
                  ['render-ui', 'modal', {
                    type: 'confirm-dialog',
                    isOpen: true,
                    onClose: 'CANCEL',
                    onConfirm: 'CONFIRM_DELETE',
                    title: 'Delete Confirmation',
                    message: 'Are you sure you want to delete this item?',
                    confirmText: 'Delete',
                    variant: 'danger',
                  }],
                ],
              },
              {
                from: 'Creating',
                to: 'Browsing',
                event: 'SAVE',
                effects: [
                  ['persist', 'create', '@entity.entityType', '@payload.data'],
                  ['notify', 'in_app', 'Created successfully'],
                  ['emit', 'INIT'],
                ],
              },
              {
                from: 'Editing',
                to: 'Browsing',
                event: 'SAVE',
                effects: [
                  ['persist', 'update', '@entity.entityType', '@payload.data'],
                  ['notify', 'in_app', 'Updated successfully'],
                  ['emit', 'INIT'],
                ],
              },
              {
                from: 'Deleting',
                to: 'Browsing',
                event: 'CONFIRM_DELETE',
                effects: [
                  ['persist', 'delete', '@entity.entityType', '@entity.selectedId'],
                  ['notify', 'in_app', 'Deleted successfully'],
                  ['emit', 'INIT'],
                ],
              },
              {
                from: 'Creating',
                to: 'Browsing',
                event: 'CANCEL',
                effects: [],
              },
              {
                from: 'Viewing',
                to: 'Browsing',
                event: 'CANCEL',
                effects: [],
              },
              {
                from: 'Editing',
                to: 'Browsing',
                event: 'CANCEL',
                effects: [],
              },
              {
                from: 'Deleting',
                to: 'Browsing',
                event: 'CANCEL',
                effects: [],
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
        name: 'DetailState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'entityId', type: 'string', default: null },
          { name: 'isLoading', type: 'boolean', default: false },
          { name: 'hasChanges', type: 'boolean', default: false },
          { name: 'entityType', type: 'string', default: '' },
          { name: 'fields', type: 'array', default: [] },
          { name: 'returnUrl', type: 'string', default: '/' },
        ],
      },
      traits: [
        {
          name: 'Detail',
          linkedEntity: 'DetailState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Viewing', isInitial: true },
              { name: 'Editing' },
              { name: 'Deleting' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'EDIT', name: 'Edit' },
              { key: 'SAVE', name: 'Save' },
              { key: 'CANCEL', name: 'Cancel' },
              { key: 'DELETE', name: 'Delete' },
              { key: 'CONFIRM_DELETE', name: 'Confirm Delete' },
            ],
            transitions: [
              {
                from: 'Viewing',
                to: 'Viewing',
                event: 'INIT',
                effects: [
                  ['render-ui', 'main', {
                    type: 'page-header',
                    title: '@entity.name',
                    actions: [
                      { label: 'Edit', event: 'EDIT' },
                      { label: 'Delete', event: 'DELETE', variant: 'danger' },
                    ],
                  }],
                  ['render-ui', 'main', {
                    type: 'detail-panel',
                    entity: '@entity.entityType',
                    fieldNames: '@entity.fields',
                  }],
                ],
              },
              {
                from: 'Viewing',
                to: 'Editing',
                event: 'EDIT',
                effects: [
                  ['render-ui', 'main', {
                    type: 'form-section',
                    entity: '@entity.entityType',
                    mode: 'edit',
                    fields: '@entity.fields',
                    onSubmit: 'SAVE',
                    onCancel: 'CANCEL',
                  }],
                ],
              },
              {
                from: 'Editing',
                to: 'Viewing',
                event: 'SAVE',
                effects: [
                  ['persist', 'update', '@entity.entityType', '@payload.data'],
                  ['notify', 'in_app', 'Updated successfully'],
                  ['emit', 'INIT'],
                ],
              },
              {
                from: 'Editing',
                to: 'Viewing',
                event: 'CANCEL',
                effects: [['emit', 'INIT']],
              },
              {
                from: 'Viewing',
                to: 'Deleting',
                event: 'DELETE',
                effects: [
                  ['render-ui', 'modal', {
                    type: 'confirm-dialog',
                    isOpen: true,
                    onClose: 'CANCEL',
                    onConfirm: 'CONFIRM',
                    title: 'Delete Confirmation',
                    message: 'Are you sure you want to delete this item?',
                  }],
                ],
              },
              {
                from: 'Deleting',
                to: 'Viewing',
                event: 'CONFIRM_DELETE',
                effects: [
                  ['persist', 'delete', '@entity.entityType', '@entity.id'],
                  ['navigate', '@entity.returnUrl'],
                ],
              },
              {
                from: 'Deleting',
                to: 'Viewing',
                event: 'CANCEL',
                effects: [],
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
        name: 'FormState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'values', type: 'object', default: {} },
          { name: 'errors', type: 'object', default: {} },
          { name: 'touched', type: 'object', default: {} },
          { name: 'isDirty', type: 'boolean', default: false },
          { name: 'isSubmitting', type: 'boolean', default: false },
          { name: 'entityType', type: 'string', default: '' },
          { name: 'fields', type: 'array', default: [] },
          { name: 'mode', type: 'string', default: 'create' },
          { name: 'validation', type: 'object', default: {} },
          { name: 'cancelEvent', type: 'string', default: 'CANCEL' },
          { name: 'submitEvent', type: 'string', default: 'SUBMIT_SUCCESS' },
        ],
      },
      traits: [
        {
          name: 'Form',
          linkedEntity: 'FormState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Idle', isInitial: true },
              { name: 'Editing' },
              { name: 'Validating' },
              { name: 'Submitting' },
              { name: 'Success', isTerminal: true },
              { name: 'Error' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'FIELD_CHANGE', name: 'Field Change' },
              { key: 'FIELD_BLUR', name: 'Field Blur' },
              { key: 'SUBMIT', name: 'Submit' },
              { key: 'VALIDATION_PASSED', name: 'Validation Passed' },
              { key: 'VALIDATION_FAILED', name: 'Validation Failed' },
              { key: 'SUBMIT_SUCCESS', name: 'Submit Success' },
              { key: 'SUBMIT_ERROR', name: 'Submit Error' },
              { key: 'RESET', name: 'Reset' },
            ],
            transitions: [
              {
                from: 'Idle',
                to: 'Editing',
                event: 'INIT',
                effects: [
                  ['render-ui', 'main', {
                    type: 'form-section',
                    entity: '@entity.entityType',
                    fields: '@entity.fields',
                    initialData: '@entity.values',
                    onSubmit: 'SUBMIT',
                    onCancel: '@entity.cancelEvent',
                  }],
                ],
              },
              {
                from: 'Editing',
                to: 'Editing',
                event: 'FIELD_CHANGE',
                effects: [
                  ['set', '@entity.values', ['object/set', '@entity.values', '@payload.field', '@payload.value']],
                  ['set', '@entity.isDirty', true],
                ],
              },
              {
                from: 'Editing',
                to: 'Editing',
                event: 'FIELD_BLUR',
                effects: [
                  ['set', '@entity.touched', ['object/set', '@entity.touched', '@payload.field', true]],
                ],
              },
              {
                from: 'Editing',
                to: 'Validating',
                event: 'SUBMIT',
                effects: [
                  ['let', [['result', ['validate/check', '@entity.values', '@entity.validation']]],
                    ['if', '@result.valid',
                      ['emit', 'VALIDATION_PASSED'],
                      ['do',
                        ['set', '@entity.errors', '@result.errors'],
                        ['emit', 'VALIDATION_FAILED']]]],
                ],
              },
              {
                from: 'Validating',
                to: 'Submitting',
                event: 'VALIDATION_PASSED',
                effects: [
                  ['set', '@entity.isSubmitting', true],
                  ['if', ['=', '@entity.mode', 'create'],
                    ['persist', 'create', '@entity.entityType', '@entity.values'],
                    ['persist', 'update', '@entity.entityType', '@entity.values']],
                ],
              },
              {
                from: 'Validating',
                to: 'Editing',
                event: 'VALIDATION_FAILED',
                effects: [
                  ['notify', 'in_app', 'Please fix the validation errors'],
                ],
              },
              {
                from: 'Submitting',
                to: 'Success',
                event: 'SUBMIT_SUCCESS',
                effects: [
                  ['set', '@entity.isSubmitting', false],
                  ['notify', 'in_app', 'Saved successfully'],
                  ['emit', '@entity.submitEvent', { data: '@entity.values' }],
                ],
              },
              {
                from: 'Submitting',
                to: 'Error',
                event: 'SUBMIT_ERROR',
                effects: [
                  ['set', '@entity.isSubmitting', false],
                  ['set', '@entity.errors', { _form: '@payload.error' }],
                  ['notify', 'in_app', '@payload.error'],
                ],
              },
              {
                from: 'Editing',
                to: 'Idle',
                event: 'RESET',
                effects: [
                  ['set', '@entity.values', {}],
                  ['set', '@entity.errors', {}],
                  ['set', '@entity.touched', {}],
                  ['set', '@entity.isDirty', false],
                ],
              },
              {
                from: 'Error',
                to: 'Idle',
                event: 'RESET',
                effects: [
                  ['set', '@entity.values', {}],
                  ['set', '@entity.errors', {}],
                  ['set', '@entity.touched', {}],
                  ['set', '@entity.isDirty', false],
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
        name: 'ModalState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'content', type: 'object', default: null },
        ],
      },
      traits: [
        {
          name: 'Modal',
          linkedEntity: 'ModalState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Closed', isInitial: true },
              { name: 'Open' },
            ],
            events: [
              { key: 'OPEN', name: 'Open' },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CONFIRM', name: 'Confirm' },
            ],
            transitions: [
              {
                from: 'Closed',
                to: 'Open',
                event: 'OPEN',
                effects: [
                  ['set', '@entity.content', '@payload.content'],
                  ['render-ui', 'modal', {
                    type: 'modal',
                    isOpen: true,
                    onClose: 'CLOSE',
                  }],
                ],
              },
              {
                from: 'Open',
                to: 'Closed',
                event: 'CLOSE',
                effects: [],
              },
              {
                from: 'Open',
                to: 'Closed',
                event: 'CONFIRM',
                effects: [],
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
// std-drawer - Side Drawer Panel
// ============================================================================

export const DRAWER_BEHAVIOR: OrbitalSchema = {
  name: 'std-drawer',
  version: '1.0.0',
  description: 'Side drawer panel for detail views and forms',
  orbitals: [
    {
      name: 'DrawerOrbital',
      entity: {
        name: 'DrawerState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'content', type: 'object', default: null },
        ],
      },
      traits: [
        {
          name: 'Drawer',
          linkedEntity: 'DrawerState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Closed', isInitial: true },
              { name: 'Open' },
            ],
            events: [
              { key: 'OPEN', name: 'Open' },
              { key: 'CLOSE', name: 'Close' },
            ],
            transitions: [
              {
                from: 'Closed',
                to: 'Open',
                event: 'OPEN',
                effects: [
                  ['set', '@entity.content', '@payload.content'],
                  ['render-ui', 'drawer', {
                    type: 'drawer',
                    isOpen: true,
                    onClose: 'CLOSE',
                  }],
                ],
              },
              {
                from: 'Open',
                to: 'Closed',
                event: 'CLOSE',
                effects: [],
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
        name: 'TabsState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'activeTab', type: 'string', default: null },
          { name: 'tabs', type: 'array', default: [] },
          { name: 'defaultTab', type: 'string', default: null },
        ],
      },
      traits: [
        {
          name: 'Tabs',
          linkedEntity: 'TabsState',
          category: 'interaction',
          stateMachine: {
            states: [{ name: 'Active', isInitial: true }],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'SELECT_TAB', name: 'Select Tab' },
            ],
            transitions: [
              {
                from: 'Active',
                to: 'Active',
                event: 'INIT',
                effects: [
                  ['set', '@entity.activeTab', '@entity.defaultTab'],
                  ['render-ui', 'main', {
                    type: 'tabs',
                    tabs: '@entity.tabs',
                    activeTab: '@entity.activeTab',
                    onTabChange: 'SELECT_TAB',
                  }],
                ],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'SELECT_TAB',
                effects: [['set', '@entity.activeTab', '@payload.tabId']],
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
// std-wizard - Multi-Step Flow
// ============================================================================

export const WIZARD_BEHAVIOR: OrbitalSchema = {
  name: 'std-wizard',
  version: '1.0.0',
  description: 'Multi-step wizard flow - each step is a state',
  orbitals: [
    {
      name: 'WizardOrbital',
      entity: {
        name: 'WizardState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'stepData', type: 'object', default: {} },
          { name: 'entityType', type: 'string', default: '' },
          { name: 'step1Fields', type: 'array', default: [] },
          { name: 'step2Fields', type: 'array', default: [] },
          { name: 'completionUrl', type: 'string', default: '/' },
        ],
      },
      traits: [
        {
          name: 'Wizard',
          linkedEntity: 'WizardState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Step1', isInitial: true },
              { name: 'Step2' },
              { name: 'Step3' },
              { name: 'Complete', isTerminal: true },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'NEXT', name: 'Next' },
              { key: 'PREV', name: 'Previous' },
              { key: 'COMPLETE', name: 'Complete' },
            ],
            transitions: [
              {
                from: 'Step1',
                to: 'Step1',
                event: 'INIT',
                effects: [
                  ['render-ui', 'main', {
                    type: 'wizard-progress',
                    steps: ['Step 1', 'Step 2', 'Step 3'],
                    currentStep: 0,
                  }],
                  ['render-ui', 'main', {
                    type: 'form-section',
                    entity: '@entity.entityType',
                    fields: '@entity.step1Fields',
                    onSubmit: 'NEXT',
                  }],
                ],
              },
              {
                from: 'Step1',
                to: 'Step2',
                event: 'NEXT',
                effects: [
                  ['set', '@entity.stepData.step1', '@payload'],
                  ['render-ui', 'main', {
                    type: 'wizard-progress',
                    steps: ['Step 1', 'Step 2', 'Step 3'],
                    currentStep: 1,
                  }],
                  ['render-ui', 'main', {
                    type: 'form-section',
                    entity: '@entity.entityType',
                    fields: '@entity.step2Fields',
                    onSubmit: 'NEXT',
                    onCancel: 'PREV',
                  }],
                ],
              },
              {
                from: 'Step2',
                to: 'Step1',
                event: 'PREV',
                effects: [['emit', 'INIT']],
              },
              {
                from: 'Step2',
                to: 'Step3',
                event: 'NEXT',
                effects: [
                  ['set', '@entity.stepData.step2', '@payload'],
                  ['render-ui', 'main', {
                    type: 'wizard-progress',
                    steps: ['Step 1', 'Step 2', 'Step 3'],
                    currentStep: 2,
                  }],
                  ['render-ui', 'main', {
                    type: 'detail-panel',
                    entity: '@entity.entityType',
                    fieldNames: ['step1', 'step2'],
                    title: 'Review',
                  }],
                ],
              },
              {
                from: 'Step3',
                to: 'Step2',
                event: 'PREV',
                effects: [],
              },
              {
                from: 'Step3',
                to: 'Complete',
                event: 'COMPLETE',
                effects: [
                  ['persist', 'create', '@entity.entityType', '@entity.stepData'],
                  ['notify', 'in_app', 'Wizard completed!'],
                  ['navigate', '@entity.completionUrl'],
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
        name: 'MasterDetailState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'selectedId', type: 'string', default: null },
          { name: 'entityType', type: 'string', default: '' },
          { name: 'masterColumns', type: 'array', default: [] },
          { name: 'detailFields', type: 'array', default: [] },
        ],
      },
      traits: [
        {
          name: 'MasterDetail',
          linkedEntity: 'MasterDetailState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'NoSelection', isInitial: true },
              { name: 'Selected' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'SELECT', name: 'Select' },
              { key: 'DESELECT', name: 'Deselect' },
            ],
            transitions: [
              {
                from: 'NoSelection',
                to: 'NoSelection',
                event: 'INIT',
                effects: [
                  ['render-ui', 'main', {
                    type: 'master-detail',
                    master: '@entity.entityType',
                    detail: '@entity.selectedId',
                    hasSelection: '@entity.hasSelection',
                  }],
                  ['render-ui', 'main', {
                    type: 'empty-state',
                    message: 'Select an item to view details',
                  }],
                ],
              },
              {
                from: 'NoSelection',
                to: 'Selected',
                event: 'SELECT',
                effects: [
                  ['set', '@entity.selectedId', '@payload.id'],
                  ['render-ui', 'main', {
                    type: 'detail-panel',
                    entity: '@entity.entityType',
                    data: '@payload.id',
                    fieldNames: '@entity.detailFields',
                  }],
                ],
              },
              {
                from: 'Selected',
                to: 'Selected',
                event: 'SELECT',
                effects: [
                  ['set', '@entity.selectedId', '@payload.id'],
                  ['render-ui', 'main', {
                    type: 'detail-panel',
                    entity: '@entity.entityType',
                    data: '@payload.id',
                    fieldNames: '@entity.detailFields',
                  }],
                ],
              },
              {
                from: 'Selected',
                to: 'NoSelection',
                event: 'DESELECT',
                effects: [
                  ['set', '@entity.selectedId', null],
                  ['render-ui', 'main', {
                    type: 'empty-state',
                    message: 'Select an item to view details',
                  }],
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
// std-filter - Filter Management (ui-interaction version)
// ============================================================================

export const FILTER_BEHAVIOR: OrbitalSchema = {
  name: 'std-filter-ui',
  version: '1.0.0',
  description: 'Filter and search management for lists',
  orbitals: [
    {
      name: 'FilterOrbital',
      entity: {
        name: 'FilterState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'filters', type: 'object', default: {} },
          { name: 'searchTerm', type: 'string', default: '' },
          { name: 'filterConfig', type: 'array', default: [] },
        ],
      },
      traits: [
        {
          name: 'Filter',
          linkedEntity: 'FilterState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Idle', isInitial: true },
              { name: 'Filtering' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'SET_FILTER', name: 'Set Filter' },
              { key: 'CLEAR_FILTERS', name: 'Clear Filters' },
              { key: 'SEARCH', name: 'Search' },
            ],
            transitions: [
              {
                from: 'Idle',
                to: 'Idle',
                event: 'INIT',
                effects: [
                  ['render-ui', 'main', {
                    type: 'filter-group',
                    entity: '@entity.entityType',
                    filters: '@entity.filterConfig',
                    onFilterChange: 'SET_FILTER',
                    onClearAll: 'CLEAR_FILTERS',
                  }],
                ],
              },
              {
                from: 'Idle',
                to: 'Filtering',
                event: 'SET_FILTER',
                effects: [
                  ['set', '@entity.filters', ['object/set', '@entity.filters', '@payload.field', '@payload.value']],
                  ['emit', 'FILTER_CHANGED', '@entity.filters'],
                ],
              },
              {
                from: 'Filtering',
                to: 'Idle',
                event: 'SET_FILTER',
                effects: [
                  ['set', '@entity.filters', ['object/set', '@entity.filters', '@payload.field', '@payload.value']],
                  ['emit', 'FILTER_CHANGED', '@entity.filters'],
                ],
              },
              {
                from: 'Filtering',
                to: 'Idle',
                event: 'CLEAR_FILTERS',
                effects: [
                  ['set', '@entity.filters', {}],
                  ['set', '@entity.searchTerm', ''],
                  ['emit', 'FILTER_CHANGED', {}],
                ],
              },
              {
                from: 'Idle',
                to: 'Filtering',
                event: 'SEARCH',
                effects: [
                  ['set', '@entity.searchTerm', '@payload.term'],
                  ['emit', 'SEARCH_CHANGED', '@payload.term'],
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
