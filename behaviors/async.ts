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
// std-loading - Loading State Management
// ============================================================================

export const LOADING_BEHAVIOR: OrbitalSchema = {
  name: 'std-loading',
  version: '1.0.0',
  description: 'Loading state management with success/error handling',
  orbitals: [
    {
      name: 'LoadingOrbital',
      entity: {
        name: 'LoadingState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'isLoading', type: 'boolean', default: false },
          { name: 'error', type: 'object', default: null },
          { name: 'data', type: 'object', default: null },
          { name: 'startTime', type: 'number', default: null },
        ],
      },
      traits: [
        {
          name: 'Loading',
          linkedEntity: 'LoadingState',
          category: 'lifecycle',
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
                  ['render-ui', 'content', {
                    patternType: 'loading-state',
                  }],
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
                  ['render-ui', 'content', {
                    patternType: 'error-state',
                    message: '@entity.error',
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
                  ['render-ui', 'content', {
                    patternType: 'loading-state',
                  }],
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
        },
      ],
      pages: [],
    },
  ],
};

// ============================================================================
// std-fetch - Data Fetching
// ============================================================================

export const FETCH_BEHAVIOR: OrbitalSchema = {
  name: 'std-fetch',
  version: '1.0.0',
  description: 'Data fetching with caching and refresh capabilities',
  orbitals: [
    {
      name: 'FetchOrbital',
      entity: {
        name: 'FetchState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'data', type: 'object', default: null },
          { name: 'error', type: 'object', default: null },
          { name: 'isFetching', type: 'boolean', default: false },
          { name: 'lastFetchedAt', type: 'number', default: null },
        ],
      },
      traits: [
        {
          name: 'Fetch',
          linkedEntity: 'FetchState',
          category: 'lifecycle',
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
                effects: [['set', '@entity.lastFetchedAt', null]],
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
        },
      ],
      pages: [],
    },
  ],
};

// ============================================================================
// std-submit - Form Submission
// ============================================================================

export const SUBMIT_BEHAVIOR: OrbitalSchema = {
  name: 'std-submit',
  version: '1.0.0',
  description: 'Async submission with retry capabilities',
  orbitals: [
    {
      name: 'SubmitOrbital',
      entity: {
        name: 'SubmitState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'isSubmitting', type: 'boolean', default: false },
          { name: 'error', type: 'object', default: null },
          { name: 'lastSubmittedData', type: 'object', default: null },
          { name: 'successMessage', type: 'string', default: 'Submitted successfully' },
          { name: 'errorMessage', type: 'string', default: 'Submission failed' },
          { name: 'resetOnSuccess', type: 'boolean', default: false },
        ],
      },
      traits: [
        {
          name: 'Submit',
          linkedEntity: 'SubmitState',
          category: 'lifecycle',
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
                  ['notify', 'in_app', '@entity.successMessage'],
                  ['when', '@entity.resetOnSuccess', ['emit', 'RESET']],
                ],
              },
              {
                from: 'Submitting',
                to: 'Error',
                event: 'SUBMIT_ERROR',
                effects: [
                  ['set', '@entity.isSubmitting', false],
                  ['set', '@entity.error', '@payload.error'],
                  ['notify', 'in_app', '@entity.errorMessage'],
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
        },
      ],
      pages: [],
    },
  ],
};

// ============================================================================
// std-retry - Automatic Retry
// ============================================================================

