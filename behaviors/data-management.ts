/**
 * Data Management Behaviors
 *
 * Standard behaviors for data operations like pagination, selection,
 * sorting, filtering, and search.
 * Each behavior is a self-contained OrbitalSchema that can function as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from './types.js';

// ============================================================================
// std-pagination - Page Navigation
// ============================================================================

/**
 * std-pagination - Page navigation behavior for large data sets.
 */
export const PAGINATION_BEHAVIOR: OrbitalSchema = {
  name: 'std-pagination',
  version: '1.0.0',
  description: 'Page-based navigation for large data sets',
  orbitals: [
    {
      name: 'PaginationOrbital',
      entity: {
        name: 'PaginationState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'page', type: 'number', default: 1 },
          { name: 'pageSize', type: 'number', default: 20 },
          { name: 'totalItems', type: 'number', default: 0 },
          { name: 'defaultPageSize', type: 'number', default: 20 },
        ],
      },
      traits: [
        {
          name: 'Pagination',
          linkedEntity: 'PaginationState',
          category: 'interaction',
          stateMachine: {
            states: [{ name: 'Active', isInitial: true }],
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
                  ['set', '@entity.pageSize', '@entity.defaultPageSize'],
                ],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'NEXT_PAGE',
                guard: ['<', '@entity.page', ['math/ceil', ['/', '@entity.totalItems', '@entity.pageSize']]],
                effects: [['set', '@entity.page', ['+', '@entity.page', 1]]],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'PREV_PAGE',
                guard: ['>', '@entity.page', 1],
                effects: [['set', '@entity.page', ['-', '@entity.page', 1]]],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'GO_TO_PAGE',
                guard: ['and',
                  ['>=', '@payload.page', 1],
                  ['<=', '@payload.page', ['math/ceil', ['/', '@entity.totalItems', '@entity.pageSize']]]],
                effects: [['set', '@entity.page', '@payload.page']],
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
        },
      ],
      pages: [],
    },
  ],
};

// ============================================================================
// std-selection - Single/Multi Selection
// ============================================================================

export const SELECTION_BEHAVIOR: OrbitalSchema = {
  name: 'std-selection',
  version: '1.0.0',
  description: 'Single or multi-selection management',
  orbitals: [
    {
      name: 'SelectionOrbital',
      entity: {
        name: 'SelectionState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'selected', type: 'array', default: [] },
          { name: 'lastSelected', type: 'string', default: null },
          { name: 'mode', type: 'string', default: 'multi' },
          { name: 'maxSelection', type: 'number', default: null },
        ],
      },
      traits: [
        {
          name: 'Selection',
          linkedEntity: 'SelectionState',
          category: 'interaction',
          stateMachine: {
            states: [{ name: 'Active', isInitial: true }],
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
                  ['if', ['=', '@entity.mode', 'single'],
                    ['do',
                      ['set', '@entity.selected', ['@payload.id']],
                      ['set', '@entity.lastSelected', '@payload.id']],
                    ['if', ['or',
                      ['not', '@entity.maxSelection'],
                      ['<', ['array/len', '@entity.selected'], '@entity.maxSelection']],
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
                    ['if', ['or', ['=', '@entity.mode', 'single'], ['or',
                      ['not', '@entity.maxSelection'],
                      ['<', ['array/len', '@entity.selected'], '@entity.maxSelection']]],
                      ['set', '@entity.selected',
                        ['if', ['=', '@entity.mode', 'single'],
                          ['@payload.id'],
                          ['array/append', '@entity.selected', '@payload.id']]],
                      ['notify', { type: 'warning', message: 'Maximum selection reached' }]]],
                ],
              },
              {
                from: 'Active',
                to: 'Active',
                event: 'SELECT_ALL',
                guard: ['=', '@entity.mode', 'multi'],
                effects: [['set', '@entity.selected', '@payload.ids']],
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
        },
      ],
      pages: [],
    },
  ],
};

// ============================================================================
// std-sort - Sorting
// ============================================================================

