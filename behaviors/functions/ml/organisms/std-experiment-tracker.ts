/**
 * std-experiment-tracker
 *
 * Hyperparameter search organism. Multiple trainer orbitals + comparison orbital.
 * Each experiment trains independently, comparison orbital picks the best.
 *
 * Cross-orbital events:
 * - EXPERIMENT_DONE: Each Trainer → Comparison
 * - BEST_MODEL_SELECTED: Comparison → (external consumer)
 *
 * @level organism
 * @family ml
 * @packageDocumentation
 */

import type { OrbitalSchema } from '@almadar/core/types';

// ============================================================================
// Params
// ============================================================================

export interface StdExperimentTrackerParams {
  appName?: string;
  architecture: unknown;
  experiments: Array<{
    name: string;
    config: Record<string, unknown>;
  }>;
  comparisonMetric?: string;
}

// ============================================================================
// Builder
// ============================================================================

export function stdExperimentTracker(params: StdExperimentTrackerParams): OrbitalSchema {
  const {
    appName = 'Experiment Tracker',
    architecture,
    experiments,
    comparisonMetric = 'loss',
  } = params;

  const experimentOrbitals = experiments.map((exp, i) => ({
    name: `Experiment: ${exp.name}`,
    entity: {
      name: `Exp${i}Model`,
      runtime: true,
      fields: [
        { name: 'id', type: 'string', required: true, primaryKey: true },
        { name: 'experimentName', type: 'string', default: exp.name },
        { name: 'finalLoss', type: 'number', default: 999 },
        { name: 'metrics', type: 'object', default: {} },
        { name: 'status', type: 'string', default: 'pending' },
      ],
    },
    traits: [{
      name: `Exp${i}Trainer`,
      category: 'interaction' as const,
      linkedEntity: `Exp${i}Model`,
      emits: [
        { event: 'EXPERIMENT_DONE', scope: 'external' as const,
          payload: [
            { name: 'name', type: 'string' },
            { name: 'loss', type: 'number' },
            { name: 'metrics', type: 'object' },
          ]},
      ],
      stateMachine: {
        states: [
          { name: 'pending', isInitial: true },
          { name: 'training' },
          { name: 'done' },
        ],
        events: [
          { key: 'INIT', name: 'Initialize' },
          { key: 'RUN_EXPERIMENT', name: 'Run Experiment' },
          { key: 'TRAINING_DONE', name: 'Training Done' },
        ],
        transitions: [
          { from: 'pending', to: 'pending', event: 'INIT', effects: [
            ['render-ui', 'main', { type: 'page-header', title: `Experiment: ${exp.name}`, subtitle: 'Pending' }],
          ]},
          { from: 'pending', to: 'training', event: 'RUN_EXPERIMENT', effects: [
            ['set', '@entity.status', 'training'],
            ['train', {
              architecture,
              dataset: '@payload.data',
              config: exp.config,
              'on-complete': 'TRAINING_DONE',
            }],
          ]},
          { from: 'training', to: 'done', event: 'TRAINING_DONE', effects: [
            ['set', '@entity.finalLoss', '@payload.finalLoss'],
            ['set', '@entity.status', 'done'],
            ['emit', 'EXPERIMENT_DONE', {
              name: exp.name,
              loss: '@payload.finalLoss',
              metrics: '@payload.history',
            }],
          ]},
        ],
      },
    }],
    pages: [{ name: `Exp${i}Page`, path: `/experiment-${i}`, ...(i === 0 ? { isInitial: true } : {}), traits: [{ ref: `Exp${i}Trainer` }] }],
  }));

  const comparisonOrbital = {
    name: 'Comparison',
    entity: {
      name: 'Comparison',
      runtime: true,
      fields: [
        { name: 'id', type: 'string', required: true, primaryKey: true },
        { name: 'results', type: 'array', default: [] },
        { name: 'bestExperiment', type: 'string', default: '' },
        { name: 'bestLoss', type: 'number', default: 999 },
        { name: 'completedCount', type: 'number', default: 0 },
      ],
    },
    traits: [{
      name: 'ExperimentComparison',
      category: 'interaction' as const,
      linkedEntity: 'Comparison',
      listens: [
        { event: 'EXPERIMENT_DONE', triggers: 'RECORD_RESULT', scope: 'external' as const },
      ],
      emits: [
        { event: 'BEST_MODEL_SELECTED', scope: 'external' as const,
          payload: [{ name: 'name', type: 'string' }, { name: 'loss', type: 'number' }] },
      ],
      stateMachine: {
        states: [{ name: 'collecting', isInitial: true }],
        events: [
          { key: 'INIT', name: 'Initialize' },
          { key: 'RECORD_RESULT', name: 'Record Result' },
        ],
        transitions: [
          { from: 'collecting', to: 'collecting', event: 'INIT', effects: [
            ['render-ui', 'main', { type: 'page-header', title: 'Experiment Comparison', subtitle: `Tracking ${experiments.length} experiments` }],
          ]},
          { from: 'collecting', to: 'collecting', event: 'RECORD_RESULT',
            description: 'Better result found',
            guard: ['<', '@payload.loss', '@entity.bestLoss'],
            effects: [
              ['set', '@entity.results', ['array/append', '@entity.results', '@payload']],
              ['set', '@entity.bestExperiment', '@payload.name'],
              ['set', '@entity.bestLoss', '@payload.loss'],
              ['set', '@entity.completedCount', ['+', '@entity.completedCount', 1]],
            ]},
          { from: 'collecting', to: 'collecting', event: 'RECORD_RESULT',
            description: 'Result recorded (not better)',
            guard: ['>=', '@payload.loss', '@entity.bestLoss'],
            effects: [
              ['set', '@entity.results', ['array/append', '@entity.results', '@payload']],
              ['set', '@entity.completedCount', ['+', '@entity.completedCount', 1]],
            ]},
        ],
      },
    }],
    pages: [{ name: 'ComparisonPage', path: '/comparison', traits: [{ ref: 'ExperimentComparison' }] }],
  };

  return {
    name: appName,
    description: `Hyperparameter search: ${experiments.length} experiments compared by ${comparisonMetric}`,
    version: '1.0.0',
    orbitals: [...experimentOrbitals, comparisonOrbital],
  } as unknown as OrbitalSchema;
}
