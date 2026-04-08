/**
 * std-agent-planner -- Task planning
 *
 * Composes agent atoms + UI atoms into a task planning pipeline with
 * a modal for task input and an activity log for plan history.
 * Classifies the incoming task, recalls relevant memories for context,
 * then generates a step-by-step execution plan with confidence scoring.
 *
 * Composed atoms:
 * - stdAgentClassifier: categorize the task type
 * - stdAgentCompletion: generate the step-by-step plan via LLM
 * - stdAgentMemory: recall relevant past patterns and plans
 * - stdModal: task input form overlay
 * - stdAgentActivityLog: plan history timeline
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
import { stdAgentClassifier } from '../atoms/std-agent-classifier.js';
import { stdAgentCompletion } from '../atoms/std-agent-completion.js';
import { stdAgentMemory } from '../atoms/std-agent-memory.js';
import { stdModal } from '../atoms/std-modal.js';

// ============================================================================
// Params
// ============================================================================

export interface StdAgentPlannerParams {
  entityName?: string;
  fields?: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
  /** Categories for task classification (default: ['code', 'schema', 'design', 'debug', 'deploy']) */
  categories?: string[];
  /** Max memories to recall for context (default 5) */
  memoryLimit?: number;
}

// ============================================================================
// Resolve
// ============================================================================

interface PlannerConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
  categories: string[];
  memoryLimit: number;
}

function resolve(params: StdAgentPlannerParams): PlannerConfig {
  const entityName = params.entityName ?? 'Plan';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'task', type: 'string', default: '' },
    { name: 'category', type: 'string', default: '' },
    { name: 'steps', type: 'string', default: '' },
    { name: 'confidence', type: 'number', default: 0 },
    { name: 'status', type: 'string', default: 'idle' },
    { name: 'relevantMemories', type: 'string', default: '' },
    { name: 'memoryCount', type: 'number', default: 0 },
    { name: 'error', type: 'string', default: '' },
    // Fields for composed atoms (classifier, completion, memory, activity-log)
    { name: 'input', type: 'string', default: '' },
    { name: 'prompt', type: 'string', default: '' },
    { name: 'response', type: 'string', default: '' },
    { name: 'provider', type: 'string', default: 'anthropic' },
    { name: 'model', type: 'string', default: 'claude-sonnet-4-20250514' },
    { name: 'content', type: 'string', default: '' },
    { name: 'scope', type: 'string', default: '' },
    { name: 'strength', type: 'number', default: 1 },
    { name: 'pinned', type: 'boolean', default: false },
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
    traitName: `${entityName}Planner`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
    categories: params.categories ?? ['code', 'schema', 'design', 'debug', 'deploy'],
    memoryLimit: params.memoryLimit ?? 5,
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
          { type: 'icon', name: 'map', size: 'lg' },
          { type: 'typography', content: 'Task Planner', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: 'Describe the task to plan', variant: 'body' },
            { type: 'form-section', entity: entityName, mode: 'edit', submitEvent: 'PLAN', fields: ['task'] },
          ],
        }],
      },
    ],
  };
}

function classifyingView(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'tag', size: 'lg' },
      { type: 'typography', content: 'Classifying task...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
      { type: 'typography', content: `@entity.task`, variant: 'caption' },
    ],
  };
}

function recallingView(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'brain', size: 'lg' },
      { type: 'typography', content: 'Recalling relevant experience...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
      { type: 'badge', label: ['str/concat', 'Category: ', '@entity.category'] },
    ],
  };
}

function planningView(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'cpu', size: 'lg' },
      { type: 'typography', content: 'Generating plan...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'center',
        children: [
          { type: 'badge', label: ['str/concat', 'Category: ', '@entity.category'] },
          { type: 'badge', label: ['str/concat', ['str/concat', '@entity.memoryCount'], ' memories loaded'] },
        ],
      },
    ],
  };
}

