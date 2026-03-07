/**
 * Data Management Behaviors
 *
 * Standard behaviors for data operations like pagination, selection,
 * sorting, filtering, and search.
 * Each behavior is a self-contained OrbitalSchema that passes orbital validate
 * with 0 errors and 0 warnings when exported as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from './types.js';

// ============================================================================
// std-pagination - Page Navigation
// ============================================================================

/**
 * std-pagination - Page navigation behavior for large data sets.
 * Uses a concrete Product entity to demonstrate paginated browsing.
 */
export const PAGINATION_BEHAVIOR: OrbitalSchema = {
  name: 'std-pagination',
  version: '1.0.0',
  description: 'Page-based navigation for large data sets',
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
                  ['render-ui', 'main', { type: 'page-header',  title: 'Products' }],
                  ['render-ui', 'main', { type: 'entity-cards', 
                    entity: 'Product',
                    itemActions: [
                      { label: 'Refresh', event: 'INIT' },
                    ],
                  }],
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
                  ['render-ui', 'main', { type: 'entity-cards', 
                    entity: 'Product',
                    itemActions: [
                      { label: 'Refresh', event: 'INIT' },
                    ],
                  }],
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
                  ['render-ui', 'main', { type: 'entity-cards', 
                    entity: 'Product',
                    itemActions: [
                      { label: 'Refresh', event: 'INIT' },
                    ],
                  }],
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
                  ['render-ui', 'main', { type: 'entity-cards', 
                    entity: 'Product',
                    itemActions: [
                      { label: 'Refresh', event: 'INIT' },
                    ],
                  }],
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
                  ['render-ui', 'main', { type: 'entity-cards', 
                    entity: 'Product',
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
export const SELECTION_BEHAVIOR: OrbitalSchema = {
  name: 'std-selection',
  version: '1.0.0',
  description: 'Single or multi-selection management',
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
                  ['render-ui', 'main', { type: 'page-header',  title: 'Files' }],
                  ['render-ui', 'main', { type: 'entity-list', entity: 'File',
                    itemActions: [
                      { label: 'Select', event: 'SELECT' },
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'idle',
                to: 'selected',
                event: 'SELECT',
                effects: [
                  ['fetch', 'File'],
                  ['set', '@entity.isSelected', true],
                  ['render-ui', 'main', { type: 'entity-list', entity: 'File',
                    itemActions: [
                      { label: 'Deselect', event: 'DESELECT' },
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'selected',
                to: 'selected',
                event: 'SELECT',
                effects: [
                  ['fetch', 'File'],
                  ['set', '@entity.isSelected', true],
                  ['render-ui', 'main', { type: 'entity-list', entity: 'File',
                    itemActions: [
                      { label: 'Deselect', event: 'DESELECT' },
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'selected',
                to: 'idle',
                event: 'DESELECT',
                effects: [
                  ['fetch', 'File'],
                  ['set', '@entity.isSelected', false],
                  ['render-ui', 'main', { type: 'entity-list', entity: 'File',
                    itemActions: [
                      { label: 'Select', event: 'SELECT' },
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'idle',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ['fetch', 'File'],
                  ['render-ui', 'modal', { type: 'detail-panel', 
                    entity: 'File',
                    actions: [{ label: 'Close', event: 'CLOSE' }],
                  }],
                ],
              },
              {
                from: 'selected',
                to: 'viewing',
                event: 'VIEW',
                effects: [
                  ['fetch', 'File'],
                  ['render-ui', 'modal', { type: 'detail-panel', 
                    entity: 'File',
                    actions: [{ label: 'Close', event: 'CLOSE' }],
                  }],
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
export const SORT_BEHAVIOR: OrbitalSchema = {
  name: 'std-sort',
  version: '1.0.0',
  description: 'Sorting by field with direction toggle',
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
                  ['render-ui', 'main', { type: 'page-header',  title: 'Contacts' }],
                  ['render-ui', 'main', { type: 'entity-table', 
                    entity: 'Contact',
                    itemActions: [
                      { label: 'Refresh', event: 'INIT' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'browsing',
                event: 'SORT',
                effects: [
                  ['fetch', 'Contact'],
                  ['set', '@entity.sortField', '@payload.field'],
                  ['render-ui', 'main', { type: 'entity-table', 
                    entity: 'Contact',
                    itemActions: [
                      { label: 'Refresh', event: 'INIT' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'browsing',
                event: 'TOGGLE_DIRECTION',
                effects: [
                  ['fetch', 'Contact'],
                  ['set', '@entity.sortDirection', ['if', ['=', '@entity.sortDirection', 'asc'], 'desc', 'asc']],
                  ['render-ui', 'main', { type: 'entity-table', 
                    entity: 'Contact',
                    itemActions: [
                      { label: 'Refresh', event: 'INIT' },
                    ],
                  }],
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
                  ['render-ui', 'main', { type: 'entity-table', 
                    entity: 'Contact',
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
export const FILTER_BEHAVIOR: OrbitalSchema = {
  name: 'std-filter',
  version: '1.0.0',
  description: 'Query Singleton pattern for explicit filtering',
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
                  ['render-ui', 'main', { type: 'page-header',  title: 'Tasks', 
                    actions: [{ label: 'Filter', event: 'FILTER' }],
                  }],
                  ['render-ui', 'main', { type: 'entity-table', 
                    entity: 'Task',
                    itemActions: [
                      { label: 'Refresh', event: 'INIT' },
                    ],
                  }],
                ],
              },
              {
                from: 'browsing',
                to: 'filtered',
                event: 'FILTER',
                effects: [
                  ['fetch', 'Task'],
                  ['set', '@entity.status', '@payload.status'],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'Task',
                    itemActions: [{ label: 'View', event: 'VIEW' }],
                  }],
                ],
              },
              {
                from: 'filtered',
                to: 'filtered',
                event: 'FILTER',
                effects: [
                  ['fetch', 'Task'],
                  ['set', '@entity.status', '@payload.status'],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'Task',
                    itemActions: [{ label: 'View', event: 'VIEW' }],
                  }],
                ],
              },
              {
                from: 'filtered',
                to: 'browsing',
                event: 'CLEAR_FILTERS',
                effects: [
                  ['set', '@entity.status', 'open'],
                  ['fetch', 'Task'],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'Task',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              // VIEW self-transitions
              { from: 'browsing', to: 'browsing', event: 'VIEW', effects: [['fetch', 'Task'], ['render-ui', 'main', { type: 'entity-table', entity: 'Task', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
              { from: 'filtered', to: 'filtered', event: 'VIEW', effects: [['fetch', 'Task'], ['render-ui', 'main', { type: 'entity-table', entity: 'Task', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
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
export const SEARCH_BEHAVIOR: OrbitalSchema = {
  name: 'std-search',
  version: '1.0.0',
  description: 'Search behavior for entity lists',
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
                  ['render-ui', 'main', { type: 'page-header',  title: 'Articles' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Article',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'idle',
                to: 'searching',
                event: 'SEARCH',
                effects: [
                  ['fetch', 'Article'],
                  ['set', '@entity.searchTerm', '@payload.term'],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Article',
                    itemActions: [{ label: 'View', event: 'VIEW' }],
                  }],
                ],
              },
              {
                from: 'searching',
                to: 'searching',
                event: 'SEARCH',
                effects: [
                  ['fetch', 'Article'],
                  ['set', '@entity.searchTerm', '@payload.term'],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Article',
                    itemActions: [{ label: 'View', event: 'VIEW' }],
                  }],
                ],
              },
              {
                from: 'searching',
                to: 'idle',
                event: 'CLEAR_SEARCH',
                effects: [
                  ['set', '@entity.searchTerm', ''],
                  ['fetch', 'Article'],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'Article',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              // VIEW self-transitions
              { from: 'idle', to: 'idle', event: 'VIEW', effects: [['fetch', 'Article'], ['render-ui', 'main', { type: 'entity-cards', entity: 'Article', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
              { from: 'searching', to: 'searching', event: 'VIEW', effects: [['fetch', 'Article'], ['render-ui', 'main', { type: 'entity-cards', entity: 'Article', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
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

export const DATA_MANAGEMENT_BEHAVIORS: OrbitalSchema[] = [
  PAGINATION_BEHAVIOR,
  SELECTION_BEHAVIOR,
  SORT_BEHAVIOR,
  FILTER_BEHAVIOR,
  SEARCH_BEHAVIOR,
];