export const SORT_BEHAVIOR: OrbitalSchema = {
  name: 'std-sort',
  version: '1.0.0',
  description: 'Sorting by field with direction toggle',
  orbitals: [
    {
      name: 'SortOrbital',
      entity: {
        name: 'SortState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'sortField', type: 'string', default: null },
          { name: 'sortDirection', type: 'string', default: 'asc' },
          { name: 'defaultField', type: 'string', default: null },
          { name: 'defaultDirection', type: 'string', default: 'asc' },
        ],
      },
      traits: [
        {
          name: 'Sort',
          linkedEntity: 'SortState',
          category: 'interaction',
          stateMachine: {
            states: [{ name: 'Active', isInitial: true }],
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
                  ['set', '@entity.sortField', '@entity.defaultField'],
                  ['set', '@entity.sortDirection', '@entity.defaultDirection'],
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
        },
      ],
      pages: [],
    },
  ],
};

// ============================================================================
// std-filter - Query Singleton Pattern for Filtering
// ============================================================================

/**
 * std-filter - Query Singleton pattern for explicit filtering.
 *
 * This behavior uses a singleton entity to hold filter state, making filtering
 * explicit in the schema rather than implicit in component behavior.
 */
export const FILTER_BEHAVIOR: OrbitalSchema = {
  name: 'std-filter',
  version: '1.0.0',
  description: 'Query Singleton pattern for explicit filtering - use with entity-table query prop',
  orbitals: [
    {
      name: 'FilterOrbital',
      entity: {
        name: 'QueryState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'status', type: 'string', default: null },
          { name: 'priority', type: 'string', default: null },
          { name: 'search', type: 'string', default: '' },
          { name: 'sortBy', type: 'string', default: 'createdAt' },
          { name: 'sortOrder', type: 'string', default: 'desc' },
          { name: 'entityType', type: 'string', default: '' },
          { name: 'filters', type: 'array', default: [] },
          { name: 'columns', type: 'array', default: [] },
        ],
      },
      traits: [
        {
          name: 'Filter',
          linkedEntity: 'QueryState',
          category: 'interaction',
          stateMachine: {
            states: [{ name: 'Active', isInitial: true }],
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
                  ['render-ui', 'sidebar', {
                    type: 'filter-group',
                    query: '@QueryState',
                    filters: '@entity.filters',
                  }],
                  ['render-ui', 'main', {
                    type: 'entity-table',
                    entity: '@entity.entityType',
                    query: '@QueryState',
                    columns: '@entity.columns',
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
                effects: [['set', '@QueryState.search', '@payload.searchTerm']],
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
        },
      ],
      pages: [],
    },
  ],
};

// ============================================================================
// std-search - Search with Debounce
// ============================================================================

/**
 * std-search - Search with debounce.
 */
export const SEARCH_BEHAVIOR: OrbitalSchema = {
  name: 'std-search',
  version: '1.0.0',
  description: 'Search with debounce - updates QueryState.search field',
  orbitals: [
    {
      name: 'SearchOrbital',
      entity: {
        name: 'SearchState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'search', type: 'string', default: '' },
          { name: 'isSearching', type: 'boolean', default: false },
          { name: 'minLength', type: 'number', default: 2 },
          { name: 'debounceMs', type: 'number', default: 300 },
          { name: 'placeholder', type: 'string', default: 'Search...' },
        ],
      },
      traits: [
        {
          name: 'Search',
          linkedEntity: 'SearchState',
          category: 'interaction',
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
                    placeholder: '@entity.placeholder',
                  }],
                ],
              },
              {
                from: 'Idle',
                to: 'Searching',
                event: 'SEARCH',
                guard: ['>=', ['str/len', '@payload.term'], '@entity.minLength'],
                effects: [
                  ['set', '@entity.search', '@payload.term'],
                  ['set', '@entity.isSearching', true],
                  ['async/debounce', '@entity.debounceMs', ['emit', 'SEARCH_COMPLETE']],
                ],
              },
              {
                from: 'Idle',
                to: 'Idle',
                event: 'SEARCH',
                guard: ['<', ['str/len', '@payload.term'], '@entity.minLength'],
                effects: [['set', '@entity.search', '@payload.term']],
              },
              {
                from: 'Searching',
                to: 'Idle',
                event: 'SEARCH_COMPLETE',
                effects: [['set', '@entity.isSearching', false]],
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
        },
      ],
      pages: [],
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
