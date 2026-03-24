/**
 * std-forward as a Function
 *
 * Inference behavior parameterized for any ML domain.
 * Wraps a forward pass through a static architecture tree.
 * Accepts input via an event, runs inference, emits the prediction.
 *
 * @level atom
 * @family ml
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdForwardParams {
  /** Entity name in PascalCase (e.g., "Classifier", "Detector") */
  entityName: string;
  /** Entity fields (id is auto-added) */
  fields: EntityField[];
  /** Static JSON architecture tree */
  architecture: unknown;
  /** Input validation contract */
  inputContract?: unknown;
  /** Output validation contract */
  outputContract?: unknown;
  /** Event that triggers inference (default: "PREDICT") */
  inputEvent?: string;
  /** Event emitted when inference completes (default: "PREDICTION_READY") */
  outputEvent?: string;
  /** Persistence mode */
  persistence?: 'runtime' | 'singleton';

  // Page
  /** Page name (defaults to "{Entity}ForwardPage") */
  pageName?: string;
  /** Route path (defaults to "/{entities}/forward") */
  pagePath?: string;
  /** Whether this is the initial/home page */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface ForwardConfig {
  entityName: string;
  fields: EntityField[];
  architecture: unknown;
  inputContract: unknown | undefined;
  outputContract: unknown | undefined;
  inputEvent: string;
  outputEvent: string;
  persistence: 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdForwardParams): ForwardConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  // Ensure inference-related fields exist on entity
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'prediction') ? [] : [{ name: 'prediction', type: 'string' as const, default: '' }]),
    ...(baseFields.some(f => f.name === 'confidence') ? [] : [{ name: 'confidence', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'status') ? [] : [{ name: 'status', type: 'string' as const, default: 'ready' }]),
  ];

  const p = plural(entityName);

  return {
    entityName,
    fields,
    architecture: params.architecture,
    inputContract: params.inputContract,
    outputContract: params.outputContract,
    inputEvent: params.inputEvent ?? 'PREDICT',
    outputEvent: params.outputEvent ?? 'PREDICTION_READY',
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Forward`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}ForwardPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/forward`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: ForwardConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: ForwardConfig): Trait {
  const { entityName, inputEvent, outputEvent } = c;

  // Ready view: model info header + predict button
  const readyView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      { type: 'page-header', title: `${entityName} Inference`, subtitle: 'Neural network forward pass', icon: 'brain' },
      {
        type: 'stats-grid', columns: 3, children: [
          { type: 'stat-display', label: 'Status', value: '@entity.status', icon: 'activity' },
          { type: 'stat-display', label: 'Prediction', value: '@entity.prediction', icon: 'target' },
          { type: 'stat-display', label: 'Confidence', value: '@entity.confidence', icon: 'bar-chart' },
        ],
      },
      { type: 'divider' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'center',
        children: [
          { type: 'button', label: 'Run Prediction', event: inputEvent, variant: 'primary', icon: 'play' },
        ],
      },
    ],
  };

  // Inferring view: loading state
  const inferringView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      { type: 'page-header', title: `${entityName} Inference`, subtitle: 'Running forward pass...', icon: 'brain' },
      { type: 'loading-state', title: 'Inferring', message: 'Processing input through neural network...' },
      { type: 'progress-bar', value: 50, max: 100, label: 'Forward pass' },
    ],
  };

  // Result view: shows prediction with confidence bar
  const resultView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      { type: 'page-header', title: `${entityName} Inference`, subtitle: 'Prediction complete', icon: 'brain' },
      {
        type: 'card', title: 'Prediction Result', children: [
          {
            type: 'stats-grid', columns: 2, children: [
              { type: 'stat-display', label: 'Predicted Class', value: '@entity.prediction', icon: 'target' },
              { type: 'stat-display', label: 'Confidence', value: '@entity.confidence', icon: 'bar-chart' },
            ],
          },
          { type: 'progress-bar', value: '@entity.confidence', max: 1, label: 'Confidence' },
        ],
      },
      { type: 'divider' },
      { type: 'badge', label: '@entity.status', variant: 'success' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'center',
        children: [
          { type: 'button', label: 'Predict Again', event: inputEvent, variant: 'primary', icon: 'refresh-cw' },
        ],
      },
    ],
  };

  // Build the forward effect s-expression
  const forwardEffect: unknown[] = ['forward', 'primary', {
    architecture: c.architecture,
    input: '@payload.input',
    'input-contract': c.inputContract,
    'output-contract': c.outputContract,
    'on-complete': outputEvent,
  }];

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [outputEvent],
    stateMachine: {
      states: [
        { name: 'ready', isInitial: true },
        { name: 'inferring' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: inputEvent, name: 'Run Inference' },
        { key: outputEvent, name: 'Prediction Ready' },
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
        // inputEvent: ready -> inferring (fire forward pass)
        {
          from: 'ready', to: 'inferring', event: inputEvent,
          effects: [
            ['set', '@entity.status', 'inferring'],
            forwardEffect,
            ['render-ui', 'main', inferringView],
          ],
        },
        // outputEvent: inferring -> ready (store results, show result view)
        {
          from: 'inferring', to: 'ready', event: outputEvent,
          effects: [
            ['set', '@entity.prediction', ['tensor/argmax', '@payload.output']],
            ['set', '@entity.confidence', ['tensor/max', '@payload.output']],
            ['set', '@entity.status', 'complete'],
            ['emit', outputEvent],
            ['render-ui', 'main', resultView],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: ForwardConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdForwardEntity(params: StdForwardParams): Entity {
  return buildEntity(resolve(params));
}

export function stdForwardTrait(params: StdForwardParams): Trait {
  return buildTrait(resolve(params));
}

export function stdForwardPage(params: StdForwardParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdForward(params: StdForwardParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
