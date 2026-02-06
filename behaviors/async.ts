/**
 * Async Behaviors
 *
 * Standard behaviors for asynchronous operations like loading,
 * fetching, submission, retry, and polling.
 *
 * @packageDocumentation
 */

import type { BehaviorTrait } from './types.js';

// ============================================================================
// std/Loading - Loading State Management
// ============================================================================

export const LOADING_BEHAVIOR: BehaviorTrait = {
  name: 'std/Loading',
  description: 'Loading state management with success/error handling',

  dataEntities: [
    {
      name: 'LoadingState',
      runtime: true,
      singleton: true,
      fields: [
        { name: 'isLoading', type: 'boolean', default: false },
        { name: 'error', type: 'object', default: null },
        { name: 'data', type: 'object', default: null },
        { name: 'startTime', type: 'number', default: null },
      ],
    },
  ],

  stateMachine: {
    states: [
      { name: 'Idle', isInitial: true },
      { name: 'Loading' },
      { name: 'Success' },
      { name: 'Error' },
    ],
    events: [
      { key: 'START', name: 'Start' },
      { key: 'SUCCESS', name: 'Success' },
      { key: 'ERROR', name: 'Error' },
      { key: 'RETRY', name: 'Retry' },
      { key: 'RESET', name: 'Reset' },
    ],
    transitions: [
      {
        from: 'Idle',
        to: 'Loading',
        event: 'START',
        effects: [
          ['set', '@entity.isLoading', true],
          ['set', '@entity.error', null],
          ['set', '@entity.startTime', ['time/now']],
          ['render', 'content', 'loading-state', {}],
        ],
      },
      {
        from: 'Loading',
        to: 'Success',
        event: 'SUCCESS',
        effects: [
          ['set', '@entity.isLoading', false],
          ['set', '@entity.data', '@payload.data'],
        ],
      },
      {
        from: 'Loading',
        to: 'Error',
        event: 'ERROR',
        effects: [
          ['set', '@entity.isLoading', false],
          ['set', '@entity.error', '@payload.error'],
          ['render', 'content', 'error-state', {
            error: '@entity.error',
            onRetry: 'RETRY',
          }],
        ],
      },
      {
        from: 'Error',
        to: 'Loading',
        event: 'RETRY',
        effects: [
          ['set', '@entity.isLoading', true],
          ['set', '@entity.error', null],
          ['set', '@entity.startTime', ['time/now']],
          ['render', 'content', 'loading-state', {}],
        ],
      },
      {
        from: 'Success',
        to: 'Idle',
        event: 'RESET',
        effects: [
          ['set', '@entity.isLoading', false],
          ['set', '@entity.error', null],
          ['set', '@entity.data', null],
        ],
      },
      {
        from: 'Error',
        to: 'Idle',
        event: 'RESET',
        effects: [
          ['set', '@entity.isLoading', false],
          ['set', '@entity.error', null],
          ['set', '@entity.data', null],
        ],
      },
    ],
  },

};

// ============================================================================
// std/Fetch - Data Fetching
// ============================================================================

