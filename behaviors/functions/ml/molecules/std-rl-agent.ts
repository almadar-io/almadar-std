/**
 * std-rl-agent
 *
 * Reinforcement learning agent molecule. Composes three traits
 * on one page sharing the event bus:
 * - Forward (policy): observation -> action selection
 * - Data collector (replay buffer): accumulates transitions
 * - Train loop: trains policy from replay buffer
 *
 * Event flow: OBSERVATION -> forward -> ACTION emitted,
 *   data-collector accumulates, BUFFER_READY -> train.
 *
 * @level molecule
 * @family ml
 * @packageDocumentation
 */

import type { OrbitalDefinition, OrbitalSchema, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, ensureIdField, plural, makeSchema, } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdRlAgentParams {
  entityName: string;
  architecture: unknown;
  /** Entity fields that represent observations */
  observationFields: string[];
  /** Number of discrete actions the agent can take */
  actionCount: number;
  /** Max transitions in replay buffer. Default: 1000 */
  bufferSize?: number;
  /** Training hyperparameters */
  trainingConfig?: Record<string, unknown>;
  /** Reward discount factor. Default: 0.99 */
  discountFactor?: number;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface RlAgentConfig {
  entityName: string;
  fields: EntityField[];
  architecture: unknown;
  observationFields: string[];
  actionCount: number;
  bufferSize: number;
  trainingConfig: Record<string, unknown>;
  discountFactor: number;
  policyTraitName: string;
  collectorTraitName: string;
  trainTraitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdRlAgentParams): RlAgentConfig {
  const { entityName } = params;

  // Build fields from observationFields + RL-specific domain fields
  const baseFields: EntityField[] = [
    { name: 'id', type: 'string', default: '' },
    ...params.observationFields.map(f => ({
      name: f, type: 'number' as const, default: 0,
    })),
  ];

  const domainFields: EntityField[] = [
    { name: 'selectedAction', type: 'number', default: -1 },
    { name: 'reward', type: 'number', default: 0 },
    { name: 'totalReward', type: 'number', default: 0 },
    { name: 'episodeCount', type: 'number', default: 0 },
    { name: 'bufferCount', type: 'number', default: 0 },
    { name: 'agentStatus', type: 'string', default: 'idle' },
    { name: 'policyLoss', type: 'number', default: 0 },
  ];
  const userFieldNames = new Set(baseFields.map(f => f.name));
  const fields = ensureIdField([...baseFields, ...domainFields.filter(f => !userFieldNames.has(f.name))]);

  const p = plural(entityName);

  return {
    entityName,
    fields,
    architecture: params.architecture,
    observationFields: params.observationFields,
    actionCount: params.actionCount,
    bufferSize: params.bufferSize ?? 1000,
    trainingConfig: params.trainingConfig ?? { learningRate: 0.001, batchSize: 32 },
    discountFactor: params.discountFactor ?? 0.99,
    policyTraitName: `${entityName}Policy`,
    collectorTraitName: `${entityName}Collector`,
    trainTraitName: `${entityName}Train`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}AgentPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/agent`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Trait builders
// ============================================================================

function buildPolicyTrait(c: RlAgentConfig): Trait {
  const { entityName, actionCount } = c;

  const idleView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'brain', size: 'lg' },
          { type: 'typography', content: `${entityName} RL Agent`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'badge', label: '@entity.agentStatus' },
      { type: 'typography', variant: 'body', color: 'muted', content: `Actions: ${actionCount} | Discount: ${c.discountFactor}` },
      { type: 'button', label: 'Send Observation', event: 'OBSERVATION', variant: 'primary', icon: 'eye' },
    ],
  };

  const inferringView = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'typography', content: 'Selecting Action', variant: 'h3' },
      { type: 'spinner', size: 'md' },
    ],
  };

  // Policy network forward pass
  const forwardEffect: unknown[] = ['forward', 'primary', {
    architecture: c.architecture,
    input: '@payload.observation',
    'output-contract': { type: 'tensor', shape: [actionCount], dtype: 'float32', activation: 'softmax' },
    'on-complete': 'ACTION_SCORES',
  }];

  return {
    name: c.policyTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [{ event: 'ACTION', scope: 'external' as const }],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'inferring' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'OBSERVATION', name: 'Observation' },
        { key: 'ACTION_SCORES', name: 'Action Scores' },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['set', '@entity.agentStatus', 'idle'],
            ['render-ui', 'main', idleView],
          ],
        },
        {
          from: 'idle', to: 'inferring', event: 'OBSERVATION',
          effects: [
            ['set', '@entity.agentStatus', 'inferring'],
            forwardEffect,
            ['render-ui', 'main', inferringView],
          ],
        },
        {
          from: 'inferring', to: 'idle', event: 'ACTION_SCORES',
          effects: [
            ['set', '@entity.selectedAction', ['tensor/argmax', '@payload.output']],
            ['set', '@entity.agentStatus', 'idle'],
            ['emit', 'ACTION'],
            ['render-ui', 'main', idleView],
          ],
        },
      ],
    },
  } as unknown as Trait;
}

function buildCollectorTrait(c: RlAgentConfig): Trait {
  const { entityName, bufferSize } = c;

  const collectingView = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'icon', name: 'database', size: 'lg' },
      { type: 'typography', content: 'Replay Buffer', variant: 'h3' },
      { type: 'typography', variant: 'body', content: 'Transitions: @entity.bufferCount' },
      { type: 'progress-bar', value: '@entity.bufferCount', max: bufferSize },
    ],
  };

  const collectEffect: unknown[] = ['buffer-append', 'replay', {
    capacity: bufferSize,
    transition: {
      observation: '@payload.observation',
      action: '@payload.action',
      reward: '@payload.reward',
      nextObservation: '@payload.nextObservation',
    },
    'on-full': 'BUFFER_READY',
  }];

  return {
    name: c.collectorTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [{ event: 'BUFFER_READY', scope: 'external' as const }],
    stateMachine: {
      states: [
        { name: 'collecting', isInitial: true },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'STORE_TRANSITION', name: 'Store Transition' },
        { key: 'BUFFER_READY', name: 'Buffer Ready' },
      ],
      transitions: [
        {
          from: 'collecting', to: 'collecting', event: 'INIT',
          effects: [
            ['set', '@entity.bufferCount', 0],
            ['render-ui', 'main', collectingView],
          ],
        },
        {
          from: 'collecting', to: 'collecting', event: 'STORE_TRANSITION',
          effects: [
            collectEffect,
            ['set', '@entity.bufferCount', ['math/add', '@entity.bufferCount', 1]],
            ['render-ui', 'main', collectingView],
          ],
        },
        {
          from: 'collecting', to: 'collecting', event: 'BUFFER_READY',
          effects: [
            ['emit', 'BUFFER_READY'],
            ['render-ui', 'main', collectingView],
          ],
        },
      ],
    },
  } as unknown as Trait;
}

function buildTrainTrait(c: RlAgentConfig): Trait {
  const { entityName } = c;

  const waitingView = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'icon', name: 'cpu', size: 'lg' },
      { type: 'typography', content: 'Policy Training', variant: 'h3' },
      { type: 'badge', label: 'Waiting for buffer', variant: 'neutral' },
      { type: 'typography', variant: 'caption', content: 'Loss: @entity.policyLoss' },
    ],
  };

  const trainingView = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'typography', content: 'Training Policy', variant: 'h3' },
      { type: 'spinner', size: 'md' },
    ],
  };

  const trainEffect: unknown[] = ['train', 'primary', {
    architecture: c.architecture,
    config: { ...c.trainingConfig, discountFactor: c.discountFactor },
    source: 'replay',
    'on-complete': 'POLICY_UPDATED',
  }];

  return {
    name: c.trainTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [{ event: 'POLICY_UPDATED', scope: 'external' as const }],
    stateMachine: {
      states: [
        { name: 'waiting', isInitial: true },
        { name: 'training' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'BUFFER_READY', name: 'Buffer Ready' },
        { key: 'POLICY_UPDATED', name: 'Policy Updated' },
      ],
      transitions: [
        {
          from: 'waiting', to: 'waiting', event: 'INIT',
          effects: [
            ['render-ui', 'main', waitingView],
          ],
        },
        {
          from: 'waiting', to: 'training', event: 'BUFFER_READY',
          effects: [
            trainEffect,
            ['render-ui', 'main', trainingView],
          ],
        },
        {
          from: 'training', to: 'waiting', event: 'POLICY_UPDATED',
          effects: [
            ['set', '@entity.policyLoss', '@payload.loss'],
            ['set', '@entity.episodeCount', ['math/add', '@entity.episodeCount', 1]],
            ['emit', 'POLICY_UPDATED'],
            ['render-ui', 'main', waitingView],
          ],
        },
      ],
    },
  } as unknown as Trait;
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdRlAgentEntity(params: StdRlAgentParams): Entity {
  const c = resolve(params);
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: 'runtime' });
}

export function stdRlAgentTrait(params: StdRlAgentParams): Trait {
  return buildPolicyTrait(resolve(params));
}

export function stdRlAgentPage(params: StdRlAgentParams): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: c.policyTraitName },
      { ref: c.collectorTraitName },
      { ref: c.trainTraitName },
    ],
  } as Page;
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdRlAgent(params: StdRlAgentParams): OrbitalSchema {
  const c = resolve(params);

  const entity = makeEntity({ name: c.entityName, fields: c.fields, persistence: 'runtime' });

  const policyTrait = buildPolicyTrait(c);
  const collectorTrait = buildCollectorTrait(c);
  const trainTrait = buildTrainTrait(c);

  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: policyTrait.name },
      { ref: collectorTrait.name },
      { ref: trainTrait.name },
    ],
  } as Page;

  return makeSchema(`${c.entityName}Orbital`, {
    name: `${c.entityName}Orbital`,
    entity,
    traits: [policyTrait, collectorTrait, trainTrait],
    pages: [page],
  } as OrbitalDefinition);
}
