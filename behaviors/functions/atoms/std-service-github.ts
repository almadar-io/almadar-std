/**
 * std-service-github
 *
 * GitHub service integration behavior: idle, creatingPR, prCreated, error.
 * Wraps the `github` integration (listIssues, createPR) with a PR creation flow.
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

export interface StdServiceGithubParams {
  /** Entity name in PascalCase (default: "PullRequest") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, GitHub fields are always included) */
  fields?: EntityField[];
  /** Persistence mode */
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** When true, INIT renders the PR form to main. Default true. */
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

interface GithubConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  standalone: boolean;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdServiceGithubParams): GithubConfig {
  const entityName = params.entityName ?? 'PullRequest';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'title', type: 'string' },
    { name: 'body', type: 'string' },
    { name: 'head', type: 'string' },
    { name: 'base', type: 'string', default: 'main' },
    { name: 'prUrl', type: 'string' },
    { name: 'prNumber', type: 'number', default: 0 },
    { name: 'ghStatus', type: 'string', default: 'idle' },
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
    traitName: `${entityName}Github`,
    standalone: params.standalone ?? true,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: GithubConfig): Entity {
  const githubFields: EntityField[] = [
    { name: 'title', type: 'string' as const, default: '' },
    { name: 'body', type: 'string' as const, default: '' },
    { name: 'head', type: 'string' as const, default: '' },
    { name: 'base', type: 'string' as const, default: 'main' },
    { name: 'prUrl', type: 'string' as const, default: '' },
    { name: 'prNumber', type: 'number' as const, default: 0 },
    { name: 'ghStatus', type: 'string' as const, default: 'idle' },
    { name: 'error', type: 'string' as const, default: '' },
  ];

  // Merge: GitHub fields first, then any extra user fields (skip duplicates)
  const githubFieldNames = new Set(githubFields.map(f => f.name));
  const extraFields = c.fields.filter(f => f.name !== 'id' && !githubFieldNames.has(f.name));
  const allFields = ensureIdField([...githubFields, ...extraFields]);

  return makeEntity({ name: c.entityName, fields: allFields, persistence: c.persistence });
}

function buildTrait(c: GithubConfig): Trait {
  const { entityName, standalone } = c;

  // ---- UI definitions ----

  const idleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'icon', name: 'git-pull-request', size: 'lg' },
          { type: 'typography', content: 'Create Pull Request', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'stack', direction: 'vertical', gap: 'md',
        children: [
          { type: 'input', label: 'Title', field: 'title', placeholder: 'PR title' },
          { type: 'textarea', label: 'Body', field: 'body', placeholder: 'Describe your changes...' },
          { type: 'input', label: 'Head Branch', field: 'head', placeholder: 'feature-branch' },
          { type: 'input', label: 'Base Branch', field: 'base', placeholder: 'main' },
        ],
      },
      { type: 'button', label: 'Create PR', event: 'CREATE_PR', variant: 'primary', icon: 'git-pull-request' },
    ],
  };

  const creatingUI = {
    type: 'loading-state', title: 'Creating pull request...', message: 'Submitting your PR to GitHub.',
  };

  const prCreatedUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'alert', variant: 'success', message: 'Pull request created!' },
      { type: 'typography', variant: 'body', color: 'muted', content: '@entity.prUrl' },
      { type: 'button', label: 'Create Another', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  const errorUI = {
    type: 'error-state', title: 'PR Creation Failed', message: '@entity.error', onRetry: 'RETRY',
  };

  // ---- Transitions ----

  const transitions: unknown[] = [
    // INIT: idle -> idle (fetch + render form if standalone)
    {
      from: 'idle', to: 'idle', event: 'INIT',
      effects: [
        ...(standalone ? [['fetch', entityName], ['render-ui', 'main', idleUI]] : [['fetch', entityName]]),
      ],
    },
    // CREATE_PR: idle -> creatingPR (call github createPR + show loading)
    {
      from: 'idle', to: 'creatingPR', event: 'CREATE_PR',
      effects: [
        ['render-ui', 'main', creatingUI],
        ['call-service', 'github', 'createPR', {
          title: '@entity.title',
          body: '@entity.body',
          head: '@entity.head',
          base: '@entity.base',
        }],
      ],
    },
    // PR_CREATED: creatingPR -> prCreated (persist PR data + show success)
    {
      from: 'creatingPR', to: 'prCreated', event: 'PR_CREATED',
      effects: [
        ['set', '@entity.prUrl', '@payload.url'],
        ['set', '@entity.prNumber', '@payload.number'],
        ['set', '@entity.ghStatus', 'created'],
        ['render-ui', 'main', prCreatedUI],
      ],
    },
    // FAILED: creatingPR -> error
    {
      from: 'creatingPR', to: 'error', event: 'FAILED',
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
    // RESET: prCreated -> idle
    {
      from: 'prCreated', to: 'idle', event: 'RESET',
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
        { name: 'creatingPR' },
        { name: 'prCreated' },
        { name: 'error' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'CREATE_PR', name: 'Create Pull Request' },
        { key: 'PR_CREATED', name: 'PR Created', payload: [
          { name: 'url', type: 'string', required: true },
          { name: 'number', type: 'number', required: true },
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

function buildPage(c: GithubConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdServiceGithubEntity(params: StdServiceGithubParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdServiceGithubTrait(params: StdServiceGithubParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdServiceGithubPage(params: StdServiceGithubParams = {}): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdServiceGithub(params: StdServiceGithubParams = {}): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
