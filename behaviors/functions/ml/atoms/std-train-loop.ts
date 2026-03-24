/**
 * std-train-loop as a Function
 *
 * Training loop behavior parameterized for any ML domain.
 * Manages a full training lifecycle: idle, training, done.
 * Supports epoch-level progress tracking via a self-loop transition.
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

export interface StdTrainLoopParams {
  /** Entity name in PascalCase (e.g., "Model", "Network") */
  entityName: string;
  /** Entity fields (id is auto-added) */
  fields: EntityField[];
  /** Static JSON architecture tree */
  architecture: unknown;
  /** Training configuration (epochs, optimizer, loss, lr, etc.) */
  trainingConfig: Record<string, unknown>;
  /** Event that starts training (default: "START_TRAINING") */
  startEvent?: string;
  /** Event emitted after each epoch (default: "EPOCH_COMPLETE") */
  epochEvent?: string;
  /** Event emitted when training finishes (default: "TRAINING_DONE") */
  doneEvent?: string;
  /** Persistence mode */
  persistence?: 'runtime' | 'singleton';

  // Page
  /** Page name (defaults to "{Entity}TrainPage") */
  pageName?: string;
  /** Route path (defaults to "/{entities}/train") */
  pagePath?: string;
  /** Whether this is the initial/home page */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface TrainLoopConfig {
  entityName: string;
  fields: EntityField[];
  architecture: unknown;
  trainingConfig: Record<string, unknown>;
  startEvent: string;
  epochEvent: string;
  doneEvent: string;
  persistence: 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdTrainLoopParams): TrainLoopConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  // Ensure training-related fields exist on entity
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'epoch') ? [] : [{ name: 'epoch', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'loss') ? [] : [{ name: 'loss', type: 'number' as const, default: 0 }]),
    ...(baseFields.some(f => f.name === 'status') ? [] : [{ name: 'status', type: 'string' as const, default: 'idle' }]),
    ...(baseFields.some(f => f.name === 'weights') ? [] : [{ name: 'weights', type: 'string' as const, default: '' }]),
  ];

  const p = plural(entityName);

  return {
    entityName,
    fields,
    architecture: params.architecture,
    trainingConfig: params.trainingConfig,
    startEvent: params.startEvent ?? 'START_TRAINING',
    epochEvent: params.epochEvent ?? 'EPOCH_COMPLETE',
    doneEvent: params.doneEvent ?? 'TRAINING_DONE',
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}TrainLoop`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}TrainPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/train`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: TrainLoopConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: TrainLoopConfig): Trait {
  const { entityName, startEvent, epochEvent, doneEvent } = c;

  const epochs = c.trainingConfig.epochs ?? 100;

  // Idle view: config summary + start button
  const idleView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      { type: 'page-header', title: `${entityName} Training`, subtitle: 'Neural network training loop', icon: 'graduation-cap' },
      {
        type: 'stats-grid', columns: 3, children: [
          { type: 'stat-display', label: 'Status', value: '@entity.status', icon: 'activity' },
          { type: 'stat-display', label: 'Best Loss', value: '@entity.bestLoss', icon: 'trending-down' },
          { type: 'stat-display', label: 'Epochs', value: `${epochs}`, icon: 'repeat' },
        ],
      },
      { type: 'divider' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'center',
        children: [
          { type: 'button', label: 'Start Training', event: startEvent, variant: 'primary', icon: 'play' },
        ],
      },
    ],
  };

  // Training view: live progress
  const trainingView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      { type: 'page-header', title: `${entityName} Training`, subtitle: 'Training in progress...', icon: 'graduation-cap' },
      { type: 'progress-bar', value: '@entity.epoch', max: epochs, label: 'Training Progress' },
      {
        type: 'stats-grid', columns: 3, children: [
          { type: 'stat-display', label: 'Epoch', value: '@entity.epoch', icon: 'hash' },
          { type: 'stat-display', label: 'Current Loss', value: '@entity.loss', icon: 'trending-down' },
          { type: 'stat-display', label: 'Status', value: 'training', icon: 'loader' },
        ],
      },
      { type: 'loading-state', title: 'Training', message: 'Optimizing model weights...' },
    ],
  };

  // Complete view: training results
  const completeView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      { type: 'page-header', title: `${entityName} Training`, subtitle: 'Training complete', icon: 'graduation-cap' },
      { type: 'alert', variant: 'success', title: 'Training Complete', message: 'Model weights updated successfully.' },
      {
        type: 'stats-grid', columns: 3, children: [
          { type: 'stat-display', label: 'Final Loss', value: '@entity.loss', icon: 'trending-down' },
          { type: 'stat-display', label: 'Epochs Completed', value: '@entity.epoch', icon: 'check-circle' },
          { type: 'stat-display', label: 'Best Loss', value: '@entity.bestLoss', icon: 'award' },
        ],
      },
      { type: 'divider' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'center',
        children: [
          { type: 'button', label: 'Retrain', event: startEvent, variant: 'primary', icon: 'refresh-cw' },
        ],
      },
    ],
  };

  // Build the train effect s-expression
  const trainEffect: unknown[] = ['train', 'primary', {
    architecture: c.architecture,
    config: c.trainingConfig,
    'on-epoch': epochEvent,
    'on-complete': doneEvent,
  }];

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [{ event: doneEvent, scope: 'external' as const }],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'training' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: startEvent, name: 'Start Training' },
        { key: epochEvent, name: 'Epoch Complete' },
        { key: doneEvent, name: 'Training Done' },
      ],
      transitions: [
        // INIT: idle -> idle
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['set', '@entity.status', 'idle'],
            ['render-ui', 'main', idleView],
          ],
        },
        // startEvent: idle -> training (fire train loop)
        {
          from: 'idle', to: 'training', event: startEvent,
          effects: [
            ['set', '@entity.status', 'training'],
            ['set', '@entity.epoch', 0],
            ['set', '@entity.loss', 0],
            trainEffect,
            ['render-ui', 'main', trainingView],
          ],
        },
        // epochEvent: training -> training (self-loop, update progress)
        {
          from: 'training', to: 'training', event: epochEvent,
          effects: [
            ['set', '@entity.epoch', '@payload.epoch'],
            ['set', '@entity.loss', '@payload.loss'],
            ['render-ui', 'main', trainingView],
          ],
        },
        // doneEvent: training -> idle (store final weights, show results)
        {
          from: 'training', to: 'idle', event: doneEvent,
          effects: [
            ['set', '@entity.weights', '@payload.weights'],
            ['set', '@entity.loss', '@payload.finalLoss'],
            ['set', '@entity.bestLoss', '@payload.finalLoss'],
            ['set', '@entity.status', 'complete'],
            ['emit', doneEvent],
            ['render-ui', 'main', completeView],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: TrainLoopConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdTrainLoopEntity(params: StdTrainLoopParams): Entity {
  return buildEntity(resolve(params));
}

export function stdTrainLoopTrait(params: StdTrainLoopParams): Trait {
  return buildTrait(resolve(params));
}

export function stdTrainLoopPage(params: StdTrainLoopParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdTrainLoop(params: StdTrainLoopParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
