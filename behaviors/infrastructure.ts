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
          { name: 'lastFailure', type: 'number', default: null },
          { name: 'lastSuccess', type: 'number', default: null },
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
          category: 'lifecycle',
          emits: [
            { event: 'CIRCUIT_OPENED', scope: 'external' },
            { event: 'CIRCUIT_CLOSED', scope: 'external' },
            { event: 'CIRCUIT_HALF_OPEN', scope: 'external' },
          ],
          stateMachine: {
            states: [
              { name: 'Closed', isInitial: true },
              { name: 'Open' },
              { name: 'HalfOpen' },
            ],
            events: [
              { key: 'RECORD_SUCCESS', name: 'Record Success' },
              { key: 'RECORD_FAILURE', name: 'Record Failure' },
              { key: 'PROBE', name: 'Probe' },
              { key: 'RESET', name: 'Reset' },
            ],
            transitions: [
              // Closed: record success
              {
                from: 'Closed',
                to: 'Closed',
                event: 'RECORD_SUCCESS',
                effects: [
                  ['set', '@entity.successCount', ['+', '@entity.successCount', 1]],
                  ['set', '@entity.totalCount', ['+', '@entity.totalCount', 1]],
                  ['set', '@entity.lastSuccess', ['time/now']],
                  ['set', '@entity.errorRate', ['/', '@entity.errorCount', ['math/max', '@entity.totalCount', 1]]],
                ],
              },
              // Closed: record failure, stay closed if under threshold
              {
                from: 'Closed',
                to: 'Closed',
                event: 'RECORD_FAILURE',
                guard: ['<', ['+', '@entity.errorCount', 1], '@entity.errorThreshold'],
                effects: [
                  ['set', '@entity.errorCount', ['+', '@entity.errorCount', 1]],
                  ['set', '@entity.totalCount', ['+', '@entity.totalCount', 1]],
                  ['set', '@entity.lastFailure', ['time/now']],
                  ['set', '@entity.errorRate', ['/', ['+', '@entity.errorCount', 1], ['math/max', '@entity.totalCount', 1]]],
                ],
              },
              // Closed -> Open: threshold exceeded
              {
                from: 'Closed',
                to: 'Open',
                event: 'RECORD_FAILURE',
                guard: ['>=', ['+', '@entity.errorCount', 1], '@entity.errorThreshold'],
                effects: [
                  ['set', '@entity.errorCount', ['+', '@entity.errorCount', 1]],
                  ['set', '@entity.totalCount', ['+', '@entity.totalCount', 1]],
                  ['set', '@entity.lastFailure', ['time/now']],
                  ['set', '@entity.errorRate', ['/', ['+', '@entity.errorCount', 1], ['math/max', '@entity.totalCount', 1]]],
                  ['emit', 'CIRCUIT_OPENED', { errorCount: '@entity.errorCount', errorRate: '@entity.errorRate' }],
                ],
              },
              // Open -> HalfOpen: probe after reset timeout
              {
                from: 'Open',
                to: 'HalfOpen',
                event: 'PROBE',
                guard: ['>', ['-', ['time/now'], '@entity.lastFailure'], '@entity.resetAfterMs'],
                effects: [
                  ['set', '@entity.halfOpenAttempts', 0],
                  ['emit', 'CIRCUIT_HALF_OPEN', {}],
                ],
              },
              // HalfOpen: success -> close
              {
                from: 'HalfOpen',
                to: 'Closed',
                event: 'RECORD_SUCCESS',
                effects: [
                  ['set', '@entity.errorCount', 0],
                  ['set', '@entity.errorRate', 0],
                  ['set', '@entity.halfOpenAttempts', 0],
                  ['set', '@entity.successCount', ['+', '@entity.successCount', 1]],
                  ['set', '@entity.lastSuccess', ['time/now']],
                  ['emit', 'CIRCUIT_CLOSED', {}],
                ],
              },
              // HalfOpen: failure -> back to open
              {
                from: 'HalfOpen',
                to: 'Open',
                event: 'RECORD_FAILURE',
                effects: [
                  ['set', '@entity.errorCount', ['+', '@entity.errorCount', 1]],
                  ['set', '@entity.lastFailure', ['time/now']],
                  ['emit', 'CIRCUIT_OPENED', { errorCount: '@entity.errorCount' }],
                ],
              },
              // Reset from any state
              {
                from: ['Closed', 'Open', 'HalfOpen'] as unknown as string,
                to: 'Closed',
                event: 'RESET',
                effects: [
                  ['set', '@entity.errorCount', 0],
                  ['set', '@entity.successCount', 0],
                  ['set', '@entity.totalCount', 0],
                  ['set', '@entity.errorRate', 0],
                  ['set', '@entity.halfOpenAttempts', 0],
                  ['set', '@entity.circuitState', 'closed'],
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'probe_half_open',
              interval: '30000',
              guard: ['=', '@entity.circuitState', 'open'],
              effects: [['emit', 'PROBE']],
              description: 'Periodically probe to transition from Open to HalfOpen',
            },
          ],
        },
      ],
      pages: [],
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
          { name: 'lastCheck', type: 'number', default: null },
          { name: 'lastHealthy', type: 'number', default: null },
          { name: 'consecutiveFailures', type: 'number', default: 0 },
          { name: 'consecutiveSuccesses', type: 'number', default: 0 },
          { name: 'checkIntervalMs', type: 'number', default: 30000 },
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
          category: 'lifecycle',
          emits: [
            { event: 'SERVICE_HEALTHY', scope: 'external' },
            { event: 'SERVICE_DEGRADED', scope: 'external' },
            { event: 'SERVICE_UNHEALTHY', scope: 'external' },
          ],
          stateMachine: {
            states: [
              { name: 'Unknown', isInitial: true },
              { name: 'Healthy' },
              { name: 'Degraded' },
              { name: 'Unhealthy' },
            ],
            events: [
              { key: 'CHECK_SUCCESS', name: 'Check Success' },
              { key: 'CHECK_FAILURE', name: 'Check Failure' },
              { key: 'HEALTH_TICK', name: 'Health Tick' },
              { key: 'RESET', name: 'Reset' },
            ],
            transitions: [
              // Unknown -> Healthy on first success
              {
                from: 'Unknown',
                to: 'Healthy',
                event: 'CHECK_SUCCESS',
                effects: [
                  ['set', '@entity.healthStatus', 'healthy'],
                  ['set', '@entity.consecutiveSuccesses', 1],
                  ['set', '@entity.consecutiveFailures', 0],
                  ['set', '@entity.lastCheck', ['time/now']],
                  ['set', '@entity.lastHealthy', ['time/now']],
                  ['set', '@entity.totalChecks', ['+', '@entity.totalChecks', 1]],
                  ['emit', 'SERVICE_HEALTHY', {}],
                ],
              },
              // Unknown -> Degraded on first failure
              {
                from: 'Unknown',
                to: 'Degraded',
                event: 'CHECK_FAILURE',
                effects: [
                  ['set', '@entity.healthStatus', 'degraded'],
                  ['set', '@entity.consecutiveFailures', 1],
                  ['set', '@entity.consecutiveSuccesses', 0],
                  ['set', '@entity.lastCheck', ['time/now']],
                  ['set', '@entity.totalChecks', ['+', '@entity.totalChecks', 1]],
                  ['set', '@entity.totalFailures', ['+', '@entity.totalFailures', 1]],
                  ['emit', 'SERVICE_DEGRADED', { consecutiveFailures: 1 }],
                ],
              },
              // Healthy: stay healthy on success
              {
                from: 'Healthy',
                to: 'Healthy',
                event: 'CHECK_SUCCESS',
                effects: [
                  ['set', '@entity.consecutiveSuccesses', ['+', '@entity.consecutiveSuccesses', 1]],
                  ['set', '@entity.consecutiveFailures', 0],
                  ['set', '@entity.lastCheck', ['time/now']],
                  ['set', '@entity.lastHealthy', ['time/now']],
                  ['set', '@entity.totalChecks', ['+', '@entity.totalChecks', 1]],
                ],
              },
              // Healthy -> Degraded on failure
              {
                from: 'Healthy',
                to: 'Degraded',
                event: 'CHECK_FAILURE',
                effects: [
                  ['set', '@entity.healthStatus', 'degraded'],
                  ['set', '@entity.consecutiveFailures', 1],
                  ['set', '@entity.consecutiveSuccesses', 0],
                  ['set', '@entity.lastCheck', ['time/now']],
                  ['set', '@entity.totalChecks', ['+', '@entity.totalChecks', 1]],
                  ['set', '@entity.totalFailures', ['+', '@entity.totalFailures', 1]],
                  ['emit', 'SERVICE_DEGRADED', { consecutiveFailures: 1 }],
                ],
              },
              // Degraded: stay degraded on failure (below unhealthy threshold)
              {
                from: 'Degraded',
                to: 'Degraded',
                event: 'CHECK_FAILURE',
                guard: ['<', ['+', '@entity.consecutiveFailures', 1], '@entity.unhealthyThreshold'],
                effects: [
                  ['set', '@entity.consecutiveFailures', ['+', '@entity.consecutiveFailures', 1]],
                  ['set', '@entity.consecutiveSuccesses', 0],
                  ['set', '@entity.lastCheck', ['time/now']],
                  ['set', '@entity.totalChecks', ['+', '@entity.totalChecks', 1]],
                  ['set', '@entity.totalFailures', ['+', '@entity.totalFailures', 1]],
                ],
              },
              // Degraded -> Unhealthy when threshold exceeded
              {
                from: 'Degraded',
                to: 'Unhealthy',
                event: 'CHECK_FAILURE',
                guard: ['>=', ['+', '@entity.consecutiveFailures', 1], '@entity.unhealthyThreshold'],
                effects: [
                  ['set', '@entity.healthStatus', 'unhealthy'],
                  ['set', '@entity.consecutiveFailures', ['+', '@entity.consecutiveFailures', 1]],
                  ['set', '@entity.lastCheck', ['time/now']],
                  ['set', '@entity.totalChecks', ['+', '@entity.totalChecks', 1]],
                  ['set', '@entity.totalFailures', ['+', '@entity.totalFailures', 1]],
                  ['emit', 'SERVICE_UNHEALTHY', { consecutiveFailures: ['+', '@entity.consecutiveFailures', 1] }],
                ],
              },
              // Degraded -> Healthy on enough successes
              {
                from: 'Degraded',
                to: 'Healthy',
                event: 'CHECK_SUCCESS',
                guard: ['>=', ['+', '@entity.consecutiveSuccesses', 1], '@entity.recoveryThreshold'],
                effects: [
                  ['set', '@entity.healthStatus', 'healthy'],
                  ['set', '@entity.consecutiveSuccesses', ['+', '@entity.consecutiveSuccesses', 1]],
                  ['set', '@entity.consecutiveFailures', 0],
                  ['set', '@entity.lastCheck', ['time/now']],
                  ['set', '@entity.lastHealthy', ['time/now']],
                  ['set', '@entity.totalChecks', ['+', '@entity.totalChecks', 1]],
                  ['emit', 'SERVICE_HEALTHY', {}],
                ],
              },
              // Degraded: stay degraded on success (not enough to recover)
              {
                from: 'Degraded',
                to: 'Degraded',
                event: 'CHECK_SUCCESS',
                guard: ['<', ['+', '@entity.consecutiveSuccesses', 1], '@entity.recoveryThreshold'],
                effects: [
                  ['set', '@entity.consecutiveSuccesses', ['+', '@entity.consecutiveSuccesses', 1]],
                  ['set', '@entity.consecutiveFailures', 0],
                  ['set', '@entity.lastCheck', ['time/now']],
                  ['set', '@entity.totalChecks', ['+', '@entity.totalChecks', 1]],
                ],
              },
              // Unhealthy: stay unhealthy on failure
              {
                from: 'Unhealthy',
                to: 'Unhealthy',
                event: 'CHECK_FAILURE',
                effects: [
                  ['set', '@entity.consecutiveFailures', ['+', '@entity.consecutiveFailures', 1]],
                  ['set', '@entity.lastCheck', ['time/now']],
                  ['set', '@entity.totalChecks', ['+', '@entity.totalChecks', 1]],
                  ['set', '@entity.totalFailures', ['+', '@entity.totalFailures', 1]],
                ],
              },
              // Unhealthy -> Degraded on first success (recovery begins)
              {
                from: 'Unhealthy',
                to: 'Degraded',
                event: 'CHECK_SUCCESS',
                effects: [
                  ['set', '@entity.healthStatus', 'degraded'],
                  ['set', '@entity.consecutiveSuccesses', 1],
                  ['set', '@entity.consecutiveFailures', 0],
                  ['set', '@entity.lastCheck', ['time/now']],
                  ['set', '@entity.totalChecks', ['+', '@entity.totalChecks', 1]],
                  ['emit', 'SERVICE_DEGRADED', { recovering: true }],
                ],
              },
              // Reset from any state
              {
                from: ['Unknown', 'Healthy', 'Degraded', 'Unhealthy'] as unknown as string,
                to: 'Unknown',
                event: 'RESET',
                effects: [
                  ['set', '@entity.healthStatus', 'unknown'],
                  ['set', '@entity.consecutiveFailures', 0],
                  ['set', '@entity.consecutiveSuccesses', 0],
                  ['set', '@entity.totalChecks', 0],
                  ['set', '@entity.totalFailures', 0],
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'periodic_health_check',
              interval: '@entity.checkIntervalMs',
              effects: [['emit', 'HEALTH_TICK']],
              description: 'Periodically trigger health check',
            },
          ],
        },
      ],
      pages: [],
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
          category: 'lifecycle',
          emits: [
            { event: 'RATE_LIMIT_EXCEEDED', scope: 'external' },
          ],
          stateMachine: {
            states: [
              { name: 'Active', isInitial: true },
            ],
            events: [
              { key: 'REQUEST', name: 'Record Request' },
              { key: 'REQUEST_REJECTED', name: 'Request Rejected' },
              { key: 'WINDOW_RESET', name: 'Window Reset' },
              { key: 'RESET', name: 'Full Reset' },
            ],
            transitions: [
              // Request allowed
              {
                from: 'Active',
                to: 'Active',
                event: 'REQUEST',
                guard: ['<', '@entity.requestCount', '@entity.rateLimit'],
                effects: [
                  ['set', '@entity.requestCount', ['+', '@entity.requestCount', 1]],
                  ['set', '@entity.totalRequests', ['+', '@entity.totalRequests', 1]],
                ],
              },
              // Request rejected — over limit
              {
                from: 'Active',
                to: 'Active',
                event: 'REQUEST',
                guard: ['>=', '@entity.requestCount', '@entity.rateLimit'],
                effects: [
                  ['set', '@entity.rejectedRequests', ['+', '@entity.rejectedRequests', 1]],
                  ['emit', 'RATE_LIMIT_EXCEEDED', {
                    requestCount: '@entity.requestCount',
                    rateLimit: '@entity.rateLimit',
                  }],
                ],
              },
              // Sliding window reset
              {
                from: 'Active',
                to: 'Active',
                event: 'WINDOW_RESET',
                effects: [
                  ['set', '@entity.requestCount', 0],
                  ['set', '@entity.windowStart', ['time/now']],
                ],
              },
              // Full counter reset
              {
                from: 'Active',
                to: 'Active',
                event: 'RESET',
                effects: [
                  ['set', '@entity.requestCount', 0],
                  ['set', '@entity.totalRequests', 0],
                  ['set', '@entity.rejectedRequests', 0],
                  ['set', '@entity.windowStart', ['time/now']],
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'window_reset',
              interval: '@entity.windowMs',
              effects: [['emit', 'WINDOW_RESET']],
              description: 'Reset request counter on sliding window expiry',
            },
          ],
        },
      ],
      pages: [],
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
          { name: 'cachedValue', type: 'object', default: null },
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
          category: 'lifecycle',
          emits: [
            { event: 'CACHE_HIT', scope: 'internal' },
            { event: 'CACHE_MISS', scope: 'internal' },
            { event: 'CACHE_EVICTED', scope: 'internal' },
          ],
          stateMachine: {
            states: [
              { name: 'Empty', isInitial: true },
              { name: 'Fresh' },
              { name: 'Stale' },
            ],
            events: [
              { key: 'LOOKUP', name: 'Cache Lookup' },
              { key: 'POPULATE', name: 'Populate Cache' },
              { key: 'INVALIDATE', name: 'Invalidate' },
              { key: 'EVICT', name: 'Evict' },
              { key: 'EVICTION_TICK', name: 'Eviction Tick' },
            ],
            transitions: [
              // Empty: lookup is a miss
              {
                from: 'Empty',
                to: 'Empty',
                event: 'LOOKUP',
                effects: [
                  ['set', '@entity.cacheMisses', ['+', '@entity.cacheMisses', 1]],
                  ['set', '@entity.lastAccessed', ['time/now']],
                  ['emit', 'CACHE_MISS', { key: '@entity.cacheKey' }],
                ],
              },
              // Empty → Fresh: populate after fetch
              {
                from: 'Empty',
                to: 'Fresh',
                event: 'POPULATE',
                effects: [
                  ['set', '@entity.cachedValue', '@payload.value'],
                  ['set', '@entity.cacheKey', '@payload.key'],
                  ['set', '@entity.cachedAt', ['time/now']],
                  ['set', '@entity.isFresh', true],
                ],
              },
              // Fresh: lookup is a hit
              {
                from: 'Fresh',
                to: 'Fresh',
                event: 'LOOKUP',
                guard: ['<', ['-', ['time/now'], '@entity.cachedAt'], '@entity.ttlMs'],
                effects: [
                  ['set', '@entity.cacheHits', ['+', '@entity.cacheHits', 1]],
                  ['set', '@entity.lastAccessed', ['time/now']],
                  ['emit', 'CACHE_HIT', { key: '@entity.cacheKey' }],
                ],
              },
              // Fresh → Stale: TTL expired on lookup
              {
                from: 'Fresh',
                to: 'Stale',
                event: 'LOOKUP',
                guard: ['>=', ['-', ['time/now'], '@entity.cachedAt'], '@entity.ttlMs'],
                effects: [
                  ['set', '@entity.isFresh', false],
                  ['set', '@entity.cacheMisses', ['+', '@entity.cacheMisses', 1]],
                  ['set', '@entity.lastAccessed', ['time/now']],
                  ['emit', 'CACHE_MISS', { key: '@entity.cacheKey', reason: 'ttl_expired' }],
                ],
              },
              // Stale: lookup is a miss
              {
                from: 'Stale',
                to: 'Stale',
                event: 'LOOKUP',
                effects: [
                  ['set', '@entity.cacheMisses', ['+', '@entity.cacheMisses', 1]],
                  ['set', '@entity.lastAccessed', ['time/now']],
                  ['emit', 'CACHE_MISS', { key: '@entity.cacheKey', reason: 'stale' }],
                ],
              },
              // Stale → Fresh: re-populate
              {
                from: 'Stale',
                to: 'Fresh',
                event: 'POPULATE',
                effects: [
                  ['set', '@entity.cachedValue', '@payload.value'],
                  ['set', '@entity.cachedAt', ['time/now']],
                  ['set', '@entity.isFresh', true],
                ],
              },
              // Fresh → Fresh: update cache
              {
                from: 'Fresh',
                to: 'Fresh',
                event: 'POPULATE',
                effects: [
                  ['set', '@entity.cachedValue', '@payload.value'],
                  ['set', '@entity.cachedAt', ['time/now']],
                ],
              },
              // Invalidate from any cached state
              {
                from: ['Fresh', 'Stale'] as unknown as string,
                to: 'Empty',
                event: 'INVALIDATE',
                effects: [
                  ['set', '@entity.cachedValue', null],
                  ['set', '@entity.isFresh', false],
                  ['set', '@entity.cachedAt', 0],
                ],
              },
              // Evict (with event)
              {
                from: ['Fresh', 'Stale'] as unknown as string,
                to: 'Empty',
                event: 'EVICT',
                effects: [
                  ['set', '@entity.cachedValue', null],
                  ['set', '@entity.isFresh', false],
                  ['set', '@entity.cachedAt', 0],
                  ['emit', 'CACHE_EVICTED', { key: '@entity.cacheKey' }],
                ],
              },
              // Eviction tick: evict if stale
              {
                from: 'Stale',
                to: 'Empty',
                event: 'EVICTION_TICK',
                effects: [
                  ['set', '@entity.cachedValue', null],
                  ['set', '@entity.isFresh', false],
                  ['set', '@entity.cachedAt', 0],
                  ['emit', 'CACHE_EVICTED', { key: '@entity.cacheKey', reason: 'ttl_eviction' }],
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'eviction_sweep',
              interval: '60000',
              guard: ['and', ['!=', '@entity.cachedAt', 0], ['>=', ['-', ['time/now'], '@entity.cachedAt'], '@entity.ttlMs']],
              effects: [['emit', 'EVICTION_TICK']],
              description: 'Periodically evict stale cache entries',
            },
          ],
        },
      ],
      pages: [],
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
          { name: 'completedSteps', type: 'array', default: [] },
          { name: 'compensatedSteps', type: 'array', default: [] },
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
          category: 'lifecycle',
          emits: [
            { event: 'SAGA_STARTED', scope: 'external' },
            { event: 'SAGA_STEP_COMPLETED', scope: 'external' },
            { event: 'SAGA_COMPLETED', scope: 'external' },
            { event: 'SAGA_COMPENSATING', scope: 'external' },
            { event: 'SAGA_COMPENSATION_DONE', scope: 'external' },
            { event: 'SAGA_FAILED', scope: 'external' },
          ],
          stateMachine: {
            states: [
              { name: 'Idle', isInitial: true },
              { name: 'Running' },
              { name: 'Compensating' },
              { name: 'Completed' },
              { name: 'Failed' },
            ],
            events: [
              { key: 'START_SAGA', name: 'Start Saga' },
              { key: 'STEP_SUCCESS', name: 'Step Success' },
              { key: 'STEP_FAILURE', name: 'Step Failure' },
              { key: 'COMPENSATE_SUCCESS', name: 'Compensate Success' },
              { key: 'COMPENSATE_FAILURE', name: 'Compensate Failure' },
              { key: 'RESET', name: 'Reset' },
            ],
            transitions: [
              // Idle → Running: start the saga
              {
                from: 'Idle',
                to: 'Running',
                event: 'START_SAGA',
                effects: [
                  ['set', '@entity.sagaStatus', 'running'],
                  ['set', '@entity.currentStep', 0],
                  ['set', '@entity.completedSteps', []],
                  ['set', '@entity.compensatedSteps', []],
                  ['set', '@entity.failedStep', -1],
                  ['set', '@entity.failureReason', ''],
                  ['set', '@entity.startedAt', ['time/now']],
                  ['emit', 'SAGA_STARTED', { sagaName: '@entity.sagaName' }],
                ],
              },
              // Running: step success, more steps remaining
              {
                from: 'Running',
                to: 'Running',
                event: 'STEP_SUCCESS',
                guard: ['<', ['+', '@entity.currentStep', 1], '@entity.totalSteps'],
                effects: [
                  ['set', '@entity.currentStep', ['+', '@entity.currentStep', 1]],
                  ['emit', 'SAGA_STEP_COMPLETED', {
                    step: '@entity.currentStep',
                    totalSteps: '@entity.totalSteps',
                  }],
                ],
              },
              // Running → Completed: last step succeeded
              {
                from: 'Running',
                to: 'Completed',
                event: 'STEP_SUCCESS',
                guard: ['>=', ['+', '@entity.currentStep', 1], '@entity.totalSteps'],
                effects: [
                  ['set', '@entity.sagaStatus', 'completed'],
                  ['set', '@entity.completedAt', ['time/now']],
                  ['emit', 'SAGA_COMPLETED', { sagaName: '@entity.sagaName' }],
                ],
              },
              // Running → Compensating: a step failed
              {
                from: 'Running',
                to: 'Compensating',
                event: 'STEP_FAILURE',
                effects: [
                  ['set', '@entity.sagaStatus', 'compensating'],
                  ['set', '@entity.failedStep', '@entity.currentStep'],
                  ['emit', 'SAGA_COMPENSATING', {
                    failedStep: '@entity.currentStep',
                    sagaName: '@entity.sagaName',
                  }],
                ],
              },
              // Compensating: compensation step succeeded, more to undo
              {
                from: 'Compensating',
                to: 'Compensating',
                event: 'COMPENSATE_SUCCESS',
                guard: ['>', '@entity.currentStep', 0],
                effects: [
                  ['set', '@entity.currentStep', ['-', '@entity.currentStep', 1]],
                ],
              },
              // Compensating → Failed: all compensations done (reached step 0)
              {
                from: 'Compensating',
                to: 'Failed',
                event: 'COMPENSATE_SUCCESS',
                guard: ['<=', '@entity.currentStep', 0],
                effects: [
                  ['set', '@entity.sagaStatus', 'failed'],
                  ['set', '@entity.completedAt', ['time/now']],
                  ['emit', 'SAGA_COMPENSATION_DONE', { sagaName: '@entity.sagaName' }],
                ],
              },
              // Compensating → Failed: compensation itself failed
              {
                from: 'Compensating',
                to: 'Failed',
                event: 'COMPENSATE_FAILURE',
                effects: [
                  ['set', '@entity.sagaStatus', 'failed'],
                  ['set', '@entity.completedAt', ['time/now']],
                  ['emit', 'SAGA_FAILED', {
                    sagaName: '@entity.sagaName',
                    reason: 'Compensation failed',
                  }],
                ],
              },
              // Reset from terminal states
              {
                from: ['Completed', 'Failed'] as unknown as string,
                to: 'Idle',
                event: 'RESET',
                effects: [
                  ['set', '@entity.sagaStatus', 'idle'],
                  ['set', '@entity.currentStep', 0],
                  ['set', '@entity.completedSteps', []],
                  ['set', '@entity.compensatedSteps', []],
                  ['set', '@entity.failedStep', -1],
                  ['set', '@entity.failureReason', ''],
                ],
              },
            ],
          },
          ticks: [],
        },
      ],
      pages: [],
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
          { name: 'counters', type: 'object', default: {} },
          { name: 'gauges', type: 'object', default: {} },
          { name: 'lastFlush', type: 'number', default: 0 },
          { name: 'flushIntervalMs', type: 'number', default: 60000 },
          { name: 'totalFlushes', type: 'number', default: 0 },
          { name: 'totalRecorded', type: 'number', default: 0 },
        ],
      },
      traits: [
        {
          name: 'MetricsCollector',
          linkedEntity: 'MetricsState',
          category: 'lifecycle',
          emits: [
            { event: 'METRICS_REPORT', scope: 'external' },
          ],
          stateMachine: {
            states: [
              { name: 'Collecting', isInitial: true },
            ],
            events: [
              { key: 'RECORD_COUNTER', name: 'Record Counter' },
              { key: 'RECORD_GAUGE', name: 'Record Gauge' },
              { key: 'FLUSH', name: 'Flush Metrics' },
              { key: 'RESET', name: 'Reset All' },
            ],
            transitions: [
              // Record a counter increment
              {
                from: 'Collecting',
                to: 'Collecting',
                event: 'RECORD_COUNTER',
                effects: [
                  ['set', '@entity.totalRecorded', ['+', '@entity.totalRecorded', 1]],
                ],
              },
              // Record a gauge value
              {
                from: 'Collecting',
                to: 'Collecting',
                event: 'RECORD_GAUGE',
                effects: [
                  ['set', '@entity.totalRecorded', ['+', '@entity.totalRecorded', 1]],
                ],
              },
              // Flush: emit report and reset counters
              {
                from: 'Collecting',
                to: 'Collecting',
                event: 'FLUSH',
                effects: [
                  ['emit', 'METRICS_REPORT', {
                    counters: '@entity.counters',
                    gauges: '@entity.gauges',
                    totalRecorded: '@entity.totalRecorded',
                  }],
                  ['set', '@entity.counters', {}],
                  ['set', '@entity.lastFlush', ['time/now']],
                  ['set', '@entity.totalFlushes', ['+', '@entity.totalFlushes', 1]],
                ],
              },
              // Full reset
              {
                from: 'Collecting',
                to: 'Collecting',
                event: 'RESET',
                effects: [
                  ['set', '@entity.counters', {}],
                  ['set', '@entity.gauges', {}],
                  ['set', '@entity.totalRecorded', 0],
                  ['set', '@entity.totalFlushes', 0],
                  ['set', '@entity.lastFlush', 0],
                ],
              },
            ],
          },
          ticks: [
            {
              name: 'periodic_flush',
              interval: '@entity.flushIntervalMs',
              guard: ['>', '@entity.totalRecorded', 0],
              effects: [['emit', 'FLUSH']],
              description: 'Periodically flush accumulated metrics',
            },
          ],
        },
      ],
      pages: [],
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
