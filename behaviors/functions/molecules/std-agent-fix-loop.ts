/**
 * std-agent-fix-loop -- Validation-fix cycle
 *
 * Composes agent atoms + UI atoms into an iterative validation-fix loop
 * with step progress tracking and an errors browse list. Validates a target,
 * generates a fix via LLM, applies it via tool invocation, then re-validates.
 *
 * Composed atoms:
 * - stdAgentToolCall (validate): run validation tool
 * - stdAgentToolCall (fix): apply generated fix
 * - stdAgentCompletion: generate fix via LLM
 * - stdAgentStepProgress: visual step indicator
 * - stdBrowse: browsable errors list
 *
 * @level molecule
 * @family agent
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makeOrbital, ensureIdField, plural, extractTrait } from '@almadar/core/builders';
import { stdAgentToolCall } from '../atoms/std-agent-tool-call.js';
import { stdAgentCompletion } from '../atoms/std-agent-completion.js';
import { stdAgentStepProgress } from '../atoms/std-agent-step-progress.js';
import { stdBrowse } from '../atoms/std-browse.js';

// ============================================================================
// Params
// ============================================================================

export interface StdAgentFixLoopParams {
  entityName?: string;
  fields?: EntityField[];
  persistence?: 'persistent' | 'runtime' | 'singleton';
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
  /** Maximum fix attempts before giving up (default 5) */
  maxAttempts?: number;
  /** Tool name used for validation (default 'validate-schema') */
  validateTool?: string;
  /** Tool name used to apply fixes (default 'apply-fix') */
  fixTool?: string;
}

// ============================================================================
// Resolve
// ============================================================================

interface FixLoopConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
  maxAttempts: number;
  validateTool: string;
  fixTool: string;
}

function resolve(params: StdAgentFixLoopParams): FixLoopConfig {
  const entityName = params.entityName ?? 'FixLoop';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'target', type: 'string', default: '' },
    { name: 'validationErrors', type: 'string', default: '' },
    { name: 'fixAttempts', type: 'number', default: 0 },
    { name: 'maxAttempts', type: 'number', default: params.maxAttempts ?? 5 },
    { name: 'status', type: 'string', default: 'idle' },
    { name: 'currentFix', type: 'string', default: '' },
    { name: 'errorCount', type: 'number', default: 0 },
    { name: 'error', type: 'string', default: '' },
    // Fields for composed atoms (step-progress, tool-call, completion)
    { name: 'currentStep', type: 'number', default: 0 },
    { name: 'totalSteps', type: 'number', default: 4 },
    { name: 'steps', type: 'string', default: 'Validate,Analyze,Fix,Re-validate' },
    { name: 'toolName', type: 'string', default: '' },
    { name: 'args', type: 'string', default: '' },
    { name: 'result', type: 'string', default: '' },
    { name: 'prompt', type: 'string', default: '' },
    { name: 'response', type: 'string', default: '' },
    { name: 'provider', type: 'string', default: 'anthropic' },
    { name: 'model', type: 'string', default: 'claude-sonnet-4-20250514' },
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
    traitName: `${entityName}Cycle`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
    maxAttempts: params.maxAttempts ?? 5,
    validateTool: params.validateTool ?? 'validate-schema',
    fixTool: params.fixTool ?? 'apply-fix',
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
          { type: 'icon', name: 'wrench', size: 'lg' },
          { type: 'typography', content: 'Validation-Fix Loop', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'md',
          children: [
            { type: 'typography', content: 'Enter the target to validate and auto-fix', variant: 'body' },
            { type: 'form-section', entity: entityName, mode: 'edit', submitEvent: 'FIX', fields: ['target'] },
          ],
        }],
      },
    ],
  };
}

function validatingView(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'shield-check', size: 'lg' },
      { type: 'typography', content: 'Validating...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md', justify: 'center',
        children: [
          { type: 'badge', label: `@entity.target` },
          { type: 'badge', label: ['str/concat', 'Attempt ', ['str/concat', '@entity.fixAttempts'], '/', ['str/concat', '@entity.maxAttempts']] },
        ],
      },
    ],
  };
}

