/**
 * std-text-classifier
 *
 * Text classification molecule. Composes two traits on one page
 * sharing the event bus:
 * - Tokenizer: converts raw text into token IDs
 * - Forward: runs classification on token sequence
 *
 * Event flow: CLASSIFY -> TOKENIZE -> TOKENS_READY -> forward -> CLASSIFIED
 *
 * @level molecule
 * @family ml
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdTextClassifierParams {
  entityName: string;
  /** Entity field containing the source text to classify */
  sourceField: string;
  /** Classification model architecture */
  architecture: unknown;
  /** Class labels, e.g. ["positive", "negative", "neutral"] */
  classes: string[];
  /** Tokenization method. Default: "whitespace" */
  tokenizerMethod?: string;
  /** Max sequence length (truncation/padding). Default: 512 */
  maxLength?: number;
  pageName?: string;
  pagePath?: string;
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface TextClassifierConfig {
  entityName: string;
  fields: EntityField[];
  sourceField: string;
  architecture: unknown;
  classes: string[];
  tokenizerMethod: string;
  maxLength: number;
  tokenizerTraitName: string;
  classifyTraitName: string;
  pluralName: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdTextClassifierParams): TextClassifierConfig {
  const { entityName } = params;

  const baseFields: EntityField[] = [
    { name: 'id', type: 'string', default: '' },
    { name: params.sourceField, type: 'string', default: '' },
  ];

  const domainFields: EntityField[] = [
    { name: 'tokenCount', type: 'number', default: 0 },
    { name: 'predictedClass', type: 'string', default: '' },
    { name: 'confidence', type: 'number', default: 0 },
    { name: 'classifyStatus', type: 'string', default: 'idle' },
  ];
  const userFieldNames = new Set(baseFields.map(f => f.name));
  const fields = ensureIdField([...baseFields, ...domainFields.filter(f => !userFieldNames.has(f.name))]);

  const p = plural(entityName);

  return {
    entityName,
    fields,
    sourceField: params.sourceField,
    architecture: params.architecture,
    classes: params.classes,
    tokenizerMethod: params.tokenizerMethod ?? 'whitespace',
    maxLength: params.maxLength ?? 512,
    tokenizerTraitName: `${entityName}Tokenizer`,
    classifyTraitName: `${entityName}TextClassify`,
    pluralName: p,
    pageName: params.pageName ?? `${entityName}TextClassifyPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/text-classify`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Trait builders
// ============================================================================

function buildTokenizerTrait(c: TextClassifierConfig): Trait {
  const { entityName, sourceField, tokenizerMethod, maxLength, classes } = c;

  const idleView = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'type', size: 'lg' },
          { type: 'typography', content: `${entityName} Text Classifier`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'badge', label: '@entity.classifyStatus' },
      { type: 'typography', variant: 'body', color: 'muted', content: `Source: ${sourceField} | Method: ${tokenizerMethod} | Max: ${maxLength}` },
      { type: 'typography', variant: 'caption', content: `Classes: ${classes.join(', ')}` },
      { type: 'button', label: 'Classify Text', event: 'CLASSIFY', variant: 'primary', icon: 'play' },
    ],
  };

  const tokenizingView = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'typography', content: 'Tokenizing', variant: 'h3' },
      { type: 'spinner', size: 'md' },
      { type: 'typography', variant: 'body', color: 'muted', content: `Method: ${tokenizerMethod}` },
    ],
  };

  const tokenizeEffect: unknown[] = ['tokenize', 'primary', {
    method: tokenizerMethod,
    input: `@entity.${sourceField}`,
    maxLength,
    'on-complete': 'TOKENS_READY',
  }];

  return {
    name: c.tokenizerTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: ['TOKENS_READY'],
    stateMachine: {
      states: [
        { name: 'idle', isInitial: true },
        { name: 'tokenizing' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'CLASSIFY', name: 'Classify' },
        { key: 'TOKENS_READY', name: 'Tokens Ready' },
      ],
      transitions: [
        {
          from: 'idle', to: 'idle', event: 'INIT',
          effects: [
            ['set', '@entity.classifyStatus', 'idle'],
            ['render-ui', 'main', idleView],
          ],
        },
        {
          from: 'idle', to: 'tokenizing', event: 'CLASSIFY',
          effects: [
            ['set', '@entity.classifyStatus', 'tokenizing'],
            tokenizeEffect,
            ['render-ui', 'main', tokenizingView],
          ],
        },
        {
          from: 'tokenizing', to: 'idle', event: 'TOKENS_READY',
          effects: [
            ['set', '@entity.tokenCount', '@payload.tokenCount'],
            ['set', '@entity.classifyStatus', 'tokenized'],
            ['emit', 'TOKENS_READY'],
            ['render-ui', 'main', idleView],
          ],
        },
      ],
    },
  } as Trait;
}

