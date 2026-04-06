/**
 * std-agent-pipeline
 *
 * Multi-step pipeline organism. Plans a sequence of steps, executes each
 * with tool invocations, forks sessions at checkpoints, and supports
 * rollback on failure.
 *
 * Composed from:
 * - inline PipelinePlannerTrait: breaks goal into ordered steps
 * - inline PipelineExecutorTrait: executes steps with agent/invoke, forks per step
 * - stdAgentMemory: stores execution logs and results per step
 *
 * Cross-trait events:
 * - PIPELINE_PLANNED (Planner -> Executor): plan ready, start execution
 * - STEP_COMPLETE (Executor -> Memory): record step result
 * - PIPELINE_FINISHED (Executor -> Memory): pipeline done, archive results
 *
 * Pages: /pipeline (initial), /execution, /logs
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

export interface StdAgentPipelineParams {
  appName?: string;
  pipelineFields?: EntityField[];
  executionFields?: EntityField[];
  memoryFields?: EntityField[];
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_PIPELINE_FIELDS: EntityField[] = [
  { name: 'goal', type: 'string', default: '' },
  { name: 'steps', type: 'string', default: '[]' },
  { name: 'currentStep', type: 'number', default: 0 },
  { name: 'totalSteps', type: 'number', default: 0 },
  { name: 'status', type: 'string', default: 'idle' },
  { name: 'sessionId', type: 'string', default: '' },
  { name: 'error', type: 'string', default: '' },
];

const DEFAULT_EXECUTION_FIELDS: EntityField[] = [
  { name: 'stepName', type: 'string', default: '' },
  { name: 'stepIndex', type: 'number', default: 0 },
  { name: 'toolName', type: 'string', default: '' },
  { name: 'toolInput', type: 'string', default: '' },
  { name: 'toolResult', type: 'string', default: '' },
  { name: 'execStatus', type: 'string', default: 'pending' },
  { name: 'branchId', type: 'string', default: '' },
];

// ============================================================================
// UI Builders
// ============================================================================

function pipelineIdleUI(entityName: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'git-branch', size: 'lg' },
          { type: 'typography', content: 'Pipeline', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: 'Describe a multi-step goal. The pipeline will plan steps, execute them with tools, and checkpoint along the way.', variant: 'body' },
            { type: 'form-section', entity: entityName, mode: 'edit', submitEvent: 'PLAN', fields: ['goal'] },
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
      { type: 'typography', content: 'Planning pipeline steps...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
    ],
  };
}

function executingUI(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'play', size: 'lg' },
          { type: 'typography', content: 'Executing Pipeline', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            {
              type: 'stack', direction: 'horizontal', gap: 'sm',
              children: [
                { type: 'badge', label: '@entity.status' },
                { type: 'badge', label: '@entity.sessionId' },
              ],
            },
            { type: 'typography', content: 'Step @entity.currentStep of @entity.totalSteps', variant: 'h3' },
            { type: 'spinner', size: 'md' },
          ],
        }],
      },
    ],
  };
}

function checkpointingUI(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'save', size: 'lg' },
      { type: 'typography', content: 'Checkpointing...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
      { type: 'typography', content: 'Forking session at step @entity.currentStep', variant: 'caption' },
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
          { type: 'typography', content: 'Pipeline Complete', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'alert', variant: 'success', message: 'All steps executed successfully.' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: 'Steps completed', variant: 'caption' },
            { type: 'typography', content: '@entity.totalSteps', variant: 'h3' },
            { type: 'typography', content: 'Session', variant: 'caption' },
            { type: 'typography', content: '@entity.sessionId', variant: 'body' },
          ],
        }],
      },
      { type: 'button', label: 'New Pipeline', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };
}

function failedUI(entityName: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'alert-triangle', size: 'lg' },
          { type: 'typography', content: 'Pipeline Failed', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'alert', variant: 'error', message: '@entity.error' },
      { type: 'typography', content: 'Failed at step @entity.currentStep of @entity.totalSteps', variant: 'body' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'button', label: 'Rollback & Retry', event: 'ROLLBACK', variant: 'primary', icon: 'undo' },
          { type: 'button', label: 'New Pipeline', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
        ],
      },
    ],
  };
}

function stepDetailUI(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'terminal', size: 'lg' },
          { type: 'typography', content: 'Step Execution', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: 'Step', variant: 'caption' },
            { type: 'typography', content: '@entity.stepName', variant: 'h3' },
            { type: 'typography', content: 'Tool', variant: 'caption' },
            { type: 'typography', content: '@entity.toolName', variant: 'body' },
            { type: 'typography', content: 'Result', variant: 'caption' },
            { type: 'typography', content: '@entity.toolResult', variant: 'body' },
            {
              type: 'stack', direction: 'horizontal', gap: 'xs',
              children: [
                { type: 'badge', label: '@entity.execStatus' },
                { type: 'badge', label: '@entity.branchId' },
              ],
            },
          ],
        }],
      },
    ],
  };
}

// ============================================================================
// Trait Builders
// ============================================================================

function buildPlannerTrait(entityName: string): Trait {
  return {
    name: 'PipelinePlanner',
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'PIPELINE_PLANNED', description: 'Pipeline steps planned, ready for execution', scope: 'internal' },
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'planning' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        {
          key: 'PLAN', name: 'Plan Pipeline',
          payload: [{ name: 'goal', type: 'string', required: true }],
        },
        { key: 'PLAN_DONE', name: 'Plan Done' },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['set', '@entity.sessionId', ['agent/session-id']],
            ['fetch', entityName],
            ['render-ui', 'main', pipelineIdleUI(entityName)],
          ],
        },
        {
          from: 'idle', to: 'planning', event: 'PLAN',
          effects: [
            ['set', '@entity.goal', '@payload.goal'],
            ['set', '@entity.status', 'planning'],
            ['agent/label', 'pipeline-plan'],
            ['agent/generate', '@payload.goal'],
            ['render-ui', 'main', planningUI()],
          ],
        },
        {
          from: 'planning', to: 'idle', event: 'PLAN_DONE',
          effects: [
            ['set', '@entity.status', 'planned'],
            ['emit', 'PIPELINE_PLANNED'],
            ['render-ui', 'main', pipelineIdleUI(entityName)],
          ],
        },
      ],
    },
  } as Trait;
}

function buildExecutorOrbital(fields: EntityField[]): OrbitalDefinition {
  const entityName = 'Execution';
  const allFields = ensureIdField(fields);
  const entity = makeEntity({ name: entityName, fields: allFields, persistence: 'runtime' });

  const trait: Trait = {
    name: 'PipelineExecutor',
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'STEP_COMPLETE', description: 'Step completed, log result', scope: 'internal' },
      { event: 'PIPELINE_FINISHED', description: 'Pipeline execution done', scope: 'internal' },
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'executing' },
        { name: 'checkpointing' },
        { name: 'completed' },
        { name: 'failed' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'EXECUTE_STEP', name: 'Execute Step' },
        { key: 'STEP_DONE', name: 'Step Done' },
        { key: 'CHECKPOINT', name: 'Checkpoint' },
        { key: 'NEXT_STEP', name: 'Next Step' },
        { key: 'ALL_DONE', name: 'All Done' },
        {
          key: 'STEP_FAILED', name: 'Step Failed',
          payload: [{ name: 'error', type: 'string', required: true }],
        },
        { key: 'ROLLBACK', name: 'Rollback' },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', stepDetailUI()],
          ],
        },
        {
          from: 'idle', to: 'executing', event: 'EXECUTE_STEP',
          effects: [
            ['set', '@entity.execStatus', 'executing'],
            ['agent/invoke', '@entity.toolName', '@entity.toolInput'],
            ['render-ui', 'main', executingUI()],
          ],
        },
        {
          from: 'executing', to: 'checkpointing', event: 'STEP_DONE',
          effects: [
            ['set', '@entity.execStatus', 'done'],
            ['emit', 'STEP_COMPLETE'],
            ['render-ui', 'main', checkpointingUI()],
          ],
        },
        {
          from: 'checkpointing', to: 'checkpointing', event: 'CHECKPOINT',
          effects: [
            ['set', '@entity.branchId', ['agent/fork', '@entity.stepName']],
            ['agent/label', '@entity.stepName'],
          ],
        },
        {
          from: 'checkpointing', to: 'executing', event: 'NEXT_STEP',
          effects: [
            ['set', '@entity.stepIndex', ['+', '@entity.stepIndex', 1]],
            ['set', '@entity.execStatus', 'executing'],
            ['agent/invoke', '@entity.toolName', '@entity.toolInput'],
            ['render-ui', 'main', executingUI()],
          ],
        },
        {
          from: 'checkpointing', to: 'completed', event: 'ALL_DONE',
          effects: [
            ['set', '@entity.execStatus', 'completed'],
            ['emit', 'PIPELINE_FINISHED'],
            ['render-ui', 'main', completedUI()],
          ],
        },
        {
          from: 'executing', to: 'failed', event: 'STEP_FAILED',
          effects: [
            ['set', '@entity.execStatus', 'failed'],
            ['render-ui', 'main', failedUI(entityName)],
          ],
        },
        {
          from: 'failed', to: 'executing', event: 'ROLLBACK',
          effects: [
            ['set', '@entity.execStatus', 'rolling-back'],
            ['agent/invoke', '@entity.toolName', '@entity.toolInput'],
            ['render-ui', 'main', executingUI()],
          ],
        },
        {
          from: 'completed', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.execStatus', 'pending'],
            ['set', '@entity.stepIndex', 0],
            ['set', '@entity.toolResult', ''],
            ['render-ui', 'main', stepDetailUI()],
          ],
        },
        {
          from: 'failed', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.execStatus', 'pending'],
            ['set', '@entity.stepIndex', 0],
            ['render-ui', 'main', stepDetailUI()],
          ],
        },
      ],
    },
  } as Trait;

  const page = makePage({ name: 'ExecutionPage', path: '/execution', traitName: 'PipelineExecutor' });
  return makeOrbital('ExecutionOrbital', entity, [trait], [page]);
}

// ============================================================================
// Organism
// ============================================================================

export function stdAgentPipeline(params: StdAgentPipelineParams = {}): OrbitalSchema {
  const appName = params.appName ?? 'Agent Pipeline';

  // Pipeline planner orbital
  const pipelineFields = ensureIdField(params.pipelineFields ?? DEFAULT_PIPELINE_FIELDS);
  const pipelineEntity = makeEntity({ name: 'Pipeline', fields: pipelineFields, persistence: 'runtime' });
  const plannerTrait = buildPlannerTrait('Pipeline');
  const pipelinePage = makePage({ name: 'PipelinePage', path: '/pipeline', traitName: 'PipelinePlanner', isInitial: true });
  const plannerOrbital = makeOrbital('PipelineOrbital', pipelineEntity, [plannerTrait], [pipelinePage]);

  // Executor orbital
  const executorOrbital = buildExecutorOrbital(params.executionFields ?? DEFAULT_EXECUTION_FIELDS);

  // Execution logs from memory atom
  const memoryOrbital = stdAgentMemory({
    entityName: 'ExecutionLog',
    fields: params.memoryFields,
    persistence: 'persistent',
    pageName: 'LogsPage',
    pagePath: '/logs',
  });

  const pages: ComposePage[] = [
    { name: 'PipelinePage', path: '/pipeline', traits: ['PipelinePlanner'], isInitial: true },
    { name: 'ExecutionPage', path: '/execution', traits: ['PipelineExecutor'] },
    { name: 'LogsPage', path: '/logs', traits: ['ExecutionLogLifecycle'] },
  ];

  const connections: ComposeConnection[] = [
    {
      from: 'PipelinePlanner',
      to: 'PipelineExecutor',
      event: { event: 'PIPELINE_PLANNED', description: 'Plan ready, start execution' },
      triggers: 'EXECUTE_STEP',
    },
    {
      from: 'PipelineExecutor',
      to: 'ExecutionLogLifecycle',
      event: { event: 'STEP_COMPLETE', description: 'Record step result in log' },
      triggers: 'MEMORIZE',
    },
    {
      from: 'PipelineExecutor',
      to: 'ExecutionLogLifecycle',
      event: { event: 'PIPELINE_FINISHED', description: 'Archive pipeline results' },
      triggers: 'MEMORIZE',
    },
  ];

  const schema = compose([plannerOrbital, executorOrbital, memoryOrbital], pages, connections, appName);

  return wrapInDashboardLayout(schema, appName, buildNavItems(pages, {
    pipeline: 'git-branch',
    execution: 'play',
    logs: 'terminal',
  }));
}
