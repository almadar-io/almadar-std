/**
 * std-wizard
 *
 * Multi-step wizard behavior parameterized for any domain.
 * Generates a dynamic number of steps based on the `steps` parameter,
 * with a review screen and completion view.
 * Pure function: params in, OrbitalDefinition out.
 *
 * @level molecule
 * @family workflow
 * @packageDocumentation
 */

import type { OrbitalDefinition } from '@almadar/core/types';
import type { EntityField } from '@almadar/core/types';
import type { Entity } from '@almadar/core/types';
import type { Page } from '@almadar/core/types';
import type { Trait } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdWizardParams {
  /** Entity name in PascalCase (e.g., "Onboarding") */
  entityName: string;
  /** Entity fields (id is auto-added) */
  fields: EntityField[];
  /** Persistence mode */
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Collection name for persistent entities (defaults to lowercase plural) */
  collection?: string;

  /** Wizard steps: each step has a name and the fields it displays */
  steps: Array<{
    name: string;
    fields: string[];
  }>;

  // Labels
  /** Wizard title (defaults to "Setup Wizard") */
  wizardTitle?: string;
  /** Completion title (defaults to "Complete!") */
  completeTitle?: string;
  /** Completion description (defaults to "Your {entity} has been created successfully.") */
  completeDescription?: string;
  /** Submit button label on review (defaults to "Complete") */
  submitButtonLabel?: string;

  // Icons
  /** Header icon (Lucide name, defaults to "clipboard") */
  headerIcon?: string;

  // Page
  /** Page name (defaults to "{Entity}Page") */
  pageName?: string;
  /** Route path (defaults to "/wizard") */
  pagePath?: string;
  /** Whether this is the initial/home page */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface WizardConfig {
  entityName: string;
  fields: EntityField[];
  nonIdFields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  collection?: string;
  steps: Array<{ name: string; fields: string[] }>;
  totalSteps: number;
  wizardProgressSteps: string[];
  traitName: string;
  wizardTitle: string;
  completeTitle: string;
  completeDescription: string;
  submitButtonLabel: string;
  headerIcon: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdWizardParams): WizardConfig {
  const { entityName } = params;
  const fields = ensureIdField(params.fields);
  const nonIdFields = fields.filter(f => f.name !== 'id');
  const steps = params.steps ?? [{ name: 'Details', fields: nonIdFields.map(f => f.name) }];

  return {
    entityName,
    fields,
    nonIdFields,
    persistence: params.persistence ?? 'runtime',
    collection: params.collection,
    steps,
    totalSteps: steps.length,
    wizardProgressSteps: steps.map(s => s.name),
    traitName: `${entityName}Wizard`,
    wizardTitle: params.wizardTitle ?? 'Setup Wizard',
    completeTitle: params.completeTitle ?? 'Complete!',
    completeDescription: params.completeDescription ?? `Your ${entityName.toLowerCase()} has been created successfully.`,
    submitButtonLabel: params.submitButtonLabel ?? 'Complete',
    headerIcon: params.headerIcon ?? 'clipboard',
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? '/wizard',
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: WizardConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence, collection: c.collection });
}

function buildStepUI(c: WizardConfig, stepIndex: number): Record<string, unknown> {
  const step = c.steps[stepIndex];
  const stepNumber = stepIndex + 1;
  const isFirst = stepIndex === 0;

  const navButtons: unknown[] = [];
  if (!isFirst) {
    navButtons.push({ type: 'button', label: 'Back', event: 'PREV', variant: 'ghost', icon: 'arrow-left' });
  }
  navButtons.push({ type: 'button', label: 'Next', event: 'NEXT', variant: 'primary', icon: 'arrow-right' });

  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: c.headerIcon, size: 'lg' },
          { type: 'typography', content: c.wizardTitle, variant: 'h2' },
        ],
      },
      { type: 'badge', label: `Step ${stepNumber} of ${c.totalSteps}` },
      { type: 'wizard-progress', steps: c.wizardProgressSteps, currentStep: stepIndex },
      { type: 'divider' },
      { type: 'typography', content: step.name, variant: 'h3' },
      { type: 'form-section', entity: c.entityName, mode: 'create', submitEvent: 'NEXT', cancelEvent: isFirst ? 'INIT' : 'PREV', fields: step.fields },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'end',
        children: navButtons,
      },
    ],
  };
}