function buildTextClassifyTrait(c: TextClassifierConfig): Trait {
  const { entityName, classes } = c;

  const waitingView = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'icon', name: 'brain', size: 'lg' },
      { type: 'typography', content: 'Text Classification', variant: 'h3' },
      { type: 'badge', label: 'Waiting for tokens', variant: 'neutral' },
    ],
  };

  const classifyingView = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'typography', content: 'Classifying Text', variant: 'h3' },
      { type: 'spinner', size: 'md' },
      { type: 'typography', variant: 'body', color: 'muted', content: 'Tokens: @entity.tokenCount' },
    ],
  };

  const resultView = {
    type: 'stack', direction: 'vertical', gap: 'md', align: 'center',
    children: [
      { type: 'icon', name: 'check-circle', size: 'lg' },
      { type: 'typography', content: 'Classification Result', variant: 'h3' },
      { type: 'badge', label: '@entity.predictedClass', variant: 'success' },
      { type: 'typography', variant: 'caption', content: 'Confidence' },
      { type: 'progress-bar', value: '@entity.confidence', max: 1 },
      { type: 'button', label: 'Classify Again', event: 'CLASSIFY', variant: 'outline', icon: 'refresh-cw' },
    ],
  };

  const forwardEffect: unknown[] = ['forward', 'primary', {
    architecture: c.architecture,
    input: '@payload.tokens',
    'output-contract': { type: 'tensor', shape: [classes.length], dtype: 'float32', labels: classes, activation: 'softmax' },
    'on-complete': 'CLASSIFIED',
  }];

  return {
    name: c.classifyTraitName,
    linkedEntity: entityName,
    category: 'interaction',
    emits: ['CLASSIFIED'],
    stateMachine: {
      states: [
        { name: 'waiting', isInitial: true },
        { name: 'classifying' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: 'TOKENS_READY', name: 'Tokens Ready' },
        { key: 'CLASSIFIED', name: 'Classified' },
      ],
      transitions: [
        {
          from: 'waiting', to: 'waiting', event: 'INIT',
          effects: [
            ['render-ui', 'main', waitingView],
          ],
        },
        {
          from: 'waiting', to: 'classifying', event: 'TOKENS_READY',
          effects: [
            forwardEffect,
            ['render-ui', 'main', classifyingView],
          ],
        },
        {
          from: 'classifying', to: 'waiting', event: 'CLASSIFIED',
          effects: [
            ['set', '@entity.predictedClass', ['tensor/argmax-label', '@payload.output', classes]],
            ['set', '@entity.confidence', ['tensor/max', '@payload.output']],
            ['set', '@entity.classifyStatus', 'classified'],
            ['emit', 'CLASSIFIED'],
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

export function stdTextClassifierEntity(params: StdTextClassifierParams): Entity {
  const c = resolve(params);
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: 'runtime' });
}

export function stdTextClassifierTrait(params: StdTextClassifierParams): Trait {
  return buildTokenizerTrait(resolve(params));
}

export function stdTextClassifierPage(params: StdTextClassifierParams): Page {
  const c = resolve(params);
  return {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: c.tokenizerTraitName },
      { ref: c.classifyTraitName },
    ],
  } as Page;
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdTextClassifier(params: StdTextClassifierParams): OrbitalDefinition {
  const c = resolve(params);

  const entity = makeEntity({ name: c.entityName, fields: c.fields, persistence: 'runtime' });

  const tokenizerTrait = buildTokenizerTrait(c);
  const classifyTrait = buildTextClassifyTrait(c);

  const page: Page = {
    name: c.pageName, path: c.pagePath,
    ...(c.isInitial ? { isInitial: true } : {}),
    traits: [
      { ref: tokenizerTrait.name },
      { ref: classifyTrait.name },
    ],
  } as Page;

  return {
    name: `${c.entityName}Orbital`,
    entity,
    traits: [tokenizerTrait, classifyTrait],
    pages: [page],
  } as OrbitalDefinition;
}
