/**
 * std-physics2d as a Function
 *
 * 2D physics simulation parameterized for any domain.
 * Provides idle and simulating states with force application and tick updates.
 * Tracks position and velocity via entity fields.
 * The state machine structure is fixed. The caller controls data and presentation.
 *
 * @level atom
 * @family physics2d
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

export interface StdPhysics2dParams {
  /** Entity name in PascalCase (e.g., "Body", "Particle") */
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
  /** Page name (defaults to "{Entity}PhysicsPage") */
  pageName?: string;
  /** Route path (defaults to "/{entities}/physics") */
  pagePath?: string;
  /** Whether this is the initial/home page */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface Physics2dConfig {
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

function resolve(params: StdPhysics2dParams): Physics2dConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  // Ensure physics-related fields exist on entity
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'x') ? [] : [{ name: 'x', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'y') ? [] : [{ name: 'y', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'vx') ? [] : [{ name: 'vx', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'vy') ? [] : [{ name: 'vy', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'forceX') ? [] : [{ name: 'forceX', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'forceY') ? [] : [{ name: 'forceY', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'physicsStatus') ? [] : [{ name: 'physicsStatus', type: 'string' as const, default: 'idle' }]),
  ];

  const p = plural(entityName);

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Physics`,
    pluralName: p,
    headerIcon: params.headerIcon ?? 'atom',
    pageTitle: params.pageTitle ?? `${entityName} Physics`,
    pageName: params.pageName ?? `${entityName}PhysicsPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/physics`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: Physics2dConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: Physics2dConfig): Trait {
  const { entityName } = c;

  const idleView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'simulation-canvas', preset: 'spring', width: 800, height: 400, running: false, speed: 1 },
      { type: 'button', label: 'Start', event: 'START', variant: 'primary', icon: 'play' },
    ],
  };

  const simulatingView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'simulation-canvas', preset: 'spring', width: 800, height: 400, running: true, speed: 1 },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'Apply Force', event: 'APPLY_FORCE', variant: 'secondary', icon: 'move' },
          { type: 'button', label: 'Stop', event: 'STOP', variant: 'ghost', icon: 'square' },
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
        { name: 'simulating' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'START', name: 'Start Simulation' },
        { key: 'STOP', name: 'Stop Simulation' },
        { key: 'TICK', name: 'Tick' },
        { key: 'APPLY_FORCE', name: 'Apply Force', payload: [
          { name: 'forceX', type: 'number', required: true },
          { name: 'forceY', type: 'number', required: true },
        ] },
      ],
      transitions: [
        // INIT: idle -> idle
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['render-ui', 'main', idleView],
          ],
        },
        // START: idle -> simulating
        {
          from: 'idle', to: 'simulating', event: 'START',
          effects: [
            ['set', '@entity.physicsStatus', 'simulating'],
            ['render-ui', 'main', simulatingView],
          ],
        },
        // TICK: simulating -> simulating (self-loop)
        {
          from: 'simulating', to: 'simulating', event: 'TICK',
          effects: [
            ['render-ui', 'main', simulatingView],
          ],
        },
        // APPLY_FORCE: simulating -> simulating (self-loop)
        {
          from: 'simulating', to: 'simulating', event: 'APPLY_FORCE',
          effects: [
            ['set', '@entity.forceX', '@payload.forceX'],
            ['set', '@entity.forceY', '@payload.forceY'],
            ['render-ui', 'main', simulatingView],
          ],
        },
        // STOP: simulating -> idle
        {
          from: 'simulating', to: 'idle', event: 'STOP',
          effects: [
            ['set', '@entity.physicsStatus', 'idle'],
            ['render-ui', 'main', idleView],
          ],
        },
        // INIT: simulating -> simulating (self-loop)
        {
          from: 'simulating', to: 'simulating', event: 'INIT',
          effects: [
            ['render-ui', 'main', simulatingView],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: Physics2dConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdPhysics2dEntity(params: StdPhysics2dParams): Entity {
  return buildEntity(resolve(params));
}

export function stdPhysics2dTrait(params: StdPhysics2dParams): Trait {
  return buildTrait(resolve(params));
}

export function stdPhysics2dPage(params: StdPhysics2dParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdPhysics2d(params: StdPhysics2dParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
