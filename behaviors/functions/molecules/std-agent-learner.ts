/**
 * std-agent-learner — Outcome learning
 *
 * Composes memory management, LLM completion, and provider routing into
 * an outcome learning pipeline. Listens for task success/failure events,
 * memorizes outcomes, reinforces memories for successes, applies decay
 * for failures, and adjusts provider routing based on accumulated results.
 *
 * Traits composed (inline, representing atom-level concerns):
 * - LearnerMemory: memorize outcomes, reinforce/decay based on results
 * - LearnerCompletion: analyze outcome impact via LLM
 * - LearnerProvider: adjust provider routing based on success patterns
 *
 * @level molecule
 * @family agent
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdAgentLearnerParams {
  entityName?: string;
  fields?: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
  /** Provider to switch to on repeated failures (default 'anthropic') */
  fallbackProvider?: string;
  /** Failure threshold that triggers provider switch (default 3) */
  failureThreshold?: number;
}

// ============================================================================
// Resolve
// ============================================================================

interface LearnerConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
  fallbackProvider: string;
  failureThreshold: number;
}

function resolve(params: StdAgentLearnerParams): LearnerConfig {
  const entityName = params.entityName ?? 'LearningRecord';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'outcome', type: 'string', default: '' },
    { name: 'category', type: 'string', default: '' },
    { name: 'impact', type: 'string', default: '' },
    { name: 'memoryId', type: 'string', default: '' },
    { name: 'status', type: 'string', default: 'idle' },
    { name: 'isSuccess', type: 'boolean', default: false },
    { name: 'provider', type: 'string', default: '' },
    { name: 'consecutiveFailures', type: 'number', default: 0 },
    { name: 'totalSuccesses', type: 'number', default: 0 },
    { name: 'totalFailures', type: 'number', default: 0 },
    { name: 'error', type: 'string', default: '' },
  ];

  const baseFields = ensureIdField(params.fields ?? []);
  const userFieldNames = new Set(baseFields.map(f => f.name));
  const fields = [
    ...baseFields,
    ...requiredFields.filter(f => !userFieldNames.has(f.name)),
  ];

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Learner`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
    fallbackProvider: params.fallbackProvider ?? 'anthropic',
    failureThreshold: params.failureThreshold ?? 3,
  };
}

// ============================================================================
// UI Content Builders
// ============================================================================

function idleView(entityName: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'graduation-cap', size: 'lg' },
          { type: 'typography', content: 'Outcome Learner', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'simple-grid', columns: 3,
        children: [
          { type: 'stat-display', label: 'Successes', value: `@entity.totalSuccesses`, icon: 'check-circle' },
          { type: 'stat-display', label: 'Failures', value: `@entity.totalFailures`, icon: 'x-circle' },
          { type: 'stat-display', label: 'Current Provider', value: `@entity.provider`, icon: 'cpu' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: 'Listening for task outcomes...', variant: 'body' },
            { type: 'typography', content: 'This module records TASK_SUCCEEDED and TASK_FAILED events automatically.', variant: 'caption' },
          ],
        }],
      },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'sm',
          children: [
            { type: 'typography', content: 'Last Outcome', variant: 'caption' },
            { type: 'typography', content: `@entity.outcome`, variant: 'body' },
            { type: 'typography', content: 'Impact Analysis', variant: 'caption' },
            { type: 'typography', content: `@entity.impact`, variant: 'body' },
          ],
        }],
      },
    ],
  };
}

function recordingView(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'save', size: 'lg' },
      { type: 'typography', content: 'Recording outcome...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
      { type: 'badge', label: `@entity.outcome` },
    ],
  };
}

function analyzingView(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'cpu', size: 'lg' },
      { type: 'typography', content: 'Analyzing impact...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'center',
        children: [
          { type: 'badge', label: ['string/concat', 'Category: ', '@entity.category'] },
          { type: 'badge', label: ['cond', '@entity.isSuccess', 'Success', 'Failure'] },
        ],
      },
    ],
  };
}

// ============================================================================
// Trait Builder
// ============================================================================

function buildTrait(c: LearnerConfig): Trait {
  const { entityName, fallbackProvider, failureThreshold } = c;

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    listens: [
      { event: 'TASK_SUCCEEDED', triggers: 'TASK_SUCCEEDED' },
      { event: 'TASK_FAILED', triggers: 'TASK_FAILED' },
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'recording' },
        { name: 'analyzing' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        {
          key: 'TASK_SUCCEEDED', name: 'Task Succeeded',
          payload: [
            { name: 'outcome', type: 'string', required: true },
            { name: 'category', type: 'string', required: true },
          ],
        },
        {
          key: 'TASK_FAILED', name: 'Task Failed',
          payload: [
            { name: 'outcome', type: 'string', required: true },
            { name: 'category', type: 'string', required: true },
          ],
        },
        {
          key: 'RECORDED', name: 'Memory Recorded',
          payload: [{ name: 'memoryId', type: 'string', required: true }],
        },
        {
          key: 'ANALYSIS_DONE', name: 'Analysis Done',
          payload: [{ name: 'impact', type: 'string', required: true }],
        },
        {
          key: 'FAILED', name: 'Processing Failed',
          payload: [{ name: 'error', type: 'string', required: true }],
        },
        { key: 'RESET', name: 'Reset View' },
      ],
      transitions: [
        // INIT: idle -> idle (show dashboard)
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['set', '@entity.provider', ['agent/provider']],
            ['render-ui', 'main', idleView(entityName)],
          ],
        },
        // TASK_SUCCEEDED: idle -> recording (memorize success)
        {
          from: 'idle', to: 'recording', event: 'TASK_SUCCEEDED',
          effects: [
            ['set', '@entity.outcome', '@payload.outcome'],
            ['set', '@entity.category', '@payload.category'],
            ['set', '@entity.isSuccess', true],
            ['set', '@entity.consecutiveFailures', 0],
            ['set', '@entity.totalSuccesses', ['math/add', '@entity.totalSuccesses', 1]],
            ['set', '@entity.status', 'recording'],
            ['agent/memorize', ['string/concat', 'Success: ', '@payload.outcome'], '@payload.category'],
            ['render-ui', 'main', recordingView()],
          ],
        },
        // TASK_FAILED: idle -> recording (memorize failure)
        {
          from: 'idle', to: 'recording', event: 'TASK_FAILED',
          effects: [
            ['set', '@entity.outcome', '@payload.outcome'],
            ['set', '@entity.category', '@payload.category'],
            ['set', '@entity.isSuccess', false],
            ['set', '@entity.consecutiveFailures', ['math/add', '@entity.consecutiveFailures', 1]],
            ['set', '@entity.totalFailures', ['math/add', '@entity.totalFailures', 1]],
            ['set', '@entity.status', 'recording'],
            ['agent/memorize', ['string/concat', 'Failure: ', '@payload.outcome'], '@payload.category'],
            ['render-ui', 'main', recordingView()],
          ],
        },
        // RECORDED: recording -> analyzing (reinforce or decay, then analyze)
        {
          from: 'recording', to: 'analyzing', event: 'RECORDED',
          effects: [
            ['set', '@entity.memoryId', '@payload.memoryId'],
            // Reinforce for successes, decay for failures
            ['cond',
              '@entity.isSuccess',
              ['agent/reinforce', '@payload.memoryId'],
              ['agent/decay'],
            ],
            // Switch provider if consecutive failures exceed threshold
            ['cond',
              ['math/gte', '@entity.consecutiveFailures', failureThreshold],
              ['agent/switch-provider', fallbackProvider],
            ],
            ['set', '@entity.status', 'analyzing'],
            ['agent/generate', ['string/concat',
              'Outcome: ', '@entity.outcome', '\n',
              'Category: ', '@entity.category', '\n',
              'Result: ', ['cond', '@entity.isSuccess', 'success', 'failure'], '\n',
              'Consecutive failures: ', ['string/of', '@entity.consecutiveFailures'], '\n\n',
              'Analyze the impact of this outcome. What should be learned? Keep it to 1-2 sentences.',
            ]],
            ['render-ui', 'main', analyzingView()],
          ],
        },
        // ANALYSIS_DONE: analyzing -> idle (store impact, return to dashboard)
        {
          from: 'analyzing', to: 'idle', event: 'ANALYSIS_DONE',
          effects: [
            ['set', '@entity.impact', '@payload.impact'],
            ['set', '@entity.status', 'idle'],
            ['set', '@entity.provider', ['agent/provider']],
            ['render-ui', 'main', idleView(entityName)],
          ],
        },
        // FAILED: recording -> idle
        {
          from: 'recording', to: 'idle', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'idle'],
            ['render-ui', 'main', idleView(entityName)],
          ],
        },
        // FAILED: analyzing -> idle
        {
          from: 'analyzing', to: 'idle', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'idle'],
            ['render-ui', 'main', idleView(entityName)],
          ],
        },
        // RESET: idle -> idle (refresh dashboard)
        {
          from: 'idle', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.provider', ['agent/provider']],
            ['render-ui', 'main', idleView(entityName)],
          ],
        },
      ],
    },
  } as Trait;
}

// ============================================================================
// Projections
// ============================================================================

function buildEntity(c: LearnerConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildPage(c: LearnerConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

export function stdAgentLearnerEntity(params: StdAgentLearnerParams): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentLearnerTrait(params: StdAgentLearnerParams): Trait {
  return buildTrait(resolve(params));
}

export function stdAgentLearnerPage(params: StdAgentLearnerParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdAgentLearner(params: StdAgentLearnerParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
