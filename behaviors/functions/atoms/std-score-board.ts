/**
 * std-score-board
 *
 * Score display atom using the `score-board` pattern.
 * Shows score, high score, combo, multiplier, level.
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

export interface StdScoreBoardParams {
  entityName: string;
  fields: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface ScoreBoardConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdScoreBoardParams): ScoreBoardConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);
  const p = plural(entityName);

  // Ensure score fields exist
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'score') ? [] : [{ name: 'score', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'highScore') ? [] : [{ name: 'highScore', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'combo') ? [] : [{ name: 'combo', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'multiplier') ? [] : [{ name: 'multiplier', type: 'number' as const, default: 1 }]),
    ...(baseFields.some(f => f.name === 'level') ? [] : [{ name: 'level', type: 'number' as const, default: 1 }]),
  ];

  return {
    entityName, fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}ScoreBoard`,
    pageName: params.pageName ?? `${entityName}ScorePage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: ScoreBoardConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: ScoreBoardConfig): Trait {
  const { entityName } = c;

  const boardView = {
    type: 'score-board',
    score: `@entity.score`,
    highScore: `@entity.highScore`,
    combo: `@entity.combo`,
    multiplier: `@entity.multiplier`,
    level: `@entity.level`,
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [{ name: 'idle', isInitial: true }],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'ADD_SCORE', name: 'Add Score', payload: [{ name: 'points', type: 'number', required: true }] },
        { key: 'COMBO', name: 'Combo', payload: [{ name: 'multiplier', type: 'number', required: true }] },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions: [
        { from: 'idle', to: 'idle', event: 'INIT', effects: [['fetch', entityName], ['render-ui', 'main', boardView]] },
        { from: 'idle', to: 'idle', event: 'ADD_SCORE', effects: [
          ['set', '@entity.score', ['+', '@entity.score', '@payload.points']],
          ['set', '@entity.combo', ['+', '@entity.combo', 1]],
          ['render-ui', 'main', boardView],
        ] },
        { from: 'idle', to: 'idle', event: 'COMBO', effects: [
          ['set', '@entity.multiplier', '@payload.multiplier'],
          ['render-ui', 'main', boardView],
        ] },
        { from: 'idle', to: 'idle', event: 'RESET', effects: [
          ['set', '@entity.score', 0],
          ['set', '@entity.combo', 0],
          ['set', '@entity.multiplier', 1],
          ['render-ui', 'main', boardView],
        ] },
      ],
    },
  } as Trait;
}

function buildPage(c: ScoreBoardConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Build the score board entity.
 *
 * @param {StdScoreBoardParams} params - Score board configuration parameters
 * @returns {Entity} The configured score board entity
 */
export function stdScoreBoardEntity(params: StdScoreBoardParams): Entity { return buildEntity(resolve(params)); }
/**
 * Build the score board trait.
 *
 * @param {StdScoreBoardParams} params - Score board configuration parameters
 * @returns {Trait} The configured score board trait
 */
export function stdScoreBoardTrait(params: StdScoreBoardParams): Trait { return buildTrait(resolve(params)); }
/**
 * Build the score board page.
 *
 * @param {StdScoreBoardParams} params - Score board configuration parameters
 * @returns {Page} The configured score board page
 */
export function stdScoreBoardPage(params: StdScoreBoardParams): Page { return buildPage(resolve(params)); }

export function stdScoreBoard(params: StdScoreBoardParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
