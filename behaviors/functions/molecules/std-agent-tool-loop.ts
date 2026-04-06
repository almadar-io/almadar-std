/**
 * std-agent-tool-loop — Tool execution loop
 *
 * Composes LLM completion, tool invocation, and context window management
 * into an iterative tool-use loop. The agent generates a plan, invokes tools
 * to execute steps, checks results, and either loops back or finishes.
 * Automatically compacts the context window when usage gets too high.
 *
 * Traits composed (inline, representing atom-level concerns):
 * - ToolLoopCompletion: LLM plan generation and result checking
 * - ToolLoopInvoke: tool invocation with argument passing
 * - ToolLoopContext: context window monitoring and compaction
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

export interface StdAgentToolLoopParams {
  entityName?: string;
  fields?: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
  /** Maximum iterations before forced stop (default 10) */
  maxIterations?: number;
  /** Context usage threshold (0-1) that triggers compaction (default 0.8) */
  compactThreshold?: number;
}

// ============================================================================
// Resolve
// ============================================================================

interface ToolLoopConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
  maxIterations: number;
  compactThreshold: number;
}

function resolve(params: StdAgentToolLoopParams): ToolLoopConfig {
  const entityName = params.entityName ?? 'ToolLoop';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'task', type: 'string', default: '' },
    { name: 'plan', type: 'string', default: '' },
    { name: 'iterations', type: 'number', default: 0 },
    { name: 'maxIterations', type: 'number', default: params.maxIterations ?? 10 },
    { name: 'status', type: 'string', default: 'idle' },
    { name: 'result', type: 'string', default: '' },
    { name: 'currentTool', type: 'string', default: '' },
    { name: 'lastToolResult', type: 'string', default: '' },
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
    traitName: `${entityName}Loop`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
    maxIterations: params.maxIterations ?? 10,
    compactThreshold: params.compactThreshold ?? 0.8,
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
          { type: 'icon', name: 'repeat', size: 'lg' },
          { type: 'typography', content: 'Tool Execution Loop', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: 'Describe the task to execute with tools', variant: 'body' },
            { type: 'form-section', entity: entityName, mode: 'edit', submitEvent: 'EXECUTE', fields: ['task'] },
          ],
        }],
      },
    ],
  };
}

function planningView(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'brain', size: 'lg' },
      { type: 'typography', content: 'Planning execution...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
      { type: 'typography', content: `@entity.task`, variant: 'caption' },
    ],
  };
}

function executingView(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', justify: 'space-between',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
            children: [
              { type: 'icon', name: 'tool', size: 'lg' },
              { type: 'typography', content: 'Executing Tool', variant: 'h2' },
            ],
          },
          { type: 'badge', label: ['string/concat', 'Iteration ', ['string/of', '@entity.iterations'], '/', ['string/of', '@entity.maxIterations']] },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'sm',
          children: [
            { type: 'typography', content: 'Current Tool', variant: 'caption' },
            { type: 'typography', content: `@entity.currentTool`, variant: 'h4' },
            { type: 'spinner', size: 'md' },
          ],
        }],
      },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'sm',
          children: [
            { type: 'typography', content: 'Plan', variant: 'caption' },
            { type: 'typography', content: `@entity.plan`, variant: 'body' },
          ],
        }],
      },
    ],
  };
}

function checkingView(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'eye', size: 'lg' },
      { type: 'typography', content: 'Checking result...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
      { type: 'badge', label: ['string/concat', 'Iteration ', ['string/of', '@entity.iterations']] },
    ],
  };
}

function completedView(entityName: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', justify: 'space-between',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
            children: [
              { type: 'icon', name: 'check-circle', size: 'lg' },
              { type: 'typography', content: 'Loop Complete', variant: 'h2' },
            ],
          },
          { type: 'button', label: 'New Task', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
        ],
      },
      { type: 'divider' },
      {
        type: 'simple-grid', columns: 2,
        children: [
          { type: 'stat-display', label: 'Iterations', value: `@entity.iterations`, icon: 'repeat' },
          { type: 'stat-display', label: 'Status', value: `@entity.status`, icon: 'check' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: 'Task', variant: 'caption' },
            { type: 'typography', content: `@entity.task`, variant: 'body' },
            { type: 'divider' },
            { type: 'typography', content: 'Result', variant: 'caption' },
            { type: 'typography', content: `@entity.result`, variant: 'body' },
          ],
        }],
      },
    ],
  };
}

function failedView(entityName: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'x-circle', size: 'lg' },
      { type: 'typography', content: 'Loop Failed', variant: 'h2' },
      { type: 'alert', variant: 'error', message: `@entity.error` },
      {
        type: 'simple-grid', columns: 2,
        children: [
          { type: 'stat-display', label: 'Iterations Used', value: `@entity.iterations`, icon: 'repeat' },
          { type: 'stat-display', label: 'Max Allowed', value: `@entity.maxIterations`, icon: 'shield' },
        ],
      },
      { type: 'button', label: 'Retry', event: 'RESET', variant: 'primary', icon: 'rotate-ccw' },
    ],
  };
}

// ============================================================================
// Trait Builder
// ============================================================================

