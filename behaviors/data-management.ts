/**
 * Data Management Behaviors
 *
 * Standard behaviors for data operations like pagination, selection,
 * sorting, filtering, and search.
 *
 * @packageDocumentation
 */

import type { BehaviorTrait } from './types.js';

// ============================================================================
// std/Pagination - Page Navigation
// ============================================================================

/**
 * std/Pagination - Page navigation behavior for large data sets.
 */
export const PAGINATION_BEHAVIOR: BehaviorTrait = {
  name: 'std/Pagination',
  description: 'Page-based navigation for large data sets',

  dataEntities: [
    {
      name: 'PaginationState',
      runtime: true,
      singleton: true,
      fields: [
        { name: 'page', type: 'number', default: 1 },
        { name: 'pageSize', type: 'number', default: 20 },
        { name: 'totalItems', type: 'number', default: 0 },
      ],
    },
  ],

  stateMachine: {
    states: [
      { name: 'Active', isInitial: true },
    ],
    events: [
      { key: 'INIT', name: 'Initialize' },
      { key: 'NEXT_PAGE', name: 'Next Page' },
      { key: 'PREV_PAGE', name: 'Previous Page' },
      { key: 'GO_TO_PAGE', name: 'Go to Page' },
      { key: 'SET_PAGE_SIZE', name: 'Set Page Size' },
    ],
    transitions: [
      {
        from: 'Active',
        to: 'Active',
        event: 'INIT',
        effects: [
          ['set', '@entity.page', 1],
          ['set', '@entity.pageSize', '@config.defaultPageSize'],
        ],
      },
      {
        from: 'Active',
        to: 'Active',
        event: 'NEXT_PAGE',
        guard: ['<', '@entity.page', ['math/ceil', ['/', '@entity.totalItems', '@entity.pageSize']]],
        effects: [
          ['set', '@entity.page', ['+', '@entity.page', 1]],
        ],
      },
      {
        from: 'Active',
        to: 'Active',
        event: 'PREV_PAGE',
        guard: ['>', '@entity.page', 1],
        effects: [
          ['set', '@entity.page', ['-', '@entity.page', 1]],
        ],
      },
      {
        from: 'Active',
        to: 'Active',
        event: 'GO_TO_PAGE',
        guard: ['and',
          ['>=', '@payload.page', 1],
          ['<=', '@payload.page', ['math/ceil', ['/', '@entity.totalItems', '@entity.pageSize']]]],
        effects: [
          ['set', '@entity.page', '@payload.page'],
        ],
      },
      {
        from: 'Active',
        to: 'Active',
        event: 'SET_PAGE_SIZE',
        effects: [
          ['set', '@entity.pageSize', '@payload.size'],
          ['set', '@entity.page', 1],
        ],
      },
    ],
  },

};

// ============================================================================
// std/Selection - Single/Multi Selection
// ============================================================================

export const SELECTION_BEHAVIOR: BehaviorTrait = {
  name: 'std/Selection',
  description: 'Single or multi-selection management',

  dataEntities: [
    {
      name: 'SelectionState',
      runtime: true,
      singleton: true,
      fields: [
        { name: 'selected', type: 'array', default: [] },
        { name: 'lastSelected', type: 'string', default: null },
      ],
    },
  ],

  stateMachine: {
    states: [
      { name: 'Active', isInitial: true },
    ],
    events: [
      { key: 'INIT', name: 'Initialize' },
      { key: 'SELECT', name: 'Select' },
      { key: 'DESELECT', name: 'Deselect' },
      { key: 'TOGGLE', name: 'Toggle' },
      { key: 'SELECT_ALL', name: 'Select All' },
      { key: 'CLEAR', name: 'Clear' },
    ],
    transitions: [
      {
        from: 'Active',
        to: 'Active',
        event: 'INIT',
        effects: [
          ['set', '@entity.selected', []],
          ['set', '@entity.lastSelected', null],
        ],
      },
      {
        from: 'Active',
        to: 'Active',
        event: 'SELECT',
        effects: [
          ['if', ['=', '@config.mode', 'single'],
            ['do',
              ['set', '@entity.selected', ['@payload.id']],
              ['set', '@entity.lastSelected', '@payload.id']],
            ['if', ['or',
              ['not', '@config.maxSelection'],
              ['<', ['array/len', '@entity.selected'], '@config.maxSelection']],
              ['do',
                ['set', '@entity.selected', ['array/append', '@entity.selected', '@payload.id']],
                ['set', '@entity.lastSelected', '@payload.id']],
              ['notify', { type: 'warning', message: 'Maximum selection reached' }]]],
        ],
      },
      {
        from: 'Active',
        to: 'Active',
        event: 'DESELECT',
        effects: [
          ['set', '@entity.selected', ['array/filter', '@entity.selected', ['fn', 'id', ['!=', '@id', '@payload.id']]]],
        ],
      },
      {
        from: 'Active',
        to: 'Active',
        event: 'TOGGLE',
        effects: [
          ['if', ['array/includes', '@entity.selected', '@payload.id'],
            ['set', '@entity.selected', ['array/filter', '@entity.selected', ['fn', 'id', ['!=', '@id', '@payload.id']]]],
            ['if', ['or', ['=', '@config.mode', 'single'], ['or',
              ['not', '@config.maxSelection'],
              ['<', ['array/len', '@entity.selected'], '@config.maxSelection']]],
              ['set', '@entity.selected',
                ['if', ['=', '@config.mode', 'single'],
                  ['@payload.id'],
                  ['array/append', '@entity.selected', '@payload.id']]],
              ['notify', { type: 'warning', message: 'Maximum selection reached' }]]],
        ],
      },
      {
        from: 'Active',
        to: 'Active',
        event: 'SELECT_ALL',
        guard: ['=', '@config.mode', 'multi'],
        effects: [
          ['set', '@entity.selected', '@payload.ids'],
        ],
      },
      {
        from: 'Active',
        to: 'Active',
        event: 'CLEAR',
        effects: [
          ['set', '@entity.selected', []],
          ['set', '@entity.lastSelected', null],
        ],
      },
    ],
  },

};

