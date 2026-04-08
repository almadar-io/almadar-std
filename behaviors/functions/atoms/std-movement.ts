/**
 * std-movement
 *
 * Entity movement behavior: idle, moving, collision detection and resolution.
 * Pure function: params in, OrbitalDefinition out.
 *
 * @level molecule
 * @family simulation
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

export interface StdMovementParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  collection?: string;

  // Labels
  pageTitle?: string;

  // Icons
  headerIcon?: string;

  // Config
  moveSpeed?: number;

  // Page
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface MovementConfig {
  entityName: string;
  fields: EntityField[];
  nonIdFields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  traitName: string;
  pageTitle: string;
  headerIcon: string;
  moveSpeed: number;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdMovementParams): MovementConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const nonIdFields = fields.filter(f => f.name !== 'id');
  const p = plural(entityName);

  return {
    entityName,
    fields,
    nonIdFields,
    persistence: params.persistence ?? 'runtime',
    collection: params.collection,
    traitName: `${entityName}Movement`,
    pageTitle: params.pageTitle ?? `${p} Movement`,
    headerIcon: params.headerIcon ?? 'move',
    moveSpeed: params.moveSpeed ?? 1,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: MovementConfig): Entity {
  const fields = [
    ...c.fields.filter(f => !['x', 'y'].includes(f.name)),
    { name: 'x', type: 'number' as const, default: 0 },
    { name: 'y', type: 'number' as const, default: 0 },
  ];
  return makeEntity({ name: c.entityName, fields, persistence: c.persistence, collection: c.collection });
}

/** S-expression: get field from first entity in collection */
const ef = (field: string): unknown[] => ['object/get', ['array/first', '@entity'], field];

function buildTrait(c: MovementConfig): Trait {
  const { entityName, nonIdFields, headerIcon, pageTitle } = c;

  // Entity field summary: use stat-display for position, badge for status
  const fieldSummaryChildren: unknown[] = [
    {
      type: 'simple-grid', columns: 2,
      children: [
        { type: 'stat-display', label: 'X', value: ef(nonIdFields.find(f => f.name === 'x')?.name ?? 'x') },
        { type: 'stat-display', label: 'Y', value: ef(nonIdFields.find(f => f.name === 'y')?.name ?? 'y') },
      ],
    },
    ...nonIdFields.slice(0, 4).filter(f => f.name !== 'x' && f.name !== 'y').map(field => ({
      type: 'stack', direction: 'horizontal', gap: 'md',
      children: [
        { type: 'typography', variant: 'caption', content: field.name.charAt(0).toUpperCase() + field.name.slice(1) },
        { type: 'typography', variant: 'body', content: ef(field.name) },
      ],
    })),
  ];

  // Idle main view
  const idleMainUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'md',
            children: [
              { type: 'icon', name: headerIcon, size: 'lg' },
              { type: 'typography', content: pageTitle, variant: 'h2' },
            ],
          },
          { type: 'status-dot', status: 'inactive', label: 'Idle' },
        ],
      },
      { type: 'divider' },
      ...fieldSummaryChildren,
      { type: 'divider' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'end',
        children: [
          { type: 'button', label: 'Move', event: 'MOVE', variant: 'primary', icon: 'navigation' },
        ],
      },
    ],
  };

  // Moving view
  const movingMainUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'md',
            children: [
              { type: 'icon', name: headerIcon, size: 'lg' },
              { type: 'typography', content: pageTitle, variant: 'h2' },
            ],
          },
          { type: 'status-dot', status: 'active', pulse: true, label: 'Moving' },
        ],
      },
      { type: 'divider' },
      ...fieldSummaryChildren,
      { type: 'divider' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'end',
        children: [
          { type: 'button', label: 'Stop', event: 'STOP', variant: 'danger', icon: 'square' },
        ],
      },
    ],
  };

  // Collision modal
  const collisionModalUI = {
    type: 'stack', direction: 'vertical', gap: 'md',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'icon', name: 'alert-triangle', size: 'md' },
          { type: 'typography', content: 'Collision Detected', variant: 'h3' },
        ],
      },
      { type: 'divider' },
      { type: 'typography', content: 'A collision has been detected. Resolve to continue.', variant: 'body' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'end',
        children: [
          { type: 'button', label: 'Cancel', event: 'CANCEL', variant: 'ghost' },
          { type: 'button', label: 'Resolve', event: 'RESOLVE', variant: 'primary', icon: 'check' },
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
        { name: 'moving' },
        { name: 'colliding' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'MOVE', name: 'Move', payload: [{ name: 'x', type: 'number', required: true }, { name: 'y', type: 'number', required: true }] },
        { key: 'STOP', name: 'Stop' },
        { key: 'COLLISION', name: 'Collision', payload: [{ name: 'targetId', type: 'string', required: true }] },
        { key: 'RESOLVE', name: 'Resolve' },
        { key: 'CANCEL', name: 'Cancel' },
        { key: 'CLOSE', name: 'Close' },
      ],
      transitions: [
        // INIT: idle -> idle (fetch + render)
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', idleMainUI],
          ],
        },
        // MOVE: idle -> moving
        {
          from: 'idle', to: 'moving', event: 'MOVE',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', movingMainUI],
          ],
        },
        // STOP: moving -> idle
        {
          from: 'moving', to: 'idle', event: 'STOP',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', idleMainUI],
          ],
        },
        // COLLISION: moving -> colliding
        {
          from: 'moving', to: 'colliding', event: 'COLLISION',
          effects: [
            ['render-ui', 'modal', collisionModalUI],
          ],
        },
        // RESOLVE: colliding -> idle
        {
          from: 'colliding', to: 'idle', event: 'RESOLVE',
          effects: [
            ['render-ui', 'modal', null],
            ['fetch', entityName],
            ['render-ui', 'main', idleMainUI],
          ],
        },
        // CANCEL: colliding -> idle
        {
          from: 'colliding', to: 'idle', event: 'CANCEL',
          effects: [
            ['render-ui', 'modal', null],
            ['fetch', entityName],
            ['render-ui', 'main', idleMainUI],
          ],
        },
        // CLOSE: colliding -> idle
        {
          from: 'colliding', to: 'idle', event: 'CLOSE',
          effects: [
            ['render-ui', 'modal', null],
            ['fetch', entityName],
            ['render-ui', 'main', idleMainUI],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: MovementConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdMovementEntity(params: StdMovementParams): Entity {
  return buildEntity(resolve(params));
}

export function stdMovementTrait(params: StdMovementParams): Trait {
  return buildTrait(resolve(params));
}

export function stdMovementPage(params: StdMovementParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdMovement(params: StdMovementParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
