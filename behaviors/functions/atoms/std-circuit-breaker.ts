/**
 * std-circuit-breaker
 *
 * Circuit breaker pattern behavior: closed, open, halfOpen.
 * Protects services from cascading failures with automatic recovery.
 * Pure function: params in, OrbitalDefinition out.
 *
 * @level molecule
 * @family resilience
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdCircuitBreakerParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;

  // Labels
  closedLabel?: string;
  openLabel?: string;
  halfOpenLabel?: string;

  // Icons
  headerIcon?: string;

  // Page
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface CircuitBreakerConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  traitName: string;
  closedLabel: string;
  openLabel: string;
  halfOpenLabel: string;
  headerIcon: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdCircuitBreakerParams): CircuitBreakerConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const p = plural(entityName);

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    collection: params.collection,
    traitName: `${entityName}CircuitBreaker`,
    closedLabel: params.closedLabel ?? 'Circuit Closed',
    openLabel: params.openLabel ?? 'Circuit Open',
    halfOpenLabel: params.halfOpenLabel ?? 'Circuit Half-Open',
    headerIcon: params.headerIcon ?? 'shield',
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: CircuitBreakerConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection });
}

function buildTrait(c: CircuitBreakerConfig): Trait {
  const { entityName, headerIcon, closedLabel, openLabel, halfOpenLabel } = c;

  // Closed view (healthy, accepting requests)
  const closedUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: entityName, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'badge', label: closedLabel },
      { type: 'typography', content: 'Service is healthy. All requests are being processed.', variant: 'body' },
    ],
  };

  // Open view (tripped, rejecting requests)
  const openUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'icon', name: 'alert-triangle', size: 'lg' },
          { type: 'typography', content: entityName, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'badge', label: openLabel },
      { type: 'typography', content: 'Circuit is open. Requests are being rejected to prevent cascading failures.', variant: 'body' },
      { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  // Half-open view (testing recovery)
  const halfOpenUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'icon', name: 'activity', size: 'lg' },
          { type: 'typography', content: entityName, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'badge', label: halfOpenLabel },
      { type: 'typography', content: 'Testing recovery. Limited requests are being allowed through.', variant: 'body' },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'closed', isInitial: true },
        { name: 'open' },
        { name: 'halfOpen' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'FAILURE', name: 'Failure' },
        { key: 'SUCCESS', name: 'Success' },
        { key: 'TIMEOUT', name: 'Timeout' },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions: [
        // INIT: closed -> closed
        {
          from: 'closed', to: 'closed', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', closedUI],
          ],
        },
        // FAILURE: closed -> open (threshold reached)
        {
          from: 'closed', to: 'open', event: 'FAILURE',
          effects: [['render-ui', 'main', openUI]],
        },
        // SUCCESS: closed -> closed (healthy)
        {
          from: 'closed', to: 'closed', event: 'SUCCESS',
          effects: [['render-ui', 'main', closedUI]],
        },
        // TIMEOUT: open -> halfOpen (try recovery)
        {
          from: 'open', to: 'halfOpen', event: 'TIMEOUT',
          effects: [['render-ui', 'main', halfOpenUI]],
        },
        // RESET: open -> closed (manual reset)
        {
          from: 'open', to: 'closed', event: 'RESET',
          effects: [['render-ui', 'main', closedUI]],
        },
        // SUCCESS: halfOpen -> closed (recovered)
        {
          from: 'halfOpen', to: 'closed', event: 'SUCCESS',
          effects: [['render-ui', 'main', closedUI]],
        },
        // FAILURE: halfOpen -> open (still failing)
        {
          from: 'halfOpen', to: 'open', event: 'FAILURE',
          effects: [['render-ui', 'main', openUI]],
        },
        // RESET: halfOpen -> closed (manual reset)
        {
          from: 'halfOpen', to: 'closed', event: 'RESET',
          effects: [['render-ui', 'main', closedUI]],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: CircuitBreakerConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdCircuitBreakerEntity(params: StdCircuitBreakerParams): Entity {
  return buildEntity(resolve(params));
}

export function stdCircuitBreakerTrait(params: StdCircuitBreakerParams): Trait {
  return buildTrait(resolve(params));
}

export function stdCircuitBreakerPage(params: StdCircuitBreakerParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdCircuitBreaker(params: StdCircuitBreakerParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