// ============================================================================
// std/Sort - Sorting
// ============================================================================

export const SORT_BEHAVIOR: BehaviorTrait = {
  name: 'std/Sort',
  description: 'Sorting by field with direction toggle',

  dataEntities: [
    {
      name: 'SortState',
      runtime: true,
      singleton: true,
      fields: [
        { name: 'sortField', type: 'string', default: null },
        { name: 'sortDirection', type: 'string', default: 'asc' },
      ],
    },
  ],

  stateMachine: {
    states: [
      { name: 'Active', isInitial: true },
    ],
    events: [
      { key: 'INIT', name: 'Initialize' },
      { key: 'SORT', name: 'Sort' },
      { key: 'TOGGLE_DIRECTION', name: 'Toggle Direction' },
      { key: 'CLEAR_SORT', name: 'Clear Sort' },
    ],
    transitions: [
      {
        from: 'Active',
        to: 'Active',
        event: 'INIT',
        effects: [
          ['set', '@entity.sortField', '@config.defaultField'],
          ['set', '@entity.sortDirection', '@config.defaultDirection'],
        ],
      },
      {
        from: 'Active',
        to: 'Active',
        event: 'SORT',
        effects: [
          ['if', ['=', '@entity.sortField', '@payload.field'],
            ['set', '@entity.sortDirection', ['if', ['=', '@entity.sortDirection', 'asc'], 'desc', 'asc']],
            ['do',
              ['set', '@entity.sortField', '@payload.field'],
              ['set', '@entity.sortDirection', 'asc']]],
        ],
      },
      {
        from: 'Active',
        to: 'Active',
        event: 'TOGGLE_DIRECTION',
        guard: ['!=', '@entity.sortField', null],
        effects: [
          ['set', '@entity.sortDirection', ['if', ['=', '@entity.sortDirection', 'asc'], 'desc', 'asc']],
        ],
      },
      {
        from: 'Active',
        to: 'Active',
        event: 'CLEAR_SORT',
        effects: [
          ['set', '@entity.sortField', null],
          ['set', '@entity.sortDirection', 'asc'],
        ],
      },
    ],
  },

};

// ============================================================================
// std/Filter - Query Singleton Pattern for Filtering
// ============================================================================

/**
 * std/Filter - Query Singleton pattern for explicit filtering.
 *
 * This behavior uses a singleton entity to hold filter state, making filtering
 * explicit in the schema rather than implicit in component behavior.
 *
 * The query singleton is referenced by patterns via the `query` prop:
 * ```json
 * { "type": "entity-table", "entity": "Task", "query": "@TaskQuery" }
 * ```
 */