function buildTrait(c: ToolLoopConfig): Trait {
  const { entityName, maxIterations, compactThreshold } = c;

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'planning' },
        { name: 'executing' },
        { name: 'checking' },
        { name: 'completed' },
        { name: 'failed' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'EXECUTE', name: 'Execute' },
        {
          key: 'PLAN_GENERATED', name: 'Plan Generated',
          payload: [
            { name: 'plan', type: 'string', required: true },
            { name: 'toolName', type: 'string', required: true },
            { name: 'toolArgs', type: 'object', required: true },
          ],
        },
        {
          key: 'TOOL_RESULT', name: 'Tool Result',
          payload: [{ name: 'output', type: 'string', required: true }],
        },
        {
          key: 'CHECK_PASSED', name: 'Check Passed',
          payload: [{ name: 'result', type: 'string', required: true }],
        },
        { key: 'CHECK_NEEDS_MORE', name: 'Check Needs More',
          payload: [
            { name: 'toolName', type: 'string', required: true },
            { name: 'toolArgs', type: 'object', required: true },
          ],
        },
        {
          key: 'MAX_ITERATIONS', name: 'Max Iterations Reached',
          payload: [{ name: 'error', type: 'string', required: true }],
        },
        {
          key: 'FAILED', name: 'Failed',
          payload: [{ name: 'error', type: 'string', required: true }],
        },
        { key: 'RESET', name: 'Reset' },
      ],
      transitions: [
        // INIT: idle -> idle
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['render-ui', 'main', idleView(entityName)],
          ],
        },
        // EXECUTE: idle -> planning (generate a plan via LLM)
        {
          from: 'idle', to: 'planning', event: 'EXECUTE',
          effects: [
            ['set', '@entity.status', 'planning'],
            ['set', '@entity.iterations', 0],
            ['agent/generate', ['string/concat',
              'Task: ', '@entity.task',
              '\n\nAvailable tools: ', ['string/join', ['agent/tools'], ', '],
              '\n\nGenerate a step-by-step plan. Return the first tool to call and its arguments.',
            ]],
            ['render-ui', 'main', planningView()],
          ],
        },
        // PLAN_GENERATED: planning -> executing (invoke first tool)
        {
          from: 'planning', to: 'executing', event: 'PLAN_GENERATED',
          effects: [
            ['set', '@entity.plan', '@payload.plan'],
            ['set', '@entity.currentTool', '@payload.toolName'],
            ['set', '@entity.iterations', ['math/add', '@entity.iterations', 1]],
            ['agent/invoke', '@payload.toolName', '@payload.toolArgs'],
            ['render-ui', 'main', executingView()],
          ],
        },
        // TOOL_RESULT: executing -> checking (check if result is sufficient)
        {
          from: 'executing', to: 'checking', event: 'TOOL_RESULT',
          effects: [
            ['set', '@entity.lastToolResult', '@payload.output'],
            ['agent/generate', ['string/concat',
              'Task: ', '@entity.task',
              '\nPlan: ', '@entity.plan',
              '\nTool output: ', '@payload.output',
              '\n\nIs the task complete? If yes, provide the final result. If no, specify the next tool and arguments.',
            ]],
            ['render-ui', 'main', checkingView()],
          ],
        },
        // CHECK_PASSED: checking -> completed
        {
          from: 'checking', to: 'completed', event: 'CHECK_PASSED',
          effects: [
            ['set', '@entity.result', '@payload.result'],
            ['set', '@entity.status', 'completed'],
            ['render-ui', 'main', completedView(entityName)],
          ],
        },
        // CHECK_NEEDS_MORE: checking -> executing (loop: invoke next tool)
        {
          from: 'checking', to: 'executing', event: 'CHECK_NEEDS_MORE',
          guards: [['math/lt', '@entity.iterations', maxIterations]],
          effects: [
            ['set', '@entity.currentTool', '@payload.toolName'],
            ['set', '@entity.iterations', ['math/add', '@entity.iterations', 1]],
            // Compact context if usage is high
            ...( compactThreshold < 1 ? [
              ['cond',
                ['math/gte', ['agent/context-usage'], compactThreshold],
                ['agent/compact', 'hybrid'],
              ],
            ] as unknown[] : []),
            ['agent/invoke', '@payload.toolName', '@payload.toolArgs'],
            ['render-ui', 'main', executingView()],
          ],
        },
        // MAX_ITERATIONS: checking -> failed (iteration guard failed)
        {
          from: 'checking', to: 'failed', event: 'MAX_ITERATIONS',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'failed'],
            ['render-ui', 'main', failedView(entityName)],
          ],
        },
        // FAILED: planning -> failed
        {
          from: 'planning', to: 'failed', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'failed'],
            ['render-ui', 'main', failedView(entityName)],
          ],
        },
        // FAILED: executing -> failed
        {
          from: 'executing', to: 'failed', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'failed'],
            ['render-ui', 'main', failedView(entityName)],
          ],
        },
        // RESET: completed -> idle
        {
          from: 'completed', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.status', 'idle'],
            ['set', '@entity.task', ''],
            ['set', '@entity.plan', ''],
            ['set', '@entity.result', ''],
            ['set', '@entity.currentTool', ''],
            ['set', '@entity.lastToolResult', ''],
            ['set', '@entity.iterations', 0],
            ['set', '@entity.error', ''],
            ['render-ui', 'main', idleView(entityName)],
          ],
        },
        // RESET: failed -> idle
        {
          from: 'failed', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.status', 'idle'],
            ['set', '@entity.task', ''],
            ['set', '@entity.plan', ''],
            ['set', '@entity.result', ''],
            ['set', '@entity.currentTool', ''],
            ['set', '@entity.lastToolResult', ''],
            ['set', '@entity.iterations', 0],
            ['set', '@entity.error', ''],
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

function buildEntity(c: ToolLoopConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildPage(c: ToolLoopConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

export function stdAgentToolLoopEntity(params: StdAgentToolLoopParams): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentToolLoopTrait(params: StdAgentToolLoopParams): Trait {
  return buildTrait(resolve(params));
}

export function stdAgentToolLoopPage(params: StdAgentToolLoopParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdAgentToolLoop(params: StdAgentToolLoopParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