function fixingView(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center', justify: 'space-between',
        children: [
          {
            type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
            children: [
              { type: 'icon', name: 'cpu', size: 'lg' },
              { type: 'typography', content: 'Generating fix...', variant: 'h2' },
            ],
          },
          { type: 'badge', label: ['str/concat', 'Attempt ', ['str/concat', '@entity.fixAttempts']] },
        ],
      },
      { type: 'divider' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'sm',
          children: [
            { type: 'typography', content: 'Validation Errors', variant: 'caption' },
            { type: 'alert', variant: 'error', message: `@entity.validationErrors` },
          ],
        }],
      },
      { type: 'spinner', size: 'lg' },
    ],
  };
}

function applyingView(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'tool', size: 'lg' },
      { type: 'typography', content: 'Applying fix...', variant: 'h3' },
      { type: 'spinner', size: 'lg' },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'sm',
          children: [
            { type: 'typography', content: 'Proposed Fix', variant: 'caption' },
            { type: 'typography', content: `@entity.currentFix`, variant: 'body' },
          ],
        }],
      },
    ],
  };
}

function succeededView(): unknown {
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
              { type: 'typography', content: 'Validation Passed', variant: 'h2' },
            ],
          },
          { type: 'button', label: 'New Target', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
        ],
      },
      { type: 'divider' },
      {
        type: 'simple-grid', cols: 2,
        children: [
          { type: 'stat-display', label: 'Fix Attempts', value: `@entity.fixAttempts`, icon: 'wrench' },
          { type: 'stat-display', label: 'Status', value: 'Passed', icon: 'check' },
        ],
      },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'sm',
          children: [
            { type: 'typography', content: 'Target', variant: 'caption' },
            { type: 'typography', content: `@entity.target`, variant: 'body' },
          ],
        }],
      },
    ],
  };
}

function failedView(): unknown {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'x-circle', size: 'lg' },
      { type: 'typography', content: 'Fix Loop Failed', variant: 'h2' },
      { type: 'alert', variant: 'error', message: `@entity.error` },
      {
        type: 'simple-grid', cols: 2,
        children: [
          { type: 'stat-display', label: 'Attempts Used', value: `@entity.fixAttempts`, icon: 'wrench' },
          { type: 'stat-display', label: 'Remaining Errors', value: `@entity.errorCount`, icon: 'alert-triangle' },
        ],
      },
      {
        type: 'card',
        children: [{
          type: 'stack', direction: 'vertical', gap: 'sm',
          children: [
            { type: 'typography', content: 'Last Validation Errors', variant: 'caption' },
            { type: 'typography', content: `@entity.validationErrors`, variant: 'body' },
          ],
        }],
      },
      { type: 'button', label: 'Retry', event: 'RESET', variant: 'primary', icon: 'rotate-ccw' },
    ],
  };
}

// ============================================================================
// Trait Builder
// ============================================================================

