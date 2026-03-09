/**
 * Async Behaviors
 *
 * Standard behaviors for asynchronous operations like loading,
 * fetching, submission, retry, and polling.
 * Each behavior is a self-contained OrbitalSchema that can function as a standalone .orb file.
 *
 * UI Composition: molecule-first (atoms + molecules only, no organisms).
 * Each behavior has unique, domain-appropriate layouts composed with
 * stack wrappers around atoms and molecules.
 *
 * @packageDocumentation
 */

import type { BehaviorSchema, BehaviorEffect } from './types.js';

// ── Shared Async Theme ─────────────────────────────────────────────

const ASYNC_THEME = {
  name: 'async-blue',
  tokens: {
    colors: {
      primary: '#2563eb',
      'primary-hover': '#1d4ed8',
      'primary-foreground': '#ffffff',
      accent: '#3b82f6',
      'accent-foreground': '#ffffff',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ============================================================================
// std-loading - Loading Dashboard
// ============================================================================

// ── Reusable main-view effects (loading: idle dashboard) ───────────

const loadingDashboardEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'loader', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Loading Dashboard' },
      ]},
      { type: 'button', label: 'Start', icon: 'play', variant: 'primary', action: 'START' },
    ]},
    { type: 'divider' },
    // Stats row
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Records', icon: 'database', entity: 'LoadingRecord' },
      { type: 'stats', label: 'Status', icon: 'activity', entity: 'LoadingRecord' },
    ]},
    { type: 'divider' },
    // Data grid
    { type: 'data-grid', entity: 'LoadingRecord', cols: 2, gap: 'md',
      fields: [
        { name: 'label', label: 'Label', icon: 'tag', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

// ── Loading in-progress view ───────────────────────────────────────

const loadingInProgressEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: spinner + title
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'loader', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Loading...' },
    ]},
    { type: 'divider' },
    // Loading indicator with icon and descriptive text
    { type: 'stack', direction: 'vertical', gap: 'sm', align: 'center', children: [
      { type: 'icon', name: 'loader', size: 'xl' },
      { type: 'typography', variant: 'body', content: 'Please wait while your data is being loaded.' },
    ]},
    { type: 'progress-bar', value: 0, label: 'Processing', icon: 'clock' },
    { type: 'divider' },
    // Data grid
    { type: 'data-grid', entity: 'LoadingRecord', cols: 2, gap: 'md',
      fields: [
        { name: 'label', label: 'Label', icon: 'tag', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

// ── Loading success view ───────────────────────────────────────────

const loadingSuccessEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: success icon + title + reset
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'check-circle', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Loaded' },
      ]},
      { type: 'button', label: 'Reset', icon: 'refresh-cw', variant: 'secondary', action: 'RESET' },
    ]},
    { type: 'divider' },
    { type: 'badge', label: 'Complete', variant: 'success', icon: 'check' },
    { type: 'divider' },
    // Data grid
    { type: 'data-grid', entity: 'LoadingRecord', cols: 2, gap: 'md',
      fields: [
        { name: 'label', label: 'Label', icon: 'tag', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

// ── Loading error view ─────────────────────────────────────────────

const loadingErrorEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: error icon + title + reset
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'alert-circle', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Error' },
      ]},
      { type: 'button', label: 'Reset', icon: 'refresh-cw', variant: 'secondary', action: 'RESET' },
    ]},
    { type: 'divider' },
    { type: 'badge', label: 'Failed', variant: 'error', icon: 'x-circle' },
    { type: 'divider' },
    // Data grid
    { type: 'data-grid', entity: 'LoadingRecord', cols: 2, gap: 'md',
      fields: [
        { name: 'label', label: 'Label', icon: 'tag', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

// ── Loading view-only (no header actions, shared across VIEW self-transitions) ──

const loadingViewEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'loader', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Loading Dashboard' },
    ]},
    { type: 'divider' },
    { type: 'data-grid', entity: 'LoadingRecord', cols: 2, gap: 'md',
      fields: [
        { name: 'label', label: 'Label', icon: 'tag', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

export const LOADING_BEHAVIOR: BehaviorSchema = {
  name: 'std-loading',
  version: '1.0.0',
  description: 'Loading state management with success/error handling',
  theme: ASYNC_THEME,
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
                  ...loadingDashboardEffects,
                ],
              },
              {
                from: 'idle', to: 'loading', event: 'START',
                effects: [
                  ['fetch', 'LoadingRecord'],
                  ['set', '@entity.status', 'loading'],
                  ...loadingInProgressEffects,
                ],
              },
              {
                from: 'loading', to: 'loaded', event: 'COMPLETE',
                effects: [
                  ['fetch', 'LoadingRecord'],
                  ['set', '@entity.status', 'loaded'],
                  ...loadingSuccessEffects,
                ],
              },
              {
                from: 'loading', to: 'error', event: 'FAIL',
                effects: [
                  ['fetch', 'LoadingRecord'],
                  ['set', '@entity.status', 'error'],
                  ['set', '@entity.message', '@payload.message'],
                  ...loadingErrorEffects,
                ],
              },
              {
                from: 'loaded', to: 'idle', event: 'RESET',
                effects: [
                  ['fetch', 'LoadingRecord'],
                  ['set', '@entity.status', 'idle'],
                  ...loadingDashboardEffects,
                ],
              },
              {
                from: 'error', to: 'idle', event: 'RESET',
                effects: [
                  ['fetch', 'LoadingRecord'],
                  ['set', '@entity.status', 'idle'],
                  ['set', '@entity.message', ''],
                  ...loadingDashboardEffects,
                ],
              },
              // VIEW self-transitions for each state
              { from: 'idle', to: 'idle', event: 'VIEW', effects: [['fetch', 'LoadingRecord'], ...loadingViewEffects] },
              { from: 'loading', to: 'loading', event: 'VIEW', effects: [['fetch', 'LoadingRecord'], ...loadingViewEffects] },
              { from: 'loaded', to: 'loaded', event: 'VIEW', effects: [['fetch', 'LoadingRecord'], ...loadingViewEffects] },
              { from: 'error', to: 'error', event: 'VIEW', effects: [['fetch', 'LoadingRecord'], ...loadingViewEffects] },
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

// ── Reusable main-view effects (fetch: idle) ───────────────────────

const fetchIdleEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title + fetch button
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'download-cloud', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Data Browser' },
      ]},
      { type: 'button', label: 'Fetch', icon: 'download', variant: 'primary', action: 'FETCH' },
    ]},
    { type: 'divider' },
    // Stats
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Records', icon: 'database', entity: 'FetchRecord' },
      { type: 'stats', label: 'Status', icon: 'activity', entity: 'FetchRecord' },
    ]},
    { type: 'divider' },
    // Data list
    { type: 'data-list', entity: 'FetchRecord',
      fields: [
        { name: 'name', label: 'Name', icon: 'tag', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

// ── Fetching in-progress view ──────────────────────────────────────

const fetchingEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'download-cloud', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Fetching...' },
    ]},
    { type: 'divider' },
    { type: 'progress-bar', value: 0, label: 'Fetching data', icon: 'clock' },
    { type: 'divider' },
    { type: 'data-list', entity: 'FetchRecord',
      fields: [
        { name: 'name', label: 'Name', icon: 'tag', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

// ── Fresh data view ────────────────────────────────────────────────

const fetchFreshEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'check-circle', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Data Browser' },
      ]},
      { type: 'button', label: 'Refresh', icon: 'refresh-cw', variant: 'secondary', action: 'REFRESH' },
    ]},
    { type: 'divider' },
    { type: 'badge', label: 'Fresh', variant: 'success', icon: 'check' },
    { type: 'divider' },
    { type: 'data-list', entity: 'FetchRecord',
      fields: [
        { name: 'name', label: 'Name', icon: 'tag', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

// ── Stale data view ────────────────────────────────────────────────

const fetchStaleEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'clock', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Data Stale' },
      ]},
      { type: 'button', label: 'Refresh', icon: 'refresh-cw', variant: 'primary', action: 'REFRESH' },
    ]},
    { type: 'divider' },
    { type: 'badge', label: 'Stale', variant: 'warning', icon: 'alert-triangle' },
    { type: 'divider' },
    { type: 'data-list', entity: 'FetchRecord',
      fields: [
        { name: 'name', label: 'Name', icon: 'tag', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

// ── Fetch error view ───────────────────────────────────────────────

const fetchErrorEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'alert-circle', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Fetch Error' },
      ]},
      { type: 'button', label: 'Refresh', icon: 'refresh-cw', variant: 'secondary', action: 'REFRESH' },
    ]},
    { type: 'divider' },
    { type: 'badge', label: 'Error', variant: 'error', icon: 'x-circle' },
    { type: 'divider' },
    { type: 'data-list', entity: 'FetchRecord',
      fields: [
        { name: 'name', label: 'Name', icon: 'tag', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

// ── Fetch view-only (shared across VIEW self-transitions) ──────────

const fetchViewEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'download-cloud', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Data Browser' },
    ]},
    { type: 'divider' },
    { type: 'data-list', entity: 'FetchRecord',
      fields: [
        { name: 'name', label: 'Name', icon: 'tag', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

export const FETCH_BEHAVIOR: BehaviorSchema = {
  name: 'std-fetch',
  version: '1.0.0',
  description: 'Data fetching with refresh capabilities',
  theme: ASYNC_THEME,
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
                  ...fetchIdleEffects,
                ],
              },
              {
                from: 'idle', to: 'fetching', event: 'FETCH',
                effects: [
                  ['fetch', 'FetchRecord'],
                  ['set', '@entity.status', 'fetching'],
                  ...fetchingEffects,
                ],
              },
              {
                from: 'fetching', to: 'fresh', event: 'COMPLETE',
                effects: [
                  ['fetch', 'FetchRecord'],
                  ['set', '@entity.status', 'fresh'],
                  ...fetchFreshEffects,
                ],
              },
              {
                from: 'fetching', to: 'error', event: 'FAIL',
                effects: [
                  ['fetch', 'FetchRecord'],
                  ['set', '@entity.status', 'error'],
                  ['set', '@entity.message', '@payload.message'],
                  ...fetchErrorEffects,
                ],
              },
              {
                from: 'fresh', to: 'stale', event: 'INVALIDATE',
                effects: [
                  ['fetch', 'FetchRecord'],
                  ['set', '@entity.status', 'stale'],
                  ...fetchStaleEffects,
                ],
              },
              {
                from: 'fresh', to: 'fetching', event: 'REFRESH',
                effects: [
                  ['fetch', 'FetchRecord'],
                  ['set', '@entity.status', 'fetching'],
                  ...fetchingEffects,
                ],
              },
              {
                from: 'stale', to: 'fetching', event: 'REFRESH',
                effects: [
                  ['fetch', 'FetchRecord'],
                  ['set', '@entity.status', 'fetching'],
                  ...fetchingEffects,
                ],
              },
              {
                from: 'error', to: 'fetching', event: 'REFRESH',
                effects: [
                  ['fetch', 'FetchRecord'],
                  ['set', '@entity.status', 'fetching'],
                  ['set', '@entity.message', ''],
                  ...fetchingEffects,
                ],
              },
              {
                from: 'error', to: 'idle', event: 'RESET',
                effects: [
                  ['fetch', 'FetchRecord'],
                  ['set', '@entity.status', 'idle'],
                  ['set', '@entity.message', ''],
                  ...fetchIdleEffects,
                ],
              },
              // VIEW self-transitions for each state
              { from: 'idle', to: 'idle', event: 'VIEW', effects: [['fetch', 'FetchRecord'], ...fetchViewEffects] },
              { from: 'fetching', to: 'fetching', event: 'VIEW', effects: [['fetch', 'FetchRecord'], ...fetchViewEffects] },
              { from: 'fresh', to: 'fresh', event: 'VIEW', effects: [['fetch', 'FetchRecord'], ...fetchViewEffects] },
              { from: 'stale', to: 'stale', event: 'VIEW', effects: [['fetch', 'FetchRecord'], ...fetchViewEffects] },
              { from: 'error', to: 'error', event: 'VIEW', effects: [['fetch', 'FetchRecord'], ...fetchViewEffects] },
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

// ── Reusable main-view effects (submit: idle) ──────────────────────

const submitIdleEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'send', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Submissions' },
    ]},
    { type: 'divider' },
    // Stats
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Total', icon: 'hash', entity: 'Submission' },
      { type: 'stats', label: 'Status', icon: 'activity', entity: 'Submission' },
    ]},
    { type: 'divider' },
    // Submission list
    { type: 'data-list', entity: 'Submission',
      fields: [
        { name: 'name', label: 'Name', icon: 'file-text', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

// ── Submitting in-progress view ────────────────────────────────────

const submittingEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'send', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Submitting...' },
    ]},
    { type: 'divider' },
    { type: 'progress-bar', value: 0, label: 'Sending', icon: 'upload' },
    { type: 'divider' },
    { type: 'data-list', entity: 'Submission',
      fields: [
        { name: 'name', label: 'Name', icon: 'file-text', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

// ── Submit success view ────────────────────────────────────────────

const submitSuccessEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'check-circle', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Success' },
      ]},
      { type: 'button', label: 'Reset', icon: 'refresh-cw', variant: 'secondary', action: 'RESET' },
    ]},
    { type: 'divider' },
    { type: 'badge', label: 'Submitted', variant: 'success', icon: 'check' },
    { type: 'divider' },
    { type: 'data-list', entity: 'Submission',
      fields: [
        { name: 'name', label: 'Name', icon: 'file-text', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

// ── Submit error view ──────────────────────────────────────────────

const submitErrorEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'alert-circle', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Submission Failed' },
      ]},
      { type: 'button', label: 'Reset', icon: 'refresh-cw', variant: 'secondary', action: 'RESET' },
    ]},
    { type: 'divider' },
    { type: 'badge', label: 'Error', variant: 'error', icon: 'x-circle' },
    { type: 'divider' },
    { type: 'data-list', entity: 'Submission',
      fields: [
        { name: 'name', label: 'Name', icon: 'file-text', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

// ── Submit view-only (shared across VIEW self-transitions) ─────────

const submitViewEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'send', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Submissions' },
    ]},
    { type: 'divider' },
    { type: 'data-list', entity: 'Submission',
      fields: [
        { name: 'name', label: 'Name', icon: 'file-text', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

export const SUBMIT_BEHAVIOR: BehaviorSchema = {
  name: 'std-submit',
  version: '1.0.0',
  description: 'Form submission with success/error handling',
  theme: ASYNC_THEME,
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
                  ...submitIdleEffects,
                ],
              },
              {
                from: 'idle', to: 'submitting', event: 'SUBMIT',
                effects: [
                  ['fetch', 'Submission'],
                  ['set', '@entity.status', 'submitting'],
                  ['set', '@entity.name', '@payload.name'],
                  ...submittingEffects,
                ],
              },
              {
                from: 'submitting', to: 'success', event: 'COMPLETE',
                effects: [
                  ['fetch', 'Submission'],
                  ['set', '@entity.status', 'success'],
                  ['persist', 'create', 'Submission', { name: '@entity.name', status: 'success' }],
                  ...submitSuccessEffects,
                ],
              },
              {
                from: 'submitting', to: 'error', event: 'FAIL',
                effects: [
                  ['fetch', 'Submission'],
                  ['set', '@entity.status', 'error'],
                  ['set', '@entity.message', '@payload.message'],
                  ...submitErrorEffects,
                ],
              },
              {
                from: 'success', to: 'idle', event: 'RESET',
                effects: [
                  ['fetch', 'Submission'],
                  ['set', '@entity.status', 'idle'],
                  ...submitIdleEffects,
                ],
              },
              {
                from: 'error', to: 'idle', event: 'RESET',
                effects: [
                  ['fetch', 'Submission'],
                  ['set', '@entity.status', 'idle'],
                  ['set', '@entity.message', ''],
                  ...submitIdleEffects,
                ],
              },
              {
                from: 'success', to: 'idle', event: 'CLOSE',
                effects: [
                  ['fetch', 'Submission'],
                  ['set', '@entity.status', 'idle'],
                  ...submitIdleEffects,
                ],
              },
              // VIEW self-transitions for each state
              { from: 'idle', to: 'idle', event: 'VIEW', effects: [['fetch', 'Submission'], ...submitViewEffects] },
              { from: 'submitting', to: 'submitting', event: 'VIEW', effects: [['fetch', 'Submission'], ...submitViewEffects] },
              { from: 'success', to: 'success', event: 'VIEW', effects: [['fetch', 'Submission'], ...submitViewEffects] },
              { from: 'error', to: 'error', event: 'VIEW', effects: [['fetch', 'Submission'], ...submitViewEffects] },
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

// ── Reusable main-view effects (retry: idle) ───────────────────────

const retryIdleEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title + start button
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'repeat', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Operations' },
      ]},
      { type: 'button', label: 'Start', icon: 'play', variant: 'primary', action: 'START' },
    ]},
    { type: 'divider' },
    // Stats row
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Records', icon: 'database', entity: 'RetryRecord' },
      { type: 'stats', label: 'Attempts', icon: 'repeat', entity: 'RetryRecord' },
    ]},
    { type: 'divider' },
    // Data grid
    { type: 'data-grid', entity: 'RetryRecord', cols: 2, gap: 'md',
      fields: [
        { name: 'name', label: 'Name', icon: 'tag', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'attempt', label: 'Attempt', icon: 'hash', variant: 'body', format: 'number' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

// ── Attempting view ────────────────────────────────────────────────

const retryAttemptingEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'repeat', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Attempting...' },
    ]},
    { type: 'divider' },
    { type: 'progress-bar', value: 0, label: 'Processing', icon: 'clock' },
    { type: 'divider' },
    { type: 'data-grid', entity: 'RetryRecord', cols: 2, gap: 'md',
      fields: [
        { name: 'name', label: 'Name', icon: 'tag', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'attempt', label: 'Attempt', icon: 'hash', variant: 'body', format: 'number' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

// ── Retry success view ─────────────────────────────────────────────

const retrySuccessEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'check-circle', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Success' },
      ]},
      { type: 'button', label: 'Reset', icon: 'refresh-cw', variant: 'secondary', action: 'RESET' },
    ]},
    { type: 'divider' },
    { type: 'badge', label: 'Complete', variant: 'success', icon: 'check' },
    { type: 'divider' },
    { type: 'data-grid', entity: 'RetryRecord', cols: 2, gap: 'md',
      fields: [
        { name: 'name', label: 'Name', icon: 'tag', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'attempt', label: 'Attempt', icon: 'hash', variant: 'body', format: 'number' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

// ── Retry failed view ──────────────────────────────────────────────

const retryFailedEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'alert-circle', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Failed' },
      ]},
      { type: 'button', label: 'Retry', icon: 'repeat', variant: 'primary', action: 'RETRY' },
    ]},
    { type: 'divider' },
    { type: 'badge', label: 'Failed', variant: 'error', icon: 'x-circle' },
    { type: 'divider' },
    { type: 'data-grid', entity: 'RetryRecord', cols: 2, gap: 'md',
      fields: [
        { name: 'name', label: 'Name', icon: 'tag', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'attempt', label: 'Attempt', icon: 'hash', variant: 'body', format: 'number' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

// ── Retry view-only (shared across VIEW self-transitions) ──────────

const retryViewEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'repeat', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Operations' },
    ]},
    { type: 'divider' },
    { type: 'data-grid', entity: 'RetryRecord', cols: 2, gap: 'md',
      fields: [
        { name: 'name', label: 'Name', icon: 'tag', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'attempt', label: 'Attempt', icon: 'hash', variant: 'body', format: 'number' },
        { name: 'message', label: 'Message', icon: 'message-square', variant: 'body' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

export const RETRY_BEHAVIOR: BehaviorSchema = {
  name: 'std-retry',
  version: '1.0.0',
  description: 'Operation with retry capability',
  theme: ASYNC_THEME,
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
                  ...retryIdleEffects,
                ],
              },
              {
                from: 'idle', to: 'attempting', event: 'START',
                effects: [
                  ['fetch', 'RetryRecord'],
                  ['set', '@entity.status', 'attempting'],
                  ['set', '@entity.attempt', 1],
                  ...retryAttemptingEffects,
                ],
              },
              {
                from: 'attempting', to: 'success', event: 'COMPLETE',
                effects: [
                  ['fetch', 'RetryRecord'],
                  ['set', '@entity.status', 'success'],
                  ...retrySuccessEffects,
                ],
              },
              {
                from: 'attempting', to: 'failed', event: 'FAIL',
                effects: [
                  ['fetch', 'RetryRecord'],
                  ['set', '@entity.status', 'failed'],
                  ['set', '@entity.message', '@payload.message'],
                  ...retryFailedEffects,
                ],
              },
              {
                from: 'failed', to: 'attempting', event: 'RETRY',
                effects: [
                  ['fetch', 'RetryRecord'],
                  ['set', '@entity.status', 'attempting'],
                  ['set', '@entity.message', ''],
                  ...retryAttemptingEffects,
                ],
              },
              {
                from: 'success', to: 'idle', event: 'RESET',
                effects: [
                  ['fetch', 'RetryRecord'],
                  ['set', '@entity.status', 'idle'],
                  ['set', '@entity.attempt', 0],
                  ...retryIdleEffects,
                ],
              },
              {
                from: 'failed', to: 'idle', event: 'RESET',
                effects: [
                  ['fetch', 'RetryRecord'],
                  ['set', '@entity.status', 'idle'],
                  ['set', '@entity.attempt', 0],
                  ['set', '@entity.message', ''],
                  ...retryIdleEffects,
                ],
              },
              // VIEW self-transitions for each state
              { from: 'idle', to: 'idle', event: 'VIEW', effects: [['fetch', 'RetryRecord'], ...retryViewEffects] },
              { from: 'attempting', to: 'attempting', event: 'VIEW', effects: [['fetch', 'RetryRecord'], ...retryViewEffects] },
              { from: 'success', to: 'success', event: 'VIEW', effects: [['fetch', 'RetryRecord'], ...retryViewEffects] },
              { from: 'failed', to: 'failed', event: 'VIEW', effects: [['fetch', 'RetryRecord'], ...retryViewEffects] },
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

// ── Reusable main-view effects (poll: stopped) ─────────────────────

const pollStoppedEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title + start button
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'radio', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Poll Monitor' },
      ]},
      { type: 'button', label: 'Start', icon: 'play', variant: 'primary', action: 'START' },
    ]},
    { type: 'divider' },
    // Stats
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Records', icon: 'database', entity: 'PollRecord' },
      { type: 'stats', label: 'Poll Count', icon: 'hash', entity: 'PollRecord' },
    ]},
    { type: 'divider' },
    { type: 'badge', label: 'Stopped', variant: 'secondary', icon: 'square' },
    { type: 'divider' },
    // Data grid for poll records
    { type: 'data-grid', entity: 'PollRecord', cols: 2, gap: 'md',
      fields: [
        { name: 'name', label: 'Name', icon: 'tag', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'count', label: 'Count', icon: 'hash', variant: 'body', format: 'number' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

// ── Polling active view ────────────────────────────────────────────

const pollActiveEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title + pause/stop buttons
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'radio', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Polling...' },
      ]},
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'button', label: 'Pause', icon: 'pause', variant: 'secondary', action: 'PAUSE' },
        { type: 'button', label: 'Stop', icon: 'square', variant: 'ghost', action: 'STOP' },
      ]},
    ]},
    { type: 'divider' },
    { type: 'progress-bar', value: 0, label: 'Polling active', icon: 'activity' },
    { type: 'divider' },
    // Stats
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Records', icon: 'database', entity: 'PollRecord' },
      { type: 'stats', label: 'Poll Count', icon: 'hash', entity: 'PollRecord' },
    ]},
    { type: 'divider' },
    { type: 'data-grid', entity: 'PollRecord', cols: 2, gap: 'md',
      fields: [
        { name: 'name', label: 'Name', icon: 'tag', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'count', label: 'Count', icon: 'hash', variant: 'body', format: 'number' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

// ── Polling paused view ────────────────────────────────────────────

const pollPausedEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    // Header: icon + title + resume/stop buttons
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'pause-circle', size: 'lg' },
        { type: 'typography', variant: 'h2', content: 'Paused' },
      ]},
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'button', label: 'Resume', icon: 'play', variant: 'primary', action: 'RESUME' },
        { type: 'button', label: 'Stop', icon: 'square', variant: 'ghost', action: 'STOP' },
      ]},
    ]},
    { type: 'divider' },
    { type: 'badge', label: 'Paused', variant: 'warning', icon: 'pause' },
    { type: 'divider' },
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stats', label: 'Records', icon: 'database', entity: 'PollRecord' },
      { type: 'stats', label: 'Poll Count', icon: 'hash', entity: 'PollRecord' },
    ]},
    { type: 'divider' },
    { type: 'data-grid', entity: 'PollRecord', cols: 2, gap: 'md',
      fields: [
        { name: 'name', label: 'Name', icon: 'tag', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'count', label: 'Count', icon: 'hash', variant: 'body', format: 'number' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

// ── Poll view-only (shared across VIEW self-transitions) ───────────

const pollViewEffects: BehaviorEffect[] = [
  ['render-ui', 'main', { type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'radio', size: 'lg' },
      { type: 'typography', variant: 'h2', content: 'Poll Monitor' },
    ]},
    { type: 'divider' },
    { type: 'data-grid', entity: 'PollRecord', cols: 2, gap: 'md',
      fields: [
        { name: 'name', label: 'Name', icon: 'tag', variant: 'h4' },
        { name: 'status', label: 'Status', icon: 'circle', variant: 'badge' },
        { name: 'count', label: 'Count', icon: 'hash', variant: 'body', format: 'number' },
      ],
      actions: [
        { label: 'View', event: 'VIEW', icon: 'eye', variant: 'ghost' },
      ],
    },
  ]}],
];

