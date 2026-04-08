/**
 * std-service-oauth
 *
 * OAuth service integration behavior: authorize, token exchange, refresh.
 * Wraps the `oauth` integration with a multi-step authorization flow.
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

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdServiceOauthParams {
  /** Entity name in PascalCase (default: "AuthSession") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, oauth fields are always included) */
  fields?: EntityField[];
  /** Persistence mode */
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** When true, INIT renders the provider picker to main. Default true. */
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

interface OauthConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  standalone: boolean;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdServiceOauthParams): OauthConfig {
  const entityName = params.entityName ?? 'AuthSession';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'provider', type: 'string', default: 'google' },
    { name: 'authUrl', type: 'string' },
    { name: 'accessToken', type: 'string' },
    { name: 'refreshToken', type: 'string' },
    { name: 'authStatus', type: 'string', default: 'unauthenticated' },
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
    traitName: `${entityName}Oauth`,
    standalone: params.standalone ?? true,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: OauthConfig): Entity {
  const oauthFields: EntityField[] = [
    { name: 'provider', type: 'string' as const, default: 'google' },
    { name: 'authUrl', type: 'string' as const, default: '' },
    { name: 'accessToken', type: 'string' as const, default: '' },
    { name: 'refreshToken', type: 'string' as const, default: '' },
    { name: 'authStatus', type: 'string' as const, default: 'unauthenticated' },
    { name: 'error', type: 'string' as const, default: '' },
  ];

  const oauthFieldNames = new Set(oauthFields.map(f => f.name));
  const extraFields = c.fields.filter(f => f.name !== 'id' && !oauthFieldNames.has(f.name));
  const allFields = ensureIdField([...oauthFields, ...extraFields]);

  return makeEntity({ name: c.entityName, fields: allFields, persistence: c.persistence });
}