function buildTrait(c: FixLoopConfig): Trait {
  const { entityName, maxAttempts, validateTool, fixTool } = c;

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'FIX_SUCCEEDED', scope: 'external' as const, payload: [{ name: 'target', type: 'string' }] },
      { event: 'FIX_FAILED', scope: 'external' as const, payload: [{ name: 'target', type: 'string' }, { name: 'error', type: 'string' }] },
    ],
    listens: [
      { event: 'FIX_SUCCEEDED', triggers: 'INIT', scope: 'external' as const },
      { event: 'FIX_FAILED', triggers: 'INIT', scope: 'external' as const },
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'validating' },
        { name: 'fixing' },
        { name: 'applying' },
        { name: 'succeeded' },
        { name: 'failed' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'FIX', name: 'Start Fix Loop' },
        { key: 'VALIDATION_PASSED', name: 'Validation Passed' },
        {
          key: 'VALIDATION_ERRORS', name: 'Validation Errors',
          payload: [
            { name: 'errors', type: 'string', required: true },
            { name: 'count', type: 'number', required: true },
          ],
        },
        {
          key: 'FIX_GENERATED', name: 'Fix Generated',
          payload: [{ name: 'fix', type: 'string', required: true }],
        },
        { key: 'FIX_APPLIED', name: 'Fix Applied' },
        {
          key: 'EXCEEDED_ATTEMPTS', name: 'Exceeded Max Attempts',
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
          from: 'idle', to: 'validating', event: 'FIX',
          effects: [
            ['set', '@entity.status', 'validating'],
            ['set', '@entity.fixAttempts', 0],
            ['set', '@entity.validationErrors', ''],
            ['set', '@entity.errorCount', 0],
            ['agent/invoke', validateTool, { target: '@entity.target' }],
            ['render-ui', 'main', validatingView()],
          ],
        },
        {
          from: 'validating', to: 'succeeded', event: 'VALIDATION_PASSED',
          effects: [
            ['set', '@entity.status', 'succeeded'],
            ['emit', 'FIX_SUCCEEDED'],
            ['render-ui', 'main', succeededView()],
          ],
        },
        {
          from: 'validating', to: 'fixing', event: 'VALIDATION_ERRORS',
          guards: [['<', '@entity.fixAttempts', maxAttempts]],
          effects: [
            ['set', '@entity.validationErrors', '@payload.errors'],
            ['set', '@entity.errorCount', '@payload.count'],
            ['set', '@entity.fixAttempts', ['+', '@entity.fixAttempts', 1]],
            ['set', '@entity.status', 'fixing'],
            ['agent/generate', ['str/concat',
              'Target: ', '@entity.target',
              '\n\nValidation errors:\n', '@payload.errors',
              '\n\nGenerate a fix that resolves these errors. Return only the fix content.',
            ]],
            ['render-ui', 'main', fixingView()],
          ],
        },
        {
          from: 'validating', to: 'failed', event: 'EXCEEDED_ATTEMPTS',
          effects: [
            ['set', '@entity.status', 'failed'],
            ['set', '@entity.error', '@payload.error'],
            ['emit', 'FIX_FAILED'],
            ['render-ui', 'main', failedView()],
          ],
        },
        {
          from: 'fixing', to: 'applying', event: 'FIX_GENERATED',
          effects: [
            ['set', '@entity.currentFix', '@payload.fix'],
            ['set', '@entity.status', 'applying'],
            ['agent/invoke', fixTool, { target: '@entity.target', fix: '@payload.fix' }],
            ['render-ui', 'main', applyingView()],
          ],
        },
        {
          from: 'applying', to: 'validating', event: 'FIX_APPLIED',
          effects: [
            ['set', '@entity.status', 'validating'],
            ['agent/invoke', validateTool, { target: '@entity.target' }],
            ['render-ui', 'main', validatingView()],
          ],
        },
        {
          from: 'fixing', to: 'failed', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'failed'],
            ['emit', 'FIX_FAILED'],
            ['render-ui', 'main', failedView()],
          ],
        },
        {
          from: 'applying', to: 'failed', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'failed'],
            ['emit', 'FIX_FAILED'],
            ['render-ui', 'main', failedView()],
          ],
        },
        {
          from: 'succeeded', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.status', 'idle'],
            ['set', '@entity.target', ''],
            ['set', '@entity.validationErrors', ''],
            ['set', '@entity.currentFix', ''],
            ['set', '@entity.fixAttempts', 0],
            ['set', '@entity.errorCount', 0],
            ['set', '@entity.error', ''],
            ['render-ui', 'main', idleView(entityName)],
          ],
        },
        {
          from: 'failed', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.status', 'idle'],
            ['set', '@entity.target', ''],
            ['set', '@entity.validationErrors', ''],
            ['set', '@entity.currentFix', ''],
            ['set', '@entity.fixAttempts', 0],
            ['set', '@entity.errorCount', 0],
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

function buildEntity(c: FixLoopConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

export function stdAgentFixLoopEntity(params: StdAgentFixLoopParams): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentFixLoopTrait(params: StdAgentFixLoopParams): Trait {
  return buildTrait(resolve(params));
}

export function stdAgentFixLoopPage(params: StdAgentFixLoopParams): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: c.traitName },
      { ref: 'FixLoopStepProgress' },
      { ref: 'FixLoopErrorsBrowse' },
      { ref: 'FixLoopValidateCall' },
      { ref: 'FixLoopFixCall' },
      { ref: 'FixLoopCompletionFlow' },
    ],
  } as Page;
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdAgentFixLoop(params: StdAgentFixLoopParams): OrbitalDefinition {
  const c = resolve(params);
  const { entityName, fields } = c;

  // 1. Core orchestrator trait
  const fixTrait = buildTrait(c);

  // 2. Agent atoms: validate tool call, fix tool call, completion
  const validateCallTrait = extractTrait(stdAgentToolCall({
    entityName,
    fields,
    persistence: 'runtime',
  }));
  validateCallTrait.name = 'FixLoopValidateCall';
  validateCallTrait.listens = [];
  if (validateCallTrait.emits) { for (const e of validateCallTrait.emits) { (e as unknown as { scope: string }).scope = 'internal'; } }

  const fixCallTrait = extractTrait(stdAgentToolCall({
    entityName,
    fields,
    persistence: 'runtime',
  }));
  fixCallTrait.name = 'FixLoopFixCall';
  fixCallTrait.listens = [];
  if (fixCallTrait.emits) { for (const e of fixCallTrait.emits) { (e as unknown as { scope: string }).scope = 'internal'; } }

  const completionTrait = extractTrait(stdAgentCompletion({
    entityName,
    fields,
    persistence: 'runtime',
  }));
  completionTrait.name = 'FixLoopCompletionFlow';
  completionTrait.listens = [];
  if (completionTrait.emits) { for (const e of completionTrait.emits) { (e as unknown as { scope: string }).scope = 'internal'; } }

  // 3. UI atoms: step progress + errors browse list
  const stepProgressTrait = extractTrait(stdAgentStepProgress({
    entityName,
    fields,
    stepLabels: ['Validate', 'Analyze', 'Fix', 'Re-validate'],
    persistence: 'runtime',
  }));
  stepProgressTrait.name = 'FixLoopStepProgress';
  stepProgressTrait.listens = [];
  if (stepProgressTrait.emits) { for (const e of stepProgressTrait.emits) { (e as unknown as { scope: string }).scope = 'internal'; } }

  const errorsBrowseTrait = extractTrait(stdBrowse({
    entityName,
    fields,
    traitName: 'FixLoopErrorsBrowse',
    listFields: ['target', 'errorCount', 'status'],
    headerIcon: 'alert-triangle',
    pageTitle: 'Validation Errors',
    emptyTitle: 'No errors',
    emptyDescription: 'All validations passed.',
    itemActions: [{ label: 'View', event: 'VIEW' }],
  }));
  errorsBrowseTrait.name = 'FixLoopErrorsBrowse';

  // 4. Entity + page
  const entity = makeEntity({ name: entityName, fields, persistence: c.persistence });
  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: fixTrait.name },
      { ref: stepProgressTrait.name },
      { ref: errorsBrowseTrait.name },
      { ref: validateCallTrait.name },
      { ref: fixCallTrait.name },
      { ref: completionTrait.name },
    ],
  } as Page;

  return makeOrbital(
    `${entityName}Orbital`,
    entity,
    [fixTrait, stepProgressTrait, errorsBrowseTrait, validateCallTrait, fixCallTrait, completionTrait],
    [page],
  );
}
