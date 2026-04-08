/**
 * std-agent-step-progress
 *
 * Pipeline/workflow step indicator atom. Tracks progress through
 * a series of named steps with start/advance/complete/fail lifecycle.
 * Listens for ADVANCE, COMPLETE, FAIL so orchestrating traits can
 * drive the progress externally.
 *
 * @level atom
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
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdAgentStepProgressParams {
  /** Entity name in PascalCase (default: "StepTracker") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, step tracker fields are always included) */
  fields?: EntityField[];
  /** Labels for each step in the pipeline */
  stepLabels?: string[];
  /** Persistence mode (default: "runtime") */
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Page name override */
  pageName?: string;
  /** Page path override */
  pagePath?: string;
  /** Whether this page is the initial route */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface StepProgressConfig {
  entityName: string;
  fields: EntityField[];
  stepLabels: string[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdAgentStepProgressParams): StepProgressConfig {
  const entityName = params.entityName ?? 'StepTracker';
  const p = plural(entityName);
  const stepLabels = params.stepLabels ?? ['Initialize', 'Process', 'Validate', 'Complete'];

  const requiredFields: EntityField[] = [
    { name: 'currentStep', type: 'number', default: 0 },
    { name: 'totalSteps', type: 'number', default: stepLabels.length },
    { name: 'status', type: 'string', default: 'idle' },
  ];
  const baseFields = params.fields ?? [];
  const existingNames = new Set(baseFields.map(f => f.name));
  const mergedFields = [
    ...baseFields,
    ...requiredFields.filter(f => !existingNames.has(f.name)),
  ];
  const fields = ensureIdField(mergedFields);

  return {
    entityName,
    fields,
    stepLabels,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Progress`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: StepProgressConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: StepProgressConfig): Trait {
  const { entityName } = c;
  const stepsLiteral = c.stepLabels.map((label, i) => ({ id: String(i), title: label }));

  const idleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'list-ordered', size: 'lg' },
          { type: 'typography', content: `${entityName}`, variant: 'h2' },
          { type: 'badge', label: 'Idle', variant: 'default' },
        ],
      },
      { type: 'divider' },
      { type: 'wizard-progress', currentStep: '@entity.currentStep', steps: stepsLiteral },
      { type: 'button', label: 'Start', event: 'START', variant: 'primary', icon: 'play' },
    ],
  };

  const inProgressUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'loader', size: 'lg' },
          { type: 'typography', content: `${entityName}`, variant: 'h2' },
          { type: 'badge', label: 'In Progress', variant: 'warning' },
        ],
      },
      { type: 'divider' },
      { type: 'wizard-progress', currentStep: '@entity.currentStep', steps: stepsLiteral },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'stat-display', label: 'Current Step', value: '@entity.currentStep' },
          { type: 'stat-display', label: 'Total Steps', value: '@entity.totalSteps' },
        ],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'button', label: 'Advance', event: 'ADVANCE', variant: 'primary', icon: 'chevron-right' },
          { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
        ],
      },
    ],
  };

  const completedUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'check-circle', size: 'lg' },
          { type: 'typography', content: `${entityName}`, variant: 'h2' },
          { type: 'badge', label: 'Completed', variant: 'success' },
        ],
      },
      { type: 'divider' },
      { type: 'wizard-progress', currentStep: '@entity.totalSteps', steps: stepsLiteral },
      { type: 'alert', variant: 'success', message: 'All steps completed successfully.' },
      { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  const failedUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'x-circle', size: 'lg' },
          { type: 'typography', content: `${entityName}`, variant: 'h2' },
          { type: 'badge', label: 'Failed', variant: 'destructive' },
        ],
      },
      { type: 'divider' },
      { type: 'wizard-progress', currentStep: '@entity.currentStep', steps: stepsLiteral },
      { type: 'alert', variant: 'error', message: 'Pipeline failed at the current step.' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'stat-display', label: 'Failed At Step', value: '@entity.currentStep' },
        ],
      },
      { type: 'button', label: 'Reset', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [
      { event: 'ADVANCE', scope: 'external' as const, payload: [{ name: 'step', type: 'number' }] },
      { event: 'COMPLETE', scope: 'external' as const, payload: [{ name: 'totalSteps', type: 'number' }] },
      { event: 'FAIL', scope: 'external' as const, payload: [{ name: 'step', type: 'number' }] },
    ],
    listens: [
      { event: 'ADVANCE', triggers: 'ADVANCE', scope: 'external' as const },
      { event: 'COMPLETE', triggers: 'COMPLETE', scope: 'external' as const },
      { event: 'FAIL', triggers: 'FAIL', scope: 'external' as const },
    ],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'in_progress' },
        { name: 'completed' },
        { name: 'failed' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'START', name: 'Start Pipeline' },
        { key: 'ADVANCE', name: 'Advance Step' },
        { key: 'COMPLETE', name: 'Complete Pipeline' },
        { key: 'FAIL', name: 'Pipeline Failed' },
        { key: 'RESET', name: 'Reset Pipeline' },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['fetch', entityName],
            ['render-ui', 'main', idleUI],
          ],
        },
        {
          from: 'idle', to: 'in_progress', event: 'START',
          effects: [
            ['set', '@entity.status', 'in_progress'],
            ['set', '@entity.currentStep', 0],
            ['render-ui', 'main', inProgressUI],
          ],
        },
        {
          from: 'in_progress', to: 'in_progress', event: 'ADVANCE',
          guard: ['<', '@entity.currentStep', '@entity.totalSteps'],
          effects: [
            ['set', '@entity.currentStep', ['+', '@entity.currentStep', 1]],
            ['render-ui', 'main', inProgressUI],
          ],
        },
        {
          from: 'in_progress', to: 'completed', event: 'COMPLETE',
          effects: [
            ['set', '@entity.status', 'completed'],
            ['set', '@entity.currentStep', '@entity.totalSteps'],
            ['render-ui', 'main', completedUI],
          ],
        },
        {
          from: 'in_progress', to: 'failed', event: 'FAIL',
          effects: [
            ['set', '@entity.status', 'failed'],
            ['render-ui', 'main', failedUI],
          ],
        },
        {
          from: 'idle', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.status', 'idle'],
            ['set', '@entity.currentStep', 0],
            ['render-ui', 'main', idleUI],
          ],
        },
        {
          from: 'in_progress', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.status', 'idle'],
            ['set', '@entity.currentStep', 0],
            ['render-ui', 'main', idleUI],
          ],
        },
        {
          from: 'completed', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.status', 'idle'],
            ['set', '@entity.currentStep', 0],
            ['render-ui', 'main', idleUI],
          ],
        },
        {
          from: 'failed', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.status', 'idle'],
            ['set', '@entity.currentStep', 0],
            ['render-ui', 'main', idleUI],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: StepProgressConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentStepProgressEntity(params: StdAgentStepProgressParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentStepProgressTrait(params: StdAgentStepProgressParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdAgentStepProgressPage(params: StdAgentStepProgressParams = {}): Page {
  return buildPage(resolve(params));
}

export function stdAgentStepProgress(params: StdAgentStepProgressParams = {}): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
