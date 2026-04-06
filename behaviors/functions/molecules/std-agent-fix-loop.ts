/**
 * std-agent-fix-loop — Validation-fix cycle
 *
 * Composes tool invocation (validate + fix) and LLM completion into an
 * iterative validation-fix loop. Validates a target, and if errors are found,
 * generates a fix via LLM, applies it via tool invocation, then re-validates.
 * Loops up to maxAttempts rounds (default 5).
 *
 * Traits composed (inline, representing atom-level concerns):
 * - FixLoopValidate: tool invocation for running validation
 * - FixLoopFix: LLM completion to generate fixes + tool invocation to apply
 * - FixLoopOrchestrator: state machine orchestrating the validate-fix cycle
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
          { type: 'badge', label: ['string/concat', 'Attempt ', ['string/of', '@entity.fixAttempts'], '/', ['string/of', '@entity.maxAttempts']] },
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
          { type: 'badge', label: ['string/concat', 'Attempt ', ['string/of', '@entity.fixAttempts']] },
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
        type: 'simple-grid', columns: 2,
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
        type: 'simple-grid', columns: 2,
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
      { event: 'FIX_SUCCEEDED' },
      { event: 'FIX_FAILED' },
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
        {
          key: 'VALIDATION_PASSED', name: 'Validation Passed',
        },
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
        // INIT: idle -> idle
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['render-ui', 'main', idleView(entityName)],
          ],
        },
        // FIX: idle -> validating (run initial validation)
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
        // VALIDATION_PASSED: validating -> succeeded
        {
          from: 'validating', to: 'succeeded', event: 'VALIDATION_PASSED',
          effects: [
            ['set', '@entity.status', 'succeeded'],
            ['emit', 'FIX_SUCCEEDED'],
            ['render-ui', 'main', succeededView()],
          ],
        },
        // VALIDATION_ERRORS: validating -> fixing (errors found, generate fix)
        {
          from: 'validating', to: 'fixing', event: 'VALIDATION_ERRORS',
          guards: [['math/lt', '@entity.fixAttempts', maxAttempts]],
          effects: [
            ['set', '@entity.validationErrors', '@payload.errors'],
            ['set', '@entity.errorCount', '@payload.count'],
            ['set', '@entity.fixAttempts', ['math/add', '@entity.fixAttempts', 1]],
            ['set', '@entity.status', 'fixing'],
            ['agent/generate', ['string/concat',
              'Target: ', '@entity.target',
              '\n\nValidation errors:\n', '@payload.errors',
              '\n\nGenerate a fix that resolves these errors. Return only the fix content.',
            ]],
            ['render-ui', 'main', fixingView()],
          ],
        },
        // VALIDATION_ERRORS when max attempts exceeded: validating -> failed
        {
          from: 'validating', to: 'failed', event: 'EXCEEDED_ATTEMPTS',
          effects: [
            ['set', '@entity.status', 'failed'],
            ['set', '@entity.error', '@payload.error'],
            ['emit', 'FIX_FAILED'],
            ['render-ui', 'main', failedView()],
          ],
        },
        // FIX_GENERATED: fixing -> applying (apply the generated fix)
        {
          from: 'fixing', to: 'applying', event: 'FIX_GENERATED',
          effects: [
            ['set', '@entity.currentFix', '@payload.fix'],
            ['set', '@entity.status', 'applying'],
            ['agent/invoke', fixTool, { target: '@entity.target', fix: '@payload.fix' }],
            ['render-ui', 'main', applyingView()],
          ],
        },
        // FIX_APPLIED: applying -> validating (re-validate after applying fix)
        {
          from: 'applying', to: 'validating', event: 'FIX_APPLIED',
          effects: [
            ['set', '@entity.status', 'validating'],
            ['agent/invoke', validateTool, { target: '@entity.target' }],
            ['render-ui', 'main', validatingView()],
          ],
        },
        // FAILED: fixing -> failed
        {
          from: 'fixing', to: 'failed', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'failed'],
            ['emit', 'FIX_FAILED'],
            ['render-ui', 'main', failedView()],
          ],
        },
        // FAILED: applying -> failed
        {
          from: 'applying', to: 'failed', event: 'FAILED',
          effects: [
            ['set', '@entity.error', '@payload.error'],
            ['set', '@entity.status', 'failed'],
            ['emit', 'FIX_FAILED'],
            ['render-ui', 'main', failedView()],
          ],
        },
        // RESET: succeeded -> idle
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
        // RESET: failed -> idle
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

function buildPage(c: FixLoopConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

export function stdAgentFixLoopEntity(params: StdAgentFixLoopParams): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentFixLoopTrait(params: StdAgentFixLoopParams): Trait {
  return buildTrait(resolve(params));
}

export function stdAgentFixLoopPage(params: StdAgentFixLoopParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdAgentFixLoop(params: StdAgentFixLoopParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
