/**
 * Infrastructure Behaviors
 *
 * Standard behaviors for infrastructure patterns like circuit breaking
 * and health monitoring.
 * Each behavior is a self-contained OrbitalSchema that can function as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { BehaviorSchema, BehaviorEffect } from './types.js';

// ============================================================================
// Shared theme for all infrastructure behaviors
// ============================================================================

const INFRA_THEME = {
  name: 'infra-stone',
  tokens: {
    colors: {
      primary: '#57534e',
      'primary-hover': '#44403c',
      'primary-foreground': '#ffffff',
      accent: '#78716c',
      'accent-foreground': '#ffffff',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
};

// ============================================================================
// Shared render-ui compositions
// ============================================================================

const circuitBreakerMainView: BehaviorEffect = ['render-ui', 'main', {
  type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'shield-check', size: 'lg' },
        { type: 'typography', content: 'Circuit Breaker', variant: 'h2' },
      ] },
      { type: 'badge', label: '@entity.circuitState', icon: 'circle-dot', variant: 'success' },
    ] },
    { type: 'divider' },
    { type: 'progress-bar', value: '@entity.errorCount', max: '@entity.errorThreshold', label: 'Error Rate' },
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stat-card', label: 'Errors', value: '@entity.errorCount', icon: 'x-circle' },
      { type: 'stat-card', label: 'Successes', value: '@entity.successCount', icon: 'check-circle' },
      { type: 'stat-card', label: 'Total', value: '@entity.totalCount', icon: 'hash' },
      { type: 'stat-card', label: 'Threshold', value: '@entity.errorThreshold', icon: 'alert-triangle' },
    ] },
    { type: 'divider' },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Simulate Success', action: 'SUCCESS', icon: 'check', variant: 'primary' },
      { type: 'button', label: 'Simulate Failure', action: 'FAILURE', icon: 'x', variant: 'secondary' },
      { type: 'button', label: 'Reset', action: 'RESET', icon: 'refresh-cw', variant: 'secondary' },
    ] },
  ],
}];

const circuitBreakerOpenView: BehaviorEffect = ['render-ui', 'main', {
  type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'shield-alert', size: 'lg' },
        { type: 'typography', content: 'Circuit Breaker - OPEN', variant: 'h2' },
      ] },
      { type: 'badge', label: 'OPEN', icon: 'alert-circle', variant: 'danger' },
    ] },
    { type: 'divider' },
    { type: 'progress-bar', value: '@entity.errorCount', max: '@entity.errorThreshold', label: 'Errors' },
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stat-card', label: 'Errors', value: '@entity.errorCount', icon: 'x-circle' },
      { type: 'stat-card', label: 'Successes', value: '@entity.successCount', icon: 'check-circle' },
      { type: 'stat-card', label: 'Total', value: '@entity.totalCount', icon: 'hash' },
      { type: 'stat-card', label: 'Error Rate', value: '@entity.errorRate', icon: 'percent' },
    ] },
    { type: 'divider' },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Try Half-Open', action: 'HALF_OPEN', icon: 'shield-question', variant: 'primary' },
      { type: 'button', label: 'Reset', action: 'RESET', icon: 'refresh-cw', variant: 'secondary' },
    ] },
  ],
}];

const circuitBreakerHalfOpenView: BehaviorEffect = ['render-ui', 'main', {
  type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'shield-question', size: 'lg' },
        { type: 'typography', content: 'Circuit Breaker - Half Open', variant: 'h2' },
      ] },
      { type: 'badge', label: 'HALF-OPEN', icon: 'alert-triangle', variant: 'warning' },
    ] },
    { type: 'divider' },
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stat-card', label: 'Errors', value: '@entity.errorCount', icon: 'x-circle' },
      { type: 'stat-card', label: 'Successes', value: '@entity.successCount', icon: 'check-circle' },
      { type: 'stat-card', label: 'Attempts', value: '@entity.halfOpenAttempts', icon: 'rotate-cw' },
      { type: 'stat-card', label: 'Error Rate', value: '@entity.errorRate', icon: 'percent' },
    ] },
    { type: 'divider' },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Test Success', action: 'SUCCESS', icon: 'check', variant: 'primary' },
      { type: 'button', label: 'Test Failure', action: 'FAILURE', icon: 'x', variant: 'secondary' },
    ] },
  ],
}];

const healthCheckView = (title: string, statusVariant: string): BehaviorEffect => ['render-ui', 'main', {
  type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'activity', size: 'lg' },
        { type: 'typography', content: title, variant: 'h2' },
      ] },
      { type: 'badge', label: '@entity.healthStatus', icon: 'heart-pulse', variant: statusVariant },
    ] },
    { type: 'divider' },
    { type: 'progress-bar', value: '@entity.consecutiveFailures', max: '@entity.unhealthyThreshold', label: 'Failure Threshold' },
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stat-card', label: 'Failures', value: '@entity.consecutiveFailures', icon: 'x-circle' },
      { type: 'stat-card', label: 'Successes', value: '@entity.consecutiveSuccesses', icon: 'check-circle' },
      { type: 'stat-card', label: 'Total Checks', value: '@entity.totalChecks', icon: 'clipboard-check' },
      { type: 'stat-card', label: 'Total Failures', value: '@entity.totalFailures', icon: 'alert-triangle' },
    ] },
    { type: 'divider' },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Check Success', action: 'CHECK_SUCCESS', icon: 'check', variant: 'primary' },
      { type: 'button', label: 'Check Failure', action: 'CHECK_FAILURE', icon: 'x', variant: 'secondary' },
      { type: 'button', label: 'Reset', action: 'RESET', icon: 'refresh-cw', variant: 'secondary' },
    ] },
  ],
}];

const rateLimiterView = (title: string): BehaviorEffect => ['render-ui', 'main', {
  type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'gauge', size: 'lg' },
        { type: 'typography', content: title, variant: 'h2' },
      ] },
    ] },
    { type: 'divider' },
    { type: 'progress-bar', value: '@entity.requestCount', max: '@entity.rateLimit', label: 'Rate Usage' },
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stat-card', label: 'Requests', value: '@entity.requestCount', icon: 'arrow-up-right' },
      { type: 'stat-card', label: 'Limit', value: '@entity.rateLimit', icon: 'shield' },
      { type: 'stat-card', label: 'Total', value: '@entity.totalRequests', icon: 'hash' },
      { type: 'stat-card', label: 'Rejected', value: '@entity.rejectedRequests', icon: 'ban' },
    ] },
    { type: 'divider' },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Send Request', action: 'REQUEST', icon: 'send', variant: 'primary' },
      { type: 'button', label: 'Reset Window', action: 'RESET_WINDOW', icon: 'refresh-cw', variant: 'secondary' },
    ] },
  ],
}];

const cacheStatsView = (title: string): BehaviorEffect => ['render-ui', 'main', {
  type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'database', size: 'lg' },
        { type: 'typography', content: title, variant: 'h2' },
      ] },
      { type: 'badge', label: '@entity.isFresh', icon: 'check-circle', variant: 'outline' },
    ] },
    { type: 'divider' },
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stat-card', label: 'Key', value: '@entity.cacheKey', icon: 'key' },
      { type: 'stat-card', label: 'Hits', value: '@entity.cacheHits', icon: 'check' },
      { type: 'stat-card', label: 'Misses', value: '@entity.cacheMisses', icon: 'x' },
      { type: 'stat-card', label: 'TTL (ms)', value: '@entity.ttlMs', icon: 'clock' },
    ] },
    { type: 'divider' },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Get', action: 'GET', icon: 'download', variant: 'primary' },
      { type: 'button', label: 'Invalidate', action: 'INVALIDATE', icon: 'trash-2', variant: 'secondary' },
    ] },
  ],
}];

const cacheEmptyView = (title: string): BehaviorEffect => ['render-ui', 'main', {
  type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'icon', name: 'database', size: 'lg' },
      { type: 'typography', content: title, variant: 'h2' },
    ] },
    { type: 'divider' },
    { type: 'empty-state', icon: 'inbox', title: 'Cache is empty', description: 'No cached data available' },
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stat-card', label: 'Hits', value: '@entity.cacheHits', icon: 'check' },
      { type: 'stat-card', label: 'Misses', value: '@entity.cacheMisses', icon: 'x' },
    ] },
    { type: 'divider' },
    { type: 'button', label: 'Fetch Data', action: 'SET', icon: 'download', variant: 'primary' },
  ],
}];

const sagaView = (title: string): BehaviorEffect => ['render-ui', 'main', {
  type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'workflow', size: 'lg' },
        { type: 'typography', content: title, variant: 'h2' },
      ] },
      { type: 'badge', label: '@entity.sagaStatus', icon: 'flag', variant: 'outline' },
    ] },
    { type: 'divider' },
    { type: 'progress-bar', value: '@entity.currentStep', max: '@entity.totalSteps', label: 'Progress' },
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stat-card', label: 'Current Step', value: '@entity.currentStep', icon: 'footprints' },
      { type: 'stat-card', label: 'Total Steps', value: '@entity.totalSteps', icon: 'list-ordered' },
      { type: 'stat-card', label: 'Failed Step', value: '@entity.failedStep', icon: 'alert-circle' },
      { type: 'stat-card', label: 'Status', value: '@entity.sagaStatus', icon: 'flag' },
    ] },
    { type: 'divider' },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Execute', action: 'EXECUTE', icon: 'play', variant: 'primary' },
      { type: 'button', label: 'Compensate', action: 'COMPENSATE', icon: 'undo-2', variant: 'secondary' },
      { type: 'button', label: 'Reset', action: 'RESET', icon: 'refresh-cw', variant: 'secondary' },
    ] },
  ],
}];

const metricsView = (title: string): BehaviorEffect => ['render-ui', 'main', {
  type: 'stack', direction: 'vertical', gap: 'lg', children: [
    { type: 'stack', direction: 'horizontal', justify: 'space-between', children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
        { type: 'icon', name: 'bar-chart-3', size: 'lg' },
        { type: 'typography', content: title, variant: 'h2' },
      ] },
    ] },
    { type: 'divider' },
    { type: 'stack', direction: 'horizontal', gap: 'md', children: [
      { type: 'stat-card', label: 'Recorded', value: '@entity.totalRecorded', icon: 'database' },
      { type: 'stat-card', label: 'Flushes', value: '@entity.totalFlushes', icon: 'upload' },
      { type: 'stat-card', label: 'Last Flush', value: '@entity.lastFlush', icon: 'clock' },
    ] },
    { type: 'divider' },
    { type: 'stack', direction: 'horizontal', gap: 'sm', children: [
      { type: 'button', label: 'Record', action: 'RECORD', icon: 'plus', variant: 'primary' },
      { type: 'button', label: 'Flush', action: 'FLUSH', icon: 'upload', variant: 'secondary' },
    ] },
  ],
}];

// ============================================================================
// std-circuit-breaker - Circuit Breaker Pattern
// ============================================================================

export const CIRCUIT_BREAKER_BEHAVIOR: BehaviorSchema = {
  name: "std-circuit-breaker",
  version: "1.0.0",
  description: "Circuit breaker pattern with automatic recovery",
  orbitals: [
    {
      name: "CircuitBreakerOrbital",
      theme: {
        name: "infra-stone",
        tokens: {
          colors: {
            primary: "#57534e",
            "primary-hover": "#44403c",
            "primary-foreground": "#ffffff",
            accent: "#78716c",
            "accent-foreground": "#ffffff",
            success: "#22c55e",
            warning: "#f59e0b",
            error: "#ef4444",
          },
        },
      },
      entity: {
        name: "CircuitBreakerState",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "circuitState",
            type: "string",
            default: "closed",
          },
          {
            name: "errorCount",
            type: "number",
            default: 0,
          },
          {
            name: "errorRate",
            type: "number",
            default: 0,
          },
          {
            name: "successCount",
            type: "number",
            default: 0,
          },
          {
            name: "totalCount",
            type: "number",
            default: 0,
          },
          {
            name: "lastFailure",
            type: "number",
            default: 0,
          },
          {
            name: "lastSuccess",
            type: "number",
            default: 0,
          },
          {
            name: "errorThreshold",
            type: "number",
            default: 5,
          },
          {
            name: "errorRateThreshold",
            type: "number",
            default: 0.5,
          },
          {
            name: "resetAfterMs",
            type: "number",
            default: 60000,
          },
          {
            name: "halfOpenMaxAttempts",
            type: "number",
            default: 3,
          },
          {
            name: "halfOpenAttempts",
            type: "number",
            default: 0,
          },
        ],
      },
      traits: [
        {
          name: "CircuitBreaker",
          linkedEntity: "CircuitBreakerState",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Closed",
                isInitial: true,
              },
              {
                name: "Open",
              },
              {
                name: "HalfOpen",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "RECORD_SUCCESS",
                name: "Record Success",
              },
              {
                key: "RECORD_FAILURE",
                name: "Record Failure",
              },
              {
                key: "PROBE",
                name: "Probe",
              },
              {
                key: "RESET",
                name: "Reset",
              },
            ],
            transitions: [
              {
                from: "Closed",
                to: "Closed",
                event: "INIT",
                effects: [
                  ["fetch", "CircuitBreakerState"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "shield-check",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Circuit Breaker",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.circuitState",
                              icon: "circle-dot",
                              variant: "success",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.errorCount",
                          max: "@entity.errorThreshold",
                          label: "Error Rate",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Errors",
                              value: "@entity.errorCount",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.successCount",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              value: "@entity.totalCount",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Threshold",
                              value: "@entity.errorThreshold",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Simulate Success",
                              icon: "check",
                              variant: "primary",
                              event: "SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Simulate Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Closed",
                to: "Closed",
                event: "RECORD_SUCCESS",
                effects: [
                  ["fetch", "CircuitBreakerState"],
                  [
                    "set",
                    "@entity.successCount",
                    ["+", "@entity.successCount", 1],
                  ],
                  [
                    "set",
                    "@entity.totalCount",
                    ["+", "@entity.totalCount", 1],
                  ],
                  [
                    "set",
                    "@entity.lastSuccess",
                    ["time/now"],
                  ],
                  [
                    "set",
                    "@entity.errorRate",
                    [
                      "/",
                      "@entity.errorCount",
                      ["math/max", "@entity.totalCount", 1],
                    ],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "shield-check",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Circuit Breaker",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.circuitState",
                              icon: "circle-dot",
                              variant: "success",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.errorCount",
                          max: "@entity.errorThreshold",
                          label: "Error Rate",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Errors",
                              value: "@entity.errorCount",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.successCount",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              value: "@entity.totalCount",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Threshold",
                              value: "@entity.errorThreshold",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Simulate Success",
                              icon: "check",
                              variant: "primary",
                              event: "SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Simulate Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Closed",
                to: "Closed",
                event: "RECORD_FAILURE",
                guard: [
                  "<",
                  ["+", "@entity.errorCount", 1],
                  "@entity.errorThreshold",
                ],
                effects: [
                  ["fetch", "CircuitBreakerState"],
                  [
                    "set",
                    "@entity.errorCount",
                    ["+", "@entity.errorCount", 1],
                  ],
                  [
                    "set",
                    "@entity.totalCount",
                    ["+", "@entity.totalCount", 1],
                  ],
                  [
                    "set",
                    "@entity.lastFailure",
                    ["time/now"],
                  ],
                  [
                    "set",
                    "@entity.errorRate",
                    [
                      "/",
                      ["+", "@entity.errorCount", 1],
                      ["math/max", "@entity.totalCount", 1],
                    ],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "shield-check",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Circuit Breaker",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.circuitState",
                              icon: "circle-dot",
                              variant: "success",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.errorCount",
                          max: "@entity.errorThreshold",
                          label: "Error Rate",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Errors",
                              value: "@entity.errorCount",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.successCount",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              value: "@entity.totalCount",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Threshold",
                              value: "@entity.errorThreshold",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Simulate Success",
                              icon: "check",
                              variant: "primary",
                              event: "SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Simulate Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Closed",
                to: "Open",
                event: "RECORD_FAILURE",
                guard: [
                  ">=",
                  ["+", "@entity.errorCount", 1],
                  "@entity.errorThreshold",
                ],
                effects: [
                  ["fetch", "CircuitBreakerState"],
                  [
                    "set",
                    "@entity.errorCount",
                    ["+", "@entity.errorCount", 1],
                  ],
                  [
                    "set",
                    "@entity.totalCount",
                    ["+", "@entity.totalCount", 1],
                  ],
                  [
                    "set",
                    "@entity.lastFailure",
                    ["time/now"],
                  ],
                  [
                    "set",
                    "@entity.errorRate",
                    [
                      "/",
                      ["+", "@entity.errorCount", 1],
                      ["math/max", "@entity.totalCount", 1],
                    ],
                  ],
                  ["set", "@entity.circuitState", "open"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "shield-alert",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Circuit Breaker - OPEN",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "OPEN",
                              icon: "alert-circle",
                              variant: "danger",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.errorCount",
                          max: "@entity.errorThreshold",
                          label: "Errors",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Errors",
                              value: "@entity.errorCount",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.successCount",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              value: "@entity.totalCount",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Error Rate",
                              value: "@entity.errorRate",
                              icon: "percent",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Try Half-Open",
                              icon: "shield-question",
                              variant: "primary",
                              event: "HALF_OPEN",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Open",
                to: "HalfOpen",
                event: "PROBE",
                guard: [
                  ">",
                  [
                    "-",
                    ["time/now"],
                    "@entity.lastFailure",
                  ],
                  "@entity.resetAfterMs",
                ],
                effects: [
                  ["fetch", "CircuitBreakerState"],
                  ["set", "@entity.halfOpenAttempts", 0],
                  ["set", "@entity.circuitState", "halfOpen"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "shield-question",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Circuit Breaker - Half Open",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "HALF-OPEN",
                              icon: "alert-triangle",
                              variant: "warning",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Errors",
                              value: "@entity.errorCount",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.successCount",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Attempts",
                              value: "@entity.halfOpenAttempts",
                              icon: "rotate-cw",
                            },
                            {
                              type: "stat-display",
                              label: "Error Rate",
                              value: "@entity.errorRate",
                              icon: "percent",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Test Success",
                              icon: "check",
                              variant: "primary",
                              event: "SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Test Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "FAILURE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "HalfOpen",
                to: "Closed",
                event: "RECORD_SUCCESS",
                effects: [
                  ["fetch", "CircuitBreakerState"],
                  ["set", "@entity.errorCount", 0],
                  ["set", "@entity.errorRate", 0],
                  ["set", "@entity.halfOpenAttempts", 0],
                  [
                    "set",
                    "@entity.successCount",
                    ["+", "@entity.successCount", 1],
                  ],
                  [
                    "set",
                    "@entity.lastSuccess",
                    ["time/now"],
                  ],
                  ["set", "@entity.circuitState", "closed"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "shield-check",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Circuit Breaker",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.circuitState",
                              icon: "circle-dot",
                              variant: "success",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.errorCount",
                          max: "@entity.errorThreshold",
                          label: "Error Rate",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Errors",
                              value: "@entity.errorCount",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.successCount",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              value: "@entity.totalCount",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Threshold",
                              value: "@entity.errorThreshold",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Simulate Success",
                              icon: "check",
                              variant: "primary",
                              event: "SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Simulate Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "HalfOpen",
                to: "Open",
                event: "RECORD_FAILURE",
                effects: [
                  ["fetch", "CircuitBreakerState"],
                  [
                    "set",
                    "@entity.errorCount",
                    ["+", "@entity.errorCount", 1],
                  ],
                  [
                    "set",
                    "@entity.lastFailure",
                    ["time/now"],
                  ],
                  ["set", "@entity.circuitState", "open"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "shield-alert",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Circuit Breaker - OPEN",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "OPEN",
                              icon: "alert-circle",
                              variant: "danger",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.errorCount",
                          max: "@entity.errorThreshold",
                          label: "Errors",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Errors",
                              value: "@entity.errorCount",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.successCount",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              value: "@entity.totalCount",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Error Rate",
                              value: "@entity.errorRate",
                              icon: "percent",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Try Half-Open",
                              icon: "shield-question",
                              variant: "primary",
                              event: "HALF_OPEN",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Closed",
                to: "Closed",
                event: "RESET",
                effects: [
                  ["fetch", "CircuitBreakerState"],
                  ["set", "@entity.errorCount", 0],
                  ["set", "@entity.successCount", 0],
                  ["set", "@entity.totalCount", 0],
                  ["set", "@entity.errorRate", 0],
                  ["set", "@entity.halfOpenAttempts", 0],
                  ["set", "@entity.circuitState", "closed"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "shield-check",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Circuit Breaker",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.circuitState",
                              icon: "circle-dot",
                              variant: "success",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.errorCount",
                          max: "@entity.errorThreshold",
                          label: "Error Rate",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Errors",
                              value: "@entity.errorCount",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.successCount",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              value: "@entity.totalCount",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Threshold",
                              value: "@entity.errorThreshold",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Simulate Success",
                              icon: "check",
                              variant: "primary",
                              event: "SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Simulate Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Open",
                to: "Closed",
                event: "RESET",
                effects: [
                  ["fetch", "CircuitBreakerState"],
                  ["set", "@entity.errorCount", 0],
                  ["set", "@entity.successCount", 0],
                  ["set", "@entity.totalCount", 0],
                  ["set", "@entity.errorRate", 0],
                  ["set", "@entity.halfOpenAttempts", 0],
                  ["set", "@entity.circuitState", "closed"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "shield-check",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Circuit Breaker",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.circuitState",
                              icon: "circle-dot",
                              variant: "success",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.errorCount",
                          max: "@entity.errorThreshold",
                          label: "Error Rate",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Errors",
                              value: "@entity.errorCount",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.successCount",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              value: "@entity.totalCount",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Threshold",
                              value: "@entity.errorThreshold",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Simulate Success",
                              icon: "check",
                              variant: "primary",
                              event: "SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Simulate Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "HalfOpen",
                to: "Closed",
                event: "RESET",
                effects: [
                  ["fetch", "CircuitBreakerState"],
                  ["set", "@entity.errorCount", 0],
                  ["set", "@entity.successCount", 0],
                  ["set", "@entity.totalCount", 0],
                  ["set", "@entity.errorRate", 0],
                  ["set", "@entity.halfOpenAttempts", 0],
                  ["set", "@entity.circuitState", "closed"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "shield-check",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Circuit Breaker",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.circuitState",
                              icon: "circle-dot",
                              variant: "success",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.errorCount",
                          max: "@entity.errorThreshold",
                          label: "Error Rate",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Errors",
                              value: "@entity.errorCount",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.successCount",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              value: "@entity.totalCount",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Threshold",
                              value: "@entity.errorThreshold",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Simulate Success",
                              icon: "check",
                              variant: "primary",
                              event: "SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Simulate Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
          ticks: [
            {
              name: "probe_half_open",
              interval: 30000,
              guard: ["=", "@entity.circuitState", "open"],
              effects: [],
            },
          ],
        },
      ],
      pages: [
        {
          name: "CircuitBreakerPage",
          path: "/circuit-breaker",
          isInitial: true,
          traits: [
            {
              ref: "CircuitBreaker",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-health-check - Health Monitoring
// ============================================================================

export const HEALTH_CHECK_BEHAVIOR: BehaviorSchema = {
  name: "std-health-check",
  version: "1.0.0",
  description: "Tick-based health monitoring with degradation detection",
  orbitals: [
    {
      name: "HealthCheckOrbital",
      theme: {
        name: "infra-stone",
        tokens: {
          colors: {
            primary: "#57534e",
            "primary-hover": "#44403c",
            "primary-foreground": "#ffffff",
            accent: "#78716c",
            "accent-foreground": "#ffffff",
            success: "#22c55e",
            warning: "#f59e0b",
            error: "#ef4444",
          },
        },
      },
      entity: {
        name: "HealthCheckState",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "healthStatus",
            type: "string",
            default: "unknown",
          },
          {
            name: "lastCheck",
            type: "number",
            default: 0,
          },
          {
            name: "lastHealthy",
            type: "number",
            default: 0,
          },
          {
            name: "consecutiveFailures",
            type: "number",
            default: 0,
          },
          {
            name: "consecutiveSuccesses",
            type: "number",
            default: 0,
          },
          {
            name: "degradedThreshold",
            type: "number",
            default: 2,
          },
          {
            name: "unhealthyThreshold",
            type: "number",
            default: 5,
          },
          {
            name: "recoveryThreshold",
            type: "number",
            default: 3,
          },
          {
            name: "totalChecks",
            type: "number",
            default: 0,
          },
          {
            name: "totalFailures",
            type: "number",
            default: 0,
          },
        ],
      },
      traits: [
        {
          name: "HealthCheck",
          linkedEntity: "HealthCheckState",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Unknown",
                isInitial: true,
              },
              {
                name: "Healthy",
              },
              {
                name: "Degraded",
              },
              {
                name: "Unhealthy",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "CHECK_SUCCESS",
                name: "Check Success",
              },
              {
                key: "CHECK_FAILURE",
                name: "Check Failure",
              },
              {
                key: "RESET",
                name: "Reset",
              },
            ],
            transitions: [
              {
                from: "Unknown",
                to: "Unknown",
                event: "INIT",
                effects: [
                  ["fetch", "HealthCheckState"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "activity",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Health Check",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.healthStatus",
                              icon: "heart-pulse",
                              variant: "outline",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.consecutiveFailures",
                          max: "@entity.unhealthyThreshold",
                          label: "Failure Threshold",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Failures",
                              value: "@entity.consecutiveFailures",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.consecutiveSuccesses",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total Checks",
                              value: "@entity.totalChecks",
                              icon: "clipboard-check",
                            },
                            {
                              type: "stat-display",
                              label: "Total Failures",
                              value: "@entity.totalFailures",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Check Success",
                              icon: "check",
                              variant: "primary",
                              event: "CHECK_SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Check Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "CHECK_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Unknown",
                to: "Healthy",
                event: "CHECK_SUCCESS",
                effects: [
                  ["fetch", "HealthCheckState"],
                  ["set", "@entity.healthStatus", "healthy"],
                  ["set", "@entity.consecutiveSuccesses", 1],
                  ["set", "@entity.consecutiveFailures", 0],
                  [
                    "set",
                    "@entity.lastCheck",
                    ["time/now"],
                  ],
                  [
                    "set",
                    "@entity.lastHealthy",
                    ["time/now"],
                  ],
                  [
                    "set",
                    "@entity.totalChecks",
                    ["+", "@entity.totalChecks", 1],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "activity",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Health Check - Healthy",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.healthStatus",
                              icon: "heart-pulse",
                              variant: "success",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.consecutiveFailures",
                          max: "@entity.unhealthyThreshold",
                          label: "Failure Threshold",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Failures",
                              value: "@entity.consecutiveFailures",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.consecutiveSuccesses",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total Checks",
                              value: "@entity.totalChecks",
                              icon: "clipboard-check",
                            },
                            {
                              type: "stat-display",
                              label: "Total Failures",
                              value: "@entity.totalFailures",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Check Success",
                              icon: "check",
                              variant: "primary",
                              event: "CHECK_SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Check Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "CHECK_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Unknown",
                to: "Degraded",
                event: "CHECK_FAILURE",
                effects: [
                  ["fetch", "HealthCheckState"],
                  ["set", "@entity.healthStatus", "degraded"],
                  ["set", "@entity.consecutiveFailures", 1],
                  ["set", "@entity.consecutiveSuccesses", 0],
                  [
                    "set",
                    "@entity.lastCheck",
                    ["time/now"],
                  ],
                  [
                    "set",
                    "@entity.totalChecks",
                    ["+", "@entity.totalChecks", 1],
                  ],
                  [
                    "set",
                    "@entity.totalFailures",
                    ["+", "@entity.totalFailures", 1],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "activity",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Health Check - Degraded",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.healthStatus",
                              icon: "heart-pulse",
                              variant: "warning",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.consecutiveFailures",
                          max: "@entity.unhealthyThreshold",
                          label: "Failure Threshold",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Failures",
                              value: "@entity.consecutiveFailures",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.consecutiveSuccesses",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total Checks",
                              value: "@entity.totalChecks",
                              icon: "clipboard-check",
                            },
                            {
                              type: "stat-display",
                              label: "Total Failures",
                              value: "@entity.totalFailures",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Check Success",
                              icon: "check",
                              variant: "primary",
                              event: "CHECK_SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Check Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "CHECK_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Healthy",
                to: "Healthy",
                event: "CHECK_SUCCESS",
                effects: [
                  ["fetch", "HealthCheckState"],
                  [
                    "set",
                    "@entity.consecutiveSuccesses",
                    ["+", "@entity.consecutiveSuccesses", 1],
                  ],
                  ["set", "@entity.consecutiveFailures", 0],
                  [
                    "set",
                    "@entity.lastCheck",
                    ["time/now"],
                  ],
                  [
                    "set",
                    "@entity.lastHealthy",
                    ["time/now"],
                  ],
                  [
                    "set",
                    "@entity.totalChecks",
                    ["+", "@entity.totalChecks", 1],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "activity",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Health Check - Healthy",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.healthStatus",
                              icon: "heart-pulse",
                              variant: "success",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.consecutiveFailures",
                          max: "@entity.unhealthyThreshold",
                          label: "Failure Threshold",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Failures",
                              value: "@entity.consecutiveFailures",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.consecutiveSuccesses",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total Checks",
                              value: "@entity.totalChecks",
                              icon: "clipboard-check",
                            },
                            {
                              type: "stat-display",
                              label: "Total Failures",
                              value: "@entity.totalFailures",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Check Success",
                              icon: "check",
                              variant: "primary",
                              event: "CHECK_SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Check Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "CHECK_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Healthy",
                to: "Degraded",
                event: "CHECK_FAILURE",
                effects: [
                  ["fetch", "HealthCheckState"],
                  ["set", "@entity.healthStatus", "degraded"],
                  ["set", "@entity.consecutiveFailures", 1],
                  ["set", "@entity.consecutiveSuccesses", 0],
                  [
                    "set",
                    "@entity.lastCheck",
                    ["time/now"],
                  ],
                  [
                    "set",
                    "@entity.totalChecks",
                    ["+", "@entity.totalChecks", 1],
                  ],
                  [
                    "set",
                    "@entity.totalFailures",
                    ["+", "@entity.totalFailures", 1],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "activity",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Health Check - Degraded",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.healthStatus",
                              icon: "heart-pulse",
                              variant: "warning",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.consecutiveFailures",
                          max: "@entity.unhealthyThreshold",
                          label: "Failure Threshold",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Failures",
                              value: "@entity.consecutiveFailures",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.consecutiveSuccesses",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total Checks",
                              value: "@entity.totalChecks",
                              icon: "clipboard-check",
                            },
                            {
                              type: "stat-display",
                              label: "Total Failures",
                              value: "@entity.totalFailures",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Check Success",
                              icon: "check",
                              variant: "primary",
                              event: "CHECK_SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Check Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "CHECK_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Degraded",
                to: "Degraded",
                event: "CHECK_FAILURE",
                guard: [
                  "<",
                  ["+", "@entity.consecutiveFailures", 1],
                  "@entity.unhealthyThreshold",
                ],
                effects: [
                  ["fetch", "HealthCheckState"],
                  [
                    "set",
                    "@entity.consecutiveFailures",
                    ["+", "@entity.consecutiveFailures", 1],
                  ],
                  ["set", "@entity.consecutiveSuccesses", 0],
                  [
                    "set",
                    "@entity.lastCheck",
                    ["time/now"],
                  ],
                  [
                    "set",
                    "@entity.totalChecks",
                    ["+", "@entity.totalChecks", 1],
                  ],
                  [
                    "set",
                    "@entity.totalFailures",
                    ["+", "@entity.totalFailures", 1],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "activity",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Health Check - Degraded",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.healthStatus",
                              icon: "heart-pulse",
                              variant: "warning",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.consecutiveFailures",
                          max: "@entity.unhealthyThreshold",
                          label: "Failure Threshold",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Failures",
                              value: "@entity.consecutiveFailures",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.consecutiveSuccesses",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total Checks",
                              value: "@entity.totalChecks",
                              icon: "clipboard-check",
                            },
                            {
                              type: "stat-display",
                              label: "Total Failures",
                              value: "@entity.totalFailures",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Check Success",
                              icon: "check",
                              variant: "primary",
                              event: "CHECK_SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Check Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "CHECK_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Degraded",
                to: "Unhealthy",
                event: "CHECK_FAILURE",
                guard: [
                  ">=",
                  ["+", "@entity.consecutiveFailures", 1],
                  "@entity.unhealthyThreshold",
                ],
                effects: [
                  ["fetch", "HealthCheckState"],
                  ["set", "@entity.healthStatus", "unhealthy"],
                  [
                    "set",
                    "@entity.consecutiveFailures",
                    ["+", "@entity.consecutiveFailures", 1],
                  ],
                  [
                    "set",
                    "@entity.lastCheck",
                    ["time/now"],
                  ],
                  [
                    "set",
                    "@entity.totalChecks",
                    ["+", "@entity.totalChecks", 1],
                  ],
                  [
                    "set",
                    "@entity.totalFailures",
                    ["+", "@entity.totalFailures", 1],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "activity",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Health Check - Unhealthy",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.healthStatus",
                              icon: "heart-pulse",
                              variant: "danger",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.consecutiveFailures",
                          max: "@entity.unhealthyThreshold",
                          label: "Failure Threshold",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Failures",
                              value: "@entity.consecutiveFailures",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.consecutiveSuccesses",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total Checks",
                              value: "@entity.totalChecks",
                              icon: "clipboard-check",
                            },
                            {
                              type: "stat-display",
                              label: "Total Failures",
                              value: "@entity.totalFailures",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Check Success",
                              icon: "check",
                              variant: "primary",
                              event: "CHECK_SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Check Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "CHECK_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Degraded",
                to: "Healthy",
                event: "CHECK_SUCCESS",
                guard: [
                  ">=",
                  ["+", "@entity.consecutiveSuccesses", 1],
                  "@entity.recoveryThreshold",
                ],
                effects: [
                  ["fetch", "HealthCheckState"],
                  ["set", "@entity.healthStatus", "healthy"],
                  [
                    "set",
                    "@entity.consecutiveSuccesses",
                    ["+", "@entity.consecutiveSuccesses", 1],
                  ],
                  ["set", "@entity.consecutiveFailures", 0],
                  [
                    "set",
                    "@entity.lastCheck",
                    ["time/now"],
                  ],
                  [
                    "set",
                    "@entity.lastHealthy",
                    ["time/now"],
                  ],
                  [
                    "set",
                    "@entity.totalChecks",
                    ["+", "@entity.totalChecks", 1],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "activity",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Health Check - Healthy",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.healthStatus",
                              icon: "heart-pulse",
                              variant: "success",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.consecutiveFailures",
                          max: "@entity.unhealthyThreshold",
                          label: "Failure Threshold",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Failures",
                              value: "@entity.consecutiveFailures",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.consecutiveSuccesses",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total Checks",
                              value: "@entity.totalChecks",
                              icon: "clipboard-check",
                            },
                            {
                              type: "stat-display",
                              label: "Total Failures",
                              value: "@entity.totalFailures",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Check Success",
                              icon: "check",
                              variant: "primary",
                              event: "CHECK_SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Check Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "CHECK_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Degraded",
                to: "Degraded",
                event: "CHECK_SUCCESS",
                guard: [
                  "<",
                  ["+", "@entity.consecutiveSuccesses", 1],
                  "@entity.recoveryThreshold",
                ],
                effects: [
                  ["fetch", "HealthCheckState"],
                  [
                    "set",
                    "@entity.consecutiveSuccesses",
                    ["+", "@entity.consecutiveSuccesses", 1],
                  ],
                  ["set", "@entity.consecutiveFailures", 0],
                  [
                    "set",
                    "@entity.lastCheck",
                    ["time/now"],
                  ],
                  [
                    "set",
                    "@entity.totalChecks",
                    ["+", "@entity.totalChecks", 1],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "activity",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Health Check - Degraded",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.healthStatus",
                              icon: "heart-pulse",
                              variant: "warning",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.consecutiveFailures",
                          max: "@entity.unhealthyThreshold",
                          label: "Failure Threshold",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Failures",
                              value: "@entity.consecutiveFailures",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.consecutiveSuccesses",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total Checks",
                              value: "@entity.totalChecks",
                              icon: "clipboard-check",
                            },
                            {
                              type: "stat-display",
                              label: "Total Failures",
                              value: "@entity.totalFailures",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Check Success",
                              icon: "check",
                              variant: "primary",
                              event: "CHECK_SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Check Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "CHECK_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Unhealthy",
                to: "Unhealthy",
                event: "CHECK_FAILURE",
                effects: [
                  ["fetch", "HealthCheckState"],
                  [
                    "set",
                    "@entity.consecutiveFailures",
                    ["+", "@entity.consecutiveFailures", 1],
                  ],
                  [
                    "set",
                    "@entity.lastCheck",
                    ["time/now"],
                  ],
                  [
                    "set",
                    "@entity.totalChecks",
                    ["+", "@entity.totalChecks", 1],
                  ],
                  [
                    "set",
                    "@entity.totalFailures",
                    ["+", "@entity.totalFailures", 1],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "activity",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Health Check - Unhealthy",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.healthStatus",
                              icon: "heart-pulse",
                              variant: "danger",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.consecutiveFailures",
                          max: "@entity.unhealthyThreshold",
                          label: "Failure Threshold",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Failures",
                              value: "@entity.consecutiveFailures",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.consecutiveSuccesses",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total Checks",
                              value: "@entity.totalChecks",
                              icon: "clipboard-check",
                            },
                            {
                              type: "stat-display",
                              label: "Total Failures",
                              value: "@entity.totalFailures",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Check Success",
                              icon: "check",
                              variant: "primary",
                              event: "CHECK_SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Check Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "CHECK_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Unhealthy",
                to: "Degraded",
                event: "CHECK_SUCCESS",
                effects: [
                  ["fetch", "HealthCheckState"],
                  ["set", "@entity.healthStatus", "degraded"],
                  ["set", "@entity.consecutiveSuccesses", 1],
                  ["set", "@entity.consecutiveFailures", 0],
                  [
                    "set",
                    "@entity.lastCheck",
                    ["time/now"],
                  ],
                  [
                    "set",
                    "@entity.totalChecks",
                    ["+", "@entity.totalChecks", 1],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "activity",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Health Check - Degraded",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.healthStatus",
                              icon: "heart-pulse",
                              variant: "warning",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.consecutiveFailures",
                          max: "@entity.unhealthyThreshold",
                          label: "Failure Threshold",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Failures",
                              value: "@entity.consecutiveFailures",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.consecutiveSuccesses",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total Checks",
                              value: "@entity.totalChecks",
                              icon: "clipboard-check",
                            },
                            {
                              type: "stat-display",
                              label: "Total Failures",
                              value: "@entity.totalFailures",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Check Success",
                              icon: "check",
                              variant: "primary",
                              event: "CHECK_SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Check Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "CHECK_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Unknown",
                to: "Unknown",
                event: "RESET",
                effects: [
                  ["fetch", "HealthCheckState"],
                  ["set", "@entity.healthStatus", "unknown"],
                  ["set", "@entity.consecutiveFailures", 0],
                  ["set", "@entity.consecutiveSuccesses", 0],
                  ["set", "@entity.totalChecks", 0],
                  ["set", "@entity.totalFailures", 0],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "activity",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Health Check",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.healthStatus",
                              icon: "heart-pulse",
                              variant: "outline",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.consecutiveFailures",
                          max: "@entity.unhealthyThreshold",
                          label: "Failure Threshold",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Failures",
                              value: "@entity.consecutiveFailures",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.consecutiveSuccesses",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total Checks",
                              value: "@entity.totalChecks",
                              icon: "clipboard-check",
                            },
                            {
                              type: "stat-display",
                              label: "Total Failures",
                              value: "@entity.totalFailures",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Check Success",
                              icon: "check",
                              variant: "primary",
                              event: "CHECK_SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Check Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "CHECK_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Healthy",
                to: "Unknown",
                event: "RESET",
                effects: [
                  ["fetch", "HealthCheckState"],
                  ["set", "@entity.healthStatus", "unknown"],
                  ["set", "@entity.consecutiveFailures", 0],
                  ["set", "@entity.consecutiveSuccesses", 0],
                  ["set", "@entity.totalChecks", 0],
                  ["set", "@entity.totalFailures", 0],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "activity",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Health Check",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.healthStatus",
                              icon: "heart-pulse",
                              variant: "outline",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.consecutiveFailures",
                          max: "@entity.unhealthyThreshold",
                          label: "Failure Threshold",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Failures",
                              value: "@entity.consecutiveFailures",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.consecutiveSuccesses",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total Checks",
                              value: "@entity.totalChecks",
                              icon: "clipboard-check",
                            },
                            {
                              type: "stat-display",
                              label: "Total Failures",
                              value: "@entity.totalFailures",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Check Success",
                              icon: "check",
                              variant: "primary",
                              event: "CHECK_SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Check Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "CHECK_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Degraded",
                to: "Unknown",
                event: "RESET",
                effects: [
                  ["fetch", "HealthCheckState"],
                  ["set", "@entity.healthStatus", "unknown"],
                  ["set", "@entity.consecutiveFailures", 0],
                  ["set", "@entity.consecutiveSuccesses", 0],
                  ["set", "@entity.totalChecks", 0],
                  ["set", "@entity.totalFailures", 0],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "activity",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Health Check",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.healthStatus",
                              icon: "heart-pulse",
                              variant: "outline",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.consecutiveFailures",
                          max: "@entity.unhealthyThreshold",
                          label: "Failure Threshold",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Failures",
                              value: "@entity.consecutiveFailures",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.consecutiveSuccesses",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total Checks",
                              value: "@entity.totalChecks",
                              icon: "clipboard-check",
                            },
                            {
                              type: "stat-display",
                              label: "Total Failures",
                              value: "@entity.totalFailures",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Check Success",
                              icon: "check",
                              variant: "primary",
                              event: "CHECK_SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Check Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "CHECK_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Unhealthy",
                to: "Unknown",
                event: "RESET",
                effects: [
                  ["fetch", "HealthCheckState"],
                  ["set", "@entity.healthStatus", "unknown"],
                  ["set", "@entity.consecutiveFailures", 0],
                  ["set", "@entity.consecutiveSuccesses", 0],
                  ["set", "@entity.totalChecks", 0],
                  ["set", "@entity.totalFailures", 0],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "activity",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Health Check",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.healthStatus",
                              icon: "heart-pulse",
                              variant: "outline",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.consecutiveFailures",
                          max: "@entity.unhealthyThreshold",
                          label: "Failure Threshold",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Failures",
                              value: "@entity.consecutiveFailures",
                              icon: "x-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Successes",
                              value: "@entity.consecutiveSuccesses",
                              icon: "check-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Total Checks",
                              value: "@entity.totalChecks",
                              icon: "clipboard-check",
                            },
                            {
                              type: "stat-display",
                              label: "Total Failures",
                              value: "@entity.totalFailures",
                              icon: "alert-triangle",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Check Success",
                              icon: "check",
                              variant: "primary",
                              event: "CHECK_SUCCESS",
                            },
                            {
                              type: "button",
                              label: "Check Failure",
                              icon: "x",
                              variant: "secondary",
                              event: "CHECK_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
          ticks: [
            {
              name: "periodic_health_check",
              interval: 30000,
              effects: [],
            },
          ],
        },
      ],
      pages: [
        {
          name: "HealthCheckPage",
          path: "/health-check",
          isInitial: true,
          traits: [
            {
              ref: "HealthCheck",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-rate-limiter - Token Bucket Rate Limiting
// ============================================================================

export const RATE_LIMITER_BEHAVIOR: BehaviorSchema = {
  name: "std-rate-limiter",
  version: "1.0.0",
  description: "Guard-based rate limiting with sliding window reset",
  orbitals: [
    {
      name: "RateLimiterOrbital",
      theme: {
        name: "infra-stone",
        tokens: {
          colors: {
            primary: "#57534e",
            "primary-hover": "#44403c",
            "primary-foreground": "#ffffff",
            accent: "#78716c",
            "accent-foreground": "#ffffff",
            success: "#22c55e",
            warning: "#f59e0b",
            error: "#ef4444",
          },
        },
      },
      entity: {
        name: "RateLimiterState",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "requestCount",
            type: "number",
            default: 0,
          },
          {
            name: "windowStart",
            type: "number",
            default: 0,
          },
          {
            name: "rateLimit",
            type: "number",
            default: 60,
          },
          {
            name: "windowMs",
            type: "number",
            default: 60000,
          },
          {
            name: "totalRequests",
            type: "number",
            default: 0,
          },
          {
            name: "rejectedRequests",
            type: "number",
            default: 0,
          },
        ],
      },
      traits: [
        {
          name: "RateLimiter",
          linkedEntity: "RateLimiterState",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Active",
                isInitial: true,
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "REQUEST",
                name: "Record Request",
              },
              {
                key: "WINDOW_RESET",
                name: "Window Reset",
              },
              {
                key: "RESET",
                name: "Full Reset",
              },
            ],
            transitions: [
              {
                from: "Active",
                to: "Active",
                event: "INIT",
                effects: [
                  ["fetch", "RateLimiterState"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "gauge",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Rate Limiter",
                                  variant: "h2",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.requestCount",
                          max: "@entity.rateLimit",
                          label: "Rate Usage",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Requests",
                              value: "@entity.requestCount",
                              icon: "arrow-up-right",
                            },
                            {
                              type: "stat-display",
                              label: "Limit",
                              value: "@entity.rateLimit",
                              icon: "shield",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              value: "@entity.totalRequests",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Rejected",
                              value: "@entity.rejectedRequests",
                              icon: "ban",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Send Request",
                              icon: "send",
                              variant: "primary",
                              event: "REQUEST",
                            },
                            {
                              type: "button",
                              label: "Reset Window",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET_WINDOW",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Active",
                to: "Active",
                event: "REQUEST",
                guard: ["<", "@entity.requestCount", "@entity.rateLimit"],
                effects: [
                  ["fetch", "RateLimiterState"],
                  [
                    "set",
                    "@entity.requestCount",
                    ["+", "@entity.requestCount", 1],
                  ],
                  [
                    "set",
                    "@entity.totalRequests",
                    ["+", "@entity.totalRequests", 1],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "gauge",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Rate Limiter",
                                  variant: "h2",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.requestCount",
                          max: "@entity.rateLimit",
                          label: "Rate Usage",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Requests",
                              value: "@entity.requestCount",
                              icon: "arrow-up-right",
                            },
                            {
                              type: "stat-display",
                              label: "Limit",
                              value: "@entity.rateLimit",
                              icon: "shield",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              value: "@entity.totalRequests",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Rejected",
                              value: "@entity.rejectedRequests",
                              icon: "ban",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Send Request",
                              icon: "send",
                              variant: "primary",
                              event: "REQUEST",
                            },
                            {
                              type: "button",
                              label: "Reset Window",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET_WINDOW",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Active",
                to: "Active",
                event: "REQUEST",
                guard: [">=", "@entity.requestCount", "@entity.rateLimit"],
                effects: [
                  ["fetch", "RateLimiterState"],
                  [
                    "set",
                    "@entity.rejectedRequests",
                    ["+", "@entity.rejectedRequests", 1],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "gauge",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Rate Limiter - Limit Exceeded",
                                  variant: "h2",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.requestCount",
                          max: "@entity.rateLimit",
                          label: "Rate Usage",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Requests",
                              value: "@entity.requestCount",
                              icon: "arrow-up-right",
                            },
                            {
                              type: "stat-display",
                              label: "Limit",
                              value: "@entity.rateLimit",
                              icon: "shield",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              value: "@entity.totalRequests",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Rejected",
                              value: "@entity.rejectedRequests",
                              icon: "ban",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Send Request",
                              icon: "send",
                              variant: "primary",
                              event: "REQUEST",
                            },
                            {
                              type: "button",
                              label: "Reset Window",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET_WINDOW",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Active",
                to: "Active",
                event: "WINDOW_RESET",
                effects: [
                  ["fetch", "RateLimiterState"],
                  ["set", "@entity.requestCount", 0],
                  [
                    "set",
                    "@entity.windowStart",
                    ["time/now"],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "gauge",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Rate Limiter",
                                  variant: "h2",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.requestCount",
                          max: "@entity.rateLimit",
                          label: "Rate Usage",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Requests",
                              value: "@entity.requestCount",
                              icon: "arrow-up-right",
                            },
                            {
                              type: "stat-display",
                              label: "Limit",
                              value: "@entity.rateLimit",
                              icon: "shield",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              value: "@entity.totalRequests",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Rejected",
                              value: "@entity.rejectedRequests",
                              icon: "ban",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Send Request",
                              icon: "send",
                              variant: "primary",
                              event: "REQUEST",
                            },
                            {
                              type: "button",
                              label: "Reset Window",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET_WINDOW",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Active",
                to: "Active",
                event: "RESET",
                effects: [
                  ["fetch", "RateLimiterState"],
                  ["set", "@entity.requestCount", 0],
                  ["set", "@entity.totalRequests", 0],
                  ["set", "@entity.rejectedRequests", 0],
                  [
                    "set",
                    "@entity.windowStart",
                    ["time/now"],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "gauge",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Rate Limiter",
                                  variant: "h2",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.requestCount",
                          max: "@entity.rateLimit",
                          label: "Rate Usage",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Requests",
                              value: "@entity.requestCount",
                              icon: "arrow-up-right",
                            },
                            {
                              type: "stat-display",
                              label: "Limit",
                              value: "@entity.rateLimit",
                              icon: "shield",
                            },
                            {
                              type: "stat-display",
                              label: "Total",
                              value: "@entity.totalRequests",
                              icon: "hash",
                            },
                            {
                              type: "stat-display",
                              label: "Rejected",
                              value: "@entity.rejectedRequests",
                              icon: "ban",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Send Request",
                              icon: "send",
                              variant: "primary",
                              event: "REQUEST",
                            },
                            {
                              type: "button",
                              label: "Reset Window",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET_WINDOW",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
          ticks: [
            {
              name: "window_reset",
              interval: 60000,
              effects: [],
            },
          ],
        },
      ],
      pages: [
        {
          name: "RateLimiterPage",
          path: "/rate-limiter",
          isInitial: true,
          traits: [
            {
              ref: "RateLimiter",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-cache-aside - Cache-Aside Pattern
// ============================================================================

export const CACHE_ASIDE_BEHAVIOR: BehaviorSchema = {
  name: "std-cache-aside",
  version: "1.0.0",
  description: "Cache-aside pattern with TTL-based freshness and eviction",
  orbitals: [
    {
      name: "CacheAsideOrbital",
      theme: {
        name: "infra-stone",
        tokens: {
          colors: {
            primary: "#57534e",
            "primary-hover": "#44403c",
            "primary-foreground": "#ffffff",
            accent: "#78716c",
            "accent-foreground": "#ffffff",
            success: "#22c55e",
            warning: "#f59e0b",
            error: "#ef4444",
          },
        },
      },
      entity: {
        name: "CacheEntry",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "cacheKey",
            type: "string",
            default: "",
          },
          {
            name: "cachedValue",
            type: "string",
            default: "",
          },
          {
            name: "cachedAt",
            type: "number",
            default: 0,
          },
          {
            name: "ttlMs",
            type: "number",
            default: 300000,
          },
          {
            name: "cacheHits",
            type: "number",
            default: 0,
          },
          {
            name: "cacheMisses",
            type: "number",
            default: 0,
          },
          {
            name: "isFresh",
            type: "boolean",
            default: false,
          },
          {
            name: "lastAccessed",
            type: "number",
            default: 0,
          },
        ],
      },
      traits: [
        {
          name: "CacheAside",
          linkedEntity: "CacheEntry",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Empty",
                isInitial: true,
              },
              {
                name: "Fresh",
              },
              {
                name: "Stale",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "LOOKUP",
                name: "Cache Lookup",
              },
              {
                key: "POPULATE",
                name: "Populate Cache",
                payloadSchema: [
                  {
                    name: "value",
                    type: "string",
                    required: true,
                  },
                  {
                    name: "key",
                    type: "string",
                    required: true,
                  },
                ],
              },
              {
                key: "INVALIDATE",
                name: "Invalidate",
              },
              {
                key: "EVICT",
                name: "Evict",
              },
            ],
            transitions: [
              {
                from: "Empty",
                to: "Empty",
                event: "INIT",
                effects: [
                  ["fetch", "CacheEntry"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "database",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              content: "Cache",
                              variant: "h2",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "empty-state",
                          icon: "inbox",
                          title: "Cache is empty",
                          description: "No cached data available",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Hits",
                              value: "@entity.cacheHits",
                              icon: "check",
                            },
                            {
                              type: "stat-display",
                              label: "Misses",
                              value: "@entity.cacheMisses",
                              icon: "x",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "button",
                          label: "Fetch Data",
                          icon: "download",
                          variant: "primary",
                          event: "SET",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Empty",
                to: "Empty",
                event: "LOOKUP",
                effects: [
                  ["fetch", "CacheEntry"],
                  [
                    "set",
                    "@entity.cacheMisses",
                    ["+", "@entity.cacheMisses", 1],
                  ],
                  [
                    "set",
                    "@entity.lastAccessed",
                    ["time/now"],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "database",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              content: "Cache - Miss",
                              variant: "h2",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "empty-state",
                          icon: "inbox",
                          title: "Cache is empty",
                          description: "No cached data available",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Hits",
                              value: "@entity.cacheHits",
                              icon: "check",
                            },
                            {
                              type: "stat-display",
                              label: "Misses",
                              value: "@entity.cacheMisses",
                              icon: "x",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "button",
                          label: "Fetch Data",
                          icon: "download",
                          variant: "primary",
                          event: "SET",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Empty",
                to: "Fresh",
                event: "POPULATE",
                effects: [
                  ["fetch", "CacheEntry"],
                  ["set", "@entity.cachedValue", "@payload.value"],
                  ["set", "@entity.cacheKey", "@payload.key"],
                  [
                    "set",
                    "@entity.cachedAt",
                    ["time/now"],
                  ],
                  ["set", "@entity.isFresh", true],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "database",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Cache - Fresh",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.isFresh",
                              icon: "check-circle",
                              variant: "outline",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Key",
                              value: "@entity.cacheKey",
                              icon: "key",
                            },
                            {
                              type: "stat-display",
                              label: "Hits",
                              value: "@entity.cacheHits",
                              icon: "check",
                            },
                            {
                              type: "stat-display",
                              label: "Misses",
                              value: "@entity.cacheMisses",
                              icon: "x",
                            },
                            {
                              type: "stat-display",
                              label: "TTL (ms)",
                              value: "@entity.ttlMs",
                              icon: "clock",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Get",
                              icon: "download",
                              variant: "primary",
                              event: "GET",
                            },
                            {
                              type: "button",
                              label: "Invalidate",
                              icon: "trash-2",
                              variant: "secondary",
                              event: "INVALIDATE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Fresh",
                to: "Fresh",
                event: "LOOKUP",
                guard: [
                  "<",
                  [
                    "-",
                    ["time/now"],
                    "@entity.cachedAt",
                  ],
                  "@entity.ttlMs",
                ],
                effects: [
                  ["fetch", "CacheEntry"],
                  [
                    "set",
                    "@entity.cacheHits",
                    ["+", "@entity.cacheHits", 1],
                  ],
                  [
                    "set",
                    "@entity.lastAccessed",
                    ["time/now"],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "database",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Cache - Hit",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.isFresh",
                              icon: "check-circle",
                              variant: "outline",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Key",
                              value: "@entity.cacheKey",
                              icon: "key",
                            },
                            {
                              type: "stat-display",
                              label: "Hits",
                              value: "@entity.cacheHits",
                              icon: "check",
                            },
                            {
                              type: "stat-display",
                              label: "Misses",
                              value: "@entity.cacheMisses",
                              icon: "x",
                            },
                            {
                              type: "stat-display",
                              label: "TTL (ms)",
                              value: "@entity.ttlMs",
                              icon: "clock",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Get",
                              icon: "download",
                              variant: "primary",
                              event: "GET",
                            },
                            {
                              type: "button",
                              label: "Invalidate",
                              icon: "trash-2",
                              variant: "secondary",
                              event: "INVALIDATE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Fresh",
                to: "Stale",
                event: "LOOKUP",
                guard: [
                  ">=",
                  [
                    "-",
                    ["time/now"],
                    "@entity.cachedAt",
                  ],
                  "@entity.ttlMs",
                ],
                effects: [
                  ["fetch", "CacheEntry"],
                  ["set", "@entity.isFresh", false],
                  [
                    "set",
                    "@entity.cacheMisses",
                    ["+", "@entity.cacheMisses", 1],
                  ],
                  [
                    "set",
                    "@entity.lastAccessed",
                    ["time/now"],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "database",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Cache - Stale",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.isFresh",
                              icon: "check-circle",
                              variant: "outline",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Key",
                              value: "@entity.cacheKey",
                              icon: "key",
                            },
                            {
                              type: "stat-display",
                              label: "Hits",
                              value: "@entity.cacheHits",
                              icon: "check",
                            },
                            {
                              type: "stat-display",
                              label: "Misses",
                              value: "@entity.cacheMisses",
                              icon: "x",
                            },
                            {
                              type: "stat-display",
                              label: "TTL (ms)",
                              value: "@entity.ttlMs",
                              icon: "clock",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Get",
                              icon: "download",
                              variant: "primary",
                              event: "GET",
                            },
                            {
                              type: "button",
                              label: "Invalidate",
                              icon: "trash-2",
                              variant: "secondary",
                              event: "INVALIDATE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Fresh",
                to: "Fresh",
                event: "POPULATE",
                effects: [
                  ["fetch", "CacheEntry"],
                  ["set", "@entity.cachedValue", "@payload.value"],
                  [
                    "set",
                    "@entity.cachedAt",
                    ["time/now"],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "database",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Cache - Fresh",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.isFresh",
                              icon: "check-circle",
                              variant: "outline",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Key",
                              value: "@entity.cacheKey",
                              icon: "key",
                            },
                            {
                              type: "stat-display",
                              label: "Hits",
                              value: "@entity.cacheHits",
                              icon: "check",
                            },
                            {
                              type: "stat-display",
                              label: "Misses",
                              value: "@entity.cacheMisses",
                              icon: "x",
                            },
                            {
                              type: "stat-display",
                              label: "TTL (ms)",
                              value: "@entity.ttlMs",
                              icon: "clock",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Get",
                              icon: "download",
                              variant: "primary",
                              event: "GET",
                            },
                            {
                              type: "button",
                              label: "Invalidate",
                              icon: "trash-2",
                              variant: "secondary",
                              event: "INVALIDATE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Stale",
                to: "Stale",
                event: "LOOKUP",
                effects: [
                  ["fetch", "CacheEntry"],
                  [
                    "set",
                    "@entity.cacheMisses",
                    ["+", "@entity.cacheMisses", 1],
                  ],
                  [
                    "set",
                    "@entity.lastAccessed",
                    ["time/now"],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "database",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Cache - Stale",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.isFresh",
                              icon: "check-circle",
                              variant: "outline",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Key",
                              value: "@entity.cacheKey",
                              icon: "key",
                            },
                            {
                              type: "stat-display",
                              label: "Hits",
                              value: "@entity.cacheHits",
                              icon: "check",
                            },
                            {
                              type: "stat-display",
                              label: "Misses",
                              value: "@entity.cacheMisses",
                              icon: "x",
                            },
                            {
                              type: "stat-display",
                              label: "TTL (ms)",
                              value: "@entity.ttlMs",
                              icon: "clock",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Get",
                              icon: "download",
                              variant: "primary",
                              event: "GET",
                            },
                            {
                              type: "button",
                              label: "Invalidate",
                              icon: "trash-2",
                              variant: "secondary",
                              event: "INVALIDATE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Stale",
                to: "Fresh",
                event: "POPULATE",
                effects: [
                  ["fetch", "CacheEntry"],
                  ["set", "@entity.cachedValue", "@payload.value"],
                  [
                    "set",
                    "@entity.cachedAt",
                    ["time/now"],
                  ],
                  ["set", "@entity.isFresh", true],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "database",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Cache - Fresh",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.isFresh",
                              icon: "check-circle",
                              variant: "outline",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Key",
                              value: "@entity.cacheKey",
                              icon: "key",
                            },
                            {
                              type: "stat-display",
                              label: "Hits",
                              value: "@entity.cacheHits",
                              icon: "check",
                            },
                            {
                              type: "stat-display",
                              label: "Misses",
                              value: "@entity.cacheMisses",
                              icon: "x",
                            },
                            {
                              type: "stat-display",
                              label: "TTL (ms)",
                              value: "@entity.ttlMs",
                              icon: "clock",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Get",
                              icon: "download",
                              variant: "primary",
                              event: "GET",
                            },
                            {
                              type: "button",
                              label: "Invalidate",
                              icon: "trash-2",
                              variant: "secondary",
                              event: "INVALIDATE",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Fresh",
                to: "Empty",
                event: "INVALIDATE",
                effects: [
                  ["fetch", "CacheEntry"],
                  ["set", "@entity.cachedValue", ""],
                  ["set", "@entity.isFresh", false],
                  ["set", "@entity.cachedAt", 0],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "database",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              content: "Cache",
                              variant: "h2",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "empty-state",
                          icon: "inbox",
                          title: "Cache is empty",
                          description: "No cached data available",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Hits",
                              value: "@entity.cacheHits",
                              icon: "check",
                            },
                            {
                              type: "stat-display",
                              label: "Misses",
                              value: "@entity.cacheMisses",
                              icon: "x",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "button",
                          label: "Fetch Data",
                          icon: "download",
                          variant: "primary",
                          event: "SET",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Stale",
                to: "Empty",
                event: "INVALIDATE",
                effects: [
                  ["fetch", "CacheEntry"],
                  ["set", "@entity.cachedValue", ""],
                  ["set", "@entity.isFresh", false],
                  ["set", "@entity.cachedAt", 0],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "database",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              content: "Cache",
                              variant: "h2",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "empty-state",
                          icon: "inbox",
                          title: "Cache is empty",
                          description: "No cached data available",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Hits",
                              value: "@entity.cacheHits",
                              icon: "check",
                            },
                            {
                              type: "stat-display",
                              label: "Misses",
                              value: "@entity.cacheMisses",
                              icon: "x",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "button",
                          label: "Fetch Data",
                          icon: "download",
                          variant: "primary",
                          event: "SET",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Fresh",
                to: "Empty",
                event: "EVICT",
                effects: [
                  ["fetch", "CacheEntry"],
                  ["set", "@entity.cachedValue", ""],
                  ["set", "@entity.isFresh", false],
                  ["set", "@entity.cachedAt", 0],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "database",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              content: "Cache",
                              variant: "h2",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "empty-state",
                          icon: "inbox",
                          title: "Cache is empty",
                          description: "No cached data available",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Hits",
                              value: "@entity.cacheHits",
                              icon: "check",
                            },
                            {
                              type: "stat-display",
                              label: "Misses",
                              value: "@entity.cacheMisses",
                              icon: "x",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "button",
                          label: "Fetch Data",
                          icon: "download",
                          variant: "primary",
                          event: "SET",
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Stale",
                to: "Empty",
                event: "EVICT",
                effects: [
                  ["fetch", "CacheEntry"],
                  ["set", "@entity.cachedValue", ""],
                  ["set", "@entity.isFresh", false],
                  ["set", "@entity.cachedAt", 0],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "icon",
                              name: "database",
                              size: "lg",
                            },
                            {
                              type: "typography",
                              content: "Cache",
                              variant: "h2",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "empty-state",
                          icon: "inbox",
                          title: "Cache is empty",
                          description: "No cached data available",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Hits",
                              value: "@entity.cacheHits",
                              icon: "check",
                            },
                            {
                              type: "stat-display",
                              label: "Misses",
                              value: "@entity.cacheMisses",
                              icon: "x",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "button",
                          label: "Fetch Data",
                          icon: "download",
                          variant: "primary",
                          event: "SET",
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
          ticks: [
            {
              name: "eviction_sweep",
              interval: 60000,
              guard: [
                "and",
                ["!=", "@entity.cachedAt", 0],
                [
                  ">=",
                  [
                    "-",
                    ["time/now"],
                    "@entity.cachedAt",
                  ],
                  "@entity.ttlMs",
                ],
              ],
              effects: [],
            },
          ],
        },
      ],
      pages: [
        {
          name: "CachePage",
          path: "/cache",
          isInitial: true,
          traits: [
            {
              ref: "CacheAside",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-saga - Saga Pattern (Distributed Transaction Compensation)
// ============================================================================

export const SAGA_BEHAVIOR: BehaviorSchema = {
  name: "std-saga",
  version: "1.0.0",
  description: "Saga pattern with step-by-step execution and reverse compensation on failure",
  orbitals: [
    {
      name: "SagaOrbital",
      theme: {
        name: "infra-stone",
        tokens: {
          colors: {
            primary: "#57534e",
            "primary-hover": "#44403c",
            "primary-foreground": "#ffffff",
            accent: "#78716c",
            "accent-foreground": "#ffffff",
            success: "#22c55e",
            warning: "#f59e0b",
            error: "#ef4444",
          },
        },
      },
      entity: {
        name: "SagaState",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "sagaName",
            type: "string",
            default: "",
          },
          {
            name: "currentStep",
            type: "number",
            default: 0,
          },
          {
            name: "totalSteps",
            type: "number",
            default: 0,
          },
          {
            name: "sagaStatus",
            type: "string",
            default: "idle",
          },
          {
            name: "failedStep",
            type: "number",
            default: -1,
          },
          {
            name: "failureReason",
            type: "string",
            default: "",
          },
          {
            name: "startedAt",
            type: "number",
            default: 0,
          },
          {
            name: "completedAt",
            type: "number",
            default: 0,
          },
        ],
      },
      traits: [
        {
          name: "Saga",
          linkedEntity: "SagaState",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Idle",
                isInitial: true,
              },
              {
                name: "Running",
              },
              {
                name: "Compensating",
              },
              {
                name: "Completed",
              },
              {
                name: "Failed",
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "START_SAGA",
                name: "Start Saga",
              },
              {
                key: "STEP_SUCCESS",
                name: "Step Success",
              },
              {
                key: "STEP_FAILURE",
                name: "Step Failure",
              },
              {
                key: "COMPENSATE_SUCCESS",
                name: "Compensate Success",
              },
              {
                key: "COMPENSATE_FAILURE",
                name: "Compensate Failure",
              },
              {
                key: "RESET",
                name: "Reset",
              },
            ],
            transitions: [
              {
                from: "Idle",
                to: "Idle",
                event: "INIT",
                effects: [
                  ["fetch", "SagaState"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "workflow",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Saga",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.sagaStatus",
                              icon: "flag",
                              variant: "outline",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.currentStep",
                          max: "@entity.totalSteps",
                          label: "Progress",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Current Step",
                              value: "@entity.currentStep",
                              icon: "footprints",
                            },
                            {
                              type: "stat-display",
                              label: "Total Steps",
                              value: "@entity.totalSteps",
                              icon: "list-ordered",
                            },
                            {
                              type: "stat-display",
                              label: "Failed Step",
                              value: "@entity.failedStep",
                              icon: "alert-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Status",
                              value: "@entity.sagaStatus",
                              icon: "flag",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Execute",
                              icon: "play",
                              variant: "primary",
                              event: "START_SAGA",
                            },
                            {
                              type: "button",
                              label: "Trigger Failure",
                              icon: "undo-2",
                              variant: "secondary",
                              event: "STEP_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Idle",
                to: "Running",
                event: "START_SAGA",
                effects: [
                  ["fetch", "SagaState"],
                  ["set", "@entity.sagaStatus", "running"],
                  ["set", "@entity.currentStep", 0],
                  ["set", "@entity.failedStep", -1],
                  ["set", "@entity.failureReason", ""],
                  [
                    "set",
                    "@entity.startedAt",
                    ["time/now"],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "workflow",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Saga - Running",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.sagaStatus",
                              icon: "flag",
                              variant: "outline",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.currentStep",
                          max: "@entity.totalSteps",
                          label: "Progress",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Current Step",
                              value: "@entity.currentStep",
                              icon: "footprints",
                            },
                            {
                              type: "stat-display",
                              label: "Total Steps",
                              value: "@entity.totalSteps",
                              icon: "list-ordered",
                            },
                            {
                              type: "stat-display",
                              label: "Failed Step",
                              value: "@entity.failedStep",
                              icon: "alert-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Status",
                              value: "@entity.sagaStatus",
                              icon: "flag",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Execute",
                              icon: "play",
                              variant: "primary",
                              event: "START_SAGA",
                            },
                            {
                              type: "button",
                              label: "Trigger Failure",
                              icon: "undo-2",
                              variant: "secondary",
                              event: "STEP_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Running",
                to: "Running",
                event: "STEP_SUCCESS",
                guard: [
                  "<",
                  ["+", "@entity.currentStep", 1],
                  "@entity.totalSteps",
                ],
                effects: [
                  ["fetch", "SagaState"],
                  [
                    "set",
                    "@entity.currentStep",
                    ["+", "@entity.currentStep", 1],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "workflow",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Saga - Running",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.sagaStatus",
                              icon: "flag",
                              variant: "outline",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.currentStep",
                          max: "@entity.totalSteps",
                          label: "Progress",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Current Step",
                              value: "@entity.currentStep",
                              icon: "footprints",
                            },
                            {
                              type: "stat-display",
                              label: "Total Steps",
                              value: "@entity.totalSteps",
                              icon: "list-ordered",
                            },
                            {
                              type: "stat-display",
                              label: "Failed Step",
                              value: "@entity.failedStep",
                              icon: "alert-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Status",
                              value: "@entity.sagaStatus",
                              icon: "flag",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Execute",
                              icon: "play",
                              variant: "primary",
                              event: "START_SAGA",
                            },
                            {
                              type: "button",
                              label: "Trigger Failure",
                              icon: "undo-2",
                              variant: "secondary",
                              event: "STEP_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Running",
                to: "Completed",
                event: "STEP_SUCCESS",
                guard: [
                  ">=",
                  ["+", "@entity.currentStep", 1],
                  "@entity.totalSteps",
                ],
                effects: [
                  ["fetch", "SagaState"],
                  ["set", "@entity.sagaStatus", "completed"],
                  [
                    "set",
                    "@entity.completedAt",
                    ["time/now"],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "workflow",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Saga - Completed",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.sagaStatus",
                              icon: "flag",
                              variant: "outline",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.currentStep",
                          max: "@entity.totalSteps",
                          label: "Progress",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Current Step",
                              value: "@entity.currentStep",
                              icon: "footprints",
                            },
                            {
                              type: "stat-display",
                              label: "Total Steps",
                              value: "@entity.totalSteps",
                              icon: "list-ordered",
                            },
                            {
                              type: "stat-display",
                              label: "Failed Step",
                              value: "@entity.failedStep",
                              icon: "alert-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Status",
                              value: "@entity.sagaStatus",
                              icon: "flag",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Execute",
                              icon: "play",
                              variant: "primary",
                              event: "START_SAGA",
                            },
                            {
                              type: "button",
                              label: "Trigger Failure",
                              icon: "undo-2",
                              variant: "secondary",
                              event: "STEP_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Running",
                to: "Compensating",
                event: "STEP_FAILURE",
                effects: [
                  ["fetch", "SagaState"],
                  ["set", "@entity.sagaStatus", "compensating"],
                  ["set", "@entity.failedStep", "@entity.currentStep"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "workflow",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Saga - Compensating",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.sagaStatus",
                              icon: "flag",
                              variant: "outline",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.currentStep",
                          max: "@entity.totalSteps",
                          label: "Progress",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Current Step",
                              value: "@entity.currentStep",
                              icon: "footprints",
                            },
                            {
                              type: "stat-display",
                              label: "Total Steps",
                              value: "@entity.totalSteps",
                              icon: "list-ordered",
                            },
                            {
                              type: "stat-display",
                              label: "Failed Step",
                              value: "@entity.failedStep",
                              icon: "alert-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Status",
                              value: "@entity.sagaStatus",
                              icon: "flag",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Execute",
                              icon: "play",
                              variant: "primary",
                              event: "START_SAGA",
                            },
                            {
                              type: "button",
                              label: "Trigger Failure",
                              icon: "undo-2",
                              variant: "secondary",
                              event: "STEP_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Compensating",
                to: "Compensating",
                event: "COMPENSATE_SUCCESS",
                guard: [">", "@entity.currentStep", 0],
                effects: [
                  ["fetch", "SagaState"],
                  [
                    "set",
                    "@entity.currentStep",
                    ["-", "@entity.currentStep", 1],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "workflow",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Saga - Compensating",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.sagaStatus",
                              icon: "flag",
                              variant: "outline",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.currentStep",
                          max: "@entity.totalSteps",
                          label: "Progress",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Current Step",
                              value: "@entity.currentStep",
                              icon: "footprints",
                            },
                            {
                              type: "stat-display",
                              label: "Total Steps",
                              value: "@entity.totalSteps",
                              icon: "list-ordered",
                            },
                            {
                              type: "stat-display",
                              label: "Failed Step",
                              value: "@entity.failedStep",
                              icon: "alert-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Status",
                              value: "@entity.sagaStatus",
                              icon: "flag",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Execute",
                              icon: "play",
                              variant: "primary",
                              event: "START_SAGA",
                            },
                            {
                              type: "button",
                              label: "Trigger Failure",
                              icon: "undo-2",
                              variant: "secondary",
                              event: "STEP_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Compensating",
                to: "Failed",
                event: "COMPENSATE_SUCCESS",
                guard: ["<=", "@entity.currentStep", 0],
                effects: [
                  ["fetch", "SagaState"],
                  ["set", "@entity.sagaStatus", "failed"],
                  [
                    "set",
                    "@entity.completedAt",
                    ["time/now"],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "workflow",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Saga - Failed",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.sagaStatus",
                              icon: "flag",
                              variant: "outline",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.currentStep",
                          max: "@entity.totalSteps",
                          label: "Progress",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Current Step",
                              value: "@entity.currentStep",
                              icon: "footprints",
                            },
                            {
                              type: "stat-display",
                              label: "Total Steps",
                              value: "@entity.totalSteps",
                              icon: "list-ordered",
                            },
                            {
                              type: "stat-display",
                              label: "Failed Step",
                              value: "@entity.failedStep",
                              icon: "alert-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Status",
                              value: "@entity.sagaStatus",
                              icon: "flag",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Execute",
                              icon: "play",
                              variant: "primary",
                              event: "START_SAGA",
                            },
                            {
                              type: "button",
                              label: "Trigger Failure",
                              icon: "undo-2",
                              variant: "secondary",
                              event: "STEP_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Compensating",
                to: "Failed",
                event: "COMPENSATE_FAILURE",
                effects: [
                  ["fetch", "SagaState"],
                  ["set", "@entity.sagaStatus", "failed"],
                  [
                    "set",
                    "@entity.completedAt",
                    ["time/now"],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "workflow",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Saga - Failed",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.sagaStatus",
                              icon: "flag",
                              variant: "outline",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.currentStep",
                          max: "@entity.totalSteps",
                          label: "Progress",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Current Step",
                              value: "@entity.currentStep",
                              icon: "footprints",
                            },
                            {
                              type: "stat-display",
                              label: "Total Steps",
                              value: "@entity.totalSteps",
                              icon: "list-ordered",
                            },
                            {
                              type: "stat-display",
                              label: "Failed Step",
                              value: "@entity.failedStep",
                              icon: "alert-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Status",
                              value: "@entity.sagaStatus",
                              icon: "flag",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Execute",
                              icon: "play",
                              variant: "primary",
                              event: "START_SAGA",
                            },
                            {
                              type: "button",
                              label: "Trigger Failure",
                              icon: "undo-2",
                              variant: "secondary",
                              event: "STEP_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Completed",
                to: "Idle",
                event: "RESET",
                effects: [
                  ["fetch", "SagaState"],
                  ["set", "@entity.sagaStatus", "idle"],
                  ["set", "@entity.currentStep", 0],
                  ["set", "@entity.failedStep", -1],
                  ["set", "@entity.failureReason", ""],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "workflow",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Saga",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.sagaStatus",
                              icon: "flag",
                              variant: "outline",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.currentStep",
                          max: "@entity.totalSteps",
                          label: "Progress",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Current Step",
                              value: "@entity.currentStep",
                              icon: "footprints",
                            },
                            {
                              type: "stat-display",
                              label: "Total Steps",
                              value: "@entity.totalSteps",
                              icon: "list-ordered",
                            },
                            {
                              type: "stat-display",
                              label: "Failed Step",
                              value: "@entity.failedStep",
                              icon: "alert-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Status",
                              value: "@entity.sagaStatus",
                              icon: "flag",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Execute",
                              icon: "play",
                              variant: "primary",
                              event: "START_SAGA",
                            },
                            {
                              type: "button",
                              label: "Trigger Failure",
                              icon: "undo-2",
                              variant: "secondary",
                              event: "STEP_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Failed",
                to: "Idle",
                event: "RESET",
                effects: [
                  ["fetch", "SagaState"],
                  ["set", "@entity.sagaStatus", "idle"],
                  ["set", "@entity.currentStep", 0],
                  ["set", "@entity.failedStep", -1],
                  ["set", "@entity.failureReason", ""],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "workflow",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Saga",
                                  variant: "h2",
                                },
                              ],
                            },
                            {
                              type: "badge",
                              label: "@entity.sagaStatus",
                              icon: "flag",
                              variant: "outline",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "progress-bar",
                          value: "@entity.currentStep",
                          max: "@entity.totalSteps",
                          label: "Progress",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Current Step",
                              value: "@entity.currentStep",
                              icon: "footprints",
                            },
                            {
                              type: "stat-display",
                              label: "Total Steps",
                              value: "@entity.totalSteps",
                              icon: "list-ordered",
                            },
                            {
                              type: "stat-display",
                              label: "Failed Step",
                              value: "@entity.failedStep",
                              icon: "alert-circle",
                            },
                            {
                              type: "stat-display",
                              label: "Status",
                              value: "@entity.sagaStatus",
                              icon: "flag",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Execute",
                              icon: "play",
                              variant: "primary",
                              event: "START_SAGA",
                            },
                            {
                              type: "button",
                              label: "Trigger Failure",
                              icon: "undo-2",
                              variant: "secondary",
                              event: "STEP_FAILURE",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "refresh-cw",
                              variant: "secondary",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
          ticks: [],
        },
      ],
      pages: [
        {
          name: "SagaPage",
          path: "/saga",
          isInitial: true,
          traits: [
            {
              ref: "Saga",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// std-metrics-collector - Metrics Collection with Periodic Flush
// ============================================================================

export const METRICS_COLLECTOR_BEHAVIOR: BehaviorSchema = {
  name: "std-metrics-collector",
  version: "1.0.0",
  description: "Tick-based metrics aggregation with periodic flush and reporting",
  orbitals: [
    {
      name: "MetricsCollectorOrbital",
      theme: {
        name: "infra-stone",
        tokens: {
          colors: {
            primary: "#57534e",
            "primary-hover": "#44403c",
            "primary-foreground": "#ffffff",
            accent: "#78716c",
            "accent-foreground": "#ffffff",
            success: "#22c55e",
            warning: "#f59e0b",
            error: "#ef4444",
          },
        },
      },
      entity: {
        name: "MetricsState",
        persistence: "runtime",
        fields: [
          {
            name: "id",
            type: "string",
            required: true,
          },
          {
            name: "lastFlush",
            type: "number",
            default: 0,
          },
          {
            name: "totalFlushes",
            type: "number",
            default: 0,
          },
          {
            name: "totalRecorded",
            type: "number",
            default: 0,
          },
        ],
      },
      traits: [
        {
          name: "MetricsCollector",
          linkedEntity: "MetricsState",
          category: "interaction",
          stateMachine: {
            states: [
              {
                name: "Collecting",
                isInitial: true,
              },
            ],
            events: [
              {
                key: "INIT",
                name: "Initialize",
              },
              {
                key: "RECORD_COUNTER",
                name: "Record Counter",
              },
              {
                key: "RECORD_GAUGE",
                name: "Record Gauge",
              },
              {
                key: "FLUSH",
                name: "Flush Metrics",
              },
              {
                key: "RESET",
                name: "Reset All",
              },
            ],
            transitions: [
              {
                from: "Collecting",
                to: "Collecting",
                event: "INIT",
                effects: [
                  ["fetch", "MetricsState"],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "bar-chart-3",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Metrics Collector",
                                  variant: "h2",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Recorded",
                              value: "@entity.totalRecorded",
                              icon: "database",
                            },
                            {
                              type: "stat-display",
                              label: "Flushes",
                              value: "@entity.totalFlushes",
                              icon: "upload",
                            },
                            {
                              type: "stat-display",
                              label: "Last Flush",
                              value: "@entity.lastFlush",
                              icon: "clock",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Counter",
                              icon: "plus",
                              variant: "primary",
                              event: "RECORD_COUNTER",
                            },
                            {
                              type: "button",
                              label: "Gauge",
                              icon: "gauge",
                              variant: "secondary",
                              event: "RECORD_GAUGE",
                            },
                            {
                              type: "button",
                              label: "Flush",
                              icon: "upload",
                              variant: "secondary",
                              event: "FLUSH",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "rotate-ccw",
                              variant: "ghost",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Collecting",
                to: "Collecting",
                event: "RECORD_COUNTER",
                effects: [
                  ["fetch", "MetricsState"],
                  [
                    "set",
                    "@entity.totalRecorded",
                    ["+", "@entity.totalRecorded", 1],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "bar-chart-3",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Metrics Collector",
                                  variant: "h2",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Recorded",
                              value: "@entity.totalRecorded",
                              icon: "database",
                            },
                            {
                              type: "stat-display",
                              label: "Flushes",
                              value: "@entity.totalFlushes",
                              icon: "upload",
                            },
                            {
                              type: "stat-display",
                              label: "Last Flush",
                              value: "@entity.lastFlush",
                              icon: "clock",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Counter",
                              icon: "plus",
                              variant: "primary",
                              event: "RECORD_COUNTER",
                            },
                            {
                              type: "button",
                              label: "Gauge",
                              icon: "gauge",
                              variant: "secondary",
                              event: "RECORD_GAUGE",
                            },
                            {
                              type: "button",
                              label: "Flush",
                              icon: "upload",
                              variant: "secondary",
                              event: "FLUSH",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "rotate-ccw",
                              variant: "ghost",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Collecting",
                to: "Collecting",
                event: "RECORD_GAUGE",
                effects: [
                  ["fetch", "MetricsState"],
                  [
                    "set",
                    "@entity.totalRecorded",
                    ["+", "@entity.totalRecorded", 1],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "bar-chart-3",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Metrics Collector",
                                  variant: "h2",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Recorded",
                              value: "@entity.totalRecorded",
                              icon: "database",
                            },
                            {
                              type: "stat-display",
                              label: "Flushes",
                              value: "@entity.totalFlushes",
                              icon: "upload",
                            },
                            {
                              type: "stat-display",
                              label: "Last Flush",
                              value: "@entity.lastFlush",
                              icon: "clock",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Counter",
                              icon: "plus",
                              variant: "primary",
                              event: "RECORD_COUNTER",
                            },
                            {
                              type: "button",
                              label: "Gauge",
                              icon: "gauge",
                              variant: "secondary",
                              event: "RECORD_GAUGE",
                            },
                            {
                              type: "button",
                              label: "Flush",
                              icon: "upload",
                              variant: "secondary",
                              event: "FLUSH",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "rotate-ccw",
                              variant: "ghost",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Collecting",
                to: "Collecting",
                event: "FLUSH",
                effects: [
                  ["fetch", "MetricsState"],
                  [
                    "set",
                    "@entity.lastFlush",
                    ["time/now"],
                  ],
                  [
                    "set",
                    "@entity.totalFlushes",
                    ["+", "@entity.totalFlushes", 1],
                  ],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "bar-chart-3",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Metrics Collector",
                                  variant: "h2",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Recorded",
                              value: "@entity.totalRecorded",
                              icon: "database",
                            },
                            {
                              type: "stat-display",
                              label: "Flushes",
                              value: "@entity.totalFlushes",
                              icon: "upload",
                            },
                            {
                              type: "stat-display",
                              label: "Last Flush",
                              value: "@entity.lastFlush",
                              icon: "clock",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Counter",
                              icon: "plus",
                              variant: "primary",
                              event: "RECORD_COUNTER",
                            },
                            {
                              type: "button",
                              label: "Gauge",
                              icon: "gauge",
                              variant: "secondary",
                              event: "RECORD_GAUGE",
                            },
                            {
                              type: "button",
                              label: "Flush",
                              icon: "upload",
                              variant: "secondary",
                              event: "FLUSH",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "rotate-ccw",
                              variant: "ghost",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
              {
                from: "Collecting",
                to: "Collecting",
                event: "RESET",
                effects: [
                  ["fetch", "MetricsState"],
                  ["set", "@entity.totalRecorded", 0],
                  ["set", "@entity.totalFlushes", 0],
                  ["set", "@entity.lastFlush", 0],
                  [
                    "render-ui",
                    "main",
                    {
                      type: "stack",
                      direction: "vertical",
                      gap: "lg",
                      children: [
                        {
                          type: "stack",
                          direction: "horizontal",
                          justify: "space-between",
                          children: [
                            {
                              type: "stack",
                              direction: "horizontal",
                              gap: "sm",
                              children: [
                                {
                                  type: "icon",
                                  name: "bar-chart-3",
                                  size: "lg",
                                },
                                {
                                  type: "typography",
                                  content: "Metrics Collector",
                                  variant: "h2",
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "md",
                          children: [
                            {
                              type: "stat-display",
                              label: "Recorded",
                              value: "@entity.totalRecorded",
                              icon: "database",
                            },
                            {
                              type: "stat-display",
                              label: "Flushes",
                              value: "@entity.totalFlushes",
                              icon: "upload",
                            },
                            {
                              type: "stat-display",
                              label: "Last Flush",
                              value: "@entity.lastFlush",
                              icon: "clock",
                            },
                          ],
                        },
                        {
                          type: "divider",
                        },
                        {
                          type: "stack",
                          direction: "horizontal",
                          gap: "sm",
                          children: [
                            {
                              type: "button",
                              label: "Counter",
                              icon: "plus",
                              variant: "primary",
                              event: "RECORD_COUNTER",
                            },
                            {
                              type: "button",
                              label: "Gauge",
                              icon: "gauge",
                              variant: "secondary",
                              event: "RECORD_GAUGE",
                            },
                            {
                              type: "button",
                              label: "Flush",
                              icon: "upload",
                              variant: "secondary",
                              event: "FLUSH",
                            },
                            {
                              type: "button",
                              label: "Reset",
                              icon: "rotate-ccw",
                              variant: "ghost",
                              event: "RESET",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
          ticks: [
            {
              name: "periodic_flush",
              interval: 60000,
              guard: [">", "@entity.totalRecorded", 0],
              effects: [],
            },
          ],
        },
      ],
      pages: [
        {
          name: "MetricsPage",
          path: "/metrics",
          isInitial: true,
          traits: [
            {
              ref: "MetricsCollector",
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// Export All Infrastructure Behaviors
// ============================================================================

export const INFRASTRUCTURE_BEHAVIORS: BehaviorSchema[] = [
  CIRCUIT_BREAKER_BEHAVIOR,
  HEALTH_CHECK_BEHAVIOR,
  RATE_LIMITER_BEHAVIOR,
  CACHE_ASIDE_BEHAVIOR,
  SAGA_BEHAVIOR,
  METRICS_COLLECTOR_BEHAVIOR,
];
