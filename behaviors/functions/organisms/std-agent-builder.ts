/**
 * std-agent-builder
 *
 * Schema builder agent organism. Full build cycle that plans, generates,
 * validates, and fixes .orb programs. Composes session forking for
 * checkpoints, tool execution for validation, and learning from outcomes.
 *
 * Composed from:
 * - inline PlannerTrait: breaks prompt into build plan with steps
 * - inline BuilderTrait: generates schema via agent/generate, validates via agent/invoke
 * - inline FixLoopTrait: iterates on validation failures with agent/generate
 * - stdAgentMemory: learns from outcomes (memorize successes, forget failures)
 *
 * Cross-trait events:
 * - PLAN_READY (Planner -> Builder): plan complete, begin building
 * - BUILD_DONE (Builder -> FixLoop): schema generated, validate it
 * - FIX_SUCCEEDED (FixLoop -> Memory): record successful fix pattern
 * - BUILD_FAILED (Builder -> FixLoop): build failed, attempt fix
 *
 * Pages: /plan (initial), /build, /fix, /learnings
 *
 * @level organism
 * @family agent
 * @packageDocumentation
 */

import type { OrbitalSchema, OrbitalDefinition, Entity, Trait, Page, EntityField } from '@almadar/core/types';
import { makeEntity, makeOrbital, makePage, ensureIdField, compose } from '@almadar/core/builders';
import type { ComposePage, ComposeConnection } from '@almadar/core/builders';
import { stdAgentMemory } from '../atoms/std-agent-memory.js';
import { wrapInDashboardLayout, buildNavItems } from '../layout.js';

// ============================================================================
// Params
// ============================================================================

export interface StdAgentBuilderParams {
  appName?: string;
  taskFields?: EntityField[];
  fixFields?: EntityField[];
  memoryFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_TASK_FIELDS: EntityField[] = [
  { name: 'prompt', type: 'string', default: '' },
  { name: 'plan', type: 'string', default: '' },
  { name: 'schema', type: 'string', default: '' },
  { name: 'validationStatus', type: 'string', default: 'pending' },
  { name: 'buildPhase', type: 'string', default: 'idle' },
  { name: 'attempts', type: 'number', default: 0 },
  { name: 'sessionId', type: 'string', default: '' },
  { name: 'error', type: 'string', default: '' },
];

const DEFAULT_FIX_FIELDS: EntityField[] = [
  { name: 'originalSchema', type: 'string', default: '' },
  { name: 'validationErrors', type: 'string', default: '' },
  { name: 'fixedSchema', type: 'string', default: '' },
  { name: 'fixAttempt', type: 'number', default: 0 },
  { name: 'maxAttempts', type: 'number', default: 3 },
  { name: 'fixStatus', type: 'string', default: 'idle' },
];

// ============================================================================
// UI Builders
// ============================================================================

function plannerIdleUI(entityName: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'clipboard-list', size: 'lg' },
          { type: 'typography', content: 'Build Planner', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: 'Describe what you want to build. The agent will plan, generate, and validate the schema.', variant: 'body' },
            { type: 'form-section', entity: entityName, mode: 'edit', submitEvent: 'START_PLANNING', fields: ['prompt'] },
          ],
        }],
      },
    ],
  };
}

function planningUI(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'cpu', size: 'lg' },
      { type: 'typography', content: 'Planning build steps...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
    ],
  };
}

function planReadyUI(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'check-circle', size: 'lg' },
          { type: 'typography', content: 'Plan Ready', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: 'Build Plan', variant: 'caption' },
            { type: 'typography', content: '@entity.plan', variant: 'body' },
          ],
        }],
      },
      { type: 'button', label: 'Start Building', event: 'BEGIN_BUILD', variant: 'primary', icon: 'hammer' },
    ],
  };
}

function buildingUI(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'hammer', size: 'lg' },
      { type: 'typography', content: 'Generating schema...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
      { type: 'typography', content: 'Attempt: @entity.attempts', variant: 'caption' },
    ],
  };
}

