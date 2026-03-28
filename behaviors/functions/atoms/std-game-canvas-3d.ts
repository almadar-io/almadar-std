/**
 * std-game-canvas-3d
 *
 * 3D game canvas atom using the `game-canvas-3d` pattern.
 * Renders tiles, units, and features in a 3D scene with configurable
 * orientation, camera mode, grid, shadows, and background color.
 *
 * @level atom
 * @family game
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdGameCanvas3dParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Map orientation */
  orientation?: string;
  /** Camera mode */
  cameraMode?: string;
  /** Show grid overlay */
  showGrid?: boolean;
  /** Enable shadows */
  shadows?: boolean;
  /** Background color */
  backgroundColor?: string;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface GameCanvas3dConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  orientation: string;
  cameraMode: string;
  showGrid: boolean;
  shadows: boolean;
  backgroundColor: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdGameCanvas3dParams): GameCanvas3dConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const p = plural(entityName);

  return {
    entityName, fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}GameCanvas3d`,
    orientation: params.orientation ?? 'isometric',
    cameraMode: params.cameraMode ?? 'orbital',
    showGrid: params.showGrid ?? true,
    shadows: params.shadows ?? true,
    backgroundColor: params.backgroundColor ?? '#1a1a2e',
    pageName: params.pageName ?? `${entityName}Canvas3dPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: GameCanvas3dConfig): Entity {
  const fields = [
    ...c.fields.filter(f => !['tiles', 'units', 'features'].includes(f.name)),
    { name: 'tiles', type: 'array' as const, default: [] },
    { name: 'units', type: 'array' as const, default: [] },
    { name: 'features', type: 'array' as const, default: [] },
  ];
  const instances = [
    {
      id: 'scene-1', name: 'Battle Arena', description: 'A 3D battle arena', status: 'active', createdAt: '2026-01-01',
      tiles: [
        { x: 0, y: 0, z: 0, type: 'grass' },
        { x: 1, y: 0, z: 0, type: 'grass' },
        { x: 0, y: 0, z: 1, type: 'stone' },
        { x: 1, y: 0, z: 1, type: 'water' },
      ],
      units: [],
      features: [],
    },
  ];
  return makeEntity({ name: c.entityName, fields, persistence: c.persistence, instances });
}

function buildTrait(c: GameCanvas3dConfig): Trait {
  const { entityName, orientation, cameraMode, showGrid, shadows, backgroundColor } = c;

  const canvasView = {
    type: 'game-canvas-3d',
    tiles: ['object/get', ['array/first', `@${entityName}`], 'tiles'],
    units: ['object/get', ['array/first', `@${entityName}`], 'units'],
    features: ['object/get', ['array/first', `@${entityName}`], 'features'],
    orientation,
    cameraMode,
    showGrid,
    shadows,
    backgroundColor,
    tileClickEvent: 'TILE_CLICK',
    unitClickEvent: 'UNIT_CLICK',
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'active' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'TILE_CLICK', name: 'Tile Click', payload: [{ name: 'tileId', type: 'string', required: true }] },
        { key: 'UNIT_CLICK', name: 'Unit Click', payload: [{ name: 'unitId', type: 'string', required: true }] },
        { key: 'CAMERA_CHANGE', name: 'Camera Change' },
      ],
      transitions: [
        { from: 'idle', to: 'idle', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', canvasView]] },
        { from: 'idle', to: 'active', event: 'TILE_CLICK', effects: [['render-ui', 'main', canvasView]] },
        { from: 'idle', to: 'active', event: 'UNIT_CLICK', effects: [['render-ui', 'main', canvasView]] },
        { from: 'active', to: 'active', event: 'TILE_CLICK', effects: [['render-ui', 'main', canvasView]] },
        { from: 'active', to: 'active', event: 'UNIT_CLICK', effects: [['render-ui', 'main', canvasView]] },
        { from: 'active', to: 'active', event: 'CAMERA_CHANGE', effects: [] },
        { from: 'idle', to: 'idle', event: 'CAMERA_CHANGE', effects: [] },
      ],
    },
  } as Trait;
}

function buildPage(c: GameCanvas3dConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdGameCanvas3dEntity(params: StdGameCanvas3dParams): Entity { return buildEntity(resolve(params)); }
export function stdGameCanvas3dTrait(params: StdGameCanvas3dParams): Trait { return buildTrait(resolve(params)); }
export function stdGameCanvas3dPage(params: StdGameCanvas3dParams): Page { return buildPage(resolve(params)); }

export function stdGameCanvas3d(params: StdGameCanvas3dParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
