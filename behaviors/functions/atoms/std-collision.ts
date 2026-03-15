/**
 * std-collision as a Function
 *
 * Game collision detection parameterized for any domain.
 * Provides idle and detecting states for checking collisions
 * between game entities. Tracks collision targets via entity fields.
 * The state machine structure is fixed. The caller controls data and presentation.
 *
 * @level atom
 * @family collision
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdCollisionParams {
  /** Entity name in PascalCase (e.g., "Hitbox", "Collider") */
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
  /** Page name (defaults to "{Entity}CollisionPage") */
  pageName?: string;
  /** Route path (defaults to "/{entities}/collision") */
  pagePath?: string;
  /** Whether this is the initial/home page */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface CollisionConfig {
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

function resolve(params: StdCollisionParams): CollisionConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  // Ensure collision-related fields exist on entity
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'x') ? [] : [{ name: 'x', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'y') ? [] : [{ name: 'y', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'collisionStatus') ? [] : [{ name: 'collisionStatus', type: 'string' as const, default: 'idle' }]),
    ...(baseFields.some(f => f.name === 'targetId') ? [] : [{ name: 'targetId', type: 'string' as const, default: '' }]),
  ];

  const p = plural(entityName);

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Collision`,
    pluralName: p,
    headerIcon: params.headerIcon ?? 'crosshair',
    pageTitle: params.pageTitle ?? `${entityName} Collision`,
    pageName: params.pageName ?? `${entityName}CollisionPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/collision`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: CollisionConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: CollisionConfig): Trait {
  const { entityName, headerIcon, pageTitle } = c;

  const idleView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: pageTitle, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [
          {
            type: 'stack', direction: 'vertical', gap: 'sm',
            children: [
              { type: 'typography', content: 'Position', variant: 'caption' },
              {
                type: 'stack', direction: 'horizontal', gap: 'md',
                children: [
                  { type: 'typography', content: '@entity.x', variant: 'body' },
                  { type: 'typography', content: '@entity.y', variant: 'body' },
                ],
              },
              { type: 'badge', label: '@entity.collisionStatus' },
            ],
          },
        ],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'Check', event: 'CHECK', variant: 'primary', icon: 'scan' },
        ],
      },
    ],
  };

  const detectingView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'md', align: 'center',
        children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: pageTitle, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [
          {
            type: 'stack', direction: 'vertical', gap: 'sm',
            children: [
              { type: 'typography', content: 'Position', variant: 'caption' },
              {
                type: 'stack', direction: 'horizontal', gap: 'md',
                children: [
                  { type: 'typography', content: '@entity.x', variant: 'body' },
                  { type: 'typography', content: '@entity.y', variant: 'body' },
                ],
              },
              { type: 'badge', label: 'Detecting...' },
              { type: 'typography', content: '@entity.targetId', variant: 'body' },
            ],
          },
        ],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'Clear', event: 'CLEAR', variant: 'ghost', icon: 'x' },
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
        { name: 'detecting' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'CHECK', name: 'Check Collision' },
        { key: 'COLLISION_DETECTED', name: 'Collision Detected', payload: [{ name: 'targetId', type: 'string', required: true }] },
        { key: 'CLEAR', name: 'Clear' },
      ],
      transitions: [
        // INIT: idle -> idle
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['render-ui', 'main', idleView],
          ],
        },
        // CHECK: idle -> detecting
        {
          from: 'idle', to: 'detecting', event: 'CHECK',
          effects: [
            ['set', '@entity.collisionStatus', 'detecting'],
            ['render-ui', 'main', detectingView],
          ],
        },
        // COLLISION_DETECTED: detecting -> detecting (self-loop)
        {
          from: 'detecting', to: 'detecting', event: 'COLLISION_DETECTED',
          effects: [
            ['set', '@entity.targetId', '@payload.targetId'],
            ['set', '@entity.collisionStatus', 'detected'],
            ['render-ui', 'main', detectingView],
          ],
        },
        // CLEAR: detecting -> idle
        {
          from: 'detecting', to: 'idle', event: 'CLEAR',
          effects: [
            ['set', '@entity.collisionStatus', 'idle'],
            ['set', '@entity.targetId', ''],
            ['render-ui', 'main', idleView],
          ],
        },
        // INIT: detecting -> detecting (self-loop)
        {
          from: 'detecting', to: 'detecting', event: 'INIT',
          effects: [
            ['render-ui', 'main', detectingView],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: CollisionConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdCollisionEntity(params: StdCollisionParams): Entity {
  return buildEntity(resolve(params));
}

export function stdCollisionTrait(params: StdCollisionParams): Trait {
  return buildTrait(resolve(params));
}

export function stdCollisionPage(params: StdCollisionParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdCollision(params: StdCollisionParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