export const POLL_BEHAVIOR: BehaviorSchema = {
  name: 'std-poll',
  version: '1.0.0',
  description: 'Polling monitor with start/stop/pause control',
  theme: ASYNC_THEME,
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
                  ...pollStoppedEffects,
                ],
              },
              {
                from: 'stopped', to: 'polling', event: 'START',
                effects: [
                  ['fetch', 'PollRecord'],
                  ['set', '@entity.status', 'polling'],
                  ['set', '@entity.count', 0],
                  ...pollActiveEffects,
                ],
              },
              {
                from: 'polling', to: 'paused', event: 'PAUSE',
                effects: [
                  ['fetch', 'PollRecord'],
                  ['set', '@entity.status', 'paused'],
                  ...pollPausedEffects,
                ],
              },
              {
                from: 'paused', to: 'polling', event: 'RESUME',
                effects: [
                  ['fetch', 'PollRecord'],
                  ['set', '@entity.status', 'polling'],
                  ...pollActiveEffects,
                ],
              },
              {
                from: 'polling', to: 'stopped', event: 'STOP',
                effects: [
                  ['fetch', 'PollRecord'],
                  ['set', '@entity.status', 'stopped'],
                  ...pollStoppedEffects,
                ],
              },
              {
                from: 'paused', to: 'stopped', event: 'STOP',
                effects: [
                  ['fetch', 'PollRecord'],
                  ['set', '@entity.status', 'stopped'],
                  ...pollStoppedEffects,
                ],
              },
              // VIEW self-transitions for each state
              { from: 'stopped', to: 'stopped', event: 'VIEW', effects: [['fetch', 'PollRecord'], ...pollViewEffects] },
              { from: 'polling', to: 'polling', event: 'VIEW', effects: [['fetch', 'PollRecord'], ...pollViewEffects] },
              { from: 'paused', to: 'paused', event: 'VIEW', effects: [['fetch', 'PollRecord'], ...pollViewEffects] },
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

export const ASYNC_BEHAVIORS: BehaviorSchema[] = [
  LOADING_BEHAVIOR,
  FETCH_BEHAVIOR,
  SUBMIT_BEHAVIOR,
  RETRY_BEHAVIOR,
  POLL_BEHAVIOR,
];
