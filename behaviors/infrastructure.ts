/**
 * Infrastructure Behaviors
 *
 * Standard behaviors for infrastructure patterns like circuit breaking
 * and health monitoring.
 * Each behavior is a self-contained OrbitalSchema that can function as a standalone .orb file.
 *
 * @packageDocumentation
 */

import type { OrbitalSchema } from './types.js';

// ============================================================================
// std-circuit-breaker - Circuit Breaker Pattern
// ============================================================================

export const CIRCUIT_BREAKER_BEHAVIOR: OrbitalSchema = {
  name: 'std-circuit-breaker',
  version: '1.0.0',
  description: 'Circuit breaker pattern with automatic recovery',
  orbitals: [
    {
      name: 'CircuitBreakerOrbital',
      entity: {
        name: 'CircuitBreakerState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'circuitState', type: 'string', default: 'closed' },
          { name: 'errorCount', type: 'number', default: 0 },
          { name: 'errorRate', type: 'number', default: 0 },
          { name: 'successCount', type: 'number', default: 0 },
          { name: 'totalCount', type: 'number', default: 0 },
          { name: 'lastFailure', type: 'number', default: 0 },
          { name: 'lastSuccess', type: 'number', default: 0 },
          { name: 'errorThreshold', type: 'number', default: 5 },
          { name: 'errorRateThreshold', type: 'number', default: 0.5 },
          { name: 'resetAfterMs', type: 'number', default: 60000 },
          { name: 'halfOpenMaxAttempts', type: 'number', default: 3 },
          { name: 'halfOpenAttempts', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'CircuitBreaker',
          linkedEntity: 'CircuitBreakerState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Closed', isInitial: true },
              { name: 'Open' },
              { name: 'HalfOpen' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'RECORD_SUCCESS', name: 'Record Success' },
              { key: 'RECORD_FAILURE', name: 'Record Failure' },
              { key: 'PROBE', name: 'Probe' },
              { key: 'RESET', name: 'Reset' },
            ],
            transitions: [
              // INIT: render dashboard
              {
                from: 'Closed',
                to: 'Closed',
                event: 'INIT',
                effects: [
                  ['fetch', 'CircuitBreakerState'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Circuit Breaker' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'CircuitBreakerState' }],
                ],
              },
              // Closed: record success
              {
                from: 'Closed',
                to: 'Closed',
                event: 'RECORD_SUCCESS',
                effects: [
                  ['fetch', 'CircuitBreakerState'],
                  ['set', '@entity.successCount', ['+', '@entity.successCount', 1]],
                  ['set', '@entity.totalCount', ['+', '@entity.totalCount', 1]],
                  ['set', '@entity.lastSuccess', ['time/now']],
                  ['set', '@entity.errorRate', ['/', '@entity.errorCount', ['math/max', '@entity.totalCount', 1]]],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Circuit Breaker' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'CircuitBreakerState' }],
                ],
              },
              // Closed: record failure, stay closed if under threshold
              {
                from: 'Closed',
                to: 'Closed',
                event: 'RECORD_FAILURE',
                guard: ['<', ['+', '@entity.errorCount', 1], '@entity.errorThreshold'],
                effects: [
                  ['fetch', 'CircuitBreakerState'],
                  ['set', '@entity.errorCount', ['+', '@entity.errorCount', 1]],
                  ['set', '@entity.totalCount', ['+', '@entity.totalCount', 1]],
                  ['set', '@entity.lastFailure', ['time/now']],
                  ['set', '@entity.errorRate', ['/', ['+', '@entity.errorCount', 1], ['math/max', '@entity.totalCount', 1]]],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Circuit Breaker' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'CircuitBreakerState' }],
                ],
              },
              // Closed -> Open: threshold exceeded
              {
                from: 'Closed',
                to: 'Open',
                event: 'RECORD_FAILURE',
                guard: ['>=', ['+', '@entity.errorCount', 1], '@entity.errorThreshold'],
                effects: [
                  ['fetch', 'CircuitBreakerState'],
                  ['set', '@entity.errorCount', ['+', '@entity.errorCount', 1]],
                  ['set', '@entity.totalCount', ['+', '@entity.totalCount', 1]],
                  ['set', '@entity.lastFailure', ['time/now']],
                  ['set', '@entity.errorRate', ['/', ['+', '@entity.errorCount', 1], ['math/max', '@entity.totalCount', 1]]],
                  ['set', '@entity.circuitState', 'open'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Circuit Breaker - OPEN' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'CircuitBreakerState' }],
                ],
              },
              // Open -> HalfOpen: probe after reset timeout
              {
                from: 'Open',
                to: 'HalfOpen',
                event: 'PROBE',
                guard: ['>', ['-', ['time/now'], '@entity.lastFailure'], '@entity.resetAfterMs'],
                effects: [
                  ['fetch', 'CircuitBreakerState'],
                  ['set', '@entity.halfOpenAttempts', 0],
                  ['set', '@entity.circuitState', 'halfOpen'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Circuit Breaker - Half Open' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'CircuitBreakerState' }],
                ],
              },
              // HalfOpen: success -> close
              {
                from: 'HalfOpen',
                to: 'Closed',
                event: 'RECORD_SUCCESS',
                effects: [
                  ['fetch', 'CircuitBreakerState'],
                  ['set', '@entity.errorCount', 0],
                  ['set', '@entity.errorRate', 0],
                  ['set', '@entity.halfOpenAttempts', 0],
                  ['set', '@entity.successCount', ['+', '@entity.successCount', 1]],
                  ['set', '@entity.lastSuccess', ['time/now']],
                  ['set', '@entity.circuitState', 'closed'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Circuit Breaker' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'CircuitBreakerState' }],
                ],
              },
              // HalfOpen: failure -> back to open
              {
                from: 'HalfOpen',
                to: 'Open',
                event: 'RECORD_FAILURE',
                effects: [
                  ['fetch', 'CircuitBreakerState'],
                  ['set', '@entity.errorCount', ['+', '@entity.errorCount', 1]],
                  ['set', '@entity.lastFailure', ['time/now']],
                  ['set', '@entity.circuitState', 'open'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Circuit Breaker - OPEN' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'CircuitBreakerState' }],
                ],
              },
              // Reset from Closed
              {
                from: 'Closed',
                to: 'Closed',
                event: 'RESET',
                effects: [
                  ['fetch', 'CircuitBreakerState'],
                  ['set', '@entity.errorCount', 0],
                  ['set', '@entity.successCount', 0],
                  ['set', '@entity.totalCount', 0],
                  ['set', '@entity.errorRate', 0],
                  ['set', '@entity.halfOpenAttempts', 0],
                  ['set', '@entity.circuitState', 'closed'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Circuit Breaker' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'CircuitBreakerState' }],
                ],
              },
              // Reset from Open
              {
                from: 'Open',
                to: 'Closed',
                event: 'RESET',
                effects: [
                  ['fetch', 'CircuitBreakerState'],
                  ['set', '@entity.errorCount', 0],
                  ['set', '@entity.successCount', 0],
                  ['set', '@entity.totalCount', 0],
                  ['set', '@entity.errorRate', 0],
                  ['set', '@entity.halfOpenAttempts', 0],
                  ['set', '@entity.circuitState', 'closed'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Circuit Breaker' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'CircuitBreakerState' }],
                ],
              },
              // Reset from HalfOpen
              {
                from: 'HalfOpen',
                to: 'Closed',
                event: 'RESET',
                effects: [
                  ['fetch', 'CircuitBreakerState'],
                  ['set', '@entity.errorCount', 0],
                  ['set', '@entity.successCount', 0],
                  ['set', '@entity.totalCount', 0],
                  ['set', '@entity.errorRate', 0],
                  ['set', '@entity.halfOpenAttempts', 0],
                  ['set', '@entity.circuitState', 'closed'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Circuit Breaker' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'CircuitBreakerState' }],
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'probe_half_open',
              interval: 30000,
              guard: ['=', '@entity.circuitState', 'open'],
              effects: [],
            },
          ],
        },
      ],
      pages: [{ name: 'CircuitBreakerPage', path: '/circuit-breaker', isInitial: true, traits: [{ ref: 'CircuitBreaker' }] }],
    },
  ],
};

// ============================================================================
// std-health-check - Health Monitoring
// ============================================================================

export const HEALTH_CHECK_BEHAVIOR: OrbitalSchema = {
  name: 'std-health-check',
  version: '1.0.0',
  description: 'Tick-based health monitoring with degradation detection',
  orbitals: [
    {
      name: 'HealthCheckOrbital',
      entity: {
        name: 'HealthCheckState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'healthStatus', type: 'string', default: 'unknown' },
          { name: 'lastCheck', type: 'number', default: 0 },
          { name: 'lastHealthy', type: 'number', default: 0 },
          { name: 'consecutiveFailures', type: 'number', default: 0 },
          { name: 'consecutiveSuccesses', type: 'number', default: 0 },
          { name: 'degradedThreshold', type: 'number', default: 2 },
          { name: 'unhealthyThreshold', type: 'number', default: 5 },
          { name: 'recoveryThreshold', type: 'number', default: 3 },
          { name: 'totalChecks', type: 'number', default: 0 },
          { name: 'totalFailures', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'HealthCheck',
          linkedEntity: 'HealthCheckState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Unknown', isInitial: true },
              { name: 'Healthy' },
              { name: 'Degraded' },
              { name: 'Unhealthy' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'CHECK_SUCCESS', name: 'Check Success' },
              { key: 'CHECK_FAILURE', name: 'Check Failure' },
              { key: 'RESET', name: 'Reset' },
            ],
            transitions: [
              // INIT: render dashboard
              {
                from: 'Unknown',
                to: 'Unknown',
                event: 'INIT',
                effects: [
                  ['fetch', 'HealthCheckState'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Health Check' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'HealthCheckState' }],
                ],
              },
              // Unknown -> Healthy on first success
              {
                from: 'Unknown',
                to: 'Healthy',
                event: 'CHECK_SUCCESS',
                effects: [
                  ['fetch', 'HealthCheckState'],
                  ['set', '@entity.healthStatus', 'healthy'],
                  ['set', '@entity.consecutiveSuccesses', 1],
                  ['set', '@entity.consecutiveFailures', 0],
                  ['set', '@entity.lastCheck', ['time/now']],
                  ['set', '@entity.lastHealthy', ['time/now']],
                  ['set', '@entity.totalChecks', ['+', '@entity.totalChecks', 1]],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Health Check - Healthy' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'HealthCheckState' }],
                ],
              },
              // Unknown -> Degraded on first failure
              {
                from: 'Unknown',
                to: 'Degraded',
                event: 'CHECK_FAILURE',
                effects: [
                  ['fetch', 'HealthCheckState'],
                  ['set', '@entity.healthStatus', 'degraded'],
                  ['set', '@entity.consecutiveFailures', 1],
                  ['set', '@entity.consecutiveSuccesses', 0],
                  ['set', '@entity.lastCheck', ['time/now']],
                  ['set', '@entity.totalChecks', ['+', '@entity.totalChecks', 1]],
                  ['set', '@entity.totalFailures', ['+', '@entity.totalFailures', 1]],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Health Check - Degraded' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'HealthCheckState' }],
                ],
              },
              // Healthy: stay healthy on success
              {
                from: 'Healthy',
                to: 'Healthy',
                event: 'CHECK_SUCCESS',
                effects: [
                  ['fetch', 'HealthCheckState'],
                  ['set', '@entity.consecutiveSuccesses', ['+', '@entity.consecutiveSuccesses', 1]],
                  ['set', '@entity.consecutiveFailures', 0],
                  ['set', '@entity.lastCheck', ['time/now']],
                  ['set', '@entity.lastHealthy', ['time/now']],
                  ['set', '@entity.totalChecks', ['+', '@entity.totalChecks', 1]],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Health Check - Healthy' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'HealthCheckState' }],
                ],
              },
              // Healthy -> Degraded on failure
              {
                from: 'Healthy',
                to: 'Degraded',
                event: 'CHECK_FAILURE',
                effects: [
                  ['fetch', 'HealthCheckState'],
                  ['set', '@entity.healthStatus', 'degraded'],
                  ['set', '@entity.consecutiveFailures', 1],
                  ['set', '@entity.consecutiveSuccesses', 0],
                  ['set', '@entity.lastCheck', ['time/now']],
                  ['set', '@entity.totalChecks', ['+', '@entity.totalChecks', 1]],
                  ['set', '@entity.totalFailures', ['+', '@entity.totalFailures', 1]],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Health Check - Degraded' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'HealthCheckState' }],
                ],
              },
              // Degraded: stay degraded on failure (below unhealthy threshold)
              {
                from: 'Degraded',
                to: 'Degraded',
                event: 'CHECK_FAILURE',
                guard: ['<', ['+', '@entity.consecutiveFailures', 1], '@entity.unhealthyThreshold'],
                effects: [
                  ['fetch', 'HealthCheckState'],
                  ['set', '@entity.consecutiveFailures', ['+', '@entity.consecutiveFailures', 1]],
                  ['set', '@entity.consecutiveSuccesses', 0],
                  ['set', '@entity.lastCheck', ['time/now']],
                  ['set', '@entity.totalChecks', ['+', '@entity.totalChecks', 1]],
                  ['set', '@entity.totalFailures', ['+', '@entity.totalFailures', 1]],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Health Check - Degraded' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'HealthCheckState' }],
                ],
              },
              // Degraded -> Unhealthy when threshold exceeded
              {
                from: 'Degraded',
                to: 'Unhealthy',
                event: 'CHECK_FAILURE',
                guard: ['>=', ['+', '@entity.consecutiveFailures', 1], '@entity.unhealthyThreshold'],
                effects: [
                  ['fetch', 'HealthCheckState'],
                  ['set', '@entity.healthStatus', 'unhealthy'],
                  ['set', '@entity.consecutiveFailures', ['+', '@entity.consecutiveFailures', 1]],
                  ['set', '@entity.lastCheck', ['time/now']],
                  ['set', '@entity.totalChecks', ['+', '@entity.totalChecks', 1]],
                  ['set', '@entity.totalFailures', ['+', '@entity.totalFailures', 1]],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Health Check - Unhealthy' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'HealthCheckState' }],
                ],
              },
              // Degraded -> Healthy on enough successes
              {
                from: 'Degraded',
                to: 'Healthy',
                event: 'CHECK_SUCCESS',
                guard: ['>=', ['+', '@entity.consecutiveSuccesses', 1], '@entity.recoveryThreshold'],
                effects: [
                  ['fetch', 'HealthCheckState'],
                  ['set', '@entity.healthStatus', 'healthy'],
                  ['set', '@entity.consecutiveSuccesses', ['+', '@entity.consecutiveSuccesses', 1]],
                  ['set', '@entity.consecutiveFailures', 0],
                  ['set', '@entity.lastCheck', ['time/now']],
                  ['set', '@entity.lastHealthy', ['time/now']],
                  ['set', '@entity.totalChecks', ['+', '@entity.totalChecks', 1]],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Health Check - Healthy' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'HealthCheckState' }],
                ],
              },
              // Degraded: stay degraded on success (not enough to recover)
              {
                from: 'Degraded',
                to: 'Degraded',
                event: 'CHECK_SUCCESS',
                guard: ['<', ['+', '@entity.consecutiveSuccesses', 1], '@entity.recoveryThreshold'],
                effects: [
                  ['fetch', 'HealthCheckState'],
                  ['set', '@entity.consecutiveSuccesses', ['+', '@entity.consecutiveSuccesses', 1]],
                  ['set', '@entity.consecutiveFailures', 0],
                  ['set', '@entity.lastCheck', ['time/now']],
                  ['set', '@entity.totalChecks', ['+', '@entity.totalChecks', 1]],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Health Check - Degraded' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'HealthCheckState' }],
                ],
              },
              // Unhealthy: stay unhealthy on failure
              {
                from: 'Unhealthy',
                to: 'Unhealthy',
                event: 'CHECK_FAILURE',
                effects: [
                  ['fetch', 'HealthCheckState'],
                  ['set', '@entity.consecutiveFailures', ['+', '@entity.consecutiveFailures', 1]],
                  ['set', '@entity.lastCheck', ['time/now']],
                  ['set', '@entity.totalChecks', ['+', '@entity.totalChecks', 1]],
                  ['set', '@entity.totalFailures', ['+', '@entity.totalFailures', 1]],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Health Check - Unhealthy' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'HealthCheckState' }],
                ],
              },
              // Unhealthy -> Degraded on first success (recovery begins)
              {
                from: 'Unhealthy',
                to: 'Degraded',
                event: 'CHECK_SUCCESS',
                effects: [
                  ['fetch', 'HealthCheckState'],
                  ['set', '@entity.healthStatus', 'degraded'],
                  ['set', '@entity.consecutiveSuccesses', 1],
                  ['set', '@entity.consecutiveFailures', 0],
                  ['set', '@entity.lastCheck', ['time/now']],
                  ['set', '@entity.totalChecks', ['+', '@entity.totalChecks', 1]],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Health Check - Degraded' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'HealthCheckState' }],
                ],
              },
              // Reset from Unknown
              {
                from: 'Unknown',
                to: 'Unknown',
                event: 'RESET',
                effects: [
                  ['fetch', 'HealthCheckState'],
                  ['set', '@entity.healthStatus', 'unknown'],
                  ['set', '@entity.consecutiveFailures', 0],
                  ['set', '@entity.consecutiveSuccesses', 0],
                  ['set', '@entity.totalChecks', 0],
                  ['set', '@entity.totalFailures', 0],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Health Check' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'HealthCheckState' }],
                ],
              },
              // Reset from Healthy
              {
                from: 'Healthy',
                to: 'Unknown',
                event: 'RESET',
                effects: [
                  ['fetch', 'HealthCheckState'],
                  ['set', '@entity.healthStatus', 'unknown'],
                  ['set', '@entity.consecutiveFailures', 0],
                  ['set', '@entity.consecutiveSuccesses', 0],
                  ['set', '@entity.totalChecks', 0],
                  ['set', '@entity.totalFailures', 0],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Health Check' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'HealthCheckState' }],
                ],
              },
              // Reset from Degraded
              {
                from: 'Degraded',
                to: 'Unknown',
                event: 'RESET',
                effects: [
                  ['fetch', 'HealthCheckState'],
                  ['set', '@entity.healthStatus', 'unknown'],
                  ['set', '@entity.consecutiveFailures', 0],
                  ['set', '@entity.consecutiveSuccesses', 0],
                  ['set', '@entity.totalChecks', 0],
                  ['set', '@entity.totalFailures', 0],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Health Check' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'HealthCheckState' }],
                ],
              },
              // Reset from Unhealthy
              {
                from: 'Unhealthy',
                to: 'Unknown',
                event: 'RESET',
                effects: [
                  ['fetch', 'HealthCheckState'],
                  ['set', '@entity.healthStatus', 'unknown'],
                  ['set', '@entity.consecutiveFailures', 0],
                  ['set', '@entity.consecutiveSuccesses', 0],
                  ['set', '@entity.totalChecks', 0],
                  ['set', '@entity.totalFailures', 0],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Health Check' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'HealthCheckState' }],
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'periodic_health_check',
              interval: 30000,
              effects: [],
            },
          ],
        },
      ],
      pages: [{ name: 'HealthCheckPage', path: '/health-check', isInitial: true, traits: [{ ref: 'HealthCheck' }] }],
    },
  ],
};

// ============================================================================
// std-rate-limiter - Token Bucket Rate Limiting
// ============================================================================

export const RATE_LIMITER_BEHAVIOR: OrbitalSchema = {
  name: 'std-rate-limiter',
  version: '1.0.0',
  description: 'Guard-based rate limiting with sliding window reset',
  orbitals: [
    {
      name: 'RateLimiterOrbital',
      entity: {
        name: 'RateLimiterState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'requestCount', type: 'number', default: 0 },
          { name: 'windowStart', type: 'number', default: 0 },
          { name: 'rateLimit', type: 'number', default: 60 },
          { name: 'windowMs', type: 'number', default: 60000 },
          { name: 'totalRequests', type: 'number', default: 0 },
          { name: 'rejectedRequests', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'RateLimiter',
          linkedEntity: 'RateLimiterState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Active', isInitial: true },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'REQUEST', name: 'Record Request' },
              { key: 'WINDOW_RESET', name: 'Window Reset' },
              { key: 'RESET', name: 'Full Reset' },
            ],
            transitions: [
              // INIT: render dashboard
              {
                from: 'Active',
                to: 'Active',
                event: 'INIT',
                effects: [
                  ['fetch', 'RateLimiterState'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Rate Limiter' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'RateLimiterState' }],
                ],
              },
              // Request allowed
              {
                from: 'Active',
                to: 'Active',
                event: 'REQUEST',
                guard: ['<', '@entity.requestCount', '@entity.rateLimit'],
                effects: [
                  ['fetch', 'RateLimiterState'],
                  ['set', '@entity.requestCount', ['+', '@entity.requestCount', 1]],
                  ['set', '@entity.totalRequests', ['+', '@entity.totalRequests', 1]],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Rate Limiter' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'RateLimiterState' }],
                ],
              },
              // Request rejected - over limit
              {
                from: 'Active',
                to: 'Active',
                event: 'REQUEST',
                guard: ['>=', '@entity.requestCount', '@entity.rateLimit'],
                effects: [
                  ['fetch', 'RateLimiterState'],
                  ['set', '@entity.rejectedRequests', ['+', '@entity.rejectedRequests', 1]],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Rate Limiter - Limit Exceeded' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'RateLimiterState' }],
                ],
              },
              // Sliding window reset
              {
                from: 'Active',
                to: 'Active',
                event: 'WINDOW_RESET',
                effects: [
                  ['fetch', 'RateLimiterState'],
                  ['set', '@entity.requestCount', 0],
                  ['set', '@entity.windowStart', ['time/now']],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Rate Limiter' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'RateLimiterState' }],
                ],
              },
              // Full counter reset
              {
                from: 'Active',
                to: 'Active',
                event: 'RESET',
                effects: [
                  ['fetch', 'RateLimiterState'],
                  ['set', '@entity.requestCount', 0],
                  ['set', '@entity.totalRequests', 0],
                  ['set', '@entity.rejectedRequests', 0],
                  ['set', '@entity.windowStart', ['time/now']],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Rate Limiter' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'RateLimiterState' }],
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'window_reset',
              interval: 60000,
              effects: [],
            },
          ],
        },
      ],
      pages: [{ name: 'RateLimiterPage', path: '/rate-limiter', isInitial: true, traits: [{ ref: 'RateLimiter' }] }],
    },
  ],
};

// ============================================================================
// std-cache-aside - Cache-Aside Pattern
// ============================================================================

export const CACHE_ASIDE_BEHAVIOR: OrbitalSchema = {
  name: 'std-cache-aside',
  version: '1.0.0',
  description: 'Cache-aside pattern with TTL-based freshness and eviction',
  orbitals: [
    {
      name: 'CacheAsideOrbital',
      entity: {
        name: 'CacheEntry',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'cacheKey', type: 'string', default: '' },
          { name: 'cachedValue', type: 'string', default: '' },
          { name: 'cachedAt', type: 'number', default: 0 },
          { name: 'ttlMs', type: 'number', default: 300000 },
          { name: 'cacheHits', type: 'number', default: 0 },
          { name: 'cacheMisses', type: 'number', default: 0 },
          { name: 'isFresh', type: 'boolean', default: false },
          { name: 'lastAccessed', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'CacheAside',
          linkedEntity: 'CacheEntry',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Empty', isInitial: true },
              { name: 'Fresh' },
              { name: 'Stale' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'LOOKUP', name: 'Cache Lookup' },
              { key: 'POPULATE', name: 'Populate Cache', payloadSchema: [
                { name: 'value', type: 'string', required: true },
                { name: 'key', type: 'string', required: true },
              ] },
              { key: 'INVALIDATE', name: 'Invalidate' },
              { key: 'EVICT', name: 'Evict' },
            ],
            transitions: [
              // INIT: render dashboard
              {
                from: 'Empty',
                to: 'Empty',
                event: 'INIT',
                effects: [
                  ['fetch', 'CacheEntry'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Cache' }],
                  ['render-ui', 'main', { type: 'empty-state' }, { entity: 'CacheEntry' }],
                ],
              },
              // Empty: lookup is a miss
              {
                from: 'Empty',
                to: 'Empty',
                event: 'LOOKUP',
                effects: [
                  ['fetch', 'CacheEntry'],
                  ['set', '@entity.cacheMisses', ['+', '@entity.cacheMisses', 1]],
                  ['set', '@entity.lastAccessed', ['time/now']],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Cache - Miss' }],
                  ['render-ui', 'main', { type: 'empty-state' }, { entity: 'CacheEntry' }],
                ],
              },
              // Empty -> Fresh: populate after fetch
              {
                from: 'Empty',
                to: 'Fresh',
                event: 'POPULATE',
                effects: [
                  ['fetch', 'CacheEntry'],
                  ['set', '@entity.cachedValue', '@payload.value'],
                  ['set', '@entity.cacheKey', '@payload.key'],
                  ['set', '@entity.cachedAt', ['time/now']],
                  ['set', '@entity.isFresh', true],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Cache - Fresh' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'CacheEntry' }],
                ],
              },
              // Fresh: lookup is a hit
              {
                from: 'Fresh',
                to: 'Fresh',
                event: 'LOOKUP',
                guard: ['<', ['-', ['time/now'], '@entity.cachedAt'], '@entity.ttlMs'],
                effects: [
                  ['fetch', 'CacheEntry'],
                  ['set', '@entity.cacheHits', ['+', '@entity.cacheHits', 1]],
                  ['set', '@entity.lastAccessed', ['time/now']],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Cache - Hit' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'CacheEntry' }],
                ],
              },
              // Fresh -> Stale: TTL expired on lookup
              {
                from: 'Fresh',
                to: 'Stale',
                event: 'LOOKUP',
                guard: ['>=', ['-', ['time/now'], '@entity.cachedAt'], '@entity.ttlMs'],
                effects: [
                  ['fetch', 'CacheEntry'],
                  ['set', '@entity.isFresh', false],
                  ['set', '@entity.cacheMisses', ['+', '@entity.cacheMisses', 1]],
                  ['set', '@entity.lastAccessed', ['time/now']],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Cache - Stale' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'CacheEntry' }],
                ],
              },
              // Fresh -> Fresh: update cache
              {
                from: 'Fresh',
                to: 'Fresh',
                event: 'POPULATE',
                effects: [
                  ['fetch', 'CacheEntry'],
                  ['set', '@entity.cachedValue', '@payload.value'],
                  ['set', '@entity.cachedAt', ['time/now']],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Cache - Fresh' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'CacheEntry' }],
                ],
              },
              // Stale: lookup is a miss
              {
                from: 'Stale',
                to: 'Stale',
                event: 'LOOKUP',
                effects: [
                  ['fetch', 'CacheEntry'],
                  ['set', '@entity.cacheMisses', ['+', '@entity.cacheMisses', 1]],
                  ['set', '@entity.lastAccessed', ['time/now']],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Cache - Stale' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'CacheEntry' }],
                ],
              },
              // Stale -> Fresh: re-populate
              {
                from: 'Stale',
                to: 'Fresh',
                event: 'POPULATE',
                effects: [
                  ['fetch', 'CacheEntry'],
                  ['set', '@entity.cachedValue', '@payload.value'],
                  ['set', '@entity.cachedAt', ['time/now']],
                  ['set', '@entity.isFresh', true],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Cache - Fresh' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'CacheEntry' }],
                ],
              },
              // Invalidate from Fresh
              {
                from: 'Fresh',
                to: 'Empty',
                event: 'INVALIDATE',
                effects: [
                  ['fetch', 'CacheEntry'],
                  ['set', '@entity.cachedValue', ''],
                  ['set', '@entity.isFresh', false],
                  ['set', '@entity.cachedAt', 0],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Cache' }],
                  ['render-ui', 'main', { type: 'empty-state' }, { entity: 'CacheEntry' }],
                ],
              },
              // Invalidate from Stale
              {
                from: 'Stale',
                to: 'Empty',
                event: 'INVALIDATE',
                effects: [
                  ['fetch', 'CacheEntry'],
                  ['set', '@entity.cachedValue', ''],
                  ['set', '@entity.isFresh', false],
                  ['set', '@entity.cachedAt', 0],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Cache' }],
                  ['render-ui', 'main', { type: 'empty-state' }, { entity: 'CacheEntry' }],
                ],
              },
              // Evict from Fresh
              {
                from: 'Fresh',
                to: 'Empty',
                event: 'EVICT',
                effects: [
                  ['fetch', 'CacheEntry'],
                  ['set', '@entity.cachedValue', ''],
                  ['set', '@entity.isFresh', false],
                  ['set', '@entity.cachedAt', 0],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Cache' }],
                  ['render-ui', 'main', { type: 'empty-state' }, { entity: 'CacheEntry' }],
                ],
              },
              // Evict from Stale
              {
                from: 'Stale',
                to: 'Empty',
                event: 'EVICT',
                effects: [
                  ['fetch', 'CacheEntry'],
                  ['set', '@entity.cachedValue', ''],
                  ['set', '@entity.isFresh', false],
                  ['set', '@entity.cachedAt', 0],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Cache' }],
                  ['render-ui', 'main', { type: 'empty-state' }, { entity: 'CacheEntry' }],
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'eviction_sweep',
              interval: 60000,
              guard: ['and', ['!=', '@entity.cachedAt', 0], ['>=', ['-', ['time/now'], '@entity.cachedAt'], '@entity.ttlMs']],
              effects: [],
            },
          ],
        },
      ],
      pages: [{ name: 'CachePage', path: '/cache', isInitial: true, traits: [{ ref: 'CacheAside' }] }],
    },
  ],
};

// ============================================================================
// std-saga - Saga Pattern (Distributed Transaction Compensation)
// ============================================================================

export const SAGA_BEHAVIOR: OrbitalSchema = {
  name: 'std-saga',
  version: '1.0.0',
  description: 'Saga pattern with step-by-step execution and reverse compensation on failure',
  orbitals: [
    {
      name: 'SagaOrbital',
      entity: {
        name: 'SagaState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'sagaName', type: 'string', default: '' },
          { name: 'currentStep', type: 'number', default: 0 },
          { name: 'totalSteps', type: 'number', default: 0 },
          { name: 'sagaStatus', type: 'string', default: 'idle' },
          { name: 'failedStep', type: 'number', default: -1 },
          { name: 'failureReason', type: 'string', default: '' },
          { name: 'startedAt', type: 'number', default: 0 },
          { name: 'completedAt', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'Saga',
          linkedEntity: 'SagaState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Idle', isInitial: true },
              { name: 'Running' },
              { name: 'Compensating' },
              { name: 'Completed' },
              { name: 'Failed' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'START_SAGA', name: 'Start Saga' },
              { key: 'STEP_SUCCESS', name: 'Step Success' },
              { key: 'STEP_FAILURE', name: 'Step Failure' },
              { key: 'COMPENSATE_SUCCESS', name: 'Compensate Success' },
              { key: 'COMPENSATE_FAILURE', name: 'Compensate Failure' },
              { key: 'RESET', name: 'Reset' },
            ],
            transitions: [
              // INIT: render dashboard
              {
                from: 'Idle',
                to: 'Idle',
                event: 'INIT',
                effects: [
                  ['fetch', 'SagaState'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Saga' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'SagaState' }],
                ],
              },
              // Idle -> Running: start the saga
              {
                from: 'Idle',
                to: 'Running',
                event: 'START_SAGA',
                effects: [
                  ['fetch', 'SagaState'],
                  ['set', '@entity.sagaStatus', 'running'],
                  ['set', '@entity.currentStep', 0],
                  ['set', '@entity.failedStep', -1],
                  ['set', '@entity.failureReason', ''],
                  ['set', '@entity.startedAt', ['time/now']],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Saga - Running' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'SagaState' }],
                ],
              },
              // Running: step success, more steps remaining
              {
                from: 'Running',
                to: 'Running',
                event: 'STEP_SUCCESS',
                guard: ['<', ['+', '@entity.currentStep', 1], '@entity.totalSteps'],
                effects: [
                  ['fetch', 'SagaState'],
                  ['set', '@entity.currentStep', ['+', '@entity.currentStep', 1]],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Saga - Running' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'SagaState' }],
                ],
              },
              // Running -> Completed: last step succeeded
              {
                from: 'Running',
                to: 'Completed',
                event: 'STEP_SUCCESS',
                guard: ['>=', ['+', '@entity.currentStep', 1], '@entity.totalSteps'],
                effects: [
                  ['fetch', 'SagaState'],
                  ['set', '@entity.sagaStatus', 'completed'],
                  ['set', '@entity.completedAt', ['time/now']],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Saga - Completed' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'SagaState' }],
                ],
              },
              // Running -> Compensating: a step failed
              {
                from: 'Running',
                to: 'Compensating',
                event: 'STEP_FAILURE',
                effects: [
                  ['fetch', 'SagaState'],
                  ['set', '@entity.sagaStatus', 'compensating'],
                  ['set', '@entity.failedStep', '@entity.currentStep'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Saga - Compensating' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'SagaState' }],
                ],
              },
              // Compensating: compensation step succeeded, more to undo
              {
                from: 'Compensating',
                to: 'Compensating',
                event: 'COMPENSATE_SUCCESS',
                guard: ['>', '@entity.currentStep', 0],
                effects: [
                  ['fetch', 'SagaState'],
                  ['set', '@entity.currentStep', ['-', '@entity.currentStep', 1]],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Saga - Compensating' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'SagaState' }],
                ],
              },
              // Compensating -> Failed: all compensations done (reached step 0)
              {
                from: 'Compensating',
                to: 'Failed',
                event: 'COMPENSATE_SUCCESS',
                guard: ['<=', '@entity.currentStep', 0],
                effects: [
                  ['fetch', 'SagaState'],
                  ['set', '@entity.sagaStatus', 'failed'],
                  ['set', '@entity.completedAt', ['time/now']],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Saga - Failed' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'SagaState' }],
                ],
              },
              // Compensating -> Failed: compensation itself failed
              {
                from: 'Compensating',
                to: 'Failed',
                event: 'COMPENSATE_FAILURE',
                effects: [
                  ['fetch', 'SagaState'],
                  ['set', '@entity.sagaStatus', 'failed'],
                  ['set', '@entity.completedAt', ['time/now']],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Saga - Failed' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'SagaState' }],
                ],
              },
              // Reset from Completed
              {
                from: 'Completed',
                to: 'Idle',
                event: 'RESET',
                effects: [
                  ['fetch', 'SagaState'],
                  ['set', '@entity.sagaStatus', 'idle'],
                  ['set', '@entity.currentStep', 0],
                  ['set', '@entity.failedStep', -1],
                  ['set', '@entity.failureReason', ''],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Saga' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'SagaState' }],
                ],
              },
              // Reset from Failed
              {
                from: 'Failed',
                to: 'Idle',
                event: 'RESET',
                effects: [
                  ['fetch', 'SagaState'],
                  ['set', '@entity.sagaStatus', 'idle'],
                  ['set', '@entity.currentStep', 0],
                  ['set', '@entity.failedStep', -1],
                  ['set', '@entity.failureReason', ''],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Saga' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'SagaState' }],
                ],
              },
            ],
          },
          ticks: [],
        },
      ],
      pages: [{ name: 'SagaPage', path: '/saga', isInitial: true, traits: [{ ref: 'Saga' }] }],
    },
  ],
};

// ============================================================================
// std-metrics-collector - Metrics Collection with Periodic Flush
// ============================================================================

export const METRICS_COLLECTOR_BEHAVIOR: OrbitalSchema = {
  name: 'std-metrics-collector',
  version: '1.0.0',
  description: 'Tick-based metrics aggregation with periodic flush and reporting',
  orbitals: [
    {
      name: 'MetricsCollectorOrbital',
      entity: {
        name: 'MetricsState',
        persistence: 'runtime',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'lastFlush', type: 'number', default: 0 },
          { name: 'totalFlushes', type: 'number', default: 0 },
          { name: 'totalRecorded', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'MetricsCollector',
          linkedEntity: 'MetricsState',
          category: 'interaction',
          stateMachine: {
            states: [
              { name: 'Collecting', isInitial: true },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'RECORD_COUNTER', name: 'Record Counter' },
              { key: 'RECORD_GAUGE', name: 'Record Gauge' },
              { key: 'FLUSH', name: 'Flush Metrics' },
              { key: 'RESET', name: 'Reset All' },
            ],
            transitions: [
              // INIT: render dashboard
              {
                from: 'Collecting',
                to: 'Collecting',
                event: 'INIT',
                effects: [
                  ['fetch', 'MetricsState'],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Metrics Collector' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'MetricsState' }],
                ],
              },
              // Record a counter increment
              {
                from: 'Collecting',
                to: 'Collecting',
                event: 'RECORD_COUNTER',
                effects: [
                  ['fetch', 'MetricsState'],
                  ['set', '@entity.totalRecorded', ['+', '@entity.totalRecorded', 1]],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Metrics Collector' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'MetricsState' }],
                ],
              },
              // Record a gauge value
              {
                from: 'Collecting',
                to: 'Collecting',
                event: 'RECORD_GAUGE',
                effects: [
                  ['fetch', 'MetricsState'],
                  ['set', '@entity.totalRecorded', ['+', '@entity.totalRecorded', 1]],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Metrics Collector' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'MetricsState' }],
                ],
              },
              // Flush: reset counters
              {
                from: 'Collecting',
                to: 'Collecting',
                event: 'FLUSH',
                effects: [
                  ['fetch', 'MetricsState'],
                  ['set', '@entity.lastFlush', ['time/now']],
                  ['set', '@entity.totalFlushes', ['+', '@entity.totalFlushes', 1]],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Metrics Collector' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'MetricsState' }],
                ],
              },
              // Full reset
              {
                from: 'Collecting',
                to: 'Collecting',
                event: 'RESET',
                effects: [
                  ['fetch', 'MetricsState'],
                  ['set', '@entity.totalRecorded', 0],
                  ['set', '@entity.totalFlushes', 0],
                  ['set', '@entity.lastFlush', 0],
                  ['render-ui', 'main', { type: 'page-header',  title: 'Metrics Collector' }],
                  ['render-ui', 'main', { type: 'stats',  entity: 'MetricsState' }],
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'periodic_flush',
              interval: 60000,
              guard: ['>', '@entity.totalRecorded', 0],
              effects: [],
            },
          ],
        },
      ],
      pages: [{ name: 'MetricsPage', path: '/metrics', isInitial: true, traits: [{ ref: 'MetricsCollector' }] }],
    },
  ],
};

// ============================================================================
// Export All Infrastructure Behaviors
// ============================================================================

export const INFRASTRUCTURE_BEHAVIORS: OrbitalSchema[] = [
  CIRCUIT_BREAKER_BEHAVIOR,
  HEALTH_CHECK_BEHAVIOR,
  RATE_LIMITER_BEHAVIOR,
  CACHE_ASIDE_BEHAVIOR,
  SAGA_BEHAVIOR,
  METRICS_COLLECTOR_BEHAVIOR,
];
