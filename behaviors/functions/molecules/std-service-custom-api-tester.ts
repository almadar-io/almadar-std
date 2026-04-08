/**
 * std-service-custom-api-tester
 *
 * Unified API tester molecule that exercises all 4 custom REST auth patterns
 * (header API key, bearer token, query param API key, no auth) with a tab
 * selector. Single entity, single trait, 4 call events.
 * Pure function: params in, OrbitalDefinition out.
 *
 * @level molecule
 * @family service
 * @packageDocumentation
 *
 * @deprecated The TypeScript factory layer is deprecated as of Phase F.10
 * (2026-04-08). The canonical source for std behaviors is now the registry
 * `.orb` file at `packages/almadar-std/behaviors/registry/<level>/<name>.orb`,
 * which is generated from this TS source by `tools/almadar-behavior-ts-to-orb/`
 * and consumed by the compiler's embedded loader.
 *
 * Consumers should import behaviors via `.lolo`/`.orb` `uses` declarations and
 * reference them as `Alias.entity` / `Alias.traits.X` / `Alias.pages.X`, applying
 * overrides at the call site (`linkedEntity`, `name`, `events`, `effects`,
 * `listens`, `emitsScope`). The TS `*Params` interface and the exported factory
 * functions remain ONLY as the authoring path for the converter; they are NOT a
 * stable public API and may change without notice.
 *
 * See `docs/Almadar_Orb_Behaviors.md` for the orbital-as-function model and
 * `docs/LOLO_Gaps.md` for the migration plan.
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdServiceCustomApiTesterParams {
  entityName?: string;
  fields?: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';

  // Page
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;

  /** Base URL for header-based API key service */
  headerBaseUrl?: string;
  /** Base URL for bearer token service */
  bearerBaseUrl?: string;
  /** Base URL for query-param API key service */
  queryBaseUrl?: string;
  /** Base URL for no-auth service */
  noauthBaseUrl?: string;
}

// ============================================================================
// Resolve
// ============================================================================