function readyView(entityName: string): unknown {
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
              { type: 'typography', content: 'Plan Ready', variant: 'h2' },
            ],
          },
          { type: 'button', label: 'New Plan', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
        ],
      },
      { type: 'divider' },
      {
        type: 'simple-grid', columns: 3,
        children: [
          { type: 'stat-display', label: 'Category', value: `@entity.category`, icon: 'tag' },
          { type: 'stat-display', label: 'Confidence', value: ['str/concat', ['str/concat', '@entity.confidence'], '%'], icon: 'target' },
          { type: 'stat-display', label: 'Memories Used', value: `@entity.memoryCount`, icon: 'brain' },
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
            { type: 'typography', content: 'Execution Plan', variant: 'caption' },
            { type: 'typography', content: `@entity.steps`, variant: 'body' },
          ],
        }],
      },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'sm',
          children: [
            { type: 'typography', content: 'Relevant Memories', variant: 'caption' },
            { type: 'typography', content: `@entity.relevantMemories`, variant: 'body' },
          ],
        }],
      },
    ],
  };
}

function errorView(_entityName: string): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'alert-triangle', size: 'lg' },
      { type: 'typography', content: 'Planning Failed', variant: 'h2' },
      { type: 'alert', variant: 'error', message: `@entity.error` },
      { type: 'button', label: 'Try Again', event: 'RESET', variant: 'primary', icon: 'rotate-ccw' },
    ],
  };
}

// ============================================================================
// Trait Builder
// ============================================================================

