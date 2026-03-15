/**
 * std-platformer-canvas
 *
 * Side-scrolling platformer atom using the `platformer-canvas` pattern.
 * Renders player, platforms, and handles movement events.
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

export interface StdPlatformerCanvasParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Canvas width */
  canvasWidth?: number;
  /** Canvas height */
  canvasHeight?: number;
  /** World width (scrollable area) */
  worldWidth?: number;
  /** World height */
  worldHeight?: number;
  /** Follow camera enabled */
  followCamera?: boolean;
  /** Background color */
  bgColor?: string;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface PlatformerConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  canvasWidth: number;
  canvasHeight: number;
  worldWidth: number;
  worldHeight: number;
  followCamera: boolean;
  bgColor: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdPlatformerCanvasParams): PlatformerConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const p = plural(entityName);

  return {
    entityName, fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}PlatformerCanvas`,
    canvasWidth: params.canvasWidth ?? 800,
    canvasHeight: params.canvasHeight ?? 400,
    worldWidth: params.worldWidth ?? 2400,
    worldHeight: params.worldHeight ?? 400,
    followCamera: params.followCamera ?? true,
    bgColor: params.bgColor ?? '#1a1a2e',
    pageName: params.pageName ?? `${entityName}PlatformerPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: PlatformerConfig): Entity {
  const fields = [
    ...ensureIdField(c.fields),
    { name: 'platforms', type: 'array' as const },
    { name: 'player', type: 'object' as const },
  ];
  return makeEntity({
    name: c.entityName,
    fields,
    persistence: 'singleton',
    instances: [{
      id: 'level',
      platforms: [
        { x: 0, y: 350, width: 2400, height: 50 },
        { x: 200, y: 250, width: 150, height: 20 },
        { x: 500, y: 200, width: 120, height: 20 },
        { x: 800, y: 280, width: 180, height: 20 },
        { x: 1100, y: 180, width: 100, height: 20 },
        { x: 1400, y: 230, width: 160, height: 20 },
        { x: 1700, y: 150, width: 140, height: 20 },
      ],
      player: { x: 50, y: 300, width: 30, height: 30, vx: 0, vy: 0 },
    }],
  });
}

function buildTrait(c: PlatformerConfig): Trait {
  const { entityName, canvasWidth, canvasHeight, worldWidth, worldHeight, followCamera, bgColor } = c;

  const canvasView = {
    type: 'platformer-canvas',
    platforms: '@entity.platforms',
    player: '@entity.player',
    canvasWidth,
    canvasHeight,
    worldWidth,
    worldHeight,
    followCamera,
    bgColor,
    leftEvent: 'LEFT',
    rightEvent: 'RIGHT',
    jumpEvent: 'JUMP',
    stopEvent: 'STOP',
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'running' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'LEFT', name: 'Move Left' },
        { key: 'RIGHT', name: 'Move Right' },
        { key: 'JUMP', name: 'Jump' },
        { key: 'STOP', name: 'Stop' },
        { key: 'START', name: 'Start' },
      ],
      transitions: [
        { from: 'idle', to: 'idle', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', canvasView]] },
        { from: 'idle', to: 'running', event: 'START', effects: [['render-ui', 'main', canvasView]] },
        { from: 'running', to: 'running', event: 'LEFT', effects: [] },
        { from: 'running', to: 'running', event: 'RIGHT', effects: [] },
        { from: 'running', to: 'running', event: 'JUMP', effects: [] },
        { from: 'running', to: 'idle', event: 'STOP', effects: [['render-ui', 'main', canvasView]] },
      ],
    },
  } as Trait;
}

function buildPage(c: PlatformerConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdPlatformerCanvasEntity(params: StdPlatformerCanvasParams): Entity { return buildEntity(resolve(params)); }
export function stdPlatformerCanvasTrait(params: StdPlatformerCanvasParams): Trait { return buildTrait(resolve(params)); }
export function stdPlatformerCanvasPage(params: StdPlatformerCanvasParams): Page { return buildPage(resolve(params)); }

export function stdPlatformerCanvas(params: StdPlatformerCanvasParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
