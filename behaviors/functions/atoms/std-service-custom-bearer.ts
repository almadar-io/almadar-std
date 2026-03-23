/**
 * std-service-custom-bearer
 *
 * Custom REST API behavior with Bearer token authentication.
 * Tests the schema-level service declaration pattern with bearer auth.
 * Pure function: params in, OrbitalDefinition out.
 *
 * @level atom
 * @family service
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdServiceCustomBearerParams {
  entityName?: string;
  fields?: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  standalone?: boolean;

  /** The custom API base URL (required) */
  baseUrl: string;

  /** Environment variable holding the bearer token */
  secretEnvVar?: string;

  // Page
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface CustomBearerConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  standalone: boolean;
  baseUrl: string;
  secretEnvVar: string;
  traitName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdServiceCustomBearerParams): CustomBearerConfig {
  const entityName = params.entityName ?? 'ApiCall';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'endpoint', type: 'string' },
    { name: 'method', type: 'string', default: 'GET' },
    { name: 'requestBody', type: 'string' },
    { name: 'responseData', type: 'string' },
    { name: 'statusCode', type: 'number', default: 0 },
    { name: 'callStatus', type: 'string', default: 'idle' },
    { name: 'error', type: 'string' },
  ];

  const baseFields = params.fields ?? [];
  const existingNames = new Set(baseFields.map(f => f.name));
  const mergedFields = [
    ...baseFields,
    ...requiredFields.filter(f => !existingNames.has(f.name)),
  ];
  const fields = ensureIdField(mergedFields);

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    standalone: params.standalone ?? true,
    baseUrl: params.baseUrl,
    secretEnvVar: params.secretEnvVar ?? 'CUSTOM_BEARER_TOKEN',
    traitName: `${entityName}CustomBearer`,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: CustomBearerConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: CustomBearerConfig): Trait {
  const { entityName, standalone } = c;

  // idle: API tester form (only when standalone)
  const idleChildren: unknown[] = [
    { type: 'icon', name: 'shield', size: 'lg' },
    { type: 'typography', content: 'Bearer API Tester', variant: 'h2' },
    {
      type: 'input',
      field: 'endpoint',
      placeholder: '/users',
      bind: '@entity.endpoint',
    },
    {
      type: 'select',
      field: 'method',
      bind: '@entity.method',
      options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' },
      ],
    },
    {
      type: 'textarea',
      field: 'requestBody',
      placeholder: '{"key":"value"}',
      bind: '@entity.requestBody',
    },
    { type: 'button', label: 'Send Request', event: 'CALL_API', variant: 'primary', icon: 'send' },
  ];

  const idleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: idleChildren,
  };

  // calling: loading state
  const callingUI = {
    type: 'loading-state', title: 'Calling API...', message: `Sending request to ${entityName.toLowerCase()} endpoint...`,
  };

  // complete: response viewer
  const completeUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'typography', content: 'Response', variant: 'h2' },
      { type: 'badge', content: '@entity.statusCode', variant: 'info' },
      { type: 'code', content: '@entity.responseData', language: 'json' },
      { type: 'button', label: 'New Request', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  // error: error state
  const errorUI = {
    type: 'error-state', title: 'Request Failed', message: '@entity.error', onRetry: 'RETRY',
  };

  const initEffects: unknown[] = [['fetch', entityName]];
  if (standalone) {
    initEffects.push(['render-ui', 'main', idleUI]);
  }

  const transitions: unknown[] = [
    // INIT: idle -> idle
    {
      from: 'idle', to: 'idle', event: 'INIT',
      effects: initEffects,
    },
    // CALL_API: idle -> calling
    {
      from: 'idle', to: 'calling', event: 'CALL_API',
      effects: [
        ['render-ui', 'main', callingUI],
        ['call-service', 'custom-bearer-api', 'execute', {
          endpoint: '@entity.endpoint',
          method: '@entity.method',
          body: '@entity.requestBody',
        }],
      ],
    },
    // API_RESPONSE: calling -> complete
    {
      from: 'calling', to: 'complete', event: 'API_RESPONSE',
      effects: [
        ['set', '@entity.responseData', '@payload.data'],
        ['set', '@entity.statusCode', '@payload.statusCode'],
        ['render-ui', 'main', completeUI],
      ],
    },
    // FAILED: calling -> error
    {
      from: 'calling', to: 'error', event: 'FAILED',
      effects: [
        ['set', '@entity.error', '@payload.error'],
        ['render-ui', 'main', errorUI],
      ],
    },
    // RETRY: error -> idle
    {
      from: 'error', to: 'idle', event: 'RETRY',
      effects: [['render-ui', 'main', idleUI]],
    },
    // RESET: complete -> idle
    {
      from: 'complete', to: 'idle', event: 'RESET',
      effects: [['render-ui', 'main', idleUI]],
    },
    // RESET: error -> idle
    {
      from: 'error', to: 'idle', event: 'RESET',
      effects: [['render-ui', 'main', idleUI]],
    },
  ];

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'calling' },
        { name: 'complete' },
        { name: 'error' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'CALL_API', name: 'Call API' },
        { key: 'API_RESPONSE', name: 'API Response', payload: [
          { name: 'data', type: 'string', required: true },
          { name: 'statusCode', type: 'number', required: true },
        ]},
        { key: 'FAILED', name: 'Failed', payload: [
          { name: 'error', type: 'string', required: true },
        ]},
        { key: 'RETRY', name: 'Retry' },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions,
    },
  } as Trait;
}

function buildPage(c: CustomBearerConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdServiceCustomBearerEntity(params: StdServiceCustomBearerParams): Entity {
  return buildEntity(resolve(params));
}

export function stdServiceCustomBearerTrait(params: StdServiceCustomBearerParams): Trait {
  return buildTrait(resolve(params));
}

export function stdServiceCustomBearerPage(params: StdServiceCustomBearerParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdServiceCustomBearer(params: StdServiceCustomBearerParams): OrbitalDefinition {
  const c = resolve(params);
  const orbital = makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
  // Attach custom service declaration with bearer auth
  return {
    ...orbital,
    services: [{
      name: 'custom-bearer-api',
      type: 'rest' as const,
      baseUrl: c.baseUrl,
      auth: {
        type: 'bearer' as const,
        secretEnv: c.secretEnvVar,
      },
    }],
  };
}
