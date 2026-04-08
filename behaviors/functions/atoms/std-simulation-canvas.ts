/**
 * std-simulation-canvas
 *
 * 2D physics simulation renderer atom using the `simulation-canvas` pattern.
 * Runs built-in Euler integration for educational presets (pendulum, spring, etc.).
 * Supports start, stop, and reset controls.
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

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdSimulationCanvasParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Physics preset name */
  preset?: string;
  /** Canvas width in pixels */
  width?: number;
  /** Canvas height in pixels */
  height?: number;
  /** Simulation speed multiplier */
  speed?: number;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface SimulationCanvasConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  preset: string;
  width: number;
  height: number;
  speed: number;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdSimulationCanvasParams): SimulationCanvasConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const p = plural(entityName);

  return {
    entityName, fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}SimulationCanvas`,
    preset: params.preset ?? 'pendulum',
    width: params.width ?? 800,
    height: params.height ?? 400,
    speed: params.speed ?? 1,
    pageName: params.pageName ?? `${entityName}SimulationPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: SimulationCanvasConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: SimulationCanvasConfig): Trait {
  const { preset, width, height, speed } = c;

  const idleView = {
    type: 'simulation-canvas',
    preset,
    width,
    height,
    running: false,
    speed,
  };

  const runningView = {
    type: 'simulation-canvas',
    preset,
    width,
    height,
    running: true,
    speed,
  };

  return {
    name: c.traitName,
    linkedEntity: c.entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'running' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'START', name: 'Start' },
        { key: 'STOP', name: 'Stop' },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions: [
        { from: 'idle', to: 'idle', event: 'INIT', effects: [['fetch', c.entityName], ['render-ui', 'main', idleView]] },
        { from: 'idle', to: 'running', event: 'START', effects: [['render-ui', 'main', runningView]] },
        { from: 'running', to: 'idle', event: 'STOP', effects: [['render-ui', 'main', idleView]] },
        { from: 'running', to: 'running', event: 'RESET', effects: [['render-ui', 'main', runningView]] },
        { from: 'idle', to: 'idle', event: 'RESET', effects: [['render-ui', 'main', idleView]] },
      ],
    },
  } as Trait;
}

function buildPage(c: SimulationCanvasConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdSimulationCanvasEntity(params: StdSimulationCanvasParams): Entity { return buildEntity(resolve(params)); }
export function stdSimulationCanvasTrait(params: StdSimulationCanvasParams): Trait { return buildTrait(resolve(params)); }
export function stdSimulationCanvasPage(params: StdSimulationCanvasParams): Page { return buildPage(resolve(params)); }

export function stdSimulationCanvas(params: StdSimulationCanvasParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
