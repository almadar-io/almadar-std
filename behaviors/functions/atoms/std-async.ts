/**
 * std-async
 *
 * Async operation behavior: idle, loading, success, error.
 * Covers fetch, submit, retry, and polling patterns in one molecule.
 * Pure function: params in, OrbitalDefinition out.
 *
 * @level molecule
 * @family async
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdAsyncParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;

  // Labels
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;

  // Icons
  headerIcon?: string;

  // Options
  retryable?: boolean;

  // Page
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface AsyncConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  traitName: string;
  loadingMessage: string;
  successMessage: string;
  errorMessage: string;
  headerIcon: string;
  retryable: boolean;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdAsyncParams): AsyncConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const p = plural(entityName);

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    collection: params.collection,
    traitName: `${entityName}Async`,
    loadingMessage: params.loadingMessage ?? 'Loading...',
    successMessage: params.successMessage ?? 'Operation completed successfully.',
    errorMessage: params.errorMessage ?? 'An error occurred. Please try again.',
    headerIcon: params.headerIcon ?? 'loader',
    retryable: params.retryable ?? true,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: AsyncConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection });
}

function buildTrait(c: AsyncConfig): Trait {
  const { entityName, headerIcon, loadingMessage, successMessage, errorMessage, retryable } = c;

  // Idle view with descriptive prompt
  const idleUI = {
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
      { type: 'typography', variant: 'body', color: 'muted', content: `Ready to start ${entityName.toLowerCase()} operation.` },
      { type: 'button', label: 'Start', event: 'START', variant: 'primary', icon: 'play' },
    ],
  };

  // Loading view: loading-state molecule + skeleton placeholder
  const loadingUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'loading-state', title: loadingMessage, message: `Processing ${entityName.toLowerCase()}...` },
      { type: 'skeleton', variant: 'text' },
    ],
  };

  // Success view: alert molecule
  const successUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'alert', variant: 'success', message: successMessage },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
        ],
      },
    ],
  };

  // Error view: error-state molecule
  const errorButtons: unknown[] = [
    { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
  ];
  if (retryable) {
    errorButtons.unshift({ type: 'button', label: 'Retry', event: 'RETRY', variant: 'primary', icon: 'refresh-cw' });
  }

  const errorUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'error-state', title: 'Operation Failed', message: errorMessage, onRetry: retryable ? 'RETRY' : undefined },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: errorButtons,
      },
    ],
  };

  const transitions: unknown[] = [
    // INIT: idle -> idle
    {
      from: 'idle', to: 'idle', event: 'INIT',
      effects: [
        ['fetch', entityName],
        ['render-ui', 'main', idleUI],
      ],
    },
    // START: idle -> loading
    {
      from: 'idle', to: 'loading', event: 'START',
      effects: [['render-ui', 'main', loadingUI]],
    },
    // LOADED: loading -> success
    {
      from: 'loading', to: 'success', event: 'LOADED',
      effects: [
        ['persist', 'create', entityName, '@payload.data'],
        ['render-ui', 'main', successUI],
      ],
    },
    // FAILED: loading -> error
    {
      from: 'loading', to: 'error', event: 'FAILED',
      effects: [['render-ui', 'main', errorUI]],
    },
    // RESET: success -> idle
    {
      from: 'success', to: 'idle', event: 'RESET',
      effects: [['render-ui', 'main', idleUI]],
    },
    // RESET: error -> idle
    {
      from: 'error', to: 'idle', event: 'RESET',
      effects: [['render-ui', 'main', idleUI]],
    },
  ];

  // RETRY: error -> loading (only if retryable)
  if (retryable) {
    transitions.push({
      from: 'error', to: 'loading', event: 'RETRY',
      effects: [['render-ui', 'main', loadingUI]],
    });
  }

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'loading' },
        { name: 'success' },
        { name: 'error' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'START', name: 'Start' },
        { key: 'LOADED', name: 'Loaded', payload: [{ name: 'data', type: 'object', required: true }] },
        { key: 'FAILED', name: 'Failed', payload: [{ name: 'error', type: 'string', required: true }] },
        { key: 'RETRY', name: 'Retry' },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions,
    },
  } as Trait;
}

function buildPage(c: AsyncConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdAsyncEntity(params: StdAsyncParams): Entity {
  return buildEntity(resolve(params));
}

export function stdAsyncTrait(params: StdAsyncParams): Trait {
  return buildTrait(resolve(params));
}

export function stdAsyncPage(params: StdAsyncParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdAsync(params: StdAsyncParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
