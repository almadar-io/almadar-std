/**
 * std-agent-tool-loop -- Tool execution loop
 *
 * Composes agent atoms + UI atoms into an iterative tool-use loop with
 * step progress tracking and activity logging. The agent generates a plan,
 * invokes tools to execute steps, checks results, and either loops or finishes.
 *
 * Composed atoms:
 * - stdAgentCompletion: LLM plan generation and result checking
 * - stdAgentToolCall: tool invocation with argument passing
 * - stdAgentContextWindow: context window monitoring and compaction
 * - stdAgentStepProgress: visual pipeline step indicator
 * - stdAgentActivityLog: chronological action timeline
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
import { stdAgentCompletion } from '../atoms/std-agent-completion.js';
import { stdAgentToolCall } from '../atoms/std-agent-tool-call.js';
import { stdAgentContextWindow } from '../atoms/std-agent-context-window.js';
import { stdAgentStepProgress } from '../atoms/std-agent-step-progress.js';

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
    // Fields for composed atoms
    { name: 'currentStep', type: 'number', default: 0 },
    { name: 'totalSteps', type: 'number', default: 4 },
    { name: 'steps', type: 'string', default: 'Plan,Execute,Check,Complete' },
    { name: 'toolName', type: 'string', default: '' },
    { name: 'args', type: 'string', default: '' },
    { name: 'prompt', type: 'string', default: '' },
    { name: 'response', type: 'string', default: '' },
    { name: 'provider', type: 'string', default: 'anthropic' },
    { name: 'model', type: 'string', default: 'claude-sonnet-4-20250514' },
    { name: 'tokenCount', type: 'number', default: 0 },
    { name: 'maxTokens', type: 'number', default: 200000 },
    { name: 'usage', type: 'number', default: 0 },
    { name: 'current', type: 'number', default: 0 },
    { name: 'max', type: 'number', default: 200000 },
    { name: 'threshold', type: 'number', default: 0.85 },
    { name: 'lastCompactedAt', type: 'string', default: '' },
    { name: 'action', type: 'string', default: '' },
    { name: 'detail', type: 'string', default: '' },
    { name: 'timestamp', type: 'string', default: '' },
    { name: 'duration', type: 'number', default: 0 },
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
          { type: 'badge', label: ['str/concat', 'Iteration ', ['str/concat', '@entity.iterations'], '/', ['str/concat', '@entity.maxIterations']] },
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
      { type: 'badge', label: ['str/concat', 'Iteration ', ['str/concat', '@entity.iterations']] },
    ],
  };
}

function completedView(_entityName: string): unknown {
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
        type: 'simple-grid', cols: 2,
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

function failedView(_entityName: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'x-circle', size: 'lg' },
      { type: 'typography', content: 'Loop Failed', variant: 'h2' },
      { type: 'alert', variant: 'error', message: `@entity.error` },
      {
        type: 'simple-grid', cols: 2,
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
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['render-ui', 'main', idleView(entityName)],
          ],
        },
        {
          from: 'idle', to: 'planning', event: 'EXECUTE',
          effects: [
            ['set', '@entity.status', 'planning'],
            ['set', '@entity.iterations', 0],
            ['agent/generate', ['str/concat',
              'Task: ', '@entity.task',
              '\n\nAvailable tools: ', ['str/join', ['agent/tools'], ', '],
              '\n\nGenerate a step-by-step plan. Return the first tool to call and its arguments.',
            ]],
            ['render-ui', 'main', planningView()],
          ],
        },
        {
          from: 'planning', to: 'executing', event: 'PLAN_GENERATED',
          effects: [
            ['set', '@entity.plan', '@payload.plan'],
            ['set', '@entity.currentTool', '@payload.toolName'],
            ['set', '@entity.iterations', ['+', '@entity.iterations', 1]],
            ['agent/invoke', '@payload.toolName', '@payload.toolArgs'],
            ['render-ui', 'main', executingView()],
          ],
        },
        {
          from: 'executing', to: 'checking', event: 'TOOL_RESULT',
          effects: [
            ['set', '@entity.lastToolResult', '@payload.output'],
            ['agent/generate', ['str/concat',
              'Task: ', '@entity.task',
              '\nPlan: ', '@entity.plan',
              '\nTool output: ', '@payload.output',
              '\n\nIs the task complete? If yes, provide the final result. If no, specify the next tool and arguments.',
            ]],
            ['render-ui', 'main', checkingView()],
          ],
        },
        {
          from: 'checking', to: 'completed', event: 'CHECK_PASSED',
          effects: [
            ['set', '@entity.result', '@payload.result'],
            ['set', '@entity.status', 'completed'],
            ['render-ui', 'main', completedView(entityName)],
          ],
        },
        {
          from: 'checking', to: 'executing', event: 'CHECK_NEEDS_MORE',
          guards: [['math/lt', '@entity.iterations', maxIterations]],
          effects: [
            ['set', '@entity.currentTool', '@payload.toolName'],
            ['set', '@entity.iterations', ['+', '@entity.iterations', 1]],
            ...( compactThreshold < 1 ? [
              ['if',
                ['>=', ['agent/context-usage'], compactThreshold],
                ['agent/compact', 'hybrid'],
                ['log', 'Context below compact threshold'],
              ],
            ] as unknown[] : []),
            ['agent/invoke', '@payload.toolName', '@payload.toolArgs'],
            ['render-ui', 'main', executingView()],
          ],
        },
        {
          from: 'checking', to: 'failed', event: 'MAX_ITERATIONS',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'failed'],
            ['render-ui', 'main', failedView(entityName)],
          ],
        },
        {
          from: 'planning', to: 'failed', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'failed'],
            ['render-ui', 'main', failedView(entityName)],
          ],
        },
        {
          from: 'executing', to: 'failed', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'failed'],
            ['render-ui', 'main', failedView(entityName)],
          ],
        },
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

export function stdAgentToolLoopEntity(params: StdAgentToolLoopParams): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentToolLoopTrait(params: StdAgentToolLoopParams): Trait {
  return buildTrait(resolve(params));
}

export function stdAgentToolLoopPage(params: StdAgentToolLoopParams): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: c.traitName },
      { ref: 'ToolLoopStepProgress' },
      { ref: 'ToolLoopCompletionFlow' },
      { ref: 'ToolLoopToolCallFlow' },
      { ref: 'ToolLoopContextMonitor' },
    ],
  } as Page;
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdAgentToolLoop(params: StdAgentToolLoopParams): OrbitalDefinition {
  const c = resolve(params);
  const { entityName, fields } = c;

  // 1. Core orchestrator trait
  const loopTrait = buildTrait(c);

  // 2. Compose agent atoms
  const completionTrait = extractTrait(stdAgentCompletion({
    entityName,
    fields,
    persistence: 'runtime',
  }));
  completionTrait.name = 'ToolLoopCompletionFlow';
  completionTrait.listens = [];
  if (completionTrait.emits) { for (const e of completionTrait.emits) { (e as unknown as { scope: string }).scope = 'internal'; } }

  const toolCallTrait = extractTrait(stdAgentToolCall({
    entityName,
    fields,
    persistence: 'runtime',
  }));
  toolCallTrait.name = 'ToolLoopToolCallFlow';
  toolCallTrait.listens = [];
  if (toolCallTrait.emits) { for (const e of toolCallTrait.emits) { (e as unknown as { scope: string }).scope = 'internal'; } }

  const contextTrait = extractTrait(stdAgentContextWindow({
    entityName,
    fields,
    persistence: 'runtime',
  }));
  contextTrait.name = 'ToolLoopContextMonitor';
  contextTrait.listens = [];
  if (contextTrait.emits) { for (const e of contextTrait.emits) { (e as unknown as { scope: string }).scope = 'internal'; } }

  // 3. Compose UI atoms: step progress + activity log
  const stepProgressTrait = extractTrait(stdAgentStepProgress({
    entityName,
    fields,
    stepLabels: ['Plan', 'Execute', 'Check', 'Complete'],
    persistence: 'runtime',
  }));
  stepProgressTrait.name = 'ToolLoopStepProgress';
  stepProgressTrait.listens = [];
  if (stepProgressTrait.emits) { for (const e of stepProgressTrait.emits) { (e as unknown as { scope: string }).scope = 'internal'; } }

  // 4. Entity + page
  const entity = makeEntity({ name: entityName, fields, persistence: c.persistence });
  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: loopTrait.name },
      { ref: stepProgressTrait.name },
      { ref: completionTrait.name },
      { ref: toolCallTrait.name },
      { ref: contextTrait.name },
    ],
  } as Page;

  return makeOrbital(
    `${entityName}Orbital`,
    entity,
    [loopTrait, stepProgressTrait, completionTrait, toolCallTrait, contextTrait],
    [page],
  );
}
