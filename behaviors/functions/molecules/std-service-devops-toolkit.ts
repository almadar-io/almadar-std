/**
 * std-service-devops-toolkit
 *
 * DevOps toolkit molecule. Three independent traits on a single page
 * sharing one entity via the event bus:
 * - GitHubTrait: PR creation flow (ghIdle -> creatingPR -> prCreated / ghError)
 * - RedisTrait: cache get/set/delete (redisIdle -> redisExecuting -> redisComplete / redisError)
 * - StorageTrait: file upload/download/list/delete (storageIdle -> storageExecuting -> storageComplete / storageError)
 *
 * Each trait renders its own UI section. No cross-trait events needed (independent flows).
 *
 * @level molecule
 * @family service
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdServiceDevopsToolkitParams {
  /** Entity name in PascalCase (default: "DevopsTool") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, required fields are always included) */
  fields?: EntityField[];
  /** Persistence mode */
  persistence?: 'persistent' | 'runtime' | 'singleton';
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

interface DevopsToolkitConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdServiceDevopsToolkitParams): DevopsToolkitConfig {
  const entityName = params.entityName ?? 'DevopsTool';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    // GitHub PR fields
    { name: 'title', type: 'string', default: '' },
    { name: 'body', type: 'string', default: '' },
    { name: 'head', type: 'string', default: '' },
    { name: 'base', type: 'string', default: 'main' },
    { name: 'prUrl', type: 'string', default: '' },
    // Redis cache fields
    { name: 'cacheKey', type: 'string', default: '' },
    { name: 'cacheValue', type: 'string', default: '' },
    // Storage fields
    { name: 'bucket', type: 'string', default: 'uploads' },
    { name: 'fileKey', type: 'string', default: '' },
    // Shared fields
    { name: 'result', type: 'string', default: '' },
    { name: 'toolStatus', type: 'string', default: 'idle' },
    { name: 'activeTab', type: 'string', default: 'github' },
    { name: 'error', type: 'string', default: '' },
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
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Trait builders
// ============================================================================

function buildGithubTrait(c: DevopsToolkitConfig): Trait {
  const { entityName } = c;

  const ghIdleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'icon', name: 'git-pull-request', size: 'lg' },
          { type: 'typography', content: 'GitHub: Create PR', variant: 'h3' },
        ],
      },
      { type: 'divider' },
      { type: 'input', label: 'Title', bind: '@entity.title', placeholder: 'PR title' },
      { type: 'textarea', label: 'Body', bind: '@entity.body', placeholder: 'Describe your changes...' },
      { type: 'input', label: 'Head Branch', bind: '@entity.head', placeholder: 'feature-branch' },
      { type: 'input', label: 'Base Branch', bind: '@entity.base', placeholder: 'main' },
      { type: 'button', label: 'Create PR', event: 'CREATE_PR', variant: 'primary', icon: 'git-pull-request' },
    ],
  };

  const creatingPRUI = {
    type: 'loading-state', title: 'Creating pull request...', message: 'Submitting your PR to GitHub.',
  };

  const prCreatedUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'alert', variant: 'success', message: 'Pull request created!' },
      { type: 'typography', variant: 'body', color: 'muted', content: '@entity.prUrl' },
      { type: 'button', label: 'Create Another', event: 'GH_RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  const ghErrorUI = {
    type: 'error-state', title: 'PR Creation Failed', message: '@entity.error', onRetry: 'GH_RETRY',
  };

  const transitions: unknown[] = [
    {
      from: 'ghIdle', to: 'ghIdle', event: 'INIT',
      effects: [
        ['fetch', entityName],
        ['render-ui', 'main', ghIdleUI],
      ],
    },
    {
      from: 'ghIdle', to: 'creatingPR', event: 'CREATE_PR',
      effects: [
        ['render-ui', 'main', creatingPRUI],
        ['call-service', 'github', 'createPR', {
          title: '@entity.title',
          body: '@entity.body',
          head: '@entity.head',
          base: '@entity.base',
        }],
      ],
    },
    {
      from: 'creatingPR', to: 'prCreated', event: 'PR_CREATED',
      effects: [
        ['set', '@entity.prUrl', '@payload.url'],
        ['set', '@entity.toolStatus', 'pr-created'],
        ['render-ui', 'main', prCreatedUI],
      ],
    },
    {
      from: 'creatingPR', to: 'ghError', event: 'GH_FAILED',
      effects: [
        ['set', '@entity.error', '@payload.error'],
        ['set', '@entity.toolStatus', 'error'],
        ['render-ui', 'main', ghErrorUI],
      ],
    },
    {
      from: 'ghError', to: 'ghIdle', event: 'GH_RETRY',
      effects: [
        ['set', '@entity.toolStatus', 'idle'],
        ['render-ui', 'main', ghIdleUI],
      ],
    },
    {
      from: 'prCreated', to: 'ghIdle', event: 'GH_RESET',
      effects: [
        ['set', '@entity.toolStatus', 'idle'],
        ['render-ui', 'main', ghIdleUI],
      ],
    },
  ];

  return {
    name: `${entityName}Github`,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'ghIdle', isInitial: true },
        { name: 'creatingPR' },
        { name: 'prCreated' },
        { name: 'ghError' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'CREATE_PR', name: 'Create Pull Request' },
        { key: 'PR_CREATED', name: 'PR Created', payload: [
          { name: 'url', type: 'string', required: true },
        ] },
        { key: 'GH_FAILED', name: 'GitHub Failed', payload: [
          { name: 'error', type: 'string', required: true },
        ] },
        { key: 'GH_RETRY', name: 'GitHub Retry' },
        { key: 'GH_RESET', name: 'GitHub Reset' },
      ],
      transitions,
    },
  } as Trait;
}