function buildTrait(c: PlannerConfig): Trait {
  const { entityName, categories, memoryLimit } = c;
  const categoryList = categories.join(', ');

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'PLAN_READY', scope: 'external' as const, payload: [
        { name: 'plan', type: 'string' },
        { name: 'category', type: 'string' },
      ]},
    ],
    listens: [
      { event: 'PLAN_READY', triggers: 'INIT', scope: 'external' as const },
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'classifying' },
        { name: 'recalling' },
        { name: 'planning' },
        { name: 'ready' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'PLAN', name: 'Start Planning' },
        {
          key: 'CLASSIFIED', name: 'Task Classified',
          payload: [{ name: 'category', type: 'string', required: true }],
        },
        {
          key: 'MEMORIES_LOADED', name: 'Memories Loaded',
          payload: [
            { name: 'memories', type: 'string', required: true },
            { name: 'count', type: 'number', required: true },
          ],
        },
        {
          key: 'PLAN_GENERATED', name: 'Plan Generated',
          payload: [
            { name: 'steps', type: 'string', required: true },
            { name: 'confidence', type: 'number', required: true },
          ],
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
          from: 'idle', to: 'classifying', event: 'PLAN',
          effects: [
            ['set', '@entity.status', 'classifying'],
            ['agent/generate', ['str/concat',
              'Classify this task into exactly one category.\n',
              'Categories: ', categoryList, '\n',
              'Task: ', '@entity.task', '\n',
              'Return only the category name.',
            ]],
            ['render-ui', 'main', classifyingView()],
          ],
        },
        {
          from: 'classifying', to: 'recalling', event: 'CLASSIFIED',
          effects: [
            ['set', '@entity.category', '@payload.category'],
            ['set', '@entity.status', 'recalling'],
            ['agent/recall', ['str/concat', '@entity.category', ' ', '@entity.task'], memoryLimit],
            ['render-ui', 'main', recallingView()],
          ],
        },
        {
          from: 'recalling', to: 'planning', event: 'MEMORIES_LOADED',
          effects: [
            ['set', '@entity.relevantMemories', '@payload.memories'],
            ['set', '@entity.memoryCount', '@payload.count'],
            ['set', '@entity.status', 'planning'],
            ['agent/generate', ['str/concat',
              'Task: ', '@entity.task', '\n',
              'Category: ', '@entity.category', '\n',
              'Relevant experience:\n', '@entity.relevantMemories', '\n\n',
              'Generate a numbered step-by-step execution plan. ',
              'Include a confidence score (0-100) for how likely this plan will succeed.',
            ]],
            ['render-ui', 'main', planningView()],
          ],
        },
        {
          from: 'planning', to: 'ready', event: 'PLAN_GENERATED',
          effects: [
            ['set', '@entity.steps', '@payload.steps'],
            ['set', '@entity.confidence', '@payload.confidence'],
            ['set', '@entity.status', 'ready'],
            ['agent/memorize', ['str/concat', 'Plan for ', '@entity.category', ' task: ', '@entity.task'], 'pattern-affinity'],
            ['emit', 'PLAN_READY'],
            ['render-ui', 'main', readyView(entityName)],
          ],
        },
        {
          from: 'classifying', to: 'idle', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'error'],
            ['render-ui', 'main', errorView(entityName)],
          ],
        },
        {
          from: 'recalling', to: 'idle', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'error'],
            ['render-ui', 'main', errorView(entityName)],
          ],
        },
        {
          from: 'planning', to: 'idle', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'error'],
            ['render-ui', 'main', errorView(entityName)],
          ],
        },
        {
          from: 'ready', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.status', 'idle'],
            ['set', '@entity.task', ''],
            ['set', '@entity.category', ''],
            ['set', '@entity.steps', ''],
            ['set', '@entity.confidence', 0],
            ['set', '@entity.relevantMemories', ''],
            ['set', '@entity.memoryCount', 0],
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

function buildEntity(c: PlannerConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

export function stdAgentPlannerEntity(params: StdAgentPlannerParams): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentPlannerTrait(params: StdAgentPlannerParams): Trait {
  return buildTrait(resolve(params));
}

export function stdAgentPlannerPage(params: StdAgentPlannerParams): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: c.traitName },
      { ref: 'PlannerTaskInput' },
      { ref: 'PlannerClassifierFlow' },
      { ref: 'PlannerCompletionFlow' },
      { ref: 'PlannerMemoryLifecycle' },
    ],
  } as Page;
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdAgentPlanner(params: StdAgentPlannerParams): OrbitalDefinition {
  const c = resolve(params);
  const { entityName, fields } = c;

  // 1. Core planner orchestrator trait
  const plannerTrait = buildTrait(c);

  // 2. Compose agent atoms
  const classifierTrait = extractTrait(stdAgentClassifier({
    entityName,
    fields,
    categories: c.categories,
    persistence: 'runtime',
  }));
  classifierTrait.name = 'PlannerClassifierFlow';
  classifierTrait.listens = [];
  if (classifierTrait.emits) { for (const e of classifierTrait.emits) { (e as unknown as { scope: string }).scope = 'internal'; } }

  const completionTrait = extractTrait(stdAgentCompletion({
    entityName,
    fields,
    persistence: 'runtime',
  }));
  completionTrait.name = 'PlannerCompletionFlow';
  completionTrait.listens = [];
  if (completionTrait.emits) { for (const e of completionTrait.emits) { (e as unknown as { scope: string }).scope = 'internal'; } }

  const memoryTrait = extractTrait(stdAgentMemory({
    entityName,
    fields,
    persistence: 'runtime',
  }));
  memoryTrait.name = 'PlannerMemoryLifecycle';
  memoryTrait.listens = [];
  if (memoryTrait.emits) { for (const e of memoryTrait.emits) { (e as unknown as { scope: string }).scope = 'internal'; } }

  // 3. UI atoms: modal for task input + activity log for plan history
  const modalTrait = extractTrait(stdModal({
    entityName,
    fields,
    standalone: false,
    traitName: 'PlannerTaskInput',
    modalTitle: 'New Task',
    headerIcon: 'plus-circle',
    openEvent: 'NEW_TASK',
    closeEvent: 'CLOSE',
    openContent: {
      type: 'stack', direction: 'vertical', gap: 'md',
      children: [
        { type: 'icon', name: 'map', size: 'md' },
        { type: 'typography', content: 'Describe the task to plan', variant: 'h3' },
        { type: 'divider' },
        { type: 'form-section', entity: entityName, mode: 'edit', submitEvent: 'PLAN', cancelEvent: 'CLOSE', fields: ['task'] },
      ],
    },
    saveEvent: 'PLAN',
  }));
  modalTrait.name = 'PlannerTaskInput';

  // 4. Entity + page
  const entity = makeEntity({ name: entityName, fields, persistence: c.persistence });
  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: plannerTrait.name },
      { ref: modalTrait.name },
      { ref: classifierTrait.name },
      { ref: completionTrait.name },
      { ref: memoryTrait.name },
    ],
  } as Page;

  return makeOrbital(
    `${entityName}Orbital`,
    entity,
    [plannerTrait, modalTrait, classifierTrait, completionTrait, memoryTrait],
    [page],
  );
}
