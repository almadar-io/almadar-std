/**
 * std-agent-classifier
 *
 * Classification flow atom for agent-powered text classification.
 * Uses agent/generate with a classification prompt to categorize input text.
 * States: idle -> classifying -> classified.
 *
 * @level atom
 * @family agent
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdAgentClassifierParams {
  /** Entity name in PascalCase (default: "Classification") */
  entityName?: string;
  /** Extra entity fields (id is auto-added, classification fields are always included) */
  fields?: EntityField[];
  /** Persistence mode (default: "persistent") */
  persistence?: 'persistent' | 'runtime' | 'singleton';
  /** Available categories for classification */
  categories?: string[];
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

interface ClassifierConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'persistent' | 'runtime' | 'singleton';
  traitName: string;
  pluralName: string;
  categories: string[];
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdAgentClassifierParams): ClassifierConfig {
  const entityName = params.entityName ?? 'Classification';
  const p = plural(entityName);

  const requiredFields: EntityField[] = [
    { name: 'input', type: 'string', default: '' },
    { name: 'category', type: 'string', default: '' },
    { name: 'confidence', type: 'number', default: 0 },
    { name: 'model', type: 'string', default: 'claude-sonnet-4-20250514' },
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
    persistence: params.persistence ?? 'persistent',
    traitName: `${entityName}Flow`,
    pluralName: p,
    categories: params.categories ?? ['positive', 'negative', 'neutral'],
    pageName: params.pageName ?? `${entityName}Page`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: ClassifierConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: ClassifierConfig): Trait {
  const { entityName, categories } = c;

  const categoryButtons = categories.map(cat => ({
    type: 'badge', label: cat, variant: 'secondary',
  }));

  const idleUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'tag', size: 'lg' },
          { type: 'typography', content: `${entityName}`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'textarea', label: 'Input Text', bind: '@entity.input', placeholder: 'Enter text to classify...' },
      {
        type: 'stack', direction: 'horizontal', gap: 'sm',
        children: [
          { type: 'typography', variant: 'caption', content: 'Categories:' },
          ...categoryButtons,
        ],
      },
      { type: 'button', label: 'Classify', event: 'CLASSIFY', variant: 'primary', icon: 'tag' },
    ],
  };

  const classifyingUI = {
    type: 'loading-state', title: 'Classifying...', message: 'Analyzing input text...',
  };

  const classifiedUI = {
    type: 'stack', direction: 'vertical', gap: 'lg',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'check-circle', size: 'lg' },
          { type: 'typography', content: `${entityName} Result`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'typography', variant: 'body', content: '@entity.input' },
      {
        type: 'stack', direction: 'horizontal', gap: 'md',
        children: [
          { type: 'typography', variant: 'caption', content: 'Category:' },
          { type: 'badge', label: '@entity.category' },
          { type: 'typography', variant: 'caption', content: 'Confidence:' },
          { type: 'badge', label: '@entity.confidence' },
        ],
      },
      { type: 'button', label: 'Classify Another', event: 'RESET', variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'classifying' },
        { name: 'classified' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'CLASSIFY', name: 'Classify', payload: [
          { name: 'input', type: 'string', required: false },
        ]},
        { key: 'RESET', name: 'Reset' },
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
          from: 'idle', to: 'classifying', event: 'CLASSIFY',
          effects: [
            ['render-ui', 'main', classifyingUI],
            ['agent/generate', ['string/concat',
              'Classify the following text into one of these categories: ',
              categories.join(', '),
              '. Text: ',
              '@entity.input',
              '. Respond with JSON: {"category": "...", "confidence": 0.0-1.0}',
            ]],
          ],
        },
        {
          from: 'classifying', to: 'classified', event: 'CLASSIFY',
          effects: [
            ['set', '@entity.category', '@payload.input'],
            ['render-ui', 'main', classifiedUI],
          ],
        },
        {
          from: 'classified', to: 'idle', event: 'RESET',
          effects: [
            ['set', '@entity.input', ''],
            ['set', '@entity.category', ''],
            ['set', '@entity.confidence', 0],
            ['render-ui', 'main', idleUI],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: ClassifierConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Public API
// ============================================================================

export function stdAgentClassifierEntity(params: StdAgentClassifierParams = {}): Entity {
  return buildEntity(resolve(params));
}

export function stdAgentClassifierTrait(params: StdAgentClassifierParams = {}): Trait {
  return buildTrait(resolve(params));
}

export function stdAgentClassifierPage(params: StdAgentClassifierParams = {}): Page {
  return buildPage(resolve(params));
}

export function stdAgentClassifier(params: StdAgentClassifierParams = {}): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(`${c.entityName}Orbital`, buildEntity(c), [buildTrait(c)], [buildPage(c)]);
}
