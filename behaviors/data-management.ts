/**
 * Data Management Behaviors
 *
 * Standard behaviors for data operations like pagination, selection,
 * sorting, filtering, and search.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * Molecule-first UI: all render-ui effects use atom/molecule compositions
 * (stack, typography, icon, button, badge, divider, data-grid, data-list,
 * search-input, meter, stats, form-section) instead of organism patterns.
 *
 * @packageDocumentation
 */

import type { BehaviorSchema, BehaviorEffect } from './types.js';

// ============================================================================
// Theme: data-zinc
// ============================================================================

const DATA_ZINC_THEME = {
  name: 'data-zinc',
  tokens: {
    colors: {
      primary: '#3f3f46',
      'primary-hover': '#27272a',
      'primary-foreground': '#ffffff',
      accent: '#71717a',
      'accent-foreground': '#ffffff',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ============================================================================
// Shared render-ui effect fragments (extracted to avoid repetition)
// ============================================================================

/** Product main view: header + data-grid with refresh action */
const PRODUCT_MAIN_VIEW: BehaviorEffect = ['render-ui', 'main', {
  type: 'stack',
  direction: 'vertical',
  gap: 'md',
  children: [
    {
      type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
      children: [
        { type: 'icon', name: 'database', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Products' },
        { type: 'badge', label: 'Paginated', variant: 'info' },
      ],
    },
    { type: 'divider' },
    {
      type: 'stack', direction: 'horizontal', gap: 'sm',
      children: [
        { type: 'stats', label: 'Page', value: '@entity.page' },
        { type: 'stats', label: 'Page Size', value: '@entity.pageSize' },
        { type: 'stats', label: 'Total', value: '@entity.totalItems' },
        { type: 'stats', label: 'Total Pages', value: '@entity.totalPages' },
      ],
    },
    { type: 'progress-bar', value: '@entity.page', max: '@entity.totalPages', label: 'Page Progress', icon: 'book-open' },
    {
      type: 'data-grid',
      entity: 'Product',
      columns: ['name', 'price'],
      itemActions: [{ label: 'Refresh', event: 'INIT' }],
    },
    {
      type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
      children: [
        { type: 'button', label: 'Previous', action: 'PREV_PAGE', variant: 'secondary', icon: 'arrow-left' },
        { type: 'button', label: 'Next', action: 'NEXT_PAGE', variant: 'secondary', icon: 'arrow-right' },
      ],
    },
  ],
}];

/** File list main view: header + data-list with select/view actions */
const FILE_IDLE_MAIN_VIEW: BehaviorEffect = ['render-ui', 'main', {
  type: 'stack',
  direction: 'vertical',
  gap: 'md',
  children: [
    {
      type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
      children: [
        { type: 'icon', name: 'folder', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Files' },
      ],
    },
    { type: 'divider' },
    {
      type: 'data-list',
      entity: 'File',
      fields: ['name', 'size'],
      itemActions: [
        { label: 'Select', event: 'SELECT' },
        { label: 'View', event: 'VIEW' },
      ],
    },
  ],
}];

/** File list main view when items are selected */
const FILE_SELECTED_MAIN_VIEW: BehaviorEffect = ['render-ui', 'main', {
  type: 'stack',
  direction: 'vertical',
  gap: 'md',
  children: [
    {
      type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
      children: [
        { type: 'icon', name: 'folder', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Files' },
        { type: 'badge', label: 'Selected', variant: 'success' },
      ],
    },
    { type: 'divider' },
    {
      type: 'data-list',
      entity: 'File',
      fields: ['name', 'size', 'isSelected'],
      itemActions: [
        { label: 'Deselect', event: 'DESELECT' },
        { label: 'View', event: 'VIEW' },
      ],
    },
  ],
}];

/** File detail modal view */
const FILE_DETAIL_MODAL: BehaviorEffect = ['render-ui', 'modal', {
  type: 'stack',
  direction: 'vertical',
  gap: 'md',
  children: [
    {
      type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
      children: [
        { type: 'icon', name: 'file', size: 'lg' },
        { type: 'typography', variant: 'h3', content: 'File Details' },
      ],
    },
    { type: 'divider' },
    {
      type: 'stack', direction: 'vertical', gap: 'sm',
      children: [
        { type: 'typography', variant: 'body', content: '@entity.name' },
        { type: 'stats', label: 'Size', value: '@entity.size' },
      ],
    },
    {
      type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'end',
      children: [
        { type: 'button', label: 'Close', event: 'CLOSE', variant: 'secondary' },
      ],
    },
  ],
}];

/** Contact table main view: header + data-grid with sortable columns */
const CONTACT_MAIN_VIEW: BehaviorEffect = ['render-ui', 'main', {
  type: 'stack',
  direction: 'vertical',
  gap: 'md',
  children: [
    {
      type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
      children: [
        { type: 'icon', name: 'table', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Contacts' },
      ],
    },
    { type: 'divider' },
    {
      type: 'stack', direction: 'horizontal', gap: 'sm',
      children: [
        { type: 'stats', label: 'Sort By', value: '@entity.sortField' },
        { type: 'stats', label: 'Direction', value: '@entity.sortDirection' },
      ],
    },
    {
      type: 'stack', direction: 'horizontal', gap: 'sm',
      children: [
        { type: 'button', label: 'Sort by Name', event: 'SORT', variant: 'secondary', icon: 'arrow-up' },
        { type: 'button', label: 'Toggle Direction', event: 'TOGGLE_DIRECTION', variant: 'secondary', icon: 'filter' },
        { type: 'button', label: 'Clear Sort', event: 'CLEAR_SORT', variant: 'ghost', icon: 'x' },
      ],
    },
    {
      type: 'data-grid',
      entity: 'Contact',
      columns: ['name', 'email'],
      itemActions: [{ label: 'Refresh', event: 'INIT' }],
    },
  ],
}];

/** Task browsing main view: header + filter controls + data-grid */
const TASK_BROWSING_MAIN_VIEW: BehaviorEffect = ['render-ui', 'main', {
  type: 'stack',
  direction: 'vertical',
  gap: 'md',
  children: [
    {
      type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
      children: [
        { type: 'icon', name: 'table', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Tasks' },
      ],
    },
    { type: 'divider' },
    {
      type: 'stack', direction: 'horizontal', gap: 'sm',
      children: [
        { type: 'badge', label: 'All', variant: 'primary', icon: 'filter' },
        { type: 'button', label: 'Filter', action: 'FILTER', variant: 'secondary', icon: 'filter' },
        { type: 'button', label: 'Clear Filters', action: 'CLEAR_FILTERS', variant: 'ghost', icon: 'x' },
      ],
    },
    {
      type: 'data-grid',
      entity: 'Task',
      columns: ['title', 'status', 'priority'],
      itemActions: [{ label: 'Refresh', event: 'INIT' }],
    },
  ],
}];

/** Task filtered main view: header + active filter badge + data-grid */
const TASK_FILTERED_MAIN_VIEW: BehaviorEffect = ['render-ui', 'main', {
  type: 'stack',
  direction: 'vertical',
  gap: 'md',
  children: [
    {
      type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
      children: [
        { type: 'icon', name: 'filter', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Tasks' },
        { type: 'badge', label: 'Filtered', variant: 'warning' },
      ],
    },
    { type: 'divider' },
    {
      type: 'stack', direction: 'horizontal', gap: 'sm',
      children: [
        { type: 'badge', label: 'Filtered', variant: 'warning', icon: 'filter' },
        { type: 'badge', label: '@entity.status', variant: 'info' },
        { type: 'button', label: 'Change Filter', action: 'FILTER', variant: 'secondary', icon: 'filter' },
        { type: 'button', label: 'Clear Filters', action: 'CLEAR_FILTERS', variant: 'ghost', icon: 'x' },
      ],
    },
    {
      type: 'data-grid',
      entity: 'Task',
      columns: ['title', 'status', 'priority'],
      itemActions: [{ label: 'View', event: 'VIEW' }],
    },
  ],
}];

/** Article search idle view: header + search-input + data-list */
const ARTICLE_IDLE_MAIN_VIEW: BehaviorEffect = ['render-ui', 'main', {
  type: 'stack',
  direction: 'vertical',
  gap: 'md',
  children: [
    {
      type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
      children: [
        { type: 'icon', name: 'search', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Search Articles' },
      ],
    },
    { type: 'divider' },
    { type: 'search-input', placeholder: 'Search articles...', event: 'SEARCH', icon: 'search' },
    {
      type: 'data-list',
      entity: 'Article',
      fields: ['title', 'content'],
      itemActions: [{ label: 'View', event: 'VIEW' }],
    },
  ],
}];

/** Article search active view: header + search-input + clear + data-list */
const ARTICLE_SEARCHING_MAIN_VIEW: BehaviorEffect = ['render-ui', 'main', {
  type: 'stack',
  direction: 'vertical',
  gap: 'md',
  children: [
    {
      type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
      children: [
        { type: 'icon', name: 'search', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Search Articles' },
        { type: 'badge', label: 'Active Search', variant: 'info' },
      ],
    },
    { type: 'divider' },
    {
      type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
      children: [
        { type: 'search-input', placeholder: 'Search articles...', event: 'SEARCH', icon: 'search' },
        { type: 'button', label: 'Clear', event: 'CLEAR_SEARCH', variant: 'ghost', icon: 'x' },
      ],
    },
    {
      type: 'data-list',
      entity: 'Article',
      fields: ['title', 'content'],
      itemActions: [{ label: 'View', event: 'VIEW' }],
    },
  ],
}];

// ============================================================================
// std-pagination - Page Navigation
// ============================================================================

/**
 * std-pagination - Page navigation behavior for large data sets.
 * Uses a concrete Product entity to demonstrate paginated browsing.
 */
export const PAGINATION_BEHAVIOR: BehaviorSchema = {
  name: 'std-pagination',
  version: '1.0.0',
  description: 'Page-based navigation for large data sets',
  theme: DATA_ZINC_THEME,
  orbitals: [
    {
      name: 'PaginationOrbital',
      entity: {
        name: 'Product',
        persistence: 'persistent',
        collection: 'products',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'price', type: 'number', default: 0 },
          { name: 'page', type: 'number', default: 1 },
          { name: 'pageSize', type: 'number', default: 20 },
          { name: 'totalItems', type: 'number', default: 0 },
          { name: 'totalPages', type: 'number', default: 1 },
        ],
      },
      traits: [
        {
          name: 'PaginationControl',
          linkedEntity: 'Product',
          category: 'interaction',
          stateMachine: {
            states: [{ name: 'browsing', isInitial: true }],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'NEXT_PAGE', name: 'Next Page' },
              { key: 'PREV_PAGE', name: 'Previous Page' },
              { key: 'GO_TO_PAGE', name: 'Go to Page', payloadSchema: [{ name: 'page', type: 'number', required: true }] },
              { key: 'SET_PAGE_SIZE', name: 'Set Page Size', payloadSchema: [{ name: 'size', type: 'number', required: true }] },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'Product'],
                  ['set', '@entity.page', 1],
                  PRODUCT_MAIN_VIEW,
                ],
              },
              {
                from: 'browsing',
                to: 'browsing',
                event: 'NEXT_PAGE',
                guard: ['<', '@entity.page', ['math/ceil', ['/', '@entity.totalItems', '@entity.pageSize']]],
                effects: [
                  ['fetch', 'Product'],
                  ['set', '@entity.page', ['+', '@entity.page', 1]],
                  PRODUCT_MAIN_VIEW,
                ],
              },
              {
                from: 'browsing',
                to: 'browsing',
                event: 'PREV_PAGE',
                guard: ['>', '@entity.page', 1],
                effects: [
                  ['fetch', 'Product'],
                  ['set', '@entity.page', ['-', '@entity.page', 1]],
                  PRODUCT_MAIN_VIEW,
                ],
              },
              {
                from: 'browsing',
                to: 'browsing',
                event: 'GO_TO_PAGE',
                guard: ['and',
                  ['>=', '@payload.page', 1],
                  ['<=', '@payload.page', ['math/ceil', ['/', '@entity.totalItems', '@entity.pageSize']]]],
                effects: [
                  ['fetch', 'Product'],
                  ['set', '@entity.page', '@payload.page'],
                  PRODUCT_MAIN_VIEW,
                ],
              },
              {
                from: 'browsing',
                to: 'browsing',
                event: 'SET_PAGE_SIZE',
                effects: [
                  ['fetch', 'Product'],
                  ['set', '@entity.pageSize', '@payload.size'],
                  ['set', '@entity.page', 1],
                  PRODUCT_MAIN_VIEW,
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'ProductsPage',
          path: '/products',
          isInitial: true,
          traits: [{ ref: 'PaginationControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-selection - Single/Multi Selection
// ============================================================================

/**
 * std-selection - Selection management for entity lists.
 * Uses a concrete File entity to demonstrate single/multi selection.
 */
export const SELECTION_BEHAVIOR: BehaviorSchema = {
  name: 'std-selection',
  version: '1.0.0',
  description: 'Single or multi-selection management',
  theme: DATA_ZINC_THEME,
  orbitals: [
    {
      name: 'SelectionOrbital',
      entity: {
        name: 'File',
        persistence: 'persistent',
        collection: 'files',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'size', type: 'number', default: 0 },
          { name: 'isSelected', type: 'boolean', default: false },
        ],
      },
      traits: [
        {
          name: 'SelectionControl',
          linkedEntity: 'File',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'idle', isInitial: true },
              { name: 'selected' },
              { name: 'viewing' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'SELECT', name: 'Select', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'DESELECT', name: 'Deselect' },
              { key: 'VIEW', name: 'View', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
              { key: 'CLOSE', name: 'Close' },
              { key: 'CANCEL', name: 'Cancel' },
            ],
            transitions: [
              {
                from: 'idle',
                to: 'idle',
                event: 'INIT',
                effects: [
                  ['fetch', 'File'],
                  FILE_IDLE_MAIN_VIEW,
                ],
              },
              {
                from: 'idle',
                to: 'selected',
                event: 'SELECT',
                effects: [
                  ['fetch', 'File'],
                  ['set', '@entity.isSelected', true],
                  FILE_SELECTED_MAIN_VIEW,
                ],
              },
              {
                from: 'selected',
                to: 'selected',
                event: 'SELECT',
                effects: [
                  ['fetch', 'File'],
                  ['set', '@entity.isSelected', true],
                  FILE_SELECTED_MAIN_VIEW,
                ],
              },
              {
                from: 'selected',
                to: 'idle',
                event: 'DESELECT',
                effects: [
                  ['fetch', 'File'],
                  ['set', '@entity.isSelected', false],
                  FILE_IDLE_MAIN_VIEW,
                ],
              },
              {
                from: 'idle',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ['fetch', 'File'],
                  FILE_DETAIL_MODAL,
                ],
              },
              {
                from: 'selected',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ['fetch', 'File'],
                  FILE_DETAIL_MODAL,
                ],
              },
              { from: 'viewing', to: 'idle', event: 'CLOSE', effects: [['render-ui', 'modal', null]] },
              { from: 'viewing', to: 'idle', event: 'CANCEL', effects: [['render-ui', 'modal', null]] },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'FilesPage',
          path: '/files',
          isInitial: true,
          traits: [{ ref: 'SelectionControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-sort - Sorting
// ============================================================================

/**
 * std-sort - Sorting behavior for entity lists.
 * Uses a concrete Contact entity to demonstrate sortable columns.
 */
export const SORT_BEHAVIOR: BehaviorSchema = {
  name: 'std-sort',
  version: '1.0.0',
  description: 'Sorting by field with direction toggle',
  theme: DATA_ZINC_THEME,
  orbitals: [
    {
      name: 'SortOrbital',
      entity: {
        name: 'Contact',
        persistence: 'persistent',
        collection: 'contacts',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'email', type: 'string', default: '' },
          { name: 'sortField', type: 'string', default: 'name' },
          { name: 'sortDirection', type: 'string', default: 'asc' },
        ],
      },
      traits: [
        {
          name: 'SortControl',
          linkedEntity: 'Contact',
          category: 'interaction',
          stateMachine: {
            states: [{ name: 'browsing', isInitial: true }],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'SORT', name: 'Sort', payloadSchema: [{ name: 'field', type: 'string', required: true }] },
              { key: 'TOGGLE_DIRECTION', name: 'Toggle Direction' },
              { key: 'CLEAR_SORT', name: 'Clear Sort' },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'Contact'],
                  ['set', '@entity.sortField', 'name'],
                  ['set', '@entity.sortDirection', 'asc'],
                  CONTACT_MAIN_VIEW,
                ],
              },
              {
                from: 'browsing',
                to: 'browsing',
                event: 'SORT',
                effects: [
                  ['fetch', 'Contact'],
                  ['set', '@entity.sortField', '@payload.field'],
                  CONTACT_MAIN_VIEW,
                ],
              },
              {
                from: 'browsing',
                to: 'browsing',
                event: 'TOGGLE_DIRECTION',
                effects: [
                  ['fetch', 'Contact'],
                  ['set', '@entity.sortDirection', ['if', ['=', '@entity.sortDirection', 'asc'], 'desc', 'asc']],
                  CONTACT_MAIN_VIEW,
                ],
              },
              {
                from: 'browsing',
                to: 'browsing',
                event: 'CLEAR_SORT',
                effects: [
                  ['fetch', 'Contact'],
                  ['set', '@entity.sortField', 'name'],
                  ['set', '@entity.sortDirection', 'asc'],
                  CONTACT_MAIN_VIEW,
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'ContactsPage',
          path: '/contacts',
          isInitial: true,
          traits: [{ ref: 'SortControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-filter - Query Singleton Pattern for Filtering
// ============================================================================

/**
 * std-filter - Filtering behavior for entity lists.
 * Uses a concrete Task entity to demonstrate filter and search operations.
 */
export const FILTER_BEHAVIOR: BehaviorSchema = {
  name: 'std-filter',
  version: '1.0.0',
  description: 'Query Singleton pattern for explicit filtering',
  theme: DATA_ZINC_THEME,
  orbitals: [
    {
      name: 'FilterOrbital',
      entity: {
        name: 'Task',
        persistence: 'persistent',
        collection: 'tasks',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'open' },
          { name: 'priority', type: 'string', default: 'medium' },
        ],
      },
      traits: [
        {
          name: 'FilterControl',
          linkedEntity: 'Task',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'browsing', isInitial: true },
              { name: 'filtered' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'FILTER', name: 'Filter', payloadSchema: [{ name: 'status', type: 'string', required: true }] },
              { key: 'CLEAR_FILTERS', name: 'Clear Filters' },
              { key: 'VIEW', name: 'View', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
            ],
            transitions: [
              {
                from: 'browsing',
                to: 'browsing',
                event: 'INIT',
                effects: [
                  ['fetch', 'Task'],
                  TASK_BROWSING_MAIN_VIEW,
                ],
              },
              {
                from: 'browsing',
                to: 'filtered',
                event: 'FILTER',
                effects: [
                  ['fetch', 'Task'],
                  ['set', '@entity.status', '@payload.status'],
                  TASK_FILTERED_MAIN_VIEW,
                ],
              },
              {
                from: 'filtered',
                to: 'filtered',
                event: 'FILTER',
                effects: [
                  ['fetch', 'Task'],
                  ['set', '@entity.status', '@payload.status'],
                  TASK_FILTERED_MAIN_VIEW,
                ],
              },
              {
                from: 'filtered',
                to: 'browsing',
                event: 'CLEAR_FILTERS',
                effects: [
                  ['set', '@entity.status', 'open'],
                  ['fetch', 'Task'],
                  TASK_BROWSING_MAIN_VIEW,
                ],
              },
              // VIEW self-transitions
              {
                from: 'browsing',
                to: 'browsing',
                event: 'VIEW',
                effects: [
                  ['fetch', 'Task'],
                  TASK_BROWSING_MAIN_VIEW,
                ],
              },
              {
                from: 'filtered',
                to: 'filtered',
                event: 'VIEW',
                effects: [
                  ['fetch', 'Task'],
                  TASK_FILTERED_MAIN_VIEW,
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'TasksPage',
          path: '/tasks',
          isInitial: true,
          traits: [{ ref: 'FilterControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// std-search - Search
// ============================================================================

/**
 * std-search - Search behavior for entity lists.
 * Uses a concrete Article entity to demonstrate search operations.
 */
export const SEARCH_BEHAVIOR: BehaviorSchema = {
  name: 'std-search',
  version: '1.0.0',
  description: 'Search behavior for entity lists',
  theme: DATA_ZINC_THEME,
  orbitals: [
    {
      name: 'SearchOrbital',
      entity: {
        name: 'Article',
        persistence: 'persistent',
        collection: 'articles',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'title', type: 'string', default: '' },
          { name: 'content', type: 'string', default: '' },
          { name: 'searchTerm', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'SearchControl',
          linkedEntity: 'Article',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'idle', isInitial: true },
              { name: 'searching' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'SEARCH', name: 'Search', payloadSchema: [{ name: 'term', type: 'string', required: true }] },
              { key: 'CLEAR_SEARCH', name: 'Clear Search' },
              { key: 'VIEW', name: 'View', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
            ],
            transitions: [
              {
                from: 'idle',
                to: 'idle',
                event: 'INIT',
                effects: [
                  ['fetch', 'Article'],
                  ARTICLE_IDLE_MAIN_VIEW,
                ],
              },
              {
                from: 'idle',
                to: 'searching',
                event: 'SEARCH',
                effects: [
                  ['fetch', 'Article'],
                  ['set', '@entity.searchTerm', '@payload.term'],
                  ARTICLE_SEARCHING_MAIN_VIEW,
                ],
              },
              {
                from: 'searching',
                to: 'searching',
                event: 'SEARCH',
                effects: [
                  ['fetch', 'Article'],
                  ['set', '@entity.searchTerm', '@payload.term'],
                  ARTICLE_SEARCHING_MAIN_VIEW,
                ],
              },
              {
                from: 'searching',
                to: 'idle',
                event: 'CLEAR_SEARCH',
                effects: [
                  ['set', '@entity.searchTerm', ''],
                  ['fetch', 'Article'],
                  ARTICLE_IDLE_MAIN_VIEW,
                ],
              },
              // VIEW self-transitions
              {
                from: 'idle',
                to: 'idle',
                event: 'VIEW',
                effects: [
                  ['fetch', 'Article'],
                  ARTICLE_IDLE_MAIN_VIEW,
                ],
              },
              {
                from: 'searching',
                to: 'searching',
                event: 'VIEW',
                effects: [
                  ['fetch', 'Article'],
                  ARTICLE_SEARCHING_MAIN_VIEW,
                ],
              },
            ],
          },
        },
      ],
      pages: [
        {
          name: 'ArticlesPage',
          path: '/articles',
          isInitial: true,
          traits: [{ ref: 'SearchControl' }],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Data Management Behaviors
// ============================================================================

export const DATA_MANAGEMENT_BEHAVIORS: BehaviorSchema[] = [
  PAGINATION_BEHAVIOR,
  SELECTION_BEHAVIOR,
  SORT_BEHAVIOR,
  FILTER_BEHAVIOR,
  SEARCH_BEHAVIOR,
];