function validatingUI(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'shield-check', size: 'lg' },
      { type: 'typography', content: 'Validating schema...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
    ],
  };
}

function completedUI(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'check-circle', size: 'lg' },
          { type: 'typography', content: 'Build Complete', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'alert', variant: 'success', message: 'Schema generated and validated successfully.' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: 'Generated Schema', variant: 'caption' },
            { type: 'typography', content: '@entity.schema', variant: 'body' },
          ],
        }],
      },
      { type: 'button', label: 'New Build', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };
}

function failedUI(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'alert-triangle', size: 'lg' },
      { type: 'typography', content: 'Build Failed', variant: 'h2' },
      { type: 'alert', variant: 'error', message: '@entity.error' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'button', label: 'Retry', event: 'RETRY', variant: 'primary', icon: 'refresh-cw' },
          { type: 'button', label: 'New Build', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
        ],
      },
    ],
  };
}

function fixIdleUI(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'wrench', size: 'lg' },
          { type: 'typography', content: 'Fix Loop', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'typography', content: 'Waiting for validation results...', variant: 'body' },
    ],
  };
}

function fixingUI(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'wrench', size: 'lg' },
      { type: 'typography', content: 'Fixing validation errors...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
      { type: 'typography', content: 'Fix attempt: @entity.fixAttempt / @entity.maxAttempts', variant: 'caption' },
    ],
  };
}

// ============================================================================
// Trait Builders
// ============================================================================

function buildPlannerTrait(entityName: string): Trait {
  return {
    name: 'BuildPlanner',
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'PLAN_READY', description: 'Plan is complete, begin building', scope: 'internal' },
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'planning' },
        { name: 'planned' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        {
          key: 'START_PLANNING', name: 'Start Planning',
          payload: [{ name: 'prompt', type: 'string', required: true }],
        },
        { key: 'PLAN_GENERATED', name: 'Plan Generated' },
        { key: 'BEGIN_BUILD', name: 'Begin Build' },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['set', '@entity.sessionId', ['agent/session-id']],
            ['fetch', entityName],
            ['render-ui', 'main', plannerIdleUI(entityName)],
          ],
        },
        {
          from: 'idle', to: 'planning', event: 'START_PLANNING',
          effects: [
            ['set', '@entity.prompt', '@payload.prompt'],
            ['set', '@entity.buildPhase', 'planning'],
            ['agent/label', 'plan-start'],
            ['agent/generate', '@payload.prompt'],
            ['render-ui', 'main', planningUI()],
          ],
        },
        {
          from: 'planning', to: 'planned', event: 'PLAN_GENERATED',
          effects: [
            ['set', '@entity.buildPhase', 'planned'],
            ['agent/fork', 'plan-checkpoint'],
            ['render-ui', 'main', planReadyUI()],
          ],
        },
        {
          from: 'planned', to: 'idle', event: 'BEGIN_BUILD',
          effects: [
            ['emit', 'PLAN_READY'],
            ['render-ui', 'main', plannerIdleUI(entityName)],
          ],
        },
      ],
    },
  } as Trait;
}