export const FILTER_BEHAVIOR: BehaviorTrait = {
  name: 'std/Filter',
  description: 'Query Singleton pattern for explicit filtering - use with entity-table query prop',

  dataEntities: [
    {
      name: 'QueryState',
      runtime: true,
      singleton: true,
      fields: [
        { name: 'status', type: 'string', default: null },
        { name: 'priority', type: 'string', default: null },
        { name: 'search', type: 'string', default: '' },
        { name: 'sortBy', type: 'string', default: 'createdAt' },
        { name: 'sortOrder', type: 'string', default: 'desc' },
      ],
    },
  ],

  stateMachine: {
    states: [
      { name: 'Active', isInitial: true },
    ],
    events: [
      { key: 'INIT', name: 'Initialize' },
      { key: 'FILTER', name: 'Filter' },
      { key: 'SEARCH', name: 'Search' },
      { key: 'SORT', name: 'Sort' },
      { key: 'CLEAR_FILTERS', name: 'Clear Filters' },
    ],
    transitions: [
      {
        from: 'Active',
        to: 'Active',
        event: 'INIT',
        effects: [
          // Render filter UI with query reference
          ['render-ui', 'sidebar', {
            type: 'filter-group',
            query: '@QueryState',
            filters: '@config.filters',
          }],
          // Render entity table with query reference
          ['render-ui', 'main', {
            type: 'entity-table',
            entity: '@config.entity',
            query: '@QueryState',
            columns: '@config.columns',
          }],
        ],
      },
      {
        from: 'Active',
        to: 'Active',
        event: 'FILTER',
        effects: [
          ['set', '@QueryState.status', '@payload.status'],
          ['set', '@QueryState.priority', '@payload.priority'],
        ],
      },
      {
        from: 'Active',
        to: 'Active',
        event: 'SEARCH',
        effects: [
          ['set', '@QueryState.search', '@payload.searchTerm'],
        ],
      },
      {
        from: 'Active',
        to: 'Active',
        event: 'SORT',
        effects: [
          ['set', '@QueryState.sortBy', '@payload.field'],
          ['set', '@QueryState.sortOrder', '@payload.order'],
        ],
      },
      {
        from: 'Active',
        to: 'Active',
        event: 'CLEAR_FILTERS',
        effects: [
          ['set', '@QueryState.status', null],
          ['set', '@QueryState.priority', null],
          ['set', '@QueryState.search', ''],
        ],
      },
    ],
  },

};

// ============================================================================
// std/Search - Search with Debounce
// ============================================================================

/**
 * std/Search - Search with debounce.
 *
 * Uses a singleton to hold search state. Can be combined with std/Filter
 * for full query singleton functionality, or used standalone.
 */
export const SEARCH_BEHAVIOR: BehaviorTrait = {
  name: 'std/Search',
  description: 'Search with debounce - updates QueryState.search field',

  dataEntities: [
    {
      name: 'SearchState',
      runtime: true,
      singleton: true,
      fields: [
        { name: 'search', type: 'string', default: '' },
        { name: 'isSearching', type: 'boolean', default: false },
      ],
    },
  ],

  stateMachine: {
    states: [
      { name: 'Idle', isInitial: true },
      { name: 'Searching' },
    ],
    events: [
      { key: 'INIT', name: 'Initialize' },
      { key: 'SEARCH', name: 'Search' },
      { key: 'CLEAR_SEARCH', name: 'Clear Search' },
      { key: 'SEARCH_COMPLETE', name: 'Search Complete' },
    ],
    transitions: [
      {
        from: 'Idle',
        to: 'Idle',
        event: 'INIT',
        effects: [
          ['set', '@entity.search', ''],
          ['set', '@entity.isSearching', false],
          ['render-ui', 'main', {
            type: 'search-bar',
            query: '@SearchState',
            placeholder: '@config.placeholder',
          }],
        ],
      },
      {
        from: 'Idle',
        to: 'Searching',
        event: 'SEARCH',
        guard: ['>=', ['str/len', '@payload.term'], '@config.minLength'],
        effects: [
          ['set', '@entity.search', '@payload.term'],
          ['set', '@entity.isSearching', true],
          ['async/debounce', '@config.debounceMs', ['emit', 'SEARCH_COMPLETE']],
        ],
      },
      {
        from: 'Idle',
        to: 'Idle',
        event: 'SEARCH',
        guard: ['<', ['str/len', '@payload.term'], '@config.minLength'],
        effects: [
          ['set', '@entity.search', '@payload.term'],
        ],
      },
      {
        from: 'Searching',
        to: 'Idle',
        event: 'SEARCH_COMPLETE',
        effects: [
          ['set', '@entity.isSearching', false],
        ],
      },
      {
        from: 'Idle',
        to: 'Idle',
        event: 'CLEAR_SEARCH',
        effects: [
          ['set', '@entity.search', ''],
          ['set', '@entity.isSearching', false],
        ],
      },
      {
        from: 'Searching',
        to: 'Idle',
        event: 'CLEAR_SEARCH',
        effects: [
          ['set', '@entity.search', ''],
          ['set', '@entity.isSearching', false],
        ],
      },
    ],
  },

};

// ============================================================================
// Export All Data Management Behaviors
// ============================================================================

export const DATA_MANAGEMENT_BEHAVIORS: BehaviorTrait[] = [
  PAGINATION_BEHAVIOR,
  SELECTION_BEHAVIOR,
  SORT_BEHAVIOR,
  FILTER_BEHAVIOR,
  SEARCH_BEHAVIOR,
];
