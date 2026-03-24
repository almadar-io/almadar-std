/**
 * std-rl-environment
 *
 * Full reinforcement learning organism. Three orbitals:
 * 1. Environment: steps, emits observations
 * 2. Agent: policy network, inference + training
 * 3. Tracker: logs episode metrics
 *
 * Cross-orbital events:
 * - OBSERVATION: Environment → Agent
 * - ACTION: Agent → Environment
 * - EPISODE_STATS: Agent → Tracker
 *
 * @level organism
 * @family ml
 * @packageDocumentation
 */

import type { OrbitalSchema } from '@almadar/core/types';

// ============================================================================
// Params
// ============================================================================

export interface StdRlEnvironmentParams {
  appName?: string;
  agentArchitecture: unknown;
  observationDim: number;
  actionCount: number;
  maxEpisodeSteps?: number;
  bufferSize?: number;
  trainingConfig?: Record<string, unknown>;
}

// ============================================================================
// Builder
// ============================================================================

export function stdRlEnvironment(params: StdRlEnvironmentParams): OrbitalSchema {
  const {
    appName = 'RL Environment',
    agentArchitecture,
    observationDim,
    actionCount,
    maxEpisodeSteps = 1000,
    bufferSize = 1000,
    trainingConfig = { epochs: 10, optimizer: { type: 'adam', lr: 0.0003 }, loss: 'mse', constraints: { 'max-gradient-norm': 0.5 } },
  } = params;

  return {
    name: appName,
    description: 'Reinforcement learning: Environment + Agent + Tracker',
    version: '1.0.0',
    orbitals: [
      // Environment
      {
        name: 'Environment',
        entity: {
          name: 'EnvState',
          runtime: true,
          fields: [
            { name: 'id', type: 'string', required: true, primaryKey: true },
            { name: 'observation', type: 'array', default: [] },
            { name: 'reward', type: 'number', default: 0 },
            { name: 'done', type: 'boolean', default: false },
            { name: 'step', type: 'number', default: 0 },
          ],
        },
        traits: [{
          name: 'EnvironmentController',
          category: 'interaction' as const,
          linkedEntity: 'EnvState',
          emits: [
            { event: 'OBSERVATION', scope: 'external' as const,
              payload: [{ name: 'observation', type: 'array' }, { name: 'reward', type: 'number' }, { name: 'done', type: 'boolean' }] },
          ],
          listens: [
            { event: 'ACTION', triggers: 'APPLY_ACTION', scope: 'external' as const },
          ],
          stateMachine: {
            states: [{ name: 'running', isInitial: true }],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'RESET', name: 'Reset' },
              { key: 'APPLY_ACTION', name: 'Apply Action' },
            ],
            transitions: [
              { from: 'running', to: 'running', event: 'INIT', effects: [
                ['render-ui', 'main', { type: 'page-header', title: 'Environment', subtitle: 'RL simulation' }],
              ]},
              { from: 'running', to: 'running', event: 'RESET', effects: [
                ['set', '@entity.step', 0],
                ['set', '@entity.done', false],
                ['set', '@entity.reward', 0],
                ['emit', 'OBSERVATION', { observation: '@entity.observation', reward: 0, done: false }],
              ]},
              { from: 'running', to: 'running', event: 'APPLY_ACTION',
                guard: ['<', '@entity.step', maxEpisodeSteps],
                effects: [
                  ['set', '@entity.step', ['+', '@entity.step', 1]],
                  ['emit', 'OBSERVATION', { observation: '@entity.observation', reward: '@entity.reward', done: '@entity.done' }],
                ]},
            ],
          },
        }],
        pages: [{ name: 'EnvPage', path: '/environment', isInitial: true, traits: [{ ref: 'EnvironmentController' }] }],
      },

      // Agent
      {
        name: 'Policy Agent',
        entity: {
          name: 'Agent',
          runtime: true,
          fields: [
            { name: 'id', type: 'string', required: true, primaryKey: true },
            { name: 'architecture', type: 'object', default: agentArchitecture },
            { name: 'replayBuffer', type: 'array', default: [] },
            { name: 'bufferCount', type: 'number', default: 0 },
            { name: 'totalReward', type: 'number', default: 0 },
            { name: 'episodeCount', type: 'number', default: 0 },
          ],
        },
        traits: [{
          name: 'PolicyAgent',
          category: 'interaction' as const,
          linkedEntity: 'Agent',
          listens: [
            { event: 'OBSERVATION', triggers: 'OBSERVE', scope: 'external' as const },
          ],
          emits: [
            { event: 'ACTION', scope: 'external' as const, payload: [{ name: 'action', type: 'number' }] },
            { event: 'EPISODE_STATS', scope: 'external' as const,
              payload: [{ name: 'totalReward', type: 'number' }, { name: 'steps', type: 'number' }] },
          ],
          stateMachine: {
            states: [
              { name: 'waiting', isInitial: true },
              { name: 'inferring' },
              { name: 'training' },
            ],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'OBSERVE', name: 'Observe' },
              { key: 'PREDICTION_READY', name: 'Prediction Ready' },
              { key: 'START_TRAINING', name: 'Start Training' },
              { key: 'TRAINING_DONE', name: 'Training Done' },
            ],
            transitions: [
              { from: 'waiting', to: 'waiting', event: 'INIT', effects: [
                ['render-ui', 'main', { type: 'page-header', title: 'Policy Agent', subtitle: 'Learning to act' }],
              ]},
              { from: 'waiting', to: 'inferring', event: 'OBSERVE', effects: [
                ['forward', 'primary', {
                  architecture: '@entity.architecture',
                  input: '@payload.observation',
                  'on-complete': 'PREDICTION_READY',
                }],
              ]},
              { from: 'inferring', to: 'waiting', event: 'PREDICTION_READY', effects: [
                ['emit', 'ACTION', { action: ['tensor/argmax', '@payload.output'] }],
              ]},
              { from: 'waiting', to: 'training', event: 'START_TRAINING',
                guard: ['>=', '@entity.bufferCount', bufferSize],
                effects: [
                  ['train', {
                    architecture: '@entity.architecture',
                    dataset: '@entity.replayBuffer',
                    config: trainingConfig,
                    'on-complete': 'TRAINING_DONE',
                  }],
                ]},
              { from: 'training', to: 'waiting', event: 'TRAINING_DONE', effects: [
                ['set', '@entity.replayBuffer', []],
                ['set', '@entity.bufferCount', 0],
                ['set', '@entity.episodeCount', ['+', '@entity.episodeCount', 1]],
                ['emit', 'EPISODE_STATS', { totalReward: '@entity.totalReward', steps: '@entity.bufferCount' }],
              ]},
            ],
          },
        }],
        pages: [{ name: 'AgentPage', path: '/agent', traits: [{ ref: 'PolicyAgent' }] }],
      },

      // Tracker
      {
        name: 'Reward Tracker',
        entity: {
          name: 'Tracker',
          runtime: true,
          fields: [
            { name: 'id', type: 'string', required: true, primaryKey: true },
            { name: 'episodeRewards', type: 'array', default: [] },
            { name: 'bestReward', type: 'number', default: -999999 },
            { name: 'episodeCount', type: 'number', default: 0 },
          ],
        },
        traits: [{
          name: 'RewardTracker',
          category: 'interaction' as const,
          linkedEntity: 'Tracker',
          listens: [
            { event: 'EPISODE_STATS', triggers: 'LOG_EPISODE', scope: 'external' as const },
          ],
          stateMachine: {
            states: [{ name: 'tracking', isInitial: true }],
            events: [
              { key: 'INIT', name: 'Initialize' },
              { key: 'LOG_EPISODE', name: 'Log Episode' },
            ],
            transitions: [
              { from: 'tracking', to: 'tracking', event: 'INIT', effects: [
                ['render-ui', 'main', { type: 'page-header', title: 'Reward Tracker', subtitle: 'Monitoring training progress' }],
              ]},
              { from: 'tracking', to: 'tracking', event: 'LOG_EPISODE', effects: [
                ['set', '@entity.episodeRewards', ['array/append', '@entity.episodeRewards', '@payload.totalReward']],
                ['set', '@entity.episodeCount', ['+', '@entity.episodeCount', 1]],
              ]},
            ],
          },
        }],
        pages: [{ name: 'TrackerPage', path: '/tracker', traits: [{ ref: 'RewardTracker' }] }],
      },
    ],
  } as unknown as OrbitalSchema;
}
