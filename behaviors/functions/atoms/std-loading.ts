/**
 * std-loading as a Function
 *
 * Loading behavior parameterized for any domain.
 * Provides a multi-state loading lifecycle: idle, loading, success, error.
 * Tracks async operation status with appropriate UI for each state.
 *
 * @level atom
 * @family loading
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

export interface StdLoadingParams {
  /** Entity name in PascalCase (e.g., "Request", "Upload") */
  entityName: string;
  /** Entity fields (id is auto-added) */
  fields: EntityField[];
  /** Persistence mode */
  persistence?: 'persistent' | 'runtime' | 'singleton';

  // Display
  /** Header icon (Lucide name) */
  headerIcon?: string;
  /** Title text (defaults to entity name) */
  title?: string;

  // Standalone mode
  /** When true (default), renders idle state with Start button to main. When false, only renders loading/success/error states. */
  standalone?: boolean;

  // Page
  /** Page name (defaults to "{Entity}LoadingPage") */
  pageName?: string;
  /** Route path (defaults to "/{entities}/loading") */
  pagePath?: string;
  /** Whether this is the initial/home page */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface LoadingConfig {
  entityName: string;
  fields: EntityField[];
  displayField: string;
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  headerIcon: string;
  title: string;
  standalone: boolean;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdLoadingParams): LoadingConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  // Ensure loadingStatus tracking field exists on entity
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'loadingStatus') ? [] : [{ name: 'loadingStatus', type: 'string' as const, default: 'idle' }]),
  ];

  const nonIdFields = baseFields.filter(f => f.name !== 'id' && f.name !== 'loadingStatus');
  const p = plural(entityName);

  return {
    entityName,
    fields,
    displayField: nonIdFields[0]?.name ?? 'id',
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Loading`,
    pluralName: p,
    headerIcon: params.headerIcon ?? 'loader',
    title: params.title ?? entityName,
    standalone: params.standalone ?? true,
    pageName: params.pageName ?? `${entityName}LoadingPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/loading`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: LoadingConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: LoadingConfig): Trait {
  const { entityName, headerIcon, title } = c;

  const idleView = {
    type: 'center',
    children: [{
      type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
      children: [
        {
          type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
          children: [
            { type: 'icon', name: 'play-circle', size: 'lg' },
            { type: 'typography', content: title, variant: 'h2' },
          ],
        },
        { type: 'divider' },
        { type: 'typography', variant: 'body', color: 'muted',
          content: `Ready to load ${title.toLowerCase()}. Click Start to begin.` },
        { type: 'button', label: 'Start', event: 'START', variant: 'primary', icon: 'play' },
      ],
    }],
  };

  // Loading view: loading-state + spinner + progress bar
  const loadingView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'loading-state', title: 'Loading', message: `Loading ${title.toLowerCase()}...` },
      { type: 'spinner', size: 'lg' },
      { type: 'progress-bar', value: 50, showPercentage: true },
      { type: 'skeleton', variant: 'text' },
    ],
  };

  // Success view: alert molecule with success variant
  const successView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'icon', name: 'check-circle', size: 'lg' },
          { type: 'typography', content: 'Success', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'alert', variant: 'success', message: 'Operation completed successfully.' },
      { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  // Error view: error-boundary wrapping error-state with retry support
  const errorView = {
    type: 'error-boundary',
    children: [
      {
        type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
        children: [
          { type: 'error-state', title: 'Error', message: 'Something went wrong. Please try again.', onRetry: 'START' },
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
            children: [
              { type: 'button', label: 'Retry', event: 'START', variant: 'primary', icon: 'rotate-ccw' },
              { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost' },
            ],
          },
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
        { name: 'idle', isInitial: true },
        { name: 'loading' },
        { name: 'success' },
        { name: 'error' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'START', name: 'Start Loading' },
        { key: 'LOADED', name: 'Loaded' },
        { key: 'FAILED', name: 'Failed' },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: c.standalone
            ? [['set', '@entity.loadingStatus', 'idle'], ['render-ui', 'main', idleView]]
            : [['set', '@entity.loadingStatus', 'idle']],
        },
        {
          from: 'idle', to: 'loading', event: 'START',
          effects: [
            ['set', '@entity.loadingStatus', 'loading'],
            ['render-ui', 'main', loadingView],
          ],
        },
        {
          from: 'loading', to: 'success', event: 'LOADED',
          effects: [
            ['set', '@entity.loadingStatus', 'success'],
            ['render-ui', 'main', successView],
          ],
        },
        {
          from: 'loading', to: 'error', event: 'FAILED',
          effects: [
            ['set', '@entity.loadingStatus', 'error'],
            ['render-ui', 'main', errorView],
          ],
        },
        {
          from: 'error', to: 'loading', event: 'START',
          effects: [
            ['set', '@entity.loadingStatus', 'loading'],
            ['render-ui', 'main', loadingView],
          ],
        },
        {
          from: 'error', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.loadingStatus', 'idle'],
            ['render-ui', 'main', idleView],
          ],
        },
        {
          from: 'success', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.loadingStatus', 'idle'],
            ['render-ui', 'main', idleView],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: LoadingConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdLoadingEntity(params: StdLoadingParams): Entity {
  return buildEntity(resolve(params));
}

export function stdLoadingTrait(params: StdLoadingParams): Trait {
  return buildTrait(resolve(params));
}

export function stdLoadingPage(params: StdLoadingParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdLoading(params: StdLoadingParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
