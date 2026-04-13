/**
 * std-service-redis
 *
 * Redis cache integration behavior: get, set, delete with TTL support.
 * Wraps the `redis` service with separate events for each operation.
 * Pure function: params in, OrbitalDefinition out.
 *
 * @level atom
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

import type { OrbitalDefinition, OrbitalSchema, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, makeSchema, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdServiceRedisParams {
  /** Entity name in PascalCase (default: "CacheEntry") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, redis fields are always included) */
  fields?: EntityField[];
  /** Persistence mode */
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** When true, INIT renders the cache form to main. Default true. */
  standalone?: boolean;
  /** Page name override */
  pageName?: string;
  /** Page path override */
  pagePath?: string;
  /** Whether this page is the initial route */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface RedisConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  standalone: boolean;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdServiceRedisParams): RedisConfig {
  const entityName = params.entityName ?? 'CacheEntry';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'key', type: 'string' },
    { name: 'value', type: 'string' },
    { name: 'ttl', type: 'number', default: 3600 },
    { name: 'result', type: 'string' },
    { name: 'redisStatus', type: 'string', default: 'idle' },
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
    traitName: `${entityName}Redis`,
    standalone: params.standalone ?? true,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: RedisConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: RedisConfig): Trait {
  const { entityName, standalone } = c;

  // ---- UI definitions ----

  const idleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'icon', name: 'database', size: 'lg' },
          { type: 'typography', content: 'Redis Cache', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'stack', direction: 'vertical', gap: 'md',
        children: [
          { type: 'input', label: 'Key', bind: '@entity.key', placeholder: 'cache-key' },
          { type: 'input', label: 'Value', bind: '@entity.value', placeholder: 'cache-value' },
          { type: 'input', label: 'TTL (seconds)', bind: '@entity.ttl', inputType: 'number', placeholder: '3600' },
        ],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'Get', event: 'GET_KEY', variant: 'primary', icon: 'download' },
          { type: 'button', label: 'Set', event: 'SET_KEY', variant: 'primary', icon: 'upload' },
          { type: 'button', label: 'Delete', event: 'DELETE_KEY', variant: 'destructive', icon: 'trash-2' },
        ],
      },
    ],
  };

  const executingUI = {
    type: 'loading-state', title: 'Executing...', message: 'Running redis operation...',
  };

  const completeUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'alert', variant: 'success', message: 'Operation complete' },
      { type: 'typography', variant: 'body', color: 'muted', content: '@entity.result' },
      { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  const errorUI = {
    type: 'error-state', title: 'Redis Error', message: '@entity.error', onRetry: 'RESET',
  };

  // ---- Transitions ----

  const initEffects: unknown[] = [['fetch', entityName]];
  if (standalone) {
    initEffects.push(['render-ui', 'main', idleUI]);
  }

  const transitions: unknown[] = [
    // INIT: idle -> idle (fetch + render if standalone)
    {
      from: 'idle', to: 'idle', event: 'INIT',
      effects: initEffects,
    },
    // GET_KEY: idle -> executing (call redis get)
    {
      from: 'idle', to: 'executing', event: 'GET_KEY',
      effects: [
        ['render-ui', 'main', executingUI],
        ['call-service', 'redis', 'get', { key: '@entity.key' }],
      ],
    },
    // SET_KEY: idle -> executing (call redis set)
    {
      from: 'idle', to: 'executing', event: 'SET_KEY',
      effects: [
        ['render-ui', 'main', executingUI],
        ['call-service', 'redis', 'set', { key: '@entity.key', value: '@entity.value', ttl: '@entity.ttl' }],
      ],
    },
    // DELETE_KEY: idle -> executing (call redis delete)
    {
      from: 'idle', to: 'executing', event: 'DELETE_KEY',
      effects: [
        ['render-ui', 'main', executingUI],
        ['call-service', 'redis', 'delete', { key: '@entity.key' }],
      ],
    },
    // EXECUTED: executing -> complete (store result)
    {
      from: 'executing', to: 'complete', event: 'EXECUTED',
      effects: [
        ['set', '@entity.result', '@payload.data'],
        ['render-ui', 'main', completeUI],
      ],
    },
    // FAILED: executing -> error
    {
      from: 'executing', to: 'error', event: 'FAILED',
      effects: [
        ['set', '@entity.error', '@payload.error'],
        ['render-ui', 'main', errorUI],
      ],
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
        { name: 'executing' },
        { name: 'complete' },
        { name: 'error' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'GET_KEY', name: 'Get Key' },
        { key: 'SET_KEY', name: 'Set Key' },
        { key: 'DELETE_KEY', name: 'Delete Key' },
        { key: 'EXECUTED', name: 'Executed', payload: [
          { name: 'data', type: 'string', required: true },
        ]},
        { key: 'FAILED', name: 'Failed', payload: [
          { name: 'error', type: 'string', required: true },
        ]},
        { key: 'RESET', name: 'Reset' },
      ],
      transitions,
    },
  } as Trait;
}

function buildPage(c: RedisConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdServiceRedisEntity(params: StdServiceRedisParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdServiceRedisTrait(params: StdServiceRedisParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdServiceRedisPage(params: StdServiceRedisParams = {}): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdServiceRedis(params: StdServiceRedisParams = {}): OrbitalSchema {
  const c = resolve(params);
  return makeSchema(`${c.entityName}Orbital`, makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  ));
}
