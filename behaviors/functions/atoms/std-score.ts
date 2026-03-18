/**
 * std-score as a Function
 *
 * Score tracking parameterized for any domain.
 * Provides a single-state machine with self-loops for adding, subtracting,
 * resetting, and applying combo multipliers to a score.
 * The state machine structure is fixed. The caller controls data and presentation.
 *
 * @level atom
 * @family score
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdScoreParams {
  /** Entity name in PascalCase (e.g., "Points", "GameScore") */
  entityName: string;
  /** Entity fields (id is auto-added) */
  fields: EntityField[];
  /** Persistence mode */
  persistence?: 'persistent' | 'runtime' | 'singleton';

  // Display
  /** Score title */
  scoreTitle?: string;
  /** Header icon (Lucide name) */
  headerIcon?: string;

  // Page
  /** Page name (defaults to "{Entity}ScorePage") */
  pageName?: string;
  /** Route path (defaults to "/{entities}/score") */
  pagePath?: string;
  /** Whether this is the initial/home page */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface ScoreConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  scoreTitle: string;
  headerIcon: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdScoreParams): ScoreConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  // Ensure score-related fields exist on entity
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'total') ? [] : [{ name: 'total', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'combo') ? [] : [{ name: 'combo', type: 'number' as const, default: 1 }]),
    ...(baseFields.some(f => f.name === 'points') ? [] : [{ name: 'points', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'multiplier') ? [] : [{ name: 'multiplier', type: 'number' as const, default: 1 }]),
  ];

  const p = plural(entityName);

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Score`,
    pluralName: p,
    scoreTitle: params.scoreTitle ?? 'Score',
    headerIcon: params.headerIcon ?? 'trophy',
    pageName: params.pageName ?? `${entityName}ScorePage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/score`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: ScoreConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: ScoreConfig): Trait {
  const { entityName } = c;

  const scoreView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'score-board',
        score: '@entity.total',
        highScore: 0,
        combo: '@entity.combo',
        multiplier: 1,
        level: 1,
      },
      { type: 'animated-counter', value: '@entity.total', prefix: 'Score: ', duration: 300 },
      { type: 'trend-indicator', value: '@entity.points', showValue: true },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'center',
        children: [
          { type: 'button', label: 'Add', event: 'ADD', variant: 'primary', icon: 'plus' },
          { type: 'button', label: 'Subtract', event: 'SUBTRACT', variant: 'secondary', icon: 'minus' },
          { type: 'button', label: 'Combo', event: 'COMBO', variant: 'secondary', icon: 'zap' },
          { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
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
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'ADD', name: 'Add Points', payload: [{ name: 'points', type: 'number', required: true }] },
        { key: 'SUBTRACT', name: 'Subtract Points', payload: [{ name: 'points', type: 'number', required: true }] },
        { key: 'RESET', name: 'Reset' },
        { key: 'COMBO', name: 'Combo', payload: [{ name: 'multiplier', type: 'number', required: true }] },
      ],
      transitions: [
        // INIT: idle -> idle
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['render-ui', 'main', scoreView],
          ],
        },
        // ADD: idle -> idle (self-loop)
        {
          from: 'idle', to: 'idle', event: 'ADD',
          effects: [
            ['set', '@entity.points', '@payload.points'],
            ['render-ui', 'main', scoreView],
          ],
        },
        // SUBTRACT: idle -> idle (self-loop)
        {
          from: 'idle', to: 'idle', event: 'SUBTRACT',
          effects: [
            ['set', '@entity.points', '@payload.points'],
            ['render-ui', 'main', scoreView],
          ],
        },
        // COMBO: idle -> idle (self-loop)
        {
          from: 'idle', to: 'idle', event: 'COMBO',
          effects: [
            ['set', '@entity.multiplier', '@payload.multiplier'],
            ['render-ui', 'main', scoreView],
          ],
        },
        // RESET: idle -> idle (self-loop)
        {
          from: 'idle', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.total', 0],
            ['set', '@entity.combo', 1],
            ['render-ui', 'main', scoreView],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: ScoreConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdScoreEntity(params: StdScoreParams): Entity {
  return buildEntity(resolve(params));
}

export function stdScoreTrait(params: StdScoreParams): Trait {
  return buildTrait(resolve(params));
}

export function stdScorePage(params: StdScoreParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdScore(params: StdScoreParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