export const FETCH_BEHAVIOR: BehaviorTrait = {
  name: 'std/Fetch',
  description: 'Data fetching with caching and refresh capabilities',

  dataEntities: [
    {
      name: 'FetchState',
      runtime: true,
      singleton: true,
      fields: [
        { name: 'data', type: 'object', default: null },
        { name: 'error', type: 'object', default: null },
        { name: 'isFetching', type: 'boolean', default: false },
        { name: 'lastFetchedAt', type: 'number', default: null },
      ],
    },
  ],

  stateMachine: {
    states: [
      { name: 'Idle', isInitial: true },
      { name: 'Fetching' },
      { name: 'Stale' },
      { name: 'Fresh' },
      { name: 'Error' },
    ],
    events: [
      { key: 'FETCH', name: 'Fetch' },
      { key: 'FETCH_SUCCESS', name: 'Fetch Success' },
      { key: 'FETCH_ERROR', name: 'Fetch Error' },
      { key: 'REFRESH', name: 'Refresh' },
      { key: 'INVALIDATE', name: 'Invalidate' },
    ],
    transitions: [
      {
        from: 'Idle',
        to: 'Fetching',
        event: 'FETCH',
        effects: [
          ['set', '@entity.isFetching', true],
          ['set', '@entity.error', null],
        ],
      },
      {
        from: 'Stale',
        to: 'Fetching',
        event: 'FETCH',
        effects: [
          ['set', '@entity.isFetching', true],
          ['set', '@entity.error', null],
        ],
      },
      {
        from: 'Fetching',
        to: 'Fresh',
        event: 'FETCH_SUCCESS',
        effects: [
          ['set', '@entity.isFetching', false],
          ['set', '@entity.data', '@payload.data'],
          ['set', '@entity.lastFetchedAt', ['time/now']],
        ],
      },
      {
        from: 'Fetching',
        to: 'Error',
        event: 'FETCH_ERROR',
        effects: [
          ['set', '@entity.isFetching', false],
          ['set', '@entity.error', '@payload.error'],
        ],
      },
      {
        from: 'Fresh',
        to: 'Stale',
        event: 'INVALIDATE',
        effects: [
          ['set', '@entity.lastFetchedAt', null],
        ],
      },
      {
        from: 'Fresh',
        to: 'Fetching',
        event: 'REFRESH',
        effects: [
          ['set', '@entity.isFetching', true],
          ['set', '@entity.error', null],
        ],
      },
      {
        from: 'Stale',
        to: 'Fetching',
        event: 'REFRESH',
        effects: [
          ['set', '@entity.isFetching', true],
          ['set', '@entity.error', null],
        ],
      },
      {
        from: 'Error',
        to: 'Fetching',
        event: 'REFRESH',
        effects: [
          ['set', '@entity.isFetching', true],
          ['set', '@entity.error', null],
        ],
      },
    ],
  },

};

// ============================================================================
// std/Submit - Form Submission
// ============================================================================

export const SUBMIT_BEHAVIOR: BehaviorTrait = {
  name: 'std/Submit',
  description: 'Async submission with retry capabilities',

  dataEntities: [
    {
      name: 'SubmitState',
      runtime: true,
      singleton: true,
      fields: [
        { name: 'isSubmitting', type: 'boolean', default: false },
        { name: 'error', type: 'object', default: null },
        { name: 'lastSubmittedData', type: 'object', default: null },
      ],
    },
  ],

  stateMachine: {
    states: [
      { name: 'Idle', isInitial: true },
      { name: 'Submitting' },
      { name: 'Success' },
      { name: 'Error' },
    ],
    events: [
      { key: 'SUBMIT', name: 'Submit' },
      { key: 'SUBMIT_SUCCESS', name: 'Submit Success' },
      { key: 'SUBMIT_ERROR', name: 'Submit Error' },
      { key: 'RETRY', name: 'Retry' },
      { key: 'RESET', name: 'Reset' },
    ],
    transitions: [
      {
        from: 'Idle',
        to: 'Submitting',
        event: 'SUBMIT',
        effects: [
          ['set', '@entity.isSubmitting', true],
          ['set', '@entity.error', null],
          ['set', '@entity.lastSubmittedData', '@payload.data'],
        ],
      },
      {
        from: 'Submitting',
        to: 'Success',
        event: 'SUBMIT_SUCCESS',
        effects: [
          ['set', '@entity.isSubmitting', false],
          ['notify', { type: 'success', message: '@config.successMessage' }],
          ['when', '@config.resetOnSuccess', ['emit', 'RESET']],
        ],
      },
      {
        from: 'Submitting',
        to: 'Error',
        event: 'SUBMIT_ERROR',
        effects: [
          ['set', '@entity.isSubmitting', false],
          ['set', '@entity.error', '@payload.error'],
          ['notify', { type: 'error', message: '@config.errorMessage' }],
        ],
      },
      {
        from: 'Error',
        to: 'Submitting',
        event: 'RETRY',
        effects: [
          ['set', '@entity.isSubmitting', true],
          ['set', '@entity.error', null],
        ],
      },
      {
        from: 'Success',
        to: 'Idle',
        event: 'RESET',
        effects: [
          ['set', '@entity.isSubmitting', false],
          ['set', '@entity.error', null],
          ['set', '@entity.lastSubmittedData', null],
        ],
      },
      {
        from: 'Error',
        to: 'Idle',
        event: 'RESET',
        effects: [
          ['set', '@entity.isSubmitting', false],
          ['set', '@entity.error', null],
          ['set', '@entity.lastSubmittedData', null],
        ],
      },
    ],
  },

};

