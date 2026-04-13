/**
 * std-evaluate as a Function
 *
 * Evaluation behavior parameterized for any ML domain.
 * Runs a model evaluation pass over a test set and reports metrics.
 * Supports configurable metric names (accuracy, f1, precision, recall, etc.).
 *
 * @level atom
 * @family ml
 * @packageDocumentation
 */

import type { OrbitalDefinition, OrbitalSchema, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, makeSchema, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdEvaluateParams {
  /** Entity name in PascalCase (e.g., "Evaluator", "Benchmark") */
  entityName: string;
  /** Entity fields (id is auto-added) */
  fields: EntityField[];
  /** Static JSON architecture tree */
  architecture: unknown;
  /** Metric names to track (e.g., ["accuracy", "f1", "precision", "recall"]) */
  metrics: string[];
  /** Event that triggers evaluation (default: "EVALUATE") */
  evaluateEvent?: string;
  /** Event emitted when evaluation completes (default: "EVAL_DONE") */
  doneEvent?: string;
  /** Persistence mode */
  persistence?: 'runtime' | 'singleton';

  // Page
  /** Page name (defaults to "{Entity}EvalPage") */
  pageName?: string;
  /** Route path (defaults to "/{entities}/eval") */
  pagePath?: string;
  /** Whether this is the initial/home page */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface EvaluateConfig {
  entityName: string;
  fields: EntityField[];
  architecture: unknown;
  metrics: string[];
  evaluateEvent: string;
  doneEvent: string;
  persistence: 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdEvaluateParams): EvaluateConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  // Ensure status field exists, plus a field for each requested metric
  const metricFields: EntityField[] = params.metrics
    .filter(m => !baseFields.some(f => f.name === m))
    .map(m => ({ name: m, type: 'number' as const, default: 0 }));

  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'status') ? [] : [{ name: 'status', type: 'string' as const, default: 'ready' }]),
    ...metricFields,
  ];

  const p = plural(entityName);

  return {
    entityName,
    fields,
    architecture: params.architecture,
    metrics: params.metrics,
    evaluateEvent: params.evaluateEvent ?? 'EVALUATE',
    doneEvent: params.doneEvent ?? 'EVAL_DONE',
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Evaluate`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}EvalPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/eval`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: EvaluateConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: EvaluateConfig): Trait {
  const { entityName, evaluateEvent, doneEvent, metrics } = c;

  // Ready view: metric displays + evaluate button
  const metricDisplays = metrics.map(m => ({
    type: 'stat-display', label: m, value: `@entity.${m}`,
  }));

  const readyView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'bar-chart-3', size: 'lg' },
          { type: 'typography', content: entityName, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'badge', label: '@entity.status' },
      ...metricDisplays,
      { type: 'button', label: 'Evaluate', event: evaluateEvent, variant: 'primary', icon: 'play' },
    ],
  };

  // Evaluating view: spinner + progress
  const evaluatingView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'loading-state', title: 'Evaluating', message: 'Running evaluation pass...' },
      { type: 'spinner', size: 'lg' },
    ],
  };

  // Build the evaluate effect s-expression
  const evaluateEffect: unknown[] = ['evaluate', 'primary', {
    architecture: c.architecture,
    metrics: c.metrics,
    'on-complete': doneEvent,
  }];

  // Build set-effects for each metric from payload
  const metricSetEffects: unknown[][] = metrics.map(m => ['set', `@entity.${m}`, `@payload.${m}`]);

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [{ event: doneEvent, scope: 'external' as const }],
    stateMachine: {
      states: [
        { name: 'ready', isInitial: true },
        { name: 'evaluating' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: evaluateEvent, name: 'Run Evaluation' },
        { key: doneEvent, name: 'Evaluation Done' },
      ],
      transitions: [
        // INIT: ready -> ready
        {
          from: 'ready', to: 'ready', event: 'INIT',
          effects: [
            ['set', '@entity.status', 'ready'],
            ['render-ui', 'main', readyView],
          ],
        },
        // evaluateEvent: ready -> evaluating (fire evaluation)
        {
          from: 'ready', to: 'evaluating', event: evaluateEvent,
          effects: [
            ['set', '@entity.status', 'evaluating'],
            evaluateEffect,
            ['render-ui', 'main', evaluatingView],
          ],
        },
        // doneEvent: evaluating -> ready (store metrics)
        {
          from: 'evaluating', to: 'ready', event: doneEvent,
          effects: [
            ...metricSetEffects,
            ['set', '@entity.status', 'ready'],
            ['emit', doneEvent],
            ['render-ui', 'main', readyView],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: EvaluateConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdEvaluateEntity(params: StdEvaluateParams): Entity {
  return buildEntity(resolve(params));
}

export function stdEvaluateTrait(params: StdEvaluateParams): Trait {
  return buildTrait(resolve(params));
}

export function stdEvaluatePage(params: StdEvaluateParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdEvaluate(params: StdEvaluateParams): OrbitalSchema {
  const c = resolve(params);
  return makeSchema(`${c.entityName}Orbital`, makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  ));
}
