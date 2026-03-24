/**
 * std-model-serving
 *
 * Model serving organism. Single orbital with:
 * - Input contract validation
 * - Forward pass inference
 * - Output contract clamping
 * - Health monitoring
 *
 * @level organism
 * @family ml
 * @packageDocumentation
 */

import type { OrbitalSchema } from '@almadar/core/types';

// ============================================================================
// Params
// ============================================================================

export interface StdModelServingParams {
  appName?: string;
  architecture: unknown;
  inputContract?: unknown;
  outputContract?: unknown;
}

// ============================================================================
// Builder
// ============================================================================

export function stdModelServing(params: StdModelServingParams): OrbitalSchema {
  const {
    appName = 'Model Server',
    architecture,
    inputContract,
    outputContract,
  } = params;

  return {
    name: appName,
    description: 'Model inference server with contract validation',
    version: '1.0.0',
    orbitals: [{
      name: 'Inference',
      entity: {
        name: 'Server',
        runtime: true,
        fields: [
          { name: 'id', type: 'string', required: true, primaryKey: true },
          { name: 'requestCount', type: 'number', default: 0 },
          { name: 'lastPrediction', type: 'object', default: null },
          { name: 'errorCount', type: 'number', default: 0 },
        ],
      },
      traits: [{
        name: 'InferenceHandler',
        category: 'interaction' as const,
        linkedEntity: 'Server',
        stateMachine: {
          states: [
            { name: 'ready', isInitial: true },
            { name: 'inferring' },
          ],
          events: [
            { key: 'INIT', name: 'Initialize' },
            { key: 'PREDICT', name: 'Predict' },
            { key: 'PREDICTION_READY', name: 'Prediction Ready' },
          ],
          transitions: [
            { from: 'ready', to: 'ready', event: 'INIT', effects: [
              ['render-ui', 'main', { type: 'page-header', title: appName, subtitle: 'Ready for predictions' }],
            ]},
            { from: 'ready', to: 'inferring', event: 'PREDICT', effects: [
              ['set', '@entity.requestCount', ['+', '@entity.requestCount', 1]],
              ['forward', 'primary', {
                architecture,
                input: '@payload.input',
                ...(inputContract ? { 'input-contract': inputContract } : {}),
                ...(outputContract ? { 'output-contract': outputContract } : {}),
                'on-complete': 'PREDICTION_READY',
              }],
            ]},
            { from: 'inferring', to: 'ready', event: 'PREDICTION_READY', effects: [
              ['set', '@entity.lastPrediction', '@payload.output'],
            ]},
          ],
        },
      }],
      pages: [{ name: 'ServerPage', path: '/serve', isInitial: true, traits: [{ ref: 'InferenceHandler' }] }],
    }],
  } as unknown as OrbitalSchema;
}
