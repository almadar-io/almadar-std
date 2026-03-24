/**
 * std-gan
 *
 * Generative Adversarial Network organism. Two orbitals in adversarial loop:
 * 1. Generator: creates fake samples from noise
 * 2. Discriminator: judges real vs fake
 *
 * Cross-orbital events:
 * - FAKE_SAMPLE: Generator → Discriminator
 * - DISCRIMINATOR_FEEDBACK: Discriminator → Generator
 *
 * @level organism
 * @family ml
 * @packageDocumentation
 */

import type { OrbitalSchema } from '@almadar/core/types';

// ============================================================================
// Params
// ============================================================================

export interface StdGanParams {
  appName?: string;
  generatorArchitecture: unknown;
  discriminatorArchitecture: unknown;
  latentDim?: number;
  trainingConfig?: Record<string, unknown>;
}

// ============================================================================
// Builder
// ============================================================================

export function stdGan(params: StdGanParams): OrbitalSchema {
  const {
    appName = 'GAN',
    generatorArchitecture,
    discriminatorArchitecture,
    latentDim = 100,
    trainingConfig = { epochs: 1, optimizer: { type: 'adam', lr: 0.0002 }, loss: 'binary-cross-entropy' },
  } = params;

  return {
    name: appName,
    description: 'Generative Adversarial Network: Generator vs Discriminator',
    version: '1.0.0',
    orbitals: [
      // Generator
      {
        name: 'Generator',
        entity: {
          name: 'GenModel',
          runtime: true,
          fields: [
            { name: 'id', type: 'string', required: true, primaryKey: true },
            { name: 'latentDim', type: 'number', default: latentDim },
            { name: 'generatorLoss', type: 'number', default: 0 },
          ],
        },
        traits: [{
          name: 'ImageGenerator',
          category: 'interaction' as const,
          linkedEntity: 'GenModel',
          emits: [
            { event: 'FAKE_SAMPLE', scope: 'external' as const, description: 'Generated fake sample',
              payload: [{ name: 'sample', type: 'object' }] },
          ],
          listens: [
            { event: 'DISCRIMINATOR_FEEDBACK', triggers: 'UPDATE_GENERATOR', scope: 'external' as const, description: 'Feedback from discriminator' },
          ],
          stateMachine: {
            states: [{ name: 'ready', isInitial: true }, { name: 'generating' }],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'GENERATE', name: 'Generate' },
              { key: 'SAMPLE_READY', name: 'Sample Ready' },
              { key: 'UPDATE_GENERATOR', name: 'Update From Feedback' },
            ],
            transitions: [
              { from: 'ready', to: 'ready', event: 'INIT', effects: [
                ['render-ui', 'main', { type: 'page-header', title: 'Generator', subtitle: 'Creating samples' }],
              ]},
              { from: 'ready', to: 'generating', event: 'GENERATE', effects: [
                ['forward', 'primary', {
                  architecture: generatorArchitecture,
                  input: ['tensor/randn', [1, latentDim]],
                  'on-complete': 'SAMPLE_READY',
                }],
              ]},
              { from: 'generating', to: 'ready', event: 'SAMPLE_READY', effects: [
                ['emit', 'FAKE_SAMPLE', { sample: '@payload.output' }],
              ]},
              { from: 'ready', to: 'ready', event: 'UPDATE_GENERATOR', effects: [
                ['set', '@entity.generatorLoss', '@payload.loss'],
              ]},
            ],
          },
        }],
        pages: [{ name: 'GeneratorPage', path: '/generator', isInitial: true, traits: [{ ref: 'ImageGenerator' }] }],
      },

      // Discriminator
      {
        name: 'Discriminator',
        entity: {
          name: 'DiscModel',
          runtime: true,
          fields: [
            { name: 'id', type: 'string', required: true, primaryKey: true },
            { name: 'discriminatorLoss', type: 'number', default: 0 },
          ],
        },
        traits: [{
          name: 'SampleDiscriminator',
          category: 'interaction' as const,
          linkedEntity: 'DiscModel',
          emits: [
            { event: 'DISCRIMINATOR_FEEDBACK', scope: 'external' as const, description: 'Judgment result',
              payload: [{ name: 'loss', type: 'number' }, { name: 'score', type: 'number' }] },
          ],
          listens: [
            { event: 'FAKE_SAMPLE', triggers: 'JUDGE', scope: 'external' as const, description: 'Judge fake sample' },
          ],
          stateMachine: {
            states: [{ name: 'ready', isInitial: true }, { name: 'judging' }],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'JUDGE', name: 'Judge Sample' },
              { key: 'JUDGMENT_READY', name: 'Judgment Ready' },
            ],
            transitions: [
              { from: 'ready', to: 'ready', event: 'INIT', effects: [
                ['render-ui', 'main', { type: 'page-header', title: 'Discriminator', subtitle: 'Judging samples' }],
              ]},
              { from: 'ready', to: 'judging', event: 'JUDGE', effects: [
                ['forward', 'primary', {
                  architecture: discriminatorArchitecture,
                  input: '@payload.sample',
                  'on-complete': 'JUDGMENT_READY',
                }],
              ]},
              { from: 'judging', to: 'ready', event: 'JUDGMENT_READY', effects: [
                ['emit', 'DISCRIMINATOR_FEEDBACK', { loss: '@payload.loss', score: '@payload.output' }],
              ]},
            ],
          },
        }],
        pages: [{ name: 'DiscriminatorPage', path: '/discriminator', traits: [{ ref: 'SampleDiscriminator' }] }],
      },
    ],
  } as unknown as OrbitalSchema;
}
