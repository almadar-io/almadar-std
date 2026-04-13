/**
 * std-game-canvas-2d
 *
 * 2D game canvas atom using the `game-canvas-2d` pattern.
 * Provides a render loop with configurable FPS, width, and height.
 * Handles init, start, stop, and per-frame tick events.
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

import type { OrbitalDefinition, OrbitalSchema, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, makeSchema, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdGameCanvas2dParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Canvas width in pixels */
  width?: number;
  /** Canvas height in pixels */
  height?: number;
  /** Target frames per second */
  fps?: number;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface GameCanvas2dConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  width: number;
  height: number;
  fps: number;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdGameCanvas2dParams): GameCanvas2dConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const p = plural(entityName);

  return {
    entityName, fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}GameCanvas2d`,
    width: params.width ?? 800,
    height: params.height ?? 600,
    fps: params.fps ?? 60,
    pageName: params.pageName ?? `${entityName}Canvas2dPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: GameCanvas2dConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: GameCanvas2dConfig): Trait {
  const { width, height, fps } = c;

  const canvasConfig = {
    type: 'game-canvas-2d',
    width,
    height,
    fps,
  };

  const idleView = {
    type: 'stack',
    direction: 'vertical',
    gap: 'md',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', children: [
        { type: 'icon', name: 'monitor', size: 'md' },
        { type: 'typography', content: `${c.entityName} Canvas`, variant: 'h3' },
      ]},
      { type: 'typography', content: `${width}x${height} @ ${fps}fps`, variant: 'caption', color: 'muted' },
      canvasConfig,
      { type: 'button', label: 'Start', event: 'START', variant: 'primary', icon: 'play' },
    ],
  };

  const renderingView = {
    type: 'stack',
    direction: 'vertical',
    gap: 'md',
    children: [
      { type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', children: [
        { type: 'icon', name: 'monitor', size: 'md' },
        { type: 'typography', content: `${c.entityName} Canvas`, variant: 'h3' },
      ]},
      canvasConfig,
      { type: 'button', label: 'Stop', event: 'STOP', variant: 'ghost', icon: 'square' },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: c.entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'rendering' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'START', name: 'Start' },
        { key: 'STOP', name: 'Stop' },
        { key: 'TICK', name: 'Tick' },
      ],
      transitions: [
        { from: 'idle', to: 'idle', event: 'INIT', effects: [['fetch', c.entityName], ['render-ui', 'main', idleView]] },
        { from: 'idle', to: 'rendering', event: 'START', effects: [['render-ui', 'main', renderingView]] },
        { from: 'rendering', to: 'rendering', event: 'TICK', effects: [] },
        { from: 'rendering', to: 'idle', event: 'STOP', effects: [['render-ui', 'main', idleView]] },
      ],
    },
  } as Trait;
}

function buildPage(c: GameCanvas2dConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdGameCanvas2dEntity(params: StdGameCanvas2dParams): Entity { return buildEntity(resolve(params)); }
export function stdGameCanvas2dTrait(params: StdGameCanvas2dParams): Trait { return buildTrait(resolve(params)); }
export function stdGameCanvas2dPage(params: StdGameCanvas2dParams): Page { return buildPage(resolve(params)); }

export function stdGameCanvas2d(params: StdGameCanvas2dParams): OrbitalSchema {
  const c = resolve(params);
  return makeSchema(`${c.entityName}Orbital`, makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]));
}
