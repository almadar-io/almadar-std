/**
 * std-tokenizer
 *
 * Text preprocessing atom for tokenization.
 * Converts raw text into token sequences using configurable methods
 * (BPE, WordPiece, SentencePiece, whitespace, character-level).
 * Feeds downstream embedding or sequence model atoms.
 *
 * @level atom
 * @family ml
 * @packageDocumentation
 */

import type { OrbitalDefinition, Entity, Page, Trait, EntityField } from '@almadar/core/types';
import { makeEntity, makePage, makeOrbital, ensureIdField, plural } from '@almadar/core/builders';

// ============================================================================
// Params
// ============================================================================

export interface StdTokenizerParams {
  /** Entity name in PascalCase (e.g., "TokenizedText", "InputTokens") */
  entityName: string;
  /** Entity fields (id is auto-added) */
  fields: EntityField[];
  /** Source field name containing raw text to tokenize */
  sourceField: string;
  /** Tokenization method */
  method: 'bpe' | 'wordpiece' | 'sentencepiece' | 'whitespace' | 'character';
  /** Vocabulary size (default: 30000) */
  vocabSize?: number;
  /** Maximum sequence length (default: 512) */
  maxLength?: number;
  /** Event that triggers tokenization (default: "TOKENIZE") */
  tokenizeEvent?: string;
  /** Event emitted when tokens are ready (default: "TOKENS_READY") */
  tokensReadyEvent?: string;
  /** Persistence mode */
  persistence?: 'runtime';
  /** Page name (defaults to "{Entity}TokenizerPage") */
  pageName?: string;
  /** Route path (defaults to "/{entities}/tokenizer") */
  pagePath?: string;
  /** Whether this is the initial/home page */
  isInitial?: boolean;
}

// ============================================================================
// Resolve
// ============================================================================

interface TokenizerConfig {
  entityName: string;
  fields: EntityField[];
  persistence: 'runtime';
  traitName: string;
  pluralName: string;
  sourceField: string;
  method: 'bpe' | 'wordpiece' | 'sentencepiece' | 'whitespace' | 'character';
  vocabSize: number;
  maxLength: number;
  tokenizeEvent: string;
  tokensReadyEvent: string;
  pageName: string;
  pagePath: string;
  isInitial: boolean;
}

function resolve(params: StdTokenizerParams): TokenizerConfig {
  const { entityName } = params;
  const baseFields = ensureIdField(params.fields);

  // Ensure tokenizer-specific fields exist on entity
  const tokenizerFields: EntityField[] = [
    ...(baseFields.some(f => f.name === 'tokens') ? [] : [{ name: 'tokens', type: 'array' as const, default: [] }]),
    ...(baseFields.some(f => f.name === 'tokenCount') ? [] : [{ name: 'tokenCount', type: 'number' as const, default: 0 }]),
  ];

  const fields = [...baseFields, ...tokenizerFields];
  const p = plural(entityName);

  return {
    entityName,
    fields,
    persistence: params.persistence ?? 'runtime',
    traitName: `${entityName}Tokenizer`,
    pluralName: p,
    sourceField: params.sourceField,
    method: params.method,
    vocabSize: params.vocabSize ?? 30000,
    maxLength: params.maxLength ?? 512,
    tokenizeEvent: params.tokenizeEvent ?? 'TOKENIZE',
    tokensReadyEvent: params.tokensReadyEvent ?? 'TOKENS_READY',
    pageName: params.pageName ?? `${entityName}TokenizerPage`,
    pagePath: params.pagePath ?? `/${p.toLowerCase()}/tokenizer`,
    isInitial: params.isInitial ?? false,
  };
}

// ============================================================================
// Projections (internal)
// ============================================================================

function buildEntity(c: TokenizerConfig): Entity {
  return makeEntity({ name: c.entityName, fields: c.fields, persistence: c.persistence });
}

