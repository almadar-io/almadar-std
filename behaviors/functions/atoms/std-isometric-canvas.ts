/**
 * std-isometric-canvas
 *
 * Isometric game renderer atom using the `isometric-canvas` pattern.
 * Renders tiles, units, and features on an isometric grid.
 * Handles tile clicks, unit clicks, and hover events.
 *
 * @level atom
 * @family game
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

import type { OrbitalDefinition, Entity, Page, Trait, EntityField, EntityRow } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdIsometricCanvasParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Board width in tiles */
  boardWidth?: number;
  /** Board height in tiles */
  boardHeight?: number;
  /** Render scale */
  scale?: number;
  /** Unit render scale */
  unitScale?: number;
  /** Show debug grid */
  debug?: boolean;
  /** Show minimap */
  showMinimap?: boolean;
  /** Enable camera controls */
  enableCamera?: boolean;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface IsometricConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  boardWidth: number;
  boardHeight: number;
  scale: number;
  unitScale: number;
  debug: boolean;
  showMinimap: boolean;
  enableCamera: boolean;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdIsometricCanvasParams): IsometricConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const p = plural(entityName);

  return {
    entityName, fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}IsometricCanvas`,
    boardWidth: params.boardWidth ?? 8,
    boardHeight: params.boardHeight ?? 8,
    scale: params.scale ?? 1,
    unitScale: params.unitScale ?? 2,
    debug: params.debug ?? false,
    showMinimap: params.showMinimap ?? false,
    enableCamera: params.enableCamera ?? true,
    pageName: params.pageName ?? `${entityName}CanvasPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function generateTiles(width: number, height: number): Record<string, unknown>[] {
  const terrains = ['grass', 'dirt', 'stone', 'water', 'sand'];
  const tiles: Record<string, unknown>[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles.push({ x, y, terrain: terrains[(x + y) % terrains.length] });
    }
  }
  return tiles;
}

function buildEntity(c: IsometricConfig): Entity {
  const fields = [
    ...ensureIdField(c.fields),
    { name: 'tiles', type: 'array' as const },
    { name: 'units', type: 'array' as const },
    { name: 'features', type: 'array' as const },
  ];
  return makeEntity({
    name: c.entityName,
    fields,
    persistence: 'singleton',
    instances: [{
      id: 'board',
      tiles: generateTiles(c.boardWidth, c.boardHeight),
      units: [],
      features: [],
    } as unknown as EntityRow],
  });
}

function buildTrait(c: IsometricConfig): Trait {
  const { entityName, boardWidth, boardHeight, scale, unitScale, debug, showMinimap, enableCamera } = c;

  const canvasView = {
    type: 'isometric-canvas',
    tiles: '@entity.tiles',
    boardWidth,
    boardHeight,
    scale,
    unitScale,
    debug,
    showMinimap,
    enableCamera,
    tileClickEvent: 'TILE_CLICK',
    unitClickEvent: 'UNIT_CLICK',
    tileHoverEvent: 'TILE_HOVER',
    tileLeaveEvent: 'TILE_LEAVE',
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
        { key: 'TILE_HOVER', name: 'Tile Hover' },
        { key: 'TILE_LEAVE', name: 'Tile Leave' },
        { key: 'DESELECT', name: 'Deselect' },
      ],
      transitions: [
        { from: 'idle', to: 'idle', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', canvasView]] },
        { from: 'idle', to: 'active', event: 'TILE_CLICK', effects: [['render-ui', 'main', canvasView]] },
        { from: 'idle', to: 'active', event: 'UNIT_CLICK', effects: [['render-ui', 'main', canvasView]] },
        { from: 'active', to: 'active', event: 'TILE_CLICK', effects: [['render-ui', 'main', canvasView]] },
        { from: 'active', to: 'active', event: 'UNIT_CLICK', effects: [['render-ui', 'main', canvasView]] },
        { from: 'active', to: 'active', event: 'TILE_HOVER', effects: [] },
        { from: 'idle', to: 'idle', event: 'TILE_HOVER', effects: [] },
        { from: 'active', to: 'active', event: 'TILE_LEAVE', effects: [] },
        { from: 'idle', to: 'idle', event: 'TILE_LEAVE', effects: [] },
        { from: 'active', to: 'idle', event: 'DESELECT', effects: [['render-ui', 'main', canvasView]] },
      ],
    },
  } as Trait;
}

function buildPage(c: IsometricConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdIsometricCanvasEntity(params: StdIsometricCanvasParams): Entity { return buildEntity(resolve(params)); }
export function stdIsometricCanvasTrait(params: StdIsometricCanvasParams): Trait { return buildTrait(resolve(params)); }
export function stdIsometricCanvasPage(params: StdIsometricCanvasParams): Page { return buildPage(resolve(params)); }

export function stdIsometricCanvas(params: StdIsometricCanvasParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
