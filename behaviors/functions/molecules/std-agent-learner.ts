/**
 * std-agent-learner -- Outcome learning
 *
 * Composes agent atoms + UI atoms into an outcome learning pipeline with
 * an activity log for learning history and a browse list for records.
 * Listens for task success/failure events, memorizes outcomes, reinforces
 * memories for successes, applies decay for failures, and adjusts
 * provider routing based on accumulated results.
 *
 * Composed atoms:
 * - stdAgentMemory: memorize outcomes, reinforce/decay based on results
 * - stdAgentCompletion: analyze outcome impact via LLM
 * - stdAgentProvider: adjust provider routing based on success patterns
 * - stdAgentActivityLog: chronological learning timeline
 * - stdBrowse: browsable records list
 *
 * @level molecule
 * @family agent
 * @packageDocumentation
 *
 * @deprecated The TypeScript factory layer is deprecated as of Phase F.10
 * (2026-04-08). The canonical source for std behaviors is now the registry
 * `.orb` file at `packages/almadar-std/behaviors/registry/<level>/<name>.orb`,
 * which is generated from this TS source by `tools/almadar-behavior-ts-to-orb/`
 * and consumed by the compiler's embedded loader.
 *
 * Consumers should import behaviors via `.lolo`/`.orb` `uses` declarations and
 * reference them as `Alias.entity` / `Alias.traits.X` / `Alias.pages.X`, applying
 * overrides at the call site (`linkedEntity`, `name`, `events`, `effects`,
 * `listens`, `emitsScope`). The TS `*Params` interface and the exported factory
 * functions remain ONLY as the authoring path for the converter; they are NOT a
 * stable public API and may change without notice.
 *
 * See `docs/Almadar_Orb_Behaviors.md` for the orbital-as-function model and
 * `docs/LOLO_Gaps.md` for the migration plan.
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makeOrbital, ensureIdField, plural, extractTrait } from '@almadar/core/builders';
import { stdAgentMemory } from '../atoms/std-agent-memory.js';
import { stdAgentCompletion } from '../atoms/std-agent-completion.js';
import { stdAgentProvider } from '../atoms/std-agent-provider.js';
import { stdBrowse } from '../atoms/std-browse.js';

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
    // Fields for composed atoms (memory, completion, provider, activity-log)
    { name: 'content', type: 'string', default: '' },
    { name: 'scope', type: 'string', default: '' },
    { name: 'strength', type: 'number', default: 1 },
    { name: 'pinned', type: 'boolean', default: false },
    { name: 'prompt', type: 'string', default: '' },
    { name: 'response', type: 'string', default: '' },
    { name: 'model', type: 'string', default: 'claude-sonnet-4-20250514' },
    { name: 'currentProvider', type: 'string', default: 'anthropic' },
    { name: 'currentModel', type: 'string', default: 'claude-sonnet-4-20250514' },
    { name: 'fallbackProvider', type: 'string', default: 'anthropic' },
    { name: 'requestCount', type: 'number', default: 0 },
    { name: 'action', type: 'string', default: '' },
    { name: 'detail', type: 'string', default: '' },
    { name: 'timestamp', type: 'string', default: '' },
    { name: 'duration', type: 'number', default: 0 },
    { name: 'icon', type: 'string', default: 'circle' },
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

function idleView(_entityName: string): unknown {
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
        type: 'simple-grid', cols: 3,
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
          { type: 'badge', label: ['str/concat', 'Category: ', '@entity.category'] },
          { type: 'badge', label: ['if', '@entity.isSuccess', 'Success', 'Failure'] },
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
    emits: [
      { event: 'TASK_SUCCEEDED', scope: 'external' as const, payload: [
        { name: 'outcome', type: 'string' },
        { name: 'category', type: 'string' },
      ]},
      { event: 'TASK_FAILED', scope: 'external' as const, payload: [
        { name: 'outcome', type: 'string' },
        { name: 'category', type: 'string' },
      ]},
    ],
    listens: [
      { event: 'TASK_SUCCEEDED', triggers: 'TASK_SUCCEEDED', scope: 'external' as const },
      { event: 'TASK_FAILED', triggers: 'TASK_FAILED', scope: 'external' as const },
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
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['set', '@entity.provider', ['agent/provider']],
            ['render-ui', 'main', idleView(entityName)],
          ],
        },
        {
          from: 'idle', to: 'recording', event: 'TASK_SUCCEEDED',
          effects: [
            ['set', '@entity.outcome', '@payload.outcome'],
            ['set', '@entity.category', '@payload.category'],
            ['set', '@entity.isSuccess', true],
            ['set', '@entity.consecutiveFailures', 0],
            ['set', '@entity.totalSuccesses', ['+', '@entity.totalSuccesses', 1]],
            ['set', '@entity.status', 'recording'],
            ['agent/memorize', ['str/concat', 'Success: ', '@payload.outcome'], '@payload.category'],
            ['render-ui', 'main', recordingView()],
          ],
        },
        {
          from: 'idle', to: 'recording', event: 'TASK_FAILED',
          effects: [
            ['set', '@entity.outcome', '@payload.outcome'],
            ['set', '@entity.category', '@payload.category'],
            ['set', '@entity.isSuccess', false],
            ['set', '@entity.consecutiveFailures', ['+', '@entity.consecutiveFailures', 1]],
            ['set', '@entity.totalFailures', ['+', '@entity.totalFailures', 1]],
            ['set', '@entity.status', 'recording'],
            ['agent/memorize', ['str/concat', 'Failure: ', '@payload.outcome'], '@payload.category'],
            ['render-ui', 'main', recordingView()],
          ],
        },
        {
          from: 'recording', to: 'analyzing', event: 'RECORDED',
          effects: [
            ['set', '@entity.memoryId', '@payload.memoryId'],
            ['if',
              '@entity.isSuccess',
              ['agent/reinforce', '@payload.memoryId'],
              ['agent/decay'],
            ],
            ['if',
              ['>=', '@entity.consecutiveFailures', failureThreshold],
              ['agent/switch-provider', fallbackProvider],
              ['log', 'No provider switch needed'],
            ],
            ['set', '@entity.status', 'analyzing'],
            ['agent/generate', ['str/concat',
              'Outcome: ', '@entity.outcome', '\n',
              'Category: ', '@entity.category', '\n',
              'Result: ', ['if', '@entity.isSuccess', 'success', 'failure'], '\n',
              'Consecutive failures: ', ['str/concat', '@entity.consecutiveFailures'], '\n\n',
              'Analyze the impact of this outcome. What should be learned? Keep it to 1-2 sentences.',
            ]],
            ['render-ui', 'main', analyzingView()],
          ],
        },
        {
          from: 'analyzing', to: 'idle', event: 'ANALYSIS_DONE',
          effects: [
            ['set', '@entity.impact', '@payload.impact'],
            ['set', '@entity.status', 'idle'],
            ['set', '@entity.provider', ['agent/provider']],
            ['render-ui', 'main', idleView(entityName)],
          ],
        },
        {
          from: 'recording', to: 'idle', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'idle'],
            ['render-ui', 'main', idleView(entityName)],
          ],
        },
        {
          from: 'analyzing', to: 'idle', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'idle'],
            ['render-ui', 'main', idleView(entityName)],
          ],
        },
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

export function stdAgentLearnerEntity(params: StdAgentLearnerParams): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentLearnerTrait(params: StdAgentLearnerParams): Trait {
  return buildTrait(resolve(params));
}

export function stdAgentLearnerPage(params: StdAgentLearnerParams): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: c.traitName },
      { ref: 'LearnerRecordsBrowse' },
      { ref: 'LearnerMemoryLifecycle' },
      { ref: 'LearnerCompletionFlow' },
      { ref: 'LearnerProviderManager' },
    ],
  } as Page;
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdAgentLearner(params: StdAgentLearnerParams): OrbitalDefinition {
  const c = resolve(params);
  const { entityName, fields } = c;

  // 1. Core learner orchestrator trait
  const learnerTrait = buildTrait(c);

  // 2. Compose agent atoms
  const memoryTrait = extractTrait(stdAgentMemory({
    entityName,
    fields,
    persistence: 'runtime',
  }));
  memoryTrait.name = 'LearnerMemoryLifecycle';
  memoryTrait.listens = [];
  if (memoryTrait.emits) { for (const e of memoryTrait.emits) { (e as unknown as { scope: string }).scope = 'internal'; } }

  const completionTrait = extractTrait(stdAgentCompletion({
    entityName,
    fields,
    persistence: 'runtime',
  }));
  completionTrait.name = 'LearnerCompletionFlow';
  completionTrait.listens = [];
  if (completionTrait.emits) { for (const e of completionTrait.emits) { (e as unknown as { scope: string }).scope = 'internal'; } }

  const providerTrait = extractTrait(stdAgentProvider({
    entityName,
    fields,
    persistence: 'runtime',
  }));
  providerTrait.name = 'LearnerProviderManager';
  providerTrait.listens = [];
  if (providerTrait.emits) { for (const e of providerTrait.emits) { (e as unknown as { scope: string }).scope = 'internal'; } }

  // 3. UI atom: browse for records
  const recordsBrowseTrait = extractTrait(stdBrowse({
    entityName,
    fields,
    traitName: 'LearnerRecordsBrowse',
    listFields: ['outcome', 'category', 'status'],
    headerIcon: 'graduation-cap',
    pageTitle: 'Learning Records',
    emptyTitle: 'No records yet',
    emptyDescription: 'Task outcomes will appear here as they are recorded.',
    itemActions: [{ label: 'View', event: 'VIEW' }],
  }));
  recordsBrowseTrait.name = 'LearnerRecordsBrowse';

  // 4. Entity + page
  const entity = makeEntity({ name: entityName, fields, persistence: c.persistence });
  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: learnerTrait.name },
      { ref: recordsBrowseTrait.name },
      { ref: memoryTrait.name },
      { ref: completionTrait.name },
      { ref: providerTrait.name },
    ],
  } as Page;

  return makeOrbital(
    `${entityName}Orbital`,
    entity,
    [learnerTrait, recordsBrowseTrait, memoryTrait, completionTrait, providerTrait],
    [page],
  );
}