function buildBuilderTrait(entityName: string): Trait {
  return {
    name: 'SchemaBuilder',
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'BUILD_DONE', description: 'Schema generated, needs validation', scope: 'internal' },
      { event: 'BUILD_FAILED', description: 'Build failed after max attempts', scope: 'internal' },
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'building' },
        { name: 'validating' },
        { name: 'completed' },
        { name: 'failed' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'BUILD', name: 'Build' },
        { key: 'SCHEMA_GENERATED', name: 'Schema Generated' },
        { key: 'VALIDATION_PASSED', name: 'Validation Passed' },
        {
          key: 'VALIDATION_FAILED', name: 'Validation Failed',
          payload: [{ name: 'errors', type: 'string', required: true }],
        },
        { key: 'RETRY', name: 'Retry' },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', buildingUI()],
          ],
        },
        {
          from: 'idle', to: 'building', event: 'BUILD',
          effects: [
            ['set', '@entity.buildPhase', 'building'],
            ['set', '@entity.attempts', ['+', '@entity.attempts', 1]],
            ['agent/generate', '@entity.plan'],
            ['render-ui', 'main', buildingUI()],
          ],
        },
        {
          from: 'building', to: 'validating', event: 'SCHEMA_GENERATED',
          effects: [
            ['set', '@entity.buildPhase', 'validating'],
            ['agent/invoke', 'validate', '@entity.schema'],
            ['render-ui', 'main', validatingUI()],
          ],
        },
        {
          from: 'validating', to: 'completed', event: 'VALIDATION_PASSED',
          effects: [
            ['set', '@entity.validationStatus', 'passed'],
            ['set', '@entity.buildPhase', 'completed'],
            ['agent/fork', 'build-complete'],
            ['emit', 'BUILD_DONE'],
            ['render-ui', 'main', completedUI()],
          ],
        },
        {
          from: 'validating', to: 'failed', event: 'VALIDATION_FAILED',
          effects: [
            ['set', '@entity.validationStatus', 'failed'],
            ['set', '@entity.error', '@payload.errors'],
            ['set', '@entity.buildPhase', 'failed'],
            ['emit', 'BUILD_FAILED'],
            ['render-ui', 'main', failedUI()],
          ],
        },
        {
          from: 'failed', to: 'building', event: 'RETRY',
          effects: [
            ['set', '@entity.buildPhase', 'building'],
            ['set', '@entity.attempts', ['+', '@entity.attempts', 1]],
            ['agent/generate', '@entity.plan'],
            ['render-ui', 'main', buildingUI()],
          ],
        },
        {
          from: 'completed', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.buildPhase', 'idle'],
            ['set', '@entity.attempts', 0],
            ['set', '@entity.schema', ''],
            ['set', '@entity.error', ''],
            ['render-ui', 'main', plannerIdleUI(entityName)],
          ],
        },
        {
          from: 'failed', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.buildPhase', 'idle'],
            ['set', '@entity.attempts', 0],
            ['set', '@entity.error', ''],
            ['render-ui', 'main', plannerIdleUI(entityName)],
          ],
        },
      ],
    },
  } as Trait;
}

function buildFixLoopOrbital(fields: EntityField[]): OrbitalDefinition {
  const entityName = 'FixTask';
  const allFields = ensureIdField(fields);
  const entity = makeEntity({ name: entityName, fields: allFields, persistence: 'runtime' });

  const trait: Trait = {
    name: 'FixLoop',
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'FIX_SUCCEEDED', description: 'Fix succeeded, record learning', scope: 'internal' },
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'fixing' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        {
          key: 'START_FIX', name: 'Start Fix',
          payload: [
            { name: 'schema', type: 'string', required: true },
            { name: 'errors', type: 'string', required: true },
          ],
        },
        { key: 'FIX_GENERATED', name: 'Fix Generated' },
        { key: 'FIX_FAILED', name: 'Fix Failed' },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', fixIdleUI()],
          ],
        },
        {
          from: 'idle', to: 'fixing', event: 'START_FIX',
          effects: [
            ['set', '@entity.originalSchema', '@payload.schema'],
            ['set', '@entity.validationErrors', '@payload.errors'],
            ['set', '@entity.fixAttempt', ['+', '@entity.fixAttempt', 1]],
            ['set', '@entity.fixStatus', 'fixing'],
            ['agent/generate', '@payload.errors'],
            ['render-ui', 'main', fixingUI()],
          ],
        },
        {
          from: 'fixing', to: 'idle', event: 'FIX_GENERATED',
          effects: [
            ['set', '@entity.fixStatus', 'idle'],
            ['agent/memorize', '@entity.fixedSchema', 'fix-pattern'],
            ['emit', 'FIX_SUCCEEDED'],
            ['render-ui', 'main', fixIdleUI()],
          ],
        },
        {
          from: 'fixing', to: 'idle', event: 'FIX_FAILED',
          guard: ['>=', '@entity.fixAttempt', '@entity.maxAttempts'],
          effects: [
            ['set', '@entity.fixStatus', 'exhausted'],
            ['render-ui', 'main', fixIdleUI()],
          ],
        },
        {
          from: 'fixing', to: 'fixing', event: 'FIX_FAILED',
          guard: ['<', '@entity.fixAttempt', '@entity.maxAttempts'],
          effects: [
            ['set', '@entity.fixAttempt', ['+', '@entity.fixAttempt', 1]],
            ['agent/generate', '@entity.validationErrors'],
            ['render-ui', 'main', fixingUI()],
          ],
        },
      ],
    },
  } as Trait;

  const page = makePage({ name: 'FixPage', path: '/fix', traitName: 'FixLoop' });
  return makeOrbital('FixTaskOrbital', entity, [trait], [page]);
}