function buildReviewUI(c: WizardConfig): Record<string, unknown> {
  const reviewDetailChildren: unknown[] = c.nonIdFields.map(field => ({
    type: 'stack', direction: 'horizontal', gap: 'md', justify: 'space-between',
    children: [
      { type: 'typography', variant: 'caption', content: field.name.charAt(0).toUpperCase() + field.name.slice(1) },
      { type: 'typography', variant: 'body', content: `@entity.${field.name}` },
    ],
  }));

  return {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: c.headerIcon, size: 'lg' },
          { type: 'typography', content: c.wizardTitle, variant: 'h2' },
        ],
      },
      { type: 'badge', label: 'Review' },
      { type: 'wizard-progress', steps: c.wizardProgressSteps, currentStep: c.totalSteps },
      { type: 'divider' },
      {
        type: 'data-list', entity: c.entityName,
        children: [
          {
            type: 'stack', direction: 'vertical', gap: 'sm',
            children: reviewDetailChildren,
          },
        ],
      },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', justify: 'end',
        children: [
          { type: 'button', label: 'Back', event: 'PREV', variant: 'ghost', icon: 'arrow-left' },
          { type: 'button', label: c.submitButtonLabel, event: 'COMPLETE', variant: 'primary', icon: 'check' },
        ],
      },
    ],
  };
}

function buildCompleteUI(c: WizardConfig): Record<string, unknown> {
  return {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'typography', content: c.completeTitle, variant: 'h2' },
      { type: 'typography', content: c.completeDescription, variant: 'body' },
      { type: 'button', label: 'Start New', event: 'RESTART', variant: 'primary', icon: 'refresh-cw' },
    ],
  };
}

function buildTrait(c: WizardConfig): Trait {
  const { entityName, totalSteps } = c;

  // States: step1..stepN, review, complete
  const states: Array<{ name: string; isInitial?: boolean }> = [];
  for (let i = 0; i < totalSteps; i++) {
    states.push({ name: `step${i + 1}`, ...(i === 0 ? { isInitial: true } : {}) });
  }
  states.push({ name: 'review' });
  states.push({ name: 'complete' });

  // Events
  const events = [
    { key: 'INIT', name: 'Initialize' },
    { key: 'NEXT', name: 'Next Step', payload: [{ name: 'data', type: 'object' as const, required: true }] },
    { key: 'PREV', name: 'Previous Step' },
    { key: 'COMPLETE', name: 'Complete Wizard', payload: [{ name: 'data', type: 'object' as const, required: true }] },
    { key: 'RESTART', name: 'Restart Wizard' },
  ];

  // Transitions
  const transitions: unknown[] = [];

  // step1 + INIT -> step1
  transitions.push({
    from: 'step1', to: 'step1', event: 'INIT',
    effects: [
      ['fetch', entityName],
      ['render-ui', 'main', buildStepUI(c, 0)],
    ],
  });

  // stepN + NEXT -> step(N+1) for all but last step
  for (let i = 0; i < totalSteps - 1; i++) {
    transitions.push({
      from: `step${i + 1}`, to: `step${i + 2}`, event: 'NEXT',
      effects: [
        ['fetch', entityName],
        ['render-ui', 'main', buildStepUI(c, i + 1)],
      ],
    });
  }

  // last step + NEXT -> review
  transitions.push({
    from: `step${totalSteps}`, to: 'review', event: 'NEXT',
    effects: [
      ['fetch', entityName],
      ['render-ui', 'main', buildReviewUI(c)],
    ],
  });

  // stepN + PREV -> step(N-1) for steps 2..N
  for (let i = 1; i < totalSteps; i++) {
    transitions.push({
      from: `step${i + 1}`, to: `step${i}`, event: 'PREV',
      effects: [
        ['fetch', entityName],
        ['render-ui', 'main', buildStepUI(c, i - 1)],
      ],
    });
  }

  // review + PREV -> last step
  transitions.push({
    from: 'review', to: `step${totalSteps}`, event: 'PREV',
    effects: [
      ['fetch', entityName],
      ['render-ui', 'main', buildStepUI(c, totalSteps - 1)],
    ],
  });

  // review + COMPLETE -> complete
  transitions.push({
    from: 'review', to: 'complete', event: 'COMPLETE',
    effects: [
      ['persist', 'create', entityName, '@payload.data'],
      ['notify', 'success', `${entityName} created successfully`],
      ['render-ui', 'main', buildCompleteUI(c)],
    ],
  });

  // complete + RESTART -> step1
  transitions.push({
    from: 'complete', to: 'step1', event: 'RESTART',
    effects: [
      ['fetch', entityName],
      ['render-ui', 'main', buildStepUI(c, 0)],
    ],
  });

  // complete + INIT -> step1
  transitions.push({
    from: 'complete', to: 'step1', event: 'INIT',
    effects: [
      ['fetch', entityName],
      ['render-ui', 'main', buildStepUI(c, 0)],
    ],
  });

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states,
      events,
      transitions,
    },
  } as Trait;
}

function buildPage(c: WizardConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdWizardEntity(params: StdWizardParams): Entity {
  return buildEntity(resolve(params));
}

export function stdWizardTrait(params: StdWizardParams): Trait {
  return buildTrait(resolve(params));
}

export function stdWizardPage(params: StdWizardParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdWizard(params: StdWizardParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
