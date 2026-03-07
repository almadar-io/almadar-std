/**
 * Async Behaviors
 *
 * Standard behaviors for asynchronous operations like loading,
 * fetching, submission, retry, and polling.
 * Each behavior is a self-contained OrbitalSchema that can function as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from './types.js';

// ============================================================================
// std-loading - Loading Dashboard
// ============================================================================

export const LOADING_BEHAVIOR: OrbitalSchema = {
  name: 'std-loading',
  version: '1.0.0',
  description: 'Loading state management with success/error handling',
  orbitals: [
    {
      name: 'LoadingOrbital',
      entity: {
        name: 'LoadingRecord',
        persistence: 'persistent',
        collection: 'loading_records',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'label', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'idle' },
          { name: 'message', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'LoadingManagement',
          linkedEntity: 'LoadingRecord',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'idle', isInitial: true },
              { name: 'loading' },
              { name: 'loaded' },
              { name: 'error' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'START', name: 'Start Loading' },
              { key: 'COMPLETE', name: 'Complete' },
              { key: 'FAIL', name: 'Fail', payloadSchema: [{ name: 'message', type: 'string', required: true }] },
              { key: 'RESET', name: 'Reset' },
              { key: 'VIEW', name: 'View', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
            ],
            transitions: [
              {
                from: 'idle', to: 'idle', event: 'INIT',
                effects: [
                  ['fetch', 'LoadingRecord'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Loading Dashboard' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'LoadingRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'idle', to: 'loading', event: 'START',
                effects: [
                  ['fetch', 'LoadingRecord'],
                  ['set', '@entity.status', 'loading'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Loading...' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'LoadingRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'loading', to: 'loaded', event: 'COMPLETE',
                effects: [
                  ['fetch', 'LoadingRecord'],
                  ['set', '@entity.status', 'loaded'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Loaded' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'LoadingRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'loading', to: 'error', event: 'FAIL',
                effects: [
                  ['fetch', 'LoadingRecord'],
                  ['set', '@entity.status', 'error'],
                  ['set', '@entity.message', '@payload.message'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Error' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'LoadingRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'loaded', to: 'idle', event: 'RESET',
                effects: [
                  ['fetch', 'LoadingRecord'],
                  ['set', '@entity.status', 'idle'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Loading Dashboard' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'LoadingRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'error', to: 'idle', event: 'RESET',
                effects: [
                  ['fetch', 'LoadingRecord'],
                  ['set', '@entity.status', 'idle'],
                  ['set', '@entity.message', ''],
                  ['render-ui', 'main', { type: 'page-header', title: 'Loading Dashboard' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'LoadingRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              // VIEW self-transitions for each state
              {
                from: 'idle', to: 'idle', event: 'VIEW',
                effects: [
                  ['fetch', 'LoadingRecord'],
                  ['render-ui', 'main', { type: 'entity-cards', entity: 'LoadingRecord',
                    itemActions: [{ label: 'View', event: 'VIEW' }],
                  }],
                ],
              },
              {
                from: 'loading', to: 'loading', event: 'VIEW',
                effects: [
                  ['fetch', 'LoadingRecord'],
                  ['render-ui', 'main', { type: 'entity-cards', entity: 'LoadingRecord',
                    itemActions: [{ label: 'View', event: 'VIEW' }],
                  }],
                ],
              },
              {
                from: 'loaded', to: 'loaded', event: 'VIEW',
                effects: [
                  ['fetch', 'LoadingRecord'],
                  ['render-ui', 'main', { type: 'entity-cards', entity: 'LoadingRecord',
                    itemActions: [{ label: 'View', event: 'VIEW' }],
                  }],
                ],
              },
              {
                from: 'error', to: 'error', event: 'VIEW',
                effects: [
                  ['fetch', 'LoadingRecord'],
                  ['render-ui', 'main', { type: 'entity-cards', entity: 'LoadingRecord',
                    itemActions: [{ label: 'View', event: 'VIEW' }],
                  }],
                ],
              },
            ],
          },
        },
      ],
      pages: [{ name: 'LoadingPage', path: '/loading', isInitial: true, traits: [{ ref: 'LoadingManagement' }] }],
    },
  ],
};

// ============================================================================
// std-fetch - Data Browser
// ============================================================================

export const FETCH_BEHAVIOR: OrbitalSchema = {
  name: 'std-fetch',
  version: '1.0.0',
  description: 'Data fetching with refresh capabilities',
  orbitals: [
    {
      name: 'FetchOrbital',
      entity: {
        name: 'FetchRecord',
        persistence: 'persistent',
        collection: 'fetch_records',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'idle' },
          { name: 'message', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'FetchManagement',
          linkedEntity: 'FetchRecord',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'idle', isInitial: true },
              { name: 'fetching' },
              { name: 'fresh' },
              { name: 'stale' },
              { name: 'error' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'FETCH', name: 'Fetch Data' },
              { key: 'COMPLETE', name: 'Fetch Complete' },
              { key: 'FAIL', name: 'Fetch Fail', payloadSchema: [{ name: 'message', type: 'string', required: true }] },
              { key: 'INVALIDATE', name: 'Invalidate' },
              { key: 'REFRESH', name: 'Refresh' },
              { key: 'RESET', name: 'Reset' },
              { key: 'VIEW', name: 'View', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
            ],
            transitions: [
              {
                from: 'idle', to: 'idle', event: 'INIT',
                effects: [
                  ['fetch', 'FetchRecord'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Data Browser', actions: [{ label: 'Fetch', event: 'FETCH' }] }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'FetchRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'idle', to: 'fetching', event: 'FETCH',
                effects: [
                  ['fetch', 'FetchRecord'],
                  ['set', '@entity.status', 'fetching'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Fetching...' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'FetchRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'fetching', to: 'fresh', event: 'COMPLETE',
                effects: [
                  ['fetch', 'FetchRecord'],
                  ['set', '@entity.status', 'fresh'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Data Browser', actions: [{ label: 'Refresh', event: 'REFRESH' }] }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'FetchRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'fetching', to: 'error', event: 'FAIL',
                effects: [
                  ['fetch', 'FetchRecord'],
                  ['set', '@entity.status', 'error'],
                  ['set', '@entity.message', '@payload.message'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Fetch Error',
                    actions: [{ label: 'Refresh', event: 'REFRESH' }],
                  }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'FetchRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'fresh', to: 'stale', event: 'INVALIDATE',
                effects: [
                  ['fetch', 'FetchRecord'],
                  ['set', '@entity.status', 'stale'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Data Stale', actions: [{ label: 'Refresh', event: 'REFRESH' }] }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'FetchRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'fresh', to: 'fetching', event: 'REFRESH',
                effects: [
                  ['fetch', 'FetchRecord'],
                  ['set', '@entity.status', 'fetching'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Refreshing...' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'FetchRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'stale', to: 'fetching', event: 'REFRESH',
                effects: [
                  ['fetch', 'FetchRecord'],
                  ['set', '@entity.status', 'fetching'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Refreshing...' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'FetchRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'error', to: 'fetching', event: 'REFRESH',
                effects: [
                  ['fetch', 'FetchRecord'],
                  ['set', '@entity.status', 'fetching'],
                  ['set', '@entity.message', ''],
                  ['render-ui', 'main', { type: 'page-header', title: 'Retrying...' }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'FetchRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'error', to: 'idle', event: 'RESET',
                effects: [
                  ['fetch', 'FetchRecord'],
                  ['set', '@entity.status', 'idle'],
                  ['set', '@entity.message', ''],
                  ['render-ui', 'main', { type: 'page-header', title: 'Data Browser', actions: [{ label: 'Fetch', event: 'FETCH' }] }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'FetchRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              // VIEW self-transitions for each state
              { from: 'idle', to: 'idle', event: 'VIEW', effects: [['fetch', 'FetchRecord'], ['render-ui', 'main', { type: 'entity-table', entity: 'FetchRecord', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
              { from: 'fetching', to: 'fetching', event: 'VIEW', effects: [['fetch', 'FetchRecord'], ['render-ui', 'main', { type: 'entity-table', entity: 'FetchRecord', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
              { from: 'fresh', to: 'fresh', event: 'VIEW', effects: [['fetch', 'FetchRecord'], ['render-ui', 'main', { type: 'entity-table', entity: 'FetchRecord', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
              { from: 'stale', to: 'stale', event: 'VIEW', effects: [['fetch', 'FetchRecord'], ['render-ui', 'main', { type: 'entity-table', entity: 'FetchRecord', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
              { from: 'error', to: 'error', event: 'VIEW', effects: [['fetch', 'FetchRecord'], ['render-ui', 'main', { type: 'entity-table', entity: 'FetchRecord', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
            ],
          },
        },
      ],
      pages: [{ name: 'DataBrowserPage', path: '/data-browser', isInitial: true, traits: [{ ref: 'FetchManagement' }] }],
    },
  ],
};

// ============================================================================
// std-submit - Form Submission
// ============================================================================

export const SUBMIT_BEHAVIOR: OrbitalSchema = {
  name: 'std-submit',
  version: '1.0.0',
  description: 'Form submission with success/error handling',
  orbitals: [
    {
      name: 'SubmitOrbital',
      entity: {
        name: 'Submission',
        persistence: 'persistent',
        collection: 'submissions',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'idle' },
          { name: 'message', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'SubmitManagement',
          linkedEntity: 'Submission',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'idle', isInitial: true },
              { name: 'submitting' },
              { name: 'success' },
              { name: 'error' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'SUBMIT', name: 'Submit', payloadSchema: [{ name: 'name', type: 'string', required: true }] },
              { key: 'COMPLETE', name: 'Submit Complete' },
              { key: 'FAIL', name: 'Submit Fail', payloadSchema: [{ name: 'message', type: 'string', required: true }] },
              { key: 'RESET', name: 'Reset' },
              { key: 'CLOSE', name: 'Close' },
              { key: 'VIEW', name: 'View', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
            ],
            transitions: [
              {
                from: 'idle', to: 'idle', event: 'INIT',
                effects: [
                  ['fetch', 'Submission'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Submissions' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Submission',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'idle', to: 'submitting', event: 'SUBMIT',
                effects: [
                  ['fetch', 'Submission'],
                  ['set', '@entity.status', 'submitting'],
                  ['set', '@entity.name', '@payload.name'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Submitting...' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Submission',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'submitting', to: 'success', event: 'COMPLETE',
                effects: [
                  ['fetch', 'Submission'],
                  ['set', '@entity.status', 'success'],
                  ['persist', 'create', 'Submission', { name: '@entity.name', status: 'success' }],
                  ['render-ui', 'main', { type: 'page-header', title: 'Success' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Submission',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'submitting', to: 'error', event: 'FAIL',
                effects: [
                  ['fetch', 'Submission'],
                  ['set', '@entity.status', 'error'],
                  ['set', '@entity.message', '@payload.message'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Submission Failed' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Submission',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'success', to: 'idle', event: 'RESET',
                effects: [
                  ['fetch', 'Submission'],
                  ['set', '@entity.status', 'idle'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Submissions' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Submission',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'error', to: 'idle', event: 'RESET',
                effects: [
                  ['fetch', 'Submission'],
                  ['set', '@entity.status', 'idle'],
                  ['set', '@entity.message', ''],
                  ['render-ui', 'main', { type: 'page-header', title: 'Submissions' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Submission',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'success', to: 'idle', event: 'CLOSE',
                effects: [
                  ['fetch', 'Submission'],
                  ['set', '@entity.status', 'idle'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Submissions' }],
                  ['render-ui', 'main', { type: 'entity-list',
                    entity: 'Submission',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              // VIEW self-transitions for each state
              { from: 'idle', to: 'idle', event: 'VIEW', effects: [['fetch', 'Submission'], ['render-ui', 'main', { type: 'entity-list', entity: 'Submission', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
              { from: 'submitting', to: 'submitting', event: 'VIEW', effects: [['fetch', 'Submission'], ['render-ui', 'main', { type: 'entity-list', entity: 'Submission', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
              { from: 'success', to: 'success', event: 'VIEW', effects: [['fetch', 'Submission'], ['render-ui', 'main', { type: 'entity-list', entity: 'Submission', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
              { from: 'error', to: 'error', event: 'VIEW', effects: [['fetch', 'Submission'], ['render-ui', 'main', { type: 'entity-list', entity: 'Submission', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
            ],
          },
        },
      ],
      pages: [{ name: 'SubmissionsPage', path: '/submissions', isInitial: true, traits: [{ ref: 'SubmitManagement' }] }],
    },
  ],
};

// ============================================================================
// std-retry - Operation with Retry
// ============================================================================

export const RETRY_BEHAVIOR: OrbitalSchema = {
  name: 'std-retry',
  version: '1.0.0',
  description: 'Operation with retry capability',
  orbitals: [
    {
      name: 'RetryOrbital',
      entity: {
        name: 'RetryRecord',
        persistence: 'persistent',
        collection: 'retry_records',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'idle' },
          { name: 'attempt', type: 'number', default: 0 },
          { name: 'message', type: 'string', default: '' },
        ],
      },
      traits: [
        {
          name: 'RetryManagement',
          linkedEntity: 'RetryRecord',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'idle', isInitial: true },
              { name: 'attempting' },
              { name: 'success' },
              { name: 'failed' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'START', name: 'Start Operation' },
              { key: 'COMPLETE', name: 'Operation Complete' },
              { key: 'FAIL', name: 'Operation Fail', payloadSchema: [{ name: 'message', type: 'string', required: true }] },
              { key: 'RETRY', name: 'Retry' },
              { key: 'RESET', name: 'Reset' },
              { key: 'VIEW', name: 'View', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
            ],
            transitions: [
              {
                from: 'idle', to: 'idle', event: 'INIT',
                effects: [
                  ['fetch', 'RetryRecord'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Operations', actions: [{ label: 'Start', event: 'START' }] }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'RetryRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'idle', to: 'attempting', event: 'START',
                effects: [
                  ['fetch', 'RetryRecord'],
                  ['set', '@entity.status', 'attempting'],
                  ['set', '@entity.attempt', 1],
                  ['render-ui', 'main', { type: 'page-header', title: 'Attempting...' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'RetryRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'attempting', to: 'success', event: 'COMPLETE',
                effects: [
                  ['fetch', 'RetryRecord'],
                  ['set', '@entity.status', 'success'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Success' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'RetryRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'attempting', to: 'failed', event: 'FAIL',
                effects: [
                  ['fetch', 'RetryRecord'],
                  ['set', '@entity.status', 'failed'],
                  ['set', '@entity.message', '@payload.message'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Failed', actions: [{ label: 'Retry', event: 'RETRY' }] }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'RetryRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'failed', to: 'attempting', event: 'RETRY',
                effects: [
                  ['fetch', 'RetryRecord'],
                  ['set', '@entity.status', 'attempting'],
                  ['set', '@entity.message', ''],
                  ['render-ui', 'main', { type: 'page-header', title: 'Retrying...' }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'RetryRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'success', to: 'idle', event: 'RESET',
                effects: [
                  ['fetch', 'RetryRecord'],
                  ['set', '@entity.status', 'idle'],
                  ['set', '@entity.attempt', 0],
                  ['render-ui', 'main', { type: 'page-header', title: 'Operations', actions: [{ label: 'Start', event: 'START' }] }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'RetryRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'failed', to: 'idle', event: 'RESET',
                effects: [
                  ['fetch', 'RetryRecord'],
                  ['set', '@entity.status', 'idle'],
                  ['set', '@entity.attempt', 0],
                  ['set', '@entity.message', ''],
                  ['render-ui', 'main', { type: 'page-header', title: 'Operations', actions: [{ label: 'Start', event: 'START' }] }],
                  ['render-ui', 'main', { type: 'entity-cards',
                    entity: 'RetryRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              // VIEW self-transitions for each state
              { from: 'idle', to: 'idle', event: 'VIEW', effects: [['fetch', 'RetryRecord'], ['render-ui', 'main', { type: 'entity-cards', entity: 'RetryRecord', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
              { from: 'attempting', to: 'attempting', event: 'VIEW', effects: [['fetch', 'RetryRecord'], ['render-ui', 'main', { type: 'entity-cards', entity: 'RetryRecord', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
              { from: 'success', to: 'success', event: 'VIEW', effects: [['fetch', 'RetryRecord'], ['render-ui', 'main', { type: 'entity-cards', entity: 'RetryRecord', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
              { from: 'failed', to: 'failed', event: 'VIEW', effects: [['fetch', 'RetryRecord'], ['render-ui', 'main', { type: 'entity-cards', entity: 'RetryRecord', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
            ],
          },
        },
      ],
      pages: [{ name: 'OperationsPage', path: '/operations', isInitial: true, traits: [{ ref: 'RetryManagement' }] }],
    },
  ],
};

// ============================================================================
// std-poll - Polling Monitor
// ============================================================================

export const POLL_BEHAVIOR: OrbitalSchema = {
  name: 'std-poll',
  version: '1.0.0',
  description: 'Polling monitor with start/stop/pause control',
  orbitals: [
    {
      name: 'PollOrbital',
      entity: {
        name: 'PollRecord',
        persistence: 'persistent',
        collection: 'poll_records',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'name', type: 'string', default: '' },
          { name: 'status', type: 'string', default: 'stopped' },
          { name: 'count', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'PollManagement',
          linkedEntity: 'PollRecord',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'stopped', isInitial: true },
              { name: 'polling' },
              { name: 'paused' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'START', name: 'Start Polling' },
              { key: 'STOP', name: 'Stop Polling' },
              { key: 'PAUSE', name: 'Pause Polling' },
              { key: 'RESUME', name: 'Resume Polling' },
              { key: 'VIEW', name: 'View', payloadSchema: [{ name: 'id', type: 'string', required: true }] },
            ],
            transitions: [
              {
                from: 'stopped', to: 'stopped', event: 'INIT',
                effects: [
                  ['fetch', 'PollRecord'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Poll Monitor', actions: [{ label: 'Start', event: 'START' }] }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'PollRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'stopped', to: 'polling', event: 'START',
                effects: [
                  ['fetch', 'PollRecord'],
                  ['set', '@entity.status', 'polling'],
                  ['set', '@entity.count', 0],
                  ['render-ui', 'main', { type: 'page-header', title: 'Polling...', actions: [{ label: 'Pause', event: 'PAUSE' }, { label: 'Stop', event: 'STOP' }] }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'PollRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'polling', to: 'paused', event: 'PAUSE',
                effects: [
                  ['fetch', 'PollRecord'],
                  ['set', '@entity.status', 'paused'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Paused', actions: [{ label: 'Resume', event: 'RESUME' }, { label: 'Stop', event: 'STOP' }] }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'PollRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'paused', to: 'polling', event: 'RESUME',
                effects: [
                  ['fetch', 'PollRecord'],
                  ['set', '@entity.status', 'polling'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Polling...', actions: [{ label: 'Pause', event: 'PAUSE' }, { label: 'Stop', event: 'STOP' }] }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'PollRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'polling', to: 'stopped', event: 'STOP',
                effects: [
                  ['fetch', 'PollRecord'],
                  ['set', '@entity.status', 'stopped'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Poll Monitor', actions: [{ label: 'Start', event: 'START' }] }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'PollRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              {
                from: 'paused', to: 'stopped', event: 'STOP',
                effects: [
                  ['fetch', 'PollRecord'],
                  ['set', '@entity.status', 'stopped'],
                  ['render-ui', 'main', { type: 'page-header', title: 'Poll Monitor', actions: [{ label: 'Start', event: 'START' }] }],
                  ['render-ui', 'main', { type: 'entity-table',
                    entity: 'PollRecord',
                    itemActions: [
                      { label: 'View', event: 'VIEW' },
                    ],
                  }],
                ],
              },
              // VIEW self-transitions for each state
              { from: 'stopped', to: 'stopped', event: 'VIEW', effects: [['fetch', 'PollRecord'], ['render-ui', 'main', { type: 'entity-table', entity: 'PollRecord', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
              { from: 'polling', to: 'polling', event: 'VIEW', effects: [['fetch', 'PollRecord'], ['render-ui', 'main', { type: 'entity-table', entity: 'PollRecord', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
              { from: 'paused', to: 'paused', event: 'VIEW', effects: [['fetch', 'PollRecord'], ['render-ui', 'main', { type: 'entity-table', entity: 'PollRecord', itemActions: [{ label: 'View', event: 'VIEW' }] }]] },
            ],
          },
        },
      ],
      pages: [{ name: 'PollMonitorPage', path: '/poll-monitor', isInitial: true, traits: [{ ref: 'PollManagement' }] }],
    },
  ],
};

// ============================================================================
// Export All Async Behaviors
// ============================================================================

export const ASYNC_BEHAVIORS: OrbitalSchema[] = [
  LOADING_BEHAVIOR,
  FETCH_BEHAVIOR,
  SUBMIT_BEHAVIOR,
  RETRY_BEHAVIOR,
  POLL_BEHAVIOR,
];
