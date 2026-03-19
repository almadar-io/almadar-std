/**
 * std-input as a Function
 *
 * Input state management parameterized for any domain.
 * Provides idle, focused, and validating states with change tracking.
 * The state machine structure is fixed. The caller controls data and presentation.
 *
 * @level atom
 * @family input
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdInputParams {
  /** Entity name in PascalCase (e.g., "Field", "TextInput") */
  entityName: string;
  /** Entity fields (id is auto-added) */
  fields: EntityField[];
  /** Persistence mode */
  persistence?: 'persistent' | 'runtime' | 'singleton';

  // Display
  /** Input label */
  inputLabel?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Header icon (Lucide name) */
  headerIcon?: string;

  // Page
  /** Page name (defaults to "{Entity}InputPage") */
  pageName?: string;
  /** Route path (defaults to "/{entities}/input") */
  pagePath?: string;
  /** Whether this is the initial/home page */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface InputConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  inputLabel: string;
  placeholder: string;
  headerIcon: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdInputParams): InputConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  // Ensure input-related fields exist on entity
  const fields = [
    ...baseFields,
    ...(baseFields.some(f => f.name === 'value') ? [] : [{ name: 'value', type: 'string' as const, default: '' }]),
    ...(baseFields.some(f => f.name === 'inputStatus') ? [] : [{ name: 'inputStatus', type: 'string' as const, default: 'idle' }]),
  ];

  const p = plural(entityName);

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Input`,
    pluralName: p,
    inputLabel: params.inputLabel ?? entityName,
    placeholder: params.placeholder ?? `Enter ${entityName.toLowerCase()}...`,
    headerIcon: params.headerIcon ?? 'text-cursor-input',
    pageName: params.pageName ?? `${entityName}InputPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/input`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: InputConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

/** S-expression: get field from first entity in collection */
const ef = (field: string): unknown[] => ['object/get', ['array/first', '@entity'], field];

function buildTrait(c: InputConfig): Trait {
  const { entityName, inputLabel, placeholder, headerIcon } = c;

  // Comprehensive input showcase with all input pattern types
  const inputView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: inputLabel, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'form-section-header', title: 'Text Inputs', description: 'Standard text entry fields' },
      {
        type: 'input-group',
        children: [
          { type: 'label', text: inputLabel, htmlFor: 'main-input' },
          {
            type: 'form-field',
            label: inputLabel,
            hint: 'Type to enter a value.',
            children: [
              { type: 'input', placeholder, event: 'CHANGE' },
            ],
          },
        ],
      },
      {
        type: 'input-group',
        children: [
          { type: 'label', text: 'Description', htmlFor: 'description-input' },
          { type: 'textarea', placeholder: 'Enter a longer description...', event: 'CHANGE', rows: 3 },
        ],
      },
      { type: 'form-section-header', title: 'Selection Inputs', description: 'Choose from options' },
      {
        type: 'input-group',
        children: [
          { type: 'label', text: 'Category', htmlFor: 'category-select' },
          { type: 'select', options: ['Option A', 'Option B', 'Option C'], event: 'CHANGE', placeholder: 'Select a category' },
        ],
      },
      {
        type: 'input-group',
        children: [
          { type: 'label', text: 'Priority', htmlFor: 'priority-radio' },
          { type: 'radio', options: ['Low', 'Medium', 'High'], event: 'CHANGE' },
        ],
      },
      { type: 'form-section-header', title: 'Toggle & Range', description: 'Adjustable controls' },
      {
        type: 'input-group',
        children: [
          { type: 'label', text: 'Enabled', htmlFor: 'enabled-switch' },
          { type: 'switch', event: 'CHANGE' },
        ],
      },
      {
        type: 'input-group',
        children: [
          { type: 'label', text: 'Volume', htmlFor: 'volume-slider' },
          { type: 'range-slider', min: 0, max: 100, step: 1, event: 'CHANGE' },
        ],
      },
      {
        type: 'input-group',
        children: [
          { type: 'label', text: 'Quantity', htmlFor: 'quantity-stepper' },
          { type: 'number-stepper', min: 0, max: 99, step: 1, event: 'CHANGE' },
        ],
      },
      { type: 'typography', variant: 'caption', color: 'muted', content: ef('value') },
    ],
  };

  const validatingView = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: headerIcon, size: 'lg' },
          { type: 'typography', content: inputLabel, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'form-section-header', title: 'Validating', description: 'Checking input...' },
      {
        type: 'input-group',
        children: [
          { type: 'label', text: inputLabel, htmlFor: 'main-input' },
          {
            type: 'form-field',
            label: inputLabel,
            hint: 'Validating...',
            children: [
              { type: 'input', placeholder, event: 'CHANGE' },
            ],
          },
        ],
      },
      { type: 'alert', variant: 'info', message: 'Validating input...' },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'focused' },
        { name: 'validating' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'FOCUS', name: 'Focus' },
        { key: 'BLUR', name: 'Blur' },
        { key: 'CHANGE', name: 'Change', payload: [{ name: 'value', type: 'string', required: true }] },
        { key: 'VALIDATE', name: 'Validate' },
      ],
      transitions: [
        // INIT: idle -> idle
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['render-ui', 'main', inputView],
          ],
        },
        // FOCUS: idle -> focused
        {
          from: 'idle', to: 'focused', event: 'FOCUS',
          effects: [
            ['set', '@entity.inputStatus', 'focused'],
            ['render-ui', 'main', inputView],
          ],
        },
        // CHANGE: focused -> focused
        {
          from: 'focused', to: 'focused', event: 'CHANGE',
          effects: [
            ['set', '@entity.value', '@payload.value'],
            ['render-ui', 'main', inputView],
          ],
        },
        // BLUR: focused -> idle
        {
          from: 'focused', to: 'idle', event: 'BLUR',
          effects: [
            ['set', '@entity.inputStatus', 'idle'],
            ['render-ui', 'main', inputView],
          ],
        },
        // VALIDATE: focused -> validating
        {
          from: 'focused', to: 'validating', event: 'VALIDATE',
          effects: [
            ['set', '@entity.inputStatus', 'validating'],
            ['render-ui', 'main', validatingView],
          ],
        },
        // BLUR: validating -> idle
        {
          from: 'validating', to: 'idle', event: 'BLUR',
          effects: [
            ['set', '@entity.inputStatus', 'idle'],
            ['render-ui', 'main', inputView],
          ],
        },
        // INIT: focused -> focused (self-loop)
        {
          from: 'focused', to: 'focused', event: 'INIT',
          effects: [
            ['render-ui', 'main', inputView],
          ],
        },
        // INIT: validating -> validating (self-loop)
        {
          from: 'validating', to: 'validating', event: 'INIT',
          effects: [
            ['render-ui', 'main', validatingView],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: InputConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdInputEntity(params: StdInputParams): Entity {
  return buildEntity(resolve(params));
}

export function stdInputTrait(params: StdInputParams): Trait {
  return buildTrait(resolve(params));
}

export function stdInputPage(params: StdInputParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdInput(params: StdInputParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