export const RETRY_BEHAVIOR: OrbitalSchema = {
  name: 'std-retry',
  version: '1.0.0',
  description: 'Automatic retry with exponential backoff',
  orbitals: [
    {
      name: 'RetryOrbital',
      entity: {
        name: 'RetryState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'attempt', type: 'number', default: 0 },
          { name: 'error', type: 'object', default: null },
          { name: 'nextRetryAt', type: 'number', default: null },
          { name: 'maxAttempts', type: 'number', default: 3 },
          { name: 'initialDelayMs', type: 'number', default: 1000 },
          { name: 'backoffMultiplier', type: 'number', default: 2 },
          { name: 'maxDelayMs', type: 'number', default: 30000 },
        ],
      },
      traits: [
        {
          name: 'Retry',
          linkedEntity: 'RetryState',
          category: 'lifecycle',
          stateMachine: {
            states: [
              { name: 'Idle', isInitial: true },
              { name: 'Attempting' },
              { name: 'Waiting' },
              { name: 'Success', isTerminal: true },
              { name: 'Failed', isTerminal: true },
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
                guard: ['<', '@entity.attempt', '@entity.maxAttempts'],
                effects: [
                  ['set', '@entity.error', '@payload.error'],
                  ['let', [['delay', ['math/min',
                    ['*', '@entity.initialDelayMs', ['math/pow', '@entity.backoffMultiplier', '@entity.attempt']],
                    '@entity.maxDelayMs']]],
                    ['set', '@entity.nextRetryAt', ['+', ['time/now'], '@delay']],
                    ['async/delay', '@delay', ['emit', 'RETRY_TICK']]],
                ],
              },
              {
                from: 'Attempting',
                to: 'Failed',
                event: 'ATTEMPT_ERROR',
                guard: ['>=', '@entity.attempt', '@entity.maxAttempts'],
                effects: [
                  ['set', '@entity.error', '@payload.error'],
                  ['notify', 'in_app', 'All retry attempts failed'],
                ],
              },
              {
                from: 'Waiting',
                to: 'Attempting',
                event: 'RETRY_TICK',
                effects: [['set', '@entity.attempt', ['+', '@entity.attempt', 1]]],
              },
              {
                from: 'Waiting',
                to: 'Failed',
                event: 'GIVE_UP',
                effects: [['notify', 'in_app', 'Retry cancelled']],
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
        },
      ],
      pages: [],
    },
  ],
};

// ============================================================================
// std-poll - Periodic Polling
// ============================================================================

export const POLL_BEHAVIOR: OrbitalSchema = {
  name: 'std-poll',
  version: '1.0.0',
  description: 'Periodic polling with start/stop control',
  orbitals: [
    {
      name: 'PollOrbital',
      entity: {
        name: 'PollState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'isPolling', type: 'boolean', default: false },
          { name: 'pollCount', type: 'number', default: 0 },
          { name: 'lastPollAt', type: 'number', default: null },
          { name: 'error', type: 'object', default: null },
          { name: 'intervalMs', type: 'number', default: 5000 },
          { name: 'maxPolls', type: 'number', default: null },
          { name: 'stopOnError', type: 'boolean', default: false },
        ],
      },
      traits: [
        {
          name: 'Poll',
          linkedEntity: 'PollState',
          category: 'lifecycle',
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
                  ['async/interval', '@entity.intervalMs', ['emit', 'POLL_TICK']],
                ],
              },
              {
                from: 'Polling',
                to: 'Polling',
                event: 'POLL_TICK',
                guard: ['or', ['=', '@entity.maxPolls', null], ['<', '@entity.pollCount', '@entity.maxPolls']],
                effects: [['set', '@entity.lastPollAt', ['time/now']]],
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
                  ['when', '@entity.stopOnError', ['emit', 'STOP']],
                ],
              },
              {
                from: 'Polling',
                to: 'Paused',
                event: 'PAUSE',
                effects: [['set', '@entity.isPolling', false]],
              },
              {
                from: 'Paused',
                to: 'Polling',
                event: 'RESUME',
                effects: [
                  ['set', '@entity.isPolling', true],
                  ['async/interval', '@entity.intervalMs', ['emit', 'POLL_TICK']],
                ],
              },
              {
                from: 'Polling',
                to: 'Stopped',
                event: 'STOP',
                effects: [['set', '@entity.isPolling', false]],
              },
              {
                from: 'Paused',
                to: 'Stopped',
                event: 'STOP',
                effects: [['set', '@entity.isPolling', false]],
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
// Export All Async Behaviors
// ============================================================================

export const ASYNC_BEHAVIORS: OrbitalSchema[] = [
  LOADING_BEHAVIOR,
  FETCH_BEHAVIOR,
  SUBMIT_BEHAVIOR,
  RETRY_BEHAVIOR,
  POLL_BEHAVIOR,
];