function buildRedisTrait(c: DevopsToolkitConfig): Trait {
  const { entityName } = c;

  const redisIdleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'icon', name: 'database', size: 'lg' },
          { type: 'typography', content: 'Redis Cache', variant: 'h3' },
        ],
      },
      { type: 'divider' },
      { type: 'input', label: 'Key', bind: '@entity.cacheKey', placeholder: 'cache-key' },
      { type: 'input', label: 'Value', bind: '@entity.cacheValue', placeholder: 'cache-value' },
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

  const redisExecutingUI = {
    type: 'loading-state', title: 'Executing...', message: 'Running Redis operation...',
  };

  const redisCompleteUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'alert', variant: 'success', message: 'Redis operation complete' },
      { type: 'typography', variant: 'body', color: 'muted', content: '@entity.result' },
      { type: 'button', label: 'Reset', event: 'REDIS_RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  const redisErrorUI = {
    type: 'error-state', title: 'Redis Error', message: '@entity.error', onRetry: 'REDIS_RETRY',
  };

  const transitions: unknown[] = [
    {
      from: 'redisIdle', to: 'redisIdle', event: 'INIT',
      effects: [
        ['fetch', entityName],
        ['render-ui', 'main', redisIdleUI],
      ],
    },
    {
      from: 'redisIdle', to: 'redisExecuting', event: 'GET_KEY',
      effects: [
        ['render-ui', 'main', redisExecutingUI],
        ['call-service', 'redis', 'get', { key: '@entity.cacheKey' }],
      ],
    },
    {
      from: 'redisIdle', to: 'redisExecuting', event: 'SET_KEY',
      effects: [
        ['render-ui', 'main', redisExecutingUI],
        ['call-service', 'redis', 'set', { key: '@entity.cacheKey', value: '@entity.cacheValue' }],
      ],
    },
    {
      from: 'redisIdle', to: 'redisExecuting', event: 'DELETE_KEY',
      effects: [
        ['render-ui', 'main', redisExecutingUI],
        ['call-service', 'redis', 'delete', { key: '@entity.cacheKey' }],
      ],
    },
    {
      from: 'redisExecuting', to: 'redisComplete', event: 'REDIS_DONE',
      effects: [
        ['set', '@entity.result', '@payload.data'],
        ['set', '@entity.toolStatus', 'redis-complete'],
        ['render-ui', 'main', redisCompleteUI],
      ],
    },
    {
      from: 'redisExecuting', to: 'redisError', event: 'REDIS_FAILED',
      effects: [
        ['set', '@entity.error', '@payload.error'],
        ['set', '@entity.toolStatus', 'error'],
        ['render-ui', 'main', redisErrorUI],
      ],
    },
    {
      from: 'redisComplete', to: 'redisIdle', event: 'REDIS_RESET',
      effects: [
        ['set', '@entity.toolStatus', 'idle'],
        ['render-ui', 'main', redisIdleUI],
      ],
    },
    {
      from: 'redisError', to: 'redisIdle', event: 'REDIS_RETRY',
      effects: [
        ['set', '@entity.toolStatus', 'idle'],
        ['render-ui', 'main', redisIdleUI],
      ],
    },
  ];

  return {
    name: `${entityName}Redis`,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'redisIdle', isInitial: true },
        { name: 'redisExecuting' },
        { name: 'redisComplete' },
        { name: 'redisError' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'GET_KEY', name: 'Get Key' },
        { key: 'SET_KEY', name: 'Set Key' },
        { key: 'DELETE_KEY', name: 'Delete Key' },
        { key: 'REDIS_DONE', name: 'Redis Done', payload: [
          { name: 'data', type: 'string', required: true },
        ] },
        { key: 'REDIS_FAILED', name: 'Redis Failed', payload: [
          { name: 'error', type: 'string', required: true },
        ] },
        { key: 'REDIS_RESET', name: 'Redis Reset' },
        { key: 'REDIS_RETRY', name: 'Redis Retry' },
      ],
      transitions,
    },
  } as Trait;
}