function buildTrait(c: OauthConfig): Trait {
  const { entityName, standalone } = c;

  // ---- UI definitions ----

  // unauthenticated: provider picker + login button
  const unauthenticatedUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'icon', name: 'lock', size: 'lg' },
          { type: 'typography', content: 'Sign In', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'select', label: 'Provider', field: 'provider', bind: '@entity.provider',
        options: [
          { label: 'Google', value: 'google' },
          { label: 'GitHub', value: 'github' },
          { label: 'Microsoft', value: 'microsoft' },
        ],
      },
      { type: 'button', label: 'Login', event: 'LOGIN', variant: 'primary', icon: 'log-in' },
    ],
  };

  // authorizing: loading spinner
  const authorizingUI = {
    type: 'loading-state', title: 'Authorizing...', message: 'Redirecting to provider for authorization.',
  };

  // authorizing with auth URL: show URL + code input
  const authUrlUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'external-link', size: 'lg' },
      { type: 'typography', content: 'Authorization Required', variant: 'h2' },
      { type: 'typography', content: '@entity.authUrl', variant: 'body', color: 'muted' },
      { type: 'input', label: 'Authorization Code', field: 'code', placeholder: 'Paste authorization code here' },
      { type: 'button', label: 'Submit', event: 'CALLBACK', variant: 'primary', icon: 'check' },
    ],
  };

  // authenticated: success with refresh + logout
  const authenticatedUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'alert', variant: 'success', message: 'Authenticated successfully' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'Refresh Token', event: 'REFRESH', variant: 'outline', icon: 'refresh-cw' },
          { type: 'button', label: 'Logout', event: 'LOGOUT', variant: 'ghost', icon: 'log-out' },
        ],
      },
    ],
  };

  // refreshing: loading spinner
  const refreshingUI = {
    type: 'loading-state', title: 'Refreshing token...', message: 'Obtaining a new access token.',
  };

  // error: error display with retry
  const errorUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'error-state', title: 'Authentication Failed', message: '@entity.error', onRetry: 'RETRY' },
      { type: 'button', label: 'Try Again', event: 'RETRY', variant: 'primary', icon: 'rotate-ccw' },
    ],
  };

  // ---- Transitions ----

  const initEffects: unknown[] = [['fetch', entityName]];
  if (standalone) {
    initEffects.push(['render-ui', 'main', unauthenticatedUI]);
  }

  const transitions: unknown[] = [
    // INIT: unauthenticated -> unauthenticated (render provider picker)
    {
      from: 'unauthenticated', to: 'unauthenticated', event: 'INIT',
      effects: initEffects,
    },
    // LOGIN: unauthenticated -> authorizing (call oauth authorize)
    {
      from: 'unauthenticated', to: 'authorizing', event: 'LOGIN',
      effects: [
        ['render-ui', 'main', authorizingUI],
        ['call-service', 'oauth', 'authorize', { provider: '@entity.provider', scopes: ['openid', 'email'] }],
      ],
    },
    // AUTH_URL_RECEIVED: authorizing -> authorizing (show auth URL + code input)
    {
      from: 'authorizing', to: 'authorizing', event: 'AUTH_URL_RECEIVED',
      effects: [
        ['set', '@entity.authUrl', '@payload.authUrl'],
        ['render-ui', 'main', authUrlUI],
      ],
    },
    // CALLBACK: authorizing -> authenticated (exchange code for tokens)
    {
      from: 'authorizing', to: 'authenticated', event: 'CALLBACK',
      effects: [
        ['call-service', 'oauth', 'token', { code: '@payload.code' }],
        ['render-ui', 'main', authenticatedUI],
      ],
    },
    // TOKEN_RECEIVED: authenticated -> authenticated (set tokens)
    {
      from: 'authenticated', to: 'authenticated', event: 'TOKEN_RECEIVED',
      effects: [
        ['set', '@entity.accessToken', '@payload.accessToken'],
        ['set', '@entity.refreshToken', '@payload.refreshToken'],
        ['set', '@entity.authStatus', 'authenticated'],
        ['render-ui', 'main', authenticatedUI],
      ],
    },
    // REFRESH: authenticated -> refreshing (call oauth refresh)
    {
      from: 'authenticated', to: 'refreshing', event: 'REFRESH',
      effects: [
        ['render-ui', 'main', refreshingUI],
        ['call-service', 'oauth', 'refresh', { refreshToken: '@entity.refreshToken' }],
      ],
    },
    // TOKEN_REFRESHED: refreshing -> authenticated (update access token)
    {
      from: 'refreshing', to: 'authenticated', event: 'TOKEN_REFRESHED',
      effects: [
        ['set', '@entity.accessToken', '@payload.accessToken'],
        ['render-ui', 'main', authenticatedUI],
      ],
    },
    // LOGOUT: authenticated -> unauthenticated (clear session)
    {
      from: 'authenticated', to: 'unauthenticated', event: 'LOGOUT',
      effects: [
        ['set', '@entity.authStatus', 'unauthenticated'],
        ['render-ui', 'main', unauthenticatedUI],
      ],
    },
    // FAILED: authorizing -> error
    {
      from: 'authorizing', to: 'error', event: 'FAILED',
      effects: [
        ['set', '@entity.error', '@payload.error'],
        ['render-ui', 'main', errorUI],
      ],
    },
    // FAILED: refreshing -> error
    {
      from: 'refreshing', to: 'error', event: 'FAILED',
      effects: [
        ['set', '@entity.error', '@payload.error'],
        ['render-ui', 'main', errorUI],
      ],
    },
    // RETRY: error -> unauthenticated
    {
      from: 'error', to: 'unauthenticated', event: 'RETRY',
      effects: [['render-ui', 'main', unauthenticatedUI]],
    },
  ];

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'unauthenticated', isInitial: true },
        { name: 'authorizing' },
        { name: 'authenticated' },
        { name: 'refreshing' },
        { name: 'error' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'LOGIN', name: 'Login' },
        { key: 'AUTH_URL_RECEIVED', name: 'Auth URL Received', payload: [
          { name: 'authUrl', type: 'string', required: true },
        ]},
        { key: 'CALLBACK', name: 'Authorization Callback', payload: [
          { name: 'code', type: 'string', required: true },
        ]},
        { key: 'TOKEN_RECEIVED', name: 'Token Received', payload: [
          { name: 'accessToken', type: 'string', required: true },
          { name: 'refreshToken', type: 'string', required: true },
        ]},
        { key: 'REFRESH', name: 'Refresh Token' },
        { key: 'TOKEN_REFRESHED', name: 'Token Refreshed', payload: [
          { name: 'accessToken', type: 'string', required: true },
        ]},
        { key: 'LOGOUT', name: 'Logout' },
        { key: 'FAILED', name: 'Failed', payload: [
          { name: 'error', type: 'string', required: true },
        ]},
        { key: 'RETRY', name: 'Retry' },
      ],
      transitions,
    },
  } as Trait;
}

function buildPage(c: OauthConfig): Page | undefined {
  if (!c.standalone) return undefined;
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdServiceOauthEntity(params: StdServiceOauthParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdServiceOauthTrait(params: StdServiceOauthParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdServiceOauthPage(params: StdServiceOauthParams = {}): Page | undefined {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdServiceOauth(params: StdServiceOauthParams = {}): OrbitalDefinition {
  const c = resolve(params);
  const pages: Page[] = [];
  const page = buildPage(c);
  if (page) pages.push(page);

  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    pages,
  );
}
