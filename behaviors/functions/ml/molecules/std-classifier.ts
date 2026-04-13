/**
 * std-classifier
 *
 * ML classification molecule. Composes std-forward with auto-built
 * input/output contracts for classification tasks.
 *
 * Builds input contract from inputFields, output contract from classes.
 * After forward pass, runs argmax to pick the predicted class.
 * Emits CLASSIFIED with { class: string, confidence: number }.
 *
 * Single orbital, one trait, one page.
 *
 * @level molecule
 * @family ml
 * @packageDocumentation
 */

import type { OrbitalDefinition, OrbitalSchema, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, ensureIdField, plural, makeSchema, } from '@almadar/core/builders';
import { stdForward } from '../atoms/std-forward.js';

// ============================================================================
// Params
// ============================================================================

export interface StdClassifierParams {
  entityName: string;
  fields: EntityField[];
  architecture: unknown;
  /** Entity fields that map to input features */
  inputFields: string[];
  /** Class labels, e.g. ["cat", "dog", "bird"] */
  classes: string[];
  /** Numeric range for input normalization. Default: [0, 1] */
  inputRange?: [number, number];
  /** Event that triggers classification. Default: "CLASSIFY" */
  classifyEvent?: string;
  /** Event emitted with result. Default: "CLASSIFIED" */
  resultEvent?: string;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface ClassifierConfig {
  entityName: string;
  fields: EntityField[];
  architecture: unknown;
  inputFields: string[];
  classes: string[];
  inputRange: [number, number];
  classifyEvent: string;
  resultEvent: string;
  traitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdClassifierParams): ClassifierConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  // Ensure classifier-specific fields exist on entity
  const domainFields: EntityField[] = [
    { name: 'predictedClass', type: 'string', default: '' },
    { name: 'confidence', type: 'number', default: 0 },
    { name: 'status', type: 'string', default: 'ready' },
  ];
  const userFieldNames = new Set(baseFields.map(f => f.name));
  const fields = [...baseFields, ...domainFields.filter(f => !userFieldNames.has(f.name))];

  const p = plural(entityName);

  return {
    entityName,
    fields,
    architecture: params.architecture,
    inputFields: params.inputFields,
    classes: params.classes,
    inputRange: params.inputRange ?? [0, 1],
    classifyEvent: params.classifyEvent ?? 'CLASSIFY',
    resultEvent: params.resultEvent ?? 'CLASSIFIED',
    traitName: `${entityName}Classifier`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}ClassifierPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/classify`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Contract builders
// ============================================================================

function buildInputContract(inputFields: string[], inputRange: [number, number]): unknown {
  return {
    type: 'tensor',
    shape: [inputFields.length],
    dtype: 'float32',
    fields: inputFields,
    range: inputRange,
  };
}

function buildOutputContract(classes: string[]): unknown {
  return {
    type: 'tensor',
    shape: [classes.length],
    dtype: 'float32',
    labels: classes,
    activation: 'softmax',
  };
}

// ============================================================================
// Trait builder
// ============================================================================

function buildTrait(c: ClassifierConfig): Trait {
  const { entityName, classifyEvent, resultEvent, classes } = c;

  // Ready view: shows input fields + classify button
  const readyView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'brain', size: 'lg' },
          { type: 'typography', content: `${entityName} Classifier`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'badge', label: '@entity.status' },
      { type: 'typography', variant: 'body', color: 'muted', content: `Classifies into: ${classes.join(', ')}` },
      { type: 'button', label: 'Classify', event: classifyEvent, variant: 'primary', icon: 'play' },
    ],
  };

  // Classifying view: loading
  const classifyingView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'loading-state', title: 'Classifying', message: 'Running forward pass with argmax...' },
      { type: 'spinner', size: 'lg' },
    ],
  };

  // Result view: shows predicted class + confidence
  const resultView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'check-circle', size: 'lg' },
          { type: 'typography', content: 'Classification Complete', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'badge', label: '@entity.predictedClass', variant: 'success' },
      { type: 'typography', variant: 'caption', content: 'Confidence' },
      { type: 'progress-bar', value: '@entity.confidence', max: 1 },
      { type: 'button', label: 'Classify Again', event: classifyEvent, variant: 'outline', icon: 'refresh-cw' },
    ],
  };

  // Build forward effect with auto-contracts
  const inputContract = buildInputContract(c.inputFields, c.inputRange);
  const outputContract = buildOutputContract(c.classes);

  const forwardEffect: unknown[] = ['forward', 'primary', {
    architecture: c.architecture,
    input: '@payload.input',
    'input-contract': inputContract,
    'output-contract': outputContract,
    'on-complete': 'FORWARD_DONE',
  }];

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: [{ event: resultEvent, scope: 'external' as const }],
    stateMachine: {
      states: [
        { name: 'ready', isInitial: true },
        { name: 'classifying' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: classifyEvent, name: 'Classify' },
        { key: 'FORWARD_DONE', name: 'Forward Done' },
      ],
      transitions: [
        // INIT: ready -> ready
        {
          from: 'ready', to: 'ready', event: 'INIT',
          effects: [
            ['set', '@entity.status', 'ready'],
            ['render-ui', 'main', readyView],
          ],
        },
        // CLASSIFY: ready -> classifying (fire forward pass)
        {
          from: 'ready', to: 'classifying', event: classifyEvent,
          effects: [
            ['set', '@entity.status', 'classifying'],
            forwardEffect,
            ['render-ui', 'main', classifyingView],
          ],
        },
        // FORWARD_DONE: classifying -> ready (argmax + emit result)
        {
          from: 'classifying', to: 'ready', event: 'FORWARD_DONE',
          effects: [
            ['set', '@entity.predictedClass', ['tensor/argmax-label', '@payload.output', classes]],
            ['set', '@entity.confidence', ['tensor/max', '@payload.output']],
            ['set', '@entity.status', 'ready'],
            ['emit', resultEvent],
            ['render-ui', 'main', resultView],
          ],
        },
      ],
    },
  } as Trait;
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdClassifierEntity(params: StdClassifierParams): Entity {
  const c = resolve(params);
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: 'runtime' });
}

export function stdClassifierTrait(params: StdClassifierParams): Trait {
  return buildTrait(resolve(params));
}

export function stdClassifierPage(params: StdClassifierParams): Page {
  const c = resolve(params);
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdClassifier(params: StdClassifierParams): OrbitalSchema {
  const c = resolve(params);

  const entity = makeEntity({ name: c.entityName, fields: c.fields, persistence: 'runtime' });
  const trait = buildTrait(c);
  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [{ ref: trait.name }],
  } as Page;

  return makeSchema(`${c.entityName}Orbital`, {
    name: `${c.entityName}Orbital`,
    entity,
    traits: [trait],
    pages: [page],
  } as OrbitalDefinition);
}