function buildStorageTrait(c: DevopsToolkitConfig): Trait {
  const { entityName } = c;

  const storageIdleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'icon', name: 'hard-drive', size: 'lg' },
          { type: 'typography', content: 'Storage Files', variant: 'h3' },
        ],
      },
      { type: 'divider' },
      { type: 'input', label: 'Bucket', bind: '@entity.bucket', placeholder: 'bucket-name' },
      { type: 'input', label: 'File Key', bind: '@entity.fileKey', placeholder: 'path/to/file.txt' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'Upload', event: 'UPLOAD', variant: 'primary', icon: 'upload' },
          { type: 'button', label: 'Download', event: 'DOWNLOAD', variant: 'secondary', icon: 'download' },
          { type: 'button', label: 'List', event: 'LIST', variant: 'secondary', icon: 'list' },
          { type: 'button', label: 'Delete', event: 'DELETE_FILE', variant: 'destructive', icon: 'trash-2' },
        ],
      },
    ],
  };

  const storageExecutingUI = {
    type: 'loading-state', title: 'Processing...', message: 'Executing storage operation...',
  };

  const storageCompleteUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'alert', variant: 'success', message: 'Storage operation complete' },
      { type: 'typography', variant: 'body', color: 'muted', content: '@entity.result' },
      { type: 'button', label: 'Back', event: 'STORAGE_RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  const storageErrorUI = {
    type: 'error-state', title: 'Storage Error', message: '@entity.error', onRetry: 'STORAGE_RETRY',
  };

  const transitions: unknown[] = [
    {
      from: 'storageIdle', to: 'storageIdle', event: 'INIT',
      effects: [
        ['fetch', entityName],
        ['render-ui', 'main', storageIdleUI],
      ],
    },
    {
      from: 'storageIdle', to: 'storageExecuting', event: 'UPLOAD',
      effects: [
        ['render-ui', 'main', storageExecutingUI],
        ['call-service', 'storage', 'upload', {
          bucket: '@entity.bucket',
          key: '@entity.fileKey',
        }],
      ],
    },
    {
      from: 'storageIdle', to: 'storageExecuting', event: 'DOWNLOAD',
      effects: [
        ['render-ui', 'main', storageExecutingUI],
        ['call-service', 'storage', 'download', {
          bucket: '@entity.bucket',
          key: '@entity.fileKey',
        }],
      ],
    },
    {
      from: 'storageIdle', to: 'storageExecuting', event: 'LIST',
      effects: [
        ['render-ui', 'main', storageExecutingUI],
        ['call-service', 'storage', 'list', {
          bucket: '@entity.bucket',
        }],
      ],
    },
    {
      from: 'storageIdle', to: 'storageExecuting', event: 'DELETE_FILE',
      effects: [
        ['render-ui', 'main', storageExecutingUI],
        ['call-service', 'storage', 'delete', {
          bucket: '@entity.bucket',
          key: '@entity.fileKey',
        }],
      ],
    },
    {
      from: 'storageExecuting', to: 'storageComplete', event: 'STORAGE_DONE',
      effects: [
        ['set', '@entity.result', '@payload.data'],
        ['set', '@entity.toolStatus', 'storage-complete'],
        ['render-ui', 'main', storageCompleteUI],
      ],
    },
    {
      from: 'storageExecuting', to: 'storageError', event: 'STORAGE_FAILED',
      effects: [
        ['set', '@entity.error', '@payload.error'],
        ['set', '@entity.toolStatus', 'error'],
        ['render-ui', 'main', storageErrorUI],
      ],
    },
    {
      from: 'storageComplete', to: 'storageIdle', event: 'STORAGE_RESET',
      effects: [
        ['set', '@entity.toolStatus', 'idle'],
        ['render-ui', 'main', storageIdleUI],
      ],
    },
    {
      from: 'storageError', to: 'storageIdle', event: 'STORAGE_RETRY',
      effects: [
        ['set', '@entity.toolStatus', 'idle'],
        ['render-ui', 'main', storageIdleUI],
      ],
    },
  ];

  return {
    name: `${entityName}Storage`,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'storageIdle', isInitial: true },
        { name: 'storageExecuting' },
        { name: 'storageComplete' },
        { name: 'storageError' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'UPLOAD', name: 'Upload File' },
        { key: 'DOWNLOAD', name: 'Download File' },
        { key: 'LIST', name: 'List Files' },
        { key: 'DELETE_FILE', name: 'Delete File' },
        { key: 'STORAGE_DONE', name: 'Storage Done', payload: [
          { name: 'data', type: 'string', required: true },
        ] },
        { key: 'STORAGE_FAILED', name: 'Storage Failed', payload: [
          { name: 'error', type: 'string', required: true },
        ] },
        { key: 'STORAGE_RESET', name: 'Storage Reset' },
        { key: 'STORAGE_RETRY', name: 'Storage Retry' },
      ],
      transitions,
    },
  } as Trait;
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdServiceDevopsToolkitEntity(params: StdServiceDevopsToolkitParams = {}): Entity {
  const c = resolve(params);
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

export function stdServiceDevopsToolkitPage(params: StdServiceDevopsToolkitParams = {}): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: `${c.entityName}Github` },
      { ref: `${c.entityName}Redis` },
      { ref: `${c.entityName}Storage` },
    ],
  } as Page;
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdServiceDevopsToolkit(params: StdServiceDevopsToolkitParams = {}): OrbitalDefinition {
  const c = resolve(params);

  const githubTrait = buildGithubTrait(c);
  const redisTrait = buildRedisTrait(c);
  const storageTrait = buildStorageTrait(c);

  const entity = makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });

  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: githubTrait.name },
      { ref: redisTrait.name },
      { ref: storageTrait.name },
    ],
  } as Page;

  return {
    name: `${c.entityName}Orbital`,
    entity,
    traits: [githubTrait, redisTrait, storageTrait],
    pages: [page],
  } as OrbitalDefinition;
}