function buildTrait(c: TokenizerConfig): Trait {
  const { entityName, tokenizeEvent, tokensReadyEvent, method, vocabSize, maxLength } = c;

  // Ready view: tokenizer config with action
  const readyUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'type', size: 'lg' },
          { type: 'typography', content: `${entityName} Tokenizer`, variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'typography', variant: 'body', color: 'muted',
        content: `Method: ${method}. Vocab: ${vocabSize}. Max length: ${maxLength}.` },
      { type: 'button', label: 'Tokenize', event: tokenizeEvent, variant: 'primary', icon: 'play' },
    ],
  };

  // Tokenizing view: progress indicator
  const tokenizingUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      { type: 'loading-state', title: 'Tokenizing', message: `Processing text with ${method} tokenizer...` },
      { type: 'spinner', size: 'lg' },
      { type: 'progress-bar', value: 50, showPercentage: true },
    ],
  };

  // Complete view: token stats
  const completeUI = {
    type: 'stack', direction: 'vertical', gap: 'lg', align: 'center',
    children: [
      {
        type: 'stack', direction: 'horizontal', gap: 'sm', align: 'center',
        children: [
          { type: 'icon', name: 'check-circle', size: 'lg' },
          { type: 'typography', content: 'Tokenization Complete', variant: 'h2' },
        ],
      },
      { type: 'divider' },
      { type: 'alert', variant: 'success', message: 'Text tokenized successfully.' },
      { type: 'typography', variant: 'body', color: 'muted',
        content: `Token count: @entity.tokenCount. Method: ${method}.` },
      { type: 'button', label: 'Tokenize Again', event: tokenizeEvent, variant: 'ghost', icon: 'rotate-ccw' },
    ],
  };

  return {
    name: c.traitName,
    linkedEntity: entityName,
    category: 'interaction',
    stateMachine: {
      states: [
        { name: 'ready', isInitial: true },
        { name: 'tokenizing' },
      ],
      events: [
        { key: 'INIT', name: 'Initialize' },
        { key: tokenizeEvent, name: 'Tokenize', payload: [{ name: 'text', type: 'string', required: true }] },
        {
          key: tokensReadyEvent, name: 'Tokens Ready',
          payload: [
            { name: 'tokens', type: 'array', required: true },
            { name: 'tokenCount', type: 'number', required: true },
          ],
        },
      ],
      transitions: [
        // INIT: ready -> ready, render config summary
        {
          from: 'ready', to: 'ready', event: 'INIT',
          effects: [['render-ui', 'main', readyUI]],
        },
        // Tokenize: ready -> tokenizing
        {
          from: 'ready', to: 'tokenizing', event: tokenizeEvent,
          effects: [
            ['render-ui', 'main', tokenizingUI],
            ['data/tokenize', '@payload.text', {
              method,
              'vocab-size': vocabSize,
              'max-length': maxLength,
            }],
          ],
        },
        // Tokens ready: tokenizing -> ready
        {
          from: 'tokenizing', to: 'ready', event: tokensReadyEvent,
          effects: [
            ['set', '@entity.tokens', '@payload.tokens'],
            ['set', '@entity.tokenCount', '@payload.tokenCount'],
            ['render-ui', 'main', completeUI],
          ],
        },
      ],
    },
  } as Trait;
}

function buildPage(c: TokenizerConfig): Page {
  return makePage({ name: c.pageName, path: c.pagePath, traitName: c.traitName, isInitial: c.isInitial });
}

// ============================================================================
// Projections (public API)
// ============================================================================

export function stdTokenizerEntity(params: StdTokenizerParams): Entity {
  return buildEntity(resolve(params));
}

export function stdTokenizerTrait(params: StdTokenizerParams): Trait {
  return buildTrait(resolve(params));
}

export function stdTokenizerPage(params: StdTokenizerParams): Page {
  return buildPage(resolve(params));
}

// ============================================================================
// Composed Orbital
// ============================================================================

export function stdTokenizer(params: StdTokenizerParams): OrbitalDefinition {
  const c = resolve(params);
  return makeOrbital(
    `${c.entityName}Orbital`,
    buildEntity(c),
    [buildTrait(c)],
    [buildPage(c)],
  );
}