interface ApiTesterConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  headerBaseUrl: string;
  bearerBaseUrl: string;
  queryBaseUrl: string;
  noauthBaseUrl: string;
  traitName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdServiceCustomApiTesterParams): ApiTesterConfig {
  const entityName = params.entityName ?? 'ApiTest';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'endpoint', type: 'string' },
    { name: 'method', type: 'string', default: 'GET' },
    { name: 'requestBody', type: 'string' },
    { name: 'responseData', type: 'string' },
    { name: 'statusCode', type: 'number', default: 0 },
    { name: 'authType', type: 'string', default: 'header' },
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
    headerBaseUrl: params.headerBaseUrl ?? 'https://api.example.com/v1',
    bearerBaseUrl: params.bearerBaseUrl ?? 'https://api.example.com/v2',
    queryBaseUrl: params.queryBaseUrl ?? 'https://api.example.com/v3',
    noauthBaseUrl: params.noauthBaseUrl ?? 'https://api.example.com/v4',
    traitName: `${entityName}ApiTester`,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: ApiTesterConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: ApiTesterConfig): Trait {
  const { entityName } = c;

  // Shared form elements for all auth types
  const formChildren: unknown[] = [
    { type: 'icon', name: 'globe', size: 'lg' },
    { type: 'typography', content: 'Unified API Tester', variant: 'h2' },
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
      placeholder: 'Request body (JSON)',
      bind: '@entity.requestBody',
    },
    { type: 'divider' },
    { type: 'typography', content: 'Select Auth Type', variant: 'h4' },
    {
      type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
      children: [
        { type: 'button', label: 'Header API Key', event: 'CALL_HEADER_API', variant: 'primary', icon: 'key' },
        { type: 'button', label: 'Bearer Token', event: 'CALL_BEARER_API', variant: 'primary', icon: 'shield' },
        { type: 'button', label: 'Query Param', event: 'CALL_QUERY_API', variant: 'primary', icon: 'search' },
        { type: 'button', label: 'No Auth', event: 'CALL_NOAUTH_API', variant: 'primary', icon: 'unlock' },
      ],
    },
  ];

  const idleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: formChildren,
  };

  // calling: loading state
  const callingUI = {
    type: 'loading-state', title: 'Calling API...', message: `Sending request to ${entityName.toLowerCase()} endpoint...`,
  };

  // complete: response viewer showing which auth type was used
  const completeUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'typography', content: 'Response', variant: 'h2' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'badge', content: '@entity.authType', variant: 'info' },
          { type: 'badge', content: '@entity.statusCode', variant: 'info' },
        ],
      },
      { type: 'code', content: '@entity.responseData', language: 'json' },
      { type: 'button', label: 'New Request', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  // error: error state
  const errorUI = {
    type: 'error-state', title: 'Request Failed', message: '@entity.error', onRetry: 'RETRY',
  };

  const callServiceArgs = {
    endpoint: '@entity.endpoint',
    method: '@entity.method',
    body: '@entity.requestBody',
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
    // CALL_HEADER_API: idle -> calling
    {
      from: 'idle', to: 'calling', event: 'CALL_HEADER_API',
      effects: [
        ['set', '@entity.authType', 'header'],
        ['render-ui', 'main', callingUI],
        ['call-service', 'custom-header-api', 'execute', callServiceArgs],
      ],
    },
    // CALL_BEARER_API: idle -> calling
    {
      from: 'idle', to: 'calling', event: 'CALL_BEARER_API',
      effects: [
        ['set', '@entity.authType', 'bearer'],
        ['render-ui', 'main', callingUI],
        ['call-service', 'custom-bearer-api', 'execute', callServiceArgs],
      ],
    },
    // CALL_QUERY_API: idle -> calling
    {
      from: 'idle', to: 'calling', event: 'CALL_QUERY_API',
      effects: [
        ['set', '@entity.authType', 'query'],
        ['render-ui', 'main', callingUI],
        ['call-service', 'custom-query-api', 'execute', callServiceArgs],
      ],
    },
    // CALL_NOAUTH_API: idle -> calling
    {
      from: 'idle', to: 'calling', event: 'CALL_NOAUTH_API',
      effects: [
        ['set', '@entity.authType', 'noauth'],
        ['render-ui', 'main', callingUI],
        ['call-service', 'custom-noauth-api', 'execute', callServiceArgs],
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
        { key: 'CALL_HEADER_API', name: 'Call Header API' },
        { key: 'CALL_BEARER_API', name: 'Call Bearer API' },
        { key: 'CALL_QUERY_API', name: 'Call Query API' },
        { key: 'CALL_NOAUTH_API', name: 'Call No-Auth API' },
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

function buildPage(c: ApiTesterConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdServiceCustomApiTesterEntity(params: StdServiceCustomApiTesterParams): Entity {
  return buildEntity(resolve(params));
}

export function stdServiceCustomApiTesterTrait(params: StdServiceCustomApiTesterParams): Trait {
  return buildTrait(resolve(params));
}

export function stdServiceCustomApiTesterPage(params: StdServiceCustomApiTesterParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdServiceCustomApiTester(params: StdServiceCustomApiTesterParams): OrbitalDefinition {
  const c = resolve(params);
  const orbital = makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
  return {
    ...orbital,
    services: [
      {
        name: 'custom-header-api',
        type: 'rest' as const,
        baseUrl: c.headerBaseUrl,
        auth: {
          type: 'api-key' as const,
          keyName: 'X-API-Key',
          location: 'header' as const,
          secretEnv: 'CUSTOM_API_SECRET',
        },
      },
      {
        name: 'custom-bearer-api',
        type: 'rest' as const,
        baseUrl: c.bearerBaseUrl,
        auth: {
          type: 'bearer' as const,
          secretEnv: 'CUSTOM_BEARER_TOKEN',
        },
      },
      {
        name: 'custom-query-api',
        type: 'rest' as const,
        baseUrl: c.queryBaseUrl,
        auth: {
          type: 'api-key' as const,
          keyName: 'api_key',
          location: 'query' as const,
          secretEnv: 'CUSTOM_QUERY_KEY',
        },
      },
      {
        name: 'custom-noauth-api',
        type: 'rest' as const,
        baseUrl: c.noauthBaseUrl,
      },
    ],
  } as OrbitalDefinition;
}