// ============================================================================
// Organism
// ============================================================================

export function stdAgentBuilder(params: StdAgentBuilderParams = {}): OrbitalSchema {
  const appName = params.appName ?? 'Schema Builder';

  // Build task orbital with planner + builder traits
  const taskFields = ensureIdField(params.taskFields ?? DEFAULT_TASK_FIELDS);
  const taskEntity = makeEntity({ name: 'BuildTask', fields: taskFields, persistence: 'runtime' });
  const plannerTrait = buildPlannerTrait('BuildTask');
  const builderTrait = buildBuilderTrait('BuildTask');
  const planPage = makePage({ name: 'PlanPage', path: '/plan', traitName: 'BuildPlanner', isInitial: true });
  const buildPage = makePage({ name: 'BuildPage', path: '/build', traitName: 'SchemaBuilder' });
  const taskOrbital = makeOrbital('BuildTaskOrbital', taskEntity, [plannerTrait, builderTrait], [planPage, buildPage]);

  // Fix loop orbital
  const fixOrbital = buildFixLoopOrbital(params.fixFields ?? DEFAULT_FIX_FIELDS);

  // Memory/learner from atom
  const memoryOrbital = stdAgentMemory({
    entityName: 'Learning',
    fields: params.memoryFields,
    persistence: 'persistent',
    pageName: 'LearningsPage',
    pagePath: '/learnings',
  });

  const pages: ComposePage[] = [
    { name: 'PlanPage', path: '/plan', traits: ['BuildPlanner'], isInitial: true },
    { name: 'BuildPage', path: '/build', traits: ['SchemaBuilder'] },
    { name: 'FixPage', path: '/fix', traits: ['FixLoop'] },
    { name: 'LearningsPage', path: '/learnings', traits: ['LearningLifecycle'] },
  ];

  const connections: ComposeConnection[] = [
    {
      from: 'BuildPlanner',
      to: 'SchemaBuilder',
      event: { event: 'PLAN_READY', description: 'Plan complete, begin building' },
      triggers: 'BUILD',
    },
    {
      from: 'SchemaBuilder',
      to: 'FixLoop',
      event: { event: 'BUILD_FAILED', description: 'Build failed, attempt fix' },
      triggers: 'START_FIX',
    },
    {
      from: 'FixLoop',
      to: 'LearningLifecycle',
      event: { event: 'FIX_SUCCEEDED', description: 'Record successful fix pattern' },
      triggers: 'MEMORIZE',
    },
  ];

  const schema = compose([taskOrbital, fixOrbital, memoryOrbital], pages, connections, appName);

  return wrapInDashboardLayout(schema, appName, buildNavItems(pages, {
    plan: 'clipboard-list',
    build: 'hammer',
    fix: 'wrench',
    learnings: 'brain',
  }));
}
