/**
 * std-rate-limiter as a Function
 *
 * Rate limiting parameterized for any domain.
 * Provides open and throttled states for controlling request frequency.
 * Tracks request count and throttle status via entity fields.
 * The state machine structure is fixed. The caller controls data and presentation.
 *
 * @level atom
 * @family rate-limiter
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdRateLimiterParams {
  /** Entity name in PascalCase (e.g., "Limiter", "Throttle") */
  entityName: string;
  /** Entity fields (id is auto-added) */
  fields: EntityField[];
  /** Persistence mode */
  persistence?: 'persistent' | 'runtime' | 'singleton';

  // Display
  /** Header icon (Lucide name) */
  headerIcon?: string;
  /** Page title */
  pageTitle?: string;

  // Page
  /** Page name (defaults to "{Entity}RateLimiterPage") */
  pageName?: string;
  /** Route path (defaults to "/{entities}/rate-limiter") */
  pagePath?: string;
  /** Whether this is the initial/home page */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface RateLimiterConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  headerIcon: string;
  pageTitle: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdRateLimiterParams): RateLimiterConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  // Ensure rate-limiter-related fields exist on entity
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'count') ? [] : [{ name: 'count', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'window') ? [] : [{ name: 'window', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'limiterStatus') ? [] : [{ name: 'limiterStatus', type: 'string' as const, default: 'open' }]),
  ];

  const p = plural(entityName);

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}RateLimiter`,
    pluralName: p,
    headerIcon: params.headerIcon ?? 'shield',
    pageTitle: params.pageTitle ?? `${entityName} Rate Limiter`,
    pageName: params.pageName ?? `${entityName}RateLimiterPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/rate-limiter`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: RateLimiterConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: RateLimiterConfig): Trait {
  const { entityName, headerIcon, pageTitle } = c;

  const openView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: pageTitle, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [
          {
            type: 'stack', direction: 'vertical', gap: 'sm',
            children: [
              { type: 'typography', content: 'Requests', variant: 'caption' },
              { type: 'typography', content: '@entity.count', variant: 'h4' },
              { type: 'badge', label: '@entity.limiterStatus' },
            ],
          },
        ],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'Request', event: 'REQUEST', variant: 'primary', icon: 'send' },
          { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
        ],
      },
    ],
  };

  const throttledView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: pageTitle, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [
          {
            type: 'stack', direction: 'vertical', gap: 'sm',
            children: [
              { type: 'typography', content: 'Requests', variant: 'caption' },
              { type: 'typography', content: '@entity.count', variant: 'h4' },
              { type: 'badge', label: 'Throttled' },
            ],
          },
        ],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'Reset', event: 'RESET', variant: 'primary', icon: 'rotate-ccw' },
        ],
      },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'open', isInitial: true },
        { name: 'throttled' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'REQUEST', name: 'Request' },
        { key: 'THROTTLE', name: 'Throttle' },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions: [
        // INIT: open -> open
        {
          from: 'open', to: 'open', event: 'INIT',
          effects: [
            ['render-ui', 'main', openView],
          ],
        },
        // REQUEST: open -> open (self-loop, increment count)
        {
          from: 'open', to: 'open', event: 'REQUEST',
          effects: [
            ['render-ui', 'main', openView],
          ],
        },
        // THROTTLE: open -> throttled
        {
          from: 'open', to: 'throttled', event: 'THROTTLE',
          effects: [
            ['set', '@entity.limiterStatus', 'throttled'],
            ['render-ui', 'main', throttledView],
          ],
        },
        // RESET: throttled -> open
        {
          from: 'throttled', to: 'open', event: 'RESET',
          effects: [
            ['set', '@entity.limiterStatus', 'open'],
            ['set', '@entity.count', 0],
            ['render-ui', 'main', openView],
          ],
        },
        // INIT: throttled -> throttled (self-loop)
        {
          from: 'throttled', to: 'throttled', event: 'INIT',
          effects: [
            ['render-ui', 'main', throttledView],
          ],
        },
        // RESET: open -> open (self-loop, reset count)
        {
          from: 'open', to: 'open', event: 'RESET',
          effects: [
            ['set', '@entity.count', 0],
            ['set', '@entity.limiterStatus', 'open'],
            ['render-ui', 'main', openView],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: RateLimiterConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdRateLimiterEntity(params: StdRateLimiterParams): Entity {
  return buildEntity(resolve(params));
}

export function stdRateLimiterTrait(params: StdRateLimiterParams): Trait {
  return buildTrait(resolve(params));
}

export function stdRateLimiterPage(params: StdRateLimiterParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdRateLimiter(params: StdRateLimiterParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
