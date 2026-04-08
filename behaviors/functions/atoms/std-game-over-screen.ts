/**
 * std-game-over-screen
 *
 * Game over screen atom using the `game-over-screen` pattern.
 * Shows final score, high score, and retry/quit actions.
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

export interface StdGameOverScreenParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  title?: string;
  message?: string;
  /** Actions: each has a label and event */
  actions?: Array<{ label: string; event: string }>;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface GameOverConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  title: string;
  message: string;
  actions: Array<{ label: string; event: string }>;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdGameOverScreenParams): GameOverConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);
  const p = plural(entityName);

  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'currentScore') ? [] : [{ name: 'currentScore', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'highScore') ? [] : [{ name: 'highScore', type: 'number' as const, default: 0 }]),
  ];

  return {
    entityName, fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}GameOver`,
    title: params.title ?? 'Game Over',
    message: params.message ?? 'Better luck next time!',
    actions: params.actions ?? [
      { label: 'Play Again', event: 'RETRY' },
      { label: 'Main Menu', event: 'QUIT' },
    ],
    pageName: params.pageName ?? `${entityName}GameOverPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: GameOverConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: GameOverConfig): Trait {
  const { entityName, title, message, actions } = c;

  const gameOverView = {
    type: 'game-over-screen',
    title,
    message,
    currentScore: '@entity.currentScore',
    highScore: '@entity.highScore',
    menuItems: actions.map(a => ({ label: a.label, action: a.event })),
  };

  const actionEvents = actions.map(a => ({ key: a.event, name: a.label }));

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [{ name: 'idle', isInitial: true }],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'NAVIGATE', name: 'Navigate' },
        { key: 'RESTART', name: 'Restart' },
        ...actionEvents,
      ],
      transitions: [
        { from: 'idle', to: 'idle', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', gameOverView]] },
        { from: 'idle', to: 'idle', event: 'NAVIGATE', effects: [] },
        { from: 'idle', to: 'idle', event: 'RESTART', effects: [] },
        ...actions.map(a => ({
          from: 'idle', to: 'idle', event: a.event, effects: [['render-ui', 'main', gameOverView]],
        })),
      ],
    },
  } as Trait;
}

function buildPage(c: GameOverConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdGameOverScreenEntity(params: StdGameOverScreenParams): Entity { return buildEntity(resolve(params)); }
export function stdGameOverScreenTrait(params: StdGameOverScreenParams): Trait { return buildTrait(resolve(params)); }
export function stdGameOverScreenPage(params: StdGameOverScreenParams): Page { return buildPage(resolve(params)); }

export function stdGameOverScreen(params: StdGameOverScreenParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