// ============================================================================
// std/Retry - Automatic Retry
// ============================================================================

export const RETRY_BEHAVIOR: BehaviorTrait = {
  name: 'std/Retry',
  description: 'Automatic retry with exponential backoff',

  dataEntities: [
    {
      name: 'RetryState',
      runtime: true,
      singleton: true,
      fields: [
        { name: 'attempt', type: 'number', default: 0 },
        { name: 'error', type: 'object', default: null },
        { name: 'nextRetryAt', type: 'number', default: null },
      ],
    },
  ],

  stateMachine: {
    states: [
      { name: 'Idle', isInitial: true },
      { name: 'Attempting' },
      { name: 'Waiting' },
      { name: 'Success' },
      { name: 'Failed' },
    ],
    events: [
      { key: 'START', name: 'Start' },
      { key: 'ATTEMPT_SUCCESS', name: 'Attempt Success' },
      { key: 'ATTEMPT_ERROR', name: 'Attempt Error' },
      { key: 'RETRY_TICK', name: 'Retry Tick' },
      { key: 'GIVE_UP', name: 'Give Up' },
      { key: 'RESET', name: 'Reset' },
    ],
    transitions: [
      {
        from: 'Idle',
        to: 'Attempting',
        event: 'START',
        effects: [
          ['set', '@entity.attempt', 1],
          ['set', '@entity.error', null],
        ],
      },
      {
        from: 'Attempting',
        to: 'Success',
        event: 'ATTEMPT_SUCCESS',
        effects: [],
      },
      {
        from: 'Attempting',
        to: 'Waiting',
        event: 'ATTEMPT_ERROR',
        guard: ['<', '@entity.attempt', '@config.maxAttempts'],
        effects: [
          ['set', '@entity.error', '@payload.error'],
          ['let', [['delay', ['math/min',
            ['*', '@config.initialDelayMs', ['math/pow', '@config.backoffMultiplier', '@entity.attempt']],
            '@config.maxDelayMs']]],
            ['set', '@entity.nextRetryAt', ['+', ['time/now'], '@delay']],
            ['async/delay', '@delay', ['emit', 'RETRY_TICK']]],
        ],
      },
      {
        from: 'Attempting',
        to: 'Failed',
        event: 'ATTEMPT_ERROR',
        guard: ['>=', '@entity.attempt', '@config.maxAttempts'],
        effects: [
          ['set', '@entity.error', '@payload.error'],
          ['notify', { type: 'error', message: 'All retry attempts failed' }],
        ],
      },
      {
        from: 'Waiting',
        to: 'Attempting',
        event: 'RETRY_TICK',
        effects: [
          ['set', '@entity.attempt', ['+', '@entity.attempt', 1]],
        ],
      },
      {
        from: 'Waiting',
        to: 'Failed',
        event: 'GIVE_UP',
        effects: [
          ['notify', { type: 'warning', message: 'Retry cancelled' }],
        ],
      },
      {
        from: 'Success',
        to: 'Idle',
        event: 'RESET',
        effects: [
          ['set', '@entity.attempt', 0],
          ['set', '@entity.error', null],
          ['set', '@entity.nextRetryAt', null],
        ],
      },
      {
        from: 'Failed',
        to: 'Idle',
        event: 'RESET',
        effects: [
          ['set', '@entity.attempt', 0],
          ['set', '@entity.error', null],
          ['set', '@entity.nextRetryAt', null],
        ],
      },
    ],
  },

};

