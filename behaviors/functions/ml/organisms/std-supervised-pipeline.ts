/**
 * std-supervised-pipeline
 *
 * Full supervised learning pipeline organism. Composes three orbitals:
 * 1. Data Collector: accumulates training data, emits BUFFER_READY
 * 2. Trainer: trains model, evaluates, checkpoints, emits MODEL_READY
 * 3. Serving: loads trained weights, serves predictions
 *
 * Cross-orbital events:
 * - BUFFER_READY: Data Collector → Trainer
 * - MODEL_READY: Trainer → Serving
 *
 * @level organism
 * @family ml
 * @packageDocumentation
 */

import type { OrbitalSchema, EntityField } from '@almadar/core/types';

// ============================================================================
// Params
// ============================================================================

export interface StdSupervisedPipelineParams {
  appName?: string;
  architecture: unknown;
  dataFields?: EntityField[];
  targetField?: string;
  classes?: string[];
  trainingConfig?: Record<string, unknown>;
  metrics?: string[];
  bufferSize?: number;
}

// ============================================================================
// Builder
// ============================================================================

export function stdSupervisedPipeline(params: StdSupervisedPipelineParams): OrbitalSchema {
  const {
    appName = 'Supervised Pipeline',
    architecture,
    dataFields = [{ name: 'features', type: 'array' as const }, { name: 'label', type: 'number' as const }],
    targetField = 'label',
    classes,
    trainingConfig = { epochs: 10, optimizer: { type: 'adam', lr: 0.001 }, loss: 'mse' },
    metrics = ['accuracy'],
    bufferSize = 100,
  } = params;

  return {
    name: appName,
    description: `Supervised learning pipeline: collect data → train → serve predictions`,
    version: '1.0.0',
    orbitals: [
      // Orbital 1: Data Collector
      {
        name: 'Data Collector',
        entity: {
          name: 'Buffer',
          runtime: true,
          fields: [
            { name: 'id', type: 'string', required: true, primaryKey: true },
            { name: 'buffer', type: 'array', default: [] },
            { name: 'count', type: 'number', default: 0 },
          ],
        },
        traits: [{
          name: 'DataCollector',
          category: 'interaction' as const,
          linkedEntity: 'Buffer',
          emits: [
            { event: 'BUFFER_READY', scope: 'external' as const, description: 'Training data buffer is full',
              payload: [{ name: 'data', type: 'array' }] },
          ],
          stateMachine: {
            states: [{ name: 'collecting', isInitial: true }],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'DATA_POINT', name: 'New Data Point' },
            ],
            transitions: [
              { from: 'collecting', to: 'collecting', event: 'INIT', effects: [
                ['render-ui', 'main', { type: 'page-header', title: 'Data Collector', subtitle: 'Gathering training data' }],
              ]},
              { from: 'collecting', to: 'collecting', event: 'DATA_POINT',
                guard: ['<', '@entity.count', bufferSize],
                effects: [
                  ['set', '@entity.buffer', ['array/append', '@entity.buffer', '@payload']],
                  ['set', '@entity.count', ['+', '@entity.count', 1]],
                ]},
              { from: 'collecting', to: 'collecting', event: 'DATA_POINT',
                guard: ['>=', '@entity.count', bufferSize],
                effects: [
                  ['emit', 'BUFFER_READY', { data: '@entity.buffer' }],
                  ['set', '@entity.buffer', []],
                  ['set', '@entity.count', 0],
                ]},
            ],
          },
        }],
        pages: [{ name: 'CollectorPage', path: '/collector', isInitial: true, traits: [{ ref: 'DataCollector' }] }],
      },

      // Orbital 2: Trainer
      {
        name: 'Trainer',
        entity: {
          name: 'TrainerModel',
          runtime: true,
          fields: [
            { name: 'id', type: 'string', required: true, primaryKey: true },
            { name: 'architecture', type: 'object', default: architecture },
            { name: 'currentEpoch', type: 'number', default: 0 },
            { name: 'currentLoss', type: 'number', default: 999 },
            { name: 'bestLoss', type: 'number', default: 999 },
            { name: 'metrics', type: 'object', default: {} },
          ],
        },
        traits: [{
          name: 'ModelTrainer',
          category: 'interaction' as const,
          linkedEntity: 'TrainerModel',
          listens: [
            { event: 'BUFFER_READY', triggers: 'START_TRAINING', scope: 'external' as const, description: 'Start training when data ready' },
          ],
          emits: [
            { event: 'MODEL_READY', scope: 'external' as const, description: 'Trained model ready for serving',
              payload: [{ name: 'weights', type: 'object' }, { name: 'loss', type: 'number' }] },
          ],
          stateMachine: {
            states: [
              { name: 'idle', isInitial: true },
              { name: 'training' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'START_TRAINING', name: 'Start Training' },
              { key: 'TRAINING_DONE', name: 'Training Done' },
            ],
            transitions: [
              { from: 'idle', to: 'idle', event: 'INIT', effects: [
                ['render-ui', 'main', { type: 'page-header', title: 'Model Trainer', subtitle: 'Waiting for data' }],
              ]},
              { from: 'idle', to: 'training', event: 'START_TRAINING', effects: [
                ['train', {
                  architecture,
                  dataset: '@payload.data',
                  config: trainingConfig,
                  'on-complete': 'TRAINING_DONE',
                }],
              ]},
              { from: 'training', to: 'idle', event: 'TRAINING_DONE', effects: [
                ['set', '@entity.currentLoss', '@payload.finalLoss'],
                ['emit', 'MODEL_READY', { weights: '@payload.weights', loss: '@payload.finalLoss' }],
              ]},
            ],
          },
        }],
        pages: [{ name: 'TrainerPage', path: '/trainer', traits: [{ ref: 'ModelTrainer' }] }],
      },

      // Orbital 3: Serving
      {
        name: 'Serving',
        entity: {
          name: 'Server',
          runtime: true,
          fields: [
            { name: 'id', type: 'string', required: true, primaryKey: true },
            { name: 'architecture', type: 'object', default: architecture },
            { name: 'modelLoaded', type: 'boolean', default: false },
            { name: 'prediction', type: 'number', default: -1 },
            { name: 'confidence', type: 'number', default: 0 },
          ],
        },
        traits: [{
          name: 'InferenceServer',
          category: 'interaction' as const,
          linkedEntity: 'Server',
          listens: [
            { event: 'MODEL_READY', triggers: 'LOAD_MODEL', scope: 'external' as const, description: 'Load trained model' },
          ],
          stateMachine: {
            states: [
              { name: 'waiting', isInitial: true },
              { name: 'ready' },
              { name: 'inferring' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'LOAD_MODEL', name: 'Load Model' },
              { key: 'PREDICT', name: 'Predict' },
              { key: 'PREDICTION_READY', name: 'Prediction Ready' },
            ],
            transitions: [
              { from: 'waiting', to: 'waiting', event: 'INIT', effects: [
                ['render-ui', 'main', { type: 'page-header', title: 'Inference Server', subtitle: 'Waiting for trained model' }],
              ]},
              { from: 'waiting', to: 'ready', event: 'LOAD_MODEL', effects: [
                ['set', '@entity.modelLoaded', true],
              ]},
              { from: 'ready', to: 'inferring', event: 'PREDICT', effects: [
                ['forward', 'primary', {
                  architecture,
                  input: '@payload.input',
                  'on-complete': 'PREDICTION_READY',
                }],
              ]},
              { from: 'inferring', to: 'ready', event: 'PREDICTION_READY', effects: [
                ['set', '@entity.prediction', ['tensor/argmax', '@payload.output']],
                ['set', '@entity.confidence', ['tensor/max', '@payload.output']],
              ]},
            ],
          },
        }],
        pages: [{ name: 'ServingPage', path: '/serving', traits: [{ ref: 'InferenceServer' }] }],
      },
    ],
  } as unknown as OrbitalSchema;
}
