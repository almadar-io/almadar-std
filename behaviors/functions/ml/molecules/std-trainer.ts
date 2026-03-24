/**
 * std-trainer
 *
 * ML training pipeline molecule. Composes three traits on one page
 * sharing the event bus:
 * - Train loop trait: runs training epochs
 * - Evaluate trait: computes metrics on held-out data
 * - Checkpoint trait: persists model weights
 *
 * Event flow: START_TRAINING -> [train-loop] -> TRAINING_DONE
 *   -> [evaluate] -> EVAL_DONE -> [checkpoint] -> MODEL_SAVED
 *
 * @level molecule
 * @family ml
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdTrainerParams {
  entityName: string;
  fields: EntityField[];
  architecture: unknown;
  trainingConfig: Record<string, unknown>;
  /** Metric names to track, e.g. ["loss", "accuracy"] */
  metrics: string[];
  /** Run evaluation after training completes. Default: true */
  evaluateAfterTraining?: boolean;
  /** Auto-checkpoint after evaluation. Default: true */
  autoCheckpoint?: boolean;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface TrainerConfig {
  entityName: string;
  fields: EntityField[];
  architecture: unknown;
  trainingConfig: Record<string, unknown>;
  metrics: string[];
  evaluateAfterTraining: boolean;
  autoCheckpoint: boolean;
  trainTraitName: string;
  evalTraitName: string;
  checkpointTraitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdTrainerParams): TrainerConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  // Ensure training-related fields exist on entity
  const domainFields: EntityField[] = [
    { name: 'epoch', type: 'number', default: 0 },
    { name: 'totalEpochs', type: 'number', default: 10 },
    { name: 'loss', type: 'number', default: 0 },
    { name: 'accuracy', type: 'number', default: 0 },
    { name: 'trainingStatus', type: 'string', default: 'idle' },
    { name: 'checkpointPath', type: 'string', default: '' },
    { name: 'evalScore', type: 'number', default: 0 },
  ];
  const userFieldNames = new Set(baseFields.map(f => f.name));
  const fields = [...baseFields, ...domainFields.filter(f => !userFieldNames.has(f.name))];

  const p = plural(entityName);

  return {
    entityName,
    fields,
    architecture: params.architecture,
    trainingConfig: params.trainingConfig,
    metrics: params.metrics,
    evaluateAfterTraining: params.evaluateAfterTraining ?? true,
    autoCheckpoint: params.autoCheckpoint ?? true,
    trainTraitName: `${entityName}TrainLoop`,
    evalTraitName: `${entityName}Evaluate`,
    checkpointTraitName: `${entityName}Checkpoint`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}TrainerPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/train`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Trait builders
// ============================================================================

function buildTrainLoopTrait(c: TrainerConfig): Trait {
  const { entityName } = c;

  const idleView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'cpu', size: 'lg' },
          { type: 'typography', content: `${entityName} Training`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'badge', label: '@entity.trainingStatus' },
      { type: 'typography', variant: 'body', color: 'muted', content: `Metrics: ${c.metrics.join(', ')}` },
      { type: 'button', label: 'Start Training', event: 'START_TRAINING', variant: 'primary', icon: 'play' },
    ],
  };

  const trainingView = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'typography', content: 'Training in Progress', variant: 'h3' },
      { type: 'typography', variant: 'caption', content: 'Epoch' },
      { type: 'progress-bar', value: '@entity.epoch', max: '@entity.totalEpochs' },
      { type: 'typography', variant: 'body', content: 'Loss: @entity.loss' },
      { type: 'spinner', size: 'md' },
    ],
  };

  const trainEffect: unknown[] = ['train', 'primary', {
    architecture: c.architecture,
    config: c.trainingConfig,
    metrics: c.metrics,
    'on-epoch': 'EPOCH_DONE',
    'on-complete': 'TRAINING_DONE',
  }];

  return {
    name: c.trainTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: ['TRAINING_DONE'],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'training' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'START_TRAINING', name: 'Start Training' },
        { key: 'EPOCH_DONE', name: 'Epoch Done' },
        { key: 'TRAINING_DONE', name: 'Training Done' },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['set', '@entity.trainingStatus', 'idle'],
            ['set', '@entity.totalEpochs', c.trainingConfig.epochs ?? 10],
            ['render-ui', 'main', idleView],
          ],
        },
        {
          from: 'idle', to: 'training', event: 'START_TRAINING',
          effects: [
            ['set', '@entity.trainingStatus', 'training'],
            ['set', '@entity.epoch', 0],
            trainEffect,
            ['render-ui', 'main', trainingView],
          ],
        },
        {
          from: 'training', to: 'training', event: 'EPOCH_DONE',
          effects: [
            ['set', '@entity.epoch', '@payload.epoch'],
            ['set', '@entity.loss', '@payload.loss'],
            ['render-ui', 'main', trainingView],
          ],
        },
        {
          from: 'training', to: 'idle', event: 'TRAINING_DONE',
          effects: [
            ['set', '@entity.trainingStatus', 'trained'],
            ['set', '@entity.loss', '@payload.finalLoss'],
            ['emit', 'TRAINING_DONE'],
            ['render-ui', 'main', idleView],
          ],
        },
      ],
    },
  } as Trait;
}

function buildEvaluateTrait(c: TrainerConfig): Trait {
  const { entityName } = c;

  const waitingView = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'icon', name: 'bar-chart-2', size: 'lg' },
      { type: 'typography', content: 'Evaluation', variant: 'h3' },
      { type: 'badge', label: 'Waiting for training', variant: 'neutral' },
    ],
  };

  const evaluatingView = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'typography', content: 'Evaluating Model', variant: 'h3' },
      { type: 'spinner', size: 'md' },
      { type: 'typography', variant: 'body', color: 'muted', content: `Computing: ${c.metrics.join(', ')}` },
    ],
  };

  const doneView = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'typography', content: 'Evaluation Complete', variant: 'h3' },
      { type: 'typography', variant: 'body', content: 'Score: @entity.evalScore' },
    ],
  };

  const evaluateEffect: unknown[] = ['evaluate', 'primary', {
    architecture: c.architecture,
    metrics: c.metrics,
    'on-complete': 'EVAL_DONE',
  }];

  return {
    name: c.evalTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: ['EVAL_DONE'],
    stateMachine: {
      states: [
        { name: 'waiting', isInitial: true },
        { name: 'evaluating' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'TRAINING_DONE', name: 'Training Done' },
        { key: 'EVAL_DONE', name: 'Evaluation Done' },
      ],
      transitions: [
        {
          from: 'waiting', to: 'waiting', event: 'INIT',
          effects: [
            ['render-ui', 'main', waitingView],
          ],
        },
        {
          from: 'waiting', to: 'evaluating', event: 'TRAINING_DONE',
          effects: [
            evaluateEffect,
            ['render-ui', 'main', evaluatingView],
          ],
        },
        {
          from: 'evaluating', to: 'waiting', event: 'EVAL_DONE',
          effects: [
            ['set', '@entity.evalScore', '@payload.score'],
            ['emit', 'EVAL_DONE'],
            ['render-ui', 'main', doneView],
          ],
        },
      ],
    },
  } as Trait;
}

function buildCheckpointTrait(c: TrainerConfig): Trait {
  const { entityName } = c;

  const idleView = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'icon', name: 'save', size: 'lg' },
      { type: 'typography', content: 'Checkpoint', variant: 'h3' },
      { type: 'badge', label: 'Waiting', variant: 'neutral' },
    ],
  };

  const savingView = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'typography', content: 'Saving Checkpoint', variant: 'h3' },
      { type: 'spinner', size: 'md' },
    ],
  };

  const savedView = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'typography', content: 'Model Saved', variant: 'h3' },
      { type: 'typography', variant: 'caption', content: '@entity.checkpointPath' },
    ],
  };

  const checkpointEffect: unknown[] = ['checkpoint', 'primary', {
    architecture: c.architecture,
    'on-complete': 'MODEL_SAVED',
  }];

  return {
    name: c.checkpointTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: ['MODEL_SAVED'],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'saving' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'EVAL_DONE', name: 'Evaluation Done' },
        { key: 'MODEL_SAVED', name: 'Model Saved' },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['render-ui', 'main', idleView],
          ],
        },
        {
          from: 'idle', to: 'saving', event: 'EVAL_DONE',
          effects: [
            checkpointEffect,
            ['render-ui', 'main', savingView],
          ],
        },
        {
          from: 'saving', to: 'idle', event: 'MODEL_SAVED',
          effects: [
            ['set', '@entity.checkpointPath', '@payload.path'],
            ['set', '@entity.trainingStatus', 'saved'],
            ['emit', 'MODEL_SAVED'],
            ['render-ui', 'main', savedView],
          ],
        },
      ],
    },
  } as Trait;
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdTrainerEntity(params: StdTrainerParams): Entity {
  const c = resolve(params);
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: 'runtime' });
}

export function stdTrainerTrait(params: StdTrainerParams): Trait {
  return buildTrainLoopTrait(resolve(params));
}

export function stdTrainerPage(params: StdTrainerParams): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: c.trainTraitName },
      { ref: c.evalTraitName },
      { ref: c.checkpointTraitName },
    ],
  } as Page;
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdTrainer(params: StdTrainerParams): OrbitalDefinition {
  const c = resolve(params);

  const entity = makeEntity({ name: c.entityName, fields: c.fields, persistence: 'runtime' });

  // Build all three traits
  const trainTrait = buildTrainLoopTrait(c);
  const traits: Trait[] = [trainTrait];

  if (c.evaluateAfterTraining) {
    const evalTrait = buildEvaluateTrait(c);
    traits.push(evalTrait);
  }

  if (c.autoCheckpoint && c.evaluateAfterTraining) {
    const checkpointTrait = buildCheckpointTrait(c);
    traits.push(checkpointTrait);
  }

  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: traits.map(t => ({ ref: t.name })),
  } as Page;

  return {
    name: `${c.entityName}Orbital`,
    entity,
    traits,
    pages: [page],
  } as OrbitalDefinition;
}