// ============================================================================
// std/Poll - Periodic Polling
// ============================================================================

export const POLL_BEHAVIOR: BehaviorTrait = {
  name: 'std/Poll',
  description: 'Periodic polling with start/stop control',

  dataEntities: [
    {
      name: 'PollState',
      runtime: true,
      singleton: true,
      fields: [
        { name: 'isPolling', type: 'boolean', default: false },
        { name: 'pollCount', type: 'number', default: 0 },
        { name: 'lastPollAt', type: 'number', default: null },
        { name: 'error', type: 'object', default: null },
      ],
    },
  ],

  stateMachine: {
    states: [
      { name: 'Stopped', isInitial: true },
      { name: 'Polling' },
      { name: 'Paused' },
    ],
    events: [
      { key: 'START', name: 'Start' },
      { key: 'STOP', name: 'Stop' },
      { key: 'PAUSE', name: 'Pause' },
      { key: 'RESUME', name: 'Resume' },
      { key: 'POLL_TICK', name: 'Poll Tick' },
      { key: 'POLL_SUCCESS', name: 'Poll Success' },
      { key: 'POLL_ERROR', name: 'Poll Error' },
    ],
    transitions: [
      {
        from: 'Stopped',
        to: 'Polling',
        event: 'START',
        effects: [
          ['set', '@entity.isPolling', true],
          ['set', '@entity.pollCount', 0],
          ['async/interval', '@config.intervalMs', ['emit', 'POLL_TICK']],
        ],
      },
      {
        from: 'Polling',
        to: 'Polling',
        event: 'POLL_TICK',
        guard: ['or', ['=', '@config.maxPolls', null], ['<', '@entity.pollCount', '@config.maxPolls']],
        effects: [
          ['set', '@entity.lastPollAt', ['time/now']],
        ],
      },
      {
        from: 'Polling',
        to: 'Polling',
        event: 'POLL_SUCCESS',
        effects: [
          ['set', '@entity.pollCount', ['+', '@entity.pollCount', 1]],
          ['set', '@entity.error', null],
        ],
      },
      {
        from: 'Polling',
        to: 'Polling',
        event: 'POLL_ERROR',
        effects: [
          ['set', '@entity.error', '@payload.error'],
          ['when', '@config.stopOnError', ['emit', 'STOP']],
        ],
      },
      {
        from: 'Polling',
        to: 'Paused',
        event: 'PAUSE',
        effects: [
          ['set', '@entity.isPolling', false],
        ],
      },
      {
        from: 'Paused',
        to: 'Polling',
        event: 'RESUME',
        effects: [
          ['set', '@entity.isPolling', true],
          ['async/interval', '@config.intervalMs', ['emit', 'POLL_TICK']],
        ],
      },
      {
        from: 'Polling',
        to: 'Stopped',
        event: 'STOP',
        effects: [
          ['set', '@entity.isPolling', false],
        ],
      },
      {
        from: 'Paused',
        to: 'Stopped',
        event: 'STOP',
        effects: [
          ['set', '@entity.isPolling', false],
        ],
      },
    ],
  },

};

// ============================================================================
// Export All Async Behaviors
// ============================================================================

export const ASYNC_BEHAVIORS: BehaviorTrait[] = [
  LOADING_BEHAVIOR,
  FETCH_BEHAVIOR,
  SUBMIT_BEHAVIOR,
  RETRY_BEHAVIOR,
  POLL_BEHAVIOR,
];
